# Epic ORD — Orders

Order history and detail, cancellation of pending orders, the `OrderSummary` contract shared by every order endpoint, and the order-success screen (confirmation, simulated tracking, and atomic `orderId` hydration for QA). Covers `backend/routers/checkout.py` (order routes), `frontend/src/pages/OrderSuccess.jsx` and `frontend-mobile/src/screens/OrderSuccessScreen.tsx`.

**Conventions.** `path:line` refers to this worktree's branch (HEAD `9ca3767`, which is `main` `87966da` plus `/api/version`). `US-and-Improvements:path:line` refers to the `US-and-Improvements` branch (local and `origin`), where the 2026-10-28 fix commits live; those fixes are not on this branch or on `main`. "Probe" means an in-process `fastapi.testclient.TestClient` run against this checkout on 2026-10-28 (no server, no port). Order data is stored per username (`backend/database.py:167-168`), not per login session.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-ORD-001-API | Order history for the signed-in user | API | Done |
| US-ORD-002-API | Order detail with ownership checks | API | Done |
| US-ORD-003-API | Order detail and cancel bypass for security_glitch_user (IDOR fixture) | API | Done |
| US-ORD-004-API | Cancel a pending order | API | Done |
| US-ORD-005-API | One OrderSummary contract for every order endpoint | API | Done |
| US-ORD-006-WEB | Order confirmation screen on web | WEB | Done |
| US-ORD-006-MOB | Order confirmation screen on mobile | MOB | Done |
| US-ORD-007-WEB | Hydrate the success screen from `?orderId=` (atomic entry) | WEB | Done |
| US-ORD-007-MOB | Hydrate the success screen from the `orderId` deep link | MOB | Done |
| US-ORD-008-WEB | Simulated courier, ETA and tracking (web) | WEB | Done |
| US-ORD-008-MOB | Simulated courier, ETA and tracking (mobile) | MOB | Done |
| US-ORD-009-WEB | Order details list shows placeholder rows and wrong currency | WEB | Found |
| US-ORD-010-API | Order history rows are not OrderSummary | API | Found |
| US-ORD-011-WEB | `?orderId=` shows no error state for 403 or 404 | WEB | Found |
| US-ORD-011-MOB | `orderId` deep link shows no error state for 403 or 404 | MOB | Found |

---

### US-ORD-001-API · Order history for the signed-in user
**As a** customer **I want** to list the orders I have placed **so that** I can review them later.
- Layer: API · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (first `git log -S` hit for `get_user_orders`)

**Acceptance criteria**
1. Given a valid bearer token, when `GET /api/orders` is called, then the response is 200 with `{"orders": [...]}` (`backend/routers/checkout.py:127-131`; probe).
2. Given no token, when the endpoint is called, then the response is 401 (probe).
3. Given the rows, then only orders whose `username` equals the caller are returned (`backend/database.py:167-168`; code reading, not probed across users).

**Evidence**: `backend/routers/checkout.py:127-131`, `backend/database.py:167-168`, `frontend/src/services/order.service.js:5`, `frontend-mobile/src/services/order.service.ts:4-11`
**Notes**: No web or mobile screen calls this endpoint. `getOrders` is defined in `frontend/src/services/order.service.js:5` with no caller, and the mobile service has no list method. The rows are not `OrderSummary` (US-ORD-010-API). PRD §6.10 (`documents/Product_Requirement_Doc.md:131`) states the scoping rule.

### US-ORD-002-API · Order detail with ownership checks
**As a** customer **I want** to open one of my orders by id **so that** I can see its totals and items.
- Layer: API · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (first `git log -S` hit for `Access denied`)

**Acceptance criteria**
1. Given the caller owns the order, when `GET /api/orders/{order_id}` is called, then the response is 200 with the `OrderSummary` shape (`backend/routers/checkout.py:163-165`; probe).
2. Given an order owned by another user, when it is requested, then the response is 403 with `error` "Access denied" (`backend/routers/checkout.py:157-161`; probe with `problem_user`).
3. Given an unknown id, when it is requested, then the response is 404 with `error` "Order <id> not found" (`backend/routers/checkout.py:149-155`; probe).
4. Given no token, then the response is 401 (`backend/routers/checkout.py:138`, `AUTH_RESPONSES`).

