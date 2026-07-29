# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

OmniPizza is a deliberately-shaped QA testing sandbox: a multi-market (MX/US/CH/JP/SA) pizza ordering app with three deployables (FastAPI backend, React/Vite web, Expo/React Native mobile) plus an external test suite. SA (Saudi Arabia / Arabic) additionally exercises right-to-left (RTL) layout. The product itself exists to exercise UI + API automation — deterministic "chaos" test users, market-specific checkout rules, and atomic state-injection entry points are first-class features, not afterthoughts.

Deployed at `https://omnipizza-backend.onrender.com` (API) and `https://omnipizza-frontend.onrender.com` (web). Mobile points at the Render API by default (`frontend-mobile/src/api/client.ts`).

## Layout

```
backend/          FastAPI + Pydantic, in-memory DB (resets per restart)
frontend/         React 18 + Vite + Zustand + TailwindCSS + react-router (pnpm)
frontend-mobile/  Expo 54 / RN 0.81 + Zustand + react-navigation (pnpm)
tests/            Vitest API integration tests in TypeScript (pnpm)
                  + legacy Schemathesis contract tests (Python)
docs/, documents/ Product, design, and tech docs
```

## Commands

All JS workspaces use **pnpm 10**. There is no monorepo workspace — each app installs in its own directory.

### Backend (Python 3.11)

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py                                     # serves on :8000, Swagger at /api/docs
```

### Web (`frontend/`)

```bash
pnpm install
pnpm dev                                            # vite --host 0.0.0.0 --port 3000
pnpm build                                          # vite build -> frontend/dist
pnpm test:ct                                        # Cypress component tests (headless)
pnpm test:ct:open                                   # Cypress component runner UI
```

`VITE_API_URL` (defaults to `http://localhost:8000`) and `VITE_APP_RELEASE` (used to invalidate localStorage on deploy in `src/store.js`).

### Mobile (`frontend-mobile/`)

```bash
pnpm install
pnpm ios            # expo start --localhost --clear
pnpm android        # expo start --android --localhost --clear
pnpm prebuild       # expo prebuild --clean  (regenerates ios/ and android/)
pnpm build:android          # cd android && ./gradlew assembleRelease
pnpm build:ios:simulator    # pod install + xcodebuild for iphonesimulator SDK
```

`API_ORIGIN` is hardcoded to the Render URL in `frontend-mobile/src/api/client.ts` — change there to point at a local backend.

There is no in-repo mobile e2e runner. Mobile end-to-end coverage lives in the separate Atomic-Helix-Model-TS harness, which drives the release APK / simulator `.app` through Appium using the `omnipizza://` deep links (see `ATOMIC_MOBILE_TESTING.md`).

### API tests (`tests/`)

```bash
cd tests
pnpm install
pnpm test                                           # vitest run, requires backend on :8000
pnpm test:watch
pnpm test:ui
API_BASE_URL=http://other-host:8000 pnpm test       # override target
pnpm test -- api.test.ts -t "Country Specific"      # single suite/test
```

Legacy Schemathesis: `pip install -r requirements.txt && pytest test_contract.py -v`.

### Docker

`docker-compose up -d` brings up backend (:8000) and frontend nginx (:3000). The in-memory DB makes container restarts a state reset.

## Architecture

### Backend (`backend/`)

- **FastAPI app assembled in `main.py`**, which mounts feature routers from `backend/routers/`: `auth.py` (`/api/auth/*`, `/api/users/me/profile`), `catalog.py` (`/api/countries`, `/api/pizzas`), `checkout.py` (`/api/checkout`, `/api/orders`), `debug_chaos.py` (`/api/debug/*`) — plus `test_api.router` for the atomic test-state endpoints (`/api/store/market`, `/api/cart`, `/api/session*`). `main.py` keeps the app skeleton: CORS, Prometheus counters, exception handlers, and `/` + `/health`. Routes/response shapes are a stable automation contract — moving an endpoint between routers must not change its path.
- **State** lives entirely in `database.py::InMemoryDB` — orders, per-user sessions (market, cart), and per-session editable profiles. Restart = clean slate. Do not introduce persistence without a deliberate reason; the reset behavior is what makes this safe for chaos tests.
- **Profile is keyed by session, not username** (since the 2026-07-17 fix for a login-race condition) — every `POST /api/auth/login` mints a per-token `sid` JWT claim, and `get/update/reset/seed_user_profile` in `database.py` store the editable profile under that `sid`, not under `username`. This means a fresh login always starts with a clean profile automatically (no explicit reset call needed), and two concurrent logins for the same shared test user (e.g. two market scenarios authenticating as `standard_user` in parallel) get isolated profiles instead of one clobbering the other. Cart/market session state is unaffected — still keyed by username, since concurrent-session collisions there haven't been observed/reported.
- **Multi-market is data, not code branches.** `constants.py::COUNTRY_CONFIG` (MX/US/CH/JP/SA) drives currency, decimal places, required fields (`colonia`/`zip_code`/`plz`/`prefectura`/`district`), tax rate, delivery fee (USD source converted via `CURRENCY_RATES`), and the per-market tip field name (`propina`/`tip`/`trinkgeld`/`chip`/`baksheesh`). When adding markets or rules, edit the config table — `main.py::checkout` validates from it, and `database.py::calculate_order_total` reads from it.
- **Deterministic "chaos" users** (`TEST_USERS` in `constants.py`) drive behavior via the JWT `behavior` claim. `middleware.py::apply_user_behavior` sleeps 3s for `performance_glitch`; `database.py::should_trigger_error` flips a coin for `error_user`; `problem_user` gets $0 prices + broken images in the catalog. The `locked_out_user` is rejected at login (403). `a11y_glitch_user` gets one accessibility defect per catalog/cart response (`A11Y_GLITCH_MODES`); `security_glitch_user` gets an XSS-seeded profile, order detail without an ownership check (IDOR), and checkout errors leaking internal detail. There are **7** users; password is `pizza123` for all.
- **Required headers on most endpoints:** `Authorization: Bearer <jwt>`, `X-Country-Code`, `X-Language`. `require_country_header` rejects 400 if missing — keep this strict, automation depends on it.

