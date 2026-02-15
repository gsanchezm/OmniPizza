import { create } from "zustand";
import type { Pizza } from "../types/api";

export type CountryCode = "MX" | "US" | "CH" | "JP";
export type LanguageCode = "en" | "es" | "de" | "fr" | "ja";
export type PizzaSize = "small" | "medium" | "large" | "family";

export interface ProfileState {
  fullName: string;
  address: string;
  phone: string;
  notes: string;
}

export interface PizzaConfig {
  size: PizzaSize;
  toppings: string[];
}

export interface CartItem {
  id: string;
  signature: string;
  pizza_id: string;
  pizza: Pizza;
  quantity: number;
  config: PizzaConfig;
  unit_price: number; // local currency unit price
  currency: string;
  currency_symbol: string;
}

export interface LastOrder {
  order_id: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  currency_symbol: string;
}

interface AppState {
  country: CountryCode;
  language: LanguageCode;
  chLanguage: "de" | "fr";
  token: string | null;

  profile: ProfileState;

  cartItems: CartItem[];
  lastOrder: LastOrder | null;

  setCountry: (c: CountryCode) => void;
  setLanguage: (lang: "de" | "fr") => void; // only CH
  setToken: (t: string | null) => void;
  logout: () => void;

  setProfile: (patch: Partial<ProfileState>) => void;

  addConfiguredItem: (pizza: Pizza, config: PizzaConfig, unitPrice: number) => void;
  removeCartItem: (id: string) => void;
  updateCartItem: (id: string, patch: Partial<CartItem>) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;

  setLastOrder: (order: LastOrder) => void;
  clearLastOrder: () => void;
}

const MARKET_LANG: Record<CountryCode, LanguageCode> = {
  MX: "es",
  US: "en",
  CH: "de",
  JP: "ja",
};

function makeId() {
  return `item_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  country: "MX",
  language: "en",      // starts in English
  chLanguage: "de",
  token: null,

  profile: { fullName: "", address: "", phone: "", notes: "" },

  cartItems: [],
  lastOrder: null,

  setCountry: (country) =>
    set((state) => {
      let nextLang: LanguageCode;
      if (country === "CH") nextLang = state.chLanguage; // keep DE/FR preference
      else nextLang = MARKET_LANG[country] ?? "en";
      return { country, language: nextLang };
    }),

  setLanguage: (lang) =>
    set((state) => {
      if (state.country !== "CH") return {};
      const valid = lang === "fr" ? "fr" : "de";
      return { chLanguage: valid, language: valid };
    }),

  setToken: (token) => set({ token }),

  logout: () =>
    set({
      token: null,
      cartItems: [],
      lastOrder: null,
    }),

  setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

  addConfiguredItem: (pizza, config, unitPrice) =>
    set((state) => {
      const pizzaId = String(pizza?.id ?? "");
      if (!pizzaId) return {};

      const signature = `${pizzaId}|${config.size}|${(config.toppings || []).slice().sort().join(",")}`;
      const existing = state.cartItems.find((i) => i.signature === signature);

      if (existing) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.signature === signature ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }

      const id = makeId();
      return {
        cartItems: [
          ...state.cartItems,
          {
            id,
            signature,
            pizza_id: pizzaId,
            pizza,
            quantity: 1,
            config,
            unit_price: unitPrice,
            currency: pizza.currency,
            currency_symbol: pizza.currency_symbol,
          },
        ],
      };
    }),

  removeCartItem: (id) =>
    set((state) => ({ cartItems: state.cartItems.filter((i) => i.id !== id) })),

  updateCartItem: (id, patch) =>
    set((state) => ({
      cartItems: state.cartItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),

  setQty: (id, qty) =>
    set((state) => {
      if (qty <= 0) return { cartItems: state.cartItems.filter((i) => i.id !== id) };
      return { cartItems: state.cartItems.map((i) => (i.id === id ? { ...i, quantity: qty } : i)) };
    }),

  clearCart: () => set({ cartItems: [] }),

  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
