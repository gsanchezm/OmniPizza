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
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { countryCode, setCountryInfo } = useCountryStore();

  useEffect(() => {
    // Load country info on mount
    if (isAuthenticated && countryCode) {
      countryAPI.getCountryInfo(countryCode)
        .then((response) => setCountryInfo(response.data))
        .catch((err) => console.error('Error loading country info:', err));
    }
  }, [isAuthenticated, countryCode, setCountryInfo]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {isAuthenticated && <Navbar />}
        
        <Routes>
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/catalog" /> : <Login />
          } />
          
          <Route path="/catalog" element={
            <ProtectedRoute>
              <Catalog />
            </ProtectedRoute>
          } />
          
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
