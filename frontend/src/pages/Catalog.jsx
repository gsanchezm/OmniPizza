import React, { useEffect, useMemo, useState } from "react";
import { pizzaAPI } from "../api";
import { useAuthStore, useCartStore, useCountryStore } from "../store";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../pizzaOptions";

const tOpt = (obj, lang) => obj?.[lang] || obj?.en || "";

/** --- Pricing helpers (USD->local) --- */
function getRateFromPizza(pizza) {
  // base_price is USD, price is local
  const bp = Number(pizza?.base_price);
  const p = Number(pizza?.price);
  if (!bp || bp <= 0 || !p || p <= 0) return 1;
  return p / bp;
}
function usdToLocalCeil(usdAmount, pizza) {
  const rate = getRateFromPizza(pizza);
  return Math.ceil(Number(usdAmount) * rate);
}
function computeUnitPrice(pizza, sizeUsd, toppingsCount) {
  const base = Number(pizza.price);
  const sizeAdd = usdToLocalCeil(sizeUsd, pizza);
  const toppingUnit = usdToLocalCeil(1, pizza);
  const toppingsAdd = toppingUnit * toppingsCount;
  return base + sizeAdd + toppingsAdd;
}
function formatMoney(value, currency, locale, symbol) {
  try {
    const maxFrac = currency === "JPY" ? 0 : 2;
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: maxFrac,
    }).format(Number(value));
  } catch {
    return `${symbol || ""}${value}`;
  }
}

/** --- Modal (uses pizzaOptions.js) --- */
function PizzaCustomizerModal({ open, pizza, language, locale, onClose, onConfirm }) {
  const [size, setSize] = useState("small");
  const [toppings, setToppings] = useState([]);

  useEffect(() => {
    if (open) {
      setSize("small");
      setToppings([]);
    }
  }, [open]);

  const sizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];
  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
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

  if (!open || !pizza) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative lux-card w-full max-w-2xl rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-black text-brand-primary font-serif">
              {tOpt(UI_STRINGS.title, language)}
            </div>
            <div className="text-text-muted font-semibold">{pizza.name}</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-text-muted">{pizza.currency}</div>
            <div className="text-3xl font-black text-text">
              {formatMoney(unitPrice, pizza.currency, locale, pizza.currency_symbol)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
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
                <div key={g.id} className="rounded-xl border border-border p-4 bg-surface-2">
                  <div className="font-black text-text mb-3">{tOpt(g.label, language)}</div>
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
                          {tOpt(it.label, language)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button className="btn-ghost" type="button" onClick={onClose}>
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
  );
}

export default function Catalog() {
  const username = useAuthStore((s) => s.username);

  const countryCode = useCountryStore((s) => s.countryCode);
  const language = useCountryStore((s) => s.language);
  const locale = useCountryStore((s) => s.locale);

  const addConfiguredItem = useCartStore((s) => s.addConfiguredItem);
  const cartItems = useCartStore((s) => s.items);

  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState(null);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
    [cartItems]
  );

  useEffect(() => {
    loadPizzas();
  }, [countryCode, language]);

  const loadPizzas = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await pizzaAPI.getPizzas();
      setPizzas(res.data?.pizzas || []);
    } catch {
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl text-text-muted font-semibold">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl border border-danger text-danger">{error}</div>
      </div>
    );
  }

  const currency = pizzas[0]?.currency || "USD";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="lux-card rounded-2xl p-6 mb-8">
        <h1 className="text-4xl font-black text-brand-primary font-serif mb-2">Catalog</h1>
        <p className="text-text-muted font-semibold">
          User: <span className="text-text font-black">{username}</span> | Market:{" "}
          <span className="text-text font-black">{countryCode}</span> | Language:{" "}
          <span className="text-text font-black">{language}</span> | Currency:{" "}
          <span className="text-text font-black">{currency}</span> | Cart:{" "}
          <span className="text-text font-black">{cartCount}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pizzas.map((p) => (
          <div key={p.id} className="lux-card rounded-2xl overflow-hidden border border-border">
            <div className="h-48 bg-surface-2 overflow-hidden">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg";
                }}
              />
            </div>

            <div className="p-6">
              <div className="text-xl font-black text-text mb-1">{p.name}</div>
              <div className="text-sm text-text-muted font-semibold mb-4">{p.description}</div>

              <div className="text-2xl font-black text-brand-primary mb-5">
                {formatMoney(p.price, p.currency, locale, p.currency_symbol)}
              </div>

              <button
                className="btn-gold w-full"
                onClick={() => {
                  setSelectedPizza(p);
                  setModalOpen(true);
                }}
              >
                {tOpt(UI_STRINGS.title, language)}
              </button>
            </div>
          </div>
        ))}
      </div>

      <PizzaCustomizerModal
        open={modalOpen}
        pizza={selectedPizza}
        language={language}
        locale={locale}
        onClose={() => setModalOpen(false)}
        onConfirm={(config) => {
          addConfiguredItem(selectedPizza, config); // expects config includes unit_price
          setModalOpen(false);
        }}
      />
    </div>
  );
}
