import type { HeaderRule, RuleKind } from "@/src/domain";

export function isCookieRule(kind: RuleKind): boolean {
  return kind === "cookie-request-append" || kind === "cookie-response-append";
}

export function getGroupTitleKey(
  kind: RuleKind,
  headerTarget: "request" | "response",
): string {
  if (kind === "cookie-request-append") {
    return "rule.group.cookieRequestAppend";
  }
  if (kind === "cookie-response-append") {
    return "rule.group.cookieResponseAppend";
  }
  if (kind === "redirect") return "rule.group.redirect";
  return `rule.targetOption.${headerTarget}`;
}

export function getAddLabelKey(kind: RuleKind): string {
  if (kind === "cookie-request-append") {
    return "rule.addCookieRequestItem";
  }
  if (kind === "cookie-response-append") {
    return "rule.addCookieResponseItem";
  }
  if (kind === "redirect") return "rule.addRedirectItem";
  return "rule.addRule";
}

export function buildReorderedRuleIds(
  rules: HeaderRule[],
  fromId: string,
  toId: string,
): string[] {
  const ruleIds = rules.map((rule) => rule.id);
  const fromIndex = ruleIds.indexOf(fromId);
  const toIndex = ruleIds.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return ruleIds;
  }

  const next = [...ruleIds];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return ruleIds;
  next.splice(toIndex, 0, moved);
  return next;
}

export function hasAdvancedConditions(
  rule: HeaderRule,
  isRedirect: boolean,
): boolean {
  const condition = rule.condition ?? {};
  return (
    (!isRedirect && !!condition.urlFilter) ||
    !!condition.includedDomains?.length ||
    !!condition.excludedDomains?.length ||
    !!condition.resourceTypes?.length ||
    !!condition.requestMethods?.length
  );
}
