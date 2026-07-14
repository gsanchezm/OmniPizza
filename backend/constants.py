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
    SA = "SA"

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
        "optional_fields": ["propina", "zip_code"],
        "tip_field": "propina",
        "tip_percentages": [0, 5, 10, 15],
        "delivery_fee_usd": 2.0,
        "tax_rate": 0.16,
        "languages": ["es"]
    },
    CountryCode.US: {
        "currency": "USD",
        "currency_symbol": "$",
        "required_fields": ["zip_code"],
        "optional_fields": ["tip"],
        "tip_field": "tip",
        "tip_percentages": [0, 5, 10, 15],
        "delivery_fee_usd": 2.0,
        "tax_rate": 0.08,
        "languages": ["en"],
        "zip_code_pattern": r"^\d{5}$"
    },
    CountryCode.CH: {
        "currency": "CHF",
        "currency_symbol": "CHF",
        "required_fields": ["plz"],
        "optional_fields": ["trinkgeld"],
        "tip_field": "trinkgeld",
        "tip_percentages": [0, 5, 10, 15],
        "delivery_fee_usd": 2.0,
        "tax_rate": 0.081,
        "languages": ["de", "fr"]
    },
    CountryCode.JP: {
        "currency": "JPY",
        "currency_symbol": "¥",
        "required_fields": ["prefectura"],
        "optional_fields": ["chip"],
        "tip_field": "chip",
        "tip_percentages": [0, 5, 10, 15],
        "delivery_fee_usd": 2.0,
        "tax_rate": 0.10,
        "languages": ["ja"],
        "decimal_places": 0
    },
    CountryCode.SA: {
        "currency": "SAR",
        "currency_symbol": "ر.س",
        "required_fields": ["district"],
        "optional_fields": ["baksheesh"],
        "tip_field": "baksheesh",
        "tip_percentages": [0, 5, 10, 15],
        "delivery_fee_usd": 2.0,
        "tax_rate": 0.15,
        "languages": ["ar"]
    }
}

