import React from "react";
import { View, Text } from "react-native";
import { getTestProps } from "../utils/qa";

/**
 * Flag — a round country flag composed from React Native primitives.
 *
 * Why not emoji? Regional-indicator emoji (🇺🇸 …) have no glyph on many Android
 * devices/emulators, so they render as the two letters ("US"). Building the flag
 * from Views/Text renders identically on iOS and Android, needs no image assets
 * and no native dependency (no react-native-svg), and stays crisp at any size.
 *
 * Single source of truth for the market → flag mapping. Exposes
 * testID/accessibilityLabel `flag-{code}` for Appium/Detox.
 */

export type FlagCode = "US" | "MX" | "CH" | "JP" | "SA";

function FlagContent({ code, size: s }: { code: string; size: number }) {
  switch (code) {
    case "JP":
      return (
        <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: s * 0.44, height: s * 0.44, borderRadius: s * 0.22, backgroundColor: "#bc002d" }} />
        </View>
      );
    case "CH":
      return (
        <View style={{ flex: 1, backgroundColor: "#d52b1e", alignItems: "center", justifyContent: "center" }}>
          <View style={{ position: "absolute", width: s * 0.16, height: s * 0.56, backgroundColor: "#ffffff" }} />
          <View style={{ position: "absolute", width: s * 0.56, height: s * 0.16, backgroundColor: "#ffffff" }} />
        </View>
      );
    case "US":
      return (
        <View style={{ flex: 1, backgroundColor: "#b22234" }}>
          {[1, 3, 5, 7, 9, 11].map((i) => (
            <View
              key={i}
              style={{ position: "absolute", top: (i * s) / 13, left: 0, right: 0, height: s / 13, backgroundColor: "#ffffff" }}
            />
          ))}
          <View style={{ position: "absolute", top: 0, left: 0, width: s * 0.44, height: (s / 13) * 7, backgroundColor: "#3c3b6e" }} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <View
                key={`${r}-${c}`}
                style={{
                  position: "absolute",
                  top: s * 0.055 + r * s * 0.11,
                  left: s * 0.06 + c * s * 0.12,
                  width: s * 0.045,
                  height: s * 0.045,
                  borderRadius: s * 0.0225,
                  backgroundColor: "#ffffff",
                }}
              />
            )),
          )}
        </View>
      );
    case "MX":
      return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1, backgroundColor: "#006847" }} />
          <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: s * 0.2, height: s * 0.14, borderRadius: s * 0.07, backgroundColor: "#7b4a1e" }} />
          </View>
          <View style={{ flex: 1, backgroundColor: "#ce1126" }} />
        </View>
      );
    case "SA":
      return (
        <View style={{ flex: 1, backgroundColor: "#006c35", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontSize: s * 0.13, textAlign: "center", lineHeight: s * 0.16 }}>لا إله إلا الله</Text>
          <Text style={{ color: "#ffffff", fontSize: s * 0.13, textAlign: "center", lineHeight: s * 0.16 }}>محمد رسول الله</Text>
          <View style={{ position: "absolute", bottom: s * 0.2, width: s * 0.55, height: s * 0.05, borderRadius: s * 0.025, backgroundColor: "#ffffff" }} />
        </View>
      );
    default:
      return (
        <View style={{ flex: 1, backgroundColor: "#2A2A2A", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: s * 0.34 }}>{code}</Text>
        </View>
      );
  }
}

export function Flag({ code, size = 28 }: { code: string; size?: number }) {
  const upper = String(code || "").toUpperCase();
  return (
    <View
      {...getTestProps(`flag-${upper}`)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.18)",
        backgroundColor: "#000000",
      }}
    >
      <FlagContent code={upper} size={size} />
    </View>
  );
}

export default Flag;
