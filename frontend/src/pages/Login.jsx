import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import { useAuthStore } from "../store";

const USER_HINTS = {
  standard_user: "Normal user, stable flow",
  locked_out_user: "Login fails (deterministic lockout)",
  problem_user: "UI shows broken images or $0 prices",
  performance_glitch_user: "API calls include ~3s delay",
  error_user: "Checkout may fail randomly (~50%)",
};

export default function Login() {
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState([]);

  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    authAPI
      .getTestUsers()
      .then((res) => setTestUsers(res.data || []))
      .catch(() => setTestUsers([]));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authAPI.login(username, password);
      const { access_token, username: user, behavior } = res.data;
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.08) 100%), url('/login-bg-gradient.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
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
                <h1 className="text-5xl font-black text-brand-primary font-serif">
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
                             focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
                             focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="pizza123"
                  required
                />
              </div>

              {error && (
                <div className="border border-danger text-danger bg-surface-2 px-4 py-3 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>

              <p className="text-sm text-text-muted">
                Tip: use any test user with password{" "}
                <span className="font-black text-text">pizza123</span>.
              </p>
            </form>
          </div>

          {/* Right: test users */}
          <div className="p-8 md:p-12">
            <h2 className="text-4xl font-black text-text font-serif mb-2">
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
                             hover:bg-[rgba(255,255,255,0.04)] transition"
                >
                  <div className="text-lg font-black text-text">
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
                <span className="font-black text-text">Password:</span> pizza123
                (all users)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
