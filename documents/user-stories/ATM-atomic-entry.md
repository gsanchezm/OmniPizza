# Epic ATM — Atomic Entry & Testability

Atomic entry lets QA automation skip the UI: it injects a bearer token, a market, a cart, a profile or an order id, then opens the app at the screen under test. This epic covers the web init-script seeding path, the mobile `omnipizza://` deep links, the state-injection API behind them, and the contracts (test ids, headers, error bodies, Appium text, API test suites) that automation depends on.

Evidence basis: this worktree's HEAD `9ca3767` (branch `worktree-agent-a6dd2f82beadb82a6`, main `87966da` + 1). The 2026-10-28 fixes c55c5c5, 60774e3, b2179d9 and bbbd4ed are on `US-and-Improvements` (088c650) only; they are cited by sha and not verified at path:line here.

| ID | Title | Layer | Status |
| :--- | :--- | :--- | :--- |
| US-ATM-001-WEB | Seed an authenticated web session before the app boots | WEB | Done |
| US-ATM-001-MOB | Inject a bearer token through the `accessToken` deep link | MOB | Done |
| US-ATM-002-API | Set the session market with `POST /api/store/market` | API | Done |
| US-ATM-002-WEB | Market seed through `omnipizza-country` sets the UI language | WEB | Done |
| US-ATM-002-MOB | Select a market and its default language with `market` | MOB | Done |
| US-ATM-002-UX | Arabic (SA) renders right-to-left on entry | UX | Done |
| US-ATM-003-API | Seed, upsert, remove and read the session cart | API | Done |
| US-ATM-004-API | `GET /api/cart` omits toppings and drops unknown pizzas | API | Found |
| US-ATM-005-WEB | Checkout hydrates its cart from `GET /api/cart` | WEB | Done |
| US-ATM-005-MOB | `hydrateCart` clears the local cart and Checkout hydrates | MOB | Done |
| US-ATM-006-API | Read and reset the session with `/api/session` | API | Done |
| US-ATM-006-MOB | `resetSession` logs out and returns to Login | MOB | Done |
| US-ATM-007-API | Seed a deterministic editable profile with `POST /api/profile` | API | Done |
| US-ATM-008-MOB | Open the pizza builder by deep link (`pizzaId`, `size`) | MOB | Done |
| US-ATM-009-WEB | `/order-success?orderId=` hydrates the order from the API | WEB | Done |
| US-ATM-009-MOB | `orderId` deep link hydrates the last order | MOB | Done |
| US-ATM-010-WEB | Protected routes redirect to login without a token | WEB | Done |
| US-ATM-010-MOB | Mobile has no auth guard; deep links reach any screen | MOB | Done |
| US-ATM-011-WEB | Web test ids carry a viewport suffix via `tid()` | WEB | Done |
| US-ATM-011-MOB | Mobile test ids use layer prefixes | MOB | Done |
| US-ATM-012-WEB | Documented web automation hooks match the code | WEB | Found |
| US-ATM-012-MOB | Documented mobile test-id prefixes match the code | MOB | Found |
| US-ATM-013-MOB | Readable text for Appium `getText()` | MOB | Done |
| US-ATM-014-MOB | `detoxCountryCode` launch argument overrides the country header | MOB | Done |
| US-ATM-015-API | `X-Country-Code` is required and validated | API | Done |
| US-ATM-016-API | `X-Language` is documented as required but is optional | API | Found |
| US-ATM-017-API | Error body shapes are not uniform and only one is documented | API | Found |
| US-ATM-018-API | Swagger UI, ReDoc and OpenAPI JSON are served | API | Done |
| US-ATM-019-API | Vitest API and golden suites run against a live backend | API | Done |
| US-ATM-020-API | Legacy Schemathesis contract test does not match its pins | API | Found |

---

### US-ATM-001-WEB · Seed an authenticated web session before the app boots
**As a** QA engineer **I want** to inject a token and username into localStorage with `addInitScript` **so that** protected pages open directly without the login UI.

- Layer: WEB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3 (atomic web guide introduced)

**Acceptance criteria**
1. Given `token` and `username` in localStorage before the bundle runs, when the app boots, then the auth store reads them as its initial state and protected routes render.
2. Given a token that does not look like a JWT, when a request is sent, then no `Authorization` header is attached (JWT-shape gate).
3. Given `omnipizza-release` in localStorage differs from `VITE_APP_RELEASE` (default `"dev"`), when the store module loads, then `token`, `username` and `omnipizza-auth` are removed; a seed must therefore also write `omnipizza-release`.
4. Given a direct navigation to `/checkout`, when the lazy route chunk is still loading, then the `route-loading` fallback is shown until the page mounts.

**Evidence**: `frontend/src/store.js:5-24` (release guard), `frontend/src/store.js:33-34` (token/username initial state), `frontend/src/store.js:62` (persist key `omnipizza-auth`), `frontend/src/services/httpClient.js:23-31` (JWT gate at line 30), `frontend/src/routes/ProtectedRoute.jsx:5-14`, `frontend/src/App.jsx:44`, `ATOMIC_WEB_TESTING.md:88`, `ATOMIC_WEB_TESTING.md:103-108` (silent-wipe gotcha), `ATOMIC_WEB_TESTING.md:167-170` (seed recipe).
**Notes**: The release guard was added in 48eaab5 (2026-02-08). Browser behaviour not run in this pass (Unverified in a browser); the statements are from code paths and the guide.

