import axios from "axios";
import { useAppStore } from "../store/useAppStore";
import { NativeModules } from "react-native";

// Fallback logic for Detox launch args
let detoxCountryCode: string | null = null;
try {
  // Safe accessor for React Native launch arguments
  if (NativeModules.LaunchArguments) {
    const args = typeof NativeModules.LaunchArguments.getArguments === 'function' 
      ? NativeModules.LaunchArguments.getArguments() 
      : NativeModules.LaunchArguments;
    if (args && args.detoxCountryCode) {
      detoxCountryCode = args.detoxCountryCode;
    }
  } else {
    // Para versiones modernas de React Native Utilities
    const RNLaunchArgs = require('react-native/Libraries/Utilities/LaunchArguments');
    if (RNLaunchArgs && RNLaunchArgs.LaunchArguments && RNLaunchArgs.LaunchArguments.detoxCountryCode) {
      detoxCountryCode = RNLaunchArgs.LaunchArguments.detoxCountryCode;
    }
  }
} catch (e) {
  // Silent fallback
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
