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
python main.py

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

## What is Tested

| Test Suite | Description |
| :--- | :--- |
| `POST /api/auth/login` | Login response structure (token, username, behavior) and invalid credentials |
| `GET /api/pizzas validation` | Requires `X-Country-Code` header; returns pizza catalog |
| `POST /api/checkout validation` | Requires authentication |
| `User Behavior: Locked Out` | `locked_out_user` receives 403 |
| `E2E Flow: Standard User` | Full flow: Login → Get Pizzas → Checkout → Verify Order |
| `Country Specific Logic` | US checkout requires `zip_code`; validates acceptance with valid ZIP |
| `Debug Endpoints` | Latency spike, CPU load (fibonacci), and metrics endpoints |

## Test Coverage

- Authentication endpoints
- Pizza catalog with multi-currency
- Checkout flow with country validations
- User behavior patterns
- Debug/chaos endpoints
- Error responses

## Legacy Python Tests

The original Python contract tests (`test_contract.py`) using Schemathesis are still available in this directory for reference. To run them:

```bash
pip install -r requirements.txt
pytest test_contract.py -v
```
