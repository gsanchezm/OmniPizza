import { useCountryStore } from './store';

import en from './i18n/locales/en.json';
import es from './i18n/locales/es.json';
import de from './i18n/locales/de.json';
import fr from './i18n/locales/fr.json';
import ja from './i18n/locales/ja.json';

const DICT = {
  en,
  es,
  de,
  fr,
  ja,
};

export function useT() {
  const lang = useCountryStore((s) => s.language) || 'en';
  return (key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key;
}