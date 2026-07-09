// 通用「单字段过滤项」列表：开关 + 输入框 + 删除
// 用于：请求域名 / 排除域名 / URL 正则等同构结构。
// items 内部字段名通过 valueField 指定，存取从 i18n key 注入。

import { Button, Input, Switch, Tooltip, Typography } from "@douyinfe/semi-ui";
import { IconClose } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
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
}

export function FilterRowList<T extends FilterRowItem>({
  filters,
  valueField,
  i18nKey,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: Props<T>) {
  const { t } = useTranslation();

  return (
    <div>
      <GroupHeader
        title={t(`${i18nKey}.title`)}
        addLabel={t(`${i18nKey}.addItem`)}
        onAdd={onAdd}
      />

      {filters.length === 0 ? (
        <Typography.Text type="tertiary" size="small" className="block py-1">
          {t(`${i18nKey}.empty`)}
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
              placeholder={t(`${i18nKey}.placeholder`)}
              className="min-w-0 flex-1"
              value={(f[valueField] as unknown as string) ?? ""}
              onChange={(v) => onUpdate({ ...f, [valueField]: v } as T)}
            />
            <Tooltip content={t(`${i18nKey}.deleteItem`)} position="topRight">
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
