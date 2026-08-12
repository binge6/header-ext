import { createRule } from "../factories";
import { commitProfiles, updateProfile } from "../persistence";
import { reorderRulesByIds } from "../profile-utils";
import type { ProfileActions, StoreGet, StoreSet } from "../types";

type RuleActionKeys =
  | "addRule"
  | "updateRule"
  | "deleteRule"
  | "toggleRule"
  | "reorderRules"
  | "applyTemplate";

export function createRuleActions(
  set: StoreSet,
  get: StoreGet,
): Pick<ProfileActions, RuleActionKeys> {
  return {
    addRule: (profileId, kind = "header", target) => {
      const rule = createRule(kind, target);
      const profiles = updateProfile(get().profiles, profileId, (profile) => ({
        ...profile,
        rules: [...profile.rules, rule],
      }));
      commitProfiles(set, get, profiles);
      return rule.id;
    },

    updateRule: (profileId, rule) => {
      const profiles = updateProfile(get().profiles, profileId, (profile) => ({
        ...profile,
        rules: profile.rules.map((current) =>
          current.id === rule.id ? rule : current,
        ),
      }));
      commitProfiles(set, get, profiles);
    },

    deleteRule: (profileId, ruleId) => {
      const profiles = updateProfile(get().profiles, profileId, (profile) => ({
        ...profile,
        rules: profile.rules.filter((rule) => rule.id !== ruleId),
      }));
      commitProfiles(set, get, profiles);
    },

    toggleRule: (profileId, ruleId) => {
      const profiles = updateProfile(get().profiles, profileId, (profile) => ({
        ...profile,
        rules: profile.rules.map((rule) =>
          rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
        ),
      }));
      commitProfiles(set, get, profiles);
    },

    reorderRules: (profileId, orderedRuleIds) => {
      let changed = false;
      const profiles = get().profiles.map((profile) => {
        if (profile.id !== profileId) return profile;
        const rules = reorderRulesByIds(profile.rules, orderedRuleIds);
        if (rules === profile.rules) return profile;
        changed = true;
        return { ...profile, rules, updatedAt: Date.now() };
      });
      if (changed) commitProfiles(set, get, profiles);
    },

    applyTemplate: (profileId, templateRules) => {
      if (!templateRules.length) return;
      const profiles = updateProfile(get().profiles, profileId, (profile) => ({
        ...profile,
        rules: [...profile.rules, ...templateRules],
      }));
      commitProfiles(set, get, profiles);
    },
  };
}