**Evidence**: `backend/routers/checkout.py:133-165`, `backend/database.py:158-159`
**Notes**: Matches PRD §6.10 (`documents/Product_Requirement_Doc.md:132-135`) and NF-ORDER-001 (403) and NF-ORDER-002 (404). Ownership is checked against `username`, so two logins for the same user see the same orders.

### US-ORD-003-API · Order detail and cancel bypass for security_glitch_user (IDOR fixture)
**As a** QA engineer **I want** `security_glitch_user` to read and cancel other users' orders **so that** my IDOR tests have a deliberate target.
- Layer: API · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-19 · Commit: 74fecc2 (IDOR fixture)

**Acceptance criteria**
1. Given `security_glitch_user` and an order owned by `standard_user`, when `GET /api/orders/{id}` is called, then the response is 200 with the order (probe).
2. Given the same user, when `PATCH /api/orders/{id}` with `{"status": "cancelled"}` is called on that order, then the response is 200 and the status is "cancelled" (probe; `backend/routers/checkout.py:197`).
3. Given any other user, when they request the same order, then the response is still 403 (probe with `problem_user`).

**Evidence**: `backend/routers/checkout.py:157`, `backend/routers/checkout.py:197`, `backend/constants.py:58-62`
**Notes**: Deliberate fixture, as PRD §6.10 says (`documents/Product_Requirement_Doc.md:136`, "deliberate IDOR bypass"). The checkout error leak added in 36764df is a persona behaviour and belongs to the persona epic, not here. NF-ORDER-001 expects 403 for a normal foreign user, which still holds.

### US-ORD-004-API · Cancel a pending order
**As a** customer **I want** to cancel an order that has not been processed yet **so that** I am not charged for an order I no longer want.
- Layer: API · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-08-11 · Commit: c60f824

**Acceptance criteria**
1. Given a pending order owned by the caller, when `PATCH /api/orders/{id}` is called with `{"status": "cancelled"}`, then the response is 200 with `status` "cancelled" (probe; `backend/routers/checkout.py:203-212`, `backend/database.py:161-165`).
2. Given an order that is already cancelled, when cancel is called again, then the response is 409 with "Order already cancelled, cannot cancel" (probe; `backend/routers/checkout.py:203-207`).
3. Given a body whose `status` is anything other than "cancelled", then the response is 422 (probe; `backend/models.py:146-148`).
4. Given another user's order, then 403; given an unknown id, then 404 (probe; `backend/routers/checkout.py:189-201`).

**Evidence**: `backend/routers/checkout.py:167-212`, `backend/models.py:146-148`, `backend/database.py:161-165`
**Notes**: Only pending → cancelled is supported (PRD §6.10, `documents/Product_Requirement_Doc.md:136`). API-only: no web or mobile code calls PATCH or `cancelOrder`, so a customer cannot cancel from the apps today. Status "pending" is set at creation (`backend/database.py:154`); no other transition exists.

### US-ORD-005-API · One OrderSummary contract for every order endpoint
**As a** QA engineer **I want** checkout, order detail and cancel to return the same order shape **so that** one parser can read every order response.
- Layer: API · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (shape); `status` added in b4f82b0 (2026-08-11)

**Acceptance criteria**
1. Given a successful checkout, when the response is built, then it uses `_order_summary` (`backend/routers/checkout.py:10-25`, `:125`).
2. Given `GET /api/orders/{id}` and `PATCH /api/orders/{id}` succeed, then they return the same builder output (`backend/routers/checkout.py:165`, `:212`); the response model is `OrderSummary` for all three (`backend/routers/checkout.py:33`, `:135`, `:169`).
3. Given any order, then `status` is present: "pending" after creation and "cancelled" after PATCH (`backend/models.py:133`; probe for both states).
4. `currency_symbol` comes from `COUNTRY_CONFIG` for the order's market (`backend/constants.py:90-146`; JP uses `¥`, constants.py:126).

