from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from constants import CountryCode

# Auth Models
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    behavior: str

class UserProfile(BaseModel):
    username: str
    behavior: str
    description: str

# Pizza Models
class Pizza(BaseModel):
    id: str
    name: str
    description: str
    price: float
    base_price: float
    currency: str
    currency_symbol: str
    image: str
    
class PizzaResponse(BaseModel):
    pizzas: List[Pizza]
    country_code: str
    currency: str

# Cart Models
class CartItem(BaseModel):
    pizza_id: str
    quantity: int = Field(ge=1, le=10)

class Cart(BaseModel):
    items: List[CartItem]
    country_code: CountryCode

# Checkout Models
class CheckoutRequest(BaseModel):
    country_code: CountryCode
    items: List[CartItem]
    
    # Common fields
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5, max_length=200)
    phone: str = Field(..., min_length=8, max_length=20)
    
    # Country-specific fields
    colonia: Optional[str] = None  # MX
    propina: Optional[float] = Field(None, ge=0)  # MX
    zip_code: Optional[str] = None  # US
    plz: Optional[str] = None  # CH
    prefectura: Optional[str] = None  # JP
    
    @validator('zip_code')
    def validate_zip_code(cls, v, values):
        if values.get('country_code') == CountryCode.US and v:
            if not v.isdigit() or len(v) != 5:
                raise ValueError('ZIP code debe tener 5 dígitos')
        return v

class OrderSummary(BaseModel):
    order_id: str
    subtotal: float
    tax: float
    tip: float
    total: float
    currency: str
    currency_symbol: str
    items: List[Dict[str, Any]]
    timestamp: datetime

# Country Info Model
class CountryInfo(BaseModel):
    code: str
    currency: str
    currency_symbol: str
    required_fields: List[str]
    optional_fields: List[str]
    tax_rate: float
    languages: List[str]
    decimal_places: int = 2

# Error Models
class ErrorResponse(BaseModel):
    error: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
