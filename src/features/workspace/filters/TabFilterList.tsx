// Tab 过滤列表（Profile 级 URL 白名单）
// 多条 OR 关系；启用任一项 = 仅匹配 Tab 生效。
// 没有任何启用项时规则作用于全部 Tab。

import { Filter, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TabFilter } from "@/src/domain";
import { cn } from "@/src/shared/lib/cn";
import { Button, Checkbox, Input, Tooltip } from "@/src/shared/ui";
import { GroupHeader } from "../components/GroupHeader";

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
        disabled={filters.length === 0}
        aria-label={groupToggleLabel}
        onCheckedChange={handleToggleGroup}
      />
    </Tooltip>
  );

  const rows =
    filters.length === 0 ? (
      <div className={cn("he-muted-text", isEditor ? "px-3 py-2" : "py-1")}>
        {t("tabFilters.empty")}
      </div>
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
          {!isEditor &&
            renderToggle(
              f.enabled,
              f.enabled ? t("filters.disableItem") : t("filters.enableItem"),
              () => onToggle(f.id),
            )}
          <Input
            placeholder={t("tabFilters.urlPlaceholder")}
            className={cn("min-w-0 flex-1", isEditor && "he-editor-field")}
            value={f.urlFilter}
            onChange={(event) =>
              onUpdate({ ...f, urlFilter: event.target.value })
            }
          />
          {isEditor &&
            renderToggle(
              f.enabled,
              f.enabled ? t("filters.disableItem") : t("filters.enableItem"),
              () => onToggle(f.id),
            )}
          <Tooltip content={t("tabFilters.deleteItem")}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("tabFilters.deleteItem")}
              onClick={() => onDelete(f.id)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      ))
    );

  if (isEditor) {
    if (filters.length === 0) return null;

    return (
      <section className="he-editor-section">
        <div className="he-editor-section-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="he-editor-section-icon he-editor-section-icon-filter">
              <Filter aria-hidden="true" />
            </span>
            <span className="he-section-title">{t("tabFilters.title")}</span>
            <span className="he-editor-section-count">{filters.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={t("tabFilters.addItem")}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("tabFilters.addItem")}
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
