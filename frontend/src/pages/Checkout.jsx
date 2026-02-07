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
    if (cartItems.length === 0) navigate('/catalog');
  }, [cartItems, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateSubtotal = () =>
    cartItems.reduce((total, item) => total + (item.pizza.price * item.quantity), 0);

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

      if (countryCode === 'MX') {
        checkoutData.colonia = formData.colonia;
        if (formData.propina) checkoutData.propina = parseFloat(formData.propina);
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

  const inputClass =
    "w-full px-4 py-2 border border-brand-secondary rounded-lg bg-surface text-text " +
    "focus:outline-none focus:ring-2 focus:ring-brand-accent";

  if (success && orderSummary) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-card border-2 border-brand-accent rounded-2xl p-8 text-center shadow-xl">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-extrabold text-brand-primary mb-4" data-testid="success-title">
              ¡Orden Exitosa!
            </h1>

            <div className="bg-surface rounded-xl p-6 mb-6 border border-brand-secondary">
              <p className="text-brand-secondary font-semibold mb-2">Número de orden:</p>
              <p className="text-2xl font-black text-text" data-testid="order-id">
                {orderSummary.order_id}
              </p>
            </div>

            <div className="bg-surface rounded-xl p-6 mb-6 text-left border border-brand-secondary">
              <h3 className="font-extrabold text-lg mb-4 text-text">Resumen del Pedido</h3>

              <div className="space-y-2 text-text">
                <div className="flex justify-between">
                  <span className="font-semibold">Subtotal:</span>
                  <span data-testid="order-subtotal" className="font-black">
                    {orderSummary.currency_symbol} {orderSummary.subtotal.toFixed(countryInfo?.decimal_places || 2)}
                  </span>
                </div>

                {orderSummary.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Impuestos:</span>
                    <span data-testid="order-tax" className="font-black">
                      {orderSummary.currency_symbol} {orderSummary.tax.toFixed(countryInfo?.decimal_places || 2)}
                    </span>
                  </div>
                )}

                {orderSummary.tip > 0 && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Propina:</span>
                    <span data-testid="order-tip" className="font-black">
                      {orderSummary.currency_symbol} {orderSummary.tip.toFixed(countryInfo?.decimal_places || 2)}
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-brand-secondary pt-2 flex justify-between font-black text-lg">
                  <span>Total:</span>
                  <span data-testid="order-total" className="text-brand-primary">
                    {orderSummary.currency_symbol} {orderSummary.total.toFixed(countryInfo?.decimal_places || 2)} {orderSummary.currency}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/catalog')}
              className="bg-brand-primary text-surface font-extrabold py-3 px-8 rounded-lg transition hover:opacity-90"
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
        <h1 className="text-4xl font-extrabold text-brand-primary mb-8" data-testid="checkout-title">
          🛒 Checkout
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-surface-card border border-brand-secondary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-extrabold mb-6 text-text">Información de Entrega</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-text mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  data-testid="checkout-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  data-testid="checkout-address-input"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  data-testid="checkout-phone-input"
                />
              </div>

              {/* Country-specific fields */}
              {countryCode === 'MX' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-text mb-2">
                      Colonia *
                    </label>
                    <input
                      type="text"
                      name="colonia"
                      value={formData.colonia}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      data-testid="checkout-colonia-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text mb-2">
                      Propina (opcional)
                    </label>
                    <input
                      type="number"
                      name="propina"
                      value={formData.propina}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={inputClass}
                      data-testid="checkout-propina-input"
                    />
                  </div>
                </>
              )}

              {countryCode === 'US' && (
                <div>
                  <label className="block text-sm font-bold text-text mb-2">
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
                    className={inputClass}
                    data-testid="checkout-zipcode-input"
                  />
                </div>
              )}

              {countryCode === 'CH' && (
                <div>
                  <label className="block text-sm font-bold text-text mb-2">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    name="plz"
                    value={formData.plz}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    data-testid="checkout-plz-input"
                  />
                </div>
              )}

              {countryCode === 'JP' && (
                <div>
                  <label className="block text-sm font-bold text-text mb-2">
                    Prefectura *
                  </label>
                  <input
                    type="text"
                    name="prefectura"
                    value={formData.prefectura}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    data-testid="checkout-prefectura-input"
                  />
                </div>
              )}

              {error && (
                <div className="bg-surface border border-brand-primary text-brand-primary px-4 py-3 rounded-lg font-semibold" data-testid="checkout-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary text-surface font-extrabold py-3 px-4 rounded-lg transition hover:opacity-90 disabled:opacity-50"
                data-testid="checkout-submit-button"
              >
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-surface-card border border-brand-secondary rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-extrabold mb-6 text-text">Resumen del Pedido</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.pizza_id} className="flex justify-between items-center border-b border-brand-secondary pb-4">
                  <div>
                    <h4 className="font-extrabold text-text">{item.pizza.name}</h4>
                    <p className="text-sm text-brand-secondary font-semibold">
                      Cantidad: {item.quantity} × {countryInfo?.currency_symbol || '$'}
                      {item.pizza.price.toFixed(countryInfo?.decimal_places || 2)}
                    </p>
                  </div>
                  <div className="font-black text-text">
                    {countryInfo?.currency_symbol || '$'}
                    {(item.pizza.price * item.quantity).toFixed(countryInfo?.decimal_places || 2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-brand-secondary pt-4">
              <div className="flex justify-between items-center text-xl font-black">
                <span className="text-text">Subtotal:</span>
                <span data-testid="cart-subtotal" className="text-brand-primary">
                  {countryInfo?.currency_symbol || '$'}
                  {calculateSubtotal().toFixed(countryInfo?.decimal_places || 2)}
                </span>
              </div>

              {countryCode === 'US' && (
                <p className="text-sm text-brand-secondary font-semibold mt-2">
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
