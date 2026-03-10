import { createPizzaRepository } from "../repositories/pizzaRepository";

export async function getCatalogPizzas(repository = createPizzaRepository()) {
  return repository.getCatalog();
}
