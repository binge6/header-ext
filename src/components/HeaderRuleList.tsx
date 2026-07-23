import { useState, type DragEvent, type ReactNode } from "react";
import {
  Cookie,
  Filter,
  GripVertical,
  Plus,
  Reply,
  Route,
  Send,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  HeaderAction,
  HeaderRule,
  ResourceType,
  RuleKind,
} from "@/src/core/types";
import { useHistorySuggestions } from "@/src/hooks/useHistorySuggestions";
import { cn } from "@/src/utils/cn";
import { GroupHeader } from "./GroupHeader";
import {
  AutoCompleteInput,
  Button,
  Checkbox,
  Input,
  MultiSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SelectControl,
  Tooltip,
} from "@/src/ui";

interface Props {
  // 用 kind 决定标题和行字段：
  //   header => 普通 [action][name][value]
  //   cookie-request-append / cookie-response-append => [name][value]
  kind: RuleKind;
  // kind === "header" 时显式指定分组方向，避免 rules 为空时 fallback 错误
  target?: "request" | "response";
  rules: HeaderRule[];
  onAdd: () => void;
  onUpdate: (rule: HeaderRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
  onReorder?: (orderedRuleIds: string[]) => void;
  variant?: "compact" | "editor";
  advancedPopoverDensity?: "default" | "compact";
}

const ACTION_OPTIONS: HeaderAction[] = ["set", "append", "remove"];

const RESOURCE_TYPES: ResourceType[] = [
  "main_frame",
  "sub_frame",
  "xmlhttprequest",
  "script",
  "stylesheet",
  "image",
  "font",
  "media",
  "websocket",
  "ping",
  "other",
];

// DNR 支持的 HTTP 方法（小写）
const REQUEST_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "head",
  "connect",
] as const;

