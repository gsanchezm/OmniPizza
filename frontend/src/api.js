import axios from 'axios';

function normalizeApiOrigin(raw) {
  if (!raw) return 'http://localhost:8000';

  let base = String(raw).trim();

  // remove trailing slashes
  base = base.replace(/\/+$/, '');

  // if someone configured /api or /api/v1 in the env, normalize to ORIGIN
  base = base.replace(/\/api\/v1$/i, '');
  base = base.replace(/\/api$/i, '');

  return base;
}

const RAW = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_ORIGIN = normalizeApiOrigin(RAW);

// (opcional) te ayuda a verificar qué value se “horneó” en el build
console.info('[api] API_ORIGIN =', API_ORIGIN);

const api = axios.create({
  baseURL: API_ORIGIN,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const countryCode = localStorage.getItem('countryCode') || 'MX';

    if (token) config.headers.Authorization = `Bearer ${token}`;

    // X-Country-Code es requerido para /api/pizzas :contentReference[oaicite:2]{index=2}
    if (config?.url && !config.url.includes('/auth/')) {
      config.headers['X-Country-Code'] = countryCode;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/api/auth/login', { username, password }), // :contentReference[oaicite:3]{index=3}
  getTestUsers: () => api.get('/api/auth/users'), // :contentReference[oaicite:4]{index=4}
  getProfile: () => api.get('/api/auth/profile'), // :contentReference[oaicite:5]{index=5}
};

export const pizzaAPI = {
  getPizzas: () => api.get('/api/pizzas'), // :contentReference[oaicite:6]{index=6}
};

export const orderAPI = {
  checkout: (data) => api.post('/api/checkout', data), // :contentReference[oaicite:7]{index=7}
  getOrders: () => api.get('/api/orders'),
  getOrder: (orderId) => api.get(`/api/orders/${orderId}`),
};

export const countryAPI = {
  getCountries: () => api.get('/api/countries'), // :contentReference[oaicite:8]{index=8}
  getCountryInfo: (countryCode) => api.get(`/api/countries/${countryCode}`), // :contentReference[oaicite:9]{index=9}
};

export default api;