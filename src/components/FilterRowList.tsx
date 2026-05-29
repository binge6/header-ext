// 通用「单字段过滤项」列表：开关 + 输入框 + 删除
// 用于：请求域名 / 排除域名 / URL 正则等同构结构。
// items 内部字段名通过 valueField 指定，存取从 i18n key 注入。

import { Button, Input, Switch, Tooltip } from "@douyinfe/semi-ui";
import { IconClose, IconPlus } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 0",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t(`${i18nKey}.title`)}
        </span>
        <Button
          theme="borderless"
          type="tertiary"
          size="small"
          icon={<IconPlus />}
          onClick={onAdd}
        >
          {t(`${i18nKey}.addItem`)}
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
          {t(`${i18nKey}.empty`)}
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
              placeholder={t(`${i18nKey}.placeholder`)}
              style={{ flex: 1, minWidth: 0 }}
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
