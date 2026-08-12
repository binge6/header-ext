import { Pin, PinOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/src/shared/lib/cn";
import { Button } from "@/src/shared/ui/controls";
import { Tooltip } from "@/src/shared/ui/overlays";

interface AlwaysEnableProfileButtonProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function AlwaysEnableProfileButton({
  checked,
  onCheckedChange,
  label,
  side = "top",
  className,
}: AlwaysEnableProfileButtonProps) {
  const { t } = useTranslation();
  const actionLabel = checked
    ? t("popup.disableAlwaysEnableProfile")
    : t("popup.alwaysEnableProfile");
  const tooltip = checked
    ? t("popup.disableAlwaysEnableProfileHint")
    : t("popup.alwaysEnableProfileHint");

  return (
    <Tooltip content={tooltip} side={side}>
      <Button
        variant={checked ? "secondary" : "ghost"}
        size={label ? "sm" : "icon-sm"}
        className={cn(checked && "text-primary", className)}
        aria-label={actionLabel}
        aria-pressed={checked}
        onClick={() => onCheckedChange(!checked)}
      >
        {checked ? <Pin aria-hidden="true" /> : <PinOff aria-hidden="true" />}
        {label && (
          <span>
            {checked
              ? t("popup.alwaysEnabledProfileShort")
              : t("popup.alwaysEnableProfileShort")}
          </span>
        )}
      </Button>
    </Tooltip>
  );
}
