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
import { PopupHeader } from "./components/PopupHeader";
import { ProfileContextMenuContent } from "./components/ProfileContextMenu";
import { ProfileEditor } from "./components/ProfileEditor";
import { ProfileRail } from "./components/ProfileRail";
import "./App.css";

const logoUrl = new URL("../../assets/logo.svg", import.meta.url).href;

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
    renameProfile,
    duplicateProfile,
    deleteProfile,
    setLockedTabId,
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

  const isLocked = meta.lockedTabId != null;
  const lockedHere =
    isLocked && currentTabId != null && meta.lockedTabId === currentTabId;
  const lockLabel = lockedHere
    ? t("popup.unlockTab")
    : isLocked
      ? t("popup.lockedTo", { id: meta.lockedTabId })
      : t("popup.lockTab");

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
  }, [active?.id, active?.updatedAt, updateScrollShadow]);

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
            />

            <ProfileEditor
              active={active}
              activeStatus={activeStatus}
              globalPaused={meta.globalPaused}
              riskyProfilesCount={workspace.riskyProfiles.length}
              riskyProfileNames={riskyProfileNames}
              profileMenu={renderProfileMenu(activeStatus)}
              profileMenuVisible={profileMenuVisible}
              scrollShadow={scrollShadow}
              scrollAreaRef={scrollAreaRef}
              currentTabDomain={currentTabDomain}
              currentTabUrl={currentTabUrl}
              currentTabUrlPattern={currentTabUrlPattern}
              currentTabRegex={currentTabRegex}
              onProfileMenuVisibleChange={setProfileMenuVisible}
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
