import axios from "axios";
import { useAppStore } from "../store/useAppStore";
import { NativeModules } from "react-native";

// Fallback logic for Detox launch args (injected via device.launchApp launchArgs)
let detoxCountryCode: string | null = null;
try {
  // NativeModules.ExpoLaunchArguments is populated by Detox when the app is
  // launched with launchArgs: { detoxCountryCode: "MX" }
  const launchArgs =
    NativeModules.ExpoLaunchArguments ??
    NativeModules.LaunchArguments ??
    null;
  if (launchArgs) {
    const args =
      typeof launchArgs.getArguments === "function"
        ? launchArgs.getArguments()
        : launchArgs;
    if (args?.detoxCountryCode) {
      detoxCountryCode = args.detoxCountryCode;
    }
  }
} catch (_) {
  // Silent fallback — not running under Detox
}

const API_ORIGIN = "https://omnipizza-backend.onrender.com";

export const apiClient = axios.create({
  baseURL: API_ORIGIN,
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const { country, language, token } = useAppStore.getState();

  config.headers = config.headers ?? {};
  
  // Retrocompatibilidad: Priorizar config.headers explícito explícito (por ejemplo en tests individuales),
  // y usar el global inyectado por Detox si se especificó, sino fallback en store.
  config.headers["X-Country-Code"] = config.headers["X-Country-Code"] || detoxCountryCode || country || "MX";
  config.headers["X-Language"] = config.headers["X-Language"] || language || "en";
  
  if (token && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});
