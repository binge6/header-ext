import { create } from "zustand";
import { createProfileStoreActions } from "./actions";
import type { ProfileActions, ProfileStore } from "./types";

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  dnrErrors: {},
  meta: {
    activeProfileId: null,
    enabledProfileIds: [],
    globalPaused: false,
    lockedTabId: null,
    language: null,
  },
  hydrated: false,
  actions: createProfileStoreActions(set, get),
}));

// 便捷 hook：一次性拿到所有 actions（actions 对象引用稳定，不会触发额外渲染）
export const useProfileActions = (): ProfileActions =>
  useProfileStore((s) => s.actions);
