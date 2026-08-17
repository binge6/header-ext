import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@/src/platform/browser/api", () => ({
  storageLocal: {
    get: mocks.get,
    set: mocks.set,
    onChanged: vi.fn(),
  },
}));

import { loadDnrErrors, loadDnrRegistrations } from "./state";

describe("DNR state storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters malformed registration entries", async () => {
    mocks.get.mockResolvedValue({
      "profile-1": {
        complete: true,
        fingerprint: "fingerprint",
        rules: {
          "rule-1": [
            { ruleId: 1, scope: "dynamic" },
            { ruleId: -1, scope: "dynamic" },
            { ruleId: 2, scope: "unknown" },
          ],
        },
      },
      broken: {
        complete: true,
        fingerprint: 1,
        rules: {},
      },
    });

    await expect(loadDnrRegistrations()).resolves.toEqual({
      "profile-1": {
        complete: true,
        fingerprint: "fingerprint",
        rules: {
          "rule-1": [{ ruleId: 1, scope: "dynamic" }],
        },
      },
    });
  });

  it("filters malformed error entries", async () => {
    mocks.get.mockResolvedValue({
      "profile-1": [
        {
          sourceRuleId: "rule-1",
          stage: "register",
          code: "registrationFailed",
          detail: "failed",
        },
        {
          sourceRuleId: "rule-2",
          stage: "unknown",
          code: "legacy",
          detail: "ignored",
        },
      ],
    });

    await expect(loadDnrErrors()).resolves.toEqual({
      "profile-1": [
        {
          sourceRuleId: "rule-1",
          stage: "register",
          code: "registrationFailed",
          detail: "failed",
        },
      ],
    });
  });

  it("keeps legacy message records as language-neutral details", async () => {
    mocks.get.mockResolvedValue({
      "profile-1": [
        {
          sourceRuleId: "rule-1",
          stage: "compile",
          message: "旧版本错误信息",
        },
      ],
    });

    await expect(loadDnrErrors()).resolves.toEqual({
      "profile-1": [
        {
          sourceRuleId: "rule-1",
          stage: "compile",
          code: "legacy",
          detail: "旧版本错误信息",
        },
      ],
    });
  });
});
