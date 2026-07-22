import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy,
  Edit3,
  Filter,
  Layers3,
  Lock,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Settings2,
  Trash2,
  Unlock,
} from "lucide-react";
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
import {
  FilterMenu,
  ModificationMenu,
} from "@/src/components/RuleActionMenus";
import {
  AppToaster,
  Button,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Spinner,
  Tooltip,
  UIProvider,
} from "@/src/components/ui";
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

function App() {
  const { t } = useTranslation();
  useThemeMode();
  const hydrated = useProfileStore((s) => s.hydrated);
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const {
    hydrate,
    setActiveProfile: setActive,
    togglePause,
    addRule,
    renameProfile,
    updateRule,
    deleteRule,
    toggleRule,
    reorderRules,
    addProfile,
    duplicateProfile,
    deleteProfile,
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
  const [renamingProfile, setRenamingProfile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [deleteProfileOpen, setDeleteProfileOpen] = useState(false);

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
  const handleAddHeader = (target: "request" | "response") => {
    if (!active) return;
    addRule(active.id, "header", target);
  };

  const handleUpdate = (rule: HeaderRule) => {
    if (!active) return;
    updateRule(active.id, rule);
  };

  const handleOpenRenameProfile = () => {
    if (!active) return;
    setProfileMenuVisible(false);
    setRenamingProfile({ id: active.id, name: active.name });
  };

  const handleRenameProfile = () => {
    if (!renamingProfile) return;
    renameProfile(renamingProfile.id, renamingProfile.name);
    setRenamingProfile(null);
  };

  const handleDuplicateActiveProfile = () => {
    if (!active) return;
    setProfileMenuVisible(false);

    const id = duplicateProfile(
      active.id,
      t("options.profileCopyName", { name: active.name }),
    );
    if (id) setActive(id);
  };

  const handleDeleteActiveProfile = () => {
    if (!active) return;
    setProfileMenuVisible(false);
    setDeleteProfileOpen(true);
  };

  const isLocked = meta.lockedTabId != null;
  const lockedHere =
    isLocked && currentTabId != null && meta.lockedTabId === currentTabId;

  const profileMenu = (
    <DropdownMenuContent align="start">
      <DropdownMenuItem onClick={handleOpenRenameProfile}>
        <Edit3 aria-hidden="true" />
        {t("options.renameProfile")}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleDuplicateActiveProfile}>
        <Copy aria-hidden="true" />
        {t("options.copyProfile")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive onClick={handleDeleteActiveProfile}>
        <Trash2 aria-hidden="true" />
        {t("options.deleteProfile")}
      </DropdownMenuItem>
    </DropdownMenuContent>
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

  const hasEditorContent =
    requestRules.length +
      responseRules.length +
      cookieRequestRules.length +
      cookieResponseRules.length +
      redirectRules.length +
      tabFilters.length +
      domainFilters.length +
      urlFilters.length +
      excludeUrlFilters.length +
      methodFilters.length >
    0;

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
      <div className="flex min-h-68 w-140 items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <Spinner />
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const addMethodFilterIfNeeded = () => {
    if (!active || (active.methodFilters ?? []).length > 0) return;
    addMethodFilter(active.id, "GET");
  };

  const modificationMenuProps = {
    disabled: !active,
    compact: true,
    side: "top" as const,
    onAddRequestHeader: () => handleAddHeader("request"),
    onAddResponseHeader: () => handleAddHeader("response"),
    onAddRequestCookie: () =>
      active && addRule(active.id, "cookie-request-append"),
    onAddResponseCookie: () =>
      active && addRule(active.id, "cookie-response-append"),
    onAddRedirect: () => active && addRule(active.id, "redirect"),
  };

  const filterMenuProps = {
    disabled: !active,
    compact: true,
    side: "top" as const,
    onAddTab: () =>
      active && addTabFilter(active.id, currentTabUrlPattern),
    onAddDomain: () =>
      active && addDomainFilter(active.id, currentTabDomain),
    onAddUrl: () => active && addUrlFilter(active.id, currentTabRegex),
    onAddExcludeUrl: () =>
      active && addExcludeUrlFilter(active.id, currentTabUrl),
    onAddMethod: addMethodFilterIfNeeded,
  };

  return (
    <UIProvider delayDuration={250}>
      <div className="he-popup-shell flex w-140 min-h-68 text-foreground">
        <aside className="he-profile-rail">
          <img className="he-rail-logo" src={logoUrl} alt="Header Ext" />
          <div className="he-profile-rail-list">
            {profiles.map((profile) => {
              const selected = profile.id === meta.activeProfileId;
              return (
                <Tooltip key={profile.id} content={profile.name} side="right">
                  <button
                    type="button"
                    className={cn(
                      "he-profile-rail-item",
                      selected && "he-profile-rail-item-active",
                    )}
                    aria-current={selected ? "page" : undefined}
                    aria-label={profile.name}
                    onClick={() => setActive(profile.id)}
                  >
                    {getProfileBadgeText(profile.name)}
                  </button>
                </Tooltip>
              );
            })}
          </div>
          <div className="mt-auto">
            <Tooltip content={t("options.newProfile")} side="right">
              <Button
                className="he-profile-rail-add"
                variant="secondary"
                size="icon-sm"
                aria-label={t("options.newProfile")}
                onClick={() => {
                  const id = addProfile();
                  setActive(id);
                }}
              >
                <Plus aria-hidden="true" />
              </Button>
            </Tooltip>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="he-main-header flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {active && (
                <span
                  className={cn(
                    "he-profile-status-dot",
                    meta.globalPaused && "he-profile-status-dot-paused",
                  )}
                  title={
                    meta.globalPaused
                      ? t("popup.globalPaused")
                      : t("common.enabled")
                  }
                />
              )}
              <span
                className="max-w-36 truncate text-group-title font-bold"
                title={active?.name}
              >
                {active?.name ?? t("options.noProfiles")}
              </span>
              {currentTabDomain && (
                <>
                  <span className="he-header-context-separator" />
                  <span
                    className="min-w-0 max-w-36 truncate text-xs text-muted-foreground"
                    title={currentTabDomain}
                  >
                    {currentTabDomain}
                  </span>
                </>
              )}
              {active && (
                <DropdownMenu
                  open={profileMenuVisible}
                  onOpenChange={setProfileMenuVisible}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="he-popup-icon-button"
                      aria-label={t("popup.profileActions")}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  {profileMenu}
                </DropdownMenu>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="he-header-control-group">
                <Tooltip
                  side="bottom"
                  content={
                    meta.globalPaused ? t("popup.resumeAll") : t("popup.pauseAll")
                  }
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(meta.globalPaused && "he-warning-text")}
                    aria-label={
                      meta.globalPaused
                        ? t("popup.resumeAll")
                        : t("popup.pauseAll")
                    }
                    onClick={() => togglePause()}
                  >
                    {meta.globalPaused ? (
                      <Play aria-hidden="true" />
                    ) : (
                      <Pause aria-hidden="true" />
                    )}
                  </Button>
                </Tooltip>
                <Tooltip content={lockLabel} side="bottom">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(isLocked && "text-primary")}
                    disabled={currentTabId == null && !lockedHere}
                    aria-label={lockLabel}
                    onClick={handleToggleTabLock}
                  >
                    {lockedHere ? (
                      <Unlock aria-hidden="true" />
                    ) : (
                      <Lock aria-hidden="true" />
                    )}
                  </Button>
                </Tooltip>
              </div>
              <div className="he-header-secondary-actions">
                <LanguageSwitcher variant="icon" />
                <ThemeSwitcher variant="icon" />
                <Tooltip content={t("popup.openOptions")} side="bottom">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="he-popup-icon-button"
                    aria-label={t("popup.openOptions")}
                    onClick={() => void openOptionsPage()}
                  >
                    <Settings2 aria-hidden="true" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          {!active ? (
            <div className="he-empty-mod-state flex-1">
              <div className="he-empty-mod-visual">
                <Layers3 aria-hidden="true" />
              </div>
              <div className="text-sm font-semibold text-foreground">
                {t("options.noProfiles")}
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const id = addProfile();
                  setActive(id);
                }}
              >
                <Plus aria-hidden="true" />
                {t("options.newProfile")}
              </Button>
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
                className="max-h-100 overflow-y-auto"
                onScroll={updateScrollShadow}
              >
                <div className="flex flex-col gap-2">
                  {!hasEditorContent && (
                    <div className="he-empty-mod-state">
                      <div className="he-empty-mod-visual" aria-hidden="true">
                        <Layers3 />
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        <span className="text-sm font-semibold text-foreground">
                          {t("popup.noRules")}
                        </span>
                        <span className="max-w-80 text-xs leading-5 text-muted-foreground">
                          {t("popup.emptyModHint")}
                        </span>
                      </div>
                      <ModificationMenu
                        {...modificationMenuProps}
                        align="center"
                        trigger={
                          <Button size="sm">
                            <Plus aria-hidden="true" />
                            {t("popup.addMod")}
                          </Button>
                        }
                      />
                    </div>
                  )}
                  {hasEditorContent && (
                    <>
                      <HeaderRuleList
                        variant="editor"
                        kind="header"
                        target="request"
                        rules={requestRules}
                        onAdd={() => handleAddHeader("request")}
                        onUpdate={handleUpdate}
                        onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                        onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                        onReorder={(ruleIds) =>
                          reorderRules(active.id, ruleIds)
                        }
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
                        onReorder={(ruleIds) =>
                          reorderRules(active.id, ruleIds)
                        }
                      />
                      {cookieRequestRules.length > 0 && (
                        <HeaderRuleList
                          variant="editor"
                          kind="cookie-request-append"
                          rules={cookieRequestRules}
                          onAdd={() =>
                            addRule(active.id, "cookie-request-append")
                          }
                          onUpdate={handleUpdate}
                          onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                          onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                          onReorder={(ruleIds) =>
                            reorderRules(active.id, ruleIds)
                          }
                        />
                      )}
                      {cookieResponseRules.length > 0 && (
                        <HeaderRuleList
                          variant="editor"
                          kind="cookie-response-append"
                          rules={cookieResponseRules}
                          onAdd={() =>
                            addRule(active.id, "cookie-response-append")
                          }
                          onUpdate={handleUpdate}
                          onDelete={(ruleId) => deleteRule(active.id, ruleId)}
                          onToggle={(ruleId) => toggleRule(active.id, ruleId)}
                          onReorder={(ruleIds) =>
                            reorderRules(active.id, ruleIds)
                          }
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
                          onReorder={(ruleIds) =>
                            reorderRules(active.id, ruleIds)
                          }
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
                          onAdd={() =>
                            addDomainFilter(active.id, currentTabDomain)
                          }
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
                          onDelete={(id) =>
                            deleteExcludeUrlFilter(active.id, id)
                          }
                          onToggle={(id) =>
                            toggleExcludeUrlFilter(active.id, id)
                          }
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
                    </>
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

          <div className="px-2">
            <NoFilterBanner compact />
          </div>

          <div className="he-bottom-bar flex items-center gap-2">
            <ModificationMenu
              {...modificationMenuProps}
              trigger={
                <Button size="sm" disabled={!active}>
                  <Plus aria-hidden="true" />
                  {t("popup.mod")}
                </Button>
              }
            />
            <FilterMenu
              {...filterMenuProps}
              trigger={
                <Button
                  variant="outline"
                  size="icon-sm"
                  title={t("filters.title")}
                  aria-label={t("filters.title")}
                  disabled={!active}
                >
                  <Filter aria-hidden="true" />
                </Button>
              }
            />
            <TemplateMenu profileId={active?.id ?? null} iconOnly />
            <div className="flex-1" />
            <ImportExportButtons iconOnly />
          </div>
        </main>
      </div>

      <Dialog
        open={!!renamingProfile}
        onOpenChange={(open) => {
          if (!open) setRenamingProfile(null);
        }}
        title={t("options.renameProfile")}
        footer={
          <>
            <Button variant="outline" onClick={() => setRenamingProfile(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRenameProfile}>{t("common.save")}</Button>
          </>
        }
      >
        <Input
          value={renamingProfile?.name ?? ""}
          autoFocus
          onChange={(event) =>
            setRenamingProfile((prev) =>
              prev ? { ...prev, name: event.target.value } : prev,
            )
          }
        />
      </Dialog>

      <ConfirmDialog
        open={deleteProfileOpen}
        onOpenChange={setDeleteProfileOpen}
        title={t("options.deleteProfile")}
        description={t("options.deleteProfileConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={() => {
          if (active) deleteProfile(active.id);
          setDeleteProfileOpen(false);
        }}
      />
      <AppToaster />
    </UIProvider>
  );
}

export default App;
