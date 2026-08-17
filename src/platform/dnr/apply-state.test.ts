import type { AppState, Profile } from "@/src/domain";
import type { DnrRule } from "@/src/platform/browser/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyState } from "./apply-state";

const mocks = vi.hoisted(() => ({
  compileRules: vi.fn(),
  getDynamicRules: vi.fn(),
  getSessionRules: vi.fn(),
  updateDynamicRules: vi.fn(),
  updateSessionRules: vi.fn(),
  storageGet: vi.fn(),
  storageSet: vi.fn(),
}));

vi.mock("@/src/platform/browser/api", () => ({
  dnr: {
    getDynamicRules: mocks.getDynamicRules,
    getSessionRules: mocks.getSessionRules,
    updateDynamicRules: mocks.updateDynamicRules,
    updateSessionRules: mocks.updateSessionRules,
  },
  storageLocal: {
    get: mocks.storageGet,
    set: mocks.storageSet,
  },
}));

vi.mock("./compiler", () => ({
  clearIdMap: vi.fn(),
  compileRules: mocks.compileRules,
}));

function createProfile(): Profile {
  return {
    id: "profile-1",
    name: "Profile 1",
    color: "#1677ff",
    rules: [
      {
        id: "valid-rule",
        enabled: true,
        kind: "header",
        target: "request",
        action: "set",
        name: "X-Valid",
        value: "1",
        condition: {},
      },
      {
        id: "invalid-rule",
        enabled: true,
        kind: "header",
        target: "request",
        action: "append",
        name: "X-Invalid",
        value: "2",
        condition: {},
      },
    ],
    createdAt: 1,
    updatedAt: 1,
  };
}

function createState(): AppState {
  return {
    profiles: [createProfile()],
    meta: {
      activeProfileId: "profile-1",
      enabledProfileIds: [],
      globalPaused: false,
      lockedTabId: null,
      language: null,
    },
  };
}

function createRule(id: number, header: string): DnrRule {
  return {
    id,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [{ header, operation: "set", value: "1" }],
    },
    condition: { urlFilter: "*" },
  };
}

function getStoredValue(key: string): unknown {
  return mocks.storageSet.mock.calls.findLast(
    ([storedKey]) => storedKey === key,
  )?.[1];
}

