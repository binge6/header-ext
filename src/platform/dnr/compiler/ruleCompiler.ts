import type { HeaderRule, ResourceType, TabFilter } from "@/src/domain/models";
import { SUPPORTED_REQUEST_METHODS } from "@/src/domain/models";
import type { DnrHeaderAction, DnrRule } from "@/src/platform/browser/api";
import type { DnrErrorData } from "../errors";
import { createDnrId, getDnrId } from "./idRegistry";
import type { CompileContext } from "./types";
import { cleanDomains } from "./utils";
import { resolveVariableList, resolveVariables } from "./variables";

const DNR_BASE_PRIORITY = 1;
const SUPPORTED_METHOD_SET = new Set<string>(SUPPORTED_REQUEST_METHODS);

// Firefox DNR 不识别 webtransport / webbundle，注入会导致整批规则注册失败。
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

function getRuleTarget(rule: HeaderRule): "request" | "response" {
  const kind = rule.kind ?? "header";
  if (kind === "cookie-request-append") return "request";
  if (kind === "cookie-response-append") return "response";
  return rule.target;
}

function buildAction(rule: HeaderRule): DnrRule["action"] | null {
  const kind = rule.kind ?? "header";
  if (kind === "redirect") {
    const destination = rule.value?.trim();
    if (!destination) return null;
    if (rule.condition?.useRegex) {
      return {
        type: "redirect",
        redirect: { regexSubstitution: destination },
      };
    }
    return {
      type: "redirect",
      redirect: { url: destination },
    };
  }

  const headerAction = buildHeaderAction(rule);
  if (!headerAction) return null;
  return {
    type: "modifyHeaders",
    ...(getRuleTarget(rule) === "request"
      ? { requestHeaders: [headerAction] }
      : { responseHeaders: [headerAction] }),
  };
}

export function compileRule(
  rule: HeaderRule,
  context: CompileContext,
  variables: Map<string, string>,
): { rule?: DnrRule; error?: DnrErrorData } {
  const kind = rule.kind ?? "header";
  const resolvedName =
    kind !== "redirect"
      ? resolveVariables(rule.name, variables)
      : { value: rule.name, missing: [] };
  const resolvedValue =
    kind !== "header" || rule.action !== "remove"
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
    return {
      error: {
        code: "missingVariables",
        params: {
          names: Array.from(new Set(missingVariables)).join(", "),
        },
      },
    };
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
    const nameMissing = !resolvedRule.name?.trim();
    const valueRequired = kind !== "header" || resolvedRule.action !== "remove";
    const valueMissing = valueRequired && !resolvedRule.value;
    return {
      error:
        kind === "redirect"
          ? { code: "redirectDestinationRequired" }
          : {
              code:
                nameMissing && valueMissing
                  ? "emptyRuleDraft"
                  : nameMissing
                    ? "headerNameRequired"
                    : "headerValueRequired",
            },
    };
  }

  const sourceCondition = resolvedRule.condition ?? {};
  const condition: DnrRule["condition"] = {};

  if (sourceCondition.urlFilter) {
    if (sourceCondition.useRegex) {
      try {
        new RegExp(sourceCondition.urlFilter);
      } catch {
        return { error: { code: "invalidRuleRegex" } };
      }
      condition.regexFilter = sourceCondition.urlFilter;
    } else {
      condition.urlFilter = sourceCondition.urlFilter;
    }
  } else {
    condition.urlFilter = "*";
  }

  if (sourceCondition.includedDomains?.length) {
    const domains = cleanDomains(sourceCondition.includedDomains);
    if (domains.length) condition.requestDomains = domains;
  }
  if (sourceCondition.excludedDomains?.length) {
    const domains = cleanDomains(sourceCondition.excludedDomains);
    if (domains.length) condition.excludedRequestDomains = domains;
  }

  condition.resourceTypes = sourceCondition.resourceTypes?.length
    ? (sourceCondition.resourceTypes as DnrRule["condition"]["resourceTypes"])
    : (ALL_RESOURCE_TYPES as DnrRule["condition"]["resourceTypes"]);

  if (sourceCondition.requestMethods?.length) {
    const methods = sourceCondition.requestMethods
      .map((method) => method.toLowerCase())
      .filter((method) => SUPPORTED_METHOD_SET.has(method));
    if (methods.length) {
      condition.requestMethods =
        methods as DnrRule["condition"]["requestMethods"];
    }
  }

  if (sourceCondition.tabIds?.length) {
    condition.tabIds = sourceCondition.tabIds;
  } else if (context.lockedTabId != null) {
    condition.tabIds = [context.lockedTabId];
  }

  if (
    action.type === "redirect" &&
    action.redirect?.regexSubstitution &&
    !condition.regexFilter
  ) {
    return { error: { code: "redirectRegexConditionRequired" } };
  }

  return {
    rule: {
      id: getDnrId(resolvedRule.id),
      priority: DNR_BASE_PRIORITY,
      action,
      condition,
    },
  };
}

export function expandWithTabFilters(
  base: DnrRule,
  filters: TabFilter[],
): DnrRule[] {
  const enabledFilters = filters.filter(
    (filter) => filter.enabled && filter.urlFilter?.trim(),
  );
  if (!enabledFilters.length || base.condition.regexFilter) return [base];

  return enabledFilters.map((filter) => ({
    ...base,
    id: createDnrId(),
    condition: {
      ...base.condition,
      urlFilter: filter.urlFilter,
    },
  }));
}
