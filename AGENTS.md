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
pnpm lint            # Oxlint 静态检查
pnpm format          # Oxfmt 全仓格式化
pnpm check           # Oxfmt check + Oxlint + TypeScript
pnpm test            # Vitest 单元测试
pnpm zip / zip:firefox
```

改动后的最低验证标准：`pnpm check` 通过 + `pnpm test` 通过 + `pnpm build` 通过。涉及 Firefox 行为时补跑 `pnpm build:firefox`。

## 架构与数据流

完整架构说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。项目采用分层 + feature 组织：

```text
entrypoints → app → features → application
                         ├────→ platform → domain
                         └────→ shared
```

- `domain/`：纯业务模型与纯派生逻辑，不依赖浏览器、状态库或 React。
- `platform/`：浏览器、storage、文件、DNR 适配；可依赖 domain，不能依赖 application/features/app。
- `application/`：Zustand、持久化编排、i18n、状态感知 hook；不能依赖 features/app。
- `features/`：按用户能力组织业务 UI，目前包括 workspace、preferences、data-transfer。
- `app/`：组合 feature，承载 popup/options 页面及页面专属组件。
- `entrypoints/`：只保留 WXT 生命周期、HTML 与 React 挂载。
- `shared/`：无 Header Ext 业务含义的 UI primitive、设计 token 与通用工具。

跨层引用优先使用各层或 feature 的 `index.ts` public API。禁止新建 `core/`、`components/`、`utils/`
等职责不明的兜底目录。.oxlintrc.json 已限制底层反向依赖，并禁止 platform 之外直接使用
`browser` / `chrome` 全局。

单一信源是 `storage.local`（键 `app:state:v1`），三处（popup / options / background）通过它保持一致：

```
UI 编辑 → Zustand store → persist() 写 storage.local
                                    │
              subscribeState ───────┼──→ 回写各处 store（popup/options）
                                    └──→ background: applyState() 编译并下发 DNR
```

- [src/application/profile-store](./src/application/profile-store)：唯一 store。所有 mutation 都走 `actions`，每次改动都 `set()` 后持久化。远端回写时用 `isApplyingRemote` 避免回环；组件用 `useProfileActions()` 获取稳定 actions 引用。
- **多 profile 模型（重要）**：`meta.activeProfileId` 只是「UI 当前编辑/展示」的那个；真正下发的是 `meta.enabledProfileIds`——所有被启用的 profile 会**同时**编译进 DNR。`meta.globalPaused` 是总开关，为真时清空全部规则。
- [src/platform/dnr](./src/platform/dnr)：DNR 能力边界。`compiler/` 负责纯编译，`registry.ts` 负责 ID/动态与 session 规则更新及对账，`state.ts` 负责注册映射与错误记录，`messages.ts` 负责重建协议，`apply-state.ts` 只负责编排与串行队列。
- DNR 按 Profile 指纹增量更新，每条源规则独立注册，避免一条非法规则阻断整批更新；background 启动时会清理孤儿规则并重建缺失注册。
- [src/domain/profile-status.ts](./src/domain/profile-status.ts)：纯派生层，计算统计、风险、作用域与冲突分组。
- [src/domain/models.ts](./src/domain/models.ts)：公共领域模型。加字段时必须兼容老数据：缺 `kind` 视为 `"header"`，缺 `theme` 视为 `"system"`，缺 `enabledProfileIds` 回退 `[activeProfileId]`，可选数组统一 `?? []`。
- [src/platform/storage](./src/platform/storage)：状态仓储与兼容归一化。
- [src/platform/browser](./src/platform/browser)：跨浏览器 API 与能力探测；其他层不得直接访问浏览器全局。
- [entrypoints/background.ts](./entrypoints/background.ts)：SW 启动/唤醒/安装时重建状态，并订阅 storage 变化实时下发。

过滤语义：Tab / 域名 / URL 正则 / 排除 URL / 请求方法 之间是 **AND 组合**；同类多项之间是 OR（URL 正则合并成 `(?:a)|(?:b)`，domain/method 走 DNR 数组条件，tab 展开成多条规则）。没有任何启用的过滤项时，规则作用于全部请求（此时 `NoFilterBanner` 会提示：有启用规则却零过滤器）。

## 目录结构

```
entrypoints/
  background.ts                     # WXT Service Worker 适配
  popup/ { main.tsx, index.html }    # 仅挂载 src/app/popup
  options/ { main.tsx, index.html }  # 仅挂载 src/app/options