### Frontend feature slices (web + mobile mirror each other)

Both `frontend/src/features/*` and `frontend-mobile/src/features/*` use the slices `auth`, `catalog`, `checkout`, `country`, `profile`, `orderSuccess`. Inside each slice:

- `repositories/` — thin axios wrappers around one endpoint
- `useCases/` — orchestration, payload building, market-specific validation

Pages/screens consume use-cases; legacy hooks under `frontend/src/hooks` and `frontend-mobile/src/hooks` remain as compatibility wrappers during incremental migration — prefer use-cases for new work.

The HTTP layer auto-injects `X-Country-Code`, `X-Language`, and `Authorization` from the Zustand stores (`frontend/src/services/httpClient.js`, `frontend-mobile/src/api/client.ts`). Web also handles `401 → logout → /` globally.

### State (Zustand)

- **Web:** `useAuthStore`, `useCountryStore`, cart store in `frontend/src/store.js` (each wrapped in Zustand `devtools` middleware for Redux DevTools time-travel; the 5 stores stay separate — their persist keys are load-bearing). Auth/country/cart persist to `localStorage` with keys `omnipizza-auth`, `omnipizza-country`, `omnipizza-cart`. `VITE_APP_RELEASE` mismatch on boot clears `token`/`username`/`omnipizza-auth` to avoid stale-deploy auth.
- **Mobile:** `useAppStore` in `frontend-mobile/src/store/useAppStore.ts` — ephemeral (no AsyncStorage). Country/language defaults come from a fresh `GET /api/countries` call in `App.tsx`.

### Atomic test entry (critical to preserve)

This is a load-bearing feature. Two paths:

1. **Web** — `Playwright page.addInitScript()` to seed `localStorage` auth, then navigate directly to `/checkout`, `/catalog`, etc. The Checkout page calls `GET /api/cart` on load when the local cart is empty, hydrating from backend state seeded via `POST /api/cart`. The protected pages are `React.lazy`-loaded behind a `<Suspense>` boundary (fallback `data-testid="route-loading"`), so a direct navigation briefly shows that fallback before the page mounts — auto-waiting on the page's own `data-testid` absorbs it (verified: seed + direct-navigate to lazy `/checkout` still hydrates the cart). See `ATOMIC_WEB_TESTING.md`.
2. **Mobile** — `omnipizza://` deep links wired in `frontend-mobile/src/navigation/linking.ts` + `frontend-mobile/src/hooks/useDeepLinkParams.ts`. Universal query params: `accessToken=<jwt>` (bypasses Login), `market=US|MX|CH|JP|SA` (also sets that market's default language, incl. `SA→ar` RTL), `lang=de|fr` (honored for CH only), `resetSession=true`, `hydrateCart=true`. `client.ts` also reads an optional `detoxCountryCode` launch arg (`NativeModules.ExpoLaunchArguments`) that overrides `X-Country-Code` — a vestigial name from a removed Detox setup; the reader stays because the published APK depends on it. See `ATOMIC_MOBILE_TESTING.md`.

When changing checkout/cart/auth flows, verify these paths still work — they have no UI to fall back to.

### `data-testid` selectors are a contract

Every interactive element exposes a stable `data-testid` (web) or `testID` (mobile). Mobile additionally exposes readable text on visible nodes for Appium/XCUITest `getText()`. External automation depends on these — treat renames as breaking changes and grep usages before touching them.

## CI

- `.github/workflows/frontend-component-tests.yml` — Cypress component tests on PRs touching `frontend/**`, `continue-on-error: true` (non-blocking).
- `.github/workflows/mobile-release.yml` — `workflow_dispatch` only, builds Android release APK and iOS simulator `.app`, publishes to GitHub Releases.

## Conventional Commits

Repo follows `feat:` / `fix:` / `docs:` / `refactor:` / `chore:` / `test:` / `style:` (see `CONTRIBUTING.md`). Recent history bears this out.
