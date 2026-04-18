import React, { useEffect, useMemo, useState } from "react";
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
import type { CartItem, PizzaSize } from "../store/useAppStore";
import { placeOrder as placeOrderUseCase } from "../features/checkout/useCases/placeOrder";
import { validateCheckoutForm } from "../features/checkout/useCases/validateCheckoutForm";
import type { CheckoutFormState } from "../features/checkout/useCases/buildCheckoutPayload";
import { cartService } from "../services/cart.service";
import { SIZE_OPTIONS } from "../constants/pizza";
import { getReadableControlProps, getReadableTextProps, getTestProps } from "../utils/qa";

const { width } = Dimensions.get("window");
const FALLBACK_TIP_PERCENTAGES = [0, 5, 10, 15] as const;
const DEFAULT_TIP_PERCENTAGE = "0";

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
  const { country, countryInfo, cartItems, clearCart, profile, setProfile, setLastOrder, token } =
    useAppStore();

  // Hydrate cart from backend (enables API-based state injection for E2E tests)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        // Skip if user already has items in the UI cart (normal shopping flow).
        // Only hydrate when the local cart is empty — e.g. E2E test injected
        // state via POST /api/cart and then navigated directly to /checkout.
        if (useAppStore.getState().cartItems.length > 0) return;

        const data = await cartService.getCart();
        const backendItems = data?.cart_items;
        if (cancelled || !backendItems?.length) return;

        const hydrated: CartItem[] = backendItems.map((item) => {
          const size = (item.size || "small").toLowerCase() as PizzaSize;
          const sizeOption =
            SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

          const pizza = {
            id: item.pizza_id,
            name: item.name,
            description: "",
            price: item.price,
            base_price: item.base_price,
            currency: item.currency,
            currency_symbol: item.currency_symbol,
            image: item.image,
          };

          const rate =
            pizza.base_price > 0 ? pizza.price / pizza.base_price : 1;
          const sizeAdd = Math.ceil(sizeOption.usd * rate);
          const unitPrice = pizza.price + sizeAdd;

          return {
            id: `item_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            signature: `${item.pizza_id}|${size}|`,
            pizza_id: item.pizza_id,
            pizza,
            quantity: item.quantity,
            config: { size, toppings: [] as string[] },
            unit_price: unitPrice,
            currency: item.currency,
            currency_symbol: item.currency_symbol,
          };
        });

        if (!cancelled) {
          useAppStore.setState({ cartItems: hydrated });
        }
      } catch {
        // Fall back to current client-side cart on failure
      }
    })();

    return () => { cancelled = true; };
  }, [token]); // Re-run hydration if a token is injected late (e.g. via deep link)

  const [form, setForm] = useState<CheckoutFormState>({
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
  const [tipOption, setTipOption] = useState<string>(DEFAULT_TIP_PERCENTAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    const currentCurrency = cartItems[0]?.currency || "USD";
    return normalizeMoneyAmount(
      cartItems.reduce(
        (sum: number, item: CartItem) =>
          sum + Number(item.unit_price) * Number(item.quantity),
        0,
      ),
      currentCurrency,
    );
  }, [cartItems]);

  const currency = cartItems[0]?.currency || "USD";
  const currencySymbol = cartItems[0]?.currency_symbol;

  const fallbackTaxRate = country === "MX" ? 0.16 : country === "CH" ? 0.081 : country === "JP" ? 0.1 : 0.08;
  const taxRate = Number.isFinite(Number(countryInfo?.tax_rate))
    ? Number(countryInfo?.tax_rate)
    : fallbackTaxRate;
  const deliveryFee = Number.isFinite(Number(countryInfo?.delivery_fee))
    ? Number(countryInfo?.delivery_fee)
    : country === "MX" ? 35.1 : country === "CH" ? 1.56 : country === "JP" ? 316 : 2.0;
  const tipPercentages =
    Array.isArray(countryInfo?.tip_percentages) && countryInfo.tip_percentages.length === 4
      ? countryInfo.tip_percentages
      : [...FALLBACK_TIP_PERCENTAGES];
  useEffect(() => {
    const hasZeroOption = tipPercentages.some((value) => Number(value) === 0);
    setTipOption(hasZeroOption ? DEFAULT_TIP_PERCENTAGE : String(tipPercentages[0] ?? 0));
  }, [country, tipPercentages]);
  const tipPercentage = Number(tipOption) || 0;
  const tax = normalizeMoneyAmount(subtotal * taxRate, currency);
  const tipAmount = normalizeMoneyAmount(subtotal * (tipPercentage / 100), currency);
  const total = normalizeMoneyAmount(subtotal + deliveryFee + tipAmount + tax, currency);

  const placeOrder = async () => {
    setError("");

    const validationError = validateCheckoutForm({
      country,
      form,
      paymentMethod,
      t,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const checkoutForm: CheckoutFormState =
        { ...form, propina: String(tipPercentage) };

      const result = await placeOrderUseCase({
        country,
        cartItems,
        form: checkoutForm,
      });
      setLastOrder(result);
      setProfile({
        fullName: form.name,
        address: form.address,
        phone: form.phone,
      });
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
          <Text style={{ color: "white", marginBottom: 20 }} {...getReadableTextProps("text-cart-empty", t("cartEmpty"))}>
            {t("cartEmpty")}
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate("Catalog")}
            {...getReadableControlProps("btn-go-to-menu", t("goToMenu"))}
          >
            <Text style={styles.btnText} {...getReadableTextProps("text-go-to-menu", t("goToMenu"))}>{t("goToMenu")}</Text>
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
          <Text style={styles.sectionTitle} {...getReadableTextProps("text-section-address", t("streetAndNumber"))}>{t("streetAndNumber")}</Text>
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
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-colonia", t("colonia"))}>{t("colonia")}</Text>
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
        {country === "MX" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-zipcode-mx">
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-zipcode-mx", t("zipCode"))}>{t("zipCode")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="06600"
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
        {country === "US" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-zipcode">
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-zipcode", t("zipCode"))}>{t("zipCode")}</Text>
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
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-plz", t("plz"))}>{t("plz")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="8001"
              placeholderTextColor="#555"
              value={form.plz}
              onChangeText={(v) => setForm((p) => ({ ...p, plz: v }))}
              accessibilityLabel="input-zipcode"
              testID="input-zipcode"
            />
          </View>
        )}
        {country === "JP" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-prefecture">
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-prefecture", t("prefecture"))}>{t("prefecture")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="東京都"
              placeholderTextColor="#555"
              value={form.prefectura}
              onChangeText={(v) => setForm((p) => ({ ...p, prefectura: v }))}
              accessibilityLabel="input-zipcode"
              testID="input-zipcode"
            />
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.sectionHeader} accessibilityLabel="view-section-contact">
          <Text style={styles.sectionTitle} {...getReadableTextProps("text-section-contact", t("contactInfo"))}>{t("contactInfo")}</Text>
        </View>
        <View style={{ gap: 12 }} accessibilityLabel="view-contact-fields">
          <View accessibilityLabel="view-field-fullname">
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-fullname", t("fullName"))}>{t("fullName")}</Text>
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
            <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-phone", t("phone"))}>{t("phone")}</Text>
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
          <Text style={styles.sectionTitle} {...getReadableTextProps("text-section-payment", t("paymentMethod"))}>{t("paymentMethod")}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "card" && styles.paymentCardActive,
          ]}
          onPress={() => setPaymentMethod("card")}
          {...getReadableControlProps("btn-payment-card", t("creditCard"))}
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-card">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-credit-card">💳</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-card-info">
            <Text style={styles.paymentLabel} {...getReadableTextProps("text-payment-card-label", t("creditCard"))}>{t("creditCard")}</Text>
            <Text style={styles.paymentSub} {...getReadableTextProps("text-payment-card-number", "•••• •••• •••• 4242")}>•••• •••• •••• 4242</Text>
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
          {...getReadableControlProps("btn-payment-cash", t("payOnDelivery"))}
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-cash">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-cash">💵</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-cash-info">
            <Text style={styles.paymentLabel} {...getReadableTextProps("text-payment-cash-label", t("payOnDelivery"))}>{t("payOnDelivery")}</Text>
            <Text style={styles.paymentSub} {...getReadableTextProps("text-payment-cash-desc", t("cash"))}>{t("cash")}</Text>
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
              <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-card-holder", t("cardHolder"))}>{t("cardHolder")}</Text>
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
              <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-card-number", t("cardNumber"))}>{t("cardNumber")}</Text>
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
                <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-card-expiry", t("cardExpiry"))}>{t("cardExpiry")}</Text>
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
                <Text style={styles.cardFieldLabel} {...getReadableTextProps("label-card-cvv", t("cvv"))}>{t("cvv")}</Text>
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
          <Text
            style={styles.sectionTitle}
            {...getReadableTextProps("text-section-summary", t("orderSummary"))}
          >
            {t("orderSummary")}
          </Text>
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
                <Text
                  style={styles.itemTitle}
                  {...getReadableTextProps(`text-item-title-${item.id}`, `${item.quantity}x ${item.pizza.name}`)}
                >
                  {item.quantity}x {item.pizza.name}
                </Text>
                <Text style={styles.itemDetails} {...getReadableTextProps(`text-item-details-${item.id}`, String(item.config?.size ?? ""))}>{item.config?.size}</Text>

                <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }} accessibilityLabel={`view-item-actions-${item.id}`}>
                  <TouchableOpacity
                    onPress={() => {
                      /* Edit logic would go here, ideally passing item to builder */
                    }}
                    {...getTestProps(`btn-edit-item-${item.id}`)}
                  >
                    <Text style={styles.actionLink} {...getReadableTextProps(`text-edit-item-${item.id}`, t("edit").toUpperCase())}>
                      {t("edit").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      useAppStore.getState().removeCartItem(item.id)
                    }
                    {...getReadableControlProps(`btn-remove-item-${item.id}`, t("remove").toUpperCase())}
                  >
                    <Text style={[styles.actionLink, { color: "#EF4444" }]} {...getReadableTextProps(`text-remove-item-${item.id}`, t("remove").toUpperCase())}>
                      {t("remove").toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text
                style={styles.itemPrice}
                {...getReadableTextProps(
                  `text-item-price-${item.id}`,
                  money(item.unit_price * item.quantity, currency, currencySymbol),
                )}
              >
                {money(item.unit_price * item.quantity, currency, currencySymbol)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} accessibilityLabel="view-divider" />

        {/* Totals */}
        <View style={styles.costRow} accessibilityLabel="view-row-subtotal">
          <Text style={styles.costLabel} {...getReadableTextProps("text-subtotal-label", t("subtotal"))}>{t("subtotal")}</Text>
          <Text
            style={styles.costValue}
            {...getReadableTextProps("text-subtotal-value", money(subtotal, currency, currencySymbol))}
          >
            {money(subtotal, currency, currencySymbol)}
          </Text>
        </View>
        <View style={styles.costRow} accessibilityLabel="view-row-delivery">
          <Text style={styles.costLabel} {...getReadableTextProps("text-delivery-label", t("deliveryFee"))}>{t("deliveryFee")}</Text>
          <Text
            style={styles.costValue}
            {...getReadableTextProps("text-delivery-value", money(deliveryFee, currency, currencySymbol))}
          >
            {money(deliveryFee, currency, currencySymbol)}
          </Text>
        </View>

        <View
          style={styles.tipSection}
          accessibilityLabel="view-row-tip"
        >
          <View style={styles.tipHeader} accessibilityLabel="view-tip-label">
            <View style={styles.tipLabelRow}>
              <Text style={styles.costLabel} {...getReadableTextProps("text-tip-label", t("tipForDriver"))}>{t("tipForDriver")}</Text>
              <Text style={{ color: "#666" }} accessibilityLabel="icon-tip-info">ℹ️</Text>
            </View>
            <Text
              style={styles.costValue}
              {...getReadableTextProps("text-tip-value", money(tipAmount, currency, currencySymbol))}
            >
              {money(tipAmount, currency, currencySymbol)}
            </Text>
          </View>
          <View style={styles.tipOptions} accessibilityLabel="view-tip-options">
            {tipPercentages.map((optionValue) => {
              const optionKey = String(optionValue);
              const active = tipOption === optionKey;
              return (
                <TouchableOpacity
                  key={`${optionValue}`}
                  style={[
                    styles.tipPill,
                    active && styles.tipPillActive,
                  ]}
                  onPress={() => setTipOption(optionKey)}
                  {...getReadableControlProps(`btn-tip-${optionValue}`, `${optionValue}%`)}
                >
                  <Text
                    style={[
                      styles.tipText,
                      active && styles.tipTextActive,
                    ]}
                    {...getReadableTextProps(`text-tip-${optionValue}`, `${optionValue}%`)}
                  >
                    {optionValue}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.costRow} accessibilityLabel="view-row-tax">
          <Text style={styles.costLabel} {...getReadableTextProps("text-tax-label", `${t("tax")} (${(taxRate * 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%)`)}>
            {t("tax")} ({(taxRate * 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%)
          </Text>
          <Text
            style={styles.costValue}
            {...getReadableTextProps("text-tax-value", money(tax, currency, currencySymbol))}
          >
            {money(tax, currency, currencySymbol)}
          </Text>
        </View>

        <View style={[styles.costRow, { marginTop: 20 }]} accessibilityLabel="view-row-total">
          <Text style={styles.totalLabel} {...getReadableTextProps("text-total-label", t("totalPrice"))}>{t("totalPrice")}</Text>
          <Text
            style={styles.totalValue}
            {...getReadableTextProps("text-total-value", money(total, currency, currencySymbol))}
          >
            {money(total, currency, currencySymbol)}
          </Text>
        </View>

        <Text style={styles.arrival} {...getReadableTextProps("text-arrival", `${t("expectedArrival")}: 25-35 min`)}>{t("expectedArrival")}: 25-35 min</Text>

        {error ? (
          <View style={styles.errorBox} accessibilityLabel="view-checkout-error">
            <Text
              style={styles.errorBoxText}
              {...getReadableTextProps("text-checkout-error", error)}
            >
              {error}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={placeOrder}
          disabled={loading}
          {...getReadableControlProps("btn-place-order", loading ? t("processing") : t("confirmPay"))}
        >
          <Text style={styles.btnText} {...getReadableTextProps("text-btn-place-order", loading ? t("processing") : `${t("confirmPay")}  →`)}>
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
  tipSection: {
    marginVertical: 8,
    paddingVertical: 2,
    gap: 12,
  },
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tipLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    paddingRight: 8,
  },
  tipOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tipPill: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 96,
    alignItems: "center",
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
