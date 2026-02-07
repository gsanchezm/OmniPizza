import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store';
import { useT } from '../i18n';
import { formatMoney } from '../utils/money';

export default function OrderSuccess() {
  const t = useT();
  const navigate = useNavigate();
  const order = useOrderStore((s) => s.lastOrder);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="lux-card p-6 rounded-2xl">
          <p className="text-text-muted">No order found.</p>
          <button className="btn-gold mt-4" onClick={() => navigate('/catalog')}>
            {t('backToCatalog')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="lux-card p-8 rounded-2xl">
        <h1 className="text-4xl font-black text-brand-accent mb-2">{t('successTitle')}</h1>
        <p className="text-text-muted mb-6">{t('successSubtitle')}</p>

        <div className="border border-border rounded-xl p-4 mb-6">
          <div className="text-text-muted text-sm">Order ID</div>
          <div className="text-2xl font-black">{order.order_id}</div>
        </div>

        <div className="grid gap-2 text-lg">
          <div className="flex justify-between">
            <span className="text-text-muted">Subtotal</span>
            <span className="font-bold">{formatMoney(order.subtotal)}</span>
          </div>
          {order.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">Tax</span>
              <span className="font-bold">{formatMoney(order.tax)}</span>
            </div>
          )}
          {order.tip > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">Tip</span>
              <span className="font-bold">{formatMoney(order.tip)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 mt-2">
            <span className="text-text-muted">Total</span>
            <span className="font-black text-brand-primary">{formatMoney(order.total)}</span>
          </div>
        </div>

        <div className="mt-8">
          <button className="btn-gold" onClick={() => navigate('/catalog')}>
            {t('backToCatalog')}
          </button>
        </div>
      </div>
    </div>
  );
}
