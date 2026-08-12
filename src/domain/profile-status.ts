import type {
  AppMeta,
  AppState,
  HeaderRule,
  Profile,
  RuleKind,
} from "./models";

export interface ProfileStats {
  totalRules: number;
  enabledRules: number;
  filters: number;
  enabledFilters: number;
  advancedRules: number;
  hasEnabledRule: boolean;
  hasEnabledFilter: boolean;
  hasGlobalRisk: boolean;
}

export interface ProfileStatus {
  profile: Profile;
  alwaysEnabled: boolean;
  enabled: boolean;
  pausedByGlobal: boolean;
  editing: boolean;
  stats: ProfileStats;
  scopeParts: ScopeParts;
  affectsDomain: boolean;
  conflictKeys: string[];
}

export interface WorkspaceStatus {
  activeProfile: Profile | null;
  enabledProfiles: Profile[];
  statuses: ProfileStatus[];
  enabledRuleCount: number;
  totalRuleCount: number;
  riskyProfiles: ProfileStatus[];
  currentDomainProfiles: ProfileStatus[];
  conflictGroups: Array<{
    key: string;
    profiles: Profile[];
  }>;
}

function trimValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function ruleKind(rule: HeaderRule): RuleKind {
  return rule.kind ?? "header";
}

function hasAdvancedCondition(rule: HeaderRule): boolean {
  const condition = rule.condition ?? {};
  return Boolean(
    trimValue(condition.urlFilter) ||
    condition.useRegex ||
    condition.includedDomains?.length ||
    condition.excludedDomains?.length ||
    condition.resourceTypes?.length ||
    condition.requestMethods?.length,
  );
}

// 规则是否自带行级作用范围（narrowing condition）：urlFilter / 排除域名 /
// 资源类型 / 请求方法 都会把该规则限定到部分请求。典型如 Redirect / URL 重写
// 规则，其 urlFilter 即匹配的源 URL，天然带有作用范围。
// 注意：useRegex 单独存在（无 urlFilter）不收窄范围（编译时按 "*" 匹配全部），
// 故不计入，避免误判为已配置作用范围。
function ruleHasOwnScope(rule: HeaderRule): boolean {
  const condition = rule.condition ?? {};
  return Boolean(
    trimValue(condition.urlFilter) ||
    condition.includedDomains?.length ||
    condition.excludedDomains?.length ||
    condition.resourceTypes?.length ||
    condition.requestMethods?.length,
  );
}

function ruleConflictKey(rule: HeaderRule): string | null {
  if (!rule.enabled) return null;
  const kind = ruleKind(rule);
  if (kind === "redirect") {
    return `redirect:${trimValue(rule.condition?.urlFilter) || "*"}`;
  }
  if (kind === "cookie-request-append") {
    return `request:cookie:${trimValue(rule.name)}`;
  }
  if (kind === "cookie-response-append") {
    return `response:set-cookie:${trimValue(rule.name)}`;
  }
  if (!trimValue(rule.name)) return null;
  return `${rule.target}:${trimValue(rule.name).toLowerCase()}`;
}

export function getEnabledProfileIds(
  meta: AppMeta,
  profiles: Profile[],
): string[] {
  const alwaysEnabledIds = getAlwaysEnabledProfileIds(meta, profiles);
  const activeId =
    meta.activeProfileId &&
    profiles.some((profile) => profile.id === meta.activeProfileId)
      ? meta.activeProfileId
      : null;
  return Array.from(
    new Set(activeId ? [...alwaysEnabledIds, activeId] : alwaysEnabledIds),
  );
}

export function getAlwaysEnabledProfileIds(
  meta: AppMeta,
  profiles: Profile[],
): string[] {
  const validIds = new Set(profiles.map((profile) => profile.id));
  const source = Array.isArray(meta.enabledProfileIds)
    ? meta.enabledProfileIds
    : [];
  return Array.from(new Set(source.filter((id) => validIds.has(id))));
}

export function getProfileStats(profile: Profile): ProfileStats {
  const filterEntries = [
    ...(profile.tabFilters ?? []).map((filter) => ({
      enabled: filter.enabled,
      value: filter.urlFilter,
    })),
    ...(profile.domainFilters ?? []).map((filter) => ({
      enabled: filter.enabled,
      value: filter.domain,
    })),
    ...(profile.urlFilters ?? []).map((filter) => ({
      enabled: filter.enabled,
      value: filter.regex,
    })),
    ...(profile.excludeUrlFilters ?? []).map((filter) => ({
      enabled: filter.enabled,
      value: filter.url,
    })),
    ...(profile.methodFilters ?? []).map((filter) => ({
      enabled: filter.enabled,
      value: filter.method,
    })),
  ];
  const enabledFilters = filterEntries.filter(
    (filter) => filter.enabled && trimValue(filter.value),
  ).length;
  const hasEnabledFilter = enabledFilters > 0;
  const enabledRuleList = profile.rules.filter((rule) => rule.enabled);
  const enabledRules = enabledRuleList.length;

  // 全局作用风险：没有任何 profile 级过滤器时，若存在自身也无行级作用范围的
  // 启用规则，该规则会命中全部请求。反之，纯 Redirect/URL 重写（urlFilter 即源）
  // 或每行都自带行级过滤条件的 profile 不算「未配置作用范围」。
  const hasGlobalRisk =
    !hasEnabledFilter && enabledRuleList.some((rule) => !ruleHasOwnScope(rule));

  return {
    totalRules: profile.rules.length,
    enabledRules,
    filters: filterEntries.length,
    enabledFilters,
    advancedRules: profile.rules.filter(hasAdvancedCondition).length,
    hasEnabledRule: enabledRules > 0,
    hasEnabledFilter,
    hasGlobalRisk,
  };
}

