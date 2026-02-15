import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore, useCountryStore } from "../store";
import { authService } from "../services/auth.service";

const USER_HINTS = {
  standard_user: "Normal user, stable flow",
  locked_out_user: "Login fails (deterministic lockout)",
  problem_user: "UI shows broken images or $0 prices",
  performance_glitch_user: "API calls include ~3s delay",
  error_user: "Checkout may fail randomly (~50%)",
};

const MARKET_OPTIONS = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "MX", label: "Mexico", flag: "🇲🇽" },
  { code: "CH", label: "Switzerland", flag: "🇨🇭" },
  { code: "JP", label: "Japan", flag: "🇯🇵" },
];

export default function Login() {
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState([]);

  const navigate = useNavigate();

  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const countryCode = useCountryStore((s) => s.countryCode);
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  const [selectedMarket, setSelectedMarket] = useState(countryCode || "US");

  if (token) {
    return <Navigate to="/catalog" replace />;
  }

  useEffect(() => {
    authService
      .getTestUsers()
      .then((res) => setTestUsers(res.data || []))
      .catch(() => setTestUsers([]));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(username, password);
      const { access_token, username: user, behavior } = res.data;

      setCountryCode(selectedMarket);
      login(access_token, user, behavior);

      navigate("/catalog", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u) => {
    setUsername(u.username);
    setPassword("pizza123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-5xl lux-card rounded-2xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left: login */}
          <div className="p-8 md:p-12 border-r border-border">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <img
                  src="/omnipizza-logo.png"
                  alt="OmniPizza"
                  className="h-10 w-10 rounded-2xl object-cover"
                />
                <h1 className="text-5xl font-extrabold text-brand-primary">
                  OmniPizza
                </h1>
              </div>
              <p className="mt-2 text-text-muted font-semibold">
                QA Testing Platform
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-extrabold text-text-muted mb-2">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 text-text border border-border
                             focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="standard_user"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-text-muted mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 text-text border border-border
                             focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="pizza123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-text-muted mb-2">
                  Select Market
                </label>
                <div className="flex justify-center">
                  <div className="grid grid-cols-4 gap-3">
                    {MARKET_OPTIONS.map((market) => {
                      const active = selectedMarket === market.code;
                      return (
                        <button
                          key={market.code}
                          type="button"
                          title={market.label}
                          aria-label={`Select ${market.label}`}
                          onClick={() => setSelectedMarket(market.code)}
                          className={[
                            "h-12 w-12 rounded-full border bg-surface-2 text-2xl flex items-center justify-center transition",
                            active
                              ? "border-brand-primary ring-2 ring-brand-primary/40"
                              : "border-border hover:border-brand-primary/60",
                          ].join(" ")}
                        >
                          <span className="leading-none">{market.flag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="border border-danger text-danger bg-surface-2 px-4 py-3 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <p className="text-sm text-text-muted">
                Tip: use any test user with password{" "}
                <span className="font-extrabold text-text">pizza123</span>.
              </p>
            </form>
          </div>

          {/* Right: test users */}
          <div className="p-8 md:p-12">
            <h2 className="text-4xl font-extrabold text-text mb-2">
              Test Users
            </h2>
            <p className="text-text-muted font-semibold mb-6">
              Select a user for automated testing scenarios
            </p>

            <div className="space-y-3">
              {testUsers.map((u) => (
                <button
                  key={u.username}
                  onClick={() => selectUser(u)}
                  className="w-full text-left p-4 rounded-2xl border border-border bg-surface-2
                             hover:bg-[rgba(255,255,255,0.06)] transition"
                >
                  <div className="text-lg font-extrabold text-text">
                    {u.username}
                  </div>
                  <div className="text-sm text-text-muted font-semibold mt-1">
                    {USER_HINTS[u.username] || u.description || ""}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-2xl border border-border bg-surface-2">
              <p className="text-sm text-text-muted font-semibold">
                <span className="font-extrabold text-text">Password:</span> pizza123
                (all users)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
