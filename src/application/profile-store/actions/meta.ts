import { persistState } from "../persistence";
import type { ProfileActions, StoreGet, StoreSet } from "../types";

type MetaActionKeys = "togglePause" | "setMeta" | "setLockedTabId";

export function createMetaActions(
  set: StoreSet,
  get: StoreGet,
): Pick<ProfileActions, MetaActionKeys> {
  return {
    togglePause: () => {
      const meta = {
        ...get().meta,
        globalPaused: !get().meta.globalPaused,
      };
      set({ meta });
      void persistState({ profiles: get().profiles, meta });
    },

    setMeta: (patch) => {
      const meta = { ...get().meta, ...patch };
      set({ meta });
      void persistState({ profiles: get().profiles, meta });
    },

    setLockedTabId: (tabId) => {
      const meta = { ...get().meta, lockedTabId: tabId };
      set({ meta });
      void persistState({ profiles: get().profiles, meta });
    },
  };
}
