import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Pause,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  initI18n,
  useProfileActions,
  useProfileStore,
  useThemeMode,
} from "@/src/application";
import { buildWorkspaceStatus } from "@/src/domain";
import { ImportExportButtons } from "@/src/features/data-transfer";
import { openExternalPage } from "@/src/platform/browser";
import {
  GlobalPauseControl,
  LanguageSwitcher,
  MANUAL_URL,
  ThemeSwitcher,
} from "@/src/features/preferences";
import {
  DnrRecoveryControl,
  ProfilePanel,
  RuleTable,
  TemplateMenu,
} from "@/src/features/workspace";
import {
  AppToaster,
  Badge,
  Button,
  Scroller,
  Spinner,
  UIProvider,
} from "@/src/shared/ui";
import { cn } from "@/src/shared/lib/cn";

const logoUrl = new URL("../../../assets/logo.svg", import.meta.url).href;

export function OptionsApp() {
  const { t } = useTranslation();
  useThemeMode();
  const hydrated = useProfileStore((s) => s.hydrated);
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const activeProfileId = meta.activeProfileId;
  const workspace = useMemo(
    () => buildWorkspaceStatus({ profiles, meta }),
    [meta, profiles],
  );
  const { hydrate } = useProfileActions();
  const inspectorPanelClassName =
    "rounded-lg border border-border bg-card p-3.5 shadow-soft";
  const inspectorRowClassName =
    "flex min-h-8.5 items-center gap-2 rounded-md border border-border bg-muted/35 px-2.5 py-2 text-xs leading-snug text-foreground [&_svg]:h-3.75 [&_svg]:w-3.75 [&_svg]:shrink-0";

  useEffect(() => {
    void (async () => {
      await initI18n();
      await hydrate();
    })();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <UIProvider delayDuration={300}>
      <div className="flex h-screen min-w-210 flex-col overflow-hidden bg-background">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-6 border-b border-border/90 bg-card/90 px-7 backdrop-blur-xl max-lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoUrl}
              alt=""
              className="h-9 w-9 rounded-xl shadow-soft"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight text-foreground">
                {t("options.title")}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t("app.tagline")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TemplateMenu profileId={activeProfileId} />
            <ImportExportButtons />
            <Button
              variant="outline"
              size="sm"
              aria-label={t("popup.openManual")}
              onClick={() => void openExternalPage(MANUAL_URL)}
            >
              <BookOpenText aria-hidden="true" />
              {t("popup.openManual")}
            </Button>
            <GlobalPauseControl />
            <DnrRecoveryControl />
            <div className="mx-1 h-6 w-px bg-border" />
            <LanguageSwitcher variant="icon" />
            <ThemeSwitcher variant="icon" />
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-360 flex-1">
          <aside className="min-h-0 w-70 shrink-0 border-r border-border/90 bg-card/70 max-lg:w-62">
            <ProfilePanel />
          </aside>
          <main className="min-w-0 flex-1">
            <Scroller className="h-full">
              <div className="px-7 pt-7 pb-16 max-lg:px-6 max-lg:pb-12">
                <RuleTable />
              </div>
            </Scroller>
          </main>
          <aside className="min-h-0 w-70 shrink-0 border-l border-border/90 bg-card/55 max-lg:hidden">
            <Scroller className="h-full px-4 py-6">
              <div className={inspectorPanelClassName}>
                <div className="text-xs font-bold tracking-kicker text-muted-foreground uppercase">
                  {t("options.liveStack")}
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("options.liveStackHint")}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-md border border-border bg-card/70 px-2.5 py-2.25">
                    <span className="block text-lg leading-none font-extrabold text-foreground">
                      {workspace.enabledProfiles.length}
                    </span>
                    <small className="mt-1.25 block text-micro leading-tight text-muted-foreground">
                      {t("popup.enabledProfiles")}
                    </small>
                  </div>
                  <div className="min-w-0 rounded-md border border-border bg-card/70 px-2.5 py-2.25">
                    <span className="block text-lg leading-none font-extrabold text-foreground">
                      {workspace.enabledRuleCount}
                    </span>
                    <small className="mt-1.25 block text-micro leading-tight text-muted-foreground">
                      {t("popup.enabledRules")}
                    </small>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {meta.globalPaused && (
                    <div
                      className={cn(
                        inspectorRowClassName,
                        "border-warning/35 bg-warning-soft text-warning",
                      )}
                    >
                      <Pause aria-hidden="true" />
                      <span>{t("popup.globalPaused")}</span>
                    </div>
                  )}
                  {!workspace.enabledProfiles.length && (
                    <div className={inspectorRowClassName}>
                      <AlertTriangle aria-hidden="true" />
                      <span>{t("options.noEnabledProfiles")}</span>
                    </div>
                  )}
                  {workspace.riskyProfiles.length > 0 && (
                    <div
                      className={cn(
                        inspectorRowClassName,
                        "border-warning/35 bg-warning-soft text-warning",
                      )}
                    >
                      <AlertTriangle aria-hidden="true" />
                      <span>
                        {t("options.riskyProfileCount", {
                          count: workspace.riskyProfiles.length,
                        })}
                      </span>
                    </div>
                  )}
                  {workspace.conflictGroups.length > 0 && (
                    <div
                      className={cn(
                        inspectorRowClassName,
                        "border-warning/35 bg-warning-soft text-warning",
                      )}
                    >
                      <Workflow aria-hidden="true" />
                      <span>
                        {t("options.conflictCount", {
                          count: workspace.conflictGroups.length,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={cn(inspectorPanelClassName, "mt-3")}>
                <div className="text-xs font-bold tracking-kicker text-muted-foreground uppercase">
                  {t("options.enabledProfiles")}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {workspace.statuses
                    .filter((status) => status.enabled)
                    .map((status) => (
                      <div
                        key={status.profile.id}
                        className={inspectorRowClassName}
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-success"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {status.profile.name}
                        </span>
                        <Badge
                          variant={
                            status.stats.hasGlobalRisk ? "warning" : "secondary"
                          }
                        >
                          {status.stats.enabledRules}
                        </Badge>
                      </div>
                    ))}
                  {!workspace.enabledProfiles.length && (
                    <div className="rounded-md border border-dashed border-border px-3.5 py-3.5 text-center text-xs text-muted-foreground">
                      {t("options.noEnabledProfiles")}
                    </div>
                  )}
                </div>
              </div>

              <div className={cn(inspectorPanelClassName, "mt-3")}>
                <div className="text-xs font-bold tracking-kicker text-muted-foreground uppercase">
                  {t("options.qualitySignals")}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <div className={inspectorRowClassName}>
                    <SlidersHorizontal
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 flex-1">
                      {t("options.advancedConditions")}
                    </span>
                    <Badge>
                      {workspace.statuses.reduce(
                        (sum, status) => sum + status.stats.advancedRules,
                        0,
                      )}
                    </Badge>
                  </div>
                  <div className={inspectorRowClassName}>
                    <AlertTriangle
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-warning"
                    />
                    <span className="min-w-0 flex-1">
                      {t("options.globalScopeRisk")}
                    </span>
                    <Badge
                      variant={
                        workspace.riskyProfiles.length ? "warning" : "secondary"
                      }
                    >
                      {workspace.riskyProfiles.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </Scroller>
          </aside>
        </div>
      </div>
      <AppToaster />
    </UIProvider>
  );
}
