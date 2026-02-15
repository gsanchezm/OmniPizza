import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import type { Pizza } from "../types/api";

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
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: pizza.image }}
        style={styles.image}
        onError={(event: any) => {
          event?.currentTarget?.setNativeProps?.({
            source: [{ uri: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg" }],
          });
        }}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{pizza.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {pizza.description}
        </Text>
        <Text style={styles.price}>{moneyLine(pizza)}</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(pizza)}>
        <Text style={styles.addBtnText}>{addLabel}</Text>
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
  info: { flex: 1, marginLeft: 10 },
  name: { fontWeight: "800", fontSize: 16, color: Colors.text.primary },
  desc: { color: Colors.text.muted, fontSize: 12, marginTop: 2 },
  price: { fontWeight: "800", color: Colors.brand.primary, marginTop: 6 },
  addBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
});
