# Header Ext 用户手册

[English](./user-manual.en-US.md) | 简体中文

Header Ext 是一款运行在 Chrome、Edge 和 Firefox 上的浏览器扩展。它可以按规则修改 HTTP 请求头和响应头、追加 Cookie、重定向 URL，并通过 Profile、过滤条件和变量组织不同调试场景。

> Header Ext 只在浏览器本地处理规则和配置，不会把用户数据发送到远端。规则由浏览器的 `declarativeNetRequest`（DNR）能力执行，不使用 content script。

## 目录

- [1. 安装与打开](#1-安装与打开)
- [2. 核心概念](#2-核心概念)
- [3. 快速开始](#3-快速开始)
- [4. 弹出窗口](#4-弹出窗口)
- [5. 完整设置页](#5-完整设置页)
- [6. Profile 管理](#6-profile-管理)
- [7. Mod：修改请求与响应](#7-mod修改请求与响应)
- [8. Filter：限定作用范围](#8-filter限定作用范围)
- [9. 单条规则的高级条件](#9-单条规则的高级条件)
- [10. 变量](#10-变量)
- [11. 一键模板](#11-一键模板)
- [12. 导入、分享与备份](#12-导入分享与备份)
- [13. 全局暂停与 Tab 锁定](#13-全局暂停与-tab-锁定)
- [14. 状态、风险与错误提示](#14-状态风险与错误提示)
- [15. 语言、主题与本地存储](#15-语言主题与本地存储)
- [16. 常见使用示例](#16-常见使用示例)
- [17. 故障排查](#17-故障排查)
- [18. 浏览器与 DNR 限制](#18-浏览器与-dnr-限制)

## 1. 安装与打开

### 1.1 从扩展商店安装

- [Chrome Web Store](https://chromewebstore.google.com/detail/header-ext/fmeahkfblcdknabpmhlmbkconfcaoemi)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/header-ext/ablejeigpmcijedpfaefhjdijjlnphni)
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/header-ext/)

安装后，建议把 Header Ext 固定到浏览器工具栏，便于快速切换 Profile 和编辑规则。

### 1.2 手动安装 Release

如果无法访问扩展商店，可以从项目的 [Releases](https://github.com/binge6/header-ext/releases) 下载对应浏览器的 zip 文件并解压。

- Chrome / Edge：
  1. 打开 `chrome://extensions` 或 `edge://extensions`。
  2. 开启“开发者模式”。
  3. 点击“加载已解压的扩展程序”。
  4. 选择解压后的扩展目录。
- Firefox：
  1. 打开 `about:debugging#/runtime/this-firefox`。
  2. 点击“临时载入附加组件”。
  3. 选择解压目录中的 `manifest.json`。

Firefox 的临时附加组件会在浏览器重启后失效，需要重新载入；日常使用建议从 Firefox Add-ons 安装。

### 1.3 打开两个操作界面

Header Ext 提供两个同步的界面：

- **弹出窗口（Popup）**：点击工具栏图标打开，适合快速切换 Profile、添加规则和使用当前页面信息创建过滤器。
- **完整设置页（Options）**：在弹出窗口的“更多操作”中选择“打开完整设置”，适合管理大量 Profile、规则、变量以及导入导出。

两个界面的修改都会自动保存并立即同步，不需要手动点击“保存”。

## 2. 核心概念

### 2.1 Profile

Profile 是一套完整的场景配置，包含：

- Header、Cookie 和 Redirect 规则；
- Profile 级过滤条件；
- Profile 变量；
- Profile 名称及启用状态。

例如，可以分别创建“本地开发”“测试环境”“禁用缓存”和“接口联调”等 Profile。

### 2.2 当前 Profile 与始终启用 Profile

- **当前 Profile**：当前正在编辑和展示的 Profile，也会默认参与规则下发。
- **始终启用 Profile**：点击图钉设为“常驻”后，不论当前选中哪个 Profile，它都会一起参与规则下发。

因此，实际生效的是：

```text
当前 Profile + 所有始终启用的 Profile
```

切换 Profile 不会自动关闭已经设为常驻的 Profile。若多个生效 Profile 修改同一个 Header、Cookie 或重定向来源，设置页会显示潜在冲突提示。

### 2.3 Mod

Mod 是实际执行修改的规则，支持五种类型：

1. 请求头修改；
2. 响应头修改；
3. 请求 Cookie 追加；
4. 响应 Set-Cookie 追加；
5. Redirect / URL 重写。

### 2.4 Filter

Filter 是 Profile 级作用范围。它会应用到这个 Profile 中的所有规则，可按 Tab、请求域名、请求 URL、排除 URL 和请求方法进行限制。

### 2.5 高级条件

每一条规则还可以设置自己的高级条件，例如 URL、域名、资源类型和请求方法。Profile 级 Filter 与单条规则的高级条件会叠加生效。

## 3. 快速开始

以下示例为 `api.example.com` 的请求添加 `X-Debug: true`：

1. 点击 Header Ext 工具栏图标。
2. 选择已有 Profile，或点击左侧底部的“新建 Profile”。
3. 点击 Profile 顶部的“新增 Mod”按钮。
4. 选择“新增请求头”。
5. 在规则中填写：
   - Header 名称：`X-Debug`
   - Header 值：`true`
   - 操作：设置
6. 点击“添加过滤条件”。
7. 选择“请求域名过滤”，填写 `api.example.com`。
8. 确保规则和过滤条件右侧的复选框处于启用状态。
9. 重新发起目标请求，并在浏览器开发者工具的 Network 面板中检查 Request Headers。

所有输入会自动保存。域名过滤会自动匹配子域，例如 `api.example.com` 也会匹配 `v2.api.example.com`。

## 4. 弹出窗口

### 4.1 顶部工具栏

顶部会显示当前生效的 Profile 数和启用规则数，并提供以下操作：

- **暂停 / 恢复全部规则**：暂停时清空已下发的规则，恢复后重新下发。
- **锁定到当前 Tab**：临时把所有生效规则限制到当前标签页。
- **语言**：在简体中文和 English 之间切换。
- **主题**：选择浅色、深色或跟随系统。
- **更多操作**：
  - 打开完整设置；
  - 打开操作手册；
  - 导入配置；
  - 分享配置。

扩展图标角标通常显示当前生效的启用规则数；全局暂停时显示 `off`。

### 4.2 Profile 列表

左侧 Profile 面板支持展开和收起：

- 点击 Profile 可切换当前 Profile。
- 点击图钉可把 Profile 设为或取消“始终启用”。
- 右键 Profile 可打开重命名、复制和删除菜单。
- 展开模式会显示启用规则数，以及全局作用风险和高级条件标记。
- 点击底部按钮可以新建 Profile。

### 4.3 当前 Profile 工具栏

当前 Profile 顶部提供：

- 新增 Mod；
- 添加 Filter；
- 新增变量；
- 应用一键模板；
- 设为或取消始终启用；
- 重命名、复制和删除 Profile。

### 4.4 使用当前页面快速创建过滤器

在普通 `http` 或 `https` 页面打开弹出窗口后，新增以下 Filter 时会自动预填当前页面信息：

- Tab 过滤：`*://当前域名/*`
- 请求域名过滤：当前域名
- 请求 URL 过滤：匹配当前域名的正则
- 排除请求 URL：当前页面完整 URL

在浏览器内部页、扩展页或其他非 `http/https` 页面中，这些值可能无法自动识别。

## 5. 完整设置页

完整设置页适合管理较多配置，由三部分组成：

### 5.1 左侧 Profile 面板

- 新建、切换、复制、重命名和删除 Profile；
- 设置始终启用；
- 进入批量删除模式；
- 批量选择全部、反选或选择空 Profile。

删除所有 Profile 后，扩展会自动创建一个空的 `Profile 1`，保证始终有可编辑的 Profile。

### 5.2 中间编辑区

中间区域按以下顺序展示当前 Profile：

1. Profile 概要和作用范围；
2. 全局作用风险提示；
3. Profile 级 Filter；
4. 变量；
5. Mod 规则。

每个分组都可以新增项目、整体启用或整体停用。规则还可以通过左侧拖拽手柄调整组内顺序。

### 5.3 右侧状态区

右侧实时展示：

- 生效 Profile 数；
- 启用规则数；
- 是否全局暂停；
- 未设置作用范围的风险 Profile；
- 潜在冲突组；
- 当前生效的 Profile；
- 使用高级条件的规则数。

这里的冲突是辅助提示，不代表浏览器一定会拒绝规则。发现冲突时，应检查多个生效 Profile 是否修改了同一目标。

## 6. Profile 管理

### 6.1 新建 Profile

点击“新建 Profile”后会生成一个唯一名称，并自动切换到新 Profile。新 Profile 默认没有规则和过滤条件。

### 6.2 切换 Profile

点击 Profile 即可把它设为当前 Profile。切换后：

- 新选中的 Profile 默认生效；
- 原 Profile 若不是始终启用，则不再生效；
- 所有始终启用的 Profile 保持生效。

### 6.3 始终启用

图钉按钮用于维护常驻 Profile。适合放置需要跨场景复用的规则，例如统一禁用缓存、固定调试 Header 或公共环境变量。

> 不要把大量互相冲突的 Profile 都设为始终启用。设置页会提示同一 Header、Cookie 名或 Redirect 来源的潜在冲突。

### 6.4 重命名与唯一名称

Profile 名称会自动保持唯一。如果输入的名称已存在，扩展会追加序号，例如 `Local (2)`。

### 6.5 复制 Profile

复制会创建一份独立副本，包括规则、过滤器和变量。副本中的内部 ID 会重新生成，修改副本不会影响原 Profile。

### 6.6 删除和批量删除

- 弹出窗口支持删除单个 Profile。
- 完整设置页支持删除单个或批量删除。
- 批量模式可以快速选择空 Profile、全选或反选。

删除操作会同时删除 Profile 内的规则、过滤器和变量，执行前会要求确认。

## 7. Mod：修改请求与响应

### 7.1 请求头与响应头

Header 规则包含：

- **Header 名称**：例如 `Authorization`、`X-Debug`。
- **Header 值**：设置或追加时必填；移除时不需要。
- **操作**：
  - **设置（set）**：把 Header 设置为指定值；
  - **追加（append）**：在现有 Header 上追加值；
  - **移除（remove）**：删除 Header。
- **启用开关**：规则停用后不会下发。
- **高级条件**：进一步限定规则作用范围。

规则行中的操作按钮会按“设置 → 追加 → 移除”循环切换。Header 名称和值会根据历史输入提供自动补全建议。

### 7.2 请求 Cookie 追加

“新增 Cookie（请求追加）”需要填写 Cookie 名和值，扩展会把它编译为：

```http
Cookie: name=value
```

它使用追加操作，不会提供 set/remove 切换。若目标站点已有同名 Cookie，最终行为还取决于浏览器对 Cookie 请求头的处理。

### 7.3 响应 Set-Cookie 追加

“新增 Set-Cookie（响应追加）”需要填写 Cookie 名和值，扩展会把它编译为：

```http
Set-Cookie: name=value
```

如果需要 `Path`、`Domain`、`Secure`、`SameSite` 等属性，可以把它们写入值中，例如：

```text
abc; Path=/; Secure; SameSite=None
```

### 7.4 Redirect / URL 重写

Redirect 规则包含来源和目标：

- **普通模式**：
  - 来源使用 DNR URL Filter，例如 `*://*.example.com/old/*`；
  - 目标必须是完整 URL，例如 `https://example.com/new/`。
- **正则模式**：
  - 在高级条件中启用“使用正则”；
  - 来源填写正则，例如 `^https?://example\.com/old/(.*)`；
  - 目标可以使用反向引用，例如 `https://example.com/new/\1`。

正则 Redirect 必须提供有效的来源正则。只填写目标或使用无效正则时，规则不会注册，并会显示警告。

### 7.5 启用、停用、删除与排序

- 每条规则右侧的复选框控制该规则是否启用。
- 分组标题右侧的复选框可以启用或停用整组规则。
- 删除按钮会立即删除规则。
- 完整设置页和展开后的编辑器支持在同一规则分组中拖拽排序。

## 8. Filter：限定作用范围

### 8.1 组合规则

Filter 的组合逻辑如下：

- **不同类型之间原则上是 AND**：Tab、域名、URL 正则、排除 URL、请求方法必须同时满足；但 Tab Filter 与正则 URL 条件受浏览器 DNR 限制，不能同时落在同一条最终规则上，详见下文。
- **同类型多项之间是 OR**：例如配置两个域名时，匹配任一域名即可。
- **Profile Filter 与单条规则高级条件也是 AND**。
- 没有任何启用且非空的 Profile Filter 时，规则仅受自身高级条件限制；自身也没有范围条件的启用规则会作用于全部请求。

例如：

```text
Tab 匹配 example.com
AND 请求域名匹配 api.example.com
AND 请求方法为 GET 或 POST
AND 请求 URL 不属于 excluded.example.com
```

### 8.2 Tab 过滤

Tab 过滤以标签页场景为入口，保存一个 DNR URL Filter，例如：

```text
*://*.example.com/*
```

多个启用的 Tab 条件之间是 OR。受 DNR 能力限制，最终匹配的是网络请求 URL，而不是标签页标题或固定 Tab ID。若要把规则严格限制到当前标签页，请使用顶部的“锁定到当前 Tab”。

> Tab 过滤不能应用到最终使用正则 URL 条件的规则，包括规则自身的正则和 Profile 级请求 URL 正则。浏览器 DNR 一条规则不能同时使用 `urlFilter` 和 `regexFilter`；这类组合应优先改用请求域名、请求方法或其他条件。

### 8.3 请求域名过滤

填写单个 hostname，例如：

```text
api.example.com
```

它会匹配该域名及其子域。多个域名之间是 OR。不要填写协议或路径；如果粘贴了 URL，扩展会尽量清理为域名，但直接填写 hostname 最清晰。

### 8.4 请求 URL 过滤

请求 URL 过滤使用 JavaScript 正则表达式，例如：

```regex
^https?://api\.example\.com/v\d+/
```

多个有效正则会合并为 OR。无效正则会被忽略并显示警告，其他有效正则仍可继续生效。如果所有启用的 URL 正则都无效，规则会按其他条件生效；没有其他条件时可能扩大为全局生效，因此应及时修复。

### 8.5 排除请求 URL

该过滤器虽然接受 URL 输入，但实际按 hostname 排除。例如：

```text
https://static.example.com/assets/app.js
```

会提取 `static.example.com`，并排除该域名的请求。路径部分不参与匹配。也可以直接填写 hostname。

### 8.6 请求方法过滤

支持多选：

- `CONNECT`
- `DELETE`
- `GET`
- `HEAD`
- `OPTIONS`
- `PATCH`
- `POST`
- `PUT`

可以一键全选或清空。浏览器 DNR 不支持 `TRACE`，因此 Header Ext 不提供该选项。

### 8.7 从当前页面添加 Filter

弹出窗口会为 Tab、域名、URL 正则和排除 URL 自动预填当前页面信息。完整设置页不知道当前标签页上下文，因此新增项默认是空值。

空值不会形成有效作用范围。请在新增后填写内容，或关闭/删除该项。

## 9. 单条规则的高级条件

点击规则行中的漏斗图标，可设置：

### 9.1 URL 过滤

- 普通模式使用 DNR URL Filter；
- 勾选“使用正则”后使用正则；
- 留空表示不通过该字段缩小范围。

Redirect 的来源 URL 就是该规则的 URL 条件，因此高级条件面板只显示“使用正则”开关，不重复显示来源输入框。

### 9.2 包含域名

规则仅匹配指定请求域名。可输入多个域名，同组之间是 OR，并自动匹配子域。

如果 Profile 级请求域名过滤和规则级包含域名同时存在，扩展会取两者的交集。交集为空时，该规则不会下发。

### 9.3 排除域名

命中任一排除域名的请求不会应用该规则。规则级排除域名会与 Profile 级排除 URL 提取出的域名合并。

### 9.4 资源类型

可限定请求资源类型，包括：

- `main_frame`、`sub_frame`
- `xmlhttprequest`
- `script`、`stylesheet`
- `image`、`font`、`media`
- `websocket`
- `ping`
- `other`

不选择时默认覆盖浏览器支持的全部资源类型。默认集合会避开 Firefox 不支持的 Chrome 专属资源类型。

### 9.5 请求方法

可限定这条规则允许的方法。如果 Profile 级方法 Filter 也存在，扩展会取两者交集。交集为空时，该规则不会下发。

### 9.6 正则条件冲突

一条 DNR 规则只能使用一个 `regexFilter`。如果规则自身使用正则，同时 Profile 又配置请求 URL 正则，Profile 正则无法叠加到该规则，界面会显示冲突警告。

解决方式：

- 把两个正则合并到单条规则的正则中；
- 或把 Profile 级范围改成域名、方法、Tab 等其他过滤器；
- 或拆分为不同 Profile / 规则。

## 10. 变量

### 10.1 创建变量

每个 Profile 可以维护独立变量。变量包含名称、值和启用状态，例如：

```text
名称：apiToken
值：Bearer abc123
```

### 10.2 引用语法

使用双花括号引用：

```text
{{apiToken}}
```

支持在以下字段中使用：

- Header 名称和值；
- Cookie 名称和值；
- Redirect 来源和目标；
- 规则级 URL Filter；
- 规则级包含 / 排除域名；
- Profile 级 Tab、域名、请求 URL 和排除 URL Filter。

变量会在规则下发给浏览器之前替换。变量不会跨 Profile 共享。

### 10.3 同名变量

如果存在多个启用的同名变量，列表中靠后的变量生效，前面的同名变量会显示“已被覆盖”警告。

### 10.4 未定义变量

规则或 Profile Filter 引用了不存在、为空或未启用的变量时：

- 对单条规则：该规则不会下发；
- 对 Profile 级 Filter：为了避免范围意外扩大，该 Profile 的规则不会下发；
- 界面会在对应行或分组显示“变量未定义”警告。

## 11. 一键模板

模板会把预设规则追加到当前 Profile，不会覆盖已有规则。

### 11.1 移除 CSP

添加两条响应头移除规则：

- `Content-Security-Policy`
- `Content-Security-Policy-Report-Only`

适合调试内联脚本或受 CSP 限制的页面。请只在明确了解风险时使用。

### 11.2 放开 CORS

添加以下响应头：

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH`
- `Access-Control-Allow-Headers: *`
- `Access-Control-Allow-Credentials: true`

这是便于调试的客户端响应头修改，不会改变服务器是否真正处理预检请求，也不能解决所有 CORS 场景。

### 11.3 移除 X-Frame-Options

删除响应头 `X-Frame-Options`，用于调试 iframe 嵌入。页面仍可能受到 CSP `frame-ancestors` 的限制。

### 11.4 自定义 User-Agent

添加一条设置请求头 `User-Agent` 的规则。浏览器可能对部分受保护请求头施加额外限制，实际结果以 Network 面板为准。

### 11.5 禁用缓存

添加请求头：

- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`

如需确保只影响目标站点，请在应用模板后添加 Profile Filter 或单条规则高级条件。

## 12. 导入、分享与备份

### 12.1 分享 Profile

点击“分享”后：

1. 选择一个或多个 Profile；
2. 选择“复制 JSON”或“下载文件”；
3. 下载文件名默认为 `header-ext-config.json`。

导出格式的 schema 为 `header-ext.v1`。导出的内容包括所选 Profile，以及与这些 Profile 有关的部分启用状态。

### 12.2 导入配置

导入支持：

- 粘贴 Header Ext JSON；
- 从 `.json` 文件导入。

Firefox 弹出窗口打开系统文件选择器时存在生命周期限制，因此会引导到完整设置页完成文件导入。

### 12.3 合并行为

导入采用**合并**而不是覆盖：

- 现有 Profile 保留；
- 导入 Profile 会生成新的内部 ID；
- 重名 Profile 会自动追加序号；
- 导入内容中标记为始终启用的 Profile，会在合并后继续保持始终启用；
- 导入内容不会强制覆盖当前 Profile、全局暂停、语言、主题或 Tab 锁定状态。

导入数据中不合法的 Profile 会被跳过；如果没有任何有效 Profile，导入会失败并显示错误。

### 12.4 备份建议

在进行大规模编辑、批量删除或浏览器迁移前，建议：

1. 点击“分享”；
2. 全选 Profile；
3. 下载 JSON 文件；
4. 把文件保存到安全位置。

## 13. 全局暂停与 Tab 锁定

### 13.1 全局暂停

全局暂停会停止所有 Profile 的规则下发，并清空当前动态规则。配置本身不会被删除。恢复后会根据当前 Profile 和始终启用 Profile 重新编译规则。

可在以下位置操作：

- 弹出窗口顶部的暂停 / 播放按钮；
- 完整设置页顶部的“全局暂停”开关。

### 13.2 锁定到当前 Tab

点击弹出窗口顶部的锁图标后，所有生效规则会临时增加当前 Tab ID 条件：

- 只影响锁定时选中的标签页；
- 切换当前 Profile 或修改规则后仍保持锁定；
- 如果锁定到其他 Tab，按钮会显示对应 Tab ID；
- 再次在已锁定的 Tab 中点击可解除锁定。

Tab 锁定是全局临时范围，不属于某个 Profile，也不会随导出配置分享。

如果锁定的 Tab 已关闭，可在任意普通页面重新锁定，或通过提示中的 Tab ID 判断当前状态。

## 14. 状态、风险与错误提示

### 14.1 已启用与已停用

Profile 的“已启用”表示它属于当前生效组合，即当前 Profile 或始终启用 Profile。规则和过滤器各自还有独立启用开关。

### 14.2 全局作用风险

满足以下条件时，Profile 会被标记为可能作用于全部请求：

- Profile 有启用规则；
- 没有任何有效的 Profile 级 Filter；
- 至少一条启用规则自身也没有 URL、域名、资源类型或请求方法等范围条件。

纯 Redirect 规则通常自带来源 URL，因此不一定触发该提示。

风险提示不是错误，但建议为调试规则添加明确范围，避免影响其他网站。

### 14.3 潜在冲突

当多个生效 Profile 修改相同目标时，可能显示冲突：

- 相同请求头或响应头名称；
- 相同 Cookie / Set-Cookie 名称；
- 相同 Redirect 来源。

浏览器最终执行顺序还受 DNR 规则行为影响。若结果不稳定，优先把冲突规则合并到一个 Profile，或只保留一个 Profile 生效。

### 14.4 规则注册警告

规则行的黄色警告通常表示：

- Header 名称为空；
- 设置 / 追加操作缺少值；
- Redirect 缺少目标；
- 正则无效；
- 正则 Redirect 缺少正则来源；
- 引用了未定义变量；
- Profile 正则与规则正则冲突；
- 浏览器拒绝注册规则。

把鼠标移到警告图标上可查看具体原因。无效规则通常会被隔离，其他合法规则仍会继续下发。

### 14.5 Filter 警告

Filter 行或分组的警告通常表示：

- 引用了未定义变量；
- URL 正则语法无效；
- 该 Filter 无法应用。

无效 URL 正则会被单独忽略。未定义变量属于更危险的范围错误，Profile 会停止下发，避免规则意外扩大到全部请求。

## 15. 语言、主题与本地存储

### 15.1 语言

支持：

- 简体中文；
- English。

首次使用时会根据用户偏好和浏览器 UI 语言选择默认语言，之后的选择会保存到本地。

### 15.2 主题

支持：

- 浅色；
- 深色；
- 跟随系统。

弹出窗口和完整设置页会同步使用同一主题。

### 15.3 数据存储与隐私

- Profile、规则、过滤器、变量和偏好存放在浏览器 `storage.local`；
- 弹出窗口、完整设置页和后台 Service Worker 通过本地存储同步；
- 扩展不会向远端上传配置或访问日志；
- 卸载扩展或清除扩展数据可能删除本地配置，请定期导出备份。

扩展申请 `<all_urls>` 主机权限，是为了让 DNR 规则能够修改用户指定站点的请求与响应；实际作用范围由用户配置决定。

## 16. 常见使用示例

### 16.1 为测试 API 添加 Authorization

1. 新建 Profile“测试 API”。
2. 新增变量：

   ```text
   token = Bearer abc123
   ```

3. 新增请求头：

   ```text
   Authorization = {{token}}
   ```

4. 新增请求域名过滤：`api.test.example.com`。
5. 仅在需要时选中该 Profile。

### 16.2 只对当前网站禁用缓存

1. 在目标网站打开弹出窗口。
2. 创建或选择 Profile。
3. 应用“禁用缓存”模板。
4. 添加“请求域名过滤”；弹出窗口会预填当前域名。
5. 检查 Profile 不再显示“全局作用风险”。

### 16.3 重写旧接口地址

普通固定跳转：

```text
来源：*://api.example.com/v1/*
目标：https://api.example.com/v2/
```

保留路径的正则重写：

```text
来源：^https?://api\.example\.com/v1/(.*)
目标：https://api.example.com/v2/\1
使用正则：开启
```

### 16.4 只修改 XHR / Fetch 请求

1. 新增 Header 规则。
2. 打开该规则的高级条件。
3. 在资源类型中只选择 `xmlhttprequest`。
4. 按需再添加请求域名或方法条件。

### 16.5 公共规则与场景规则叠加

1. 创建 Profile“公共调试”，放置公共 Header，并设为始终启用。
2. 创建 Profile“环境 A”和“环境 B”，分别配置域名、Token 和重定向。
3. 在 A / B 之间切换时，“公共调试”会一直生效。
4. 若设置页提示冲突，检查公共 Profile 是否修改了环境 Profile 中相同的 Header。

## 17. 故障排查

### 17.1 修改没有生效

依次检查：

1. 是否全局暂停；
2. 目标 Profile 是否是当前 Profile 或始终启用 Profile；
3. 规则右侧复选框是否启用；
4. Filter 和高级条件是否真的匹配请求；
5. 是否锁定到了其他 Tab；
6. 规则是否有黄色警告；
7. 修改后是否重新发起了请求或刷新了页面；
8. 浏览器是否限制了目标 Header 或响应行为。

建议在开发者工具 Network 面板中查看实际请求和响应，而不是只观察页面表现。

### 17.2 规则作用到了其他网站

- 检查 Profile 是否显示“全局作用风险”；
- 添加请求域名、Tab 或 URL Filter；
- 检查空 Filter：空值不会形成有效范围；
- 检查无效 Profile URL 正则是否被忽略；
- 检查是否有始终启用 Profile 同时生效。

### 17.3 Profile 切换后旧规则仍然生效

旧 Profile 可能被设为始终启用。检查左侧 Profile 列表中的图钉状态，并在右侧“生效 Profile”列表确认当前组合。

### 17.4 正则 Redirect 不工作

确认：

- 已开启“使用正则”；
- 来源是有效正则；
- 目标已填写；
- 目标中的反向引用使用 `\1`、`\2` 等形式；
- Profile 级 URL 正则没有与规则正则冲突；
- 正则符合浏览器 DNR 支持的语法范围。

### 17.5 导入失败

导入文件必须：

- 是有效 JSON；
- `schema` 为 `header-ext.v1`；
- 包含至少一个有效 Profile。

如果只想分享少数 Profile，请使用扩展内置“分享”功能生成文件，不要手动删除未知字段。

### 17.6 浏览器规则状态异常

如果配置正确但规则仍未生效：

1. 打开完整设置页；
2. 点击“重新初始化规则”；
3. 等待成功提示；
4. 重新加载目标页面并检查请求。

该操作会让后台重新读取本地状态、清理并重建 DNR 注册关系，不会删除 Profile 配置。

### 17.7 Firefox 无法在弹出窗口导入文件

这是弹出窗口在打开系统文件选择器时可能被卸载导致的兼容问题。Header Ext 会引导到完整设置页，请在那里选择文件导入。

## 18. 浏览器与 DNR 限制

Header Ext 基于浏览器 DNR API，因此存在以下边界：

- 规则只能作用于浏览器允许扩展处理的网络请求；
- 浏览器内部页面、扩展商店页面和部分受保护请求可能不允许修改；
- 某些受保护 Header 可能被浏览器忽略或重写；
- 修改响应头不等于改变服务器实际行为，例如 CORS 预检仍由服务器处理；
- 排除请求 URL 当前按 hostname 生效，不按路径生效；
- Tab 过滤最终匹配请求 URL，不匹配标签页标题或固定 Tab ID；固定标签页范围应使用 Tab 锁定；
- 同一条 DNR 规则不能同时使用普通 `urlFilter` 和 `regexFilter`；
- Profile URL 正则与规则自身正则无法直接叠加；
- DNR 请求方法不支持 `TRACE`；
- Firefox 不支持 Chrome 的全部资源类型，扩展使用的默认资源类型集合会避开已知不兼容项；
- 正则需要同时满足 JavaScript 语法和浏览器 DNR 的规则约束，复杂表达式可能被浏览器拒绝；
- 浏览器对动态规则数量有限制。配置大量 Profile、Tab 条件和规则时，可能更快触及上限，因为一条源规则可能展开为多条 DNR 规则。

遇到浏览器拒绝注册时，Header Ext 会尽量隔离问题规则并显示警告。应优先简化条件、减少重复规则，并通过“重新初始化规则”重建状态。
