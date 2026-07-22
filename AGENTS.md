# AGENTS.md

面向 AI 编码代理的项目指南。人类文档见 [README.md](./README.md)，本文件侧重「约定、边界、易踩坑点」。

## 项目概览

Header Ext 是一款浏览器扩展（Chrome / Firefox，MV3），用于修改 HTTP 请求/响应头、追加 Cookie、按规则重定向 URL。核心思路：**用户在 UI 编辑规则 → 编译成 `declarativeNetRequest`(DNR) 规则 → 由 Service Worker 下发**，全程无 content script。

技术栈：WXT 0.20 + React 19 + TypeScript + Radix UI + Lucide + Zustand + Tailwind CSS v4。

## 命令

```bash
pnpm dev             # Chrome MV3 开发（不自动开浏览器，手动加载 .output/chrome-mv3-dev）
pnpm dev:firefox     # Firefox MV3 开发
pnpm build           # Chrome 生产构建
pnpm build:firefox   # Firefox 生产构建
pnpm compile         # 仅类型检查（tsc --noEmit）——改完代码务必跑一次
pnpm zip / zip:firefox
```

改动后的最低验证标准：`pnpm compile` 通过 + `pnpm build` 通过。涉及 Firefox 行为时补跑 `pnpm build:firefox`。

## 架构与数据流

单一信源是 `storage.local`，三处（popup / options / background）通过它保持一致：

```
UI 编辑 → Zustand store → saveState() 写 storage.local
                                    │
              storage.onChanged ────┼──→ 回写各处 store（popup/options）
                                    └──→ background: applyState() 编译并下发 DNR
```

- [src/store/profileStore.ts](./src/store/profileStore.ts)：唯一 store。所有 mutation 都走 `actions`，每次改动都 `set()` 后 `persist()` 写 storage。远端回写时用 `isApplyingRemote` 标志避免回环。组件里用 `useProfileActions()` 拿稳定的 actions 引用。
- [src/core/registry.ts](./src/core/registry.ts)：`applyState()` 把激活 profile 编译成 DNR 规则。含 `tabIds` 的规则只能进 **session rules**（Chrome MV3 限制），其余进 dynamic rules；两组都从 id=1 重新连续编号避免冲突。
- [src/core/compiler.ts](./src/core/compiler.ts)：规则模型 → DNR 规则的编译器（cookie 模式自动合成 Cookie/Set-Cookie 头、正则重定向等）。
- [src/core/types.ts](./src/core/types.ts)：公共领域模型（`Profile` / `HeaderRule` / 各类 `*Filter` / `AppMeta`）。**加字段时注意向后兼容**：老数据缺 `kind` 视为 `"header"`，缺 `theme` 视为 `"system"`，过滤器数组都是可选（`?? []` 兜底）。
- [entrypoints/background.ts](./entrypoints/background.ts)：SW 启动/唤醒/安装时重建状态，并订阅 storage 变化实时下发。

过滤语义：Tab / 域名 / URL 正则 / 排除 URL / 请求方法 之间是 **AND 组合**；同类多项之间是 OR。没有任何启用的过滤项时，规则作用于全部请求（此时 `NoFilterBanner` 会提示）。

## 目录结构

```
entrypoints/
  background.ts            # Service Worker
  popup/  { App.tsx, main.tsx, App.css }
  options/{ App.tsx, main.tsx, App.css }
src/
  core/        # types / compiler / registry / storage / browserApi / templates / portable / capabilities
  components/  # 通用 UI 组件（见下方约定）
  store/       # profileStore（Zustand）
  i18n/        # index / detector + locales/{zh-CN,en-US}.json
  styles/      # app.css（唯一样式入口）
public/_locales/  # 扩展 manifest 的 i18n 文案（__MSG_*__）
```

## 样式约定（重要）

本项目样式**优先使用 Tailwind v4 原子类**，通用交互组件使用本地 shadcn/ui 风格封装。

- **入口**：[src/styles/app.css](./src/styles/app.css) 是唯一样式入口，两个 `main.tsx` 在最顶部引入。
- **基础组件**：[src/components/ui.tsx](./src/components/ui.tsx) 基于 Radix UI primitives 封装 Button、Input、Select、DropdownMenu、Dialog、Popover、Tooltip、Switch、Checkbox、MultiSelect 等。业务组件优先复用此文件，不要直接复制 Radix 组合结构。
- **颜色 token**：使用 shadcn 风格语义 token 与对应原子类，如 `bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border`、`text-primary`。浅色变量定义在 `:root`，深色变量定义在 `:root[data-theme="dark"]`。
- **图标**：统一使用 `lucide-react`，默认尺寸由基础组件 CSS 控制；无文字图标按钮必须提供 `aria-label`。
- **禁止**在原子类中使用 px / 颜色的 arbitrary value（如 `w-[600px]`、`text-[#333]`）。
  - 尺寸走 4px 栅格：`w-155`=620px、`w-70`=280px、`max-w-360`=1440px、`gap-1.5`=6px。
  - 非栅格值在 `@theme` 里定义 token 后使用：目前有 `--text-group-title: 13px`（→ `text-group-title`）、`--spacing-select: 130px`（→ `w-select`）。需要新非栅格值时同样加 token，不要用 arbitrary。
- **可访问性**：菜单、弹窗、Popover、Tooltip、Switch、Checkbox、Select 必须使用基础组件或 Radix 原语，保留键盘导航、焦点环、Portal 和碰撞检测。
- **复用优先**：重复的结构抽成组件而非复制。现有公共小组件：`GroupHeader`（分组标题+新增按钮）、`MenuItemLabel`（菜单项标题+描述两行）。

代码风格：缩进 2 空格；组件精简，复杂逻辑拆分为独立组件；及时清理冗余；充分利用 SCSS/Tailwind 特性。

## i18n

- 界面文案走 [src/i18n](./src/i18n)（i18next + react-i18next），组件内用 `useTranslation()` 的 `t(key)`。新增文案**同时**更新 `locales/zh-CN.json` 和 `locales/en-US.json`。
- 扩展元信息（name/description）走 `public/_locales/**/messages.json`，manifest 里用 `__MSG_extName__` 引用。

## 跨端与权限注意

- 不直接依赖 `chrome.*` 命名空间；通过 [src/core/browserApi.ts](./src/core/browserApi.ts) 适配，`ResourceType` 等类型自定义以便跨端。
- Firefox MV3 特有配置在 `wxt.config.ts` 的 `browser_specific_settings.gecko`（含 `data_collection_permissions: { required: ["none"] }`，AMO 要求）。改 manifest/权限时注意两端差异。
- 隐私红线：只用本地 `storage.local`，**不得**向任何远端发送用户数据。

## 依赖安装提醒

pnpm 11 会在 `pnpm add` 后生成 `pnpm-workspace.yaml` 的 `allowBuilds` 构建脚本审批门。`@parcel/watcher`（WXT 依赖）已设为 `true`；若新增带原生构建脚本的依赖导致 `pnpm install` / `wxt build` 失败，在该文件补上对应 `allowBuilds` 条目即可。
