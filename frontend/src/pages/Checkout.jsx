import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/order.service";
import {
  useCartStore,
  useCountryStore,
  useProfileStore,
  useOrderStore,
} from "../store";
import { SIZE_OPTIONS } from "../constants/pizza";
import { computeUnitPrice } from "../utils/pizzaPricing";
import { useRefreshCartPrices } from "../hooks/useRefreshCartPrices";
import PizzaCustomizerModal from "../components/PizzaCustomizerModal";

const tOpt = (obj, lang) => obj?.[lang] || obj?.en || "";

// SVG Icons
const Icons = {
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
    </svg>
  ),
  Cash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  ),
  ArrowForward: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 inline-block ml-2">
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
  checkout: { en: "Checkout", es: "Finalizar Compra", de: "Kasse", fr: "Paiement", ja: "チェックアウト" },
  completeDetails: { en: "Complete your details to enjoy the finest pizza experience.", es: "Completa tus detalles para disfrutar de la mejor experiencia de pizza.", de: "Vervollständige deine Angaben für das beste Pizza-Erlebnis.", fr: "Complétez vos coordonnées pour profiter de la meilleure pizza.", ja: "最高のピザ体験のために詳細を入力してください。" },
  deliveryAddress: { en: "DELIVERY ADDRESS", es: "DIRECCIÓN DE ENTREGA", de: "LIEFERADRESSE", fr: "ADRESSE DE LIVRAISON", ja: "配送先住所" },
  contactInfo: { en: "CONTACT INFO", es: "INFORMACIÓN DE CONTACTO", de: "KONTAKTINFORMATIONEN", fr: "INFOS CONTACT ", ja: "連絡先情報" },
  paymentMethod: { en: "PAYMENT METHOD", es: "MÉTODO DE PAGO", de: "ZAHLUNGSMETHODE", fr: "MÉTHODE DE PAIEMENT", ja: "支払い方法" },
  orderSummary: { en: "Your Order", es: "Tu pedido", de: "Deine Bestellung", fr: "Votre commande", ja: "ご注文" },
  subtotal: { en: "Subtotal", es: "Subtotal", de: "Zwischensumme", fr: "Sous-total", ja: "小計" },
  tax: { en: "Tax", es: "Impuesto", de: "Steuer", fr: "Taxe", ja: "税金" },
  deliveryFee: { en: "Delivery Fee", es: "Costo de entrega", de: "Liefergebühr", fr: "Frais de livraison", ja: "配達料" },
  total: { en: "Total", es: "Total", de: "Gesamt", fr: "Total", ja: "合計" },
  placeOrder: { en: "Place Order", es: "Realizar Pedido", de: "Bestellung aufgeben", fr: "Passer la commande", ja: "注文する" },
  termsText: { en: "By placing your order, you agree to OmniPizza's", es: "Al realizar tu pedido, aceptas los", de: "Mit deiner Bestellung stimmst du den", fr: "En passant commande, vous acceptez les", ja: "注文することで、OmniPizzaの" },
  terms: { en: "Terms of Service", es: "Términos de Servicio", de: "Nutzungsbedingungen", fr: "Conditions d'utilisation", ja: "利用規約" },
  privacy: { en: "Privacy Policy", es: "Política de Privacidad", de: "Datenschutzrichtlinien", fr: "Politique de confidentialité", ja: "プライバシーポリシー" },
  free: { en: "Free", es: "Gratis", de: "Gratis", fr: "Gratuit", ja: "無料" },
  processing: { en: "Processing...", es: "Procesando...", de: "Verarbeitung...", fr: "Traitement...", ja: "処理中..." },
  creditCard: { en: "Credit Card", es: "Tarjeta de Crédito", de: "Kreditkarte", fr: "Carte de Crédit", ja: "クレジットカード" },
  creditCardDesc: { en: "VISA, Mastercard, AMEX", es: "VISA, Mastercard, AMEX", de: "VISA, Mastercard, AMEX", fr: "VISA, Mastercard, AMEX", ja: "VISA, Mastercard, AMEX" },
  cash: { en: "Cash", es: "Efectivo", de: "Barzahlung", fr: "Espèces", ja: "現金" },
  cashDesc: { en: "Pay on Delivery", es: "Pagar al recibir", de: "Zahlung bei Lieferung", fr: "Payer à la livraison", ja: "代金引換" },
  cardNumber: { en: "Card Number", es: "Número de Tarjeta", de: "Kartennummer", fr: "Numéro de carte", ja: "カード番号" },
  cardExpiry: { en: "Expiry Date", es: "Fecha de Expiración", de: "Ablaufdatum", fr: "Date d'expiration", ja: "有効期限" },
  cardCvv: { en: "CVV", es: "CVV", de: "CVV", fr: "CVV", ja: "CVV" },
  cardHolder: { en: "Cardholder Name", es: "Nombre del Titular", de: "Karteninhaber", fr: "Nom du titulaire", ja: "カード名義人" },
  streetPlaceholder: { en: "Street & House Number", es: "Calle y Número", de: "Straße & Hausnummer", fr: "Rue et Numéro", ja: "住所" },
  coloniaPlaceholder: { en: "Colonia / Neighborhood", es: "Colonia", de: "Stadtteil", fr: "Quartier", ja: "地区" },
  zipPlaceholder: { en: "Zip Code", es: "Código Postal", de: "Postleitzahl", fr: "Code Postal", ja: "郵便番号" },
  plzPlaceholder: { en: "PLZ / Postal Code", es: "Código Postal", de: "PLZ", fr: "Code Postal", ja: "郵便番号" },
  prefecturaPlaceholder: { en: "Prefecture", es: "Prefectura", de: "Präfektur", fr: "Préfecture", ja: "都道府県" },
  invalidPhone: { en: "Enter a valid phone number (7-15 digits)", es: "Ingrese un teléfono válido (7-15 dígitos)", de: "Geben Sie eine gültige Telefonnummer ein (7-15 Ziffern)", fr: "Entrez un numéro valide (7-15 chiffres)", ja: "有効な電話番号を入力してください（7〜15桁）" },
  fullName: { en: "Full Name", es: "Nombre completo", de: "Vollständiger Name", fr: "Nom complet", ja: "氏名" },
  phone: { en: "Phone Number", es: "Teléfono", de: "Telefonnummer", fr: "Numéro de téléphone", ja: "電話番号" },
  edit: { en: "Edit", es: "Editar", de: "Bearbeiten", fr: "Modifier", ja: "編集" },
  remove: { en: "Remove", es: "Eliminar", de: "Entfernen", fr: "Supprimer", ja: "削除" },
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
  }
};

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
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    card_holder: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("card");
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-white font-sans mb-8">{tOpt(UI_TEXT.checkout, language)}</h1>
      <div className="text-gray-400 mb-8 -mt-6">{tOpt(UI_TEXT.completeDetails, language)}</div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Section 1: Delivery Address */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">1</div>
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">{tOpt(UI_TEXT.deliveryAddress, language)}</h2>
            </div>
            
            <form id="checkout-form" onSubmit={onSubmit} className="space-y-6 pl-12">
              <div className="grid gap-6">
                <div>
                  <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.streetPlaceholder, language)}</label>
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
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.coloniaPlaceholder, language)}</label>
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
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.zipPlaceholder, language)}</label>
                      <input
                        data-testid="zip-code"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="90210"
                        value={form.zip_code}
                        onChange={(e) => setForm((p) => ({ ...p, zip_code: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  {countryCode === "CH" && (
                    <div>
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.plzPlaceholder, language)}</label>
                      <input
                        data-testid="plz"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="8001"
                        value={form.plz}
                        onChange={(e) => setForm((p) => ({ ...p, plz: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  {countryCode === "JP" && (
                    <div>
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.prefecturaPlaceholder, language)}</label>
                      <input
                        data-testid="prefectura"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder={tOpt({en:"Tokyo", es:"Tokio", de:"Tokio", fr:"Tokyo", ja:"東京都"}, language)}
                        value={form.prefectura}
                        onChange={(e) => setForm((p) => ({ ...p, prefectura: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

               {/* Section 2: Contact Info */}
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6 -ml-12">
                  <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">2</div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">{tOpt(UI_TEXT.contactInfo, language)}</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.fullName, language)}</label>
                     <input
                      className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                      placeholder="Julian Casablancas"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.phone, language)}</label>
                     <input
                      type="tel"
                      data-testid="phone"
                      className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                      placeholder="+52 55 1234 5678"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      pattern="[\d\s\+\-\(\)]{7,20}"
                      title={tOpt(UI_TEXT.invalidPhone, language)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Method */}
              <div className="pt-8">
                <div className="flex items-center gap-4 mb-6 -ml-12">
                  <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-white font-bold text-sm">3</div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">{tOpt(UI_TEXT.paymentMethod, language)}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    data-testid="payment-card"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${paymentMethod === "card" ? "border-[#FF5722] bg-[#1a1a1a]" : "border-[#333] bg-[#0F0F0F] opacity-60 hover:opacity-100 hover:border-gray-600"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "card" ? "bg-[#2A2A2A] text-[#FF5722]" : "bg-[#1A1A1A] text-gray-400"}`}>
                       <Icons.CreditCard />
                    </div>
                    <div className="text-left">
                       <div className="text-white font-bold text-left">{tOpt(UI_TEXT.creditCard, language)}</div>
                       <div className="text-xs text-gray-500 uppercase text-left">{tOpt(UI_TEXT.creditCardDesc, language)}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="payment-cash"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${paymentMethod === "cash" ? "border-[#FF5722] bg-[#1a1a1a]" : "border-[#333] bg-[#0F0F0F] opacity-60 hover:opacity-100 hover:border-gray-600"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "cash" ? "bg-[#2A2A2A] text-[#FF5722]" : "bg-[#1A1A1A] text-gray-400"}`}>
                       <Icons.Cash />
                    </div>
                    <div className="text-left">
                       <div className="text-white font-bold text-left">{tOpt(UI_TEXT.cash, language)}</div>
                       <div className="text-xs text-gray-500 uppercase text-left">{tOpt(UI_TEXT.cashDesc, language)}</div>
                    </div>
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div className="grid gap-6 mt-6">
                    <div>
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.cardHolder, language)}</label>
                      <input
                        data-testid="card-holder"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="Julian Casablancas"
                        value={form.card_holder}
                        onChange={(e) => setForm((p) => ({ ...p, card_holder: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.cardNumber, language)}</label>
                      <input
                        data-testid="card-number"
                        className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                        placeholder="4242 4242 4242 4242"
                        value={form.card_number}
                        onChange={(e) => setForm((p) => ({ ...p, card_number: e.target.value }))}
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.cardExpiry, language)}</label>
                        <input
                          data-testid="card-expiry"
                          className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                          placeholder="MM/YY"
                          value={form.card_expiry}
                          onChange={(e) => setForm((p) => ({ ...p, card_expiry: e.target.value }))}
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs font-bold mb-2 uppercase">{tOpt(UI_TEXT.cardCvv, language)}</label>
                        <input
                          data-testid="card-cvv"
                          className="w-full px-4 py-4 rounded-xl bg-[#1F1F1F] border border-[#333] text-white focus:outline-none focus:border-[#FF5722] transition-colors"
                          placeholder="123"
                          value={form.card_cvv}
                          onChange={(e) => setForm((p) => ({ ...p, card_cvv: e.target.value }))}
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#121212] rounded-3xl p-8 border border-[#1F1F1F] sticky top-8">
             <h2 className="text-2xl font-black text-white mb-8">{tOpt(UI_TEXT.orderSummary, language)}</h2>
             
             <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((it) => (
                  <div key={it.id} className="flex gap-4 items-start relative group">
                     {/* Using generic pizza image for now, can be dynamic later */}
                     <div className="w-12 h-12 rounded-full bg-[#1F1F1F] flex-shrink-0 overflow-hidden">
                       <img src={it.pizza.image || "https://omnipizza.onrender.com/static/images/pizza-1.png"} alt={it.pizza.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                        <div className="text-white font-bold text-sm">{it.pizza.name}</div>
                        <div className="text-gray-500 text-xs">
                          {it.quantity}x • {tOpt(SIZE_OPTIONS.find(s => s.id === (it.config?.size || "small"))?.label, language)}
                        </div>
                        <div className="flex gap-3 mt-1.5">
                            <button 
                                onClick={() => { setEditing(it); setEditOpen(true); }}
                                className="text-[10px] font-bold text-gray-500 hover:text-[#FF5722] uppercase tracking-wider transition-colors"
                            >
                                {tOpt(UI_TEXT.edit, language)}
                            </button>
                            <button 
                                onClick={() => removeItem(it.id)}
                                className="text-[10px] font-bold text-gray-500 hover:text-red-500 uppercase tracking-wider transition-colors"
                            >
                                {tOpt(UI_TEXT.remove, language)}
                            </button>
                        </div>
                     </div>
                     <div className="text-white font-bold text-sm">
                        {formatMoney(it.unit_price * it.quantity, it.currency, locale, it.currency_symbol)}
                     </div>
                  </div>
                ))}
             </div>

             <div className="border-t border-[#1F1F1F] pt-4 space-y-3 mb-8">
                 <div className="flex justify-between text-gray-400 text-sm">
                    <span>{tOpt(UI_TEXT.subtotal, language)}</span>
                    <span>{formatMoney(subtotal, currency, locale, symbol)}</span>
                 </div>
                 <div className="flex justify-between text-gray-400 text-sm">
                    <span>{tOpt(UI_TEXT.tax, language)} (8%)</span>
                    <span>$4.12</span>
                 </div>
                 <div className="flex justify-between text-[#FF5722] text-sm font-bold">
                    <span>{tOpt(UI_TEXT.deliveryFee, language)}</span>
                    <span>{tOpt(UI_TEXT.free, language)}</span>
                 </div>
             </div>

             <div className="flex justify-between items-end mb-8">
                 <div className="text-xl text-white font-black">{tOpt(UI_TEXT.total, language)}</div>
                 <div className="text-2xl text-white font-black">
                   {formatMoney(subtotal, currency, locale, symbol)} 
                 </div>
             </div>

             <button 
                onClick={() => document.getElementById("checkout-form").requestSubmit()}
                disabled={loading}
                className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF5722]/20"
             >
                {loading ? tOpt(UI_TEXT.processing, language) : (
                  <>
                    {tOpt(UI_TEXT.placeOrder, language)}
                    <Icons.ArrowForward />
                  </>
                )}
             </button>

             <p className="text-center text-xs text-gray-600 mt-6 leading-relaxed">
                {tOpt(UI_TEXT.termsText, language)} 
                {" "}
                <a href="#" className="underline hover:text-gray-500">{tOpt(UI_TEXT.terms, language)}</a> 
                {" "}
                {tOpt(UI_TEXT.and, language)} 
                {" "}
                <a href="#" className="underline hover:text-gray-500">{tOpt(UI_TEXT.privacy, language)}</a>.
             </p>
          </div>
        </div>
      </div>

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
