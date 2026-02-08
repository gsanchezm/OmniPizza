import React, { useEffect, useState, useMemo } from "react";
import { pizzaAPI } from "../api";
import { useAuthStore, useCartStore, useCountryStore } from "../store";

const BTN_LABEL = {
  en: "Add to cart",
  es: "Agregar al carrito",
  de: "In den Warenkorb",
  fr: "Ajouter au panier",
  ja: "カートに追加",
};

function formatMoneyIntl(value, currency, locale) {
  try {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

export default function Catalog() {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const username = useAuthStore((s) => s.username);

  const countryCode = useCountryStore((s) => s.countryCode);
  const language = useCountryStore((s) => s.language);
  const locale = useCountryStore((s) => s.locale);

  const btnText = BTN_LABEL[language] || BTN_LABEL.en;

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
    [cartItems]
  );

  useEffect(() => {
    loadPizzas();
    // ✅ refetch by market + language
  }, [countryCode, language]);

  const loadPizzas = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await pizzaAPI.getPizzas();
      setPizzas(res.data?.pizzas || []);
    } catch (e) {
      setError("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl text-text-muted font-semibold">
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl border border-danger text-danger">
          {error}
        </div>
      </div>
    );
  }

  const currency = pizzas[0]?.currency || "USD";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="lux-card rounded-2xl p-6 mb-8">
        <h1 className="text-4xl font-black text-brand-primary font-serif mb-2">
          Catalog
        </h1>
        <p className="text-text-muted font-semibold">
          User: <span className="text-text font-black">{username}</span>{" "}
          | Market: <span className="text-text font-black">{countryCode}</span>{" "}
          | Language: <span className="text-text font-black">{language}</span>{" "}
          | Currency: <span className="text-text font-black">{currency}</span>{" "}
          | Cart: <span className="text-text font-black">{cartCount}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pizzas.map((p) => (
          <div
            key={p.id}
            className="lux-card rounded-2xl overflow-hidden border border-border"
          >
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
              <div className="text-sm text-text-muted font-semibold mb-4">
                {p.description}
              </div>

              <div className="text-2xl font-black text-brand-primary mb-5">
                {formatMoneyIntl(p.price, p.currency, locale)}
              </div>

              <button
                className="btn-gold w-full"
                onClick={() => addItem(p)}
              >
                {btnText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}