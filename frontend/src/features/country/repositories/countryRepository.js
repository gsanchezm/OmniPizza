import { countryService } from "../../../services/country.service";

export function createCountryRepository(service = countryService) {
  return {
    getCountries() {
      return service.getCountries();
    },
  };
}
