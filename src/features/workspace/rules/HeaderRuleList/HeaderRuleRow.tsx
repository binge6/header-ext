import type { DragEvent } from "react";
import { Filter, GripVertical, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { HeaderRule } from "@/src/domain";
import {
  AutoCompleteInput,
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@/src/shared/ui";
import { cn } from "@/src/shared/lib/cn";
import { AdvancedConditionsPanel } from "./AdvancedConditionsPanel";
import { RuleActionControl } from "./RuleActionControl";
import type { HeaderRuleMode } from "./types";
import { hasAdvancedConditions } from "./utils";
import {
  editorFieldClassName,
  editorRuleDragOverClassName,
  editorRuleRowClassName,
} from "../../components/editor-styles";

interface HeaderRuleRowProps extends HeaderRuleMode {
  rule: HeaderRule;
  canDrag: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  nameOptions: string[];
  valueOptions: string[];
  onUpdate: (rule: HeaderRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
  onDragStart: (event: DragEvent<HTMLSpanElement>, ruleId: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, ruleId: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, ruleId: string) => void;
  onDragEnd: () => void;
}

export function HeaderRuleRow({
  rule,
  isCookie,
  isRedirect,
  isEditor,
  canDrag,
  isDragging,
  isDragOver,
  nameOptions,
  valueOptions,
  advancedPopoverDensity = "default",
  actionControlVariant = "select",
  onUpdate,
  onDelete,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: HeaderRuleRowProps) {
  const { t } = useTranslation();
  const condition = rule.condition ?? {};
  const filterActive = hasAdvancedConditions(rule, isRedirect);
  const fieldClassName = cn("min-w-0 flex-1", isEditor && editorFieldClassName);
  const toggleLabel = rule.enabled
    ? t("rule.disableRule")
    : t("rule.enableRule");

  const toggle = (
    <Tooltip content={toggleLabel} keepOpenOnClick>
      <Checkbox
        checked={rule.enabled}
        aria-label={toggleLabel}
        onCheckedChange={() => onToggle(rule.id)}
      />
    </Tooltip>
  );

  return (
    <div
      className={cn(
        "flex items-center",
        isEditor ? editorRuleRowClassName : "gap-1 py-1",
        isEditor && !rule.enabled && "opacity-70",
        isDragging && "opacity-50",
        isDragOver && editorRuleDragOverClassName,
      )}
      onDragOver={(event) => onDragOver(event, rule.id)}
      onDrop={(event) => onDrop(event, rule.id)}
    >
      {isEditor && (
        <span
          draggable={canDrag}
          className={cn(
            "inline-flex shrink-0 text-muted-foreground",
            canDrag && "cursor-grab active:cursor-grabbing",
          )}
          onDragStart={(event) => onDragStart(event, rule.id)}
          onDragEnd={onDragEnd}
        >
          <GripVertical aria-hidden="true" className="h-4 w-4" />
        </span>
      )}

      {isRedirect ? (
        <Input
          placeholder={
            condition.useRegex
              ? t("rule.redirectFromRegexPlaceholder")
              : t("rule.redirectFromPlaceholder")
          }
          className={fieldClassName}
          value={condition.urlFilter ?? ""}
          onChange={(event) =>
            onUpdate({
              ...rule,
              condition: { ...condition, urlFilter: event.target.value },
            })
          }
        />
      ) : isCookie ? (
        <Input
          placeholder={t("rule.cookieNamePlaceholder")}
          className={fieldClassName}
          value={rule.name}
          onChange={(event) => onUpdate({ ...rule, name: event.target.value })}
        />
      ) : (
        <AutoCompleteInput
          className={fieldClassName}
          value={rule.name}
          options={nameOptions}
          placeholder={t("rule.namePlaceholder")}
          onChange={(event) => onUpdate({ ...rule, name: event.target.value })}
        />
      )}

      {isRedirect ? (
        <Input
          placeholder={
            condition.useRegex
              ? t("rule.redirectToRegexPlaceholder")
              : t("rule.redirectToPlaceholder")
          }
          className={fieldClassName}
          value={rule.value}
          onChange={(event) => onUpdate({ ...rule, value: event.target.value })}
        />
      ) : isCookie ? (
        <Input
          placeholder={t("rule.cookieValuePlaceholder")}
          className={fieldClassName}
          value={rule.value}
          onChange={(event) => onUpdate({ ...rule, value: event.target.value })}
        />
      ) : rule.action === "remove" ? null : (
        <AutoCompleteInput
          className={fieldClassName}
          value={rule.value}
          options={valueOptions}
          placeholder={t("rule.valuePlaceholder")}
          onChange={(event) => onUpdate({ ...rule, value: event.target.value })}
        />
      )}

      {!isCookie && !isRedirect && (
        <RuleActionControl
          rule={rule}
          isEditor={isEditor}
          variant={actionControlVariant}
          onUpdate={onUpdate}
        />
      )}

      <div className="flex items-center">
        <Popover>
          <Tooltip content={t("rule.advancedConditions")}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(filterActive && "text-primary")}
                aria-label={t("rule.advancedConditions")}
              >
                <Filter aria-hidden="true" />
              </Button>
            </PopoverTrigger>
          </Tooltip>
          <PopoverContent
            side="left"
            align="center"
            className={cn(
              "w-83 max-w-popover-limit overflow-hidden p-0",
              advancedPopoverDensity === "compact" &&
                "w-76 max-w-popover-limit-compact rounded-lg shadow-panel",
            )}
          >
            <AdvancedConditionsPanel
              rule={rule}
              isRedirect={isRedirect}
              compact={advancedPopoverDensity === "compact"}
              onUpdate={onUpdate}
            />
          </PopoverContent>
        </Popover>
        <Tooltip content={t("common.delete")}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("common.delete")}
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>
      {toggle}
    </div>
  );
}
