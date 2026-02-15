import { useCallback, useEffect, useState } from "react";
import { pizzaService } from "../services/pizza.service";
import type { Pizza } from "../types/api";

export function usePizzas(country: string, language: string) {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const loadPizzas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await pizzaService.getPizzas();
      setPizzas(data);
    } catch (err) {
      console.log("Failed to load /api/pizzas", err);
      setPizzas([]);
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPizzas();
  }, [country, language, loadPizzas]);

  return {
    pizzas,
    loading,
    error,
    reload: loadPizzas,
  };
}
