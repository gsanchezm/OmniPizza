from typing import List, Dict, Any, Optional
from constants import (
    PIZZA_CATALOG, COUNTRY_CONFIG, CURRENCY_RATES, CountryCode,
    A11Y_GLITCH_MODES, A11Y_GLITCH_LANGS,
)
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
# Index the catalog by id once so per-item lookups are O(1) instead of a
# linear scan of PIZZA_CATALOG on every cart item.
PIZZA_BY_ID: Dict[str, Dict[str, Any]] = {pizza["id"]: pizza for pizza in PIZZA_CATALOG}


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


_DEFAULT_LANG_BY_COUNTRY = {"MX": "es", "US": "en", "CH": "de", "JP": "ja", "SA": "ar"}


def _resolve_language(country_code, language: Optional[str]) -> str:
    cc = country_code.value if hasattr(country_code, "value") else str(country_code)
    return (language or _DEFAULT_LANG_BY_COUNTRY.get(cc, "en")).lower()


def _translate_field(value, lang: str):
    if isinstance(value, dict):
        return value.get(lang) or value.get("en") or next(iter(value.values()))
    return value


def _a11y_glitch_text(raw_value, lang: str, mode: str, field: str):
    """Apply the a11y_glitch_user failure `mode` to one localized field.
    `raw_value` is the pre-translation dict (or scalar) as stored in
    PIZZA_CATALOG — needed so `wrong_lang` can pick a *different* language's
    text, not just mutate the already-resolved string."""
    translated = _translate_field(raw_value, lang)

    if mode == "missing_name":
        return "" if field == "name" else translated

    if mode == "wrong_lang":
        if not isinstance(raw_value, dict):
            return translated
        other_langs = [l for l in A11Y_GLITCH_LANGS if l != lang and l in raw_value]
        wrong_lang = random.choice(other_langs) if other_langs else lang
        return raw_value.get(wrong_lang, translated)

    if mode == "extreme_text":
        return " ".join([str(translated)] * 15)

    return translated


def _convert_price(base_price_usd: float, conversion_rate: float, decimal_places: int):
    converted = base_price_usd * conversion_rate
    return round(converted) if decimal_places == 0 else round(converted, decimal_places)


class InMemoryDB:
    """In-memory database that resets on each restart"""

    def __init__(self):
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.user_profiles: Dict[str, Dict[str, Any]] = {}

    def _ensure_user_profile(self, session_id: str, username: str) -> Dict[str, Any]:
        profile = self.user_profiles.get(session_id)
        if profile is None:
            profile = {
                "username": username,
                "premium": True,
                "full_name": "",
                "phone": "",
                "address": "",
                "notes": "",
                "birthday": "",
            }
            self.user_profiles[session_id] = profile
        return profile

    def get_user_profile(self, session_id: str, username: str) -> Dict[str, Any]:
        return self._ensure_user_profile(session_id, username)

    def update_user_profile(self, session_id: str, username: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        profile = self._ensure_user_profile(session_id, username)
        for key, value in patch.items():
            if value is None:
                continue
            profile[key] = value
        return profile

    def reset_user_profile(self, session_id: str, username: str) -> Dict[str, Any]:
        """Reset the current session's editable profile to the deterministic
        default. Profiles are keyed by session_id (a per-login JWT claim), so
        this only clears the caller's own session and cannot affect a
        concurrent session logged in under the same username."""
        self.user_profiles.pop(session_id, None)
        return self._ensure_user_profile(session_id, username)

    def seed_user_profile(self, session_id: str, username: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Replace the profile with a deterministic baseline: default values
        overlaid with `fields`. Unspecified fields revert to default, so the
        result depends only on this call, not on prior saves."""
        self.user_profiles.pop(session_id, None)
        profile = self._ensure_user_profile(session_id, username)
        for key, value in fields.items():
            if value is None:
                continue
            profile[key] = value
        return profile

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

        lang = _resolve_language(country_code, language)
        a11y_mode = random.choice(A11Y_GLITCH_MODES) if behavior == "a11y_glitch" else None

        enriched: List[Dict[str, Any]] = []
        for item in cart_items:
            pizza = PIZZA_BY_ID.get(item["pizza_id"])
            if not pizza:
                continue

            if behavior == "a11y_glitch":
                name = _a11y_glitch_text(pizza.get("name"), lang, a11y_mode, "name")
            else:
                name = _translate_field(pizza.get("name"), lang)

            if behavior == "problem":
                price = 0.0
                image = "https://broken-image-url.com/404.jpg"
            else:
                price = _convert_price(pizza["base_price"], conversion_rate, decimal_places)
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

        lang = _resolve_language(country_code, language)
        a11y_mode = random.choice(A11Y_GLITCH_MODES) if behavior == "a11y_glitch" else None

        catalog: List[Dict[str, Any]] = []

        for pizza in PIZZA_CATALOG:
            pizza_copy = pizza.copy()

            if behavior == "a11y_glitch":
                pizza_copy["name"] = _a11y_glitch_text(pizza.get("name"), lang, a11y_mode, "name")
                pizza_copy["description"] = _a11y_glitch_text(pizza.get("description"), lang, a11y_mode, "description")
            else:
                pizza_copy["name"] = _translate_field(pizza.get("name"), lang)
                pizza_copy["description"] = _translate_field(pizza.get("description"), lang)

            # Convert price to country currency; problem users get $0 + broken image
            if behavior == "problem":
                pizza_copy["price"] = 0.0
                pizza_copy["image"] = "https://broken-image-url.com/404.jpg"
            else:
                pizza_copy["price"] = _convert_price(pizza["base_price"], conversion_rate, decimal_places)

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
            pizza = PIZZA_BY_ID.get(item["pizza_id"])
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
        if behavior in ("error", "security_glitch"):
            return random.random() < 0.5
        return False

db = InMemoryDB()
