import { useRef } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { setLanguage, SUPPORTED_LANGS, type Lang } from "@/src/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  SelectControl,
  Tooltip,
} from "@/src/ui";

interface Props {
  /** icon: 仅图标按钮（适合空间紧凑的顶栏/底栏）；select: 下拉选择 */
  variant?: "icon" | "select";
  size?: "small" | "default";
}

export function LanguageSwitcher({
  variant = "select",
  size = "small",
}: Props = {}) {
  const { i18n, t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (variant === "icon") {
    return (
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) triggerRef.current?.blur();
        }}
      >
        <Tooltip content={t("language.label")}>
          <DropdownMenuTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size={size === "small" ? "icon-sm" : "icon"}
              aria-label={t("language.label")}
            >
              <Languages aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={i18n.language}
            onValueChange={(value) => void setLanguage(value as Lang)}
          >
            {SUPPORTED_LANGS.map((language) => (
              <DropdownMenuRadioItem key={language} value={language}>
                {t(`language.${language}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SelectControl
      value={i18n.language as Lang}
      className="w-select"
      aria-label={t("language.label")}
      onValueChange={(value) => void setLanguage(value as Lang)}
      options={SUPPORTED_LANGS.map((language) => ({
        value: language,
        label: t(`language.${language}`),
      }))}
    />
  );
}
