import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore, useCountryStore } from "../store";
import { authService } from "../services/auth.service";
import InputGroup from "../components/InputGroup";
import PrimaryButton from "../components/PrimaryButton";

const USER_HINTS = {
  standard_user: "Standard",
  locked_out_user: "Locked",
  problem_user: "Problem",
  performance_glitch_user: "Glitch",
  error_user: "Error",
};

export default function Login() {
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState([]);

  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  
  // Defaulting to US for the "clean" login
  const selectedMarket = "US";

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
    e && e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.login(username, password);
      const { access_token, username: user, behavior } = res.data;

      setCountryCode(selectedMarket);
      login(access_token, user, behavior);

      navigate("/catalog", { replace: true });
    } catch (err) {
      setError(err?.users_limit ? "Too many users" : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillUser = (u) => {
    setUsername(u);
    setPassword("pizza123");
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:block relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src="/login-hero-pizza.jpg" 
          alt="Art of Pizza" 
          className="w-full h-full object-cover"
          onError={(e) => {e.target.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop'}}
        />
        <div className="absolute bottom-20 left-12 z-20 max-w-md">
          <div className="inline-block px-3 py-1 mb-4 border border-[#FF5722]/50 rounded-full bg-[#FF5722]/10 text-[#FF5722] text-xs font-bold tracking-widest uppercase">
            The Art of Pizza
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-4 text-white">
            Crafting moments of pure flavor.
          </h1>
          <p className="text-gray-300 text-lg">
            Experience the pinnacle of high-end delivery with OmniPizza's signature gourmet collection.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-[#0F0F0F] relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex justify-center lg:justify-start items-center gap-3 mb-6">
              <img 
                src="/omnipizza-logo.png" 
                alt="OmniPizza Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1"
              />
              <span className="text-2xl font-bold tracking-tight">OmniPizza</span>
            </div>
            <h2 className="text-3xl font-bold">Welcome back!</h2>
            <p className="text-gray-400">Please enter your details.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <InputGroup 
              label="Username" 
              placeholder="standard_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            
            <InputGroup 
              label="Password" 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">
                  {showPassword ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              }
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <PrimaryButton type="submit" fullWidth disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </PrimaryButton>
          </form>

          {/* Test Users Quick Access */}
          <div>
            <div className="relative mb-4">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-[#2A2A2A]"></div>
               </div>
               <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-[#0F0F0F] text-gray-500 uppercase tracking-widest font-bold text-xs">Quick Login</span>
               </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {testUsers.length > 0 ? testUsers.map(u => (
                 <button 
                   key={u.username}
                   onClick={() => fillUser(u.username)}
                   className="bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 hover:text-white border border-[#2A2A2A] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                   title={u.username}
                 >
                   {USER_HINTS[u.username] || u.username}
                 </button>
              )) : (
                 <span className="text-xs text-gray-600">Loading test users...</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
