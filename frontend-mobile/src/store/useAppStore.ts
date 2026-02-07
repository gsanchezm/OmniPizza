import { create } from "zustand";

export type CountryCode = "MX" | "US" | "CH" | "JP";
export type LanguageCode = "en" | "es" | "de" | "fr" | "ja";

export type PaymentType = "ONLINE_CARD" | "DELIVERY_CASH" | "DELIVERY_CARD";

export interface ProfileState {
  fullName: string;
  address: string;
  phone: string;
  notes: string;
}

export interface CartItem {
  pizza_id: string;
  quantity: number;
  pizza: any; // si tienes tipo Pizza, reemplázalo aquí
}

export interface LastOrder {
  order_id: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  currency_symbol: string;
  paymentType?: PaymentType;
}

interface AppState {
  // context
  country: CountryCode;

  /**
   * UI language:
   * - starts ALWAYS "en"
   * - changes when market changes (MX->es, JP->ja, etc.)
   */
  language: LanguageCode;

  /**
   * CH preference (DE/FR) stored separately so it survives switching markets.
   * - default: "de"
   */
  chLanguage: "de" | "fr";

  // auth
  token: string | null;

  // profile
  profile: ProfileState;

  // cart
  cartItems: CartItem[];

  // orders
  lastOrder: LastOrder | null;

  // actions
  setCountry: (c: CountryCode) => void;
  setLanguage: (lang: "de" | "fr") => void; // only CH
  setToken: (t: string | null) => void;
  logout: () => void;

  setProfile: (patch: Partial<ProfileState>) => void;

  addToCart: (pizza: any) => void;
  removeFromCart: (pizzaId: string) => void;
  setQty: (pizzaId: string, qty: number) => void;
  clearCart: () => void;

  setLastOrder: (order: LastOrder) => void;
  clearLastOrder: () => void;
}

const MARKET_DEFAULT_LANG: Record<CountryCode, LanguageCode> = {
  MX: "es",
  US: "en",
  CH: "de", // real default for CH is DE (FR toggle)
  JP: "ja",
};

export const useAppStore = create<AppState>((set, get) => ({
  // Defaults
  country: "MX",
  language: "en",      // ✅ ALWAYS start in English
  chLanguage: "de",    // ✅ CH preference, default DE
  token: null,

  profile: {
    fullName: "",
    address: "",
    phone: "",
    notes: "",
  },

  cartItems: [],
  lastOrder: null,

  /**
   * Market change:
   * - Switch UI language to market default
   * - CH uses stored preference (de/fr)
   */
  setCountry: (country) =>
    set((state) => {
      let nextLang: LanguageCode;

      if (country === "CH") {
        // Use CH stored preference
        nextLang = state.chLanguage;
      } else {
        nextLang = MARKET_DEFAULT_LANG[country] ?? "en";
      }

      return {
        country,
        language: nextLang,
      };
    }),

  /**
   * Only for CH:
   * - Updates current language AND stored CH preference
   */
  setLanguage: (lang) =>
    set((state) => {
      if (state.country !== "CH") return {};
      const valid: "de" | "fr" = lang === "fr" ? "fr" : "de";
      return {
        chLanguage: valid,
        language: valid,
      };
    }),

  // Auth
  setToken: (token) => set({ token }),

  logout: () =>
    set({
      token: null,
      cartItems: [],
      lastOrder: null,
      // profile: lo dejamos para que no pierdas datos de entrega
      // country/language: se mantiene
    }),

  // Profile
  setProfile: (patch) =>
    set((state) => ({
      profile: { ...state.profile, ...patch },
    })),

  // Cart
  addToCart: (pizza) =>
    set((state) => {
      const id = String(pizza?.id ?? pizza?.pizza_id ?? "");
      if (!id) return {};

      const found = state.cartItems.find((i) => i.pizza_id === id);

      if (found) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.pizza_id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }

      return {
        cartItems: [...state.cartItems, { pizza_id: id, quantity: 1, pizza }],
      };
    }),

  removeFromCart: (pizzaId) =>
    set((state) => ({
      cartItems: state.cartItems
        .map((i) =>
          i.pizza_id === pizzaId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),

  setQty: (pizzaId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { cartItems: state.cartItems.filter((i) => i.pizza_id !== pizzaId) };
      }
      return {
        cartItems: state.cartItems.map((i) =>
          i.pizza_id === pizzaId ? { ...i, quantity: qty } : i
        ),
      };
    }),

  clearCart: () => set({ cartItems: [] }),

  // Orders
  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
