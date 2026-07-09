export function buildCheckoutPayload({ countryCode, items, form }) {
  const tipFieldByCountry = {
    MX: "propina",
    US: "tip",
    CH: "trinkgeld",
    JP: "chip",
    SA: "baksheesh",
  };
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
    payment_method: form.payment_method,
  };

  if (form.propina !== undefined && form.propina !== null && form.propina !== "") {
    payload[tipFieldByCountry[countryCode]] = parseFloat(form.propina);
  }

  if (countryCode === "MX") {
    payload.colonia = form.colonia;
    if (form.zip_code) payload.zip_code = form.zip_code;
  } else if (countryCode === "US") {
    payload.zip_code = form.zip_code;
  } else if (countryCode === "CH") {
    payload.plz = form.plz;
  } else if (countryCode === "JP") {
    payload.prefectura = form.prefectura;
  } else if (countryCode === "SA") {
    payload.district = form.district;
  }

  return payload;
}
