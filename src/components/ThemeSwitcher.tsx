import { useRef } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeMode, type ThemeMode } from "@/src/hooks/useThemeMode";
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
} from "./ui";

interface Props {
  variant?: "icon" | "select";
  size?: "small" | "default";
}

const MODES: ThemeMode[] = ["light", "dark", "system"];

export function ThemeSwitcher({
  variant = "select",
  size = "small",
}: Props = {}) {
  const { t } = useTranslation();
  const { mode, isDark, setMode } = useThemeMode();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const renderIcon = () => {
    if (mode === "system") return <Monitor aria-hidden="true" />;
    return isDark ? (
      <Moon aria-hidden="true" />
    ) : (
      <Sun aria-hidden="true" />
    );
  };

  if (variant === "icon") {
    return (
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) triggerRef.current?.blur();
        }}
      >
        <Tooltip content={t("theme.label")}>
          <DropdownMenuTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              size={size === "small" ? "icon-sm" : "icon"}
              aria-label={t("theme.label")}
            >
              {renderIcon()}
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as ThemeMode)}
          >
            {MODES.map((themeMode) => (
              <DropdownMenuRadioItem key={themeMode} value={themeMode}>
                {t(`theme.${themeMode}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SelectControl
      value={mode}
      className="w-select"
      aria-label={t("theme.label")}
      onValueChange={(value) => setMode(value as ThemeMode)}
      options={MODES.map((themeMode) => ({
        value: themeMode,
        label: t(`theme.${themeMode}`),
      }))}
    />
  );
}
