// Zustand store + chrome.storage 双向同步
// 单一信源 = storage.local；store 修改后写回 storage，
// storage.onChanged 时回写 store，保证 popup / options / background 一致。

import { create } from "zustand";
import { nanoid } from "nanoid";
import { loadState, saveState, subscribeState } from "../core/storage";
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

interface ProfileStore extends AppState {
  hydrated: boolean;
  hydrate: () => Promise<void>;

  // profile
  addProfile: (name?: string) => string;
  renameProfile: (profileId: string, name: string) => void;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;

  // rule
  addRule: (
    profileId: string,
    kind?: RuleKind,
    target?: "request" | "response"
  ) => string;
  updateRule: (profileId: string, rule: HeaderRule) => void;
  deleteRule: (profileId: string, ruleId: string) => void;
  toggleRule: (profileId: string, ruleId: string) => void;

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

  replaceState: (next: {
    profiles: Profile[];
    meta?: Partial<AppMeta>;
  }) => void;
}

let isApplyingRemote = false;

function emptyRule(
  kind: RuleKind = "header",
  target?: "request" | "response"
): HeaderRule {
  const isCookieReq = kind === "cookie-request-append";
  const isCookieRes = kind === "cookie-response-append";
  const finalTarget: "request" | "response" = isCookieRes
    ? "response"
    : target ?? "request";
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

// 在已有 profile 列表中，给 base 名称生成一个唯一名称
// excludeId：重命名时排除自身
function uniqueProfileName(
  base: string,
  profiles: Profile[],
  excludeId?: string
): string {
  const used = new Set(
    profiles.filter((p) => p.id !== excludeId).map((p) => p.name)
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

async function persist(state: AppState): Promise<void> {
  if (isApplyingRemote) return;
  await saveState({ profiles: state.profiles, meta: state.meta });
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  meta: {
    activeProfileId: null,
    globalPaused: false,
    lockedTabId: null,
    language: null,
  },
  hydrated: false,

  hydrate: async () => {
    const state = await loadState();
    set({
      profiles: state.profiles,
      meta: state.meta,
      hydrated: true,
    });
    subscribeState((next) => {
      isApplyingRemote = true;
      set({ profiles: next.profiles, meta: next.meta });
      isApplyingRemote = false;
    });
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
    set({ profiles: next.profiles });
    void persist({ profiles: next.profiles, meta: get().meta });
    return profile.id;
  },

  renameProfile: (profileId, name) => {
    const trimmed = name.trim() || "Untitled";
    const finalName = uniqueProfileName(trimmed, get().profiles, profileId);
    const profiles = get().profiles.map((p) =>
      p.id === profileId ? { ...p, name: finalName, updatedAt: Date.now() } : p
    );
    set({ profiles });
    void persist({ profiles, meta: get().meta });
  },

  deleteProfile: (profileId) => {
    let profiles = get().profiles.filter((p) => p.id !== profileId);
    let meta = get().meta;
    // 所有 profile 被删除后，自动生成一个默认空 profile
    if (profiles.length === 0) {
      const fallback = emptyProfile("Profile 1");
      profiles = [fallback];
      meta = { ...meta, activeProfileId: fallback.id };
    } else if (meta.activeProfileId === profileId) {
      meta = { ...meta, activeProfileId: profiles[0]?.id ?? null };
    }
    set({ profiles, meta });
    void persist({ profiles, meta });
  },

  setActiveProfile: (profileId) => {
    const meta = { ...get().meta, activeProfileId: profileId };
    set({ meta });
    void persist({ profiles: get().profiles, meta });
  },

  addRule: (profileId, kind = "header", target) => {
    const rule = emptyRule(kind, target);
    const profiles = get().profiles.map((p) =>
      p.id === profileId
        ? { ...p, rules: [...p.rules, rule], updatedAt: Date.now() }
        : p
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
        : p
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
        : p
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
              r.id === ruleId ? { ...r, enabled: !r.enabled } : r
            ),
            updatedAt: Date.now(),
          }
        : p
    );
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
        : p
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
              f.id === filter.id ? filter : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
        : p
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
              f.id === filterId ? { ...f, enabled: !f.enabled } : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
        : p
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
              f.id === filter.id ? filter : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
              (f) => f.id !== filterId
            ),
            updatedAt: Date.now(),
          }
        : p
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
              f.id === filterId ? { ...f, enabled: !f.enabled } : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
        : p
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
              f.id === filter.id ? filter : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
        : p
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
              f.id === filterId ? { ...f, enabled: !f.enabled } : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
        : p
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
              f.id === filter.id ? filter : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
              (f) => f.id !== filterId
            ),
            updatedAt: Date.now(),
          }
        : p
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
              f.id === filterId ? { ...f, enabled: !f.enabled } : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
        : p
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
              f.id === filter.id ? filter : f
            ),
            updatedAt: Date.now(),
          }
        : p
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
              (f) => f.id !== filterId
            ),
            updatedAt: Date.now(),
          }
        : p
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
              f.id === filterId ? { ...f, enabled: !f.enabled } : f
            ),
            updatedAt: Date.now(),
          }
        : p
    );
    set({ profiles });
    void persist({ profiles, meta: get().meta });
  },

  setMethodFilters: (profileId, methods) => {
    const cleaned = Array.from(
      new Set(methods.map((m) => m.trim()).filter(Boolean))
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
        : p
    );
    set({ profiles });
    void persist({ profiles, meta: get().meta });
  },

  replaceState: (next) => {
    const meta = { ...get().meta, ...(next.meta ?? {}) };
    // 导入后默认激活第一个 profile
    if (
      !meta.activeProfileId ||
      !next.profiles.find((p) => p.id === meta.activeProfileId)
    ) {
      meta.activeProfileId = next.profiles[0]?.id ?? null;
    }
    set({ profiles: next.profiles, meta });
    void persist({ profiles: next.profiles, meta });
  },
}));
