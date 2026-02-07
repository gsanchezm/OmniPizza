# OmniPizza — QA Testing Platform

OmniPizza is a multi-platform, test-friendly food ordering sandbox designed for practicing UI + API automation (web + mobile) with deterministic chaos users and multi-market pricing.

## Live Deployments (Render)
- **Web:** https://omnipizza-frontend.onrender.com
- **API:** https://omnipizza-backend.onrender.com

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
- When the user changes the market, the UI switches to the market default:
  - **MX → Spanish (es)**
  - **US → English (en)**
  - **CH → German (de)** (with toggle to **French (fr)**)
  - **JP → Japanese (ja)**

### Payment (UI simulation)
Checkout supports:
- **Online (Card)** — UI form only (card details are **not sent** to backend)
- **On delivery** — Cash / Card

### Profile (Delivery Details)
The **Profile** page stores delivery details (name/address/phone) and **auto-fills Checkout**.

### Order Success
After checkout, the **Order Success** screen is shown and the last order remains accessible (web persists it via local storage).

---

## Project structure

```
OmniPizza/
├── backend/          # FastAPI backend (in-memory DB)
├── frontend/         # React + Vite + Tailwind web app
├── frontend-mobile/  # React Native / Expo mobile app
└── tests/            # Contract tests (Schemathesis)
```

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
npm start
```

> Mobile is configured to use the **Render API** by default (no `.env` needed).  
> To run against local backend, change `API_ORIGIN` in `frontend-mobile/src/api/client.ts`.

---

## Automation notes
- `/api/pizzas` requires `X-Country-Code` header for market pricing.
- Use the test users to validate reliability and chaos behaviors.

---

## License
MIT
