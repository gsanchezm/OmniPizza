import { create } from 'zustand';

type CountryCode = 'MX' | 'US' | 'CH' | 'JP';

interface AppState {
  country: CountryCode;
  token: string | null;
  setCountry: (c: CountryCode) => void;
  setToken: (t: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  country: 'MX', // Default
  token: null,
  setCountry: (country) => set({ country }),
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}));