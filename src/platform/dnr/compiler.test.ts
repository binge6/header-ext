import type { HeaderRule, Profile } from "@/src/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { clearIdMap, compileRules } from "./compiler";

function createRule(id: string, name: string): HeaderRule {
  return {
    id,
    enabled: true,
    kind: "header",
    target: "request",
    action: "set",
    name,
    value: "1",
    condition: {},
  };
}

function createProfile(rules: HeaderRule[]): Profile {
  return {
    id: "profile-1",
    name: "Profile 1",
    color: "#1677ff",
    rules,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("compileRules", () => {
  beforeEach(() => {
    clearIdMap();
  });

  it("keeps compiled DNR rules grouped by source rule", () => {
    const rules = [
      createRule("rule-1", "X-First"),
      createRule("rule-2", "X-Second"),
    ];

    const result = compileRules(rules, { profile: createProfile(rules) });

    expect(result.errors).toEqual([]);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      sourceRuleId: "rule-1",
      rules: [expect.objectContaining({ id: 1 })],
    });
    expect(result.entries[1]).toMatchObject({
      sourceRuleId: "rule-2",
      rules: [expect.objectContaining({ id: 2 })],
    });
    expect(result.rules).toEqual([
      ...result.entries[0]!.rules,
      ...result.entries[1]!.rules,
    ]);
  });

  it("maps every tab-filter expansion back to the same source rule", () => {
    const rules = [createRule("rule-1", "X-First")];
    const profile = {
      ...createProfile(rules),
      tabFilters: [
        { id: "tab-1", enabled: true, urlFilter: "*://one.example/*" },
        { id: "tab-2", enabled: true, urlFilter: "*://two.example/*" },
      ],
    };

    const result = compileRules(rules, { profile });

    expect(result.entries).toEqual([
      {
        sourceRuleId: "rule-1",
        rules: [
          expect.objectContaining({
            condition: expect.objectContaining({
              urlFilter: "*://one.example/*",
            }),
          }),
          expect.objectContaining({
            condition: expect.objectContaining({
              urlFilter: "*://two.example/*",
            }),
          }),
        ],
      },
    ]);
  });

  it("compiles without the profile URL filter when its regex is invalid", () => {
    const rules = [createRule("rule-1", "X-First")];
    const profile = {
      ...createProfile(rules),
      urlFilters: [{ id: "url-1", enabled: true, regex: "(" }],
    };

    const result = compileRules(rules, { profile });

    expect(result.errors).toContainEqual({
      ruleId: "__url_filter__:url-1",
      code: "invalidProfileRegex",
    });
    expect(result.rules).toEqual([
      expect.objectContaining({
        condition: expect.objectContaining({ urlFilter: "*" }),
      }),
    ]);
    expect(result.entries).toEqual([
      {
        sourceRuleId: "rule-1",
        rules: [
          expect.objectContaining({
            condition: expect.objectContaining({ urlFilter: "*" }),
          }),
        ],
      },
    ]);
  });

  it("keeps valid profile URL regexes when another URL regex is invalid", () => {
    const rules = [createRule("rule-1", "X-First")];
    const profile = {
      ...createProfile(rules),
      urlFilters: [
        { id: "invalid", enabled: true, regex: "(" },
        { id: "valid", enabled: true, regex: "^https://example\\.com/" },
      ],
    };

    const result = compileRules(rules, { profile });

    expect(result.errors).toContainEqual({
      ruleId: "__url_filter__:invalid",
      code: "invalidProfileRegex",
    });
    expect(result.rules[0]?.condition.regexFilter).toBe(
      "^https://example\\.com/",
    );
  });
});
