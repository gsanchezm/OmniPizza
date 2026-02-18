import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useCartStore, useCountryStore } from "../store";
import { UI_STRINGS } from "../constants/pizza";
import PizzaCustomizerModal from "../components/PizzaCustomizerModal";
import { useT } from "../i18n";
import { usePizzas } from "../hooks/usePizzas";
import CategoryFilter from "../components/CategoryFilter";
import CartSidebar from "../components/CartSidebar";
import ProductCard from "../components/ProductCard";

const MARKET_OPTIONS = [
  { code: "US", label: "US - English", flag: "🇺🇸" },
  { code: "MX", label: "MX - Spanish", flag: "🇲🇽" },
  { code: "CH", label: "CH - German", flag: "🇨🇭" },
  { code: "JP", label: "JP - Japanese", flag: "🇯🇵" },
];

function formatMoney(value, currency, locale, symbol) {
  try {
    const maxFrac = currency === "JPY" ? 0 : 2;
    return new Intl.NumberFormat(locale || "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: maxFrac,
    }).format(Number(value));
  } catch {
    return `${symbol || "$"}${value}`;
  }
}

export default function Catalog() {
  const t = useT();
  const navigate = useNavigate();

  const username = useAuthStore((s) => s.username);
  const countryCode = useCountryStore((s) => s.countryCode);
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  const language = useCountryStore((s) => s.language);
  const locale = useCountryStore((s) => s.locale);

  const addConfiguredItem = useCartStore((s) => s.addConfiguredItem);
  const cartItems = useCartStore((s) => s.items);
  const updateCartItem = useCartStore((s) => s.updateCartItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQty = useCartStore((s) => s.setQty);


  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { pizzas, loading, error } = usePizzas(countryCode, language);

  // --- Handlers ---
  const handleOpenModal = (pizza) => {
    setSelectedPizza(pizza);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPizza(null);
  };

  const handleConfirm = (config) => {
    if (!selectedPizza) return; 
    addConfiguredItem(selectedPizza, config);
    handleCloseModal();
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  // --- Filtering ---
  const filteredPizzas = useMemo(() => {
    if (!pizzas) return [];
    return pizzas.filter(p => {
       const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
       // Simulate category filtering based on keywords in name/desc/id since API doesn't return category
       let matchesCategory = true;
       if (selectedCategory === 'veggie') matchesCategory = p.name.toLowerCase().includes('veggie') || p.description.toLowerCase().includes('vegetab');
       if (selectedCategory === 'meat') matchesCategory = p.name.toLowerCase().includes('meat') || p.name.toLowerCase().includes('pepperoni');
       // 'popular' could just show all or random subset
       
       return matchesSearch && matchesCategory;
    });
  }, [pizzas, searchQuery, selectedCategory]);


  // --- Render ---
  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">Loading Menu...</div>;
  if (error) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pt-24 pb-12">
       <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             
             {/* Left: Main Content (Catalog) */}
             <div className="lg:col-span-3 space-y-8">
                
                {/* Header Section */}
                <div className="bg-[#FF5722] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-[#FF5722]/20">
                   {/* Background Pattern/Gradient */}
                   <div className="absolute inset-0 bg-gradient-to-r from-[#E64A19] to-[#FF5722]"></div>
                   <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                   
                   <div className="relative z-10 flex flex-col md:flex-row justify-center items-center gap-6 py-8">
                      {/* Search Bar Only - as requested */}
                      <div className="w-full max-w-2xl relative">
                         <input 
                           type="text" 
                           placeholder={t('searchPlaceholder')} 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 pl-12 text-white placeholder-white/60 focus:outline-none focus:bg-white/20 transition-all font-medium text-lg shadow-lg"
                         />
                         <svg className="w-6 h-6 text-white/60 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                         </svg>
                      </div>
                   </div>
                </div>

                {/* Categories */}
                <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

                {/* Grid */}
                {filteredPizzas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPizzas.map(pizza => (
                       <ProductCard 
                         key={pizza.id} 
                         pizza={pizza} 
                         onAdd={handleOpenModal}
                         formatPrice={(val, curr) => formatMoney(val, curr, locale, pizza.currency_symbol)}
                       />
                    ))}
                  </div>
                ) : (
                   <div className="text-center py-20 bg-[#1E1E1E] rounded-3xl border border-[#2A2A2A]">
                      <p className="text-gray-500 font-bold">No pizzas found matching your criteria.</p>
                      <button onClick={() => {setSearchQuery(''); setSelectedCategory('all');}} className="mt-4 text-[#FF5722] hover:underline font-bold">Clear Filters</button>
                   </div>
                )}
             </div>

             {/* Right: Sidebar (Cart) */}
             <div className="lg:col-span-1 hidden lg:block">
                <CartSidebar 
                  cartItems={cartItems} 
                  onCheckout={handleCheckout} 
                  onRemove={removeItem}
                  onUpdateQty={setQty}
                />
             </div>

          </div>
       </div>

       <PizzaCustomizerModal
        key={selectedPizza?.id || "none"}
        open={modalOpen && !!selectedPizza}
        pizza={selectedPizza}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

