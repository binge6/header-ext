import {
  createDefaultState,
  loadState,
  subscribeState,
} from "@/src/platform/storage";
import { setApplyingRemote } from "../persistence";
import type { ProfileActions, StoreGet, StoreSet } from "../types";

let unsubscribeState: (() => void) | null = null;

export function createSyncActions(
  set: StoreSet,
  _get: StoreGet,
): Pick<ProfileActions, "hydrate"> {
  return {
    hydrate: async () => {
      let state;
      try {
        state = await loadState();
      } catch (error) {
        console.error("[header-ext] hydrate loadState failed", error);
        state = createDefaultState();
      }

      set({
        profiles: state.profiles,
        meta: state.meta,
        hydrated: true,
      });

      unsubscribeState?.();
      try {
        unsubscribeState = subscribeState((next) => {
          setApplyingRemote(true);
          try {
            set({ profiles: next.profiles, meta: next.meta });
          } finally {
            setApplyingRemote(false);
          }
        });
      } catch (error) {
        console.error("[header-ext] hydrate subscribeState failed", error);
      }
    },
  };
}
