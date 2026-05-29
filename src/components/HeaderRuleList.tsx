// ModHeader 风格的紧凑规则列表，每行内联编辑
// 同时承担 header 模式 与 cookie-* 模式（kind 决定样式与字段）

import {
  AutoComplete,
  Button,
  Checkbox,
  Input,
  Popover,
  Select,
  Switch,
} from "@douyinfe/semi-ui";
import { IconClose, IconFilter, IconPlus } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import type {
  HeaderAction,
  HeaderRule,
  ResourceType,
  RuleKind,
} from "@/src/core/types";
import { useHistorySuggestions } from "@/src/hooks/useHistorySuggestions";

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
}: Props) {
  const { t } = useTranslation();
  const isCookie =
    kind === "cookie-request-append" || kind === "cookie-response-append";
  const isRedirect = kind === "redirect";
  const { names, valuesByName } = useHistorySuggestions();

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

  const renderFilterPopover = (rule: HeaderRule) => {
    const cond = rule.condition;
    return (
      <div
        style={{
          width: 260,
          maxHeight: 320,
          overflowY: "auto",
          padding: "8px 4px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--he-text-tertiary)",
                marginBottom: 4,
              }}
            >
              {t("rule.filter")}
            </div>
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
              style={{ marginTop: 4 }}
              checked={!!cond.useRegex}
              onChange={(e) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, useRegex: !!e.target.checked },
                })
              }
            >
              <span style={{ fontSize: 12 }}>{t("rule.useRegex")}</span>
            </Checkbox>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--he-text-tertiary)",
                marginBottom: 4,
              }}
            >
              {t("rule.excludeDomains")}
            </div>
            <Select
              size="small"
              multiple
              allowCreate
              filter
              style={{ width: "100%" }}
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
            <div
              style={{
                fontSize: 12,
                color: "var(--he-text-tertiary)",
                marginBottom: 4,
              }}
            >
              {t("rule.resourceTypes")}
            </div>
            <Select
              size="small"
              multiple
              showClear
              style={{ width: "100%" }}
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
            <div
              style={{
                fontSize: 12,
                color: "var(--he-text-tertiary)",
                marginBottom: 4,
              }}
            >
              {t("rule.requestMethods")}
            </div>
            <Select
              size="small"
              multiple
              showClear
              style={{ width: "100%" }}
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

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 0",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t(groupTitleKey)}
        </span>
        <Button
          theme="borderless"
          type="tertiary"
          size="small"
          icon={<IconPlus />}
          onClick={onAdd}
        >
          {t(addLabelKey)}
        </Button>
      </div>

      {rules.length === 0
        ? null
        : rules.map((rule) => {
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
                      !rule.name ||
                      n.toLowerCase().includes(rule.name.toLowerCase())
                  )
                  .slice(0, 20)
                  .map((n) => ({ value: n, label: n }));
            // 当前 name 对应的历史值
            const valueOptions = isCookie
              ? []
              : (valuesByName.get(rule.name) ?? [])
                  .filter(
                    (v) =>
                      !rule.value ||
                      v.toLowerCase().includes(rule.value.toLowerCase())
                  )
                  .slice(0, 20)
                  .map((v) => ({ value: v, label: v }));
            return (
              <div
                key={rule.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 0",
                }}
              >
                <Switch
                  size="small"
                  checked={rule.enabled}
                  onChange={() => onToggle(rule.id)}
                />
                {/* header 模式才有 action 选择器；redirect / cookie 不需要 */}
                {!isCookie && !isRedirect && (
                  <Select
                    size="small"
                    style={{ width: 76 }}
                    value={rule.action}
                    onChange={(v) =>
                      onUpdate({ ...rule, action: v as HeaderAction })
                    }
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
                    style={{ flex: 1, minWidth: 0 }}
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
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.name}
                    onChange={(v) => onUpdate({ ...rule, name: v })}
                  />
                ) : (
                  <AutoComplete
                    size="small"
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.name}
                    data={nameOptions}
                    placeholder={t("rule.namePlaceholder")}
                    onChange={(v) =>
                      onUpdate({ ...rule, name: String(v ?? "") })
                    }
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
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.value}
                    onChange={(v) => onUpdate({ ...rule, value: v })}
                  />
                ) : isCookie ? (
                  <Input
                    size="small"
                    placeholder={t("rule.cookieValuePlaceholder")}
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.value}
                    onChange={(v) => onUpdate({ ...rule, value: v })}
                  />
                ) : (
                  <AutoComplete
                    size="small"
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.value}
                    data={valueOptions}
                    placeholder={t("rule.valuePlaceholder")}
                    disabled={rule.action === "remove"}
                    onChange={(v) =>
                      onUpdate({ ...rule, value: String(v ?? "") })
                    }
                  />
                )}
                <Popover
                  trigger="click"
                  position="left"
                  autoAdjustOverflow
                  content={renderFilterPopover(rule)}
                >
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={
                      <IconFilter
                        style={{
                          color: filterActive
                            ? "var(--he-color-primary)"
                            : undefined,
                        }}
                      />
                    }
                  />
                </Popover>
                <Button
                  theme="borderless"
                  type="danger"
                  size="small"
                  icon={<IconClose />}
                  onClick={() => onDelete(rule.id)}
                />
              </div>
            );
          })}
    </div>
  );
}
