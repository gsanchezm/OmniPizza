import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";

export const CustomNavbar = ({ title, navigation }: any) => {
  const t = useT();
  const { country, setCountry, language, setLanguage } = useAppStore();

  const rotateCountry = () => {
    const order: any = { MX: "US", US: "CH", CH: "JP", JP: "MX" };
    setCountry(order[country] || "MX");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.container}>
        {/* Country */}
        <TouchableOpacity style={styles.badge} onPress={rotateCountry}>
          <Text style={styles.badgeText}>{country}</Text>
        </TouchableOpacity>

        {/* CH language toggle */}
        {country === "CH" && (
          <View style={styles.langWrap}>
            <TouchableOpacity
              onPress={() => setLanguage("de")}
              style={[styles.langBtn, language === "de" && styles.langActive]}
            >
              <Text style={[styles.langText, language === "de" && styles.langTextActive]}>DE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage("fr")}
              style={[styles.langBtn, language === "fr" && styles.langActive]}
            >
              <Text style={[styles.langText, language === "fr" && styles.langTextActive]}>FR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Actions */}
        <View style={styles.right}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.iconBtn}>
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Checkout")} style={styles.iconBtn}>
            <Text style={styles.icon}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.surface.base },
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: Colors.surface.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "900",
    color: Colors.text.primary,
  },
  right: { flexDirection: "row", gap: 10 },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  icon: { fontSize: 16, color: Colors.text.primary },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
  },
  badgeText: { fontWeight: "900", color: "#111" },

  langWrap: {
    flexDirection: "row",
    marginLeft: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  langActive: {
    backgroundColor: Colors.brand.primary,
  },
  langText: { fontSize: 12, fontWeight: "900", color: Colors.text.muted },
  langTextActive: { color: "#111" },
});