describe("applyState reliability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDynamicRules.mockResolvedValue([]);
    mocks.getSessionRules.mockResolvedValue([]);
    mocks.updateSessionRules.mockResolvedValue(undefined);
    mocks.storageGet.mockResolvedValue(undefined);
    mocks.storageSet.mockResolvedValue(undefined);
  });

  it("[defect-probing] keeps valid source rules registered when another source rule is rejected", async () => {
    const validRule = createRule(1, "X-Valid");
    const invalidRule = createRule(2, "X-Invalid");
    mocks.compileRules.mockReturnValue({
      rules: [validRule, invalidRule],
      entries: [
        { sourceRuleId: "valid-rule", rules: [validRule] },
        { sourceRuleId: "invalid-rule", rules: [invalidRule] },
      ],
      errors: [],
    });
    mocks.updateDynamicRules.mockImplementation(
      async ({ addRules }: { addRules?: DnrRule[] }) => {
        if (
          addRules?.some(
            (rule) =>
              rule.action.type === "modifyHeaders" &&
              rule.action.requestHeaders?.[0]?.header === "X-Invalid",
          )
        ) {
          throw new Error("invalid header operation");
        }
      },
    );

    await expect(applyState(createState())).resolves.toBeUndefined();

    expect(mocks.updateDynamicRules).toHaveBeenCalledWith(
      expect.objectContaining({
        addRules: [
          expect.objectContaining({
            action: expect.objectContaining({
              requestHeaders: [expect.objectContaining({ header: "X-Valid" })],
            }),
          }),
        ],
      }),
    );
  });

  it("[defect-probing] persists compile errors by profile and source rule", async () => {
    mocks.compileRules.mockReturnValue({
      rules: [],
      entries: [],
      errors: [{ ruleId: "invalid-rule", code: "invalidRuleRegex" }],
    });
    mocks.updateDynamicRules.mockResolvedValue(undefined);

    await applyState(createState());

    expect(mocks.storageSet).toHaveBeenCalledWith(
      "dnr:errors:v1",
      expect.objectContaining({
        "profile-1": [
          expect.objectContaining({
            sourceRuleId: "invalid-rule",
            stage: "compile",
            code: "invalidRuleRegex",
          }),
        ],
      }),
    );
  });

  it("does not recompile or replace unchanged registered profiles", async () => {
    const state = createState();
    const rule = createRule(7, "X-Valid");
    const fingerprint = JSON.stringify({
      compilerVersion: 1,
      lockedTabId: null,
      rules: state.profiles[0]?.rules,
      tabFilters: [],
      domainFilters: [],
      urlFilters: [],
      excludeUrlFilters: [],
      methodFilters: [],
      variables: [],
    });
    mocks.getDynamicRules.mockResolvedValue([rule]);
    mocks.storageGet.mockImplementation(async (key: string) => {
      if (key === "dnr:registrations:v1") {
        return {
          "profile-1": {
            complete: true,
            fingerprint,
            rules: {
              "valid-rule": [{ ruleId: 7, scope: "dynamic" }],
            },
          },
        };
      }
      if (key === "dnr:errors:v1") return {};
      return undefined;
    });

    await applyState(state);

    expect(mocks.compileRules).not.toHaveBeenCalled();
    expect(mocks.updateDynamicRules).not.toHaveBeenCalled();
  });

  it("rebuilds a profile when a persisted registration no longer exists", async () => {
    const rule = createRule(1, "X-Valid");
    mocks.compileRules.mockReturnValue({
      rules: [rule],
      entries: [{ sourceRuleId: "valid-rule", rules: [rule] }],
      errors: [],
    });
    mocks.getDynamicRules.mockResolvedValue([createRule(99, "X-Orphan")]);
    mocks.storageGet.mockImplementation(async (key: string) => {
      if (key === "dnr:registrations:v1") {
        return {
          "profile-1": {
            complete: true,
            fingerprint: "stale",
            rules: {
              "valid-rule": [{ ruleId: 7, scope: "dynamic" }],
            },
          },
        };
      }
      if (key === "dnr:errors:v1") return {};
      return undefined;
    });
    mocks.updateDynamicRules.mockResolvedValue(undefined);

    await applyState(createState());

    expect(mocks.updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [99],
    });
    expect(mocks.updateDynamicRules).toHaveBeenCalledWith({
      addRules: [expect.objectContaining({ id: 1 })],
    });
    expect(getStoredValue("dnr:registrations:v1")).toEqual({
      "profile-1": {
        complete: true,
        fingerprint: expect.any(String),
        rules: {
          "valid-rule": [{ ruleId: 1, scope: "dynamic" }],
        },
      },
    });
  });

  it("persists reconciliation after removing registrations for disabled profiles", async () => {
    const state = createState();
    state.meta.activeProfileId = null;
    state.meta.enabledProfileIds = [];
    mocks.getDynamicRules.mockResolvedValue([createRule(7, "X-Old")]);
    mocks.storageGet.mockImplementation(async (key: string) => {
      if (key === "dnr:registrations:v1") {
        return {
          "profile-1": {
            complete: true,
            fingerprint: "old",
            rules: {
              "valid-rule": [{ ruleId: 7, scope: "dynamic" }],
            },
          },
        };
      }
      if (key === "dnr:errors:v1") return {};
      return undefined;
    });

    await applyState(state);

    expect(mocks.updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [7],
    });
    expect(getStoredValue("dnr:registrations:v1")).toEqual({});
  });
});
