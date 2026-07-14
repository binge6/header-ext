// Tab 过滤列表（Profile 级 URL 白名单）
// 多条 OR 关系；启用任一项 = 仅匹配 Tab 生效。
// 没有任何启用项时规则作用于全部 Tab。

import { Button, Input, Switch, Tooltip, Typography } from "@douyinfe/semi-ui";
import { IconDelete, IconFilter, IconPlus } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import type { TabFilter } from "@/src/core/types";
import { cn } from "@/src/utils/cn";
import { GroupHeader } from "./GroupHeader";

interface Props {
  filters: TabFilter[];
  onAdd: () => void;
  onUpdate: (filter: TabFilter) => void;
  onDelete: (filterId: string) => void;
  onToggle: (filterId: string) => void;
  variant?: "compact" | "editor";
}

export function TabFilterList({
  filters,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  variant = "compact",
}: Props) {
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
      <Typography.Text type="tertiary" size="small" className="block py-1">
        {t("tabFilters.empty")}
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
            placeholder={t("tabFilters.urlPlaceholder")}
            className={cn("min-w-0 flex-1", isEditor && "he-editor-field")}
            value={f.urlFilter}
            onChange={(v) => onUpdate({ ...f, urlFilter: v })}
          />
          {isEditor && (
            <Switch
              size="small"
              checked={f.enabled}
              onChange={() => onToggle(f.id)}
            />
          )}
          <Tooltip content={t("tabFilters.deleteItem")} position="topRight">
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
    return (
      <section className="he-editor-section rounded-xl border border-semi-color-border p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="he-editor-section-icon he-editor-section-icon-filter">
              <IconFilter />
            </span>
            <Typography.Text strong className="text-group-title">
              {t("tabFilters.title")}
            </Typography.Text>
          </div>
          <Switch
            size="small"
            checked={groupEnabled}
            disabled={filters.length === 0}
            onChange={(checked) => handleToggleGroup(Boolean(checked))}
          />
        </div>
        <div className="flex flex-col">{rows}</div>
        <Button
          theme="borderless"
          type="tertiary"
          size="small"
          className="mt-1 px-0 text-group-title"
          icon={<IconPlus />}
          onClick={onAdd}
        >
          {t("tabFilters.addItem")}
        </Button>
      </section>
    );
  }

  return (
    <div>
      <GroupHeader
        title={t("tabFilters.title")}
        addLabel={t("tabFilters.addItem")}
        onAdd={onAdd}
      />

      {rows}
    </div>
  );
}
