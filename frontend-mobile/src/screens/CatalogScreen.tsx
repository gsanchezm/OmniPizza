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
import { useT } from "../i18n";

function moneyLine(p: any) {
  // backend returns: price, currency, currency_symbol
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
          // fallback pizza image
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
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
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

  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#0C0C12" },
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
