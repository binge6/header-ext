import type { ScopeParts } from "@/src/domain";

export function formatScopeSummary(
  scopeParts: ScopeParts,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const parts: string[] = [];
  if (scopeParts.domains.length) {
    parts.push(
      t("scope.domainSummary", {
        domains: scopeParts.domains.slice(0, 2).join(", "),
        count: scopeParts.domains.length,
      }),
    );
  }
  if (scopeParts.methods.length) {
    parts.push(
      t("scope.methodSummary", {
        methods: scopeParts.methods.slice(0, 3).join(", "),
        count: scopeParts.methods.length,
      }),
    );
  }
  if (scopeParts.tabCount) {
    parts.push(t("scope.tabSummary", { count: scopeParts.tabCount }));
  }
  if (scopeParts.urlRegexCount) {
    parts.push(t("scope.urlSummary", { count: scopeParts.urlRegexCount }));
  }
  if (scopeParts.excludeCount) {
    parts.push(t("scope.excludeSummary", { count: scopeParts.excludeCount }));
  }
  return parts.length ? parts.join(" · ") : t("scope.allRequests");
}
