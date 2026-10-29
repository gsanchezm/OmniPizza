# Epic CHK — Checkout & Pricing

Turning a cart into a placed order: the market-specific delivery field, tip, totals and per-currency rounding, payment method selection, input validation, the pre-order confirm step, and the cart hydration that the QA atomic entry point relies on. Covers `POST /api/checkout` (`backend/routers/checkout.py`), the web checkout (`frontend/src/pages/Checkout.jsx`) and the mobile checkout (`frontend-mobile/src/screens/CheckoutScreen.tsx`).

**Conventions.** `path:line` refers to this worktree's branch (HEAD `9ca3767`, which is `main` `87966da` plus `/api/version`). `US-and-Improvements:path:line` refers to the `US-and-Improvements` branch (local and `origin`), where the 2026-10-28 fix commits live. Those fixes are not on this branch or on `main`, so every story that depends on one is marked "fix on US-and-Improvements only" in its Notes. "Probe" means an in-process `fastapi.testclient.TestClient` run against this checkout on 2026-10-28 (no server, no port).

| ID | Title | Layer | Status |
|---|---|---|---|
| US-CHK-001-API | Place an order and receive the canonical OrderSummary | API | Done |
| US-CHK-001-WEB | Place an order from the web checkout | WEB | Done |
| US-CHK-001-MOB | Place an order from the mobile checkout | MOB | Done |
| US-CHK-002-API | Market-required delivery field | API | Done |
| US-CHK-002-WEB | Market-specific delivery inputs on web | WEB | Done |
| US-CHK-002-MOB | Market-specific delivery inputs on mobile | MOB | Done |
| US-CHK-003-API | Totals breakdown with per-currency rounding | API | Done |
| US-CHK-003-WEB | Totals summary on web | WEB | Done |
| US-CHK-003-MOB | Totals summary on mobile | MOB | Done |
| US-CHK-004-API | Tip percentage with a per-market field name | API | Done |
| US-CHK-004-WEB | Tip picker on web | WEB | Done |
| US-CHK-004-MOB | Tip picker on mobile | MOB | Done |
| US-CHK-005-API | Payment method accepted by the API | API | Done |
| US-CHK-005-WEB | Payment method selection on web | WEB | Done |
| US-CHK-005-MOB | Payment method selection on mobile | MOB | Done |
| US-CHK-006-API | Field length, quantity and tip bounds | API | Done |
| US-CHK-006-WEB | Field validation on web (phone hint) | WEB | Done |
| US-CHK-006-MOB | Name and address length checks on mobile | MOB | Found |
| US-CHK-007-API | ZIP code format | API | Done |
| US-CHK-007-WEB | ZIP input on web | WEB | Done |
| US-CHK-007-MOB | ZIP input on mobile (MX optional, parity) | MOB | Done |
| US-CHK-008-WEB | Confirm dialog before placing an order (web) | WEB | Done |
| US-CHK-008-MOB | Confirm dialog before placing an order (mobile) | MOB | Done |
| US-CHK-008-UX | Confirm dialog keyboard behaviour (Escape, focus in and out) | UX | Done |
| US-CHK-009-WEB | Save entered details to the profile after checkout | WEB | Found |
| US-CHK-009-MOB | Save entered details to the profile after checkout | MOB | Done |
| US-CHK-010-WEB | Hydrate the web checkout from the cart API | WEB | Done |
| US-CHK-010-MOB | Hydrate the mobile checkout from the cart API | MOB | Done |
| US-CHK-011-API | Unpriced or empty checkouts are accepted | API | Found |
| US-CHK-012-API | Tip taken from another market's tip field | API | Found |
| US-CHK-013-API | payment_method is accepted but not recorded | API | Found |
| US-CHK-014-API | Server rounds half-values with Python round() | API | Found |
| US-CHK-014-WEB | Web total can differ from the server by one minor unit | WEB | Found |
| US-CHK-014-MOB | Mobile total can differ from the server by one minor unit | MOB | Found |
| US-CHK-015-UX | Confirm dialog does not keep Tab focus inside | UX | Found |
| US-CHK-016-MOB | Edit a checkout line like the web | MOB | Done |

---

### US-CHK-001-API · Place an order and receive the canonical OrderSummary
**As a** customer **I want** to submit my cart and receive an order summary **so that** I know exactly what I am charged before I leave checkout.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given a valid bearer token and a body with `country_code`, `items`, `name`, `address`, `phone` and the market field, when `POST /api/checkout` is called, then the response is 200 with `order_id`, `status` ("pending"), `subtotal`, `delivery_fee`, `tax_rate`, `tip_percentage`, `tax`, `tip`, `total`, `currency`, `currency_symbol`, `items` and `timestamp` (probe, US order).
2. Given a created order, when its id is generated, then the id has the form `ORDER-XXXXXXXX` and it is stored in memory with status "pending" (`backend/database.py:150-156`).
3. Given no `Authorization` header, when checkout is called, then the response is 401 with the error envelope `{"error", "status_code", "timestamp"}` (`backend/main.py:75-84`; probe).
4. Given no `X-Country-Code` header, when checkout is called, then it still succeeds and the market is taken from the body only (probe: 200 without the header).

**Evidence**: `backend/routers/checkout.py:31-125`, `backend/routers/checkout.py:10-25`, `backend/models.py:91-100`, `backend/models.py:131-144`, `backend/database.py:150-156`, `backend/main.py:75-84`
**Notes**: CLAUDE.md lists `X-Country-Code` as required on most endpoints; this route does not call `require_country_header` (AC 4). Chaos: `error_user` and `security_glitch_user` get a 500 on about half of checkouts (`backend/database.py:361-364`, `backend/routers/checkout.py:62-72`; probe 29 of 60 and 23 of 40). Related NF id: NF-CHECKOUT-004. The 3 s delay for `performance_glitch_user` is in `backend/middleware.py:52-60` (not probed).

