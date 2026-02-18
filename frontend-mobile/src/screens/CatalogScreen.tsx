import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { usePizzas } from "../hooks/usePizzas";
import { LocationHeader } from "../components/LocationHeader";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryPills } from "../components/CategoryPills";
import { MobileProductCard } from "../components/MobileProductCard";
import type { Pizza } from "../types/api";

export default function CatalogScreen({ navigation }: any) {
  const { country, language } = useAppStore();
  const { pizzas, loading, error } = usePizzas(country, language);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const openBuilderAdd = (pizza: Pizza) => {
    navigation.navigate("PizzaBuilder", { mode: "add", pizza });
  };

  const filteredPizzas = (pizzas || []).filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchCat = true;
      if (selectedCategory === 'veggie') matchCat = p.name.toLowerCase().includes('veggie') || p.description.toLowerCase().includes('vegetab');
      if (selectedCategory === 'meat') matchCat = p.name.toLowerCase().includes('meat') || p.name.toLowerCase().includes('pepperoni');
      return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      <LocationHeader onProfilePress={() => navigation.navigate("Profile")} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
           <View style={styles.searchBar}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <TextInput 
                placeholder="Search your pizza..."
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
           </View>
        </View>

        {/* Categories */}
        <View style={{ marginBottom: 24 }}>
           <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
        </View>

        {/* Hero Banner (only on 'all' or 'popular') */}
        {(selectedCategory === 'all' || selectedCategory === 'popular') && <HeroBanner />}

        {/* List Title */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Classic Selection</Text>
           <Text style={{ color: Colors.text.muted }}>▼</Text>
        </View>

        {/* Product List */}
        {loading ? (
           <ActivityIndicator size="large" color={Colors.brand.primary} style={{ marginTop: 40 }} />
        ) : error ? (
           <Text style={styles.errorText}>Unable to load menu. Check connection.</Text>
        ) : (
           <View style={styles.list}>
              {filteredPizzas.map(pizza => (
                 <MobileProductCard 
                   key={pizza.id} 
                   pizza={pizza} 
                   onPress={openBuilderAdd} 
                 />
              ))}
              {filteredPizzas.length === 0 && (
                 <Text style={styles.emptyText}>No pizzas found.</Text>
              )}
           </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.base2,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    gap: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: 24,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
