import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { CustomNavbar } from "../components/CustomNavbar";
import { PizzaCard } from "../components/PizzaCard";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";
import { usePizzas } from "../hooks/usePizzas";
import type { Pizza } from "../types/api";

export default function CatalogScreen({ navigation }: any) {
  const t = useT();
  const { country, language } = useAppStore();
  const { pizzas, loading, error, reload } = usePizzas(country, language);

  const openBuilderAdd = (pizza: Pizza) => {
    navigation.navigate("PizzaBuilder", {
      mode: "add",
      pizza,
    });
  };

  const renderItem = ({ item }: { item: Pizza }) => (
    <PizzaCard pizza={item} addLabel={t("addToCart")} onAdd={openBuilderAdd} />
  );

  return (
    <View style={styles.container}>
      <CustomNavbar title={t("catalog")} navigation={navigation} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.brand.primary}
          style={{ marginTop: 20 }}
        />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Unable to load pizzas</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pizzas}
          keyExtractor={(pizza) => pizza.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No pizzas found for this market.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.base },
  list: { padding: 12 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorDetail: {
    color: Colors.text.muted,
    textAlign: "center",
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
