import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import type { MethodFilter } from "../core/types";
import { Button, MultiSelect } from "./ui";

interface Props {
  filters: MethodFilter[];
  onChange: (methods: string[]) => void;
  variant?: "compact" | "editor";
}

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "CONNECT",
  "TRACE",
];

// 请求方法过滤：以多选下拉形式呈现，避免逐项添加。
// outerBottomSlot 底部增加 "全选 / 清空" 快捷操作。
export function MethodFilterPicker({
  filters,
  onChange,
  variant = "compact",
}: Props) {
  const { t } = useTranslation();
  // 仅保留启用的方法值；停用项视为未选
  const value = filters
    .filter((f) => f.enabled && f.method?.trim())
    .map((f) => f.method.trim().toUpperCase());

  const allSelected = value.length === HTTP_METHODS.length;

  const content = (
    <>
      <MultiSelect
        className="w-full"
        value={value}
        placeholder={t("methodFilters.placeholder")}
        options={HTTP_METHODS.map((method) => ({
          value: method,
          label: method,
        }))}
        onValueChange={(next) =>
          onChange(next.map((method) => method.toUpperCase()))
        }
      />
      <div className="flex items-center justify-between gap-3">
        <span className="he-muted-text">
          {value.length === 0
            ? t("methodFilters.empty")
            : t("methodFilters.hint")}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange(allSelected ? [] : [...HTTP_METHODS])}
        >
          {allSelected
            ? t("methodFilters.clearAll")
            : t("methodFilters.selectAll")}
        </Button>
      </div>
    </>
  );

  if (variant === "editor") {
    if (filters.length === 0) return null;

    return (
      <section className="he-editor-section">
        <div className="he-editor-section-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="he-editor-section-icon he-editor-section-icon-filter">
              <Filter aria-hidden="true" />
            </span>
            <span className="he-section-title">
              {t("methodFilters.title")}
            </span>
            <span className="he-editor-section-count">{value.length}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          {content}
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="he-section-title mb-1.5">
        {t("methodFilters.title")}
      </div>
      {content}
    </div>
  );
}
