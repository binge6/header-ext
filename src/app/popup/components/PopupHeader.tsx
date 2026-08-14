import { useRef, type ChangeEvent } from "react";
import {
  BookOpenText,
  Lock,
  MoreHorizontal,
  Pause,
  Play,
  Settings2,
  Unlock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProfileActions } from "@/src/application/profile-store";
import { parseImport } from "@/src/domain";
import { ImportExportButtons } from "@/src/features/data-transfer";
import {
  LanguageSwitcher,
  MANUAL_URL,
  ThemeSwitcher,
} from "@/src/features/preferences";
import {
  detectCapabilities,
  openExternalPage,
  openOptionsPage,
} from "@/src/platform/browser";
import { readFileAsText } from "@/src/platform/files";
import { cn } from "@/src/shared/lib/cn";
import { Button } from "@/src/shared/ui/controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from "@/src/shared/ui/overlays";

interface Props {
  logoUrl: string;
  globalPaused: boolean;
  enabledProfilesCount: number;
  enabledRuleCount: number;
  locked: boolean;
  lockedHere: boolean;
  lockLabel: string;
  canToggleLock: boolean;
  onTogglePause: () => void;
  onToggleTabLock: () => void;
}

export function PopupHeader({
  logoUrl,
  globalPaused,
  enabledProfilesCount,
  enabledRuleCount,
  locked,
  lockedHere,
  lockLabel,
  canToggleLock,
  onTogglePause,
  onToggleTabLock,
}: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const { mergeProfiles } = useProfileActions();
  const isFirefox = detectCapabilities().isFirefox;

  // 文件选择器托管在此处而非菜单内的 ImportExportButtons：
  // 打开系统文件框会让 popup 失焦、下拉菜单卸载，若 input 挂在菜单里会随之
  // 销毁导致 change 收不到。Firefox 则直接引导到 Options 页完成导入。
  const handleImportClick = () => {
    if (isFirefox) {
      void openOptionsPage();
      return;
    }
    fileRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const { profiles: incoming, meta: incomingMeta } = parseImport(text);
      mergeProfiles(incoming, incomingMeta);
      toast.success(t("options.importSuccess", { count: incoming.length }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "unknown";
      toast.error(t("options.importFailed", { msg }));
    }
  };

  return (
    <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border/70 bg-card px-2.5 py-1.75">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          className="h-7.5 w-7.5 shrink-0 rounded-lg shadow-soft"
          src={logoUrl}
          alt="Header Ext"
        />
        <div className="min-w-0">
          <div className="truncate text-group-title font-bold text-foreground">
            {t("app.name")}
          </div>
          <div className="truncate text-micro leading-4 text-muted-foreground">
            {globalPaused
              ? t("popup.globalPaused")
              : t("popup.enabledSummary", {
                  count: enabledProfilesCount,
                  rules: enabledRuleCount,
                })}
          </div>
        </div>
      </div>
      <div className="inline-flex items-center gap-px text-muted-foreground">
        <Tooltip
          side="bottom"
          content={globalPaused ? t("popup.resumeAll") : t("popup.pauseAll")}
        >
          <Button
            variant={globalPaused ? "secondary" : "ghost"}
            size="icon-sm"
            className={cn(globalPaused && "text-warning")}
            aria-label={
              globalPaused ? t("popup.resumeAll") : t("popup.pauseAll")
            }
            onClick={onTogglePause}
          >
            {globalPaused ? (
              <Play aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content={lockLabel} side="bottom">
          <Button
            variant={locked ? "secondary" : "ghost"}
            size="icon-sm"
            className={cn(locked && "text-primary")}
            disabled={!canToggleLock}
            aria-label={lockLabel}
            onClick={onToggleTabLock}
          >
            {lockedHere ? (
              <Unlock aria-hidden="true" />
            ) : (
              <Lock aria-hidden="true" />
            )}
          </Button>
        </Tooltip>
        <LanguageSwitcher variant="icon" />
        <ThemeSwitcher variant="icon" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("popup.moreActions")}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => void openOptionsPage()}>
              <Settings2 aria-hidden="true" />
              {t("popup.openOptions")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void openExternalPage(MANUAL_URL)}>
              <BookOpenText aria-hidden="true" />
              {t("popup.openManual")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ImportExportButtons menuItem onImportRequest={handleImportClick} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!isFirefox && (
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </header>
  );
}
