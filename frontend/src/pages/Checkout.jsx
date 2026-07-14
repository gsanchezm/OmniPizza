import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResponsive } from "../hooks/useResponsive";
import {
  useAuthStore,
  useCartStore,
  useCountryStore,
  useProfileStore,
  useOrderStore,
} from "../store";
import { placeOrder } from "../features/checkout/useCases/placeOrder";
import { SIZE_OPTIONS } from "../constants/pizza";
import { computeUnitPrice } from "../utils/pizzaPricing";
import { useRefreshCartPrices } from "../hooks/useRefreshCartPrices";
import { cartService } from "../services/cart.service";
import PizzaCustomizerModal from "../components/PizzaCustomizerModal";

const tOpt = (obj, lang) => obj?.[lang] || obj?.en || "";

// SVG Icons
const Icons = {
  CreditCard: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-10 h-10"
    >
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
    </svg>
  ),
  Cash: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-10 h-10"
    >
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  ),
  PayPal: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-10 h-10"
    >
      <path d="M7.5 3h6.2c2.7 0 4.6 1.4 4.2 4.2-.4 2.9-2.5 4.4-5.4 4.4H10l-.9 5.6c-.05.3-.3.5-.6.5H6.3c-.35 0-.6-.32-.54-.66L7.5 3zm3.2 3.9-.55 3.5h1.6c1.3 0 2.2-.6 2.4-1.9.18-1.2-.5-1.6-1.7-1.6h-1.75zM17.4 8.4c1.9.35 2.9 1.6 2.55 3.7-.4 2.5-2.3 3.7-5 3.7h-.6l-.85 5.2c-.05.3-.3.5-.6.5h-1.9c-.2 0-.35-.18-.32-.38l.2-1.22h1.4c2.9 0 5-1.5 5.4-4.4.28-1.95-.5-3.3-2.1-3.9.6-.9.95-2 1.15-3.2z" />
    </svg>
  ),
  ArrowForward: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 inline-block ml-2"
    >
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  ),
};

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