---

### US-ATM-001-MOB · Inject a bearer token through the `accessToken` deep link
**As a** QA engineer **I want** `omnipizza://<screen>?accessToken=<jwt>` to authenticate the app **so that** automation bypasses the Login form.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-06 · Commit: 5b2180e

**Acceptance criteria**
1. Given an `accessToken` query param on a cold or warm deep link, when the URL is processed, then `setToken` stores it before any other param is applied.
2. Given the token is set and Login is the only route on the stack, when LoginScreen renders, then it replaces itself with Catalog.
3. Given a token is in the store, when a request is sent, then `Authorization: Bearer <token>` is added unless the caller set one.
4. Given the app process restarts, then the token is gone, because the store is not persisted; the link must be re-issued on each launch.

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:90-92` (token first), `:135-149` (cold and warm start), `frontend-mobile/src/screens/LoginScreen.tsx:57-66`, `frontend-mobile/src/api/client.ts:44-46`, `frontend-mobile/src/store/useAppStore.ts:114` (`setToken`); no `persist` or `AsyncStorage` in `useAppStore.ts` (grep).
**Notes**: `resetSession` in the same URL returns early and skips this step (see US-ATM-006-MOB). The deep-link route table is in `frontend-mobile/src/navigation/linking.ts:36-47`.

---

### US-ATM-002-API · Set the session market with `POST /api/store/market`
**As a** QA engineer **I want** to set the active market of my login session through the API **so that** the next requests price and validate for that market without the UI.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457 (endpoint); decoupled from cart in 9deed6d (2026-05-20)

**Acceptance criteria**
1. Given a valid bearer and body `{"country_code":"SA"}`, when the endpoint is called, then it returns 200 with `country_code: "SA"` for that login session only.
2. Given the same call, then the cart is not cleared; only the market and `updated_at` change.
3. Given `country_code` in lowercase (`"sa"`), then the response is 422 with a `{"detail": [...]}` enum error (verified in TestClient); the header `X-Country-Code` is case-insensitive, so the two inputs disagree.
4. Given an invalid body value (`"ZZ"`), then the response is 422 with the allowed values listed (verified).

**Evidence**: `backend/test_api.py:34-56`, `backend/database.py:170-174`, `backend/models.py:172-174` (enum body field), `backend/middleware.py:19-21` (header upper-cased), `backend/test_api.py:40-45` (docstring: market does not clear cart).
**Notes**: Observed under the venv's fastapi 0.139.0 / starlette 1.3.1, not the pins in `backend/requirements.txt:1`. The PRD §13.7 mobile example passes `lang=es`, which the app ignores (see US-ATM-002-MOB).

---

### US-ATM-002-WEB · Seed the market through `omnipizza-country` so the UI language follows
**As a** QA engineer **I want** a web session seeded with the documented `omnipizza-country` state (market and language) **so that** direct navigation tests see the market's language and layout.

- Layer: WEB · Epic: ATM · Persona: QA · Market: SA (all markets)
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3 (atomic web guide with the seed recipe)

**Acceptance criteria**
1. Given the documented seed writes `omnipizza-country` with `countryCode: "SA"` and `language: "ar"` (`ATOMIC_WEB_TESTING.md:151-157`), when the store rehydrates, then the UI language is `ar` (persist name `omnipizza-country`, `frontend/src/store.js:150`).
2. Given the same seed and a token, then `<html dir="rtl">` is set (`frontend/src/App.jsx:29-33`) and `X-Language` is `ar` (`frontend/src/services/httpClient.js:28`).
3. Given only the flat `countryCode` key is seeded (the guide's flat-mirror row, `ATOMIC_WEB_TESTING.md:95`), then the language stays `en`: the store initialises `language` to `"en"` (`frontend/src/store.js:96-104`), and only `setCountryCode` maps market to language (`store.js:110-131`, called from `frontend/src/pages/Login.jsx:80`).

**Evidence**: `ATOMIC_WEB_TESTING.md:88-95`, `:143-157`; `frontend/src/store.js:96-104`, `:110-131`, `:150`; `frontend/src/pages/Login.jsx:80`; `frontend/src/App.jsx:29-33`; `frontend/src/services/httpClient.js:27-28`.
**Notes**: The guide's seed recipe covers language, so the gap is limited to seeds that write only the flat `countryCode` key (AC 3). This was a Found in the first draft and was recast after the review: the procedure is documented. Code-path reading; the browser run is Unverified. Mobile applies the market language on the `market` param (US-ATM-002-MOB).

---

### US-ATM-002-MOB · Select a market and its default language with `market`
**As a** QA engineer **I want** `omnipizza://<screen>?market=SA` to set the market and its language **so that** Arabic and other market flows start from a deep link.

- Layer: MOB · Epic: ATM · Persona: QA · Market: US, MX, CH, JP, SA
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3

