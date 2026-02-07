import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore, useCountryStore } from '../store';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState([]);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Load test users for selector
    authAPI.getTestUsers()
      .then((response) => setTestUsers(response.data))
      .catch((err) => console.error('Error loading test users:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      const { access_token, username: user, behavior } = response.data;
      
      login(access_token, user, behavior);
      navigate('/catalog');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user) => {
    setUsername(user.username);
    setPassword('pizza123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pizza-red to-pizza-orange flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left side - Login form */}
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-pizza-red mb-2" data-testid="login-title">
                🍕 OmniPizza
              </h1>
              <p className="text-gray-600">Plataforma de Testing QA</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                  placeholder="standard_user"
                  required
                  data-testid="username-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                  placeholder="pizza123"
                  required
                  data-testid="password-input"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" data-testid="error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pizza-red hover:bg-pizza-red/90 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                data-testid="login-button"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          </div>

          {/* Right side - Test users selector */}
          <div className="bg-gray-50 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Usuarios de Prueba
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Selecciona un usuario para pruebas automáticas
            </p>

            <div className="space-y-3">
              {testUsers.map((user) => (
                <button
                  key={user.username}
                  onClick={() => selectUser(user)}
                  className="w-full text-left p-4 bg-white hover:bg-pizza-red hover:text-white border border-gray-200 rounded-lg transition duration-200"
                  data-testid={`select-user-${user.username}`}
                >
                  <div className="font-semibold">{user.username}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {user.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Password:</strong> pizza123 (todos los usuarios)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
