import httpClient from "./httpClient";

export const pizzaService = {
  getPizzas: () => httpClient.get("/api/pizzas"),
};
