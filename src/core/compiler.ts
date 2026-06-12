// UserRule -> DNR Rule 编译器

import type { HeaderRule, Profile, ResourceType, TabFilter } from "./types";
import type { DnrRule, DnrHeaderAction } from "./browserApi";

export interface CompileError {
  ruleId: string;
  message: string;
}

export interface CompileResult {
  rules: DnrRule[];
  errors: CompileError[];
}

export interface CompileContext {
  // 兼容老调用，保留字段
  lockedTabId?: number | null;
  // 当前生效 profile，用于读取 profile 级 tabFilters
  profile?: Profile;
}

const DNR_BASE_PRIORITY = 1;

// DNR 默认行为：省略 resourceTypes 时匹配「除 main_frame 外的所有类型」，
// 导致页面文档（main_frame）请求不被命中。这里显式覆盖全部资源类型，
// 使未指定资源类型的规则也能作用于初始 document 请求。
// 注：`webtransport` / `webbundle` 是 Chrome 专属类型，Firefox DNR 不识别，
// 若传入会导致 updateDynamicRules 整条 reject（全部规则注册失败），故 Firefox 构建时剔除。
const ALL_RESOURCE_TYPES: ResourceType[] = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "other",
  ...(import.meta.env.FIREFOX
    ? []
    : (["webtransport", "webbundle"] as ResourceType[])),
];

const idMap = new Map<string, number>();
let nextDnrId = 1;

export function getDnrId(ruleId: string): number {
  let id = idMap.get(ruleId);
  if (id == null) {
    id = nextDnrId++;
    idMap.set(ruleId, id);
  }
  return id;
}

export function clearIdMap(): void {
  idMap.clear();
  nextDnrId = 1;
}

// 把一条 HeaderRule 转换为底层 DNR 的 header / cookie 操作
function buildHeaderAction(rule: HeaderRule): DnrHeaderAction | null {
  const kind = rule.kind ?? "header";
  if (kind === "cookie-request-append") {
    if (!rule.name?.trim() || !rule.value) return null;
    return {
      header: "Cookie",
      operation: "append",
      value: `${rule.name.trim()}=${rule.value}`,
    };
  }
  if (kind === "cookie-response-append") {
    if (!rule.name?.trim() || !rule.value) return null;
    return {
      header: "Set-Cookie",
      operation: "append",
      value: `${rule.name.trim()}=${rule.value}`,
    };
  }
  if (!rule.name?.trim()) return null;
  if (rule.action !== "remove" && !rule.value) return null;
  return {
    header: rule.name.trim(),
    operation: rule.action,
    ...(rule.action !== "remove" ? { value: rule.value } : {}),
  };
}

function ruleTarget(rule: HeaderRule): "request" | "response" {
  const kind = rule.kind ?? "header";
  if (kind === "cookie-request-append") return "request";
  if (kind === "cookie-response-append") return "response";
  return rule.target;
}

// 把一条规则转换为 DNR action 部分
// header / cookie-* => modifyHeaders；redirect => redirect
function buildAction(rule: HeaderRule): DnrRule["action"] | null {
  const kind = rule.kind ?? "header";
  if (kind === "redirect") {
    const dest = rule.value?.trim();
    if (!dest) return null;
    if (rule.condition?.useRegex) {
      // 正则模式 + value 含 \1 / $1 时支持反向引用 → regexSubstitution
      return {
        type: "redirect",
        redirect: { regexSubstitution: dest },
      };
    }
    return {
      type: "redirect",
      redirect: { url: dest },
    };
  }
  const headerAction = buildHeaderAction(rule);
  if (!headerAction) return null;
  const target = ruleTarget(rule);
  return {
    type: "modifyHeaders",
    ...(target === "request"
      ? { requestHeaders: [headerAction] }
      : { responseHeaders: [headerAction] }),
  };
}

function compileOne(
  rule: HeaderRule,
  ctx: CompileContext
): { rule?: DnrRule; error?: string } {
  const action = buildAction(rule);
  if (!action) {
    const kind = rule.kind ?? "header";
    return {
      error:
        kind === "redirect"
          ? "redirect 目标 URL 不能为空"
          : "rule.name / value 不能为空",
    };
  }

  const cond = rule.condition ?? {};
  const condition: DnrRule["condition"] = {};

  if (cond.urlFilter) {
    if (cond.useRegex) {
      try {
        new RegExp(cond.urlFilter);
      } catch {
        return { error: "正则表达式无效" };
      }
      condition.regexFilter = cond.urlFilter;
    } else {
      condition.urlFilter = cond.urlFilter;
    }
  } else {
    condition.urlFilter = "*";
  }

  if (cond.excludedDomains?.length) {
    const cleaned = cond.excludedDomains.map((d) => d.trim()).filter(Boolean);
    if (cleaned.length) condition.excludedRequestDomains = cleaned;
  }

  if (cond.resourceTypes?.length)
    condition.resourceTypes =
      cond.resourceTypes as DnrRule["condition"]["resourceTypes"];
  else
    condition.resourceTypes =
      ALL_RESOURCE_TYPES as DnrRule["condition"]["resourceTypes"];
  if (cond.requestMethods?.length)
    condition.requestMethods = cond.requestMethods.map((m) =>
      m.toLowerCase()
    ) as DnrRule["condition"]["requestMethods"];

  if (cond.tabIds?.length) {
    condition.tabIds = cond.tabIds;
  } else if (ctx.lockedTabId != null) {
    condition.tabIds = [ctx.lockedTabId];
  }

  const dnrRule: DnrRule = {
    id: getDnrId(rule.id),
    priority: DNR_BASE_PRIORITY,
    action,
    condition,
  };

  return { rule: dnrRule };
}

