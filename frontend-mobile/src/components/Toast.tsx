import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { useToastStore } from "./toastStore";
import { getReadableControlProps, getReadableTextProps } from "../utils/qa";
import { useT } from "../i18n";

const AUTO_DISMISS_MS = 3000;

/**
 * Toast — an absolutely-positioned Animated banner near the bottom of the
 * screen. Renders only while the toast store holds a message; fades/slides in,
 * auto-dismisses after ~3s, and exposes a manual close button. Mount once high
 * in the tree (see App.tsx) so any screen can trigger it via useToastStore.
 */
export const Toast = () => {
  const t = useT();
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!message) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => hide(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, opacity, translateY, hide]);

  useEffect(() => {
    if (!message) {
      opacity.setValue(0);
      translateY.setValue(20);
    }
  }, [message, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
      accessibilityLabel="view-toast"
      testID="view-toast"
      pointerEvents="box-none"
    >
      <Text
        style={styles.message}
        numberOfLines={2}
        accessibilityLiveRegion="polite"
        {...getReadableTextProps("text-toast-message", message)}
      >
        {message}
      </Text>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={hide}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        {...getReadableControlProps("btn-toast-close", t("close"))}
      >
        <Text style={styles.closeIcon} importantForAccessibility="no" testID="icon-toast-close">
          ✕
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 90,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  message: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface.base2,
  },
  closeIcon: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: "800",
  },
});

export default Toast;
