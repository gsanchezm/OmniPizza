import React from 'react';

export default function SocialButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center justify-center gap-3 
        w-full 
        bg-[#1F1F1F] hover:bg-[#2A2A2A] 
        border border-[#2A2A2A] 
        text-white font-semibold 
        py-3 px-4 
        rounded-xl 
        transition-colors duration-200
      "
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
