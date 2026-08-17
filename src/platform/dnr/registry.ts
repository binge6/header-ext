import { dnr, type DnrRule } from "@/src/platform/browser/api";
import type {
  DnrProfileRegistration,
  DnrRegistrationRecord,
  DnrRuleError,
  DnrRuleRegistration,
  DnrRuleScope,
} from "./state";

export interface RuleSets {
  dynamic: DnrRule[];
  session: DnrRule[];
}

export interface UsedRuleIds {
  dynamic: Set<number>;
  session: Set<number>;
}

function getRuleScope(rule: DnrRule): DnrRuleScope {
  return rule.condition.tabIds?.length || rule.condition.excludedTabIds?.length
    ? "session"
    : "dynamic";
}

function partitionRules(rules: DnrRule[]): RuleSets {
  const result: RuleSets = { dynamic: [], session: [] };
  for (const rule of rules) result[getRuleScope(rule)].push(rule);
  return result;
}

function allocateRuleId(usedIds: Set<number>): number {
  let ruleId = 1;
  while (usedIds.has(ruleId)) ruleId++;
  usedIds.add(ruleId);
  return ruleId;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function updateScopedRules(
  scope: DnrRuleScope,
  options: { removeRuleIds?: number[]; addRules?: DnrRule[] },
): Promise<void> {
  if (scope === "dynamic") await dnr.updateDynamicRules(options);
  else await dnr.updateSessionRules(options);
}

export function getRegistrationList(
  profileRegistration: DnrProfileRegistration | undefined,
): DnrRuleRegistration[] {
  return Object.values(profileRegistration?.rules ?? {}).flat();
}

export function createUsedRuleIds(ruleSets: RuleSets): UsedRuleIds {
  return {
    dynamic: new Set(ruleSets.dynamic.map((rule) => rule.id)),
    session: new Set(ruleSets.session.map((rule) => rule.id)),
  };
}

export function releaseRegistrationIds(
  registrations: DnrRuleRegistration[],
  usedIds: UsedRuleIds,
): void {
  registrations.forEach(({ ruleId, scope }) => usedIds[scope].delete(ruleId));
}

export async function removeRegistrations(
  registrations: DnrRuleRegistration[],
): Promise<void> {
  const dynamic = registrations
    .filter((registration) => registration.scope === "dynamic")
    .map((registration) => registration.ruleId);
  const session = registrations
    .filter((registration) => registration.scope === "session")
    .map((registration) => registration.ruleId);

  await Promise.all([
    dynamic.length
      ? dnr.updateDynamicRules({ removeRuleIds: dynamic })
      : Promise.resolve(),
    session.length
      ? dnr.updateSessionRules({ removeRuleIds: session })
      : Promise.resolve(),
  ]);
}

export async function clearAllRules(): Promise<void> {
  const [existingDynamic, existingSession] = await Promise.all([
    dnr.getDynamicRules(),
    dnr.getSessionRules(),
  ]);
  await Promise.all([
    existingDynamic.length
      ? dnr.updateDynamicRules({
          removeRuleIds: existingDynamic.map((rule) => rule.id),
        })
      : Promise.resolve(),
    existingSession.length
      ? dnr.updateSessionRules({
          removeRuleIds: existingSession.map((rule) => rule.id),
        })
      : Promise.resolve(),
  ]);
}

export async function loadRuleSets(): Promise<RuleSets> {
  const [dynamic, session] = await Promise.all([
    dnr.getDynamicRules(),
    dnr.getSessionRules(),
  ]);
  return { dynamic, session };
}

export async function reconcileRegistrations(
  registrationRecord: DnrRegistrationRecord,
  desiredProfileIds: ReadonlySet<string>,
  ruleSets: RuleSets,
): Promise<DnrRegistrationRecord> {
  const existingRuleIds = {
    dynamic: new Set(ruleSets.dynamic.map((rule) => rule.id)),
    session: new Set(ruleSets.session.map((rule) => rule.id)),
  };
  const referencedRuleIds: UsedRuleIds = {
    dynamic: new Set(),
    session: new Set(),
  };
  const nextRecord: DnrRegistrationRecord = {};

  for (const [profileId, profileRegistration] of Object.entries(
    registrationRecord,
  )) {
    if (!desiredProfileIds.has(profileId)) continue;

    const rules: Record<string, DnrRuleRegistration[]> = {};
    let registrationWasPruned = false;
    for (const [sourceRuleId, registrations] of Object.entries(
      profileRegistration.rules,
    )) {
      const validRegistrations = registrations.filter(({ ruleId, scope }) =>
        existingRuleIds[scope].has(ruleId),
      );
      if (validRegistrations.length !== registrations.length) {
        registrationWasPruned = true;
      }
      if (!validRegistrations.length) continue;
      rules[sourceRuleId] = validRegistrations;
      validRegistrations.forEach(({ ruleId, scope }) =>
        referencedRuleIds[scope].add(ruleId),
      );
    }
    nextRecord[profileId] = {
      complete: profileRegistration.complete && !registrationWasPruned,
      fingerprint: profileRegistration.fingerprint,
      rules,
    };
  }

  const orphanedDynamicIds = ruleSets.dynamic
    .map((rule) => rule.id)
    .filter((ruleId) => !referencedRuleIds.dynamic.has(ruleId));
  const orphanedSessionIds = ruleSets.session
    .map((rule) => rule.id)
    .filter((ruleId) => !referencedRuleIds.session.has(ruleId));
  await Promise.all([
    orphanedDynamicIds.length
      ? dnr.updateDynamicRules({ removeRuleIds: orphanedDynamicIds })
      : Promise.resolve(),
    orphanedSessionIds.length
      ? dnr.updateSessionRules({ removeRuleIds: orphanedSessionIds })
      : Promise.resolve(),
  ]);

  return nextRecord;
}

export async function registerSourceRule(
  sourceRuleId: string,
  rules: DnrRule[],
  usedIds: UsedRuleIds,
): Promise<{
  registrations: DnrRuleRegistration[];
  errors: DnrRuleError[];
}> {
  const registrations: DnrRuleRegistration[] = [];
  const errors: DnrRuleError[] = [];
  const ruleSets = partitionRules(rules);

  for (const scope of ["dynamic", "session"] as const) {
    if (!ruleSets[scope].length) continue;
    const scopedRules = ruleSets[scope].map((rule) => ({
      ...rule,
      id: allocateRuleId(usedIds[scope]),
    }));
    try {
      await updateScopedRules(scope, { addRules: scopedRules });
      registrations.push(
        ...scopedRules.map((rule) => ({ ruleId: rule.id, scope })),
      );
    } catch (error) {
      scopedRules.forEach((rule) => usedIds[scope].delete(rule.id));
      errors.push({
        sourceRuleId,
        stage: "register",
        code: "registrationFailed",
        detail: formatError(error),
      });
    }
  }

  return { registrations, errors };
}
