import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Catalog" component={CatalogScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
