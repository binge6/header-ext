import type {
  AppState,
  DomainFilter,
  ExcludeUrlFilter,
  MethodFilter,
  Profile,
  ProfileVariable,
  TabFilter,
  UrlFilter,
} from "@/src/domain";
import { saveState } from "@/src/platform/storage";
import type { StoreGet, StoreSet } from "./types";

let isApplyingRemote = false;

export function setApplyingRemote(value: boolean): void {
  isApplyingRemote = value;
}

export async function persistState(state: AppState): Promise<void> {
  if (isApplyingRemote) return;
  await saveState({ profiles: state.profiles, meta: state.meta });
}

export function commitProfiles(
  set: StoreSet,
  get: StoreGet,
  profiles: Profile[],
): void {
  set({ profiles });
  void persistState({ profiles, meta: get().meta });
}

export function updateProfile(
  profiles: Profile[],
  profileId: string,
  update: (profile: Profile) => Profile,
): Profile[] {
  return profiles.map((profile) =>
    profile.id === profileId
      ? { ...update(profile), updatedAt: Date.now() }
      : profile,
  );
}

interface ProfileCollectionMap {
  tabFilters: TabFilter;
  domainFilters: DomainFilter;
  urlFilters: UrlFilter;
  excludeUrlFilters: ExcludeUrlFilter;
  methodFilters: MethodFilter;
  variables: ProfileVariable;
}

export type ProfileCollectionKey = keyof ProfileCollectionMap;

function updateProfileCollection<K extends ProfileCollectionKey>(
  profiles: Profile[],
  profileId: string,
  key: K,
  update: (items: ProfileCollectionMap[K][]) => ProfileCollectionMap[K][],
): Profile[] {
  return updateProfile(profiles, profileId, (profile) => ({
    ...profile,
    [key]: update((profile[key] ?? []) as ProfileCollectionMap[K][]),
  }));
}

export function appendProfileItem<K extends ProfileCollectionKey>(
  profiles: Profile[],
  profileId: string,
  key: K,
  item: ProfileCollectionMap[K],
): Profile[] {
  return updateProfileCollection(profiles, profileId, key, (items) => [
    ...items,
    item,
  ]);
}

export function replaceProfileItem<K extends ProfileCollectionKey>(
  profiles: Profile[],
  profileId: string,
  key: K,
  item: ProfileCollectionMap[K],
): Profile[] {
  return updateProfileCollection(profiles, profileId, key, (items) =>
    items.map((current) => (current.id === item.id ? item : current)),
  );
}

export function deleteProfileItem<K extends ProfileCollectionKey>(
  profiles: Profile[],
  profileId: string,
  key: K,
  itemId: string,
): Profile[] {
  return updateProfileCollection(profiles, profileId, key, (items) =>
    items.filter((item) => item.id !== itemId),
  );
}

export function toggleProfileItem<K extends ProfileCollectionKey>(
  profiles: Profile[],
  profileId: string,
  key: K,
  itemId: string,
): Profile[] {
  return updateProfileCollection(profiles, profileId, key, (items) =>
    items.map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item,
    ),
  );
}
