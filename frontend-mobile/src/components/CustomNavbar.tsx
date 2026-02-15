import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";

export const CustomNavbar = ({ title, navigation }: any) => {
  const { country, language, setLanguage, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* CH language toggle (only visible for CH) */}
        {country === "CH" && (
          <View style={styles.langWrap}>
            <TouchableOpacity
              onPress={() => setLanguage("de")}
              style={[styles.langBtn, language === "de" && styles.langBtnActive]}
              {...getTestProps("btn-lang-de")}
            >
              <Text style={[styles.langText, language === "de" && styles.langTextActive]}>
                DE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage("fr")}
              style={[styles.langBtn, language === "fr" && styles.langBtnActive]}
              {...getTestProps("btn-lang-fr")}
            >
              <Text style={[styles.langText, language === "fr" && styles.langTextActive]}>
                FR
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={1} {...getTestProps("text-navbar-title")}>
          {title}
        </Text>

        {/* Right actions */}
        <View style={styles.right}>
          {/* Catalog Button (New) */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Catalog")}
            style={styles.iconBtn}
            {...getTestProps("btn-navbar-catalog")}
          >
            <Text style={styles.icon}>🍕</Text>
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.iconBtn}
            {...getTestProps("btn-navbar-profile")}
          >
            <Text style={styles.icon}>👤</Text>
          </TouchableOpacity>

          {/* Checkout Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Checkout")}
            style={styles.iconBtn}
            {...getTestProps("btn-navbar-cart")}
          >
            <Text style={styles.icon}>🛒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.iconBtn}
            {...getTestProps("btn-navbar-logout")}
          >
            <Text style={styles.icon}>↩</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.surface.base, zIndex: 10 },
  container: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "800",
    color: Colors.text.primary,
    marginHorizontal: 8,
  },
  right: { flexDirection: "row", gap: 8 },

  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 36,
  },
  icon: { fontSize: 16, color: Colors.text.primary, textAlign: "center" },

  langWrap: {
    flexDirection: "row",
    marginRight: 8,
    padding: 2,
    borderRadius: 999,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  langBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  langBtnActive: { backgroundColor: Colors.brand.primary },
  langText: { fontWeight: "800", fontSize: 10, color: Colors.text.muted },
  langTextActive: { color: "#FFFFFF" },
});
