import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { orderService } from "../services/order.service";
import type { CartItem } from "../store/useAppStore";
import { SIZE_OPTIONS } from "../constants/pizza";

const { width } = Dimensions.get("window");

function money(value: number, currency: string) {
  return currency === "JPY" ? `¥${value}` : `$${value.toFixed(2)}`;
}

export default function CheckoutScreen({ navigation }: any) {
  const t = useT();
  const {
    country,
    cartItems,
    clearCart,
    profile,
    setProfile,
    setLastOrder,
  } = useAppStore();

  const [form, setForm] = useState({
    name: profile?.fullName || "Julian Casablancas",
    address: profile?.address || "4521 Sunset Boulevard, Suite 200",
    phone: profile?.phone || "",
    colonia: "",
    propina: "",
    zip_code: "90027",
    plz: "",
    prefectura: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [tipOption, setTipOption] = useState<'2' | '5' | 'custom' | null>('5');
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum: number, item: CartItem) =>
        sum + Number(item.unit_price) * Number(item.quantity),
      0
    );
  }, [cartItems]);

  const deliveryFee = 2.00;
  const tipAmount = tipOption === '2' ? 2 : tipOption === '5' ? 5 : 0; 
  const tax = subtotal * 0.08; 
  const total = subtotal + deliveryFee + tipAmount + tax;

  const currency = cartItems[0]?.currency || "USD";

  const placeOrder = async () => {
    setLoading(true);
    try {
        await new Promise(r => setTimeout(r, 1000)); // Simulating
        clearCart();
        navigation.reset({
            index: 0,
            routes: [{ name: "OrderSuccess" }],
        });
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
        <View style={styles.container}>
            <CustomNavbar title={t("checkout")} navigation={navigation} />
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{color: 'white', marginBottom: 20}}>{t("cartEmpty")}</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate("Catalog")}>
                    <Text style={styles.btnText}>{t("goToMenu")}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
  }

  return (
    <View style={styles.container}>
      <CustomNavbar title={t("checkout")} navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Delivery Address */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("streetAndNumber")}</Text>
            <TouchableOpacity><Text style={styles.editLink}>{t("edit")}</Text></TouchableOpacity>
        </View>
        
        <View style={styles.addressCard}>
            <View style={styles.iconCircle}>
                <Text style={{fontSize: 20}}>🏠</Text>
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.addressLabel}>{t("home")}</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                    {form.address}, {form.zip_code}
                </Text>
            </View>
        </View>

        {/* Payment Method */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("paymentMethod")}</Text>
        </View>

        <TouchableOpacity 
            style={[styles.paymentCard, paymentMethod === 'card' && styles.paymentCardActive]}
            onPress={() => setPaymentMethod('card')}
        >
            <View style={styles.paymentIcon}>
                <Text style={{fontSize: 20}}>💳</Text>
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.paymentLabel}>{t("creditCard")}</Text>
                <Text style={styles.paymentSub}>•••• •••• •••• 4242</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'card' && styles.radioActive]}>
                {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.paymentCard, paymentMethod === 'cash' && styles.paymentCardActive]}
            onPress={() => setPaymentMethod('cash')}
        >
            <View style={styles.paymentIcon}>
                <Text style={{fontSize: 20}}>💵</Text>
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.paymentLabel}>{t("payOnDelivery")}</Text>
                <Text style={styles.paymentSub}>{t("cash")}</Text>
            </View>
            <View style={[styles.radio, paymentMethod === 'cash' && styles.radioActive]}>
                {paymentMethod === 'cash' && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>

        {/* Order Summary */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("orderSummary")}</Text>
        </View>

        <View style={styles.summaryList}>
            {cartItems.map(item => (
                <View key={item.id} style={styles.itemRow}>
                    <Image 
                        source={{uri: item.pizza.image || "https://omnipizza.onrender.com/static/images/pizza-1.png"}} 
                        style={styles.itemImage} 
                    />
                    <View style={{flex: 1}}>
                        <Text style={styles.itemTitle}>{item.quantity}x {item.pizza.name}</Text>
                        <Text style={styles.itemDetails}>{item.config?.size}</Text>
                        
                        <View style={{flexDirection: 'row', gap: 16, marginTop: 4}}>
                            <TouchableOpacity onPress={() => {/* Edit logic would go here, ideally passing item to builder */}}>
                                <Text style={styles.actionLink}>{t("edit").toUpperCase()}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => useAppStore.getState().removeCartItem(item.id)}>
                                <Text style={[styles.actionLink, {color: '#EF4444'}]}>{t("remove").toUpperCase()}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.itemPrice}>{money(item.unit_price * item.quantity, currency)}</Text>
                </View>
            ))}
        </View>
        
        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("subtotal")}</Text>
            <Text style={styles.costValue}>{money(subtotal, currency)}</Text>
        </View>
        <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("deliveryFee")}</Text>
            <Text style={styles.costValue}>{money(deliveryFee, currency)}</Text>
        </View>

        {/* Tip Row */}
        <View style={[styles.costRow, { alignItems: 'center', marginVertical: 8 }]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Text style={styles.costLabel}>{t("tipForDriver")}</Text>
                <Text style={{color: '#666'}}>ℹ️</Text>
            </View>
            <View style={{flexDirection: 'row', gap: 8}}>
                <TouchableOpacity 
                    style={[styles.tipPill, tipOption === '2' && styles.tipPillActive]}
                    onPress={() => setTipOption('2')}
                >
                    <Text style={[styles.tipText, tipOption === '2' && styles.tipTextActive]}>$2</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tipPill, tipOption === '5' && styles.tipPillActive]}
                    onPress={() => setTipOption('5')}
                >
                    <Text style={[styles.tipText, tipOption === '5' && styles.tipTextActive]}>$5</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tipPill, tipOption === 'custom' && styles.tipPillActive]}
                    onPress={() => setTipOption('custom')}
                >
                    <Text style={[styles.tipText, tipOption === 'custom' && styles.tipTextActive]}>Custom</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.costRow}>
            <Text style={styles.costLabel}>{t("tax")} (9.5%)</Text>
            <Text style={styles.costValue}>{money(tax, currency)}</Text>
        </View>

        <View style={[styles.costRow, { marginTop: 20 }]}>
            <Text style={styles.totalLabel}>{t("totalPrice")}</Text>
            <Text style={styles.totalValue}>{money(total, currency)}</Text>
        </View>

        <Text style={styles.arrival}>{t("expectedArrival")}: 25-35 min</Text>
        
        <TouchableOpacity style={styles.btnPrimary} onPress={placeOrder} disabled={loading}>
            <Text style={styles.btnText}>{loading ? t("processing") : t("confirmPay") + "  →"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
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
    textTransform: 'uppercase',
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
    backgroundColor: "#2A1810", // dark orange bg
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
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  costLabel: {
    color: '#999',
    fontSize: 15,
  },
  costValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  tipPill: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tipPillActive: {
    backgroundColor: '#FF5722',
  },
  tipText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },
  tipTextActive: {
    color: 'white',
  },
  totalLabel: {
    color: '#999',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  totalValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
  },
  arrival: {
    textAlign: 'right',
    color: '#666',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 24,
  },
  btnPrimary: {
    backgroundColor: '#FF5722',
    borderRadius: 30, // Tall pill shape
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  actionLink: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FF5722',
      letterSpacing: 0.5,
  },
  btnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
