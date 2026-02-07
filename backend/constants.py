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
    {
        "id": "1",
        "name": "Margherita",
        "description": "Tomate, mozzarella, albahaca",
        "base_price": 12.99,
        "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002"
    },
    {
        "id": "2",
        "name": "Pepperoni",
        "description": "Pepperoni, mozzarella, salsa de tomate",
        "base_price": 14.99,
        "image": "https://images.unsplash.com/photo-1628840042765-356cda07504e"
    },
    {
        "id": "3",
        "name": "Hawaiana",
        "description": "Jamón, piña, mozzarella",
        "base_price": 13.99,
        "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"
    },
    {
        "id": "4",
        "name": "Cuatro Quesos",
        "description": "Mozzarella, parmesano, gorgonzola, provolone",
        "base_price": 15.99,
        "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591"
    },
    {
        "id": "5",
        "name": "Vegetariana",
        "description": "Pimientos, champiñones, cebolla, aceitunas",
        "base_price": 13.99,
        "image": "https://images.unsplash.com/photo-1511689660979-10d2b1aada49"
    },
    {
        "id": "6",
        "name": "BBQ Chicken",
        "description": "Pollo, BBQ, cebolla, cilantro",
        "base_price": 16.99,
        "image": "https://images.unsplash.com/photo-1565299507177-b0ac66763828"
    }
]

# Currency conversion rates (from USD)
CURRENCY_RATES = {
    "USD": 1.0,
    "MXN": 17.5,
    "CHF": 0.88,
    "JPY": 149.0
}
