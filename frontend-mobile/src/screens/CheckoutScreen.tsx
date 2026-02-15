import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { orderService } from "../services/order.service";
import type { CartItem } from "../store/useAppStore";
import type { CheckoutPayload } from "../types/api";

function money(value: number, currencySymbol: string, currency: string) {
  return `${currencySymbol}${value} ${currency}`;
}

type CheckoutForm = {
  name: string;
  address: string;
  phone: string;
  colonia: string;
  propina: string;
  zip_code: string;
  plz: string;
  prefectura: string;
};

type FieldKey = keyof CheckoutForm;

const REQUIRED_BASE_FIELDS: FieldKey[] = ["name", "address", "phone"];
const REQUIRED_BY_COUNTRY: Record<string, FieldKey[]> = {
  MX: ["colonia"],
  US: ["zip_code"],
  CH: ["plz"],
  JP: ["prefectura"],
};

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

  const [form, setForm] = useState<CheckoutForm>({
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const updateField = (field: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const fieldLabel = (field: FieldKey) => {
    switch (field) {
      case "name":
        return t("fullName");
      case "address":
        return t("address");
      case "phone":
        return t("phone");
      case "colonia":
        return t("colonia");
      case "zip_code":
        return t("zip");
      case "plz":
        return t("plz");
      case "prefectura":
        return t("prefecture");
      case "propina":
        return t("tip");
      default:
        return field;
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    const requiredFields = [
      ...REQUIRED_BASE_FIELDS,
      ...(REQUIRED_BY_COUNTRY[country] || []),
    ];

    requiredFields.forEach((field) => {
      if (!String(form[field] || "").trim()) {
        nextErrors[field] = `${fieldLabel(field)} is required`;
      }
    });

    const zip = form.zip_code.trim();
    if (country === "US" && zip && !/^\d{5}$/.test(zip)) {
      nextErrors.zip_code = "ZIP code must contain exactly 5 digits";
    }

    const tip = form.propina.trim();
    if (tip && Number.isNaN(Number(tip))) {
      nextErrors.propina = "Tip must be a valid number";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please complete required fields");
      return false;
    }

    setError("");
    return true;
  };

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum: number, item: CartItem) =>
        sum + Number(item.unit_price) * Number(item.quantity),
      0
    );
  }, [cartItems]);

  const currency = cartItems[0]?.currency || "USD";
  const currencySymbol = cartItems[0]?.currency_symbol || "$";

  const goEdit = (item: CartItem) => {
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: CheckoutPayload = {
        country_code: country,
        items: cartItems.map((item: CartItem) => ({
          pizza_id: item.pizza_id,
          quantity: item.quantity,
          size: item.config?.size || "small",
          toppings: item.config?.toppings || [],
        })),
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
      };

      if (country === "MX") {
        payload.colonia = form.colonia.trim();
        if (form.propina.trim()) payload.propina = parseFloat(form.propina);
      } else if (country === "US") {
        payload.zip_code = form.zip_code.trim();
      } else if (country === "CH") {
        payload.plz = form.plz.trim();
      } else if (country === "JP") {
        payload.prefectura = form.prefectura.trim();
      }

      const order = await orderService.checkout(payload);

      setProfile({
        fullName: form.name,
        address: form.address,
        phone: form.phone,
      });

      setLastOrder(order);
      clearCart();

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

          {cartItems.map((it: CartItem) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{it.pizza?.name}</Text>
                <Text style={styles.itemMeta}>
                  {t("size")}: {it.config?.size} • {t("toppings")}: {(it.config?.toppings || []).length} • {t("qty")}: {it.quantity}
                </Text>
                <Text style={styles.itemMeta}>
                  {t("unit")}: {money(it.unit_price, it.currency_symbol, it.currency)}
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
            <Text style={styles.subtotalLabel}>{t("subtotal")}</Text>
            <Text style={styles.subtotalValue}>{money(subtotal, currencySymbol, currency)}</Text>
          </View>
        </View>

        {/* Delivery form */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.section}>{t("deliveryInfo")}</Text>

          <TextInput
            style={[styles.input, fieldErrors.name && styles.inputError]}
            placeholder={t("fullName")}
            placeholderTextColor={Colors.text.muted}
            value={form.name}
            onChangeText={(v) => updateField("name", v)}
          />
          {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
          <TextInput
            style={[styles.input, fieldErrors.address && styles.inputError]}
            placeholder={t("address")}
            placeholderTextColor={Colors.text.muted}
            value={form.address}
            onChangeText={(v) => updateField("address", v)}
          />
          {fieldErrors.address ? <Text style={styles.fieldError}>{fieldErrors.address}</Text> : null}
          <TextInput
            style={[styles.input, fieldErrors.phone && styles.inputError]}
            placeholder={t("phone")}
            placeholderTextColor={Colors.text.muted}
            value={form.phone}
            onChangeText={(v) => updateField("phone", v)}
          />
          {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}

          {country === "MX" && (
            <>
              <TextInput
                style={[styles.input, fieldErrors.colonia && styles.inputError]}
                placeholder={t("colonia")}
                placeholderTextColor={Colors.text.muted}
                value={form.colonia}
                onChangeText={(v) => updateField("colonia", v)}
              />
              {fieldErrors.colonia ? <Text style={styles.fieldError}>{fieldErrors.colonia}</Text> : null}
              <TextInput
                style={[styles.input, fieldErrors.propina && styles.inputError]}
                placeholder={t("tip")}
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                value={form.propina}
                onChangeText={(v) => updateField("propina", v)}
              />
              {fieldErrors.propina ? <Text style={styles.fieldError}>{fieldErrors.propina}</Text> : null}
            </>
          )}

          {country === "US" && (
            <TextInput
              style={[styles.input, fieldErrors.zip_code && styles.inputError]}
              placeholder={t("zip")}
              placeholderTextColor={Colors.text.muted}
              keyboardType="numeric"
              value={form.zip_code}
              onChangeText={(v) => updateField("zip_code", v)}
            />
          )}
          {country === "US" && fieldErrors.zip_code ? (
            <Text style={styles.fieldError}>{fieldErrors.zip_code}</Text>
          ) : null}

          {country === "CH" && (
            <TextInput
              style={[styles.input, fieldErrors.plz && styles.inputError]}
              placeholder={t("plz")}
              placeholderTextColor={Colors.text.muted}
              value={form.plz}
              onChangeText={(v) => updateField("plz", v)}
            />
          )}
          {country === "CH" && fieldErrors.plz ? (
            <Text style={styles.fieldError}>{fieldErrors.plz}</Text>
          ) : null}

          {country === "JP" && (
            <TextInput
              style={[styles.input, fieldErrors.prefectura && styles.inputError]}
              placeholder={t("prefecture")}
              placeholderTextColor={Colors.text.muted}
              value={form.prefectura}
              onChangeText={(v) => updateField("prefectura", v)}
            />
          )}
          {country === "JP" && fieldErrors.prefectura ? (
            <Text style={styles.fieldError}>{fieldErrors.prefectura}</Text>
          ) : null}

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
  container: { flex: 1, backgroundColor: Colors.surface.base },

  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },

  section: { fontSize: 18, fontWeight: "800", color: Colors.brand.primary, marginBottom: 10 },

  itemRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  itemTitle: { color: Colors.text.primary, fontWeight: "800", fontSize: 16 },
  itemMeta: { color: Colors.text.muted, fontWeight: "700", fontSize: 12, marginTop: 2 },

  itemActions: { alignItems: "flex-end" },
  itemTotal: { color: Colors.text.primary, fontWeight: "800" },

  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface.base2,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  smallBtnText: { color: Colors.text.primary, fontWeight: "800", fontSize: 12 },

  subtotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtotalLabel: { color: Colors.text.muted, fontWeight: "800" },
  subtotalValue: { color: Colors.brand.primary, fontWeight: "800", fontSize: 16 },

  input: {
    backgroundColor: Colors.surface.base2,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.text.primary,
    marginBottom: 10,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  fieldError: {
    marginTop: -6,
    marginBottom: 8,
    color: Colors.danger,
    fontWeight: "700",
    fontSize: 12,
  },

  error: { marginTop: 8, color: Colors.danger, fontWeight: "800" },

  btn: {
    marginTop: 8,
    backgroundColor: Colors.brand.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { fontWeight: "800", color: "#FFFFFF" },

  emptyText: { color: Colors.text.primary, fontWeight: "800", fontSize: 16, marginBottom: 12 },
  btnGhost: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  btnGhostText: { color: Colors.text.primary, fontWeight: "800" },
});
