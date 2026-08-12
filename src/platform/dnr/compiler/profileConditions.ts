import type { Profile, TabFilter } from "@/src/domain/models";
import { SUPPORTED_REQUEST_METHODS } from "@/src/domain/models";
import type { DnrRule } from "@/src/platform/browser/api";
import type { CompileError } from "./types";
import { cleanDomains, intersectDomainScopes } from "./utils";
import { formatMissingVariables, resolveVariables } from "./variables";

const SUPPORTED_METHOD_SET = new Set<string>(SUPPORTED_REQUEST_METHODS);

export interface ProfileConditions {
  tabFilters: TabFilter[];
  allowedMethods: string[];
  allowedDomains: string[];
  excludedDomains: string[];
  mergedRegex: string | null;
  hasVariableError: boolean;
}

export function compileProfileConditions(
  profile: Profile | undefined,
  variables: Map<string, string>,
  errors: CompileError[],
): ProfileConditions {
  let hasVariableError = false;

  const tabFilterMissing = new Set<string>();
  const tabFilters = (profile?.tabFilters ?? []).map((filter) => {
    const resolved = resolveVariables(filter.urlFilter, variables);
    resolved.missing.forEach((name) => tabFilterMissing.add(name));
    return { ...filter, urlFilter: resolved.value };
  });
  if (tabFilterMissing.size) {
    hasVariableError = true;
    errors.push({
      ruleId: "__tab_filter__",
      message: formatMissingVariables(Array.from(tabFilterMissing)),
    });
  }

  const allowedMethods = (profile?.methodFilters ?? [])
    .filter((filter) => filter.enabled && filter.method?.trim())
    .map((filter) => filter.method.trim().toLowerCase())
    .filter((method) => SUPPORTED_METHOD_SET.has(method));

  const allowedDomainMissing = new Set<string>();
  const allowedDomains = cleanDomains(
    (profile?.domainFilters ?? [])
      .filter((filter) => filter.enabled && filter.domain?.trim())
      .map((filter) => {
        const resolved = resolveVariables(filter.domain.trim(), variables);
        resolved.missing.forEach((name) => allowedDomainMissing.add(name));
        return resolved.value.trim();
      }),
  );
  if (allowedDomainMissing.size) {
    hasVariableError = true;
    errors.push({
      ruleId: "__domain_filter__",
      message: formatMissingVariables(Array.from(allowedDomainMissing)),
    });
  }

  const excludedUrlMissing = new Set<string>();
  const excludedDomains = (profile?.excludeUrlFilters ?? [])
    .filter((filter) => filter.enabled && filter.url?.trim())
    .map((filter) => {
      const resolved = resolveVariables(filter.url.trim(), variables);
      resolved.missing.forEach((name) => excludedUrlMissing.add(name));
      const value = resolved.value.trim();
      try {
        return new URL(value).hostname || value;
      } catch {
        return value;
      }
    })
    .filter(Boolean);
  if (excludedUrlMissing.size) {
    hasVariableError = true;
    errors.push({
      ruleId: "__exclude_url_filter__",
      message: formatMissingVariables(Array.from(excludedUrlMissing)),
    });
  }

  const urlRegexMissing = new Set<string>();
  const enabledRegexes = (profile?.urlFilters ?? [])
    .filter((filter) => filter.enabled && filter.regex?.trim())
    .map((filter) => {
      const resolved = resolveVariables(filter.regex.trim(), variables);
      resolved.missing.forEach((name) => urlRegexMissing.add(name));
      return resolved.value.trim();
    });
  if (urlRegexMissing.size) {
    hasVariableError = true;
    errors.push({
      ruleId: "__url_filter__",
      message: formatMissingVariables(Array.from(urlRegexMissing)),
    });
  }

  let mergedRegex: string | null = null;
  if (enabledRegexes.length) {
    try {
      enabledRegexes.forEach((regex) => new RegExp(regex));
      mergedRegex =
        enabledRegexes.length === 1
          ? enabledRegexes[0]
          : enabledRegexes.map((regex) => `(?:${regex})`).join("|");
    } catch {
      errors.push({
        ruleId: "__url_filter__",
        message: "URL 过滤正则表达式无效",
      });
    }
  }

  return {
    tabFilters,
    allowedMethods,
    allowedDomains,
    excludedDomains,
    mergedRegex,
    hasVariableError,
  };
}

export function applyProfileConditions(
  rule: DnrRule,
  sourceRuleId: string,
  conditions: ProfileConditions,
  errors: CompileError[],
): DnrRule | null {
  const { allowedDomains, excludedDomains, mergedRegex, allowedMethods } =
    conditions;

  if (allowedDomains.length) {
    const existingDomains = rule.condition.requestDomains ?? [];
    const requestDomains = existingDomains.length
      ? intersectDomainScopes(existingDomains, allowedDomains)
      : allowedDomains;
    if (!requestDomains.length) return null;
    rule.condition = { ...rule.condition, requestDomains };
  }

  if (excludedDomains.length) {
    const existingDomains = rule.condition.excludedRequestDomains ?? [];
    rule.condition = {
      ...rule.condition,
      excludedRequestDomains: Array.from(
        new Set([...existingDomains, ...excludedDomains]),
      ),
    };
  }

  if (mergedRegex) {
    if (rule.condition.regexFilter) {
      errors.push({
        ruleId: sourceRuleId,
        message: "规则自身已使用正则匹配，Profile 级 URL 正则过滤未对其生效",
      });
    } else {
      const { urlFilter: _urlFilter, ...condition } = rule.condition;
      void _urlFilter;
      rule.condition = { ...condition, regexFilter: mergedRegex };
    }
  }

  if (allowedMethods.length) {
    const ruleMethods = rule.condition.requestMethods;
    const requestMethods = ruleMethods?.length
      ? ruleMethods.filter((method) => allowedMethods.includes(method))
      : allowedMethods;
    if (!requestMethods.length) return null;
    rule.condition = {
      ...rule.condition,
      requestMethods: requestMethods as DnrRule["condition"]["requestMethods"],
    };
  }

  return rule;
}
