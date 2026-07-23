# AGENTS.md

面向 AI 编码代理的项目指南。人类文档见 [README.md](./README.md) / [README-ZH.md](./README-ZH.md)，本文件侧重「约定、边界、易踩坑点」。

## 项目概览

Header Ext 是一款浏览器扩展（Chrome / Firefox，MV3），用于修改 HTTP 请求/响应头、追加 Cookie、按规则重定向 URL。核心思路：**用户在 UI 编辑规则 → 编译成 `declarativeNetRequest`(DNR) 规则 → 由 Service Worker 下发**，全程无 content script。

技术栈：WXT 0.20（MV3）+ React 19 + TypeScript + Zustand（store）。UI 用 Radix UI primitives + `lucide-react`（图标）+ `sonner`（toast）+ Tailwind CSS v4（局部样式用 Sass / `*.module.scss`），`clsx` + `tailwind-merge` 组成 `cn()`。i18n 用 i18next + react-i18next，ID 用 `nanoid`。

模块路径别名：`@/*` 指向仓库根（见 `.wxt/tsconfig.json`），import 一律写 `@/src/...`、`@/entrypoints/...`。

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

单一信源是 `storage.local`（键 `app:state:v1`），三处（popup / options / background）通过它保持一致：

```
UI 编辑 → Zustand store → persist() 写 storage.local
                                    │
              subscribeState ───────┼──→ 回写各处 store（popup/options）
                                    └──→ background: applyState() 编译并下发 DNR
```

- [src/store/profileStore.ts](./src/store/profileStore.ts)：唯一 store。所有 mutation 都走 `actions`，每次改动都 `set()` 后 `persist()` 写 storage。远端回写时用模块级 `isApplyingRemote` 标志避免回环（`persist` 内会 `return`）。组件里用 `useProfileActions()` 拿稳定的 actions 引用。
- **多 profile 模型（重要）**：`meta.activeProfileId` 只是「UI 当前编辑/展示」的那个；真正下发的是 `meta.enabledProfileIds`——所有被启用的 profile 会**同时**编译进 DNR。`meta.globalPaused` 是总开关，为真时清空全部规则。
- [src/core/registry.ts](./src/core/registry.ts)：`applyState()` 遍历所有 `enabledProfileIds` 编译成 DNR 规则。含 `tabIds`/`excludedTabIds` 的规则只能进 **session rules**（Chrome MV3 限制），其余进 dynamic rules；两组都从 id=1 重新连续编号避免冲突。
- [src/core/compiler.ts](./src/core/compiler.ts)：规则模型 → DNR 规则的编译器（cookie 模式自动合成 Cookie/Set-Cookie 头、正则重定向、把 profile 级过滤器并到每条规则的 condition、tab 过滤器展开为多条规则等）。
- [src/core/profileStatus.ts](./src/core/profileStatus.ts)：**纯派生层**（无副作用/不碰 storage）。算每个 profile 的统计与风险（`hasGlobalRisk = 有启用规则但无任何启用过滤器`）、作用域摘要、是否命中当前域名，以及 `buildWorkspaceStatus()` 聚合启用/风险/冲突分组，供 popup 侧栏与 options inspector 展示。
- [src/core/types.ts](./src/core/types.ts)：公共领域模型（`Profile` / `HeaderRule` / 各类 `*Filter` / `AppMeta` / `AppState`）。**加字段时注意向后兼容**：老数据缺 `kind` 视为 `"header"`，缺 `theme` 视为 `"system"`，缺 `enabledProfileIds` 回退 `[activeProfileId]`，过滤器数组都是可选（`?? []` 兜底）。
- [src/core/storage.ts](./src/core/storage.ts)：`loadState`/`saveState`/`subscribeState` + 默认态工厂 + `normalizeMeta` 兼容回填。
- [src/core/browserApi.ts](./src/core/browserApi.ts)：跨端封装 `dnr` / `storageLocal` / `getUILanguage` / `openOptionsPage`。
- [src/core/capabilities.ts](./src/core/capabilities.ts)：运行时能力探测（`hasDeclarativeNetRequest` / `hasWebRequestBlocking`(仅 FF) / `isFirefox`），UI 据此隐藏不支持的功能。
- [entrypoints/background.ts](./entrypoints/background.ts)：SW 启动/唤醒/安装时重建状态，并订阅 storage 变化实时下发。

