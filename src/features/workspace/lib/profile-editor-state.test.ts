import type { HeaderRule, Profile } from "@/src/domain";
import { describe, expect, it } from "vitest";
import { getProfileEditorState } from "./profile-editor-state";

function createRule(
  id: string,
  overrides: Partial<HeaderRule> = {},
): HeaderRule {
  return {
    id,
    enabled: true,
    kind: "header",
    target: "request",
    action: "set",
    name: "X-Test",
    value: "1",
    condition: {},
    ...overrides,
  };
}

function createProfile(): Profile {
  return {
    id: "profile-1",
    name: "Profile 1",
    color: "#1677ff",
    rules: [
      createRule("request"),
      createRule("response", { target: "response" }),
      createRule("cookie", { kind: "cookie-request-append" }),
      createRule("redirect", { kind: "redirect" }),
    ],
    domainFilters: [{ id: "domain", enabled: true, domain: "example.com" }],
    variables: [{ id: "variable", enabled: true, name: "token", value: "1" }],
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("getProfileEditorState", () => {
  it("groups rules and optional collections for both editors", () => {
    const state = getProfileEditorState(createProfile());

    expect(state.ruleGroups.requestRules.map((rule) => rule.id)).toEqual([
      "request",
    ]);
    expect(state.ruleGroups.responseRules.map((rule) => rule.id)).toEqual([
      "response",
    ]);
    expect(state.ruleGroups.cookieRequestRules.map((rule) => rule.id)).toEqual([
      "cookie",
    ]);
    expect(state.ruleGroups.redirectRules.map((rule) => rule.id)).toEqual([
      "redirect",
    ]);
    expect(state.filterGroups.domainFilters).toHaveLength(1);
    expect(state.filterGroups.tabFilters).toEqual([]);
    expect(state.hasRuleContent).toBe(true);
    expect(state.hasFilterContent).toBe(true);
    expect(state.hasVariableContent).toBe(true);
  });

  it("returns stable empty collections for an empty profile", () => {
    const profile = createProfile();
    profile.rules = [];
    delete profile.domainFilters;
    delete profile.variables;

    const state = getProfileEditorState(profile);

    expect(
      Object.values(state.ruleGroups).every((rules) => !rules.length),
    ).toBe(true);
    expect(
      Object.values(state.filterGroups).every((filters) => !filters.length),
    ).toBe(true);
    expect(state.variables).toEqual([]);
    expect(state.hasRuleContent).toBe(false);
    expect(state.hasFilterContent).toBe(false);
    expect(state.hasVariableContent).toBe(false);
  });
});
