# OmniPizza — QA Testing Platform

OmniPizza is a multi-platform, test-friendly food ordering sandbox designed for practicing UI + API automation (web + mobile) with deterministic chaos users and multi-market pricing.  
Users now select market directly on the **login** screen (web + mobile) before entering the app.

## Live Deployments (Render)
- **Web:** https://omnipizza-frontend.onrender.com
- **API:** https://omnipizza-backend.onrender.com

---

## Screenshots

### Desktop

<table>
  <tr>
    <td align="center"><strong>Login</strong></td>
    <td align="center"><strong>Catalog</strong></td>
    <td align="center"><strong>Pizza Customizer</strong></td>
  </tr>
  <tr>
    <td><img src="screenshots/desktop/login_desktop.png" width="300" /></td>
    <td><img src="screenshots/desktop/catalog_desktop.png" width="300" /></td>
    <td><img src="screenshots/desktop/pizzabuilder_desktop.png" width="300" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Checkout</strong></td>
    <td align="center"><strong>Order Success</strong></td>
    <td></td>
  </tr>
  <tr>
    <td><img src="screenshots/desktop/checkout_desktop.png" width="300" /></td>
    <td><img src="screenshots/desktop/ordersuccess_desktop.png" width="300" /></td>
    <td></td>
  </tr>
</table>

### Responsive (Mobile Web)

<table>
  <tr>
    <td align="center"><strong>Login</strong></td>
    <td align="center"><strong>Catalog</strong></td>
    <td align="center"><strong>Pizza Customizer</strong></td>
    <td align="center"><strong>Checkout</strong></td>
    <td align="center"><strong>Order Success</strong></td>
  </tr>
  <tr>
    <td><img src="screenshots/responsive/login_responsive.png" width="160" /></td>
    <td><img src="screenshots/responsive/catalog_responsive.png" width="160" /></td>
    <td><img src="screenshots/responsive/pizzabuilder_responsive.png" width="160" /></td>
    <td><img src="screenshots/responsive/checkout_responsive.png" width="160" /></td>
    <td><img src="screenshots/responsive/ordersuccess_responsive.png" width="160" /></td>
  </tr>
</table>

### iOS (React Native)

<table>
  <tr>
    <td align="center"><strong>Login</strong></td>
    <td align="center"><strong>Catalog</strong></td>
    <td align="center"><strong>Pizza Builder</strong></td>
    <td align="center"><strong>Checkout</strong></td>
    <td align="center"><strong>Order Success</strong></td>
  </tr>
  <tr>
    <td><img src="screenshots/ios/login_ios.png" width="160" /></td>
    <td><img src="screenshots/ios/catalog_ios.png" width="160" /></td>
    <td><img src="screenshots/ios/pizzabuilder_ios.png" width="160" /></td>
    <td><img src="screenshots/ios/checkout_ios.png" width="160" /></td>
    <td><img src="screenshots/ios/ordersuccess_ios.png" width="160" /></td>
  </tr>
</table>

---

## API Documentation (Swagger)

The backend exposes full OpenAPI documentation using **Swagger UI** and **ReDoc**.

### Swagger UI
Interactive documentation to explore and test endpoints.

- **Render:** https://omnipizza-backend.onrender.com/api/docs
- **Local:** http://localhost:8000/api/docs

### ReDoc
Clean, readable API reference.

- **Render:** https://omnipizza-backend.onrender.com/api/redoc
- **Local:** http://localhost:8000/api/redoc

### OpenAPI JSON
Raw OpenAPI specification (useful for contract testing tools).

- **Render:** https://omnipizza-backend.onrender.com/api/openapi.json
- **Local:** http://localhost:8000/api/openapi.json

### Required Headers (important)
Most endpoints rely on request headers to simulate multi-market behavior:

- `X-Country-Code: MX | US | CH | JP`
- `X-Language: en | es | de | fr | ja`
- `Authorization: Bearer <token>` (after login)

These headers are automatically sent by the **Web** and **Mobile** clients.

---

## What’s inside

### Test Users (deterministic behaviors)
| Username | Password | Behavior |
|---|---|---|
| standard_user | pizza123 | Normal flow |
| locked_out_user | pizza123 | Login fails (deterministic) |
| problem_user | pizza123 | $0 prices + broken images |
| performance_glitch_user | pizza123 | API delay (~3s) |
| error_user | pizza123 | Random checkout error (~50%) |

