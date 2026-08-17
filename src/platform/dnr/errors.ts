export const DNR_ERROR_CODES = [
  "missingVariables",
  "emptyRuleDraft",
  "headerNameRequired",
  "headerValueRequired",
  "headerFieldsRequired",
  "redirectDestinationRequired",
  "invalidRuleRegex",
  "redirectRegexConditionRequired",
  "invalidProfileRegex",
  "profileRegexConflict",
  "registrationFailed",
  "legacy",
] as const;

export type DnrErrorCode = (typeof DNR_ERROR_CODES)[number];
export type DnrErrorParams = Record<string, string | number>;

export interface DnrErrorData {
  code: DnrErrorCode;
  params?: DnrErrorParams;
  detail?: string;
}

export function isDnrErrorCode(value: unknown): value is DnrErrorCode {
  return (
    typeof value === "string" &&
    (DNR_ERROR_CODES as readonly string[]).includes(value)
  );
}
