import { useTranslation } from "react-i18next";
import { Button, Divider, Select, Space, Typography } from "@douyinfe/semi-ui";
import { IconFilterStroked as IconFilter } from "@douyinfe/semi-icons";
import type { MethodFilter } from "../core/types";

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
      <Select
        size="small"
        multiple
        showClear
        className="w-full"
        value={value}
        placeholder={t("methodFilters.placeholder")}
        optionList={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
        onChange={(next) =>
          onChange((next as string[]).map((m) => m.toUpperCase()))
        }
        maxTagCount={3}
        outerBottomSlot={
          <>
            <Divider margin="4px" />
            <Space className="px-2 py-1">
              <Button
                size="small"
                theme="borderless"
                type="primary"
                onClick={() => onChange(allSelected ? [] : [...HTTP_METHODS])}
              >
                {allSelected
                  ? t("methodFilters.clearAll")
                  : t("methodFilters.selectAll")}
              </Button>
            </Space>
          </>
        }
      />
      <Typography.Text type="secondary" className="text-xs">
        {value.length === 0
          ? t("methodFilters.empty")
          : t("methodFilters.hint")}
      </Typography.Text>
    </>
  );

  if (variant === "editor") {
    if (filters.length === 0) return null;

    return (
      <section className="he-editor-section rounded-xl border border-semi-color-border">
        <div className="he-editor-section-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="he-editor-section-icon he-editor-section-icon-filter">
              <IconFilter />
            </span>
            <Typography.Text strong className="text-group-title">
              {t("methodFilters.title")}
            </Typography.Text>
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
      <Typography.Text strong className="text-group-title mb-1.5 block">
        {t("methodFilters.title")}
      </Typography.Text>
      {content}
    </div>
  );
}
