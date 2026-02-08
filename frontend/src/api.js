import axios from "axios";
import { useAuthStore, useCountryStore } from "./store";

/* =========================
   API ORIGIN (Render-safe)
========================= */
function normalizeApiOrigin(raw) {
  if (!raw) return "http://localhost:8000";
  let base = String(raw).trim().replace(/\/+$/, "");
  base = base.replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");
  return base;
}

const RAW = import.meta.env.VITE_API_URL;
const API_ORIGIN = normalizeApiOrigin(RAW);

/* =========================
   AXIOS INSTANCE
========================= */
const api = axios.create({
  baseURL: API_ORIGIN,
  headers: { "Content-Type": "application/json" },
});

/* =========================
   INTERCEPTORS
========================= */
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  const { countryCode, language } = useCountryStore.getState();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ THESE TWO HEADERS ARE CRITICAL
  config.headers["X-Country-Code"] = countryCode || "MX";
  config.headers["X-Language"] = language || "en";

  return config;
});

/* =========================
   AUTH API
========================= */
export const authAPI = {
  login: (username, password) =>
    api.post("/api/auth/login", { username, password }),

  getTestUsers: () =>
    api.get("/api/auth/users"),

  profile: () =>
    api.get("/api/auth/profile"),
};

/* =========================
   PIZZA API
========================= */
export const pizzaAPI = {
  getPizzas: () =>
    api.get("/api/pizzas"),
};

/* =========================
   ORDER API
========================= */
export const orderAPI = {
  checkout: (payload) =>
    api.post("/api/checkout", payload),

  getOrders: () =>
    api.get("/api/orders"),

  getOrder: (orderId) =>
    api.get(`/api/orders/${orderId}`),
};

/* =========================
   COUNTRY API
========================= */
export const countryAPI = {
  getCountries: () =>
    api.get("/api/countries"),

  getCountryInfo: (countryCode) =>
    api.get(`/api/countries/${countryCode}`),
};

/* =========================
   DEFAULT EXPORT (OPTIONAL)
========================= */
export default api;
