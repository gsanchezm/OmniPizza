import React from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
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
  const { pizzas, loading } = usePizzas(country, language);

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
        <ActivityIndicator size="large" color={Colors.brand.primary} style={{ marginTop: 20 }} />
      ) : (
          <FlatList
            data={pizzas}
            keyExtractor={(pizza) => pizza.id}
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
});
