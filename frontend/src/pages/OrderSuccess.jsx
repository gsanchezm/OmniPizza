import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store';
import { useT } from '../i18n';
import { formatMoney } from '../utils/money';

export default function OrderSuccess() {
  const t = useT();
  const navigate = useNavigate();
  const order = useOrderStore((s) => s.lastOrder);

  // Fake courier data
  const courier = {
      name: "Carlos R.",
      rating: "4.9",
      vehicle: "driving", // mapped to translation
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
       {/* Map Section - Static Image */}
       <div className="relative h-64 md:h-80 w-full overflow-hidden">
           <div className="absolute inset-0 bg-gray-800">
               {/* Placeholder for map - using a dark map style image if available, or just a placeholder pattern */}
               <img 
                 src="/images/ui/map_background.png" 
                 alt="Map"
                 className="w-full h-full object-cover opacity-80"
                 onError={(e) => {
                     e.target.onerror = null;
                     e.target.style.display = 'none';
                     e.target.parentNode.style.backgroundColor = '#1a1a1a';
                 }}
               />
               
               {/* Map overlays like path or pointers could be CSS drawn, but for now we keep it simple static as requested */}
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                   <div className="relative">
                       <div className="w-16 h-16 bg-[#FF5722]/20 rounded-full animate-ping absolute inset-0"></div>
                       <div className="w-16 h-16 bg-[#FF5722]/40 rounded-full flex items-center justify-center relative z-10">
                           <span className="text-2xl">🍕</span>
                       </div>
                   </div>
               </div>
           </div>
           
           <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-[#1A1A1A] border border-[#333] px-6 py-2 rounded-full shadow-xl">
               <span className="text-[#FF5722] font-black tracking-widest text-xs uppercase animate-pulse">● {t('liveTracking')}</span>
           </div>

           <button 
             onClick={() => navigate('/catalog')}
             className="absolute top-6 left-6 w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-[#333] text-white hover:bg-[#333]"
           >
               ←
           </button>
       </div>

       {/* Status Card */}
       <div className="relative -mt-10 px-4 max-w-2xl mx-auto pb-20">
           <div className="bg-[#161616] rounded-3xl p-6 md:p-10 border border-[#1F1F1F] shadow-2xl">
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                   <div>
                       <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                           {t('outForDelivery')}
                       </h1>
                       <p className="text-gray-500 font-medium">
                           {t('expectedArrival')}: 8:45 PM
                       </p>
                   </div>
                   <div className="mt-4 md:mt-0 text-right">
                       <div className="text-5xl md:text-6xl font-black text-[#FF5722] italic tracking-tighter">
                           15-20
                       </div>
                       <div className="text-gray-500 font-black tracking-widest text-sm uppercase mr-1">
                           {t('min')}
                       </div>
                   </div>
               </div>

               {/* Courier Info */}
               <div className="bg-[#1F1F1F] rounded-2xl p-4 md:p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                       <div className="relative">
                           <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#2A2A2A] border border-[#333]">
                               <img src={courier.image} alt={courier.name} className="w-full h-full object-cover" />
                           </div>
                           <div className="absolute -bottom-2 -right-2 bg-[#FF5722] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1F1F1F] flex items-center gap-0.5">
                               <span>★</span> {courier.rating}
                           </div>
                       </div>
                       <div>
                           <div className="text-xs text-gray-500 font-bold tracking-wider uppercase mb-0.5">{t('yourCourier')}</div>
                           <div className="text-white font-bold text-lg">{courier.name}</div>
                           <div className="text-gray-400 text-xs">{t(courier.vehicle)}</div>
                       </div>
                   </div>
                   
                   <div className="flex gap-3">
                       <button className="w-10 h-10 md:w-12 md:h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center hover:bg-[#333] transition-colors">
                           <img src="/images/ui/icon_chat.png" alt="Chat" className="w-5 h-5 object-contain" />
                       </button>
                       <button className="w-10 h-10 md:w-12 md:h-12 bg-[#FF5722] rounded-full flex items-center justify-center hover:bg-[#E64A19] transition-colors shadow-lg shadow-[#FF5722]/20">
                           <img src="/images/ui/icon_phone.png" alt="Call" className="w-5 h-5 object-contain invert brightness-0" />
                       </button>
                   </div>
               </div>
               
               {/* Order Details Accordion (Simplified) */}
               {order && (
                   <div className="mt-8 border-t border-[#2A2A2A] pt-6">
                       <div className="flex justify-between items-center mb-4">
                           <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase">{t('orderDetails')}</h3>
                           <span className="text-white font-mono text-sm">#{order.order_id}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-[#FF5722] font-black text-xl">{formatMoney(order.total)}</span>
                           <button className="text-gray-400 text-xs font-bold hover:text-white underline decoration-gray-600 underline-offset-4">
                               {t('viewOrderDetails')}
                           </button>
                       </div>
                   </div>
               )}

           </div>
       </div>
    </div>
  );
}