**Evidence**: `backend/routers/checkout.py:10-25,33,125,135,165,169,212`, `backend/models.py:131-144`
**Notes**: The history list does not use this contract (US-ORD-010-API). PRD §6.10 (`documents/Product_Requirement_Doc.md:135`) calls the detail shape canonical.

### US-ORD-006-WEB · Order confirmation screen on web
**As a** customer **I want** a confirmation screen after I place an order **so that** I see the order number and total.
- Layer: WEB · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given a placed order, when `/order-success` opens, then the order id (`frontend/src/pages/OrderSuccess.jsx:126-131`) and the total (`:133`) are shown.
2. Given the "view order details" toggle is pressed, then the details panel opens, with `aria-expanded` and `aria-controls` set (`frontend/src/pages/OrderSuccess.jsx:134-147`).
3. Given an order is placed, then it is held in the `omnipizza-order` store (`frontend/src/store.js:250-262`) until replaced.
4. Given logout, then the last order is cleared on US-and-Improvements (`US-and-Improvements:frontend/src/store.js:54-60`, fix 60774e3). On this branch `frontend/src/store.js:43-53` clears only the token, username and profile.

**Evidence**: `frontend/src/pages/OrderSuccess.jsx:14-15,126-172`, `frontend/src/store.js:250-262`, `frontend/src/store.js:43-53` (HEAD), `US-and-Improvements:frontend/src/store.js:54-60`
**Notes**: AC 4 is fix 60774e3 (2026-10-28), US-and-Improvements only. The details panel rows are broken (US-ORD-009-WEB). Status is Done because ACs 1-3 hold on this branch.

### US-ORD-006-MOB · Order confirmation screen on mobile
**As a** customer **I want** the same confirmation on my phone **so that** I know the order was accepted and what I paid.
- Layer: MOB · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given a placed order, when the success screen opens, then the order id is shown (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:163-167`), with subtotal, delivery fee, tax, tip and total rows (`:169-187`).
2. Given logout, then the last order is cleared (`frontend-mobile/src/store/useAppStore.ts:118-122`).
3. Given no last order, then the details block is not rendered (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:163`, conditional on `lastOrder`).

**Evidence**: `frontend-mobile/src/screens/OrderSuccessScreen.tsx:23,163-187`, `frontend-mobile/src/store/useAppStore.ts:118-128`
**Notes**: The mobile screen shows totals but no per-item rows. The store is not persisted, so a relaunch clears the order (`frontend-mobile/src/store/useAppStore.ts`, no persist).

### US-ORD-007-WEB · Hydrate the success screen from `?orderId=` (atomic entry)
**As a** QA engineer **I want** `/order-success?orderId=<id>` to load that order from the API **so that** a test can reach the screen without placing an order through the UI.
- Layer: WEB · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-05-20 · Commit: e938e51 (first `git log -S` hit for `orderId` on this file)

**Acceptance criteria**
1. Given `?orderId=<id>` and no matching last order, when the page mounts, then `GET /api/orders/{id}` is called and the result becomes `lastOrder` (`frontend/src/pages/OrderSuccess.jsx:16-27`; `frontend/src/services/order.service.js:6`).
2. Given the last order already has that id, then no request is made (`frontend/src/pages/OrderSuccess.jsx:23`).
3. Given the request succeeds, then the order id, total and details render from the API result (`frontend/src/pages/OrderSuccess.jsx:126-172`).

**Evidence**: `frontend/src/pages/OrderSuccess.jsx:16-27,126-172`, `frontend/src/services/order.service.js:6`
**Notes**: Failures are swallowed; see US-ORD-011-WEB. The page is lazy-loaded behind a Suspense fallback per CLAUDE.md (not re-verified here).

### US-ORD-007-MOB · Hydrate the success screen from the `orderId` deep link
**As a** QA engineer **I want** `omnipizza://order-success?orderId=<id>` to load the order **so that** an Appium run can open the success screen directly.
- Layer: MOB · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-05-20 · Commit: e938e51 (first `git log -S` hit for the mobile fetch)

