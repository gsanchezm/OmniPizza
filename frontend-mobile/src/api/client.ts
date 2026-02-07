import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const API_ORIGIN = 'https://omnipizza-backend.onrender.com';

export const apiClient = axios.create({
  baseURL: API_ORIGIN,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const { country, token } = useAppStore.getState();
  config.headers = config.headers ?? {};
  config.headers['X-Country-Code'] = country || 'MX';
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});
