export function buildCheckoutPayload({ countryCode, items, form }) {
  const payload = {
    country_code: countryCode,
    items: items.map((i) => ({
      pizza_id: i.pizza_id,
      quantity: i.quantity,
      size: i.config?.size || "small",
      toppings: i.config?.toppings || [],
    })),
    name: form.name,
    address: form.address,
    phone: form.phone,
  };

  if (countryCode === "MX") {
    payload.colonia = form.colonia;
    if (form.propina) payload.propina = parseFloat(form.propina);
  } else if (countryCode === "US") {
    payload.zip_code = form.zip_code;
  } else if (countryCode === "CH") {
    payload.plz = form.plz;
  } else if (countryCode === "JP") {
    payload.prefectura = form.prefectura;
  }

  return payload;
}
