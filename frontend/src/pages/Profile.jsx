import React from 'react';
import { useProfileStore } from '../store';
import { useT } from '../i18n';

export default function Profile() {
  const t = useT();
  const { fullName, address, phone, notes, setProfile } = useProfileStore();

  const handleSave = () => {
    // In a real app this would save to backend
    alert(t('profileSaved'));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Page Header */}
      <h1 className="text-4xl font-black text-white font-sans mb-2">
        {t('profile')}
      </h1>
      <p className="text-gray-400 mb-8">
        {t('managePreferences') || "Manage your premium pizza dining preferences"}
      </p>

      {/* Profile Header Card */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-2xl relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5722] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#2A2A2A] overflow-hidden relative z-10">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander" 
              alt="Profile" 
              className="w-full h-full object-cover bg-[#1F1F1F]"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF5722] rounded-full border-4 border-[#121212] flex items-center justify-center z-20">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
          </div>
        </div>
        
        <div className="text-center sm:text-left flex-1 z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
             <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
               {fullName || "Alexander Sterling"}
             </h2>
             <span className="bg-[#2A1810] text-[#FF5722] text-xs font-bold px-3 py-1 rounded-full border border-[#FF5722]/30 uppercase tracking-wider">
               {t('premiumMember') || "PREMIUM MEMBER"}
             </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-500 text-sm font-medium">
             <div className="flex items-center gap-1.5">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               <span>{t('joined') || "Joined"} March 2023</span>
             </div>
          </div>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#1F1F1F] flex items-center gap-3 bg-[#161616]">
          <svg className="w-5 h-5 text-[#FF5722]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <h3 className="text-lg font-bold text-white">
            {t('personalInformation') || "Personal Information"}
          </h3>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
           <div className="grid sm:grid-cols-2 gap-6">
             <div>
               <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                 {t('fullName')}
               </label>
               <input 
                 className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-all font-medium"
                 value={fullName} 
                 onChange={(e)=>setProfile({fullName:e.target.value})}
               />
             </div>
             <div>
               <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                 {t('phone') || "Phone Number"}
               </label>
               <input 
                 className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-all font-medium"
                 value={phone} 
                 onChange={(e)=>setProfile({phone:e.target.value})}
               />
             </div>
           </div>

           <div>
             <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
               {t('address') || "Delivery Address"}
             </label>
             <input 
               className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-all font-medium"
               value={address} 
               onChange={(e)=>setProfile({address:e.target.value})}
             />
           </div>

           <div>
             <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
               {t('deliveryNotes') || "Delivery Notes"}
             </label>
             <textarea 
               className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition-all font-medium resize-none"
               rows="3"
               value={notes} 
               onChange={(e)=>setProfile({notes:e.target.value})}
             />
           </div>
        </div>

        <div className="px-6 py-5 bg-[#161616] border-t border-[#1F1F1F] flex flex-col sm:flex-row items-center justify-between gap-4">
           <button className="text-gray-500 text-sm font-bold hover:text-red-500 transition-colors flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             {t('deleteAccount') || "Delete Account"}
           </button>
           
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none py-3 px-6 rounded-xl border border-[#333] text-white font-bold text-sm hover:bg-[#222] transition-colors">
               {t('cancel') || "CANCEL"}
             </button>
             <button 
               onClick={handleSave}
               className="flex-1 sm:flex-none py-3 px-6 rounded-xl bg-[#FF5722] text-white font-bold text-sm hover:bg-[#E64A19] transition-colors shadow-lg shadow-[#FF5722]/20"
             >
               {t('saveChanges') || "SAVE CHANGES"}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
