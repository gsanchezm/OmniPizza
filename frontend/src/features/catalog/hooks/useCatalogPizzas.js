import { useCallback, useEffect, useMemo, useState } from "react";
import { createPizzaRepository } from "../repositories/pizzaRepository";

export function useCatalogPizzas(countryCode, language, repository) {
  const repo = useMemo(
    () => repository || createPizzaRepository(),
    [repository],
  );
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPizzas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await repo.getCatalog();
      setPizzas(response.data?.pizzas || []);
    } catch {
      setError("Failed to load catalog");
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    loadPizzas();
  }, [countryCode, language, loadPizzas]);

  return { pizzas, loading, error, reload: loadPizzas };
}
