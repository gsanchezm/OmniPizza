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
  Modal,
  Pressable,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { BottomNavBar } from "../components/BottomNavBar";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { useRTL } from "../hooks/useRTL";
import type { CartItem, PizzaSize } from "../store/useAppStore";
import { placeOrder as placeOrderUseCase } from "../features/checkout/useCases/placeOrder";
import { validateCheckoutForm } from "../features/checkout/useCases/validateCheckoutForm";
import type { CheckoutFormState } from "../features/checkout/useCases/buildCheckoutPayload";
import { cartService } from "../services/cart.service";
import { SIZE_OPTIONS } from "../constants/pizza";
import { getReadableControlProps, getReadableTextProps, getTestProps } from "../utils/qa";
import { remoteImageSource } from "../utils/image";
import { Dropdown, type DropdownOption } from "../components/Dropdown";

const { width } = Dimensions.get("window");
const FALLBACK_TIP_PERCENTAGES = [0, 5, 10, 15] as const;
const DEFAULT_TIP_PERCENTAGE = "0";

// Card expiry is picked from two dropdowns (MM / YY) instead of a text input.
const CARD_EXPIRY_MONTH_OPTIONS: DropdownOption[] = Array.from({ length: 12 }, (_, i) => {
  const m = String(i + 1).padStart(2, "0");
  return { label: m, value: m };
});
const CARD_EXPIRY_YEAR_OPTIONS: DropdownOption[] = Array.from({ length: 16 }, (_, i) => {
  const y = String(24 + i); // 24..39
  return { label: y, value: y };
});

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
  const getSizeLabel = (size?: string) => {
    if (!size) return "";
    const option = SIZE_OPTIONS.find((candidate) => candidate.id === size);
    return option ? t(option.label) : size;
  };
  const { textAlign, row } = useRTL();
  const country = useAppStore((s) => s.country);
  const countryInfo = useAppStore((s) => s.countryInfo);
  const cartItems = useAppStore((s) => s.cartItems);
  const clearCart = useAppStore((s) => s.clearCart);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const setLastOrder = useAppStore((s) => s.setLastOrder);
  const token = useAppStore((s) => s.token);

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
    district: "",
    card_holder: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    payment_method: "card",
  });

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "paypal">("card");
  // Card expiry parts drive the two MM/YY dropdowns; combined into form.card_expiry.
  const [cardExpMonth, setCardExpMonth] = useState("");
  const [cardExpYear, setCardExpYear] = useState("");
  // Emulated (demo) PayPal login — client-side only, never placed on the order.
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalPassword, setPaypalPassword] = useState("");
  const [paypalLoggedIn, setPaypalLoggedIn] = useState(false);
  const [tipOption, setTipOption] = useState<string>(DEFAULT_TIP_PERCENTAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTipTooltip, setShowTipTooltip] = useState(false);

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

  const fallbackTaxRate = country === "MX" ? 0.16 : country === "CH" ? 0.081 : country === "JP" ? 0.1 : country === "SA" ? 0.15 : 0.08;
  const taxRate = Number.isFinite(Number(countryInfo?.tax_rate))
    ? Number(countryInfo?.tax_rate)
    : fallbackTaxRate;
  const deliveryFee = Number.isFinite(Number(countryInfo?.delivery_fee))
    ? Number(countryInfo?.delivery_fee)
    : country === "MX" ? 35.1 : country === "CH" ? 1.56 : country === "JP" ? 316 : country === "SA" ? 7.5 : 2.0;
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

  const updateCardExpiry = (part: "month" | "year", v: string) => {
    const month = part === "month" ? v : cardExpMonth;
    const year = part === "year" ? v : cardExpYear;
    setCardExpMonth(month);
    setCardExpYear(year);
    setForm((p) => ({ ...p, card_expiry: month || year ? `${month}/${year}` : "" }));
  };

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
        { ...form, propina: String(tipPercentage), payment_method: paymentMethod };

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
    } catch {
      setError(t("checkoutFailed"));
    } finally {
      setLoading(false);
    }
  };

  const confirmAndPlaceOrder = () => {
    setShowConfirm(false);
    placeOrder();
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
            {...getReadableControlProps("btn-go-to-menu", t("startOrder"))}
          >
            <Text style={styles.btnText} {...getReadableTextProps("text-go-to-menu", t("startOrder"))}>{t("startOrder")}</Text>
          </TouchableOpacity>
        </View>
        <BottomNavBar />
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="screen-checkout" testID="screen-checkout">
      <CustomNavbar title={t("checkout")} navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent} {...getTestProps("scroll-checkout")}>
        {/* Delivery Address */}
        <View style={[styles.sectionHeader, { flexDirection: row }]} accessibilityLabel="view-section-address">
          <Text style={[styles.sectionTitle, { textAlign }]} {...getReadableTextProps("text-section-address", t("deliveryAddress"))}>{t("deliveryAddress")}</Text>
        </View>

        <TextInput
          style={styles.cardInput}
          placeholder={t("addressExample")}
          placeholderTextColor="#555"
          value={form.address}
          onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
          testID="input-address"
          accessibilityLabel="input-address"
        />

        {/* Country-specific fields */}
        {country === "MX" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-colonia">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-colonia", t("colonia"))}>{t("colonia")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Polanco"
              placeholderTextColor="#555"
              value={form.colonia}
              onChangeText={(v) => setForm((p) => ({ ...p, colonia: v }))}
              accessibilityLabel={t("colonia")}
              testID="input-colonia"
            />
          </View>
        )}
        {country === "MX" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-zipcode-mx">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-zipcode-mx", t("zipCode"))}>{t("zipCode")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="06600"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={form.zip_code}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, zip_code: v.replace(/[^0-9]/g, "") }))
              }
              accessibilityLabel={t("zipCode")}
              testID="input-zipcode"
              maxLength={5}
            />
          </View>
        )}
        {country === "US" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-zipcode">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-zipcode", t("zipCode"))}>{t("zipCode")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="90210"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={form.zip_code}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, zip_code: v.replace(/[^0-9]/g, "") }))
              }
              accessibilityLabel={t("zipCode")}
              testID="input-zipcode"
              maxLength={5}
            />
          </View>
        )}
        {country === "CH" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-plz">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-plz", t("plz"))}>{t("plz")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="8001"
              placeholderTextColor="#555"
              value={form.plz}
              onChangeText={(v) => setForm((p) => ({ ...p, plz: v }))}
              accessibilityLabel={t("plz")}
              testID="input-zipcode"
            />
          </View>
        )}
        {country === "JP" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-prefecture">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-prefecture", t("prefecture"))}>{t("prefecture")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="東京都"
              placeholderTextColor="#555"
              value={form.prefectura}
              onChangeText={(v) => setForm((p) => ({ ...p, prefectura: v }))}
              accessibilityLabel={t("prefecture")}
              testID="input-zipcode"
            />
          </View>
        )}
        {country === "SA" && (
          <View style={{ marginTop: 12 }} accessibilityLabel="view-field-district">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-district", t("district"))}>{t("district")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="العليا"
              placeholderTextColor="#555"
              value={form.district}
              onChangeText={(v) => setForm((p) => ({ ...p, district: v }))}
              accessibilityLabel={t("district")}
              testID="input-district"
            />
          </View>
        )}

        {/* Contact Info */}
        <View style={[styles.sectionHeader, { flexDirection: row }]} accessibilityLabel="view-section-contact">
          <Text style={[styles.sectionTitle, { textAlign }]} {...getReadableTextProps("text-section-contact", t("contactInfo"))}>{t("contactInfo")}</Text>
        </View>
        <View style={{ gap: 12 }} accessibilityLabel="view-contact-fields">
          <View accessibilityLabel="view-field-fullname">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-fullname", t("fullName"))}>{t("fullName")}</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Julian Casablancas"
              placeholderTextColor="#555"
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              accessibilityLabel={t("fullName")}
              testID="input-fullname"
            />
          </View>
          <View accessibilityLabel="view-field-phone">
            <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-phone", t("phone"))}>{t("phone")}</Text>
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
              accessibilityLabel={t("phone")}
              maxLength={20}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.sectionHeader, { flexDirection: row }]} accessibilityLabel="view-section-payment">
          <Text style={[styles.sectionTitle, { textAlign }]} {...getReadableTextProps("text-section-payment", t("paymentMethod"))}>{t("paymentMethod")}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "card" && styles.paymentCardActive,
          ]}
          onPress={() => setPaymentMethod("card")}
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === "card" }}
          {...getReadableControlProps("btn-payment-card", t("creditCard"))}
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-card">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-credit-card">💳</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-card-info">
            <Text style={[styles.paymentLabel, { textAlign }]} {...getReadableTextProps("text-payment-card-label", t("creditCard"))}>{t("creditCard")}</Text>
            <Text style={[styles.paymentSub, { textAlign }]} {...getReadableTextProps("text-payment-card-number", t("creditCardDesc"))}>{t("creditCardDesc")}</Text>
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
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === "cash" }}
          {...getReadableControlProps("btn-payment-cash", t("cash"))}
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-cash">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-cash">💵</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-cash-info">
            <Text style={[styles.paymentLabel, { textAlign }]} {...getReadableTextProps("text-payment-cash-label", t("cash"))}>{t("cash")}</Text>
            <Text style={[styles.paymentSub, { textAlign }]} {...getReadableTextProps("text-payment-cash-desc", t("payOnDelivery"))}>{t("payOnDelivery")}</Text>
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

        <TouchableOpacity
          style={[
            styles.paymentCard,
            paymentMethod === "paypal" && styles.paymentCardActive,
          ]}
          onPress={() => setPaymentMethod("paypal")}
          accessibilityRole="radio"
          accessibilityState={{ selected: paymentMethod === "paypal" }}
          {...getReadableControlProps("btn-payment-paypal", t("paypal"))}
        >
          <View style={styles.paymentIcon} accessibilityLabel="view-icon-payment-paypal">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-paypal">🅿️</Text>
          </View>
          <View style={{ flex: 1 }} accessibilityLabel="view-payment-paypal-info">
            <Text style={[styles.paymentLabel, { textAlign }]} {...getReadableTextProps("text-payment-paypal-label", t("paypal"))}>{t("paypal")}</Text>
            <Text style={[styles.paymentSub, { textAlign }]} {...getReadableTextProps("text-payment-paypal-desc", t("paypalDesc"))}>{t("paypalDesc")}</Text>
          </View>
          <View
            style={[
              styles.radio,
              paymentMethod === "paypal" && styles.radioActive,
            ]}
            accessibilityLabel="radio-payment-paypal"
          >
            {paymentMethod === "paypal" && <View style={styles.radioInner} accessibilityLabel="radio-inner-paypal" />}
          </View>
        </TouchableOpacity>

        {paymentMethod === "paypal" && (
          <View style={styles.cardFields} accessibilityLabel="view-paypal-fields" testID="view-paypal-fields">
            <View style={styles.paypalDemoBadge} accessibilityLabel="view-paypal-demo-badge">
              <Text style={styles.paypalDemoBadgeText} {...getReadableTextProps("text-paypal-demo", t("paypalDemoNote"))}>
                {t("paypalDemoNote")}
              </Text>
            </View>
            <View accessibilityLabel="view-field-paypal-email">
              <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-paypal-email", t("paypalEmail"))}>{t("paypalEmail")}</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="you@example.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
                value={paypalEmail}
                onChangeText={(v) => {
                  setPaypalEmail(v);
                  setPaypalLoggedIn(false);
                }}
                accessibilityLabel={t("paypalEmail")}
                testID="input-paypal-email"
              />
            </View>
            <View accessibilityLabel="view-field-paypal-password">
              <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-paypal-password", t("paypalPassword"))}>{t("paypalPassword")}</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry
                value={paypalPassword}
                onChangeText={(v) => {
                  setPaypalPassword(v);
                  setPaypalLoggedIn(false);
                }}
                accessibilityLabel={t("paypalPassword")}
                testID="input-paypal-password"
              />
            </View>
            <TouchableOpacity
              style={styles.paypalLoginBtn}
              onPress={() => setPaypalLoggedIn(!!paypalEmail.trim() && !!paypalPassword.trim())}
              {...getReadableControlProps("btn-paypal-login", t("paypalLoginBtn"))}
            >
              <Text style={styles.paypalLoginBtnText} {...getReadableTextProps("text-paypal-login", t("paypalLoginBtn"))}>
                {t("paypalLoginBtn")}
              </Text>
            </TouchableOpacity>
            {paypalLoggedIn && (
              <Text style={styles.paypalStatus} {...getReadableTextProps("text-paypal-status", t("paypalConnected"))}>
                ✓ {t("paypalConnected")}
              </Text>
            )}
          </View>
        )}

        {paymentMethod === "card" && (
          <View style={styles.cardFields} accessibilityLabel="view-card-fields" testID="view-card-fields">
            <View accessibilityLabel="view-field-card-holder">
              <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-card-holder", t("cardHolder"))}>{t("cardHolder")}</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="Julian Casablancas"
                placeholderTextColor="#555"
                value={form.card_holder}
                onChangeText={(v) => setForm((p) => ({ ...p, card_holder: v }))}
                accessibilityLabel={t("cardHolder")}
                testID="input-card-holder"
              />
            </View>
            <View accessibilityLabel="view-field-card-number">
              <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-card-number", t("cardNumber"))}>{t("cardNumber")}</Text>
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
                accessibilityLabel={t("cardNumber")}
                testID="input-card-number"
              />
            </View>
            <View accessibilityLabel="view-field-card-expiry">
              <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-card-expiry", t("cardExpiry"))}>{t("cardExpiry")}</Text>
              <View style={[styles.expiryRow, { flexDirection: row }]} accessibilityLabel="view-card-expiry-row">
                <View style={{ flex: 1 }} accessibilityLabel="view-card-expiry-month">
                  <Dropdown
                    value={cardExpMonth}
                    options={CARD_EXPIRY_MONTH_OPTIONS}
                    onChange={(v) => updateCardExpiry("month", v)}
                    placeholder="MM"
                    testID="input-card-expiry-month"
                  />
                </View>
                <View style={{ flex: 1 }} accessibilityLabel="view-card-expiry-year">
                  <Dropdown
                    value={cardExpYear}
                    options={CARD_EXPIRY_YEAR_OPTIONS}
                    onChange={(v) => updateCardExpiry("year", v)}
                    placeholder="YY"
                    testID="input-card-expiry-year"
                  />
                </View>
              </View>
            </View>
            <View accessibilityLabel="view-field-card-cvv">
              <Text style={[styles.cardFieldLabel, { textAlign }]} {...getReadableTextProps("label-card-cvv", t("cvv"))}>{t("cvv")}</Text>
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
                accessibilityLabel={t("cvv")}
                testID="input-card-cvv"
              />
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={[styles.sectionHeader, { flexDirection: row }]} accessibilityLabel="view-section-summary">
          <Text
            style={[styles.sectionTitle, { textAlign }]}
            {...getReadableTextProps("text-section-summary", t("yourOrder"))}
          >
            {t("yourOrder")}
          </Text>
        </View>

        <View style={styles.summaryList} accessibilityLabel="view-summary-list">
          {cartItems.map((item) => (
            <View key={item.id} style={styles.itemRow} accessibilityLabel={`view-item-row-${item.id}`} testID={`view-item-row-${item.id}`}>
              <Image
                source={remoteImageSource(
                  item.pizza.image ||
                    "https://omnipizza.onrender.com/static/images/pizza-1.png",
                )}
                style={styles.itemImage}
                accessibilityLabel={item.pizza.name}
              />
              <View style={{ flex: 1 }} accessibilityLabel={`view-item-info-${item.id}`}>
                <Text
                  style={[styles.itemTitle, { textAlign }]}
                  {...getReadableTextProps(`text-item-title-${item.id}`, `${item.quantity}x ${item.pizza.name}`)}
                >
                  {item.quantity}x {item.pizza.name}
                </Text>
                <Text
                  style={[styles.itemDetails, { textAlign }]}
                  {...getReadableTextProps(
                    `text-item-details-${item.id}`,
                    getSizeLabel(item.config?.size),
                  )}
                >
                  {getSizeLabel(item.config?.size)}
                </Text>

                <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }} accessibilityLabel={`view-item-actions-${item.id}`}>
                  <TouchableOpacity
                    onPress={() => {
                      /* Edit logic would go here, ideally passing item to builder */
                    }}
                    {...getReadableControlProps(`btn-edit-item-${item.id}`, t("edit").toUpperCase())}
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
        <View style={[styles.costRow, { flexDirection: row }]} accessibilityLabel="view-row-subtotal">
          <Text style={[styles.costLabel, { textAlign }]} {...getReadableTextProps("text-subtotal-label", t("subtotal"))}>{t("subtotal")}</Text>
          <Text
            style={styles.costValue}
            {...getReadableTextProps("text-subtotal-value", money(subtotal, currency, currencySymbol))}
          >
            {money(subtotal, currency, currencySymbol)}
          </Text>
        </View>
        <View style={[styles.costRow, { flexDirection: row }]} accessibilityLabel="view-row-delivery">
          <Text style={[styles.costLabel, { textAlign }]} {...getReadableTextProps("text-delivery-label", t("deliveryFee"))}>{t("deliveryFee")}</Text>
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
              <Text style={[styles.costLabel, { textAlign }]} {...getReadableTextProps("text-tip-label", t("tipForDriver"))}>{t("tipForDriver")}</Text>
              <Pressable
                onPress={() => setShowTipTooltip((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                {...getReadableControlProps("btn-tip-info", t("tipTooltip"))}
              >
                <Text style={{ color: "#666" }} accessibilityLabel="icon-tip-info">ℹ️</Text>
              </Pressable>
              {showTipTooltip && (
                <View style={styles.tipTooltip} accessibilityLabel="view-tip-tooltip" testID="view-tip-tooltip">
                  <Text style={styles.tipTooltipText} {...getReadableTextProps("text-tip-tooltip", t("tipTooltip"))}>
                    {t("tipTooltip")}
                  </Text>
                </View>
              )}
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
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
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

        <View style={[styles.costRow, { flexDirection: row }]} accessibilityLabel="view-row-tax">
          <Text style={[styles.costLabel, { textAlign }]} {...getReadableTextProps("text-tax-label", `${t("tax")} (${(taxRate * 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%)`)}>
            {t("tax")} ({(taxRate * 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%)
          </Text>
          <Text
            style={styles.costValue}
            {...getReadableTextProps("text-tax-value", money(tax, currency, currencySymbol))}
          >
            {money(tax, currency, currencySymbol)}
          </Text>
        </View>

        <View style={[styles.costRow, { marginTop: 20, flexDirection: row }]} accessibilityLabel="view-row-total">
          <Text style={[styles.totalLabel, { textAlign }]} {...getReadableTextProps("text-total-label", t("total"))}>{t("total")}</Text>
          <Text
            style={styles.totalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            {...getReadableTextProps("text-total-value", money(total, currency, currencySymbol))}
          >
            {money(total, currency, currencySymbol)}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityLabel="view-checkout-error">
            <Text
              style={styles.errorBoxText}
              accessibilityLiveRegion="polite"
              {...getReadableTextProps("text-checkout-error", error)}
            >
              {error}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => setShowConfirm(true)}
          disabled={loading}
          accessibilityRole="button"
          {...getReadableControlProps("btn-place-order", loading ? t("processing") : t("placeOrder"))}
        >
          <Text style={styles.btnText} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps("text-btn-place-order", loading ? t("processing") : `${t("placeOrder")}  →`)}>
            {loading ? t("processing") : t("placeOrder") + "  →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Pre-order confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
        {...getTestProps("modal-confirm-order")}
      >
        <Pressable
          style={styles.confirmScrim}
          onPress={() => setShowConfirm(false)}
          accessibilityLabel="btn-confirm-order-scrim"
        >
          <Pressable style={styles.confirmCard} accessibilityViewIsModal accessibilityLabel="view-confirm-order-card">
            <Text
              style={styles.confirmTitle}
              {...getReadableTextProps("text-confirm-order-title", t("placeOrder"))}
            >
              {t("placeOrder")}
            </Text>
            <Text
              style={styles.confirmSubtitle}
              {...getReadableTextProps("text-confirm-order-summary", t("total"))}
            >
              {t("total")}
            </Text>
            <Text
              style={styles.confirmTotal}
              numberOfLines={1}
              adjustsFontSizeToFit
              {...getReadableTextProps("text-confirm-order-total", money(total, currency, currencySymbol))}
            >
              {money(total, currency, currencySymbol)}
            </Text>

            <View style={styles.confirmActions} accessibilityLabel="view-confirm-order-actions">
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => setShowConfirm(false)}
                {...getReadableControlProps("btn-confirm-order-cancel", t("cancel"))}
              >
                <Text style={styles.confirmBtnCancelText} {...getReadableTextProps("text-confirm-order-cancel", t("cancel"))}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnYes]}
                onPress={confirmAndPlaceOrder}
                {...getReadableControlProps("btn-confirm-order-yes", t("confirmPay"))}
              >
                <Text style={styles.confirmBtnYesText} {...getReadableTextProps("text-confirm-order-yes", t("confirmPay"))}>
                  {t("confirmPay")}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    flexShrink: 1,
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
    alignItems: "center",
    marginBottom: 12,
  },
  costLabel: {
    color: "#999",
    fontSize: 15,
    flexShrink: 1,
    marginEnd: 8,
  },
  costValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 0,
    textAlign: "right",
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
    flexShrink: 1,
    marginEnd: 8,
  },
  totalValue: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    flexShrink: 0,
    textAlign: "right",
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
  expiryRow: {
    flexDirection: "row",
    gap: 12,
  },
  paypalDemoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2A1810",
    borderWidth: 1,
    borderColor: "rgba(255,87,34,0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paypalDemoBadgeText: {
    color: "#FF5722",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  paypalLoginBtn: {
    backgroundColor: "#003087",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  paypalLoginBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  paypalStatus: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "600",
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
  confirmScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1E1E1E",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 24,
    alignItems: "center",
  },
  confirmTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  confirmSubtitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  confirmTotal: {
    color: "#FF5722",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnCancel: {
    backgroundColor: "#2A2A2A",
  },
  confirmBtnCancelText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  confirmBtnYes: {
    backgroundColor: "#FF5722",
  },
  confirmBtnYesText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  tipTooltip: {
    position: "absolute",
    top: 26,
    left: 0,
    maxWidth: 260,
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tipTooltipText: {
    color: "#E5E5E5",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
