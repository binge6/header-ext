// 公共领域类型定义

export type HeaderAction = "set" | "append" | "remove";
export type Target = "request" | "response";

// 规则类型：header = 普通头部修改；cookie-* = Cookie 便捷模式
// redirect = URL 重定向 / 重写（DNR redirect action）
// cookie 模式下：name = cookie 名，value = cookie 值；编译器自动合成 Cookie / Set-Cookie 头
export type RuleKind =
  | "header"
  | "cookie-request-append"
  | "cookie-response-append"
  | "redirect";

// DNR ResourceType（避免直接依赖 chrome 命名空间，便于跨端）
export type ResourceType =
  | "main_frame"
  | "sub_frame"
  | "stylesheet"
  | "script"
  | "image"
  | "font"
  | "object"
  | "xmlhttprequest"
  | "ping"
  | "csp_report"
  | "media"
  | "websocket"
  | "webtransport"
  | "webbundle"
  | "other";

export interface RuleCondition {
  // include 模式：urlFilter 是 DNR pattern；当 useRegex 为 true 时按正则解释
  urlFilter?: string;
  useRegex?: boolean;
  // exclude：DNR 仅支持域名级 exclude（excludedRequestDomains），暂不支持 pattern exclude
  excludedDomains?: string[];
  resourceTypes?: ResourceType[];
  requestMethods?: string[];
  // 锁定 Tab 时由编译器注入，用户层不直接持久化
  tabIds?: number[];
}

export interface HeaderRule {
  id: string; // 业务 nanoid
  enabled: boolean;
  // 规则类型；为兼容 P0 老数据，缺省视为 "header"
  kind?: RuleKind;
  target: Target;
  action: HeaderAction;
  name: string;
  value: string;
  condition: RuleCondition;
}

// Tab 过滤项：基于 URL 的白名单（DNR 仅能按域名/URL 匹配，无法按 tab title）
export interface TabFilter {
  id: string;
  enabled: boolean;
  // 任一匹配即生效；空字符串忽略
  urlFilter: string;
}

// 请求域名过滤项：基于 DNR requestDomains 的请求域名白名单
export interface DomainFilter {
  id: string;
  enabled: boolean;
  // 单个域名（DNR 自动匹配子域）；空字符串忽略
  domain: string;
}

// 请求 URL 过滤项：使用正则匹配请求 URL（DNR regexFilter）
// 多项之间为 OR：合并为单个 regex 注入 condition.regexFilter
export interface UrlFilter {
  id: string;
  enabled: boolean;
  // 正则字符串；空字符串忽略
  regex: string;
}

// 排除请求 URL 过滤项：从 URL 中提取 hostname，注入 DNR excludedRequestDomains
export interface ExcludeUrlFilter {
  id: string;
  enabled: boolean;
  // URL 字符串；编译时取 hostname 反向匹配；空字符串忽略
  url: string;
}

// 请求方法过滤项：Profile 级请求方法白名单
// 注入到每条 rule 的 condition.requestMethods（与规则自带请求方法取交集）
export interface MethodFilter {
  id: string;
  enabled: boolean;
  // HTTP 方法名（不区分大小写，编译时统一小写）
  method: string;
}

export interface Profile {
  id: string;
  name: string;
  color: string;
  rules: HeaderRule[];
  // Profile 级 Tab 白名单
  tabFilters?: TabFilter[];
  // Profile 级请求域名白名单
  domainFilters?: DomainFilter[];
  // Profile 级请求 URL 正则白名单
  urlFilters?: UrlFilter[];
  // Profile 级排除请求 URL（按 hostname）黑名单
  excludeUrlFilters?: ExcludeUrlFilter[];
  // Profile 级请求方法白名单
  methodFilters?: MethodFilter[];
  createdAt: number;
  updatedAt: number;
}

export interface AppMeta {
  activeProfileId: string | null;
  // 实际参与 DNR 编译并生效的 Profile，可多选。老数据缺省时回退为当前编辑 Profile。
  enabledProfileIds?: string[];
  globalPaused: boolean;
  lockedTabId: number | null;
  language: "zh-CN" | "en-US" | null; // null 表示跟随浏览器
  // 主题模式：light / dark / system（跟随系统 prefers-color-scheme）；
  // 缺省视为 "system"，保持向后兼容
  theme?: "light" | "dark" | "system";
}

export interface AppState {
  profiles: Profile[];
  meta: AppMeta;
}
