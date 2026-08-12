import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HeaderRule, ResourceType } from "@/src/domain";
import { Checkbox, Input, MultiSelect, Scroller } from "@/src/shared/ui";
import { REQUEST_METHODS, RESOURCE_TYPES } from "./const";

interface AdvancedConditionsPanelProps {
  rule: HeaderRule;
  isRedirect: boolean;
  onUpdate: (rule: HeaderRule) => void;
}

function FieldLabel({ children }: { children: string }) {
  return <div className="he-advanced-popover-label">{children}</div>;
}

export function AdvancedConditionsPanel({
  rule,
  isRedirect,
  onUpdate,
}: AdvancedConditionsPanelProps) {
  const { t } = useTranslation();
  const condition = rule.condition ?? {};

  return (
    <div className="he-advanced-popover-panel">
      <div className="he-advanced-popover-header">
        <span className="he-advanced-popover-icon">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        </span>
        <div>
          <div className="he-advanced-popover-title">
            {t("rule.advancedConditions")}
          </div>
          <div className="he-advanced-popover-desc">
            {t("rule.advancedConditionsDesc")}
          </div>
        </div>
      </div>
      <Scroller className="he-advanced-popover-body" defer={false}>
        <div className="he-advanced-popover-body-content">
          <div className="he-advanced-popover-field">
            <FieldLabel>{t("rule.filter")}</FieldLabel>
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
              className="he-advanced-popover-checkbox"
              label={t("rule.useRegex")}
              onCheckedChange={(checked) =>
                onUpdate({
                  ...rule,
                  condition: { ...condition, useRegex: checked },
                })
              }
            />
          </div>

          <div className="he-advanced-popover-field">
            <FieldLabel>{t("rule.includeDomains")}</FieldLabel>
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

          <div className="he-advanced-popover-field">
            <FieldLabel>{t("rule.excludeDomains")}</FieldLabel>
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

          <div className="he-advanced-popover-field">
            <FieldLabel>{t("rule.resourceTypes")}</FieldLabel>
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

          <div className="he-advanced-popover-field">
            <FieldLabel>{t("rule.requestMethods")}</FieldLabel>
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
