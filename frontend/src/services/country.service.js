import httpClient from "./httpClient";

export const countryService = {
  getCountries: () => httpClient.get("/api/countries"),
  getCountryInfo: (code) => httpClient.get(`/api/countries/${code}`),
};
