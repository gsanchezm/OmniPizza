from enum import Enum
from typing import Literal

class UserBehavior(str, Enum):
    STANDARD = "standard"
    LOCKED_OUT = "locked_out"
    PROBLEM = "problem"
    PERFORMANCE_GLITCH = "performance_glitch"
    ERROR = "error"

class CountryCode(str, Enum):
    MX = "MX"
    US = "US"
    CH = "CH"
    JP = "JP"

# Predefined test users
TEST_USERS = {
    "standard_user": {
        "username": "standard_user",
        "password": "pizza123",
        "behavior": UserBehavior.STANDARD,
        "description": "Usuario normal, flujo sin errores"
    },
    "locked_out_user": {
        "username": "locked_out_user",
        "password": "pizza123",
        "behavior": UserBehavior.LOCKED_OUT,
        "description": "Error de login: Sorry, this user has been locked out"
    },
    "problem_user": {
        "username": "problem_user",
        "password": "pizza123",
        "behavior": UserBehavior.PROBLEM,
        "description": "UI muestra imágenes rotas o precios en $0"
    },
    "performance_glitch_user": {
        "username": "performance_glitch_user",
        "password": "pizza123",
        "behavior": UserBehavior.PERFORMANCE_GLITCH,
        "description": "Todas las llamadas al API tienen un delay de 3 segundos"
    },
    "error_user": {
        "username": "error_user",
        "password": "pizza123",
        "behavior": UserBehavior.ERROR,
        "description": "El botón de Checkout lanza un error 500 al azar"
    }
}

# Country-specific configurations
COUNTRY_CONFIG = {
    CountryCode.MX: {
        "currency": "MXN",
        "currency_symbol": "$",
        "required_fields": ["colonia"],
        "optional_fields": ["propina"],
        "tax_rate": 0.0,
        "languages": ["es"]
    },
    CountryCode.US: {
        "currency": "USD",
        "currency_symbol": "$",
        "required_fields": ["zip_code"],
        "optional_fields": [],
        "tax_rate": 0.08,
        "languages": ["en"],
        "zip_code_pattern": r"^\d{5}$"
    },
    CountryCode.CH: {
        "currency": "CHF",
        "currency_symbol": "CHF",
        "required_fields": ["plz"],
        "optional_fields": [],
        "tax_rate": 0.0,
        "languages": ["de", "fr"]
    },
    CountryCode.JP: {
        "currency": "JPY",
        "currency_symbol": "¥",
        "required_fields": ["prefectura"],
        "optional_fields": [],
        "tax_rate": 0.0,
        "languages": ["ja"],
        "decimal_places": 0
    }
}

# Pizza catalog (base prices in USD, will be converted)
PIZZA_CATALOG = [
    {"id": "p01", "name": "Margherita", "description": "Tomato, mozzarella, basil", "base_price": 12.99, "image": "https://picsum.photos/seed/omnipizza-margherita/900/600"},
    {"id": "p02", "name": "Pepperoni", "description": "Pepperoni, mozzarella, tomato sauce", "base_price": 14.99, "image": "https://picsum.photos/seed/omnipizza-pepperoni/900/600"},
    {"id": "p03", "name": "Hawaiian", "description": "Ham, pineapple, mozzarella", "base_price": 13.99, "image": "https://picsum.photos/seed/omnipizza-hawaiian/900/600"},
    {"id": "p04", "name": "Four Cheese", "description": "Mozzarella, parmesan, gorgonzola, provolone", "base_price": 15.49, "image": "https://picsum.photos/seed/omnipizza-4cheese/900/600"},
    {"id": "p05", "name": "Veggie", "description": "Mushrooms, peppers, olives, onion", "base_price": 13.49, "image": "https://picsum.photos/seed/omnipizza-veggie/900/600"},
    {"id": "p06", "name": "BBQ Chicken", "description": "Chicken, BBQ sauce, onion, cilantro", "base_price": 15.99, "image": "https://picsum.photos/seed/omnipizza-bbq/900/600"},
    {"id": "p07", "name": "Meat Lovers", "description": "Pepperoni, ham, sausage, bacon", "base_price": 16.99, "image": "https://picsum.photos/seed/omnipizza-meat/900/600"},
    {"id": "p08", "name": "Diavola", "description": "Spicy salami, chili, mozzarella", "base_price": 15.49, "image": "https://picsum.photos/seed/omnipizza-diavola/900/600"},
    {"id": "p09", "name": "Truffle Mushroom", "description": "Mushrooms, truffle oil, mozzarella", "base_price": 17.49, "image": "https://picsum.photos/seed/omnipizza-truffle/900/600"},
    {"id": "p10", "name": "Prosciutto & Arugula", "description": "Prosciutto, arugula, parmesan", "base_price": 17.99, "image": "https://picsum.photos/seed/omnipizza-prosciutto/900/600"},
    {"id": "p11", "name": "Pesto Supreme", "description": "Pesto, cherry tomato, mozzarella", "base_price": 14.49, "image": "https://picsum.photos/seed/omnipizza-pesto/900/600"},
    {"id": "p12", "name": "Chicken Alfredo", "description": "Chicken, alfredo sauce, mozzarella", "base_price": 16.49, "image": "https://picsum.photos/seed/omnipizza-alfredo/900/600"},
]

# Currency conversion rates (from USD)
CURRENCY_RATES = {
    "USD": 1.0,
    "MXN": 17.5,
    "CHF": 0.88,
    "JPY": 149.0
}
