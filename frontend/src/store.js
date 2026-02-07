import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MARKET = {
  MX: { locale: 'es-MX', currency: 'MXN' },
  US: { locale: 'en-US', currency: 'USD' },
  CH: { locale: 'de-CH', currency: 'CHF' }, // CH default DE (FR toggle)
  JP: { locale: 'ja-JP', currency: 'JPY' },
};

const UI_LANG_BY_MARKET = {
  MX: 'es',
  US: 'en',
  CH: 'de', // can toggle to fr
  JP: 'ja',
};

const pickMarket = (code) => MARKET[code] || MARKET.MX;

export const useCountryStore = create(
  persist(
    (set, get) => {
      const initialCode = localStorage.getItem('countryCode') || 'MX';
      const cfg = pickMarket(initialCode);

      return {
        countryCode: initialCode,
        countryInfo: null,

        // ✅ UI siempre inicia en inglés
        language: 'en',

        // ✅ locale/currency SIEMPRE siguen el mercado (para precios/moneda correctos)
        locale: cfg.locale,
        currency: cfg.currency,

        setCountryCode: (code) => {
          const next = pickMarket(code);
          localStorage.setItem('countryCode', code);

          // al cambiar market, se aplica el idioma predefinido
          let lang = UI_LANG_BY_MARKET[code] || 'en';

          // CH: si ya hubo toggle guardado, úsalo
          if (code === 'CH') {
            const saved = localStorage.getItem('chLang');
            if (saved === 'fr' || saved === 'de') lang = saved;
          }

          set({
            countryCode: code,
            language: lang,
            locale: code === 'CH' ? (lang === 'fr' ? 'fr-CH' : 'de-CH') : next.locale,
            currency: next.currency,
            countryInfo: null,
          });
        },

        // ✅ solo CH: DE/FR
        setLanguage: (lang) => {
          const { countryCode } = get();
          if (countryCode !== 'CH') return;

          const valid = lang === 'fr' ? 'fr' : 'de';
          localStorage.setItem('chLang', valid);

          set({
            language: valid,
            locale: valid === 'fr' ? 'fr-CH' : 'de-CH',
          });
        },

        setCountryInfo: (info) => set({ countryInfo: info }),
      };
    },
    { name: 'omnipizza-country' }
  )
);
