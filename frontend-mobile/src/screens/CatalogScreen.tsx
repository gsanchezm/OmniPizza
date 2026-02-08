import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { apiClient } from "../api/client";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { CustomNavbar } from "../components/CustomNavbar";
import { useT } from "../i18n";

export default function CatalogScreen({ navigation }: any) {
  const t = useT();
  const { country, language, addToCart } = useAppStore();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [country, language]); // ✅ market + language

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/pizzas");
      setProducts(res.data?.pizzas || []);
    } catch (e) {
      console.log("Failed to load /api/pizzas", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card} {...getTestProps(`card-product-${item.id}`)}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name} {...getTestProps(`text-product-name-${item.id}`)}>
          {item.name}
        </Text>

        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>

        <Text style={styles.price} {...getTestProps(`text-product-price-${item.id}`)}>
          {item.currency_symbol}{item.price} {item.currency}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => addToCart(item)}
        {...getTestProps(`btn-add-cart-${item.id}`)}
      >
        <Text style={styles.addBtnText}>{t("addToCart")}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomNavbar title={t("catalog")} navigation={navigation} />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} testID="loader-catalog" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          testID="list-products"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07070A" },
  list: { padding: 12 },

  card: {
    flexDirection: "row",
    backgroundColor: "#121218",
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(220,202,135,0.22)",
  },

  image: { width: 62, height: 62, borderRadius: 12, backgroundColor: "#0C0C12" },
  info: { flex: 1, marginLeft: 10 },

  name: { fontWeight: "900", fontSize: 16, color: "#F5F5F5" },
  desc: { color: "rgba(245,245,245,0.68)", fontSize: 12, marginTop: 2 },
  price: { fontWeight: "900", color: "#DCCA87", marginTop: 6 },

  addBtn: {
    backgroundColor: "#DCCA87",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addBtnText: { color: "#111", fontWeight: "900", fontSize: 12 },
});
