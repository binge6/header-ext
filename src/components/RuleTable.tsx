import {
  Filter,
  Layers3,
  Plus,
  Route,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfileActions, useProfileStore } from "@/src/store/profileStore";
import {
  getProfileStats,
  getScopeParts,
  type ScopeParts,
} from "@/src/core/profileStatus";
import { HeaderRuleList } from "./HeaderRuleList";
import { TabFilterList } from "./TabFilterList";
import { FilterRowList } from "./FilterRowList";
import { MethodFilterPicker } from "./MethodFilterPicker";
import { NoFilterBanner } from "./NoFilterBanner";
import { FilterMenu, ModificationMenu } from "./RuleActionMenus";
import { Button } from "./ui";
import type {
  HeaderRule,
  RuleKind,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
} from "@/src/core/types";

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
  const {
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    reorderRules,
    addTabFilter,
    updateTabFilter,
    deleteTabFilter,
    toggleTabFilter,
    addDomainFilter,
    updateDomainFilter,
    deleteDomainFilter,
    toggleDomainFilter,
    addUrlFilter,
    updateUrlFilter,
    deleteUrlFilter,
    toggleUrlFilter,
    addExcludeUrlFilter,
    updateExcludeUrlFilter,
    deleteExcludeUrlFilter,
    toggleExcludeUrlFilter,
    addMethodFilter,
    setMethodFilters,
  } = useProfileActions();

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

  const handleAddHeader = (target: "request" | "response") => {
    addRule(profile.id, "header", target);
  };

  const handleUpdate = (rule: HeaderRule) => {
    updateRule(profile.id, rule);
  };

  const handleAddMethodFilter = () => {
    if (methodFilters.length === 0) {
      addMethodFilter(profile.id, "GET");
    }
  };

  const actionBar = (
    <div className="flex flex-wrap items-center gap-2">
      <ModificationMenu
        align="end"
        onAddRequestHeader={() => handleAddHeader("request")}
        onAddResponseHeader={() => handleAddHeader("response")}
        onAddRequestCookie={() =>
          addRule(profile.id, "cookie-request-append")
        }
        onAddResponseCookie={() =>
          addRule(profile.id, "cookie-response-append")
        }
        onAddRedirect={() => addRule(profile.id, "redirect")}
      />
      <FilterMenu
        align="end"
        onAddTab={() => addTabFilter(profile.id)}
        onAddDomain={() => addDomainFilter(profile.id)}
        onAddUrl={() => addUrlFilter(profile.id)}
        onAddExcludeUrl={() => addExcludeUrlFilter(profile.id)}
        onAddMethod={handleAddMethodFilter}
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
            <span className="he-badge he-badge-secondary">
              {t("options.ruleCount", { count: stats.enabledRules })}
            </span>
            {stats.hasGlobalRisk && (
              <span className="he-badge he-badge-warning gap-1">
                <ShieldAlert aria-hidden="true" className="h-3 w-3" />
                {t("options.globalScopeRisk")}
              </span>
            )}
            {advancedRuleCount > 0 && (
              <span className="he-badge he-badge-secondary gap-1">
                <SlidersHorizontal aria-hidden="true" className="h-3 w-3" />
                {t("options.advancedRuleCount", { count: advancedRuleCount })}
              </span>
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
          <FilterMenu
            align="end"
            trigger={
              <Button variant="outline" size="sm">
                <Plus aria-hidden="true" />
                {t("filters.addFilter")}
              </Button>
            }
            onAddTab={() => addTabFilter(profile.id)}
            onAddDomain={() => addDomainFilter(profile.id)}
            onAddUrl={() => addUrlFilter(profile.id)}
            onAddExcludeUrl={() => addExcludeUrlFilter(profile.id)}
            onAddMethod={handleAddMethodFilter}
          />
        </div>
        <div className="he-workbench-scope-summary">
          <Route aria-hidden="true" className="h-4 w-4" />
          <span>{formatScopeSummary(scopeParts)}</span>
        </div>
        {hasScopeContent ? (
          <div className="flex flex-col gap-3">
            <TabFilterList
              variant="editor"
              filters={tabFilters}
              onAdd={() => addTabFilter(profile.id)}
              onUpdate={(f) => updateTabFilter(profile.id, f)}
              onDelete={(id) => deleteTabFilter(profile.id, id)}
              onToggle={(id) => toggleTabFilter(profile.id, id)}
            />

            <FilterRowList<DomainFilter>
              variant="editor"
              filters={domainFilters}
              valueField="domain"
              i18nKey="domainFilters"
              onAdd={() => addDomainFilter(profile.id)}
              onUpdate={(f) => updateDomainFilter(profile.id, f)}
              onDelete={(id) => deleteDomainFilter(profile.id, id)}
              onToggle={(id) => toggleDomainFilter(profile.id, id)}
            />

            <FilterRowList<UrlFilter>
              variant="editor"
              filters={urlFilters}
              valueField="regex"
              i18nKey="urlFilters"
              onAdd={() => addUrlFilter(profile.id)}
              onUpdate={(f) => updateUrlFilter(profile.id, f)}
              onDelete={(id) => deleteUrlFilter(profile.id, id)}
              onToggle={(id) => toggleUrlFilter(profile.id, id)}
            />

            <FilterRowList<ExcludeUrlFilter>
              variant="editor"
              filters={excludeUrlFilters}
              valueField="url"
              i18nKey="excludeUrlFilters"
              onAdd={() => addExcludeUrlFilter(profile.id)}
              onUpdate={(f) => updateExcludeUrlFilter(profile.id, f)}
              onDelete={(id) => deleteExcludeUrlFilter(profile.id, id)}
              onToggle={(id) => toggleExcludeUrlFilter(profile.id, id)}
            />

            <MethodFilterPicker
              variant="editor"
              filters={methodFilters}
              onChange={(methods) => setMethodFilters(profile.id, methods)}
            />
          </div>
        ) : (
          <div className="he-workbench-empty-inline">
            {t("scope.emptyHint")}
          </div>
        )}
      </section>

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
          <ModificationMenu
            align="end"
            trigger={
              <Button size="sm">
                <Plus aria-hidden="true" />
                {t("popup.addMod")}
              </Button>
            }
            onAddRequestHeader={() => handleAddHeader("request")}
            onAddResponseHeader={() => handleAddHeader("response")}
            onAddRequestCookie={() =>
              addRule(profile.id, "cookie-request-append")
            }
            onAddResponseCookie={() =>
              addRule(profile.id, "cookie-response-append")
            }
            onAddRedirect={() => addRule(profile.id, "redirect")}
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
            <ModificationMenu
              align="center"
              trigger={
                <Button size="sm">
                  <Plus aria-hidden="true" />
                  {t("popup.addMod")}
                </Button>
              }
              onAddRequestHeader={() => handleAddHeader("request")}
              onAddResponseHeader={() => handleAddHeader("response")}
              onAddRequestCookie={() =>
                addRule(profile.id, "cookie-request-append")
              }
              onAddResponseCookie={() =>
                addRule(profile.id, "cookie-response-append")
              }
              onAddRedirect={() => addRule(profile.id, "redirect")}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <HeaderRuleList
              variant="editor"
              kind="header"
              target="request"
              rules={requestRules}
              onAdd={() => handleAddHeader("request")}
              onUpdate={handleUpdate}
              onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
              onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
              onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
            />

            <HeaderRuleList
              variant="editor"
              kind="header"
              target="response"
              rules={responseRules}
              onAdd={() => handleAddHeader("response")}
              onUpdate={handleUpdate}
              onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
              onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
              onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
            />

            <HeaderRuleList
              variant="editor"
              kind="cookie-request-append"
              rules={cookieRequestRules}
              onAdd={() => addRule(profile.id, "cookie-request-append")}
              onUpdate={handleUpdate}
              onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
              onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
              onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
            />

            <HeaderRuleList
              variant="editor"
              kind="cookie-response-append"
              rules={cookieResponseRules}
              onAdd={() => addRule(profile.id, "cookie-response-append")}
              onUpdate={handleUpdate}
              onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
              onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
              onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
            />

            <HeaderRuleList
              variant="editor"
              kind="redirect"
              rules={redirectRules}
              onAdd={() => addRule(profile.id, "redirect")}
              onUpdate={handleUpdate}
              onDelete={(ruleId) => deleteRule(profile.id, ruleId)}
              onToggle={(ruleId) => toggleRule(profile.id, ruleId)}
              onReorder={(ruleIds) => reorderRules(profile.id, ruleIds)}
            />
          </div>
        )}
      </section>
    </div>
  );
}
