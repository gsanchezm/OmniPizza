import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Colors } from "../theme/colors";
import { useAppStore } from "../store/useAppStore";
import { getReadableControlProps, getReadableTextProps } from "../utils/qa";

export const BottomNavBar = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { logout, cartItems } = useAppStore();
  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const cartBadge = cartCount > 99 ? "99+" : String(cartCount);

  const handleLogout = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const navItems = [
    { name: "Catalog", label: "Catalog", icon: "🍕" },
    {
      name: "Checkout",
      label: "Checkout",
      icon: "🛒",
      badge: cartCount > 0 ? cartBadge : undefined,
    },
    { name: "Profile", label: "Profile", icon: "👤" },
    { name: "Logout", label: "Logout", icon: "🚪", onPress: handleLogout },
  ];

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container} accessibilityLabel="view-bottom-nav" testID="view-bottom-nav">
        {navItems.map((item) => {
          const isActive = route.name === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.tab}
              {...getReadableControlProps(`nav-${item.name.toLowerCase()}`, item.label)}
              onPress={
                item.onPress ||
                (() => {
                  if (!isActive) navigation.navigate(item.name);
                })
              }
            >
              <View accessibilityLabel={`view-nav-icon-${item.name.toLowerCase()}`}>
                <Text style={{ fontSize: 24, opacity: isActive ? 1 : 0.5 }} accessibilityLabel={`icon-nav-${item.name.toLowerCase()}`}>
                  {item.icon}
                </Text>
                {item.badge !== undefined ? (
                  <View style={styles.badge} accessibilityLabel={`view-nav-badge-${item.name.toLowerCase()}`} testID={`view-nav-badge-${item.name.toLowerCase()}`}>
                    <Text style={styles.badgeText} {...getReadableTextProps(`text-nav-badge-${item.name.toLowerCase()}`, String(item.badge))}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? Colors.brand.primary : Colors.text.muted,
                  },
                ]}
                {...getReadableTextProps(`text-nav-${item.name.toLowerCase()}`, item.label)}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface.base,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    backgroundColor: Colors.surface.base,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    right: -10,
    top: -4,
    backgroundColor: Colors.brand.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
