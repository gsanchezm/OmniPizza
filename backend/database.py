from typing import List, Dict, Any, Optional
from constants import PIZZA_CATALOG, COUNTRY_CONFIG, CURRENCY_RATES, CountryCode
import uuid
from datetime import datetime
import random

class InMemoryDB:
    """In-memory database that resets on each restart"""

    def __init__(self):
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}

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
        lang = (language or default_lang_by_country.get(country_code, "en")).lower()

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
        tip: float = 0.0
    ) -> Dict[str, float]:
        country_config = COUNTRY_CONFIG[country_code]
        currency = country_config["currency"]
        conversion_rate = CURRENCY_RATES[currency]
        tax_rate = country_config["tax_rate"]
        decimal_places = country_config.get("decimal_places", 2)

        subtotal = 0.0
        for item in items:
            pizza = next((p for p in PIZZA_CATALOG if p["id"] == item["pizza_id"]), None)
            if pizza:
                converted_price = pizza["base_price"] * conversion_rate
                subtotal += converted_price * item["quantity"]

        tax = subtotal * tax_rate
        total = subtotal + tax + tip

        if decimal_places == 0:
            return {
                "subtotal": round(subtotal),
                "tax": round(tax),
                "tip": round(tip),
                "total": round(total),
                "currency": currency
            }
        else:
            return {
                "subtotal": round(subtotal, decimal_places),
                "tax": round(tax, decimal_places),
                "tip": round(tip, decimal_places),
                "total": round(total, decimal_places),
                "currency": currency
            }

    def should_trigger_error(self, behavior: str) -> bool:
        if behavior == "error":
            return random.random() < 0.5
        return False

db = InMemoryDB()