const UI_TEXT = {
  checkout: {
    en: "Checkout",
    es: "Finalizar Compra",
    de: "Kasse",
    fr: "Paiement",
    ja: "チェックアウト",
  },
  completeDetails: {
    en: "Complete your details to enjoy the finest pizza experience.",
    es: "Completa tus detalles para disfrutar de la mejor experiencia de pizza.",
    de: "Vervollständige deine Angaben für das beste Pizza-Erlebnis.",
    fr: "Complétez vos coordonnées pour profiter de la meilleure pizza.",
    ja: "最高のピザ体験のために詳細を入力してください。",
  },
  deliveryAddress: {
    en: "DELIVERY ADDRESS",
    es: "DIRECCIÓN DE ENTREGA",
    de: "LIEFERADRESSE",
    fr: "ADRESSE DE LIVRAISON",
    ja: "配送先住所",
  },
  contactInfo: {
    en: "CONTACT INFO",
    es: "INFORMACIÓN DE CONTACTO",
    de: "KONTAKTINFORMATIONEN",
    fr: "INFOS CONTACT ",
    ja: "連絡先情報",
  },
  paymentMethod: {
    en: "PAYMENT METHOD",
    es: "MÉTODO DE PAGO",
    de: "ZAHLUNGSMETHODE",
    fr: "MÉTHODE DE PAIEMENT",
    ja: "支払い方法",
  },
  orderSummary: {
    en: "Your Order",
    es: "Tu pedido",
    de: "Deine Bestellung",
    fr: "Votre commande",
    ja: "ご注文",
  },
  subtotal: {
    en: "Subtotal",
    es: "Subtotal",
    de: "Zwischensumme",
    fr: "Sous-total",
    ja: "小計",
  },
  tax: { en: "Tax", es: "Impuesto", de: "Steuer", fr: "Taxe", ja: "税金" },
  deliveryFee: {
    en: "Delivery Fee",
    es: "Costo de entrega",
    de: "Liefergebühr",
    fr: "Frais de livraison",
    ja: "配達料",
  },
  total: { en: "Total", es: "Total", de: "Gesamt", fr: "Total", ja: "合計" },
  placeOrder: {
    en: "Place Order",
    es: "Realizar Pedido",
    de: "Bestellung aufgeben",
    fr: "Passer la commande",
    ja: "注文する",
  },
  termsText: {
    en: "By placing your order, you agree to OmniPizza's",
    es: "Al realizar tu pedido, aceptas los",
    de: "Mit deiner Bestellung stimmst du den",
    fr: "En passant commande, vous acceptez les",
    ja: "注文することで、OmniPizzaの",
  },
  terms: {
    en: "Terms of Service",
    es: "Términos de Servicio",
    de: "Nutzungsbedingungen",
    fr: "Conditions d'utilisation",
    ja: "利用規約",
  },
  privacy: {
    en: "Privacy Policy",
    es: "Política de Privacidad",
    de: "Datenschutzrichtlinien",
    fr: "Politique de confidentialité",
    ja: "プライバシーポリシー",
  },
  free: { en: "Free", es: "Gratis", de: "Gratis", fr: "Gratuit", ja: "無料" },
  processing: {
    en: "Processing...",
    es: "Procesando...",
    de: "Verarbeitung...",
    fr: "Traitement...",
    ja: "処理中...",
  },
  creditCard: {
    en: "Credit Card",
    es: "Tarjeta de Crédito",
    de: "Kreditkarte",
    fr: "Carte de Crédit",
    ja: "クレジットカード",
  },
  creditCardDesc: {
    en: "VISA, Mastercard, AMEX",
    es: "VISA, Mastercard, AMEX",
    de: "VISA, Mastercard, AMEX",
    fr: "VISA, Mastercard, AMEX",
    ja: "VISA, Mastercard, AMEX",
  },
  cash: {
    en: "Cash",
    es: "Efectivo",
    de: "Barzahlung",
    fr: "Espèces",
    ja: "現金",
  },
  cashDesc: {
    en: "Pay on Delivery",
    es: "Pagar al recibir",
    de: "Zahlung bei Lieferung",
    fr: "Payer à la livraison",
    ja: "代金引換",
  },
  paypal: {
    en: "PayPal",
    es: "PayPal",
    de: "PayPal",
    fr: "PayPal",
    ja: "PayPal",
  },
  paypalDesc: {
    en: "Pay with your PayPal account",
    es: "Paga con tu cuenta PayPal",
    de: "Mit PayPal-Konto bezahlen",
    fr: "Payez avec votre compte PayPal",
    ja: "PayPalアカウントで支払う",
  },
  paypalDemoNote: {
    en: "Demo — no real authentication",
    es: "Demo — sin autenticación real",
    de: "Demo — keine echte Authentifizierung",
    fr: "Démo — pas d'authentification réelle",
    ja: "デモ — 実際の認証はありません",
  },
  paypalEmail: {
    en: "PayPal Email",
    es: "Correo de PayPal",
    de: "PayPal-E-Mail",
    fr: "E-mail PayPal",
    ja: "PayPalメール",
  },
  paypalPassword: {
    en: "PayPal Password",
    es: "Contraseña de PayPal",
    de: "PayPal-Passwort",
    fr: "Mot de passe PayPal",
    ja: "PayPalパスワード",
  },
  paypalLoginBtn: {
    en: "Log in to PayPal",
    es: "Iniciar sesión en PayPal",
    de: "Bei PayPal anmelden",
    fr: "Se connecter à PayPal",
    ja: "PayPalにログイン",
  },
  cardNumber: {
    en: "Card Number",
    es: "Número de Tarjeta",
    de: "Kartennummer",
    fr: "Numéro de carte",
    ja: "カード番号",
  },
  cardExpiry: {
    en: "Expiry Date",
    es: "Fecha de Expiración",
    de: "Ablaufdatum",
    fr: "Date d'expiration",
    ja: "有効期限",
  },
  cardCvv: { en: "CVV", es: "CVV", de: "CVV", fr: "CVV", ja: "CVV" },
  cardHolder: {
    en: "Cardholder Name",
    es: "Nombre del Titular",
    de: "Karteninhaber",
    fr: "Nom du titulaire",
    ja: "カード名義人",
  },
  streetPlaceholder: {
    en: "Street & House Number",
    es: "Calle y Número",
    de: "Straße & Hausnummer",
    fr: "Rue et Numéro",
    ja: "住所",
  },
  coloniaPlaceholder: {
    en: "Colonia / Neighborhood",
    es: "Colonia",
    de: "Stadtteil",
    fr: "Quartier",
    ja: "地区",
  },
  zipPlaceholder: {
    en: "Zip Code",
    es: "Código Postal",
    de: "Postleitzahl",
    fr: "Code Postal",
    ja: "郵便番号",
  },
  plzPlaceholder: {
    en: "PLZ / Postal Code",
    es: "Código Postal",
    de: "PLZ",
    fr: "Code Postal",
    ja: "郵便番号",
  },
  prefecturaPlaceholder: {
    en: "Prefecture",
    es: "Prefectura",
    de: "Präfektur",
    fr: "Préfecture",
    ja: "都道府県",
  },
  districtPlaceholder: {
    en: "District",
    es: "Distrito",
    de: "Bezirk",
    fr: "Quartier",
    ja: "地区",
    ar: "الحي",
  },
  invalidPhone: {
    en: "Enter a valid phone number (7-15 digits)",
    es: "Ingrese un teléfono válido (7-15 dígitos)",
    de: "Geben Sie eine gültige Telefonnummer ein (7-15 Ziffern)",
    fr: "Entrez un numéro valide (7-15 chiffres)",
    ja: "有効な電話番号を入力してください（7〜15桁）",
  },
  fullName: {
    en: "Full Name",
    es: "Nombre completo",
    de: "Vollständiger Name",
    fr: "Nom complet",
    ja: "氏名",
  },
  phone: {
    en: "Phone Number",
    es: "Teléfono",
    de: "Telefonnummer",
    fr: "Numéro de téléphone",
    ja: "電話番号",
  },
  edit: {
    en: "Edit",
    es: "Editar",
    de: "Bearbeiten",
    fr: "Modifier",
    ja: "編集",
  },
  remove: {
    en: "Remove",
    es: "Eliminar",
    de: "Entfernen",
    fr: "Supprimer",
    ja: "削除",
  },
  and: { en: "and", es: "y", de: "und", fr: "et", ja: "と" },
  cartEmpty: {
    en: "Your cart is empty",
    es: "Carrito vacío",
    de: "Warenkorb leer",
    fr: "Panier vide",
    ja: "カートは空です",
  },
  startOrder: {
    en: "Start Your Order",
    es: "Comienza tu Pedido",
    de: "Bestellung starten",
    fr: "Commencer votre commande",
    ja: "注文を始める",
  },
};

