import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkProject } from "../lib/check.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(repo, "examples/hello-miniapp");

function fixture(callback) {
  const root = mkdtempSync(join(tmpdir(), "miniapp-check-"));
  mkdirSync(join(root, "pages/index"), { recursive: true });
  writeFileSync(join(root, "app.json"), JSON.stringify({ pages: ["pages/index/index"] }));
  writeFileSync(join(root, "pages/index/index.js"), "Page({ onTap() {} });\n");
  writeFileSync(join(root, "pages/index/index.wxml"), '<button bindtap="onTap">Go</button>\n');
  try { callback(root); } finally { rmSync(root, { recursive: true, force: true }); }
}

test("the fictional example passes in normal and strict mode", () => {
  assert.equal(checkProject(example).ok, true);
  assert.equal(checkProject(example, { strictPages: true }).ok, true);
});

test("reports invalid JSON without disclosing its contents", () => fixture((root) => {
  const secret = "a-private-value-that-must-not-appear-in-output";
  writeFileSync(join(root, "pages/index/index.json"), `{ "value": "${secret}", invalid }`);
  const result = checkProject(root);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "INVALID_JSON"));
  assert.equal(JSON.stringify(result).includes(secret), false);
}));

test("reports missing page files, bindings, and assets", () => fixture((root) => {
  writeFileSync(join(root, "pages/index/index.wxml"), '<button bindtap="missing" src="/assets/no.png">Go</button>');
  const result = checkProject(root, { strictPages: true });
  assert.deepEqual(new Set(result.issues.map((issue) => issue.code)),
    new Set(["PAGE_FILE_MISSING", "HANDLER_NOT_FOUND", "ASSET_NOT_FOUND"]));
}));

test("checks syntax without executing project JavaScript", () => fixture((root) => {
  const marker = join(root, "executed.txt");
  writeFileSync(join(root, "pages/index/index.js"),
    `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'bad'); Page({ onTap() {} });\n`);
  assert.equal(checkProject(root).ok, true);
  assert.equal(existsSync(marker), false);
  writeFileSync(join(root, "pages/index/index.js"), "Page({ onTap( { });\n");
  assert.ok(checkProject(root).issues.some((issue) => issue.code === "INVALID_JS"));
}));

test("supports a nested miniprogramRoot and rejects paths outside the project", () => fixture((root) => {
  const nested = join(root, "miniprogram");
  mkdirSync(join(nested, "pages/index"), { recursive: true });
  for (const file of ["app.json", "pages/index/index.js", "pages/index/index.wxml"]) {
    writeFileSync(join(nested, file), readFileSync(join(root, file)));
  }
  rmSync(join(root, "app.json"));
  writeFileSync(join(root, "project.config.json"), JSON.stringify({ miniprogramRoot: "miniprogram" }));
  assert.equal(checkProject(root).ok, true);
  writeFileSync(join(root, "project.config.json"), JSON.stringify({ miniprogramRoot: "../outside" }));
  assert.ok(checkProject(root).issues.some((issue) => issue.code === "INVALID_APP_ROOT"));
}));

test("does not follow a linked miniprogramRoot outside the project", () => fixture((root) => {
  const outside = mkdtempSync(join(tmpdir(), "miniapp-outside-"));
  try {
    symlinkSync(outside, join(root, "linked"));
    rmSync(join(root, "app.json"));
    writeFileSync(join(root, "project.config.json"), JSON.stringify({ miniprogramRoot: "linked" }));
    assert.ok(checkProject(root).issues.some((issue) => issue.code === "INVALID_APP_ROOT"));
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
}));

test("checks literal assets in app.json", () => fixture((root) => {
  writeFileSync(join(root, "app.json"), JSON.stringify({
    pages: ["pages/index/index"], tabBar: { list: [{ iconPath: "/assets/missing.png" }] }
  }));
  assert.ok(checkProject(root).issues.some((issue) => issue.code === "ASSET_NOT_FOUND"));
}));

test("the CLI returns stable JSON and an error exit code", () => fixture((root) => {
  writeFileSync(join(root, "pages/index/index.wxml"), '<button bindtap="unknown">Go</button>');
  const run = spawnSync(process.execPath, [join(repo, "bin/miniapp-check.mjs"), root, "--json"], {
    encoding: "utf8"
  });
  assert.equal(run.status, 1);
  const result = JSON.parse(run.stdout);
  assert.ok(result.issues.some((issue) => issue.code === "HANDLER_NOT_FOUND"));
}));
