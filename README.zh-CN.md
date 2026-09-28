# 微信小程序工程自检工具

[English README](README.en.md) · [仓库首页](README.md)

页面加进了 `app.json`，却漏了文件？WXML 里改了事件名，JavaScript 没跟着改？图标路径在代码里存在，实际素材却不在项目中？这些小问题通常要到编译或点进页面时才暴露。**miniapp-project-check** 让你在打开微信开发者工具之前，先用一条命令做基础工程预检。

它面向**原生微信小程序**，使用 Node.js 自带能力，无须安装运行依赖。检查器只读文件，不运行页面代码，也不请求网络。

## 30 秒上手

需要 Node.js 18 或更新版本。克隆仓库后，在仓库目录运行：

```sh
git clone https://github.com/workstonedai-collab/miniapp-project-check.git
cd miniapp-project-check
node bin/miniapp-check.mjs examples/hello-miniapp
```

预期输出：

```text
Passed: 1 pages, 5 scanned files.
```

检查自己的项目时，把路径换成**包含 `app.json` 或 `project.config.json` 的目录**：

```sh
node bin/miniapp-check.mjs /path/to/your/miniapp
```

如果希望每个页面的 `.js`、`.json`、`.wxml`、`.wxss` 四类文件都齐全：

```sh
node bin/miniapp-check.mjs /path/to/your/miniapp --strict-pages
```

### 在其他项目中使用

这个工具已放在 GitHub，**尚未发布到 npm 注册表**。可以克隆后直接运行，也可以将 GitHub 仓库作为开发依赖安装，再调用其命令：

```sh
npm install --save-dev github:workstonedai-collab/miniapp-project-check
npx miniapp-check .
```

## 它检查什么

| 检查 | 发现的问题 | 对应结果 |
| --- | --- | --- |
| JSON | `app.json` 及其他 JSON 文件无法解析 | `INVALID_JSON` |
| JavaScript | `.js`、`.mjs` 文件无法通过 `node --check` | `INVALID_JS` |
| 页面清单 | `app.json.pages` 为空、路径无效或页面文件缺失 | `INVALID_PAGES`、`INVALID_PAGE_PATH`、`PAGE_FILE_MISSING` |
| 事件绑定 | WXML 中写死的事件处理函数名未出现在对应页面的 `.js` 文件中 | `HANDLER_NOT_FOUND` |
| 素材引用 | 源码中写死的 `/assets/...` 路径找不到文件 | `ASSET_NOT_FOUND` |
| 项目入口 | 找不到 `app.json`，或 `miniprogramRoot` 指向项目外 | `APP_NOT_FOUND`、`INVALID_APP_ROOT` |

默认要求页面有 `.js` 和 `.wxml`；加上 `--strict-pages` 后还要求 `.json` 和 `.wxss`。工具会读取 `project.config.json` 中的 `miniprogramRoot`，因此也能检查小程序源码放在子目录的工程。

例如，事件名写错时会收到带文件路径和错误类型的提示：

```text
Failed: 1 issue(s).
- pages/index/index.wxml: [HANDLER_NOT_FOUND] Event handler onTap is not referenced in pages/index/index.js
```

提示只说明**值得检查的位置**。事件名检查是保守的文本匹配；动态绑定、运行时组合和框架生成的代码，需要你在实际项目中再判断。

## 命令与自动化

```sh
node bin/miniapp-check.mjs [项目目录] [--strict-pages] [--json]
node bin/miniapp-check.mjs --help
```

| 参数 | 用途 |
| --- | --- |
| 不传项目目录 | 检查当前目录 |
| `--strict-pages` | 要求每个页面的四类文件齐全 |
| `--json` | 输出适合脚本或 CI 读取的结构化结果 |
| `--help` | 显示命令帮助 |

退出码：`0` 为启用的检查全部通过，`1` 为发现工程问题，`2` 为命令参数有误。JSON 结果包含 `ok`、项目和小程序目录、页面数、扫描文件数及 `issues` 数组；不会输出源码行或文件内容。若在公开的 CI 日志中保存 JSON，请注意其中会有运行环境的**绝对目录路径**。

在自己的 CI 中，先让项目能够运行 `miniapp-check`，再增加一步检查，例如：

```yaml
- name: Check Mini Program
  run: npx miniapp-check . --strict-pages
```

## 适用边界与隐私

- 面向原生小程序的源码结构；不会理解 Taro、uni-app 等框架的源代码约定。若要检查这些项目，应针对其生成的原生小程序目录运行。
- 扫描 `.js`、`.mjs`、`.json`、`.wxml`、`.wxss`；目前不检查 TypeScript、WXS 或其他素材路径写法。
- 跳过 `.git`、`node_modules`、`miniprogram_npm`、`dist`、`coverage`、`.cache` 和符号链接。
- 文本检查可能把注释中的 `/assets/...` 当作引用，也不能求出动态表达式的最终值。
- **检查通过不等于微信开发者工具编译通过，也不证明页面行为、接口或真机体验正常。**

检查器不执行被检查项目的页面代码，不调用外部 API，也不发送文件到网络。错误结果仅包含类型、说明和路径；本仓库的示例为虚构内容，不含原产品的页面、素材、数据、凭据或 Git 历史。

## 开发与扩展

```sh
npm test
npm run check:example
```

若在自己的脚本中调用，可直接导入 `checkProject`：

```js
import { checkProject } from "./lib/check.mjs";

const result = checkProject("/path/to/your/miniapp", {
  strictPages: true,
  ignore: ["vendor"]
});
console.log(result.ok, result.issues);
```

`ignore` 接受要跳过的**目录名称**；目前命令行没有对应参数。欢迎围绕更多小程序文件类型、准确的静态分析和清晰的错误提示提出改进。

## 许可

MIT，详见 [LICENSE](LICENSE)。
