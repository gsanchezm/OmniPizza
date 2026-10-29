// Delivery fee per market in local currency (USD 2.00 converted with the backend's
// CURRENCY_RATES). Used only until GET /api/countries has populated countryInfo.
export const FALLBACK_DELIVERY_FEE_BY_COUNTRY = {
  MX: 35.1,
  US: 2,
  CH: 1.56,
  JP: 316,
  SA: 7.5,
};
