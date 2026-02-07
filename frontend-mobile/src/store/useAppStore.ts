import { create } from "zustand";

export type CountryCode = "MX" | "US" | "CH" | "JP";
export type LanguageCode = "es" | "en" | "de" | "fr" | "ja";

type PaymentType = "ONLINE_CARD" | "DELIVERY_CASH" | "DELIVERY_CARD";

export interface ProfileState {
  fullName: string;
  address: string;
  phone: string;
  notes: string;
}

export interface CartItem {
  pizza_id: string;
  quantity: number;
  pizza: any; // si tienes un tipo Pizza, cámbialo aquí
}

export interface OrderState {
  order_id: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  currency_symbol: string;
  paymentType?: PaymentType;
  // puedes agregar más campos si tu backend devuelve otros
}

interface AppState {
  // auth / context
  country: CountryCode;
  language: LanguageCode; // para CH usaremos de/fr
  token: string | null;

  // profile
  profile: ProfileState;

  // cart
  cartItems: CartItem[];

  // last order
  lastOrder: OrderState | null;

  // setters
  setCountry: (c: CountryCode) => void;
  setLanguage: (lang: "de" | "fr") => void; // solo CH
  setToken: (t: string | null) => void;
  logout: () => void;

  setProfile: (patch: Partial<ProfileState>) => void;

  addToCart: (pizza: any) => void;
  removeFromCart: (pizzaId: string) => void;
  clearCart: () => void;

  setLastOrder: (order: OrderState) => void;
  clearLastOrder: () => void;
}

const MARKET_DEFAULT_LANG: Record<CountryCode, LanguageCode> = {
  MX: "es",
  US: "en",
  CH: "de", // CH default DE
  JP: "ja",
};

export const useAppStore = create<AppState>((set, get) => ({
  // defaults
  country: "MX",
  language: "es",
  token: null,

  profile: {
    fullName: "",
    address: "",
    phone: "",
    notes: "",
  },

  cartItems: [],
  lastOrder: null,

  // country change
  setCountry: (country) =>
    set((state) => {
      // Si cambia a CH, mantener DE/FR si ya estaba seteado en state.language.
      // Si NO es CH, usa el default del market.
      const nextLanguage: LanguageCode =
        country === "CH"
          ? state.language === "fr"
            ? "fr"
            : "de"
          : MARKET_DEFAULT_LANG[country];

      return {
        country,
        language: nextLanguage,
      };
    }),

  // language change (solo CH)
  setLanguage: (lang) =>
    set((state) => {
      if (state.country !== "CH") return {}; // ignore fuera de CH
      const next: LanguageCode = lang === "fr" ? "fr" : "de";
      return { language: next };
    }),

  // token
  setToken: (token) => set({ token }),

  logout: () =>
    set({
      token: null,
      cartItems: [],
      lastOrder: null,
      // profile: opcional reset, yo lo dejo para que no pierdas datos
    }),

  // profile
  setProfile: (patch) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...patch,
      },
    })),

  // cart
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

  clearCart: () => set({ cartItems: [] }),

  // orders
  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
