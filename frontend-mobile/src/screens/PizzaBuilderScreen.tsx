import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Image,
  Dimensions,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../pizzaOptions";
import type { Pizza } from "../types/api";
import type { PizzaSize, PizzaConfig } from "../store/useAppStore";

const tOpt = (obj: any, lang: string) => obj?.[lang] || obj?.en || "";

function getRate(pizza: Pizza) {
  const bp = Number(pizza?.base_price);
  const p = Number(pizza?.price);
  if (!bp || bp <= 0 || !p || p <= 0) return 1;
  return p / bp;
}
function usdToLocalCeil(usd: number, pizza: Pizza) {
  return Math.ceil(usd * getRate(pizza));
}
function computeUnitPrice(
  pizza: Pizza,
  sizeUsd: number,
  toppingsCount: number,
) {
  const base = Number(pizza.price);
  const sizeAdd = usdToLocalCeil(sizeUsd, pizza);
  const toppingUnit = usdToLocalCeil(1, pizza);
  return base + sizeAdd + toppingUnit * toppingsCount;
}

function normalizeMoneyAmount(value: number, currency?: string) {
  if (!Number.isFinite(value)) return 0;
  if (currency === "JPY") return Math.round(value);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number, currency?: string, symbol?: string) {
  const amount = normalizeMoneyAmount(value, currency);
  const safeSymbol =
    typeof symbol === "string" ? symbol : currency === "JPY" ? "¥" : "$";
  if (currency === "JPY") return `${safeSymbol}${amount}`;
  return `${safeSymbol}${amount.toFixed(2)}`;
}

const { width } = Dimensions.get("window");

