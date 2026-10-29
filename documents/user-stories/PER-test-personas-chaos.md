# Epic PER — Test Personas & Chaos

The seven deterministic test personas (shared password `pizza123`), each of which switches on one server-side fault or behaviour, plus the debug endpoints. Persona behaviour is decided by the backend. The clients render what the backend returns and contain no persona logic beyond the Quick Login labels.

Retroactive stories for implemented behaviour. Status **Done** = verified in code or in a live in-process run; **Found** = a gap that exists today and is not fixed. Persona API stories are the primary layer; the client stories cover only client code paths that handle a persona effect.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-PER-001-API | Standard persona is the control group (standard_user) | API | Done |
| US-PER-002-API | Locked-out persona is refused at login (locked_out_user) | API | Done |
| US-PER-003-API | Problem persona shows $0 and a broken image (problem_user) | API | Done |
| US-PER-003-WEB | Problem persona: fallback image and $0 price on web | WEB | Done |
| US-PER-003-MOB | Problem persona: fallback image and $0 price on mobile | MOB | Done |
| US-PER-004-API | Performance persona adds 3 s to two endpoints (performance_glitch_user) | API | Done |
| US-PER-005-API | Error persona fails half of checkouts (error_user) | API | Done |
| US-PER-005-WEB | Error persona: generic checkout failure text on web | WEB | Done |
| US-PER-005-MOB | Error persona: generic checkout failure text on mobile | MOB | Done |
| US-PER-006-API | A11y persona adds one random defect per call (a11y_glitch_user) | API | Done |
| US-PER-007-API | Security persona: poisoned profile, IDOR and leaked errors (security_glitch_user) | API | Done |
| US-PER-007-WEB | Security persona: XSS payload shows as plain text on web | WEB | Done |
| US-PER-007-MOB | Security persona: XSS payload shows as plain text on mobile | MOB | Done |
| US-PER-008-API | Debug endpoints for latency, CPU and metrics | API | Done |
| US-PER-009-API | Persona is resolved on the server from the token subject | API | Done |

---

### US-PER-001-API · Standard persona is the control group (standard_user)
**As a** QA engineer **I want** a persona with no injected faults **so that** every other persona has a clean control to compare against.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `standard_user`, when it logs in and calls catalog or checkout, then no delay or random error is injected (`backend/constants.py:21-27`; `backend/middleware.py:57-58` sleeps only for `performance_glitch`; `backend/database.py:362-365` returns true only for `error` and `security_glitch`).
2. Given `standard_user`, when the US catalog is requested, then each price is the market's converted price and the image is the catalogue image (verified: first item 12.99 USD with a Wikimedia image; `backend/database.py:296-300`).
3. Given `standard_user`, when the error check runs, then it never fires (verified: 200 calls, none true).

**Evidence**: `backend/constants.py:21-27`, `backend/database.py:296-300,362-365`, `backend/middleware.py:52-60`
**Notes**: The description reads "Usuario normal, flujo sin errores" (`backend/constants.py:26`).

---

### US-PER-002-API · Locked-out persona is refused at login (locked_out_user)
**As a** QA engineer **I want** a locked account to be refused regardless of password **so that** I can test the lockout message.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `locked_out_user` with `pizza123`, when it logs in, then the response is 403 with `error` = `Sorry, this user has been locked out.` (verified).
2. Given `locked_out_user` with a wrong password, when it logs in, then the response is still 403, not 401, because the lock is checked before the password (`backend/auth.py:25-34`; verified).
3. Given the lockout, when the user list is requested, then the account is still listed (`backend/routers/auth.py:76-86`; verified).

**Evidence**: `backend/auth.py:25-34`, `backend/routers/auth.py:20-74,76-86`, `backend/constants.py:28-33`
**Notes**: The client maps a 403 to the server message (US-AUTH-002-WEB, US-AUTH-002-MOB).

---

### US-PER-003-API · Problem persona shows $0 and a broken image (problem_user)
**As a** QA engineer **I want** the catalogue and cart to show $0 prices and broken images for this persona **so that** I can test how the UI copes with bad data.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `problem_user`, when `GET /api/pizzas` is called, then every price is `0.0` and every image is `https://broken-image-url.com/404.jpg` (`backend/database.py:296-298`; verified 0.0 and the broken URL).
2. Given `problem_user`, when the cart is returned, then each line's `price` is `0.0` and its `image` is the broken URL (`backend/database.py:244-246`).
3. Given any other persona, when the catalogue is requested, then the normal price and image are used (`backend/database.py:299-300`).