### US-CHK-001-WEB · Place an order from the web checkout
**As a** customer **I want** to press Place order, confirm, and land on the order-success screen **so that** I can see my order was accepted.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 (first `git log -S` hit for `setLastOrder(res.data)`)

**Acceptance criteria**
1. Given a non-empty cart and a valid form, when the customer confirms in the dialog, then `POST /api/checkout` is sent with the payload from `buildCheckoutPayload` and the response is stored as `lastOrder` (`frontend/src/pages/Checkout.jsx:323-340`, `frontend/src/features/checkout/useCases/placeOrder.js:4-7`, `frontend/src/services/order.service.js:4`).
2. Given the order was placed, when the response is stored, then the cart is cleared and the app navigates to `/order-success` with replace (`frontend/src/pages/Checkout.jsx:338-340`).
3. Given the request fails, when the error is caught, then a `role="alert"` banner shows the `checkoutFailed` text and the cart is kept (`frontend/src/pages/Checkout.jsx:341-343`, `378-388`).
4. Given the cart is empty, when `/checkout` renders, then the empty state with `start-order-btn` is shown (`frontend/src/pages/Checkout.jsx:348-364`).

**Evidence**: `frontend/src/pages/Checkout.jsx:323-346`, `frontend/src/pages/Checkout.jsx:348-364`, `frontend/src/features/checkout/useCases/placeOrder.js:4-7`, `frontend/src/features/checkout/repositories/orderRepository.js:3-9`, `frontend/src/services/order.service.js:3-4`
**Notes**: Every failure, including a server 400 or 422, shows the same generic text; there is no field-level mapping. The success screen reads the stored order (see US-ORD-006-WEB).

### US-CHK-001-MOB · Place an order from the mobile checkout
**As a** customer **I want** the same place-order flow on my phone **so that** I can complete a purchase in the app.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-18 · Commit: afa1035 (first `git log -S` hit for the `OrderSuccess` reset)

**Acceptance criteria**
1. Given valid input, when Place order is confirmed, then the use case posts the built payload, the result is stored with `setLastOrder`, the cart is cleared and navigation resets to `OrderSuccess` (`frontend-mobile/src/screens/CheckoutScreen.tsx:229-244`).
2. Given the request fails, when the error is caught, then the error box shows `checkoutFailed` and the cart is kept (`frontend-mobile/src/screens/CheckoutScreen.tsx:245-247`, `836-840`).
3. Given the cart is empty, when the screen renders, then `screen-checkout-empty` with the start-order button is shown (`frontend-mobile/src/screens/CheckoutScreen.tsx:257-279`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:210-250`, `frontend-mobile/src/screens/CheckoutScreen.tsx:257-279`, `frontend-mobile/src/features/checkout/useCases/placeOrder.ts:5-14`, `frontend-mobile/src/features/checkout/repositories/orderRepository.ts:6-7`, `frontend-mobile/src/services/order.service.ts:5-7`
**Notes**: Like web, every failure shows the generic `checkoutFailed` text (see US-CHK-006-MOB). Mobile order state is in memory only (`frontend-mobile/src/store/useAppStore.ts` has no persist).

### US-CHK-002-API · Market-required delivery field
**As a** customer **I want** checkout to require my market's delivery field **so that** the order can be delivered.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `country_code` US and no `zip_code`, when checkout is called, then the response is 400 with `{"error": "Field 'zip_code' is required for country US", "status_code": 400, ...}` (`backend/routers/checkout.py:77-83`; probe).
2. Given MX with `colonia` and no `zip_code`, when checkout is called, then the response is 200 because MX ZIP is optional (probe).
3. Given the market's required field is an empty string, when checkout is called, then it counts as missing (`if not field_value`, `backend/routers/checkout.py:78-79`; code reading only).
4. The required field per market is `colonia` (MX), `zip_code` (US), `plz` (CH), `prefectura` (JP) and `district` (SA), read from `COUNTRY_CONFIG` (`backend/constants.py:89-146`; code reading only).

**Evidence**: `backend/routers/checkout.py:74-83`, `backend/constants.py:89-146`, `backend/models.py:103-112`, `backend/main.py:75-84`
**Notes**: The 400 envelope uses the `error` key, not FastAPI's `detail` key (`backend/main.py:75-84`), so clients must read `error`. Related NF id: NF-CHECKOUT-003. PRD §6.9 (`documents/Product_Requirement_Doc.md:121-125`) lists MX, US, CH and JP but omits SA (drift).

### US-CHK-002-WEB · Market-specific delivery inputs on web
**As a** customer **I want** to see only the address fields my market needs **so that** I am not asked for irrelevant data.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given market MX, when the form renders, then a required `colonia` input and an optional ZIP input are shown (`frontend/src/pages/Checkout.jsx:425-465`; ZIP has no `required`, line 444-465).
2. Given market US, then a required 5-digit ZIP input is shown (`frontend/src/pages/Checkout.jsx:467-489`); CH shows a required `plz` (`:491-508`), JP a required `prefectura` (`:510-527`) and SA a required `district` (`:529-546`).
3. Given any market, when the payload is built, then only that market's field is sent (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-38`).

**Evidence**: `frontend/src/pages/Checkout.jsx:425-546`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-38`
**Notes**: The street address input is shared by all markets (`frontend/src/pages/Checkout.jsx:406-422`).

### US-CHK-002-MOB · Market-specific delivery inputs on mobile
**As a** customer **I want** the mobile checkout to ask only for my market's delivery field **so that** the form matches what the server requires.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given market MX, when the form renders, then `input-colonia` and the MX ZIP input are shown (`frontend-mobile/src/screens/CheckoutScreen.tsx:303-330`).
2. Given US, then the ZIP input is shown (`CheckoutScreen.tsx:335-348`); CH shows `plz` (`:353-361`), JP `prefectura` (`:367-374`) and SA `district` (`:381-390`).
3. Given a market, when the form is validated, then the matching field must be non-empty: `colonia` (MX), ZIP (US, 5 digits), `plz` (CH), `prefectura` (JP), `district` (SA) (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:13-18`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:303-390`, `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:12-18`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:52-63`
**Notes**: The MX ZIP rule on mobile differs from the API and web (required on this branch). See US-CHK-007-MOB.

