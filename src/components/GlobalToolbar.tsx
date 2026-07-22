import { PauseCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { Badge, Switch } from "./ui";

export function GlobalToolbar() {
  const { t } = useTranslation();
  const paused = useProfileStore((s) => s.meta.globalPaused);
  const { togglePause } = useProfileActions();

  return (
    <div className="flex items-center gap-2">
      {paused && (
        <Badge variant="warning" className="gap-1">
          <PauseCircle aria-hidden="true" className="h-3 w-3" />
          {t("popup.globalPaused")}
        </Badge>
      )}
      <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium leading-none">
        {t("options.globalPaused")}
        <Switch
          checked={paused}
          aria-label={t("options.globalPaused")}
          onCheckedChange={() => togglePause()}
        />
      </label>
    </div>
  );
}
