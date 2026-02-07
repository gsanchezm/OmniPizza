import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const GlobalStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.base },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    padding: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.brand.primary,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.brand.secondary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    color: Colors.text.primary,
  },
  primaryButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  accentChip: {
    backgroundColor: Colors.brand.accent,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  accentChipText: {
    color: Colors.text.primary,
    fontWeight: "800",
    fontSize: 11,
  },
});
