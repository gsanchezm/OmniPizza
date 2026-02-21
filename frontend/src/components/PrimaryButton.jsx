import React from 'react';

export default function PrimaryButton({ children, onClick, type = "button", disabled, fullWidth = false, "data-testid": dataTestId }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className={`
        ${fullWidth ? 'w-full' : ''}
        bg-brand-primary hover:bg-brand-hover 
        text-white font-bold 
        py-3.5 px-6 
        rounded-xl 
        transition-all duration-200 
        transform active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        shadow-lg shadow-brand-primary/20
      `}
    >
      {children}
    </button>
  );
}
