import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { apiClient } from "../api/client";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { useT } from "../i18n";

function money(value: number, currencySymbol: string, currency: string) {
  // backend already formats decimals by country; keep simple for UI
  return `${currencySymbol}${value} ${currency}`;
}

export default function CheckoutScreen({ navigation }: any) {
  const t = useT();

  const {
    country,
    cartItems,
    removeCartItem,
    clearCart,
    profile,
    setProfile,
    setLastOrder,
  } = useAppStore();

  const [form, setForm] = useState({
    name: profile?.fullName || "",
    address: profile?.address || "",
    phone: profile?.phone || "",
    colonia: "",
    propina: "",
    zip_code: "",
    plz: "",
    prefectura: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum: number, it: any) => sum + Number(it.unit_price) * Number(it.quantity),
      0
    );
  }, [cartItems]);

  const currency = cartItems[0]?.currency || "USD";
  const currencySymbol = cartItems[0]?.currency_symbol || "$";

  const goEdit = (item: any) => {
    navigation.navigate("PizzaBuilder", {
      mode: "edit",
      pizza: item.pizza,
      cartItemId: item.id,
      initialConfig: item.config,
    });
  };

  const placeOrder = async () => {
    setError("");
    if (!cartItems.length) return;

    setLoading(true);
    try {
      const payload: any = {
        country_code: country,
        items: cartItems.map((i: any) => ({
          pizza_id: i.pizza_id,
          quantity: i.quantity,
          size: i.config?.size || "small",
          toppings: i.config?.toppings || [],
        })),
        name: form.name,
        address: form.address,
        phone: form.phone,
      };

      if (country === "MX") {
        payload.colonia = form.colonia;
        if (form.propina) payload.propina = parseFloat(form.propina);
      } else if (country === "US") {
        payload.zip_code = form.zip_code;
      } else if (country === "CH") {
        payload.plz = form.plz;
      } else if (country === "JP") {
        payload.prefectura = form.prefectura;
      }

      const res = await apiClient.post("/api/checkout", payload);

      // Save delivery details for autofill
      setProfile({
        fullName: form.name,
        address: form.address,
        phone: form.phone,
      });

      setLastOrder(res.data);
      clearCart();

      // if you already have OrderSuccess
      navigation.replace?.("OrderSuccess");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Checkout error");
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
      <View style={styles.container}>
        <CustomNavbar title={t("checkout")} navigation={navigation} />
        <View style={{ padding: 16 }}>
          <Text style={styles.emptyText}>🛒 {t("cart")} — 0</Text>
          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => navigation.navigate("Catalog")}
          >
            <Text style={styles.btnGhostText}>{t("catalog")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomNavbar title={t("checkout")} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {/* Cart items */}
        <View style={styles.card}>
          <Text style={styles.section}>{t("orderSummary")}</Text>

          {cartItems.map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{it.pizza?.name}</Text>
                <Text style={styles.itemMeta}>
                  Size: {it.config?.size} • Toppings: {(it.config?.toppings || []).length} • Qty: {it.quantity}
                </Text>
                <Text style={styles.itemMeta}>
                  Unit: {money(it.unit_price, it.currency_symbol, it.currency)}
                </Text>
              </View>

              <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>
                  {money(it.unit_price * it.quantity, it.currency_symbol, it.currency)}
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => goEdit(it)}>
                    <Text style={styles.smallBtnText}>{t("edit")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => removeCartItem(it.id)}>
                    <Text style={styles.smallBtnText}>{t("remove")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{money(subtotal, currencySymbol, currency)}</Text>
          </View>
        </View>

        {/* Delivery form */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.section}>{t("deliveryInfo")}</Text>

          <TextInput
            style={styles.input}
            placeholder={t("fullName")}
            placeholderTextColor="#777"
            value={form.name}
            onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder={t("address")}
            placeholderTextColor="#777"
            value={form.address}
            onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder={t("phone")}
            placeholderTextColor="#777"
            value={form.phone}
            onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
          />

          {country === "MX" && (
            <>
              <TextInput
                style={styles.input}
                placeholder={t("colonia")}
                placeholderTextColor="#777"
                value={form.colonia}
                onChangeText={(v) => setForm((p) => ({ ...p, colonia: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder={t("tip")}
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={form.propina}
                onChangeText={(v) => setForm((p) => ({ ...p, propina: v }))}
              />
            </>
          )}

          {country === "US" && (
            <TextInput
              style={styles.input}
              placeholder={t("zip")}
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={form.zip_code}
              onChangeText={(v) => setForm((p) => ({ ...p, zip_code: v }))}
            />
          )}

          {country === "CH" && (
            <TextInput
              style={styles.input}
              placeholder={t("plz")}
              placeholderTextColor="#777"
              value={form.plz}
              onChangeText={(v) => setForm((p) => ({ ...p, plz: v }))}
            />
          )}

          {country === "JP" && (
            <TextInput
              style={styles.input}
              placeholder={t("prefecture")}
              placeholderTextColor="#777"
              value={form.prefectura}
              onChangeText={(v) => setForm((p) => ({ ...p, prefectura: v }))}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={placeOrder} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "…" : t("placeOrder")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07070A" },

  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#121218",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
  },

  section: { fontSize: 18, fontWeight: "900", color: "#DCCA87", marginBottom: 10 },

  itemRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(220,202,135,0.18)",
  },
  itemTitle: { color: "#F5F5F5", fontWeight: "900", fontSize: 16 },
  itemMeta: { color: "rgba(245,245,245,0.68)", fontWeight: "700", fontSize: 12, marginTop: 2 },

  itemActions: { alignItems: "flex-end" },
  itemTotal: { color: "#F5F5F5", fontWeight: "900" },

  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#0C0C12",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
  },
  smallBtnText: { color: "#F5F5F5", fontWeight: "900", fontSize: 12 },

  subtotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(220,202,135,0.22)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtotalLabel: { color: "rgba(245,245,245,0.68)", fontWeight: "900" },
  subtotalValue: { color: "#DCCA87", fontWeight: "900", fontSize: 16 },

  input: {
    backgroundColor: "#0C0C12",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
    borderRadius: 12,
    padding: 12,
    color: "#F5F5F5",
    marginBottom: 10,
  },

  error: { marginTop: 8, color: "#CD0508", fontWeight: "900" },

  btn: {
    marginTop: 8,
    backgroundColor: "#DCCA87",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { fontWeight: "900", color: "#111" },

  emptyText: { color: "#F5F5F5", fontWeight: "900", fontSize: 16, marginBottom: 12 },
  btnGhost: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  btnGhostText: { color: "#F5F5F5", fontWeight: "900" },
});
