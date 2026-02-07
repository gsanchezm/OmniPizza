import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore, useCountryStore } from '../store';
import { countryAPI } from '../api';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const { countryCode, setCountry, setCountryInfo } = useCountryStore();

  const countries = [
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'US', name: 'USA', flag: '🇺🇸' },
    { code: 'CH', name: 'Suiza', flag: '🇨🇭' },
    { code: 'JP', name: 'Japón', flag: '🇯🇵' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleCountryChange = async (code) => {
    setCountry(code);
    setCountryMenuOpen(false);
    
    try {
      const response = await countryAPI.getCountryInfo(code);
      setCountryInfo(response.data);
    } catch (err) {
      console.error('Error loading country info:', err);
    }
    
    // Reload catalog if on catalog page
    if (location.pathname === '/catalog') {
      window.location.reload();
    }
  };

  const currentCountry = countries.find(c => c.code === countryCode);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-pizza-red text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/catalog" className="flex items-center space-x-2" data-testid="nav-logo">
            <span className="text-2xl">🍕</span>
            <span className="text-xl font-bold">OmniPizza</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/catalog"
              className="hover:text-pizza-yellow transition duration-200"
              data-testid="nav-catalog-link"
            >
              Catálogo
            </Link>

            {/* Cart */}
            <Link
              to="/checkout"
              className="relative hover:text-pizza-yellow transition duration-200"
              data-testid="nav-cart-link"
            >
              <span className="text-xl">🛒</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-pizza-red text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-count">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Country Selector */}
            <div className="relative">
              <button
                onClick={() => setCountryMenuOpen(!countryMenuOpen)}
                className="flex items-center space-x-2 hover:text-pizza-yellow transition duration-200"
                data-testid="country-selector"
              >
                <span className="text-xl">{currentCountry?.flag}</span>
                <span>{currentCountry?.code}</span>
              </button>

              {countryMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountryChange(country.code)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition duration-200 ${
                        country.code === countryCode ? 'bg-gray-50 font-bold' : ''
                      }`}
                      data-testid={`select-country-${country.code}`}
                    >
                      <span className="mr-2">{country.flag}</span>
                      <span className="text-gray-800">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 hover:text-pizza-yellow transition duration-200"
                data-testid="user-menu-button"
              >
                <span className="text-xl">👤</span>
                <span>{username}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm text-gray-600">Sesión iniciada como:</p>
                    <p className="font-semibold text-gray-800">{username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition duration-200"
                    data-testid="logout-button"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white"
            data-testid="mobile-menu-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link
              to="/catalog"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-pizza-yellow transition duration-200"
            >
              Catálogo
            </Link>

            <Link
              to="/checkout"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-pizza-yellow transition duration-200"
            >
              🛒 Carrito ({cartItemCount})
            </Link>

            <div className="border-t border-white/20 pt-4 space-y-2">
              <p className="text-sm opacity-75">Cambiar País:</p>
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountryChange(country.code)}
                  className={`block w-full text-left py-2 ${
                    country.code === countryCode ? 'font-bold' : ''
                  }`}
                >
                  {country.flag} {country.name}
                </button>
              ))}
            </div>

            <div className="border-t border-white/20 pt-4">
              <p className="text-sm opacity-75 mb-2">Usuario: {username}</p>
              <button
                onClick={handleLogout}
                className="text-yellow-300 hover:text-yellow-400 transition duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
