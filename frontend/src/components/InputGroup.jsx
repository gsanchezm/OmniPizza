import React from 'react';

export default function InputGroup({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon,
  error,
  rightElement,
  "data-testid": dataTestId
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-brand-primary transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid={dataTestId}
          className={`
            w-full bg-[#1F1F1F] text-white rounded-xl py-3.5 
            ${icon ? 'pl-11' : 'pl-4'} 
            ${rightElement ? 'pr-12' : 'pr-4'}
            border border-[#2A2A2A] 
            placeholder-gray-600 
            focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary
            transition-all duration-200
            font-medium
          `}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
