import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions } from "@/src/application/profile-store";
import { TEMPLATE_KEYS, buildTemplate } from "@/src/domain";
import { MenuItemLabel } from "../components/MenuItemLabel";
import {
  Button,
  DropdownMenuItem,
  DropdownMenuLabel,
  TooltipDropdownMenu,
  TooltipDropdownMenuContent,
  TooltipDropdownMenuTrigger,
} from "@/src/shared/ui";

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
    <TooltipDropdownMenu>
      <TooltipDropdownMenuTrigger
        disabled={!profileId}
        tooltip={iconOnly ? t("templates.apply") : undefined}
      >
        <Button
          variant={iconOnly ? "ghost" : "outline"}
          size={iconOnly ? (size === "small" ? "icon-sm" : "icon") : "sm"}
          disabled={!profileId}
          aria-label={iconOnly ? t("templates.apply") : undefined}
        >
          <Zap aria-hidden="true" />
          {!iconOnly && t("templates.apply")}
        </Button>
      </TooltipDropdownMenuTrigger>
      <TooltipDropdownMenuContent align="end" className="w-76">
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
      </TooltipDropdownMenuContent>
    </TooltipDropdownMenu>
  );
}
