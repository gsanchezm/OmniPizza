import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useCountryStore } from './store';
import { countryAPI } from './api';

import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { countryCode, setCountryInfo } = useCountryStore();

  useEffect(() => {
    if (isAuthenticated && countryCode) {
      countryAPI
        .getCountryInfo(countryCode)
        .then((response) => setCountryInfo(response.data))
        .catch((err) => console.error('Error loading country info:', err));
    }
  }, [isAuthenticated, countryCode, setCountryInfo]);

  return (
    <BrowserRouter>
      {/* ✅ Punto C: base layout con tu paleta vía tokens */}
      <div className="min-h-screen bg-surface text-text">
        {isAuthenticated && <Navbar />}

        {/* Opcional: evita que el contenido se encime con el Navbar.
            Ajusta el valor si tu Navbar no mide ~64px */}
        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/catalog" replace /> : <Login />}
            />

            <Route
              path="/catalog"
              element={
                <ProtectedRoute>
                  <Catalog />
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
