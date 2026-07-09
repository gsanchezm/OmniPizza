import React, { useEffect } from "react";
import { View, I18nManager } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Toast } from "./src/components/Toast";

import LoginScreen from "./src/screens/LoginScreen";
import CatalogScreen from "./src/screens/CatalogScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OrderSuccessScreen from "./src/screens/OrderSuccessScreen";
import PizzaBuilderScreen from "./src/screens/PizzaBuilderScreen";

import linking from "./src/navigation/linking";
import { useDeepLinkParams } from "./src/hooks/useDeepLinkParams";
import type { RootStackParamList } from "./src/navigation/types";
import { useAppStore } from "./src/store/useAppStore";
import { countryService } from "./src/services/country.service";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// RTL is applied REACTIVELY per-component via the `useRTL()` hook (driven by the
// active language), NOT via I18nManager.forceRTL(). forceRTL requires a full app
// reload, and this app's store is intentionally ephemeral (no persistence), so a
// reload would wipe the session that just selected the Arabic market. Keeping the
// native direction fixed to LTR lets us flip layout instantly from state — no
// reload, no lost session, and nothing that would interrupt an automation run.
I18nManager.allowRTL(false);

const OmniPizzaTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#FF5722",
    background: "#0F0F0F",
    card: "#1E1E1E",
    text: "#FFFFFF",
    border: "#2A2A2A",
    notification: "#FF5722",
  },
};

export default function App() {
  useDeepLinkParams(navigationRef);
  const country = useAppStore((state) => state.country);
  const setCountryInfo = useAppStore((state) => state.setCountryInfo);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const countries = await countryService.getCountries();
        if (cancelled) return;
        const match = countries.find((item) => item.code === country) ?? null;
        setCountryInfo(match);
      } catch {
        if (!cancelled) {
          setCountryInfo(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country, setCountryInfo]);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        theme={OmniPizzaTheme}
        linking={linking}
      >
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Catalog" component={CatalogScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
          <Stack.Screen name="PizzaBuilder" component={PizzaBuilderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </View>
  );
}
