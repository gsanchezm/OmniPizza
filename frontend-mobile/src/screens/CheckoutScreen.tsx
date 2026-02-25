import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { BottomNavBar } from "../components/BottomNavBar";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { orderService } from "../services/order.service";
import type { CartItem } from "../store/useAppStore";

const { width } = Dimensions.get("window");

function normalizeMoneyAmount(value: number, currency: string) {
  if (!Number.isFinite(value)) return 0;
  if (currency === "JPY") return Math.round(value);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function money(value: number, currency: string, symbol?: string) {
  const amount = normalizeMoneyAmount(value, currency);
  const safeSymbol =
    typeof symbol === "string" ? symbol : currency === "JPY" ? "¥" : "$";
  if (currency === "JPY") return `${safeSymbol}${amount}`;
  return `${safeSymbol}${amount.toFixed(2)}`;
}

export default function CheckoutScreen({ navigation }: any) {
  const t = useT();
  const { country, cartItems, clearCart, profile, setProfile, setLastOrder } =
    useAppStore();

  const [form, setForm] = useState({
    name: profile?.fullName || "",
    address: profile?.address || "",
    phone: profile?.phone || "",
    colonia: "",
    propina: "",
    zip_code: "",
    plz: "",
    prefectura: "",
    card_holder: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [tipOption, setTipOption] = useState<"2" | "5" | "10" | null>("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum: number, item: CartItem) =>
        sum + Number(item.unit_price) * Number(item.quantity),
      0,
    );
  }, [cartItems]);

  const TAX_RATE = 0.08;
  const deliveryFee = 2.0;
  const tipAmount = tipOption === "2" ? 2 : tipOption === "5" ? 5 : tipOption === "10" ? 10 : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + deliveryFee + tipAmount + tax;

  const currency = cartItems[0]?.currency || "USD";
  const currencySymbol = cartItems[0]?.currency_symbol;

  const placeOrder = async () => {
    setError("");

    if (!form.address.trim()) {
      setError(t("streetAndNumber") + " is required.");
      return;
    }
    if (country === "MX" && !form.colonia.trim()) {
      setError(t("colonia") + " is required.");
      return;
    }
    if (country === "US" && !form.zip_code.trim()) {
      setError(t("zipCode") + " is required.");
      return;
    }
    if (country === "CH" && !form.plz.trim()) {
      setError(t("plz") + " is required.");
      return;
    }
    if (country === "JP" && !form.prefectura.trim()) {
      setError(t("prefecture") + " is required.");
      return;
    }
    if (!form.name.trim()) {
      setError(t("fullName") + " is required.");
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 7) {
      setError(t("phone") + " must be at least 7 digits.");
      return;
    }
    if (paymentMethod === "card") {
      if (!form.card_holder.trim()) {
        setError(t("cardHolder") + " is required.");
        return;
      }
      if (form.card_number.replace(/\D/g, "").length < 13) {
        setError(t("cardNumber") + " must be at least 13 digits.");
        return;
      }
      if (form.card_expiry.replace(/\D/g, "").length < 4) {
        setError(t("cardExpiry") + " is required (MMYY).");
        return;
      }
      if (form.card_cvv.replace(/\D/g, "").length < 3) {
        setError(t("cvv") + " must be at least 3 digits.");
        return;
      }
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000)); // Simulating
      clearCart();
      navigation.reset({
        index: 0,
        routes: [{ name: "OrderSuccess" }],
      });
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || String(d)).join(", "));
      } else {
        setError(e.message || "Checkout failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
      <View style={styles.container} accessibilityLabel="screen-checkout-empty" testID="screen-checkout-empty">
        <CustomNavbar title={t("checkout")} navigation={navigation} />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          accessibilityLabel="view-empty-cart"
        >
          <Text style={{ color: "white", marginBottom: 20 }} accessibilityLabel="text-cart-empty">
            {t("cartEmpty")}
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate("Catalog")}
            accessibilityLabel="btn-go-to-menu"
            testID="btn-go-to-menu"
          >
            <Text style={styles.btnText} accessibilityLabel="text-go-to-menu">{t("goToMenu")}</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="screen-checkout" testID="screen-checkout">
      <CustomNavbar title={t("checkout")} navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} accessibilityLabel="scroll-checkout">
        {/* Delivery Address */}
        <View style={styles.sectionHeader} accessibilityLabel="view-section-address">
          <Text style={styles.sectionTitle} accessibilityLabel="text-section-address">{t("streetAndNumber")}</Text>
        </View>

        <TextInput
          style={styles.cardInput}
          placeholder="4521 Sunset Boulevard, Suite 200"
          placeholderTextColor="#555"
          value={form.address}
          onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
          testID="input-address"
          accessibilityLabel="input-address"
        />

        {/* Country-specific fields */}
        {country === "MX" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-colonia">
            <Text style={styles.cardFieldLabel} accessibilityLabel="label-colonia">{t("colonia")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Polanco"
              placeholderTextColor="#555"
              value={form.colonia}
              onChangeText={(v) => setForm((p) => ({ ...p, colonia: v }))}
              accessibilityLabel="input-colonia"
              testID="input-colonia"
            />
          </View>
        )}
        {country === "US" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-zipcode">
            <Text style={styles.cardFieldLabel} accessibilityLabel="label-zipcode">{t("zipCode")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="90210"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={form.zip_code}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, zip_code: v.replace(/[^0-9]/g, "") }))
              }
              accessibilityLabel="input-zipcode"
              testID="input-zipcode"
            />
          </View>
        )}
        {country === "CH" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-plz">
            <Text style={styles.cardFieldLabel} accessibilityLabel="label-plz">{t("plz")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="8001"
              placeholderTextColor="#555"
              value={form.plz}
              onChangeText={(v) => setForm((p) => ({ ...p, plz: v }))}
              accessibilityLabel="input-plz"
            />
          </View>
        )}
        {country === "JP" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-prefecture">
            <Text style={styles.cardFieldLabel} accessibilityLabel="label-prefecture">{t("prefecture")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="東京都"
              placeholderTextColor="#555"
              value={form.prefectura}
              onChangeText={(v) => setForm((p) => ({ ...p, prefectura: v }))}
              accessibilityLabel="input-prefecture"
              testID="input-prefecture"
            />
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.sectionHeader} accessibilityLabel="view-section-contact">
          <Text style={styles.sectionTitle} accessibilityLabel="text-section-contact">{t("contactInfo")}</Text>
        </View>
        <View style={{ gap: 12 }} accessibilityLabel="view-contact-fields">
          <View accessibilityLabel="view-field-fullname">
            <Text style={styles.cardFieldLabel} accessibilityLabel="label-fullname">{t("fullName")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Julian Casablancas"
              placeholderTextColor="#555"
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              accessibilityLabel="input-fullname"
              testID="input-fullname"
            />
          </View>
          <View accessibilityLabel="view-field-phone">
            <Text style={styles.cardFieldLabel} accessibilityLabel="label-phone">{t("phone")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="+52 55 1234 5678"
              placeholderTextColor="#555"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, phone: v.replace(/[^0-9]/g, "") }))
              }
              testID="input-phone"
              accessibilityLabel="input-phone"
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.sectionHeader} accessibilityLabel="view-section-payment">
          <Text style={styles.sectionTitle} accessibilityLabel="text-section-payment">{t("paymentMethod")}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "card" && styles.paymentCardActive,
          ]}
          onPress={() => setPaymentMethod("card")}
          testID="btn-payment-card"
          accessibilityLabel="btn-payment-card"
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-card">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-credit-card">💳</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-card-info">
            <Text style={styles.paymentLabel} accessibilityLabel="text-payment-card-label">{t("creditCard")}</Text>
            <Text style={styles.paymentSub} accessibilityLabel="text-payment-card-number">•••• •••• •••• 4242</Text>
          </View>
          <View
            style={[
              styles.radio,
              paymentMethod === "card" && styles.radioActive,
            ]}
            accessibilityLabel="radio-payment-card"
          >
            {paymentMethod === "card" && <View style={styles.radioInner} accessibilityLabel="radio-inner-card" />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "cash" && styles.paymentCardActive,
          ]}
          onPress={() => setPaymentMethod("cash")}
          testID="btn-payment-cash"
          accessibilityLabel="btn-payment-cash"
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-cash">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-cash">💵</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-cash-info">
            <Text style={styles.paymentLabel} accessibilityLabel="text-payment-cash-label">{t("payOnDelivery")}</Text>
            <Text style={styles.paymentSub} accessibilityLabel="text-payment-cash-desc">{t("cash")}</Text>
          </View>
          <View
            style={[
              styles.radio,
              paymentMethod === "cash" && styles.radioActive,
            ]}
            accessibilityLabel="radio-payment-cash"
          >
            {paymentMethod === "cash" && <View style={styles.radioInner} accessibilityLabel="radio-inner-cash" />}
          </View>
        </TouchableOpacity>

        {paymentMethod === "card" && (
          <View style={styles.cardFields} accessibilityLabel="view-card-fields" testID="view-card-fields">
            <View accessibilityLabel="view-field-card-holder">
              <Text style={styles.cardFieldLabel} accessibilityLabel="label-card-holder">{t("cardHolder")}</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="Julian Casablancas"
                placeholderTextColor="#555"
                value={form.card_holder}
                onChangeText={(v) => setForm((p) => ({ ...p, card_holder: v }))}
                accessibilityLabel="input-card-holder"
                testID="input-card-holder"
              />
            </View>
            <View accessibilityLabel="view-field-card-number">
              <Text style={styles.cardFieldLabel} accessibilityLabel="label-card-number">{t("cardNumber")}</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={19}
                value={form.card_number}
                onChangeText={(v) =>
                  setForm((p) => ({
                    ...p,
                    card_number: v.replace(/[^0-9]/g, ""),
                  }))
                }
                accessibilityLabel="input-card-number"
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }} accessibilityLabel="view-card-expiry-cvv">
              <View style={{ flex: 1 }} accessibilityLabel="view-field-card-expiry">
                <Text style={styles.cardFieldLabel} accessibilityLabel="label-card-expiry">{t("cardExpiry")}</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder="MM/YY"
                  placeholderTextColor="#555"
                  keyboardType="number-pad"
                  maxLength={5}
                  value={form.card_expiry}
                  onChangeText={(v) =>
                    setForm((p) => ({
                      ...p,
                      card_expiry: v.replace(/[^0-9]/g, ""),
                    }))
                  }
                  accessibilityLabel="input-card-expiry"
                  testID="input-card-expiry"
                />
              </View>
              <View style={{ flex: 1 }} accessibilityLabel="view-field-card-cvv">
                <Text style={styles.cardFieldLabel} accessibilityLabel="label-card-cvv">{t("cvv")}</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder="123"
                  placeholderTextColor="#555"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={form.card_cvv}
                  onChangeText={(v) =>
                    setForm((p) => ({
                      ...p,
                      card_cvv: v.replace(/[^0-9]/g, ""),
                    }))
                  }
                  accessibilityLabel="input-card-cvv"
                />
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.sectionHeader} accessibilityLabel="view-section-summary">
          <Text style={styles.sectionTitle} accessibilityLabel="text-section-summary" testID="text-section-summary">{t("orderSummary")}</Text>
        </View>

        <View style={styles.summaryList} accessibilityLabel="view-summary-list">
          {cartItems.map((item) => (
            <View key={item.id} style={styles.itemRow} accessibilityLabel={`view-item-row-${item.id}`} testID={`view-item-row-${item.id}`}>
              <Image
                source={{
                  uri:
                    item.pizza.image ||
                    "https://omnipizza.onrender.com/static/images/pizza-1.png",
                }}
                style={styles.itemImage}
                accessibilityLabel={`img-item-${item.id}`}
              />
              <View style={{ flex: 1 }} accessibilityLabel={`view-item-info-${item.id}`}>
                <Text style={styles.itemTitle} accessibilityLabel={`text-item-title-${item.id}`} testID={`text-item-title-${item.id}`}>
                  {item.quantity}x {item.pizza.name}
                </Text>
                <Text style={styles.itemDetails} accessibilityLabel={`text-item-details-${item.id}`}>{item.config?.size}</Text>

                <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }} accessibilityLabel={`view-item-actions-${item.id}`}>
                  <TouchableOpacity
                    onPress={() => {
                      /* Edit logic would go here, ideally passing item to builder */
                    }}
                    accessibilityLabel={`btn-edit-item-${item.id}`}
                  >
                    <Text style={styles.actionLink} accessibilityLabel={`text-edit-item-${item.id}`}>
                      {t("edit").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      useAppStore.getState().removeCartItem(item.id)
                    }
                    accessibilityLabel={`btn-remove-item-${item.id}`}
                    testID={`btn-remove-item-${item.id}`}
                  >
                    <Text style={[styles.actionLink, { color: "#EF4444" }]} accessibilityLabel={`text-remove-item-${item.id}`}>
                      {t("remove").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemPrice} accessibilityLabel={`text-item-price-${item.id}`} testID={`text-item-price-${item.id}`}>
                {money(item.unit_price * item.quantity, currency, currencySymbol)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} accessibilityLabel="view-divider" />

        {/* Totals */}
        <View style={styles.costRow} accessibilityLabel="view-row-subtotal">
          <Text style={styles.costLabel} accessibilityLabel="text-subtotal-label">{t("subtotal")}</Text>
          <Text style={styles.costValue} accessibilityLabel="text-subtotal-value" testID="text-subtotal-value">{money(subtotal, currency, currencySymbol)}</Text>
        </View>
        <View style={styles.costRow} accessibilityLabel="view-row-delivery">
          <Text style={styles.costLabel} accessibilityLabel="text-delivery-label">{t("deliveryFee")}</Text>
          <Text style={styles.costValue} accessibilityLabel="text-delivery-value">{money(deliveryFee, currency, currencySymbol)}</Text>
        </View>

        {/* Tip Row */}
        <View
          style={[styles.costRow, { alignItems: "center", marginVertical: 8 }]}
          accessibilityLabel="view-row-tip"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityLabel="view-tip-label">
            <Text style={styles.costLabel} accessibilityLabel="text-tip-label">{t("tipForDriver")}</Text>
            <Text style={{ color: "#666" }} accessibilityLabel="icon-tip-info">ℹ️</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }} accessibilityLabel="view-tip-options">
            <TouchableOpacity
              style={[
                styles.tipPill,
                tipOption === "2" && styles.tipPillActive,
              ]}
              onPress={() => setTipOption("2")}
              accessibilityLabel="btn-tip-2"
              testID="btn-tip-2"
            >
              <Text
                style={[
                  styles.tipText,
                  tipOption === "2" && styles.tipTextActive,
                ]}
                accessibilityLabel="text-tip-2"
              >
                {money(2, currency, currencySymbol)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tipPill,
                tipOption === "5" && styles.tipPillActive,
              ]}
              onPress={() => setTipOption("5")}
              accessibilityLabel="btn-tip-5"
            >
              <Text
                style={[
                  styles.tipText,
                  tipOption === "5" && styles.tipTextActive,
                ]}
                accessibilityLabel="text-tip-5"
              >
                {money(5, currency, currencySymbol)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tipPill,
                tipOption === "10" && styles.tipPillActive,
              ]}
              onPress={() => setTipOption("10")}
              accessibilityLabel="btn-tip-10"
              testID="btn-tip-10"
            >
              <Text
                style={[
                  styles.tipText,
                  tipOption === "10" && styles.tipTextActive,
                ]}
                accessibilityLabel="text-tip-10"
              >
                {money(10, currency, currencySymbol)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.costRow} accessibilityLabel="view-row-tax">
          <Text style={styles.costLabel} accessibilityLabel="text-tax-label">
            {t("tax")} ({(TAX_RATE * 100).toFixed(0)}%)
          </Text>
          <Text style={styles.costValue} accessibilityLabel="text-tax-value" testID="text-tax-value">{money(tax, currency, currencySymbol)}</Text>
        </View>

        <View style={[styles.costRow, { marginTop: 20 }]} accessibilityLabel="view-row-total">
          <Text style={styles.totalLabel} accessibilityLabel="text-total-label">{t("totalPrice")}</Text>
          <Text style={styles.totalValue} accessibilityLabel="text-total-value" testID="text-total-value">{money(total, currency, currencySymbol)}</Text>
        </View>

        <Text style={styles.arrival} accessibilityLabel="text-arrival">{t("expectedArrival")}: 25-35 min</Text>

        {error ? (
          <View style={styles.errorBox} accessibilityLabel="view-checkout-error">
            <Text style={styles.errorBoxText} accessibilityLabel="text-checkout-error" testID="text-checkout-error">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={placeOrder}
          disabled={loading}
          testID="btn-place-order"
          accessibilityLabel="btn-place-order"
        >
          <Text style={styles.btnText} accessibilityLabel="text-btn-place-order">
            {loading ? t("processing") : t("confirmPay") + "  →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  editLink: {
    color: "#FF5722",
    fontWeight: "600",
  },
  addressCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A1810",
    alignItems: "center",
    justifyContent: "center",
  },
  addressLabel: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  addressText: {
    color: "#999",
    fontSize: 14,
    lineHeight: 20,
  },
  paymentCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  paymentCardActive: {
    borderColor: "#FF5722",
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  paymentSub: {
    color: "#666",
    fontSize: 13,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#FF5722",
    backgroundColor: "#FF5722",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  summaryList: {
    gap: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
  },
  itemTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  itemDetails: {
    color: "#666",
    fontSize: 13,
  },
  itemPrice: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 24,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  costLabel: {
    color: "#999",
    fontSize: 15,
  },
  costValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  tipPill: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipPillActive: {
    backgroundColor: "#FF5722",
  },
  tipText: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
  },
  tipTextActive: {
    color: "white",
  },
  totalLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  totalValue: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
  },
  arrival: {
    textAlign: "right",
    color: "#666",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 24,
  },
  btnPrimary: {
    backgroundColor: "#FF5722",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionLink: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FF5722",
    letterSpacing: 0.5,
  },
  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  cardFields: {
    gap: 16,
    marginBottom: 8,
  },
  cardFieldLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardInput: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    color: "white",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorBoxText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
