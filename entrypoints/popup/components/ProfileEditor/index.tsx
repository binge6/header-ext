import {
  AlertTriangle,
  Filter,
  Layers3,
  Lock,
  MoreHorizontal,
  Plus,
  Unlock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AlwaysEnableProfileButton } from "@/src/components/AlwaysEnableProfileButton";
import { FilterRowList } from "@/src/components/FilterRowList";
import { HeaderRuleList } from "@/src/components/HeaderRuleList";
import { MethodFilterPicker } from "@/src/components/MethodFilterPicker";
import { FilterMenu, ModificationMenu } from "@/src/components/RuleActionMenus";
import { TabFilterList } from "@/src/components/TabFilterList";
import { TemplateMenu } from "@/src/components/TemplateMenu";
import { Button } from "@/src/ui/controls";
import { Badge } from "@/src/ui/feedback";
import { DropdownMenu, DropdownMenuTrigger, Tooltip } from "@/src/ui/overlays";
import type {
  DomainFilter,
  ExcludeUrlFilter,
  HeaderRule,
  Profile,
  TabFilter,
  UrlFilter,
} from "@/src/core/types";
import type { ProfileStatus, ScopeParts } from "@/src/core/profileStatus";
import { cn } from "@/src/utils/cn";
import { formatScopeSummary } from "../utils";
import styles from "./index.module.scss";

interface RuleGroups {
  requestRules: HeaderRule[];
  responseRules: HeaderRule[];
  cookieRequestRules: HeaderRule[];
  cookieResponseRules: HeaderRule[];
  redirectRules: HeaderRule[];
}

interface FilterGroups {
  tabFilters: TabFilter[];
  domainFilters: DomainFilter[];
  urlFilters: UrlFilter[];
  excludeUrlFilters: ExcludeUrlFilter[];
  methodFilters: Profile["methodFilters"];
}

interface Props {
  active: Profile | undefined;
  activeStatus: ProfileStatus | null;
  ruleGroups: RuleGroups;
  filterGroups: FilterGroups;
  hasRuleContent: boolean;
  hasFilterContent: boolean;
  globalPaused: boolean;
  riskyProfilesCount: number;
  riskyProfileNames: string;
  lockLabel: string;
  lockedHere: boolean;
  canToggleLock: boolean;
  profileMenu: React.ReactNode;
  profileMenuVisible: boolean;
  scrollShadow: { top: boolean; bottom: boolean };
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  modificationMenuProps: React.ComponentProps<typeof ModificationMenu>;
  filterMenuProps: React.ComponentProps<typeof FilterMenu>;
  onProfileMenuVisibleChange: (open: boolean) => void;
  onAddProfile: () => void;
  onToggleTabLock: () => void;
  onToggleAlwaysEnabled: (enabled: boolean) => void;
  onUpdateRule: (rule: HeaderRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string) => void;
  onReorderRules: (ruleIds: string[]) => void;
  onUpdateTabFilter: (filter: TabFilter) => void;
  onDeleteTabFilter: (filterId: string) => void;
  onToggleTabFilter: (filterId: string) => void;
  onUpdateDomainFilter: (filter: DomainFilter) => void;
  onDeleteDomainFilter: (filterId: string) => void;
  onToggleDomainFilter: (filterId: string) => void;
  onUpdateUrlFilter: (filter: UrlFilter) => void;
  onDeleteUrlFilter: (filterId: string) => void;
  onToggleUrlFilter: (filterId: string) => void;
  onUpdateExcludeUrlFilter: (filter: ExcludeUrlFilter) => void;
  onDeleteExcludeUrlFilter: (filterId: string) => void;
  onToggleExcludeUrlFilter: (filterId: string) => void;
  onSetMethodFilters: (methods: string[]) => void;
  onAddHeader: (target: "request" | "response") => void;
  onAddRule: (kind: HeaderRule["kind"]) => void;
  onScroll: () => void;
}

