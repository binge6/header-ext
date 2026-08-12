import { useTranslation } from "react-i18next";
import type { HeaderAction, HeaderRule } from "@/src/domain";
import { Button, Tooltip } from "@/src/shared/ui";
import { cn } from "@/src/shared/lib/cn";
import { ACTION_ICONS, ACTION_OPTIONS } from "./const";

interface RuleActionControlProps {
  rule: HeaderRule;
  isEditor: boolean;
  variant: "select" | "compact-menu";
  onUpdate: (rule: HeaderRule) => void;
}

export function RuleActionControl({
  rule,
  variant,
  onUpdate,
}: RuleActionControlProps) {
  const { t } = useTranslation();
  const currentIndex = ACTION_OPTIONS.indexOf(rule.action);
  const nextAction = ACTION_OPTIONS[(currentIndex + 1) % ACTION_OPTIONS.length];
  const currentLabel = t(`rule.actionOption.${rule.action}`);
  const nextLabel = t(`rule.actionOption.${nextAction}`);
  const Icon = ACTION_ICONS[rule.action];
  const tooltip = (
    <span className="flex flex-col gap-0.5">
      <span>{t("rule.actionCurrent", { action: currentLabel })}</span>
      <span>{t("rule.actionClickToSwitch", { action: nextLabel })}</span>
    </span>
  );

  const cycle = () => onUpdate({ ...rule, action: nextAction as HeaderAction });

  return (
    <Tooltip content={tooltip} keepOpenOnClick>
      <Button
        variant="outline"
        size={variant === "compact-menu" ? "sm" : "icon-sm"}
        className={cn(
          "shrink-0",
          variant === "compact-menu" &&
            "h-6.25 w-6.25 rounded-sm p-0 shadow-soft",
        )}
        aria-label={t("rule.actionCurrent", { action: currentLabel })}
        onClick={cycle}
      >
        <Icon aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}
