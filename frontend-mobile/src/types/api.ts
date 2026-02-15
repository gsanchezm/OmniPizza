export interface Pizza {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  base_price: number;
  currency: string;
  currency_symbol: string;
}

export interface PizzasResponse {
  pizzas: Pizza[];
}

export interface CheckoutItemPayload {
  pizza_id: string;
  quantity: number;
  size: string;
  toppings: string[];
}

export interface CheckoutPayload {
  country_code: string;
  items: CheckoutItemPayload[];
  name: string;
  address: string;
  phone: string;
  colonia?: string;
  propina?: number;
  zip_code?: string;
  plz?: string;
  prefectura?: string;
}

export interface OrderResult {
  order_id: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  currency: string;
  currency_symbol: string;
}
