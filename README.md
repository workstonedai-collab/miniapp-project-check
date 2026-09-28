# miniapp-project-check

A small, dependency-free checker for **native WeChat Mini Program** projects. It checks common project mistakes without starting the app, calling an API, or executing project code.

从实际小程序开发中抽出的独立检查工具。它只读取项目文件，不运行页面代码，不连接网络，也不需要微信账号或任何密钥。

## Checks / 检查内容

- `app.json` and other JSON files parse correctly.
- JavaScript files pass `node --check` syntax validation.
- Every route in `app.json.pages` has a `.js` and `.wxml` file. `--strict-pages` also requires `.json` and `.wxss`.
- Literal event handler names in WXML appear in the page's JavaScript file. This is a conservative text check, so dynamic handlers are not evaluated.
- Literal `/assets/...` references in project source files exist.
- A `project.config.json` with `miniprogramRoot` is supported.

Generated directories such as `.git`, `node_modules`, `miniprogram_npm`, `dist`, and `coverage` are skipped. Symlinks are skipped. Text checks can flag a path in a comment and cannot resolve dynamic expressions. The checker does **not** verify that an app can compile in WeChat Developer Tools or that an API is working.

## Quick start / 快速使用

Requires Node.js 18 or newer. No package installation is needed to run the source checkout:

```sh
node bin/miniapp-check.mjs examples/hello-miniapp
node bin/miniapp-check.mjs /path/to/your/miniapp --strict-pages
node bin/miniapp-check.mjs /path/to/your/miniapp --json
```

After installing the package locally or from a Git repository, the same command is available as `miniapp-check`:

```sh
miniapp-check /path/to/your/miniapp
```

Exit code `0` means all enabled checks passed, `1` means project issues were found, and `2` means the command arguments are invalid. JSON output includes issue codes and file paths for CI integration. It does not include source lines or file contents.

## Development / 开发

```sh
npm test
npm run check:example
```

This repository contains only generic tool code and a fictional example. It does not contain the original product's pages, assets, endpoints, credentials, data, or Git history.

## License

MIT. See [LICENSE](LICENSE).
