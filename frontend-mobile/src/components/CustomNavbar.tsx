import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";

export const CustomNavbar = ({ title, navigation }: any) => {
  const { width } = useWindowDimensions();
  const compact = width < 390;

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
      <View style={[styles.container, compact && styles.containerCompact]}>
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
        <View style={[styles.right, compact && styles.rightCompact]}>
          {/* Catalog Button (New) */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Catalog")}
            style={[styles.iconBtn, compact && styles.iconBtnCompact]}
            {...getTestProps("btn-navbar-catalog")}
          >
            <Text style={[styles.icon, compact && styles.iconCompact]}>🍕</Text>
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={[styles.iconBtn, compact && styles.iconBtnCompact]}
            {...getTestProps("btn-navbar-profile")}
          >
            <Text style={[styles.icon, compact && styles.iconCompact]}>👤</Text>
          </TouchableOpacity>

          {/* Checkout Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Checkout")}
            style={[styles.iconBtn, compact && styles.iconBtnCompact]}
            {...getTestProps("btn-navbar-cart")}
          >
            <Text style={[styles.icon, compact && styles.iconCompact]}>🛒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.iconBtn, compact && styles.iconBtnCompact]}
            {...getTestProps("btn-navbar-logout")}
          >
            <Text style={[styles.icon, compact && styles.iconCompact]}>↩</Text>
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
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  containerCompact: {
    height: 52,
    paddingHorizontal: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontWeight: "800",
    color: Colors.text.primary,
    marginHorizontal: 6,
  },
  right: { flexDirection: "row", gap: 8 },
  rightCompact: { gap: 6 },

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
  iconBtnCompact: {
    width: 32,
    height: 32,
    padding: 6,
    borderRadius: 10,
  },
  icon: { fontSize: 16, color: Colors.text.primary, textAlign: "center" },
  iconCompact: { fontSize: 14 },

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
