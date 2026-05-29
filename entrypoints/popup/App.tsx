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
  Tooltip,
} from "@douyinfe/semi-ui";
import type { TagColor } from "@douyinfe/semi-ui/lib/es/tag";
import {
  IconFilter,
  IconLock,
  IconPause,
  IconPlay,
  IconPlus,
  IconSetting,
  IconUnlock,
} from "@douyinfe/semi-icons";
import zh_CN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { initI18n } from "@/src/i18n";
import { LanguageSwitcher } from "@/src/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/src/components/ThemeSwitcher";
import { useThemeMode } from "@/src/hooks/useThemeMode";
import { HeaderRuleList } from "@/src/components/HeaderRuleList";
import { TabFilterList } from "@/src/components/TabFilterList";
import { FilterRowList } from "@/src/components/FilterRowList";
import { MethodFilterPicker } from "@/src/components/MethodFilterPicker";
import { TemplateMenu } from "@/src/components/TemplateMenu";
import { ImportExportButtons } from "@/src/components/ImportExportButtons";
import { openOptionsPage } from "@/src/core/browserApi";
import type {
  HeaderRule,
  RuleKind,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
} from "@/src/core/types";
import "./App.css";

const TAG_COLORS: ReadonlySet<TagColor> = new Set<TagColor>([
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "light-green",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "violet",
  "yellow",
  "white",
]);

function mapTagColor(input?: string): TagColor {
  if (!input) return "grey";
  switch (input) {
    case "warning":
      return "amber";
    case "success":
      return "green";
    case "processing":
      return "blue";
    case "error":
      return "red";
    case "default":
      return "grey";
  }
  return TAG_COLORS.has(input as TagColor) ? (input as TagColor) : "grey";
}

function ruleKind(r: HeaderRule): RuleKind {
  return r.kind ?? "header";
}

