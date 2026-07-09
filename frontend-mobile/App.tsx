import React, { useEffect } from "react";
import { View, I18nManager, DevSettings } from "react-native";
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

// RTL support: allow right-to-left layout at startup so I18nManager can flip
// direction when the active language is Arabic. Must run once, before any
// RTL-aware layout is measured.
I18nManager.allowRTL(true);

// Best-effort app reload used when we flip layout direction. React Native can
// only apply an I18nManager.forceRTL() change after a full JS reload, so
// toggling Arabic reloads the whole app (an I18nManager constraint).
// `expo-updates` is NOT installed in this project, so we rely solely on
// DevSettings.reload(). Everything is wrapped so it can never crash the app.
async function reloadApp() {
  try {
    DevSettings.reload();
  } catch {
    // no-op: reload is best-effort; if no reloader is available we leave the
    // forced RTL flag in place to take effect on the next natural app launch.
  }
}

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
  const language = useAppStore((state) => state.language);
  const setCountryInfo = useAppStore((state) => state.setCountryInfo);

  // Keep native layout direction in sync with the active language. Arabic uses
  // full RTL; every other language is LTR. Flipping I18nManager.forceRTL only
  // takes effect after a reload, so switching to/from Arabic reloads the app.
  useEffect(() => {
    const wantsRTL = language === "ar";
    if (wantsRTL && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      reloadApp();
    } else if (!wantsRTL && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      reloadApp();
    }
  }, [language]);

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
