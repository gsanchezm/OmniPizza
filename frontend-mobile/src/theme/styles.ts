import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const GlobalStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.base },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.brand.primary,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.surface.base2,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    color: Colors.text.primary,
  },
  primaryButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  accentChip: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  accentChipText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
  },
});
