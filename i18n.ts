import { Language } from './types';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { pt } from './i18n/pt';

export const TRANSLATIONS = {
  en,
  es,
  pt
};

export const getTranslation = (lang: Language, key: any) => {
  return (TRANSLATIONS[lang] as any)?.[key] || (TRANSLATIONS['en'] as any)?.[key] || key;
};