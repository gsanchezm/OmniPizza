import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Flag } from "./Flag";
import { Colors } from "../theme/colors";
import { useAppStore } from "../store/useAppStore";
import type { CountryCode } from "../store/useAppStore";
import { getReadableControlProps, getReadableTextProps, getTestProps } from "../utils/qa";

/**
 * MarketDropdown — a hand-rolled market selector.
 *
 * Trigger shows the active market's flag + code. Tapping opens a transparent
 * RN Modal listing US/MX/CH/JP; picking one calls setCountry and closes.
 * Tapping the scrim also closes. No native deps — pure RN primitives so the
 * flag/label render identically on iOS + Android for Appium/Detox.
 */

const MARKETS: { code: CountryCode; label: string }[] = [
  { code: "US", label: "United States" },
  { code: "MX", label: "México" },
  { code: "CH", label: "Switzerland" },
  { code: "JP", label: "Japan" },
];

export const MarketDropdown = () => {
  const country = useAppStore((s) => s.country);
  const [open, setOpen] = useState(false);

  const select = (code: CountryCode) => {
    useAppStore.getState().setCountry(code);
    setOpen(false);
  };

  return (
    <View accessibilityLabel="view-market-dropdown">
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        {...getReadableControlProps("btn-market-dropdown", country)}
      >
        <Flag code={country} size={22} />
        <Text style={styles.triggerCode} {...getReadableTextProps("text-market-dropdown-code", country)}>
          {country}
        </Text>
        <Text style={styles.caret} accessibilityLabel="icon-market-caret">
          ▾
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        {...getTestProps("modal-market-dropdown")}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setOpen(false)}
          {...getTestProps("btn-market-dropdown-scrim")}
        >
          <Pressable style={styles.sheet} accessibilityLabel="view-market-dropdown-sheet">
            {MARKETS.map(({ code, label }) => {
              const active = code === country;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => select(code)}
                  {...getReadableControlProps(`btn-market-option-${code}`, `${code} ${label}`)}
                >
                  <Flag code={code} size={24} />
                  <Text
                    style={styles.optionLabel}
                    {...getReadableTextProps(`text-market-option-${code}`, `${label} (${code})`)}
                  >
                    {label} ({code})
                  </Text>
                  {active && (
                    <Text style={styles.check} accessibilityLabel={`icon-market-check-${code}`}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  triggerCode: {
    color: Colors.text.primary,
    fontWeight: "800",
    fontSize: 12,
  },
  caret: {
    color: Colors.text.muted,
    fontSize: 10,
    marginLeft: -2,
  },
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.surface.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    padding: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
  },
  optionActive: {
    backgroundColor: Colors.surface.base2,
  },
  optionLabel: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  check: {
    color: Colors.brand.primary,
    fontSize: 16,
    fontWeight: "800",
  },
});

export default MarketDropdown;
