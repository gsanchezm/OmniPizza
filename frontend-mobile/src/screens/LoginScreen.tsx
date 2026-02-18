import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  StatusBar
} from "react-native";
import { useAppStore } from "../store/useAppStore";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedInput } from "../components/ThemedInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";
import { Colors } from "../theme/colors";

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useAppStore((s) => s.login);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace("Main");
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Small delay to simulate network/interaction (since auth is mocked or fast)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const success = await login(username, password);
      if (!success) {
        setError("Invalid credentials or user locked out.");
      }
    } catch (e: any) {
      setError(e.message || "Login failed");
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
          <View style={styles.formContainer}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                 <Text style={styles.logoIcon}>🍕</Text>
              </View>
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
              
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
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

            {/* Social / Test Users */}
            <View style={styles.socialSection}>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR CONTINUE WITH</Text>
                <View style={styles.line} />
              </View>
              
              <View style={styles.grid}>
                 <SocialButton label="Google" onPress={() => fillUser('problem_user')} />
                 <SocialButton label="GitHub" onPress={() => fillUser('error_user')} />
              </View>
            </View>
            
            <TouchableOpacity style={styles.registerLink}>
              <Text style={styles.registerText}>
                New here? <Text style={styles.registerTextBold}>Register Now</Text>
              </Text>
            </TouchableOpacity>

          </View>
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
    justifyContent: "flex-end",
  },
  safeArea: {
    flex: 1,
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
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logoIcon: {
    fontSize: 28,
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
    marginBottom: 16,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: Colors.brand.primary,
    fontWeight: "700",
    fontSize: 14,
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
  socialSection: {
    marginBottom: 32,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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
  grid: {
    flexDirection: "row",
    gap: 16,
  },
  registerLink: {
    alignItems: "center",
  },
  registerText: {
    color: Colors.text.muted,
    fontSize: 14,
  },
  registerTextBold: {
    color: Colors.brand.primary,
    fontWeight: "800",
  },
});
