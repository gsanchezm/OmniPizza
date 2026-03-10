import { useEffect, useMemo } from "react";
import { useCountryStore } from "../../../store";
import { createCountryRepository } from "../repositories/countryRepository";

export function useCountryFeatureInfo(
  isAuthenticated,
  countryCode,
  repository,
) {
  const repo = useMemo(
    () => repository || createCountryRepository(),
    [repository],
  );
  const setCountryInfo = useCountryStore((state) => state.setCountryInfo);

  useEffect(() => {
    if (!isAuthenticated || !countryCode) return;

    let cancelled = false;

    repo
      .getCountries()
      .then((response) => {
        if (cancelled) return;
        const list = response.data || [];
        const found = list.find((item) => item.code === countryCode);
        if (found) setCountryInfo(found);
      })
      .catch((error) => {
        console.error("Error loading countries:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode, isAuthenticated, setCountryInfo, repo]);
}
