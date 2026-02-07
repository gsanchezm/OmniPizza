import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MARKET = {
  MX: { lang: 'es', locale: 'es-MX', currency: 'MXN' },
  US: { lang: 'en', locale: 'en-US', currency: 'USD' },
  CH: { lang: 'de', locale: 'de-CH', currency: 'CHF' }, // CH default DE (FR toggle)
  JP: { lang: 'ja', locale: 'ja-JP', currency: 'JPY' },
};

const pickMarket = (code) => MARKET[code] || MARKET.MX;

/** -----------------------
 * AUTH STORE
 * ---------------------- */
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: !!localStorage.getItem('token'),
      token: localStorage.getItem('token') || null,
      username: localStorage.getItem('username') || null,
      behavior: null,

      login: (token, username, behavior) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        set({ isAuthenticated: true, token, username, behavior });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        set({ isAuthenticated: false, token: null, username: null, behavior: null });
      },
    }),
    { name: 'omnipizza-auth' }
  )
);

/** -----------------------
 * COUNTRY STORE (incluye CH DE/FR)
 * ---------------------- */
export const useCountryStore = create(
  persist(
    (set, get) => {
      const initialCode = localStorage.getItem('countryCode') || 'MX';
      const cfg = pickMarket(initialCode);

      // si CH, mantener idioma guardado
      const savedCh = localStorage.getItem('chLang');
      const initialLang =
        initialCode === 'CH' && (savedCh === 'fr' || savedCh === 'de') ? savedCh : cfg.lang;

      const initialLocale =
        initialCode === 'CH'
          ? (initialLang === 'fr' ? 'fr-CH' : 'de-CH')
          : cfg.locale;

      return {
        countryCode: initialCode,
        countryInfo: null,

        language: initialLang,
        locale: initialLocale,
        currency: cfg.currency,

        setCountryCode: (code) => {
          const next = pickMarket(code);
          localStorage.setItem('countryCode', code); // ✅ CLAVE: arregla headers / moneda

          let lang = next.lang;
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

        // ✅ Solo CH: alterna DE/FR
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

/** -----------------------
 * CART STORE
 * ---------------------- */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { pizza_id, pizza, quantity }

      addItem: (pizza) => {
        const id = pizza?.id;
        if (!id) return;

        const items = get().items;
        const found = items.find((i) => i.pizza_id === id);

        if (found) {
          set({
            items: items.map((i) =>
              i.pizza_id === id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { pizza_id: id, pizza, quantity: 1 }] });
        }
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: 'omnipizza-cart' }
  )
);

/** -----------------------
 * PROFILE STORE
 * ---------------------- */
export const useProfileStore = create(
  persist(
    (set) => ({
      fullName: '',
      address: '',
      phone: '',
      notes: '',
      setProfile: (patch) => set(patch),
    }),
    { name: 'omnipizza-profile' }
  )
);

/** -----------------------
 * ORDER STORE
 * ---------------------- */
export const useOrderStore = create(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    { name: 'omnipizza-order' }
  )
);
