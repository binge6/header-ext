// Zustand store + chrome.storage 双向同步
// 单一信源 = storage.local；store 修改后写回 storage，
// storage.onChanged 时回写 store，保证 popup / options / background 一致。

import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  loadState,
  saveState,
  subscribeState,
  createDefaultState,
} from "../core/storage";
import type {
  AppState,
  HeaderRule,
  Profile,
  AppMeta,
  RuleKind,
  TabFilter,
  DomainFilter,
  UrlFilter,
  ExcludeUrlFilter,
  MethodFilter,
} from "../core/types";

interface ProfileActions {
  hydrate: () => Promise<void>;

  // profile
  addProfile: (name?: string) => string;
  renameProfile: (profileId: string, name: string) => void;
  duplicateProfile: (profileId: string, name?: string) => string | null;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;
  setProfileAlwaysEnabled: (profileId: string, enabled: boolean) => void;

  // rule
  addRule: (
    profileId: string,
    kind?: RuleKind,
    target?: "request" | "response",
  ) => string;
  updateRule: (profileId: string, rule: HeaderRule) => void;
  deleteRule: (profileId: string, ruleId: string) => void;
  toggleRule: (profileId: string, ruleId: string) => void;
  reorderRules: (profileId: string, orderedRuleIds: string[]) => void;

  // tab filters (Profile 级)
  addTabFilter: (profileId: string, urlFilter?: string) => string;
  updateTabFilter: (profileId: string, filter: TabFilter) => void;
  deleteTabFilter: (profileId: string, filterId: string) => void;
  toggleTabFilter: (profileId: string, filterId: string) => void;

  // domain filters (Profile 级请求域名白名单)
  addDomainFilter: (profileId: string, domain?: string) => string;
  updateDomainFilter: (profileId: string, filter: DomainFilter) => void;
  deleteDomainFilter: (profileId: string, filterId: string) => void;
  toggleDomainFilter: (profileId: string, filterId: string) => void;

  // url filters (Profile 级请求 URL 正则白名单)
  addUrlFilter: (profileId: string, regex?: string) => string;
  updateUrlFilter: (profileId: string, filter: UrlFilter) => void;
  deleteUrlFilter: (profileId: string, filterId: string) => void;
  toggleUrlFilter: (profileId: string, filterId: string) => void;

  // exclude url filters (Profile 级排除请求 URL 黑名单)
  addExcludeUrlFilter: (profileId: string, url?: string) => string;
  updateExcludeUrlFilter: (profileId: string, filter: ExcludeUrlFilter) => void;
  deleteExcludeUrlFilter: (profileId: string, filterId: string) => void;
  toggleExcludeUrlFilter: (profileId: string, filterId: string) => void;

  // method filters (Profile 级请求方法白名单)
  addMethodFilter: (profileId: string, method?: string) => string;
  updateMethodFilter: (profileId: string, filter: MethodFilter) => void;
  deleteMethodFilter: (profileId: string, filterId: string) => void;
  toggleMethodFilter: (profileId: string, filterId: string) => void;
  // 整体重置请求方法白名单（用于多选下拉一次性更新）
  setMethodFilters: (profileId: string, methods: string[]) => void;

  // 一键模板：把模板规则追加到指定 profile
  applyTemplate: (profileId: string, rules: HeaderRule[]) => void;

  // meta
  togglePause: () => void;
  setMeta: (patch: Partial<AppMeta>) => void;
  setLockedTabId: (tabId: number | null) => void;

  // 合并导入：将外部 profiles 追加到现有列表（重新分配 id + 名称去重）
  mergeProfiles: (incoming: Profile[], incomingMeta?: Partial<AppMeta>) => void;
}

interface ProfileStore extends AppState {
  hydrated: boolean;
  actions: ProfileActions;
}

let isApplyingRemote = false;
// hydrate 注册的 storage 监听取消函数；重复 hydrate 前先反注册，避免监听泄漏
let unsubscribeState: (() => void) | null = null;