function App() {
  const { t, i18n } = useTranslation();
  // 触发主题副作用（同步 body theme-mode 等）
  useThemeMode();
  const hydrated = useProfileStore((s) => s.hydrated);
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const {
    hydrate,
    setActiveProfile: setActive,
    togglePause,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    addProfile,
    setLockedTabId,
    addTabFilter,
    updateTabFilter,
    deleteTabFilter,
    toggleTabFilter,
    addDomainFilter,
    updateDomainFilter,
    deleteDomainFilter,
    toggleDomainFilter,
    addUrlFilter,
    updateUrlFilter,
    deleteUrlFilter,
    toggleUrlFilter,
    addExcludeUrlFilter,
    updateExcludeUrlFilter,
    deleteExcludeUrlFilter,
    toggleExcludeUrlFilter,
    addMethodFilter,
    setMethodFilters,
  } = useProfileActions();

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

  const semiLocale = useMemo(
    () => (i18n.language === "zh-CN" ? zh_CN : en_US),
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
    addRule(active.id, "header", target);
  };

  const handleUpdate = (rule: HeaderRule) => {
    if (!active) return;
    updateRule(active.id, rule);
  };

  const isLocked = meta.lockedTabId != null;
  const lockedHere =
    isLocked && currentTabId != null && meta.lockedTabId === currentTabId;

  const filterMenu = (
    <Dropdown.Menu>
      <Dropdown.Item
        onClick={() => active && addTabFilter(active.id, currentTabUrlPattern)}
      >
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.tab")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.tabDesc")}
          </div>
        </div>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addDomainFilter(active.id, currentTabDomain)}
      >
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.domain")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.domainDesc")}
          </div>
        </div>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addUrlFilter(active.id, currentTabRegex)}
      >
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.url")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.urlDesc")}
          </div>
        </div>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addExcludeUrlFilter(active.id, currentTabUrl)}
      >
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.excludeUrl")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.excludeUrlDesc")}
          </div>
        </div>
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => {
          if (!active) return;
          if ((active.methodFilters ?? []).length === 0) {
            addMethodFilter(active.id, "GET");
          }
        }}
      >
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {t("filters.method")}
          </div>
          <div style={{ fontSize: 12, color: "var(--he-text-tertiary)" }}>
            {t("filters.methodDesc")}
          </div>
        </div>
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  const modMenu = (
    <Dropdown.Menu>
      <Dropdown.Item onClick={() => handleAddHeader("request")}>
        {t("popup.addRequestHeader")}
      </Dropdown.Item>
      <Dropdown.Item onClick={() => handleAddHeader("response")}>
        {t("popup.addResponseHeader")}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item
        onClick={() => active && addRule(active.id, "cookie-request-append")}
      >
        {t("popup.addCookieRequest")}
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addRule(active.id, "cookie-response-append")}
      >
        {t("popup.addCookieResponse")}
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item onClick={() => active && addRule(active.id, "redirect")}>
        {t("popup.addRedirect")}
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  return (
    <ConfigProvider locale={semiLocale}>
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
          <Tag color={mapTagColor(active?.color)} style={{ marginRight: 0 }}>
            {active?.rules.length ?? 0}
          </Tag>
          <Select
            size="small"
            style={{ width: 200 }}
            value={meta.activeProfileId ?? undefined}
            onChange={(v) => setActive(v as string)}
            placeholder={t("popup.activeProfile")}
            optionList={profiles.map((p) => ({ value: p.id, label: p.name }))}
            outerBottomSlot={
              <>
                <Divider margin="4px" />
                <Button
                  theme="borderless"
                  type="tertiary"
                  size="small"
                  icon={<IconPlus />}
                  block
                  onClick={() => {
                    const id = addProfile();
                    setActive(id);
                  }}
                >
                  {t("options.newProfile")}
                </Button>
              </>
            }
          />
          <div style={{ flex: 1 }} />
          <Tooltip
            position="bottom"
            content={
              meta.globalPaused ? t("popup.resumeAll") : t("popup.pauseAll")
            }
          >
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              icon={
                meta.globalPaused ? (
                  <IconPlay style={{ color: "var(--he-color-warning)" }} />
                ) : (
                  <IconPause />
                )
              }
              onClick={() => togglePause()}
            />
          </Tooltip>
          <Tooltip
            position="bottom"
            content={
              lockedHere
                ? t("popup.unlockTab")
                : isLocked
                ? t("popup.lockedTo", { id: meta.lockedTabId })
                : t("popup.lockTab")
            }
          >
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              icon={
                lockedHere ? (
                  <IconUnlock style={{ color: "var(--he-color-primary)" }} />
                ) : (
                  <IconLock
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
          <Tooltip content={t("popup.openOptions")} position="bottomRight">
            <Button
              theme="borderless"
              type="tertiary"
              size="small"
              icon={<IconSetting />}
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

        <div style={{ margin: "12px 0 4px" }}>
          <Divider />
        </div>

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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
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
                <div style={{ margin: "8px 0" }}>
                  <Divider />
                </div>
                <MethodFilterPicker
                  filters={methodFilters}
                  onChange={(methods) => setMethodFilters(active.id, methods)}
                />
              </>
            )}
          </div>
        )}

        {/* Footer: 主要动作（Mod / 模板 / 过滤） */}
        <div style={{ margin: "8px 0 6px" }}>
          <Divider />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Dropdown trigger="click" position="bottomLeft" render={modMenu}>
            <Button
              theme="solid"
              type="primary"
              size="small"
              icon={<IconPlus />}
            >
              {t("popup.mod")}
            </Button>
          </Dropdown>
          <TemplateMenu profileId={active?.id ?? null} />
          <Dropdown trigger="click" position="bottomLeft" render={filterMenu}>
            <Button size="small" icon={<IconFilter />} disabled={!active}>
              {t("filters.title")}
            </Button>
          </Dropdown>
          <div style={{ flex: 1 }} />
          <ImportExportButtons iconOnly />
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
