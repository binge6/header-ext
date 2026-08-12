// UserRule -> DNR Rule 编译器

import type {
  HeaderRule,
  Profile,
  ProfileVariable,
  ResourceType,
  TabFilter,
} from "./types";
import { SUPPORTED_REQUEST_METHODS } from "./types";
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

// DNR 支持的请求方法集合（小写），用于过滤非法枚举避免整批规则被拒
const SUPPORTED_METHOD_SET = new Set<string>(SUPPORTED_REQUEST_METHODS);
const VARIABLE_TOKEN_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

interface VariableResolution {
  value: string;
  missing: string[];
}

function buildVariableMap(
  variables: ProfileVariable[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const variable of variables ?? []) {
    const name = variable.name.trim();
    if (variable.enabled && name) map.set(name, variable.value);
  }
  return map;
}

function resolveVariables(
  value: string | undefined,
  variables: Map<string, string>,
): VariableResolution {
  if (!value) return { value: value ?? "", missing: [] };
  const missing = new Set<string>();
  const next = value.replace(VARIABLE_TOKEN_RE, (match, rawName: string) => {
    const name = rawName.trim();
    if (!variables.has(name)) {
      missing.add(name);
      return match;
    }
    return variables.get(name) ?? "";
  });
  return { value: next, missing: Array.from(missing) };
}

function resolveVariableList(
  values: string[] | undefined,
  variables: Map<string, string>,
): { values?: string[]; missing: string[] } {
  if (!values?.length) return { missing: [] };
  const missing = new Set<string>();
  const next = values.map((value) => {
    const resolved = resolveVariables(value, variables);
    resolved.missing.forEach((name) => missing.add(name));
    return resolved.value;
  });
  return { values: next, missing: Array.from(missing) };
}

function formatMissingVariables(names: string[]): string {
  return `变量未定义：${Array.from(new Set(names)).join(", ")}`;
}

function cleanDomains(domains: string[] | undefined): string[] {
  return (domains ?? []).map((domain) => domain.trim()).filter(Boolean);
}

function isSameOrSubdomain(domain: string, scope: string): boolean {
  const normalizedDomain = domain.toLowerCase();
  const normalizedScope = scope.toLowerCase();
  return (
    normalizedDomain === normalizedScope ||
    normalizedDomain.endsWith(`.${normalizedScope}`)
  );
}

