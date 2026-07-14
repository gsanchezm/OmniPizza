from fastapi import APIRouter, Depends, Header, status, HTTPException
from typing import List

from models import PizzaResponse, CountryInfo
from constants import COUNTRY_CONFIG, CURRENCY_RATES, CountryCode
from middleware import require_country_header, apply_user_behavior
from database import db, convert_usd_amount

router = APIRouter()

# ==================== COUNTRY ENDPOINTS ====================

@router.get("/api/countries", response_model=List[CountryInfo], tags=["Countries"])
async def get_countries():
    """Get list of supported countries with their configurations"""
    countries = []
    for code, config in COUNTRY_CONFIG.items():
        decimal_places = config.get("decimal_places", 2)

        countries.append(CountryInfo(
            code=code.value,
            currency=config["currency"],
            currency_symbol=config["currency_symbol"],
            required_fields=config["required_fields"],
            optional_fields=config["optional_fields"],
            tip_field=config["tip_field"],
            tip_mode="percentage",
            tip_percentages=config["tip_percentages"],
            tax_rate=config["tax_rate"],
            delivery_fee=convert_usd_amount(
                config["delivery_fee_usd"],
                CURRENCY_RATES[config["currency"]],
                decimal_places,
            ),
            languages=config["languages"],
            decimal_places=decimal_places
        ))
    return countries

# ==================== PIZZA CATALOG ENDPOINTS ====================

@router.get("/api/pizzas", response_model=PizzaResponse, tags=["Pizzas"])
async def get_pizzas(
    country_code: str = Depends(require_country_header),
    current_user: dict = Depends(apply_user_behavior),
    x_language: str = Header("en", alias="X-Language"),
):
    """
    Get pizza catalog with country-specific pricing and language support

    Headers:
    - X-Country-Code: MX | US | CH | JP | SA
    - X-Language: en | es | de | fr | ja | ar
    """
    try:
        country = CountryCode(country_code)

        catalog = db.get_catalog(
            country_code=country,
            behavior=current_user["behavior"],
            language=x_language,   # ✅ CLAVE
        )

        return PizzaResponse(
            pizzas=catalog,
            country_code=country.value,
            currency=COUNTRY_CONFIG[country]["currency"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
