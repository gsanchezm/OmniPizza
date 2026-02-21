import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../store/useAppStore";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedInput } from "../components/ThemedInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { Colors } from "../theme/colors";
import { authService } from "../services/auth.service";

const { height } = Dimensions.get("window");

const TEST_USERS = [
  { id: "standard_user", label: "Standard" },
  { id: "locked_out_user", label: "Locked" },
  { id: "problem_user", label: "Problem" },
  { id: "performance_glitch_user", label: "Glitch" },
  { id: "error_user", label: "Error" },
];

const MARKETS = [
  { code: "US", flag: "🇺🇸" },
  { code: "MX", flag: "🇲🇽" },
  { code: "CH", flag: "🇨🇭" },
  { code: "JP", flag: "🇯🇵" },
] as const;

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<"US" | "MX" | "CH" | "JP">("US");

  const setToken = useAppStore((s) => s.setToken);
  const token = useAppStore((s) => s.token);
  const setCountry = useAppStore((s) => s.setCountry);

  useEffect(() => {
    if (token) {
      navigation.replace("Catalog");
    }
  }, [token]);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = await authService.login(username.trim(), password);
      if (data && data.access_token) {
        setCountry(selectedMarket);
        setToken(data.access_token);
      } else {
        setError("Invalid credentials.");
      }
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || String(d)).join(", "));
      } else {
        setError(e.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillUser = (u: string) => {
    setUsername(u);
    setPassword("pizza123");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Hero Background */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop" }}
          style={styles.heroImage}
        >
          <LinearGradient
            colors={["transparent", "#0F0F0F"]}
            style={styles.gradient}
          />
        </ImageBackground>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.formContainer}>
              
              {/* Header */}
              <View style={styles.header}>
                <Image 
                  source={{ uri: "https://omnipizza-frontend.onrender.com/omnipizza-logo.png" }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>OmniPizza</Text>
                <Text style={styles.welcomeTitle}>Welcome back!</Text>
                <Text style={styles.subtitle}>Login to order your favorites.</Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputs}>
                <ThemedInput
                  label="Email Address"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="standard_user"
                  autoCapitalize="none"
                />
                <ThemedInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />
              </View>

              {/* Market Selection */}
              <View style={styles.marketRow}>
                {MARKETS.map((m) => {
                  const isActive = selectedMarket === m.code;
                  return (
                    <TouchableOpacity
                      key={m.code}
                      onPress={() => setSelectedMarket(m.code)}
                      style={[
                        styles.flagBtn,
                        isActive && styles.flagBtnActive
                      ]}
                    >
                      <Text style={[styles.flagText, isActive && { opacity: 1 }]}>{m.flag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Error Message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Actions */}
              <View style={styles.actions}>
                <PrimaryButton 
                  title={loading ? "Signing In..." : "Sign In"} 
                  onPress={handleLogin} 
                  loading={loading}
                />
              </View>

              {/* Quick Login Pills */}
              <View style={styles.quickLoginSection}>
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>QUICK LOGIN</Text>
                  <View style={styles.line} />
                </View>
                
                <View style={styles.pillsRow}>
                  {TEST_USERS.map((u) => (
                    <TouchableOpacity 
                      key={u.id} 
                      style={styles.pill} 
                      onPress={() => fillUser(u.id)}
                    >
                      <Text style={styles.pillText}>{u.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.base,
  },
  heroContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    zIndex: 0,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    justifyContent: "flex-end",
  },
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 100, // Space for hero
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  appName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.muted,
  },
  inputs: {
    marginBottom: 24,
  },
  errorText: {
    color: Colors.danger,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  actions: {
    marginBottom: 32,
  },
  quickLoginSection: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surface.border,
  },
  orText: {
    marginHorizontal: 16,
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  pill: {
    backgroundColor: Colors.surface.base2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surface.border,
  },
  pillText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  marketRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  flagBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.base2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.surface.border,
    opacity: 0.6,
  },
  flagBtnActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  flagText: {
    fontSize: 20,
  },
});
