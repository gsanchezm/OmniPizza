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
      <h1 className="text-4xl font-black text-white font-sans mb-8">Checkout</h1>
      <div className="text-gray-400 mb-8 -mt-6">Complete your details to enjoy the finest pizza experience.</div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Section 1: Delivery Address */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">1</div>
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">DELIVERY ADDRESS</h2>
            </div>
            
            <form id="checkout-form" onSubmit={onSubmit} className="space-y-6 pl-12">
              <div className="grid gap-6">
                <div>
                  <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Street & House Number</label>
                  <input
                    className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                    placeholder={tOpt({en:"123 Luxury Avenue", es:"Av. Reforma 123", de:"Musterstraße 123", fr:"123 Rue de la Paix", ja:"東京都渋谷区..."}, language)}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {countryCode === "MX" && (
                    <div>
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Colonia / Neighborhood</label>
                      <input
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="Polanco"
                        value={form.colonia}
                        onChange={(e) => setForm((p) => ({ ...p, colonia: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  {countryCode === "US" && (
                     <div>
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Zip Code</label>
                      <input
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="90210"
                        value={form.zip_code}
                        onChange={(e) => setForm((p) => ({ ...p, zip_code: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                   
                   {/* Add other country fields similarly if needed */}
                </div>
              </div>

               {/* Section 2: Contact Info */}
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6 -ml-12">
                  <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">2</div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">CONTACT INFO</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Full Name</label>
                     <input
                      className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                      placeholder="Julian Casablancas"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">Phone Number</label>
                     <input
                      className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                      placeholder="+52 55 1234 5678"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6 -ml-12">
                  <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">3</div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">PAYMENT METHOD</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button type="button" className="p-4 rounded-2xl border border-[#FF5722] bg-[#1a1a1a] flex items-center gap-4 transition-all">
                    <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#FF5722]">
                       <span className="material-icons">credit_card</span>
                    </div>
                    <div className="text-left">
                       <div className="text-white font-bold">Credit Card</div>
                       <div className="text-xs text-gray-500 uppercase">VISA, Mastercard, AMEX</div>
                    </div>
                  </button>

                  <button type="button" className="p-4 rounded-2xl border border-[#333] bg-[#0F0F0F] flex items-center gap-4 hover:border-gray-600 transition-all opacity-60">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400">
                       <span className="material-icons">local_atm</span>
                    </div>
                    <div className="text-left">
                       <div className="text-white font-bold">Cash</div>
                       <div className="text-xs text-gray-500 uppercase">Pay on Delivery</div>
                    </div>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#121212] rounded-3xl p-8 border border-[#1F1F1F] sticky top-8">
             <h2 className="text-2xl font-black text-white mb-8">Your Order</h2>
             
             <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((it) => (
                  <div key={it.id} className="flex gap-4 items-start relative group">
                     {/* Using generic pizza image for now, can be dynamic later */}
                     <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex-shrink-0 overflow-hidden">
                       <img src={"https://omnipizza.onrender.com/static/images/pizza-1.png"} alt={it.pizza.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                        <div className="text-white font-bold text-sm">{it.pizza.name}</div>
                        <div className="text-gray-500 text-xs">
                          {it.quantity}x • {tOpt(SIZE_OPTIONS.find(s => s.id === (it.config?.size || "small"))?.label, language)}
                        </div>
                     </div>
                     <div className="text-white font-bold text-sm">
                        {formatMoney(it.unit_price * it.quantity, it.currency, locale, it.currency_symbol)}
                     </div>
                     
                     <button 
                       onClick={() => removeItem(it.id)}
                       className="absolute -right-2 -top-2 w-5 h-5 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                     >
                       ✕
                     </button>
                  </div>
                ))}
             </div>

             <div className="border-t border-[#1F1F1F] pt-4 space-y-3 mb-8">
                 <div className="flex justify-between text-gray-400 text-sm">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal, currency, locale, symbol)}</span>
                 </div>
                 <div className="flex justify-between text-gray-400 text-sm">
                    <span>Tax (8%)</span>
                    <span>$4.12</span>
                 </div>
                 <div className="flex justify-between text-[#FF5722] text-sm font-bold">
                    <span>Delivery Fee</span>
                    <span>Free</span>
                 </div>
             </div>

             <div className="flex justify-between items-end mb-8">
                 <div className="text-xl text-white font-black">Total</div>
                 <div className="text-2xl text-white font-black">
                   {formatMoney(subtotal, currency, locale, symbol)} 
                   {/* Note: Tax logic is backend side in this demo, showing subtotal as total for now or update if needed */}
                 </div>
             </div>

             <button 
                onClick={() => document.getElementById("checkout-form").requestSubmit()}
                disabled={loading}
                className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF5722]/20"
             >
                {loading ? "Processing..." : (
                  <>
                    Place Order 
                    <span className="material-icons text-sm">arrow_forward</span>
                  </>
                )}
             </button>

             <p className="text-center text-xs text-gray-600 mt-6 leading-relaxed">
                By placing your order, you agree to OmniPizza's <a href="#" className="underline hover:text-gray-500">Terms of Service</a> and <a href="#" className="underline hover:text-gray-500">Privacy Policy</a>.
             </p>
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
