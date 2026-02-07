import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MARKET = {
  MX: { lang: 'es', locale: 'es-MX', currency: 'MXN' },
  US: { lang: 'en', locale: 'en-US', currency: 'USD' },
  CH: { lang: 'de', locale: 'de-CH', currency: 'CHF' }, // CH default: de
  JP: { lang: 'ja', locale: 'ja-JP', currency: 'JPY' },
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

        language: cfg.lang,
        locale: cfg.locale,
        currency: cfg.currency,

        // ✅ cambio de país (esto arregla el tema de moneda/precios)
        setCountryCode: (code) => {
          const next = pickMarket(code);
          localStorage.setItem('countryCode', code);

          // CH permite DE/FR: si cambias a CH mantenemos el último idioma guardado si existe
          let lang = next.lang;
          if (code === 'CH') {
            const saved = localStorage.getItem('chLang');
            if (saved === 'fr' || saved === 'de') lang = saved;
          }

          set({
            countryCode: code,
            language: lang,
            locale: lang === 'fr' ? 'fr-CH' : next.locale,
            currency: next.currency,
            countryInfo: null,
          });
        },

        // ✅ Solo CH: alternar DE/FR
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
