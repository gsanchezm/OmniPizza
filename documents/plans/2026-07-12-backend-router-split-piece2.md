# Backend Router Split (Piece 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Split the monolithic `backend/main.py` into four `APIRouter` modules (`auth`, `catalog`, `checkout`, `debug_chaos`) with ZERO change to routes, request/response shapes, headers, or behavior.

**Architecture:** Move endpoint functions verbatim (bodies unchanged) into router modules; convert `@app.<verb>(...)` decorators to `@router.<verb>(...)`; `main.py` keeps the app skeleton and `include_router`s them. Verified by the existing golden+api net (38 tests).

**Tech Stack:** FastAPI, `APIRouter`. Backend runs from `backend/` via the venv.

## Global Constraints

- **Byte-identical API.** Every route path, method, `response_model`, `tags`, status code, required header, and dependency stays exactly as in current `main.py`. Endpoint bodies are MOVED UNCHANGED — do not rewrite logic.
- **`test_api.router` stays as-is** and remains mounted.
- **`main.py` must still define `app`** so `python main.py` and `from main import app` (uvicorn/tests) keep working. Keep: `app` creation, CORS, the `REQUEST_COUNT`/`REQUEST_LATENCY` Prometheus counters (leave them registered), `root` (`/`), `health` (`/health`), both `@app.exception_handler`s, and the `if __name__ == "__main__"` uvicorn block.
- **countries → `catalog.py`; orders → `checkout.py`** (approved).
- Regression gate: the 38-test suite in `tests/` (golden + api), verified by the controller against a freshly-restarted backend.

---

## Task 1: Extract the four routers and slim `main.py`

**Files:**
- Create: `backend/routers/__init__.py` (empty)
- Create: `backend/routers/auth.py`, `backend/routers/catalog.py`, `backend/routers/checkout.py`, `backend/routers/debug_chaos.py`
- Modify: `backend/main.py`

**Interfaces:**
- Each router module exposes a module-level `router = APIRouter()`.
- `main.py` imports each as e.g. `from routers.auth import router as auth_router` and calls `app.include_router(auth_router)`.

This is one atomic commit — a partial move leaves the app un-runnable.

- [ ] **Step 1: Create `backend/routers/__init__.py`** (empty file).

- [ ] **Step 2: Create `backend/routers/auth.py`**

Imports:
```python
from fastapi import APIRouter, Depends, status, HTTPException
from typing import List

from models import (
    LoginRequest, LoginResponse, UserProfile,
    UserProfileDetails, UserProfileUpdate,
)
from constants import TEST_USERS
from auth import authenticate_user, create_access_token
from middleware import get_current_user
from database import db

router = APIRouter()
```
Move these functions VERBATIM from `main.py` (bodies unchanged), converting `@app.` → `@router.`:
- `login` — `@router.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])`
- `get_test_users` — `@router.get("/api/auth/users", response_model=List[UserProfile], tags=["Authentication"])`
- `get_profile` — `@router.get("/api/auth/profile", response_model=UserProfile, tags=["Authentication"])`
- `get_user_profile` — `@router.get("/api/users/me/profile", response_model=UserProfileDetails, tags=["User Profile"], summary=...)`
- `patch_user_profile` — `@router.patch("/api/users/me/profile", response_model=UserProfileDetails, tags=["User Profile"], summary=...)`

- [ ] **Step 3: Create `backend/routers/catalog.py`**

Imports:
```python
from fastapi import APIRouter, Depends, Header, status, HTTPException
from typing import List

from models import PizzaResponse, CountryInfo
from constants import COUNTRY_CONFIG, CURRENCY_RATES, CountryCode
from middleware import require_country_header, apply_user_behavior
from database import db, convert_usd_amount

router = APIRouter()
```
Move VERBATIM, `@app.` → `@router.`:
- `get_countries` — `@router.get("/api/countries", response_model=List[CountryInfo], tags=["Countries"])`
- `get_pizzas` — `@router.get("/api/pizzas", response_model=PizzaResponse, tags=["Pizzas"])`

