import type { ReactNode } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions } from "@/src/application/profile-store";
import type { ProfileStatus } from "@/src/domain";
import {
  AlwaysEnableProfileButton,
  getProfileBadgeText,
} from "@/src/features/workspace";
import { cn } from "@/src/shared/lib/cn";
import { Button } from "@/src/shared/ui/controls";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  Tooltip,
} from "@/src/shared/ui/overlays";
import { Scroller } from "@/src/shared/ui/scroll";

interface ProfileRailProps {
  statuses: ProfileStatus[];
  collapsed: boolean;
  contextProfileId: string | null;
  renderMenu: (status: ProfileStatus) => ReactNode;
  onCollapsedChange: (collapsed: boolean) => void;
  onContextProfileChange: (profileId: string | null) => void;
}

export function ProfileRail({
  statuses,
  collapsed,
  contextProfileId,
  renderMenu,
  onCollapsedChange,
  onContextProfileChange,
}: ProfileRailProps) {
  const { t } = useTranslation();
  const { addProfile, setActiveProfile, setProfileAlwaysEnabled } =
    useProfileActions();

  const handleAddProfile = () => {
    const id = addProfile();
    setActiveProfile(id);
  };

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-soft",
        collapsed && "items-center",
      )}
    >
      <div
        className={cn(
          "flex min-h-8.5 items-center justify-between gap-2 border-b border-border/70 bg-muted/25 py-1 pr-1.5 pl-2",
          collapsed && "w-full justify-center p-1.25",
        )}
      >
        <span
          className={cn(
            "min-w-0 text-xs font-bold tracking-kicker text-muted-foreground uppercase",
            collapsed && "hidden",
          )}
        >
          {t("popup.enabledStack")}
        </span>
        <Tooltip
          content={
            collapsed ? t("popup.expandProfiles") : t("popup.collapseProfiles")
          }
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              collapsed
                ? t("popup.expandProfiles")
                : t("popup.collapseProfiles")
            }
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
        </Tooltip>
      </div>
      <Scroller className="max-h-popup-profile-list min-h-0 flex-1 p-1.25">
        <div
          className={cn(
            "flex flex-col gap-0.75",
            collapsed && "w-full items-center",
          )}
        >
          {statuses.map((status) => (
            <ProfileRailItem
              key={status.profile.id}
              status={status}
              collapsed={collapsed}
              contextOpen={contextProfileId === status.profile.id}
              menu={renderMenu(status)}
              onContextOpenChange={(open) =>
                onContextProfileChange(open ? status.profile.id : null)
              }
              onSelect={() => setActiveProfile(status.profile.id)}
              onToggle={(enabled) =>
                setProfileAlwaysEnabled(status.profile.id, enabled)
              }
            />
          ))}
        </div>
      </Scroller>
      <div className="border-t border-border p-1.75">
        {collapsed ? (
          <Tooltip content={t("options.newProfile")} side="right">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("options.newProfile")}
              onClick={handleAddProfile}
            >
              <Plus aria-hidden="true" />
            </Button>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddProfile}
          >
            <Plus aria-hidden="true" />
            {t("options.newProfile")}
          </Button>
        )}
      </div>
    </aside>
  );
}

interface ProfileRailItemProps {
  status: ProfileStatus;
  collapsed: boolean;
  contextOpen: boolean;
  menu: ReactNode;
  onContextOpenChange: (open: boolean) => void;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
}

function ProfileRailItem({
  status,
  collapsed,
  contextOpen,
  menu,
  onContextOpenChange,
  onSelect,
  onToggle,
}: ProfileRailItemProps) {
  const { t } = useTranslation();

  if (collapsed) {
    const label = `${status.profile.name}, ${t("options.ruleCount", {
      count: status.stats.enabledRules,
    })}`;

    return (
      <DropdownMenu open={contextOpen} onOpenChange={onContextOpenChange}>
        <div className="relative flex w-7.75 justify-center">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 p-0 opacity-0"
              aria-hidden="true"
              tabIndex={-1}
            />
          </DropdownMenuTrigger>
          <Tooltip content={label} side="right" disabled={contextOpen}>
            <button
              type="button"
              className={cn(
                "relative inline-flex h-7.75 w-7.75 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-secondary text-micro font-extrabold text-secondary-foreground transition-colors outline-none hover:border-border hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/25",
                status.editing &&
                  "border-primary/35 bg-primary text-primary-foreground shadow-soft",
                status.alwaysEnabled && "he-popup-profile-pill-enabled",
                status.stats.hasGlobalRisk && "he-popup-profile-pill-risk",
              )}
              aria-current={status.editing ? "page" : undefined}
              aria-label={label}
              onClick={onSelect}
              onContextMenu={(event) => {
                event.preventDefault();
                onContextOpenChange(true);
              }}
            >
              <span>{getProfileBadgeText(status.profile.name)}</span>
              {status.alwaysEnabled && <i aria-hidden="true" />}
            </button>
          </Tooltip>
        </div>
        {menu}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={contextOpen} onOpenChange={onContextOpenChange}>
      <div className="relative w-full">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden border-0 p-0 opacity-0"
            aria-hidden="true"
            tabIndex={-1}
          />
        </DropdownMenuTrigger>
        <div
          className={cn(
            "flex min-h-10 items-center gap-1.5 rounded-md border border-border/50 bg-card/70 px-1.5 py-1 transition-colors hover:border-primary/15 hover:bg-card hover:shadow-soft",
            status.editing &&
              "border-primary/30 border-l-3 border-l-primary bg-card shadow-soft",
            status.pausedByGlobal && "opacity-75",
          )}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextOpenChange(true);
          }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.75 border-0 bg-transparent p-0 text-left text-inherit outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
            aria-current={status.editing ? "page" : undefined}
            onClick={onSelect}
          >
            <span
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-micro font-extrabold text-secondary-foreground",
                status.editing && "bg-primary text-primary-foreground",
              )}
            >
              {getProfileBadgeText(status.profile.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-group-title font-semibold">
                  {status.profile.name}
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
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {t("options.ruleCount", { count: status.stats.enabledRules })}
              </span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <AlwaysEnableProfileButton
              checked={status.alwaysEnabled}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
      </div>
      {menu}
    </DropdownMenu>
  );
}
