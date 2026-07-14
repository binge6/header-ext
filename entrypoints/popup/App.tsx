import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  ConfigProvider,
  Dropdown,
  Nav,
  Spin,
  Tooltip,
  Typography,
} from "@douyinfe/semi-ui";
import {
  IconFilterStroked as IconFilter,
  IconForwardStroked as IconPlay,
  IconLockStroked as IconLock,
  IconPlusStroked as IconPlus,
  IconSettingStroked as IconSetting,
  IconUnlockStroked as IconUnlock,
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
import { NoFilterBanner } from "@/src/components/NoFilterBanner";
import { MenuItemLabel } from "@/src/components/MenuItemLabel";
import { openOptionsPage } from "@/src/core/browserApi";
import type {
  HeaderRule,
  RuleKind,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
} from "@/src/core/types";
import { cn } from "@/src/utils/cn";
import "./App.css";

const logoUrl = new URL("../../assets/logo.svg", import.meta.url).href;

function ruleKind(r: HeaderRule): RuleKind {
  return r.kind ?? "header";
}

function getProfileBadgeText(name?: string): string {
  const trimmed = name?.trim() ?? "";
  const edgeNumber = trimmed.match(/^\d+/)?.[0] ?? trimmed.match(/\d+$/)?.[0];
  return edgeNumber ?? (trimmed.charAt(0).toUpperCase() || "H");
}

const { Text } = Typography;

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
    reorderRules,
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [scrollShadow, setScrollShadow] = useState({
    top: false,
    bottom: false,
  });

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
    [i18n.language],
  );

  const active = profiles.find((p) => p.id === meta.activeProfileId);

  const requestRules =
    active?.rules.filter(
      (r) => ruleKind(r) === "header" && r.target === "request",
    ) ?? [];
  const responseRules =
    active?.rules.filter(
      (r) => ruleKind(r) === "header" && r.target === "response",
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
  const profileNavItems = useMemo(
    () =>
      profiles.map((profile) => ({
        itemKey: profile.id,
        text: profile.name,
        icon: (
          <span className="he-profile-rail-number" aria-hidden="true">
            {getProfileBadgeText(profile.name)}
          </span>
        ),
      })),
    [profiles],
  );

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
        <MenuItemLabel title={t("filters.tab")} desc={t("filters.tabDesc")} />
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addDomainFilter(active.id, currentTabDomain)}
      >
        <MenuItemLabel
          title={t("filters.domain")}
          desc={t("filters.domainDesc")}
        />
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addUrlFilter(active.id, currentTabRegex)}
      >
        <MenuItemLabel title={t("filters.url")} desc={t("filters.urlDesc")} />
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => active && addExcludeUrlFilter(active.id, currentTabUrl)}
      >
        <MenuItemLabel
          title={t("filters.excludeUrl")}
          desc={t("filters.excludeUrlDesc")}
        />
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => {
          if (!active) return;
          if ((active.methodFilters ?? []).length === 0) {
            addMethodFilter(active.id, "GET");
          }
        }}
      >
        <MenuItemLabel
          title={t("filters.method")}
          desc={t("filters.methodDesc")}
        />
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

  const handleToggleTabLock = () => {
    if (lockedHere) {
      setLockedTabId(null);
    } else if (currentTabId != null) {
      setLockedTabId(currentTabId);
    }
  };

  const lockLabel = lockedHere
    ? t("popup.unlockTab")
    : isLocked
      ? t("popup.lockedTo", { id: meta.lockedTabId })
      : t("popup.lockTab");

  const updateScrollShadow = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) {
      setScrollShadow({ top: false, bottom: false });
      return;
    }

    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const next = {
      top: el.scrollTop > 1,
      bottom: maxScrollTop - el.scrollTop > 1,
    };

    setScrollShadow((prev) =>
      prev.top === next.top && prev.bottom === next.bottom ? prev : next,
    );
  }, []);

  useEffect(() => {
    updateScrollShadow();

    const el = scrollAreaRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateScrollShadow);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    return () => observer.disconnect();
  }, [
    active?.id,
    cookieRequestRules.length,
    cookieResponseRules.length,
    domainFilters.length,
    excludeUrlFilters.length,
    methodFilters.length,
    redirectRules.length,
    requestRules.length,
    responseRules.length,
    tabFilters.length,
    updateScrollShadow,
    urlFilters.length,
  ]);

  if (!hydrated) {
    return (
      <div className="w-155 p-10 text-center">
        <Spin />
      </div>
    );
  }

  return (
    <ConfigProvider locale={semiLocale}>
      <div className="he-editor-panel flex w-155 min-h-76 text-semi-color-text-0">
        <Nav
          className="he-profile-rail w-12 shrink-0"
          mode="vertical"
          isCollapsed
          header={
            <img className="he-rail-logo" src={logoUrl} alt="Header Ext" />
          }
          selectedKeys={meta.activeProfileId ? [meta.activeProfileId] : []}
          items={profileNavItems}
          tooltipShowDelay={0.24}
          onSelect={({ itemKey }) => setActive(String(itemKey))}
          footer={
            <Tooltip content={t("options.newProfile")} position="right">
              <Button
                className="he-profile-rail-add"
                theme="light"
                type="primary"
                size="small"
                icon={<IconPlus />}
                aria-label={t("options.newProfile")}
                onClick={() => {
                  const id = addProfile();
                  setActive(id);
                }}
              />
            </Tooltip>
          }
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="he-main-header flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="he-profile-mark" aria-hidden="true">
                {getProfileBadgeText(active?.name)}
              </span>
              <Text
                strong
                ellipsis={{ showTooltip: true }}
                className="min-w-0 text-base"
              >
                {active?.name ?? t("options.noProfiles")}
              </Text>
              {active && (
                <span
                  className={cn(
                    "he-profile-status-dot",
                    meta.globalPaused && "he-profile-status-dot-paused",
                  )}
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="he-header-action-group he-header-action-group-primary flex items-center">
                <Tooltip
                  position="bottom"
                  content={
                    meta.globalPaused
                      ? t("popup.resumeAll")
                      : t("popup.pauseAll")
                  }
                >
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={
                      meta.globalPaused ? (
                        <IconPlay className="text-semi-color-warning" />
                      ) : (
                        <span className="he-pause-stroked-icon" />
                      )
                    }
                    onClick={() => togglePause()}
                  />
                </Tooltip>
                <Tooltip content={lockLabel} position="bottom">
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    disabled={currentTabId == null && !lockedHere}
                    icon={
                      lockedHere ? (
                        <IconUnlock className="text-semi-color-primary" />
                      ) : (
                        <IconLock
                          className={
                            isLocked ? "text-semi-color-primary" : undefined
                          }
                        />
                      )
                    }
                    onClick={handleToggleTabLock}
                  />
                </Tooltip>
              </div>
              <span className="he-header-divider" />
              <div className="he-header-action-group he-header-action-group-secondary flex items-center">
                <LanguageSwitcher variant="icon" />
                <ThemeSwitcher variant="icon" />
                <Tooltip content={t("popup.openOptions")} position="bottom">
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={<IconSetting />}
                    onClick={() => void openOptionsPage()}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {!active ? (
            <div className="flex flex-1 items-center justify-center py-8 text-semi-color-text-2">
              {t("options.noProfiles")}
            </div>
          ) : (
            <div className="he-main-content relative flex-1 px-3 py-3">
              <div
                className={cn(
                  "he-scroll-shadow he-scroll-shadow-top",
                  scrollShadow.top && "he-scroll-shadow-visible",
                )}
              />
              <div
                ref={scrollAreaRef}
                className="max-h-110 overflow-y-auto"
                onScroll={updateScrollShadow}
              >
                <div className="flex flex-col gap-3">
                  <HeaderRuleList
                    variant="editor"
                    kind="header"
                    target="request"
                    rules={requestRules}
                    onAdd={() => handleAddHeader("request")}
                    onUpdate={handleUpdate}
                    onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                    onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                    onReorder={(ruleIds) => reorderRules(active.id, ruleIds)}
                  />
                  <HeaderRuleList
                    variant="editor"
                    kind="header"
                    target="response"
                    rules={responseRules}
                    onAdd={() => handleAddHeader("response")}
                    onUpdate={handleUpdate}
                    onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                    onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                    onReorder={(ruleIds) => reorderRules(active.id, ruleIds)}
                  />
                  {cookieRequestRules.length > 0 && (
                    <HeaderRuleList
                      variant="editor"
                      kind="cookie-request-append"
                      rules={cookieRequestRules}
                      onAdd={() => addRule(active.id, "cookie-request-append")}
                      onUpdate={handleUpdate}
                      onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                      onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                      onReorder={(ruleIds) => reorderRules(active.id, ruleIds)}
                    />
                  )}
                  {cookieResponseRules.length > 0 && (
                    <HeaderRuleList
                      variant="editor"
                      kind="cookie-response-append"
                      rules={cookieResponseRules}
                      onAdd={() => addRule(active.id, "cookie-response-append")}
                      onUpdate={handleUpdate}
                      onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                      onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                      onReorder={(ruleIds) => reorderRules(active.id, ruleIds)}
                    />
                  )}
                  {redirectRules.length > 0 && (
                    <HeaderRuleList
                      variant="editor"
                      kind="redirect"
                      rules={redirectRules}
                      onAdd={() => addRule(active.id, "redirect")}
                      onUpdate={handleUpdate}
                      onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                      onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                      onReorder={(ruleIds) => reorderRules(active.id, ruleIds)}
                    />
                  )}
                  {tabFilters.length > 0 && (
                    <TabFilterList
                      variant="editor"
                      filters={tabFilters}
                      onAdd={() =>
                        addTabFilter(active.id, currentTabUrlPattern)
                      }
                      onUpdate={(f) => updateTabFilter(active.id, f)}
                      onDelete={(id) => deleteTabFilter(active.id, id)}
                      onToggle={(id) => toggleTabFilter(active.id, id)}
                    />
                  )}
                  {domainFilters.length > 0 && (
                    <FilterRowList<DomainFilter>
                      variant="editor"
                      filters={domainFilters}
                      valueField="domain"
                      i18nKey="domainFilters"
                      onAdd={() => addDomainFilter(active.id, currentTabDomain)}
                      onUpdate={(f) => updateDomainFilter(active.id, f)}
                      onDelete={(id) => deleteDomainFilter(active.id, id)}
                      onToggle={(id) => toggleDomainFilter(active.id, id)}
                    />
                  )}
                  {urlFilters.length > 0 && (
                    <FilterRowList<UrlFilter>
                      variant="editor"
                      filters={urlFilters}
                      valueField="regex"
                      i18nKey="urlFilters"
                      onAdd={() => addUrlFilter(active.id, currentTabRegex)}
                      onUpdate={(f) => updateUrlFilter(active.id, f)}
                      onDelete={(id) => deleteUrlFilter(active.id, id)}
                      onToggle={(id) => toggleUrlFilter(active.id, id)}
                    />
                  )}
                  {excludeUrlFilters.length > 0 && (
                    <FilterRowList<ExcludeUrlFilter>
                      variant="editor"
                      filters={excludeUrlFilters}
                      valueField="url"
                      i18nKey="excludeUrlFilters"
                      onAdd={() =>
                        addExcludeUrlFilter(active.id, currentTabUrl)
                      }
                      onUpdate={(f) => updateExcludeUrlFilter(active.id, f)}
                      onDelete={(id) => deleteExcludeUrlFilter(active.id, id)}
                      onToggle={(id) => toggleExcludeUrlFilter(active.id, id)}
                    />
                  )}
                  {methodFilters.length > 0 && (
                    <MethodFilterPicker
                      variant="editor"
                      filters={methodFilters}
                      onChange={(methods) =>
                        setMethodFilters(active.id, methods)
                      }
                    />
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "he-scroll-shadow he-scroll-shadow-bottom",
                  scrollShadow.bottom && "he-scroll-shadow-visible",
                )}
              />
            </div>
          )}

          <div className="px-3">
            <NoFilterBanner compact />
          </div>

          <div className="he-bottom-bar flex items-center gap-2">
            <Dropdown trigger="click" position="bottomLeft" render={modMenu}>
              <Button
                className="he-mod-button"
                theme="solid"
                type="primary"
                size="small"
                icon={<IconPlus />}
                disabled={!active}
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
            <div className="flex-1" />
            <ImportExportButtons iconOnly />
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default App;
