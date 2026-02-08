import axios from "axios";
import { useAuthStore, useCountryStore } from "./store";

function normalizeApiOrigin(raw) {
  if (!raw) return "http://localhost:8000";
  let base = String(raw).trim().replace(/\/+$/, "");
  base = base.replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");
  return base;
}

const RAW = import.meta.env.VITE_API_URL;
const API_ORIGIN = normalizeApiOrigin(RAW) || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_ORIGIN,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  const { countryCode, language } = useCountryStore.getState();

  config.headers = config.headers ?? {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // ✅ estas 2 headers son la clave
  config.headers["X-Country-Code"] = countryCode || "MX";
  config.headers["X-Language"] = language || "en";

  return config;
});

export const pizzaAPI = {
  getPizzas: () => api.get("/api/pizzas"),
};
