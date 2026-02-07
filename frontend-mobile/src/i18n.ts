import { useAppStore } from './store/useAppStore';

const DICT: any = {
  es: { catalog:'Catálogo', checkout:'Checkout', profile:'Datos', payment:'Pago', payOnline:'En línea (tarjeta)', payOnDelivery:'Al entregar', cash:'Efectivo', card:'Tarjeta', placeOrder:'Confirmar Pedido', successTitle:'¡Orden Exitosa!', successSubtitle:'Tu pedido está siendo preparado para envío.', backToCatalog:'Volver al catálogo', save:'Guardar' },
  en: { catalog:'Catalog', checkout:'Checkout', profile:'Profile', payment:'Payment', payOnline:'Online (card)', payOnDelivery:'On delivery', cash:'Cash', card:'Card', placeOrder:'Place Order', successTitle:'Order placed!', successSubtitle:'Your order is being prepared for delivery.', backToCatalog:'Back to catalog', save:'Save' },
  de: { catalog:'Katalog', checkout:'Kasse', profile:'Daten', payment:'Zahlung', payOnline:'Online (Karte)', payOnDelivery:'Bei Lieferung', cash:'Bar', card:'Karte', placeOrder:'Bestellen', successTitle:'Bestellung erfolgreich!', successSubtitle:'Deine Bestellung wird vorbereitet.', backToCatalog:'Zum Katalog', save:'Speichern' },
  fr: { catalog:'Catalogue', checkout:'Paiement', profile:'Données', payment:'Paiement', payOnline:'En ligne (carte)', payOnDelivery:'À la livraison', cash:'Espèces', card:'Carte', placeOrder:'Valider', successTitle:'Commande validée !', successSubtitle:'Votre commande est en préparation.', backToCatalog:'Retour', save:'Enregistrer' },
  ja: { catalog:'メニュー', checkout:'購入', profile:'情報', payment:'支払い', payOnline:'オンライン（カード）', payOnDelivery:'配達時', cash:'現金', card:'カード', placeOrder:'注文確定', successTitle:'注文完了！', successSubtitle:'ただいま準備中です。', backToCatalog:'戻る', save:'保存' },
};

export function useT() {
  const lang = useAppStore((s) => s.language) || 'es';
  return (k: string) => DICT[lang]?.[k] ?? DICT.es[k] ?? k;
}
