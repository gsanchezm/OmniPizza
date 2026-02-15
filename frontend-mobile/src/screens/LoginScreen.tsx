import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { authService } from "../services/auth.service";
import { getTestProps } from "../utils/qa";
import { Colors } from "../theme/colors";
import { GlobalStyles } from "../theme/styles";

const USER_HINTS: Record<string, string> = {
  standard_user: "Normal user, stable flow",
  locked_out_user: "Login fails (deterministic lockout)",
  problem_user: "UI shows broken images or $0 prices",
  performance_glitch_user: "API calls include ~3s delay",
  error_user: "Checkout may fail randomly (~50%)",
};

type TestUser = {
  username: string;
  description?: string;
};

const DEFAULT_TEST_USERS: TestUser[] = [
  { username: "standard_user", description: USER_HINTS.standard_user },
  { username: "locked_out_user", description: USER_HINTS.locked_out_user },
  { username: "problem_user", description: USER_HINTS.problem_user },
  { username: "performance_glitch_user", description: USER_HINTS.performance_glitch_user },
  { username: "error_user", description: USER_HINTS.error_user },
];

const MARKET_OPTIONS = [
  { code: "US", flag: "🇺🇸", label: "United States" },
  { code: "MX", flag: "🇲🇽", label: "Mexico" },
  { code: "CH", flag: "🇨🇭", label: "Switzerland" },
  { code: "JP", flag: "🇯🇵", label: "Japan" },
] as const;

export default function LoginScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState<TestUser[]>(DEFAULT_TEST_USERS);
  
  const setToken = useAppStore((s) => s.setToken);
  const setCountry = useAppStore((s) => s.setCountry);
  const country = useAppStore((s) => s.country);
  const [selectedMarket, setSelectedMarket] = useState(country);

  useEffect(() => {
    let mounted = true;
    authService
      .getTestUsers()
      .then((users) => {
        if (!mounted) return;
        if (Array.isArray(users) && users.length) setTestUsers(users);
      })
      .catch(() => {
        if (mounted) setTestUsers(DEFAULT_TEST_USERS);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
        setCountry(selectedMarket);
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

  const fillUser = (u: TestUser) => {
    setUsername(u.username);
    setPassword("pizza123");
  };

  return (
    <View style={GlobalStyles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.contentWrap,
            isLandscape && styles.contentWrapLandscape,
          ]}
        >
          <Image
            source={require("../../assets/icon.png")}
            style={[styles.logo, isLandscape && styles.logoLandscape]}
            resizeMode="contain"
          />

          <Text style={[GlobalStyles.title, { textAlign: "center", marginBottom: 10 }]}>
            OmniPizza
          </Text>

          <Text style={styles.subTitle}>Select Market</Text>
          <View style={styles.marketRow}>
            {MARKET_OPTIONS.map((market) => {
              const active = selectedMarket === market.code;
              return (
                <TouchableOpacity
                  key={market.code}
                  onPress={() => setSelectedMarket(market.code)}
                  style={[
                    styles.marketFlagBtn,
                    isLandscape && styles.marketFlagBtnLandscape,
                    active && styles.marketFlagBtnActive,
                  ]}
                  accessibilityLabel={`Market ${market.label}`}
                  {...getTestProps(`btn-market-${market.code.toLowerCase()}`)}
                >
                  <Text style={[styles.marketFlag, isLandscape && styles.marketFlagLandscape]}>
                    {market.flag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Quick fill (QA)</Text>

            <View style={styles.presets}>
              {testUsers.map((u) => (
                <TouchableOpacity
                  key={u.username}
                  onPress={() => fillUser(u)}
                  style={GlobalStyles.accentChip}
                  {...getTestProps(`btn-preset-${u.username}`)}
                >
                  <Text style={GlobalStyles.accentChipText}>{u.username}</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  contentWrap: {
    width: "100%",
    maxWidth: 560,
  },
  contentWrapLandscape: {
    maxWidth: 860,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: "center",
    marginBottom: 8,
  },
  logoLandscape: {
    width: 60,
    height: 60,
    marginBottom: 4,
  },
  subTitle: {
    marginTop: 4,
    marginBottom: 10,
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
  marketRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  marketFlagBtn: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.surface.border,
    backgroundColor: Colors.surface.base2,
    alignItems: "center",
    justifyContent: "center",
  },
  marketFlagBtnLandscape: {
    width: 48,
    height: 48,
  },
  marketFlagBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + "22",
  },
  marketFlag: { fontSize: 24, textAlign: "center" },
  marketFlagLandscape: { fontSize: 22 },
});