**Evidence**: `backend/database.py:244-246,296-300`
**Notes**: Both clients mask the broken image with a stock fallback (US-PER-003-WEB, US-PER-003-MOB); only the $0 price reaches the user.

---

### US-PER-003-WEB · Problem persona: fallback image and $0 price on web
**As a** QA engineer **I want** to see how the web UI handles a $0 price and a broken image **so that** I can assert it in a test.

- Layer: WEB · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-18 · Commit: b86ce69 (product-card image fallback)

**Acceptance criteria**
1. Given a product image fails to load, when its `onError` runs, then the source is replaced with a stock pizza image (`frontend/src/components/ProductCard.jsx:28`).
2. Given a product price of 0, when the card renders, then the price is passed to `formatPrice` unchanged and the card does not replace a 0 with another value (`ProductCard.jsx:40-41`).

**Evidence**: `frontend/src/components/ProductCard.jsx:26-28,40-41`, `frontend/src/components/CartSidebar.jsx:80`
**Notes**: The cart sidebar has the same stock-image fallback (`CartSidebar.jsx:80`). No client code guards against a $0 price.

---

### US-PER-003-MOB · Problem persona: fallback image and $0 price on mobile
**As a** QA engineer **I want** to see how the mobile UI handles a $0 price and a broken image **so that** I can assert it in a test.

- Layer: MOB · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-15 · Commit: 55da458 (pizza-card image fallback)

**Acceptance criteria**
1. Given a pizza image fails to load, when `onError` runs, then the image source is switched to the stock pizza URL (`frontend-mobile/src/components/PizzaCard.tsx:30-35`).
2. Given a price of 0 and the US market, when the card renders, then the line is the currency symbol, `0` and the currency code, that is "$0 USD" (`PizzaCard.tsx:16-17,42`; US symbol `$` at `backend/constants.py:103`).

**Evidence**: `frontend-mobile/src/components/PizzaCard.tsx:16-17,30-35,42`, `backend/constants.py:103`
**Notes**: The fallback is set through `setNativeProps`; it was not run on a device.

---

### US-PER-004-API · Performance persona adds 3 s to two endpoints (performance_glitch_user)
**As a** QA engineer **I want** a persona that is slow on the catalogue and checkout **so that** I can test timeouts and loading states.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `performance_glitch_user`, when `GET /api/pizzas` or `POST /api/checkout` is called, then the request sleeps 3.0 s before running (`backend/middleware.py:52-58`; `backend/routers/catalog.py:51`; `backend/routers/checkout.py:43`).
2. Given `performance_glitch_user`, when login, `GET /api/cart`, the profile or the session endpoints are called, then no delay is applied (`backend/routers/auth.py:30`; `backend/test_api.py:96-101`; these depend only on `get_current_user`).
3. Given any other persona, when it calls the same endpoints, then no delay is applied (`backend/middleware.py:57`).

**Evidence**: `backend/middleware.py:52-60`, `backend/routers/catalog.py:43-51`, `backend/routers/checkout.py:31-43`, `backend/test_api.py:90-101`
**Notes**: Drift: `backend/constants.py:44` says "Todas las llamadas al API tienen un delay de 3 segundos" (every API call is delayed); the code delays only the two endpoints above. The 3 s duration was not timed live.

---

### US-PER-005-API · Error persona fails half of checkouts (error_user)
**As a** QA engineer **I want** checkout to fail about half the time for this persona **so that** I can test retry and error handling.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `error_user`, when `POST /api/checkout` is called, then with probability 0.5 the response is 500 with `error` = `Random checkout error triggered for testing purposes`, before any order is created (`backend/routers/checkout.py:62-72`; `backend/database.py:362-365`; verified about 0.50 over 2000 calls).
2. Given any other persona, when checkout is called, then the random failure never fires (`backend/database.py:362-365`).
3. Given `error_user`, when catalogue or cart endpoints are called, then the random failure does not fire (`backend/database.py:362-365` is called only from checkout, `backend/routers/checkout.py:63`).

**Evidence**: `backend/routers/checkout.py:62-72`, `backend/database.py:362-365`
**Notes**: Clients show a generic failure text instead of this message (US-PER-005-WEB, US-PER-005-MOB).

---

### US-PER-005-WEB · Error persona: generic checkout failure text on web
**As a** QA engineer **I want** to know what the web checkout shows when the server fails **so that** I can assert on the failure message.

