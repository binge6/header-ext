// 浏览器 API 薄封装：统一通过 wxt 注入的全局 `browser`，收口 Chrome / Firefox 差异
// 借助 wxt 注入的 Browser 命名空间类型，避免 any。

import type { Browser } from "wxt/browser";

// DNR 头部修改操作类型（直接复用 wxt 注入类型）
export type DnrHeaderAction = Browser.declarativeNetRequest.ModifyHeaderInfo;
export type DnrRule = Browser.declarativeNetRequest.Rule;

export const dnr = {
  async updateDynamicRules(opts: {
    removeRuleIds?: number[];
    addRules?: DnrRule[];
  }): Promise<void> {
    await browser.declarativeNetRequest.updateDynamicRules(opts);
  },
  async getDynamicRules(): Promise<DnrRule[]> {
    return browser.declarativeNetRequest.getDynamicRules();
  },
  async updateSessionRules(opts: {
    removeRuleIds?: number[];
    addRules?: DnrRule[];
  }): Promise<void> {
    await browser.declarativeNetRequest.updateSessionRules(opts);
  },
  async getSessionRules(): Promise<DnrRule[]> {
    return browser.declarativeNetRequest.getSessionRules();
  },
};

export const storageLocal = {
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const obj = (await browser.storage.local.get(key)) as Record<string, T>;
    return obj[key];
  },
  async set(key: string, value: unknown): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  },
  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  },
  onChanged(
    handler: (changes: Record<string, Browser.storage.StorageChange>) => void,
  ): () => void {
    const listener = (
      changes: Record<string, Browser.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === "local") handler(changes);
    };
    browser.storage.onChanged.addListener(listener);
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  },
};

export function getUILanguage(): string {
  try {
    return browser.i18n?.getUILanguage?.() ?? "en-US";
  } catch {
    return "en-US";
  }
}

export async function openOptionsPage(): Promise<void> {
  await browser.runtime.openOptionsPage();
}

export interface ActiveTab {
  id: number | null;
  url: string;
}

export async function getActiveTab(): Promise<ActiveTab> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return {
    id: tab?.id ?? null,
    url: tab?.url ?? "",
  };
}

export function onExtensionInstalled(handler: () => void): () => void {
  browser.runtime.onInstalled.addListener(handler);
  return () => browser.runtime.onInstalled.removeListener(handler);
}
