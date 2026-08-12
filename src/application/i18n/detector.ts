// 语言探测：用户偏好 → browser.i18n → 默认 en-US

import { getUILanguage, storageLocal } from "@/src/platform/browser";

export const SUPPORTED_LANGS = ["zh-CN", "en-US"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const LANG_KEY = "app:lang";

export async function readUserLang(): Promise<Lang | null> {
  const stored = await storageLocal.get<Lang>(LANG_KEY);
  if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) {
    return stored;
  }
  return null;
}

export async function writeUserLang(lang: Lang): Promise<void> {
  await storageLocal.set(LANG_KEY, lang);
}

export async function detectLanguage(): Promise<Lang> {
  const stored = await readUserLang();
  if (stored) return stored;

  const ui = getUILanguage();
  if (ui.toLowerCase().startsWith("zh")) return "zh-CN";
  return "en-US";
}
