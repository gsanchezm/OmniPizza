import { useEffect } from "react";
import { pizzaService } from "../services/pizza.service";
import { useCartStore } from "../store";
import { computeUnitPrice } from "../utils/pizzaPricing";
import { SIZE_OPTIONS } from "../constants/pizza";

export function useRefreshCartPrices(countryCode, language) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await pizzaService.getPizzas();
        const pizzas = response.data?.pizzas || [];
        const pizzasById = Object.fromEntries(pizzas.map((pizza) => [pizza.id, pizza]));

        const currentItems = useCartStore.getState().items;
        if (!currentItems.length) return;

        const updatedItems = currentItems.map((item) => {
          const pizza = pizzasById[item.pizza_id] || item.pizza;
          const sizeOption =
            SIZE_OPTIONS.find((option) => option.id === (item.config?.size || "small")) ||
            SIZE_OPTIONS[0];
          const pricing = computeUnitPrice(
            pizza,
            sizeOption.usd,
            (item.config?.toppings || []).length,
          );

          return {
            ...item,
            pizza,
            unit_price: pricing.unitPrice,
            currency: pizza.currency,
            currency_symbol: pizza.currency_symbol,
          };
        });

        if (!cancelled) {
          useCartStore.setState({ items: updatedItems });
        }
      } catch {
        // checkout remains usable even when refresh fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [countryCode, language]);
}
