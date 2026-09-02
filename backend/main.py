from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from prometheus_client import Counter, Histogram

from config import settings
from test_api import router as test_api_router
from routers.auth import router as auth_router
from routers.catalog import router as catalog_router
from routers.checkout import router as checkout_router
from routers.debug_chaos import router as debug_chaos_router
from routers.meta import router as meta_router

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

# Security headers on every response. Strict-Transport-Security is a no-op over
# plain HTTP (browsers only honor it on HTTPS responses), so it's safe to send
# unconditionally rather than gating on settings.environment.
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response

app.include_router(test_api_router)
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(checkout_router)
app.include_router(debug_chaos_router)
app.include_router(meta_router)

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
