import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { initI18n } from "@/src/i18n";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/src/components/ThemeSwitcher";
import { useThemeMode } from "@/src/hooks/useThemeMode";
import { ProfilePanel } from "@/src/components/ProfilePanel";
import { RuleTable } from "@/src/components/RuleTable";
import { GlobalToolbar } from "@/src/components/GlobalToolbar";
import { TemplateMenu } from "@/src/components/TemplateMenu";
import { ImportExportButtons } from "@/src/components/ImportExportButtons";
import { buildWorkspaceStatus } from "@/src/core/profileStatus";
import {
  AppToaster,
  Badge,
  Spinner,
  UIProvider,
} from "@/src/ui";

const logoUrl = new URL("../../assets/logo.svg", import.meta.url).href;

function App() {
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
      <div className="he-options-shell min-h-screen bg-background">
        <header className="he-options-header">
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
            <GlobalToolbar />
            <div className="mx-1 h-6 w-px bg-border" />
            <LanguageSwitcher variant="icon" />
            <ThemeSwitcher variant="icon" />
          </div>
        </header>

        <div className="he-options-layout">
          <aside className="he-options-sidebar">
            <ProfilePanel />
          </aside>
          <main className="he-options-main">
            <RuleTable />
          </main>
          <aside className="he-options-inspector">
            <div className="he-inspector-panel">
              <div className="he-profile-list-kicker">
                {t("options.liveStack")}
              </div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("options.liveStackHint")}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="he-options-mini-stat">
                  <span>{workspace.enabledProfiles.length}</span>
                  <small>{t("popup.enabledProfiles")}</small>
                </div>
                <div className="he-options-mini-stat">
                  <span>{workspace.enabledRuleCount}</span>
                  <small>{t("popup.enabledRules")}</small>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {meta.globalPaused && (
                  <div className="he-inspector-alert he-inspector-alert-warning">
                    <Pause aria-hidden="true" />
                    <span>{t("popup.globalPaused")}</span>
                  </div>
                )}
                {!workspace.enabledProfiles.length && (
                  <div className="he-inspector-alert">
                    <AlertTriangle aria-hidden="true" />
                    <span>{t("options.noEnabledProfiles")}</span>
                  </div>
                )}
                {workspace.riskyProfiles.length > 0 && (
                  <div className="he-inspector-alert he-inspector-alert-warning">
                    <AlertTriangle aria-hidden="true" />
                    <span>
                      {t("options.riskyProfileCount", {
                        count: workspace.riskyProfiles.length,
                      })}
                    </span>
                  </div>
                )}
                {workspace.conflictGroups.length > 0 && (
                  <div className="he-inspector-alert he-inspector-alert-warning">
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

            <div className="he-inspector-panel">
              <div className="he-profile-list-kicker">
                {t("options.enabledProfiles")}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {workspace.statuses
                  .filter((status) => status.enabled)
                  .map((status) => (
                    <div key={status.profile.id} className="he-inspector-row">
                      <CheckCircle2
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-success"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {status.profile.name}
                      </span>
                      <Badge variant={status.stats.hasGlobalRisk ? "warning" : "secondary"}>
                        {status.stats.enabledRules}
                      </Badge>
                    </div>
                  ))}
                {!workspace.enabledProfiles.length && (
                  <div className="he-inspector-empty">
                    {t("options.noEnabledProfiles")}
                  </div>
                )}
              </div>
            </div>

            <div className="he-inspector-panel">
              <div className="he-profile-list-kicker">
                {t("options.qualitySignals")}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="he-inspector-row">
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
                <div className="he-inspector-row">
                  <AlertTriangle
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-warning"
                  />
                  <span className="min-w-0 flex-1">
                    {t("options.globalScopeRisk")}
                  </span>
                  <Badge variant={workspace.riskyProfiles.length ? "warning" : "secondary"}>
                    {workspace.riskyProfiles.length}
                  </Badge>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <AppToaster />
    </UIProvider>
  );
}

export default App;
