import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  useAuthStore,
  useCountryStore,
  useCartStore,
  useOrderStore,
} from "../store";
import { useT } from "../i18n";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const COUNTRIES = [
  { code: "MX", label: "MX" },
  { code: "US", label: "US" },
  { code: "CH", label: "CH" },
  { code: "JP", label: "JP" },
];

export default function Navbar() {
  const t = useT();
  const navigate = useNavigate();

  const countryCode = useCountryStore((s) => s.countryCode || "MX");
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  const language = useCountryStore((s) => s.language);
  const setLanguage = useCountryStore((s) => s.setLanguage);

  const logoutFromStore = useAuthStore((s) => s.logout);
  const cartItems = useCartStore((s) => s.items || []);
  const lastOrder = useOrderStore((s) => s.lastOrder);

  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const handleLogout = () => {
    logoutFromStore?.();
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    cx(
      "px-3 py-2 rounded-xl text-sm font-extrabold transition",
      isActive
        ? "bg-surface-2 text-text border border-border"
        : "text-text-muted hover:text-text",
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/85 backdrop-blur border-b border-border">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/omnipizza-logo.png"
            alt="OmniPizza"
            className="h-10 w-10 rounded-2xl object-cover"
          />
          <div className="leading-tight">
            <div className="text-lg font-black text-text font-serif">
              OmniPizza
            </div>
            <div className="text-xs text-text-muted">
              Fast • Testable • Multi-Country
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/catalog" className={linkClass}>
            {t("catalog")}
          </NavLink>
          <NavLink to="/checkout" className={linkClass}>
            {t("checkout")}
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            {t("profile")}
          </NavLink>
          {lastOrder && (
            <NavLink to="/order-success" className={linkClass}>
              {t("lastOrder")}
            </NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* CH language toggle */}
          {countryCode === "CH" && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-border bg-surface-2">
              <button
                onClick={() => setLanguage?.("de")}
                className={cx(
                  "px-3 py-1 rounded-lg text-xs font-black",
                  language === "de"
                    ? "bg-brand-primary text-black"
                    : "text-text-muted",
                )}
              >
                DE
              </button>
              <button
                onClick={() => setLanguage?.("fr")}
                className={cx(
                  "px-3 py-1 rounded-lg text-xs font-black",
                  language === "fr"
                    ? "bg-brand-primary text-black"
                    : "text-text-muted",
                )}
              >
                FR
              </button>
            </div>
          )}

          {/* Country selector */}
          <select
            value={countryCode}
            onChange={(e) => setCountryCode?.(e.target.value)}
            className="h-10 rounded-xl bg-surface-2 text-text px-3 text-sm font-black outline-none ring-2 ring-transparent focus:ring-brand-accent border border-border"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Cart shortcut */}
          <button
            className="h-10 rounded-xl px-3 border border-border bg-surface-2 text-text font-black"
            onClick={() => navigate("/checkout")}
            aria-label="Cart"
          >
            <span className="relative">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-brand-primary text-black text-[11px] font-black rounded-full px-2 py-[1px]">
                  {cartCount}
                </span>
              )}
            </span>
          </button>

          <button onClick={handleLogout} className="btn-gold h-10">
            {t("logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
