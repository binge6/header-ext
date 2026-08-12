import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import type { MethodFilter } from "@/src/domain";
import { SUPPORTED_REQUEST_METHODS } from "@/src/domain";
import { Button, MultiSelect } from "@/src/shared/ui";
import { cn } from "@/src/shared/lib/cn";
import {
  editorSectionClassName,
  editorSectionCountClassName,
  editorSectionHeaderClassName,
  editorSectionIconClassName,
  editorSectionIconVariants,
  editorSectionTitleClassName,
  mutedTextClassName,
} from "../components/editor-styles";

interface Props {
  filters: MethodFilter[];
  onChange: (methods: string[]) => void;
  variant?: "compact" | "editor";
}

// DNR requestMethods 支持的方法（大写展示）；不含 TRACE——Chrome/Firefox 均不支持
const HTTP_METHODS = SUPPORTED_REQUEST_METHODS.map((method) =>
  method.toUpperCase(),
);

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
        <span className={mutedTextClassName}>
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
              {t("methodFilters.title")}
            </span>
            <span className={editorSectionCountClassName}>{value.length}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 p-3">{content}</div>
      </section>
    );
  }

  return (
    <div>
      <div className={cn(editorSectionTitleClassName, "mb-1.5")}>
        {t("methodFilters.title")}
      </div>
      {content}
    </div>
  );
}
