import { useMemo, useState } from "react";
import { Copy, Edit3, Plus, ShieldAlert, Trash2, Workflow } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useProfileActions,
  useProfileStore,
} from "@/src/application/profile-store";
import { buildWorkspaceStatus } from "@/src/domain";
import { cn } from "@/src/shared/lib/cn";
import {
  Button,
  Badge,
  ConfirmDialog,
  Dialog,
  Input,
  Scroller,
  Tooltip,
} from "@/src/shared/ui";
import { getProfileBadgeText } from "../lib/get-profile-badge";
import { AlwaysEnableProfileButton } from "./AlwaysEnableProfileButton";

export function ProfilePanel() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const meta = useProfileStore((s) => s.meta);
  const workspace = useMemo(
    () => buildWorkspaceStatus({ profiles, meta }),
    [profiles, meta],
  );
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

      <Button className="mb-3 w-full" onClick={handleAdd}>
        <Plus aria-hidden="true" />
        {t("options.newProfile")}
      </Button>

      {profiles.length === 0 ? (
        <div className="he-empty-state min-h-40 px-4 py-6 text-xs">
          {t("options.noProfiles")}
        </div>
      ) : (
        <Scroller className="-mx-1 min-h-0 flex-1 px-1">
          <div className="flex flex-col gap-2">
            {workspace.statuses.map((status) => {
              const profile = status.profile;
              return (
                <div
                  key={profile.id}
                  className={cn(
                    "he-profile-list-item group",
                    status.editing
                      ? "he-profile-list-item-active"
                      : "he-profile-list-item-idle",
                  )}
                >
                  <button
                    type="button"
                    className="he-profile-list-select"
                    onClick={() => setActive(profile.id)}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        status.editing
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
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
                      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">
                          {t("options.ruleCount", {
                            count: status.stats.enabledRules,
                          })}
                        </span>
                        {status.pausedByGlobal && (
                          <Badge variant="warning">
                            {t("popup.globalPaused")}
                          </Badge>
                        )}
                      </span>
                    </span>
                  </button>

                  <AlwaysEnableProfileButton
                    checked={status.alwaysEnabled}
                    className="shrink-0"
                    onCheckedChange={(enabled) =>
                      setProfileAlwaysEnabled(profile.id, enabled)
                    }
                  />

                  <span className="he-profile-list-actions">
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
              );
            })}
          </div>
        </Scroller>
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
