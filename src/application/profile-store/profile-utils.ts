import { nanoid } from "nanoid";
import type { HeaderRule, Profile } from "@/src/domain";

export function normalizeEnabledProfileIds(
  ids: string[] | undefined,
  profiles: Profile[],
): string[] {
  const validIds = new Set(profiles.map((profile) => profile.id));
  const source = Array.isArray(ids) ? ids : [];
  return Array.from(new Set(source.filter((id) => validIds.has(id))));
}

export function uniqueProfileName(
  base: string,
  profiles: Profile[],
  excludeId?: string,
): string {
  const used = new Set(
    profiles
      .filter((profile) => profile.id !== excludeId)
      .map((profile) => profile.name),
  );
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base} (${suffix})`)) suffix += 1;
  return `${base} (${suffix})`;
}

export function nextDefaultProfileName(profiles: Profile[]): string {
  const used = new Set(profiles.map((profile) => profile.name));
  let suffix = profiles.length + 1;
  while (used.has(`Profile ${suffix}`)) suffix += 1;
  return `Profile ${suffix}`;
}

function cloneItems<T extends { id: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, id: nanoid() }));
}

function cloneRuleCondition(
  condition: HeaderRule["condition"],
): HeaderRule["condition"] {
  return {
    ...condition,
    ...(condition.includedDomains && {
      includedDomains: [...condition.includedDomains],
    }),
    ...(condition.excludedDomains && {
      excludedDomains: [...condition.excludedDomains],
    }),
    ...(condition.resourceTypes && {
      resourceTypes: [...condition.resourceTypes],
    }),
    ...(condition.requestMethods && {
      requestMethods: [...condition.requestMethods],
    }),
  };
}

export function cloneProfile(source: Profile, name: string): Profile {
  const now = Date.now();
  const profile: Profile = {
    ...source,
    id: nanoid(),
    name,
    rules: source.rules.map((rule) => ({
      ...rule,
      id: nanoid(),
      condition: cloneRuleCondition(rule.condition),
    })),
    createdAt: now,
    updatedAt: now,
  };

  if (source.tabFilters) profile.tabFilters = cloneItems(source.tabFilters);
  else delete profile.tabFilters;
  if (source.domainFilters) {
    profile.domainFilters = cloneItems(source.domainFilters);
  } else {
    delete profile.domainFilters;
  }
  if (source.urlFilters) profile.urlFilters = cloneItems(source.urlFilters);
  else delete profile.urlFilters;
  if (source.excludeUrlFilters) {
    profile.excludeUrlFilters = cloneItems(source.excludeUrlFilters);
  } else {
    delete profile.excludeUrlFilters;
  }
  if (source.methodFilters) {
    profile.methodFilters = cloneItems(source.methodFilters);
  } else {
    delete profile.methodFilters;
  }
  if (source.variables) profile.variables = cloneItems(source.variables);
  else delete profile.variables;

  return profile;
}

export function reorderRulesByIds(
  rules: HeaderRule[],
  orderedRuleIds: string[],
): HeaderRule[] {
  if (orderedRuleIds.length < 2) return rules;

  const idSet = new Set(orderedRuleIds);
  if (idSet.size !== orderedRuleIds.length) return rules;

  const ruleById = new Map(rules.map((rule) => [rule.id, rule]));
  const orderedRules: HeaderRule[] = [];
  for (const id of orderedRuleIds) {
    const rule = ruleById.get(id);
    if (!rule) return rules;
    orderedRules.push(rule);
  }

  let cursor = 0;
  return rules.map((rule) =>
    idSet.has(rule.id) ? orderedRules[cursor++] : rule,
  );
}
