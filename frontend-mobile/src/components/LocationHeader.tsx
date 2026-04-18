import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Colors } from "../theme/colors";
import { useAppStore } from "../store/useAppStore";
import { getReadableControlProps, getReadableTextProps } from "../utils/qa";

const MARKETS = {
  US: "United States",
  MX: "Mexico City",
  CH: "Zurich",
  JP: "Tokyo",
};

export const LocationHeader = ({
  onProfilePress,
}: {
  onProfilePress?: () => void;
}) => {
  const { country, language, setLanguage } = useAppStore();

  return (
    <View style={styles.container} accessibilityLabel="view-location-header" testID="view-location-header">
      <View style={styles.left} accessibilityLabel="view-header-left">
        {country === "CH" && (
          <View style={styles.langWrap} accessibilityLabel="view-lang-toggle">
            <TouchableOpacity
              onPress={() => setLanguage("de")}
              style={[styles.langBtn, language === "de" && styles.langBtnActive]}
              {...getReadableControlProps("btn-header-lang-de", "DE")}
            >
              <Text
                style={[
                  styles.langText,
                  language === "de" && styles.langTextActive,
                ]}
                {...getReadableTextProps("text-header-lang-de", "DE")}
              >
                DE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage("fr")}
              style={[styles.langBtn, language === "fr" && styles.langBtnActive]}
              {...getReadableControlProps("btn-header-lang-fr", "FR")}
            >
              <Text
                style={[
                  styles.langText,
                  language === "fr" && styles.langTextActive,
                ]}
                {...getReadableTextProps("text-header-lang-fr", "FR")}
              >
                FR
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Image
          source={{
            uri: "https://omnipizza-frontend.onrender.com/omnipizza-logo.png",
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
          resizeMode="contain"
          accessibilityLabel="img-header-logo"
          testID="img-header-logo"
        />
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "white",
            marginLeft: 12,
          }}
          {...getReadableTextProps("text-header-brand", "OMNIPIZZA")}
        >
          OMNIPIZZA
        </Text>
      </View>

      {/* <TouchableOpacity style={styles.bell} onPress={onProfilePress}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          <View style={styles.dot} />
       </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  langWrap: {
    flexDirection: "row",
    marginRight: 2,
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
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Colors.brand.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  location: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.base2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.surface.border,
    position: "relative",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary,
    position: "absolute",
    top: 10,
    right: 12,
    borderWidth: 1,
    borderColor: Colors.surface.base2,
  },
});