**Acceptance criteria**
1. Given `market=SA`, when processed, then `setCountry("SA")` sets language `ar` from `MARKET_LANG` and clears `cartItems`.
2. Given `market=sa` (lowercase), then it is upper-cased and accepted; a value outside `US|MX|CH|JP|SA` is ignored.
3. Given `lang=fr` or `lang=de` on a non-CH market, then the value is ignored, because `setLanguage` returns early unless the country is CH.
4. Given `market=CH` and `lang=fr`, then the language becomes `fr` and the `chLanguage` preference is updated.

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:8`, `:95-107`; `frontend-mobile/src/store/useAppStore.ts:75-81` (`MARKET_LANG`), `:99-105` (`setCountry`), `:107-112` (`setLanguage` guard); `frontend-mobile/src/navigation/linking.ts:16-21` (param contract).
**Notes**: PRD §13.7 example (`lang=es`) is a no-op; the app accepts only `fr` and `de` (`useDeepLinkParams.ts:105`), so the PRD example is drift (`documents/Product_Requirement_Doc.md:319`).

---

### US-ATM-002-UX · Arabic (SA) renders right-to-left on entry
**As a** Arabic-speaking customer **I want** the Arabic market to lay out right-to-left **so that** reading order and alignment match my language.

- Layer: UX · Epic: ATM · Persona: Customer (the atomic path is QA) · Market: SA
- Status: Done
- Done on: 2026-07-09 · Commit: 069bc45 (reactive RTL, no reload)

**Acceptance criteria**
1. Given mobile language `ar`, when a component calls `useRTL()`, then `textAlign` is `right`, `row` is `row-reverse` and `writingDirection` is `rtl`.
2. Given the app process, then the native direction stays LTR (`I18nManager.allowRTL(false)`), so RTL flips from state without a reload that would drop the ephemeral session.
3. Given web is authenticated with language `ar`, then `<html dir="rtl">` and `lang="ar"` are set; the login view is always LTR English.
4. Given web is seeded with only the flat `countryCode` key, then the RTL expectation is not met (US-ATM-002-WEB AC 3); the documented `omnipizza-country` seed meets it.

**Evidence**: `frontend-mobile/src/hooks/useRTL.ts:22-30`, `frontend-mobile/App.tsx:34`, `frontend/src/App.jsx:24-33`.
**Notes**: Arabic script is bidi by default; `useRTL` drives only alignment, row order and writing direction (`useRTL.ts:11-13`).

---

### US-ATM-003-API · Seed, upsert, remove and read the session cart
**As a** QA engineer **I want** to seed and edit the cart of my login session through the API **so that** checkout tests start from a known cart.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457 (POST and GET); PUT and DELETE in 503f4d6 (2026-08-12)

**Acceptance criteria**
1. Given `POST /api/cart` with items, then the session cart is replaced, each line without an `item_id` gets `ITEM-xxxxxxxx`, and the header `X-Country-Code` is not required (verified: 200 without it).
2. Given `PUT /api/cart/items/{item_id}`, then an unknown id is appended and a known id is replaced; a body `item_id` is ignored and the URL wins (verified).
3. Given `DELETE /api/cart/items/{item_id}` for an unknown id, then 404 with `{"error":"Cart item <id> not found", "status_code":404, ...}` (verified).
4. Given a second login for the same user, then its cart is isolated, because the cart is keyed by the JWT `sid` (`backend/routers/auth.py:60`).

**Evidence**: `backend/test_api.py:59-87` (POST), `:119-142` (PUT), `:145-165` (DELETE), `backend/database.py:176-183`, `:185-206`, `backend/routers/auth.py:60`.
**Notes**: The `sid` keying is commit b407760 (2026-08-11). The read side and its shape gap are US-ATM-004-API.

---

### US-ATM-004-API · `GET /api/cart` omits toppings and drops unknown pizzas
**As a** QA engineer **I want** `GET /api/cart` to return every seeded line with its toppings **so that** hydration tests can check the full cart.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap)

**Acceptance criteria**
1. Expected: each enriched item carries the seeded `toppings`. Actual: `EnrichedCartItem` has no `toppings` field, and `get_enriched_cart` does not copy it (verified: a line seeded with `toppings: ["t1"]` comes back without the key).
2. Expected: an unknown `pizza_id` is rejected or flagged. Actual: `POST /api/cart` accepts `p99` (200) and `GET /api/cart` silently omits it (verified: returns `[]`).
3. Consequence: web and mobile hydration set `toppings: []` for every line, so toppings are lost in both apps.
4. Fix on another branch: bbbd4ed (toppings in the GET item shape) and 91d036c (docs) are on `US-and-Improvements` only; not verifiable at path:line in this checkout.

**Evidence**: `backend/models.py:68-78` (`EnrichedCartItem`), `backend/models.py:182-185` (`TestSessionStateResponse` uses `CartItem`, which has toppings), `backend/database.py:235-237` (skip), `:251-262` (fields emitted), `frontend/src/pages/Checkout.jsx:171`, `frontend-mobile/src/screens/CheckoutScreen.tsx:118`.
**Notes**: The state-injection endpoints return toppings (`TestSessionStateResponse`), but `GET /api/cart` does not, so the two read paths disagree.

---

### US-ATM-005-WEB · Checkout hydrates its cart from `GET /api/cart`
**As a** QA engineer **I want** `/checkout` to load the cart seeded through the API **so that** the order summary shows API-seeded items.

- Layer: WEB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-11 · Commit: 75a849f (cart hydration for web and mobile)

**Acceptance criteria**
1. Given a token and an empty local cart, when Checkout mounts, then `GET /api/cart` is called once.
2. Given the response has items, then the local cart is replaced with hydrated lines and unit prices are recomputed client-side.
3. Given the local cart already has items, then no request is sent (normal shopping flow wins).
4. Given the request fails, then the local cart is left unchanged.

**Evidence**: `frontend/src/pages/Checkout.jsx:133-187` (effect), `:142` (skip guard), `:144` (request), `:171` (`toppings: []`), `:181-183` (fallback); `frontend/src/services/cart.service.js:4`.
**Notes**: Toppings are dropped (US-ATM-004-API). `logout` in `frontend/src/store.js:43-60` does not clear `omnipizza-cart` in this checkout; 60774e3 (web logout clears cart and last order) is on `US-and-Improvements` only.

---

### US-ATM-005-MOB · `hydrateCart` clears the local cart and Checkout hydrates
**As a** QA engineer **I want** `hydrateCart=true` to force Checkout to load the cart from the API **so that** a deep link can open a seeded checkout.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3 (`hydrateCart` param); hydration itself from 75a849f (2026-03-11)

**Acceptance criteria**
1. Given `hydrateCart=true`, then `clearCart()` runs; no other side effect is needed.
2. Given the local cart is empty and a token exists, then CheckoutScreen calls `GET /api/cart` and sets `cartItems`.
3. Given the token arrives late (deep link), then the hydration effect re-runs because it depends on `[token]`.
4. Given `market` and `hydrateCart` in one URL, then `market` runs first and clears the cart, and `hydrateCart` then has no conflict.

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:109-112`, `frontend-mobile/src/screens/CheckoutScreen.tsx:76-134` (`:85` skip, `:87` request, `:126` set, `:134` deps), `frontend-mobile/src/store/useAppStore.ts:99-105`.
**Notes**: Toppings are dropped at `CheckoutScreen.tsx:118` (US-ATM-004-API). Hydration failures are swallowed (`:128-130`).

