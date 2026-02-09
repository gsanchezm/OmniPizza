import { useCountryStore } from './store';

const DICT = {
  en: {
    catalog: 'Catalog',
    checkout: 'Checkout',
    profile: 'Profile',
    lastOrder: 'Last order',
    logout: 'Logout',
    user: 'User',
    market: 'Market',
    language: 'Language',
    currency: 'Currency',
    cart: 'Cart',
  },

  es: {
    catalog: 'Catálogo',
    checkout: 'Finalizar Compra',
    profile: 'Perfil',
    lastOrder: 'Última orden',
    logout: 'Salir',
    user: 'Usuario',
    market: 'Mercado',
    language: 'Idioma',
    currency: 'Moneda',
    cart: 'Carrito',
  },

  de: {
    catalog: 'Katalog',
    checkout: 'Kasse',
    profile: 'Profil',
    lastOrder: 'Letzte Bestellung',
    logout: 'Abmelden',
    user: 'Benutzer',
    market: 'Markt',
    language: 'Sprache',
    currency: 'Währung',
    cart: 'Warenkorb',
  },

  fr: {
    catalog: 'Catalogue',
    checkout: 'Paiement',
    profile: 'Profil',
    lastOrder: 'Dernière commande',
    logout: 'Déconnexion',
    user: 'Utilisateur',
    market: 'Marché',
    language: 'Langue',
    currency: 'Devise',
    cart: 'Panier',
  },

  ja: {
    catalog: 'カタログ',
    checkout: 'チェックアウト',
    profile: 'プロフィール',
    lastOrder: '前回の注文',
    logout: 'ログアウト',
    user: 'ユーザー',
    market: 'マーケット',
    language: '言語',
    currency: '通貨',
    cart: 'カート',
  },
};

export function useT() {
  const lang = useCountryStore((s) => s.language) || 'en';
  return (key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key;
}