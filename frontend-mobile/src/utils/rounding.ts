// Rounding contract for money amounts, shared with the API
// (backend/database.py::round_currency_amount) and web
// (frontend/src/utils/rounding.js): take the exact binary value, drop
// floating-point noise at 9 decimals (toFixed works on the exact value), then
// round half UP at the currency's decimals on the decimal digits. Amounts are
// never negative, which is what makes Math.round equal to the server's
// ROUND_HALF_UP. The previous `(value + Number.EPSILON) * 100` formula lost the
// nudge for values above 2 and could round a true half-cent down (8.54 x 25%
// = 2.135 -> 2.13).
const NOISE_DECIMALS = 9;

export function currencyDecimalPlaces(currency?: string): number {
  return currency === "JPY" ? 0 : 2;
}

export function roundCurrencyAmount(value: number, currency?: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  const places = currencyDecimalPlaces(currency);
  const clean = Number(amount.toFixed(NOISE_DECIMALS));
  const digits = String(clean);
  if (digits.includes("e")) {
    // Exponent notation only appears for |x| >= 1e21 or < 1e-6: no money amount.
    const factor = 10 ** places;
    return Math.round(clean * factor) / factor;
  }
  return Number(`${Math.round(Number(`${digits}e${places}`))}e-${places}`);
}