---

### US-ATM-006-API · Read and reset the session with `/api/session`
**As a** QA engineer **I want** to read the session state and reset it **so that** each test can start clean and check what is stored.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457 (endpoints); per-sid keying in b407760 (2026-08-11)

**Acceptance criteria**
1. Given `GET /api/session` with a bearer, then the response has `username`, `country_code`, `cart_items` and `updated_at` for that login session (verified: 200).
2. Given `POST /api/session/reset`, then the cart is emptied, the market returns to the default and the editable profile is cleared (verified: cart `[]`, country `MX`, `full_name` empty).
3. Given two logins for the same user, then the reset affects only the caller's session, because both session and profile are keyed by `sid`.

**Evidence**: `backend/test_api.py:193-229`, `backend/database.py:208-212`, `backend/routers/auth.py:60`.
**Notes**: The reset endpoint is the server-side counterpart of the mobile `resetSession` param (US-ATM-006-MOB); the mobile param does not call the API.

---

### US-ATM-006-MOB · `resetSession` logs out and returns to Login
**As a** QA engineer **I want** `resetSession=true` to clear the app session **so that** a test can return to Login from any screen.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3

**Acceptance criteria**
1. Given `resetSession=true`, then `logout()` clears the token, `cartItems`, `lastOrder` and resets language to `en`.
2. Given navigation is ready, then the stack is reset to `Login` on the next tick.
3. Given other params in the same URL (`accessToken`, `market`, `hydrateCart`, `orderId`), then they are ignored, because the function returns early.
4. Given a cold or warm start, then the same handler runs.

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:78-86` (early return at `:85`), `frontend-mobile/src/store/useAppStore.ts:118-128`, `frontend-mobile/src/navigation/linking.ts:33`.
**Notes**: A `resetSession` fired while a test is running logs the session out by design; that timing is a harness concern. The server-side reset is US-ATM-006-API.

---

### US-ATM-007-API · Seed a deterministic editable profile with `POST /api/profile`
**As a** QA engineer **I want** to pin the editable profile to known values **so that** visual-regression baselines are reproducible.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-05-30 · Commit: 124b268

**Acceptance criteria**
1. Given `POST /api/profile` with `full_name`, then the profile is reset to defaults with that field overlaid and other fields empty (verified).
2. Given the call, then `X-Country-Code` is not read (market-independent).
3. Given `POST /api/session/reset`, then the profile returns to the empty default (verified).

**Evidence**: `backend/test_api.py:168-190`, `backend/models.py:188-194` (`TestProfileSeedRequest`), `backend/database.py:119-135` (reset and seed methods).
**Notes**: Endpoint is missing from PRD §8 (`documents/Product_Requirement_Doc.md:168-191`) and from the CLAUDE.md description of `test_api.router`.

---

### US-ATM-008-MOB · Open the pizza builder by deep link
**As a** QA engineer **I want** `omnipizza://pizza-builder?pizzaId=<id>&size=<size>` to open the builder preselected **so that** customization tests start at the right item.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3 (`pizzaId`); customizer alias 0db098b (2026-06-02)

