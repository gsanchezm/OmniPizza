import axios from "axios";
import { useAuthStore, useCountryStore } from "./store";

function normalizeApiOrigin(raw) {
  if (!raw) return "http://localhost:8000";
  let base = String(raw).trim().replace(/\/+$/, "");
  base = base.replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");
  return base;
}

const RAW = import.meta.env.VITE_API_URL;
const API_ORIGIN = normalizeApiOrigin(RAW);

const api = axios.create({
  baseURL: API_ORIGIN,
  headers: { "Content-Type": "application/json" },
});

function isLikelyJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  const { countryCode, language } = useCountryStore.getState();

  config.headers = config.headers ?? {};

  // ✅ headers de mercado/idioma siempre
  config.headers["X-Country-Code"] = countryCode || "MX";
  config.headers["X-Language"] = language || "en";

  // ✅ solo enviar Authorization si parece JWT real
  if (isLikelyJwt(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Si el backend rechaza token, auto-logout + login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // limpia sesión y redirige a login
      useAuthStore.getState().logout?.();

      // opcional: limpia la key persistida del auth store
      try { localStorage.removeItem("omnipizza-auth"); } catch {}

      // vuelve a login
      window.location.assign("/");
      return;
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (username, password) => api.post("/api/auth/login", { username, password }),
  getTestUsers: () => api.get("/api/auth/users"),
  profile: () => api.get("/api/auth/profile"),
};

export const pizzaAPI = {
  getPizzas: () => api.get("/api/pizzas"),
};

export const orderAPI = {
  checkout: (payload) => api.post("/api/checkout", payload),
  getOrders: () => api.get("/api/orders"),
  getOrder: (orderId) => api.get(`/api/orders/${orderId}`),
};

export const countryAPI = {
  getCountries: () => api.get("/api/countries"),
  getCountryInfo: (code) => api.get(`/api/countries/${code}`),
};

export default api;
