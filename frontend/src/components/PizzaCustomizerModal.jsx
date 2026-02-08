import React, { useEffect, useMemo, useRef, useState } from "react";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../pizzaOptions";
import { computeUnitPrice } from "../utils/pizzaPricing";
import { useCountryStore } from "../store";

const label = (obj, lang) => obj?.[lang] || obj?.en || "";

export default function PizzaCustomizerModal({
  open,
  onClose,
  pizza,
  initialConfig,
  onConfirm,
}) {
  const language = useCountryStore((s) => s.language) || "en";

  const [size, setSize] = useState(initialConfig?.size || "small");
  const [toppings, setToppings] = useState(initialConfig?.toppings || []);

  // ✅ scroll reset
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // si abres para otra pizza / otro config, resetea state
    setSize(initialConfig?.size || "small");
    setToppings(initialConfig?.toppings || []);

    // resetea scroll para que SIEMPRE veas "Size" al inicio
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pizza?.id]);

  const sizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

  const { unitPrice } = useMemo(() => {
    return computeUnitPrice(pizza, sizeObj.usd, toppings.length);
  }, [pizza, sizeObj.usd, toppings.length]);

  const toggleTopping = (id) => {
    setToppings((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 10) return prev; // limit
      return [...prev, id];
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* ✅ quitamos p-6 del wrapper y lo movemos a header/body/footer para que el footer sea fijo */}
      <div className="relative lux-card w-full max-w-2xl rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header (no scroll) */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-black text-brand-primary font-serif">
                {label(UI_STRINGS.title, language)}
              </div>
              <div className="text-text-muted font-semibold">{pizza.name}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-text-muted">{pizza.currency}</div>
              <div className="text-3xl font-black text-text">
                {pizza.currency_symbol}{unitPrice}
              </div>
            </div>
          </div>
        </div>

        {/* Body (scroll) */}
        <div
          ref={scrollRef}
          className="p-6 grid gap-6 overflow-y-auto pr-2 flex-1"
        >
          {/* Size */}
          <div>
            <div className="text-lg font-black text-text mb-2">
              {label(UI_STRINGS.size, language)}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSize(opt.id)}
                  className={[
                    "px-4 py-3 rounded-xl border text-left font-extrabold transition",
                    size === opt.id
                      ? "bg-surface-2 border-brand-accent text-text"
                      : "bg-[rgba(255,255,255,0.02)] border-border text-text-muted hover:text-text",
                  ].join(" ")}
                >
                  {label(opt.label, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div>
            <div className="flex items-end justify-between">
              <div className="text-lg font-black text-text">
                {label(UI_STRINGS.toppings, language)}
              </div>
              <div className="text-sm text-text-muted font-semibold">
                {label(UI_STRINGS.upTo10, language)} • {toppings.length}/10
              </div>
            </div>

            <div className="mt-3 grid gap-4">
              {TOPPING_GROUPS.map((g) => (
                <div key={g.id} className="rounded-xl border border-border p-4 bg-surface-2">
                  <div className="font-black text-text mb-3">
                    {label(g.label, language)}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {g.items.map((it) => {
                      const checked = toppings.includes(it.id);
                      const disabled = !checked && toppings.length >= 10;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleTopping(it.id)}
                          className={[
                            "px-3 py-2 rounded-lg border text-left font-extrabold transition",
                            checked
                              ? "bg-brand-primary text-black border-brand-primary"
                              : "bg-[rgba(255,255,255,0.02)] border-border text-text hover:bg-[rgba(255,255,255,0.05)]",
                            disabled ? "opacity-50 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {label(it.label, language)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ espacio para que el footer no tape el último grupo */}
            <div className="h-20" />
          </div>
        </div>

        {/* Footer (siempre visible) */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button className="btn-ghost" type="button" onClick={onClose}>
            {label(UI_STRINGS.cancel, language)}
          </button>
          <button
            className="btn-gold"
            type="button"
            onClick={() =>
              onConfirm({
                size,
                toppings,
                unit_price: unitPrice,
              })
            }
          >
            {label(UI_STRINGS.confirm, language)}
          </button>
        </div>
      </div>
    </div>
  );
}
