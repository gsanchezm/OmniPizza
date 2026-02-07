import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

import { Colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.brand.primary,
    background: Colors.surface.base,
    card: Colors.surface.card,
    text: Colors.text.primary,
    border: Colors.brand.secondary,
    notification: Colors.brand.accent,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={NavTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surface.base }, // ✅ aplica fondo base global
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Catalog" component={CatalogScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
