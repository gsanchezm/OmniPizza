import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAppStore } from "../store/useAppStore";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";
import { GlobalStyles } from "../theme/styles";

const PRESET_USERS = ["standard_user", "locked_out_user", "problem_user"];

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const setToken = useAppStore((s) => s.setToken);
  const country = useAppStore((s) => s.country);

  const handleLogin = () => {
    if (username === "locked_out_user") {
      alert("User is locked out!");
      return;
    }
    setToken("fake-jwt-token");
    navigation.replace("Catalog");
  };

  return (
    <View style={[GlobalStyles.screen, styles.container]}>
      <Text style={GlobalStyles.title}>OmniPizza</Text>
      <Text style={styles.subTitle}>Login ({country})</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Quick fill (QA)</Text>

        <View style={styles.presets}>
          {PRESET_USERS.map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => {
                setUsername(u);
                setPassword("pizza123");
              }}
              style={GlobalStyles.accentChip}
              {...getTestProps(`btn-preset-${u}`)}
            >
              <Text style={GlobalStyles.accentChipText}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[GlobalStyles.input, styles.input]}
          placeholder="Username"
          placeholderTextColor={Colors.text.muted}
          value={username}
          onChangeText={setUsername}
          {...getTestProps("input-username")}
        />

        <TextInput
          style={[GlobalStyles.input, styles.input]}
          placeholder="Password"
          placeholderTextColor={Colors.text.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          {...getTestProps("input-password")}
        />

        <TouchableOpacity
          onPress={handleLogin}
          style={GlobalStyles.primaryButton}
          {...getTestProps("btn-login")}
        >
          <Text style={GlobalStyles.primaryButtonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, justifyContent: "center" },
  subTitle: {
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
    fontWeight: "800",
    color: Colors.text.muted,
  },
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.brand.primary,
    marginBottom: 10,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  input: { marginBottom: 12 },
});
