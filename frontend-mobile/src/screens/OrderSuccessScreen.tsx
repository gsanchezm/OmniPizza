import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { useRTL } from "../hooks/useRTL";
import { getCourierProfile } from "../features/orderSuccess/useCases/getCourierProfile";
import { getReadableControlProps, getReadableTextProps } from "../utils/qa";

const { width } = Dimensions.get("window");

export default function OrderSuccessScreen({ navigation }: any) {
  const t = useT();
  const { textAlign } = useRTL();
  const lastOrder = useAppStore((s) => s.lastOrder);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const courier = getCourierProfile();

  const fmtMoney = (value: number) => {
    const currency = lastOrder?.currency;
    const symbol =
      lastOrder?.currency_symbol ?? (currency === "JPY" ? "¥" : "$");
    const amount =
      currency === "JPY"
        ? Math.round(value)
        : Math.round((value + Number.EPSILON) * 100) / 100;
    return currency === "JPY" ? `${symbol}${amount}` : `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.screen} accessibilityLabel="screen-order-success" testID="screen-order-success">
      {/* Map Background Area */}
      <View style={styles.mapContainer} accessibilityLabel="view-map-container">
        {/* Placeholder for map */}
        <View style={styles.mapPlaceholder} accessibilityLabel="view-map-placeholder">
          <Image
            source={require("../../assets/ui/map_background.png")}
            style={styles.mapImage}
            accessible={false}
            importantForAccessibility="no"
          />
          <View style={styles.mapOverlay} accessibilityLabel="view-map-overlay" />
        </View>

        {/* Header Controls */}
        <View style={styles.header} accessibilityLabel="view-success-header">
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate("Catalog")}
            testID="btn-back-catalog"
            accessibilityLabel={t("catalog")}
            accessibilityRole="button"
          >
            <Text style={{ color: "white", fontSize: 20 }} importantForAccessibility="no">←</Text>
          </TouchableOpacity>

          <View style={styles.liveBadge} accessibilityLabel="view-live-badge" testID="view-live-badge">
            <View style={styles.liveDot} accessibilityLabel="view-live-dot" />
            <Text style={styles.liveText} {...getReadableTextProps("text-live-tracking", t("liveTracking"))}>{t("liveTracking")}</Text>
          </View>

          <View style={styles.supportBtn} accessibilityLabel="btn-support">
            <Text style={{ fontSize: 20 }} accessibilityLabel="icon-support">🎧</Text>
          </View>
        </View>

        {/* Pulse Animation Placeholder */}
        <View style={styles.pulseContainer} accessibilityLabel="view-pulse-container">
          <View style={styles.pulseRing} accessibilityLabel="view-pulse-ring" />
          <View style={styles.pulseCore} accessibilityLabel="view-pulse-core">
            <Text style={{ fontSize: 24 }} accessibilityLabel="icon-pizza-delivery">🍕</Text>
          </View>
          <View style={styles.courierTag} accessibilityLabel="view-courier-tag">
            <Text style={styles.courierNameTag} {...getReadableTextProps("text-courier-tag", "CARLOS")}>CARLOS</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomSheet} accessibilityLabel="view-bottom-sheet" testID="view-bottom-sheet">
        <View style={styles.statusRow} accessibilityLabel="view-status-row">
          <View style={styles.statusTextCol} accessibilityLabel="view-status-text">
            <Text style={[styles.statusTitle, { textAlign }]} numberOfLines={1} ellipsizeMode="tail" {...getReadableTextProps("text-status-title", t("outForDelivery"))}>{t("outForDelivery")}</Text>
            <Text style={[styles.statusSub, { textAlign }]} numberOfLines={1} {...getReadableTextProps("text-status-sub", `${t("expectedArrival")}: 8:45 PM`)}>{t("expectedArrival")}: 8:45 PM</Text>
          </View>

          <View style={styles.timeRow} accessibilityLabel="view-time-row">
            <Text style={styles.bigTime} {...getReadableTextProps("text-time-estimate", "15-20")}>15-20</Text>
            <Text style={styles.minLabel} {...getReadableTextProps("text-min-label", t("min"))}>{t("min")}</Text>
          </View>
        </View>

        {/* Courier Card */}
        <View style={styles.courierCard} accessibilityLabel="view-courier-card" testID="view-courier-card">
          <View style={styles.courierInfo} accessibilityLabel="view-courier-info">
            <View style={styles.avatarWrap} accessibilityLabel="view-avatar-wrap">
              <Image
                source={{
                  uri: "https://api.dicebear.com/7.x/avataaars/png?seed=Carlos",
                }}
                style={styles.courierAvatar}
                accessibilityLabel={courier.name}
              />
              <View style={styles.ratingBadge} accessibilityLabel="view-rating-badge">
                <Text style={styles.ratingText} {...getReadableTextProps("text-courier-rating", "4.9 ★")}>4.9 ★</Text>
              </View>
            </View>

            <View style={styles.courierDetails} accessibilityLabel="view-courier-details">
              <Text style={[styles.courierLabel, { textAlign }]} numberOfLines={1} {...getReadableTextProps("text-courier-label", t("yourCourier"))}>{t("yourCourier")}</Text>
              <Text style={[styles.courierName, { textAlign }]} numberOfLines={1} {...getReadableTextProps("text-courier-name", courier.name)}>{courier.name}</Text>
              <Text style={[styles.courierVehicle, { textAlign }]} numberOfLines={1} {...getReadableTextProps("text-courier-vehicle", t(courier.vehicle))}>{t(courier.vehicle)}</Text>
            </View>
          </View>

          <View style={styles.actions} accessibilityLabel="view-courier-actions">
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#333" }]}
              testID="btn-courier-chat"
              accessibilityLabel={`Chat with ${courier.name}`}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 18 }} importantForAccessibility="no">💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#FF5722" }]}
              accessibilityLabel={`Call ${courier.name}`}
              accessibilityRole="button"
              testID="btn-courier-call"
            >
              <Text style={{ fontSize: 18 }} importantForAccessibility="no">📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Details accordion */}
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => setDetailsOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: detailsOpen }}
          {...getReadableControlProps("btn-order-details", t("orderDetails").toUpperCase())}
        >
          <Text style={styles.detailsText} {...getReadableTextProps("text-order-details", t("orderDetails").toUpperCase())}>
            {t("orderDetails").toUpperCase()}
          </Text>
          <Text style={{ color: "#666" }} importantForAccessibility="no">
            {detailsOpen ? "⌄" : "^"}
          </Text>
        </TouchableOpacity>

        {detailsOpen && (
          <View style={styles.detailsPanel} accessibilityLabel="view-order-details-panel" testID="view-order-details-panel">
            {lastOrder ? (
              <>
                <View style={styles.detailsRow} accessibilityLabel="view-details-order-id">
                  <Text style={[styles.detailsRowLabel, { textAlign }]} {...getReadableTextProps("text-details-order-id-label", t("orderId"))}>{t("orderId")}</Text>
                  <Text style={styles.detailsRowValue} numberOfLines={1} {...getReadableTextProps("text-details-order-id-value", String(lastOrder.order_id))}>{lastOrder.order_id}</Text>
                </View>
                <View style={styles.detailsRow} accessibilityLabel="view-details-subtotal">
                  <Text style={[styles.detailsRowLabel, { textAlign }]} {...getReadableTextProps("text-details-subtotal-label", t("subtotal"))}>{t("subtotal")}</Text>
                  <Text style={styles.detailsRowValue} {...getReadableTextProps("text-details-subtotal-value", fmtMoney(lastOrder.subtotal))}>{fmtMoney(lastOrder.subtotal)}</Text>
                </View>
                <View style={styles.detailsRow} accessibilityLabel="view-details-delivery">
                  <Text style={[styles.detailsRowLabel, { textAlign }]} {...getReadableTextProps("text-details-delivery-label", t("deliveryFee"))}>{t("deliveryFee")}</Text>
                  <Text style={styles.detailsRowValue} {...getReadableTextProps("text-details-delivery-value", fmtMoney(lastOrder.delivery_fee))}>{fmtMoney(lastOrder.delivery_fee)}</Text>
                </View>
                <View style={styles.detailsRow} accessibilityLabel="view-details-tax">
                  <Text style={[styles.detailsRowLabel, { textAlign }]} {...getReadableTextProps("text-details-tax-label", t("tax"))}>{t("tax")}</Text>
                  <Text style={styles.detailsRowValue} {...getReadableTextProps("text-details-tax-value", fmtMoney(lastOrder.tax))}>{fmtMoney(lastOrder.tax)}</Text>
                </View>
                <View style={styles.detailsRow} accessibilityLabel="view-details-tip">
                  <Text style={[styles.detailsRowLabel, { textAlign }]} {...getReadableTextProps("text-details-tip-label", t("tip"))}>{t("tip")}</Text>
                  <Text style={styles.detailsRowValue} {...getReadableTextProps("text-details-tip-value", fmtMoney(lastOrder.tip))}>{fmtMoney(lastOrder.tip)}</Text>
                </View>
                <View style={[styles.detailsRow, styles.detailsRowTotal]} accessibilityLabel="view-details-total">
                  <Text style={[styles.detailsTotalLabel, { textAlign }]} {...getReadableTextProps("text-details-total-label", t("total"))}>{t("total")}</Text>
                  <Text style={styles.detailsTotalValue} {...getReadableTextProps("text-details-total-value", fmtMoney(lastOrder.total))}>{fmtMoney(lastOrder.total)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.detailsEmpty} {...getReadableTextProps("text-details-empty", t("noOrderFound"))}>{t("noOrderFound")}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0F0F0F" },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  mapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  supportBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  liveBadge: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5722",
  },
  liveText: {
    color: "#FF5722",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  pulseContainer: {
    position: "absolute",
    top: "40%",
    left: width / 2 - 40,
    alignItems: "center",
  },
  pulseRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 87, 34, 0.2)",
    position: "absolute",
  },
  pulseCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 87, 34, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    borderWidth: 3,
    borderColor: "#FFCCBC",
  },
  courierTag: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: -10,
  },
  courierNameTag: {
    color: "white",
    fontWeight: "800",
    fontSize: 10,
  },

  bottomSheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 50,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  statusSub: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexShrink: 0,
  },
  bigTime: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FF5722",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  minLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FF5722",
    marginLeft: 4,
  },

  courierCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  courierDetails: {
    flex: 1,
    minWidth: 0,
  },
  courierAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -6,
    left: 10,
    backgroundColor: "#FF5722",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  courierLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  courierName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  courierVehicle: {
    color: "#888",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  detailsBtn: {
    marginTop: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  detailsText: {
    color: "#666",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  detailsPanel: {
    marginTop: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 16,
    gap: 10,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  detailsRowLabel: {
    color: "#888",
    fontSize: 14,
    flexShrink: 1,
    marginRight: 8,
  },
  detailsRowValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
    textAlign: "right",
  },
  detailsRowTotal: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  detailsTotalLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  detailsTotalValue: {
    color: "#FF5722",
    fontSize: 16,
    fontWeight: "900",
    flexShrink: 0,
    textAlign: "right",
  },
  detailsEmpty: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
});
