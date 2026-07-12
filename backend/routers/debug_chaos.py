import time
import random
from datetime import datetime

from fastapi import APIRouter
from prometheus_client import generate_latest
from starlette.responses import Response

from config import settings
from constants import TEST_USERS, CountryCode
from database import db

router = APIRouter()

# ==================== DEBUG/CHAOS ENDPOINTS ====================

@router.get("/api/debug/latency-spike", tags=["Debug"])
async def latency_spike():
    """Simulate random latency between 0.5s and 5s"""
    delay = random.uniform(0.5, 5.0)
    time.sleep(delay)
    return {
        "message": "Latency spike completed",
        "delay_seconds": round(delay, 2),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/api/debug/cpu-load", tags=["Debug"])
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

@router.get("/api/debug/metrics", tags=["Debug"])
async def metrics():
    """Prometheus-compatible metrics endpoint"""
    return Response(content=generate_latest(), media_type="text/plain")

@router.get("/api/debug/info", tags=["Debug"])
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
