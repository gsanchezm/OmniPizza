import { orderService } from "../../../services/order.service";
import type { CheckoutPayload } from "../../../types/api";

export function createOrderRepository(service = orderService) {
  return {
    placeOrder(payload: CheckoutPayload) {
      return service.checkout(payload);
    },
  };
}