过滤语义：Tab / 域名 / URL 正则 / 排除 URL / 请求方法 之间是 **AND 组合**；同类多项之间是 OR（URL 正则合并成 `(?:a)|(?:b)`，domain/method 走 DNR 数组条件，tab 展开成多条规则）。没有任何启用的过滤项时，规则作用于全部请求（此时 `NoFilterBanner` 会提示：有启用规则却零过滤器）。

## 目录结构

```
entrypoints/
  background.ts                     # Service Worker
  popup/
    { App.tsx, main.tsx, App.css, index.html }
    components/ { PopupHeader, ProfileRail, ProfileEditor/, ProfileContextMenu, utils }
  options/
    { App.tsx, main.tsx, App.css, index.html }
src/
  core/        # types / compiler / registry / storage / browserApi / templates / portable / capabilities / profileStatus
  store/       # profileStore（唯一 Zustand store）
  ui/          # 基础 primitive 封装 + primitive 样式：controls/ feedback/ overlays/ select/
  components/  # 业务组件
  hooks/       # useThemeMode / useHistorySuggestions
  i18n/        # index / detector + locales/{zh-CN,en-US}.json
  styles/      # app.css（设计 token + 跨业务共享 he-* 类，唯一 token 入口）
  utils/       # cn.ts
public/
  _locales/{en,zh_CN}/messages.json # manifest 文案（__MSG_*__）
  icon/                             # 扩展图标 16/32/48/96/128
assets/logo.svg
```

## UI 组件分层（重要）

分两层，改 UI 前先认清在哪一层：

1. **基础 primitive**：[src/ui/](./src/ui)。`controls/`（Button/Input/AutoCompleteInput/Switch/Checkbox）、`feedback/`（Dialog/ConfirmDialog/Spinner/Badge/AppToaster）、`overlays/`（Tooltip/UIProvider/DropdownMenu\*/Popover\*）、`select/`（SelectControl/MultiSelect）；[index.tsx](./src/ui/index.tsx) 汇总 `export *`。这些封装 Radix primitives 与 `sonner`，统一挂 `he-*` 类；每个 primitive 目录用 `index.tsx` + `index.scss` 分层，`index.tsx` 直接 side-effect import 同目录样式，保证 deep import 不漏样式。引入时走 barrel `@/src/ui`，或按需 deep-import `@/src/ui/controls` 等。**新增基础组件加在 `src/ui/` 对应目录；新增 primitive 样式加在同目录 `index.scss`。**
2. **业务组件**：[src/components/](./src/components)（HeaderRuleList / RuleTable / ProfilePanel / 各类 Filter picker / GroupHeader / MenuItemLabel …）与 [entrypoints/popup/components/](./entrypoints/popup/components)（PopupHeader / ProfileRail / ProfileEditor / ProfileContextMenu）。它们消费第 1 层 primitive，不直接拼 Radix 组合结构。

复用优先：重复结构抽成组件而非复制。现有公共小组件：`GroupHeader`（分组标题+新增按钮）、`MenuItemLabel`（菜单项标题+描述两行）。

## 组件目录分层（约定）

单文件组件（如现有的 `RuleTable.tsx`）保持扁平即可。当一个组件长大到同时含**样式 / 常量 / 工具方法 / 类型**时，升级为同名目录，按职责拆分：

```
ComponentName/
  index.tsx            # 组件主体
  index.module.scss    # 该组件样式（配合 cn(styles.xxx) 使用）
  const.ts             # 常量：颜色、尺寸、阈值、百分比等
  utils.ts             # 纯函数工具：格式化、tooltip 绑定、数据变换等
  types.ts             # 本模块用到的 TypeScript 类型
```

