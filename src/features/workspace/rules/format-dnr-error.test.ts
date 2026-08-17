import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import enUS from "@/src/application/i18n/locales/en-US.json";
import zhCN from "@/src/application/i18n/locales/zh-CN.json";
import { formatDnrError, shouldDisplayDnrError } from "./format-dnr-error";

beforeAll(async () => {
  await i18next.init({
    fallbackLng: "en-US",
    resources: {
      "en-US": { translation: enUS },
      "zh-CN": { translation: zhCN },
    },
  });
});

describe("formatDnrError", () => {
  it("formats compile errors in English", async () => {
    await i18next.changeLanguage("en-US");

    expect(
      formatDnrError(
        {
          sourceRuleId: "rule-1",
          stage: "compile",
          code: "missingVariables",
          params: { names: "token, host" },
        },
        i18next.t,
      ),
    ).toBe("Undefined variables: token, host");
  });

  it("formats compile errors in Chinese", async () => {
    await i18next.changeLanguage("zh-CN");

    expect(
      formatDnrError(
        {
          sourceRuleId: "rule-1",
          stage: "compile",
          code: "invalidRuleRegex",
        },
        i18next.t,
      ),
    ).toBe("规则正则表达式无效");
  });

  it("keeps browser registration details after a localized prefix", async () => {
    await i18next.changeLanguage("en-US");

    expect(
      formatDnrError(
        {
          sourceRuleId: "rule-1",
          stage: "register",
          code: "registrationFailed",
          detail: "Rule with id 1 is invalid",
        },
        i18next.t,
      ),
    ).toBe("The browser rejected this rule: Rule with id 1 is invalid");
  });

  it("hides empty rule drafts while keeping partial input errors visible", () => {
    const emptyRule = {
      id: "rule-1",
      enabled: true,
      kind: "header" as const,
      target: "request" as const,
      action: "set" as const,
      name: "",
      value: "",
      condition: {},
    };

    expect(
      shouldDisplayDnrError({
        sourceRuleId: "rule-1",
        stage: "compile",
        code: "emptyRuleDraft",
      }),
    ).toBe(false);
    expect(
      shouldDisplayDnrError(
        {
          sourceRuleId: "rule-1",
          stage: "compile",
          code: "headerFieldsRequired",
        },
        emptyRule,
      ),
    ).toBe(false);
    expect(
      shouldDisplayDnrError({
        sourceRuleId: "rule-1",
        stage: "compile",
        code: "headerNameRequired",
      }),
    ).toBe(true);
  });
});
