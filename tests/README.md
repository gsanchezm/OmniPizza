# OmniPizza API Tests

This directory contains automated API integration tests for the OmniPizza platform, written in TypeScript using [Vitest](https://vitest.dev/).

## Prerequisites

- Node.js >= 18
- pnpm
- OmniPizza backend running on `http://localhost:8000`

## Setup

```bash
cd tests
pnpm install
```

## Running Tests

Make sure the API is running first:

```bash
# In one terminal
cd backend
python3 main.py

# In another terminal
cd tests
pnpm test
```

### Watch mode (re-runs on file changes)

```bash
pnpm test:watch
```

### Interactive UI

```bash
pnpm test:ui
```

### Custom API URL

```bash
API_BASE_URL=http://your-api-host:8000 pnpm test
```

### Atomic setup endpoints (external runners only)

Atomic setup orchestration is implemented outside this repository (for example in Playwright/Appium/Gatling projects).
This `tests/` package does not call the session setup endpoints directly (`/api/store/market`, `/api/cart`, `/api/session`, `/api/session/reset`).
Those endpoints authenticate with the same bearer token returned by `/api/auth/login`.

#### Cart hydration flow

External runners can inject cart state via the API and let the frontend pick it up automatically:

1. `POST /api/cart` — seed cart items (with optional `size`: small/medium/large/family)
2. Navigate to `/checkout` — the web and mobile apps call `GET /api/cart` on load
3. `GET /api/cart` returns enriched items (name, price, image, currency) joined with the pizza catalog for the current market
4. The frontend hydrates its cart store from the response, skipping the manual catalog flow

## What is Tested

| Test Suite | Description |
| :--- | :--- |
| `POST /api/auth/login` | Login response structure (token, username, behavior) and invalid credentials |
| `GET /api/pizzas validation` | Requires `X-Country-Code` header; returns pizza catalog |
| `POST /api/checkout validation` | Requires authentication; returns `delivery_fee`, `tax_rate`, `tip_percentage`, `tax`, `tip`, `total` |
| `User Behavior: Locked Out` | `locked_out_user` receives 403 |
| `E2E Flow: Standard User` | Full flow: Login → Get Pizzas → Checkout → Verify Order |
| `Country Specific Logic` | US requires `zip_code`, CH requires `plz`, JP requires `prefectura`; validates rejection without and acceptance with valid fields |
| `Debug Endpoints` | Latency spike, CPU load (fibonacci), and metrics endpoints |

## Test Coverage

- Authentication endpoints
- Pizza catalog with multi-currency
- Checkout flow with country validations
- Percentage-based tips (`propina` / `tip` / `trinkgeld` / `chip`) and localized totals
- User behavior patterns
- Debug/chaos endpoints
- Error responses

## Legacy Python Tests

The original Python contract tests (`test_contract.py`) using Schemathesis are still available in this directory for reference. To run them:

```bash
pip install -r requirements.txt
pytest test_contract.py -v
```
