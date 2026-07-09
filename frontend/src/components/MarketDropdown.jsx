import React, { useState, useRef, useEffect } from "react";
import { useCountryStore } from "../store";
import Flag from "./Flag";

/**
 * MarketDropdown — a custom accessible dropdown (button + listbox) for switching
 * the active market post-login. It is both a real feature (the market selector)
 * and an automation demo surface: a non-native dropdown with a trigger, an
 * expandable listbox, keyboard support, and option elements.
 *
 * Market list is defined here; new markets (e.g. Saudi Arabia) are added to
 * MARKETS. `data-testid`: `market-dropdown-trigger`, `market-dropdown-menu`,
 * `market-option-{code}`.
 */
const MARKETS = [
  { code: "US", label: "United States" },
  { code: "MX", label: "México" },
  { code: "CH", label: "Schweiz" },
  { code: "JP", label: "日本" },
  { code: "SA", label: "السعودية" },
];

export default function MarketDropdown() {
  const countryCode = useCountryStore((s) => s.countryCode);
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = MARKETS.find((m) => m.code === countryCode) || MARKETS[0];

  const choose = (code) => {
    setCountryCode(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="market-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface-2 font-extrabold text-text"
      >
        <Flag code={current.code} size={22} />
        <span>{current.code}</span>
        <span className="text-text-muted text-xs" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          data-testid="market-dropdown-menu"
          aria-label="Select market"
          className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-[#1A1A1A] shadow-2xl overflow-hidden z-50"
        >
          {MARKETS.map((m) => (
            <li key={m.code} role="option" aria-selected={m.code === countryCode}>
              <button
                type="button"
                data-testid={`market-option-${m.code}`}
                onClick={() => choose(m.code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#252525] transition-colors ${
                  m.code === countryCode ? "text-brand-primary" : "text-text"
                }`}
              >
                <Flag code={m.code} size={22} />
                <span className="font-semibold">{m.code}</span>
                <span className="text-text-muted text-xs ml-auto">{m.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
