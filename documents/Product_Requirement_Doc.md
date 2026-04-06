# Product Requirements Document (PRD) - OmniPizza

## 1. Introduction
**OmniPizza** is a QA sandbox for practicing UI and API automation on a multi-platform pizza ordering system.  
It is intentionally built with deterministic test users, multi-market behavior, localization, and controlled failure modes to support stable and repeatable test scenarios.

## 2. Product Goals
* Provide a realistic but deterministic environment for manual QA and automated testing.
* Validate functional behavior across **Web**, **Mobile**, and **API** layers.
* Enable coverage of happy paths, edge cases, validation errors, and chaos scenarios.
* Provide clear expected outcomes (status codes, payload shape, UI behavior) for test-case generation.

## 3. Platforms and Scope

### 3.1 Web App (React + Vite)
* Login, catalog, cart, checkout, profile, and order-success flows.
* Market selection at login (MX, US, CH, JP) controls language/currency behavior.
* Client state persisted in browser storage (auth, country, cart, profile, last order).

### 3.2 Mobile App (React Native + Expo)
* Login, catalog, pizza builder, cart/checkout, profile, and order-success screens.
* Market selection at login controls language/currency behavior.
* Includes mobile-specific builder UX and orientation support.
* Supports deep linking via the `omnipizza://` URI scheme for atomic screen entry by external test runners.
* CI/CD builds Android APK and iOS Simulator app via GitHub Actions; artifacts are published as GitHub Releases.

### 3.3 Backend API (FastAPI)
* Authentication, countries, pizzas, checkout, orders, and debug endpoints.
* In-memory persistence (ephemeral by design).
* OpenAPI/Swagger docs for contract testing.

## 4. Target Audience
* **QA Engineers:** Build robust UI/API automation suites.
* **Developers:** Practice testable architecture and deterministic failure design.
* **Learners/Students:** Learn modern test tooling against a realistic app.

## 5. Test Users (Deterministic Personas)

| Username | Password | Behavior |
| :--- | :--- | :--- |
| `standard_user` | `pizza123` | Normal flow |
| `locked_out_user` | `pizza123` | Login blocked (`403`) |
| `problem_user` | `pizza123` | Catalog returns broken image URL and `price=0` |
| `performance_glitch_user` | `pizza123` | ~3s delay on behavior-enabled endpoints |
| `error_user` | `pizza123` | Checkout fails with `500` approximately 50% of attempts |

## 6. Core Functional Requirements

### 6.1 Authentication
* `POST /api/auth/login` authenticates test users and returns JWT access token.
* Login response must include `access_token`, `token_type`, `username`, and `behavior`.
* Invalid username/password must return `401 Unauthorized`.
* `locked_out_user` must return `403 Forbidden`.
* `GET /api/auth/users` returns available test users.
* `GET /api/auth/profile` returns current user profile metadata (requires JWT).
* JWT expiration target: 30 minutes (default backend configuration).

### 6.2 Session and Auth State
* Web persists auth state across reloads.
* Web auto-logout and redirect to login on API `401` responses.
* On release key/version change, web auth state can be reset to avoid stale sessions.
* Mobile uses in-memory state by default (no persistent auth store in current implementation baseline).
* Mobile logout clears token/cart/last-order state and returns to login flow.

### 6.3 Market, Language, and Currency Behavior
* Supported markets: `MX`, `US`, `CH`, `JP`.
* Market selection influences currency/pricing, required checkout fields, and default language.
* Default language mapping: `MX -> es`, `US -> en`, `CH -> de`, `JP -> ja`.
* Switzerland supports language toggle `DE/FR` after login.
* Market change clears cart (Web and Mobile store behavior).

### 6.4 Country and Localization APIs
* `GET /api/countries` returns country configuration (`currency`, `currency_symbol`, required/optional fields, tax rate, languages, decimal precision).
* `GET /api/pizzas` requires `Authorization: Bearer <token>`.
* `GET /api/pizzas` requires `X-Country-Code` header.
* `GET /api/pizzas` supports optional `X-Language` header (defaults to `en`).
* `GET /api/pizzas` returns translated `name`/`description` with fallback behavior.

### 6.5 Catalog and Product Data
* Display pizza cards with image, name, description, and localized price.
* Currency conversion baseline:
* `USD=1.0`, `MXN=17.5`, `CHF=0.88`, `JPY=149.0`.
* Rounding behavior: JPY uses zero decimals; other currencies use two decimals.
* `problem_user` data mutation: all catalog prices become `0.0` and image URL points to a broken source (to test image fallback handling).

