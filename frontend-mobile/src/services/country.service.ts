import { apiClient } from "../api/client";

export interface CountryInfo {
  code: string;
  currency: string;
  currency_symbol: string;
  required_fields: string[];
  optional_fields: string[];
  tip_field: string;
  tip_mode: "percentage";
  tip_percentages: number[];
  tax_rate: number;
  delivery_fee: number;
  languages: string[];
  decimal_places: number;
}

export const countryService = {
  async getCountries(): Promise<CountryInfo[]> {
    const response = await apiClient.get<CountryInfo[]>("/api/countries");
    return response.data;
  },
};
