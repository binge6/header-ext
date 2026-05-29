import { useEffect, useMemo } from "react";
import { ConfigProvider, Layout, Spin, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import { initI18n } from "@/src/i18n";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/src/components/ThemeSwitcher";
import { useThemeMode } from "@/src/hooks/useThemeMode";
import { ProfilePanel } from "@/src/components/ProfilePanel";
import { RuleTable } from "@/src/components/RuleTable";
import { GlobalToolbar } from "@/src/components/GlobalToolbar";
import { TemplateMenu } from "@/src/components/TemplateMenu";

const { Sider, Content, Header } = Layout;

function App() {
  const { t, i18n } = useTranslation();
  const { isDark } = useThemeMode();
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);
  const activeProfileId = useProfileStore((s) => s.meta.activeProfileId);

  useEffect(() => {
    void (async () => {
      await initI18n();
      await hydrate();
    })();
  }, [hydrate]);

  const antdLocale = useMemo(
    () => (i18n.language === "zh-CN" ? zhCN : enUS),
    [i18n.language]
  );

  if (!hydrated) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: "100vh", background: "var(--he-bg-page)" }}>
        <Header
          style={{
            background: "var(--he-bg-surface)",
            borderBottom: "1px solid var(--he-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>{t("options.title")}</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <TemplateMenu profileId={activeProfileId} />
            <GlobalToolbar />
            <LanguageSwitcher />
            <ThemeSwitcher variant="icon" />
          </div>
        </Header>
        <Layout
          style={{
            maxWidth: 1440,
            width: "100%",
            margin: "0 auto",
            background: "transparent",
          }}
        >
          <Sider
            width={280}
            style={{
              background: "var(--he-bg-surface)",
              borderRight: "1px solid var(--he-border)",
              minHeight: "calc(100vh - 64px)",
            }}
          >
            <ProfilePanel />
          </Sider>
          <Content style={{ padding: 32, background: "var(--he-bg-page)" }}>
            <RuleTable />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
