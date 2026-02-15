import { apiClient } from "../api/client";
import type { Pizza, PizzasResponse } from "../types/api";

export const pizzaService = {
  async getPizzas(): Promise<Pizza[]> {
    // Calling real backend. Interceptors in apiClient handle X-Country-Code and X-Language headers.
    const response = await apiClient.get<PizzasResponse>("/api/pizzas");
    return response.data?.pizzas || [];
  },
};
