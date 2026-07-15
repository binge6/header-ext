// 通用「单字段过滤项」列表：开关 + 输入框 + 删除
// 用于：请求域名 / 排除域名 / URL 正则等同构结构。
// items 内部字段名通过 valueField 指定，存取从 i18n key 注入。

import { Button, Input, Switch, Tooltip, Typography } from "@douyinfe/semi-ui";
import {
  IconDeleteStroked as IconDelete,
  IconFilterStroked as IconFilter,
  IconPlusStroked as IconPlus,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/utils/cn";
import { GroupHeader } from "./GroupHeader";

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
  variant = "compact",
}: Props<T>) {
  const { t } = useTranslation();
  const isEditor = variant === "editor";
  const groupEnabled = filters.some((filter) => filter.enabled);

  const handleToggleGroup = (enabled: boolean) => {
    filters.forEach((filter) => {
      if (filter.enabled !== enabled) onToggle(filter.id);
    });
  };

  const rows =
    filters.length === 0 ? (
      <Typography.Text
        type="tertiary"
        size="small"
        className={cn("block", isEditor ? "px-3 py-2" : "py-1")}
      >
        {t(`${i18nKey}.empty`)}
      </Typography.Text>
    ) : (
      filters.map((f) => (
        <div
          key={f.id}
          className={cn(
            "flex items-center py-1",
            isEditor ? "he-editor-rule-row gap-1.5" : "gap-1",
            isEditor && !f.enabled && "opacity-70",
          )}
        >
          {!isEditor && (
            <Switch
              size="small"
              checked={f.enabled}
              onChange={() => onToggle(f.id)}
            />
          )}
          <Input
            size="small"
            placeholder={t(`${i18nKey}.placeholder`)}
            className={cn("min-w-0 flex-1", isEditor && "he-editor-field")}
            value={(f[valueField] as unknown as string) ?? ""}
            onChange={(v) => onUpdate({ ...f, [valueField]: v } as T)}
          />
          {isEditor && (
            <Switch
              size="small"
              checked={f.enabled}
              onChange={() => onToggle(f.id)}
            />
          )}
          <Tooltip content={t(`${i18nKey}.deleteItem`)} position="topRight">
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              icon={<IconDelete />}
              onClick={() => onDelete(f.id)}
            />
          </Tooltip>
        </div>
      ))
    );

  if (isEditor) {
    if (filters.length === 0) return null;

    return (
      <section className="he-editor-section rounded-xl border border-semi-color-border">
        <div className="he-editor-section-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="he-editor-section-icon he-editor-section-icon-filter">
              <IconFilter />
            </span>
            <Typography.Text strong className="text-group-title">
              {t(`${i18nKey}.title`)}
            </Typography.Text>
            <span className="he-editor-section-count">{filters.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={t(`${i18nKey}.addItem`)} position="topRight">
              <Button
                theme="borderless"
                type="tertiary"
                size="small"
                icon={<IconPlus />}
                aria-label={t(`${i18nKey}.addItem`)}
                onClick={onAdd}
              />
            </Tooltip>
            <Switch
              size="small"
              checked={groupEnabled}
              disabled={filters.length === 0}
              onChange={(checked) => handleToggleGroup(Boolean(checked))}
            />
          </div>
        </div>
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
