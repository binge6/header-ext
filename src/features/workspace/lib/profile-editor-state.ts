import type {
  DomainFilter,
  ExcludeUrlFilter,
  HeaderRule,
  MethodFilter,
  Profile,
  ProfileVariable,
  TabFilter,
  UrlFilter,
} from "@/src/domain";

export interface ProfileRuleGroups {
  requestRules: HeaderRule[];
  responseRules: HeaderRule[];
  cookieRequestRules: HeaderRule[];
  cookieResponseRules: HeaderRule[];
  redirectRules: HeaderRule[];
}

export interface ProfileFilterGroups {
  tabFilters: TabFilter[];
  domainFilters: DomainFilter[];
  urlFilters: UrlFilter[];
  excludeUrlFilters: ExcludeUrlFilter[];
  methodFilters: MethodFilter[];
}

export interface ProfileEditorState {
  ruleGroups: ProfileRuleGroups;
  filterGroups: ProfileFilterGroups;
  variables: ProfileVariable[];
  hasRuleContent: boolean;
  hasFilterContent: boolean;
  hasVariableContent: boolean;
}

function ruleKind(rule: HeaderRule) {
  return rule.kind ?? "header";
}

export function getProfileEditorState(profile: Profile): ProfileEditorState {
  const ruleGroups: ProfileRuleGroups = {
    requestRules: profile.rules.filter(
      (rule) => ruleKind(rule) === "header" && rule.target === "request",
    ),
    responseRules: profile.rules.filter(
      (rule) => ruleKind(rule) === "header" && rule.target === "response",
    ),
    cookieRequestRules: profile.rules.filter(
      (rule) => ruleKind(rule) === "cookie-request-append",
    ),
    cookieResponseRules: profile.rules.filter(
      (rule) => ruleKind(rule) === "cookie-response-append",
    ),
    redirectRules: profile.rules.filter(
      (rule) => ruleKind(rule) === "redirect",
    ),
  };
  const filterGroups: ProfileFilterGroups = {
    tabFilters: profile.tabFilters ?? [],
    domainFilters: profile.domainFilters ?? [],
    urlFilters: profile.urlFilters ?? [],
    excludeUrlFilters: profile.excludeUrlFilters ?? [],
    methodFilters: profile.methodFilters ?? [],
  };
  const variables = profile.variables ?? [];

  return {
    ruleGroups,
    filterGroups,
    variables,
    hasRuleContent: Object.values(ruleGroups).some((rules) => rules.length > 0),
    hasFilterContent: Object.values(filterGroups).some(
      (filters) => filters.length > 0,
    ),
    hasVariableContent: variables.length > 0,
  };
}