- [ ] **Step 4: Create `backend/routers/checkout.py`**

Imports:
```python
from fastapi import APIRouter, Depends, status, HTTPException

from models import CheckoutRequest, OrderSummary
from constants import COUNTRY_CONFIG, CountryCode
from middleware import apply_user_behavior, get_current_user
from database import db

router = APIRouter()
```
Move VERBATIM, `@app.` → `@router.`:
- `checkout` — `@router.post("/api/checkout", response_model=OrderSummary, tags=["Orders"])`
- `get_orders` — `@router.get("/api/orders", tags=["Orders"])`
- `get_order` — `@router.get("/api/orders/{order_id}", response_model=OrderSummary, tags=["Orders"])`

- [ ] **Step 5: Create `backend/routers/debug_chaos.py`**

Imports:
```python
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
```
Move VERBATIM, `@app.` → `@router.`:
- `latency_spike` — `@router.get("/api/debug/latency-spike", tags=["Debug"])`
- `cpu_load` — `@router.get("/api/debug/cpu-load", tags=["Debug"])`
- `metrics` — `@router.get("/api/debug/metrics", tags=["Debug"])`
- `debug_info` — `@router.get("/api/debug/info", tags=["Debug"])`

- [ ] **Step 6: Slim `backend/main.py`**

Remove the moved endpoint functions. The resulting `main.py` keeps ONLY:
- Imports actually still used: `from fastapi import FastAPI`; `from fastapi.middleware.cors import CORSMiddleware`; `from fastapi.responses import JSONResponse`; `from datetime import datetime`; `from prometheus_client import Counter, Histogram`; `from config import settings`; `from test_api import router as test_api_router`; and the four `from routers.<name> import router as <name>_router`.
- The `REQUEST_COUNT` / `REQUEST_LATENCY` counter definitions (unchanged).
- `app = FastAPI(...)` (unchanged) and the CORS `add_middleware` block (unchanged).
- The router mounts, in this order:
```python
app.include_router(test_api_router)
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(checkout_router)
app.include_router(debug_chaos_router)
```
- `root` (`@app.get("/")`) and `health` (`@app.get("/health")`) — unchanged.
- Both `@app.exception_handler(...)` handlers — unchanged.
- The `if __name__ == "__main__":` uvicorn block — unchanged.

Delete now-unused imports from `main.py` (`HTTPException`, `status`, `Depends`, `Header`, `List`, `time`, `random`, `generate_latest`, `Response`, and the model/constant/auth/middleware/database imports that only the moved endpoints used). Keep only what the retained code references.

- [ ] **Step 7: Import sanity check**

From repo root:
```bash
cd backend && ./venv/Scripts/python.exe -c "import main; print('import ok'); print('routes', len(main.app.routes))"
```
Expected: `import ok` and a route count in the same ballpark as before (roughly 25-30, incl. docs/openapi). If it errors (missing import, name error), fix it. Do NOT start a server or run the vitest suite — the controller verifies against a freshly-restarted backend.

- [ ] **Step 8: Commit**

```bash
git add backend/routers backend/main.py && git commit -m "refactor(backend): split main.py into auth/catalog/checkout/debug routers"
```

## Verification (controller-run)

Restart the backend (`kill :8000` → `python main.py` → wait `/health`), then `cd tests && npx vitest run` — expected 38/38, byte-identical behavior. Any red = a moved endpoint changed path/dependency/body → fix.

## Self-review notes

- Every current `main.py` endpoint maps to exactly one router; `/` and `/health` stay app-level; `test_api.router` untouched.
- `REQUEST_COUNT`/`REQUEST_LATENCY` stay defined in `main.py` so they remain in the default Prometheus registry that `debug_chaos.metrics` serializes via `generate_latest()`.
- Route order: `test_api` first (as today), then the four routers; FastAPI matches by path so order is immaterial to these non-overlapping paths, but this keeps the diff intent clear.
