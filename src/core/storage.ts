// Storage 双层结构：
//   meta: { activeProfileId, globalPaused, lockedTabId, language }
//   profiles: Profile[]
// 全部存放在 storage.local 单 key（P0 简化），后续如规则量大可切分。

import { storageLocal } from './browserApi';
import type { AppMeta, AppState, Profile } from './types';

const KEY_STATE = 'app:state:v1';

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
    id: 'default',
    name: 'Default',
    color: '#1677ff',
    rules: [],
    createdAt: now,
    updatedAt: now,
  };
  return {
    profiles: [defaultProfile],
    meta: {
      ...DEFAULT_META,
      activeProfileId: defaultProfile.id,
      enabledProfileIds: [defaultProfile.id],
    },
  };
}

function normalizeMeta(meta: Partial<AppMeta> | undefined, profiles: Profile[]): AppMeta {
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const activeProfileId =
    meta?.activeProfileId && profileIds.has(meta.activeProfileId)
      ? meta.activeProfileId
      : (profiles[0]?.id ?? null);

  const rawEnabled = Array.isArray(meta?.enabledProfileIds)
    ? meta.enabledProfileIds
    : activeProfileId
      ? [activeProfileId]
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

export async function loadState(): Promise<AppState> {
  const raw = await storageLocal.get<AppState>(KEY_STATE);
  if (!raw || !Array.isArray(raw.profiles) || raw.profiles.length === 0) {
    const def = createDefaultState();
    await storageLocal.set(KEY_STATE, def);
    return def;
  }
  // 兼容性补全
  return {
    profiles: raw.profiles,
    meta: normalizeMeta(raw.meta, raw.profiles),
  };
}

export async function saveState(state: AppState): Promise<void> {
  await storageLocal.set(KEY_STATE, state);
}

export function subscribeState(handler: (state: AppState) => void): () => void {
  return storageLocal.onChanged((changes) => {
    if (KEY_STATE in changes) {
      const newValue = changes[KEY_STATE].newValue as AppState | undefined;
      if (newValue) handler(newValue);
    }
  });
}

export const STATE_KEY = KEY_STATE;
