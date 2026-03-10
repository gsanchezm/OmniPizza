import { createOrderRepository } from "../repositories/orderRepository";
import { buildCheckoutPayload, type CheckoutFormState } from "./buildCheckoutPayload";
import type { CartItem, CountryCode } from "../../../store/useAppStore";

export async function placeOrder(
  input: {
    country: CountryCode;
    cartItems: CartItem[];
    form: CheckoutFormState;
  },
  repository = createOrderRepository(),
) {
  const payload = buildCheckoutPayload(input);
  return repository.placeOrder(payload);
}
