import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { CustomNavbar } from "../components/CustomNavbar";
import { useT } from "../i18n";
import { apiClient } from "../api/client";

export default function CheckoutScreen({ navigation }: any) {
  const t = useT();
  const { country, cartItems, clearCart, profile, setLastOrder } = useAppStore();

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

  const input = (placeholder: string) => ({
    placeholder,
    placeholderTextColor: "#777",
    style: styles.input,
  });

  const placeOrder = async () => {
    setError("");
    setLoading(true);

    try {
      const payload: any = {
        country_code: country,
        items: cartItems.map((i: any) => ({ pizza_id: i.pizza_id, quantity: i.quantity })),
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

      setLastOrder(res.data);
      clearCart();

      // si ya tienes OrderSuccess screen:
      navigation.replace?.("OrderSuccess");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Checkout error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CustomNavbar title={t("checkout")} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.card}>
          <Text style={styles.section}>{t("deliveryInfo")}</Text>

          <TextInput {...input(t("fullName"))} value={form.name} onChangeText={(v)=>setForm(p=>({ ...p, name: v }))} {...getTestProps("input-fullname")} />
          <TextInput {...input(t("address"))} value={form.address} onChangeText={(v)=>setForm(p=>({ ...p, address: v }))} {...getTestProps("input-address")} />
          <TextInput {...input(t("phone"))} value={form.phone} onChangeText={(v)=>setForm(p=>({ ...p, phone: v }))} {...getTestProps("input-phone")} />

          {country === "MX" && (
            <>
              <TextInput {...input(t("colonia"))} value={form.colonia} onChangeText={(v)=>setForm(p=>({ ...p, colonia: v }))} {...getTestProps("input-colonia-mx")} />
              <TextInput {...input(t("tip"))} keyboardType="numeric" value={form.propina} onChangeText={(v)=>setForm(p=>({ ...p, propina: v }))} {...getTestProps("input-tip-mx")} />
            </>
          )}

          {country === "US" && (
            <TextInput {...input(t("zip"))} keyboardType="numeric" maxLength={5} value={form.zip_code} onChangeText={(v)=>setForm(p=>({ ...p, zip_code: v }))} {...getTestProps("input-zip-us")} />
          )}

          {country === "CH" && (
            <TextInput {...input(t("plz"))} value={form.plz} onChangeText={(v)=>setForm(p=>({ ...p, plz: v }))} {...getTestProps("input-plz-ch")} />
          )}

          {country === "JP" && (
            <TextInput {...input(t("prefecture"))} value={form.prefectura} onChangeText={(v)=>setForm(p=>({ ...p, prefectura: v }))} {...getTestProps("input-prefecture-jp")} />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={placeOrder} disabled={loading} {...getTestProps("btn-place-order")}>
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

  section: {
    fontSize: 18,
    fontWeight: "900",
    color: "#DCCA87",
    marginBottom: 10,
  },

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
    marginTop: 10,
    backgroundColor: "#DCCA87",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { fontWeight: "900", color: "#111" },
});
