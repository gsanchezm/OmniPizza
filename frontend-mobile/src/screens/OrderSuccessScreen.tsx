import React from "react";
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
import { getCourierProfile } from "../features/orderSuccess/useCases/getCourierProfile";

const { width } = Dimensions.get("window");

export default function OrderSuccessScreen({ navigation }: any) {
  const t = useT();
  const { lastOrder } = useAppStore();

  const courier = getCourierProfile();

  return (
    <View style={styles.screen} accessibilityLabel="screen-order-success" testID="screen-order-success">
      {/* Map Background Area */}
      <View style={styles.mapContainer} accessibilityLabel="view-map-container">
        {/* Placeholder for map */}
        <View style={styles.mapPlaceholder} accessibilityLabel="view-map-placeholder">
          <Image
            source={require("../../assets/ui/map_background.png")}
            style={styles.mapImage}
            accessibilityLabel="img-map-background"
          />
          <View style={styles.mapOverlay} accessibilityLabel="view-map-overlay" />
        </View>

        {/* Header Controls */}
        <View style={styles.header} accessibilityLabel="view-success-header">
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate("Catalog")}
            testID="btn-back-catalog"
            accessibilityLabel="btn-back-catalog"
          >
            <Text style={{ color: "white", fontSize: 20 }} accessibilityLabel="icon-back">←</Text>
          </TouchableOpacity>

          <View style={styles.liveBadge} accessibilityLabel="view-live-badge" testID="view-live-badge">
            <View style={styles.liveDot} accessibilityLabel="view-live-dot" />
            <Text style={styles.liveText} accessibilityLabel="text-live-tracking">{t("liveTracking")}</Text>
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
            <Text style={styles.courierNameTag} accessibilityLabel="text-courier-tag">CARLOS</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomSheet} accessibilityLabel="view-bottom-sheet" testID="view-bottom-sheet">
        <Text style={styles.statusTitle} accessibilityLabel="text-status-title" testID="text-status-title">{t("outForDelivery")}</Text>
        <Text style={styles.statusSub} accessibilityLabel="text-status-sub">{t("expectedArrival")}: 8:45 PM</Text>

        <View style={styles.timeRow} accessibilityLabel="view-time-row">
          <Text style={styles.bigTime} accessibilityLabel="text-time-estimate" testID="text-time-estimate">15-20</Text>
          <Text style={styles.minLabel} accessibilityLabel="text-min-label">{t("min")}</Text>
        </View>

        {/* Courier Card */}
        <View style={styles.courierCard} accessibilityLabel="view-courier-card" testID="view-courier-card">
          <View style={styles.courierInfo} accessibilityLabel="view-courier-info">
            <Image
              source={{
                uri: "https://api.dicebear.com/7.x/avataaars/png?seed=Carlos",
              }}
              style={styles.courierAvatar}
              accessibilityLabel="img-courier-avatar"
            />
            <View style={styles.ratingBadge} accessibilityLabel="view-rating-badge">
              <Text style={styles.ratingText} accessibilityLabel="text-courier-rating">4.9 ★</Text>
            </View>

            <View style={{ marginLeft: 12 }} accessibilityLabel="view-courier-details">
              <Text style={styles.courierLabel} accessibilityLabel="text-courier-label">{t("yourCourier")}</Text>
              <Text style={styles.courierName} accessibilityLabel="text-courier-name" testID="text-courier-name">{courier.name}</Text>
              <Text style={styles.courierVehicle} accessibilityLabel="text-courier-vehicle">{t(courier.vehicle)}</Text>
            </View>
          </View>

          <View style={styles.actions} accessibilityLabel="view-courier-actions">
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#333" }]}
              testID="btn-courier-chat"
              accessibilityLabel="btn-courier-chat"
            >
              <Text style={{ fontSize: 20 }} accessibilityLabel="icon-chat">💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#FF5722" }]}
              accessibilityLabel="btn-courier-call"
              testID="btn-courier-call"
            >
              <Text style={{ fontSize: 20 }} accessibilityLabel="icon-call">📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Details Hint */}
        <TouchableOpacity style={styles.detailsBtn} accessibilityLabel="btn-order-details" testID="btn-order-details">
          <Text style={styles.detailsText} accessibilityLabel="text-order-details">
            {t("orderDetails").toUpperCase()}
          </Text>
          <Text style={{ color: "#666" }} accessibilityLabel="icon-expand">^</Text>
        </TouchableOpacity>
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
  statusTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  statusSub: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
    marginTop: -40,
    marginBottom: 30,
  },
  bigTime: {
    fontSize: 56,
    fontWeight: "900",
    color: "#FF5722",
    fontStyle: "italic",
    letterSpacing: -2,
  },
  minLabel: {
    fontSize: 14,
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
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
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
    gap: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});