- **按需拆分，别为拆而拆**：只有 1～2 个常量时直接内联进 `index.tsx`，不必单开 `const.ts`；没有复杂样式就不建 `index.module.scss`。避免过度提取。
- **单文件规模阈值**：组件单文件超过 500 行时，应主动评估是否拆成同名目录、子组件、`utils.ts` / `types.ts` / `const.ts` 等；如果 500+ 行仍保持单文件，需要有明确理由（例如高度线性的表单配置或短期迁移状态）。
- **子组件同样适用**：子组件复杂到同样含样式/常量/工具时，在该目录下再开子目录，按同一套结构拆分。
- **就近原则**：`const.ts` / `utils.ts` / `types.ts` 只放**本组件私有**的内容；一旦被多个组件复用，就上移到 `src/`（见下条）。

**entrypoints 与 src 的分工**：`entrypoints/*/components/` 只放该入口页**专属**的组件，其内部分层同样参考上面的结构。**公共通用的方法、组件、样式、类型一律放 `src/`**——工具进 [src/utils/](./src/utils)、可复用业务组件进 [src/components/](./src/components)、基础 primitive 与 primitive 样式进 [src/ui/](./src/ui)、设计 token 与跨业务共享样式进 [src/styles/app.css](./src/styles/app.css)、共享 hook 进 [src/hooks/](./src/hooks)。别让入口页互相 import 对方的局部文件。

## 样式约定（重要）

**写样式的优先级（从上到下依次尝试，命中即停）**：

1. **Tailwind v4 原子类**（首选）：flex / gap / 间距 / 对齐 / 颜色 token 等，直接写在 TSX 的 `className`。绝大多数样式都应止步于此。
2. **`*.module.scss`**（其次）：当原子类表达不了或会导致 `className` 冗长难读时——例如复杂选择器（`&:hover`、`[data-state]`、`::before`）、伪元素装饰、多状态嵌套、局部关键帧动画——把这部分收进组件同级的 module scss，用 `import styles from "./index.module.scss"` + `cn(styles.xxx, "tw-原子类")` 组合。scoped class 不会污染全局。
3. **共享 `he-*` 组件类 / 页面布局类**：仅当样式需要**跨组件复用**（primitive 外观）或属于**页面级布局骨架**时才落到全局 CSS（见下）。

> 交互控件（按钮/输入/菜单/开关等）永远**优先复用 [src/ui/](./src/ui) 的 primitive**，而不是用上面任何一种手搓外观。

**module scss 规则**：

- Vite 原生支持（已装 `sass` 直接依赖），无需改 `wxt.config.ts`；`*.module.scss` 的 TS 类型由 `vite/client` 经 `wxt.d.ts` 提供，`pnpm compile` 直接认，**不用手写 `.d.ts`**。
- 文件跟组件走：单文件组件用同名 `Foo.module.scss`，目录形态组件用 `index.module.scss`（见「组件目录分层」）。类名用 **camelCase**（`styles.ruleRow`），因为要在 JS 里以属性访问。
- scss 里可用嵌套、`$变量`、`@mixin` 等 Sass 特性，但**颜色 / 间距仍走全局 CSS 变量**（`var(--foreground)`、`var(--primary)`…），不要在 scss 里另立一套色板，保持与 token 体系一致。
- 别在 module scss 里重复实现 primitive 已有的外观；一次性布局能用原子类就别开 scss 文件。

**全局 CSS（跨页复用 / 页面骨架）**：

