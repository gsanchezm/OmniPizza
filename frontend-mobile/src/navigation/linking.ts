import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

/**
 * React Navigation deep linking configuration for the OmniPizza app.
 *
 * Supported URLs:
 *   omnipizza://login
 *   omnipizza://catalog
 *   omnipizza://pizza-builder
 *   omnipizza://checkout
 *   omnipizza://order-success
 *   omnipizza://profile
 *
 * All routes accept the following optional query params:
 *   market      — country code (US | MX | CH | JP)
 *   lang        — language code (en | es | de | fr | ja)
 *
 * Route-specific params:
 *   pizza-builder:  pizzaId, size
 *   checkout:       hydrateCart=true
 *   order-success:  orderId
 *
 * Side-effect params (processed by useDeepLinkParams, not Navigation):
 *   resetSession=true  — clears auth + cart, redirects to Login
 *   hydrateCart=true   — clears local cart so CheckoutScreen hydrates from API
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["omnipizza://"],
  config: {
    screens: {
      Login: "login",
      Catalog: "catalog",
      PizzaBuilder: "pizza-builder",
      Checkout: "checkout",
      OrderSuccess: "order-success",
      Profile: "profile",
    },
  },
};

export default linking;
