import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore } from '../store';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState([]);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-brand-secondary">
        <div className="grid md:grid-cols-2">
          {/* Left side - Login form */}
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <h1
                className="text-4xl font-extrabold text-brand-primary mb-2"
                data-testid="login-title"
              >
                🍕 OmniPizza
              </h1>
              <p className="text-brand-secondary font-semibold">
                Plataforma de Testing QA
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-text mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-brand-secondary rounded-lg bg-surface text-text
                             focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="standard_user"
                  required
                  data-testid="username-input"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-brand-secondary rounded-lg bg-surface text-text
                             focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="pizza123"
                  required
                  data-testid="password-input"
                />
              </div>

              {error && (
                <div
                  className="bg-surface border border-brand-primary text-brand-primary px-4 py-3 rounded-lg font-semibold"
                  data-testid="error-message"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-surface font-extrabold py-3 px-4 rounded-lg
                           transition hover:opacity-90 disabled:opacity-50"
                data-testid="login-button"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>

              <div className="text-xs text-brand-secondary font-semibold">
                Tip: usa cualquier usuario de prueba con password <span className="font-black">pizza123</span>.
              </div>
            </form>
          </div>

          {/* Right side - Test users selector */}
          <div className="bg-surface p-8 md:p-12 border-l border-brand-secondary">
            <h2 className="text-2xl font-extrabold text-text mb-2">
              Usuarios de Prueba
            </h2>
            <p className="text-sm text-brand-secondary font-semibold mb-6">
              Selecciona un usuario para pruebas automáticas
            </p>

            <div className="space-y-3">
              {testUsers.map((user) => (
                <button
                  key={user.username}
                  onClick={() => selectUser(user)}
                  className="w-full text-left p-4 bg-surface-card border border-brand-secondary rounded-lg
                             transition hover:bg-brand-accent"
                  data-testid={`select-user-${user.username}`}
                >
                  <div className="font-extrabold text-text">{user.username}</div>
                  <div className="text-xs mt-1 text-brand-secondary font-semibold">
                    {user.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-surface-card border border-brand-accent rounded-lg">
              <p className="text-xs text-text font-semibold">
                <strong className="text-brand-primary">Password:</strong> pizza123 (todos los usuarios)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
