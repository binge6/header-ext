// ModHeader 风格的紧凑规则列表，每行内联编辑
// 同时承担 header 模式 与 cookie-* 模式（kind 决定样式与字段）

import {
  AutoComplete,
  Button,
  Checkbox,
  Input,
  Popover,
  Select,
  Space,
  Switch,
  Tooltip,
} from "antd";
import { CloseOutlined, FilterOutlined, PlusOutlined } from "@ant-design/icons";
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
      <div style={{ width: 320 }}>
        <Space orientation="vertical" size={8} style={{ width: "100%" }}>
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
              onChange={(e) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, urlFilter: e.target.value },
                })
              }
            />
            <Checkbox
              style={{ marginTop: 4 }}
              checked={!!cond.useRegex}
              onChange={(e) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, useRegex: e.target.checked },
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
              mode="tags"
              style={{ width: "100%" }}
              placeholder={t("rule.excludeDomainsPlaceholder")}
              value={cond.excludedDomains ?? []}
              onChange={(v: string[]) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, excludedDomains: v },
                })
              }
              tokenSeparators={[",", " "]}
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
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder={t("rule.resourceTypesPlaceholder")}
              value={cond.resourceTypes ?? []}
              onChange={(v: ResourceType[]) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, resourceTypes: v },
                })
              }
              options={RESOURCE_TYPES.map((rt) => ({ value: rt, label: rt }))}
              maxTagCount="responsive"
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
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder={t("rule.requestMethodsPlaceholder")}
              value={cond.requestMethods ?? []}
              onChange={(v: string[]) =>
                onUpdate({
                  ...rule,
                  condition: { ...cond, requestMethods: v },
                })
              }
              options={REQUEST_METHODS.map((m) => ({
                value: m,
                label: m.toUpperCase(),
              }))}
              maxTagCount="responsive"
            />
          </div>
        </Space>
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
          type="text"
          size="small"
          icon={<PlusOutlined />}
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
                  .map((n) => ({ value: n }));
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
                  .map((v) => ({ value: v }));
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
                    onChange={(v: HeaderAction) =>
                      onUpdate({ ...rule, action: v })
                    }
                    options={ACTION_OPTIONS.map((a) => ({
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
                    onChange={(e) =>
                      onUpdate({
                        ...rule,
                        condition: { ...cond, urlFilter: e.target.value },
                      })
                    }
                  />
                ) : isCookie ? (
                  <Input
                    size="small"
                    placeholder={t("rule.cookieNamePlaceholder")}
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.name}
                    onChange={(e) =>
                      onUpdate({ ...rule, name: e.target.value })
                    }
                  />
                ) : (
                  <AutoComplete
                    size="small"
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.name}
                    options={nameOptions}
                    placeholder={t("rule.namePlaceholder")}
                    onChange={(v: string) => onUpdate({ ...rule, name: v })}
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
                    onChange={(e) =>
                      onUpdate({ ...rule, value: e.target.value })
                    }
                  />
                ) : isCookie ? (
                  <Input
                    size="small"
                    placeholder={t("rule.cookieValuePlaceholder")}
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.value}
                    onChange={(e) =>
                      onUpdate({ ...rule, value: e.target.value })
                    }
                  />
                ) : (
                  <AutoComplete
                    size="small"
                    style={{ flex: 1, minWidth: 0 }}
                    value={rule.value}
                    options={valueOptions}
                    placeholder={t("rule.valuePlaceholder")}
                    disabled={rule.action === "remove"}
                    onChange={(v: string) => onUpdate({ ...rule, value: v })}
                  />
                )}
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={renderFilterPopover(rule)}
                >
                  <Tooltip title={t("rule.filter")} placement="topRight">
                    <Button
                      type="text"
                      size="small"
                      icon={
                        <FilterOutlined
                          style={{
                            color: filterActive
                              ? "var(--he-color-primary)"
                              : undefined,
                          }}
                        />
                      }
                    />
                  </Tooltip>
                </Popover>
                <Tooltip title={t("rule.deleteRule")} placement="topRight">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => onDelete(rule.id)}
                  />
                </Tooltip>
              </div>
            );
          })}
    </div>
  );
}
