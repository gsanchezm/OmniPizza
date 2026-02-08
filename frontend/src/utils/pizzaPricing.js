export function getRateFromPizza(pizza) {
  // base_price = USD, price = local
  const bp = Number(pizza?.base_price);
  const p = Number(pizza?.price);
  if (!bp || bp <= 0 || !p || p <= 0) return 1;
  return p / bp;
}

export function usdToLocalCeil(usdAmount, pizza) {
  const rate = getRateFromPizza(pizza);
  return Math.ceil(Number(usdAmount) * rate);
}

export function computeUnitPrice(pizza, sizeUsd, toppingsCount) {
  const base = Number(pizza.price);
  const sizeAdd = usdToLocalCeil(sizeUsd, pizza);
  const toppingUnit = usdToLocalCeil(1, pizza);
  const toppingsAdd = toppingUnit * toppingsCount;
  const unitPrice = base + sizeAdd + toppingsAdd;
  return { unitPrice, sizeAdd, toppingUnit, toppingsAdd };
}
