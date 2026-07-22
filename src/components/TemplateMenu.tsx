import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions } from "@/src/store/profileStore";
import { TEMPLATE_KEYS, buildTemplate } from "@/src/core/templates";
import { MenuItemLabel } from "./MenuItemLabel";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Tooltip,
} from "./ui";

interface Props {
  profileId: string | null;
  size?: "small" | "default";
  /** iconOnly: 仅显示闪电图标（用于紧凑顶栏） */
  iconOnly?: boolean;
}

export function TemplateMenu({ profileId, size = "small", iconOnly }: Props) {
  const { t } = useTranslation();
  const applyTemplate = useProfileActions().applyTemplate;

  return (
    <DropdownMenu>
      <Tooltip content={t("templates.apply")} disabled={!iconOnly}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={
              iconOnly ? (size === "small" ? "icon-sm" : "icon") : "sm"
            }
            disabled={!profileId}
            aria-label={iconOnly ? t("templates.apply") : undefined}
          >
            <Zap aria-hidden="true" />
            {!iconOnly && t("templates.apply")}
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-76">
        <DropdownMenuLabel>{t("templates.title")}</DropdownMenuLabel>
          {TEMPLATE_KEYS.map((k) => (
          <DropdownMenuItem
              key={k}
              onClick={() => {
                if (!profileId) return;
                applyTemplate(profileId, buildTemplate(k));
              }}
            >
              <MenuItemLabel
                title={t(`templates.${k}`)}
                desc={t(`templates.${k}Desc`)}
              />
          </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