- Layer: WEB · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: Unverified (origin not pinpointed; present at HEAD)

**Acceptance criteria**
1. Given a failed checkout request, when it fails, then the page shows the translated `checkoutFailed` text (`frontend/src/pages/Checkout.jsx:336`).
2. Given the response body, when the failure is handled, then the server's `error` text is not read or shown (no `response.data` read in `Checkout.jsx`; grep).

**Evidence**: `frontend/src/pages/Checkout.jsx:319,336`
**Notes**: The message "Random checkout error..." never reaches the UI on web.

---

### US-PER-005-MOB · Error persona: generic checkout failure text on mobile
**As a** QA engineer **I want** to know what the mobile checkout shows when the server fails **so that** I can assert on the failure message.

- Layer: MOB · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: Unverified (origin not pinpointed; present at HEAD)

**Acceptance criteria**
1. Given a failed checkout request, when the catch runs, then the error text is the translated `checkoutFailed` string (`frontend-mobile/src/screens/CheckoutScreen.tsx:248-249`).
2. Given the failure, when it is caught, then the error object is not inspected, so the server's `error` text is not shown (`CheckoutScreen.tsx:248`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:248-249`
**Notes**: Same behaviour as the web client.

---

### US-PER-006-API · A11y persona adds one random defect per call (a11y_glitch_user)
**As a** QA engineer **I want** the catalogue and cart to carry a random accessibility-style defect **so that** I can test that my checks catch it.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-19 · Commit: bf90477

**Acceptance criteria**
1. Given `a11y_glitch_user`, when `GET /api/pizzas` or `GET /api/cart` is called, then one mode from `missing_name`, `wrong_lang` and `extreme_text` is chosen per call and applied to every line of that response (`backend/database.py:231,281`; `backend/constants.py:69`).
2. Given `missing_name`, when a name is rendered, then the name is blank and the description is unchanged (`backend/database.py:64-65`; verified: a blank name appeared in the sample).
3. Given `wrong_lang`, when a name is rendered, then the text is taken from another language present on the item (`backend/database.py:67-72`; `backend/constants.py:70`). Given `extreme_text`, when a name is rendered, then it repeats 15 times (`backend/database.py:74-75`; verified repeated names in the sample).
4. Given any other persona, when it calls the same endpoints, then no defect is added (`backend/database.py:239,288`).

**Evidence**: `backend/database.py:57-77,231,239-240,281,288-290`, `backend/constants.py:66-70`
**Notes**: Clients have no handling for these defects; they render as-is. Over 60 catalogue calls, six distinct first-item names appeared, including the blank name and the repeated text.

---

### US-PER-007-API · Security persona: poisoned profile, IDOR and leaked errors (security_glitch_user)
**As a** QA engineer **I want** a persona with an injected profile payload, an ownership bypass and leaky errors **so that** security checks can be exercised.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-19 · Commit: cebd983 (profile seeded at login); 36764df (leaked checkout errors)

**Acceptance criteria**
1. Given a login as `security_glitch_user`, when the login completes, then the profile is seeded with one payload from `<script>`, `<img onerror>` or `<svg onload>` in one of `full_name`, `address` or `notes` (`backend/routers/auth.py:65-68`; `backend/constants.py:72-79`; verified: the address was `"><svg onload=alert(1)>` in one run and `full_name` held a `<script>` payload in another).
2. Given `security_glitch_user`, when `GET /api/orders/{id}` or `PATCH /api/orders/{id}` is called for another user's order, then the ownership check is skipped (`backend/routers/checkout.py:157,197`; code read only, not exercised end to end).
3. Given `security_glitch_user`, when checkout is called, then half the time the response is 500 with one of three internal-looking messages (`backend/routers/checkout.py:62-68`; `backend/constants.py:82-86`).
4. Given the same persona, when `GET /api/orders` is called, then only the caller's own orders are listed (`backend/routers/checkout.py:127-131`).

**Evidence**: `backend/routers/auth.py:65-68`, `backend/constants.py:72-86`, `backend/routers/checkout.py:62-68,127-131,157,197`
**Notes**: The clients show a generic checkout failure, so the leaked messages never reach the UI (US-PER-005-WEB, US-PER-005-MOB). Only one user's order list exists per login, so the IDOR was not exercised with two live users.

---

### US-PER-007-WEB · Security persona: XSS payload shows as plain text on web
**As a** QA engineer **I want** to confirm the web app does not execute the seeded XSS payload **so that** I can assert it is shown as text.

