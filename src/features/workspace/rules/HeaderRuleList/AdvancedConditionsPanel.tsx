import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HeaderRule, ResourceType } from "@/src/domain";
import { Checkbox, Input, MultiSelect, Scroller } from "@/src/shared/ui";
import { cn } from "@/src/shared/lib/cn";
import { REQUEST_METHODS, RESOURCE_TYPES } from "./const";

interface AdvancedConditionsPanelProps {
  rule: HeaderRule;
  isRedirect: boolean;
  compact?: boolean;
  onUpdate: (rule: HeaderRule) => void;
}

function FieldLabel({
  children,
  compact,
}: {
  children: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "font-bold leading-snug text-foreground",
        compact ? "text-micro" : "text-xs",
      )}
    >
      {children}
    </div>
  );
}

export function AdvancedConditionsPanel({
  rule,
  isRedirect,
  compact,
  onUpdate,
}: AdvancedConditionsPanelProps) {
  const { t } = useTranslation();
  const condition = rule.condition ?? {};

  return (
    <div
      className={cn(
        "flex max-h-advanced-popover flex-col",
        compact && "max-h-advanced-popover-compact",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border/80 bg-muted/30",
          compact ? "gap-2 px-2.75 pt-2.25 pb-2" : "gap-2.5 px-3.5 pt-3 pb-2.5",
        )}
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            compact ? "h-6.5 w-6.5" : "h-7.5 w-7.5",
          )}
        >
          <SlidersHorizontal
            aria-hidden="true"
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          />
        </span>
        <div>
          <div
            className={cn(
              "font-bold leading-tight text-foreground",
              compact ? "text-xs" : "text-group-title",
            )}
          >
            {t("rule.advancedConditions")}
          </div>
          <div
            className={cn(
              "leading-snug text-muted-foreground",
              compact ? "mt-px text-micro" : "mt-0.5 text-xs",
            )}
          >
            {t("rule.advancedConditionsDesc")}
          </div>
        </div>
      </div>
      <Scroller className="min-h-0 flex-1" defer={false}>
        <div
          className={cn(
            "flex flex-col",
            compact
              ? "gap-2.5 px-2.75 pt-2.5 pb-2.75"
              : "gap-3 px-3.5 pt-3 pb-3.5",
            compact &&
              "[&_.he-checkbox]:h-4 [&_.he-checkbox]:w-4 [&_.he-checkbox]:rounded-sm [&_.he-checkbox-label]:gap-1.5 [&_.he-checkbox-label]:text-xs [&_.he-chip]:h-4.5 [&_.he-chip]:max-w-24 [&_.he-chip]:rounded-sm [&_.he-chip]:px-1.25 [&_.he-input]:h-6.5 [&_.he-input]:px-1.75 [&_.he-input]:text-xs [&_.he-input]:leading-6.5 [&_.he-multi-select-trigger]:min-h-6.5 [&_.he-multi-select-trigger]:px-1.75 [&_.he-multi-select-trigger]:py-0.25 [&_.he-multi-select-trigger]:text-xs [&_.he-multi-select-trigger>svg]:h-3.25 [&_.he-multi-select-trigger>svg]:w-3.25 [&_.he-select-trigger]:h-6.5 [&_.he-select-trigger]:px-1.75 [&_.he-select-trigger]:text-xs [&_.he-select-trigger]:leading-6.5",
            !compact &&
              "[&_.he-chip]:h-5 [&_.he-chip]:max-w-29.5 [&_.he-chip]:rounded-sm [&_.he-input]:h-8 [&_.he-input]:text-xs [&_.he-input]:leading-8 [&_.he-multi-select-trigger]:min-h-8 [&_.he-multi-select-trigger]:px-2 [&_.he-multi-select-trigger]:py-0.75 [&_.he-multi-select-trigger]:text-xs [&_.he-select-trigger]:h-8 [&_.he-select-trigger]:text-xs [&_.he-select-trigger]:leading-8",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-col",
              compact ? "gap-1.25" : "gap-1.5",
            )}
          >
            <FieldLabel compact={compact}>{t("rule.filter")}</FieldLabel>
            {/* redirect 的 urlFilter 已由主行“重定向来源”编辑，此处仅保留正则开关。 */}
            {!isRedirect && (
              <Input
                placeholder={
                  condition.useRegex
                    ? t("rule.regexPlaceholder")
                    : t("rule.filterPlaceholder")
                }
                value={condition.urlFilter ?? ""}
                onChange={(event) =>
                  onUpdate({
                    ...rule,
                    condition: {
                      ...condition,
                      urlFilter: event.target.value,
                    },
                  })
                }
              />
            )}
            <Checkbox
              checked={!!condition.useRegex}
              className="mt-0.5"
              label={t("rule.useRegex")}
              onCheckedChange={(checked) =>
                onUpdate({
                  ...rule,
                  condition: { ...condition, useRegex: checked },
                })
              }
            />
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col",
              compact ? "gap-1.25" : "gap-1.5",
            )}
          >
            <FieldLabel compact={compact}>
              {t("rule.includeDomains")}
            </FieldLabel>
            <MultiSelect
              value={condition.includedDomains ?? []}
              options={[]}
              allowCreate
              placeholder={t("rule.includeDomainsPlaceholder")}
              onValueChange={(includedDomains) =>
                onUpdate({
                  ...rule,
                  condition: { ...condition, includedDomains },
                })
              }
            />
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col",
              compact ? "gap-1.25" : "gap-1.5",
            )}
          >
            <FieldLabel compact={compact}>
              {t("rule.excludeDomains")}
            </FieldLabel>
            <MultiSelect
              value={condition.excludedDomains ?? []}
              options={[]}
              allowCreate
              placeholder={t("rule.excludeDomainsPlaceholder")}
              onValueChange={(excludedDomains) =>
                onUpdate({
                  ...rule,
                  condition: { ...condition, excludedDomains },
                })
              }
            />
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col",
              compact ? "gap-1.25" : "gap-1.5",
            )}
          >
            <FieldLabel compact={compact}>{t("rule.resourceTypes")}</FieldLabel>
            <MultiSelect
              value={condition.resourceTypes ?? []}
              options={RESOURCE_TYPES.map((resourceType) => ({
                value: resourceType,
                label: resourceType,
              }))}
              placeholder={t("rule.resourceTypesPlaceholder")}
              onValueChange={(resourceTypes) =>
                onUpdate({
                  ...rule,
                  condition: {
                    ...condition,
                    resourceTypes: resourceTypes as ResourceType[],
                  },
                })
              }
            />
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col",
              compact ? "gap-1.25" : "gap-1.5",
            )}
          >
            <FieldLabel compact={compact}>
              {t("rule.requestMethods")}
            </FieldLabel>
            <MultiSelect
              value={condition.requestMethods ?? []}
              options={REQUEST_METHODS.map((method) => ({
                value: method,
                label: method.toUpperCase(),
              }))}
              placeholder={t("rule.requestMethodsPlaceholder")}
              onValueChange={(requestMethods) =>
                onUpdate({
                  ...rule,
                  condition: { ...condition, requestMethods },
                })
              }
            />
          </div>
        </div>
      </Scroller>
    </div>
  );
}
