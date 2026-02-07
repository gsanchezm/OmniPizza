import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

// URL de tu Backend (Si usas Android Emulator, usa 10.0.2.2 en lugar de localhost)
// Si ya desplegaste en Render, usa tu URL de Render.
const API_URL = 'http://10.0.2.2:8000/api/v1'; 

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor: Inyectar Header de País y Auth Token
apiClient.interceptors.request.use((config) => {
  const { country, token } = useAppStore.getState();
  
  // Header Crítico para OmniPizza
  config.headers['X-Country-Code'] = country;
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});