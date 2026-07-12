import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useCatalogPizzas } from "../features/catalog/hooks/useCatalogPizzas";
import { LocationHeader } from "../components/LocationHeader";
import { BottomNavBar } from "../components/BottomNavBar";
import { CategoryPills } from "../components/CategoryPills";
import { MobileProductCard } from "../components/MobileProductCard";
import type { Pizza } from "../types/api";
import { useT } from "../i18n";
import { getReadableTextProps, getTestProps } from "../utils/qa";

export default function CatalogScreen({ navigation }: any) {
  const t = useT();
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const { pizzas, loading, error } = useCatalogPizzas(country, language);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const openBuilderAdd = useCallback(
    (pizza: Pizza) => {
      navigation.navigate("PizzaBuilder", { mode: "add", pizza });
    },
    [navigation]
  );

  const filteredPizzas = useMemo(
    () =>
      (pizzas || []).filter((p) => {
        const matchSearch = p.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchCat =
          selectedCategory === "all" || p.category === selectedCategory;
        return matchSearch && matchCat;
      }),
    [pizzas, searchQuery, selectedCategory]
  );

  return (
    <SafeAreaView style={styles.safeArea} accessibilityLabel="screen-catalog" testID="screen-catalog">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

      <LocationHeader onProfilePress={() => navigation.navigate("Profile")} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        {...getTestProps("scroll-catalog")}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer} accessibilityLabel="view-search-container">
          <View style={styles.searchBar} accessibilityLabel="view-search-bar">
            <Text style={{ fontSize: 16 }} accessibilityLabel="icon-search">🔍</Text>
            <TextInput
              placeholder={t("searchPlaceholder")}
              placeholderTextColor={Colors.text.muted}
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="input-search-pizza"
              accessibilityLabel="input-search-pizza"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={{ marginBottom: 24 }} accessibilityLabel="view-categories">
          <CategoryPills
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        {/* Product List */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.brand.primary}
            style={{ marginTop: 40 }}
            accessibilityLabel="loader-catalog"
          />
        ) : error ? (
          <Text style={styles.errorText} {...getReadableTextProps("text-catalog-error", "Unable to load menu. Check connection.")}>
            Unable to load menu. Check connection.
          </Text>
        ) : (
          <View style={styles.list} accessibilityLabel="view-pizza-list">
            {filteredPizzas.map((pizza) => (
              <MobileProductCard
                key={pizza.id}
                pizza={pizza}
                onPress={openBuilderAdd}
              />
            ))}
            {filteredPizzas.length === 0 && (
              <Text style={styles.emptyText} {...getReadableTextProps("text-empty-results", "No pizzas found matching your criteria.")}>No pizzas found matching your criteria.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface.base2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  input: {
    flex: 1,
    marginStart: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  list: {
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    color: Colors.danger,
    textAlign: "center",
    marginTop: 40,
  },
  emptyText: {
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: 40,
  },
});
