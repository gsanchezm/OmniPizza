import React, { useEffect, useMemo, useRef, useState } from "react";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../pizzaOptions";
import { computeUnitPrice } from "../utils/pizzaPricing";
import { useCountryStore } from "../store";

const t = (obj, lang) => obj?.[lang] || obj?.en || "";

function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// ✅ Soporta computeUnitPrice devolviendo número o devolviendo objeto
function normalizeUnitPrice(result) {
  if (typeof result === "number") return result;
  if (result && typeof result === "object") {
    // intenta campos típicos
    return (
      toNumber(result.unitPrice) ||
      toNumber(result.unit_price) ||
      toNumber(result.price) ||
      toNumber(result.total) ||
      0
    );
  }
  return 0;
}

function formatMoney(value, currency, locale, symbol) {
  const num = toNumber(value);
  const cur = typeof currency === "string" ? currency : "USD";
  const loc = locale || "en-US";
  try {
    const maxFrac = cur === "JPY" ? 0 : 2;
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: maxFrac,
    }).format(num);
  } catch {
    return `${symbol || ""}${num.toFixed(2)}`;
  }
}

export default function PizzaCustomizerModal({
  open,
  onClose,
  pizza,
  initialConfig,
  onConfirm,
}) {
  const language = useCountryStore((s) => s.language) || "en";
  const locale = useCountryStore((s) => s.locale) || "en-US";

  const [size, setSize] = useState(initialConfig?.size || "small");
  const [toppings, setToppings] = useState(initialConfig?.toppings || []);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    setSize(initialConfig?.size || "small");
    setToppings(initialConfig?.toppings || []);

    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
  }, [open, pizza?.id]); // reset al abrir o cambiar pizza

  const sizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
    const result = computeUnitPrice(pizza, sizeObj.usd, toppings.length);
    return normalizeUnitPrice(result);
  }, [pizza, sizeObj.usd, toppings.length]);

  const toggleTopping = (id) => {
    setToppings((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 10) return prev; // limit
      return [...prev, id];
    });
  };

  if (!open || !pizza) return null;

  // ✅ crash-safe strings (por si backend devuelve algo raro)
  const pizzaName = typeof pizza.name === "string" ? pizza.name : String(pizza.name ?? "");
  const currency = typeof pizza.currency === "string" ? pizza.currency : "USD";
  const currencySymbol =
    typeof pizza.currency_symbol === "string" ? pizza.currency_symbol : "";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative lux-card w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header fijo */}
        <div className="p-4 sm:p-6 border-b border-border bg-[rgba(0,0,0,0.25)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-black text-brand-primary font-sans">
                {t(UI_STRINGS.title, language)}
              </div>
              <div className="text-text-muted font-semibold">{pizzaName}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-text-muted">{currency}</div>
              <div className="text-3xl font-black text-text">
                {formatMoney(unitPrice, currency, locale, currencySymbol)}
              </div>
            </div>
          </div>
        </div>

        {/* Body scrolleable */}
        <div ref={scrollRef} className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Size */}
          <div>
            <div className="text-lg font-black text-text mb-2">
              {t(UI_STRINGS.size, language)}
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
                      ? "bg-surface-2 border-brand-primary text-text"
                      : "bg-[rgba(255,255,255,0.02)] border-border text-text-muted hover:text-text",
                  ].join(" ")}
                >
                  {t(opt.label, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <div className="text-lg font-black text-text">
                {t(UI_STRINGS.toppings, language)}
              </div>
              <div className="text-sm text-text-muted font-semibold">
                {t(UI_STRINGS.upTo10, language)} • {toppings.length}/10
              </div>
            </div>

            <div className="mt-3 grid gap-4">
              {TOPPING_GROUPS.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border border-border p-4 bg-surface-2"
                >
                  <div className="font-black text-text mb-3">
                    {t(g.label, language)}
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
                              ? "bg-brand-primary text-white border-brand-primary"
                              : "bg-[rgba(255,255,255,0.02)] border-border text-text hover:bg-[rgba(255,255,255,0.05)]",
                            disabled ? "opacity-50 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {t(it.label, language)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-20" />
          </div>
        </div>

        {/* Footer fijo */}
        <div className="p-4 sm:p-6 border-t border-border bg-[rgba(0,0,0,0.25)] backdrop-blur">
          <div className="flex justify-end gap-3">
            <button className="btn-ghost" type="button" onClick={onClose}>
              {t(UI_STRINGS.cancel, language)}
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() =>
                onConfirm({
                  size,
                  toppings,
                  unit_price: unitPrice, // ✅ siempre número
                })
              }
            >
              {t(UI_STRINGS.confirm, language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
