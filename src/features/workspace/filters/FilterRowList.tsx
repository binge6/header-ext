// 通用「单字段过滤项」列表：开关 + 输入框 + 删除
// 用于：请求域名 / 排除域名 / URL 正则等同构结构。
// items 内部字段名通过 valueField 指定，存取从 i18n key 注入。

import { AlertTriangle, Filter, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/shared/lib/cn";
import { Button, Checkbox, Input, Tooltip } from "@/src/shared/ui";
import { GroupHeader } from "../components/GroupHeader";
import {
  editorFieldClassName,
  editorRuleRowClassName,
  editorSectionClassName,
  editorSectionCountClassName,
  editorSectionHeaderClassName,
  editorSectionIconClassName,
  editorSectionIconVariants,
  editorSectionTitleClassName,
  mutedTextClassName,
} from "../components/editor-styles";

export interface FilterRowItem {
  id: string;
  enabled: boolean;
}

interface Props<T extends FilterRowItem> {
  filters: T[];
  /** 字段名：domain / regex / urlFilter ... */
  valueField: Exclude<keyof T, "id" | "enabled"> & string;
  /** i18n 命名空间，需提供：title / addItem / placeholder / empty / deleteItem */
  i18nKey: string;
  onAdd: () => void;
  onUpdate: (filter: T) => void;
  onDelete: (filterId: string) => void;
  onToggle: (filterId: string) => void;
  errorMessages?: Record<string, string>;
  alertMessages?: string[];
  variant?: "compact" | "editor";
}

export function FilterRowList<T extends FilterRowItem>({
  filters,
  valueField,
  i18nKey,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  errorMessages,
  alertMessages,
  variant = "compact",
}: Props<T>) {
  const { t } = useTranslation();
  const isEditor = variant === "editor";
  const groupEnabled = filters.some((filter) => filter.enabled);
  const groupToggleState =
    groupEnabled && filters.some((filter) => !filter.enabled)
      ? "indeterminate"
      : groupEnabled;
  const groupPartiallyEnabled = groupToggleState === "indeterminate";
  const groupToggleLabel =
    groupEnabled && !groupPartiallyEnabled
      ? t("filters.disableGroup")
      : t("filters.enableGroup");

  const handleToggleGroup = (enabled: boolean) => {
    filters.forEach((filter) => {
      if (filter.enabled !== enabled) onToggle(filter.id);
    });
  };

  const renderToggle = (
    checked: boolean,
    ariaLabel: string,
    onCheckedChange: (checked: boolean) => void,
    disabled = false,
  ) => (
    <Tooltip content={ariaLabel} keepOpenOnClick>
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onCheckedChange={onCheckedChange}
      />
    </Tooltip>
  );

  const renderGroupToggle = () => (
    <Tooltip content={groupToggleLabel} keepOpenOnClick>
      <Checkbox
        checked={groupToggleState}
        disabled={filters.length === 0}
        aria-label={groupToggleLabel}
        onCheckedChange={handleToggleGroup}
      />
    </Tooltip>
  );

  const rows =
    filters.length === 0 ? (
      <div className={cn(mutedTextClassName, isEditor ? "px-3 py-2" : "py-1")}>
        {t(`${i18nKey}.empty`)}
      </div>
    ) : (
      filters.map((f) => {
        const errorMessage = errorMessages?.[f.id];
        return (
          <div
            key={f.id}
            className={cn(
              isEditor
                ? editorRuleRowClassName
                : "flex items-center gap-1 py-1",
              isEditor && !f.enabled && "opacity-70",
            )}
          >
            <Input
              placeholder={t(`${i18nKey}.placeholder`)}
              className={cn("min-w-0 flex-1", isEditor && editorFieldClassName)}
              value={(f[valueField] as unknown as string) ?? ""}
              onChange={(event) =>
                onUpdate({ ...f, [valueField]: event.target.value } as T)
              }
            />
            {errorMessage && (
              <Tooltip content={errorMessage}>
                <span
                  className="inline-flex h-7 w-7 items-center justify-center text-warning"
                  role="img"
                  aria-label={errorMessage}
                >
                  <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                </span>
              </Tooltip>
            )}
            <Tooltip content={t(`${i18nKey}.deleteItem`)}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t(`${i18nKey}.deleteItem`)}
                onClick={() => onDelete(f.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </Tooltip>
            {renderToggle(
              f.enabled,
              f.enabled ? t("filters.disableItem") : t("filters.enableItem"),
              () => onToggle(f.id),
            )}
          </div>
        );
      })
    );

  if (isEditor) {
    if (filters.length === 0) return null;

    return (
      <section className={editorSectionClassName}>
        <div className={editorSectionHeaderClassName}>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                editorSectionIconClassName,
                editorSectionIconVariants.filter,
              )}
            >
              <Filter aria-hidden="true" />
            </span>
            <span className={editorSectionTitleClassName}>
              {t(`${i18nKey}.title`)}
            </span>
            <span className={editorSectionCountClassName}>
              {filters.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={t(`${i18nKey}.addItem`)}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t(`${i18nKey}.addItem`)}
                onClick={onAdd}
              >
                <Plus aria-hidden="true" />
              </Button>
            </Tooltip>
            {renderGroupToggle()}
          </div>
        </div>
        {!!alertMessages?.length && (
          <div className="flex items-start gap-2 border-b border-warning/30 bg-warning-soft px-3 py-2 text-xs leading-4.5 text-warning">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            <span>{alertMessages.join(" · ")}</span>
          </div>
        )}
        <div className="flex flex-col">{rows}</div>
      </section>
    );
  }

  return (
    <div>
      <GroupHeader
        title={t(`${i18nKey}.title`)}
        addLabel={t(`${i18nKey}.addItem`)}
        onAdd={onAdd}
      />

      {rows}
    </div>
  );
}
