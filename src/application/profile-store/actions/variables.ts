import { createVariable } from "../factories";
import {
  appendProfileItem,
  commitProfiles,
  deleteProfileItem,
  replaceProfileItem,
  toggleProfileItem,
} from "../persistence";
import type { ProfileActions, StoreGet, StoreSet } from "../types";

type VariableActionKeys =
  | "addVariable"
  | "updateVariable"
  | "deleteVariable"
  | "toggleVariable";

export function createVariableActions(
  set: StoreSet,
  get: StoreGet,
): Pick<ProfileActions, VariableActionKeys> {
  return {
    addVariable: (profileId, name = "", value = "") => {
      const variable = createVariable(name, value);
      const profiles = appendProfileItem(
        get().profiles,
        profileId,
        "variables",
        variable,
      );
      commitProfiles(set, get, profiles);
      return variable.id;
    },

    updateVariable: (profileId, variable) => {
      commitProfiles(
        set,
        get,
        replaceProfileItem(get().profiles, profileId, "variables", variable),
      );
    },

    deleteVariable: (profileId, variableId) => {
      commitProfiles(
        set,
        get,
        deleteProfileItem(get().profiles, profileId, "variables", variableId),
      );
    },

    toggleVariable: (profileId, variableId) => {
      commitProfiles(
        set,
        get,
        toggleProfileItem(get().profiles, profileId, "variables", variableId),
      );
    },
  };
}
