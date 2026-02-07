import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { CustomNavbar } from "../components/CustomNavbar";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { apiClient } from "../api/client";
import { useAppStore } from "../store/useAppStore";

const PAYMENT = {
  ONLINE_CARD: "ONLINE_CARD",
  DELIVERY_CASH: "DELIVERY_CASH",
  DELIVERY_CARD: "DELIVERY_CARD",
};

const t = useT();

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

  const [paymentType, setPaymentType] = useState(PAYMENT.ONLINE_CARD);
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvv: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
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

      // No enviamos tarjeta al backend. Solo guardamos el tipo.
      const res = await apiClient.post("/api/checkout", payload);
      setLastOrder({ ...res.data, paymentType });

      clearCart();
      navigation.replace("OrderSuccess");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Checkout error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <CustomNavbar title={t("checkout")} navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.card}>
          <Text style={styles.section}>{t("deliveryInfo")}</Text>

          <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#777" value={form.name} onChangeText={(v)=>setForm(p=>({ ...p, name: v }))}/>
          <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#777" value={form.address} onChangeText={(v)=>setForm(p=>({ ...p, address: v }))}/>
          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#777" value={form.phone} onChangeText={(v)=>setForm(p=>({ ...p, phone: v }))}/>

          {country === "MX" && (
            <>
              <TextInput style={styles.input} placeholder="Colonia" placeholderTextColor="#777" value={form.colonia} onChangeText={(v)=>setForm(p=>({ ...p, colonia: v }))}/>
              <TextInput style={styles.input} placeholder="Tip (optional)" placeholderTextColor="#777" keyboardType="numeric" value={form.propina} onChangeText={(v)=>setForm(p=>({ ...p, propina: v }))}/>
            </>
          )}

          {country === "US" && (
            <TextInput style={styles.input} placeholder="ZIP Code" placeholderTextColor="#777" value={form.zip_code} onChangeText={(v)=>setForm(p=>({ ...p, zip_code: v }))}/>
          )}

          {country === "CH" && (
            <TextInput style={styles.input} placeholder="PLZ" placeholderTextColor="#777" value={form.plz} onChangeText={(v)=>setForm(p=>({ ...p, plz: v }))}/>
          )}

          {country === "JP" && (
            <TextInput style={styles.input} placeholder="Prefecture" placeholderTextColor="#777" value={form.prefectura} onChangeText={(v)=>setForm(p=>({ ...p, prefectura: v }))}/>
          )}

          <Text style={[styles.section, { marginTop: 10 }]}>{t("payment")}</Text>

          <TouchableOpacity style={[styles.radio, paymentType===PAYMENT.ONLINE_CARD && styles.radioActive]} onPress={()=>setPaymentType(PAYMENT.ONLINE_CARD)}>
            <Text style={styles.radioText}>{t("payOnline")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.radio, paymentType===PAYMENT.DELIVERY_CASH && styles.radioActive]} onPress={()=>setPaymentType(PAYMENT.DELIVERY_CASH)}>
            <Text style={styles.radioText}>{t("payOnDelivery")} – {t("cash")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.radio, paymentType===PAYMENT.DELIVERY_CARD && styles.radioActive]} onPress={()=>setPaymentType(PAYMENT.DELIVERY_CARD)}>
            <Text style={styles.radioText}>{t("payOnDelivery")} – {t("card")}</Text>
          </TouchableOpacity>

          {paymentType === PAYMENT.ONLINE_CARD && (
            <View style={{ marginTop: 10 }}>
              <TextInput style={styles.input} placeholder="Name on card" placeholderTextColor="#777" value={card.name} onChangeText={(v)=>setCard(p=>({ ...p, name: v }))}/>
              <TextInput style={styles.input} placeholder="Card number" placeholderTextColor="#777" value={card.number} onChangeText={(v)=>setCard(p=>({ ...p, number: v }))}/>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM/YY" placeholderTextColor="#777" value={card.exp} onChangeText={(v)=>setCard(p=>({ ...p, exp: v }))}/>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="CVV" placeholderTextColor="#777" value={card.cvv} onChangeText={(v)=>setCard(p=>({ ...p, cvv: v }))}/>
              </View>
              <Text style={styles.muted}>* Demo UI only. Card data is not sent to backend.</Text>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "..." : t("placeOrder")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.base },
  card: { padding: 14, borderRadius: 18, backgroundColor: Colors.surface.card, borderWidth: 1, borderColor: Colors.surface.border },
  section: { fontSize: 18, fontWeight: "900", color: Colors.brand.accent, marginBottom: 10 },
  input: { backgroundColor: Colors.surface.base2, borderWidth: 1, borderColor: Colors.surface.border, borderRadius: 12, padding: 12, color: Colors.text.primary, marginBottom: 10 },
  radio: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.surface.border, backgroundColor: "rgba(255,255,255,0.02)", marginBottom: 8 },
  radioActive: { borderColor: Colors.brand.accent },
  radioText: { color: Colors.text.primary, fontWeight: "900" },
  muted: { marginTop: 6, color: Colors.text.muted, fontWeight: "700", fontSize: 12 },
  error: { marginTop: 8, color: Colors.brand.primary, fontWeight: "900" },
  btn: { marginTop: 12, backgroundColor: Colors.brand.accent, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { fontWeight: "900", color: "#111" },
});
