import {
  Filter,
  Layers3,
  Plus,
  Route,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/application/profile-store";
import { getProfileStats, getScopeParts, type HeaderRule } from "@/src/domain";
import type { DnrRuleError } from "@/src/platform/dnr";
import { Badge, Button } from "@/src/shared/ui";
import {
  ProfileFilterMenu,
  ProfileModificationMenu,
} from "../actions/ProfileActionMenus";
import {
  ProfileDomainFilterList,
  ProfileExcludeUrlFilterList,
  ProfileMethodFilterPicker,
  ProfileTabFilterList,
  ProfileUrlFilterList,
} from "../filters/ProfileFilterLists";
import { NoFilterBanner } from "../filters/NoFilterBanner";
import { ProfileVariableList } from "../variables/ProfileVariableList";
import { ProfileHeaderRuleList } from "./ProfileHeaderRuleList";
import { formatDnrError } from "./format-dnr-error";
import { formatScopeSummary } from "../lib/format-scope-summary";
import { getProfileEditorState } from "../lib/profile-editor-state";
import {
  editorSectionIconClassName,
  editorSectionIconVariants,
  editorSectionTitleClassName,
} from "../components/editor-styles";
import { cn } from "@/src/shared/lib/cn";

const EMPTY_DNR_ERRORS: DnrRuleError[] = [];

function hasRuleAdvancedConditions(rule: HeaderRule): boolean {
  const condition = rule.condition ?? {};
  return Boolean(
    condition.urlFilter?.trim() ||
    condition.useRegex ||
    condition.includedDomains?.length ||
    condition.excludedDomains?.length ||
    condition.resourceTypes?.length ||
    condition.requestMethods?.length,
  );
}

export function RuleTable() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);
  const storedDnrErrors = useProfileStore((s) =>
    activeId ? s.dnrErrors[activeId] : undefined,
  );
  const dnrErrors = storedDnrErrors ?? EMPTY_DNR_ERRORS;

  const profile = profiles.find((p) => p.id === activeId);

  if (!profile) {
    return (
      <div className="flex min-h-55 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/70 p-8 text-center text-muted-foreground">
        <Layers3 aria-hidden="true" className="h-9 w-9 text-muted-foreground" />
        <div className="text-sm font-semibold text-foreground">
          {t("options.noProfiles")}
        </div>
      </div>
    );
  }

  const {
    ruleGroups,
    filterGroups,
    variables,
    hasRuleContent,
    hasFilterContent,
  } = getProfileEditorState(profile);
  const {
    requestRules,
    responseRules,
    cookieRequestRules,
    cookieResponseRules,
    redirectRules,
  } = ruleGroups;
  const {
    tabFilters,
    domainFilters,
    urlFilters,
    excludeUrlFilters,
    methodFilters,
  } = filterGroups;
  const stats = getProfileStats(profile);
  const profileErrors = dnrErrors.filter((error) =>
    error.sourceRuleId.startsWith("__"),
  );
  const scopeParts = getScopeParts(profile);
  const advancedRuleCount = profile.rules.filter(
    hasRuleAdvancedConditions,
  ).length;

  const actionBar = (
    <div className="flex flex-wrap items-center gap-2">
      <ProfileModificationMenu profileId={profile.id} align="end" />
      <ProfileFilterMenu
        profileId={profile.id}
        methodFilters={methodFilters}
        align="end"
      />
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-225 flex-col gap-5">
      <section className="flex items-start justify-between gap-4.5 rounded-lg border border-border bg-card p-4.5 shadow-soft">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="m-0 truncate text-2xl font-bold text-foreground">
              {profile.name}
            </h1>
            <Badge>
              {t("options.ruleCount", { count: stats.enabledRules })}
            </Badge>
            {stats.hasGlobalRisk && (
              <Badge variant="warning" className="gap-1">
                <ShieldAlert aria-hidden="true" className="h-3 w-3" />
                {t("options.globalScopeRisk")}
              </Badge>
            )}
            {advancedRuleCount > 0 && (
              <Badge className="gap-1">
                <SlidersHorizontal aria-hidden="true" className="h-3 w-3" />
                {t("options.advancedRuleCount", { count: advancedRuleCount })}
              </Badge>
            )}
            {variables.length > 0 && (
              <Badge>
                {t("options.variableCount", { count: variables.length })}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatScopeSummary(scopeParts, t)}
          </p>
        </div>
        {actionBar}
      </section>

      <NoFilterBanner />

      {profileErrors.length > 0 && (
        <section className="rounded-lg border border-warning/35 bg-warning-soft px-4 py-3 text-xs leading-5 text-warning">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert aria-hidden="true" className="h-4 w-4" />
            {t("rule.profileRegistrationError")}
          </div>
          <ul className="mt-1.5 list-disc pl-5">
            {profileErrors.map((error, index) => (
              <li key={`${error.sourceRuleId}:${index}`}>
                {formatDnrError(error, t)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border bg-muted/35 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                editorSectionIconClassName,
                editorSectionIconVariants.filter,
              )}
            >
              <Filter aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className={editorSectionTitleClassName}>
                {t("scope.title")}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t("scope.layeringHint")}
              </div>
            </div>
          </div>
          <ProfileFilterMenu
            profileId={profile.id}
            methodFilters={methodFilters}
            align="end"
            trigger={
              <Button variant="outline" size="sm">
                <Plus aria-hidden="true" />
                {t("filters.addFilter")}
              </Button>
            }
          />
        </div>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.75 text-group-title leading-5 text-muted-foreground">
          <Route aria-hidden="true" className="h-4 w-4" />
          <span>{formatScopeSummary(scopeParts, t)}</span>
        </div>
        {hasFilterContent ? (
          <div className="m-3.5 flex flex-col gap-3">
            <ProfileTabFilterList
              profileId={profile.id}
              variant="editor"
              filters={tabFilters}
            />

            <ProfileDomainFilterList
              profileId={profile.id}
              variant="editor"
              filters={domainFilters}
            />

            <ProfileUrlFilterList
              profileId={profile.id}
              variant="editor"
              filters={urlFilters}
            />

            <ProfileExcludeUrlFilterList
              profileId={profile.id}
              variant="editor"
              filters={excludeUrlFilters}
            />

            <ProfileMethodFilterPicker
              profileId={profile.id}
              variant="editor"
              filters={methodFilters}
            />
          </div>
        ) : (
          <div className="m-3.5 flex min-h-21 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-center text-group-title text-muted-foreground">
            {t("scope.emptyHint")}
          </div>
        )}
      </section>

      <ProfileVariableList
        profileId={profile.id}
        variant="editor"
        showEmpty
        variables={variables}
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border bg-muted/35 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                editorSectionIconClassName,
                editorSectionIconVariants.request,
              )}
            >
              <Layers3 aria-hidden="true" />
            </span>
            <div>
              <div className={editorSectionTitleClassName}>
                {t("options.rules")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("options.editorHint")}
              </div>
            </div>
          </div>
          <ProfileModificationMenu
            profileId={profile.id}
            align="end"
            trigger={
              <Button size="sm">
                <Plus aria-hidden="true" />
                {t("popup.addMod")}
              </Button>
            }
          />
        </div>

        {!hasRuleContent ? (
          <div className="m-3.5 flex min-h-55 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/70 p-8 text-center text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Layers3 aria-hidden="true" className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {t("popup.noRules")}
              </div>
              <div className="mt-1 max-w-96 text-xs leading-5 text-muted-foreground">
                {t("popup.emptyModHint")}
              </div>
            </div>
            <ProfileModificationMenu
              profileId={profile.id}
              align="center"
              trigger={
                <Button size="sm">
                  <Plus aria-hidden="true" />
                  {t("popup.addMod")}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="m-3.5 flex flex-col gap-3">
            <ProfileHeaderRuleList
              profileId={profile.id}
              variant="editor"
              kind="header"
              target="request"
              rules={requestRules}
            />

            <ProfileHeaderRuleList
              profileId={profile.id}
              variant="editor"
              kind="header"
              target="response"
              rules={responseRules}
            />

            <ProfileHeaderRuleList
              profileId={profile.id}
              variant="editor"
              kind="cookie-request-append"
              rules={cookieRequestRules}
            />

            <ProfileHeaderRuleList
              profileId={profile.id}
              variant="editor"
              kind="cookie-response-append"
              rules={cookieResponseRules}
            />

            <ProfileHeaderRuleList
              profileId={profile.id}
              variant="editor"
              kind="redirect"
              rules={redirectRules}
            />
          </div>
        )}
      </section>
    </div>
  );
}
