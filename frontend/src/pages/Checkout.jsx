import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../api';
import { useCartStore, useCountryStore } from '../store';

const Checkout = () => {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const countryCode = useCountryStore((state) => state.countryCode);
  const countryInfo = useCountryStore((state) => state.countryInfo);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    // Country-specific fields
    colonia: '',
    propina: '',
    zip_code: '',
    plz: '',
    prefectura: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/catalog');
    }
  }, [cartItems, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.pizza.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const checkoutData = {
        country_code: countryCode,
        items: cartItems.map(item => ({
          pizza_id: item.pizza_id,
          quantity: item.quantity
        })),
        name: formData.name,
        address: formData.address,
        phone: formData.phone
      };

      // Add country-specific fields
      if (countryCode === 'MX') {
        checkoutData.colonia = formData.colonia;
        if (formData.propina) {
          checkoutData.propina = parseFloat(formData.propina);
        }
      } else if (countryCode === 'US') {
        checkoutData.zip_code = formData.zip_code;
      } else if (countryCode === 'CH') {
        checkoutData.plz = formData.plz;
      } else if (countryCode === 'JP') {
        checkoutData.prefectura = formData.prefectura;
      }

      const response = await orderAPI.checkout(checkoutData);
      setOrderSummary(response.data);
      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Error al procesar la orden');
    } finally {
      setLoading(false);
    }
  };

  if (success && orderSummary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-700 mb-4" data-testid="success-title">
              ¡Orden Exitosa!
            </h1>
            
            <div className="bg-white rounded-lg p-6 mb-6">
              <p className="text-gray-600 mb-4">Número de orden:</p>
              <p className="text-2xl font-bold text-gray-800" data-testid="order-id">
                {orderSummary.order_id}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-lg mb-4">Resumen del Pedido</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span data-testid="order-subtotal">
                    {orderSummary.currency_symbol} {orderSummary.subtotal.toFixed(countryInfo?.decimal_places || 2)}
                  </span>
                </div>
                
                {orderSummary.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span data-testid="order-tax">
                      {orderSummary.currency_symbol} {orderSummary.tax.toFixed(countryInfo?.decimal_places || 2)}
                    </span>
                  </div>
                )}
                
                {orderSummary.tip > 0 && (
                  <div className="flex justify-between">
                    <span>Propina:</span>
                    <span data-testid="order-tip">
                      {orderSummary.currency_symbol} {orderSummary.tip.toFixed(countryInfo?.decimal_places || 2)}
                    </span>
                  </div>
                )}
                
                <div className="border-t-2 pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span data-testid="order-total">
                    {orderSummary.currency_symbol} {orderSummary.total.toFixed(countryInfo?.decimal_places || 2)} {orderSummary.currency}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/catalog')}
              className="bg-pizza-red hover:bg-pizza-red/90 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
              data-testid="back-to-catalog-button"
            >
              Volver al Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8" data-testid="checkout-title">
          🛒 Checkout
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Información de Entrega</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                  data-testid="checkout-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                  data-testid="checkout-address-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                  data-testid="checkout-phone-input"
                />
              </div>

              {/* Country-specific fields */}
              {countryCode === 'MX' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colonia *
                    </label>
                    <input
                      type="text"
                      name="colonia"
                      value={formData.colonia}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                      data-testid="checkout-colonia-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Propina (opcional)
                    </label>
                    <input
                      type="number"
                      name="propina"
                      value={formData.propina}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                      data-testid="checkout-propina-input"
                    />
                  </div>
                </>
              )}

              {countryCode === 'US' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code * (5 dígitos)
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    required
                    pattern="\d{5}"
                    maxLength="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                    data-testid="checkout-zipcode-input"
                  />
                </div>
              )}

              {countryCode === 'CH' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    name="plz"
                    value={formData.plz}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                    data-testid="checkout-plz-input"
                  />
                </div>
              )}

              {countryCode === 'JP' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefectura *
                  </label>
                  <input
                    type="text"
                    name="prefectura"
                    value={formData.prefectura}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-red focus:border-transparent"
                    data-testid="checkout-prefectura-input"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" data-testid="checkout-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pizza-red hover:bg-pizza-red/90 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                data-testid="checkout-submit-button"
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Resumen del Pedido</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.pizza_id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h4 className="font-semibold">{item.pizza.name}</h4>
                    <p className="text-sm text-gray-600">
                      Cantidad: {item.quantity} × {countryInfo?.currency_symbol || '$'}{item.pizza.price.toFixed(countryInfo?.decimal_places || 2)}
                    </p>
                  </div>
                  <div className="font-bold">
                    {countryInfo?.currency_symbol || '$'}{(item.pizza.price * item.quantity).toFixed(countryInfo?.decimal_places || 2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Subtotal:</span>
                <span data-testid="cart-subtotal">
                  {countryInfo?.currency_symbol || '$'}{calculateSubtotal().toFixed(countryInfo?.decimal_places || 2)}
                </span>
              </div>
              
              {countryCode === 'US' && (
                <p className="text-sm text-gray-600 mt-2">
                  * Se agregará 8% de impuestos al finalizar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
