import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { CustomNavbar } from "../components/CustomNavbar";

export default function OrderSuccessScreen({ navigation }: any) {
  const t = useT();
  const { lastOrder } = useAppStore();

  return (
    <View style={styles.screen}>
      <CustomNavbar title="✅" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("successTitle")}</Text>
          <Text style={styles.sub}>{t("successSubtitle")}</Text>

          {lastOrder?.order_id ? (
            <View style={styles.box}>
              <Text style={styles.muted}>Order ID</Text>
              <Text style={styles.orderId}>{lastOrder.order_id}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>No order found</Text>
          )}

          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Catalog")}>
            <Text style={styles.btnText}>{t("backToCatalog")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.base },
  scrollContent: { padding: 14, alignItems: "center" },
  card: { width: "100%", maxWidth: 920, padding: 16, borderRadius: 18, backgroundColor: Colors.surface.card, borderWidth: 1, borderColor: Colors.surface.border },
  title: { fontSize: 22, fontWeight: "800", color: Colors.brand.primary },
  sub: { marginTop: 6, color: Colors.text.muted, fontWeight: "700" },
  box: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: Colors.surface.base2, borderWidth: 1, borderColor: Colors.surface.border },
  muted: { color: Colors.text.muted, fontWeight: "700" },
  orderId: { marginTop: 4, fontSize: 20, fontWeight: "800", color: Colors.text.primary },
  btn: { marginTop: 16, backgroundColor: Colors.brand.primary, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { fontWeight: "800", color: "#FFFFFF" },
});
