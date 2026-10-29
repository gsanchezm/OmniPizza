import React, { useEffect, useRef } from "react";

/**
 * Small confirmation modal. Same look and behaviour as the Checkout order confirmation:
 * focus moves to Cancel on open, Escape or a click on the backdrop cancels, and focus
 * returns to whatever opened it (WCAG 2.4.3). Test ids are `${testIdPrefix}-modal`,
 * `-cancel` and `-confirm`.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  cancelLabel,
  confirmLabel,
  busy = false,
  testIdPrefix,
  onCancel,
  onConfirm,
}) {
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel; // keep the effect below from re-running on every parent render
  const titleId = `${testIdPrefix}-title`;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancelRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid={`${testIdPrefix}-modal`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#161616] border border-[#2A2A2A] p-6 shadow-2xl">
        <h3 id={titleId} className="text-xl font-black text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-400 text-sm mb-5">{body}</p>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            data-testid={`${testIdPrefix}-cancel`}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#333] text-white font-bold hover:bg-[#222] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-testid={`${testIdPrefix}-confirm`}
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
            className="flex-1 py-3 rounded-xl bg-[#FF5722] text-[#1E1E1E] font-bold hover:bg-[#E64A19] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
