import type { TFunction } from "i18next";
import type { UrlFilter } from "@/src/domain";
import type { DnrRuleError } from "@/src/platform/dnr";
import { formatDnrError } from "../rules/format-dnr-error";

export type ProfileFilterErrorPrefix =
  | "__tab_filter__"
  | "__domain_filter__"
  | "__url_filter__"
  | "__exclude_url_filter__";

export interface ProfileFilterErrorState {
  errorMessages: Record<string, string>;
  alertMessages: string[];
}

export function getProfileFilterErrorState(
  errors: DnrRuleError[] | undefined,
  prefix: ProfileFilterErrorPrefix,
  t: TFunction,
  filters?: UrlFilter[],
): ProfileFilterErrorState {
  const errorMessages: Record<string, string> = {};
  const alerts = new Set<string>();

  for (const error of errors ?? []) {
    if (
      error.sourceRuleId !== prefix &&
      !error.sourceRuleId.startsWith(`${prefix}:`)
    ) {
      continue;
    }

    const message = formatDnrError(error, t);
    alerts.add(message);
    const filterId = error.sourceRuleId.slice(prefix.length + 1);
    if (filterId) errorMessages[filterId] = message;
  }

  const enabledFilterIds =
    prefix === "__url_filter__"
      ? new Set(
          (filters ?? [])
            .filter((filter) => filter.enabled && filter.regex.trim())
            .map((filter) => filter.id),
        )
      : null;
  const showCardAlert =
    enabledFilterIds == null ||
    (enabledFilterIds.size > 0 &&
      Array.from(enabledFilterIds).every(
        (filterId) => errorMessages[filterId] !== undefined,
      ));

  return {
    errorMessages,
    alertMessages: showCardAlert ? Array.from(alerts) : [],
  };
}
