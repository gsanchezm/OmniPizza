# OmniPizza — QA Testing Platform

OmniPizza is a multi-platform, test-friendly food ordering sandbox designed for practicing UI + API automation (web + mobile) with deterministic chaos users and multi-market pricing.  
Users now select market directly on the **login** screen (web + mobile) before entering the app.

## Live Deployments (Render)
- **Web:** https://omnipizza-frontend.onrender.com
- **API:** https://omnipizza-backend.onrender.com

---

## Screenshots

### Web Platform
> *Add web screenshots here (e.g., Login, Catalog, Checkout)*
<!-- <img src="docs/screenshots/web.png" width="100%" /> -->

### Mobile Platform (iOS/Android)
> *Add mobile screenshots here (e.g., Pizza Builder, Mobile Checkout)*
<!-- \
<img src="docs/screenshots/mobile-1.png" width="200" /> \
<img src="docs/screenshots/mobile-2.png" width="200" /> \
-->

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
Checkout supports:
- **Online (Card)** — UI form only (card details are **not sent** to backend)
- **On delivery** — Cash / Card

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
├── tests/            # Contract tests (Schemathesis)
└── docs/             # Project Documentation
    └── specs/        # PRD, Design Specs, Tech Stack
```

## Project Documentation
Detailed specifications for the project can be found in `docs/specs/`:

- **[Product Requirements (PRD)](docs/specs/Product_Requirement_Doc.md):** User personas, functional requirements, and chaos behaviors.
- **[Design Document](docs/specs/Design_Doc.md):** System architecture, data flow, and "Chaos Middleware" design.
- **[UI Design System](docs/specs/UI_Design_Doc.md):** "Dark Premium" aesthetic, color palette, typography, and component specs.
- **[Tech Stack](docs/specs/Tech_Stack_Doc.md):** Technology choices and justification (FastAPI, React, Zustand, etc.).

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

## Automation notes
- `/api/pizzas` requires `X-Country-Code` header for market pricing.
- Use the test users to validate reliability and chaos behaviors.

---

## License
MIT