**Acceptance criteria**
1. Given `pizzaId` in the URL, then the builder resolves `pizzaId` (or the contract alias `item`) and loads the pizza from the catalog for the current token and market.
2. Given `size`, then it is used; when absent the size is `small`.
3. Given `omnipizza://customizer?item=<id>`, then the path is aliased to `pizza-builder` and the query is kept.
4. Given the pizza is not found or the catalog fails, then the builder stays mounted empty and does not navigate away.
5. Given a deep link, then toppings cannot be set: only `initialConfig` provides them.

**Evidence**: `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:71-108` (params, lookup, size, toppings), `:85-98` (fetch and fallbacks), `frontend-mobile/src/navigation/linking.ts:51-57` (alias), `frontend-mobile/src/navigation/types.ts:7-31` (params; no toppings deep-link key).
**Notes**: The web app has no builder route; the web builder is a modal on the catalog (`frontend/src/components/PizzaCustomizerModal.jsx`), so this is mobile only.

---

### US-ATM-009-WEB · `/order-success?orderId=` hydrates the order from the API
**As a** QA engineer **I want** `/order-success?orderId=<id>` to show that order **so that** confirmation-screen tests skip checkout.

- Layer: WEB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-05-20 · Commit: e938e51

**Acceptance criteria**
1. Given `orderId` differs from the stored `lastOrder.order_id`, then `GET /api/orders/{id}` is called and the result becomes `lastOrder`.
2. Given the stored order already matches, then no request is sent.
3. Given the request fails, then the page renders the courier-only view (no error UI).
4. Given the protected route, then a token is required (see US-ATM-010-WEB).

**Evidence**: `frontend/src/pages/OrderSuccess.jsx:16-27`, `frontend/src/services/order.service.js:6`, `frontend/src/App.jsx:54`, `frontend/src/pages/OrderSuccess.jsx:32` (`screen-order-success`).
**Notes**: Ownership and 403/404 behaviour of the order endpoint belong to the ORD epic and are not re-verified here.

---

### US-ATM-009-MOB · `orderId` deep link hydrates the last order
**As a** QA engineer **I want** `omnipizza://order-success?orderId=<id>` to show that order **so that** mobile confirmation tests skip checkout.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-05-20 · Commit: e938e51

**Acceptance criteria**
1. Given `orderId`, then `orderService.getOrder` runs and the result is stored with `setLastOrder`.
2. Given the request fails, then the screen still renders; the warning is logged only in `__DEV__`.
3. Given the path `order-success`, then the route maps to `OrderSuccess` (screen name `OrderSuccess`).
4. Given no token, then the request fails silently; the app has no 401 handler in this checkout.

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:119-130`, `frontend-mobile/src/navigation/linking.ts:44`, `frontend-mobile/src/navigation/types.ts:38-42`, `frontend-mobile/src/screens/OrderSuccessScreen.tsx:40`.
**Notes**: Token ordering: `accessToken` is applied before `orderId` (`useDeepLinkParams.ts:88-92` then `:119`).

---

### US-ATM-010-WEB · Protected routes redirect to login without a token
**As a** QA engineer **I want** protected pages to redirect to login when no token is present **so that** a missing seed fails loudly rather than rendering an empty page.

- Layer: WEB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 8526014

**Acceptance criteria**
1. Given no token, when `/catalog`, `/checkout`, `/profile` or `/order-success` is opened, then the user is redirected to `/` with `state.from` set.
2. Given a token, then the protected outlet renders.
3. Given an unknown path, then it redirects to `/`.
4. Given a protected page, then the page chunk is lazy-loaded and `route-loading` is the Suspense fallback until it mounts (lazy since cc5f074, 2026-07-12).

**Evidence**: `frontend/src/routes/ProtectedRoute.jsx:5-14`, `frontend/src/App.jsx:11-14`, `:44`, `:50-58`.
**Notes**: `ATOMIC_WEB_TESTING.md:16` documents the fallback. The claim that waiting on the page's own test id absorbs it comes from CLAUDE.md and was not re-run here (Unverified).

---

### US-ATM-010-MOB · Mobile has no auth guard; deep links reach any screen
**As a** QA engineer **I want** any mobile screen to open by deep link, with or without a token **so that** atomic tests can enter at the screen under test.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-06 · Commit: e6628e3 (deep-link routing for atomic entry); Login auto-redirect rule 03b03e8 (2026-04-17)

**Acceptance criteria**
1. Given no token, when `omnipizza://checkout` opens, then the Checkout screen mounts; the stack registers all screens regardless of auth.
2. Given a token and only Login on the stack, then Login replaces itself with Catalog; with a deep-linked screen on top it does not redirect.
3. Given a failed catalog or hydration call, then the screen stays mounted; errors are caught.
4. Given a 401 from any request, then nothing redirects to Login: no response interceptor exists in this checkout.

