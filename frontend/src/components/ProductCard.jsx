import React from 'react';
import { UI_STRINGS } from "../constants/pizza"; // Keep localized strings logic if needed, or pass prop

export default function ProductCard({ pizza, onAdd, formatPrice, t }) {
  return (
    <div className="bg-[#1E1E1E] rounded-[2rem] p-4 border border-[#2A2A2A] hover:border-[#FF5722]/50 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
       {/* Badge (optional - e.g. Bestseller) */}
       {pizza.type === 'meat' && (
         <div className="absolute top-4 right-4 bg-[#FF5722] text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 uppercase tracking-wide">
           Bestseller
         </div>
       )}
       {pizza.type === 'veggie' && (
         <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 uppercase tracking-wide">
           Veggie
         </div>
       )}

       {/* Image Area */}
       <div className="mt-4 mb-2 flex justify-center relative">
          <div className="w-48 h-48 rounded-full shadow-2xl overflow-hidden border-4 border-[#252525] group-hover:scale-105 transition-transform duration-300">
             <img 
               src={pizza.image} 
               alt={pizza.name} 
               className="w-full h-full object-cover"
               onError={(e) => {e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Pizza_on_stone.jpg'}}
             />
          </div>
       </div>

       {/* Checkered pattern overlay at bottom (optional flair) */}
       
       <div className="flex-1 flex flex-col items-center text-center mt-2 px-2">
          <h3 className="text-xl font-extrabold text-white mb-1 group-hover:text-[#FF5722] transition-colors line-clamp-1">{pizza.name}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{pizza.description}</p>
          
          <div className="mt-auto w-full flex items-center justify-between">
             <span className="text-xl font-black text-[#FF5722]">
                {formatPrice(pizza.price, pizza.currency)}
             </span>
             
             <button 
               onClick={() => onAdd(pizza)}
               className="w-10 h-10 rounded-full bg-[#FF5722] text-white flex items-center justify-center hover:bg-[#E64A19] hover:scale-110 transition-all shadow-lg shadow-[#FF5722]/30"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
             </button>
          </div>
       </div>
    </div>
  );
}