**Acceptance criteria**
1. Given an `orderId` in the deep link, when the app opens, then `orderService.getOrder(orderId)` is called and the result is stored with `setLastOrder` (`frontend-mobile/src/hooks/useDeepLinkParams.ts:119-124`).
2. Given the deep link is `order-success`, then it routes to `OrderSuccess` with the `orderId` param (`frontend-mobile/src/navigation/linking.ts:25,44`; `frontend-mobile/src/navigation/types.ts:38-39`).
3. The screen renders whether or not the fetch resolves, because navigation is independent of the fetch (`frontend-mobile/src/hooks/useDeepLinkParams.ts:114-116`).

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:14,114-130`, `frontend-mobile/src/navigation/linking.ts:25,44`, `frontend-mobile/src/navigation/types.ts:38-39`
**Notes**: The fetch is fire-and-forget and its failure is logged only under `__DEV__` (`useDeepLinkParams.ts:125-129`); see US-ORD-011-MOB.

### US-ORD-008-WEB · Simulated courier, ETA and tracking (web)
**As a** customer **I want** the confirmation to show a courier, an ETA and a tracking banner **so that** the success screen feels like a live delivery.
- Layer: WEB · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the success screen, then a live-tracking banner, a map image and a pulsing marker are shown as decoration (`frontend/src/pages/OrderSuccess.jsx:34-72`).
2. Given any order, then the ETA is fixed text: "Expected arrival: 8:45 PM" and "15-20" (`frontend/src/pages/OrderSuccess.jsx:80-90`).
3. Given any order, then the courier is the same person: name "Carlos R.", rating 4.9, vehicle "driving" (`frontend/src/features/orderSuccess/useCases/getCourierProfile.js:1-8`, `frontend/src/pages/OrderSuccess.jsx:29`, `:98-112`).
4. The chat and call buttons have no click handler (`frontend/src/pages/OrderSuccess.jsx:116-121`).

**Evidence**: `frontend/src/pages/OrderSuccess.jsx:29,34-90,98-123`, `frontend/src/features/orderSuccess/useCases/getCourierProfile.js:1-8`
**Notes**: Simulated by design. PRD §6.11 (`documents/Product_Requirement_Doc.md:139-141`) says "Tracking visuals (map, courier, ETA) are simulation UI for testing." The title "Out for delivery" (`:80-82`) is also fixed, so an order reached by `?orderId=` in any status shows it. The tracking UI was added with 0cce600 (2026-02-18) per its commit message; not confirmed with `git log -S`.

### US-ORD-008-MOB · Simulated courier, ETA and tracking (mobile)
**As a** customer **I want** the same simulated courier and ETA on my phone **so that** the app matches the web.
- Layer: MOB · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the success screen, then a live-tracking label, a map placeholder and a pulse overlay are shown (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:41-68`).
2. Given any order, then the title "Out for delivery", "Expected arrival: 8:45 PM" and "15-20" are fixed text (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:92-97`).
3. The courier tag reads the literal "CARLOS" (`:83`), the rating is the literal "4.9 ★" (`:114`), and the name comes from `getCourierProfile` (`:26`, `:120`), which returns "Carlos R." (`frontend-mobile/src/features/orderSuccess/useCases/getCourierProfile.ts:3`).
4. The chat and call buttons have no `onPress` (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:126-141`).

**Evidence**: `frontend-mobile/src/screens/OrderSuccessScreen.tsx:26,41-68,83,92-97,114,120,126-141`, `frontend-mobile/src/features/orderSuccess/useCases/getCourierProfile.ts:1-7`
**Notes**: Simulated by design (PRD §6.11). The tag "CARLOS" and the name "Carlos R." are two strings for one courier; cosmetic.

### US-ORD-009-WEB · Order details list shows placeholder rows and wrong currency
**As a** customer **I want** the details panel to list each pizza with its price in the order's currency **so that** I can check what I was charged.
- Layer: WEB · Epic: ORD · Persona: Customer · Market: MX US CH JP SA
- Status: Found
- Found on: 9ca3767 (HEAD) · introduced in 2b3a099 (2026-07-09, `git log -S` hit for `order-detail-item`)

