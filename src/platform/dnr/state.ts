import { storageLocal } from "@/src/platform/browser/api";
import {
  isDnrErrorCode,
  type DnrErrorCode,
  type DnrErrorParams,
} from "./errors";

const KEY_REGISTRATIONS = "dnr:registrations:v1";
const KEY_ERRORS = "dnr:errors:v1";

export type DnrRuleScope = "dynamic" | "session";
export type DnrErrorStage = "compile" | "register";

export interface DnrRuleRegistration {
  ruleId: number;
  scope: DnrRuleScope;
}

export interface DnrProfileRegistration {
  complete: boolean;
  fingerprint: string;
  rules: Record<string, DnrRuleRegistration[]>;
}

export type DnrRegistrationRecord = Record<string, DnrProfileRegistration>;

export interface DnrRuleError {
  sourceRuleId: string;
  stage: DnrErrorStage;
  code: DnrErrorCode;
  params?: DnrErrorParams;
  detail?: string;
}

export type DnrErrorRecord = Record<string, DnrRuleError[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseScope(value: unknown): DnrRuleScope | null {
  return value === "dynamic" || value === "session" ? value : null;
}

function parseRegistrationRecord(value: unknown): DnrRegistrationRecord {
  if (!isRecord(value)) return {};

  const record: DnrRegistrationRecord = {};
  for (const [profileId, rawProfile] of Object.entries(value)) {
    if (!isRecord(rawProfile) || typeof rawProfile.fingerprint !== "string") {
      continue;
    }

    const rules: Record<string, DnrRuleRegistration[]> = {};
    if (isRecord(rawProfile.rules)) {
      for (const [sourceRuleId, rawRegistrations] of Object.entries(
        rawProfile.rules,
      )) {
        if (!Array.isArray(rawRegistrations)) continue;
        const registrations = rawRegistrations.flatMap((rawRegistration) => {
          if (!isRecord(rawRegistration)) return [];
          const scope = parseScope(rawRegistration.scope);
          const ruleId = rawRegistration.ruleId;
          return scope && Number.isInteger(ruleId) && Number(ruleId) > 0
            ? [{ scope, ruleId: Number(ruleId) }]
            : [];
        });
        if (registrations.length) rules[sourceRuleId] = registrations;
      }
    }

    record[profileId] = {
      complete: rawProfile.complete === true,
      fingerprint: rawProfile.fingerprint,
      rules,
    };
  }
  return record;
}

function parseErrorRecord(value: unknown): DnrErrorRecord {
  if (!isRecord(value)) return {};

  const record: DnrErrorRecord = {};
  for (const [profileId, rawErrors] of Object.entries(value)) {
    if (!Array.isArray(rawErrors)) continue;
    const errors: DnrRuleError[] = rawErrors.flatMap((rawError) => {
      if (!isRecord(rawError)) return [];
      const { sourceRuleId, stage } = rawError;
      if (
        typeof sourceRuleId !== "string" ||
        (stage !== "compile" && stage !== "register")
      ) {
        return [];
      }
      if (isDnrErrorCode(rawError.code)) {
        const params = isRecord(rawError.params)
          ? Object.entries(rawError.params).reduce<DnrErrorParams>(
              (result, [key, param]) => {
                if (typeof param === "string" || typeof param === "number") {
                  result[key] = param;
                }
                return result;
              },
              {},
            )
          : undefined;
        return [
          {
            sourceRuleId,
            stage,
            code: rawError.code,
            ...(params && Object.keys(params).length ? { params } : {}),
            ...(typeof rawError.detail === "string"
              ? { detail: rawError.detail }
              : {}),
          },
        ];
      }
      return typeof rawError.message === "string"
        ? [
            {
              sourceRuleId,
              stage,
              code: "legacy",
              detail: rawError.message,
            },
          ]
        : [];
    });
    if (errors.length) record[profileId] = errors;
  }
  return record;
}

export async function loadDnrRegistrations(): Promise<DnrRegistrationRecord> {
  return parseRegistrationRecord(await storageLocal.get(KEY_REGISTRATIONS));
}

export async function saveDnrRegistrations(
  record: DnrRegistrationRecord,
): Promise<void> {
  await storageLocal.set(KEY_REGISTRATIONS, record);
}

export async function loadDnrErrors(): Promise<DnrErrorRecord> {
  return parseErrorRecord(await storageLocal.get(KEY_ERRORS));
}

export async function saveDnrErrors(record: DnrErrorRecord): Promise<void> {
  await storageLocal.set(KEY_ERRORS, record);
}

export function subscribeDnrErrors(
  handler: (record: DnrErrorRecord) => void,
): () => void {
  return storageLocal.onChanged((changes) => {
    if (KEY_ERRORS in changes) {
      handler(parseErrorRecord(changes[KEY_ERRORS].newValue));
    }
  });
}
