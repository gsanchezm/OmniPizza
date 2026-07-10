import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Colors } from "../theme/colors";
import { useRTL } from "../hooks/useRTL";
import { getReadableControlProps, getReadableTextProps, getTestProps } from "../utils/qa";

/**
 * Dropdown — a hand-rolled select built on a transparent RN Modal.
 *
 * The trigger shows the current value (or placeholder) plus a caret. Tapping it
 * opens a scrollable list of options; picking one calls `onChange` and closes.
 * Tapping the scrim also closes. No native deps — pure RN primitives so it
 * renders identically on iOS + Android for Appium/Detox. This mirrors the
 * (removed) MarketDropdown Modal pattern.
 *
 * testIDs: trigger = the passed `testID`; each option = `btn-option-{value}`.
 */

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  testID: string;
}

export const Dropdown = ({
  value,
  options,
  onChange,
  placeholder,
  testID,
}: DropdownProps) => {
  const { textAlign } = useRTL();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? "";

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <View accessibilityLabel={`view-${testID}`}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        {...getReadableControlProps(testID, displayLabel || placeholder || testID)}
      >
        <Text
          style={[
            styles.triggerText,
            !selected && styles.placeholder,
            { textAlign },
          ]}
          numberOfLines={1}
          {...getReadableTextProps(`text-${testID}`, displayLabel || placeholder || "")}
        >
          {displayLabel}
        </Text>
        <Text style={styles.caret} accessibilityLabel={`icon-${testID}-caret`}>
          ▾
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        {...getTestProps(`modal-${testID}`)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setOpen(false)}
          {...getTestProps(`${testID}-scrim`)}
        >
          <Pressable style={styles.sheet} accessibilityLabel={`view-${testID}-sheet`}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              {...getTestProps(`scroll-${testID}`)}
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => select(opt.value)}
                    {...getReadableControlProps(`btn-option-${opt.value}`, opt.label)}
                  >
                    <Text
                      style={styles.optionLabel}
                      {...getReadableTextProps(`text-option-${opt.value}`, opt.label)}
                    >
                      {opt.label}
                    </Text>
                    {active && (
                      <Text
                        style={styles.check}
                        accessibilityLabel={`icon-${testID}-check-${opt.value}`}
                      >
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface.base,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  triggerText: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  placeholder: {
    color: Colors.text.muted,
    fontWeight: "400",
  },
  caret: {
    color: Colors.text.muted,
    fontSize: 12,
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
    maxHeight: "70%",
    backgroundColor: Colors.surface.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    padding: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

export default Dropdown;
