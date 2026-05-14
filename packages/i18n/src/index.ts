import type { Language } from '@parity/core';
import { en } from './en';
import { es } from './es';
import { pt } from './pt';

export const TRANSLATIONS = { en, es, pt };

export const getTranslation = (lang: Language, key: any): string => {
  return (TRANSLATIONS[lang] as any)?.[key] ?? (TRANSLATIONS['en'] as any)?.[key] ?? key;
};

export type { Language };
export { en, es, pt };
