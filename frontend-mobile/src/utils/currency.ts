export const formatCurrency = (amount: number, country: string) => {
  switch (country) {
    case 'MX':
      return `$${amount.toFixed(2)} MXN`;
    case 'US':
      return `$${amount.toFixed(2)}`; // US format standard
    case 'CH':
      return `${amount.toFixed(2)} CHF`; // Swiss format
    case 'JP':
      return `¥${Math.round(amount)}`; // Yen no tiene decimales
    default:
      return `$${amount}`;
  }
};