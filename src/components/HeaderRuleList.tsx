// 紧凑规则列表，每行内联编辑
// 同时承担 header 模式 与 cookie-* 模式（kind 决定样式与字段）

import {
  AutoComplete,
  Button,
  Checkbox,
  Input,
  Popover,
  Select,
  Switch,
  Tooltip,
  Typography,
} from "@douyinfe/semi-ui";
import {
  IconChainStroked as IconLink,
  IconCodeStroked as IconCode,
  IconDeleteStroked as IconDelete,
  IconFilterStroked as IconFilter,
  IconHandle,
  IconPlusStroked as IconPlus,
  IconReplyStroked as IconReply,
  IconSendStroked as IconSend,
} from "@douyinfe/semi-icons";
import { useState, type DragEvent, type ReactNode } from "react";
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
}: Props) {
  const { t } = useTranslation();
  const isCookie =
    kind === "cookie-request-append" || kind === "cookie-response-append";
  const isRedirect = kind === "redirect";
  const { names, valuesByName } = useHistorySuggestions();
  // 当前打开过滤 Popover 的规则 id，用于和 Tooltip 互斥
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  // 当前 hover 的过滤按钮规则 id（受控 Tooltip 显隐）
  const [hoverFilterId, setHoverFilterId] = useState<string | null>(null);
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

  const handleToggleGroup = (enabled: boolean) => {
    rules.forEach((rule) => {
      if (rule.enabled !== enabled) onToggle(rule.id);
    });
  };

  const renderSectionIcon = (): ReactNode => {
    if (kind === "redirect") return <IconLink />;
    if (isCookie) return <IconCode />;
    return headerTarget === "request" ? <IconSend /> : <IconReply />;
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
    // 各字段小标题统一样式
    const label = (text: string) => (
      <Typography.Text type="tertiary" size="small" className="mb-1 block">
        {text}
      </Typography.Text>
    );
    return (
      <div className="max-h-80 w-65 overflow-y-auto px-1 py-2">
        <div className="flex w-full flex-col gap-3">
          <div>
            {label(t("rule.filter"))}
            <Input
              size="small"
              placeholder={
                cond.useRegex
                  ? t("rule.regexPlaceholder")
                  : t("rule.filterPlaceholder")
              }
              value={cond.urlFilter ?? ""}
              onChange={(v) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, urlFilter: v },
                })
              }
            />
            <Checkbox
              className="mt-1"
              checked={!!cond.useRegex}
              onChange={(e) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, useRegex: !!e.target.checked },
                })
              }
            >
              <span className="text-xs">{t("rule.useRegex")}</span>
            </Checkbox>
          </div>

          <div>
            {label(t("rule.excludeDomains"))}
            <Select
              size="small"
              multiple
              allowCreate
              filter
              className="w-full"
              placeholder={t("rule.excludeDomainsPlaceholder")}
              value={cond.excludedDomains ?? []}
              onChange={(v) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, excludedDomains: v as string[] },
                })
              }
            />
          </div>

          <div>
            {label(t("rule.resourceTypes"))}
            <Select
              size="small"
              multiple
              showClear
              className="w-full"
              placeholder={t("rule.resourceTypesPlaceholder")}
              value={cond.resourceTypes ?? []}
              onChange={(v) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, resourceTypes: v as ResourceType[] },
                })
              }
              optionList={RESOURCE_TYPES.map((rt) => ({
                value: rt,
                label: rt,
              }))}
              maxTagCount={3}
            />
          </div>

          <div>
            {label(t("rule.requestMethods"))}
            <Select
              size="small"
              multiple
              showClear
              className="w-full"
              placeholder={t("rule.requestMethodsPlaceholder")}
              value={cond.requestMethods ?? []}
              onChange={(v) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, requestMethods: v as string[] },
                })
              }
              optionList={REQUEST_METHODS.map((m) => ({
                value: m,
                label: m.toUpperCase(),
              }))}
              maxTagCount={3}
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
          .map((n) => ({ value: n, label: n }));
    // 当前 name 对应的历史值
    const valueOptions = isCookie
      ? []
      : (valuesByName.get(rule.name) ?? [])
          .filter(
            (v) =>
              !rule.value || v.toLowerCase().includes(rule.value.toLowerCase()),
          )
          .slice(0, 20)
          .map((v) => ({ value: v, label: v }));

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
              "inline-flex shrink-0 text-semi-color-text-3",
              canDrag && "cursor-grab active:cursor-grabbing",
            )}
            onDragStart={(event) => handleDragStart(event, rule.id)}
            onDragEnd={handleDragEnd}
          >
            <IconHandle />
          </span>
        ) : (
          <Switch
            size="small"
            checked={rule.enabled}
            onChange={() => onToggle(rule.id)}
          />
        )}
        {/* header 模式才有 action 选择器；redirect / cookie 不需要 */}
        {!isCookie && !isRedirect && (
          <Select
            size="small"
            className={actionClassName}
            value={rule.action}
            onChange={(v) => onUpdate({ ...rule, action: v as HeaderAction })}
            optionList={ACTION_OPTIONS.map((a) => ({
              value: a,
              label: t(`rule.actionOption.${a}`),
            }))}
          />
        )}
        {isRedirect ? (
          // redirect 模式：源 URL（写入 condition.urlFilter） + 目标 URL（写入 value）
          <Input
            size="small"
            placeholder={
              cond.useRegex
                ? t("rule.redirectFromRegexPlaceholder")
                : t("rule.redirectFromPlaceholder")
            }
            className={fieldClassName}
            value={cond.urlFilter ?? ""}
            onChange={(v) =>
              onUpdate({
                ...rule,
                condition: { ...cond, urlFilter: v },
              })
            }
          />
        ) : isCookie ? (
          <Input
            size="small"
            placeholder={t("rule.cookieNamePlaceholder")}
            className={fieldClassName}
            value={rule.name}
            onChange={(v) => onUpdate({ ...rule, name: v })}
          />
        ) : (
          <AutoComplete
            size="small"
            className={fieldClassName}
            value={rule.name}
            data={nameOptions}
            placeholder={t("rule.namePlaceholder")}
            onChange={(v) => onUpdate({ ...rule, name: String(v ?? "") })}
          />
        )}
        {isRedirect ? (
          <Input
            size="small"
            placeholder={
              cond.useRegex
                ? t("rule.redirectToRegexPlaceholder")
                : t("rule.redirectToPlaceholder")
            }
            className={fieldClassName}
            value={rule.value}
            onChange={(v) => onUpdate({ ...rule, value: v })}
          />
        ) : isCookie ? (
          <Input
            size="small"
            placeholder={t("rule.cookieValuePlaceholder")}
            className={fieldClassName}
            value={rule.value}
            onChange={(v) => onUpdate({ ...rule, value: v })}
          />
        ) : rule.action === "remove" ? null : (
          <AutoComplete
            size="small"
            className={fieldClassName}
            value={rule.value}
            data={valueOptions}
            placeholder={t("rule.valuePlaceholder")}
            onChange={(v) => onUpdate({ ...rule, value: String(v ?? "") })}
          />
        )}
        {isEditor && (
          <Switch
            size="small"
            checked={rule.enabled}
            onChange={() => onToggle(rule.id)}
          />
        )}
        <div className={cn("flex items-center", isEditor ? "gap-0" : "gap-1")}>
          {isEditor ? (
            <Tooltip
              trigger="hover"
              content={t("common.delete")}
              position="top"
            >
              <Button
                theme="borderless"
                type="tertiary"
                size="small"
                icon={<IconDelete />}
                onClick={() => onDelete(rule.id)}
              />
            </Tooltip>
          ) : (
            <>
              <Popover
                trigger="click"
                position="left"
                autoAdjustOverflow
                content={renderFilterPopover(rule)}
                onVisibleChange={(v) => setOpenFilterId(v ? rule.id : null)}
              >
                <span className="inline-flex">
                  <Tooltip
                    trigger="custom"
                    visible={
                      hoverFilterId === rule.id && openFilterId !== rule.id
                    }
                    content={t("rule.filter")}
                    position="top"
                  >
                    <Button
                      theme="borderless"
                      type="tertiary"
                      size="small"
                      icon={
                        <IconFilter
                          className={
                            filterActive ? "text-semi-color-primary" : undefined
                          }
                        />
                      }
                      onMouseEnter={() => setHoverFilterId(rule.id)}
                      onMouseLeave={() => setHoverFilterId(null)}
                      onClick={() => setHoverFilterId(null)}
                    />
                  </Tooltip>
                </span>
              </Popover>
              <Tooltip
                trigger="hover"
                content={t("common.delete")}
                position="top"
              >
                <Button
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  icon={<IconDelete />}
                  onClick={() => onDelete(rule.id)}
                />
              </Tooltip>
            </>
          )}
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
    <section className="he-editor-section rounded-xl border border-semi-color-border">
      <div className="he-editor-section-header flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={sectionIconClassName}>{renderSectionIcon()}</span>
          <Typography.Text strong className="text-group-title">
            {t(groupTitleKey)}
          </Typography.Text>
          <span className="he-editor-section-count">{rules.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content={t(addLabelKey)} position="topRight">
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              icon={<IconPlus />}
              aria-label={t(addLabelKey)}
              onClick={onAdd}
            />
          </Tooltip>
          <Switch
            size="small"
            checked={groupEnabled}
            disabled={rules.length === 0}
            onChange={(checked) => handleToggleGroup(Boolean(checked))}
          />
        </div>
      </div>

      <div className="flex flex-col">{rows}</div>
    </section>
  );
}