**Evidence**: `frontend-mobile/App.tsx:82-91` (screens; `initialRouteName` at `:83`), `frontend-mobile/src/screens/LoginScreen.tsx:57-66`, `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:94-98`, `frontend-mobile/src/screens/CheckoutScreen.tsx:128-130`, `frontend-mobile/src/api/client.ts:34-49` (request interceptor only; no `401` string under `frontend-mobile/src`).
**Notes**: 401 handling (`src/api/unauthorized.ts`, navigationRef moved to `src/navigation/navigationRef.ts`) is c55c5c5 on `US-and-Improvements`; not in this checkout, so not verifiable here.

---

### US-ATM-011-WEB · Web test ids carry a viewport suffix via `tid()`
**As a** QA engineer **I want** each web test id to be stable for the current viewport **so that** selectors resolve on desktop and on mobile widths.

- Layer: WEB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-24 · Commit: 7f7ac1e

**Acceptance criteria**
1. Given a viewport at or above 768px, when `tid(base)` runs, then `-desktop` is appended; below, `-responsive` (`useResponsive.js:3`, `:7`, `:17-19`).
2. Given `tid("username")` on login, then the id is `username-desktop` or `username-responsive` (`frontend/src/pages/Login.jsx:155`).
3. Given a literal id, then no suffix is added: `logout-btn` (`frontend/src/components/Navbar.jsx:146`), `delete-account-btn` (`frontend/src/pages/Profile.jsx:156`), `category-${id}` (`frontend/src/components/CategoryFilter.jsx:21`), `size-${id}` (`frontend/src/components/PizzaCustomizerModal.jsx:207`), `screen-order-success` (`frontend/src/pages/OrderSuccess.jsx:32`), `route-loading` (`frontend/src/App.jsx:44`).
4. Then consumers must know, per id, whether a suffix applies.

**Evidence**: as cited; the rule is in `frontend/src/hooks/useResponsive.js`.
**Notes**: `ProductCard` falls back to an unsuffixed id when no `tid` is passed (`frontend/src/components/ProductCard.jsx:5`). Mixed behaviour is the root of US-ATM-012-WEB.

---

### US-ATM-011-MOB · Mobile test ids use layer prefixes
**As a** QA engineer **I want** mobile `testID`s to follow one prefix convention **so that** Appium selectors are predictable.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-25 · Commit: 37082da (accessibilityLabel and testID across elements)

**Acceptance criteria**
1. Given a root screen, then its id is `screen-<name>` (`frontend-mobile/src/screens/CheckoutScreen.tsx:282`, `LoginScreen.tsx:112`, `PizzaBuilderScreen.tsx:150`).
2. Given a text input, then the id is `input-<name>` (`LoginScreen.tsx:161`, `:169`).
3. Given a tappable size pill, then the id is `btn-size-<id>` (`PizzaBuilderScreen.tsx:244`).
4. Given the bottom navigation, then items use `nav-<name>` (`frontend-mobile/src/components/BottomNavBar.tsx:57-60`), a prefix not listed in the PRD.

**Evidence**: as cited.
**Notes**: The PRD prefix table is `documents/Product_Requirement_Doc.md:263-271`; the mismatch is US-ATM-012-MOB.

---

### US-ATM-012-WEB · Documented web automation hooks match the code
**As a** QA engineer **I want** the documented web selectors to match what the app renders **so that** I can write selectors from the PRD.

- Layer: WEB · Epic: ATM · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap)

**Acceptance criteria**
1. Expected: `documents/Product_Requirement_Doc.md:248-259` names ids such as `input-username`, `btn-logout`, `btn-delete-account`, `card-pizza-{id}`, `btn-size-{size}` and `btn-category-{id}`.
2. Actual: I queried 17 documented web examples in `frontend/src`; only `courier-info` (`frontend/src/pages/OrderSuccess.jsx:98`) appears as a literal id. The rest are either suffixed by `tid()` or named differently (`logout-btn`, `delete-account-btn`, `pizza-card-<id>`, `size-<id>`, `category-<id>`, `add-to-cart-<id>`).
3. Expected: the table and the code agree. Actual: they do not; the table predates the suffix and naming work.

**Evidence**: `documents/Product_Requirement_Doc.md:248-259`; code lines in US-ATM-011-WEB.
**Notes**: Spot-check only; not exhaustive. The PRD also says the web table is the one to use for selectors, so the drift matters for test authors.

---

### US-ATM-012-MOB · Documented mobile test-id prefixes match the code
**As a** QA engineer **I want** the documented mobile prefixes and examples to match the app **so that** Appium selectors work as written in the PRD.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap)

**Acceptance criteria**
1. Expected: `documents/Product_Requirement_Doc.md:263-271` lists prefixes `btn-`, `input-`, `text-`, `view-`, `img-`, `card-`, `screen-`, with the example `btn-logout`.
2. Actual: no `btn-logout` exists under `frontend-mobile/src`; the bottom-nav logout item is `nav-logout` (`BottomNavBar.tsx:43`, `:57-60`).
3. Actual: the `nav-` prefix (and `icon-nav-`, `view-nav-icon-` labels at `BottomNavBar.tsx:68-69`) is absent from the PRD table.
4. Expected: table and code agree. Actual: they do not.

