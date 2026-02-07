import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and country code
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const countryCode = localStorage.getItem('countryCode') || 'MX';
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add country code header for all requests except auth
    if (!config.url.includes('/auth/')) {
      config.headers['X-Country-Code'] = countryCode;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
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
  login: (username, password) =>
    api.post('/api/auth/login', { username, password }),
  
  getTestUsers: () =>
    api.get('/api/auth/users'),
  
  getProfile: () =>
    api.get('/api/auth/profile'),
};

export const pizzaAPI = {
  getPizzas: () =>
    api.get('/api/pizzas'),
};

export const orderAPI = {
  checkout: (data) =>
    api.post('/api/checkout', data),
  
  getOrders: () =>
    api.get('/api/orders'),
  
  getOrder: (orderId) =>
    api.get(`/api/orders/${orderId}`),
};

export const countryAPI = {
  getCountries: () =>
    api.get('/api/countries'),
  
  getCountryInfo: (countryCode) =>
    api.get(`/api/countries/${countryCode}`),
};

export default api;
