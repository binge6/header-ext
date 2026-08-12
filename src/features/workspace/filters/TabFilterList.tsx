// Tab 过滤列表（Profile 级 URL 白名单）
// 多条 OR 关系；启用任一项 = 仅匹配 Tab 生效。
// 没有任何启用项时规则作用于全部 Tab。

import { Filter, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TabFilter } from "@/src/domain";
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
        {t("tabFilters.empty")}
      </div>
    ) : (
      filters.map((f) => (
        <div
          key={f.id}
          className={cn(
            isEditor ? editorRuleRowClassName : "flex items-center gap-1 py-1",
            isEditor && !f.enabled && "opacity-70",
          )}
        >
          <Input
            placeholder={t("tabFilters.urlPlaceholder")}
            className={cn("min-w-0 flex-1", isEditor && editorFieldClassName)}
            value={f.urlFilter}
            onChange={(event) =>
              onUpdate({ ...f, urlFilter: event.target.value })
            }
          />
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
          {renderToggle(
            f.enabled,
            f.enabled ? t("filters.disableItem") : t("filters.enableItem"),
            () => onToggle(f.id),
          )}
        </div>
      ))
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
              {t("tabFilters.title")}
            </span>
            <span className={editorSectionCountClassName}>
              {filters.length}
            </span>
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
