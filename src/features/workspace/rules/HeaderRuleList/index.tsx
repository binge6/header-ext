import { useState, type DragEvent, type ReactNode } from "react";
import { Cookie, Plus, Reply, Route, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useHistorySuggestions } from "@/src/application/hooks/use-rule-history";
import { cn } from "@/src/shared/lib/cn";
import { Button, Checkbox, Tooltip } from "@/src/shared/ui";
import { GroupHeader } from "../../components/GroupHeader";
import {
  editorSectionClassName,
  editorSectionCountClassName,
  editorSectionHeaderClassName,
  editorSectionIconClassName,
  editorSectionIconVariants,
  editorSectionTitleClassName,
} from "../../components/editor-styles";
import { HeaderRuleRow } from "./HeaderRuleRow";
import type { HeaderRuleListProps } from "./types";
import {
  buildReorderedRuleIds,
  getAddLabelKey,
  getGroupTitleKey,
  isCookieRule,
} from "./utils";

export type { HeaderRuleListProps } from "./types";

export function HeaderRuleList({
  kind,
  target,
  rules,
  errorMessages,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  onReorder,
  variant = "compact",
  advancedPopoverDensity = "default",
  actionControlVariant = "select",
}: HeaderRuleListProps) {
  const { t } = useTranslation();
  const { names, valuesByName } = useHistorySuggestions();
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);
  const isCookie = isCookieRule(kind);
  const isRedirect = kind === "redirect";
  const isEditor = variant === "editor";
  const canDrag = isEditor && !!onReorder && rules.length > 1;

  // 优先使用显式 target，其次用首条规则的 target，最后兜底 request。
  const headerTarget = target ?? rules[0]?.target ?? "request";
  const groupTitleKey = getGroupTitleKey(kind, headerTarget);
  const addLabelKey = getAddLabelKey(kind);
  const groupEnabled = rules.some((rule) => rule.enabled);
  const groupToggleState =
    groupEnabled && rules.some((rule) => !rule.enabled)
      ? "indeterminate"
      : groupEnabled;
  const groupToggleLabel =
    groupEnabled && groupToggleState !== "indeterminate"
      ? t("rule.disableGroup")
      : t("rule.enableGroup");

  const handleToggleGroup = (enabled: boolean) => {
    rules.forEach((rule) => {
      if (rule.enabled !== enabled) onToggle(rule.id);
    });
  };

  const handleDragStart = (
    event: DragEvent<HTMLSpanElement>,
    ruleId: string,
  ) => {
    if (!canDrag) return;
    setDraggedRuleId(ruleId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", ruleId);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, ruleId: string) => {
    if (!canDrag || !draggedRuleId || draggedRuleId === ruleId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverRuleId(ruleId);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, ruleId: string) => {
    if (!canDrag) return;
    event.preventDefault();

    const fromId = draggedRuleId ?? event.dataTransfer.getData("text/plain");
    setDraggedRuleId(null);
    setDragOverRuleId(null);
    if (!fromId || fromId === ruleId) return;

    onReorder?.(buildReorderedRuleIds(rules, fromId, ruleId));
  };

  const handleDragEnd = () => {
    setDraggedRuleId(null);
    setDragOverRuleId(null);
  };

  const renderSectionIcon = (): ReactNode => {
    if (isRedirect) return <Route aria-hidden="true" />;
    if (isCookie) return <Cookie aria-hidden="true" />;
    return headerTarget === "request" ? (
      <Send aria-hidden="true" />
    ) : (
      <Reply aria-hidden="true" />
    );
  };

  const sectionIconClassName = cn(
    editorSectionIconClassName,
    isRedirect
      ? editorSectionIconVariants.redirect
      : isCookie
        ? editorSectionIconVariants.cookie
        : headerTarget === "request"
          ? editorSectionIconVariants.request
          : editorSectionIconVariants.response,
  );

  const rows = rules.map((rule) => {
    const nameOptions = isCookie
      ? []
      : names
          .filter(
            (name) =>
              !rule.name ||
              name.toLowerCase().includes(rule.name.toLowerCase()),
          )
          .slice(0, 20);
    const valueOptions = isCookie
      ? []
      : (valuesByName.get(rule.name) ?? [])
          .filter(
            (value) =>
              !rule.value ||
              value.toLowerCase().includes(rule.value.toLowerCase()),
          )
          .slice(0, 20);

    return (
      <HeaderRuleRow
        key={rule.id}
        rule={rule}
        errorMessage={errorMessages?.[rule.id]}
        isCookie={isCookie}
        isRedirect={isRedirect}
        isEditor={isEditor}
        canDrag={canDrag}
        isDragging={draggedRuleId === rule.id}
        isDragOver={dragOverRuleId === rule.id}
        nameOptions={nameOptions}
        valueOptions={valueOptions}
        advancedPopoverDensity={advancedPopoverDensity}
        actionControlVariant={actionControlVariant}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggle={onToggle}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      />
    );
  });

  if (!isEditor) {
    return (
      <div>
        <GroupHeader
          title={t(groupTitleKey)}
          addLabel={t(addLabelKey)}
          onAdd={onAdd}
        />
        {rows}
      </div>
    );
  }

  if (rules.length === 0) return null;

  return (
    <section className={editorSectionClassName}>
      <div className={editorSectionHeaderClassName}>
        <div className="flex items-center gap-1.5">
          <span className={sectionIconClassName}>{renderSectionIcon()}</span>
          <span className={editorSectionTitleClassName}>
            {t(groupTitleKey)}
          </span>
          <span className={editorSectionCountClassName}>{rules.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content={t(addLabelKey)}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t(addLabelKey)}
              onClick={onAdd}
            >
              <Plus aria-hidden="true" />
            </Button>
          </Tooltip>
          <Tooltip content={groupToggleLabel} keepOpenOnClick>
            <Checkbox
              checked={groupToggleState}
              disabled={rules.length === 0}
              aria-label={groupToggleLabel}
              onCheckedChange={handleToggleGroup}
            />
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col">{rows}</div>
    </section>
  );
}