function emptyRule(
  kind: RuleKind = "header",
  target?: "request" | "response",
): HeaderRule {
  const isCookieReq = kind === "cookie-request-append";
  const isCookieRes = kind === "cookie-response-append";
  const finalTarget: "request" | "response" = isCookieRes
    ? "response"
    : (target ?? "request");
  return {
    id: nanoid(),
    enabled: true,
    kind,
    target: finalTarget,
    action: isCookieReq || isCookieRes ? "append" : "set",
    name: "",
    value: "",
    condition: { urlFilter: "" },
  };
}

function emptyProfile(name: string): Profile {
  const now = Date.now();
  return {
    id: nanoid(),
    name,
    color: "#1677ff",
    rules: [],
    tabFilters: [],
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeEnabledProfileIds(
  ids: string[] | undefined,
  profiles: Profile[],
): string[] {
  const validIds = new Set(profiles.map((profile) => profile.id));
  const source = Array.isArray(ids) ? ids : [];
  return Array.from(new Set(source.filter((id) => validIds.has(id))));
}

// 在已有 profile 列表中，给 base 名称生成一个唯一名称
// excludeId：重命名时排除自身
function uniqueProfileName(
  base: string,
  profiles: Profile[],
  excludeId?: string,
): string {
  const used = new Set(
    profiles.filter((p) => p.id !== excludeId).map((p) => p.name),
  );
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

// 为新建 profile 生成默认名称：Profile {n}，n 从已有数量+1 开始递增直到不冲突
function nextDefaultProfileName(profiles: Profile[]): string {
  const used = new Set(profiles.map((p) => p.name));
  let i = profiles.length + 1;
  while (used.has(`Profile ${i}`)) i += 1;
  return `Profile ${i}`;
}

function emptyTabFilter(urlFilter = ""): TabFilter {
  return {
    id: nanoid(),
    enabled: true,
    urlFilter,
  };
}

function emptyDomainFilter(domain = ""): DomainFilter {
  return {
    id: nanoid(),
    enabled: true,
    domain,
  };
}

function cloneFilters<T extends { id: string }>(filters: T[]): T[] {
  return filters.map((filter) => ({ ...filter, id: nanoid() }));
}

function cloneRuleCondition(
  condition: HeaderRule["condition"],
): HeaderRule["condition"] {
  const next = { ...condition };

  if (condition.excludedDomains) {
    next.excludedDomains = [...condition.excludedDomains];
  }
  if (condition.resourceTypes) {
    next.resourceTypes = [...condition.resourceTypes];
  }
  if (condition.requestMethods) {
    next.requestMethods = [...condition.requestMethods];
  }

  return next;
}

function cloneProfile(source: Profile, name: string): Profile {
  const now = Date.now();
  const next: Profile = {
    ...source,
    id: nanoid(),
    name,
    rules: source.rules.map((rule) => ({
      ...rule,
      id: nanoid(),
      condition: cloneRuleCondition(rule.condition),
    })),
    createdAt: now,
    updatedAt: now,
  };

  if (source.tabFilters) next.tabFilters = cloneFilters(source.tabFilters);
  else delete next.tabFilters;
  if (source.domainFilters) {
    next.domainFilters = cloneFilters(source.domainFilters);
  } else {
    delete next.domainFilters;
  }
  if (source.urlFilters) next.urlFilters = cloneFilters(source.urlFilters);
  else delete next.urlFilters;
  if (source.excludeUrlFilters) {
    next.excludeUrlFilters = cloneFilters(source.excludeUrlFilters);
  } else {
    delete next.excludeUrlFilters;
  }
  if (source.methodFilters) {
    next.methodFilters = cloneFilters(source.methodFilters);
  } else {
    delete next.methodFilters;
  }

  return next;
}

async function persist(state: AppState): Promise<void> {
  if (isApplyingRemote) return;
  await saveState({ profiles: state.profiles, meta: state.meta });
}

function reorderRulesByIds(
  rules: HeaderRule[],
  orderedRuleIds: string[],
): HeaderRule[] {
  if (orderedRuleIds.length < 2) return rules;

  const idSet = new Set(orderedRuleIds);
  if (idSet.size !== orderedRuleIds.length) return rules;

  const ruleById = new Map(rules.map((rule) => [rule.id, rule]));
  const orderedRules: HeaderRule[] = [];
  for (const id of orderedRuleIds) {
    const rule = ruleById.get(id);
    if (!rule) return rules;
    orderedRules.push(rule);
  }

  let cursor = 0;
  return rules.map((rule) =>
    idSet.has(rule.id) ? orderedRules[cursor++] : rule,
  );
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  meta: {
    activeProfileId: null,
    enabledProfileIds: [],
    globalPaused: false,
    lockedTabId: null,
    language: null,
  },
  hydrated: false,

  actions: {
    hydrate: async () => {
      // storage 读取失败（如扩展上下文失效）时回退到默认态并仍标记 hydrated，
      // 避免 UI 永久卡在加载态（loadState reject 会让 hydrated 一直为 false）
      let state;
      try {
        state = await loadState();
      } catch (err) {
        console.error("[header-ext] hydrate loadState failed", err);
        state = createDefaultState();
      }
      set({
        profiles: state.profiles,
        meta: state.meta,
        hydrated: true,
      });
      // 反注册上一次 hydrate 的监听，避免重复 hydrate（HMR / 重挂载）累积监听器
      unsubscribeState?.();
      try {
        unsubscribeState = subscribeState((next) => {
          isApplyingRemote = true;
          set({ profiles: next.profiles, meta: next.meta });
          isApplyingRemote = false;
        });
      } catch (err) {
        console.error("[header-ext] hydrate subscribeState failed", err);
      }
    },

    addProfile: (name) => {
      const profiles = get().profiles;
      const base =
        name && name.trim() ? name.trim() : nextDefaultProfileName(profiles);
      const finalName = uniqueProfileName(base, profiles);
      const profile = emptyProfile(finalName);
      const next = {
        ...get(),
        profiles: [...profiles, profile],
      };
      const meta = {
        ...get().meta,
        activeProfileId: profile.id,
        enabledProfileIds: normalizeEnabledProfileIds(
          get().meta.enabledProfileIds,
          next.profiles,
        ),
      };
      set({ profiles: next.profiles, meta });
      void persist({ profiles: next.profiles, meta });
      return profile.id;
    },

    renameProfile: (profileId, name) => {
      const trimmed = name.trim() || "Untitled";
      const finalName = uniqueProfileName(trimmed, get().profiles, profileId);
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? { ...p, name: finalName, updatedAt: Date.now() }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    duplicateProfile: (profileId, name) => {
      const profiles = get().profiles;
      const source = profiles.find((p) => p.id === profileId);
      if (!source) return null;

      const base = name?.trim() || `${source.name} Copy`;
      const finalName = uniqueProfileName(base, profiles);
      const profile = cloneProfile(source, finalName);
      const next = [...profiles, profile];
      const meta = {
        ...get().meta,
        activeProfileId: profile.id,
        enabledProfileIds: normalizeEnabledProfileIds(
          get().meta.enabledProfileIds,
          next,
        ),
      };

      set({ profiles: next, meta });
      void persist({ profiles: next, meta });
      return profile.id;
    },

    deleteProfile: (profileId) => {
      let profiles = get().profiles.filter((p) => p.id !== profileId);
      let meta = get().meta;
      // 所有 profile 被删除后，自动生成一个默认空 profile
      if (profiles.length === 0) {
        const fallback = emptyProfile("Profile 1");
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
      void persist({ profiles, meta });
    },

    setActiveProfile: (profileId) => {
      const meta = { ...get().meta, activeProfileId: profileId };
      set({ meta });
      void persist({ profiles: get().profiles, meta });
    },

    setProfileAlwaysEnabled: (profileId, enabled) => {
      const profiles = get().profiles;
      const validIds = new Set(profiles.map((profile) => profile.id));
      if (!validIds.has(profileId)) return;
      const current = new Set(
        normalizeEnabledProfileIds(
          get().meta.enabledProfileIds,
          profiles,
        ),
      );
      if (enabled) current.add(profileId);
      else current.delete(profileId);
      const meta = {
        ...get().meta,
        enabledProfileIds: Array.from(current),
      };
      set({ meta });
      void persist({ profiles, meta });
    },

    addRule: (profileId, kind = "header", target) => {
      const rule = emptyRule(kind, target);
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? { ...p, rules: [...p.rules, rule], updatedAt: Date.now() }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
      return rule.id;
    },

    updateRule: (profileId, rule) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              rules: p.rules.map((r) => (r.id === rule.id ? rule : r)),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    deleteRule: (profileId, ruleId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              rules: p.rules.filter((r) => r.id !== ruleId),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    toggleRule: (profileId, ruleId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              rules: p.rules.map((r) =>
                r.id === ruleId ? { ...r, enabled: !r.enabled } : r,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    reorderRules: (profileId, orderedRuleIds) => {
      let changed = false;
      const profiles = get().profiles.map((p) => {
        if (p.id !== profileId) return p;
        const rules = reorderRulesByIds(p.rules, orderedRuleIds);
        if (rules === p.rules) return p;
        changed = true;
        return { ...p, rules, updatedAt: Date.now() };
      });
      if (!changed) return;
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    togglePause: () => {
      const meta = { ...get().meta, globalPaused: !get().meta.globalPaused };
      set({ meta });
      void persist({ profiles: get().profiles, meta });
    },

    setMeta: (patch) => {
      const meta = { ...get().meta, ...patch };
      set({ meta });
      void persist({ profiles: get().profiles, meta });
    },

    setLockedTabId: (tabId) => {
      const meta = { ...get().meta, lockedTabId: tabId };
      set({ meta });
      void persist({ profiles: get().profiles, meta });
    },

    addTabFilter: (profileId, urlFilter = "") => {
      const filter = emptyTabFilter(urlFilter);
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              tabFilters: [...(p.tabFilters ?? []), filter],
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
      return filter.id;
    },

    updateTabFilter: (profileId, filter) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              tabFilters: (p.tabFilters ?? []).map((f) =>
                f.id === filter.id ? filter : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    deleteTabFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              tabFilters: (p.tabFilters ?? []).filter((f) => f.id !== filterId),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    toggleTabFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              tabFilters: (p.tabFilters ?? []).map((f) =>
                f.id === filterId ? { ...f, enabled: !f.enabled } : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    addDomainFilter: (profileId, domain = "") => {
      const filter = emptyDomainFilter(domain);
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              domainFilters: [...(p.domainFilters ?? []), filter],
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
      return filter.id;
    },

    updateDomainFilter: (profileId, filter) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              domainFilters: (p.domainFilters ?? []).map((f) =>
                f.id === filter.id ? filter : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    deleteDomainFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              domainFilters: (p.domainFilters ?? []).filter(
                (f) => f.id !== filterId,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    toggleDomainFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              domainFilters: (p.domainFilters ?? []).map((f) =>
                f.id === filterId ? { ...f, enabled: !f.enabled } : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    addUrlFilter: (profileId, regex = "") => {
      const filter: UrlFilter = { id: nanoid(), enabled: true, regex };
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              urlFilters: [...(p.urlFilters ?? []), filter],
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
      return filter.id;
    },

    updateUrlFilter: (profileId, filter) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              urlFilters: (p.urlFilters ?? []).map((f) =>
                f.id === filter.id ? filter : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    deleteUrlFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              urlFilters: (p.urlFilters ?? []).filter((f) => f.id !== filterId),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    toggleUrlFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              urlFilters: (p.urlFilters ?? []).map((f) =>
                f.id === filterId ? { ...f, enabled: !f.enabled } : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    addExcludeUrlFilter: (profileId, url = "") => {
      const filter: ExcludeUrlFilter = {
        id: nanoid(),
        enabled: true,
        url,
      };
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              excludeUrlFilters: [...(p.excludeUrlFilters ?? []), filter],
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
      return filter.id;
    },

    updateExcludeUrlFilter: (profileId, filter) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              excludeUrlFilters: (p.excludeUrlFilters ?? []).map((f) =>
                f.id === filter.id ? filter : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    deleteExcludeUrlFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              excludeUrlFilters: (p.excludeUrlFilters ?? []).filter(
                (f) => f.id !== filterId,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    toggleExcludeUrlFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              excludeUrlFilters: (p.excludeUrlFilters ?? []).map((f) =>
                f.id === filterId ? { ...f, enabled: !f.enabled } : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    addMethodFilter: (profileId, method = "") => {
      const filter: MethodFilter = { id: nanoid(), enabled: true, method };
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              methodFilters: [...(p.methodFilters ?? []), filter],
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
      return filter.id;
    },

    updateMethodFilter: (profileId, filter) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              methodFilters: (p.methodFilters ?? []).map((f) =>
                f.id === filter.id ? filter : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    deleteMethodFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              methodFilters: (p.methodFilters ?? []).filter(
                (f) => f.id !== filterId,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    toggleMethodFilter: (profileId, filterId) => {
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              methodFilters: (p.methodFilters ?? []).map((f) =>
                f.id === filterId ? { ...f, enabled: !f.enabled } : f,
              ),
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    setMethodFilters: (profileId, methods) => {
      const cleaned = Array.from(
        new Set(methods.map((m) => m.trim()).filter(Boolean)),
      );
      const profiles = get().profiles.map((p) => {
        if (p.id !== profileId) return p;
        const prev = p.methodFilters ?? [];
        const prevById = new Map(prev.map((f) => [f.method.toLowerCase(), f]));
        // 复用已有项的 id / enabled，确保引用稳定
        const next: MethodFilter[] = cleaned.map((method) => {
          const found = prevById.get(method.toLowerCase());
          return found
            ? { ...found, method }
            : { id: nanoid(), enabled: true, method };
        });
        return { ...p, methodFilters: next, updatedAt: Date.now() };
      });
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    applyTemplate: (profileId, templateRules) => {
      if (!templateRules.length) return;
      const profiles = get().profiles.map((p) =>
        p.id === profileId
          ? {
              ...p,
              rules: [...p.rules, ...templateRules],
              updatedAt: Date.now(),
            }
          : p,
      );
      set({ profiles });
      void persist({ profiles, meta: get().meta });
    },

    mergeProfiles: (incoming, incomingMeta) => {
      if (!incoming.length) return;
      const profiles = get().profiles;
      const now = Date.now();
      const incomingEnabledIds = new Set(
        normalizeEnabledProfileIds(
          incomingMeta?.enabledProfileIds,
          incoming,
        ),
      );
      // 维护一个动态扩展的命名池，确保新增项之间也不重名
      const pool: Profile[] = [...profiles];
      const merged: Profile[] = incoming.map((p) => {
        const base = p.name?.trim() || "Imported";
        const name = uniqueProfileName(base, pool);
        const next: Profile = {
          ...p,
          id: nanoid(),
          name,
          createdAt: p.createdAt ?? now,
          updatedAt: now,
        };
        pool.push(next);
        return next;
      });
      const next = [...profiles, ...merged];
      let meta = get().meta;
      // 若当前未激活任何 profile，则激活合并后的第一个
      if (!meta.activeProfileId && next.length > 0) {
        meta = { ...meta, activeProfileId: next[0]?.id ?? null };
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
          next,
        ),
      };
      set({ profiles: next, meta });
      void persist({ profiles: next, meta });
    },
  },
}));

// 便捷 hook：一次性拿到所有 actions（actions 对象引用稳定，不会触发额外渲染）
export const useProfileActions = (): ProfileActions =>
  useProfileStore((s) => s.actions);
