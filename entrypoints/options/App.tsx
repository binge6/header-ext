import { useEffect } from "react";
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
import {
  AppToaster,
  Spinner,
  UIProvider,
} from "@/src/components/ui";

const logoUrl = new URL("../../assets/logo.svg", import.meta.url).href;

function App() {
  const { t } = useTranslation();
  useThemeMode();
  const hydrated = useProfileStore((s) => s.hydrated);
  const activeProfileId = useProfileStore((s) => s.meta.activeProfileId);
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
        </div>
      </div>
      <AppToaster />
    </UIProvider>
  );
}

export default App;
