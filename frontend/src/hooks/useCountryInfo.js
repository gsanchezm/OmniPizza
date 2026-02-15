import { useEffect } from "react";
import { countryService } from "../services/country.service";
import { useCountryStore } from "../store";

export function useCountryInfo(isAuthenticated, countryCode) {
  const setCountryInfo = useCountryStore((state) => state.setCountryInfo);

  useEffect(() => {
    if (!isAuthenticated || !countryCode) return;

    let cancelled = false;

    countryService
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
  }, [countryCode, isAuthenticated, setCountryInfo]);
}
