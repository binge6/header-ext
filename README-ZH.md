# Header Ext

[English](./README.md) | 简体中文

一款用于修改 HTTP 请求/响应头、追加 Cookie、按规则重定向 URL 的浏览器扩展，支持 Chrome 与 Firefox（MV3）。

## 安装

- Chrome Web Store：<https://chromewebstore.google.com/detail/header-ext/fmeahkfblcdknabpmhlmbkconfcaoemi>
- Microsoft Edge Add-ons：<https://microsoftedge.microsoft.com/addons/detail/header-ext/ablejeigpmcijedpfaefhjdijjlnphni>
- Firefox Add-ons：<https://addons.mozilla.org/zh-CN/firefox/addon/header-ext/>

如果无法访问 Chrome Web Store、Microsoft Edge Add-ons 或 Firefox Add-ons，可以从 [Releases](https://github.com/binge6/header-ext/releases) 下载对应 zip 产物，解压后手动加载：

- Chrome / Edge：打开 `chrome://extensions` 或 `edge://extensions`，启用开发者模式，然后选择「加载已解压的扩展程序」。
- Firefox：打开 `about:debugging#/runtime/this-firefox`，选择「临时载入附加组件」，然后选中解压目录里的 `manifest.json`。

## 功能特性

- **请求/响应头修改**：增删改 Header，支持模板（CORS、CSP 等常用预设）和历史值自动补全。
- **Cookie 追加**：在请求头追加 Cookie，或在响应头追加 Set-Cookie。
- **URL 重定向**：支持普通 URL 替换与基于正则反向引用（`\1`）的重写。
- **规则过滤**：基于 Tab URL、请求域名、请求 URL 正则、排除 URL、请求方法（多选）的 AND 组合过滤。
- **Profile 管理**：多套配置切换，支持导入/导出 JSON。
- **国际化**：内置中英双语（i18next）。
- **明暗主题**：跟随系统或手动切换。

## 技术栈

- [WXT](https://wxt.dev/) + React 19 + TypeScript
- Radix UI 原语 + shadcn/ui 风格本地组件
- Tailwind CSS v4 + Lucide 图标
- Zustand 状态管理
- `declarativeNetRequest` + Service Worker（无需 content script）

## 开发

```bash
pnpm install
pnpm dev            # Chrome MV3
pnpm dev:firefox    # Firefox MV3
```

开发模式不会自动启动浏览器，需手动加载 `.output/chrome-mv3-dev`（或 firefox 对应目录）作为未打包扩展。

## 构建

```bash
pnpm build           # Chrome
pnpm build:firefox   # Firefox
pnpm zip             # 打包 Chrome zip
pnpm zip:firefox     # 打包 Firefox zip
pnpm compile         # 仅做类型检查
pnpm lint            # Oxlint 静态检查
pnpm format          # 使用 Oxfmt 格式化
pnpm check           # 格式检查 + lint + 类型检查
```

## 项目结构

```
entrypoints/
  background.ts        # WXT Service Worker 适配入口
  popup/               # Popup HTML 与 React 挂载
  options/             # Options HTML 与 React 挂载
src/
  app/                 # Popup / Options 页面组合与页面专属 UI
  application/         # Zustand 状态、同步、应用 Hook、i18n
  domain/              # 纯模型、派生逻辑、模板、导入导出 Schema
  features/            # 工作区、偏好设置、数据迁移等业务能力
  platform/            # 浏览器、存储、文件与 DNR 适配
  shared/              # 无业务含义的 UI、样式与通用工具
public/icon/           # 16/32/48/96/128 图标
```

依赖从 entrypoints 和 app 组合层单向流向 features、application、platform
与 domain；底层不得反向依赖页面或业务 UI。完整依赖规则与文件放置指南见
[ARCHITECTURE.md](./ARCHITECTURE.md)。

## 权限说明

仅使用本地 `storage.local` 存储 Profile，不向任何远端发送数据。Firefox 已在 `wxt.config.ts` 的 `gecko` 字段声明 `data_collection_permissions: { required: ["none"] }`，符合 AMO 审核要求。
