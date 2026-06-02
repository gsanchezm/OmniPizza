import { getStateFromPath as defaultGetStateFromPath } from "@react-navigation/native";
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
 * Contract alias (QA automation): `omnipizza://customizer?item=<pizzaId>&...`
 * is honored as an alias of `pizza-builder` (param `item` → `pizzaId`, read in
 * PizzaBuilderScreen). Handled in getStateFromPath below so it goes through
 * React Navigation's native cold-start routing — no imperative timing races.
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
  // Alias the contract's `customizer` path to the implemented `pizza-builder`
  // route, preserving the query string (item/market/language). Everything else
  // falls through to the default parser unchanged.
  getStateFromPath: (path, options) => {
    // Match `customizer` (optionally leading-slashed) only when it's a full
    // path segment — i.e. followed by end / `/` / `?` — preserving the query.
    const match = path.match(/^(\/?)customizer(?=$|[/?])(.*)$/);
    const aliased = match ? `${match[1]}pizza-builder${match[2]}` : path;
    return defaultGetStateFromPath(aliased, options);
  },
};

export default linking;
