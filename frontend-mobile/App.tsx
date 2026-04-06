import React from "react";
import {
  NavigationContainer,
  DarkTheme,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/screens/LoginScreen";
import CatalogScreen from "./src/screens/CatalogScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OrderSuccessScreen from "./src/screens/OrderSuccessScreen";
import PizzaBuilderScreen from "./src/screens/PizzaBuilderScreen";

import linking from "./src/navigation/linking";
import { useDeepLinkParams } from "./src/hooks/useDeepLinkParams";
import type { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

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

  return (
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
  );
}