export function HeaderRuleList({
  kind,
  target,
  rules,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  onReorder,
  variant = "compact",
  advancedPopoverDensity = "default",
}: Props) {
  const { t } = useTranslation();
  const isCookie =
    kind === "cookie-request-append" || kind === "cookie-response-append";
  const isRedirect = kind === "redirect";
  const { names, valuesByName } = useHistorySuggestions();
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);

  // 优先使用显式 target，其次用首条规则的 target，最后兜底 request
  const headerTarget = target ?? rules[0]?.target ?? "request";

  const groupTitleKey =
    kind === "cookie-request-append"
      ? "rule.group.cookieRequestAppend"
      : kind === "cookie-response-append"
        ? "rule.group.cookieResponseAppend"
        : kind === "redirect"
          ? "rule.group.redirect"
          : `rule.targetOption.${headerTarget}`;

  const addLabelKey =
    kind === "cookie-request-append"
      ? "rule.addCookieRequestItem"
      : kind === "cookie-response-append"
        ? "rule.addCookieResponseItem"
        : kind === "redirect"
          ? "rule.addRedirectItem"
          : "rule.addRule";

  const isEditor = variant === "editor";
  const canDrag = isEditor && !!onReorder && rules.length > 1;
  const groupEnabled = rules.some((rule) => rule.enabled);
  const groupToggleState =
    groupEnabled && rules.some((rule) => !rule.enabled)
      ? "indeterminate"
      : groupEnabled;
  const groupPartiallyEnabled = groupToggleState === "indeterminate";
  const groupToggleLabel =
    groupEnabled && !groupPartiallyEnabled
      ? t("rule.disableGroup")
      : t("rule.enableGroup");

  const renderToggle = (
    checked: boolean,
    ariaLabel: string,
    onCheckedChange: (checked: boolean) => void,
    disabled = false,
  ) => (
    <Tooltip content={ariaLabel}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onCheckedChange={onCheckedChange}
      />
    </Tooltip>
  );

  const renderGroupToggle = () => (
    <Tooltip content={groupToggleLabel}>
      <Checkbox
        checked={groupToggleState}
        disabled={rules.length === 0}
        aria-label={groupToggleLabel}
        onCheckedChange={handleToggleGroup}
      />
    </Tooltip>
  );

  const handleToggleGroup = (enabled: boolean) => {
    rules.forEach((rule) => {
      if (rule.enabled !== enabled) onToggle(rule.id);
    });
  };

  const renderSectionIcon = (): ReactNode => {
    if (kind === "redirect") return <Route aria-hidden="true" />;
    if (isCookie) return <Cookie aria-hidden="true" />;
    return headerTarget === "request" ? (
      <Send aria-hidden="true" />
    ) : (
      <Reply aria-hidden="true" />
    );
  };

  const sectionIconClassName = cn(
    "he-editor-section-icon",
    kind === "redirect"
      ? "he-editor-section-icon-redirect"
      : isCookie
        ? "he-editor-section-icon-cookie"
        : headerTarget === "request"
          ? "he-editor-section-icon-request"
          : "he-editor-section-icon-response",
  );

  const buildReorderedRuleIds = (fromId: string, toId: string): string[] => {
    const ruleIds = rules.map((rule) => rule.id);
    const fromIndex = ruleIds.indexOf(fromId);
    const toIndex = ruleIds.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return ruleIds;

    const next = [...ruleIds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
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

    const nextRuleIds = buildReorderedRuleIds(fromId, ruleId);
    onReorder?.(nextRuleIds);
  };

  const handleDragEnd = () => {
    setDraggedRuleId(null);
    setDragOverRuleId(null);
  };

  const renderFilterPopover = (rule: HeaderRule) => {
    const cond = rule.condition;
    const label = (text: string) => (
      <div className="he-advanced-popover-label">{text}</div>
    );

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
        <div className="he-advanced-popover-body">
          <div className="he-advanced-popover-field">
            {label(t("rule.filter"))}
            <Input
              placeholder={
                cond.useRegex
                  ? t("rule.regexPlaceholder")
                  : t("rule.filterPlaceholder")
              }
              value={cond.urlFilter ?? ""}
              onChange={(event) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, urlFilter: event.target.value },
                })
              }
            />
            <Checkbox
              checked={!!cond.useRegex}
              className="he-advanced-popover-checkbox"
              label={t("rule.useRegex")}
              onCheckedChange={(checked) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, useRegex: checked },
                })
              }
            />
          </div>

          <div className="he-advanced-popover-field">
            {label(t("rule.excludeDomains"))}
            <MultiSelect
              value={cond.excludedDomains ?? []}
              options={[]}
              allowCreate
              placeholder={t("rule.excludeDomainsPlaceholder")}
              onValueChange={(excludedDomains) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, excludedDomains },
                })
              }
            />
          </div>

          <div className="he-advanced-popover-field">
            {label(t("rule.resourceTypes"))}
            <MultiSelect
              value={cond.resourceTypes ?? []}
              options={RESOURCE_TYPES.map((resourceType) => ({
                value: resourceType,
                label: resourceType,
              }))}
              placeholder={t("rule.resourceTypesPlaceholder")}
              onValueChange={(resourceTypes) =>
                onUpdate({
                  ...rule,
                  condition: {
                    ...cond,
                    resourceTypes: resourceTypes as ResourceType[],
                  },
                })
              }
            />
          </div>

          <div className="he-advanced-popover-field">
            {label(t("rule.requestMethods"))}
            <MultiSelect
              value={cond.requestMethods ?? []}
              options={REQUEST_METHODS.map((method) => ({
                value: method,
                label: method.toUpperCase(),
              }))}
              placeholder={t("rule.requestMethodsPlaceholder")}
              onValueChange={(requestMethods) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, requestMethods },
                })
              }
            />
          </div>
        </div>
      </div>
    );
  };

  const rows = rules.map((rule) => {
    const cond = rule.condition;
    const filterActive =
      !!cond.urlFilter ||
      !!cond.excludedDomains?.length ||
      !!cond.resourceTypes?.length ||
      !!cond.requestMethods?.length;
    // 历史 name 列表（cookie 模式不需要建议）
    const nameOptions = isCookie
      ? []
      : names
          .filter(
            (n) =>
              !rule.name || n.toLowerCase().includes(rule.name.toLowerCase()),
          )
          .slice(0, 20)
          .slice(0, 20);
    // 当前 name 对应的历史值
    const valueOptions = isCookie
      ? []
      : (valuesByName.get(rule.name) ?? [])
          .filter(
            (v) =>
              !rule.value || v.toLowerCase().includes(rule.value.toLowerCase()),
          )
          .slice(0, 20)
          .slice(0, 20);

    const fieldClassName = cn("min-w-0 flex-1", isEditor && "he-editor-field");
    const actionClassName = cn(
      isEditor && "he-editor-field",
      isEditor ? "w-22" : "w-19",
    );
    return (
      <div
        key={rule.id}
        className={cn(
          "flex items-center",
          isEditor ? "he-editor-rule-row gap-1.5 py-1" : "gap-1 py-1",
          isEditor && !rule.enabled && "opacity-70",
          draggedRuleId === rule.id && "opacity-50",
          dragOverRuleId === rule.id && "he-editor-rule-row-drag-over",
        )}
        onDragOver={(event) => handleDragOver(event, rule.id)}
        onDrop={(event) => handleDrop(event, rule.id)}
      >
        {isEditor ? (
          <span
            draggable={canDrag}
            className={cn(
              "inline-flex shrink-0 text-muted-foreground",
              canDrag && "cursor-grab active:cursor-grabbing",
            )}
            onDragStart={(event) => handleDragStart(event, rule.id)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical aria-hidden="true" className="h-4 w-4" />
          </span>
        ) : (
          renderToggle(
            rule.enabled,
            rule.enabled ? t("rule.disableRule") : t("rule.enableRule"),
            () => onToggle(rule.id),
          )
        )}
        {!isCookie && !isRedirect && (
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
        )}
        {isRedirect ? (
          <Input
            placeholder={
              cond.useRegex
                ? t("rule.redirectFromRegexPlaceholder")
                : t("rule.redirectFromPlaceholder")
            }
            className={fieldClassName}
            value={cond.urlFilter ?? ""}
            onChange={(event) =>
              onUpdate({
                ...rule,
                condition: { ...cond, urlFilter: event.target.value },
              })
            }
          />
        ) : isCookie ? (
          <Input
            placeholder={t("rule.cookieNamePlaceholder")}
            className={fieldClassName}
            value={rule.name}
            onChange={(event) =>
              onUpdate({ ...rule, name: event.target.value })
            }
          />
        ) : (
          <AutoCompleteInput
            className={fieldClassName}
            value={rule.name}
            options={nameOptions}
            placeholder={t("rule.namePlaceholder")}
            onChange={(event) =>
              onUpdate({ ...rule, name: event.target.value })
            }
          />
        )}
        {isRedirect ? (
          <Input
            placeholder={
              cond.useRegex
                ? t("rule.redirectToRegexPlaceholder")
                : t("rule.redirectToPlaceholder")
            }
            className={fieldClassName}
            value={rule.value}
            onChange={(event) =>
              onUpdate({ ...rule, value: event.target.value })
            }
          />
        ) : isCookie ? (
          <Input
            placeholder={t("rule.cookieValuePlaceholder")}
            className={fieldClassName}
            value={rule.value}
            onChange={(event) =>
              onUpdate({ ...rule, value: event.target.value })
            }
          />
        ) : rule.action === "remove" ? null : (
          <AutoCompleteInput
            className={fieldClassName}
            value={rule.value}
            options={valueOptions}
            placeholder={t("rule.valuePlaceholder")}
            onChange={(event) =>
              onUpdate({ ...rule, value: event.target.value })
            }
          />
        )}
        {isEditor && (
          renderToggle(
            rule.enabled,
            rule.enabled ? t("rule.disableRule") : t("rule.enableRule"),
            () => onToggle(rule.id),
          )
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
                "he-advanced-popover-content p-0",
                advancedPopoverDensity === "compact" &&
                  "he-advanced-popover-content-compact",
              )}
            >
              {renderFilterPopover(rule)}
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
      </div>
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
    <section className="he-editor-section">
      <div className="he-editor-section-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={sectionIconClassName}>{renderSectionIcon()}</span>
          <span className="he-section-title">
            {t(groupTitleKey)}
          </span>
          <span className="he-editor-section-count">{rules.length}</span>
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
          {renderGroupToggle()}
        </div>
      </div>

      <div className="flex flex-col">{rows}</div>
    </section>
  );
}
