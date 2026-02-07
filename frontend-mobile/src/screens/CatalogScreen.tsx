import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';
import { useAppStore } from '../store/useAppStore';
import { getTestProps } from '../utils/qa';
import { formatCurrency } from '../utils/currency';
import { CustomNavbar } from '../components/CustomNavbar';

// Mock Data por si no tienes el backend corriendo aún
const MOCK_MENU = [
  { id: '1', name: 'Pepperoni', price: 10, image: 'https://placehold.co/100x100/png' },
  { id: '2', name: 'Margarita', price: 12, image: 'https://placehold.co/100x100/png' },
  { id: '3', name: 'Hawaiian', price: 11, image: 'https://placehold.co/100x100/png' },
  { id: '4', name: 'Veggie', price: 9, image: 'https://placehold.co/100x100/png' },
];

export default function CatalogScreen({ navigation }: any) {
  const { country } = useAppStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, [country]); // Recargar si cambia el país

  const fetchMenu = async () => {
    setLoading(true);
    try {
      // Intentamos llamar al backend real
      const response = await apiClient.get('/menu');
      setProducts(response.data);
    } catch (error) {
      console.log('Backend not reachable, using mock data');
      // Lógica de simulación de precios por país (backend behavior simulation)
      const multiplier = country === 'MX' ? 18 : country === 'JP' ? 140 : country === 'CH' ? 1.1 : 1;
      
      const localizedMock = MOCK_MENU.map(p => ({
        ...p,
        price: p.price * multiplier
      }));
      setProducts(localizedMock);
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
    <View style={styles.container}>
      {/* Insertamos nuestro Navbar personalizado */}
      <CustomNavbar title="OmniPizza Menu" navigation={navigation} />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} testID="loader-catalog" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          testID="list-products" // Para scrollear en Appium
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 10 },
  card: { 
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 10, 
    marginBottom: 10, padding: 10, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  image: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 10 },
  name: { fontWeight: 'bold', fontSize: 16 },
  desc: { color: '#777', fontSize: 12 },
  price: { fontWeight: 'bold', color: '#e74c3c', marginTop: 4 },
  addBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});