import { useEffect } from "react";
import { Linking } from "react-native";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { useAppStore, type CountryCode } from "../store/useAppStore";
import type { RootStackParamList } from "../navigation/types";

const VALID_MARKETS: CountryCode[] = ["US", "MX", "CH", "JP"];

/**
 * Parses query string from a deep link URL into a plain string record.
 * e.g. "omnipizza://checkout?market=MX&lang=es" → { market: "MX", lang: "es" }
 */
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
  const { setCountry, setLanguage, clearCart } = useAppStore();

  function applyParams(url: string) {
    const params = parseParams(url);

    // resetSession takes priority — clear auth state and go to Login
    if (params.resetSession === "true") {
      useAppStore.getState().logout();
      // Use a short delay so navigation is guaranteed ready after cold start
      setTimeout(() => {
        if (navRef.isReady()) {
          navRef.reset({ index: 0, routes: [{ name: "Login" }] });
        }
      }, 0);
      return;
    }

    // Apply market — setCountry already clears the cart and resets language
    if (params.market) {
      const market = params.market.toUpperCase() as CountryCode;
      if (VALID_MARKETS.includes(market)) {
        setCountry(market);
      }
    }

    // Apply lang — only has effect when country is CH (store guards this)
    if (params.lang === "fr" || params.lang === "de") {
      setLanguage(params.lang);
    }

    // hydrateCart: clear local cart so CheckoutScreen fetches from API on mount
    if (params.hydrateCart === "true") {
      clearCart();
    }
  }

  useEffect(() => {
    // Cold start: app opened via deep link while not running
    Linking.getInitialURL().then((url) => {
      if (url) applyParams(url);
    });

    // Warm start: deep link received while app is already running
    const subscription = Linking.addEventListener("url", ({ url }) =>
      applyParams(url)
    );

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
