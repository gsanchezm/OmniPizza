import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrderStore } from '../store';
import { useT } from '../i18n';
import { formatMoney } from '../utils/money';
import { useResponsive } from '../hooks/useResponsive';
import { getCourierProfile } from '../features/orderSuccess/useCases/getCourierProfile';
import { orderService } from '../services/order.service';

export default function OrderSuccess() {
  const t = useT();
  const navigate = useNavigate();
  const { tid } = useResponsive();
  const order = useOrderStore((s) => s.lastOrder);
  const setLastOrder = useOrderStore((s) => s.setLastOrder);
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Atomic entry: ?orderId=... hydrates lastOrder from backend so tests can
  // jump straight to /order-success without going through the checkout UI.
  useEffect(() => {
    if (!orderIdParam || order?.order_id === orderIdParam) return;
    orderService.getOrder(orderIdParam)
      .then(({ data }) => setLastOrder(data))
      .catch(() => { /* render falls back to courier-only view */ });
  }, [orderIdParam, order?.order_id, setLastOrder]);

  const courier = getCourierProfile();

  return (
    <div data-testid="screen-order-success" className="min-h-screen bg-[#0F0F0F] text-white">
       {/* Map Section - Static Image */}
       <div className="relative h-64 md:h-80 w-full overflow-hidden">
           <div className="absolute inset-0 bg-gray-800">
               {/* Placeholder for map - using a dark map style image if available, or just a placeholder pattern */}
               <img 
                 src="/images/ui/map_background.png" 
                 alt="Map"
                 data-testid="img-map"
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
               <span data-testid="live-tracking-status" className="text-[#FF5722] font-black tracking-widest text-xs uppercase animate-pulse">● {t('liveTracking')}</span>
           </div>

           <button
             data-testid={tid("back-to-catalog")}
             onClick={() => navigate('/catalog')}
             aria-label={t('catalog')}
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
                       <h1 data-testid={tid("order-success-title")} className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                           {t('outForDelivery')}
                       </h1>
                        <p data-testid="expected-arrival" className="text-gray-500 font-medium">
                           {t('expectedArrival')}: 8:45 PM
                       </p>
                   </div>
                   <div className="mt-4 md:mt-0 text-right">
                       <div data-testid="delivery-time-min" className="text-5xl md:text-6xl font-black text-[#FF5722] italic tracking-tighter">
                           15-20
                       </div>
                       <div data-testid="delivery-time-label" className="text-gray-500 font-black tracking-widest text-sm uppercase mr-1">
                           {t('min')}
                       </div>
                   </div>
               </div>

               {/* Courier Info */}
               <div data-testid="courier-info" className="bg-[#1F1F1F] rounded-2xl p-4 md:p-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                       <div className="relative">
                           <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#2A2A2A] border border-[#333]">
                               <img data-testid="img-courier" src={courier.image} alt={courier.name} className="w-full h-full object-cover" />
                           </div>
                           <div data-testid="courier-rating" className="absolute -bottom-2 -right-2 bg-[#FF5722] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1F1F1F] flex items-center gap-0.5">
                               <span>★</span> {courier.rating}
                           </div>
                       </div>
                       <div>
                           <div data-testid="courier-role-label" className="text-xs text-gray-500 font-bold tracking-wider uppercase mb-0.5">{t('yourCourier')}</div>
                           <div data-testid="courier-name" className="text-white font-bold text-lg">{courier.name}</div>
                           <div data-testid="courier-vehicle" className="text-gray-400 text-xs">{t(courier.vehicle)}</div>
                       </div>
                   </div>
                   
                   <div className="flex gap-3">
                        <button data-testid={tid("courier-chat")} aria-label={`Chat with ${courier.name}`} className="w-10 h-10 md:w-12 md:h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center hover:bg-[#333] transition-colors">
                           <svg aria-hidden="true" data-testid="icon-chat" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                       </button>
                       <button data-testid={tid("courier-call")} aria-label={`Call ${courier.name}`} className="w-10 h-10 md:w-12 md:h-12 bg-[#FF5722] rounded-full flex items-center justify-center hover:bg-[#E64A19] transition-colors shadow-lg shadow-[#FF5722]/20">
                           <svg aria-hidden="true" data-testid="icon-phone" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                       </button>
                   </div>
               </div>
               
               {/* Order Details Accordion */}
               {order && (
                   <div className="mt-8 border-t border-[#2A2A2A] pt-6">
                        <div className="flex justify-between items-center mb-4">
                           <h3 data-testid="order-details-label" className="text-gray-500 text-xs font-bold tracking-widest uppercase">{t('orderDetails')}</h3>
                           <span data-testid="order-id" className="text-white font-mono text-sm">#{order.order_id}</span>
                       </div>
                       <div className="flex justify-between items-center">
                           <span data-testid="order-total" className="text-[#FF5722] font-black text-xl">{formatMoney(order.total)}</span>
                           <button
                               type="button"
                               data-testid="order-details-toggle"
                               aria-expanded={detailsOpen}
                               aria-controls="order-details-panel"
                               onClick={() => setDetailsOpen((v) => !v)}
                               className="text-gray-400 text-xs font-bold hover:text-white underline decoration-gray-600 underline-offset-4 flex items-center gap-1.5"
                           >
                               {t('viewOrderDetails')}
                               <span className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
                           </button>
                       </div>

                       {detailsOpen && (
                           <div id="order-details-panel" data-testid="order-details-panel" className="mt-4 rounded-xl bg-[#161616] border border-[#2A2A2A] divide-y divide-[#2A2A2A]">
                               {Array.isArray(order.items) && order.items.length > 0 ? (
                                   order.items.map((it, idx) => (
                                       <div key={it.id || it.pizza_id || idx} data-testid={`order-detail-item-${idx}`} className="flex justify-between items-center px-4 py-3">
                                           <span className="text-gray-300 text-sm font-medium">
                                               {(it.quantity || 1)}× {it.pizza?.name || it.name || t('pizza') || 'Pizza'}
                                           </span>
                                           <span className="text-white text-sm font-semibold">
                                               {formatMoney((it.unit_price ?? it.price ?? 0) * (it.quantity || 1))}
                                           </span>
                                       </div>
                                   ))
                               ) : (
                                   <div className="px-4 py-3 text-gray-400 text-sm" data-testid="order-detail-empty">
                                       {t('orderDetails')} · #{order.order_id}
                                   </div>
                               )}
                               <div className="flex justify-between items-center px-4 py-3">
                                   <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('total') || 'Total'}</span>
                                   <span data-testid="order-details-total" className="text-[#FF5722] font-black">{formatMoney(order.total)}</span>
                               </div>
                           </div>
                       )}
                   </div>
               )}

           </div>
       </div>
    </div>
  );
}
