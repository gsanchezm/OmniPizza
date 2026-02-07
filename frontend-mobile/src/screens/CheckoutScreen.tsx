import React from "react";
import { View, Text, TextInput, StyleSheet, Switch, ScrollView, TouchableOpacity } from "react-native";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";
import { GlobalStyles } from "../theme/styles";
import { CustomNavbar } from "../components/CustomNavbar";

export default function CheckoutScreen({ navigation }: any) {
  const { country } = useAppStore();

  return (
    <View style={GlobalStyles.screen}>
      <CustomNavbar title="Checkout" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Checkout ({country})</Text>

        <View style={styles.card}>
          <TextInput
            style={[GlobalStyles.input, styles.input]}
            placeholder="Full Name"
            placeholderTextColor="#666"
            {...getTestProps("input-fullname")}
          />

          {/* MX */}
          {country === "MX" && (
            <>
              <TextInput
                style={[GlobalStyles.input, styles.input]}
                placeholder="Colonia (Requerido)"
                placeholderTextColor="#666"
                {...getTestProps("input-colonia-mx")}
              />
              <TextInput
                style={[GlobalStyles.input, styles.input]}
                placeholder="Propina ($ o %)"
                placeholderTextColor="#666"
                keyboardType="numeric"
                {...getTestProps("input-tip-mx")}
              />
            </>
          )}

          {/* US */}
          {country === "US" && (
            <>
              <TextInput
                style={[GlobalStyles.input, styles.input]}
                placeholder="ZIP Code (5 digits)"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={5}
                {...getTestProps("input-zip-us")}
              />
              <Text style={styles.note} {...getTestProps("text-tax-warning")}>
                * Sales Tax will be added
              </Text>
            </>
          )}

          {/* CH */}
          {country === "CH" && (
            <>
              <TextInput
                style={[GlobalStyles.input, styles.input]}
                placeholder="PLZ (Postal Code)"
                placeholderTextColor="#666"
                {...getTestProps("input-plz-ch")}
              />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Deutsch</Text>
                <Switch {...getTestProps("toggle-lang-ch")} />
                <Text style={styles.rowLabel}>Français</Text>
              </View>
            </>
          )}

          {/* JP */}
          {country === "JP" && (
            <>
              <TextInput
                style={[GlobalStyles.input, styles.input]}
                placeholder="都道府県 (Prefecture)"
                placeholderTextColor="#666"
                {...getTestProps("input-prefecture-jp")}
              />
            </>
          )}

          <TouchableOpacity
            style={[GlobalStyles.primaryButton, { marginTop: 8 }]}
            onPress={() => alert("Order Placed!")}
            {...getTestProps("btn-place-order")}
          >
            <Text style={GlobalStyles.primaryButtonText}>PLACE ORDER</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.brand.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.brand.secondary,
  },
  input: { marginBottom: 12 },
  note: { color: Colors.brand.secondary, fontWeight: "800", marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rowLabel: { fontWeight: "800", color: Colors.text.primary },
});
