#!/usr/bin/env node
import { resolve } from "node:path";
import { checkProject } from "../lib/check.mjs";

const usage = `Usage: miniapp-check [project-directory] [--strict-pages] [--json]\n\nChecks native WeChat Mini Program projects without running their code.\n`;
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(usage);
  process.exit(0);
}
const unknown = args.filter((arg) => arg.startsWith("-") && !["--strict-pages", "--json"].includes(arg));
const paths = args.filter((arg) => !arg.startsWith("-"));
if (unknown.length || paths.length > 1) {
  process.stderr.write(usage);
  process.exit(2);
}

const result = checkProject(resolve(paths[0] || "."), { strictPages: args.includes("--strict-pages") });
if (args.includes("--json")) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (result.ok) {
  process.stdout.write(`Passed: ${result.pages} pages, ${result.files} scanned files.\n`);
} else {
  process.stderr.write(`Failed: ${result.issues.length} issue(s).\n`);
  for (const issue of result.issues) {
    process.stderr.write(`- ${issue.file}: [${issue.code}] ${issue.message}\n`);
  }
}
process.exit(result.ok ? 0 : 1);
