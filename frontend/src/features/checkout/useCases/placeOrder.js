import { createOrderRepository } from "../repositories/orderRepository";
import { buildCheckoutPayload } from "./buildCheckoutPayload";

export async function placeOrder(input, repository = createOrderRepository()) {
  const payload = buildCheckoutPayload(input);
  return repository.placeOrder(payload);
}
