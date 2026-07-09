import { create } from "zustand";

/**
 * Tiny imperative toast store. Call `useToastStore.getState().show(msg)` from
 * anywhere (screens, use-cases) to surface a transient toast; the mounted
 * <Toast/> renders whenever `message` is non-null and auto-dismisses.
 */
interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));
