import React from 'react';
import PrimaryButton from './PrimaryButton';
import { useT } from '../i18n';
import { useCountryStore } from '../store';
import { SIZE_OPTIONS } from '../constants/pizza';

export default function CartSidebar({ cartItems, onCheckout, onRemove, onUpdateQty }) {
  const t = useT();
  const language = useCountryStore((s) => s.language) || 'en';
  const locale = useCountryStore((s) => s.locale) || 'en-US';
  const marketCurrency = useCountryStore((s) => s.currency) || 'USD';
  const cartCurrency = cartItems[0]?.currency || marketCurrency;
  const cartSymbol = cartItems[0]?.currency_symbol || '';
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const deliveryFee = 2.50;
  const total = subtotal + deliveryFee;

  const format = (val) => {
    const amount = Number(val) || 0;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: cartCurrency,
        maximumFractionDigits: cartCurrency === 'JPY' ? 0 : 2,
      }).format(amount);
    } catch {
      const fractionDigits = cartCurrency === 'JPY' ? 0 : 2;
      return `${cartSymbol}${amount.toFixed(fractionDigits)}`;
    }
  };

  const getSizeLabel = (sizeId) => {
    const option = SIZE_OPTIONS.find((s) => s.id === sizeId);
    return option?.label?.[language] || option?.label?.en || sizeId;
  };

  if (cartItems.length === 0) {
     return (
        <div className="bg-[#1E1E1E] rounded-3xl p-6 border border-[#2A2A2A] sticky top-24">
           <h2 className="text-xl font-extrabold text-white mb-4">{t('yourOrder')}</h2>
           <div className="text-center py-10 text-gray-500">
              <div className="mb-2 text-4xl">🛒</div>
              <p>{t('cartEmpty')}</p>
              <p className="text-sm">{t('addSomePizzas')}</p>
           </div>
        </div>
     )
  }

  return (
    <div className="bg-[#1E1E1E] rounded-3xl p-6 border border-[#2A2A2A] sticky top-24 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-extrabold text-white">{t('yourOrder')}</h2>
        <span className="bg-[#FF5722]/20 text-[#FF5722] text-xs font-bold px-3 py-1 rounded-full">
          {cartItems.length} {t(cartItems.length === 1 ? 'item' : 'items')}
        </span>
      </div>

      {/* Scrollable Items List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 items-start group">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0F0F0F] shrink-0 border border-[#2A2A2A]">
               <img 
                 src={item.pizza.image} 
                 alt={item.pizza.name} 
                 className="w-full h-full object-cover"
                 onError={(e) => {e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg'}}
               />
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="font-bold text-white text-sm truncate">{item.pizza.name}</h3>
               <p className="text-xs text-gray-500 truncate">
                 {getSizeLabel(item.config?.size || 'small')} | {item.config?.toppings?.length || 0} {t('toppings')}
               </p>
               
               <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 bg-[#0F0F0F] rounded-lg px-2 py-1 border border-[#2A2A2A]">
                     <button 
                       onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                       className="text-gray-400 hover:text-white px-1"
                     >−</button>
                     <span className="text-xs font-bold text-white w-3 text-center">{item.quantity}</span>
                     <button 
                       onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                       className="text-gray-400 hover:text-white px-1"
                     >+</button>
                  </div>
                  <span className="font-bold text-white text-sm">{format(item.unit_price * item.quantity)}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-[#2A2A2A] pt-4 space-y-3">
         <div className="flex justify-between text-sm text-gray-400">
            <span>{t('subtotal')}</span>
            <span>{format(subtotal)}</span>
         </div>
         <div className="flex justify-between text-sm text-gray-400">
            <span>{t('deliveryFee')}</span>
            <span>{format(deliveryFee)}</span>
         </div>
         <div className="flex justify-between text-lg font-extrabold text-white pt-2">
            <span>{t('total')}</span>
            <span>{format(total)}</span>
         </div>
         
         <div className="pt-4">
             <PrimaryButton fullWidth onClick={onCheckout}>
                {t('checkoutNow')} <span className="ml-2">→</span>
             </PrimaryButton>
         </div>
      </div>
    </div>
  );
}
