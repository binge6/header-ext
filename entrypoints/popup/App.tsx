import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { initI18n } from "@/src/i18n";
import { useThemeMode } from "@/src/hooks/useThemeMode";
import { Button, Input } from "@/src/ui/controls";
import { AppToaster, ConfirmDialog, Dialog, Spinner } from "@/src/ui/feedback";
import { UIProvider } from "@/src/ui/overlays";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import {
  buildWorkspaceStatus,
  type ProfileStatus,
} from "@/src/core/profileStatus";
import type { HeaderRule, RuleKind } from "@/src/core/types";
import { PopupHeader } from "./components/PopupHeader";
import { ProfileContextMenuContent } from "./components/ProfileContextMenu";
import { ProfileEditor } from "./components/ProfileEditor";
import { ProfileRail } from "./components/ProfileRail";
import "./App.css";

const logoUrl = new URL("../../assets/logo.svg", import.meta.url).href;

function ruleKind(rule: HeaderRule): RuleKind {
  return rule.kind ?? "header";
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
    setProfileAlwaysEnabled,
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
  const [currentTabDomain, setCurrentTabDomain] = useState("");
  const [currentTabUrl, setCurrentTabUrl] = useState("");
  const [currentTabUrlPattern, setCurrentTabUrlPattern] = useState("");
  const [currentTabRegex, setCurrentTabRegex] = useState("");
  const scrollAreaRef = useRef<OverlayScrollbarsComponentRef>(null);
  const [scrollShadow, setScrollShadow] = useState({
    top: false,
    bottom: false,
  });
  const [renamingProfile, setRenamingProfile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const [profileRailCollapsed, setProfileRailCollapsed] = useState(true);
  const [contextProfileId, setContextProfileId] = useState<string | null>(null);

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
            const url = new URL(tab.url);
            if (url.protocol === "http:" || url.protocol === "https:") {
              setCurrentTabDomain(url.hostname);
              setCurrentTabUrl(tab.url);
              setCurrentTabUrlPattern(`*://${url.hostname}/*`);
              const escaped = url.hostname.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&",
              );
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

  const active = profiles.find(
    (profile) => profile.id === meta.activeProfileId,
  );
  const workspace = useMemo(
    () => buildWorkspaceStatus({ profiles, meta }, currentTabDomain),
    [currentTabDomain, meta, profiles],
  );
  const activeStatus =
    workspace.statuses.find((status) => status.profile.id === active?.id) ??
    null;

  const ruleGroups = useMemo(() => {
    const rules = active?.rules ?? [];
    return {
      requestRules: rules.filter(
        (rule) => ruleKind(rule) === "header" && rule.target === "request",
      ),
      responseRules: rules.filter(
        (rule) => ruleKind(rule) === "header" && rule.target === "response",
      ),
      cookieRequestRules: rules.filter(
        (rule) => ruleKind(rule) === "cookie-request-append",
      ),
      cookieResponseRules: rules.filter(
        (rule) => ruleKind(rule) === "cookie-response-append",
      ),
      redirectRules: rules.filter((rule) => ruleKind(rule) === "redirect"),
    };
  }, [active?.rules]);

  const filterGroups = useMemo(
    () => ({
      tabFilters: active?.tabFilters ?? [],
      domainFilters: active?.domainFilters ?? [],
      urlFilters: active?.urlFilters ?? [],
      excludeUrlFilters: active?.excludeUrlFilters ?? [],
      methodFilters: active?.methodFilters ?? [],
    }),
    [
      active?.domainFilters,
      active?.excludeUrlFilters,
      active?.methodFilters,
      active?.tabFilters,
      active?.urlFilters,
    ],
  );

  const hasRuleContent =
    ruleGroups.requestRules.length +
      ruleGroups.responseRules.length +
      ruleGroups.cookieRequestRules.length +
      ruleGroups.cookieResponseRules.length +
      ruleGroups.redirectRules.length >
    0;

  const hasFilterContent =
    filterGroups.tabFilters.length +
      filterGroups.domainFilters.length +
      filterGroups.urlFilters.length +
      filterGroups.excludeUrlFilters.length +
      filterGroups.methodFilters.length >
    0;

  const isLocked = meta.lockedTabId != null;
  const lockedHere =
    isLocked && currentTabId != null && meta.lockedTabId === currentTabId;
  const lockLabel = lockedHere
    ? t("popup.unlockTab")
    : isLocked
      ? t("popup.lockedTo", { id: meta.lockedTabId })
      : t("popup.lockTab");

  const addProfileAndActivate = () => {
    const id = addProfile();
    setActive(id);
  };

  const handleAddHeader = (target: "request" | "response") => {
    if (!active) return;
    addRule(active.id, "header", target);
  };

  const handleAddRule = (kind: HeaderRule["kind"]) => {
    if (!active || !kind) return;
    addRule(active.id, kind);
  };

  const handleUpdateRule = (rule: HeaderRule) => {
    if (!active) return;
    updateRule(active.id, rule);
  };

  const handleOpenRenameProfile = (profileId: string, name: string) => {
    setProfileMenuVisible(false);
    setRenamingProfile({ id: profileId, name });
  };

  const handleRenameProfile = () => {
    if (!renamingProfile) return;
    renameProfile(renamingProfile.id, renamingProfile.name);
    setRenamingProfile(null);
  };

  const handleDuplicateProfile = (profileId: string, name: string) => {
    setProfileMenuVisible(false);
    const id = duplicateProfile(
      profileId,
      t("options.profileCopyName", { name }),
    );
    if (id) setActive(id);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfileMenuVisible(false);
    setDeleteProfileId(profileId);
  };

  const renderProfileMenu = (status: ProfileStatus | null) => {
    if (!status) return null;
    const { profile } = status;

    return (
      <ProfileContextMenuContent
        onRename={() => handleOpenRenameProfile(profile.id, profile.name)}
        onDuplicate={() => handleDuplicateProfile(profile.id, profile.name)}
        onDelete={() => handleDeleteProfile(profile.id)}
      />
    );
  };

  const handleToggleTabLock = () => {
    if (lockedHere) {
      setLockedTabId(null);
    } else if (currentTabId != null) {
      setLockedTabId(currentTabId);
    }
  };

  const updateScrollShadow = useCallback(() => {
    const viewport = scrollAreaRef.current?.osInstance()?.elements().viewport;
    if (!viewport) {
      setScrollShadow({ top: false, bottom: false });
      return;
    }

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    const next = {
      top: viewport.scrollTop > 1,
      bottom: maxScrollTop - viewport.scrollTop > 1,
    };

    setScrollShadow((prev) =>
      prev.top === next.top && prev.bottom === next.bottom ? prev : next,
    );
  }, []);

  // 内容变化（切换 profile / 增删规则）后重算阴影；滚动与尺寸变化经
  // OverlayScrollbars 的 scroll / updated 事件驱动（见 ProfileEditor 的 events）。
  useEffect(() => {
    updateScrollShadow();
  }, [active?.id, filterGroups, ruleGroups, updateScrollShadow]);

  if (!hydrated) {
    return (
      <div className="flex min-h-100 w-140 items-center justify-center bg-background">
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
    onAddRequestCookie: () => handleAddRule("cookie-request-append"),
    onAddResponseCookie: () => handleAddRule("cookie-response-append"),
    onAddRedirect: () => handleAddRule("redirect"),
  };

  const filterMenuProps = {
    disabled: !active,
    compact: true,
    side: "top" as const,
    onAddTab: () => active && addTabFilter(active.id, currentTabUrlPattern),
    onAddDomain: () => active && addDomainFilter(active.id, currentTabDomain),
    onAddUrl: () => active && addUrlFilter(active.id, currentTabRegex),
    onAddExcludeUrl: () =>
      active && addExcludeUrlFilter(active.id, currentTabUrl),
    onAddMethod: addMethodFilterIfNeeded,
  };

  const riskyProfileNames = workspace.riskyProfiles
    .map((status) => status.profile.name)
    .slice(0, 2)
    .join(", ");

  return (
    <UIProvider delayDuration={250}>
      <div className="he-popup-shell flex w-155 min-h-100 flex-col text-foreground">
        <PopupHeader
          logoUrl={logoUrl}
          globalPaused={meta.globalPaused}
          enabledProfilesCount={workspace.enabledProfiles.length}
          enabledRuleCount={workspace.enabledRuleCount}
          locked={isLocked}
          lockedHere={lockedHere}
          lockLabel={lockLabel}
          canToggleLock={currentTabId != null || lockedHere}
          onTogglePause={() => togglePause()}
          onToggleTabLock={handleToggleTabLock}
        />

        <main className="he-popup-body">
          <div
            className={
              profileRailCollapsed
                ? "he-popup-workspace he-popup-workspace-collapsed"
                : "he-popup-workspace"
            }
          >
            <ProfileRail
              statuses={workspace.statuses}
              collapsed={profileRailCollapsed}
              contextProfileId={contextProfileId}
              renderMenu={renderProfileMenu}
              onCollapsedChange={setProfileRailCollapsed}
              onContextProfileChange={setContextProfileId}
              onAddProfile={addProfileAndActivate}
              onSelectProfile={setActive}
              onToggleAlwaysEnabled={setProfileAlwaysEnabled}
            />

            <ProfileEditor
              active={active}
              activeStatus={activeStatus}
              ruleGroups={ruleGroups}
              filterGroups={filterGroups}
              hasRuleContent={hasRuleContent}
              hasFilterContent={hasFilterContent}
              globalPaused={meta.globalPaused}
              riskyProfilesCount={workspace.riskyProfiles.length}
              riskyProfileNames={riskyProfileNames}
              profileMenu={renderProfileMenu(activeStatus)}
              profileMenuVisible={profileMenuVisible}
              scrollShadow={scrollShadow}
              scrollAreaRef={scrollAreaRef}
              modificationMenuProps={modificationMenuProps}
              filterMenuProps={filterMenuProps}
              onProfileMenuVisibleChange={setProfileMenuVisible}
              onAddProfile={addProfileAndActivate}
              onToggleAlwaysEnabled={(enabled) => {
                if (active) setProfileAlwaysEnabled(active.id, enabled);
              }}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={(ruleId) => active && deleteRule(active.id, ruleId)}
              onToggleRule={(ruleId) => active && toggleRule(active.id, ruleId)}
              onReorderRules={(ruleIds) =>
                active && reorderRules(active.id, ruleIds)
              }
              onUpdateTabFilter={(filter) =>
                active && updateTabFilter(active.id, filter)
              }
              onDeleteTabFilter={(filterId) =>
                active && deleteTabFilter(active.id, filterId)
              }
              onToggleTabFilter={(filterId) =>
                active && toggleTabFilter(active.id, filterId)
              }
              onUpdateDomainFilter={(filter) =>
                active && updateDomainFilter(active.id, filter)
              }
              onDeleteDomainFilter={(filterId) =>
                active && deleteDomainFilter(active.id, filterId)
              }
              onToggleDomainFilter={(filterId) =>
                active && toggleDomainFilter(active.id, filterId)
              }
              onUpdateUrlFilter={(filter) =>
                active && updateUrlFilter(active.id, filter)
              }
              onDeleteUrlFilter={(filterId) =>
                active && deleteUrlFilter(active.id, filterId)
              }
              onToggleUrlFilter={(filterId) =>
                active && toggleUrlFilter(active.id, filterId)
              }
              onUpdateExcludeUrlFilter={(filter) =>
                active && updateExcludeUrlFilter(active.id, filter)
              }
              onDeleteExcludeUrlFilter={(filterId) =>
                active && deleteExcludeUrlFilter(active.id, filterId)
              }
              onToggleExcludeUrlFilter={(filterId) =>
                active && toggleExcludeUrlFilter(active.id, filterId)
              }
              onSetMethodFilters={(methods) =>
                active && setMethodFilters(active.id, methods)
              }
              onAddHeader={handleAddHeader}
              onAddRule={handleAddRule}
              onScrollUpdate={updateScrollShadow}
            />
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
        open={!!deleteProfileId}
        onOpenChange={(open) => {
          if (!open) setDeleteProfileId(null);
        }}
        title={t("options.deleteProfile")}
        description={t("options.deleteProfileConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={() => {
          if (deleteProfileId) deleteProfile(deleteProfileId);
          setDeleteProfileId(null);
        }}
      />
      <AppToaster />
    </UIProvider>
  );
}

export default App;