- **设计 token + 跨业务共享类**：[src/styles/app.css](./src/styles/app.css) 是**唯一 token 入口**，两个 `main.tsx` 在最顶部 `@import`。它含 `@theme`、`:root` / `:root[data-theme="dark"]` 变量，以及 `@layer components` 里跨业务复用的 `he-*` 类（如 `he-editor-*`、`he-profile-list-*`、`he-empty-state`、`he-section-title`）。primitive 外观类（如 `he-button`、`he-input`、`he-switch`、`he-select-*`、`he-menu-*`、`he-dialog-*`、`he-badge`）归属 [src/ui](./src/ui) 下对应模块的 scss 文件，不要放回 app.css。
- **页面布局类**：popup / options 各自的 `App.css`（[popup/App.css](./entrypoints/popup/App.css) 的 `he-popup-*`、`he-profile-rail-*`、`he-scroll-shadow-*`；[options/App.css](./entrypoints/options/App.css) 的 `he-options-*`、`he-workbench-*`、`he-inspector-*`）。**只在单页出现的布局骨架放这里，别塞进 app.css，也别用 module scss 承载页面级 sticky/grid 骨架。**
- **颜色 token**：shadcn 风格语义 token——`bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border`、`text-primary`，以及状态色 `success` / `warning` / `info` / `purple` / `orange`（各带 `-soft` 底色、部分带 `-hover`）。浅色在 `:root`，深色在 `:root[data-theme="dark"]`；主题切换由 [useThemeMode](./src/hooks/useThemeMode.ts) 同步到 `<html data-theme>`。
- **类名拼接**：用 [src/utils/cn.ts](./src/utils/cn.ts) 的 `cn()`（`clsx` + `tailwind-merge`），module scss class 与 Tailwind 原子类混用时也走它。
- **图标**：统一 `lucide-react`；无文字图标按钮必须提供 `aria-label`。
- **禁止**在原子类里用 px / 颜色 arbitrary value（例如任意宽度值或十六进制颜色值）。
  - 尺寸走 4px 栅格：`w-155`=620px（popup 固定宽）、`max-w-360`=1440px、`gap-1.5`=6px。
  - 非栅格值在 `@theme` 里定义 token 后使用：现有 `--text-micro: 11px`（→ `text-micro`）、`--text-group-title: 13px`（→ `text-group-title`）、`--spacing-select: 132px`（→ `w-select`）、`--shadow-soft`/`--shadow-panel`、`--radius-sm/md/lg/xl`。需要新非栅格值时同样加 token，不要用 arbitrary。
- **可访问性**：菜单、弹窗、Popover、Tooltip、Switch、Checkbox、Select 必须走 primitive 或 Radix 原语，保留键盘导航、焦点环、Portal 和碰撞检测。

代码风格：缩进 2 空格；组件精简，复杂逻辑拆分为独立组件；及时清理冗余；充分利用 Tailwind / CSS Layer 特性。

## i18n

- 界面文案走 [src/i18n](./src/i18n)（i18next + react-i18next），组件内用 `useTranslation()` 的 `t(key)`。目前两种语言，新增文案**同时**更新 `locales/zh-CN.json` 和 `locales/en-US.json`。语言探测顺序：用户存储偏好 → `browser.i18n.getUILanguage()` → 兜底 `en-US`。
- 扩展元信息（name/description）走 `public/_locales/**/messages.json`，manifest 里用 `__MSG_extName__` / `__MSG_extDesc__` 引用，`default_locale: "en"`。**注意目录名是 Chrome 要求的下划线形式 `zh_CN`**，与 UI locale 文件名 `zh-CN` 不同。

## 跨端与权限注意

- 不直接依赖 `chrome.*` 命名空间；通过 [src/core/browserApi.ts](./src/core/browserApi.ts) 适配（WXT 注入的全局 `browser`），`ResourceType` 等类型自定义以便跨端。差异化能力用 [capabilities.ts](./src/core/capabilities.ts) 探测后再决定是否渲染。
- manifest 权限：`declarativeNetRequest` / `declarativeNetRequestFeedback` / `storage` / `tabs` + `host_permissions: ["<all_urls>"]`。
- Firefox MV3 特有配置在 `wxt.config.ts` 的 `browser_specific_settings.gecko`（含 `strict_min_version: "128.0"` 与 `data_collection_permissions: { required: ["none"] }`，AMO 要求）。改 manifest/权限时注意两端差异。
- 隐私红线：只用本地 `storage.local`，**不得**向任何远端发送用户数据；导入/导出走本地文件（[portable.ts](./src/core/portable.ts)，schema `header-ext.v1`）。

## 依赖安装提醒

pnpm 会在 `pnpm add` 后用 `pnpm-workspace.yaml` 的 `allowBuilds` 做构建脚本审批门。`@parcel/watcher`（WXT 依赖）已设为 `true`；若新增带原生构建脚本的依赖导致 `pnpm install` / `wxt build` 失败，在该文件补上对应 `allowBuilds` 条目即可。
