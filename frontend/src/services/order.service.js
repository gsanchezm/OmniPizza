import httpClient from "./httpClient";

export const orderService = {
  checkout: (payload) => httpClient.post("/api/checkout", payload),
  getOrders: () => httpClient.get("/api/orders"),
  getOrder: (orderId) => httpClient.get(`/api/orders/${orderId}`),
};
