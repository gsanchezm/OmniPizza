import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

function normalizeApiOrigin(raw?: string) {
  if (!raw) return '';

  let base = String(raw).trim();
  base = base.replace(/\/+$/, '');
  base = base.replace(/\/api\/v1$/i, '');
  base = base.replace(/\/api$/i, '');
  return base;
}

// Expo recommended: EXPO_PUBLIC_*
const RAW =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_URL ||
  ''; // fallback below

// Local fallback (Android emulator). En iOS simulator podrías usar http://localhost:8000
const LOCAL_FALLBACK = 'http://10.0.2.2:8000';

const API_ORIGIN = normalizeApiOrigin(RAW) || LOCAL_FALLBACK;

console.log('[apiClient] API_ORIGIN =', API_ORIGIN);

export const apiClient = axios.create({
  baseURL: API_ORIGIN,
  timeout: 10000,
});

// Interceptor: País + Token
apiClient.interceptors.request.use((config) => {
  const { country, token } = useAppStore.getState();

  config.headers = config.headers ?? {};
  config.headers['X-Country-Code'] = country || 'MX';

  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  return config;
});
