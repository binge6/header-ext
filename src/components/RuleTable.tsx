import {
  Filter,
  Layers3,
  Plus,
  Route,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/src/store/profileStore";
import {
  getProfileStats,
  getScopeParts,
  type ScopeParts,
} from "@/src/core/profileStatus";
import { NoFilterBanner } from "./NoFilterBanner";
import {
  ProfileFilterMenu,
  ProfileModificationMenu,
} from "./ProfileActionMenus";
import {
  ProfileDomainFilterList,
  ProfileExcludeUrlFilterList,
  ProfileMethodFilterPicker,
  ProfileTabFilterList,
  ProfileUrlFilterList,
} from "./ProfileFilterLists";
import { ProfileHeaderRuleList } from "./ProfileHeaderRuleList";
import { ProfileVariableList } from "./ProfileVariableList";
import { Badge, Button } from "@/src/ui";
import type { HeaderRule, RuleKind } from "@/src/core/types";

function ruleKind(r: HeaderRule): RuleKind {
  return r.kind ?? "header";
}

function hasRuleAdvancedConditions(rule: HeaderRule): boolean {
  const condition = rule.condition ?? {};
  return Boolean(
    condition.urlFilter?.trim() ||
    condition.useRegex ||
    condition.excludedDomains?.length ||
    condition.resourceTypes?.length ||
    condition.requestMethods?.length,
  );
}

export function RuleTable() {
  const { t } = useTranslation();
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.meta.activeProfileId);

  const profile = profiles.find((p) => p.id === activeId);

  if (!profile) {
    return (
      <div className="he-empty-state">
        <Layers3 aria-hidden="true" className="h-9 w-9 text-muted-foreground" />
        <div className="text-sm font-semibold text-foreground">
          {t("options.noProfiles")}
        </div>
      </div>
    );
  }

  const requestRules = profile.rules.filter(
    (r) => ruleKind(r) === "header" && r.target === "request",
  );
  const responseRules = profile.rules.filter(
    (r) => ruleKind(r) === "header" && r.target === "response",
  );
  const cookieRequestRules = profile.rules.filter(
    (r) => ruleKind(r) === "cookie-request-append",
  );
  const cookieResponseRules = profile.rules.filter(
    (r) => ruleKind(r) === "cookie-response-append",
  );
  const redirectRules = profile.rules.filter((r) => ruleKind(r) === "redirect");
  const tabFilters = profile.tabFilters ?? [];
  const domainFilters = profile.domainFilters ?? [];
  const urlFilters = profile.urlFilters ?? [];
  const excludeUrlFilters = profile.excludeUrlFilters ?? [];
  const methodFilters = profile.methodFilters ?? [];
  const variables = profile.variables ?? [];
  const stats = getProfileStats(profile);
  const scopeParts = getScopeParts(profile);
  const advancedRuleCount = profile.rules.filter(
    hasRuleAdvancedConditions,
  ).length;
  const hasRuleContent =
    requestRules.length +
      responseRules.length +
      cookieRequestRules.length +
      cookieResponseRules.length +
      redirectRules.length >
    0;
  const hasScopeContent =
    tabFilters.length +
      domainFilters.length +
      urlFilters.length +
      excludeUrlFilters.length +
      methodFilters.length >
    0;

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

  const formatScopeSummary = (parts: ScopeParts): string => {
    const scope: string[] = [];
    if (parts.domains.length) {
      scope.push(
        t("scope.domainSummary", {
          domains: parts.domains.slice(0, 2).join(", "),
          count: parts.domains.length,
        }),
      );
    }
    if (parts.methods.length) {
      scope.push(
        t("scope.methodSummary", {
          methods: parts.methods.slice(0, 3).join(", "),
          count: parts.methods.length,
        }),
      );
    }
    if (parts.tabCount) {
      scope.push(t("scope.tabSummary", { count: parts.tabCount }));
    }
    if (parts.urlRegexCount) {
      scope.push(t("scope.urlSummary", { count: parts.urlRegexCount }));
    }
    if (parts.excludeCount) {
      scope.push(t("scope.excludeSummary", { count: parts.excludeCount }));
    }
    return scope.length ? scope.join(" · ") : t("scope.allRequests");
  };

  return (
    <div className="he-options-editor flex w-full flex-col gap-5">
      <section className="he-workbench-hero">
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
            {formatScopeSummary(scopeParts)}
          </p>
        </div>
        {actionBar}
      </section>

      <NoFilterBanner />

      <section className="he-workbench-section">
        <div className="he-workbench-section-head">
          <div className="flex min-w-0 items-center gap-2">
            <span className="he-editor-section-icon he-editor-section-icon-filter">
              <Filter aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="he-section-title">{t("scope.title")}</div>
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
        <div className="he-workbench-scope-summary">
          <Route aria-hidden="true" className="h-4 w-4" />
          <span>{formatScopeSummary(scopeParts)}</span>
        </div>
        {hasScopeContent ? (
          <div className="flex flex-col gap-3">
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
          <div className="he-workbench-empty-inline">
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

      <section className="he-workbench-section">
        <div className="he-workbench-section-head">
          <div className="flex min-w-0 items-center gap-2">
            <span className="he-editor-section-icon he-editor-section-icon-request">
              <Layers3 aria-hidden="true" />
            </span>
            <div>
              <div className="he-section-title">{t("options.rules")}</div>
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
          <div className="he-empty-state">
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
          <div className="flex flex-col gap-3">
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
