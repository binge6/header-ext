// Storage 双层结构：
//   meta: { activeProfileId, enabledProfileIds(始终启用), globalPaused, lockedTabId, language }
//   profiles: Profile[]
// 全部存放在 storage.local 单 key（P0 简化），后续如规则量大可切分。

import { isEqual } from "es-toolkit/predicate";
import type { AppMeta, AppState, Profile } from "@/src/domain";
import { storedAppStateSchema } from "@/src/domain/schemas";
import { storageLocal } from "@/src/platform/browser/api";

const KEY_STATE = "app:state:v1";

const DEFAULT_META: AppMeta = {
  activeProfileId: null,
  enabledProfileIds: [],
  globalPaused: false,
  lockedTabId: null,
  language: null,
};

export function createDefaultState(): AppState {
  const now = Date.now();
  const defaultProfile: Profile = {
    id: "default",
    name: "Default",
    color: "#1677ff",
    rules: [],
    variables: [],
    createdAt: now,
    updatedAt: now,
  };
  return {
    profiles: [defaultProfile],
    meta: {
      ...DEFAULT_META,
      activeProfileId: defaultProfile.id,
      enabledProfileIds: [],
    },
  };
}

function normalizeMeta(
  meta: Partial<AppMeta> | undefined,
  profiles: Profile[],
): AppMeta {
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const activeProfileId =
    meta?.activeProfileId && profileIds.has(meta.activeProfileId)
      ? meta.activeProfileId
      : (profiles[0]?.id ?? null);

  const rawEnabled = Array.isArray(meta?.enabledProfileIds)
    ? meta.enabledProfileIds
    : [];
  const enabledProfileIds = Array.from(
    new Set(rawEnabled.filter((id): id is string => profileIds.has(id))),
  );

  return {
    ...DEFAULT_META,
    ...meta,
    activeProfileId,
    enabledProfileIds,
  };
}

function parseStoredState(raw: unknown): AppState | null {
  const result = storedAppStateSchema.safeParse(raw);
  if (!result.success || result.data.profiles.length === 0) return null;

  return {
    profiles: result.data.profiles,
    meta: normalizeMeta(result.data.meta, result.data.profiles),
  };
}

export async function loadState(): Promise<AppState> {
  const raw = await storageLocal.get(KEY_STATE);
  const state = parseStoredState(raw);
  if (!state) {
    const def = createDefaultState();
    await storageLocal.set(KEY_STATE, def);
    return def;
  }
  if (!isEqual(raw, state)) {
    await storageLocal.set(KEY_STATE, state);
  }
  return state;
}

export async function saveState(state: AppState): Promise<void> {
  await storageLocal.set(KEY_STATE, state);
}

export function subscribeState(handler: (state: AppState) => void): () => void {
  return storageLocal.onChanged((changes) => {
    if (KEY_STATE in changes) {
      const state = parseStoredState(changes[KEY_STATE].newValue);
      if (state) handler(state);
    }
  });
}
