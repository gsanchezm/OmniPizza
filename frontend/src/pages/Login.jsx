import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore, useCountryStore } from "../store";
import { authService } from "../services/auth.service";
import InputGroup from "../components/InputGroup";
import PrimaryButton from "../components/PrimaryButton";
import SocialButton from "../components/SocialButton";
import Checkbox from "../components/Checkbox";

const USER_HINTS = {
  standard_user: "Standard User",
  problem_user: "Problem User",
  performance_glitch_user: "Glitch User",
  error_user: "Error User",
};

export default function Login() {
  const [username, setUsername] = useState("standard_user");
  const [password, setPassword] = useState("pizza123");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState([]);
  const [showTestUsers, setShowTestUsers] = useState(false);

  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const setCountryCode = useCountryStore((s) => s.setCountryCode);
  
  // Defaulting to US for the "clean" login, but keeping the store logic
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
    setShowTestUsers(false);
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
              <div className="w-10 h-10 bg-[#FF5722] rounded-xl flex items-center justify-center transform rotate-3">
                 <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
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

            <div className="flex items-center justify-between">
              <Checkbox 
                label="Remember for 30 days" 
                checked={remember} 
                onChange={setRemember} 
              />
              <button type="button" className="text-sm font-semibold text-[#FF5722] hover:text-[#E64A19] transition-colors">
                Forgot password?
              </button>
            </div>

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

          {/* Social / Test Users */}
          <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-[#2A2A2A]"></div>
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-[#0F0F0F] text-gray-500 uppercase tracking-widest font-bold text-xs">Or continue with</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <SocialButton 
               label="Google"
               onClick={() => fillUser('problem_user')} 
               icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
             />
              <SocialButton 
               label="GitHub"
               onClick={() => setShowTestUsers(!showTestUsers)} 
               icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0122 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>}
             />
          </div>

          <p className="text-center text-gray-500 text-sm">
            Don't have an account? <button className="text-[#FF5722] hover:text-[#FF8A65] font-semibold transition-colors">Create an Account</button>
          </p>

          {/* Test Users Popover (Hidden by default to keep design clean) */}
          {showTestUsers && (
            <div className="absolute bottom-24 right-6 w-64 bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl shadow-2xl p-2 z-50">
              <p className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">QA: Auto-Fill User</p>
              {testUsers.length > 0 ? testUsers.map(u => (
                <button 
                  key={u.username}
                  onClick={() => fillUser(u.username)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2A2A2A] hover:text-white rounded-lg transition-colors flex justify-between"
                >
                  <span>{u.username}</span>
                  <span className="text-xs text-brand-primary">{USER_HINTS[u.username]?.split(' ')[0]}</span>
                </button>
              )) : (
                 <div className="px-3 py-2 text-xs text-gray-500">Loading users...</div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
