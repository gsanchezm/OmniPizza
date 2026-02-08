import { create } from "zustand";
import { persist } from "zustand/middleware";

/** =========================
 * AUTH STORE
 * ========================= */
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: !!localStorage.getItem("token"),
      token: localStorage.getItem("token") || null,
      username: localStorage.getItem("username") || null,
      behavior: null,

      login: (token, username, behavior) => {
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);
        set({ isAuthenticated: true, token, username, behavior });
      },

      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        set({ isAuthenticated: false, token: null, username: null, behavior: null });
      },
    }),
    { name: "omnipizza-auth" }
  )
);

/** =========================
 * COUNTRY / LANGUAGE STORE
 * - Starts ALWAYS in English
 * - Changes language when market changes
 * - CH supports DE/FR toggle
 * ========================= */
const MARKET = {
  MX: { locale: "es-MX", currency: "MXN" },
  US: { locale: "en-US", currency: "USD" },
  CH: { locale: "de-CH", currency: "CHF" },
  JP: { locale: "ja-JP", currency: "JPY" },
};

const DEFAULT_LANG_BY_MARKET = {
  MX: "es",
  US: "en",
  CH: "de",
  JP: "ja",
};

const pickMarket = (code) => MARKET[code] || MARKET.MX;

export const useCountryStore = create(
  persist(
    (set, get) => {
      const initialCode = localStorage.getItem("countryCode") || "MX";
      const cfg = pickMarket(initialCode);

      return {
        countryCode: initialCode,
        countryInfo: null,

        // ✅ App starts ALWAYS in English
        language: "en",

        // locale/currency follow the country (for formatting)
        locale: cfg.locale,
        currency: cfg.currency,

        setCountryCode: (code) => {
          localStorage.setItem("countryCode", code); // ✅ CRITICAL for headers
          const next = pickMarket(code);

          // switch UI language to market default on change
          let lang = DEFAULT_LANG_BY_MARKET[code] || "en";

          // CH: respect saved DE/FR preference if exists
          if (code === "CH") {
            const saved = localStorage.getItem("chLang");
            if (saved === "fr" || saved === "de") lang = saved;
          }

          set({
            countryCode: code,
            language: lang,
            locale: code === "CH" ? (lang === "fr" ? "fr-CH" : "de-CH") : next.locale,
            currency: next.currency,
            countryInfo: null,
          });
        },

        // ✅ Only CH: toggle DE/FR
        setLanguage: (lang) => {
          const { countryCode } = get();
          if (countryCode !== "CH") return;

          const valid = lang === "fr" ? "fr" : "de";
          localStorage.setItem("chLang", valid);

          set({
            language: valid,
            locale: valid === "fr" ? "fr-CH" : "de-CH",
          });
        },

        setCountryInfo: (info) => set({ countryInfo: info }),
      };
    },
    { name: "omnipizza-country" }
  )
);

/** =========================
 * CART STORE
 * ========================= */
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
    { name: "omnipizza-cart" }
  )
);

/** =========================
 * PROFILE STORE
 * ========================= */
export const useProfileStore = create(
  persist(
    (set) => ({
      fullName: "",
      address: "",
      phone: "",
      notes: "",
      setProfile: (patch) => set(patch),
    }),
    { name: "omnipizza-profile" }
  )
);

/** =========================
 * ORDER STORE
 * ========================= */
export const useOrderStore = create(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    { name: "omnipizza-order" }
  )
);
