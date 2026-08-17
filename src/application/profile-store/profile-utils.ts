import { nanoid } from "nanoid";
import { uniq } from "es-toolkit/array";
import { cloneDeep } from "es-toolkit/object";
import type { HeaderRule, Profile } from "@/src/domain";

export function normalizeEnabledProfileIds(
  ids: string[] | undefined,
  profiles: Profile[],
): string[] {
  const validIds = new Set(profiles.map((profile) => profile.id));
  const source = Array.isArray(ids) ? ids : [];
  return uniq(source.filter((id) => validIds.has(id)));
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

function regenerateItemIds(items: Array<{ id: string }> | undefined): void {
  for (const item of items ?? []) item.id = nanoid();
}

export function cloneProfile(source: Profile, name: string): Profile {
  const now = Date.now();
  const profile = cloneDeep(source);
  profile.id = nanoid();
  profile.name = name;
  profile.createdAt = now;
  profile.updatedAt = now;

  regenerateItemIds(profile.rules);
  regenerateItemIds(profile.tabFilters);
  regenerateItemIds(profile.domainFilters);
  regenerateItemIds(profile.urlFilters);
  regenerateItemIds(profile.excludeUrlFilters);
  regenerateItemIds(profile.methodFilters);
  regenerateItemIds(profile.variables);

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
  return rules.map((rule) => {
    if (!idSet.has(rule.id)) return rule;
    const orderedRule = orderedRules[cursor++];
    return orderedRule ?? rule;
  });
}
