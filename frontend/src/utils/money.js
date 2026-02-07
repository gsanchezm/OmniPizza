import { useCountryStore } from '../store';

export function formatMoney(amount) {
  const { locale, currency } = useCountryStore.getState();
  try {
    return new Intl.NumberFormat(locale || 'es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount}`;
  }
}
