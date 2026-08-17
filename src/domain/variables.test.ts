import type { ProfileVariable } from "./models";
import { describe, expect, it } from "vitest";
import { getOverriddenVariableIds } from "./variables";

function variable(id: string, name: string, enabled = true): ProfileVariable {
  return { id, name, value: id, enabled };
}

describe("getOverriddenVariableIds", () => {
  it("marks earlier enabled variables with the same trimmed name", () => {
    const result = getOverriddenVariableIds([
      variable("first", " token "),
      variable("second", "token"),
      variable("third", "token"),
    ]);

    expect(result).toEqual(new Set(["first", "second"]));
  });

  it("ignores disabled, empty and case-different variables", () => {
    const result = getOverriddenVariableIds([
      variable("first", "token"),
      variable("disabled", "token", false),
      variable("empty", "   "),
      variable("case", "Token"),
    ]);

    expect(result).toEqual(new Set());
  });
});
