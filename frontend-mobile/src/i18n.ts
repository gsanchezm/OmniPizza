import { useAppStore } from "./store/useAppStore";

import en from "./i18n/locales/en.json";
import es from "./i18n/locales/es.json";
import de from "./i18n/locales/de.json";
import fr from "./i18n/locales/fr.json";
import ja from "./i18n/locales/ja.json";

// Type checking for the dictionary to ensure all keys are present would be nice, 
// but for now we trust the JSONs.
const DICT: Record<string, any> = {
  en,
  es,
  de,
  fr,
  ja,
};

export function useT() {
  const language = useAppStore((s) => s.language) || "en";
  return (k: string) => DICT[language]?.[k] ?? DICT.en[k] ?? k;
}
