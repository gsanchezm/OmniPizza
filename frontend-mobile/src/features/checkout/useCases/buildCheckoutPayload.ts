import type { CartItem, CountryCode } from "../../../store/useAppStore";
import type { CheckoutPayload } from "../../../types/api";

export interface CheckoutFormState {
  name: string;
  address: string;
  phone: string;
  colonia: string;
  propina: string;
  zip_code: string;
  plz: string;
  prefectura: string;
  card_holder: string;
  card_number: string;
  card_expiry: string;
  card_cvv: string;
}

export function buildCheckoutPayload(input: {
  country: CountryCode;
  cartItems: CartItem[];
  form: CheckoutFormState;
}): CheckoutPayload {
  const { country, cartItems, form } = input;
  const payload: CheckoutPayload = {
    country_code: country,
    items: cartItems.map((i) => ({
      pizza_id: i.pizza_id,
      quantity: i.quantity,
      size: i.config?.size || "small",
      toppings: i.config?.toppings || [],
    })),
    name: form.name.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
  };

  if (country === "MX") {
    payload.colonia = form.colonia.trim();
    if (form.propina) payload.propina = Number(form.propina);
  } else if (country === "US") {
    payload.zip_code = form.zip_code.trim();
  } else if (country === "CH") {
    payload.plz = form.plz.trim();
  } else if (country === "JP") {
    payload.prefectura = form.prefectura.trim();
  }

  return payload;
}
