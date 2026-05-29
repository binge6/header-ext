import { useTranslation } from "react-i18next";
import { Button, Divider, Select, Space, Typography } from "antd";
import type { MethodFilter } from "../core/types";

interface Props {
  filters: MethodFilter[];
  onChange: (methods: string[]) => void;
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
// popupRender 底部增加 "全选 / 清空" 快捷操作。
export function MethodFilterPicker({ filters, onChange }: Props) {
  const { t } = useTranslation();
  // 仅保留启用的方法值；停用项视为未选
  const value = filters
    .filter((f) => f.enabled && f.method?.trim())
    .map((f) => f.method.trim().toUpperCase());

  const allSelected = value.length === HTTP_METHODS.length;

  return (
    <div>
      <Typography.Text
        strong
        style={{ fontSize: 13, display: "block", marginBottom: 6 }}
      >
        {t("methodFilters.title")}
      </Typography.Text>
      <Select
        size="small"
        mode="multiple"
        allowClear
        style={{ width: "100%" }}
        value={value}
        placeholder={t("methodFilters.placeholder")}
        options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
        onChange={(next: string[]) => onChange(next.map((m) => m.toUpperCase()))}
        maxTagCount="responsive"
        popupRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "4px 0" }} />
            <Space style={{ padding: "4px 8px" }}>
              <Button
                size="small"
                type="link"
                onClick={() =>
                  onChange(allSelected ? [] : [...HTTP_METHODS])
                }
              >
                {allSelected
                  ? t("methodFilters.clearAll")
                  : t("methodFilters.selectAll")}
              </Button>
            </Space>
          </>
        )}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {value.length === 0
          ? t("methodFilters.empty")
          : t("methodFilters.hint")}
      </Typography.Text>
    </div>
  );
}
