import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";

export const CustomNavbar = ({ title, navigation }: any) => {
  const { country, setCountry, language, setLanguage } = useAppStore();

  const rotateCountry = () => {
    const seq: Record<string, "MX" | "US" | "CH" | "JP"> = {
      MX: "US",
      US: "CH",
      CH: "JP",
      JP: "MX",
    };
    setCountry(seq[country] || "MX");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Country badge */}
        <TouchableOpacity
          style={styles.badge}
          onPress={rotateCountry}
          {...getTestProps("btn-country-selector")}
        >
          <Text style={styles.badgeText} {...getTestProps("text-current-country")}>
            {country}
          </Text>
        </TouchableOpacity>

        {/* CH language toggle */}
        {country === "CH" && (
          <View style={styles.langWrap}>
            <TouchableOpacity
              onPress={() => setLanguage("de")}
              style={[styles.langBtn, language === "de" && styles.langBtnActive]}
              {...getTestProps("btn-lang-de")}
            >
              <Text style={[styles.langText, language === "de" && styles.langTextActive]}>DE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage("fr")}
              style={[styles.langBtn, language === "fr" && styles.langBtnActive]}
              {...getTestProps("btn-lang-fr")}
            >
              <Text style={[styles.langText, language === "fr" && styles.langTextActive]}>FR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} {...getTestProps("text-navbar-title")}>
          {title}
        </Text>

        {/* Right actions */}
        <View style={styles.right}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.iconBtn}
            {...getTestProps("btn-navbar-profile")}
          >
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Checkout")}
            style={styles.iconBtn}
            {...getTestProps("btn-navbar-cart")}
          >
            <Text style={styles.icon}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#07070A" },
  container: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#07070A",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(220,202,135,0.22)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "900",
    color: "#F5F5F5",
  },
  right: { flexDirection: "row", gap: 10 },

  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#121218",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
  },
  icon: { fontSize: 16, color: "#F5F5F5" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DCCA87",
  },
  badgeText: { fontWeight: "900", color: "#111" },

  langWrap: {
    flexDirection: "row",
    marginLeft: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#121218",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
  },
  langBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  langBtnActive: { backgroundColor: "#DCCA87" },
  langText: { fontWeight: "900", fontSize: 12, color: "rgba(245,245,245,0.68)" },
  langTextActive: { color: "#111" },
});
