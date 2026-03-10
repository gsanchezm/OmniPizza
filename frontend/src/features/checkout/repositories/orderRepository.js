import { orderService } from "../../../services/order.service";

export function createOrderRepository(service = orderService) {
  return {
    placeOrder(payload) {
      return service.checkout(payload);
    },
  };
}
