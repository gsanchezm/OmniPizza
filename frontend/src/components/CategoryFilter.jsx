import React from 'react';
import { useT } from '../i18n';

const CATEGORIES = [
  { id: 'all', labelKey: 'allPizza' },
  { id: 'popular', labelKey: 'popular' },
  { id: 'veggie', labelKey: 'veggie' },
  { id: 'meat', labelKey: 'meat' },
  { id: 'sides', labelKey: 'sides' },
];

export default function CategoryFilter({ selected, onSelect }) {
  const t = useT();

  return (
    <div role="group" aria-label={t("categories")} className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          aria-pressed={selected === cat.id}
          data-testid={`category-${cat.id}`}
          onClick={() => onSelect(cat.id)}
          className={`
            whitespace-nowrap px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200
            ${selected === cat.id
              ? 'bg-[#FF5722] text-[#1E1E1E] shadow-lg shadow-[#FF5722]/20'
              : 'bg-[#1E1E1E] text-gray-400 hover:bg-[#2A2A2A] hover:text-white border border-[#2A2A2A]'}
          `}
        >
          {t(cat.labelKey)}
        </button>
      ))}
    </div>
  );
}
