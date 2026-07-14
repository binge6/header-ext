# Header Ext

一款用于修改 HTTP 请求/响应头、追加 Cookie、按规则重定向 URL 的浏览器扩展，支持 Chrome 与 Firefox（MV3）。

## 安装

- Chrome Web Store：<https://chromewebstore.google.com/detail/header-ext/fmeahkfblcdknabpmhlmbkconfcaoemi>
- Firefox Add-ons：<https://addons.mozilla.org/zh-CN/firefox/addon/header-ext/>

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
- Semi Design
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
```

## 项目结构

```
entrypoints/
  background.ts        # Service Worker，规则编译与下发
  popup/               # 工具栏弹窗
  options/             # 设置页（独立 Tab 打开）
src/
  core/                # 规则模型、编译器、存储、浏览器 API 适配
  components/          # 通用 UI 组件
  store/               # Zustand store
  i18n/                # 中英文资源
public/icon/           # 16/32/48/96/128 图标
```

## 权限说明

仅使用本地 `storage.local` 存储 Profile，不向任何远端发送数据。Firefox 已在 `wxt.config.ts` 的 `gecko` 字段声明 `data_collection_permissions: { required: ["none"] }`，符合 AMO 审核要求。
