import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HeaderAction, HeaderRule } from "@/src/domain";
import {
  Button,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  SelectControl,
  TooltipDropdownMenu,
  TooltipDropdownMenuContent,
  TooltipDropdownMenuTrigger,
} from "@/src/shared/ui";
import { cn } from "@/src/shared/lib/cn";
import { ACTION_OPTIONS, ACTION_SYMBOLS } from "./const";
import { editorFieldClassName } from "../../components/editor-styles";

interface RuleActionControlProps {
  rule: HeaderRule;
  isEditor: boolean;
  variant: "select" | "compact-menu";
  onUpdate: (rule: HeaderRule) => void;
}

export function RuleActionControl({
  rule,
  isEditor,
  variant,
  onUpdate,
}: RuleActionControlProps) {
  const { t } = useTranslation();
  const actionClassName = cn(
    isEditor && editorFieldClassName,
    isEditor ? "w-22" : "w-19",
  );
  const actionLabel = t(`rule.actionOption.${rule.action}`);
  const actionTooltip = `${t("rule.action")}: ${actionLabel}`;

  if (variant === "compact-menu") {
    return (
      <TooltipDropdownMenu>
        <TooltipDropdownMenuTrigger tooltip={actionTooltip}>
          <Button
            variant="outline"
            size="sm"
            className="h-6.25 w-11 shrink-0 gap-0.5 rounded-sm px-1.25 text-xs font-extrabold leading-none shadow-soft [&_svg]:h-3 [&_svg]:w-3"
            aria-label={actionTooltip}
          >
            <span aria-hidden="true" className="w-3 text-center font-extrabold">
              {ACTION_SYMBOLS[rule.action]}
            </span>
            <ChevronDown aria-hidden="true" />
          </Button>
        </TooltipDropdownMenuTrigger>
        <TooltipDropdownMenuContent align="start" className="min-w-31 max-w-40">
          <DropdownMenuRadioGroup
            value={rule.action}
            onValueChange={(action) => {
              if (action !== rule.action) {
                onUpdate({ ...rule, action: action as HeaderAction });
              }
            }}
          >
            {ACTION_OPTIONS.map((action) => (
              <DropdownMenuRadioItem key={action} value={action}>
                <span
                  aria-hidden="true"
                  className="w-3 text-center font-extrabold text-muted-foreground"
                >
                  {ACTION_SYMBOLS[action]}
                </span>
                {t(`rule.actionOption.${action}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </TooltipDropdownMenuContent>
      </TooltipDropdownMenu>
    );
  }

  return (
    <SelectControl
      className={actionClassName}
      value={rule.action}
      aria-label={t("rule.action")}
      onValueChange={(action) =>
        onUpdate({ ...rule, action: action as HeaderAction })
      }
      options={ACTION_OPTIONS.map((action) => ({
        value: action,
        label: t(`rule.actionOption.${action}`),
      }))}
    />
  );
}
