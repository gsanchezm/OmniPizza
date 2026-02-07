import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getTestProps } from '../utils/qa';

export default function CheckoutScreen() {
  const { country } = useAppStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout ({country})</Text>
      
      {/* Campos Comunes */}
      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        {...getTestProps('input-fullname')} 
      />

      {/* Lógica Específica por País */}
      
      {/* MEXICO */}
      {country === 'MX' && (
        <>
          <TextInput 
            style={styles.input} 
            placeholder="Colonia (Requerido)" 
            {...getTestProps('input-colonia-mx')} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Propina ($ o %)" 
            keyboardType="numeric"
            {...getTestProps('input-tip-mx')} 
          />
        </>
      )}

      {/* USA */}
      {country === 'US' && (
        <>
          <TextInput 
            style={styles.input} 
            placeholder="ZIP Code (5 digits)" 
            keyboardType="numeric"
            maxLength={5}
            {...getTestProps('input-zip-us')} 
          />
          <Text {...getTestProps('text-tax-warning')}>* Sales Tax will be added</Text>
        </>
      )}

      {/* SUIZA */}
      {country === 'CH' && (
        <>
          <TextInput 
            style={styles.input} 
            placeholder="PLZ (Postal Code)" 
            {...getTestProps('input-plz-ch')} 
          />
          <View style={styles.row}>
            <Text>Deutsch</Text>
            <Switch {...getTestProps('toggle-lang-ch')} />
            <Text>Français</Text>
          </View>
        </>
      )}

      {/* JAPON */}
      {country === 'JP' && (
        <>
           <TextInput 
            style={styles.input} 
            placeholder="都道府県 (Prefecture)" 
            {...getTestProps('input-prefecture-jp')} 
          />
          {/* Aquí irían caracteres Kanji simulados */}
        </>
      )}

      <View style={styles.spacer} />
      
      <Button 
        title="Place Order" 
        color={country === 'JP' ? 'red' : '#007AFF'}
        onPress={() => alert('Order Placed!')} 
        {...getTestProps('btn-place-order')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#888', padding: 12, marginBottom: 15, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  spacer: { height: 20 }
});