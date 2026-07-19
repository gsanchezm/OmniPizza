from fastapi import APIRouter, Depends, status, HTTPException

import random
from models import CheckoutRequest, OrderSummary
from constants import COUNTRY_CONFIG, CountryCode, SECURITY_GLITCH_LEAK_MESSAGES
from middleware import apply_user_behavior, get_current_user
from database import db

router = APIRouter()

# ==================== CHECKOUT ENDPOINT ====================

@router.post("/api/checkout", response_model=OrderSummary, tags=["Orders"])
async def checkout(
    request: CheckoutRequest,
    current_user: dict = Depends(apply_user_behavior)
):
    """
    Process checkout and create order
    
    Validates country-specific required fields:
    - MX: colonia (required)
    - US: zip_code (required, 5 digits)
    - CH: plz (required)
    - JP: prefectura (required)
    - SA: district (required)

    Market tip fields carry a percentage value:
    - MX: propina
    - US: tip
    - CH: trinkgeld
    - JP: chip
    - SA: baksheesh
    """
    # Check if error_user/security_glitch_user should trigger an error
    if db.should_trigger_error(current_user["behavior"]):
        if current_user["behavior"] == "security_glitch":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=random.choice(SECURITY_GLITCH_LEAK_MESSAGES)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Random checkout error triggered for testing purposes"
        )
    
    # Validate country-specific fields
    country_config = COUNTRY_CONFIG[request.country_code]
    
    for field in country_config["required_fields"]:
        field_value = getattr(request, field, None)
        if not field_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Field '{field}' is required for country {request.country_code.value}"
            )
    
    # Calculate totals
    tip_percentage = request.get_tip_percentage()
    totals = db.calculate_order_total(
        [item.dict() for item in request.items],
        request.country_code,
        tip_percentage
    )
    
    # Create order
    order_data = {
        "username": current_user["username"],
        "country_code": request.country_code.value,
        "items": [item.dict() for item in request.items],
        "customer_info": {
            "name": request.name,
            "address": request.address,
            "phone": request.phone
        },
        **totals
    }
    
    # Country-specific fields, driven by COUNTRY_CONFIG (Open/Closed): adding a
    # market is a config edit, not a new elif branch.
    #   required_fields -> always copied (already validated non-empty above)
    #   tip_field       -> copied if not None (so an explicit 0 is preserved)
    #   other optional  -> copied only if truthy (mirrors the old `if request.x:`)
    tip_field = country_config["tip_field"]
    for field in country_config["required_fields"]:
        order_data["customer_info"][field] = getattr(request, field)
    for field in country_config["optional_fields"]:
        value = getattr(request, field, None)
        if field == tip_field:
            if value is not None:
                order_data["customer_info"][field] = value
        elif value:
            order_data["customer_info"][field] = value

    order_id = db.create_order(order_data)
    order = db.get_order(order_id)
    
    return OrderSummary(
        order_id=order["order_id"],
        subtotal=order["subtotal"],
        delivery_fee=order["delivery_fee"],
        tax_rate=order["tax_rate"],
        tip_percentage=order["tip_percentage"],
        tax=order["tax"],
        tip=order["tip"],
        total=order["total"],
        currency=order["currency"],
        currency_symbol=country_config["currency_symbol"],
        items=order["items"],
        timestamp=order["timestamp"]
    )

@router.get("/api/orders", tags=["Orders"])
async def get_orders(current_user: dict = Depends(get_current_user)):
    """Get order history for current user"""
    orders = db.get_user_orders(current_user["username"])
    return {"orders": orders}

@router.get("/api/orders/{order_id}", response_model=OrderSummary, tags=["Orders"])
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific order details — returns the same OrderSummary shape as /api/checkout
    so clients can hydrate order state from a single canonical contract."""
    order = db.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )

    if order["username"] != current_user["username"] and current_user["behavior"] != "security_glitch":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    country_config = COUNTRY_CONFIG[CountryCode(order["country_code"])]

    return OrderSummary(
        order_id=order["order_id"],
        subtotal=order["subtotal"],
        delivery_fee=order["delivery_fee"],
        tax_rate=order["tax_rate"],
        tip_percentage=order["tip_percentage"],
        tax=order["tax"],
        tip=order["tip"],
        total=order["total"],
        currency=order["currency"],
        currency_symbol=country_config["currency_symbol"],
        items=order["items"],
        timestamp=order["timestamp"]
    )
