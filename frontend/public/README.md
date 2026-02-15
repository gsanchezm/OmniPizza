# OmniPizza — QA Testing Platform

OmniPizza is a multi-platform, test-friendly pizza ordering sandbox designed for practicing UI + API automation across **Web (React/Vite)** and **Mobile (React Native)**.  
It includes deterministic “chaos” users, multi-market pricing, language switching, and a pizza configurator (size + toppings) with cart edit/remove.  
Users select market on the **login** screen (web + mobile) before entering the app.

## Live Deployments (Render)
- **Web:** https://omnipizza-frontend.onrender.com
- **API:** https://omnipizza-backend.onrender.com

---

## Swagger / API Documentation

### Swagger UI
- **Render:** https://omnipizza-backend.onrender.com/api/docs
- **Local:** http://localhost:8000/api/docs

### ReDoc
- **Render:** https://omnipizza-backend.onrender.com/api/redoc
- **Local:** http://localhost:8000/api/redoc

### OpenAPI JSON
- **Render:** https://omnipizza-backend.onrender.com/api/openapi.json
- **Local:** http://localhost:8000/api/openapi.json

---

## Key Features

### 1) Test Users (deterministic behaviors)
| Username | Password | Behavior |
|---|---|---|
| standard_user | pizza123 | Normal flow |
| locked_out_user | pizza123 | Login fails (deterministic lockout) |
| problem_user | pizza123 | $0 prices + broken images |
| performance_glitch_user | pizza123 | API delay (~3s) |
| error_user | pizza123 | Random checkout error (~50%) |

### 2) Markets (currency + required fields)
| Market | Currency | Required fields | Notes |
|---|---|---|---|
| MX | MXN | `colonia` | Tip optional (`propina`) |
| US | USD | `zip_code` | Tax applied |
| CH | CHF | `plz` | Language toggle **DE/FR** |
| JP | JPY | `prefectura` | No decimals |

### 3) Language behavior
- **Web + Mobile start in English.**
- The selected market at login sets the default UI language:
  - **MX → Spanish (es)**
  - **US → English (en)**
  - **CH → German (de)** (toggle to **French (fr)**)
  - **JP → Japanese (ja)**
- After login, market is not changeable from navbar/menu.

### 4) Pizza Configurator (Web modal + Mobile PizzaBuilderScreen)
When adding a pizza, the user can customize:
- **Size**
  - Small: +$0
  - Medium: +$3
  - Large: +$4
  - Family: +$5
- **Toppings**
  - Up to **10** toppings
  - Each topping adds **+$1**

#### Pricing rules (important)
- Size/topping increments are defined in **USD**.
- For each market, increments are converted to local currency using the same ratio used by the catalog (**base_price USD → price local**).
- Converted increments are **rounded up** to the next integer (**ceil**).

### 5) Cart edit/remove
- Checkout lists configured pizzas.
- Each item can be:
  - **Edited** (re-opens the configurator)
  - **Removed**
- Totals update immediately based on item changes.

### 6) Mobile UX
- Login quick-fill includes all test users.
- Navbar includes logout action.
- Checkout validates required fields before submit.
- Portrait/landscape rotation is supported.

### 7) Web visual assets
- Public icons/logo are standardized from `frontend-mobile/assets/icon.png`.
- Login page background uses `frontend/public/login-bg-gradient.png`.

---

## API Overview

### Headers used by Web/Mobile
- `X-Country-Code: MX | US | CH | JP`
- `X-Language: en | es | de | fr | ja`
- `Authorization: Bearer <token>` (after login)

### Main endpoints
- `POST /api/auth/login`
- `GET /api/auth/users`
- `GET /api/pizzas`
- `POST /api/checkout`
- `GET /api/orders`
- `GET /api/orders/{order_id}`

---

## Project Structure

```
OmniPizza/
├── backend/          # FastAPI backend (in-memory DB)
├── frontend/         # React + Vite + Tailwind web app
├── frontend-mobile/  # React Native mobile app
└── tests/            # Contract tests (optional)
```

---

## Run Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Web
```bash
cd frontend
npm install
npm run dev
```

Optional (local backend):
```bash
# macOS/Linux
VITE_API_URL=http://localhost:8000 npm run dev
```

### Mobile
```bash
cd frontend-mobile
npm install
npm start
```

Mobile uses the Render API by default (no .env required).  
To point to a local backend, edit:
- `frontend-mobile/src/api/client.ts`

---

## Notes for Automation Engineers
- Use market/language headers to validate localization and pricing.
- Use chaos users to validate resilience and error handling.
- The configurator + cart edit/remove are ideal for atomic UI + API consistency checks.

---

## License
MIT
