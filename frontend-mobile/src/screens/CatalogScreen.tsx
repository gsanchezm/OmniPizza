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
import { formatCurrency } from "../utils/currency";
import { CustomNavbar } from "../components/CustomNavbar";
import { Colors } from "../theme/colors";
import { GlobalStyles } from "../theme/styles";
import { useT } from "../i18n";

const MOCK_MENU = [
  { id: "1", name: "Pepperoni", price: 10, image: "https://placehold.co/100x100/png" },
  { id: "2", name: "Margarita", price: 12, image: "https://placehold.co/100x100/png" },
  { id: "3", name: "Hawaiian", price: 11, image: "https://placehold.co/100x100/png" },
  { id: "4", name: "Veggie", price: 9, image: "https://placehold.co/100x100/png" },
];

const t = useT();

export default function CatalogScreen({ navigation }: any) {
  const { country } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [country]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/menu");
      setProducts(response.data);
    } catch (error) {
      console.log("Backend not reachable, using mock data");

      const multiplier =
        country === "MX" ? 18 : country === "JP" ? 140 : country === "CH" ? 1.1 : 1;

      setProducts(
        MOCK_MENU.map((p) => ({
          ...p,
          price: p.price * multiplier,
        }))
      );
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
        <Text style={styles.desc}>Deliciosa pizza artesanal</Text>
        <Text style={styles.price} {...getTestProps(`text-product-price-${item.id}`)}>
          {formatCurrency(item.price, country)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => alert(`Added ${item.name}`)}
        {...getTestProps(`btn-add-cart-${item.id}`)}
      >
        <Text style={styles.addBtnText}>ADD</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={GlobalStyles.screen}>
      <CustomNavbar title={t("catalog")} navigation={navigation} />

      {loading ? (
        <ActivityIndicator
          size="large"
          style={{ marginTop: 20 }}
          color={Colors.brand.primary}
          testID="loader-catalog"
        />
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
  list: { padding: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.brand.secondary,
  },
  image: { width: 62, height: 62, borderRadius: 31, backgroundColor: Colors.surface.base },
  info: { flex: 1, marginLeft: 10 },
  name: { fontWeight: "900", fontSize: 16, color: Colors.text.primary },
  desc: { color: Colors.brand.secondary, fontSize: 12, marginTop: 2 },
  price: { fontWeight: "900", color: Colors.brand.primary, marginTop: 6 },
  addBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addBtnText: { color: Colors.text.inverse, fontWeight: "900", fontSize: 12 },
});