# Pizza catalog (base prices in USD, will be converted)
# Category taxonomy matches the frontend CategoryFilter buttons:
#   popular | veggie | meat | sides
# The catalog has no sides today; category is what /api/pizzas exposes so
# clients filter from data, not from name-keyword heuristics.
PIZZA_CATALOG = [
  {
    "id": "p01",
    "base_price": 12.99,
    "category": "popular",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Margherita_pizza.jpg/500px-Margherita_pizza.jpg",
    "name": {"en":"Margherita","es":"Margarita","de":"Margherita","fr":"Margherita","ja":"マルゲリータ","ar":"مارغريتا"},
    "description": {
      "en":"Tomato, mozzarella, basil",
      "es":"Tomate, mozzarella, albahaca",
      "de":"Tomaten, Mozzarella, Basilikum",
      "fr":"Tomate, mozzarella, basilic",
      "ja":"トマト、モッツァレラ、バジル",
      "ar":"طماطم، موزاريلا، ريحان"
    }
  },
  {
    "id": "p02",
    "base_price": 14.99,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Pepperoni_pizza.jpg/500px-Pepperoni_pizza.jpg",
    "name": {"en":"Pepperoni","es":"Pepperoni","de":"Pepperoni","fr":"Pepperoni","ja":"ペパロニ","ar":"بيبروني"},
    "description": {
      "en":"Pepperoni, mozzarella, tomato sauce",
      "es":"Pepperoni, mozzarella, salsa de tomate",
      "de":"Pepperoni, Mozzarella, Tomatensauce",
      "fr":"Pepperoni, mozzarella, sauce tomate",
      "ja":"ペパロニ、モッツァレラ、トマトソース",
      "ar":"بيبروني بقري، موزاريلا، صلصة طماطم"
    }
  },
  {
    "id": "p03",
    "base_price": 13.99,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Hawaiian_pizza.jpg/500px-Hawaiian_pizza.jpg",
    "name": {"en":"Hawaiian","es":"Hawaiana","de":"Hawaii","fr":"Hawaïenne","ja":"ハワイアン","ar":"هاوايان"},
    "description": {
      "en":"Ham, pineapple, mozzarella",
      "es":"Jamón, piña, mozzarella",
      "de":"Schinken, Ananas, Mozzarella",
      "fr":"Jambon, ananas, mozzarella",
      "ja":"ハム、パイナップル、モッツァレラ",
      "ar":"ديك رومي مدخن، أناناس، موزاريلا"
    }
  },
  {
    "id": "p04",
    "base_price": 15.49,
    "category": "popular",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Four_cheese_pizza.jpg/500px-Four_cheese_pizza.jpg",
    "name": {"en":"Four Cheese","es":"Cuatro Quesos","de":"Vier Käse","fr":"Quatre Fromages","ja":"クアトロ・フォルマッジ","ar":"أربعة أجبان"},
    "description": {
      "en":"Mozzarella, parmesan, gorgonzola, provolone",
      "es":"Mozzarella, parmesano, gorgonzola, provolone",
      "de":"Mozzarella, Parmesan, Gorgonzola, Provolone",
      "fr":"Mozzarella, parmesan, gorgonzola, provolone",
      "ja":"モッツァレラ、パルメザン、ゴルゴンゾーラ、プロヴォローネ",
      "ar":"موزاريلا، بارميزان، غورغونزولا، بروفولون"
    }
  },
  {
    "id": "p05",
    "base_price": 13.49,
    "category": "veggie",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Vegetarian_Pizza.jpg/500px-Vegetarian_Pizza.jpg",
    "name": {"en":"Veggie","es":"Vegetariana","de":"Vegetarisch","fr":"Végétarienne","ja":"ベジタリアン","ar":"خضروات"},
    "description": {
      "en":"Mushrooms, peppers, olives, onion",
      "es":"Champiñones, pimientos, aceitunas, cebolla",
      "de":"Pilze, Paprika, Oliven, Zwiebel",
      "fr":"Champignons, poivrons, olives, oignon",
      "ja":"きのこ、ピーマン、オリーブ、玉ねぎ",
      "ar":"فطر، فلفل، زيتون، بصل"
    }
  },
  {
    "id": "p06",
    "base_price": 12.49,
    "category": "veggie",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Pizza_marinara.jpg/500px-Pizza_marinara.jpg",
    "name": {"en":"Marinara","es":"Marinara","de":"Marinara","fr":"Marinara","ja":"マリナーラ","ar":"مارينارا"},
    "description": {
      "en":"Tomato, garlic, oregano",
      "es":"Tomate, ajo, orégano",
      "de":"Tomaten, Knoblauch, Oregano",
      "fr":"Tomate, ail, origan",
      "ja":"トマト、ニンニク、オレガノ",
      "ar":"طماطم، ثوم، أوريغانو"
    }
  },
  {
    "id": "p07",
    "base_price": 16.49,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Pizza_capricciosa.jpg/500px-Pizza_capricciosa.jpg",
    "name": {"en":"Capricciosa","es":"Caprichosa","de":"Capricciosa","fr":"Capricciosa","ja":"カプリチョーザ","ar":"كابريتشوزا"},
    "description": {
      "en":"Ham, mushrooms, artichoke, olives",
      "es":"Jamón, champiñones, alcachofa, aceitunas",
      "de":"Schinken, Pilze, Artischocke, Oliven",
      "fr":"Jambon, champignons, artichaut, olives",
      "ja":"ハム、きのこ、アーティチョーク、オリーブ",
      "ar":"ديك رومي مدخن، فطر، خرشوف، زيتون"
    }
  },
  {
    "id": "p08",
    "base_price": 15.99,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Pizza_Diavolo.jpg/500px-Pizza_Diavolo.jpg",
    "name": {"en":"Diavola","es":"Diavola","de":"Diavolo","fr":"Diavola","ja":"ディアボラ","ar":"ديافولا"},
    "description": {
      "en":"Spicy salami, chili, mozzarella",
      "es":"Salami picante, chile, mozzarella",
      "de":"Scharfe Salami, Chili, Mozzarella",
      "fr":"Salami épicé, piment, mozzarella",
      "ja":"辛いサラミ、唐辛子、モッツァレラ",
      "ar":"سلامي بقري حار، فلفل حار، موزاريلا"
    }
  },
  {
    "id": "p09",
    "base_price": 16.99,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Pizza_Prosciutto.jpg/500px-Pizza_Prosciutto.jpg",
    "name": {"en":"Prosciutto","es":"Prosciutto","de":"Prosciutto","fr":"Prosciutto","ja":"プロシュート","ar":"بريسولا"},
    "description": {
      "en":"Prosciutto, arugula, parmesan",
      "es":"Prosciutto, arúgula, parmesano",
      "de":"Prosciutto, Rucola, Parmesan",
      "fr":"Prosciutto, roquette, parmesan",
      "ja":"プロシュート、ルッコラ、パルメザン",
      "ar":"بريسولا، جرجير، بارميزان"
    }
  },
  {
    "id": "p10",
    "base_price": 16.49,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Pizza_quattro_stagioni.jpg/500px-Pizza_quattro_stagioni.jpg",
    "name": {"en":"Quattro Stagioni","es":"Cuatro Estaciones","de":"Vier Jahreszeiten","fr":"Quatre Saisons","ja":"クアトロ・スタジオーニ","ar":"الفصول الأربعة"},
    "description": {
      "en":"Artichoke, olives, ham, mushrooms",
      "es":"Alcachofa, aceitunas, jamón, champiñones",
      "de":"Artischocke, Oliven, Schinken, Pilze",
      "fr":"Artichaut, olives, jambon, champignons",
      "ja":"アーティチョーク、オリーブ、ハム、きのこ",
      "ar":"خرشوف، زيتون، ديك رومي مدخن، فطر"
    }
  },
  {
    "id": "p11",
    "base_price": 14.49,
    "category": "veggie",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Pizzahalter_auf_Pizza_Funghi.JPG/500px-Pizzahalter_auf_Pizza_Funghi.JPG",
    "name": {"en":"Funghi","es":"Funghi","de":"Funghi","fr":"Funghi","ja":"フンギ","ar":"فونغي"},
    "description": {
      "en":"Mushrooms, mozzarella, oregano",
      "es":"Champiñones, mozzarella, orégano",
      "de":"Pilze, Mozzarella, Oregano",
      "fr":"Champignons, mozzarella, origan",
      "ja":"きのこ、モッツァレラ、オレガノ",
      "ar":"فطر، موزاريلا، أوريغانو"
    }
  },
  {
    "id": "p12",
    "base_price": 15.99,
    "category": "meat",
    "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/BBQ_CHICKEN_PIZZA.jpg/500px-BBQ_CHICKEN_PIZZA.jpg",
    "name": {"en":"BBQ Chicken","es":"Pollo BBQ","de":"BBQ Hähnchen","fr":"Poulet BBQ","ja":"BBQチキン","ar":"دجاج باربكيو"},
    "description": {
      "en":"Chicken, BBQ sauce, onion, cilantro",
      "es":"Pollo, salsa BBQ, cebolla, cilantro",
      "de":"Hähnchen, BBQ-Sauce, Zwiebel, Koriander",
      "fr":"Poulet, sauce BBQ, oignon, coriandre",
      "ja":"チキン、BBQソース、玉ねぎ、香菜",
      "ar":"دجاج، صلصة باربكيو، بصل، كزبرة"
    }
  },
]


# Currency conversion rates (from USD, 2026 YTD averages as of April 2026).
# MXN: inferred from Banxico monthly averages published for Jan-Mar 2026.
# CHF: inferred from SNB official 2026 spot snapshots (Feb-Apr 2026).
# JPY: inferred from the same SNB official CHF cross-rates (USD/CHF and 100 JPY/CHF).
CURRENCY_RATES = {
    "USD": 1.0,
    "MXN": 17.55,
    "CHF": 0.7823,
    "JPY": 157.89,
    "SAR": 3.75
}
