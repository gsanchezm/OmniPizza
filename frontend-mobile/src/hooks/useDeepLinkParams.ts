import { useEffect, useLayoutEffect } from "react";
import { Linking } from "react-native";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useAppStore, type CountryCode } from "../store/useAppStore";
import type { RootStackParamList } from "../navigation/types";

const VALID_MARKETS: CountryCode[] = ["US", "MX", "CH", "JP"];

const ROUTE_MAP: Record<string, keyof RootStackParamList> = {
  checkout: "Checkout",
  catalog: "Catalog",
  "pizza-builder": "PizzaBuilder",
  "order-success": "OrderSuccess",
  profile: "Profile",
  login: "Login",
};

function extractRouteName(url: string): keyof RootStackParamList | null {
  try {
    const routePart = url.replace("omnipizza://", "").split("?")[0];
    return ROUTE_MAP[routePart] ?? null;
  } catch {
    return null;
  }
}

function parseParams(url: string): Record<string, string> {
  try {
    const queryStart = url.indexOf("?");
    if (queryStart === -1) return {};
    return Object.fromEntries(
      url
        .slice(queryStart + 1)
        .split("&")
        .filter(Boolean)
        .map((pair) => {
          const eq = pair.indexOf("=");
          if (eq === -1) return [decodeURIComponent(pair), ""];
          return [
            decodeURIComponent(pair.slice(0, eq)),
            decodeURIComponent(pair.slice(eq + 1)),
          ];
        })
    );
  } catch {
    return {};
  }
}

/**
 * Processes deep link query params and applies side effects to app state.
 *
 * Handled params:
 *   market=US|MX|CH|JP  → setCountry (also resets language to market default)
 *   lang=de|fr          → setLanguage (CH only; guard is inside store)
 *   resetSession=true   → logout + navigate to Login
 *   hydrateCart=true    → clearCart so CheckoutScreen hydration runs on mount
 *
 * React Navigation's linking config handles URL → screen routing automatically.
 * This hook only handles the state side effects that Navigation cannot do on its own.
 */
export function useDeepLinkParams(
  navRef: NavigationContainerRefWithCurrent<RootStackParamList>
) {
  function applyParams(url: string) {
    const params = parseParams(url);
    // Grab latest store actions imperatively so side-effects fire synchronously
    // without waiting for React re-render cycles.
    const store = useAppStore.getState();

    if (__DEV__) {
      console.log("[useDeepLinkParams] url:", url, "params:", params);
    }

    // resetSession takes priority — clear auth state and go to Login
    if (params.resetSession === "true") {
      store.logout();
      setTimeout(() => {
        if (navRef.isReady()) {
          navRef.reset({ index: 0, routes: [{ name: "Login" }] });
        }
      }, 0);
      return;
    }

    // 1) accessToken FIRST — must be in the store before any downstream fetch
    //    (CheckoutScreen hydrates on mount and needs Authorization header).
    if (params.accessToken) {
      store.setToken(params.accessToken);
    }

    // 2) market — setCountry clears cart and resets language to market default
    if (params.market) {
      const market = params.market.toUpperCase() as CountryCode;
      if (VALID_MARKETS.includes(market)) {
        store.setCountry(market);
      }
    }

    // 3) lang override — only has effect when country is CH (store guards this)
    if (params.lang === "fr" || params.lang === "de") {
      store.setLanguage(params.lang);
    }

    // 4) hydrateCart — clear local cart so CheckoutScreen fetches from API on mount
    if (params.hydrateCart === "true") {
      store.clearCart();
    }
  }

  // useLayoutEffect fires before useEffect in child screens, giving us the
  // earliest possible window to set the token on cold start.
  useLayoutEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) applyParams(url);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Warm start: deep link received while app is already running
    const subscription = Linking.addEventListener("url", ({ url }) =>
      applyParams(url)
    );
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
