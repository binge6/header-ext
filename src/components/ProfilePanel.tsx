import { useState } from "react";
import { Copy, Edit3, Plus, ShieldAlert, Trash2, Workflow } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AlwaysEnableProfileButton } from "@/src/components/AlwaysEnableProfileButton";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { buildWorkspaceStatus } from "@/src/core/profileStatus";
import { getProfileBadgeText } from "@/src/utils/profile";
import {
  Button,
  Badge,
  ConfirmDialog,
  Dialog,
  Input,
  Tooltip,
} from "@/src/ui";

export function ProfilePanel() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const workspace = buildWorkspaceStatus({ profiles, meta });
  const {
    addProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    setActiveProfile: setActive,
    setProfileAlwaysEnabled,
  } = useProfileActions();

  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    const id = addProfile();
    setActive(id);
  };

  const handleDuplicate = (profileId: string, name: string) => {
    const id = duplicateProfile(
      profileId,
      t("options.profileCopyName", { name }),
    );
    if (id) setActive(id);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 px-1">
        <div className="he-profile-list-kicker">{t("options.profiles")}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("options.profilesHint")}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="he-options-mini-stat">
          <span>{workspace.enabledProfiles.length}</span>
          <small>{t("popup.enabledProfiles")}</small>
        </div>
        <div className="he-options-mini-stat">
          <span>{workspace.enabledRuleCount}</span>
          <small>{t("popup.enabledRules")}</small>
        </div>
      </div>

      <Button className="mb-3 w-full" onClick={handleAdd}>
        <Plus aria-hidden="true" />
        {t("options.newProfile")}
      </Button>

      {profiles.length === 0 ? (
        <div className="he-empty-state min-h-40 px-4 py-6 text-xs">
          {t("options.noProfiles")}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {workspace.statuses.map((status) => {
            const profile = status.profile;
            return (
              <div
                key={profile.id}
                className="he-profile-list-item he-profile-list-item-idle group flex-col items-stretch"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    className="he-profile-list-select"
                    onClick={() => setActive(profile.id)}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground"
                    >
                      {getProfileBadgeText(profile.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-group-title font-semibold">
                          {profile.name}
                        </span>
                        {status.stats.hasGlobalRisk && (
                          <ShieldAlert
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-warning"
                          />
                        )}
                        {status.stats.advancedRules > 0 && (
                          <Workflow
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("options.ruleCount", {
                          count: status.stats.enabledRules,
                        })}
                      </span>
                    </span>
                  </button>
                  <AlwaysEnableProfileButton
                    checked={status.alwaysEnabled}
                    label
                    onCheckedChange={(enabled) =>
                      setProfileAlwaysEnabled(profile.id, enabled)
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 px-2 pb-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {status.pausedByGlobal && (
                      <Badge variant="warning">
                        {t("popup.globalPaused")}
                      </Badge>
                    )}
                  </div>
                  <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 group-focus-visible:opacity-100">
                    <Tooltip content={t("options.copyProfile")}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("options.copyProfile")}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDuplicate(profile.id, profile.name);
                        }}
                      >
                        <Copy aria-hidden="true" />
                      </Button>
                    </Tooltip>
                  <Tooltip content={t("options.renameProfile")}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("options.renameProfile")}
                      onClick={(event) => {
                        event.stopPropagation();
                        setRenaming({ id: profile.id, name: profile.name });
                      }}
                    >
                      <Edit3 aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={t("options.deleteProfile")}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hover:text-destructive"
                      aria-label={t("options.deleteProfile")}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeletingId(profile.id);
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
        title={t("options.renameProfile")}
        footer={
          <>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!renaming) return;
                renameProfile(
                  renaming.id,
                  renaming.name.trim() || t("options.untitledProfile"),
                );
                setRenaming(null);
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={renaming?.name ?? ""}
          onChange={(event) =>
            setRenaming((prev) =>
              prev ? { ...prev, name: event.target.value } : prev,
            )
          }
        />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
        title={t("options.deleteProfile")}
        description={t("options.deleteProfileConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={() => {
          if (deletingId) deleteProfile(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