### US-CHK-003-API · Totals breakdown with per-currency rounding
**As a** customer **I want** subtotal, delivery, tax, tip and total computed in my market's currency **so that** the amount charged is predictable.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given one Margherita (`p01`, small) in US with no tip, when checkout runs, then subtotal is 12.99, delivery_fee 2.0, tax 1.04 (8%), tip 0.0 and total 16.03 (probe).
2. Given the same order with `tip: 10`, then tip is 1.3, tip_percentage 10.0 and total 17.33 (probe).
3. Given the same order in JP, then subtotal is 2051, delivery_fee 316, tax 205 (10%) and total 2572, with no decimals (probe; JPY `decimal_places` is 0 in `backend/constants.py:134`).
4. Given any market, then subtotal, tax, tip and total are each rounded to the currency's decimal places (`backend/database.py:345-348`). The rounding function is Python `round()`, see US-CHK-014-API.

**Evidence**: `backend/database.py:23-40`, `backend/database.py:308-359`, `backend/constants.py:89-146`, `backend/constants.py:342-348`, `backend/models.py:131-144`
**Notes**: The delivery fee is `delivery_fee_usd` converted with `CURRENCY_RATES` (`backend/database.py:319-323`). Unknown pizza ids and empty `items` produce a zero subtotal without an error (US-CHK-011-API).

### US-CHK-003-WEB · Totals summary on web
**As a** customer **I want** the web summary to show subtotal, tax, delivery, tip and total before I place the order **so that** I see what I will pay.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: a903683 (cart sidebar; US-and-Improvements only)

**Acceptance criteria**
1. Given the cart and the market, when the summary renders, then subtotal, tax (with its percentage), delivery fee, tip and total are computed from cart unit prices and the API `tax_rate` and `delivery_fee`, with constant fallbacks (`frontend/src/pages/Checkout.jsx:267-321`, rows at `:1006-1028` and `:1091-1101`).
2. Given JPY, when amounts are rounded, then whole units are used; other currencies round to cents (`frontend/src/pages/Checkout.jsx:115-119`).
3. The cart sidebar uses the API delivery fee, falling back to the market constant, instead of a hardcoded 2.50 (`US-and-Improvements:frontend/src/components/CartSidebar.jsx:18-22`, `US-and-Improvements:frontend/src/constants/market.js:3`). On this branch `frontend/src/components/CartSidebar.jsx:15` still reads `const deliveryFee = 2.50;`.

**Evidence**: `frontend/src/pages/Checkout.jsx:115-119`, `frontend/src/pages/Checkout.jsx:267-321`, `frontend/src/pages/Checkout.jsx:1006-1028`, `frontend/src/pages/Checkout.jsx:1091-1101`, `frontend/src/components/CartSidebar.jsx:15` (HEAD)
**Notes**: Fix on US-and-Improvements only (AC 3). Client totals follow the server formula but can differ by one minor unit; see US-CHK-014-WEB.

### US-CHK-003-MOB · Totals summary on mobile
**As a** customer **I want** the mobile summary to show the same breakdown **so that** the app and the web agree on the amount.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the cart, when the summary renders, then subtotal, tax, delivery fee, tip and total are computed from `unit_price` and the API country info, with fallbacks by country (`frontend-mobile/src/screens/CheckoutScreen.tsx:167-200`, fallbacks `:182-188`).
2. Given the confirm dialog opens, then it shows the same client total (`frontend-mobile/src/screens/CheckoutScreen.tsx:887-890`).
3. Given the order was placed, then the success screen shows the server's subtotal, delivery fee, tax, tip and total (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:163-187`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:167-200`, `frontend-mobile/src/screens/CheckoutScreen.tsx:887-890`, `frontend-mobile/src/screens/OrderSuccessScreen.tsx:163-187`
**Notes**: The rounding helper matches web's (`CheckoutScreen.tsx:44-48`), so the same one-cent gap applies; see US-CHK-014-MOB.

### US-CHK-004-API · Tip percentage with a per-market field name
**As a** customer **I want** to tip a percentage under my market's own field name **so that** the tip is recorded as the local convention expects.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (first `git log -S` hit for `propina`)

**Acceptance criteria**
1. Given a tip sent in the market field (`propina` MX, `tip` US, `trinkgeld` CH, `chip` JP, `baksheesh` SA), when checkout is called, then `tip_percentage` and `tip` reflect it (`backend/models.py:103-108`, `backend/database.py:347,354`; probe: US `tip: 10` gives tip 1.3).
2. Given a tip below 0 or above 100, when checkout is called, then the response is 422 (`backend/models.py:104-108`; probe for 101 and -1).
3. Given no tip, then `tip` is 0.0 and `tip_percentage` is 0.0 (probe).
4. The tip options 0, 5, 10, 15 are configured per market (`backend/constants.py:96,107,119,130,142`); the API itself accepts any value from 0 to 100.

**Evidence**: `backend/models.py:103-129`, `backend/constants.py:89-146`, `backend/database.py:347,354`, `backend/routers/checkout.py:86-91`, `backend/routers/checkout.py:111-120`
**Notes**: Market precedence is wrong when several tip fields are sent; see US-CHK-012-API. PRD §6.9 (`documents/Product_Requirement_Doc.md:122-125`) lists MX, US, CH and JP tip fields but not SA.

