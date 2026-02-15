import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore, useCartStore, useCountryStore } from "../store";
import { useT } from "../i18n";

const linkBase =
  "px-3 py-2 rounded-xl font-extrabold transition border border-transparent";
const linkActive = "bg-surface-2 border-border text-text";
const linkIdle =
  "text-text-muted hover:text-text hover:bg-[rgba(255,255,255,0.06)]";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Navbar() {
  const t = useT();

  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const items = useCartStore((s) => s.items);
  const cartCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity || 0), 0),
    [items]
  );

  const countryCode = useCountryStore((s) => s.countryCode);
  const language = useCountryStore((s) => s.language);
  const setLanguage = useCountryStore((s) => s.setLanguage);

  const isCH = countryCode === "CH";

  const doLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="glass-nav">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <button
            className="flex items-center gap-2"
            type="button"
            onClick={() => {
              setMobileOpen(false);
              navigate("/catalog");
            }}
            aria-label="Go to catalog"
          >
            <img
              src="/omnipizza-logo.png"
              alt="OmniPizza"
              className="h-9 w-9 rounded-2xl object-cover"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xl font-extrabold text-brand-primary leading-none">
                OmniPizza
              </div>
              <div className="text-xs font-semibold text-text-muted -mt-0.5">
                {username || "user"}
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                cx(linkBase, isActive ? linkActive : linkIdle)
              }
            >
              {t("catalog")}
            </NavLink>

            <NavLink
              to="/checkout"
              className={({ isActive }) =>
                cx(linkBase, isActive ? linkActive : linkIdle)
              }
            >
              {t("checkout")}
              {cartCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-lg bg-brand-primary text-white text-xs font-extrabold">
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
              {t("profile")}
            </NavLink>
          </nav>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-2">
            {isCH && (
              <div className="flex items-center rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  className={cx(
                    "px-3 py-2 font-extrabold transition",
                    language === "de"
                      ? "bg-brand-primary text-white"
                      : "text-text-muted hover:text-text"
                  )}
                  onClick={() => setLanguage("de")}
                >
                  DE
                </button>
                <button
                  type="button"
                  className={cx(
                    "px-3 py-2 font-extrabold transition",
                    language === "fr"
                      ? "bg-brand-primary text-white"
                      : "text-text-muted hover:text-text"
                  )}
                  onClick={() => setLanguage("fr")}
                >
                  FR
                </button>
              </div>
            )}

            <button className="btn-ghost" type="button" onClick={doLogout}>
              {t("logout")}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden px-3 py-2 rounded-xl border border-border bg-surface-2 font-extrabold text-text"
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
              {isCH && (
                <div className="flex items-center rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    className={cx(
                      "px-3 py-2 font-extrabold transition",
                      language === "de"
                        ? "bg-brand-primary text-white"
                        : "text-text-muted"
                    )}
                    onClick={() => setLanguage("de")}
                  >
                    DE
                  </button>
                  <button
                    type="button"
                    className={cx(
                      "px-3 py-2 font-extrabold transition",
                      language === "fr"
                        ? "bg-brand-primary text-white"
                        : "text-text-muted"
                    )}
                    onClick={() => setLanguage("fr")}
                  >
                    FR
                  </button>
                </div>
              )}

              <NavLink
                to="/catalog"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cx(linkBase, isActive ? linkActive : linkIdle)
                }
              >
                {t("catalog")}
              </NavLink>

              <NavLink
                to="/checkout"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cx(linkBase, isActive ? linkActive : linkIdle)
                }
              >
                {t("checkout")}
                {cartCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-lg bg-brand-primary text-white text-xs font-extrabold">
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
                {t("profile")}
              </NavLink>

              <button className="btn-ghost w-full" type="button" onClick={doLogout}>
                {t("logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