const FALLBACK_TAX_RATE_BY_COUNTRY = {
  MX: 0.16,
  US: 0.08,
  CH: 0.081,
  JP: 0.1,
  SA: 0.15,
};

const FALLBACK_DELIVERY_FEE_BY_COUNTRY = {
  MX: 35.1,
  US: 2,
  CH: 1.56,
  JP: 316,
  SA: 7.5,
};

const FALLBACK_TIP_OPTIONS_BY_COUNTRY = {
  MX: [0, 5, 10, 15],
  US: [0, 5, 10, 15],
  CH: [0, 5, 10, 15],
  JP: [0, 5, 10, 15],
  SA: [0, 5, 10, 15],
};
const DEFAULT_TIP_PERCENTAGE = "0";

// Card expiry dropdown options: months 01–12, years 2024–2039 shown as "24".."39".
const EXPIRY_MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const EXPIRY_YEARS = Array.from({ length: 16 }, (_, i) => String(24 + i));

function roundCurrencyAmount(value, currency) {
  if (!Number.isFinite(value)) return 0;
  if (currency === "JPY") return Math.round(value);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { tid } = useResponsive();

  const token = useAuthStore((s) => s.token);
  const countryCode = useCountryStore((s) => s.countryCode);
  const countryInfo = useCountryStore((s) => s.countryInfo);
  const language = useCountryStore((s) => s.language);
  const locale = useCountryStore((s) => s.locale);

  // Hydrate cart from backend (enables API-based state injection for E2E tests)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        // Skip if user already has items in the UI cart (normal shopping flow).
        // Only hydrate when the local cart is empty — e.g. E2E test injected
        // state via POST /api/cart and then navigated directly to /checkout.
        if (useCartStore.getState().items.length > 0) return;

        const res = await cartService.getCart();
        const backendItems = res.data?.cart_items;
        if (cancelled || !backendItems?.length) return;

        const hydrated = backendItems.map((item) => {
          const size = (item.size || "small").toLowerCase();
          const sizeOption =
            SIZE_OPTIONS.find((s) => s.id === size) || SIZE_OPTIONS[0];

          const pizza = {
            id: item.pizza_id,
            name: item.name,
            price: item.price,
            base_price: item.base_price,
            currency: item.currency,
            currency_symbol: item.currency_symbol,
            image: item.image,
          };

          const pricing = computeUnitPrice(pizza, sizeOption.usd, 0);

          return {
            id: (globalThis.crypto?.randomUUID?.() || `item_${Date.now()}_${Math.random()}`).toString(),
            signature: `${item.pizza_id}|${size}|`,
            pizza_id: item.pizza_id,
            pizza,
            quantity: item.quantity,
            config: { size, toppings: [] },
            unit_price: pricing.unitPrice,
            currency: item.currency,
            currency_symbol: item.currency_symbol,
          };
        });

        if (!cancelled) {
          useCartStore.setState({ items: hydrated });
        }
      } catch {
        // Fall back to current client-side cart on failure
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    district: "",
    card_number: "",
    card_expiry: "",
    card_expiry_month: "",
    card_expiry_year: "",
    card_cvv: "",
    card_holder: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");
  // PayPal demo form — client-side only, never sent to the backend.
  const [paypalForm, setPaypalForm] = useState({ email: "", password: "" });
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [tipOption, setTipOption] = useState(DEFAULT_TIP_PERCENTAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Automation-demo widgets: pre-order confirmation modal + tip tooltip.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tipTipOpen, setTipTipOpen] = useState(false);
  const placeOrderBtnRef = useRef(null);
  const confirmCancelRef = useRef(null);

  // Move focus into the confirmation modal on open, trap Escape to close it,
  // and return focus to the trigger button on close (WCAG 2.4.3).
  useEffect(() => {
    if (!confirmOpen) return;
    confirmCancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setConfirmOpen(false);
        placeOrderBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  const currency = items[0]?.currency || "USD";
  const symbol = items[0]?.currency_symbol || "$";

  const subtotal = useMemo(
    () =>
      roundCurrencyAmount(
        items.reduce(
          (sum, it) => sum + Number(it.unit_price) * Number(it.quantity),
          0,
        ),
        currency,
      ),
    [currency, items],
  );
  const taxRate = useMemo(() => {
    const apiTaxRate = Number(countryInfo?.tax_rate);
    if (Number.isFinite(apiTaxRate)) return apiTaxRate;
    return FALLBACK_TAX_RATE_BY_COUNTRY[countryCode] ?? 0;
  }, [countryCode, countryInfo]);
  const deliveryFee = useMemo(() => {
    const apiDeliveryFee = Number(countryInfo?.delivery_fee);
    if (Number.isFinite(apiDeliveryFee)) return apiDeliveryFee;
    return FALLBACK_DELIVERY_FEE_BY_COUNTRY[countryCode] ?? 0;
  }, [countryCode, countryInfo]);
  const tipOptions = useMemo(() => {
    const apiTipPercentages = Array.isArray(countryInfo?.tip_percentages)
      ? countryInfo.tip_percentages
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value >= 0)
      : [];
    if (apiTipPercentages.length === 4) return apiTipPercentages;
    return FALLBACK_TIP_OPTIONS_BY_COUNTRY[countryCode] ?? [0, 5, 10, 15];
  }, [countryCode, countryInfo]);
  useEffect(() => {
    const hasZeroOption = tipOptions.some((value) => Number(value) === 0);
    setTipOption(hasZeroOption ? DEFAULT_TIP_PERCENTAGE : String(tipOptions[0] ?? 0));
  }, [countryCode, tipOptions]);
  const tipPercentage = useMemo(() => Number(tipOption) || 0, [tipOption]);
  const taxAmount = useMemo(
    () => roundCurrencyAmount(subtotal * taxRate, currency),
    [currency, subtotal, taxRate],
  );
  const tipAmount = useMemo(
    () => roundCurrencyAmount(subtotal * (tipPercentage / 100), currency),
    [currency, subtotal, tipPercentage],
  );
  const totalAmount = useMemo(
    () => roundCurrencyAmount(subtotal + deliveryFee + taxAmount + tipAmount, currency),
    [currency, deliveryFee, subtotal, taxAmount, tipAmount],
  );
  const taxPercent = useMemo(
    () =>
      (taxRate * 100).toLocaleString(locale || "en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale, taxRate],
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
          const res = await placeOrder({
        countryCode,
        items,
        form: {
          ...form,
          propina: String(tipPercentage),
          payment_method: paymentMethod,
        },
      });
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
      <div data-testid="screen-checkout" className="mx-auto max-w-6xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl text-text-muted font-semibold flex flex-col items-center gap-6 py-16">
          <span className="text-lg">{tOpt(UI_TEXT.cartEmpty, language)}</span>
          <button
            data-testid="start-order-btn"
            onClick={() => navigate("/catalog")}
            className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-3 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-[#FF5722]/20"
          >
            {tOpt(UI_TEXT.startOrder, language)}
            <Icons.ArrowForward />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="screen-checkout" className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-white font-sans mb-8">
        {tOpt(UI_TEXT.checkout, language)}
      </h1>
      <div className="text-gray-400 mb-8 -mt-6">
        {tOpt(UI_TEXT.completeDetails, language)}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-10">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm"
            >
              {typeof error === "string"
                ? error
                : JSON.stringify(error, null, 2)}
            </div>
          )}
          {/* Section 1: Delivery Address */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                {tOpt(UI_TEXT.deliveryAddress, language)}
              </h2>
            </div>

            <form
              id="checkout-form"
              onSubmit={onSubmit}
              className="space-y-6 pl-12"
            >
              <div className="grid gap-6">
                <div>
                  <label htmlFor="field-address" data-testid="label-address" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                    {tOpt(UI_TEXT.streetPlaceholder, language)}
                  </label>
                  <input
                    id="field-address"
                    data-testid={tid("address")}
                    className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                    placeholder={tOpt(
                      {
                        en: "123 Luxury Avenue",
                        es: "Av. Reforma 123",
                        de: "Musterstraße 123",
                        fr: "123 Rue de la Paix",
                        ja: "東京都渋谷区...",
                      },
                      language,
                    )}
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    minLength={5}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {countryCode === "MX" && (
                    <div>
                      <label htmlFor="field-colonia" data-testid="label-colonia" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.coloniaPlaceholder, language)}
                      </label>
                      <input
                        id="field-colonia"
                        data-testid="colonia"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="Polanco"
                        value={form.colonia}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, colonia: e.target.value }))
                        }
                        required
                      />
                    </div>
                  )}

                  {countryCode === "MX" && (
                    <div>
                      <label htmlFor="field-zip-code" data-testid="label-zip-code" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.zipPlaceholder, language)}
                      </label>
                      <input
                        id="field-zip-code"
                        data-testid="zip-code"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="06600"
                        value={form.zip_code}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            zip_code: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        minLength={5}
                        maxLength={5}
                      />
                    </div>
                  )}

                  {countryCode === "US" && (
                    <div>
                      <label htmlFor="field-zip-code" data-testid="label-zip-code" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.zipPlaceholder, language)}
                      </label>
                      <input
                        id="field-zip-code"
                        data-testid="zip-code"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="90210"
                        value={form.zip_code}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            zip_code: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        minLength={5}
                        maxLength={5}
                        required
                      />
                    </div>
                  )}

                  {countryCode === "CH" && (
                    <div>
                      <label htmlFor="field-zip-code" data-testid="label-zip-code" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.plzPlaceholder, language)}
                      </label>
                      <input
                        id="field-zip-code"
                        data-testid="zip-code"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="8001"
                        value={form.plz}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, plz: e.target.value }))
                        }
                        required
                      />
                    </div>
                  )}

                  {countryCode === "JP" && (
                    <div>
                      <label htmlFor="field-zip-code" data-testid="label-prefectura" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.prefecturaPlaceholder, language)}
                      </label>
                      <input
                        id="field-zip-code"
                        data-testid="zip-code"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder={tOpt(
                          {
                            en: "Tokyo",
                            es: "Tokio",
                            de: "Tokio",
                            fr: "Tokyo",
                            ja: "東京都",
                          },
                          language,
                        )}
                        value={form.prefectura}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, prefectura: e.target.value }))
                        }
                        required
                      />
                    </div>
                  )}

                  {countryCode === "SA" && (
                    <div>
                      <label htmlFor="field-district" data-testid="label-district" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.districtPlaceholder, language)}
                      </label>
                      <input
                        id="field-district"
                        data-testid="district"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder={tOpt(
                          {
                            en: "Al Olaya",
                            es: "Al Olaya",
                            de: "Al Olaya",
                            fr: "Al Olaya",
                            ja: "アル・オラヤ",
                            ar: "العليا",
                          },
                          language,
                        )}
                        value={form.district}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, district: e.target.value }))
                        }
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6 -ml-12">
                  <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                    {tOpt(UI_TEXT.contactInfo, language)}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="field-full-name" data-testid="label-full-name" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                      {tOpt(UI_TEXT.fullName, language)}
                    </label>
                    <input
                      id="field-full-name"
                      data-testid={tid("full-name")}
                      className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                      placeholder="Julian Casablancas"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      minLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="field-phone" data-testid="label-phone" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                      {tOpt(UI_TEXT.phone, language)}
                    </label>
                    <input
                      id="field-phone"
                      type="tel"
                      data-testid={tid("phone")}
                      className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                      placeholder="+52 55 1234 5678"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          phone: e.target.value.replace(/[^0-9]/g, ""),
                        }))
                      }
                      pattern="[\d\s\+\-\(\)]{8,20}"
                      minLength={8}
                      maxLength={20}
                      title={tOpt(UI_TEXT.invalidPhone, language)}
                      aria-describedby="field-phone-hint"
                      required
                    />
                    <span id="field-phone-hint" className="sr-only">
                      {tOpt(UI_TEXT.invalidPhone, language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6 -ml-12">
                  <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                    {tOpt(UI_TEXT.paymentMethod, language)}
                  </h2>
                </div>

                <div
                  role="radiogroup"
                  aria-label={tOpt(UI_TEXT.paymentMethod, language)}
                  className="grid md:grid-cols-3 gap-4"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "card"}
                    data-testid="payment-method-card"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${paymentMethod === "card" ? "border-[#FF5722] bg-[#1a1a1a]" : "border-[#333] bg-[#0F0F0F] opacity-60 hover:opacity-100 hover:border-gray-600"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "card" ? "border-[#FF5722]" : "border-gray-500"}`}
                    >
                      {paymentMethod === "card" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722]" />
                      )}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "card" ? "bg-[#2A2A2A] text-[#FF5722]" : "bg-[#1A1A1A] text-gray-400"}`}
                    >
                      <Icons.CreditCard />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-left">
                        {tOpt(UI_TEXT.creditCard, language)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase text-left">
                        {tOpt(UI_TEXT.creditCardDesc, language)}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "cash"}
                    data-testid="payment-method-cash"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${paymentMethod === "cash" ? "border-[#FF5722] bg-[#1a1a1a]" : "border-[#333] bg-[#0F0F0F] opacity-60 hover:opacity-100 hover:border-gray-600"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "cash" ? "border-[#FF5722]" : "border-gray-500"}`}
                    >
                      {paymentMethod === "cash" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722]" />
                      )}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "cash" ? "bg-[#2A2A2A] text-[#FF5722]" : "bg-[#1A1A1A] text-gray-400"}`}
                    >
                      <Icons.Cash />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-left">
                        {tOpt(UI_TEXT.cash, language)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase text-left">
                        {tOpt(UI_TEXT.cashDesc, language)}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "paypal"}
                    data-testid="payment-method-paypal"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${paymentMethod === "paypal" ? "border-[#FF5722] bg-[#1a1a1a]" : "border-[#333] bg-[#0F0F0F] opacity-60 hover:opacity-100 hover:border-gray-600"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "paypal" ? "border-[#FF5722]" : "border-gray-500"}`}
                    >
                      {paymentMethod === "paypal" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722]" />
                      )}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "paypal" ? "bg-[#2A2A2A] text-[#FF5722]" : "bg-[#1A1A1A] text-gray-400"}`}
                    >
                      <Icons.PayPal />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-left">
                        {tOpt(UI_TEXT.paypal, language)}
                      </div>
                      <div className="text-xs text-gray-500 uppercase text-left">
                        {tOpt(UI_TEXT.paypalDesc, language)}
                      </div>
                    </div>
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div className="grid gap-6 mt-6">
                    <div>
                      <label htmlFor="field-card-holder" data-testid="label-card-holder" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.cardHolder, language)}
                      </label>
                      <input
                        id="field-card-holder"
                        data-testid="card-holder"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="Julian Casablancas"
                        value={form.card_holder}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            card_holder: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="field-card-number" data-testid="label-card-number" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.cardNumber, language)}
                      </label>
                      <input
                        id="field-card-number"
                        data-testid="card-number"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="4242 4242 4242 4242"
                        value={form.card_number}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            card_number: e.target.value.replace(/[^0-9]/g, ""),
                          }))
                        }
                        maxLength={19}
                        minLength={13}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label id="field-card-expiry-label" data-testid="label-card-expiry" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                          {tOpt(UI_TEXT.cardExpiry, language)}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            aria-labelledby="field-card-expiry-label"
                            data-testid="card-expiry-month"
                            style={{ colorScheme: "dark" }}
                            className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                            value={form.card_expiry_month}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                card_expiry_month: e.target.value,
                                card_expiry:
                                  e.target.value && p.card_expiry_year
                                    ? `${e.target.value}/${p.card_expiry_year}`
                                    : "",
                              }))
                            }
                            required
                          >
                            <option value="">MM</option>
                            {EXPIRY_MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            aria-labelledby="field-card-expiry-label"
                            data-testid="card-expiry-year"
                            style={{ colorScheme: "dark" }}
                            className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                            value={form.card_expiry_year}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                card_expiry_year: e.target.value,
                                card_expiry:
                                  p.card_expiry_month && e.target.value
                                    ? `${p.card_expiry_month}/${e.target.value}`
                                    : "",
                              }))
                            }
                            required
                          >
                            <option value="">YY</option>
                            {EXPIRY_YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="field-card-cvv" data-testid="label-card-cvv" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                          {tOpt(UI_TEXT.cardCvv, language)}
                        </label>
                        <input
                          id="field-card-cvv"
                          data-testid="card-cvv"
                          className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                          placeholder="123"
                          value={form.card_cvv}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              card_cvv: e.target.value.replace(/[^0-9]/g, ""),
                            }))
                          }
                          maxLength={4}
                          minLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div
                    data-testid="paypal-form"
                    className="grid gap-4 mt-6 p-5 rounded-2xl border border-[#333] bg-[#0F0F0F]"
                  >
                    <div className="flex items-center gap-2 text-[#FF5722]">
                      <Icons.PayPal />
                      <span className="text-white font-bold text-lg">
                        {tOpt(UI_TEXT.paypal, language)}
                      </span>
                    </div>
                    <div
                      data-testid="paypal-demo-note"
                      className="text-xs font-bold uppercase tracking-wider text-amber-500/80"
                    >
                      {tOpt(UI_TEXT.paypalDemoNote, language)}
                    </div>
                    <div>
                      <label htmlFor="field-paypal-email" data-testid="label-paypal-email" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.paypalEmail, language)}
                      </label>
                      <input
                        id="field-paypal-email"
                        type="email"
                        data-testid="paypal-email"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="you@example.com"
                        value={paypalForm.email}
                        onChange={(e) =>
                          setPaypalForm((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label htmlFor="field-paypal-password" data-testid="label-paypal-password" className="block text-gray-500 text-xs font-bold mb-2 uppercase">
                        {tOpt(UI_TEXT.paypalPassword, language)}
                      </label>
                      <input
                        id="field-paypal-password"
                        type="password"
                        data-testid="paypal-password"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="••••••••"
                        value={paypalForm.password}
                        onChange={(e) =>
                          setPaypalForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      data-testid="paypal-login-btn"
                      onClick={() => setPaypalConnected(true)}
                      className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white font-bold py-4 rounded-2xl transition-colors"
                    >
                      {tOpt(UI_TEXT.paypalLoginBtn, language)}
                    </button>
                    {paypalConnected && (
                      <div
                        data-testid="paypal-connected"
                        className="text-sm font-semibold text-green-400"
                      >
                        {tOpt(
                          {
                            en: "Connected (demo). Place your order below.",
                            es: "Conectado (demo). Realiza tu pedido abajo.",
                            de: "Verbunden (Demo). Gib deine Bestellung unten auf.",
                            fr: "Connecté (démo). Passez votre commande ci-dessous.",
                            ja: "接続済み（デモ）。下記から注文してください。",
                          },
                          language,
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#121212] rounded-3xl p-8 border border-[#1F1F1F] sticky top-8">
            <h2
              data-testid="order-summary-title"
              className="text-2xl font-black text-white mb-8"
            >
              {tOpt(UI_TEXT.orderSummary, language)}
            </h2>

            <div
              data-testid="order-summary-items"
              className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
            >
              {items.map((it) => (
                <div
                  key={it.id}
                  data-testid={`order-item-${it.pizza_id}`}
                  className="flex gap-4 items-start relative group"
                >
                  {/* Using generic pizza image for now, can be dynamic later */}
                  <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex-shrink-0 overflow-hidden">
                    <img
                      data-testid={`order-item-image-${it.pizza_id}`}
                      src={
                        it.pizza.image ||
                        "https://omnipizza.onrender.com/static/images/pizza-1.png"
                      }
                      alt={it.pizza.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div
                      data-testid={`order-item-name-${it.pizza_id}`}
                      className="text-white font-bold text-sm"
                    >
                      {it.pizza.name}
                    </div>
                    <div
                      data-testid={`order-item-details-${it.pizza_id}`}
                      className="text-gray-500 text-xs"
                    >
                      {it.quantity}x •{" "}
                      {tOpt(
                        SIZE_OPTIONS.find(
                          (s) => s.id === (it.config?.size || "small"),
                        )?.label,
                        language,
                      )}
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      <button
                        data-testid={`order-item-edit-${it.pizza_id}`}
                        onClick={() => {
                          setEditing(it);
                          setEditOpen(true);
                        }}
                        className="text-[10px] font-bold text-gray-500 hover:text-[#FF5722] uppercase tracking-wider transition-colors"
                      >
                        {tOpt(UI_TEXT.edit, language)}
                      </button>
                      <button
                        data-testid={`order-item-remove-${it.pizza_id}`}
                        onClick={() => removeItem(it.id)}
                        className="text-[10px] font-bold text-gray-500 hover:text-red-500 uppercase tracking-wider transition-colors"
                      >
                        {tOpt(UI_TEXT.remove, language)}
                      </button>
                    </div>
                  </div>
                  <div
                    data-testid={`order-item-price-${it.pizza_id}`}
                    className="text-white font-bold text-sm"
                  >
                    {formatMoney(
                      it.unit_price * it.quantity,
                      it.currency,
                      locale,
                      it.currency_symbol,
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#1F1F1F] pt-4 space-y-3 mb-8">
              <div
                data-testid="order-subtotal"
                className="flex justify-between text-gray-400 text-sm"
              >
                <span>{tOpt(UI_TEXT.subtotal, language)}</span>
                <span>{formatMoney(subtotal, currency, locale, symbol)}</span>
              </div>
              <div
                data-testid="order-tax"
                className="flex justify-between text-gray-400 text-sm"
              >
                <span>
                  {tOpt(UI_TEXT.tax, language)} ({taxPercent}%)
                </span>
                <span>{formatMoney(taxAmount, currency, locale, symbol)}</span>
              </div>
              <div
                data-testid="order-delivery-fee"
                className="flex justify-between text-gray-400 text-sm"
              >
                <span>{tOpt(UI_TEXT.deliveryFee, language)}</span>
                <span>{formatMoney(deliveryFee, currency, locale, symbol)}</span>
              </div>

              <div className="rounded-2xl border border-[#1F1F1F] bg-[#161616] p-4">
                <div
                  data-testid="order-tip"
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-gray-400 flex items-center gap-1.5">
                    {tOpt({ en: "Tip for Driver", es: "Propina para el conductor", de: "Trinkgeld für den Fahrer", fr: "Pourboire pour le chauffeur", ja: "ドライバーへのチップ" }, language)}
                    <span className="relative inline-flex">
                      <button
                        type="button"
                        data-testid="tip-info"
                        aria-describedby="tip-tooltip"
                        aria-label="Tip information"
                        onMouseEnter={() => setTipTipOpen(true)}
                        onMouseLeave={() => setTipTipOpen(false)}
                        onFocus={() => setTipTipOpen(true)}
                        onBlur={() => setTipTipOpen(false)}
                        onClick={() => setTipTipOpen((v) => !v)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        ℹ️
                      </button>
                      {tipTipOpen && (
                        <span
                          id="tip-tooltip"
                          data-testid="tip-tooltip"
                          role="tooltip"
                          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-[#0A0A0A] border border-[#333] px-3 py-2 text-xs text-gray-200 shadow-xl"
                        >
                          {tOpt({ en: "100% of your tip goes directly to your driver.", es: "El 100% de tu propina va directo al conductor.", de: "100% deines Trinkgelds gehen direkt an den Fahrer.", fr: "100% de votre pourboire va directement au chauffeur.", ja: "チップは100%ドライバーに渡ります。" }, language)}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="font-bold text-white">
                    {formatMoney(tipAmount, currency, locale, symbol)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tipOptions.map((value) => {
                    const optionKey = String(value);
                    const active = tipOption === optionKey;
                    return (
                      <button
                        key={`${value}`}
                        type="button"
                        aria-pressed={active}
                        data-testid={`order-tip-${value}`}
                        onClick={() =>
                          setTipOption(optionKey)
                        }
                        className={`min-w-[92px] flex-1 rounded-full px-4 py-2 text-center text-sm font-bold transition-colors sm:flex-none ${active ? "bg-[#FF5722] text-white" : "bg-[#242424] text-gray-300 hover:bg-[#303030]"}`}
                      >
                        {value}%
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              data-testid="order-total"
              className="flex justify-between items-end mb-8"
            >
              <div className="text-xl text-white font-black">
                {tOpt(UI_TEXT.total, language)}
              </div>
              <div className="text-2xl text-white font-black">
                {formatMoney(totalAmount, currency, locale, symbol)}
              </div>
            </div>

            <button
              ref={placeOrderBtnRef}
              data-testid={tid("place-order-btn")}
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF5722]/20"
            >
              {loading ? (
                tOpt(UI_TEXT.processing, language)
              ) : (
                <>
                  {tOpt(UI_TEXT.placeOrder, language)}
                  <Icons.ArrowForward />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-600 mt-6 leading-relaxed">
              {tOpt(UI_TEXT.termsText, language)}{" "}
              <a href="#" className="underline hover:text-gray-500">
                {tOpt(UI_TEXT.terms, language)}
              </a>{" "}
              {tOpt(UI_TEXT.and, language)}{" "}
              <a href="#" className="underline hover:text-gray-500">
                {tOpt(UI_TEXT.privacy, language)}
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div
          data-testid="confirm-order-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-order-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmOpen(false);
              placeOrderBtnRef.current?.focus();
            }
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#161616] border border-[#2A2A2A] p-6 shadow-2xl">
            <h3 id="confirm-order-title" className="text-xl font-black text-white mb-2">
              {tOpt({ en: "Confirm your order", es: "Confirma tu pedido", de: "Bestellung bestätigen", fr: "Confirmer la commande", ja: "注文の確認" }, language)}
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              {tOpt({ en: "Total to pay", es: "Total a pagar", de: "Zu zahlender Betrag", fr: "Montant à payer", ja: "お支払い金額" }, language)}:{" "}
              <span data-testid="confirm-order-total" className="text-[#FF5722] font-black">
                {formatMoney(totalAmount, currency, locale, symbol)}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                ref={confirmCancelRef}
                type="button"
                data-testid="confirm-order-cancel"
                onClick={() => {
                  setConfirmOpen(false);
                  placeOrderBtnRef.current?.focus();
                }}
                className="flex-1 py-3 rounded-xl border border-[#333] text-white font-bold hover:bg-[#222] transition-colors"
              >
                {tOpt({ en: "Cancel", es: "Cancelar", de: "Abbrechen", fr: "Annuler", ja: "キャンセル" }, language)}
              </button>
              <button
                type="button"
                data-testid="confirm-order-yes"
                onClick={() => {
                  setConfirmOpen(false);
                  document.getElementById("checkout-form").requestSubmit();
                }}
                className="flex-1 py-3 rounded-xl bg-[#FF5722] text-white font-bold hover:bg-[#E64A19] transition-colors"
              >
                {tOpt({ en: "Place Order", es: "Realizar Pedido", de: "Bestellung aufgeben", fr: "Passer la commande", ja: "注文する" }, language)}
              </button>
            </div>
          </div>
        </div>
      )}

      <PizzaCustomizerModal
        open={editOpen}
        pizza={editing?.pizza}
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
