import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { authService } from "../services/auth.service";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";
import { GlobalStyles } from "../theme/styles";

const PRESET_USERS = ["standard_user", "locked_out_user", "problem_user"];

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const setToken = useAppStore((s) => s.setToken);
  const country = useAppStore((s) => s.country);

  const handleLogin = async () => {
    if (!username) {
      Alert.alert("Error", "Username is required");
      return;
    }

    setLoading(true);
    try {
      // Use provided password or default 'pizza123'
      const finalPassword = password || "pizza123";
      
      const response = await authService.login(username, finalPassword);
      
      if (response && response.access_token) {
        setToken(response.access_token);
        // Navigate to Catalog
        navigation.replace("Catalog");
      } else {
        throw new Error("Invalid response");
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Login failed. Please try again.";
      Alert.alert("Login Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const fillUser = (u: string) => {
    setUsername(u);
    setPassword("pizza123");
  };

  return (
    <View style={[GlobalStyles.screen, styles.container]}>
      <Text style={[GlobalStyles.title, { textAlign: "center", marginBottom: 10 }]}>
        OmniPizza
      </Text>
      <Text style={styles.subTitle}>Login ({country})</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Quick fill (QA)</Text>

        <View style={styles.presets}>
          {PRESET_USERS.map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => fillUser(u)}
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
          autoCapitalize="none"
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
          disabled={loading}
          style={[GlobalStyles.primaryButton, loading && { opacity: 0.7 }]}
          {...getTestProps("btn-login")}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={GlobalStyles.primaryButtonText}>LOGIN</Text>
          )}
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
    gap: 8,
    marginBottom: 14,
  },
  input: { marginBottom: 12 },
});