**Evidence**: as cited above.
**Notes**: Web and mobile tables are separate stories (US-ATM-012-WEB); the mobile convention itself is US-ATM-011-MOB.

---

### US-ATM-013-MOB · Readable text for Appium `getText()`
**As a** QA engineer **I want** each visible text node to expose its readable string while keeping a stable `testID` **so that** Appium can read and assert text on both platforms.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-18 · Commit: a53274d (helper introduced); WCAG pass cf8d2c9 (2026-07-13)

**Acceptance criteria**
1. Given `getReadableTextProps(id, label)`, then the props are `testID: id` and `accessibilityLabel: label` on iOS and Android.
2. Given `getReadableControlProps(id, label)`, then the same two props are returned for controls.
3. Given `getTestProps(id)`, then only `testID` is set, so no raw id is announced to screen readers.
4. Given the screens, then the three helpers are called 143 times across `frontend-mobile/src/screens` (grep count).

**Evidence**: `frontend-mobile/src/utils/qa.ts:12-24`, `:36-50`, `:58-72`; `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:189`, `:217`.
**Notes**: The Android selector guidance is in `ATOMIC_MOBILE_TESTING.md` (corrected in 81957a9, 2026-07-29). Appium is external (Atomic-Helix-Model-TS).

---

### US-ATM-014-MOB · `detoxCountryCode` launch argument overrides the country header
**As a** QA engineer **I want** a launch argument to pin the country header of the app **so that** a run can target a market without deep links.

- Layer: MOB · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-04 · Commit: 0021a3b (first `detoxCountryCode` read)

**Acceptance criteria**
1. Given `NativeModules.ExpoLaunchArguments` (or `LaunchArguments`) with `detoxCountryCode`, then the value is stored at module load.
2. Given a request, then `X-Country-Code` = explicit header, else `detoxCountryCode`, else the store country, else `"MX"`; the launch argument beats the store.
3. Given the name, then it is vestigial: no Detox dependency remains (141776a removed `.detoxrc.js` and `e2e/`), and the reader stays because the published APK depends on it.

**Evidence**: `frontend-mobile/src/api/client.ts:6-25`, `:41`; `ATOMIC_MOBILE_TESTING.md:93-95`; commit 141776a (2026-07-29).
**Notes**: Do not remove the reader without a new APK (141776a message).

---

### US-ATM-015-API · `X-Country-Code` is required and validated
**As a** QA engineer **I want** a missing or invalid country header to fail with a clear 400 **so that** market mistakes are visible in tests.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given no `X-Country-Code` on `/api/cart` or `/api/pizzas` with a valid bearer, then 400 with `"X-Country-Code header is required. Valid values: MX, US, CH, JP, SA"` (verified).
2. Given `X-Country-Code: xx`, then 400 with `"Invalid country code: xx. ..."` (verified).
3. Given `X-Country-Code: mx`, then it is upper-cased and accepted (verified: 200).
4. Given the state endpoints that do not read the header (`POST /api/cart`, `PUT`/`DELETE` cart items, `POST /api/profile`, `POST /api/session/reset`), then the header is not required (`backend/test_api.py:67-68`, `:128`, `:178`).
5. Given no bearer, `/api/cart` returns 401 before the header check, whereas `/api/pizzas` with neither bearer nor `X-Country-Code` returns 400 (both verified). The dependency order is per endpoint.

**Evidence**: `backend/middleware.py:10-26`, `backend/routers/catalog.py:52`, `backend/test_api.py:98`.
**Notes**: Observed under fastapi 0.139.0 (venv). Under the pinned fastapi 0.109.0 the missing-bearer status may differ (Unverified). CLAUDE.md:89 says this header is "strict"; that holds.

---

### US-ATM-016-API · `X-Language` is documented as required but is optional
**As a** QA engineer **I want** the documented header rules to match the API **so that** a test can rely on the contract.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap)

**Acceptance criteria**
1. Expected: `CLAUDE.md:89` lists `X-Language` among the required headers on most endpoints.
2. Actual: `GET /api/pizzas` without `X-Language` returns 200 (verified), and with `X-Language: xx` also 200 (verified).
3. Actual: the catalog defaults to `"en"` (`backend/routers/catalog.py:52`); the cart takes `Optional` and falls back in `_resolve_language` (`backend/test_api.py:99`, `backend/database.py:46`).
4. Actual: PRD §8 lists only `Authorization` and `X-Country-Code` for these endpoints (`documents/Product_Requirement_Doc.md:176-178`), so PRD and CLAUDE.md disagree.
5. The web and mobile clients always send `X-Language` (`frontend/src/services/httpClient.js:28`, `frontend-mobile/src/api/client.ts:42`), so the gap is invisible to the apps.

**Evidence**: as cited.
**Notes**: Pinned-version behaviour Unverified (venv fastapi 0.139.0 used).

---

### US-ATM-017-API · Error body shapes are not uniform and only one is documented
**As a** QA engineer **I want** one documented error body for every failure **so that** assertions do not depend on which layer failed.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap)

