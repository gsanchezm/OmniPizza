import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../api';
import { useCartStore, useCountryStore, useProfileStore, useOrderStore } from '../store';
import { useT } from '../i18n';
import { formatMoney } from '../utils/money';

const PAYMENT = {
  ONLINE_CARD: 'ONLINE_CARD',
  DELIVERY_CASH: 'DELIVERY_CASH',
  DELIVERY_CARD: 'DELIVERY_CARD',
};

export default function Checkout() {
  const t = useT();
  const navigate = useNavigate();

  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const countryCode = useCountryStore((s) => s.countryCode);
  const countryInfo = useCountryStore((s) => s.countryInfo);

  const profile = useProfileStore();
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // delivery form
  const [formData, setFormData] = useState({
    name: profile.fullName || '',
    address: profile.address || '',
    phone: profile.phone || '',
    colonia: '',
    propina: '',
    zip_code: '',
    plz: '',
    prefectura: '',
  });

  // payment
  const [paymentType, setPaymentType] = useState(PAYMENT.ONLINE_CARD);
  const [card, setCard] = useState({ name: '', number: '', exp: '', cvv: '' });

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) navigate('/catalog', { replace: true });
  }, [cartItems, navigate]);

  const inputClass =
    "w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text " +
    "focus:outline-none focus:ring-2 focus:ring-brand-accent";

  const subtotal = useMemo(() => {
    return (cartItems || []).reduce((total, item) => total + (item.pizza.price * item.quantity), 0);
  }, [cartItems]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validatePayment = () => {
    if (paymentType !== PAYMENT.ONLINE_CARD) return true;
    // validación ligera (UI)
    if (!card.name || !card.number || !card.exp || !card.cvv) return false;
    if (card.number.replace(/\s/g, '').length < 12) return false;
    return true;
    // No enviamos tarjeta al backend.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePayment()) {
      setError('Payment: please complete card details.');
      return;
    }

    setLoading(true);

    try {
      const checkoutData = {
        country_code: countryCode,
        items: cartItems.map((item) => ({
          pizza_id: item.pizza_id,
          quantity: item.quantity,
        })),
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
      };

      // Market-specific fields
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

      // Guardamos orden para Success (y opcionalmente guarda paymentType en profile/store si quieres)
      setLastOrder({ ...response.data, paymentType });

      // Guardar datos base en Profile para reuso
      profile.setProfile?.({
        fullName: formData.name,
        address: formData.address,
        phone: formData.phone,
      });

      clearCart();
      navigate('/order-success', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Error al procesar la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-brand-accent mb-8">🛒 {t('checkout')}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="lux-card rounded-2xl p-6">
          <h2 className="text-2xl font-black text-text mb-6">{t('deliveryInfo')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-extrabold text-text-muted mb-2">{t('fullName')} *</label>
              <input name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-text-muted mb-2">{t('address')} *</label>
              <input name="address" value={formData.address} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-text-muted mb-2">{t('phone')} *</label>
              <input name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} />
            </div>

            {/* Country-specific */}
            {countryCode === 'MX' && (
              <>
                <div>
                  <label className="block text-sm font-extrabold text-text-muted mb-2">{t('colonia')} *</label>
                  <input name="colonia" value={formData.colonia} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-text-muted mb-2">{t('tip')}</label>
                  <input type="number" name="propina" value={formData.propina} onChange={handleChange} step="0.01" min="0" className={inputClass} />
                </div>
              </>
            )}

            {countryCode === 'US' && (
              <div>
                <label className="block text-sm font-extrabold text-text-muted mb-2">{t('zip')} *</label>
                <input name="zip_code" value={formData.zip_code} onChange={handleChange} required pattern="\d{5}" maxLength="5" className={inputClass} />
              </div>
            )}

            {countryCode === 'CH' && (
              <div>
                <label className="block text-sm font-extrabold text-text-muted mb-2">{t('plz')} *</label>
                <input name="plz" value={formData.plz} onChange={handleChange} required className={inputClass} />
              </div>
            )}

            {countryCode === 'JP' && (
              <div>
                <label className="block text-sm font-extrabold text-text-muted mb-2">{t('prefecture')} *</label>
                <input name="prefectura" value={formData.prefectura} onChange={handleChange} required className={inputClass} />
              </div>
            )}

            {/* Payment */}
            <div className="pt-2">
              <h3 className="text-xl font-black text-brand-accent mb-3">{t('payment')}</h3>

              <div className="grid gap-3">
                <label className="lux-radio">
                  <input
                    type="radio"
                    checked={paymentType === PAYMENT.ONLINE_CARD}
                    onChange={() => setPaymentType(PAYMENT.ONLINE_CARD)}
                  />
                  <span className="text-text">{t('payOnline')}</span>
                </label>

                <label className="lux-radio">
                  <input
                    type="radio"
                    checked={paymentType === PAYMENT.DELIVERY_CASH}
                    onChange={() => setPaymentType(PAYMENT.DELIVERY_CASH)}
                  />
                  <span className="text-text">{t('payOnDelivery')} – {t('cash')}</span>
                </label>

                <label className="lux-radio">
                  <input
                    type="radio"
                    checked={paymentType === PAYMENT.DELIVERY_CARD}
                    onChange={() => setPaymentType(PAYMENT.DELIVERY_CARD)}
                  />
                  <span className="text-text">{t('payOnDelivery')} – {t('card')}</span>
                </label>
              </div>

              {paymentType === PAYMENT.ONLINE_CARD && (
                <div className="mt-4 grid gap-3">
                  <div className="text-sm font-extrabold text-text-muted">{t('cardForm')}</div>
                  <input
                    className={inputClass}
                    placeholder="Name on card"
                    value={card.name}
                    onChange={(e) => setCard((p) => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className={inputClass}
                    placeholder="Card number"
                    value={card.number}
                    onChange={(e) => setCard((p) => ({ ...p, number: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={inputClass}
                      placeholder="MM/YY"
                      value={card.exp}
                      onChange={(e) => setCard((p) => ({ ...p, exp: e.target.value }))}
                    />
                    <input
                      className={inputClass}
                      placeholder="CVV"
                      value={card.cvv}
                      onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value }))}
                    />
                  </div>

                  <div className="text-xs text-text-muted">
                    * Demo UI only. Card data is not sent to backend.
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="border border-brand-primary text-brand-primary bg-surface-2 px-4 py-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Procesando...' : t('placeOrder')}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="lux-card rounded-2xl p-6">
          <h2 className="text-2xl font-black text-text mb-6">{t('orderSummary')}</h2>

          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.pizza_id} className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <div className="font-black text-text">{item.pizza.name}</div>
                  <div className="text-sm text-text-muted">
                    Cantidad: {item.quantity} × {formatMoney(item.pizza.price)}
                  </div>
                </div>
                <div className="font-black text-text">
                  {formatMoney(item.pizza.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center text-xl font-black">
              <span className="text-text-muted">Subtotal:</span>
              <span className="text-brand-primary">{formatMoney(subtotal)}</span>
            </div>

            {countryCode === 'US' && (
              <p className="text-sm text-text-muted mt-2">
                * Taxes will be calculated by backend.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
