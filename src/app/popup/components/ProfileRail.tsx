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
        "he-popup-profile-sidebar",
        collapsed && "he-popup-profile-sidebar-collapsed",
      )}
    >
      <div className="he-popup-sidebar-head">
        <span className="he-profile-list-kicker he-popup-sidebar-title">
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
      <Scroller className="he-popup-profile-list">
        <div className="he-popup-profile-list-content">
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
      <div className="he-popup-sidebar-footer">
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
        <div className="he-popup-profile-menu-anchor">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="he-popup-context-trigger"
              aria-hidden="true"
              tabIndex={-1}
            />
          </DropdownMenuTrigger>
          <Tooltip content={label} side="right" disabled={contextOpen}>
            <button
              type="button"
              className={cn(
                "he-popup-profile-pill",
                status.editing && "he-popup-profile-pill-editing",
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
      <div className="he-popup-profile-menu-anchor">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="he-popup-context-trigger"
            aria-hidden="true"
            tabIndex={-1}
          />
        </DropdownMenuTrigger>
        <div
          className={cn(
            "he-popup-profile-item",
            status.editing && "he-popup-profile-item-editing",
            status.pausedByGlobal && "he-popup-profile-item-paused",
          )}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextOpenChange(true);
          }}
        >
          <button
            type="button"
            className="he-popup-profile-select"
            aria-current={status.editing ? "page" : undefined}
            onClick={onSelect}
          >
            <span className="he-popup-profile-mark">
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