export default function PizzaBuilderScreen({ route, navigation }: any) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { country, language, addConfiguredItem, updateCartItem } =
    useAppStore();

  const mode = route?.params?.mode || "add";
  const initialPizza = route?.params?.pizza as Pizza | undefined;
  const cartItemId = route?.params?.cartItemId;
  const initialConfig = route?.params?.initialConfig;

  const [pizza, setPizza] = useState<Pizza | undefined>(initialPizza);

  React.useEffect(() => {
    if (!initialPizza?.id) return;
    import("../services/pizza.service").then(({ pizzaService }) => {
      pizzaService.getPizzas().then((list) => {
        const found = list.find((p) => p.id === initialPizza.id);
        if (found) setPizza(found);
        else navigation.goBack();
      });
    });
  }, [country, language, initialPizza?.id, navigation]);

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
    if (!pizza) return;
    const finalUnitPrice = normalizeMoneyAmount(unitPrice, pizza.currency);

    const config: PizzaConfig = {
      size,
      toppings,
    };

    if (mode === "edit" && cartItemId) {
      updateCartItem(cartItemId, { config, unit_price: finalUnitPrice });
      navigation.goBack();
      return;
    }
    addConfiguredItem(pizza, config, finalUnitPrice);
    navigation.goBack();
  };

  if (!pizza) return null;

  return (
    <View style={styles.screen} accessibilityLabel="screen-pizza-builder" testID="screen-pizza-builder">
      {/* Header */}
      <View style={styles.header} accessibilityLabel="view-builder-header">
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          testID="btn-close-builder"
          accessibilityLabel="btn-close-builder"
        >
          <Text style={{ color: "white", fontSize: 18 }} accessibilityLabel="icon-close">✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityLabel="text-builder-title" testID="text-builder-title">
          {tOpt(UI_STRINGS.title, language)}
        </Text>
        <TouchableOpacity style={styles.iconBtn} accessibilityLabel="btn-info-builder">
          <Text style={{ color: "white", fontSize: 18 }} accessibilityLabel="icon-info">ⓘ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} accessibilityLabel="scroll-builder">
        {/* Pizza Image */}
        <View style={styles.imageContainer} accessibilityLabel="view-pizza-image-container">
          {/* Radial Gradient Background approximation with view layers */}
          <View style={styles.glow} accessibilityLabel="view-pizza-glow" />
          <Image
            source={{
              uri:
                pizza.image ||
                "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg",
            }}
            style={styles.pizzaImage}
            accessibilityLabel="img-builder-pizza"
            testID="img-builder-pizza"
          />
        </View>

        <View style={styles.cardContent} accessibilityLabel="view-builder-content">
          {/* Size Selector */}
          <View style={styles.sectionHeader} accessibilityLabel="view-section-size">
            <Text style={styles.sectionTitle} accessibilityLabel="text-section-size">
              {tOpt(UI_STRINGS.size, language)}
            </Text>
            <Text style={styles.badge} accessibilityLabel="text-badge-required" testID="text-badge-required">
              {tOpt({ en: "Required", es: "Requerido" }, language)}
            </Text>
          </View>

          <View style={styles.sizePills} accessibilityLabel="view-size-pills" testID="view-size-pills">
            {SIZE_OPTIONS.map((opt) => {
              const active = opt.id === size;
              const rawLabelText = String(tOpt(opt.label, language));
              const mainText = rawLabelText.replace(/\s*\(.+\)\s*$/, "").trim();
              const localSizeAdd =
                opt.usd > 0 ? usdToLocalCeil(opt.usd, pizza) : 0;
              const subText =
                localSizeAdd > 0
                  ? `(+${formatMoney(localSizeAdd, pizza.currency, pizza.currency_symbol)})`
                  : null;
              const hasPrice = subText !== null;

              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSize(opt.id)}
                  style={[styles.sizePill, active && styles.sizePillActive]}
                  accessibilityLabel={`btn-size-${opt.id}`}
                  testID={`btn-size-${opt.id}`}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      active && styles.sizeTextActive,
                      hasPrice && { marginBottom: 2 },
                    ]}
                    accessibilityLabel={`text-size-${opt.id}`}
                  >
                    {mainText}
                  </Text>
                  {subText && (
                    <Text
                      style={[
                        styles.sizeSubText,
                        active && styles.sizeSubTextActive,
                      ]}
                      accessibilityLabel={`text-size-price-${opt.id}`}
                    >
                      {subText}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Toppings Selector */}
          <View style={[styles.sectionHeader, { marginTop: 30 }]} accessibilityLabel="view-section-toppings">
            <Text style={styles.sectionTitle} accessibilityLabel="text-section-toppings">
              {tOpt(UI_STRINGS.toppings, language)}
            </Text>
            <Text style={styles.priceHint} accessibilityLabel="text-toppings-hint" testID="text-toppings-hint">
              {tOpt(UI_STRINGS.upTo10, language)}
            </Text>
          </View>

          {TOPPING_GROUPS.map((group) => (
            <View key={group.id} style={{ marginBottom: 20 }} accessibilityLabel={`view-topping-group-${group.id}`}>
              <Text style={styles.groupTitle} accessibilityLabel={`text-topping-group-${group.id}`}>
                {tOpt(group.label, language)}
              </Text>
              <View style={styles.grid} accessibilityLabel={`view-topping-grid-${group.id}`}>
                {group.items.map((it) => {
                  const isSelected = toppings.includes(it.id);
                  const disabled = !isSelected && toppings.length >= 10;
                  return (
                    <TouchableOpacity
                      key={it.id}
                      onPress={() => toggleTopping(it.id)}
                      disabled={disabled}
                      style={[
                        styles.toppingCard,
                        isSelected && styles.toppingCardActive,
                        disabled && { opacity: 0.5 },
                      ]}
                      accessibilityLabel={`btn-topping-${it.id}`}
                      testID={`btn-topping-${it.id}`}
                    >
                      <View
                        style={[
                          styles.toppingIconCircle,
                          isSelected && {
                            backgroundColor: "rgba(255, 87, 34, 0.2)",
                          },
                        ]}
                        accessibilityLabel={`view-topping-icon-${it.id}`}
                      >
                        {(it as any).image ? (
                          <Image
                            source={(it as any).image}
                            style={{
                              width: 40,
                              height: 40,
                              resizeMode: "contain",
                            }}
                            accessibilityLabel={`img-topping-${it.id}`}
                          />
                        ) : (
                          <Text style={{ fontSize: 24 }} accessibilityLabel={`icon-topping-${it.id}`}>🧀</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.toppingName,
                          isSelected && { color: "white" },
                        ]}
                        accessibilityLabel={`text-topping-${it.id}`}
                      >
                        {tOpt(it.label, language)}
                      </Text>

                      {isSelected && (
                        <View style={styles.checkBadge} accessibilityLabel={`view-check-${it.id}`}>
                          <Text
                            style={{
                              color: "white",
                              fontSize: 10,
                              fontWeight: "bold",
                            }}
                            accessibilityLabel={`icon-check-${it.id}`}
                          >
                            ✓
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar} accessibilityLabel="view-builder-bottom-bar">
        <View style={styles.barContent} accessibilityLabel="view-bar-content">
          <View accessibilityLabel="view-estimated-total">
            <Text style={styles.totalLabel} accessibilityLabel="text-estimated-total-label">
              {tOpt(
                {
                  en: "ESTIMATED TOTAL",
                  es: "TOTAL ESTIMADO",
                  de: "GESAMTSUMME",
                  fr: "TOTAL ESTIMÉ",
                  ja: "推定合計",
                },
                language,
              )}
            </Text>
            <Text style={styles.totalValue} accessibilityLabel="text-estimated-total-value" testID="text-estimated-total-value">
              {formatMoney(unitPrice, pizza.currency, pizza.currency_symbol)}
            </Text>
          </View>

          <TouchableOpacity style={styles.addToCartBtn} onPress={confirm} testID="btn-add-to-cart" accessibilityLabel="btn-add-to-cart">
            <Text style={styles.addToCartText} accessibilityLabel="text-add-to-cart">
              {mode === "edit"
                ? tOpt(
                    {
                      en: "Update",
                      es: "Actualizar",
                      de: "Aktualisieren",
                      fr: "Mettre à jour",
                      ja: "更新",
                    },
                    language,
                  )
                : tOpt(UI_STRINGS.confirm, language)}
            </Text>
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-cart">🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F0F0F" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    alignItems: "center",
  },
  imageContainer: {
    height: 280,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#2A2A2A",
    opacity: 0.8,
  },
  pizzaImage: {
    width: 260,
    height: 260,
    resizeMode: "contain",
  },
  cardContent: {
    width: "100%",
    paddingHorizontal: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  badge: {
    color: "#FF5722",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  priceHint: {
    color: "#888",
    fontSize: 14,
  },

  sizePills: {
    flexDirection: "row",
    backgroundColor: "#1F1F1F",
    borderRadius: 30,
    padding: 4,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
  },
  sizePillActive: {
    backgroundColor: "#FF5722",
  },
  sizeText: {
    color: "#888",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  sizeTextActive: {
    color: "white",
  },
  sizeSubText: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  sizeSubTextActive: {
    color: "rgba(255,255,255,0.9)",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  toppingCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2A2A2A",
    position: "relative",
  },
  toppingCardActive: {
    borderColor: "#FF5722",
    backgroundColor: "rgba(255, 87, 34, 0.05)",
  },
  toppingIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  toppingName: {
    color: "#888",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5722",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    justifyContent: "flex-end",
    backgroundColor: "#161616",
    borderTopWidth: 1,
    borderTopColor: "#333",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  barContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 30,
    paddingTop: 20,
  },
  totalLabel: {
    color: "#888",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValue: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
  addToCartBtn: {
    backgroundColor: "#FF5722",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addToCartText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  groupTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
});
