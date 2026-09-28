# WeChat Mini Program Project Checker

[简体中文](README.zh-CN.md) · [Repository home](README.md)

Added a page to `app.json` but forgot one of its files? Renamed a WXML event handler without updating the JavaScript? Referenced an icon that is missing from the project? These small mistakes often surface only when you compile or open a page. **miniapp-project-check** gives native WeChat Mini Program projects a quick structural preflight check before you open WeChat Developer Tools.

It uses only built-in Node.js capabilities. There are no runtime dependencies, and it reads files without executing page code or making network requests.

## Try it in 30 seconds

Requires Node.js 18 or newer. After cloning this repository, run from its root:

```sh
git clone https://github.com/workstonedai-collab/miniapp-project-check.git
cd miniapp-project-check
node bin/miniapp-check.mjs examples/hello-miniapp
```

Expected output:

```text
Passed: 1 pages, 5 scanned files.
```

To check your project, pass the directory containing `app.json` or `project.config.json`:

```sh
node bin/miniapp-check.mjs /path/to/your/miniapp
```

To require all four conventional page files—`.js`, `.json`, `.wxml`, and `.wxss`—use strict mode:

```sh
node bin/miniapp-check.mjs /path/to/your/miniapp --strict-pages
```

### Use it from another project

The tool is available on GitHub and is **not published to the npm registry**. Run it from a clone, or install the GitHub repository as a development dependency:

```sh
npm install --save-dev github:workstonedai-collab/miniapp-project-check
npx miniapp-check .
```

## What it checks

| Check | Example issue | Result code |
| --- | --- | --- |
| JSON | `app.json` or another JSON file cannot be parsed | `INVALID_JSON` |
| JavaScript | A `.js` or `.mjs` file fails `node --check` | `INVALID_JS` |
| Page manifest | Empty `app.json.pages`, an invalid route, or a missing page file | `INVALID_PAGES`, `INVALID_PAGE_PATH`, `PAGE_FILE_MISSING` |
| Event bindings | A literal WXML event handler name does not appear in the page's `.js` file | `HANDLER_NOT_FOUND` |
| Assets | A literal `/assets/...` path has no matching file | `ASSET_NOT_FOUND` |
| Project entry | No `app.json`, or `miniprogramRoot` escapes the project | `APP_NOT_FOUND`, `INVALID_APP_ROOT` |

By default, each page needs a `.js` and `.wxml` file. `--strict-pages` also requires `.json` and `.wxss`. A project with source files in a subdirectory is supported through `miniprogramRoot` in `project.config.json`.

A misspelled event handler produces a message with a file path and issue code:

```text
Failed: 1 issue(s).
- pages/index/index.wxml: [HANDLER_NOT_FOUND] Event handler onTap is not referenced in pages/index/index.js
```

The message points to a place worth checking. Handler matching is a conservative text check; dynamic bindings, runtime composition, and generated code need a human review in their actual project context.

## Commands and automation

```sh
node bin/miniapp-check.mjs [project-directory] [--strict-pages] [--json]
node bin/miniapp-check.mjs --help
```

| Option | Purpose |
| --- | --- |
| No project directory | Check the current directory |
| `--strict-pages` | Require all four page file types |
| `--json` | Emit structured results for scripts and CI |
| `--help` | Print command usage |

Exit code `0` means every enabled check passed, `1` means project issues were found, and `2` means the command arguments are invalid. JSON output includes `ok`, the project and app roots, page and scanned-file counts, and an `issues` array. It contains no source lines or file contents. If you retain JSON in public CI logs, remember that it includes **absolute directory paths** from the runner.

Once your project can invoke `miniapp-check`, add a CI step such as:

```yaml
- name: Check Mini Program
  run: npx miniapp-check . --strict-pages
```

## Scope and privacy

- Designed for the native Mini Program source structure. It does not understand source conventions in frameworks such as Taro or uni-app; point it at their generated native Mini Program directory if appropriate.
- Scans `.js`, `.mjs`, `.json`, `.wxml`, and `.wxss`. It does not currently check TypeScript, WXS, or every possible asset path form.
- Skips `.git`, `node_modules`, `miniprogram_npm`, `dist`, `coverage`, `.cache`, and symlinks.
- Text checks can flag `/assets/...` in comments and cannot evaluate dynamic expressions.
- **A passing result does not prove that WeChat Developer Tools can compile the app or that its UI, APIs, or device behavior work.**

The checker does not execute the target project's page code, call external APIs, or transmit files. Results contain issue types, messages, and paths. This repository contains a fictional example only—none of the original product's pages, assets, data, credentials, or Git history.

## Development and extension

```sh
npm test
npm run check:example
```

For a custom script, import `checkProject` directly:

```js
import { checkProject } from "./lib/check.mjs";

const result = checkProject("/path/to/your/miniapp", {
  strictPages: true,
  ignore: ["vendor"]
});
console.log(result.ok, result.issues);
```

`ignore` accepts **directory names** to skip; it is not currently a CLI flag. Improvements to file type coverage, static analysis accuracy, and actionable error messages are welcome.

## License

MIT. See [LICENSE](LICENSE).