### 6.6 Pizza Customization
* Users can configure size and toppings before adding to cart.
* Size options: `small`, `medium`, `large`, `family`.
* Toppings selection capped at 10 options.
* Unit price = base localized pizza price + localized size add-on + localized topping add-on.
* Editing a cart item can merge with another item if resulting config signature matches.
* Customization is primarily a client-side/cart concept; backend checkout currently uses `pizza_id` + `quantity` as canonical billing inputs.

### 6.7 Cart Management
* Add configured items to cart.
* Increase/decrease quantity.
* Remove single items.
* Maintain signature-based uniqueness for same pizza+config.
* Clear cart after successful checkout.
* Clear cart on market change.

### 6.7.1 Cart API (State Injection)
* `POST /api/cart` — seeds backend cart with items (`pizza_id`, `size`, `quantity`). Requires `Authorization` + `X-Country-Code`.
* `GET /api/cart` — returns enriched cart joined with catalog (name, price, image, currency). Requires `Authorization` + `X-Country-Code`.
* Both web and mobile **Checkout screens fetch `GET /api/cart` on mount when the local cart is empty**, hydrating the UI automatically from backend state. This is the primary mechanism for cart state injection in atomic tests.
* The hydration guard (`items.length > 0`) ensures normal shopping flows are never disrupted.

### 6.8 Profile
* Profile captures `fullName`, `address`, `phone`, and `notes`.
* Profile data is local client state in current baseline (not persisted to backend API).
* Checkout pre-fills from stored profile data.

### 6.9 Checkout and Ordering (API Canonical)
* `POST /api/checkout` requires JWT.
* Common required fields: `country_code`, `items`, `name`, `address`, `phone`.
* `items[].quantity` valid range: `1..10`.
* Country-specific required fields:
  * `MX`: `colonia` required, `zip_code` optional, `propina` optional.
  * `US`: `zip_code` required, 5 digits.
  * `CH`: `plz` required.
  * `JP`: `prefectura` required.
* Successful response includes `order_id`, `subtotal`, `tax`, `tip`, `total`, `currency`, `currency_symbol`, `items`, `timestamp`.

### 6.10 Orders and Access Control
* `GET /api/orders` returns orders of authenticated user only.
* `GET /api/orders/{order_id}` returns:
* `404` if order ID does not exist.
* `403` if order exists but belongs to another user.
* `200` for owner.

### 6.11 Order Success UX
* After successful checkout, user sees order-success/tracking UI.
* Last order summary should be available from client state.
* Tracking visuals (map, courier, ETA) are simulation UI for testing.

### 6.12 Debug and Chaos Endpoints
* `GET /api/debug/latency-spike`: random delay between `0.5s` and `5s`.
* `GET /api/debug/cpu-load`: CPU-intensive Fibonacci computation.
* `GET /api/debug/metrics`: Prometheus text output.
* `GET /api/debug/info`: runtime app/debug metadata.

## 7. Validation Rules for Test Design

### 7.1 Auth Input Constraints
* Login request `username`: min 3, max 50.
* Login request `password`: min 6, max 100.

### 7.2 Checkout Input Constraints
* `name`: min 2, max 100.
* `address`: min 5, max 200.
* `phone`: min 8, max 20 (server-side length validation).
* Web phone input includes client regex pattern: allowed chars are digits, spaces, `+`, `-`, parentheses.
* US `zip_code` must be 5 numeric digits.
* MX `propina` minimum: 0 when provided.

### 7.3 Header Validation
* Missing `X-Country-Code` on `/api/pizzas` must return `400`.
* Invalid country code must return `400`.

## 8. API Contract Map

| Endpoint | Auth | Required Headers | Success | Common Failures |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | No | none | `200` token payload | `401`, `403` |
| `GET /api/auth/users` | No | none | `200` list | - |
| `GET /api/auth/profile` | Yes | `Authorization` | `200` | `401` |
| `GET /api/countries` | No | none | `200` list | - |
| `GET /api/pizzas` | Yes | `Authorization`, `X-Country-Code` | `200` | `400`, `401` |
| `POST /api/cart` | Yes | `Authorization`, `X-Country-Code` | `200` seeded cart | `400`, `401` |
| `GET /api/cart` | Yes | `Authorization`, `X-Country-Code` | `200` enriched cart | `401` |
| `POST /api/store/market` | Yes | `Authorization` | `200` | `400`, `401` |
| `POST /api/checkout` | Yes | `Authorization` | `200` order summary | `400`, `401`, `500` |
| `GET /api/orders` | Yes | `Authorization` | `200` | `401` |
| `GET /api/orders/{id}` | Yes | `Authorization` | `200` | `401`, `403`, `404` |
| `GET /api/session` | Yes | `Authorization` | `200` | `401` |
| `POST /api/session/reset` | Yes | `Authorization` | `200` | `401` |
| `GET /api/debug/latency-spike` | No | none | `200` | - |
| `GET /api/debug/cpu-load` | No | none | `200` | - |
| `GET /api/debug/metrics` | No | none | `200` text/plain | - |
| `GET /api/debug/info` | No | none | `200` | - |

