import type { ProfileActions, StoreGet, StoreSet } from "../types";
import { createFilterActions } from "./filters";
import { createMetaActions } from "./meta";
import { createProfileActions } from "./profiles";
import { createRuleActions } from "./rules";
import { createSyncActions } from "./sync";
import { createVariableActions } from "./variables";

export function createProfileStoreActions(
  set: StoreSet,
  get: StoreGet,
): ProfileActions {
  return {
    ...createSyncActions(set, get),
    ...createProfileActions(set, get),
    ...createRuleActions(set, get),
    ...createFilterActions(set, get),
    ...createVariableActions(set, get),
    ...createMetaActions(set, get),
  };
}
