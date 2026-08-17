import type { Profile, TabFilter } from "@/src/domain/models";
import { SUPPORTED_REQUEST_METHODS } from "@/src/domain/models";
import type { DnrRule } from "@/src/platform/browser/api";
import type { CompileError } from "./types";
import { cleanDomains, intersectDomainScopes } from "./utils";
import { resolveVariables } from "./variables";

const SUPPORTED_METHOD_SET = new Set<string>(SUPPORTED_REQUEST_METHODS);

export interface ProfileConditions {
  tabFilters: TabFilter[];
  allowedMethods: string[];
  allowedDomains: string[];
  excludedDomains: string[];
  mergedRegex: string | null;
  hasFatalError: boolean;
}

export function compileProfileConditions(
  profile: Profile | undefined,
  variables: Map<string, string>,
  errors: CompileError[],
): ProfileConditions {
  let hasFatalError = false;

  const tabFilters = (profile?.tabFilters ?? []).map((filter) => {
    const resolved = resolveVariables(filter.urlFilter, variables);
    if (resolved.missing.length) {
      hasFatalError = true;
      errors.push({
        ruleId: `__tab_filter__:${filter.id}`,
        code: "missingVariables",
        params: { names: Array.from(new Set(resolved.missing)).join(", ") },
      });
    }
    return { ...filter, urlFilter: resolved.value };
  });

  const allowedMethods = (profile?.methodFilters ?? [])
    .filter((filter) => filter.enabled && filter.method?.trim())
    .map((filter) => filter.method.trim().toLowerCase())
    .filter((method) => SUPPORTED_METHOD_SET.has(method));

  const allowedDomains = cleanDomains(
    (profile?.domainFilters ?? [])
      .filter((filter) => filter.enabled && filter.domain?.trim())
      .map((filter) => {
        const resolved = resolveVariables(filter.domain.trim(), variables);
        if (resolved.missing.length) {
          hasFatalError = true;
          errors.push({
            ruleId: `__domain_filter__:${filter.id}`,
            code: "missingVariables",
            params: { names: Array.from(new Set(resolved.missing)).join(", ") },
          });
        }
        return resolved.value.trim();
      }),
  );

  const excludedDomains = (profile?.excludeUrlFilters ?? [])
    .filter((filter) => filter.enabled && filter.url?.trim())
    .map((filter) => {
      const resolved = resolveVariables(filter.url.trim(), variables);
      if (resolved.missing.length) {
        hasFatalError = true;
        errors.push({
          ruleId: `__exclude_url_filter__:${filter.id}`,
          code: "missingVariables",
          params: { names: Array.from(new Set(resolved.missing)).join(", ") },
        });
      }
      const value = resolved.value.trim();
      try {
        return new URL(value).hostname || value;
      } catch {
        return value;
      }
    })
    .filter(Boolean);

  const enabledRegexes = (profile?.urlFilters ?? [])
    .filter((filter) => filter.enabled && filter.regex?.trim())
    .map((filter) => {
      const resolved = resolveVariables(filter.regex.trim(), variables);
      if (resolved.missing.length) {
        hasFatalError = true;
        errors.push({
          ruleId: `__url_filter__:${filter.id}`,
          code: "missingVariables",
          params: { names: Array.from(new Set(resolved.missing)).join(", ") },
        });
      }
      return { filterId: filter.id, regex: resolved.value.trim() };
    });

  let mergedRegex: string | null = null;
  if (enabledRegexes.length) {
    const validRegexes: string[] = [];
    for (const { filterId, regex } of enabledRegexes) {
      try {
        new RegExp(regex);
        validRegexes.push(regex);
      } catch {
        errors.push({
          ruleId: `__url_filter__:${filterId}`,
          code: "invalidProfileRegex",
        });
      }
    }
    mergedRegex =
      validRegexes.length === 0
        ? null
        : validRegexes.length === 1
          ? (validRegexes[0] ?? null)
          : validRegexes.map((regex) => `(?:${regex})`).join("|");
  }

  return {
    tabFilters,
    allowedMethods,
    allowedDomains,
    excludedDomains,
    mergedRegex,
    hasFatalError,
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
        code: "profileRegexConflict",
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
