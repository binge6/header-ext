import {
  createDefaultState,
  loadState,
  subscribeState,
} from "@/src/platform/storage";
import {
  loadDnrErrors,
  requestDnrReinitialize,
  subscribeDnrErrors,
} from "@/src/platform/dnr";
import { setApplyingRemote } from "../persistence";
import type { ProfileActions, StoreGet, StoreSet } from "../types";

let unsubscribeState: (() => void) | null = null;
let unsubscribeDnrErrors: (() => void) | null = null;

export function createSyncActions(
  set: StoreSet,
  _get: StoreGet,
): Pick<ProfileActions, "hydrate" | "reinitializeRules"> {
  return {
    hydrate: async () => {
      let state;
      try {
        state = await loadState();
      } catch (error) {
        console.error("[header-ext] hydrate loadState failed", error);
        state = createDefaultState();
      }
      const dnrErrors = await loadDnrErrors().catch((error: unknown) => {
        console.error("[header-ext] hydrate loadDnrErrors failed", error);
        return {};
      });

      set({
        profiles: state.profiles,
        meta: state.meta,
        dnrErrors,
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
        unsubscribeDnrErrors?.();
        unsubscribeDnrErrors = subscribeDnrErrors((next) => {
          set({ dnrErrors: next });
        });
      } catch (error) {
        console.error("[header-ext] hydrate subscribeState failed", error);
      }
    },
    reinitializeRules: async () => {
      await requestDnrReinitialize();
      set({ dnrErrors: await loadDnrErrors() });
    },
  };
}
