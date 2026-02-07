import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  behavior: localStorage.getItem('behavior'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (token, username, behavior) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('behavior', behavior);
    set({ token, username, behavior, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('behavior');
    set({ token: null, username: null, behavior: null, isAuthenticated: false });
  },
}));

export const useCountryStore = create((set) => ({
  countryCode: localStorage.getItem('countryCode') || 'MX',
  countryInfo: null,
  
  setCountry: (countryCode) => {
    localStorage.setItem('countryCode', countryCode);
    set({ countryCode });
  },
  
  setCountryInfo: (countryInfo) => {
    set({ countryInfo });
  },
}));

export const useCartStore = create((set) => ({
  items: [],
  
  addItem: (pizza) => set((state) => {
    const existingItem = state.items.find((item) => item.pizza_id === pizza.id);
    
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.pizza_id === pizza.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    
    return {
      items: [...state.items, { pizza_id: pizza.id, pizza, quantity: 1 }],
    };
  }),
  
  removeItem: (pizzaId) => set((state) => ({
    items: state.items.filter((item) => item.pizza_id !== pizzaId),
  })),
  
  updateQuantity: (pizzaId, quantity) => set((state) => ({
    items: state.items.map((item) =>
      item.pizza_id === pizzaId ? { ...item, quantity } : item
    ),
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotal: () => {
    const state = useCartStore.getState();
    return state.items.reduce((total, item) => {
      return total + (item.pizza.price * item.quantity);
    }, 0);
  },
}));
