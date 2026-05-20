import { apiClient } from "../api/client";
import type { CheckoutPayload, OrderResult } from "../types/api";

export const orderService = {
  async checkout(payload: CheckoutPayload): Promise<OrderResult> {
    const response = await apiClient.post<OrderResult>("/api/checkout", payload);
    return response.data;
  },
  async getOrder(orderId: string): Promise<OrderResult> {
    const response = await apiClient.get<OrderResult>(`/api/orders/${orderId}`);
    return response.data;
  },
};
