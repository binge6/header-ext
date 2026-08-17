import type { StoreApi } from "zustand";
import type {
  AppMeta,
  AppState,
  DomainFilter,
  ExcludeUrlFilter,
  HeaderRule,
  MethodFilter,
  Profile,
  ProfileVariable,
  RuleKind,
  TabFilter,
  UrlFilter,
} from "@/src/domain";
import type { DnrErrorRecord } from "@/src/platform/dnr";

export interface ProfileActions {
  hydrate: () => Promise<void>;
  reinitializeRules: () => Promise<void>;

  addProfile: (name?: string) => string;
  renameProfile: (profileId: string, name: string) => void;
  duplicateProfile: (profileId: string, name?: string) => string | null;
  deleteProfile: (profileId: string) => void;
  deleteProfiles: (profileIds: string[]) => number;
  setActiveProfile: (profileId: string) => void;
  setProfileAlwaysEnabled: (profileId: string, enabled: boolean) => void;

  addRule: (
    profileId: string,
    kind?: RuleKind,
    target?: "request" | "response",
  ) => string;
  updateRule: (profileId: string, rule: HeaderRule) => void;
  deleteRule: (profileId: string, ruleId: string) => void;
  toggleRule: (profileId: string, ruleId: string) => void;
  reorderRules: (profileId: string, orderedRuleIds: string[]) => void;

  addTabFilter: (profileId: string, urlFilter?: string) => string;
  updateTabFilter: (profileId: string, filter: TabFilter) => void;
  deleteTabFilter: (profileId: string, filterId: string) => void;
  toggleTabFilter: (profileId: string, filterId: string) => void;

  addDomainFilter: (profileId: string, domain?: string) => string;
  updateDomainFilter: (profileId: string, filter: DomainFilter) => void;
  deleteDomainFilter: (profileId: string, filterId: string) => void;
  toggleDomainFilter: (profileId: string, filterId: string) => void;

  addUrlFilter: (profileId: string, regex?: string) => string;
  updateUrlFilter: (profileId: string, filter: UrlFilter) => void;
  deleteUrlFilter: (profileId: string, filterId: string) => void;
  toggleUrlFilter: (profileId: string, filterId: string) => void;

  addExcludeUrlFilter: (profileId: string, url?: string) => string;
  updateExcludeUrlFilter: (profileId: string, filter: ExcludeUrlFilter) => void;
  deleteExcludeUrlFilter: (profileId: string, filterId: string) => void;
  toggleExcludeUrlFilter: (profileId: string, filterId: string) => void;

  addMethodFilter: (profileId: string, method?: string) => string;
  updateMethodFilter: (profileId: string, filter: MethodFilter) => void;
  deleteMethodFilter: (profileId: string, filterId: string) => void;
  toggleMethodFilter: (profileId: string, filterId: string) => void;
  setMethodFilters: (profileId: string, methods: string[]) => void;

  addVariable: (profileId: string, name?: string, value?: string) => string;
  updateVariable: (profileId: string, variable: ProfileVariable) => void;
  deleteVariable: (profileId: string, variableId: string) => void;
  toggleVariable: (profileId: string, variableId: string) => void;

  applyTemplate: (profileId: string, rules: HeaderRule[]) => void;

  togglePause: () => void;
  setMeta: (patch: Partial<AppMeta>) => void;
  setLockedTabId: (tabId: number | null) => void;

  mergeProfiles: (incoming: Profile[], incomingMeta?: Partial<AppMeta>) => void;
}

export interface ProfileStore extends AppState {
  dnrErrors: DnrErrorRecord;
  hydrated: boolean;
  actions: ProfileActions;
}

export type StoreSet = StoreApi<ProfileStore>["setState"];
export type StoreGet = StoreApi<ProfileStore>["getState"];
