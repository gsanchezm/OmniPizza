import { useCallback, useEffect, useMemo, useState } from "react";
import type { Pizza } from "../../../types/api";
import { createPizzaRepository } from "../repositories/pizzaRepository";

export function useCatalogPizzas(
  country: string,
  language: string,
  repository?: ReturnType<typeof createPizzaRepository>,
) {
  const repo = useMemo(
    () => repository || createPizzaRepository(),
    [repository],
  );
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const loadPizzas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await repo.getCatalog();
      setPizzas(data);
    } catch (err) {
      console.log("Failed to load /api/pizzas", err);
      setPizzas([]);
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [repo]);

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
