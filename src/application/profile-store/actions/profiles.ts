import { nanoid } from "nanoid";
import type { Profile } from "@/src/domain";
import { createProfile } from "../factories";
import { persistState } from "../persistence";
import type { ProfileActions, StoreGet, StoreSet } from "../types";
import {
  cloneProfile,
  nextDefaultProfileName,
  normalizeEnabledProfileIds,
  uniqueProfileName,
} from "../profile-utils";

type ProfileActionKeys =
  | "addProfile"
  | "renameProfile"
  | "duplicateProfile"
  | "deleteProfile"
  | "setActiveProfile"
  | "setProfileAlwaysEnabled"
  | "mergeProfiles";

export function createProfileActions(
  set: StoreSet,
  get: StoreGet,
): Pick<ProfileActions, ProfileActionKeys> {
  return {
    addProfile: (name) => {
      const profiles = get().profiles;
      const base =
        name && name.trim() ? name.trim() : nextDefaultProfileName(profiles);
      const finalName = uniqueProfileName(base, profiles);
      const profile = createProfile(finalName);
      const nextProfiles = [...profiles, profile];
      const meta = {
        ...get().meta,
        activeProfileId: profile.id,
        enabledProfileIds: normalizeEnabledProfileIds(
          get().meta.enabledProfileIds,
          nextProfiles,
        ),
      };

      set({ profiles: nextProfiles, meta });
      void persistState({ profiles: nextProfiles, meta });
      return profile.id;
    },

    renameProfile: (profileId, name) => {
      const finalName = uniqueProfileName(
        name.trim() || "Untitled",
        get().profiles,
        profileId,
      );
      const profiles = get().profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, name: finalName, updatedAt: Date.now() }
          : profile,
      );

      set({ profiles });
      void persistState({ profiles, meta: get().meta });
    },

    duplicateProfile: (profileId, name) => {
      const profiles = get().profiles;
      const source = profiles.find((profile) => profile.id === profileId);
      if (!source) return null;

      const base = name?.trim() || `${source.name} Copy`;
      const profile = cloneProfile(source, uniqueProfileName(base, profiles));
      const nextProfiles = [...profiles, profile];
      const meta = {
        ...get().meta,
        activeProfileId: profile.id,
        enabledProfileIds: normalizeEnabledProfileIds(
          get().meta.enabledProfileIds,
          nextProfiles,
        ),
      };

      set({ profiles: nextProfiles, meta });
      void persistState({ profiles: nextProfiles, meta });
      return profile.id;
    },

    deleteProfile: (profileId) => {
      let profiles = get().profiles.filter(
        (profile) => profile.id !== profileId,
      );
      let meta = get().meta;

      if (profiles.length === 0) {
        const fallback = createProfile("Profile 1");
        profiles = [fallback];
        meta = {
          ...meta,
          activeProfileId: fallback.id,
          enabledProfileIds: [],
        };
      } else if (meta.activeProfileId === profileId) {
        meta = { ...meta, activeProfileId: profiles[0]?.id ?? null };
      }

      meta = {
        ...meta,
        enabledProfileIds: normalizeEnabledProfileIds(
          meta.enabledProfileIds,
          profiles,
        ),
      };
      set({ profiles, meta });
      void persistState({ profiles, meta });
    },

    setActiveProfile: (profileId) => {
      const meta = { ...get().meta, activeProfileId: profileId };
      set({ meta });
      void persistState({ profiles: get().profiles, meta });
    },

    setProfileAlwaysEnabled: (profileId, enabled) => {
      const profiles = get().profiles;
      if (!profiles.some((profile) => profile.id === profileId)) return;

      const enabledIds = new Set(
        normalizeEnabledProfileIds(get().meta.enabledProfileIds, profiles),
      );
      if (enabled) enabledIds.add(profileId);
      else enabledIds.delete(profileId);

      const meta = {
        ...get().meta,
        enabledProfileIds: Array.from(enabledIds),
      };
      set({ meta });
      void persistState({ profiles, meta });
    },

    mergeProfiles: (incoming, incomingMeta) => {
      if (!incoming.length) return;

      const profiles = get().profiles;
      const now = Date.now();
      const incomingEnabledIds = new Set(
        normalizeEnabledProfileIds(incomingMeta?.enabledProfileIds, incoming),
      );
      const namePool: Profile[] = [...profiles];
      const merged: Profile[] = incoming.map((profile) => {
        const name = uniqueProfileName(
          profile.name?.trim() || "Imported",
          namePool,
        );
        const next: Profile = {
          ...profile,
          id: nanoid(),
          name,
          createdAt: profile.createdAt ?? now,
          updatedAt: now,
        };
        namePool.push(next);
        return next;
      });
      const nextProfiles = [...profiles, ...merged];
      let meta = get().meta;

      if (!meta.activeProfileId && nextProfiles.length > 0) {
        meta = { ...meta, activeProfileId: nextProfiles[0]?.id ?? null };
      }
      meta = {
        ...meta,
        enabledProfileIds: normalizeEnabledProfileIds(
          [
            ...(meta.enabledProfileIds ?? []),
            ...merged
              .filter((profile, index) =>
                incomingEnabledIds.has(incoming[index]?.id ?? ""),
              )
              .map((profile) => profile.id),
          ],
          nextProfiles,
        ),
      };

      set({ profiles: nextProfiles, meta });
      void persistState({ profiles: nextProfiles, meta });
    },
  };
}
