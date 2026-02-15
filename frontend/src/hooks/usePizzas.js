import { useCallback, useEffect, useState } from "react";
import { pizzaService } from "../services/pizza.service";

export function usePizzas(countryCode, language) {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPizzas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await pizzaService.getPizzas();
      setPizzas(response.data?.pizzas || []);
    } catch {
      setError("Failed to load catalog");
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPizzas();
  }, [countryCode, language, loadPizzas]);

  return { pizzas, loading, error, reload: loadPizzas };
}
