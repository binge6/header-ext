import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import { detectLanguage, writeUserLang, type Lang, SUPPORTED_LANGS } from './detector';

export { SUPPORTED_LANGS };
export type { Lang };

let initialized = false;

export async function initI18n(): Promise<typeof i18n> {
  if (initialized) return i18n;
  const lng = await detectLanguage();
  await i18n.use(initReactI18next).init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    lng,
    fallbackLng: 'en-US',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  initialized = true;
  return i18n;
}

export async function setLanguage(lang: Lang): Promise<void> {
  await i18n.changeLanguage(lang);
  await writeUserLang(lang);
}

export default i18n;