function intersectDomainScopes(left: string[], right: string[]): string[] {
  const result = new Set<string>();
  for (const leftDomain of left) {
    for (const rightDomain of right) {
      if (isSameOrSubdomain(leftDomain, rightDomain)) {
        result.add(leftDomain);
      } else if (isSameOrSubdomain(rightDomain, leftDomain)) {
        result.add(rightDomain);
      }
    }
  }
  return Array.from(result);
}

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
  ctx: CompileContext,
  variables: Map<string, string>,
): { rule?: DnrRule; error?: string } {
  const kind = rule.kind ?? "header";
  const shouldResolveName = kind !== "redirect";
  const shouldResolveValue = kind !== "header" || rule.action !== "remove";
  const resolvedName = shouldResolveName
    ? resolveVariables(rule.name, variables)
    : { value: rule.name, missing: [] };
  const resolvedValue = shouldResolveValue
    ? resolveVariables(rule.value, variables)
    : { value: rule.value, missing: [] };
  const resolvedUrlFilter = resolveVariables(
    rule.condition?.urlFilter,
    variables,
  );
  const resolvedIncludedDomains = resolveVariableList(
    rule.condition?.includedDomains,
    variables,
  );
  const resolvedExcludedDomains = resolveVariableList(
    rule.condition?.excludedDomains,
    variables,
  );
  const missingVariables = [
    ...resolvedName.missing,
    ...resolvedValue.missing,
    ...resolvedUrlFilter.missing,
    ...resolvedIncludedDomains.missing,
    ...resolvedExcludedDomains.missing,
  ];
  if (missingVariables.length) {
    return { error: formatMissingVariables(missingVariables) };
  }

  const resolvedRule: HeaderRule = {
    ...rule,
    name: resolvedName.value,
    value: resolvedValue.value,
    condition: {
      ...rule.condition,
      urlFilter: resolvedUrlFilter.value,
      includedDomains: resolvedIncludedDomains.values,
      excludedDomains: resolvedExcludedDomains.values,
    },
  };
  const action = buildAction(resolvedRule);
  if (!action) {
    const kind = resolvedRule.kind ?? "header";
    return {
      error:
        kind === "redirect"
          ? "redirect 目标 URL 不能为空"
          : "rule.name / value 不能为空",
    };
  }

  const cond = resolvedRule.condition ?? {};
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

  if (cond.includedDomains?.length) {
    const cleaned = cleanDomains(cond.includedDomains);
    if (cleaned.length) condition.requestDomains = cleaned;
  }

  if (cond.excludedDomains?.length) {
    const cleaned = cleanDomains(cond.excludedDomains);
    if (cleaned.length) condition.excludedRequestDomains = cleaned;
  }

  if (cond.resourceTypes?.length)
    condition.resourceTypes =
      cond.resourceTypes as DnrRule["condition"]["resourceTypes"];
  else
    condition.resourceTypes =
      ALL_RESOURCE_TYPES as DnrRule["condition"]["resourceTypes"];
  if (cond.requestMethods?.length) {
    // 过滤掉 DNR 不支持的方法（如 trace），避免非法枚举导致整批规则被拒
    const methods = cond.requestMethods
      .map((m) => m.toLowerCase())
      .filter((m) => SUPPORTED_METHOD_SET.has(m));
    if (methods.length)
      condition.requestMethods =
        methods as DnrRule["condition"]["requestMethods"];
  }

  if (cond.tabIds?.length) {
    condition.tabIds = cond.tabIds;
  } else if (ctx.lockedTabId != null) {
    condition.tabIds = [ctx.lockedTabId];
  }

  // regexSubstitution 型重定向必须搭配 regexFilter（DNR 契约）。
  // 若开启了正则重定向但没有有效的正则 urlFilter，判定为编译错误，
  // 否则会产出无 regexFilter 的非法规则，导致 updateDynamicRules 整批被拒。
  if (
    action.type === "redirect" &&
    action.redirect?.regexSubstitution &&
    !condition.regexFilter
  ) {
    return { error: "正则重定向需要提供正则匹配条件（URL 正则）" };
  }

  const dnrRule: DnrRule = {
    id: getDnrId(resolvedRule.id),
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
  // 规则已是 regex 模式：DNR 一条规则只能有一个 url/regex 条件，无法再用
  // tab filter 的 urlFilter 收紧。此时展开成 N 条只会得到 N 条完全相同的规则
  // （对 Cookie append 等会重复生效 N 次，其余则浪费规则配额），故不展开。
  if (base.condition.regexFilter) return [base];
  return enabled.map((f) => ({
    ...base,
    id: nextDnrId++,
    condition: {
      ...base.condition,
      // 用 tab filter 收紧 urlFilter
      urlFilter: f.urlFilter,
    },
  }));
}

export function compileRules(
  rules: HeaderRule[],
  ctx: CompileContext = {},
): CompileResult {
  const out: DnrRule[] = [];
  const errors: CompileError[] = [];
  const variables = buildVariableMap(ctx.profile?.variables);
  let hasProfileVariableError = false;
  const tabFilterMissing = new Set<string>();
  const tabFilters = (ctx.profile?.tabFilters ?? []).map((filter) => {
    const resolved = resolveVariables(filter.urlFilter, variables);
    resolved.missing.forEach((name) => tabFilterMissing.add(name));
    return { ...filter, urlFilter: resolved.value };
  });
  if (tabFilterMissing.size) {
    hasProfileVariableError = true;
    errors.push({
      ruleId: "__tab_filter__",
      message: formatMissingVariables(Array.from(tabFilterMissing)),
    });
  }
  const domainFilters = ctx.profile?.domainFilters ?? [];
  const urlFilters = ctx.profile?.urlFilters ?? [];
  const excludeUrlFilters = ctx.profile?.excludeUrlFilters ?? [];
  const methodFilters = ctx.profile?.methodFilters ?? [];
  const allowedMethods = methodFilters
    .filter((m) => m.enabled && m.method?.trim())
    .map((m) => m.method.trim().toLowerCase())
    // 过滤 DNR 不支持的方法（如 trace），避免非法枚举导致整批规则被拒
    .filter((m) => SUPPORTED_METHOD_SET.has(m));
  const allowedDomainMissing = new Set<string>();
  const allowedDomains = cleanDomains(
    domainFilters
      .filter((d) => d.enabled && d.domain?.trim())
      .map((d) => {
        const resolved = resolveVariables(d.domain.trim(), variables);
        resolved.missing.forEach((name) => allowedDomainMissing.add(name));
        return resolved.value.trim();
      }),
  );
  if (allowedDomainMissing.size) {
    hasProfileVariableError = true;
    errors.push({
      ruleId: "__domain_filter__",
      message: formatMissingVariables(Array.from(allowedDomainMissing)),
    });
  }
  const excludedUrlMissing = new Set<string>();
  const excludedDomains = excludeUrlFilters
    .filter((u) => u.enabled && u.url?.trim())
    .map((u) => {
      const resolved = resolveVariables(u.url.trim(), variables);
      resolved.missing.forEach((name) => excludedUrlMissing.add(name));
      const v = resolved.value.trim();
      // 优先按 URL 解析提取 hostname；不是合法 URL 则按域名直传
      try {
        return new URL(v).hostname || v;
      } catch {
        return v;
      }
    })
    .filter(Boolean);
  if (excludedUrlMissing.size) {
    hasProfileVariableError = true;
    errors.push({
      ruleId: "__exclude_url_filter__",
      message: formatMissingVariables(Array.from(excludedUrlMissing)),
    });
  }
  // 多个 URL 正则用 (?:a)|(?:b) 合并为单个 regex（DNR 仅支持单个 regexFilter）
  const urlRegexMissing = new Set<string>();
  const enabledRegexes = urlFilters
    .filter((f) => f.enabled && f.regex?.trim())
    .map((f) => {
      const resolved = resolveVariables(f.regex.trim(), variables);
      resolved.missing.forEach((name) => urlRegexMissing.add(name));
      return resolved.value.trim();
    });
  if (urlRegexMissing.size) {
    hasProfileVariableError = true;
    errors.push({
      ruleId: "__url_filter__",
      message: formatMissingVariables(Array.from(urlRegexMissing)),
    });
  }
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
  if (hasProfileVariableError) return { rules: [], errors };

  for (const r of rules) {
    if (!r.enabled) continue;
    const { rule, error } = compileOne(r, ctx, variables);
    if (error) errors.push({ ruleId: r.id, message: error });
    if (!rule) continue;

    // 应用 Profile 级请求域名白名单（DNR requestDomains 自动匹配子域）
    if (allowedDomains.length) {
      const existing = rule.condition.requestDomains ?? [];
      const requestDomains = existing.length
        ? intersectDomainScopes(existing, allowedDomains)
        : allowedDomains;
      if (!requestDomains.length) continue;
      rule.condition = { ...rule.condition, requestDomains };
    }
    // 应用 Profile 级排除域名黑名单（与规则自带的 excludedRequestDomains 合并）
    if (excludedDomains.length) {
      const existing = rule.condition.excludedRequestDomains ?? [];
      rule.condition = {
        ...rule.condition,
        excludedRequestDomains: Array.from(
          new Set([...existing, ...excludedDomains]),
        ),
      };
    }
    // 应用 Profile 级 URL 正则白名单：覆盖 urlFilter，转为 regexFilter。
    // 但规则自身已有 regexFilter 时不能覆盖：
    //   - 正则重定向（regexSubstitution）的反向引用依赖自身 regexFilter 的捕获组，
    //     覆盖会使 \1/$1 指向 mergedRegex 的分组，导致重定向到错误地址；
    //   - DNR 一条规则只能有一个 regexFilter，无法与 profile 正则做 AND。
    // 因此对已有 regexFilter 的规则跳过覆盖，并记一条编译错误提示作用域未收窄。
    if (mergedRegex) {
      if (rule.condition.regexFilter) {
        errors.push({
          ruleId: r.id,
          message: "规则自身已使用正则匹配，Profile 级 URL 正则过滤未对其生效",
        });
      } else {
        const { urlFilter: _omit, ...rest } = rule.condition;
        void _omit;
        rule.condition = {
          ...rest,
          regexFilter: mergedRegex,
        };
      }
    }

    // 应用 Profile 级请求方法白名单（与规则自带的 requestMethods 取交集）
    if (allowedMethods.length) {
      const ruleMethods = rule.condition.requestMethods;
      const merged = ruleMethods?.length
        ? ruleMethods.filter((m) => allowedMethods.includes(m))
        : allowedMethods;
      // 交集为空：规则自带方法与 profile 白名单无交集，该规则不匹配任何请求，跳过。
      // DNR 不接受空的 requestMethods 数组，注入会导致整批规则被拒。
      if (!merged.length) continue;
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
