import httpClient from "./services/httpClient";
import { authService } from "./services/auth.service";
import { countryService } from "./services/country.service";
import { orderService } from "./services/order.service";
import { pizzaService } from "./services/pizza.service";

export const authAPI = {
  login: authService.login,
  getTestUsers: authService.getTestUsers,
  profile: authService.getProfile,
};

export const pizzaAPI = pizzaService;
export const orderAPI = orderService;
export const countryAPI = countryService;

export default httpClient;
