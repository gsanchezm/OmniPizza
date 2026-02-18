import React, { useEffect, useMemo, useRef, useState } from "react";
import { SIZE_OPTIONS, TOPPING_GROUPS, UI_STRINGS } from "../constants/pizza";
import { computeUnitPrice, getRateFromPizza } from "../utils/pizzaPricing";
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

function normalizeUnitPrice(result) {
  if (typeof result === "number") return result;
  if (result && typeof result === "object") {
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

function formatMoneyInt(value, currency, locale, symbol) {
  try {
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0, 
    }).format(Number(value));
  } catch {
    return `${symbol || ""}${Math.round(Number(value) || 0)}`;
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
  }, [open, pizza?.id]);

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
      if (prev.length >= 10) return prev; 
      return [...prev, id];
    });
  };

  if (!open || !pizza) return null;

  const pizzaName = typeof pizza.name === "string" ? pizza.name : String(pizza.name ?? "");
  const currency = typeof pizza.currency === "string" ? pizza.currency : "USD";
  const currencySymbol =
    typeof pizza.currency_symbol === "string" ? pizza.currency_symbol : "";

  // Helper text for topping cost
  const toppingLocalInt = Math.round(getRateFromPizza(pizza) * 1);
  const toppingLocalText = formatMoneyInt(
    toppingLocalInt,
    pizza.currency,
    locale,
    pizza.currency_symbol
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-black/90">
      
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#121212] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-[#1F1F1F]">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                 ✕
             </button>
             <h2 className="text-white font-bold text-lg drop-shadow-md">
                 {t({en:"Customize Pizza", es:"Personalizar Pizza", de:"Pizza Anpassen", fr:"Personnaliser Pizza", ja:"ピザをカスタマイズ"}, language)}
             </h2>
             <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
                 ⓘ
             </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212]">
             
             {/* Pizza Image Area */}
             <div className="relative h-64 sm:h-72 w-full flex items-center justify-center bg-[#1a1a1a] overflow-hidden">
                 {/* Radial Gradient Background */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2A2A2A] to-[#121212]"></div>
                 
                 <img 
                   src={pizza.image || "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg"} 
                   alt={pizzaName}
                   onError={(e) => {
                     e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg";
                   }}
                   className="w-56 h-56 object-cover drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                 />
             </div>

             <div className="p-6 space-y-8">
                 
                 {/* Size Selector */}
                 <div>
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-white font-black text-xl">{t({en:"Choose Size", es:"Elige Tamaño", de:"Größe Wählen", fr:"Choisir Taille", ja:"サイズを選択"}, language)}</h3>
                         <span className="text-[#FF5722] text-xs font-bold uppercase bg-[#FF5722]/10 px-2 py-1 rounded">{t({en:"Required", es:"Requerido", de:"Erforderlich", fr:"Requis", ja:"必須"}, language)}</span>
                     </div>
                     <div className="flex bg-[#1F1F1F] p-1 rounded-full">
                         {SIZE_OPTIONS.map((opt) => {
                             const isSelected = size === opt.id;
                             return (
                                 <button
                                     key={opt.id}
                                     onClick={() => setSize(opt.id)}
                                     className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${isSelected ? 'bg-[#FF5722] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                 >
                                     {t(opt.label, language)}
                                 </button>
                             );
                         })}
                     </div>
                 </div>

                 {/* Toppings Selector */}
                 <div className="space-y-6">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-white font-black text-xl">{t({en:"Add Toppings", es:"Agregar Toppings", de:"Beläge Hinzufügen", fr:"Ajouter Garnitures", ja:"トッピング追加"}, language)}</h3>
                         <span className="text-gray-500 text-sm font-medium">+{toppingLocalText} {t({en:"each", es:"c/u", de:"pro stück", fr:"chacun", ja:"各"}, language)}</span>
                     </div>
                     
                     {TOPPING_GROUPS.map((group) => (
                       <div key={group.id}>
                         <h4 className="text-white/70 font-bold uppercase tracking-wider text-sm mb-3 pl-1">
                           {t(group.label, language)}
                         </h4>
                         <div className="grid grid-cols-3 gap-3">
                             {group.items.map((it) => {
                                 const isSelected = toppings.includes(it.id);
                                 return (
                                     <button
                                         key={it.id}
                                         onClick={() => toggleTopping(it.id)}
                                         disabled={!isSelected && toppings.length >= 10}
                                         className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all relative overflow-hidden ${isSelected ? 'border-[#FF5722] bg-[#FF5722]/10' : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-gray-600'} ${(!isSelected && toppings.length >= 10) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                     >
                                         <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center ${isSelected ? 'bg-[#FF5722]/20' : 'bg-[#2A2A2A]'} overflow-hidden`}>
                                             {it.image ? (
                                               <img src={it.image} alt={t(it.label, language)} className="w-full h-full object-cover" />
                                             ) : (
                                               <span className="text-xl">🧀</span> 
                                             )}
                                         </div>
                                         <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                             {t(it.label, language)}
                                         </span>
                                         
                                         {isSelected && (
                                             <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF5722] rounded-full flex items-center justify-center text-white text-[10px]">
                                                 ✓
                                             </div>
                                         )}
                                     </button>
                                 );
                             })}
                         </div>
                       </div>
                     ))}
                 </div>

                 {/* Spacer for bottom bar */}
                 <div className="h-24"></div>
             </div>
        </div>

        {/* Floating Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-[#121212] to-transparent pointer-events-none flex justify-center items-end h-32">
             <div className="w-full bg-[#1F1F1F] rounded-2xl p-4 flex items-center justify-between shadow-2xl border border-[#333] pointer-events-auto">
                 <div>
                     <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                         {t({en:"Estimated Total", es:"Total Estimado", de:"Geschätzter Gesamtbetrag", fr:"Total Estimé", ja:"推定合計"}, language)}
                     </div>
                     <div className="text-white text-2xl font-black">
                         {formatMoney(unitPrice, currency, locale, currencySymbol)}
                     </div>
                 </div>
                 
                 <button 
                     onClick={() => onConfirm({ size, toppings, unit_price: unitPrice })}
                     className="bg-[#FF5722] hover:bg-[#E64A19] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#FF5722]/20"
                 >
                     {t({en:"Add to Cart", es:"Agregar", de:"Hinzufügen", fr:"Ajouter", ja:"追加"}, language)}
                     <img src="/images/ui/shopping_bag.png" alt="Cart" className="w-5 h-5 object-contain" />
                 </button>
             </div>
        </div>

      </div>
    </div>
  );
}