## 9. Error Handling Contract
* HTTP exceptions are returned in structured JSON (`error`, `status_code`, `timestamp`).
* Unexpected server exceptions return (`error="Internal server error"`, `detail`, `timestamp`).
* Web client on `401` clears auth and redirects to login.
* Mobile client propagates API errors to caller; screens decide UI message rendering.

## 10. Negative Flow Acceptance Criteria

### 10.1 API and UI Assertions Matrix
| ID | Scenario | Trigger | Expected API Result | Expected UI Result |
| :--- | :--- | :--- | :--- | :--- |
| `NF-AUTH-001` | Invalid password | `standard_user` + wrong password | `401 Unauthorized` | Stay on login, error visible, no token persisted |
| `NF-AUTH-002` | Unknown username | non-existing user | `401 Unauthorized` | Same as `NF-AUTH-001` |
| `NF-AUTH-003` | Locked user | `locked_out_user` + valid password | `403 Forbidden` | Stay on login, lockout message visible |
| `NF-AUTH-004` | Invalid/expired JWT | Call protected endpoint with bad token | `401 Unauthorized` | Web: force logout + redirect to login |
| `NF-CAT-001` | Missing country header | `/api/pizzas` without `X-Country-Code` | `400 Bad Request` | Surface technical/API error state |
| `NF-CAT-002` | Problem user data anomaly | `problem_user` requests catalog | `200 OK` with mutated data | Show zero prices and trigger image fallback behavior |
| `NF-PERF-001` | Persona latency | `performance_glitch_user` calls behavior-enabled endpoints | `200/4xx/5xx` with ~3s added latency | UI remains responsive and can handle delayed responses |
| `NF-CHECKOUT-001` | Invalid phone format (web client) | disallowed chars or regex mismatch | client blocks request | Phone input shows validation message |
| `NF-CHECKOUT-002` | Invalid phone length (API) | <8 or >20 chars bypassing UI | validation `4xx` | Inline or form-level error displayed |
| `NF-CHECKOUT-003` | Missing country field | omit `zip_code`/`plz`/`prefectura`/`colonia` | `400 Bad Request` | Stay on checkout, error visible |
| `NF-CHECKOUT-004` | Chaos error user | `error_user` checkout attempt | intermittent `500` | Retryable failure message, no silent success |
| `NF-ORDER-001` | Foreign order access | Fetch order owned by another user | `403 Forbidden` | Show access denied state |
| `NF-ORDER-002` | Unknown order id | Fetch non-existing order id | `404 Not Found` | Show not-found state |

### 10.2 Visibility Rules ("what I need to see")
* Errors must be visible close to relevant form controls or as clear form-level banner.
* Error text must be deterministic enough for assertions (exact string or stable pattern).
* Invalid controls must have visual state change (error border/state).
* Retry should be possible without full page/app restart.
* Automation should rely on stable selectors for critical failures (`login-error`, `phone-error`, etc. recommended IDs).

## 11. Platform-Specific Baseline and Parity Notes

### 11.1 Web Baseline
* Full API-integrated checkout flow.
* Country/language behavior and cart repricing implemented.
* Payment section is UI-only; card fields are not sent to backend.
* Empty cart checkout state includes start-order CTA.

### 11.2 Mobile Baseline
* API-integrated login, catalog fetch, pizza builder, cart, checkout, and order-success flows.
* Checkout is fully API-integrated: `POST /api/checkout` is called and the response is stored as `lastOrder`.
* Cart hydration from `GET /api/cart` on Checkout mount when local cart is empty (E2E injection support).
* Deep linking via `omnipizza://` scheme — all 6 screens reachable directly by URL with optional `market`, `lang`, `hydrateCart`, `resetSession`, `pizzaId`, `size`, `orderId` params.
* Unified `testID` / `accessibilityLabel` naming convention across all screens: `btn-`, `input-`, `text-`, `view-`, `img-`, `card-` prefixes.

### 11.3 Cross-Platform Known Gaps to Consider in Test Strategy
* API capability and UI parity are not complete for every flow (especially checkout/order integration on mobile).
* `data-testid` coverage is partial and strongest in checkout/navbar paths.
* Profile is client-side only in current baseline (no backend profile update endpoint).
* Web checkout currently needs standardized visible rendering for backend error state.
* Web checkout summary values shown before submit are display-level values and can diverge from backend canonical totals.
* Existing-token mobile redirect path should be covered by regression tests.

### 11.4 Current Automation Hooks Baseline

**Web (`data-testid`)**

