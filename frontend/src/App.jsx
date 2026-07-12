import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useCountryStore } from "./store";
import { useCountryFeatureInfo } from "./features/country/hooks/useCountryFeatureInfo";

import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";
import Toast from "./components/Toast";

const Catalog = lazy(() => import("./pages/Catalog"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Profile = lazy(() => import("./pages/Profile"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));

const App = () => {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = Boolean(token);
  const countryCode = useCountryStore((s) => s.countryCode);
  const language = useCountryStore((s) => s.language);

  useCountryFeatureInfo(isAuthenticated, countryCode);

  // Full RTL: an authenticated Arabic session renders the document right-to-left
  // (native browser RTL then mirrors the whole app). The login / unauthenticated
  // view is always English + LTR — the app "starts in English" and the market
  // (and thus the language) is only chosen at login, so a previous SA session must
  // not leave the login screen reversed after logout.
  useEffect(() => {
    const rtl = isAuthenticated && language === "ar";
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = isAuthenticated ? language || "en" : "en";
  }, [language, isAuthenticated]);

  return (
    <BrowserRouter>
      {/* ✅ Punto C: base layout con tu paleta vía tokens */}
      <div className="min-h-screen lux-bg text-text">
        {isAuthenticated && <Navbar />}

        {/* Opcional: evita que el contenido se encime con el Navbar.
            Ajusta el valor si tu Navbar no mide ~64px */}
        <main className={isAuthenticated ? "pt-16" : ""}>
          <Suspense fallback={<div data-testid="route-loading" className="min-h-screen lux-bg" />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Login />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/order-success" element={<OrderSuccess />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Global transient notifications */}
        <Toast />
      </div>
    </BrowserRouter>
  );
};

export default App;
