// 一键模板下拉菜单：插入常见 CSP / CORS / X-Frame / UA / no-cache 预设

import { Button, Dropdown } from "@douyinfe/semi-ui";
import { IconBolt } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import { TEMPLATE_KEYS, buildTemplate } from "@/src/core/templates";

interface Props {
  profileId: string | null;
  size?: "small" | "default";
  /** iconOnly: 仅显示闪电图标（用于紧凑顶栏） */
  iconOnly?: boolean;
}

export function TemplateMenu({ profileId, size = "small", iconOnly }: Props) {
  const { t } = useTranslation();
  const applyTemplate = useProfileStore((s) => s.applyTemplate);

  return (
    <Dropdown
      trigger="click"
      position="bottomRight"
      render={
        <Dropdown.Menu>
          {TEMPLATE_KEYS.map((k) => (
            <Dropdown.Item
              key={k}
              onClick={() => {
                if (!profileId) return;
                applyTemplate(profileId, buildTemplate(k));
              }}
            >
              <div style={{ minWidth: 220 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {t(`templates.${k}`)}
                </div>
                <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
                  {t(`templates.${k}Desc`)}
                </div>
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      }
    >
      <Button size={size} icon={<IconBolt />} disabled={!profileId}>
        {iconOnly ? null : t("templates.apply")}
      </Button>
    </Dropdown>
  );
}
