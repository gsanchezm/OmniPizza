import axios from "axios";
import { useAuthStore, useCountryStore } from "../store";

function normalizeApiOrigin(raw) {
  if (!raw) return "http://localhost:8000";
  let base = String(raw).trim().replace(/\/+$/, "");
  base = base.replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");
  return base;
}

function isLikelyJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

const API_ORIGIN = normalizeApiOrigin(import.meta.env.VITE_API_URL);

const httpClient = axios.create({
  baseURL: API_ORIGIN,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  const { countryCode, language } = useCountryStore.getState();

  config.headers = config.headers ?? {};
  config.headers["X-Country-Code"] = countryCode || "MX";
  config.headers["X-Language"] = language || "en";

  if (isLikelyJwt(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      useAuthStore.getState().logout?.();
      try {
        localStorage.removeItem("omnipizza-auth");
      } catch {
        // ignore localStorage failures (privacy mode / disabled storage)
      }
      window.location.assign("/");
      return;
    }
    return Promise.reject(err);
  },
);

export default httpClient;
