import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useCountryStore } from "./store";
import { countryAPI } from "./api";

import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import OrderSuccess from "./pages/OrderSuccess";
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = Boolean(token);
  const { countryCode, setCountryInfo } = useCountryStore();

  useEffect(() => {
    if (isAuthenticated && countryCode) {
      countryAPI
        .getCountryInfo(countryCode)
        .then((response) => setCountryInfo(response.data))
        .catch((err) => console.error("Error loading country info:", err));
    }
  }, [isAuthenticated, countryCode, setCountryInfo]);

  return (
    <BrowserRouter>
      {/* ✅ Punto C: base layout con tu paleta vía tokens */}
      <div className="min-h-screen lux-bg text-text">
        {isAuthenticated && <Navbar />}

        {/* Opcional: evita que el contenido se encime con el Navbar.
            Ajusta el valor si tu Navbar no mide ~64px */}
        <main className={isAuthenticated ? "pt-16" : ""}>
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
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
