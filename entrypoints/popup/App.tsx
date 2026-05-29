import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ConfigProvider,
  Divider,
  Dropdown,
  Select,
  Spin,
  Switch,
  Tag,
  theme as antdTheme,
  Tooltip,
} from "antd";
import {
  FilterOutlined,
  LockOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import { initI18n } from "@/src/i18n";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/src/components/ThemeSwitcher";
import { useThemeMode } from "@/src/hooks/useThemeMode";
import { HeaderRuleList } from "@/src/components/HeaderRuleList";
import { TabFilterList } from "@/src/components/TabFilterList";
import { FilterRowList } from "@/src/components/FilterRowList";
import { MethodFilterPicker } from "@/src/components/MethodFilterPicker";
import { TemplateMenu } from "@/src/components/TemplateMenu";
import { openOptionsPage } from "@/src/core/browserApi";
import type {
  HeaderRule,
  RuleKind,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
} from "@/src/core/types";
import "./App.css";

function ruleKind(r: HeaderRule): RuleKind {
  return r.kind ?? "header";
}

function App() {
  const { t, i18n } = useTranslation();
  const { isDark } = useThemeMode();
  const hydrated = useProfileStore((s) => s.hydrated);
  const hydrate = useProfileStore((s) => s.hydrate);
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const setActive = useProfileStore((s) => s.setActiveProfile);
  const togglePause = useProfileStore((s) => s.togglePause);
  const addRule = useProfileStore((s) => s.addRule);
  const updateRule = useProfileStore((s) => s.updateRule);
  const deleteRule = useProfileStore((s) => s.deleteRule);
  const toggleRule = useProfileStore((s) => s.toggleRule);
  const addProfile = useProfileStore((s) => s.addProfile);
  const setLockedTabId = useProfileStore((s) => s.setLockedTabId);
  const addTabFilter = useProfileStore((s) => s.addTabFilter);
  const updateTabFilter = useProfileStore((s) => s.updateTabFilter);
  const deleteTabFilter = useProfileStore((s) => s.deleteTabFilter);
  const toggleTabFilter = useProfileStore((s) => s.toggleTabFilter);
  const addDomainFilter = useProfileStore((s) => s.addDomainFilter);
  const updateDomainFilter = useProfileStore((s) => s.updateDomainFilter);
  const deleteDomainFilter = useProfileStore((s) => s.deleteDomainFilter);
  const toggleDomainFilter = useProfileStore((s) => s.toggleDomainFilter);
  const addUrlFilter = useProfileStore((s) => s.addUrlFilter);
  const updateUrlFilter = useProfileStore((s) => s.updateUrlFilter);
  const deleteUrlFilter = useProfileStore((s) => s.deleteUrlFilter);
  const toggleUrlFilter = useProfileStore((s) => s.toggleUrlFilter);
  const addExcludeUrlFilter = useProfileStore((s) => s.addExcludeUrlFilter);
  const updateExcludeUrlFilter = useProfileStore(
    (s) => s.updateExcludeUrlFilter
  );
  const deleteExcludeUrlFilter = useProfileStore(
    (s) => s.deleteExcludeUrlFilter
  );
  const toggleExcludeUrlFilter = useProfileStore(
    (s) => s.toggleExcludeUrlFilter
  );
  const addMethodFilter = useProfileStore((s) => s.addMethodFilter);
  const setMethodFilters = useProfileStore((s) => s.setMethodFilters);

  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [currentTabDomain, setCurrentTabDomain] = useState<string>("");
  // 当前 tab 的完整 URL（带 https）
  const [currentTabUrl, setCurrentTabUrl] = useState<string>("");
  // 用于 Tab 过滤白名单的通配符（*://hostname/*）
  const [currentTabUrlPattern, setCurrentTabUrlPattern] = useState<string>("");
  // 用于 URL 过滤的正则（自动转义 hostname，匹配该 host 下任意路径）
  const [currentTabRegex, setCurrentTabRegex] = useState<string>("");

  useEffect(() => {
    void (async () => {
      await initI18n();
      await hydrate();
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id != null) setCurrentTabId(tab.id);
        if (tab?.url) {
          try {
            const u = new URL(tab.url);
            // 仅保留 http(s) 域名；chrome:// / about: 等忽略
            if (u.protocol === "http:" || u.protocol === "https:") {
              setCurrentTabDomain(u.hostname);
              setCurrentTabUrl(tab.url);
              setCurrentTabUrlPattern(`*://${u.hostname}/*`);
              const escaped = u.hostname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              setCurrentTabRegex(`^https?://${escaped}/.*`);
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [hydrate]);

  const antdLocale = useMemo(
    () => (i18n.language === "zh-CN" ? zhCN : enUS),
    [i18n.language]
  );

  if (!hydrated) {
    return (
      <div style={{ padding: 40, textAlign: "center", width: 460 }}>
        <Spin />
      </div>
    );
  }

  const active = profiles.find((p) => p.id === meta.activeProfileId);

  const requestRules =
    active?.rules.filter(
      (r) => ruleKind(r) === "header" && r.target === "request"
    ) ?? [];
  const responseRules =
    active?.rules.filter(
      (r) => ruleKind(r) === "header" && r.target === "response"
    ) ?? [];
  const cookieRequestRules =
    active?.rules.filter((r) => ruleKind(r) === "cookie-request-append") ?? [];
  const cookieResponseRules =
    active?.rules.filter((r) => ruleKind(r) === "cookie-response-append") ?? [];
  const redirectRules =
    active?.rules.filter((r) => ruleKind(r) === "redirect") ?? [];
  const tabFilters = active?.tabFilters ?? [];
  const domainFilters = active?.domainFilters ?? [];
  const urlFilters = active?.urlFilters ?? [];
  const excludeUrlFilters = active?.excludeUrlFilters ?? [];
  const methodFilters = active?.methodFilters ?? [];

  const handleAddHeader = (target: "request" | "response") => {
    if (!active) return;
    const id = addRule(active.id, "header");
    const just = useProfileStore
      .getState()
      .profiles.find((p) => p.id === active.id)
      ?.rules.find((r) => r.id === id);
    if (just && just.target !== target) {
      updateRule(active.id, { ...just, target });
    }
  };

  const handleUpdate = (rule: HeaderRule) => {
    if (!active) return;
    updateRule(active.id, rule);
  };

  const isLocked = meta.lockedTabId != null;
  const lockedHere =
    isLocked && currentTabId != null && meta.lockedTabId === currentTabId;

  const filterMenuItems = [
    {
      key: "tab",
      label: (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.tab")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.tabDesc")}
          </div>
        </div>
      ),
      onClick: () => active && addTabFilter(active.id, currentTabUrlPattern),
    },
    {
      key: "domain",
      label: (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.domain")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.domainDesc")}
          </div>
        </div>
      ),
      onClick: () => active && addDomainFilter(active.id, currentTabDomain),
    },
    {
      key: "url",
      label: (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.url")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.urlDesc")}
          </div>
        </div>
      ),
      onClick: () => active && addUrlFilter(active.id, currentTabRegex),
    },
    {
      key: "excludeUrl",
      label: (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.excludeUrl")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.excludeUrlDesc")}
          </div>
        </div>
      ),
      onClick: () => active && addExcludeUrlFilter(active.id, currentTabUrl),
    },
    {
      key: "method",
      label: (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.method")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.methodDesc")}
          </div>
        </div>
      ),
      onClick: () => {
        if (!active) return;
        // 已有任何项就直接打开面板（不重复加），否则默认插入 GET 让多选下拉显示
        if ((active.methodFilters ?? []).length === 0) {
          addMethodFilter(active.id, "GET");
        }
      },
    },
  ];

  const modMenuItems = [
    {
      key: "request",
      label: t("popup.addRequestHeader"),
      onClick: () => handleAddHeader("request"),
    },
    {
      key: "response",
      label: t("popup.addResponseHeader"),
      onClick: () => handleAddHeader("response"),
    },
    { type: "divider" as const },
    {
      key: "cookie-req",
      label: t("popup.addCookieRequest"),
      onClick: () => active && addRule(active.id, "cookie-request-append"),
    },
    {
      key: "cookie-res",
      label: t("popup.addCookieResponse"),
      onClick: () => active && addRule(active.id, "cookie-response-append"),
    },
    { type: "divider" as const },
    {
      key: "redirect",
      label: t("popup.addRedirect"),
      onClick: () => active && addRule(active.id, "redirect"),
    },
  ];

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      <div
        style={{
          width: 520,
          minHeight: 360,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          background: "var(--he-bg-popup)",
          color: "var(--he-text-primary)",
        }}
      >
        {/* 顶栏：Profile 选择 + 全局动作（暂停/锁 Tab/语言/设置） */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Tag color={active?.color ?? "default"} style={{ marginRight: 0 }}>
            {active?.rules.length ?? 0}
          </Tag>
          <Select
            size="small"
            style={{ width: 200 }}
            value={meta.activeProfileId ?? undefined}
            onChange={setActive}
            placeholder={t("popup.activeProfile")}
            options={profiles.map((p) => ({ value: p.id, label: p.name }))}
            popupRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: "4px 0" }} />
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  block
                  onClick={() => {
                    const id = addProfile(t("options.newProfile"));
                    setActive(id);
                  }}
                >
                  {t("options.newProfile")}
                </Button>
              </>
            )}
          />
          <div style={{ flex: 1 }} />
          <Tooltip
            title={
              meta.globalPaused ? t("popup.resumeAll") : t("popup.pauseAll")
            }
          >
            <Button
              type="text"
              size="small"
              icon={
                meta.globalPaused ? (
                  <PlayCircleOutlined
                    style={{ color: "var(--he-color-warning)" }}
                  />
                ) : (
                  <PauseCircleOutlined />
                )
              }
              onClick={() => togglePause()}
            />
          </Tooltip>
          <Tooltip
            title={
              lockedHere
                ? t("popup.unlockTab")
                : isLocked
                ? t("popup.lockedTo", { id: meta.lockedTabId })
                : t("popup.lockTab")
            }
          >
            <Button
              type="text"
              size="small"
              icon={
                lockedHere ? (
                  <UnlockOutlined
                    style={{ color: "var(--he-color-primary)" }}
                  />
                ) : (
                  <LockOutlined
                    style={
                      isLocked
                        ? { color: "var(--he-color-primary)" }
                        : undefined
                    }
                  />
                )
              }
              onClick={() => {
                if (lockedHere) {
                  setLockedTabId(null);
                } else if (currentTabId != null) {
                  setLockedTabId(currentTabId);
                }
              }}
            />
          </Tooltip>
          <LanguageSwitcher variant="icon" />
          <ThemeSwitcher variant="icon" />
          <Tooltip title={t("popup.openOptions")} placement="bottomLeft">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => void openOptionsPage()}
            />
          </Tooltip>
        </div>

        {meta.globalPaused && (
          <div
            style={{
              marginTop: 8,
              padding: "4px 8px",
              background: "var(--he-bg-pause)",
              border: "1px solid var(--he-border-pause)",
              borderRadius: 4,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{t("popup.globalPaused")}</span>
            <Switch
              size="small"
              checked={!meta.globalPaused}
              onChange={() => togglePause()}
            />
          </div>
        )}

        <Divider style={{ margin: "12px 0 4px" }} />

        {!active ? (
          <div
            style={{
              color: "var(--he-text-tertiary)",
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            {t("options.noProfiles")}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              maxHeight: 460,
              overflowY: "auto",
              // 把滚动条压到外层 padding 区域内（marginRight: -12），并恢复内容左右对称
              marginRight: -12,
              paddingRight: 12,
            }}
          >
            <HeaderRuleList
              kind="header"
              target="request"
              rules={requestRules}
              onAdd={() => handleAddHeader("request")}
              onUpdate={handleUpdate}
              onDelete={(ruleId) => deleteRule(active.id, ruleId)}
              onToggle={(ruleId) => toggleRule(active.id, ruleId)}
            />
            {responseRules.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <HeaderRuleList
                  kind="header"
                  target="response"
                  rules={responseRules}
                  onAdd={() => handleAddHeader("response")}
                  onUpdate={handleUpdate}
                  onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                  onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                />
              </>
            )}
            {cookieRequestRules.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <HeaderRuleList
                  kind="cookie-request-append"
                  rules={cookieRequestRules}
                  onAdd={() => addRule(active.id, "cookie-request-append")}
                  onUpdate={handleUpdate}
                  onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                  onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                />
              </>
            )}
            {cookieResponseRules.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <HeaderRuleList
                  kind="cookie-response-append"
                  rules={cookieResponseRules}
                  onAdd={() => addRule(active.id, "cookie-response-append")}
                  onUpdate={handleUpdate}
                  onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                  onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                />
              </>
            )}
            {redirectRules.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <HeaderRuleList
                  kind="redirect"
                  rules={redirectRules}
                  onAdd={() => addRule(active.id, "redirect")}
                  onUpdate={handleUpdate}
                  onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                  onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                />
              </>
            )}
            {tabFilters.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <TabFilterList
                  filters={tabFilters}
                  onAdd={() => addTabFilter(active.id, currentTabUrlPattern)}
                  onUpdate={(f) => updateTabFilter(active.id, f)}
                  onDelete={(id) => deleteTabFilter(active.id, id)}
                  onToggle={(id) => toggleTabFilter(active.id, id)}
                />
              </>
            )}
            {domainFilters.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <FilterRowList<DomainFilter>
                  filters={domainFilters}
                  valueField="domain"
                  i18nKey="domainFilters"
                  onAdd={() => addDomainFilter(active.id, currentTabDomain)}
                  onUpdate={(f) => updateDomainFilter(active.id, f)}
                  onDelete={(id) => deleteDomainFilter(active.id, id)}
                  onToggle={(id) => toggleDomainFilter(active.id, id)}
                />
              </>
            )}
            {urlFilters.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <FilterRowList<UrlFilter>
                  filters={urlFilters}
                  valueField="regex"
                  i18nKey="urlFilters"
                  onAdd={() => addUrlFilter(active.id, currentTabRegex)}
                  onUpdate={(f) => updateUrlFilter(active.id, f)}
                  onDelete={(id) => deleteUrlFilter(active.id, id)}
                  onToggle={(id) => toggleUrlFilter(active.id, id)}
                />
              </>
            )}
            {excludeUrlFilters.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <FilterRowList<ExcludeUrlFilter>
                  filters={excludeUrlFilters}
                  valueField="url"
                  i18nKey="excludeUrlFilters"
                  onAdd={() => addExcludeUrlFilter(active.id, currentTabUrl)}
                  onUpdate={(f) => updateExcludeUrlFilter(active.id, f)}
                  onDelete={(id) => deleteExcludeUrlFilter(active.id, id)}
                  onToggle={(id) => toggleExcludeUrlFilter(active.id, id)}
                />
              </>
            )}
            {methodFilters.length > 0 && (
              <>
                <Divider style={{ margin: "8px 0" }} />
                <MethodFilterPicker
                  filters={methodFilters}
                  onChange={(methods) => setMethodFilters(active.id, methods)}
                />
              </>
            )}
          </div>
        )}

        {/* Footer: 主要动作（Mod / 模板 / 过滤） */}
        <Divider style={{ margin: "8px 0 6px" }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Dropdown trigger={["click"]} menu={{ items: modMenuItems }}>
            <Button type="primary" size="small" icon={<PlusOutlined />}>
              {t("popup.mod")}
            </Button>
          </Dropdown>
          <TemplateMenu profileId={active?.id ?? null} />
          <Dropdown
            trigger={["click"]}
            disabled={!active}
            menu={{ items: filterMenuItems }}
          >
            <Button size="small" icon={<FilterOutlined />}>
              {t("filters.title")}
            </Button>
          </Dropdown>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
