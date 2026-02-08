import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../pizzaOptions";

import type { PizzaSize, PizzaConfig } from "../store/useAppStore";

const tOpt = (obj: any, lang: string) => obj?.[lang] || obj?.en || "";

function getRate(pizza: any) {
  const bp = Number(pizza?.base_price); // USD
  const p = Number(pizza?.price); // local
  if (!bp || bp <= 0 || !p || p <= 0) return 1;
  return p / bp;
}
function usdToLocalCeil(usd: number, pizza: any) {
  return Math.ceil(usd * getRate(pizza));
}
function computeUnitPrice(pizza: any, sizeUsd: number, toppingsCount: number) {
  const base = Number(pizza.price);
  const sizeAdd = usdToLocalCeil(sizeUsd, pizza);
  const toppingUnit = usdToLocalCeil(1, pizza);
  return base + sizeAdd + toppingUnit * toppingsCount;
}

export default function PizzaBuilderScreen({ route, navigation }: any) {
  const { language, addConfiguredItem, updateCartItem } = useAppStore();

  const mode = route?.params?.mode || "add";
  const pizza = route?.params?.pizza;
  const cartItemId = route?.params?.cartItemId;
  const initialConfig = route?.params?.initialConfig;

  const [size, setSize] = useState<PizzaSize>(
    (initialConfig?.size as PizzaSize) || "small",
  );
  const [toppings, setToppings] = useState<string[]>(
    initialConfig?.toppings || [],
  );

  const sizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
    return computeUnitPrice(pizza, sizeObj.usd, toppings.length);
  }, [pizza, sizeObj.usd, toppings.length]);

  const toggleTopping = (id: string) => {
    setToppings((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const confirm = () => {
    const config: PizzaConfig = {
      size,
      toppings,
    };

    if (mode === "edit" && cartItemId) {
      updateCartItem(cartItemId, { config, unit_price: unitPrice });
      navigation.goBack();
      return;
    }
    addConfiguredItem(pizza, config, unitPrice);
    navigation.goBack();
  };

  if (!pizza) {
    return (
      <View style={styles.screen}>
        <CustomNavbar title="Pizza" navigation={navigation} />
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#F5F5F5" }}>Missing pizza param</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CustomNavbar
        title={tOpt(UI_STRINGS.title, language)}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.card}>
          <Text style={styles.pizzaName}>{pizza.name}</Text>
          <Text style={styles.priceLine}>
            {pizza.currency_symbol}
            {unitPrice} {pizza.currency}
          </Text>

          {/* Size */}
          <Text style={styles.section}>{tOpt(UI_STRINGS.size, language)}</Text>
          <View style={styles.grid}>
            {SIZE_OPTIONS.map((opt) => {
              const active = opt.id === size;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSize(opt.id)}
                  style={[styles.opt, active && styles.optActive]}
                >
                  <Text
                    style={[styles.optText, active && styles.optTextActive]}
                  >
                    {tOpt(opt.label, language)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Toppings */}
          <View style={styles.rowBetween}>
            <Text style={styles.section}>
              {tOpt(UI_STRINGS.toppings, language)}
            </Text>
            <Text style={styles.muted}>
              {tOpt(UI_STRINGS.upTo10, language)} • {toppings.length}/10
            </Text>
          </View>

          {TOPPING_GROUPS.map((g) => (
            <View key={g.id} style={styles.group}>
              <Text style={styles.groupTitle}>{tOpt(g.label, language)}</Text>

              <View style={styles.grid}>
                {g.items.map((it) => {
                  const checked = toppings.includes(it.id);
                  const disabled = !checked && toppings.length >= 10;

                  return (
                    <TouchableOpacity
                      key={it.id}
                      disabled={disabled}
                      onPress={() => toggleTopping(it.id)}
                      style={[
                        styles.opt,
                        checked && styles.optActive,
                        disabled && { opacity: 0.5 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optText,
                          checked && styles.optTextActive,
                        ]}
                      >
                        {tOpt(it.label, language)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={confirm}>
            <Text style={styles.btnText}>
              {tOpt(UI_STRINGS.confirm, language)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07070A" },
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#121218",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
  },

  pizzaName: { fontSize: 22, fontWeight: "900", color: "#F5F5F5" },
  priceLine: {
    marginTop: 6,
    color: "rgba(245,245,245,0.68)",
    fontWeight: "900",
  },

  section: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#DCCA87",
  },
  muted: { color: "rgba(245,245,245,0.68)", fontWeight: "800", fontSize: 12 },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  group: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(220,202,135,0.18)",
  },
  groupTitle: { color: "#F5F5F5", fontWeight: "900", marginBottom: 8 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  opt: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  optActive: { backgroundColor: "#DCCA87", borderColor: "#DCCA87" },
  optText: { color: "rgba(245,245,245,0.78)", fontWeight: "900" },
  optTextActive: { color: "#111" },

  btn: {
    marginTop: 16,
    backgroundColor: "#DCCA87",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { fontWeight: "900", color: "#111" },
});
