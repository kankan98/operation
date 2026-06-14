import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const NAMESPACES = [
  'common',
  'navigation',
  'dashboard',
  'products',
  'alerts',
  'chat',
  'settings',
] as const;

// Resources are imported statically (not lazy-loaded over HTTP) so translations
// are available synchronously — this keeps unit tests working without a provider.
const resources = { en, zh } as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    load: 'languageOnly', // map zh-CN / zh-TW / zh-HK -> zh
    interpolation: { escapeValue: false },
    detection: {
      // localStorage first, then the browser language
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

export default i18n;
