import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";

export const CustomNavbar = ({ title, navigation }: any) => {
  const { country, setCountry } = useAppStore();

  // MX -> US -> CH -> JP -> MX
  const rotateCountry = () => {
    const sequence: Record<string, "MX" | "US" | "CH" | "JP"> = {
      MX: "US",
      US: "CH",
      CH: "JP",
      JP: "MX",
    };
    setCountry(sequence[country] || "MX");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => console.log("Open Menu")}
          style={styles.btn}
          {...getTestProps("btn-burger-menu")}
        >
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.title} {...getTestProps("text-navbar-title")}>
          {title}
        </Text>

        <TouchableOpacity
          style={[styles.badge, styles[`badge_${country}`]]}
          onPress={rotateCountry}
          {...getTestProps("btn-country-selector")}
        >
          <Text style={styles.badgeText} {...getTestProps("text-current-country")}>
            {country}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Checkout")}
          style={styles.btn}
          {...getTestProps("btn-navbar-cart")}
        >
          <Text style={styles.icon}>🛒</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles: any = StyleSheet.create({
  safeArea: { backgroundColor: Colors.brand.primary },
  container: {
    flexDirection: "row",
    height: 56,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: Colors.brand.primary,
  },
  title: { fontWeight: "900", fontSize: 16, color: Colors.text.inverse },
  btn: { padding: 6 },
  icon: { fontSize: 20, color: Colors.text.inverse },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: Colors.text.primary, fontWeight: "900", fontSize: 12 },

  // Variación visual pero SIEMPRE dentro de tu paleta
  badge_MX: { backgroundColor: Colors.brand.accent },
  badge_US: { backgroundColor: Colors.brand.secondary },
  badge_CH: { backgroundColor: Colors.brand.accent },
  badge_JP: { backgroundColor: Colors.brand.secondary },
});
