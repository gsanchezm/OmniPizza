from typing import List, Dict, Any
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
        """Create a new order and return order_id"""
        order_id = f"ORDER-{uuid.uuid4().hex[:8].upper()}"
        order_data["order_id"] = order_id
        order_data["timestamp"] = datetime.utcnow()
        order_data["status"] = "pending"
        
        self.orders[order_id] = order_data
        return order_id
    
    def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get order by ID"""
        return self.orders.get(order_id)
    
    def get_user_orders(self, username: str) -> List[Dict[str, Any]]:
        """Get all orders for a user"""
        return [
            order for order in self.orders.values()
            if order.get("username") == username
        ]
    
    def get_catalog(self, country_code: CountryCode, behavior: str = "standard") -> List[Dict[str, Any]]:
        """Get pizza catalog with country-specific pricing"""
        country_config = COUNTRY_CONFIG[country_code]
        currency = country_config["currency"]
        currency_symbol = country_config["currency_symbol"]
        conversion_rate = CURRENCY_RATES[currency]
        decimal_places = country_config.get("decimal_places", 2)
        
        catalog = []
        for pizza in PIZZA_CATALOG:
            pizza_copy = pizza.copy()
            
            # Convert price to country currency
            converted_price = pizza["base_price"] * conversion_rate
            
            # Apply behavior modifications
            if behavior == "problem":
                # Problem user sees $0 prices
                pizza_copy["price"] = 0.0
                # Broken images
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
        """Calculate order totals with tax"""
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
        """Randomly trigger errors for error_user"""
        if behavior == "error":
            return random.random() < 0.5  # 50% chance of error
        return False

# Global in-memory database instance
db = InMemoryDB()
