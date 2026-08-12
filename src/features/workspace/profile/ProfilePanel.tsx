import { useMemo, useState } from "react";
import {
  Copy,
  Edit3,
  ListChecks,
  Plus,
  ShieldAlert,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useProfileActions,
  useProfileStore,
} from "@/src/application/profile-store";
import { buildWorkspaceStatus } from "@/src/domain";
import { cn } from "@/src/shared/lib/cn";
import {
  Button,
  Badge,
  Checkbox,
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
    deleteProfiles,
    setActiveProfile: setActive,
    setProfileAlwaysEnabled,
  } = useProfileActions();

  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBatch, setConfirmingBatch] = useState(false);

  const emptyProfileIds = useMemo(
    () =>
      profiles
        .filter((profile) => profile.rules.length === 0)
        .map((profile) => profile.id),
    [profiles],
  );

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

  const enterBatchMode = () => {
    setBatchMode(true);
    setSelectedIds(new Set());
  };

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (profileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };

  const selectEmpty = () => {
    setSelectedIds(new Set(emptyProfileIds));
  };

  const allSelected =
    profiles.length > 0 && selectedIds.size === profiles.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(profiles.map((profile) => profile.id)),
    );
  };

  const invertSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      profiles.forEach((profile) => {
        if (!prev.has(profile.id)) next.add(profile.id);
      });
      return next;
    });
  };

  const handleBatchDelete = () => {
    const removed = deleteProfiles(Array.from(selectedIds));
    if (removed > 0) {
      toast.success(t("options.deleteSelectedSuccess", { count: removed }));
    }
    setConfirmingBatch(false);
    exitBatchMode();
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 px-1">
        <div className="text-xs font-bold tracking-kicker text-muted-foreground uppercase">
          {t("options.profiles")}
        </div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("options.profilesHint")}
        </div>
      </div>

      {batchMode ? (
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
            <Checkbox
              checked={
                allSelected ? true : someSelected ? "indeterminate" : false
              }
              onCheckedChange={toggleSelectAll}
              label={t("options.selectAll")}
              aria-label={t("options.selectAll")}
              className="flex-1 text-xs"
            />
            <Tooltip content={t("options.invertSelection")}>
              <Button variant="ghost" size="sm" onClick={invertSelection}>
                {t("options.invertSelection")}
              </Button>
            </Tooltip>
            <Tooltip content={t("options.exitBatchDelete")}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("options.exitBatchDelete")}
                onClick={exitBatchMode}
              >
                <X aria-hidden="true" />
              </Button>
            </Tooltip>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={selectEmpty}
            disabled={emptyProfileIds.length === 0}
          >
            <ListChecks aria-hidden="true" />
            {t("options.selectEmptyProfiles")}
          </Button>
        </div>
      ) : (
        <div className="mb-3 flex gap-2">
          <Button className="flex-1" onClick={handleAdd}>
            <Plus aria-hidden="true" />
            {t("options.newProfile")}
          </Button>
          <Tooltip content={t("options.batchDelete")}>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("options.batchDelete")}
              disabled={profiles.length === 0}
              onClick={enterBatchMode}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/70 px-4 py-6 text-center text-xs text-muted-foreground">
          {t("options.noProfiles")}
        </div>
      ) : (
        <Scroller className="-mx-1 min-h-0 flex-1 px-1">
          <div className="flex flex-col gap-2">
            {workspace.statuses.map((status) => {
              const profile = status.profile;
              const selected = selectedIds.has(profile.id);
              return (
                <div
                  key={profile.id}
                  className={cn(
                    "group relative flex w-full items-center gap-0.5 rounded-xl border p-1 text-left transition-colors",
                    batchMode && selected
                      ? "border-primary/40 bg-accent/60"
                      : status.editing && !batchMode
                        ? "border-primary/30 border-l-3 border-l-primary bg-accent/55 hover:bg-accent/70"
                        : "border-transparent text-foreground hover:border-border hover:bg-muted/60 focus-within:border-border focus-within:bg-muted/60",
                  )}
                >
                  {batchMode && (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleSelected(profile.id)}
                      aria-label={profile.name}
                      className="ml-2 shrink-0"
                    />
                  )}
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent p-1.5 text-left text-inherit outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
                    onClick={() =>
                      batchMode
                        ? toggleSelected(profile.id)
                        : setActive(profile.id)
                    }
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        status.editing && !batchMode
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

                  {!batchMode && (
                    <>
                      <AlwaysEnableProfileButton
                        checked={status.alwaysEnabled}
                        className="shrink-0"
                        onCheckedChange={(enabled) =>
                          setProfileAlwaysEnabled(profile.id, enabled)
                        }
                      />

                      <span
                        className={cn(
                          "pointer-events-none absolute inset-y-1 right-9.5 flex items-center gap-0.5 bg-linear-to-r from-transparent pl-6 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                          status.editing ? "to-accent" : "to-muted",
                        )}
                      >
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
                              setRenaming({
                                id: profile.id,
                                name: profile.name,
                              });
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
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Scroller>
      )}

      {batchMode && (
        <Button
          variant="destructive"
          className="mt-3 w-full"
          disabled={selectedIds.size === 0}
          onClick={() => setConfirmingBatch(true)}
        >
          <Trash2 aria-hidden="true" />
          {t("options.deleteSelected", { count: selectedIds.size })}
        </Button>
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

      <ConfirmDialog
        open={confirmingBatch}
        onOpenChange={setConfirmingBatch}
        title={t("options.batchDelete")}
        description={t("options.deleteSelectedConfirm", {
          count: selectedIds.size,
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleBatchDelete}
      />
    </div>
  );
}
