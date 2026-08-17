import type { AppState, Profile } from "@/src/domain/models";
import { getEnabledProfileIds } from "@/src/domain/profile-status";
import {
  loadDnrErrors,
  loadDnrRegistrations,
  saveDnrErrors,
  saveDnrRegistrations,
  type DnrErrorRecord,
  type DnrProfileRegistration,
  type DnrRuleError,
  type DnrRuleRegistration,
} from "./state";
import { clearIdMap, compileRules } from "./compiler";
import {
  clearAllRules,
  createUsedRuleIds,
  getRegistrationList,
  loadRuleSets,
  reconcileRegistrations,
  removeRegistrations,
  registerSourceRule,
  releaseRegistrationIds,
  type UsedRuleIds,
} from "./registry";

const COMPILER_VERSION = 1;

function profileFingerprint(
  profile: Profile,
  lockedTabId: number | null,
): string {
  return JSON.stringify({
    compilerVersion: COMPILER_VERSION,
    lockedTabId,
    rules: profile.rules,
    tabFilters: profile.tabFilters ?? [],
    domainFilters: profile.domainFilters ?? [],
    urlFilters: profile.urlFilters ?? [],
    excludeUrlFilters: profile.excludeUrlFilters ?? [],
    methodFilters: profile.methodFilters ?? [],
    variables: profile.variables ?? [],
  });
}

async function registerProfile(
  profile: Profile,
  lockedTabId: number | null,
  usedIds: UsedRuleIds,
): Promise<{
  registration: DnrProfileRegistration;
  errors: DnrRuleError[];
}> {
  clearIdMap();
  const compiled = compileRules(profile.rules, { lockedTabId, profile });
  const errors: DnrRuleError[] = compiled.errors.map((error) => ({
    sourceRuleId: error.ruleId,
    stage: "compile",
    code: error.code,
    params: error.params,
    detail: error.detail,
  }));
  const rules: Record<string, DnrRuleRegistration[]> = {};

  for (const entry of compiled.entries) {
    const result = await registerSourceRule(
      entry.sourceRuleId,
      entry.rules,
      usedIds,
    );
    if (result.registrations.length) {
      rules[entry.sourceRuleId] = result.registrations;
    }
    errors.push(...result.errors);
  }

  return {
    registration: {
      complete: errors.length === 0,
      fingerprint: profileFingerprint(profile, lockedTabId),
      rules,
    },
    errors,
  };
}

let applyQueue: Promise<void> = Promise.resolve();

export async function applyState(state: AppState): Promise<void> {
  const run = applyQueue.then(() => doApply(state, false));
  applyQueue = run.catch(() => {});
  return run;
}

export async function reinitializeRules(state: AppState): Promise<void> {
  const run = applyQueue.then(() => doApply(state, true));
  applyQueue = run.catch(() => {});
  return run;
}

async function doApply(state: AppState, force: boolean): Promise<void> {
  const enabledProfileIds = getEnabledProfileIds(state.meta, state.profiles);
  const desiredProfiles = state.profiles.filter((profile) =>
    enabledProfileIds.includes(profile.id),
  );
  const desiredProfileIds = new Set(
    desiredProfiles.map((profile) => profile.id),
  );

  if (force || state.meta.globalPaused || !desiredProfiles.length) {
    await clearAllRules();
    await Promise.all([saveDnrRegistrations({}), saveDnrErrors({})]);
    if (state.meta.globalPaused || !desiredProfiles.length) return;
  }

  const [existingRuleSets, storedRegistrations, storedErrors] =
    await Promise.all([
      loadRuleSets(),
      loadDnrRegistrations(),
      loadDnrErrors(),
    ]);
  const registrationRecord = await reconcileRegistrations(
    storedRegistrations,
    desiredProfileIds,
    existingRuleSets,
  );
  const errorRecord: DnrErrorRecord = Object.fromEntries(
    Object.entries(storedErrors).filter(([profileId]) =>
      desiredProfileIds.has(profileId),
    ),
  );
  const usedIds = createUsedRuleIds(existingRuleSets);
  await saveDnrRegistrations(registrationRecord);

  for (const profile of desiredProfiles) {
    const fingerprint = profileFingerprint(profile, state.meta.lockedTabId);
    const previousRegistration = registrationRecord[profile.id];
    if (
      previousRegistration?.fingerprint === fingerprint &&
      previousRegistration.complete &&
      !errorRecord[profile.id]?.length
    ) {
      continue;
    }

    const previousRegistrations = getRegistrationList(previousRegistration);
    await removeRegistrations(previousRegistrations);
    releaseRegistrationIds(previousRegistrations, usedIds);
    delete registrationRecord[profile.id];
    delete errorRecord[profile.id];
    await saveDnrRegistrations(registrationRecord);

    const result = await registerProfile(
      profile,
      state.meta.lockedTabId,
      usedIds,
    );
    registrationRecord[profile.id] = result.registration;
    if (result.errors.length) errorRecord[profile.id] = result.errors;
    await saveDnrRegistrations(registrationRecord);
  }

  await saveDnrErrors(errorRecord);
}
