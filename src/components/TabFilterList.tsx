// ModHeader 风格的 Tab 过滤列表（Profile 级 URL 白名单）
// 多条 OR 关系；启用任一项 = 仅匹配 Tab 生效。
// 没有任何启用项时规则作用于全部 Tab。

import { Button, Input, Switch, Tooltip } from "antd";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { TabFilter } from "@/src/core/types";

interface Props {
  filters: TabFilter[];
  onAdd: () => void;
  onUpdate: (filter: TabFilter) => void;
  onDelete: (filterId: string) => void;
  onToggle: (filterId: string) => void;
}

export function TabFilterList({
  filters,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: Props) {
  const { t } = useTranslation();

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
          {t("tabFilters.title")}
        </span>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAdd}
        >
          {t("tabFilters.addItem")}
        </Button>
      </div>

      {filters.length === 0 ? (
        <div
          style={{
            color: "var(--he-text-tertiary)",
            fontSize: 12,
            padding: "4px 0",
          }}
        >
          {t("tabFilters.empty")}
        </div>
      ) : (
        filters.map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 0",
            }}
          >
            <Switch
              size="small"
              checked={f.enabled}
              onChange={() => onToggle(f.id)}
            />
            <Input
              size="small"
              placeholder={t("tabFilters.urlPlaceholder")}
              style={{ flex: 1, minWidth: 0 }}
              value={f.urlFilter}
              onChange={(e) => onUpdate({ ...f, urlFilter: e.target.value })}
            />
            <Tooltip title={t("tabFilters.deleteItem")} placement="topRight">
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => onDelete(f.id)}
              />
            </Tooltip>
          </div>
        ))
      )}
    </div>
  );
}
