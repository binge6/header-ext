import {
  AlertTriangle,
  Braces,
  Filter,
  Layers3,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AddProfileButton,
  ProfileAlwaysEnableButton,
} from "@/src/components/ProfileActionButtons";
import {
  ProfileFilterMenu,
  ProfileModificationMenu,
} from "@/src/components/ProfileActionMenus";
import {
  ProfileDomainFilterList,
  ProfileExcludeUrlFilterList,
  ProfileMethodFilterPicker,
  ProfileTabFilterList,
  ProfileUrlFilterList,
} from "@/src/components/ProfileFilterLists";
import { ProfileHeaderRuleList } from "@/src/components/ProfileHeaderRuleList";
import {
  ProfileAddVariableButton,
  ProfileVariableList,
} from "@/src/components/ProfileVariableList";
import { TemplateMenu } from "@/src/components/TemplateMenu";
import { Button } from "@/src/ui/controls";
import { Badge } from "@/src/ui/feedback";
import { DropdownMenu, DropdownMenuTrigger, Tooltip } from "@/src/ui/overlays";
import { Scroller } from "@/src/ui/scroll";
import type { OverlayScrollbarsComponentRef } from "overlayscrollbars-react";
import type {
  DomainFilter,
  ExcludeUrlFilter,
  HeaderRule,
  Profile,
  RuleKind,
  TabFilter,
  UrlFilter,
} from "@/src/core/types";
import type { ProfileStatus } from "@/src/core/profileStatus";
import { cn } from "@/src/utils/cn";
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
  globalPaused: boolean;
  riskyProfilesCount: number;
  riskyProfileNames: string;
  profileMenu: React.ReactNode;
  profileMenuVisible: boolean;
  scrollShadow: { top: boolean; bottom: boolean };
  scrollAreaRef: React.RefObject<OverlayScrollbarsComponentRef | null>;
  currentTabDomain: string;
  currentTabUrl: string;
  currentTabUrlPattern: string;
  currentTabRegex: string;
  onProfileMenuVisibleChange: (open: boolean) => void;
  onScrollUpdate: () => void;
}

function ruleKind(rule: HeaderRule): RuleKind {
  return rule.kind ?? "header";
}

export function ProfileEditor({
  active,
  activeStatus,
  globalPaused,
  riskyProfilesCount,
  riskyProfileNames,
  profileMenu,
  profileMenuVisible,
  scrollShadow,
  scrollAreaRef,
  currentTabDomain,
  currentTabUrl,
  currentTabUrlPattern,
  currentTabRegex,
  onProfileMenuVisibleChange,
  onScrollUpdate,
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
        <AddProfileButton size="sm">
          <Plus aria-hidden="true" />
          {t("options.newProfile")}
        </AddProfileButton>
      </div>
    );
  }

  const rules = active.rules;
  const ruleGroups: RuleGroups = {
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
  const filterGroups: FilterGroups = {
    tabFilters: active.tabFilters ?? [],
    domainFilters: active.domainFilters ?? [],
    urlFilters: active.urlFilters ?? [],
    excludeUrlFilters: active.excludeUrlFilters ?? [],
    methodFilters: active.methodFilters ?? [],
  };
  const variables = active.variables ?? [];
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
      (filterGroups.methodFilters ?? []).length >
    0;
  const hasVariableContent = variables.length > 0;

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
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ProfileModificationMenu
            profileId={active.id}
            compact
            side="top"
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
          <ProfileFilterMenu
            profileId={active.id}
            methodFilters={filterGroups.methodFilters ?? []}
            initialTabUrlFilter={currentTabUrlPattern}
            initialDomain={currentTabDomain}
            initialUrlRegex={currentTabRegex}
            initialExcludeUrl={currentTabUrl}
            compact
            side="top"
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
          <Tooltip content={t("variables.addItem")} side="bottom">
            <ProfileAddVariableButton
              profileId={active.id}
              variant="ghost"
              size="icon-sm"
              disabled={!active}
              aria-label={t("variables.addItem")}
            >
              <Braces aria-hidden="true" />
            </ProfileAddVariableButton>
          </Tooltip>
          <TemplateMenu profileId={active.id} iconOnly />
          <ProfileAlwaysEnableButton
            profileId={active.id}
            checked={!!activeStatus?.alwaysEnabled}
            side="bottom"
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
        <Scroller
          ref={scrollAreaRef}
          className="he-popup-editor-scroll"
          options={{ scrollbars: { autoHide: "scroll" } }}
          events={{ scroll: onScrollUpdate, updated: onScrollUpdate }}
        >
          <div className="flex flex-col gap-2">
            {!hasRuleContent && !hasFilterContent && !hasVariableContent && (
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
                <ProfileModificationMenu
                  profileId={active.id}
                  compact
                  side="top"
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
            {hasVariableContent && (
              <ProfileVariableList
                profileId={active.id}
                variant="editor"
                variables={variables}
              />
            )}
            {hasRuleContent && (
              <>
                <ProfileHeaderRuleList
                  profileId={active.id}
                  variant="editor"
                  advancedPopoverDensity="compact"
                  kind="header"
                  target="request"
                  rules={ruleGroups.requestRules}
                />
                <ProfileHeaderRuleList
                  profileId={active.id}
                  variant="editor"
                  advancedPopoverDensity="compact"
                  kind="header"
                  target="response"
                  rules={ruleGroups.responseRules}
                />
                {ruleGroups.cookieRequestRules.length > 0 && (
                  <ProfileHeaderRuleList
                    profileId={active.id}
                    variant="editor"
                    advancedPopoverDensity="compact"
                    kind="cookie-request-append"
                    rules={ruleGroups.cookieRequestRules}
                  />
                )}
                {ruleGroups.cookieResponseRules.length > 0 && (
                  <ProfileHeaderRuleList
                    profileId={active.id}
                    variant="editor"
                    advancedPopoverDensity="compact"
                    kind="cookie-response-append"
                    rules={ruleGroups.cookieResponseRules}
                  />
                )}
                {ruleGroups.redirectRules.length > 0 && (
                  <ProfileHeaderRuleList
                    profileId={active.id}
                    variant="editor"
                    advancedPopoverDensity="compact"
                    kind="redirect"
                    rules={ruleGroups.redirectRules}
                  />
                )}
              </>
            )}
            {hasFilterContent && (
              <>
                <ProfileTabFilterList
                  profileId={active.id}
                  variant="editor"
                  filters={filterGroups.tabFilters}
                  initialUrlFilter={currentTabUrlPattern}
                />
                <ProfileDomainFilterList
                  profileId={active.id}
                  variant="editor"
                  filters={filterGroups.domainFilters}
                  initialDomain={currentTabDomain}
                />
                <ProfileUrlFilterList
                  profileId={active.id}
                  variant="editor"
                  filters={filterGroups.urlFilters}
                  initialRegex={currentTabRegex}
                />
                <ProfileExcludeUrlFilterList
                  profileId={active.id}
                  variant="editor"
                  filters={filterGroups.excludeUrlFilters}
                  initialUrl={currentTabUrl}
                />
                <ProfileMethodFilterPicker
                  profileId={active.id}
                  variant="editor"
                  filters={filterGroups.methodFilters ?? []}
                />
              </>
            )}
          </div>
        </Scroller>
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
