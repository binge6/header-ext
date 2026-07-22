import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import { cn } from "@/src/utils/cn";
import {
  Button,
  ConfirmDialog,
  Dialog,
  Input,
  Tooltip,
} from "./ui";

function getProfileInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "H";
}

export function ProfilePanel() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const {
    addProfile,
    renameProfile,
    deleteProfile,
    setActiveProfile: setActive,
  } = useProfileActions();

  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    const id = addProfile();
    setActive(id);
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 px-1">
        <div className="he-profile-list-kicker">
          {t("options.profiles")}
        </div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("options.profilesHint")}
        </div>
      </div>
      <Button className="mb-4 w-full" onClick={handleAdd}>
        <Plus aria-hidden="true" />
        {t("options.newProfile")}
      </Button>

      {profiles.length === 0 ? (
        <div className="he-empty-state min-h-40 px-4 py-6 text-xs">
          {t("options.noProfiles")}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {profiles.map((profile) => {
            const isActive = profile.id === activeId;
            return (
              <div
                key={profile.id}
                className={cn(
                  "he-profile-list-item group",
                  isActive
                    ? "he-profile-list-item-active"
                    : "he-profile-list-item-idle",
                )}
              >
                <button
                  type="button"
                  className="he-profile-list-select"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActive(profile.id)}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {getProfileInitial(profile.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-group-title font-semibold">
                      {profile.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("options.ruleCount", { count: profile.rules.length })}
                    </span>
                  </span>
                </button>
                <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 group-focus-visible:opacity-100">
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
