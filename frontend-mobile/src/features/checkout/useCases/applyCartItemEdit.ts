import type { CartItem, PizzaConfig } from "../../../store/useAppStore";

/** Same signature web uses: pizza + size + sorted toppings identify a cart line. */
export function cartItemSignature(pizzaId: string, config: PizzaConfig): string {
  return `${pizzaId}|${config.size}|${(config.toppings || []).slice().sort().join(",")}`;
}

/**
 * Apply an edit from the builder to one cart line (mirrors web Checkout's edit flow):
 * if another line already has the edited configuration the two merge (quantities add up,
 * the edited line goes away); otherwise the line is updated in place with its new signature.
 */
export function applyCartItemEdit(
  items: CartItem[],
  id: string,
  config: PizzaConfig,
  unitPrice: number,
): CartItem[] {
  const editing = items.find((i) => i.id === id);
  if (!editing) return items;

  const signature = cartItemSignature(editing.pizza_id, config);
  const other = items.find((i) => i.id !== id && i.signature === signature);

  if (other) {
    return items
      .filter((i) => i.id !== id)
      .map((i) => (i.id === other.id ? { ...i, quantity: i.quantity + editing.quantity } : i));
  }

  return items.map((i) =>
    i.id === id ? { ...i, signature, config, unit_price: unitPrice } : i,
  );
}
