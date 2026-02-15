import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { CustomNavbar } from "../components/CustomNavbar";
import { useAppStore } from "../store/useAppStore";
import { Colors } from "../theme/colors";
import { useT } from "../i18n";

export default function ProfileScreen({ navigation }: any) {
  const t = useT();
  const { profile, setProfile } = useAppStore();

  return (
    <View style={styles.screen}>
      <CustomNavbar title={t("profile")} navigation={navigation} />

      <View style={styles.card}>
        <Text style={styles.label}>{t("fullName")}</Text>
        <TextInput style={styles.input} placeholderTextColor={Colors.text.muted} value={profile?.fullName || ""} onChangeText={(v)=>setProfile({ fullName: v })} />

        <Text style={styles.label}>{t("address")}</Text>
        <TextInput style={styles.input} placeholderTextColor={Colors.text.muted} value={profile?.address || ""} onChangeText={(v)=>setProfile({ address: v })} />

        <Text style={styles.label}>{t("phone")}</Text>
        <TextInput style={styles.input} placeholderTextColor={Colors.text.muted} value={profile?.phone || ""} onChangeText={(v)=>setProfile({ phone: v })} />

        <Text style={styles.label}>{t("notes")}</Text>
        <TextInput style={[styles.input, { height: 90 }]} multiline placeholderTextColor={Colors.text.muted} value={profile?.notes || ""} onChangeText={(v)=>setProfile({ notes: v })} />

        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>{t("save")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface.base },
  card: { margin: 14, padding: 14, borderRadius: 16, backgroundColor: Colors.surface.card, borderWidth: 1, borderColor: Colors.surface.border },
  label: { color: Colors.text.muted, fontWeight: "800", marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: Colors.surface.base2, borderWidth: 1, borderColor: Colors.surface.border, borderRadius: 12, padding: 12, color: Colors.text.primary },
  btn: { marginTop: 14, backgroundColor: Colors.brand.primary, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnText: { fontWeight: "800", color: "#FFFFFF" },
});
