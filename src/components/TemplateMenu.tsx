// 一键模板下拉菜单：插入常见 CSP / CORS / X-Frame / UA / no-cache 预设

import { Button, Dropdown } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import { TEMPLATE_KEYS, buildTemplate } from "@/src/core/templates";

interface Props {
  profileId: string | null;
  size?: "small" | "middle";
  /** iconOnly: 仅显示闪电图标（用于紧凑顶栏） */
  iconOnly?: boolean;
}

export function TemplateMenu({ profileId, size = "small", iconOnly }: Props) {
  const { t } = useTranslation();
  const applyTemplate = useProfileStore((s) => s.applyTemplate);

  const items = TEMPLATE_KEYS.map((k) => ({
    key: k,
    label: (
      <div style={{ minWidth: 220 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {t(`templates.${k}`)}
        </div>
        <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
          {t(`templates.${k}Desc`)}
        </div>
      </div>
    ),
    onClick: () => {
      if (!profileId) return;
      applyTemplate(profileId, buildTemplate(k));
    },
  }));

  return (
    <Dropdown
      trigger={["click"]}
      disabled={!profileId}
      menu={{ items }}
      placement="bottomRight"
    >
      <Button size={size} icon={<ThunderboltOutlined />}>
        {iconOnly ? null : t("templates.apply")}
      </Button>
    </Dropdown>
  );
}