**Acceptance criteria**
1. Given an `HTTPException`, then the body is `{error, status_code, timestamp}` (`backend/main.py:75-84`; verified 401, 400, 403, 404).
2. Given a request validation failure (422), a malformed JSON body, or an unknown route (404), then the body is FastAPI's `{"detail": ...}` (verified: 422 enum; 422 `json_invalid`; 404 `{"detail":"Not Found"}`).
3. Given an unhandled exception, then the body is `{error:"Internal server error", detail: str(exc), timestamp}` (`backend/main.py:86-95`); PRD §9 documents this.
4. Expected: PRD §9 documents every shape. Actual: `documents/Product_Requirement_Doc.md:193-197` covers shapes 1 and 3 only.
5. `ErrorResponse` (`backend/models.py:166-169`) is defined but not used by any handler (grep).
6. `tests/test_contract.py:86` reads `response.json()["detail"]` for the locked-out 403, but that body uses `error` (verified), so the legacy test asserts the wrong key.

**Evidence**: as cited.
**Notes**: Fixed on `US-and-Improvements` as b2179d9 (PRD §9 documents the 422 shape; English ZIP message); not in this checkout. Observed under fastapi 0.139.0; `backend/response_docs.py:11-17` describes a 400 for malformed bodies, which matches the pinned fastapi 0.109.0 (Unverified here).

---

### US-ATM-018-API · Swagger UI, ReDoc and OpenAPI JSON are served
**As a** QA engineer **I want** interactive API docs and the machine-readable schema **so that** I can explore endpoints and generate contract tests.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (docs URLs); response fragments 746a475 (2026-08-11)

**Acceptance criteria**
1. Given the running app, then `/api/docs`, `/api/redoc` and `/api/openapi.json` are configured (verified: docs and openapi.json return 200).
2. Given a protected endpoint, then its schema lists 401 (and 400 for country-header endpoints) through the shared fragments (`backend/response_docs.py:8-17`; `backend/test_api.py:46`, `:77`).
3. Given the landing page, then it links to `/api/docs`, `/api/redoc` and `/api/openapi.json` (`index.html:352-370`).

**Evidence**: `backend/main.py:20-27`, `backend/response_docs.py:1-17`, `index.html:352`, `:361`, `:370`.
**Notes**: `/api/version` (9ca3767) is in the schema but absent from PRD §8. `POST /api/profile` is also absent from PRD §8 (see US-ATM-007-API).

---

### US-ATM-019-API · Vitest API and golden suites run against a live backend
**As a** QA engineer **I want** the TypeScript integration suites to run sequentially against one backend **so that** results are deterministic.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-18 · Commit: 5ac7554 (Vitest API tests); golden net e994fae (2026-07-12)

**Acceptance criteria**
1. Given `tests/api.test.ts`, then it defines 12 `describe` suites (lines 27-605), covering login, cart and profile isolation, pizzas, checkout, country rules, debug endpoints, atomic profile setup, order status and PATCH cancellation.
2. Given `tests/golden.test.ts`, then it defines 13 `describe` blocks (lines 76-562) pinning checkout totals per market against a ground-truth table captured 2026-07-12 (`golden.test.ts:39-74`).
3. Given the Vitest config, then `fileParallelism: false` runs files sequentially (`tests/vitest.config.ts:13`).
4. Given a target, then `API_BASE_URL` (default `http://localhost:8000`) selects it (`tests/golden.test.ts:4`; `tests/README.md:47`).

**Evidence**: as cited.
**Notes**: Not executed in this pass (a server must not be started here), so pass/fail is Unverified. The README's cart flow description is at `tests/README.md:56-63`.

---

### US-ATM-020-API · Legacy Schemathesis contract test does not match its pins
**As a** QA engineer **I want** the Schemathesis contract test to run with the versions it is written for **so that** schema drift is caught.

- Layer: API · Epic: ATM · Persona: QA · Market: all
- Status: Found
- Done on: 2026-02-07 · Commit: 4651cae (original); port to the 4.x API in 746a475 (2026-08-11)

**Acceptance criteria**
1. Expected: `tests/requirements.txt:2` and `backend/requirements.txt:9` pin `schemathesis==3.25.1`, and the test runs under that pin.
2. Actual: `tests/test_contract.py:15` uses `schemathesis.openapi.from_url` and `:41`, `:54`, `:64` use `schema.include(...)`, which is the 4.x API ported in 746a475; the commit message says the 3.x calls were removed in 4.x.
3. Actual: the installed package here is schemathesis 4.24.3, where `from_uri` is absent; the 3.25.1 pin is not installed here (Unverified for 3.25.1 itself).
4. Expected: the test passes. Actual: the commit message of 746a475 records remaining failures (RejectedPositiveData on `GET /api/pizzas`, DeadlineExceeded on `GET /api/debug/latency-spike`, UndefinedContentType on `GET /api/debug/metrics`, and a 401 assumption in `test_checkout_validation`). Not re-run here.
5. `test_locked_out_user_behavior` asserts the wrong error key (see US-ATM-017-API AC 6).

**Evidence**: `tests/test_contract.py:12-15`, `:41`, `:54`, `:64`, `:86`; `tests/requirements.txt:2`; `backend/requirements.txt:9`; commit 746a475.
**Notes**: Fixing the pins or the code is a decision for the owner; this story records the mismatch.