// Profile 级 Tab filter：DNR 不支持多个 urlFilter 的 OR，因此对每条业务规则
// 按 enabled 的 tabFilters 数量做"展开"，每个 filter 生成一条独立 DNR 规则
function expandWithTabFilters(base: DnrRule, filters: TabFilter[]): DnrRule[] {
  const enabled = filters.filter((f) => f.enabled && f.urlFilter?.trim());
  if (!enabled.length) return [base];
  return enabled.map((f) => ({
    ...base,
    id: nextDnrId++,
    condition: base.condition.regexFilter
      ? // 已经是 regex 模式：保留原 regex，不再叠加 tab filter（DNR 限制）
        { ...base.condition }
      : {
          ...base.condition,
          // 用 tab filter 收紧 urlFilter
          urlFilter: f.urlFilter,
        },
  }));
}

export function compileRules(
  rules: HeaderRule[],
  ctx: CompileContext = {}
): CompileResult {
  const out: DnrRule[] = [];
  const errors: CompileError[] = [];
  const tabFilters = ctx.profile?.tabFilters ?? [];
  const domainFilters = ctx.profile?.domainFilters ?? [];
  const urlFilters = ctx.profile?.urlFilters ?? [];
  const excludeUrlFilters = ctx.profile?.excludeUrlFilters ?? [];
  const methodFilters = ctx.profile?.methodFilters ?? [];
  const allowedMethods = methodFilters
    .filter((m) => m.enabled && m.method?.trim())
    .map((m) => m.method.trim().toLowerCase());
  const allowedDomains = domainFilters
    .filter((d) => d.enabled && d.domain?.trim())
    .map((d) => d.domain.trim());
  const excludedDomains = excludeUrlFilters
    .filter((u) => u.enabled && u.url?.trim())
    .map((u) => {
      const v = u.url.trim();
      // 优先按 URL 解析提取 hostname；不是合法 URL 则按域名直传
      try {
        return new URL(v).hostname || v;
      } catch {
        return v;
      }
    })
    .filter(Boolean);
  // 多个 URL 正则用 (?:a)|(?:b) 合并为单个 regex（DNR 仅支持单个 regexFilter）
  const enabledRegexes = urlFilters
    .filter((f) => f.enabled && f.regex?.trim())
    .map((f) => f.regex.trim());
  let mergedRegex: string | null = null;
  if (enabledRegexes.length) {
    try {
      enabledRegexes.forEach((r) => new RegExp(r));
      mergedRegex =
        enabledRegexes.length === 1
          ? enabledRegexes[0]
          : enabledRegexes.map((r) => `(?:${r})`).join("|");
    } catch {
      errors.push({
        ruleId: "__url_filter__",
        message: "URL 过滤正则表达式无效",
      });
    }
  }

  for (const r of rules) {
    if (!r.enabled) continue;
    const { rule, error } = compileOne(r, ctx);
    if (error) errors.push({ ruleId: r.id, message: error });
    if (!rule) continue;

    // 应用 Profile 级请求域名白名单（DNR requestDomains 自动匹配子域）
    if (allowedDomains.length) {
      rule.condition = { ...rule.condition, requestDomains: allowedDomains };
    }
    // 应用 Profile 级排除域名黑名单（与规则自带的 excludedRequestDomains 合并）
    if (excludedDomains.length) {
      const existing = rule.condition.excludedRequestDomains ?? [];
      rule.condition = {
        ...rule.condition,
        excludedRequestDomains: Array.from(
          new Set([...existing, ...excludedDomains])
        ),
      };
    }
    // 应用 Profile 级 URL 正则白名单：覆盖 urlFilter，转为 regexFilter
    if (mergedRegex) {
      const { urlFilter: _omit, ...rest } = rule.condition;
      void _omit;
      rule.condition = {
        ...rest,
        regexFilter: mergedRegex,
      };
    }

    // 应用 Profile 级请求方法白名单（与规则自带的 requestMethods 取交集）
    if (allowedMethods.length) {
      const ruleMethods = rule.condition.requestMethods;
      const merged = ruleMethods?.length
        ? ruleMethods.filter((m) => allowedMethods.includes(m))
        : allowedMethods;
      rule.condition = {
        ...rule.condition,
        requestMethods: merged as DnrRule["condition"]["requestMethods"],
      };
    }

    if (tabFilters.length) {
      out.push(...expandWithTabFilters(rule, tabFilters));
    } else {
      out.push(rule);
    }
  }
  return { rules: out, errors };
}