| Area | Key Selectors |
| :--- | :--- |
| Login | `input-username`, `input-password`, `btn-toggle-password` |
| Catalog | `input-search-pizza`, `btn-category-{id}`, `card-pizza-{id}`, `btn-clear-filters`, `loader-catalog` |
| Pizza Customizer | `btn-size-{size}`, `btn-topping-{id}`, `text-estimated-total-value`, `btn-add-to-cart`, `btn-close-builder` |
| Cart | `view-cart-sidebar`, `view-cart-empty`, `view-cart-item-{id}`, `btn-cart-qty-minus-{id}`, `text-cart-qty-{id}` |
| Checkout | `input-fullname`, `input-address`, `input-colonia` (MX), `input-zipcode` (US/MX optional), `input-plz` (CH), `input-prefectura` (JP), `input-phone`, `payment-card`, `payment-cash`, `view-order-summary` |
| Profile | `input-profile-fullname`, `input-profile-phone`, `input-profile-address`, `input-profile-notes`, `btn-delete-account` |
| Order Success | `text-status-title`, `view-courier-card`, `btn-courier-chat`, `btn-courier-call`, `btn-back-catalog` |
| Navbar | `btn-logout`, `btn-mobile-menu`, `btn-lang-de`, `btn-lang-fr` |

**Mobile (`testID` / `accessibilityLabel` — unified convention)**

| Prefix | Usage | Examples |
| :--- | :--- | :--- |
| `btn-` | Tappable actions | `btn-size-large`, `btn-add-to-cart`, `btn-logout`, `btn-close-builder` |
| `input-` | Text inputs | `input-username`, `input-password`, `input-address`, `input-zipcode` |
| `text-` | Display values | `text-status-title`, `text-estimated-total-value`, `text-courier-name` |
| `view-` | Container elements | `view-cart-sidebar`, `view-courier-card`, `view-order-summary` |
| `img-` | Images | `img-builder-pizza`, `img-courier-avatar`, `img-map-background` |
| `card-` | Card components | `card-pizza-{id}` |
| `screen-` | Root screen wrappers | `screen-checkout`, `screen-pizza-builder`, `screen-order-success` |

## 12. Non-Functional Requirements
* **Testability:** Stable selectors for critical actions and error states on both platforms.
* **Observability:** API exposes health, OpenAPI, and debug/metrics endpoints.
* **Ephemeral State:** In-memory backend resets on restart/deploy.
* **Performance:** Standard requests should be fast, except intentional chaos/performance personas/endpoints.
* **Responsiveness:** Web supports mobile/tablet/desktop layouts; mobile supports portrait/landscape.
* **Security Baseline for QA:** JWT-based auth; CORS open for testing environments.

## 13. Recommended Test Suite Structure

### 13.1 API Contract and Schema
* Validate all endpoint success/error status codes and payload shapes.
* Validate auth requirements and header requirements per endpoint.

### 13.2 Persona Behavior Tests
* One suite per user persona to verify deterministic behavior triggers.

### 13.3 Market and Localization Tests
* One suite per market (`MX`, `US`, `CH`, `JP`) for required fields, pricing, language, decimals.

### 13.4 Checkout Validation Tests
* Client-side validation (web input constraints).
* Server-side validation (country fields, quantity ranges, zip format, phone length).

### 13.5 Authorization and Access-Control Tests
* Missing token, invalid token, cross-user order access.

### 13.6 Chaos and Resilience Tests
* Latency spike timing windows.
* CPU-load endpoint availability.
* Randomized checkout failures for `error_user`.

### 13.7 Atomic Screen Entry Tests (Web + Mobile)

**Web (Playwright):**
1. `POST /api/auth/login` to get token.
2. `POST /api/cart` to seed items.
3. Inject `omnipizza-auth` + empty `omnipizza-cart` into `localStorage` via `page.addInitScript()`.
4. Navigate directly to `/checkout` — Checkout fetches `GET /api/cart` and hydrates.
5. Assert order summary reflects API-seeded items.

Reference: `ATOMIC_WEB_TESTING.md`

**Mobile (Appium / Detox):**
1. `POST /api/auth/login` to get token.
2. `POST /api/cart` to seed items.
3. Open app via deep link: `omnipizza://checkout?market=MX&lang=es&hydrateCart=true`.
4. Checkout hydrates from `GET /api/cart` automatically.
5. Assert order summary.

Reference: `ATOMIC_MOBILE_TESTING.md`

## 14. Definition of Done for QA Readiness
* Core happy paths pass on API and Web.
* Negative-flow matrix scenarios are automated with stable assertions.
* Market-specific validations are covered end-to-end.
* Persona behavior tests are deterministic and non-flaky.
* Known parity gaps are explicitly tagged in test plans (not treated as false failures).