src/
  app/         # Popup / Options 页面组合、页面 CSS、页面私有组件
  application/ # profile-store / hooks / i18n
  domain/      # models / profile-status / templates / transfer
  features/    # workspace / preferences / data-transfer
  platform/    # browser / storage / files / dnr
  shared/      # ui / styles / lib
public/
  _locales/{en,zh_CN}/messages.json # manifest 文案（__MSG_*__）
  icon/                             # 扩展图标 16/32/48/96/128
assets/logo.svg
```

## UI 与 Feature 分层（重要）

1. **基础 primitive**：[src/shared/ui](./src/shared/ui)。只允许无业务语义的 Button/Input/Dialog/Popover/Select 等；按 `controls` / `feedback` / `overlays` / `scroll` / `select` 分组，并在同目录 side-effect import 样式。
2. **业务能力 UI**：[src/features](./src/features)。组件按能力归属，不按“通用组件”归属。Profile/规则/过滤器/变量编辑都在 `features/workspace`；主题语言在 `features/preferences`；导入导出在 `features/data-transfer`。
3. **页面组合**：[src/app](./src/app)。只放 Popup/Options 的页面编排和页面私有组件，不沉淀跨页面业务组件。

复用优先，但复用不等于上移到全局目录：优先放在所属 feature 的 `components/`；只有无业务语义时才进入 `shared/`。

`src/shared/ui/overlays/index.tsx` 只做 public API 汇总；Tooltip、Menu、Popover
分别放在同目录的职责文件中。新增 overlay primitive 时不要继续堆回 barrel。

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
- **就近原则**：`const.ts` / `utils.ts` / `types.ts` 先放组件或 feature 内；只有职责明确且无业务依赖时才上移到 `shared/lib`。

**entrypoints 与 app 的分工**：`entrypoints/` 不放业务组件，只负责 WXT 适配与 React 挂载。页面专属组件进入 `src/app/{popup,options}`；可复用业务能力进入对应 feature。

## 样式约定（重要）

**写样式的优先级（从上到下依次尝试，命中即停）**：

1. **Tailwind v4 原子类**（默认且首选）：布局、尺寸、间距、颜色、阴影、响应式和 Radix `data-*` 状态都直接写在 TSX。页面骨架与 primitive 基础外观也使用 Tailwind，不再为静态样式新建 CSS 类。
2. **CVA**：同一组件存在 `variant` / `size` 等稳定变体时，用 `class-variance-authority` 集中定义，避免手写映射和分散条件类。
3. **`tw-animate-css`**：Popover、Tooltip、Menu、Overlay 等进入/退出动画优先使用 `animate-in` / `fade-in` / `zoom-in-*` 等工具类，不重复定义关键帧。
4. **`*.module.scss` / 页面 CSS**（例外）：仅用于 Tailwind 难以清晰表达的伪元素、复杂后代选择器、跨 primitive 上下文覆盖、第三方库主题和滚动阴影。使用前应能说明为什么不能放进 `className`。

> 交互控件（按钮/输入/菜单/开关等）永远**优先复用 [src/shared/ui](./src/shared/ui) 的 primitive**，而不是手搓外观。

**module scss 规则**：

- Vite 原生支持（已装 `sass` 直接依赖），无需改 `wxt.config.ts`；`*.module.scss` 的 TS 类型由 `vite/client` 经 `wxt.d.ts` 提供，`pnpm compile` 直接认，**不用手写 `.d.ts`**。
- 文件跟组件走：单文件组件用同名 `Foo.module.scss`，目录形态组件用 `index.module.scss`（见「组件目录分层」）。类名用 **camelCase**（`styles.ruleRow`），因为要在 JS 里以属性访问。
- scss 里可用嵌套、`$变量`、`@mixin` 等 Sass 特性，但颜色 / 间距仍走语义 token，不要另立色板。
- 禁止在 module scss 里重复实现 primitive 基础外观；一次性布局、响应式和交互状态必须优先写 Tailwind。

**全局 CSS**：

- [src/shared/styles/app.css](./src/shared/styles/app.css) 只负责 Tailwind / `tw-animate-css` 导入、设计 token、主题变量、base reset 与 reduced-motion。
- 页面布局写在 TSX；[PopupApp.css](./src/app/popup/PopupApp.css) 仅保留 Profile 状态伪元素和 Popup 上下文下的 Dialog/Checkbox 覆盖。Options 页面不再使用独立 CSS。
- [ProfileEditor/index.module.scss](./src/app/popup/components/ProfileEditor/index.module.scss) 仅保留 Popup 紧凑密度上下文、装饰伪元素与滚动阴影。
- **颜色 token**：shadcn 风格语义 token——`bg-background`、`bg-card`、`text-foreground`、`text-muted-foreground`、`border-border`、`text-primary`，以及状态色 `success` / `warning` / `info` / `purple` / `orange`。主题切换由 [use-theme-mode.ts](./src/application/hooks/use-theme-mode.ts) 同步到 `<html data-theme>`。
- **类名拼接**：用 [src/shared/lib/cn.ts](./src/shared/lib/cn.ts) 的 `cn()`（`clsx` + `tailwind-merge`）。
- **图标**：统一 `lucide-react`；无文字图标按钮必须提供 `aria-label`。
- **禁止**在原子类里用 px / 颜色 arbitrary value（例如任意宽度值或十六进制颜色值）。
  - 尺寸走 4px 栅格：`w-155`=620px（popup 固定宽）、`max-w-360`=1440px、`gap-1.5`=6px。
  - 非栅格值在 `@theme` 里定义 token 后使用：现有 `--text-micro: 11px`（→ `text-micro`）、`--text-group-title: 13px`（→ `text-group-title`）、`--spacing-select: 132px`（→ `w-select`）、`--shadow-soft`/`--shadow-panel`、`--radius-sm/md/lg/xl`。需要新非栅格值时同样加 token，不要用 arbitrary。
- **可访问性**：菜单、弹窗、Popover、Tooltip、Switch、Checkbox、Select 必须走 primitive 或 Radix 原语，保留键盘导航、焦点环、Portal 和碰撞检测。

代码风格：缩进 2 空格；组件精简，复杂逻辑拆分为独立组件；及时清理冗余；充分利用 Tailwind / CSS Layer 特性。

## i18n

- 界面文案走 [src/application/i18n](./src/application/i18n)（i18next + react-i18next），组件内用 `useTranslation()` 的 `t(key)`。新增文案同时更新中英文 locale。语言探测顺序：用户偏好 → 平台层 UI language → `en-US`。
- 扩展元信息（name/description）走 `public/_locales/**/messages.json`，manifest 里用 `__MSG_extName__` / `__MSG_extDesc__` 引用，`default_locale: "en"`。**注意目录名是 Chrome 要求的下划线形式 `zh_CN`**，与 UI locale 文件名 `zh-CN` 不同。

## 跨端与权限注意

- `browser` / `chrome` 全局仅允许出现在 [src/platform/browser](./src/platform/browser)。其他层通过平台层 public API 访问 Tabs、Runtime、storage 与 DNR；Oxlint 会阻止越界。
- manifest 权限：`declarativeNetRequest` / `storage` / `tabs` + `host_permissions: ["<all_urls>"]`。
- Firefox MV3 特有配置在 `wxt.config.ts` 的 `browser_specific_settings.gecko`（含 `strict_min_version: "128.0"` 与 `data_collection_permissions: { required: ["none"] }`，AMO 要求）。改 manifest/权限时注意两端差异。
- 隐私红线：只用本地 `storage.local`，不得向任何远端发送用户数据；导入解析走 [src/domain/transfer.ts](./src/domain/transfer.ts)，文件 IO 走 [src/platform/files](./src/platform/files)，schema 为 `header-ext.v1`。

## 依赖安装提醒

pnpm 会在 `pnpm add` 后用 `pnpm-workspace.yaml` 的 `allowBuilds` 做构建脚本审批门。`@parcel/watcher`（WXT 依赖）已设为 `true`；若新增带原生构建脚本的依赖导致 `pnpm install` / `wxt build` 失败，在该文件补上对应 `allowBuilds` 条目即可。
