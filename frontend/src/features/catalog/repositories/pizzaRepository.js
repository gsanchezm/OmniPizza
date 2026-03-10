import { pizzaService } from "../../../services/pizza.service";

export function createPizzaRepository(service = pizzaService) {
  return {
    getCatalog() {
      return service.getPizzas();
    },
  };
}
