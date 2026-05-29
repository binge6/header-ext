import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import { detectLanguage, writeUserLang, type Lang, SUPPORTED_LANGS } from './detector';

export { SUPPORTED_LANGS };
export type { Lang };

// 同步注册 initReactI18next，避免组件首次渲染时 useTranslation 拿不到实例
// 异步的语言探测结果在 initI18n() 中通过 changeLanguage 应用
i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: 'en-US',
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  returnNull: false,
});

let detected = false;

export async function initI18n(): Promise<typeof i18n> {
  if (detected) return i18n;
  detected = true;
  const lng = await detectLanguage();
  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }
  return i18n;
}

export async function setLanguage(lang: Lang): Promise<void> {
  await i18n.changeLanguage(lang);
  await writeUserLang(lang);
}

export default i18n;
