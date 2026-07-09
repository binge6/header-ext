// Tab 过滤列表（Profile 级 URL 白名单）
// 多条 OR 关系；启用任一项 = 仅匹配 Tab 生效。
// 没有任何启用项时规则作用于全部 Tab。

import { Button, Input, Switch, Tooltip, Typography } from "@douyinfe/semi-ui";
import { IconClose } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import type { TabFilter } from "@/src/core/types";
import { GroupHeader } from "./GroupHeader";

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
      <GroupHeader
        title={t("tabFilters.title")}
        addLabel={t("tabFilters.addItem")}
        onAdd={onAdd}
      />

      {filters.length === 0 ? (
        <Typography.Text type="tertiary" size="small" className="block py-1">
          {t("tabFilters.empty")}
        </Typography.Text>
      ) : (
        filters.map((f) => (
          <div key={f.id} className="flex items-center gap-1 py-1">
            <Switch
              size="small"
              checked={f.enabled}
              onChange={() => onToggle(f.id)}
            />
            <Input
              size="small"
              placeholder={t("tabFilters.urlPlaceholder")}
              className="min-w-0 flex-1"
              value={f.urlFilter}
              onChange={(v) => onUpdate({ ...f, urlFilter: v })}
            />
            <Tooltip content={t("tabFilters.deleteItem")} position="topRight">
              <Button
                theme="borderless"
                type="danger"
                size="small"
                icon={<IconClose />}
                onClick={() => onDelete(f.id)}
              />
            </Tooltip>
          </div>
        ))
      )}
    </div>
  );
}
