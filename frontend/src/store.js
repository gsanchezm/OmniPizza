import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* =========================
   AUTH STORE
========================= */
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: !!localStorage.getItem('token'),
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username'),

      login: (token, username) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        set({ isAuthenticated: true, token, username });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        set({ isAuthenticated: false, token: null, username: null });
      },
    }),
    { name: 'omnipizza-auth' }
  )
);

/* =========================
   COUNTRY STORE
========================= */
export const useCountryStore = create(
  persist(
    (set, get) => ({
      countryCode: 'MX',
      language: 'en', // ✅ app inicia SIEMPRE en inglés
      locale: 'es-MX',
      currency: 'MXN',

      setCountryCode: (code) => {
        const MAP = {
          MX: { lang: 'es', locale: 'es-MX', currency: 'MXN' },
          US: { lang: 'en', locale: 'en-US', currency: 'USD' },
          CH: { lang: 'de', locale: 'de-CH', currency: 'CHF' },
          JP: { lang: 'ja', locale: 'ja-JP', currency: 'JPY' },
        };

        const cfg = MAP[code] ?? MAP.MX;

        set({
          countryCode: code,
          language: cfg.lang,
          locale: cfg.locale,
          currency: cfg.currency,
        });
      },

      setLanguage: (lang) => {
        // solo CH permite cambiar idioma
        if (get().countryCode === 'CH') {
          set({
            language: lang,
            locale: lang === 'fr' ? 'fr-CH' : 'de-CH',
          });
        }
      },
    }),
    { name: 'omnipizza-country' }
  )
);

/* =========================
   CART STORE
========================= */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (pizza) => {
        const found = get().items.find((i) => i.pizza_id === pizza.id);
        if (found) {
          set({
            items: get().items.map((i) =>
              i.pizza_id === pizza.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...get().items, { pizza_id: pizza.id, pizza, quantity: 1 }],
          });
        }
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: 'omnipizza-cart' }
  )
);

/* =========================
   PROFILE STORE
========================= */
export const useProfileStore = create(
  persist(
    (set) => ({
      fullName: '',
      address: '',
      phone: '',
      setProfile: (patch) => set(patch),
    }),
    { name: 'omnipizza-profile' }
  )
);

/* =========================
   ORDER STORE
========================= */
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
