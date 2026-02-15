import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/order.service";
import {
  useCartStore,
  useCountryStore,
  useProfileStore,
  useOrderStore,
} from "../store";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../constants/pizza";
import { computeUnitPrice, getRateFromPizza } from "../utils/pizzaPricing";
import { useRefreshCartPrices } from "../hooks/useRefreshCartPrices";

const tOpt = (obj, lang) => obj?.[lang] || obj?.en || "";

const tFmt = (obj, lang, vars) => {
  let s = tOpt(obj, lang);
  for (const [k, v] of Object.entries(vars || {})) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
};

function formatMoneyInt(value, currency, locale, symbol) {
  try {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0, // ✅ entero más cercano visualmente
    }).format(Number(value));
  } catch {
    return `${symbol || ""}${Math.round(Number(value) || 0)}`;
  }
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

function computeUnitPriceValue(pizza, sizeUsd, toppingsCount) {
  return computeUnitPrice(pizza, sizeUsd, toppingsCount).unitPrice;
}
function signatureOf(pizzaId, size, toppings) {
  const t = (toppings || []).slice().sort().join(",");
  return `${pizzaId}|${size}|${t}`;
}

/** Reuse same modal, but allow initialConfig + edit confirm */
function PizzaCustomizerModal({
  open,
  pizza,
  language,
  locale,
  initialConfig,
  onClose,
  onConfirm,
}) {
  const [size, setSize] = useState(initialConfig?.size || "small");
  const [toppings, setToppings] = useState(initialConfig?.toppings || []);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setSize(initialConfig?.size || "small");
      setToppings(initialConfig?.toppings || []);
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      });
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialConfig, pizza?.id]);

  const sizeObj = SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
    return computeUnitPriceValue(pizza, sizeObj.usd, toppings.length);
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

  // ✅ costo por topping en moneda local (entero más cercano)
  const toppingLocalInt = Math.round(getRateFromPizza(pizza) * 1);
  const toppingLocalText = formatMoneyInt(
    toppingLocalInt,
    pizza.currency,
    locale,
    pizza.currency_symbol
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-6 px-3">
        <div
          className="relative lux-card w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 5rem)" }}
        >
          {/* Header fijo */}
          <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-black text-brand-primary font-sans">
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
          </div>

          {/* Body scrolleable */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 grid gap-6">
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
                        ? "bg-surface-2 border-brand-primary text-text"
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
              <div className="flex items-end justify-between gap-4">
                <div className="text-lg font-black text-text">
                  {tOpt(UI_STRINGS.toppings, language)}
                </div>

                <div className="text-right">
                  <div className="text-sm text-text-muted font-semibold">
                    {tOpt(UI_STRINGS.upTo10, language)} • {toppings.length}/10
                  </div>
                  <div className="text-xs text-text-muted font-semibold mt-1">
                    {tFmt(UI_STRINGS.toppingCostInfo, language, {
                      usd: "$1 USD",
                      local: toppingLocalText,
                    })}
                  </div>
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
                                ? "bg-brand-primary text-white border-brand-primary"
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

              <div className="h-10" />
            </div>
          </div>

          {/* Footer fijo */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-surface">
            <div className="flex justify-end gap-3">
              <button className="btn-ghost" type="button" onClick={onClose}>
                {tOpt(UI_STRINGS.cancel, language)}
              </button>
              <button
                className="btn-primary"
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

export default function Checkout() {
  const navigate = useNavigate();

  const countryCode = useCountryStore((s) => s.countryCode);
  const language = useCountryStore((s) => s.language);
  const locale = useCountryStore((s) => s.locale);

  useRefreshCartPrices(countryCode, language);

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const profile = useProfileStore();
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  const [form, setForm] = useState({
    name: profile.fullName || "",
    address: profile.address || "",
    phone: profile.phone || "",
    colonia: "",
    propina: "",
    zip_code: "",
    plz: "",
    prefectura: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
        0,
      ),
    [items],
  );

  const currency = items[0]?.currency || "USD";
  const symbol = items[0]?.currency_symbol || "$";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        country_code: countryCode,
        items: items.map((i) => ({
          pizza_id: i.pizza_id,
          quantity: i.quantity,
          size: i.config?.size || "small",
          toppings: i.config?.toppings || [],
        })),
        name: form.name,
        address: form.address,
        phone: form.phone,
      };

      if (countryCode === "MX") {
        payload.colonia = form.colonia;
        if (form.propina) payload.propina = parseFloat(form.propina);
      } else if (countryCode === "US") {
        payload.zip_code = form.zip_code;
      } else if (countryCode === "CH") {
        payload.plz = form.plz;
      } else if (countryCode === "JP") {
        payload.prefectura = form.prefectura;
      }

      const res = await orderService.checkout(payload);
      setLastOrder(res.data);
      clearCart();
      navigate("/order-success", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl text-text-muted font-semibold">
          {tOpt(
            {
              en: "Your cart is empty",
              es: "Carrito vacío",
              de: "Warenkorb leer",
              fr: "Panier vide",
              ja: "カートは空です",
            },
            language,
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-brand-primary font-sans mb-8">
        🛒{" "}
        {tOpt(
          {
            en: "Checkout",
            es: "Checkout",
            de: "Kasse",
            fr: "Paiement",
            ja: "チェックアウト",
          },
          language,
        )}
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: items + form */}
        <div className="lux-card rounded-2xl p-6">
          <div className="text-2xl font-black text-text font-sans mb-4">
            {tOpt(
              {
                en: "Delivery details",
                es: "Datos de entrega",
                de: "Lieferdaten",
                fr: "Livraison",
                ja: "配送情報",
              },
              language,
            )}
          </div>

          {/* Items list */}
          <div className="grid gap-3 mb-6">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-xl border border-border bg-surface-2 p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-text font-black">{it.pizza.name}</div>
                    <div className="text-text-muted text-sm font-semibold">
                      {tOpt(
                        SIZE_OPTIONS.find(
                          (s) => s.id === (it.config?.size || "small"),
                        )?.label,
                        language,
                      )}{" "}
                      • {(it.config?.toppings || []).length} toppings • Qty{" "}
                      {it.quantity}
                    </div>
                    <div className="text-text-muted text-sm">
                      Unit:{" "}
                      {formatMoney(
                        it.unit_price,
                        it.currency,
                        locale,
                        it.currency_symbol,
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-text font-black">
                      {formatMoney(
                        it.unit_price * it.quantity,
                        it.currency,
                        locale,
                        it.currency_symbol,
                      )}
                    </div>
                    <div className="mt-2 flex gap-2 justify-end">
                      <button
                        type="button"
                        className="btn-ghost text-sm"
                        onClick={() => {
                          setEditing(it);
                          setEditOpen(true);
                        }}
                      >
                        {tOpt(UI_STRINGS.edit, language)}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-sm"
                        onClick={() => removeItem(it.id)}
                      >
                        {tOpt(UI_STRINGS.remove, language)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="grid gap-4">
            <input
              className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              required
            />
            <input
              className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              required
            />

            {countryCode === "MX" && (
              <>
                <input
                  className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
                  placeholder="Colonia"
                  value={form.colonia}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, colonia: e.target.value }))
                  }
                  required
                />
                <input
                  className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
                  placeholder="Tip (optional)"
                  value={form.propina}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, propina: e.target.value }))
                  }
                />
              </>
            )}

            {countryCode === "US" && (
              <input
                className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
                placeholder="ZIP Code"
                value={form.zip_code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, zip_code: e.target.value }))
                }
                required
              />
            )}

            {countryCode === "CH" && (
              <input
                className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
                placeholder="PLZ"
                value={form.plz}
                onChange={(e) =>
                  setForm((p) => ({ ...p, plz: e.target.value }))
                }
                required
              />
            )}

            {countryCode === "JP" && (
              <input
                className="w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text"
                placeholder="Prefecture"
                value={form.prefectura}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prefectura: e.target.value }))
                }
                required
              />
            )}

            {error && (
              <div className="border border-danger text-danger bg-surface-2 px-4 py-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <button className="btn-primary w-full" disabled={loading}>
              {loading
                ? "…"
                : tOpt(
                    {
                      en: "Place order",
                      es: "Confirmar",
                      de: "Bestellen",
                      fr: "Valider",
                      ja: "注文確定",
                    },
                    language,
                  )}
            </button>
          </form>
        </div>

        {/* Right: totals */}
        <div className="lux-card rounded-2xl p-6">
          <div className="text-2xl font-black text-text font-sans mb-4">
            {tOpt(
              {
                en: "Summary",
                es: "Resumen",
                de: "Übersicht",
                fr: "Résumé",
                ja: "概要",
              },
              language,
            )}
          </div>

          <div className="text-text-muted font-semibold mb-2">
            {tOpt(
              {
                en: "Subtotal",
                es: "Subtotal",
                de: "Zwischensumme",
                fr: "Sous-total",
                ja: "小計",
              },
              language,
            )}
          </div>

          <div className="text-4xl font-black text-brand-primary">
            {formatMoney(subtotal, currency, locale, symbol)}
          </div>

          <div className="text-text-muted text-sm mt-4">
            {tOpt(
              {
                en: "Taxes/total are computed by backend on success screen.",
                es: "Impuestos/total se calculan en backend al finalizar.",
                de: "Steuern/Gesamt werden im Backend berechnet.",
                fr: "Taxes/total calculés par le backend.",
                ja: "税金/合計はバックエンドで計算されます。",
              },
              language,
            )}
          </div>
        </div>
      </div>

      <PizzaCustomizerModal
        open={editOpen}
        pizza={editing?.pizza}
        language={language}
        locale={locale}
        initialConfig={editing?.config}
        onClose={() => setEditOpen(false)}
        onConfirm={(config) => {
          // recompute unit_price for edited item
          const sizeObj =
            SIZE_OPTIONS.find((s) => s.id === config.size) || SIZE_OPTIONS[0];
          const newUnit = computeUnitPriceValue(
            editing.pizza,
            sizeObj.usd,
            (config.toppings || []).length,
          );

          // merge if another item already has same signature after edit
          const newSig = signatureOf(
            editing.pizza_id,
            config.size,
            config.toppings,
          );
          const all = useCartStore.getState().items;
          const other = all.find(
            (x) => x.id !== editing.id && x.signature === newSig,
          );

          if (other) {
            // merge quantities into other, remove current
            useCartStore.getState().updateItem(other.id, {
              quantity: other.quantity + editing.quantity,
            });
            useCartStore.getState().removeItem(editing.id);
          } else {
            useCartStore.getState().updateItem(editing.id, {
              signature: newSig,
              config: { size: config.size, toppings: config.toppings || [] },
              unit_price: newUnit,
            });
          }

          setEditOpen(false);
        }}
      />
    </div>
  );
}
