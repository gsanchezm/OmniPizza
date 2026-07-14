import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import type { Pizza } from "../types/api";
import { getReadableControlProps, getReadableTextProps } from "../utils/qa";
import { remoteImageSource } from "../utils/image";
import { useRTL } from "../hooks/useRTL";

interface PizzaCardProps {
  pizza: Pizza;
  addLabel: string;
  onAdd: (pizza: Pizza) => void;
}

function moneyLine(pizza: Pizza) {
  const price = Number(pizza.price || 0);
  return `${pizza.currency_symbol}${price} ${pizza.currency}`;
}

export function PizzaCard({ pizza, addLabel, onAdd }: PizzaCardProps) {
  const { textAlign, row } = useRTL();
  return (
    <View style={[styles.card, { flexDirection: row }]} testID={`card-pizza-${pizza.id}`} accessibilityLabel={`card-pizza-${pizza.id}`}>
      <Image
        source={remoteImageSource(pizza.image)}
        style={styles.image}
        accessible={false}
        importantForAccessibility="no"
        testID={`img-pizza-${pizza.id}`}
        onError={(event: any) => {
          event?.currentTarget?.setNativeProps?.({
            source: [remoteImageSource("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Pizza_on_stone.jpg/500px-Pizza_on_stone.jpg")],
          });
        }}
      />

      <View style={styles.info}>
        <Text style={[styles.name, { textAlign }]} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps(`text-pizza-name-${pizza.id}`, pizza.name)}>{pizza.name}</Text>
        <Text style={[styles.desc, { textAlign }]} numberOfLines={2} {...getReadableTextProps(`text-pizza-desc-${pizza.id}`, pizza.description)}>
          {pizza.description}
        </Text>
        <Text style={styles.price} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps(`text-pizza-price-${pizza.id}`, moneyLine(pizza))}>{moneyLine(pizza)}</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(pizza)} {...getReadableControlProps(`btn-add-pizza-${pizza.id}`, addLabel)}>
        <Text style={styles.addBtnText} numberOfLines={1} {...getReadableTextProps(`text-add-pizza-${pizza.id}`, addLabel)}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.surface.base2 },
  info: { flex: 1, marginLeft: 10, minWidth: 0 },
  name: { fontWeight: "800", fontSize: 16, color: Colors.text.primary },
  desc: { color: Colors.text.muted, fontSize: 12, marginTop: 2 },
  price: { fontWeight: "800", color: Colors.brand.primary, marginTop: 6 },
  addBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    flexShrink: 0,
    marginLeft: 8,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
});