### Markets (pricing + required fields)
| Market | Currency | Required fields | Notes |
|---|---|---|---|
| MX | MXN | `colonia` | Tip optional (`propina`) |
| US | USD | `zip_code` | Tax applied |
| CH | CHF | `plz` | **Language toggle DE/FR** |
| JP | JPY | `prefectura` | No decimals |

### Language behavior
- The app **starts in English** (web + mobile).
- The selected market at login sets the default UI language:
  - **MX → Spanish (es)**
  - **US → English (en)**
  - **CH → German (de)** (with toggle to **French (fr)**)
  - **JP → Japanese (ja)**
- After login, market is no longer changeable from app navigation.

### Payment (UI simulation)
Checkout supports two selectable payment methods:
- **Credit Card** — Displays a full card form (Cardholder Name, Card Number, Expiry, CVV). Card details are **UI-only** and are **not sent** to the backend.
- **Cash on Delivery** — Hides the card form; order is placed without card details.

The payment method toggle uses `data-testid="payment-card"` and `data-testid="payment-cash"` for automation.

### Profile (Delivery Details)
The **Profile** page stores delivery details (name/address/phone) and **auto-fills Checkout**.

### Order Success
After checkout, the **Order Success** screen is shown and the last order remains accessible (web persists it via local storage).

### Mobile UX updates
- Navbar includes a **logout** button.
- Checkout validates required fields before submit (country-specific + inline errors).
- Layouts are rotation-ready (portrait/landscape) for iOS and Android.

### Web visual assets
- Public icons/logos were standardized from `frontend-mobile/assets/icon.png`.
- Login page uses `frontend/public/login-bg-gradient.png` as the background.

---

## Project structure

```
OmniPizza/
├── backend/          # FastAPI backend (in-memory DB)
├── frontend/         # React + Vite + Tailwind web app
├── frontend-mobile/  # React Native / Expo mobile app
├── tests/            # API integration tests (Vitest + TypeScript)
├── specs/            # PRD, Design Specs, Tech Stack
└── docs/             # Project Documentation
```

## Project Documentation
Detailed specifications for the project can be found in `specs/`:

- **[Product Requirements (PRD)](specs/Product_Requirement_Doc.md):** User personas, functional requirements, and chaos behaviors.
- **[Design Document](specs/Design_Doc.md):** System architecture, data flow, and "Chaos Middleware" design.
- **[UI Design System](specs/UI_Design_Doc.md):** "Dark Premium" aesthetic, color palette, typography, and component specs.
- **[Tech Stack](specs/Tech_Stack_Doc.md):** Technology choices and justification (FastAPI, React, Zustand, etc.).

---

## Run locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

- Swagger: http://localhost:8000/api/docs

### Web
```bash
cd frontend
npm install
npm run dev
```

> The web client reads `VITE_API_URL` when provided, otherwise defaults to `http://localhost:8000`.
> On macOS/Linux you can run:
> `VITE_API_URL=http://localhost:8000 npm run dev`

### Mobile
```bash
cd frontend-mobile
npm install
npm run ios   # or npm run android
```

> **Configuration:**
> - Mobile is configured to use the **Render API** (`https://omnipizza-backend.onrender.com`) strictly, with **mock data fallback removed**.
> - **Real Authentication:** Uses `/api/auth/login` to obtain valid JWT tokens.
> - **Market selection at login:** user picks market on the login screen (flag selector).
> - **Localization:** Full i18n support for Profile, Checkout, and Navbar.
> - **Error Handling:** Includes UI for connection retries.
> - **Orientation:** `frontend-mobile/app.json` uses `"orientation": "default"` for device rotation.

> To run against local backend, change `API_ORIGIN` in `frontend-mobile/src/api/client.ts`.

---

## API Tests (Vitest)

The `tests/` directory contains automated API integration tests written in **TypeScript** with **Vitest**.

```bash
cd tests
pnpm install
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:ui        # Interactive UI
```

Requires the backend running on `http://localhost:8000` (or set `API_BASE_URL`).

**Test suites:** Auth login, Pizza catalog, Checkout validation, Locked-out user, E2E standard flow, Country-specific logic (MX/US/CH/JP), Debug endpoints.

> Legacy Python contract tests (Schemathesis) are also available — see `tests/README.md`.

---

## Automation notes
- `/api/pizzas` requires `X-Country-Code` header for market pricing.
- Use the test users to validate reliability and chaos behaviors.
- All interactive elements have `data-testid` attributes for stable selectors.
- Checkout form fields are dynamic per market — ensure automation handles conditional rendering.
- Phone input uses `type="tel"` with pattern validation (`7-20 digits/spaces/+/-`).

---

## License
MIT
