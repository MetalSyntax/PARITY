import { Language } from '../types';
import { en } from './en';
import { es } from './es';
import { pt } from './pt';

export const TRANSLATIONS = {
  en,
  es,
  pt
};

export const getTranslation = (lang: Language, key: any) => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
};