- Layer: WEB · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-19 · Commit: cebd983 (payload seeded at login)

**Acceptance criteria**
1. Given the seeded payload, when the Profile page renders it, then it appears as text in the header and the input values (`frontend/src/pages/Profile.jsx:77,107-113,133-139`).
2. Given the web client source, when it is searched for raw HTML sinks, then no `innerHTML` or `dangerouslySetInnerHTML` is found (grep of `frontend/src`).
3. Given the payload in the address, when checkout pre-fills the form, then it is set as a field value (`frontend/src/pages/Checkout.jsx:194-196`), not as markup.

**Evidence**: `frontend/src/pages/Profile.jsx:77,107-113,133-139`, `frontend/src/pages/Checkout.jsx:194-196`
**Notes**: Code read only; not run in a browser.

---

### US-PER-007-MOB · Security persona: XSS payload shows as plain text on mobile
**As a** QA engineer **I want** to confirm the mobile app shows the seeded payload as text **so that** I can assert it is not interpreted.

- Layer: MOB · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-19 · Commit: cebd983 (payload seeded at login)

**Acceptance criteria**
1. Given the seeded payload, when the profile renders, then it appears through React Native `Text` and `TextInput` values (`frontend-mobile/src/screens/ProfileScreen.tsx:160-161,187-194,212-219`).
2. Given the mobile source, when it is searched for `WebView` or raw HTML sinks, then none is found (grep of `frontend-mobile/src`).

**Evidence**: `frontend-mobile/src/screens/ProfileScreen.tsx:160-161,187-194,212-219`
**Notes**: Code read only; not run on a device.

---

### US-PER-008-API · Debug endpoints for latency, CPU and metrics
**As a** QA engineer **I want** endpoints that add latency, burn CPU and expose metrics **so that** I can test timeouts and monitoring.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (router moved to `routers/debug_chaos.py` in 31e447b)

**Acceptance criteria**
1. Given `GET /api/debug/latency-spike`, when it is called, then it sleeps a random 0.5–5.0 s and returns `delay_seconds` (`backend/routers/debug_chaos.py:17-26`).
2. Given `GET /api/debug/cpu-load`, when it is called, then it computes `fibonacci(35)` and returns the duration (`backend/routers/debug_chaos.py:28-45`).
3. Given `GET /api/debug/metrics`, when it is called, then it returns Prometheus text (`backend/routers/debug_chaos.py:47-50`).
4. Given `GET /api/debug/info`, when it is called without a token, then it returns the app name, version, environment, total orders, test-user usernames and supported markets (`backend/routers/debug_chaos.py:52-63`; verified 200 without auth).

**Evidence**: `backend/routers/debug_chaos.py:17-63`
**Notes**: None of the debug routes requires a token, so they are public; `/api/debug/info` lists the test-user names. Latency and CPU timings were not measured.

---

### US-PER-009-API · Persona is resolved on the server from the token subject
**As a** QA engineer **I want** persona behaviour to be decided on the server **so that** the clients stay thin and tests exercise server logic.

- Layer: API · Epic: PER · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (TEST_USERS and `get_current_user`); 82d1b74 (`sid` on the returned user)

**Acceptance criteria**
1. Given a token, when a protected endpoint is called, then the user is looked up in `TEST_USERS` by the token's `sub` and its `behavior` is attached (`backend/middleware.py:33-50`).
2. Given a token whose `sub` is not a test user, when a protected endpoint is called, then the response is 401 with `error` = `User not found` (`backend/middleware.py:40-45`).
3. Given the clients, when `frontend/src` and `frontend-mobile/src` are searched for persona usernames, then the only hits are the Quick Login label maps (`frontend/src/pages/Login.jsx:11-19`; `frontend-mobile/src/screens/LoginScreen.tsx:28-36`).

**Evidence**: `backend/middleware.py:28-50`, `backend/routers/auth.py:70-74`, `frontend/src/pages/Login.jsx:11-19`, `frontend-mobile/src/screens/LoginScreen.tsx:28-36`
**Notes**: Recorded as Done, not Found: the brief lists "neither client has persona-specific logic" as a gap, but server-side persona resolution is the intended design, not a defect. Drift: `CLAUDE.md` says the `behavior` claim drives the chaos. The code reads `behavior` from `TEST_USERS` keyed by `sub` (`middleware.py:40,50`) and does not read the token's `behavior` claim on this path. The claim is returned in the login response only.
