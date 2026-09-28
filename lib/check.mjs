import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";

const DEFAULT_IGNORES = new Set([
  ".git", "node_modules", "miniprogram_npm", "dist", "coverage", ".cache"
]);
const SCANNED_EXTENSIONS = new Set([".js", ".mjs", ".json", ".wxml", ".wxss"]);
const ASSET_PATTERN = /(?:["']|\burl\s*\(\s*)(\/assets\/[^"'\s)}?]+)/g;
const BINDING_PATTERN = /\b(?:capture-)?(?:bind|catch):?[a-zA-Z][\w-]*\s*=\s*["']([^"']+)["']/g;

function isInside(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function listFiles(directory, ignored, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) listFiles(path, ignored, files);
    else if (entry.isFile() && SCANNED_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files.sort();
}

function readJson(path, issues, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    issues.push({ code: "INVALID_JSON", file: label, message: "Invalid JSON" });
    return null;
  }
}

function resolveAppRoot(projectRoot, issues) {
  if (existsSync(join(projectRoot, "app.json"))) return projectRoot;
  const configPath = join(projectRoot, "project.config.json");
  if (!existsSync(configPath)) {
    issues.push({ code: "APP_NOT_FOUND", file: "app.json", message: "No app.json found" });
    return null;
  }
  const config = readJson(configPath, issues, "project.config.json");
  if (!config) return null;
  if (typeof config.miniprogramRoot !== "string" || !config.miniprogramRoot.trim()) {
    issues.push({ code: "APP_NOT_FOUND", file: "app.json", message: "No app.json or miniprogramRoot found" });
    return null;
  }
  const appRoot = resolve(projectRoot, config.miniprogramRoot);
  if (!isInside(projectRoot, appRoot) || (existsSync(appRoot) &&
      !isInside(realpathSync(projectRoot), realpathSync(appRoot)))) {
    issues.push({ code: "INVALID_APP_ROOT", file: "project.config.json", message: "miniprogramRoot must stay inside the project" });
    return null;
  }
  if (!existsSync(join(appRoot, "app.json"))) {
    issues.push({ code: "APP_NOT_FOUND", file: "app.json", message: "No app.json found in miniprogramRoot" });
    return null;
  }
  return appRoot;
}

function checkBindings(wxml, js, page, issues) {
  for (const [, handler] of wxml.matchAll(BINDING_PATTERN)) {
    if (!/^[A-Za-z_$][\w$]*$/.test(handler)) continue;
    // A reference is only a conservative signal. This avoids executing project code.
    if (!new RegExp(`\\b${handler}\\b`).test(js)) {
      issues.push({
        code: "HANDLER_NOT_FOUND",
        file: `${page}.wxml`,
        message: `Event handler ${handler} is not referenced in ${page}.js`
      });
    }
  }
}

function checkAssets(content, file, appRoot, issues) {
  for (const [, asset] of content.matchAll(ASSET_PATTERN)) {
    const target = resolve(appRoot, asset.slice(1));
    if (!isInside(appRoot, target) || !existsSync(target)) {
      issues.push({ code: "ASSET_NOT_FOUND", file, message: `Missing local asset ${asset}` });
    }
  }
}

export function checkProject(inputRoot, { strictPages = false, ignore = [] } = {}) {
  const projectRoot = resolve(inputRoot);
  const issues = [];
  if (!existsSync(projectRoot)) {
    return { ok: false, projectRoot, appRoot: null, pages: 0, files: 0, issues: [
      { code: "PROJECT_NOT_FOUND", file: ".", message: "Project directory does not exist" }
    ] };
  }
  const appRoot = resolveAppRoot(projectRoot, issues);
  if (!appRoot) return { ok: false, projectRoot, appRoot: null, pages: 0, files: 0, issues };

  const ignored = new Set([...DEFAULT_IGNORES, ...ignore]);
  let files;
  try {
    files = listFiles(appRoot, ignored);
  } catch {
    issues.push({ code: "READ_FAILED", file: ".", message: "Could not read project files" });
    return { ok: false, projectRoot, appRoot, pages: 0, files: 0, issues };
  }

  const contents = new Map();
  let app = null;
  for (const file of files) {
    const label = relative(appRoot, file).split(sep).join("/");
    const extension = extname(file);
    let content;
    try {
      content = readFileSync(file, "utf8");
      contents.set(file, content);
    } catch {
      issues.push({ code: "READ_FAILED", file: label, message: "Could not read file" });
      continue;
    }
    if (extension === ".json") {
      const parsed = readJson(file, issues, label);
      if (file === join(appRoot, "app.json")) app = parsed;
    }
    if (extension === ".js" || extension === ".mjs") {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024
      });
      if (result.error || result.status !== 0) {
        issues.push({ code: "INVALID_JS", file: label, message: "JavaScript syntax check failed" });
      }
    }
    checkAssets(content, label, appRoot, issues);
  }

  let pageCount = 0;
  if (app) {
    if (!Array.isArray(app.pages) || app.pages.length === 0) {
      issues.push({ code: "INVALID_PAGES", file: "app.json", message: "pages must be a nonempty array" });
    } else {
      pageCount = app.pages.length;
      for (const page of app.pages) {
        if (typeof page !== "string" || !page || page.startsWith("/") || page.split("/").includes("..")) {
          issues.push({ code: "INVALID_PAGE_PATH", file: "app.json", message: "Page paths must be relative" });
          continue;
        }
        const base = resolve(appRoot, page);
        if (!isInside(appRoot, base)) {
          issues.push({ code: "INVALID_PAGE_PATH", file: "app.json", message: "Page path escapes project" });
          continue;
        }
        for (const extension of strictPages ? [".js", ".json", ".wxml", ".wxss"] : [".js", ".wxml"]) {
          if (!existsSync(`${base}${extension}`)) {
            issues.push({ code: "PAGE_FILE_MISSING", file: `${page}${extension}`, message: "Page file is missing" });
          }
        }
        const wxml = contents.get(`${base}.wxml`);
        const js = contents.get(`${base}.js`);
        if (wxml !== undefined && js !== undefined) checkBindings(wxml, js, page, issues);
      }
    }
  }

  return { ok: issues.length === 0, projectRoot, appRoot, pages: pageCount, files: files.length, issues };
}
