export type RootStackParamList = {
  Login: undefined;
  Catalog: {
    market?: string;
    lang?: string;
  } | undefined;
  PizzaBuilder: {
    // Normal navigation (from Catalog)
    mode?: "add" | "edit";
    pizza?: {
      id: string | number;
      name?: any;
      description?: any;
      price?: number;
      base_price?: number;
      currency?: string;
      currency_symbol?: string;
      image?: string;
      [key: string]: any;
    };
    cartItemId?: string;
    initialConfig?: {
      size?: string;
      toppings?: string[];
    };
    // Deep link params
    pizzaId?: string;
    size?: string;
    market?: string;
    lang?: string;
  } | undefined;
  Checkout: {
    market?: string;
    lang?: string;
    hydrateCart?: string;
  } | undefined;
  OrderSuccess: {
    orderId?: string;
    market?: string;
    lang?: string;
  } | undefined;
  Profile: {
    market?: string;
    lang?: string;
  } | undefined;
};
