import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore, useCountryStore, useCartStore, useOrderStore } from "../store";
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

  const [menuOpen, setMenuOpen] = React.useState(false);

  const countryCode = useCountryStore((s) => s.countryCode || "MX");
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  const language = useCountryStore((s) => s.language || "en");
  const setLanguage = useCountryStore((s) => s.setLanguage);

  const logout = useAuthStore((s) => s.logout);

  const cartItems = useCartStore((s) => s.items || []);
  const lastOrder = useOrderStore((s) => s.lastOrder);

  const cartCount = React.useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
    [cartItems]
  );

  const handleLogout = () => {
    logout?.();
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    cx(
      "px-3 py-2 rounded-xl text-sm font-extrabold transition whitespace-nowrap",
      isActive
        ? "bg-surface-2 text-text border border-border"
        : "text-text-muted hover:text-text"
    );

  const menuLink = (to, label) => (
    <NavLink
      to={to}
      className="block px-3 py-2 rounded-xl text-text font-extrabold hover:bg-[rgba(255,255,255,0.06)]"
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </NavLink>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/85 backdrop-blur border-b border-border">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3 sm:px-4">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-brand-primary grid place-items-center flex-shrink-0">
            <img
              src="/omnipizza-logo.png"
              alt="OmniPizza"
              className="h-8 w-8 rounded-xl object-cover"
            />
          </div>

          <div className="leading-tight min-w-0">
            <div className="text-lg font-black text-text font-serif truncate">
              OmniPizza
            </div>
            <div className="text-xs text-text-muted truncate">
              Fast • Testable • Multi-Country
            </div>
          </div>
        </div>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/catalog" className={linkClass}>{t("catalog")}</NavLink>
          <NavLink to="/checkout" className={linkClass}>{t("checkout")}</NavLink>
          <NavLink to="/profile" className={linkClass}>{t("profile")}</NavLink>
          {lastOrder && (
            <NavLink to="/order-success" className={linkClass}>
              {t("lastOrder")}
            </NavLink>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Mobile hamburger */}
          <div className="md:hidden relative">
            <button
              className="h-10 w-10 rounded-xl border border-border bg-surface-2 text-text font-black"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              ☰
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface-2 p-2 shadow-lg">
                {menuLink("/catalog", t("catalog"))}
                {menuLink("/checkout", t("checkout"))}
                {menuLink("/profile", t("profile"))}
                {lastOrder && menuLink("/order-success", t("lastOrder"))}

                {/* CH language toggle inside menu (mobile) */}
                {countryCode === "CH" && (
                  <div className="mt-2 p-2 rounded-xl border border-border bg-[rgba(255,255,255,0.02)]">
                    <div className="text-xs text-text-muted font-semibold mb-2">
                      DE / FR
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={cx(
                          "px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap border",
                          language === "de"
                            ? "bg-brand-primary text-black border-brand-primary"
                            : "bg-surface text-text border-border"
                        )}
                        onClick={() => setLanguage?.("de")}
                      >
                        DE
                      </button>
                      <button
                        className={cx(
                          "px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap border",
                          language === "fr"
                            ? "bg-brand-primary text-black border-brand-primary"
                            : "bg-surface text-text border-border"
                        )}
                        onClick={() => setLanguage?.("fr")}
                      >
                        FR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CH DE/FR toggle (desktop/tablet) */}
          {countryCode === "CH" && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border border-border bg-surface-2">
              <button
                onClick={() => setLanguage?.("de")}
                className={cx(
                  "px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap",
                  language === "de"
                    ? "bg-brand-primary text-black"
                    : "text-text-muted hover:text-text"
                )}
              >
                DE
              </button>
              <button
                onClick={() => setLanguage?.("fr")}
                className={cx(
                  "px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap",
                  language === "fr"
                    ? "bg-brand-primary text-black"
                    : "text-text-muted hover:text-text"
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
            className="h-10 rounded-xl bg-surface-2 text-text px-3 text-sm font-black outline-none ring-2 ring-transparent focus:ring-brand-accent border border-border whitespace-nowrap"
            aria-label="Country selector"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>

          {/* Cart */}
          <button
            className="h-10 w-10 rounded-xl border border-border bg-surface-2 text-text font-black grid place-items-center"
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

          {/* Logout: text on >=sm, icon on xs to avoid vertical wrap */}
          <button onClick={handleLogout} className="btn-gold h-10 whitespace-nowrap">
            <span className="hidden sm:inline">{t("logout")}</span>
            <span className="sm:hidden">⎋</span>
          </button>
        </div>
      </div>
    </header>
  );
}
