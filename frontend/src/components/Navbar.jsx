import React, { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useCartStore, useCountryStore } from "../store";

const linkBase =
  "px-3 py-2 rounded-xl font-extrabold transition border border-transparent";
const linkActive = "bg-surface-2 border-border text-text";
const linkIdle = "text-text-muted hover:text-text hover:bg-[rgba(255,255,255,0.04)]";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const items = useCartStore((s) => s.items);
  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity || 0), 0),
    [items]
  );

  const countryCode = useCountryStore((s) => s.countryCode);
  const language = useCountryStore((s) => s.language);
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  const setLanguage = useCountryStore((s) => s.setLanguage);

  const [mobileOpen, setMobileOpen] = useState(false);

  const doLogout = () => {
    logout();
    setMobileOpen(false);
    // te manda al login (tu ruta "/" es Login)
    navigate("/", { replace: true });
  };

  const onChangeMarket = (e) => {
    setCountryCode(e.target.value);
    setMobileOpen(false);
    // opcional: si estás en /checkout y cambias market, te dejo donde estás
    // (sin navegación forzada)
  };

  const isCH = countryCode === "CH";

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="bg-[rgba(10,10,10,0.78)] backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2"
              onClick={() => {
                setMobileOpen(false);
                navigate("/catalog");
              }}
              type="button"
              aria-label="Go to catalog"
            >
              <img
                src="/omnipizza-logo.png"
                alt="OmniPizza"
                className="h-9 w-9 rounded-2xl object-cover"
              />
              <div className="hidden sm:block">
                <div className="text-xl font-black text-brand-primary font-serif leading-none">
                  OmniPizza
                </div>
                <div className="text-xs font-semibold text-text-muted -mt-0.5">
                  {username || "user"} • {countryCode}/{language}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                cx(linkBase, isActive ? linkActive : linkIdle)
              }
            >
              Catalog
            </NavLink>

            <NavLink
              to="/checkout"
              className={({ isActive }) =>
                cx(linkBase, isActive ? linkActive : linkIdle)
              }
            >
              Checkout
              {cartCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-lg bg-brand-primary text-black text-xs font-black">
                  {cartCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cx(linkBase, isActive ? linkActive : linkIdle)
              }
            >
              Profile
            </NavLink>
          </nav>

          {/* Controls */}
          <div className="hidden md:flex items-center gap-2">
            <select
              value={countryCode}
              onChange={onChangeMarket}
              className="px-3 py-2 rounded-xl bg-surface-2 text-text border border-border font-extrabold"
              aria-label="Market"
            >
              <option value="MX">MX</option>
              <option value="US">US</option>
              <option value="CH">CH</option>
              <option value="JP">JP</option>
            </select>

            {isCH && (
              <div className="flex items-center rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  className={cx(
                    "px-3 py-2 font-extrabold",
                    language === "de" ? "bg-brand-primary text-black" : "text-text-muted"
                  )}
                  onClick={() => setLanguage("de")}
                >
                  DE
                </button>
                <button
                  type="button"
                  className={cx(
                    "px-3 py-2 font-extrabold",
                    language === "fr" ? "bg-brand-primary text-black" : "text-text-muted"
                  )}
                  onClick={() => setLanguage("fr")}
                >
                  FR
                </button>
              </div>
            )}

            <button className="btn-ghost" type="button" onClick={doLogout}>
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden px-3 py-2 rounded-xl border border-border bg-surface-2 font-extrabold"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border">
            <div className="mx-auto max-w-6xl px-4 py-3 grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <select
                  value={countryCode}
                  onChange={onChangeMarket}
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-text border border-border font-extrabold"
                  aria-label="Market"
                >
                  <option value="MX">MX</option>
                  <option value="US">US</option>
                  <option value="CH">CH</option>
                  <option value="JP">JP</option>
                </select>

                {isCH && (
                  <div className="flex items-center rounded-xl border border-border overflow-hidden">
                    <button
                      type="button"
                      className={cx(
                        "px-3 py-2 font-extrabold",
                        language === "de" ? "bg-brand-primary text-black" : "text-text-muted"
                      )}
                      onClick={() => setLanguage("de")}
                    >
                      DE
                    </button>
                    <button
                      type="button"
                      className={cx(
                        "px-3 py-2 font-extrabold",
                        language === "fr" ? "bg-brand-primary text-black" : "text-text-muted"
                      )}
                      onClick={() => setLanguage("fr")}
                    >
                      FR
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <NavLink
                  to="/catalog"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cx(linkBase, isActive ? linkActive : linkIdle)
                  }
                >
                  Catalog
                </NavLink>

                <NavLink
                  to="/checkout"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cx(linkBase, isActive ? linkActive : linkIdle)
                  }
                >
                  Checkout
                  {cartCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-lg bg-brand-primary text-black text-xs font-black">
                      {cartCount}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cx(linkBase, isActive ? linkActive : linkIdle)
                  }
                >
                  Profile
                </NavLink>

                <button className="btn-ghost w-full" type="button" onClick={doLogout}>
                  Logout
                </button>
              </div>

              {/* Debug mini-line */}
              <div className="text-xs text-text-muted font-semibold">
                Path: {location.pathname}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}