import React, { useEffect, useMemo, useState } from "react";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../pizzaOptions";

const tOpt = (obj, lang) => obj?.[lang] || obj?.en || "";

function getRateFromPizza(pizza) {
  const bp = Number(pizza?.base_price);
  const p = Number(pizza?.price);
  if (!bp || bp <= 0 || !p || p <= 0) return 1;
  return p / bp;
}

function usdToLocalCeil(usdAmount, pizza) {
  return Math.ceil(Number(usdAmount) * getRateFromPizza(pizza));
}

function computeUnitPrice(pizza, sizeUsd, toppingsCount) {
  const base = Number(pizza.price);
  const sizeAdd = usdToLocalCeil(sizeUsd, pizza);
  const toppingUnit = usdToLocalCeil(1, pizza);
  return base + sizeAdd + toppingUnit * toppingsCount;
}

export default function PizzaCustomizerModal({
  open,
  pizza,
  language,
  locale,
  initialConfig,
  onClose,
  onConfirm,
}) {
  const [size, setSize] = useState("small");
  const [toppings, setToppings] = useState([]);

  useEffect(() => {
    if (open) {
      setSize(initialConfig?.size || "small");
      setToppings(initialConfig?.toppings || []);
      // prevent body scroll when modal open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialConfig]);

  const sizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
    return computeUnitPrice(pizza, sizeObj.usd, toppings.length);
  }, [pizza, sizeObj.usd, toppings.length]);

  const toggleTopping = (id) => {
    setToppings((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  if (!open || !pizza) return null;

  return (
    /* ===== OVERLAY (scrollable) ===== */
    <div className="fixed inset-0 z-[9999] bg-black/70 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-6 px-3">
        {/* ===== MODAL ===== */}
        <div
          className="relative lux-card w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 5rem)" }} // navbar-safe
        >
          {/* ===== HEADER (fixed) ===== */}
          <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-black text-brand-primary font-serif">
                  {tOpt(UI_STRINGS.title, language)}
                </div>
                <div className="text-text-muted font-semibold">
                  {pizza.name}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-text-muted">
                  {pizza.currency}
                </div>
                <div className="text-3xl font-black text-text">
                  {pizza.currency_symbol}
                  {unitPrice}
                </div>
              </div>
            </div>
          </div>

          {/* ===== BODY (scrollable) ===== */}
          <div className="flex-1 overflow-y-auto px-6 py-4 grid gap-6">
            {/* Size */}
            <div>
              <div className="text-lg font-black text-text mb-2">
                {tOpt(UI_STRINGS.size, language)}
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
                    {tOpt(opt.label, language)}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div>
              <div className="flex items-end justify-between">
                <div className="text-lg font-black text-text">
                  {tOpt(UI_STRINGS.toppings, language)}
                </div>
                <div className="text-sm text-text-muted font-semibold">
                  {tOpt(UI_STRINGS.upTo10, language)} • {toppings.length}/10
                </div>
              </div>

              <div className="mt-3 grid gap-4">
                {TOPPING_GROUPS.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-border p-4 bg-surface-2"
                  >
                    <div className="font-black text-text mb-3">
                      {tOpt(g.label, language)}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2">
                      {g.items.map((it) => {
                        const checked = toppings.includes(it.id);
                        const disabled =
                          !checked && toppings.length >= 10;

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
                              disabled
                                ? "opacity-50 cursor-not-allowed"
                                : "",
                            ].join(" ")}
                          >
                            {tOpt(it.label, language)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== FOOTER (fixed) ===== */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
            <div className="flex justify-end gap-3">
              <button
                className="btn-ghost"
                type="button"
                onClick={onClose}
              >
                {tOpt(UI_STRINGS.cancel, language)}
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
                {tOpt(UI_STRINGS.confirm, language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
