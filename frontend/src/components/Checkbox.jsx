import React from 'react';

export default function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`
          w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center
          ${checked 
            ? 'bg-brand-primary border-brand-primary' 
            : 'bg-[#1F1F1F] border-[#2A2A2A] group-hover:border-gray-500'}
        `}>
          {checked && (
            <svg 
              className="w-3.5 h-3.5 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
