import { apiClient } from "../api/client";

export interface EnrichedCartItem {
  pizza_id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  base_price: number;
  currency: string;
  currency_symbol: string;
  image: string;
}

export interface CartResponse {
  username: string;
  country_code: string;
  cart_items: EnrichedCartItem[];
  updated_at: string;
}

export const cartService = {
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>("/api/cart");
    return response.data;
  },
};