export function ProfileEditor({
  active,
  activeStatus,
  ruleGroups,
  filterGroups,
  hasRuleContent,
  hasFilterContent,
  globalPaused,
  riskyProfilesCount,
  riskyProfileNames,
  lockLabel,
  lockedHere,
  canToggleLock,
  profileMenu,
  profileMenuVisible,
  scrollShadow,
  scrollAreaRef,
  modificationMenuProps,
  filterMenuProps,
  onProfileMenuVisibleChange,
  onAddProfile,
  onToggleTabLock,
  onToggleAlwaysEnabled,
  onUpdateRule,
  onDeleteRule,
  onToggleRule,
  onReorderRules,
  onUpdateTabFilter,
  onDeleteTabFilter,
  onToggleTabFilter,
  onUpdateDomainFilter,
  onDeleteDomainFilter,
  onToggleDomainFilter,
  onUpdateUrlFilter,
  onDeleteUrlFilter,
  onToggleUrlFilter,
  onUpdateExcludeUrlFilter,
  onDeleteExcludeUrlFilter,
  onToggleExcludeUrlFilter,
  onSetMethodFilters,
  onAddHeader,
  onAddRule,
  onScroll,
}: Props) {
  const { t } = useTranslation();

  if (!active) {
    return (
      <div className="flex min-h-54 flex-1 flex-col items-center justify-center gap-2.5 px-4 py-5.5">
        <div
          className={cn(
            "inline-flex h-14 w-17 items-center justify-center text-primary",
            styles.emptyVisual,
          )}
        >
          <Layers3 aria-hidden="true" />
        </div>
        <div className="text-sm font-semibold text-foreground">
          {t("options.noProfiles")}
        </div>
        <Button size="sm" onClick={onAddProfile}>
          <Plus aria-hidden="true" />
          {t("options.newProfile")}
        </Button>
      </div>
    );
  }

  const scopeParts: ScopeParts = activeStatus?.scopeParts ?? {
    domains: [],
    methods: [],
    tabCount: 0,
    urlRegexCount: 0,
    excludeCount: 0,
  };

  return (
    <section className={cn("he-popup-editor-card", styles.editorScope)}>
      <div className="he-popup-editor-head">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "he-profile-status-dot",
                globalPaused && "he-profile-status-dot-paused",
                !activeStatus?.enabled && "he-profile-status-dot-off",
              )}
            />
            <span className="truncate text-sm font-bold text-foreground">
              {active.name}
            </span>
            <Badge variant={activeStatus?.enabled ? "success" : "secondary"}>
              {activeStatus?.enabled
                ? t("common.enabled")
                : t("common.disabled")}
            </Badge>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatScopeSummary(scopeParts, t)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ModificationMenu
            {...modificationMenuProps}
            triggerTooltip={t("popup.addMod")}
            triggerTooltipSide="bottom"
            trigger={
              <Button
                variant="secondary"
                size="icon-sm"
                disabled={!active}
                aria-label={t("popup.addMod")}
              >
                <Plus aria-hidden="true" />
              </Button>
            }
          />
          <FilterMenu
            {...filterMenuProps}
            triggerTooltip={t("filters.addFilter")}
            triggerTooltipSide="bottom"
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!active}
                aria-label={t("filters.addFilter")}
              >
                <Filter aria-hidden="true" />
              </Button>
            }
          />
          <TemplateMenu profileId={active?.id ?? null} iconOnly />
          <Tooltip content={lockLabel}>
            <Button
              variant={lockedHere ? "secondary" : "ghost"}
              size="icon-sm"
              disabled={!canToggleLock}
              aria-label={lockLabel}
              onClick={onToggleTabLock}
            >
              {lockedHere ? (
                <Unlock aria-hidden="true" />
              ) : (
                <Lock aria-hidden="true" />
              )}
            </Button>
          </Tooltip>
          <AlwaysEnableProfileButton
            checked={!!activeStatus?.alwaysEnabled}
            side="bottom"
            onCheckedChange={onToggleAlwaysEnabled}
          />
          <DropdownMenu
            open={profileMenuVisible}
            onOpenChange={onProfileMenuVisibleChange}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("popup.profileActions")}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            {profileMenu}
          </DropdownMenu>
        </div>
      </div>

      {riskyProfilesCount > 0 && (
        <div className="he-popup-risk-line">
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="min-w-0 flex-1 truncate">
            {t("popup.riskProfiles", {
              names: riskyProfileNames,
              count: riskyProfilesCount,
            })}
          </span>
        </div>
      )}

      <div className="he-main-content relative flex-1">
        <div
          className={cn(
            styles.scrollShadow,
            styles.scrollShadowTop,
            scrollShadow.top && styles.scrollShadowVisible,
          )}
        />
        <div
          ref={scrollAreaRef}
          className="he-popup-editor-scroll overflow-y-auto"
          onScroll={onScroll}
        >
          <div className="flex flex-col gap-2">
            {!hasRuleContent && !hasFilterContent && (
              <div className="flex min-h-54 flex-col items-center justify-center gap-2.5 px-4 py-5.5">
                <div
                  className={cn(
                    "inline-flex h-14 w-17 items-center justify-center text-primary",
                    styles.emptyVisual,
                  )}
                  aria-hidden="true"
                >
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
            {hasRuleContent && (
              <>
                <HeaderRuleList
                  variant="editor"
                  kind="header"
                  target="request"
                  rules={ruleGroups.requestRules}
                  onAdd={() => onAddHeader("request")}
                  onUpdate={onUpdateRule}
                  onDelete={onDeleteRule}
                  onToggle={onToggleRule}
                  onReorder={onReorderRules}
                />
                <HeaderRuleList
                  variant="editor"
                  kind="header"
                  target="response"
                  rules={ruleGroups.responseRules}
                  onAdd={() => onAddHeader("response")}
                  onUpdate={onUpdateRule}
                  onDelete={onDeleteRule}
                  onToggle={onToggleRule}
                  onReorder={onReorderRules}
                />
                {ruleGroups.cookieRequestRules.length > 0 && (
                  <HeaderRuleList
                    variant="editor"
                    kind="cookie-request-append"
                    rules={ruleGroups.cookieRequestRules}
                    onAdd={() => onAddRule("cookie-request-append")}
                    onUpdate={onUpdateRule}
                    onDelete={onDeleteRule}
                    onToggle={onToggleRule}
                    onReorder={onReorderRules}
                  />
                )}
                {ruleGroups.cookieResponseRules.length > 0 && (
                  <HeaderRuleList
                    variant="editor"
                    kind="cookie-response-append"
                    rules={ruleGroups.cookieResponseRules}
                    onAdd={() => onAddRule("cookie-response-append")}
                    onUpdate={onUpdateRule}
                    onDelete={onDeleteRule}
                    onToggle={onToggleRule}
                    onReorder={onReorderRules}
                  />
                )}
                {ruleGroups.redirectRules.length > 0 && (
                  <HeaderRuleList
                    variant="editor"
                    kind="redirect"
                    rules={ruleGroups.redirectRules}
                    onAdd={() => onAddRule("redirect")}
                    onUpdate={onUpdateRule}
                    onDelete={onDeleteRule}
                    onToggle={onToggleRule}
                    onReorder={onReorderRules}
                  />
                )}
              </>
            )}
            {hasFilterContent && (
              <>
                <TabFilterList
                  variant="editor"
                  filters={filterGroups.tabFilters}
                  onAdd={filterMenuProps.onAddTab}
                  onUpdate={onUpdateTabFilter}
                  onDelete={onDeleteTabFilter}
                  onToggle={onToggleTabFilter}
                />
                <FilterRowList<DomainFilter>
                  variant="editor"
                  filters={filterGroups.domainFilters}
                  valueField="domain"
                  i18nKey="domainFilters"
                  onAdd={filterMenuProps.onAddDomain}
                  onUpdate={onUpdateDomainFilter}
                  onDelete={onDeleteDomainFilter}
                  onToggle={onToggleDomainFilter}
                />
                <FilterRowList<UrlFilter>
                  variant="editor"
                  filters={filterGroups.urlFilters}
                  valueField="regex"
                  i18nKey="urlFilters"
                  onAdd={filterMenuProps.onAddUrl}
                  onUpdate={onUpdateUrlFilter}
                  onDelete={onDeleteUrlFilter}
                  onToggle={onToggleUrlFilter}
                />
                <FilterRowList<ExcludeUrlFilter>
                  variant="editor"
                  filters={filterGroups.excludeUrlFilters}
                  valueField="url"
                  i18nKey="excludeUrlFilters"
                  onAdd={filterMenuProps.onAddExcludeUrl}
                  onUpdate={onUpdateExcludeUrlFilter}
                  onDelete={onDeleteExcludeUrlFilter}
                  onToggle={onToggleExcludeUrlFilter}
                />
                <MethodFilterPicker
                  variant="editor"
                  filters={filterGroups.methodFilters ?? []}
                  onChange={onSetMethodFilters}
                />
              </>
            )}
          </div>
        </div>
        <div
          className={cn(
            styles.scrollShadow,
            styles.scrollShadowBottom,
            scrollShadow.bottom && styles.scrollShadowVisible,
          )}
        />
      </div>
    </section>
  );
}
