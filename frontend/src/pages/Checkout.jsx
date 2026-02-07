import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const profile = useProfileStore();
  const lastOrder = useOrderStore((s) => s.lastOrder);
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState('');

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

  const [paymentType, setPaymentType] = useState(PAYMENT.ONLINE_CARD);
  const [card, setCard] = useState({ name: '', number: '', exp: '', cvv: '' });

  // ✅ IMPORTANT: do NOT auto-redirect after order submit clears the cart
  useEffect(() => {
    if (!hasSubmitted && !loading && cartItems.length === 0 && !lastOrder) {
      navigate('/catalog', { replace: true });
    }
  }, [cartItems.length, hasSubmitted, loading, lastOrder, navigate]);

  const subtotal = useMemo(
    () => cartItems.reduce((t, i) => t + (i.pizza.price * i.quantity), 0),
    [cartItems]
  );

  const inputClass =
    "w-full px-4 py-3 border border-border rounded-xl bg-surface-2 text-text " +
    "focus:outline-none focus:ring-2 focus:ring-brand-accent";

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validatePayment = () => {
    if (paymentType !== PAYMENT.ONLINE_CARD) return true;
    if (!card.name || !card.number || !card.exp || !card.cvv) return false;
    if (card.number.replace(/\s/g, '').length < 12) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePayment()) {
      setError('Please complete card details (demo).');
      return;
    }

    setLoading(true);
    setHasSubmitted(true);

    try {
      const payload = {
        country_code: countryCode,
        items: cartItems.map((i) => ({ pizza_id: i.pizza_id, quantity: i.quantity })),
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
      };

      if (countryCode === 'MX') {
        payload.colonia = formData.colonia;
        if (formData.propina) payload.propina = parseFloat(formData.propina);
      } else if (countryCode === 'US') {
        payload.zip_code = formData.zip_code;
      } else if (countryCode === 'CH') {
        payload.plz = formData.plz;
      } else if (countryCode === 'JP') {
        payload.prefectura = formData.prefectura;
      }

      const res = await orderAPI.checkout(payload);

      // ✅ persist last order BEFORE clearing cart
      setLastOrder({ ...res.data, paymentType });

      // ✅ Profile becomes meaningful
      profile.setProfile?.({
        fullName: formData.name,
        address: formData.address,
        phone: formData.phone,
      });

      clearCart();
      navigate('/order-success', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Checkout error');
      setHasSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-brand-primary font-serif mb-8">🛒 {t('checkout')}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="lux-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-2xl font-black text-text font-serif">{t('deliveryInfo')}</h2>
            <Link to="/profile" className="btn-ghost text-sm">{t('editProfile')}</Link>
          </div>

          <p className="text-text-muted text-sm mb-6">{t('profileHint')}</p>

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
              <h3 className="text-xl font-black text-brand-primary font-serif mb-3">{t('payment')}</h3>

              <div className="grid gap-3">
                <label className="lux-radio">
                  <input type="radio" checked={paymentType === PAYMENT.ONLINE_CARD} onChange={() => setPaymentType(PAYMENT.ONLINE_CARD)} />
                  <span className="text-text">{t('payOnline')}</span>
                </label>

                <label className="lux-radio">
                  <input type="radio" checked={paymentType === PAYMENT.DELIVERY_CASH} onChange={() => setPaymentType(PAYMENT.DELIVERY_CASH)} />
                  <span className="text-text">{t('payOnDelivery')} – {t('cash')}</span>
                </label>

                <label className="lux-radio">
                  <input type="radio" checked={paymentType === PAYMENT.DELIVERY_CARD} onChange={() => setPaymentType(PAYMENT.DELIVERY_CARD)} />
                  <span className="text-text">{t('payOnDelivery')} – {t('card')}</span>
                </label>
              </div>

              {paymentType === PAYMENT.ONLINE_CARD && (
                <div className="mt-4 grid gap-3">
                  <div className="text-sm font-extrabold text-text-muted">{t('cardForm')}</div>
                  <input className={inputClass} placeholder="Name on card" value={card.name} onChange={(e) => setCard((p) => ({ ...p, name: e.target.value }))} />
                  <input className={inputClass} placeholder="Card number" value={card.number} onChange={(e) => setCard((p) => ({ ...p, number: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} placeholder="MM/YY" value={card.exp} onChange={(e) => setCard((p) => ({ ...p, exp: e.target.value }))} />
                    <input className={inputClass} placeholder="CVV" value={card.cvv} onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value }))} />
                  </div>
                  <div className="text-xs text-text-muted">
                    * Demo UI only. Card data is not sent to backend.
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="border border-danger text-danger bg-surface-2 px-4 py-3 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? 'Processing…' : t('placeOrder')}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="lux-card rounded-2xl p-6">
          <h2 className="text-2xl font-black text-text font-serif mb-6">{t('orderSummary')}</h2>

          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.pizza_id} className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <div className="font-black text-text">{item.pizza.name}</div>
                  <div className="text-sm text-text-muted">
                    Qty: {item.quantity} × {formatMoney(item.pizza.price)}
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
              <span className="text-text-muted">Subtotal</span>
              <span className="text-brand-primary">{formatMoney(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
