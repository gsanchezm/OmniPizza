from typing import List, Dict, Any, Optional
from constants import PIZZA_CATALOG, COUNTRY_CONFIG, CURRENCY_RATES, CountryCode
import uuid
from datetime import datetime
import random
import math

SIZE_UPCHARGE_USD = {
    "small": 0,
    "medium": 3,
    "large": 4,
    "family": 5,
}
TOPPING_UPCHARGE_USD = 1


def convert_usd_amount(
    usd_amount: float,
    conversion_rate: float,
    decimal_places: int,
) -> float:
    converted = usd_amount * conversion_rate
    if decimal_places == 0:
        return float(round(converted))
    return round(converted, decimal_places)


def round_currency_amount(
    amount: float,
    decimal_places: int,
) -> float:
    if decimal_places == 0:
        return float(round(amount))
    return round(amount, decimal_places)

class InMemoryDB:
    """In-memory database that resets on each restart"""

    def __init__(self):
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _ensure_session(self, username: str) -> Dict[str, Any]:
        session = self.sessions.get(username)
        if session is None:
            session = {
                "username": username,
                "country_code": CountryCode.MX.value,
                "cart_items": [],
                "updated_at": datetime.utcnow(),
            }
            self.sessions[username] = session
        return session

    def create_order(self, order_data: Dict[str, Any]) -> str:
        order_id = f"ORDER-{uuid.uuid4().hex[:8].upper()}"
        order_data["order_id"] = order_id
        order_data["timestamp"] = datetime.utcnow()
        order_data["status"] = "pending"
        self.orders[order_id] = order_data
        return order_id

    def get_order(self, order_id: str) -> Dict[str, Any]:
        return self.orders.get(order_id)

    def get_user_orders(self, username: str) -> List[Dict[str, Any]]:
        return [order for order in self.orders.values() if order.get("username") == username]

    def set_test_market(self, username: str, country_code: CountryCode) -> Dict[str, Any]:
        session = self._ensure_session(username)
        session["country_code"] = country_code.value
        session["updated_at"] = datetime.utcnow()
        return session

    def set_test_cart(self, username: str, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        session = self._ensure_session(username)
        session["cart_items"] = [item.copy() for item in items]
        session["updated_at"] = datetime.utcnow()
        return session

    def reset_test_session(self, username: str) -> None:
        self.sessions.pop(username, None)

    def get_test_session(self, username: str) -> Dict[str, Any]:
        return self._ensure_session(username)

    def get_enriched_cart(
        self,
        username: str,
        country_code: CountryCode,
        behavior: str = "standard",
        language: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        session = self._ensure_session(username)
        cart_items = session["cart_items"]

        country_config = COUNTRY_CONFIG[country_code]
        currency = country_config["currency"]
        currency_symbol = country_config["currency_symbol"]
        conversion_rate = CURRENCY_RATES[currency]
        decimal_places = country_config.get("decimal_places", 2)

        default_lang = {"MX": "es", "US": "en", "CH": "de", "JP": "ja"}
        cc = country_code.value if hasattr(country_code, "value") else str(country_code)
        lang = (language or default_lang.get(cc, "en")).lower()

        enriched: List[Dict[str, Any]] = []
        for item in cart_items:
            pizza = next((p for p in PIZZA_CATALOG if p["id"] == item["pizza_id"]), None)
            if not pizza:
                continue

            name_val = pizza.get("name")
            if isinstance(name_val, dict):
                name = name_val.get(lang) or name_val.get("en") or next(iter(name_val.values()))
            else:
                name = name_val

            converted_price = pizza["base_price"] * conversion_rate

            if behavior == "problem":
                price = 0.0
                image = "https://broken-image-url.com/404.jpg"
            else:
                if decimal_places == 0:
                    price = round(converted_price)
                else:
                    price = round(converted_price, decimal_places)
                image = pizza["image"]

            enriched.append({
                "pizza_id": item["pizza_id"],
                "name": name,
                "size": item.get("size", "small"),
                "quantity": item["quantity"],
                "price": price,
                "base_price": pizza["base_price"],
                "currency": currency,
                "currency_symbol": currency_symbol,
                "image": image,
            })

        return enriched

    # ✅ UPDATED: supports language + translation
    def get_catalog(
        self,
        country_code: CountryCode,
        behavior: str = "standard",
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        country_config = COUNTRY_CONFIG[country_code]
        currency = country_config["currency"]
        currency_symbol = country_config["currency_symbol"]
        conversion_rate = CURRENCY_RATES[currency]
        decimal_places = country_config.get("decimal_places", 2)

        default_lang_by_country = {"MX": "es", "US": "en", "CH": "de", "JP": "ja"}
        cc = country_code.value if hasattr(country_code, "value") else str(country_code)
        lang = (language or default_lang_by_country.get(cc, "en")).lower()

        catalog: List[Dict[str, Any]] = []

        for pizza in PIZZA_CATALOG:
            pizza_copy = pizza.copy()

            # ✅ Translate name/description if they are dicts
            name_val = pizza.get("name")
            desc_val = pizza.get("description")

            if isinstance(name_val, dict):
                pizza_copy["name"] = name_val.get(lang) or name_val.get("en") or next(iter(name_val.values()))
            else:
                pizza_copy["name"] = name_val

            if isinstance(desc_val, dict):
                pizza_copy["description"] = desc_val.get(lang) or desc_val.get("en") or next(iter(desc_val.values()))
            else:
                pizza_copy["description"] = desc_val

            # Convert price to country currency
            converted_price = pizza["base_price"] * conversion_rate

            # Apply behavior modifications
            if behavior == "problem":
                pizza_copy["price"] = 0.0
                pizza_copy["image"] = "https://broken-image-url.com/404.jpg"
            else:
                if decimal_places == 0:
                    pizza_copy["price"] = round(converted_price)
                else:
                    pizza_copy["price"] = round(converted_price, decimal_places)

            pizza_copy["currency"] = currency
            pizza_copy["currency_symbol"] = currency_symbol

            catalog.append(pizza_copy)

        return catalog

    def calculate_order_total(
        self,
        items: List[Dict[str, Any]],
        country_code: CountryCode,
        tip_percentage: float = 0.0
    ) -> Dict[str, float]:
        country_config = COUNTRY_CONFIG[country_code]
        currency = country_config["currency"]
        conversion_rate = CURRENCY_RATES[currency]
        tax_rate = country_config["tax_rate"]
        decimal_places = country_config.get("decimal_places", 2)
        delivery_fee = convert_usd_amount(
            country_config["delivery_fee_usd"],
            conversion_rate,
            decimal_places,
        )

        subtotal = 0.0
        for item in items:
            pizza = next((p for p in PIZZA_CATALOG if p["id"] == item["pizza_id"]), None)
            if pizza:
                converted_price = pizza["base_price"] * conversion_rate
                if decimal_places == 0:
                    base_price = round(converted_price)
                else:
                    base_price = round(converted_price, decimal_places)

                rate = base_price / pizza["base_price"] if pizza["base_price"] > 0 else 1
                size_key = str(item.get("size", "small")).lower()
                size_add = math.ceil(SIZE_UPCHARGE_USD.get(size_key, 0) * rate)
                topping_unit = math.ceil(TOPPING_UPCHARGE_USD * rate)
                toppings = item.get("toppings") or []
                toppings_add = topping_unit * len(toppings)
                unit_price = base_price + size_add + toppings_add

                subtotal += unit_price * item["quantity"]

        subtotal = round_currency_amount(subtotal, decimal_places)
        tax = round_currency_amount(subtotal * tax_rate, decimal_places)
        tip = round_currency_amount(subtotal * (tip_percentage / 100), decimal_places)
        total = round_currency_amount(subtotal + delivery_fee + tax + tip, decimal_places)

        return {
            "subtotal": subtotal,
            "delivery_fee": round_currency_amount(delivery_fee, decimal_places),
            "tax_rate": tax_rate,
            "tip_percentage": round(tip_percentage, 2),
            "tax": tax,
            "tip": tip,
            "total": total,
            "currency": currency
        }

    def should_trigger_error(self, behavior: str) -> bool:
        if behavior == "error":
            return random.random() < 0.5
        return False

db = InMemoryDB()
