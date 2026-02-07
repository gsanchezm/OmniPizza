from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import List, Optional
import time
import random
from prometheus_client import Counter, Histogram, generate_latest
from starlette.responses import Response

from config import settings
from models import (
    LoginRequest, LoginResponse, UserProfile,
    PizzaResponse, CheckoutRequest, OrderSummary,
    CountryInfo, ErrorResponse
)
from constants import TEST_USERS, COUNTRY_CONFIG, CountryCode
from auth import authenticate_user, create_access_token
from middleware import require_country_header, get_current_user, apply_user_behavior
from database import db

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency', ['method', 'endpoint'])

# Create FastAPI app
app = FastAPI(
    title="OmniPizza QA Platform",
    description="Multi-country pizza ordering platform for QA testing",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "OmniPizza QA Platform API",
        "version": settings.app_version,
        "docs": "/api/docs",
        "health": "/health"
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment
    }

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])
async def login(request: LoginRequest):
    """
    Authenticate user with predefined test credentials
    
    Test users:
    - standard_user / pizza123 (normal flow)
    - locked_out_user / pizza123 (locked out error)
    - problem_user / pizza123 (broken UI)
    - performance_glitch_user / pizza123 (3s delay)
    - error_user / pizza123 (random 500 errors)
    """
    user = authenticate_user(request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["username"], "behavior": user["behavior"]}
    )
    
    return LoginResponse(
        access_token=access_token,
        username=user["username"],
        behavior=user["behavior"]
    )

@app.get("/api/auth/users", response_model=List[UserProfile], tags=["Authentication"])
async def get_test_users():
    """Get list of available test users for QA purposes"""
    return [
        UserProfile(
            username=user["username"],
            behavior=user["behavior"],
            description=user["description"]
        )
        for user in TEST_USERS.values()
    ]

@app.get("/api/auth/profile", response_model=UserProfile, tags=["Authentication"])
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        username=current_user["username"],
        behavior=current_user["behavior"],
        description=current_user["description"]
    )

# ==================== COUNTRY ENDPOINTS ====================

@app.get("/api/countries", response_model=List[CountryInfo], tags=["Countries"])
async def get_countries():
    """Get list of supported countries with their configurations"""
    countries = []
    for code, config in COUNTRY_CONFIG.items():
        countries.append(CountryInfo(
            code=code.value,
            currency=config["currency"],
            currency_symbol=config["currency_symbol"],
            required_fields=config["required_fields"],
            optional_fields=config["optional_fields"],
            tax_rate=config["tax_rate"],
            languages=config["languages"],
            decimal_places=config.get("decimal_places", 2)
        ))
    return countries

@app.get("/api/countries/{country_code}", response_model=CountryInfo, tags=["Countries"])
async def get_country_info(country_code: str):
    """Get configuration for a specific country"""
    try:
        code = CountryCode(country_code.upper())
        config = COUNTRY_CONFIG[code]
        
        return CountryInfo(
            code=code.value,
            currency=config["currency"],
            currency_symbol=config["currency_symbol"],
            required_fields=config["required_fields"],
            optional_fields=config["optional_fields"],
            tax_rate=config["tax_rate"],
            languages=config["languages"],
            decimal_places=config.get("decimal_places", 2)
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country code {country_code} not found"
        )

# ==================== PIZZA CATALOG ENDPOINTS ====================

@app.get("/api/pizzas", response_model=PizzaResponse, tags=["Pizzas"])
async def get_pizzas(
    country_code: str = Depends(require_country_header),
    current_user: dict = Depends(apply_user_behavior)
):
    """
    Get pizza catalog with country-specific pricing
    
    Requires X-Country-Code header (MX, US, CH, JP)
    """
    try:
        country = CountryCode(country_code)
        catalog = db.get_catalog(country, current_user["behavior"])
        
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

# ==================== CHECKOUT ENDPOINT ====================

@app.post("/api/checkout", response_model=OrderSummary, tags=["Orders"])
async def checkout(
    request: CheckoutRequest,
    current_user: dict = Depends(apply_user_behavior)
):
    """
    Process checkout and create order
    
    Validates country-specific required fields:
    - MX: colonia (required), propina (optional)
    - US: zip_code (required, 5 digits)
    - CH: plz (required)
    - JP: prefectura (required)
    """
    # Check if error_user should trigger error
    if db.should_trigger_error(current_user["behavior"]):
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
    tip = request.propina if request.propina else 0.0
    totals = db.calculate_order_total(
        [item.dict() for item in request.items],
        request.country_code,
        tip
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
    
    # Add country-specific fields
    if request.country_code == CountryCode.MX:
        order_data["customer_info"]["colonia"] = request.colonia
        if request.propina:
            order_data["customer_info"]["propina"] = request.propina
    elif request.country_code == CountryCode.US:
        order_data["customer_info"]["zip_code"] = request.zip_code
    elif request.country_code == CountryCode.CH:
        order_data["customer_info"]["plz"] = request.plz
    elif request.country_code == CountryCode.JP:
        order_data["customer_info"]["prefectura"] = request.prefectura
    
    order_id = db.create_order(order_data)
    order = db.get_order(order_id)
    
    return OrderSummary(
        order_id=order["order_id"],
        subtotal=order["subtotal"],
        tax=order["tax"],
        tip=order["tip"],
        total=order["total"],
        currency=order["currency"],
        currency_symbol=country_config["currency_symbol"],
        items=order["items"],
        timestamp=order["timestamp"]
    )

@app.get("/api/orders", tags=["Orders"])
async def get_orders(current_user: dict = Depends(get_current_user)):
    """Get order history for current user"""
    orders = db.get_user_orders(current_user["username"])
    return {"orders": orders}

@app.get("/api/orders/{order_id}", tags=["Orders"])
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific order details"""
    order = db.get_order(order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
    
    # Verify order belongs to current user
    if order["username"] != current_user["username"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return order

# ==================== DEBUG/CHAOS ENDPOINTS ====================

@app.get("/api/debug/latency-spike", tags=["Debug"])
async def latency_spike():
    """Simulate random latency between 0.5s and 5s"""
    delay = random.uniform(0.5, 5.0)
    time.sleep(delay)
    return {
        "message": "Latency spike completed",
        "delay_seconds": round(delay, 2),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/debug/cpu-load", tags=["Debug"])
async def cpu_load():
    """Generate CPU load with Fibonacci calculation"""
    def fibonacci(n):
        if n <= 1:
            return n
        return fibonacci(n - 1) + fibonacci(n - 2)
    
    start_time = time.time()
    result = fibonacci(35)  # Heavy calculation
    duration = time.time() - start_time
    
    return {
        "message": "CPU load test completed",
        "fibonacci_35": result,
        "duration_seconds": round(duration, 3),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/debug/metrics", tags=["Debug"])
async def metrics():
    """Prometheus-compatible metrics endpoint"""
    return Response(content=generate_latest(), media_type="text/plain")

@app.get("/api/debug/info", tags=["Debug"])
async def debug_info():
    """Get debug information about the application"""
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "total_orders": len(db.orders),
        "test_users": list(TEST_USERS.keys()),
        "supported_countries": [c.value for c in CountryCode],
        "timestamp": datetime.utcnow().isoformat()
    }

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
