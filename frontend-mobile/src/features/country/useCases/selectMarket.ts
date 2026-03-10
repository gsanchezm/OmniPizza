import type { CountryCode } from "../../../store/useAppStore";

export function selectMarket(
  market: CountryCode,
  setCountry: (country: CountryCode) => void,
) {
  setCountry(market);
}
