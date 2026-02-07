import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore, useCountryStore, useCartStore } from "../store";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const COUNTRIES = [
  { code: "MX", label: "MX" },
  { code: "US", label: "US" },
  { code: "CH", label: "CH" },
  { code: "JP", label: "JP" },
];

export default function Navbar() {
  const navigate = useNavigate();

  const countryCode = useCountryStore((s) => s.countryCode || "MX");
  const setCountryCode = useCountryStore((s) => s.setCountryCode); // si no existe, no rompe (ver fallback abajo)

  const logoutFromStore = useAuthStore((s) => s.logout);
  const cartItems = useCartStore((s) => s.items || []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cartItems]
  );

  const handleLogout = () => {
    if (typeof logoutFromStore === "function") {
      logoutFromStore();
      navigate("/", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const onCountryChange = (e) => {
    const next = e.target.value;
    if (typeof setCountryCode === "function") setCountryCode(next);
  };

  const linkBase =
    "px-3 py-2 rounded-lg text-sm font-extrabold transition hover:opacity-90";
  const linkClass = ({ isActive }) =>
    cx(
      linkBase,
      isActive ? "bg-brand-accent text-text" : "text-surface hover:bg-brand-secondary"
    );

  const iconLinkBase =
    "h-9 px-3 rounded-lg font-extrabold text-sm grid place-items-center transition hover:opacity-90";
  const iconLinkClass = ({ isActive }) =>
    cx(
      iconLinkBase,
      isActive ? "bg-brand-accent text-text" : "bg-brand-secondary text-surface"
    );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-brand-primary text-surface shadow">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-accent grid place-items-center text-text font-black">
            🍕
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold">OmniPizza</div>
            <div className="text-xs opacity-90">Fast • Testable • Multi-Country</div>
          </div>
        </div>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/catalog" className={linkClass}>
            Catalog
          </NavLink>
          <NavLink to="/checkout" className={linkClass}>
            Checkout
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile quick links (mantiene la altura 64px) */}
          <div className="flex md:hidden items-center gap-2">
            <NavLink to="/catalog" className={iconLinkClass} aria-label="Go to catalog">
              🍕
            </NavLink>

            <NavLink to="/checkout" className={iconLinkClass} aria-label="Go to checkout">
              <span className="relative">
                🛒
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-brand-accent text-text text-[11px] font-black rounded-full px-2 py-[1px]">
                    {cartCount}
                  </span>
                )}
              </span>
            </NavLink>
          </div>

          {/* Country */}
          <select
            value={countryCode}
            onChange={onCountryChange}
            className="h-9 rounded-lg bg-surface-card text-text px-2 text-sm font-extrabold outline-none ring-2 ring-transparent focus:ring-brand-accent"
            aria-label="Country selector"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="h-9 rounded-lg bg-brand-accent px-3 text-sm font-extrabold text-text transition hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
