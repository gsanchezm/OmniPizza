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
    "id": "p01",
    "base_price": 12.99,
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Margherita_pizza.jpg",
    "name": {"en":"Margherita","es":"Margarita","de":"Margherita","fr":"Margherita","ja":"マルゲリータ"},
    "description": {
      "en":"Tomato, mozzarella, basil",
      "es":"Tomate, mozzarella, albahaca",
      "de":"Tomaten, Mozzarella, Basilikum",
      "fr":"Tomate, mozzarella, basilic",
      "ja":"トマト、モッツァレラ、バジル"
    }
  },
  {
    "id": "p02",
    "base_price": 14.99,
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d1/Pepperoni_pizza.jpg",
    "name": {"en":"Pepperoni","es":"Pepperoni","de":"Pepperoni","fr":"Pepperoni","ja":"ペパロニ"},
    "description": {
      "en":"Pepperoni, mozzarella, tomato sauce",
      "es":"Pepperoni, mozzarella, salsa de tomate",
      "de":"Pepperoni, Mozzarella, Tomatensauce",
      "fr":"Pepperoni, mozzarella, sauce tomate",
      "ja":"ペパロニ、モッツァレラ、トマトソース"
    }
  },
  {
    "id": "p03",
    "base_price": 13.99,
    "image": "https://upload.wikimedia.org/wikipedia/commons/e/eb/Hawaiian_pizza.jpg",
    "name": {"en":"Hawaiian","es":"Hawaiana","de":"Hawaii","fr":"Hawaïenne","ja":"ハワイアン"},
    "description": {
      "en":"Ham, pineapple, mozzarella",
      "es":"Jamón, piña, mozzarella",
      "de":"Schinken, Ananas, Mozzarella",
      "fr":"Jambon, ananas, mozzarella",
      "ja":"ハム、パイナップル、モッツァレラ"
    }
  },
  {
    "id": "p04",
    "base_price": 15.49,
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Four_cheese_pizza.jpg",
    "name": {"en":"Four Cheese","es":"Cuatro Quesos","de":"Vier Käse","fr":"Quatre Fromages","ja":"クアトロ・フォルマッジ"},
    "description": {
      "en":"Mozzarella, parmesan, gorgonzola, provolone",
      "es":"Mozzarella, parmesano, gorgonzola, provolone",
      "de":"Mozzarella, Parmesan, Gorgonzola, Provolone",
      "fr":"Mozzarella, parmesan, gorgonzola, provolone",
      "ja":"モッツァレラ、パルメザン、ゴルゴンゾーラ、プロヴォローネ"
    }
  },
  {
    "id": "p05",
    "base_price": 13.49,
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Vegetarian_Pizza.jpg",
    "name": {"en":"Veggie","es":"Vegetariana","de":"Vegetarisch","fr":"Végétarienne","ja":"ベジタリアン"},
    "description": {
      "en":"Mushrooms, peppers, olives, onion",
      "es":"Champiñones, pimientos, aceitunas, cebolla",
      "de":"Pilze, Paprika, Oliven, Zwiebel",
      "fr":"Champignons, poivrons, olives, oignon",
      "ja":"きのこ、ピーマン、オリーブ、玉ねぎ"
    }
  },
  {
    "id": "p06",
    "base_price": 12.49,
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/11/Pizza_marinara.jpg",
    "name": {"en":"Marinara","es":"Marinara","de":"Marinara","fr":"Marinara","ja":"マリナーラ"},
    "description": {
      "en":"Tomato, garlic, oregano",
      "es":"Tomate, ajo, orégano",
      "de":"Tomaten, Knoblauch, Oregano",
      "fr":"Tomate, ail, origan",
      "ja":"トマト、ニンニク、オレガノ"
    }
  },
  {
    "id": "p07",
    "base_price": 16.49,
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Pizza_capricciosa.jpg",
    "name": {"en":"Capricciosa","es":"Caprichosa","de":"Capricciosa","fr":"Capricciosa","ja":"カプリチョーザ"},
    "description": {
      "en":"Ham, mushrooms, artichoke, olives",
      "es":"Jamón, champiñones, alcachofa, aceitunas",
      "de":"Schinken, Pilze, Artischocke, Oliven",
      "fr":"Jambon, champignons, artichaut, olives",
      "ja":"ハム、きのこ、アーティチョーク、オリーブ"
    }
  },
  {
    "id": "p08",
    "base_price": 15.99,
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Pizza_Diavolo.jpg",
    "name": {"en":"Diavola","es":"Diavola","de":"Diavolo","fr":"Diavola","ja":"ディアボラ"},
    "description": {
      "en":"Spicy salami, chili, mozzarella",
      "es":"Salami picante, chile, mozzarella",
      "de":"Scharfe Salami, Chili, Mozzarella",
      "fr":"Salami épicé, piment, mozzarella",
      "ja":"辛いサラミ、唐辛子、モッツァレラ"
    }
  },
  {
    "id": "p09",
    "base_price": 16.99,
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/61/Pizza_Prosciutto.jpg",
    "name": {"en":"Prosciutto","es":"Prosciutto","de":"Prosciutto","fr":"Prosciutto","ja":"プロシュート"},
    "description": {
      "en":"Prosciutto, arugula, parmesan",
      "es":"Prosciutto, arúgula, parmesano",
      "de":"Prosciutto, Rucola, Parmesan",
      "fr":"Prosciutto, roquette, parmesan",
      "ja":"プロシュート、ルッコラ、パルメザン"
    }
  },
  {
    "id": "p10",
    "base_price": 16.49,
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/39/Pizza_quattro_stagioni.jpg",
    "name": {"en":"Quattro Stagioni","es":"Cuatro Estaciones","de":"Vier Jahreszeiten","fr":"Quatre Saisons","ja":"クアトロ・スタジオーニ"},
    "description": {
      "en":"Artichoke, olives, ham, mushrooms",
      "es":"Alcachofa, aceitunas, jamón, champiñones",
      "de":"Artischocke, Oliven, Schinken, Pilze",
      "fr":"Artichaut, olives, jambon, champignons",
      "ja":"アーティチョーク、オリーブ、ハム、きのこ"
    }
  },
  {
    "id": "p11",
    "base_price": 14.49,
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Pizzahalter_auf_Pizza_Funghi.JPG",
    "name": {"en":"Funghi","es":"Funghi","de":"Funghi","fr":"Funghi","ja":"フンギ"},
    "description": {
      "en":"Mushrooms, mozzarella, oregano",
      "es":"Champiñones, mozzarella, orégano",
      "de":"Pilze, Mozzarella, Oregano",
      "fr":"Champignons, mozzarella, origan",
      "ja":"きのこ、モッツァレラ、オレガノ"
    }
  },
  {
    "id": "p12",
    "base_price": 15.99,
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/60/BBQ_CHICKEN_PIZZA.jpg",
    "name": {"en":"BBQ Chicken","es":"Pollo BBQ","de":"BBQ Hähnchen","fr":"Poulet BBQ","ja":"BBQチキン"},
    "description": {
      "en":"Chicken, BBQ sauce, onion, cilantro",
      "es":"Pollo, salsa BBQ, cebolla, cilantro",
      "de":"Hähnchen, BBQ-Sauce, Zwiebel, Koriander",
      "fr":"Poulet, sauce BBQ, oignon, coriandre",
      "ja":"チキン、BBQソース、玉ねぎ、香菜"
    }
  },
]


# Currency conversion rates (from USD)
CURRENCY_RATES = {
    "USD": 1.0,
    "MXN": 17.5,
    "CHF": 0.88,
    "JPY": 149.0
}
