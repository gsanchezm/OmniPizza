import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getTestProps } from '../utils/qa';
import { SafeAreaView } from 'react-native-safe-area-context';

export const CustomNavbar = ({ title, navigation }: any) => {
  const { country, setCountry } = useAppStore();

  // Ciclo simple para cambiar país al tocar el badge: MX -> US -> CH -> JP -> MX
  const rotateCountry = () => {
    const sequence: Record<string, 'MX' | 'US' | 'CH' | 'JP'> = { 
      'MX': 'US', 'US': 'CH', 'CH': 'JP', 'JP': 'MX' 
    };
    setCountry(sequence[country] || 'MX');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Botón de Menú / Burger (Placeholder) */}
        <TouchableOpacity 
          onPress={() => console.log('Open Menu')}
          style={styles.btn}
          {...getTestProps('btn-burger-menu')}
        >
          <Text style={styles.icon}>☰</Text>
        </TouchableOpacity>

        {/* Título de la Pantalla */}
        <Text style={styles.title} {...getTestProps('text-navbar-title')}>
          {title}
        </Text>

        {/* Selector de País (Badge) */}
        <TouchableOpacity 
          style={[styles.badge, styles[`badge_${country}`]]}
          onPress={rotateCountry}
          {...getTestProps('btn-country-selector')}
        >
          <Text style={styles.badgeText} {...getTestProps('text-current-country')}>
            {country}
          </Text>
        </TouchableOpacity>

        {/* Carrito */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Checkout')}
          style={styles.btn}
          {...getTestProps('btn-navbar-cart')}
        >
          <Text style={styles.icon}>🛒</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles: any = StyleSheet.create({
  safeArea: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  container: { flexDirection: 'row', height: 50, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  title: { fontWeight: 'bold', fontSize: 18 },
  btn: { padding: 5 },
  icon: { fontSize: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  // Estilos dinámicos por país para validación visual
  badge_MX: { backgroundColor: '#009000' }, // Verde
  badge_US: { backgroundColor: '#3333CC' }, // Azul
  badge_CH: { backgroundColor: '#CC0000' }, // Rojo
  badge_JP: { backgroundColor: '#000000' }, // Negro
});