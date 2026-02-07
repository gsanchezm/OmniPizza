import { useCountryStore } from './store';

const DICT = {
  es: {
    catalog: 'Catálogo',
    checkout: 'Checkout',
    profile: 'Datos',
    logout: 'Salir',
    country: 'País',
    currency: 'Moneda',
    user: 'Usuario',

    deliveryInfo: 'Información de Entrega',
    orderSummary: 'Resumen del Pedido',
    placeOrder: 'Confirmar Pedido',

    payment: 'Pago',
    payOnline: 'En línea (tarjeta)',
    payOnDelivery: 'Al entregar',
    cash: 'Efectivo',
    card: 'Tarjeta',
    cardForm: 'Datos de tarjeta',

    fullName: 'Nombre Completo',
    address: 'Dirección',
    phone: 'Teléfono',
    colonia: 'Colonia',
    tip: 'Propina (opcional)',
    zip: 'ZIP Code',
    plz: 'PLZ',
    prefecture: 'Prefectura',

    save: 'Guardar',
    successTitle: '¡Orden Exitosa!',
    successSubtitle: 'Tu pedido está siendo preparado para envío.',
    backToCatalog: 'Volver al catálogo',
  },

  en: {
    catalog: 'Catalog',
    checkout: 'Checkout',
    profile: 'Profile',
    logout: 'Logout',
    country: 'Country',
    currency: 'Currency',
    user: 'User',

    deliveryInfo: 'Delivery Info',
    orderSummary: 'Order Summary',
    placeOrder: 'Place Order',

    payment: 'Payment',
    payOnline: 'Online (card)',
    payOnDelivery: 'On delivery',
    cash: 'Cash',
    card: 'Card',
    cardForm: 'Card details',

    fullName: 'Full Name',
    address: 'Address',
    phone: 'Phone',
    colonia: 'Neighborhood',
    tip: 'Tip (optional)',
    zip: 'ZIP Code',
    plz: 'PLZ',
    prefecture: 'Prefecture',

    save: 'Save',
    successTitle: 'Order placed!',
    successSubtitle: 'Your order is being prepared for delivery.',
    backToCatalog: 'Back to catalog',
  },

  de: {
    catalog: 'Katalog',
    checkout: 'Kasse',
    profile: 'Daten',
    logout: 'Abmelden',
    country: 'Land',
    currency: 'Währung',
    user: 'Benutzer',

    deliveryInfo: 'Lieferdaten',
    orderSummary: 'Bestellübersicht',
    placeOrder: 'Bestellen',

    payment: 'Zahlung',
    payOnline: 'Online (Karte)',
    payOnDelivery: 'Bei Lieferung',
    cash: 'Bar',
    card: 'Karte',
    cardForm: 'Kartendaten',

    fullName: 'Vollständiger Name',
    address: 'Adresse',
    phone: 'Telefon',
    colonia: 'Stadtteil',
    tip: 'Trinkgeld (optional)',
    zip: 'ZIP Code',
    plz: 'PLZ',
    prefecture: 'Präfektur',

    save: 'Speichern',
    successTitle: 'Bestellung erfolgreich!',
    successSubtitle: 'Deine Bestellung wird für den Versand vorbereitet.',
    backToCatalog: 'Zum Katalog',
  },

  fr: {
    catalog: 'Catalogue',
    checkout: 'Paiement',
    profile: 'Données',
    logout: 'Déconnexion',
    country: 'Pays',
    currency: 'Devise',
    user: 'Utilisateur',

    deliveryInfo: 'Infos de livraison',
    orderSummary: 'Récapitulatif',
    placeOrder: 'Valider la commande',

    payment: 'Paiement',
    payOnline: 'En ligne (carte)',
    payOnDelivery: 'À la livraison',
    cash: 'Espèces',
    card: 'Carte',
    cardForm: 'Détails de la carte',

    fullName: 'Nom complet',
    address: 'Adresse',
    phone: 'Téléphone',
    colonia: 'Quartier',
    tip: 'Pourboire (optionnel)',
    zip: 'Code postal',
    plz: 'PLZ',
    prefecture: 'Préfecture',

    save: 'Enregistrer',
    successTitle: 'Commande validée !',
    successSubtitle: 'Votre commande est en préparation pour l’envoi.',
    backToCatalog: 'Retour au catalogue',
  },

  ja: {
    catalog: 'メニュー',
    checkout: '購入',
    profile: '情報',
    logout: 'ログアウト',
    country: '国',
    currency: '通貨',
    user: 'ユーザー',

    deliveryInfo: '配送情報',
    orderSummary: '注文内容',
    placeOrder: '注文確定',

    payment: '支払い',
    payOnline: 'オンライン（カード）',
    payOnDelivery: '配達時',
    cash: '現金',
    card: 'カード',
    cardForm: 'カード情報',

    fullName: '氏名',
    address: '住所',
    phone: '電話番号',
    colonia: '地区',
    tip: 'チップ（任意）',
    zip: '郵便番号',
    plz: 'PLZ',
    prefecture: '都道府県',

    save: '保存',
    successTitle: '注文完了！',
    successSubtitle: 'ただいま準備中です。',
    backToCatalog: 'メニューへ戻る',
  },
};

export function useT() {
  const lang = useCountryStore((s) => s.language) || 'es';
  return (key) => DICT[lang]?.[key] ?? DICT.es[key] ?? key;
}
