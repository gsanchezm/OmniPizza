import React from "react";
import { useToastStore } from "./toastStore";

/**
 * Toast — a transient, auto-dismissing snackbar mounted once at the app root.
 * Exercises automation techniques around transient elements: waiting for it to
 * appear, asserting its text, and waiting for it to auto-dismiss or be closed.
 */
export default function Toast() {
  const message = useToastStore((s) => s.message);
  const visible = useToastStore((s) => s.visible);
  const hide = useToastStore((s) => s.hide);

  if (!visible) return null;

  return (
    <div
      data-testid="toast"
      role="status"
      aria-live="polite"
      className="fixed z-[10000] bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1A1A1A] border border-[#333] text-white px-4 py-3 rounded-xl shadow-2xl animate-[fadeIn_.15s_ease-out]"
    >
      <span className="text-brand-primary" aria-hidden="true">✓</span>
      <span data-testid="toast-message" className="font-semibold text-sm">
        {message}
      </span>
      <button
        type="button"
        data-testid="toast-close"
        onClick={hide}
        aria-label="Dismiss notification"
        className="text-gray-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
