import type { TFunction } from "i18next";
import type { HeaderRule } from "@/src/domain";
import type { DnrRuleError } from "@/src/platform/dnr";

export function shouldDisplayDnrError(
  error: DnrRuleError,
  rule?: HeaderRule,
): boolean {
  if (error.code === "emptyRuleDraft") return false;
  if (error.code !== "headerFieldsRequired" || !rule) return true;
  return Boolean(rule.name.trim() || rule.value);
}

export function formatDnrError(error: DnrRuleError, t: TFunction): string {
  const message = t(`errors.dnr.${error.code}`, error.params);
  return error.detail
    ? t("errors.dnr.withDetail", { message, detail: error.detail })
    : message;
}
