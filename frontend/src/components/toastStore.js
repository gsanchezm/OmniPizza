import { create } from "zustand";

/**
 * Minimal toast store — one transient message at a time.
 * `show(msg)` displays it and auto-hides after `duration` ms; `hide()` dismisses
 * immediately. Kept tiny and dependency-free so the toast is easy to drive from
 * any add-to-cart handler and easy to assert against in automation.
 */
let _timer = null;

export const useToastStore = create((set) => ({
  message: "",
  visible: false,
  show: (message, duration = 3000) => {
    if (_timer) clearTimeout(_timer);
    set({ message, visible: true });
    _timer = setTimeout(() => set({ visible: false }), duration);
  },
  hide: () => {
    if (_timer) clearTimeout(_timer);
    set({ visible: false });
  },
}));
