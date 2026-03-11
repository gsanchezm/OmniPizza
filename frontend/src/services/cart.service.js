import httpClient from "./httpClient";

export const cartService = {
  getCart: () => httpClient.get("/api/cart"),
};
