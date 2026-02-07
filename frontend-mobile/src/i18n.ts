import { useAppStore } from "./store/useAppStore";

const DICT: Record<string, Record<string, string>> = {
  en: {
    catalog: "Catalog",
    checkout: "Checkout",
    profile: "Profile",
    payment: "Payment",
    payOnline: "Online (card)",
    payOnDelivery: "On delivery",
    cash: "Cash",
    card: "Card",
    placeOrder: "Place Order",
    successTitle: "Order placed!",
    successSubtitle: "Your order is being prepared for delivery.",
    backToCatalog: "Back to catalog",
    save: "Save",
    deliveryInfo: "Delivery Details",
    orderSummary: "Order Summary",
  },

  es: {
    catalog: "Catálogo",
    checkout: "Checkout",
    profile: "Datos",
    payment: "Pago",
    payOnline: "En línea (tarjeta)",
    payOnDelivery: "Al entregar",
    cash: "Efectivo",
    card: "Tarjeta",
    placeOrder: "Confirmar pedido",
    successTitle: "¡Orden exitosa!",
    successSubtitle: "Tu pedido está siendo preparado para envío.",
    backToCatalog: "Volver al catálogo",
    save: "Guardar",
    deliveryInfo: "Información de entrega",
    orderSummary: "Resumen del pedido",
  },

  de: {
    catalog: "Katalog",
    checkout: "Kasse",
    profile: "Daten",
    payment: "Zahlung",
    payOnline: "Online (Karte)",
    payOnDelivery: "Bei Lieferung",
    cash: "Bar",
    card: "Karte",
    placeOrder: "Bestellen",
    successTitle: "Bestellung erfolgreich!",
    successSubtitle: "Deine Bestellung wird vorbereitet.",
    backToCatalog: "Zum Katalog",
    save: "Speichern",
    deliveryInfo: "Lieferdetails",
    orderSummary: "Bestellübersicht",
  },

  fr: {
    catalog: "Catalogue",
    checkout: "Paiement",
    profile: "Profil",
    payment: "Paiement",
    payOnline: "En ligne (carte)",
    payOnDelivery: "À la livraison",
    cash: "Espèces",
    card: "Carte",
    placeOrder: "Valider la commande",
    successTitle: "Commande validée !",
    successSubtitle: "Votre commande est en préparation.",
    backToCatalog: "Retour au catalogue",
    save: "Enregistrer",
    deliveryInfo: "Détails de livraison",
    orderSummary: "Récapitulatif",
  },

  ja: {
    catalog: "メニュー",
    checkout: "購入",
    profile: "情報",
    payment: "支払い",
    payOnline: "オンライン（カード）",
    payOnDelivery: "配達時",
    cash: "現金",
    card: "カード",
    placeOrder: "注文確定",
    successTitle: "注文完了！",
    successSubtitle: "ただいま準備中です。",
    backToCatalog: "メニューへ戻る",
    save: "保存",
    deliveryInfo: "配送情報",
    orderSummary: "注文内容",
  },
};

export function useT() {
  const language = useAppStore((s) => s.language) || "en";

  return (key: string) => {
    return DICT[language]?.[key] ?? DICT.en[key] ?? key;
  };
}
