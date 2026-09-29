# 微信小程序工程自检工具 | WeChat Mini Program Project Checker

**页面已经写进 `app.json`，却少了页面文件；WXML 改了事件名，JavaScript 仍是旧名字。** 这类工程问题会拖慢联调，却适合在提交代码前发现。这个工具对原生微信小程序做一次本地、只读的工程预检，把问题按文件路径和错误类型列出来，方便开发者及时修正。

**A page is listed in `app.json` but its files are missing; a WXML event name no longer matches its JavaScript handler.** These are small mistakes that slow down debugging. This local, read-only preflight for native WeChat Mini Programs points to the file and issue type so you can fix them before handing the project to a teammate or CI.

📖 [完整中文说明 / 中文版 README](README.zh-CN.md) · [Full English guide / English README](README.en.md)

## 能帮你做什么 / What you get

| 中文 | English |
| --- | --- |
| **及早发现工程断点：**检查页面清单、页面文件、JSON 与 JavaScript 语法、WXML 中写死的事件名，以及本地 `/assets/...` 引用。 | **Catch structural breaks early:** check page routes and files, JSON and JavaScript syntax, literal WXML event handlers, and local `/assets/...` references. |
| **得到可处理的结果：**终端输出问题路径和类型；`--json` 便于脚本或 CI 读取，`--strict-pages` 可要求四类页面文件齐全。 | **Get actionable output:** read file paths and issue codes in the terminal, use `--json` in scripts or CI, and require all four page files with `--strict-pages`. |
| **把项目留在本机：**基于 Node.js 内置能力运行，不安装运行依赖，不执行被检查页面的代码，也不上传项目文件。 | **Keep the project local:** run with built-in Node.js features, no runtime dependencies, no execution of inspected page code, and no file upload. |

适合原生小程序的日常自检、代码审查前检查和 CI 预检。它提供的是静态线索，最终仍需在微信开发者工具和设备上验证。 / Use it for daily checks, review preparation, or a CI preflight. It provides static clues; compilation and device behavior still need separate verification.

## 30 秒试用 / Try it in 30 seconds

需要 Node.js 18 或更新版本。克隆仓库后直接运行，无须安装依赖。Requires Node.js 18 or newer; no dependency installation is needed after cloning.

```sh
git clone https://github.com/workstonedai-collab/miniapp-project-check.git
cd miniapp-project-check
node bin/miniapp-check.mjs examples/hello-miniapp
```

```text
Passed: 1 pages, 5 scanned files.
```

检查自己的小程序 / Check your own project:

```sh
node bin/miniapp-check.mjs /path/to/your/miniapp
node bin/miniapp-check.mjs /path/to/your/miniapp --strict-pages --json
```

| 检查项 | What it checks |
| --- | --- |
| 页面路径与文件 | Routes in `app.json.pages` and their page files |
| JSON 与 JavaScript 语法 | JSON parsing and JavaScript syntax |
| WXML 事件绑定 | Literal WXML event handler references |
| 本地素材路径 | Literal `/assets/...` references |
| 嵌套的小程序目录 | `miniprogramRoot` in `project.config.json` |

检查器不执行页面代码、不调用接口、不发送项目文件到网络。它是工程预检，不能代替微信开发者工具编译或真机测试。

The checker does not execute page code, call APIs, or send project files over the network. It is a preflight check, not a replacement for compilation in WeChat Developer Tools or device testing.

**下一步 / Next:** [中文使用说明](README.zh-CN.md) · [English usage guide](README.en.md) · [MIT License](LICENSE)
