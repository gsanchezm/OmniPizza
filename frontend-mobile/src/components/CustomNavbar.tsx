import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore, CountryCode } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";

const COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "US", label: "🇺🇸 United States (EN)" },
  { code: "MX", label: "🇲🇽 Mexico (ES)" },
  { code: "CH", label: "🇨🇭 Switzerland (DE/FR)" },
  { code: "JP", label: "🇯🇵 Japan (JA)" },
];

export const CustomNavbar = ({ title, navigation }: any) => {
  const { country, setCountry, language, setLanguage } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectCountry = (code: CountryCode) => {
    setCountry(code);
    setModalVisible(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Country Selector (Dropdown trigger) */}
        <TouchableOpacity
          style={styles.badge}
          onPress={() => setModalVisible(true)}
          {...getTestProps("btn-country-selector")}
        >
          <Text style={styles.badgeText} {...getTestProps("text-current-country")}>
            {country} ▼
          </Text>
        </TouchableOpacity>

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
        </View>
      </View>

      {/* Country Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Market</Text>
                <FlatList
                  data={COUNTRIES}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        country === item.code && styles.modalItemActive,
                      ]}
                      onPress={() => handleSelectCountry(item.code)}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          country === item.code && styles.modalItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {country === item.code && (
                        <Text style={styles.checkIcon}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { fontWeight: "800", color: "#FFFFFF", fontSize: 12 },

  langWrap: {
    flexDirection: "row",
    marginLeft: 8,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.surface.base,
  },
  modalItemActive: {
    backgroundColor: Colors.brand.primary + "20", // 20% opacity hex
    borderColor: Colors.brand.primary,
    borderWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500",
  },
  modalItemTextActive: {
    color: Colors.brand.primary,
    fontWeight: "bold",
  },
  checkIcon: {
    color: Colors.brand.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
});
