import { nanoid } from "nanoid";
import type { MethodFilter } from "@/src/domain";
import { createDomainFilter, createTabFilter } from "../factories";
import {
  appendProfileItem,
  commitProfiles,
  deleteProfileItem,
  replaceProfileItem,
  toggleProfileItem,
  updateProfile,
} from "../persistence";
import type { ProfileActions, StoreGet, StoreSet } from "../types";

type FilterActionKeys =
  | "addTabFilter"
  | "updateTabFilter"
  | "deleteTabFilter"
  | "toggleTabFilter"
  | "addDomainFilter"
  | "updateDomainFilter"
  | "deleteDomainFilter"
  | "toggleDomainFilter"
  | "addUrlFilter"
  | "updateUrlFilter"
  | "deleteUrlFilter"
  | "toggleUrlFilter"
  | "addExcludeUrlFilter"
  | "updateExcludeUrlFilter"
  | "deleteExcludeUrlFilter"
  | "toggleExcludeUrlFilter"
  | "addMethodFilter"
  | "updateMethodFilter"
  | "deleteMethodFilter"
  | "toggleMethodFilter"
  | "setMethodFilters";

export function createFilterActions(
  set: StoreSet,
  get: StoreGet,
): Pick<ProfileActions, FilterActionKeys> {
  return {
    addTabFilter: (profileId, urlFilter = "") => {
      const filter = createTabFilter(urlFilter);
      const profiles = appendProfileItem(
        get().profiles,
        profileId,
        "tabFilters",
        filter,
      );
      commitProfiles(set, get, profiles);
      return filter.id;
    },

    updateTabFilter: (profileId, filter) => {
      commitProfiles(
        set,
        get,
        replaceProfileItem(get().profiles, profileId, "tabFilters", filter),
      );
    },

    deleteTabFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        deleteProfileItem(get().profiles, profileId, "tabFilters", filterId),
      );
    },

    toggleTabFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        toggleProfileItem(get().profiles, profileId, "tabFilters", filterId),
      );
    },

    addDomainFilter: (profileId, domain = "") => {
      const filter = createDomainFilter(domain);
      const profiles = appendProfileItem(
        get().profiles,
        profileId,
        "domainFilters",
        filter,
      );
      commitProfiles(set, get, profiles);
      return filter.id;
    },

    updateDomainFilter: (profileId, filter) => {
      commitProfiles(
        set,
        get,
        replaceProfileItem(get().profiles, profileId, "domainFilters", filter),
      );
    },

    deleteDomainFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        deleteProfileItem(get().profiles, profileId, "domainFilters", filterId),
      );
    },

    toggleDomainFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        toggleProfileItem(get().profiles, profileId, "domainFilters", filterId),
      );
    },

    addUrlFilter: (profileId, regex = "") => {
      const filter = { id: nanoid(), enabled: true, regex };
      const profiles = appendProfileItem(
        get().profiles,
        profileId,
        "urlFilters",
        filter,
      );
      commitProfiles(set, get, profiles);
      return filter.id;
    },

    updateUrlFilter: (profileId, filter) => {
      commitProfiles(
        set,
        get,
        replaceProfileItem(get().profiles, profileId, "urlFilters", filter),
      );
    },

    deleteUrlFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        deleteProfileItem(get().profiles, profileId, "urlFilters", filterId),
      );
    },

    toggleUrlFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        toggleProfileItem(get().profiles, profileId, "urlFilters", filterId),
      );
    },

    addExcludeUrlFilter: (profileId, url = "") => {
      const filter = { id: nanoid(), enabled: true, url };
      const profiles = appendProfileItem(
        get().profiles,
        profileId,
        "excludeUrlFilters",
        filter,
      );
      commitProfiles(set, get, profiles);
      return filter.id;
    },

    updateExcludeUrlFilter: (profileId, filter) => {
      commitProfiles(
        set,
        get,
        replaceProfileItem(
          get().profiles,
          profileId,
          "excludeUrlFilters",
          filter,
        ),
      );
    },

    deleteExcludeUrlFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        deleteProfileItem(
          get().profiles,
          profileId,
          "excludeUrlFilters",
          filterId,
        ),
      );
    },

    toggleExcludeUrlFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        toggleProfileItem(
          get().profiles,
          profileId,
          "excludeUrlFilters",
          filterId,
        ),
      );
    },

    addMethodFilter: (profileId, method = "") => {
      const filter = { id: nanoid(), enabled: true, method };
      const profiles = appendProfileItem(
        get().profiles,
        profileId,
        "methodFilters",
        filter,
      );
      commitProfiles(set, get, profiles);
      return filter.id;
    },

    updateMethodFilter: (profileId, filter) => {
      commitProfiles(
        set,
        get,
        replaceProfileItem(get().profiles, profileId, "methodFilters", filter),
      );
    },

    deleteMethodFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        deleteProfileItem(get().profiles, profileId, "methodFilters", filterId),
      );
    },

    toggleMethodFilter: (profileId, filterId) => {
      commitProfiles(
        set,
        get,
        toggleProfileItem(get().profiles, profileId, "methodFilters", filterId),
      );
    },

    setMethodFilters: (profileId, methods) => {
      const cleanedMethods = Array.from(
        new Set(methods.map((method) => method.trim()).filter(Boolean)),
      );
      const profiles = updateProfile(get().profiles, profileId, (profile) => {
        const previousByMethod = new Map(
          (profile.methodFilters ?? []).map((filter) => [
            filter.method.toLowerCase(),
            filter,
          ]),
        );
        const methodFilters: MethodFilter[] = cleanedMethods.map((method) => {
          const previous = previousByMethod.get(method.toLowerCase());
          return previous
            ? { ...previous, method }
            : { id: nanoid(), enabled: true, method };
        });
        return { ...profile, methodFilters };
      });
      commitProfiles(set, get, profiles);
    },
  };
}
