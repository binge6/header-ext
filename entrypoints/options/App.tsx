import { useEffect, useMemo } from "react";
import { ConfigProvider, Layout, Spin, Typography } from "@douyinfe/semi-ui";
import zh_CN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
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

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

function App() {
  const { t, i18n } = useTranslation();
  // 触发主题副作用（同步 body theme-mode 等）
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

  const semiLocale = useMemo(
    () => (i18n.language === "zh-CN" ? zh_CN : en_US),
    [i18n.language],
  );

  if (!hydrated) {
    return (
      <div className="p-20 text-center">
        <Spin />
      </div>
    );
  }

  return (
    <ConfigProvider locale={semiLocale}>
      <Layout className="min-h-screen bg-semi-color-bg-0">
        <Header className="sticky top-0 z-10 flex items-center justify-between border-b border-semi-color-border bg-semi-color-bg-1 px-8 py-2.5">
          <Title heading={5} className="m-0">
            {t("options.title")}
          </Title>
          <div className="flex items-center gap-3">
            <TemplateMenu profileId={activeProfileId} />
            <GlobalToolbar />
            <LanguageSwitcher />
            <ThemeSwitcher variant="icon" />
          </div>
        </Header>
        <Layout className="mx-auto w-full max-w-360 bg-transparent">
          <Sider className="w-70 min-h-[calc(100vh-4rem)] border-r border-semi-color-border bg-semi-color-bg-1">
            <ProfilePanel />
          </Sider>
          <Content className="bg-semi-color-bg-0 p-8">
            <RuleTable />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