**Acceptance criteria**
1. Given an order with items, when the details panel opens, then each row reads `it.pizza?.name || it.name || t('pizza') || 'Pizza'` and the price `(it.unit_price ?? it.price ?? 0) * quantity` (`frontend/src/pages/OrderSuccess.jsx:149-157`). Stored items carry only `pizza_id`, `quantity`, `size` and `toppings` (plus `item_id`) (`backend/models.py:60-65`, `backend/routers/checkout.py:97`), so each row shows a generic name and a zero price (code reading; the probe returned the same item keys).
2. The panel total is formatted with the current country store's currency, not the order's (`frontend/src/utils/money.js:3-9`; `frontend/src/pages/OrderSuccess.jsx:133,167`). After a market change, a JPY order can display in USD or MXN.
3. The panel does not show the order's size or toppings, although the order stores them.

**Evidence**: `frontend/src/pages/OrderSuccess.jsx:133,147-170`, `frontend/src/utils/money.js:3-9`, `backend/models.py:60-65`, `backend/routers/checkout.py:97`
**Notes**: The web fix list for 2026-10-28 does not touch this panel. Mobile shows no per-item rows (US-ORD-006-MOB), so the gap is web-only.

### US-ORD-010-API · Order history rows are not OrderSummary
**As a** QA engineer **I want** each history row to match the OrderSummary contract **so that** one parser can read the list and the detail.
- Layer: API · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given `GET /api/orders` for a user with orders, then each row has `order_id`, `status`, `subtotal`, `delivery_fee`, `tax_rate`, `tip_percentage`, `tax`, `tip`, `total`, `currency`, `items`, `timestamp`, `country_code`, `username` and `customer_info`, and no `currency_symbol` (probe with `standard_user`).
2. The list declares no `response_model`, so the row schema is absent from OpenAPI (`backend/routers/checkout.py:127-131`).
3. `customer_info` (name, address, phone) appears in list rows, but no field of that kind exists on `OrderSummary` (`backend/models.py:131-144`). The detail endpoint does not return it.

**Evidence**: `backend/routers/checkout.py:127-131`, `backend/database.py:167-168`, `backend/models.py:131-144`
**Notes**: Found on HEAD and on US-and-Improvements (no change there). The PRD does not state a list shape (`documents/Product_Requirement_Doc.md:131`), so this is an inconsistency, not a contract violation. Owner-only data.

### US-ORD-011-WEB · `?orderId=` shows no error state for 403 or 404
**As a** QA engineer **I want** the success screen to show a clear state when an `orderId` cannot be loaded **so that** a failed lookup is distinguishable from a working page.
- Layer: WEB · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given `?orderId=<id>` where the API returns 403 or 404, when the page mounts, then the error is ignored (`frontend/src/pages/OrderSuccess.jsx:24-26`) and the page renders the courier-only view with no order.
2. Given a network error, then the same silent fallback applies (`frontend/src/pages/OrderSuccess.jsx:26`).
3. Expected per NF-ORDER-001 and NF-ORDER-002 (`documents/Product_Requirement_Doc.md:215-216`): an access-denied or not-found state. Applying those to this entry point is an inference.

**Evidence**: `frontend/src/pages/OrderSuccess.jsx:22-27`, `documents/Product_Requirement_Doc.md:215-216`
**Notes**: Found on HEAD and on US-and-Improvements. The code comment at `OrderSuccess.jsx:26` says the fallback is deliberate.

### US-ORD-011-MOB · `orderId` deep link shows no error state for 403 or 404
**As a** QA engineer **I want** a failed `orderId` deep link to show a clear state **so that** a failed lookup is not mistaken for a working screen.
- Layer: MOB · Epic: ORD · Persona: QA engineer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given the deep-link `orderId` fetch returns 403 or 404, when the app opens the success screen, then the failure is caught and logged only in `__DEV__` builds (`frontend-mobile/src/hooks/useDeepLinkParams.ts:125-129`), and the screen shows no error.
2. Expected per NF-ORDER-001 and NF-ORDER-002 (`documents/Product_Requirement_Doc.md:215-216`): a visible state. Applying those to this entry point is an inference.

**Evidence**: `frontend-mobile/src/hooks/useDeepLinkParams.ts:119-130`, `documents/Product_Requirement_Doc.md:215-216`
**Notes**: Found on HEAD and on US-and-Improvements. In a release build nothing is logged, so the failure is invisible to the tester.