### US-CHK-004-WEB · Tip picker on web
**As a** customer **I want** to pick a tip percentage and see its amount **so that** I can tip the driver.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the summary renders, then four tip buttons show the API `tip_percentages` (fallback 0, 5, 10, 15) and `0%` is selected by default (`frontend/src/pages/Checkout.jsx:288-301`, `:1068-1088`).
2. Given a tip is chosen, then the tip amount and total update (`frontend/src/pages/Checkout.jsx:306-313`), and the info button opens the tip tooltip on hover, focus or click (`frontend/src/pages/Checkout.jsx:1038-1062`).
3. Given the order is placed, then the tip is sent under the market's field name (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:2-8`, `:23-25`).

**Evidence**: `frontend/src/pages/Checkout.jsx:288-313`, `frontend/src/pages/Checkout.jsx:1038-1088`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:2-8,23-25`
**Notes**: The default is `0` because it is in the API options list (`Checkout.jsx:297-300`).

### US-CHK-004-MOB · Tip picker on mobile
**As a** customer **I want** the same tip choices on my phone **so that** tipping works the same across platforms.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the summary renders, then tip pills show `countryInfo.tip_percentages` (fallback 0, 5, 10, 15) and 0% is selected by default (`frontend-mobile/src/screens/CheckoutScreen.tsx:189-196`, `:780-801`).
2. Given a tip is chosen, then the tip amount and total update (`frontend-mobile/src/screens/CheckoutScreen.tsx:197-200`) and the tooltip toggles on press (`:759-768`).
3. Given the order is placed, then the tip is sent under the market field (`frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:27-33`, `:48-50`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:189-200`, `frontend-mobile/src/screens/CheckoutScreen.tsx:752-801`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:27-50`

### US-CHK-005-API · Payment method accepted by the API
**As a** customer **I want** to choose card, cash or PayPal at checkout **so that** the order can be placed with the method I prefer.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-05-19 · Commit: f1ee64c (first `git log -S` hit for `payment_method`)

**Acceptance criteria**
1. Given `payment_method` of "card", "cash" or "paypal", when checkout is called, then the response is 200 (probe for "paypal").
2. Given any other value, such as "bitcoin", when checkout is called, then the response is 422 (probe).
3. Given no `payment_method`, then it defaults to "card" (`backend/models.py:100`; code reading only).

**Evidence**: `backend/models.py:100`, `backend/routers/checkout.py:41-44`
**Notes**: The chosen method is not stored or returned; see US-CHK-013-API. PRD §6.9 (`documents/Product_Requirement_Doc.md:119`) and §7.2 (`:162`) list only "card" and "cash" (drift: PayPal is accepted by the code).

### US-CHK-005-WEB · Payment method selection on web
**As a** customer **I want** to pick card, cash or PayPal and fill the matching fields **so that** I can pay the way I want.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 61a4751 (radios and PayPal)

**Acceptance criteria**
1. Given the payment section, then three radio buttons (card, cash, paypal) are shown with `aria-checked`, and card is selected by default (`frontend/src/pages/Checkout.jsx:217`, `:621-718`).
2. Given card is selected, then cardholder, number, expiry and CVV inputs are shown and required (`frontend/src/pages/Checkout.jsx:720-841`); none of these values are sent (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:9-21`).
3. Given PayPal is selected, then a demo email and password form appears, and "connect" marks the demo connected only when both fields are non-empty (`frontend/src/pages/Checkout.jsx:843-918`, `:901-903`; `87966da` for the validation). Placing the order does not require the connect step (`frontend/src/pages/Checkout.jsx:323-346`).
4. Given the order is placed, then `payment_method` is sent and the PayPal credentials never are (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:20`).

**Evidence**: `frontend/src/pages/Checkout.jsx:217-220`, `frontend/src/pages/Checkout.jsx:621-918`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:9-21`
**Notes**: The PayPal demo is cosmetic on both platforms. Whether connecting should be required before placing a PayPal order is Unverified; no spec was found.

### US-CHK-005-MOB · Payment method selection on mobile
**As a** customer **I want** to pick a payment method on my phone and fill only the fields it needs **so that** cash and PayPal orders are not blocked by card fields.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 61a4751 (radios and PayPal)

**Acceptance criteria**
1. Given the payment section, then three selectors `btn-payment-card`, `btn-payment-cash` and `btn-payment-paypal` are shown and card is the default (`frontend-mobile/src/screens/CheckoutScreen.tsx:153`, `:436-515`).
2. Given the payment method is card, when the form is validated, then cardholder, card number (13+ digits), expiry (4+ digits) and CVV (3+ digits) are required; cash and PayPal skip these checks (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:24-35`).
3. Given the order is placed, then the payload carries `payment_method` only, with no card or PayPal fields (`frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:34-46`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:153,436-515,519-575`, `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:24-35`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:34-46`
**Notes**: The PayPal connect button needs non-empty email and password (`CheckoutScreen.tsx:561`), and placing the order does not check it. Same demo status as web; see US-CHK-005-WEB.

### US-CHK-006-API · Field length, quantity and tip bounds
**As a** QA engineer **I want** checkout to reject out-of-range fields with a 422 **so that** my validation tests have a stable server contract.
- Layer: API · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (first `git log -S` hit for `min_length=2`)

**Acceptance criteria**
1. Given a name of one character, when checkout is called, then the response is 422 with `string_too_short` on `name` (minimum 2) (`backend/models.py:97`; probe).
2. Given an address of four characters, then the response is 422 (minimum 5) (`backend/models.py:98`; probe).
3. Given a phone of 7 digits, then the response is 422 (minimum 8), and a 21-digit phone is 422 (maximum 20) (`backend/models.py:99`; probe).
4. Given `quantity` 0 or 11, or a tip of 101 or -1, then the response is 422 (`backend/models.py:62`, `:104-108`; probe).
5. Given any of the above, the body is FastAPI's default `{"detail": [{type, loc, msg, input, ctx}]}`, because `main.py` registers no `RequestValidationError` handler (`backend/main.py:74-95`; probe).

**Evidence**: `backend/models.py:60-65`, `backend/models.py:91-112`, `backend/main.py:74-95`
**Notes**: Validation is length-only. A name of two spaces and a phone of letters both return 200 (probe). That matches PRD §7.2 (`documents/Product_Requirement_Doc.md:158`, "server-side length validation") and NF-CHECKOUT-002, but there is no whitespace or character rule. The 422 envelope (`detail`) differs from the `error` envelope used by 400, 401, 403, 404 and 409. Fix b2179d9 documents this in the PRD on US-and-Improvements only.

### US-CHK-006-WEB · Field validation on web (phone hint)
**As a** customer **I want** the web form to block invalid name, address and phone values and tell me the phone rule **so that** I can fix the input before submitting.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 7fc6393 (phone hint; US-and-Improvements only)

**Acceptance criteria**
1. Given a name shorter than 2 characters or an address shorter than 5 characters, when the form is submitted, then the browser blocks it through `minLength` (`frontend/src/pages/Checkout.jsx:419`, `:575`).
2. Given a phone value, when the customer types, then non-digits are removed and the field must be 8 to 20 characters (`frontend/src/pages/Checkout.jsx:586-598`, digit filter at `:593`).
3. Given the phone field is invalid, then the hint says "8-20 digits" (`US-and-Improvements:frontend/src/i18n/locales/en.json:111`, fix 7fc6393). On this branch `frontend/src/i18n/locales/en.json:107` says "Enter a valid phone number (7-15 digits)", which contradicts the enforced rule.

**Evidence**: `frontend/src/pages/Checkout.jsx:419,575,583-606`, `frontend/src/i18n/locales/en.json:107` (HEAD), `US-and-Improvements:frontend/src/i18n/locales/en.json:111`
**Notes**: Fix on US-and-Improvements only (AC 3). The hint string also appears in the other locale files that 7fc6393 changed.

### US-CHK-006-MOB · Name and address length checks on mobile
**As a** customer **I want** the mobile checkout to stop an invalid name or address before it is sent **so that** I see a specific message instead of a generic failure.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given a name of one character, when Place order is confirmed, then the app does not block locally (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:19` checks only non-empty). The API returns 422 and the screen shows the generic `checkoutFailed` text (`frontend-mobile/src/screens/CheckoutScreen.tsx:245-247`).
2. Given an address of four characters, then the same happens: the check at `validateCheckoutForm.ts:12` only requires non-empty input.
3. Done parts: a phone with fewer than 8 digits is blocked locally with `validationPhoneMinDigits` (`validateCheckoutForm.ts:20-22`), and the phone input is capped at 20 characters (`frontend-mobile/src/screens/CheckoutScreen.tsx:425`).

**Evidence**: `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:12-22`, `frontend-mobile/src/screens/CheckoutScreen.tsx:245-247,412-425`
**Notes**: Web blocks the same inputs with `minLength` (`frontend/src/pages/Checkout.jsx:419,575`). Found on this branch and on US-and-Improvements, since the fix there touched only the MX ZIP lines (see US-CHK-007-MOB). Observed 2026-10-28 with probe: the API rejects 1-character names with 422.

### US-CHK-007-API · ZIP code format
**As a** customer **I want** US and MX postal codes checked for format **so that** a malformed ZIP is rejected before the order is created.
- Layer: API · Epic: CHK · Persona: Customer · Market: US MX
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (format); 2026-10-28 · Commit: b2179d9 (English message; US-and-Improvements only)

**Acceptance criteria**
1. Given US with ZIP "10001", when checkout is called, then the order is created (probe).
2. Given US with ZIP "1234", when checkout is called, then the response is 422 with `loc` `["body", "zip_code"]` (`backend/models.py:114-119`; probe).
3. Given MX with no ZIP, then the order is created; MX with "06600" is accepted; MX with "066" gives 422 (probe; `backend/models.py:116`).
4. The rule is `isdigit()` and length 5, applied only to US and MX and only when a value is present (`backend/models.py:116-118`). An empty US ZIP gives the 400 required-field error (`backend/routers/checkout.py:77-83`; code reading).
5. The message is English on US-and-Improvements, "ZIP code must be 5 digits" (`US-and-Improvements:backend/models.py:119`, fix b2179d9). On this branch it is Spanish, "ZIP code debe tener 5 dígitos" (`backend/models.py:118`; probe output).

**Evidence**: `backend/models.py:114-119`, `backend/routers/checkout.py:77-83`, `US-and-Improvements:backend/models.py:115-119`
**Notes**: AC 5 is fix-only. Status is Done because the format rule (ACs 1-4) exists on this branch. The 422 shape is described in US-CHK-006-API.

### US-CHK-007-WEB · ZIP input on web
**As a** customer **I want** the ZIP field to match my market's rule **so that** an MX order does not need a ZIP and a US order must have one.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US
- Status: Done

**Acceptance criteria**
1. Given MX, then the ZIP input is optional, digits only, with `minLength` and `maxLength` 5 (`frontend/src/pages/Checkout.jsx:444-465`).
2. Given US, then the ZIP input is required, digits only, with `minLength` and `maxLength` 5 (`frontend/src/pages/Checkout.jsx:467-489`).
3. Given the order is placed, then `zip_code` is always sent for US and sent for MX only when non-empty (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-31`).

**Evidence**: `frontend/src/pages/Checkout.jsx:444-489`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-31`

### US-CHK-007-MOB · ZIP input on mobile (MX optional, parity)
**As a** customer in Mexico **I want** to place an order on my phone without a ZIP code **so that** the mobile app accepts what the web and API accept.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US
- Status: Done
- Done on: 2026-10-28 · Commit: 00b59c2 (US-and-Improvements only)

**Acceptance criteria**
1. Given MX with no ZIP, when Place order is confirmed, then validation passes; a given ZIP must be 5 digits (`US-and-Improvements:frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:14-15`).
2. Given US, then the ZIP is required and must be 5 digits (`US-and-Improvements:frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:16`).
3. The ZIP input accepts digits only, with a maximum of 5 (`frontend-mobile/src/screens/CheckoutScreen.tsx:317-330` for MX, `:335-348` for US).
4. The payload sends `zip_code` for US always and for MX only when non-empty (`frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:52-56`).

**Evidence**: `US-and-Improvements:frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:14-16`, `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:14` (HEAD), `frontend-mobile/src/screens/CheckoutScreen.tsx:317-348`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:52-56`
**Notes**: On this branch `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:14` still rejects an MX order without a ZIP, while the API accepts it (probe). Mobile therefore blocks what web and API allow. Fix on US-and-Improvements only.

### US-CHK-008-WEB · Confirm dialog before placing an order (web)
**As a** customer **I want** a confirmation step that shows the total before the order is sent **so that** I do not place an order by accident.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 2b3a099 (automation-demo widgets)

**Acceptance criteria**
1. Given the form, when Place order is pressed, then a `role="dialog"` shows the total in `confirm-order-total` and no request is sent yet (`frontend/src/pages/Checkout.jsx:1103-1108`, `:1135-1158`).
2. Given the dialog, when Cancel is pressed or the backdrop is clicked, then the dialog closes and focus returns to the Place order button (`frontend/src/pages/Checkout.jsx:1142-1147`, `:1160-1171`).
3. Given the dialog, when the confirm button is pressed, then the form is submitted with `requestSubmit()`, so native required-field checks still run (`frontend/src/pages/Checkout.jsx:1172-1178`).

**Evidence**: `frontend/src/pages/Checkout.jsx:1103-1108`, `frontend/src/pages/Checkout.jsx:1135-1186`
**Notes**: Required-field validation runs after the confirm step, so a dialog can close and then show browser validation errors. Keyboard behaviour is in US-CHK-008-UX. Focus containment is missing (US-CHK-015-UX).

### US-CHK-008-MOB · Confirm dialog before placing an order (mobile)
**As a** customer **I want** the same confirmation step on my phone **so that** the app matches the web.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 2b3a099 (automation-demo widgets)

**Acceptance criteria**
1. Given the form, when Place order is pressed, then a modal `modal-confirm-order` shows the total and no request is sent yet (`frontend-mobile/src/screens/CheckoutScreen.tsx:849-850`, `:860-894`).
2. Given the modal, when Cancel, the scrim or the Android back button is used, then it closes (`frontend-mobile/src/screens/CheckoutScreen.tsx:865`, `:869-871`, `:897-901`).
3. Given the modal, when Confirm is pressed, then the dialog closes and the order is placed (`frontend-mobile/src/screens/CheckoutScreen.tsx:252-255`, `:906-911`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:849-911`, `frontend-mobile/src/screens/CheckoutScreen.tsx:252-255`
**Notes**: Validation runs inside `placeOrder` after the confirm step (`CheckoutScreen.tsx:210-222`), the same ordering as web.

### US-CHK-008-UX · Confirm dialog keyboard behaviour (Escape, focus in and out)
**As a** keyboard user **I want** the confirm dialog to take focus, close on Escape and return focus to the trigger **so that** I can complete or cancel the order without a mouse.
- Layer: UX · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-13 · Commit: cf8d2c9 (WCAG a11y fixes)

**Acceptance criteria**
1. Given the web dialog opens, then focus moves to the Cancel button (`frontend/src/pages/Checkout.jsx:236-238`, `:1161`).
2. Given the web dialog is open, when Escape is pressed, then it closes and focus returns to the Place order button (`frontend/src/pages/Checkout.jsx:240-244`).
3. Given the mobile modal, then it is announced as a modal view (`frontend-mobile/src/screens/CheckoutScreen.tsx:873`, `accessibilityViewIsModal`), and the Android back button closes it (`:865`).

**Evidence**: `frontend/src/pages/Checkout.jsx:236-248`, `frontend/src/pages/Checkout.jsx:1139-1141`, `frontend-mobile/src/screens/CheckoutScreen.tsx:865,873`
**Notes**: The dialog has `aria-labelledby` and `aria-modal` (`Checkout.jsx:1137-1140`). Tab focus containment is not implemented; see US-CHK-015-UX.

### US-CHK-009-WEB · Save entered details to the profile after checkout
**As a** customer **I want** the name, address and phone I entered at checkout to be saved to my profile **so that** my next checkout starts pre-filled.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given a successful placement, when the order is stored, then the entered name, address and phone are not written to the profile store (`frontend/src/pages/Checkout.jsx:323-346` has no profile update).
2. Given the mobile app does this on placement (`frontend-mobile/src/screens/CheckoutScreen.tsx:235-239`), the web behaviour differs.

**Evidence**: `frontend/src/pages/Checkout.jsx:323-346`, `frontend-mobile/src/screens/CheckoutScreen.tsx:235-239`
**Notes**: Pre-fill from the profile works on web (`frontend/src/pages/Checkout.jsx:199-203`) and is in the PRD (`documents/Product_Requirement_Doc.md:114`). The gap is the write-back, which mobile has but web lacks, so the two platforms diverge. Observed on HEAD 9ca3767.

### US-CHK-009-MOB · Save entered details to the profile after checkout
**As a** customer **I want** my checkout details pre-filled from my profile and saved back after a successful order **so that** I do not retype them.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given a stored profile, when checkout mounts, then name, address and phone are pre-filled (`frontend-mobile/src/screens/CheckoutScreen.tsx:136-139`).
2. Given a successful placement, when the result is stored, then `setProfile({ fullName, address, phone })` updates the in-app profile (`frontend-mobile/src/screens/CheckoutScreen.tsx:235-239`, `frontend-mobile/src/store/useAppStore.ts:130`).
3. The checkout path sends no profile request: it calls only `setProfile` on the store, while profile saves go through `features/profile` (`CheckoutScreen.tsx` has no profile repository import).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:71,136-139,235-239`, `frontend-mobile/src/store/useAppStore.ts:130`
**Notes**: The write-back is local only and lasts for the app session, because the mobile store is not persisted. It is not sent to `/api/users/me/profile`. Web does not write back (US-CHK-009-WEB).

### US-CHK-010-WEB · Hydrate the web checkout from the cart API (QA entry point)
**As a** QA engineer **I want** `/checkout` to load the server-side cart when the local cart is empty **so that** a test can seed the cart through the API and go straight to checkout.
- Layer: WEB · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-03-11 · Commit: 75a849f (cart hydration)

**Acceptance criteria**
1. Given a token and an empty local cart, when `/checkout` mounts, then `GET /api/cart` is called and its items become the local cart (`frontend/src/pages/Checkout.jsx:133-187`).
2. Given the local cart already has items, then no cart request is made (`frontend/src/pages/Checkout.jsx:142`).
3. Given a cart item with toppings, then hydration keeps the toppings and prices them: `US-and-Improvements:frontend/src/pages/Checkout.jsx:143,157,161,165` (fix bbbd4ed). On this branch hydration sets `toppings: []` (`frontend/src/pages/Checkout.jsx:171`) and prices without toppings (`:163`).
4. Given the request fails, then the local cart is left unchanged (`frontend/src/pages/Checkout.jsx:181-183`).

**Evidence**: `frontend/src/pages/Checkout.jsx:133-187`, `frontend/src/pages/Checkout.jsx:163,171` (HEAD), `US-and-Improvements:frontend/src/pages/Checkout.jsx:143-165`, `US-and-Improvements:backend/models.py:73`, `US-and-Improvements:backend/database.py:256`
**Notes**: AC 3 is fix bbbd4ed (2026-10-28), US-and-Improvements only. On this branch `EnrichedCartItem` has no `toppings` field (`backend/models.py:68-78`). The `GET /api/cart` shape belongs to the CART epic. CLAUDE.md documents the lazy-route fallback; not re-verified here.

### US-CHK-010-MOB · Hydrate the mobile checkout from the cart API (QA entry point)
**As a** QA engineer **I want** the mobile checkout to load the server-side cart on mount, including after a deep link **so that** an Appium run can seed state and reach checkout.
- Layer: MOB · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: bbbd4ed (toppings kept; US-and-Improvements only)

**Acceptance criteria**
1. Given a token and an empty local cart, when the checkout mounts, then `GET /api/cart` is called and mapped to cart items (`frontend-mobile/src/screens/CheckoutScreen.tsx:76-134`). The effect re-runs when the token changes (`:134`).
2. Given items already in the local cart, then no cart request is made (`frontend-mobile/src/screens/CheckoutScreen.tsx:85`).
3. Given server toppings, then they are kept: `US-and-Improvements:frontend-mobile/src/screens/CheckoutScreen.tsx:94,112-121`. On this branch toppings are set to `[]` (`frontend-mobile/src/screens/CheckoutScreen.tsx:118`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:76-134`, `US-and-Improvements:frontend-mobile/src/screens/CheckoutScreen.tsx:94-121`
**Notes**: The `hydrateCart=true` deep link clears the local cart so this runs (`frontend-mobile/src/hooks/useDeepLinkParams.ts:109`, `frontend-mobile/src/navigation/linking.ts:34`). AC 3 is fix-only. The commit message of e785a35 (2026-05-19) mentions mobile cart hydration; this was not confirmed with `git log -S`.

### US-CHK-011-API · Unpriced or empty checkouts are accepted
**As a** customer **I want** checkout to refuse items it cannot price **so that** I am never billed for a silent zero-value order.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given an item whose `pizza_id` is not in the catalog (e.g. `p99`), when checkout is called, then the response is 200 with `subtotal` 0.0 and a total equal to delivery plus tax (US: total 2.0; probe).
2. Given `items: []`, when checkout is called, then the response is 200 with subtotal 0.0 (probe).
3. No rule in PRD §6.9 or §7.2 covers this, so the intended behaviour is Unverified.

**Evidence**: `backend/database.py:325-343` (unknown ids skipped at `:327-328`), `backend/models.py:91-95` (`items` has no minimum length or catalog check), `backend/routers/checkout.py:85-125`
**Notes**: Found on HEAD 9ca3767 and on US-and-Improvements (no fix there). The order is created and stored with the zero subtotal.

### US-CHK-012-API · Tip taken from another market's tip field
**As a** QA engineer **I want** a tip sent in a different market's field to be ignored **so that** a market's tip is only the one its own field carries.
- Layer: API · Epic: CHK · Persona: QA engineer · Market: JP
- Status: Found

**Acceptance criteria**
1. Given a JP order with `chip: 10` and `tip: 5`, when checkout is called, then `tip_percentage` is 5.0 and tip is 103.0 (probe), even though JP's field is `chip`.
2. `get_tip_percentage` returns the first truthy value of `propina`, `tip`, `trinkgeld`, `chip`, `baksheesh` in that order, regardless of `country_code` (`backend/models.py:121-129`).
3. The stored `customer_info` keeps `chip` as 10 while the charged tip is 5% (`backend/routers/checkout.py:111-120`; code reading only).

**Evidence**: `backend/models.py:103-108`, `backend/models.py:121-129`, `backend/routers/checkout.py:86-91`, `backend/routers/checkout.py:111-120`, `backend/constants.py:124-135`
**Notes**: API-only. Web and mobile send one tip field, so the UI cannot reach this. Found on HEAD 9ca3767.

### US-CHK-013-API · payment_method is accepted but not recorded
**As a** customer **I want** my chosen payment method to be kept on the order **so that** the order records how I intend to pay.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given `payment_method` "paypal", when checkout is called, then the response is 200 but has no `payment_method` key (probe).
2. Given the stored order, then it has no `payment_method` field (probe; `backend/routers/checkout.py:94-104` builds the record without it).
3. `OrderSummary` has no `payment_method` field either (`backend/models.py:131-144`), so no endpoint returns the choice.
4. Whether storage is required is Unverified; PRD §6.9 lists the field as accepted (`documents/Product_Requirement_Doc.md:119`) without a storage rule.

**Evidence**: `backend/models.py:100`, `backend/models.py:131-144`, `backend/routers/checkout.py:94-104`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:20`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:45`
**Notes**: Web and mobile both send the field, so the customer's choice is lost after placement. Found on HEAD 9ca3767.

### US-CHK-014-API · Server rounds half-values with Python round()
**As a** QA engineer **I want** the server's rounding to match the client's per-currency rounding **so that** the total the app shows is the total charged.
- Layer: API · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given a JPY subtotal of 1005 and a 10% tax, then the server returns tax 100, because Python `round()` rounds 100.5 to the even 100 (probe).
2. Given every single-pizza cart in all five markets (12 pizzas, 4 sizes, 0 to 3 toppings, quantity 1 to 10, 4 tip options: 38,400 combinations), 1,639 differ from the client formula, with the US split at 192, JP 564, MX 204, CH 243, SA 436 (probe).
3. Example: 10 small Margherita in US with a 15% tip gives server tip 19.48 and total 161.77, where the client formula gives 19.49 and 161.78 (probe).

**Evidence**: `backend/database.py:34-40` (`round_currency_amount` uses `round()`), `backend/database.py:345-348`, `frontend/src/pages/Checkout.jsx:115-119`, `frontend-mobile/src/screens/CheckoutScreen.tsx:44-48`
**Notes**: The client formula was reproduced in Python from the source. It was not executed in a browser or on a device. Found on HEAD 9ca3767 and on US-and-Improvements (no fix there). Related: US-CHK-014-WEB and US-CHK-014-MOB.

### US-CHK-014-WEB · Web total can differ from the server by one minor unit
**As a** customer **I want** the total on the web summary and confirm dialog to equal what the server charges **so that** the amount I agreed to is the amount billed.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given the carts in US-CHK-014-API AC 3, when the web summary renders, then the tip shows 19.49 and the total shows 161.78, while the server records 19.48 and 161.77 (probe plus code reading of `frontend/src/pages/Checkout.jsx:115-119`, `:302-313`).
2. Given JPY half-values, the web formula rounds up (`Math.round`), so it can disagree with the server by one yen (probe).

**Evidence**: `frontend/src/pages/Checkout.jsx:115-119,302-313,1091-1101`, `frontend/src/pages/Checkout.jsx:1135-1157`
**Notes**: The order total on the success screen comes from the server, so the customer can see two different totals. Found on HEAD 9ca3767.

### US-CHK-014-MOB · Mobile total can differ from the server by one minor unit
**As a** customer **I want** the mobile summary and confirm dialog to show the amount the server charges **so that** the app is trustworthy.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given the same rounding helper as web, when the summary renders, then `normalizeMoneyAmount` (`frontend-mobile/src/screens/CheckoutScreen.tsx:44-48`) is used for subtotal, tax, tip and total (`:167-200`), so it can disagree with the server by one minor unit (probe of the same formula).
2. The confirm dialog shows the client total (`CheckoutScreen.tsx:887-890`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:44-48,167-200,887-890`
**Notes**: The formula was reproduced, not run on a device. Found on HEAD 9ca3767 and on US-and-Improvements.

### US-CHK-015-UX · Confirm dialog does not keep Tab focus inside
**As a** keyboard user **I want** Tab to stay inside the confirm dialog while it is open **so that** I cannot act on the page behind it by mistake.
- Layer: UX · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given the web dialog is open, when Tab is pressed on its last button, then focus can move to the page behind it, because the only key handler is for Escape (`frontend/src/pages/Checkout.jsx:240-247`). A search for `"Tab"` in `frontend/src` finds no handler.
2. The page behind the dialog is not made inert: `frontend/src/pages/Checkout.jsx:1135-1140` sets `aria-modal` only.
3. The expected focus-containment behaviour follows the modal-dialog pattern; no project spec was found, so the requirement is Unverified.

**Evidence**: `frontend/src/pages/Checkout.jsx:236-248`, `frontend/src/pages/Checkout.jsx:1135-1140`
**Notes**: Mobile is not affected in the same way because the native `Modal` owns focus. Found on HEAD 9ca3767 and on US-and-Improvements.

### US-CHK-016-MOB · Edit a checkout line like the web
**As a** customer **I want** Edit on a checkout line to open the pizza builder and merge duplicate lines **so that** I can change my order before I pay.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 09a49fc (US-and-Improvements only)

**Acceptance criteria**
1. Given this branch, when Edit is pressed on a checkout line, then nothing happens: the handler is a no-op (`frontend-mobile/src/screens/CheckoutScreen.tsx:696-701`, comment "Edit logic would go here" at `:696`).
2. Given US-and-Improvements, when Edit is saved, then the line is updated through `applyCartItemEdit` (`US-and-Improvements:frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:13-34`).
3. Given another line with the same pizza, size and sorted toppings, then the edited line's quantity is merged into it and the edited line is removed (`US-and-Improvements:frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:11-32`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:696-701` (HEAD), `US-and-Improvements:frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:1-34`
**Notes**: Fix on US-and-Improvements only. The web equivalent is `frontend/src/pages/Checkout.jsx:971-980` and the modal at `:1188-1230`. Line editing is also a CART concern; the CART epic owns the cart screen.