export interface ScopeParts {
  domains: string[];
  methods: string[];
  tabCount: number;
  urlRegexCount: number;
  excludeCount: number;
}

export function getScopeParts(profile: Profile): ScopeParts {
  return {
    domains: (profile.domainFilters ?? [])
      .filter((filter) => filter.enabled && trimValue(filter.domain))
      .map((filter) => filter.domain.trim()),
    methods: (profile.methodFilters ?? [])
      .filter((filter) => filter.enabled && trimValue(filter.method))
      .map((filter) => filter.method.trim().toUpperCase()),
    tabCount: (profile.tabFilters ?? []).filter(
      (filter) => filter.enabled && trimValue(filter.urlFilter),
    ).length,
    urlRegexCount: (profile.urlFilters ?? []).filter(
      (filter) => filter.enabled && trimValue(filter.regex),
    ).length,
    excludeCount: (profile.excludeUrlFilters ?? []).filter(
      (filter) => filter.enabled && trimValue(filter.url),
    ).length,
  };
}

export function profileMayAffectDomain(
  profile: Profile,
  currentDomain: string,
): boolean {
  if (!currentDomain) return false;
  const domain = currentDomain.toLowerCase();
  const domainFilters = (profile.domainFilters ?? []).filter(
    (filter) => filter.enabled && trimValue(filter.domain),
  );
  if (!domainFilters.length) return true;

  return domainFilters.some((filter) => {
    const filterDomain = filter.domain.trim().toLowerCase();
    return domain === filterDomain || domain.endsWith(`.${filterDomain}`);
  });
}

export function buildWorkspaceStatus(
  state: AppState,
  currentDomain = "",
): WorkspaceStatus {
  const enabledIds = getEnabledProfileIds(state.meta, state.profiles);
  const alwaysEnabledIds = getAlwaysEnabledProfileIds(
    state.meta,
    state.profiles,
  );
  const activeProfile =
    state.profiles.find(
      (profile) => profile.id === state.meta.activeProfileId,
    ) ?? null;
  const conflictMap = new Map<string, Set<string>>();
  const statuses: ProfileStatus[] = state.profiles.map((profile) => {
    const stats = getProfileStats(profile);
    const conflictKeys = profile.rules
      .map(ruleConflictKey)
      .filter((key): key is string => Boolean(key));
    conflictKeys.forEach((key) => {
      const current = conflictMap.get(key) ?? new Set<string>();
      current.add(profile.id);
      conflictMap.set(key, current);
    });

    return {
      profile,
      alwaysEnabled: alwaysEnabledIds.includes(profile.id),
      enabled: enabledIds.includes(profile.id),
      pausedByGlobal:
        state.meta.globalPaused && enabledIds.includes(profile.id),
      editing: profile.id === state.meta.activeProfileId,
      stats,
      scopeParts: getScopeParts(profile),
      affectsDomain: profileMayAffectDomain(profile, currentDomain),
      conflictKeys,
    };
  });
  const enabledProfiles = statuses
    .filter((status) => status.enabled)
    .map((status) => status.profile);
  const activeEnabledStatuses = statuses.filter((status) => status.enabled);
  const conflictGroups = Array.from(conflictMap.entries())
    .map(([key, ids]) => ({
      key,
      profiles: Array.from(ids)
        .map((id) => state.profiles.find((profile) => profile.id === id))
        .filter((profile): profile is Profile => Boolean(profile)),
    }))
    .filter((group) => {
      const enabledCount = group.profiles.filter((profile) =>
        enabledIds.includes(profile.id),
      ).length;
      return enabledCount > 1;
    });

  return {
    activeProfile,
    enabledProfiles,
    statuses,
    enabledRuleCount: activeEnabledStatuses.reduce(
      (sum, status) => sum + status.stats.enabledRules,
      0,
    ),
    totalRuleCount: state.profiles.reduce(
      (sum, profile) => sum + profile.rules.length,
      0,
    ),
    riskyProfiles: activeEnabledStatuses.filter(
      (status) => status.stats.hasGlobalRisk,
    ),
    currentDomainProfiles: activeEnabledStatuses.filter(
      (status) => status.affectsDomain && status.stats.hasEnabledRule,
    ),
    conflictGroups,
  };
}
