# 微信小程序工程自检工具 | WeChat Mini Program Project Checker

**在打开微信开发者工具前，先找出缺失的页面、写错的引用和基础语法问题。** 这是一个面向原生微信小程序的零依赖、只读检查器。

**Catch missing pages, broken references, and basic syntax errors before opening WeChat Developer Tools.** This dependency-free checker reads native WeChat Mini Program projects without running their code.

📖 [完整中文说明 / 中文版 README](README.zh-CN.md) · [Full English guide / English README](README.en.md)

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
