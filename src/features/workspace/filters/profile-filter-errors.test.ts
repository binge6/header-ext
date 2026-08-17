import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import enUS from "@/src/application/i18n/locales/en-US.json";
import zhCN from "@/src/application/i18n/locales/zh-CN.json";
import { getProfileFilterErrorState } from "./profile-filter-errors";

beforeAll(async () => {
  await i18next.init({
    fallbackLng: "en-US",
    resources: {
      "en-US": { translation: enUS },
      "zh-CN": { translation: zhCN },
    },
  });
});

describe("getProfileFilterErrorState", () => {
  it("maps URL filter errors to the exact condition row and card alert", async () => {
    await i18next.changeLanguage("zh-CN");
    const result = getProfileFilterErrorState(
      [
        {
          sourceRuleId: "__url_filter__:filter-1",
          stage: "compile",
          code: "invalidProfileRegex",
        },
      ],
      "__url_filter__",
      i18next.t,
      [{ id: "filter-1", enabled: true, regex: "(" }],
    );

    expect(result.errorMessages).toEqual({
      "filter-1":
        "Profile URL 正则过滤无效，该过滤条件将被忽略；规则会按其他条件生效，没有其他条件时将全局生效",
    });
    expect(result.alertMessages).toEqual([
      "Profile URL 正则过滤无效，该过滤条件将被忽略；规则会按其他条件生效，没有其他条件时将全局生效",
    ]);
  });

  it("keeps row errors but hides the card alert when any enabled URL regex is valid", async () => {
    await i18next.changeLanguage("zh-CN");
    const result = getProfileFilterErrorState(
      [
        {
          sourceRuleId: "__url_filter__:invalid",
          stage: "compile",
          code: "invalidProfileRegex",
        },
      ],
      "__url_filter__",
      i18next.t,
      [
        { id: "invalid", enabled: true, regex: "(" },
        { id: "valid", enabled: true, regex: "^https://" },
      ],
    );

    expect(result.errorMessages.invalid).toContain("正则过滤无效");
    expect(result.alertMessages).toEqual([]);
  });

  it("ignores disabled URL filters when deciding whether all active filters are invalid", async () => {
    await i18next.changeLanguage("zh-CN");
    const result = getProfileFilterErrorState(
      [
        {
          sourceRuleId: "__url_filter__:invalid",
          stage: "compile",
          code: "invalidProfileRegex",
        },
      ],
      "__url_filter__",
      i18next.t,
      [
        { id: "invalid", enabled: true, regex: "(" },
        { id: "disabled-valid", enabled: false, regex: "^https://" },
      ],
    );

    expect(result.alertMessages).toHaveLength(1);
  });

  it("ignores errors owned by another filter card", () => {
    const result = getProfileFilterErrorState(
      [
        {
          sourceRuleId: "__domain_filter__:domain-1",
          stage: "compile",
          code: "missingVariables",
          params: { names: "host" },
        },
      ],
      "__url_filter__",
      i18next.t,
    );

    expect(result).toEqual({ errorMessages: {}, alertMessages: [] });
  });
});
