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
import { CustomNavbar } from "../components/CustomNavbar";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";

function moneyLine(p: any) {
  return `${p.currency_symbol}${p.price} ${p.currency}`;
}

export default function CatalogScreen({ navigation }: any) {
  const t = useT();
  const { country, language } = useAppStore();

  const [pizzas, setPizzas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPizzas();
  }, [country, language]);

  const loadPizzas = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/pizzas");
      setPizzas(res.data?.pizzas || []);
    } catch (e) {
      console.log("Failed to load /api/pizzas", e);
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  };

  const openBuilderAdd = (pizza: any) => {
    navigation.navigate("PizzaBuilder", {
      mode: "add",
      pizza,
    });
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.image}
        onError={(e: any) => {
          e?.currentTarget?.setNativeProps?.({
            source: [{ uri: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg" }],
          });
        }}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>{moneyLine(item)}</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => openBuilderAdd(item)}>
        <Text style={styles.addBtnText}>{t("addToCart")}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomNavbar title={t("catalog")} navigation={navigation} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.brand.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={pizzas}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.base },
  list: { padding: 12 },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },

  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.surface.base2 },
  info: { flex: 1, marginLeft: 10 },

  name: { fontWeight: "800", fontSize: 16, color: Colors.text.primary },
  desc: { color: Colors.text.muted, fontSize: 12, marginTop: 2 },
  price: { fontWeight: "800", color: Colors.brand.primary, marginTop: 6 },

  addBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
});
