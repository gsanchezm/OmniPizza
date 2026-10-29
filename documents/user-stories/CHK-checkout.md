# Epic CHK — Checkout & Pricing

Turning a cart into a placed order: the market-specific delivery field, tip, totals and per-currency rounding, payment method selection, input validation, the pre-order confirm step, and the cart hydration that the QA atomic entry point relies on. Covers `POST /api/checkout` (`backend/routers/checkout.py`), the web checkout (`frontend/src/pages/Checkout.jsx`) and the mobile checkout (`frontend-mobile/src/screens/CheckoutScreen.tsx`).

**Conventions.** `path:line` refers to this branch after the 2026-10-28 merge of `US-and-Improvements` (which brings `origin/main` and the 2026-10-28 fixes). Line numbers were recomputed from the merge's hunks and spot-checked against the merged files. Fixes dated 2026-10-28 are cited with their commit sha. "Probe" means an in-process `fastapi.testclient.TestClient` run against this checkout on 2026-10-28 (no server, no port).

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
| US-CHK-014-API | Server rounds half-values up, the same rule as the clients | API | Done |
| US-CHK-014-WEB | Web total equals the server total (shared half-up rounding) | WEB | Done |
| US-CHK-014-MOB | Mobile total equals the server total (shared half-up rounding) | MOB | Done |
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
2. Given a created order, when its id is generated, then the id has the form `ORDER-XXXXXXXX` and it is stored in memory with status "pending" (`backend/database.py:161-167`).
3. Given no `Authorization` header, when checkout is called, then the response is 401 with the error envelope `{"error", "status_code", "timestamp"}` (`backend/main.py:75-84`; probe).
4. Given no `X-Country-Code` header, when checkout is called, then it still succeeds and the market is taken from the body only (probe: 200 without the header).

**Evidence**: `backend/routers/checkout.py:31-125`, `backend/routers/checkout.py:10-25`, `backend/models.py:93-101`, `backend/models.py:132-145`, `backend/database.py:161-167`, `backend/main.py:75-84`
**Notes**: CLAUDE.md lists `X-Country-Code` as required on most endpoints; this route does not call `require_country_header` (AC 4). Chaos: `error_user` and `security_glitch_user` get a 500 on about half of checkouts (`backend/database.py:373-376`, `backend/routers/checkout.py:62-72`; probe 29 of 60 and 23 of 40). Related NF id: NF-CHECKOUT-004. The 3 s delay for `performance_glitch_user` is in `backend/middleware.py:52-60` (not probed).

### US-CHK-001-WEB · Place an order from the web checkout
**As a** customer **I want** to press Place order, confirm, and land on the order-success screen **so that** I can see my order was accepted.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 (first `git log -S` hit for `setLastOrder(res.data)`)

**Acceptance criteria**
1. Given a non-empty cart and a valid form, when the customer confirms in the dialog, then `POST /api/checkout` is sent with the payload from `buildCheckoutPayload` and the response is stored as `lastOrder` (`frontend/src/pages/Checkout.jsx:312-327`, `frontend/src/features/checkout/useCases/placeOrder.js:4-7`, `frontend/src/services/order.service.js:4`).
2. Given the order was placed, when the response is stored, then the cart is cleared and the app navigates to `/order-success` with replace (`frontend/src/pages/Checkout.jsx:327-329`).
3. Given the request fails, when the error is caught, then a `role="alert"` banner shows the `checkoutFailed` text and the cart is kept (`frontend/src/pages/Checkout.jsx:330-332`, `:367-377`).
4. Given the cart is empty, when `/checkout` renders, then the empty state with `start-order-btn` is shown (`frontend/src/pages/Checkout.jsx:337-353`).

**Evidence**: `frontend/src/pages/Checkout.jsx:312-335`, `frontend/src/pages/Checkout.jsx:337-353`, `frontend/src/features/checkout/useCases/placeOrder.js:4-7`, `frontend/src/features/checkout/repositories/orderRepository.js:3-9`, `frontend/src/services/order.service.js:3-4`
**Notes**: Every failure, including a server 400 or 422, shows the same generic text; there is no field-level mapping. The success screen reads the stored order (see US-ORD-006-WEB).

### US-CHK-001-MOB · Place an order from the mobile checkout
**As a** customer **I want** the same place-order flow on my phone **so that** I can complete a purchase in the app.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-18 · Commit: afa1035 (first `git log -S` hit for the `OrderSuccess` reset)

**Acceptance criteria**
1. Given valid input, when Place order is confirmed, then the use case posts the built payload, the result is stored with `setLastOrder`, the cart is cleared and navigation resets to `OrderSuccess` (`frontend-mobile/src/screens/CheckoutScreen.tsx:227-242`).
2. Given the request fails, when the error is caught, then the error box shows `checkoutFailed` and the cart is kept (`frontend-mobile/src/screens/CheckoutScreen.tsx:243-245`, `:839-843`).
3. Given the cart is empty, when the screen renders, then `screen-checkout-empty` with the start-order button is shown (`frontend-mobile/src/screens/CheckoutScreen.tsx:255-277`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:208-248`, `frontend-mobile/src/screens/CheckoutScreen.tsx:255-277`, `frontend-mobile/src/features/checkout/useCases/placeOrder.ts:5-14`, `frontend-mobile/src/features/checkout/repositories/orderRepository.ts:6-7`, `frontend-mobile/src/services/order.service.ts:5-7`
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

**Evidence**: `backend/routers/checkout.py:74-83`, `backend/constants.py:89-146`, `backend/models.py:104-113`, `backend/main.py:75-84`
**Notes**: The 400 envelope uses the `error` key, not FastAPI's `detail` key (`backend/main.py:75-84`), so clients must read `error`. Related NF id: NF-CHECKOUT-003. PRD §6.9 (`documents/Product_Requirement_Doc.md:121-125`) lists MX, US, CH and JP but omits SA (drift).

### US-CHK-002-WEB · Market-specific delivery inputs on web
**As a** customer **I want** to see only the address fields my market needs **so that** I am not asked for irrelevant data.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given market MX, when the form renders, then a required `colonia` input (`frontend/src/pages/Checkout.jsx:414-431`, `required` at 428) and an optional ZIP input (`:433-454`, no `required`) are shown.
2. Given market US, then a required 5-digit ZIP input is shown (`frontend/src/pages/Checkout.jsx:456-478`, `required` at 475); CH shows a required `plz` (`:480-497`), JP a required `prefectura` (`:499-516`) and SA a required `district` (`:518-535`).
3. Given any market, when the payload is built, then only that market's field is sent (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-38`).

**Evidence**: `frontend/src/pages/Checkout.jsx:414-535`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-38`
**Notes**: The street address input is shared by all markets (`frontend/src/pages/Checkout.jsx:395-411`).

### US-CHK-002-MOB · Market-specific delivery inputs on mobile
**As a** customer **I want** the mobile checkout to ask only for my market's delivery field **so that** the form matches what the server requires.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given market MX, when the form renders, then `input-colonia` and the MX ZIP input are shown (`frontend-mobile/src/screens/CheckoutScreen.tsx:301-328`).
2. Given US, then the ZIP input is shown (`frontend-mobile/src/screens/CheckoutScreen.tsx:333-346`); CH shows `plz` (`:351-359`), JP `prefectura` (`:365-372`) and SA `district` (`:379-388`).
3. Given a market, when the form is validated, then the matching field must be non-empty: `colonia` (MX), ZIP (US, 5 digits), `plz` (CH), `prefectura` (JP), `district` (SA) (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:13-19`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:301-388`, `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:12-19`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:52-63`
**Notes**: The MX ZIP rule on mobile now matches web and the API (see US-CHK-007-MOB).

### US-CHK-003-API · Totals breakdown with per-currency rounding
**As a** customer **I want** subtotal, delivery, tax, tip and total computed in my market's currency **so that** the amount charged is predictable.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (`git log -S` shows `calculate_order_total` introduced there)

**Acceptance criteria**
1. Given one Margherita (`p01`, small) in US with no tip, when checkout runs, then subtotal is 12.99, delivery_fee 2.0, tax 1.04 (8%), tip 0.0 and total 16.03 (probe).
2. Given the same order with `tip: 10`, then tip is 1.3, tip_percentage 10.0 and total 17.33 (probe).
3. Given the same order in JP, then subtotal is 2051, delivery_fee 316, tax 205 (10%) and total 2572, with no decimals (probe; JPY `decimal_places` is 0 in `backend/constants.py:134`).
4. Given any market, then subtotal, tax, tip and total are each rounded to the currency's decimal places (`backend/database.py:357-360`). Since `88cadbb` the rounding is half up on the noise-free decimal value (`round_currency_amount`), the same rule the clients apply; see US-CHK-014-API.

**Evidence**: `backend/database.py:24-49`, `backend/database.py:320-371`, `backend/constants.py:89-146`, `backend/constants.py:342-348`, `backend/models.py:132-145`
**Notes**: The delivery fee is `delivery_fee_usd` converted with `CURRENCY_RATES` (`backend/database.py:331-335`). Unknown pizza ids and empty `items` produce a zero subtotal without an error (US-CHK-011-API).

### US-CHK-003-WEB · Totals summary on web
**As a** customer **I want** the web summary to show subtotal, tax, delivery, tip and total before I place the order **so that** I see what I will pay.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: a903683 (cart sidebar uses the market delivery fee)

**Acceptance criteria**
1. Given the cart and the market, when the summary renders, then subtotal, tax (with its percentage), delivery fee, tip and total are computed from cart unit prices and the API `tax_rate` and `delivery_fee`, with constant fallbacks imported from `frontend/src/constants/market.js` (`frontend/src/pages/Checkout.jsx:13`, `:256-310`; rows at `:996`, `:1003`, `:1012`; total at `:1080-1090`).
2. Given JPY, when amounts are rounded, then whole units are used; other currencies round to cents (`frontend/src/utils/rounding.js:12-14`).
3. The cart sidebar uses the API delivery fee, falling back to the market constant, instead of a hardcoded 2.50 (`frontend/src/components/CartSidebar.jsx:18-22`, `frontend/src/constants/market.js:3`; fix a903683).

**Evidence**: `frontend/src/pages/Checkout.jsx:13,109,256-310,996,1003,1012,1080-1090`, `frontend/src/components/CartSidebar.jsx:18-22`, `frontend/src/constants/market.js:3`
**Notes**: Client totals use the same half-up rounding as the server (`frontend/src/utils/rounding.js`, since `88cadbb`); see US-CHK-014-WEB.

### US-CHK-003-MOB · Totals summary on mobile
**As a** customer **I want** the mobile summary to show the same breakdown **so that** the app and the web agree on the amount.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the cart, when the summary renders, then subtotal, tax, delivery fee, tip and total are computed from `unit_price` and the API country info, with fallbacks by country (`frontend-mobile/src/screens/CheckoutScreen.tsx:165-196`, fallbacks `:180-186`).
2. Given the confirm dialog opens, then it shows the same client total (`frontend-mobile/src/screens/CheckoutScreen.tsx:890-893`).
3. Given the order was placed, then the success screen shows the server's subtotal, delivery fee, tax, tip and total (`frontend-mobile/src/screens/OrderSuccessScreen.tsx:161-185`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:165-196`, `frontend-mobile/src/screens/CheckoutScreen.tsx:890-893`, `frontend-mobile/src/screens/OrderSuccessScreen.tsx:161-185`
**Notes**: The rounding helper is shared with web and the server (`frontend-mobile/src/utils/rounding.ts`, since `88cadbb`); see US-CHK-014-MOB.

### US-CHK-004-API · Tip percentage with a per-market field name
**As a** customer **I want** to tip a percentage under my market's own field name **so that** the tip is recorded as the local convention expects.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (first `git log -S` hit for `propina`)

**Acceptance criteria**
1. Given a tip sent in the market field (`propina` MX, `tip` US, `trinkgeld` CH, `chip` JP, `baksheesh` SA), when checkout is called, then `tip_percentage` and `tip` reflect it (`backend/models.py:104-109`, `backend/database.py:359,366`; probe: US `tip: 10` gives tip 1.3).
2. Given a tip below 0 or above 100, when checkout is called, then the response is 422 (`backend/models.py:105-109`; probe for 101 and -1).
3. Given no tip, then `tip` is 0.0 and `tip_percentage` is 0.0 (probe).
4. The tip options 0, 5, 10, 15 are configured per market (`backend/constants.py:96,107,119,130,142`); the API itself accepts any value from 0 to 100.

**Evidence**: `backend/models.py:104-130`, `backend/constants.py:89-146`, `backend/database.py:359,366`, `backend/routers/checkout.py:86-91`, `backend/routers/checkout.py:111-120`
**Notes**: Market precedence is wrong when several tip fields are sent; see US-CHK-012-API. PRD §6.9 (`documents/Product_Requirement_Doc.md:122-125`) lists MX, US, CH and JP tip fields but not SA.

### US-CHK-004-WEB · Tip picker on web
**As a** customer **I want** to pick a tip percentage and see its amount **so that** I can tip the driver.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the summary renders, then four tip buttons show the API `tip_percentages` (fallback 0, 5, 10, 15) and `0%` is selected by default (`frontend/src/pages/Checkout.jsx:277-290`, `:286-289`, `:1057-1077`).
2. Given a tip is chosen, then the tip amount and total update (`frontend/src/pages/Checkout.jsx:295-302`), and the info button opens the tip tooltip on hover, focus or click (`frontend/src/pages/Checkout.jsx:1027-1051`).
3. Given the order is placed, then the tip is sent under the market's field name (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:2-8`, `:23-25`).

**Evidence**: `frontend/src/pages/Checkout.jsx:277-302`, `frontend/src/pages/Checkout.jsx:1027-1077`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:2-8,23-25`
**Notes**: The default is `0` because it is in the API options list (`Checkout.jsx:286-289`).

### US-CHK-004-MOB · Tip picker on mobile
**As a** customer **I want** the same tip choices on my phone **so that** tipping works the same across platforms.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given the summary renders, then tip pills show `countryInfo.tip_percentages` (fallback 0, 5, 10, 15) and 0% is selected by default (`frontend-mobile/src/screens/CheckoutScreen.tsx:187-194`, `:783-804`).
2. Given a tip is chosen, then the tip amount and total update (`frontend-mobile/src/screens/CheckoutScreen.tsx:195-196`) and the tooltip toggles on press (`:762-771`).
3. Given the order is placed, then the tip is sent under the market field (`frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:27-33`, `:48-50`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:187-196`, `frontend-mobile/src/screens/CheckoutScreen.tsx:755-804`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:27-50`

### US-CHK-005-API · Payment method accepted by the API
**As a** customer **I want** to choose card, cash or PayPal at checkout **so that** the order can be placed with the method I prefer.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-05-19 · Commit: f1ee64c (first `git log -S` hit for `payment_method`)

**Acceptance criteria**
1. Given `payment_method` of "card", "cash" or "paypal", when checkout is called, then the response is 200 (probe for "paypal").
2. Given any other value, such as "bitcoin", when checkout is called, then the response is 422 (probe).
3. Given no `payment_method`, then it defaults to "card" (`backend/models.py:101`; code reading only).

**Evidence**: `backend/models.py:101`, `backend/routers/checkout.py:41-44`
**Notes**: The chosen method is not stored or returned; see US-CHK-013-API. PRD §6.9 (`documents/Product_Requirement_Doc.md:119`) and §7.2 (`:162`) list only "card" and "cash" (drift: PayPal is accepted by the code).

### US-CHK-005-WEB · Payment method selection on web
**As a** customer **I want** to pick card, cash or PayPal and fill the matching fields **so that** I can pay the way I want.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 61a4751 (radios and PayPal)

**Acceptance criteria**
1. Given the payment section, then three radio buttons (card, cash, paypal) are shown with `aria-checked`, and card is selected by default (`frontend/src/pages/Checkout.jsx:206-209`, `:610-707`).
2. Given card is selected, then cardholder, number, expiry and CVV inputs are shown and required (`frontend/src/pages/Checkout.jsx:709-830`); none of these values are sent (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:9-21`).
3. Given PayPal is selected, then a demo email and password form appears, and "connect" marks the demo connected only when both fields are non-empty (`frontend/src/pages/Checkout.jsx:832-907`, `:890-892`; fix 87966da). Placing the order does not require the connect step (`frontend/src/pages/Checkout.jsx:312-335`).
4. Given the order is placed, then `payment_method` is sent and the PayPal credentials never are (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:20`).

**Evidence**: `frontend/src/pages/Checkout.jsx:206-209,610-907`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:9-21`
**Notes**: The PayPal demo is cosmetic on both platforms. Whether connecting should be required before placing a PayPal order is Unverified; no spec was found.

### US-CHK-005-MOB · Payment method selection on mobile
**As a** customer **I want** to pick a payment method on my phone and fill only the fields it needs **so that** cash and PayPal orders are not blocked by card fields.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 61a4751 (radios and PayPal)

**Acceptance criteria**
1. Given the payment section, then three selectors `btn-payment-card`, `btn-payment-cash` and `btn-payment-paypal` are shown and card is the default (`frontend-mobile/src/screens/CheckoutScreen.tsx:151`, `:434-513`).
2. Given the payment method is card, when the form is validated, then cardholder, card number (13+ digits), expiry (4+ digits) and CVV (3+ digits) are required; cash and PayPal skip these checks (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:25-36`).
3. Given the order is placed, then the payload carries `payment_method` only, with no card or PayPal fields (`frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:34-46`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:151,434-513,517-573`, `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:25-36`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:34-46`
**Notes**: The PayPal connect button needs non-empty email and password (`CheckoutScreen.tsx:559`), and placing the order does not check it. Same demo status as web; see US-CHK-005-WEB.

### US-CHK-006-API · Field length, quantity and tip bounds
**As a** QA engineer **I want** checkout to reject out-of-range fields with a 422 **so that** my validation tests have a stable server contract.
- Layer: API · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (first `git log -S` hit for `min_length=2`)

**Acceptance criteria**
1. Given a name of one character, when checkout is called, then the response is 422 with `string_too_short` on `name` (minimum 2) (`backend/models.py:98`; probe).
2. Given an address of four characters, then the response is 422 (minimum 5) (`backend/models.py:99`; probe).
3. Given a phone of 7 digits, then the response is 422 (minimum 8), and a 21-digit phone is 422 (maximum 20) (`backend/models.py:100`; probe).
4. Given `quantity` 0 or 11, or a tip of 101 or -1, then the response is 422 (`backend/models.py:62`, `:105-109`; probe).
5. Given any of the above, the body is FastAPI's default `{"detail": [{type, loc, msg, input, ctx}]}`, because `main.py` registers no `RequestValidationError` handler (`backend/main.py:74-95`; probe), and PRD §9 now documents that shape (`documents/Product_Requirement_Doc.md:195`, fix b2179d9).

**Evidence**: `backend/models.py:60-65`, `backend/models.py:93-109`, `backend/main.py:74-95`, `documents/Product_Requirement_Doc.md:195`
**Notes**: Validation is length-only. A name of two spaces and a phone of letters both return 200 (probe). That matches PRD §7.2 (`documents/Product_Requirement_Doc.md:158`, "server-side length validation") and NF-CHECKOUT-002, but there is no whitespace or character rule. The 422 envelope (`detail`) differs from the `error` envelope used by 400, 401, 403, 404 and 409.

### US-CHK-006-WEB · Field validation on web (phone hint)
**As a** customer **I want** the web form to block invalid name, address and phone values and tell me the phone rule **so that** I can fix the input before submitting.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 7fc6393 (phone hint says 8-20 digits)

**Acceptance criteria**
1. Given a name shorter than 2 characters or an address shorter than 5 characters, when the form is submitted, then the browser blocks it through `minLength` (`frontend/src/pages/Checkout.jsx:408`, `:564`).
2. Given a phone value, when the customer types, then non-digits are removed and the field must be 8 to 20 characters (`frontend/src/pages/Checkout.jsx:572-595`, digit filter at `:582`).
3. Given the phone field is invalid, then the hint says "8-20 digits" (`frontend/src/i18n/locales/en.json:111`, fix 7fc6393), which matches the enforced rule.

**Evidence**: `frontend/src/pages/Checkout.jsx:408,564,572-595`, `frontend/src/i18n/locales/en.json:111`, `frontend/src/i18n/locales/es.json:111`
**Notes**: The same 7fc6393 change updated the hint in the other locale files.

### US-CHK-006-MOB · Name and address length checks on mobile
**As a** customer **I want** the mobile checkout to stop an invalid name or address before it is sent **so that** I see a specific message instead of a generic failure.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given a name of one character, when Place order is confirmed, then the app does not block locally (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:20` checks only non-empty). The API returns 422 and the screen shows the generic `checkoutFailed` text (`frontend-mobile/src/screens/CheckoutScreen.tsx:243-245`).
2. Given an address of four characters, then the same happens: the check at `validateCheckoutForm.ts:12` only requires non-empty input.
3. Done parts: a phone with fewer than 8 digits is blocked locally with `validationPhoneMinDigits` (`validateCheckoutForm.ts:21-23`), and the phone input is capped at 20 characters (`frontend-mobile/src/screens/CheckoutScreen.tsx:423`).

**Evidence**: `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:12,20-23`, `frontend-mobile/src/screens/CheckoutScreen.tsx:243-245,410-423`
**Notes**: Web blocks the same inputs with `minLength` (`frontend/src/pages/Checkout.jsx:408,564`). Still Found after the 2026-10-28 merge: fix 00b59c2 changed only the MX ZIP line. Observed 2026-10-28: the API rejects 1-character names with 422.

### US-CHK-007-API · ZIP code format
**As a** customer **I want** US and MX postal codes checked for format **so that** a malformed ZIP is rejected before the order is created.
- Layer: API · Epic: CHK · Persona: Customer · Market: US MX
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (format); 2026-10-28 · Commit: b2179d9 (English message)

**Acceptance criteria**
1. Given US with ZIP "10001", when checkout is called, then the order is created (probe).
2. Given US with ZIP "1234", when checkout is called, then the response is 422 with `loc` `["body", "zip_code"]` and message "ZIP code must be 5 digits" (`backend/models.py:115-120`; probe).
3. Given MX with no ZIP, then the order is created; MX with "06600" is accepted; MX with "066" gives 422 with the same English message (probe; `backend/models.py:117`).
4. The rule is `isdigit()` and length 5, applied only to US and MX and only when a value is present (`backend/models.py:117-118`). An empty US ZIP gives the 400 required-field error (`backend/routers/checkout.py:77-83`; code reading).
5. The message reads "ZIP code must be 5 digits" (`backend/models.py:119`, fix b2179d9; the previous message was Spanish, "ZIP code debe tener 5 dígitos").

**Evidence**: `backend/models.py:115-120`, `backend/routers/checkout.py:77-83`
**Notes**: The validator is applied to US and MX only (`backend/models.py:117`). The 422 shape is described in US-CHK-006-API.

### US-CHK-007-WEB · ZIP input on web
**As a** customer **I want** the ZIP field to match my market's rule **so that** an MX order does not need a ZIP and a US order must have one.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US
- Status: Done

**Acceptance criteria**
1. Given MX, then the ZIP input is optional, digits only, with `minLength` and `maxLength` 5 (`frontend/src/pages/Checkout.jsx:433-454`).
2. Given US, then the ZIP input is required, digits only, with `minLength` and `maxLength` 5 (`frontend/src/pages/Checkout.jsx:456-478`).
3. Given the order is placed, then `zip_code` is always sent for US and sent for MX only when non-empty (`frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-31`).

**Evidence**: `frontend/src/pages/Checkout.jsx:433-478`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:27-31`

### US-CHK-007-MOB · ZIP input on mobile (MX optional, parity)
**As a** customer in Mexico **I want** to place an order on my phone without a ZIP code **so that** the mobile app accepts what the web and API accept.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US
- Status: Done
- Done on: 2026-10-28 · Commit: 00b59c2 (MX zip optional at checkout)

**Acceptance criteria**
1. Given MX with no ZIP, when Place order is confirmed, then validation passes; a given ZIP must be 5 digits (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:14-15`).
2. Given US, then the ZIP is required and must be 5 digits (`frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:16`).
3. The ZIP input accepts digits only, with a maximum of 5 (`frontend-mobile/src/screens/CheckoutScreen.tsx:315-328` for MX, `:333-346` for US).
4. The payload sends `zip_code` for US always and for MX only when non-empty (`frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:52-56`).

**Evidence**: `frontend-mobile/src/features/checkout/useCases/validateCheckoutForm.ts:14-16`, `frontend-mobile/src/screens/CheckoutScreen.tsx:315-346`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:52-56`
**Notes**: Matches the API (MX ZIP optional, `backend/models.py:117`) and web (`frontend/src/pages/Checkout.jsx:433-454`).

### US-CHK-008-WEB · Confirm dialog before placing an order (web)
**As a** customer **I want** a confirmation step that shows the total before the order is sent **so that** I do not place an order by accident.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 2b3a099 (automation-demo widgets)

**Acceptance criteria**
1. Given the form, when Place order is pressed, then a `role="dialog"` shows the total in `confirm-order-total` and no request is sent yet (`frontend/src/pages/Checkout.jsx:1092-1097`, `:1124-1146`).
2. Given the dialog, when Cancel is pressed or the backdrop is clicked, then the dialog closes and focus returns to the Place order button (`frontend/src/pages/Checkout.jsx:1131-1136`, `:1149-1160`).
3. Given the dialog, when the confirm button is pressed, then the form is submitted with `requestSubmit()`, so native required-field checks still run (`frontend/src/pages/Checkout.jsx:1161-1171`, `requestSubmit` at `:1166`).

**Evidence**: `frontend/src/pages/Checkout.jsx:1092-1097`, `frontend/src/pages/Checkout.jsx:1124-1175`
**Notes**: Required-field validation runs after the confirm step, so a dialog can close and then show browser validation errors. Keyboard behaviour is in US-CHK-008-UX. Focus containment is missing (US-CHK-015-UX).

### US-CHK-008-MOB · Confirm dialog before placing an order (mobile)
**As a** customer **I want** the same confirmation step on my phone **so that** the app matches the web.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-09 · Commit: 2b3a099 (automation-demo widgets)

**Acceptance criteria**
1. Given the form, when Place order is pressed, then a modal `modal-confirm-order` shows the total and no request is sent yet (`frontend-mobile/src/screens/CheckoutScreen.tsx:852-853`, `:863-897`).
2. Given the modal, when Cancel, the scrim or the Android back button is used, then it closes (`frontend-mobile/src/screens/CheckoutScreen.tsx:868`, `:872-874`, `:900-904`).
3. Given the modal, when Confirm is pressed, then the dialog closes and the order is placed (`frontend-mobile/src/screens/CheckoutScreen.tsx:250-253`, `:909-914`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:250-253,852-914`
**Notes**: Validation runs inside `placeOrder` after the confirm step (`CheckoutScreen.tsx:208-220`), the same ordering as web.

### US-CHK-008-UX · Confirm dialog keyboard behaviour (Escape, focus in and out)
**As a** keyboard user **I want** the confirm dialog to take focus, close on Escape and return focus to the trigger **so that** I can complete or cancel the order without a mouse.
- Layer: UX · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-07-13 · Commit: cf8d2c9 (WCAG a11y fixes)

**Acceptance criteria**
1. Given the web dialog opens, then focus moves to the Cancel button (`frontend/src/pages/Checkout.jsx:227`, `:1150`).
2. Given the web dialog is open, when Escape is pressed, then it closes and focus returns to the Place order button (`frontend/src/pages/Checkout.jsx:229-233`).
3. Given the mobile modal, then it is announced as a modal view (`frontend-mobile/src/screens/CheckoutScreen.tsx:876`, `accessibilityViewIsModal`), and the Android back button closes it (`:868`).

**Evidence**: `frontend/src/pages/Checkout.jsx:225-237`, `frontend/src/pages/Checkout.jsx:1128-1129`, `frontend-mobile/src/screens/CheckoutScreen.tsx:868,876`
**Notes**: The dialog has `aria-labelledby` and `aria-modal` (`Checkout.jsx:1128-1129`). Tab focus containment is not implemented; see US-CHK-015-UX.

### US-CHK-009-WEB · Save entered details to the profile after checkout
**As a** customer **I want** the name, address and phone I entered at checkout to be saved to my profile **so that** my next checkout starts pre-filled.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given a successful placement, when the order is stored, then the entered name, address and phone are not written to the profile store (`frontend/src/pages/Checkout.jsx:312-335` has no profile update).
2. Given the mobile app does this on placement (`frontend-mobile/src/screens/CheckoutScreen.tsx:233-237`), the web behaviour differs.

**Evidence**: `frontend/src/pages/Checkout.jsx:312-335`, `frontend-mobile/src/screens/CheckoutScreen.tsx:233-237`
**Notes**: Pre-fill from the profile works on web (`frontend/src/pages/Checkout.jsx:188-192`) and is in the PRD (`documents/Product_Requirement_Doc.md:114`). The gap is the write-back, which mobile has but web lacks, so the two platforms diverge.

### US-CHK-009-MOB · Save entered details to the profile after checkout
**As a** customer **I want** my checkout details pre-filled from my profile and saved back after a successful order **so that** I do not retype them.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done

**Acceptance criteria**
1. Given a stored profile, when checkout mounts, then name, address and phone are pre-filled (`frontend-mobile/src/screens/CheckoutScreen.tsx:134-137`).
2. Given a successful placement, when the result is stored, then `setProfile({ fullName, address, phone })` updates the in-app profile (`frontend-mobile/src/screens/CheckoutScreen.tsx:233-237`, `frontend-mobile/src/store/useAppStore.ts:132`).
3. The checkout path sends no profile request: it calls only `setProfile` on the store, while profile saves go through `features/profile` (`CheckoutScreen.tsx` has no profile repository import).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:67,134-137,233-237`, `frontend-mobile/src/store/useAppStore.ts:132`
**Notes**: The write-back is local only and lasts for the app session, because the mobile store is not persisted. It is not sent to `/api/users/me/profile`. Web does not write back (US-CHK-009-WEB).

### US-CHK-010-WEB · Hydrate the web checkout from the cart API (QA entry point)
**As a** QA engineer **I want** `/checkout` to load the server-side cart when the local cart is empty **so that** a test can seed the cart through the API and go straight to checkout.
- Layer: WEB · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-03-11 · Commit: 75a849f (cart hydration); toppings kept on 2026-10-28 · Commit: bbbd4ed

**Acceptance criteria**
1. Given a token and an empty local cart, when `/checkout` mounts, then `GET /api/cart` is called and its items become the local cart (`frontend/src/pages/Checkout.jsx:121-176`).
2. Given the local cart already has items, then no cart request is made (`frontend/src/pages/Checkout.jsx:130`).
3. Given a cart item with toppings, then hydration keeps the toppings and prices them (`frontend/src/pages/Checkout.jsx:138,152,156,160`, fix bbbd4ed).
4. Given the request fails, then the local cart is left unchanged (`frontend/src/pages/Checkout.jsx:170-172`).

**Evidence**: `frontend/src/pages/Checkout.jsx:121-176`, `frontend/src/pages/Checkout.jsx:138-160`, `backend/models.py:73`, `backend/database.py:267`
**Notes**: `EnrichedCartItem` carries `toppings` (`backend/models.py:73`, fix bbbd4ed), and `backend/database.py:267` emits them. Probe after the merge: `GET /api/cart` returned `toppings: ["pepperoni", "olives"]` for a cart posted with those toppings. The PRD line that lists the field (`documents/Product_Requirement_Doc.md:104`) was updated in 91d036c. The `GET /api/cart` shape belongs to the CART epic. CLAUDE.md documents the lazy-route fallback; not re-verified here.

### US-CHK-010-MOB · Hydrate the mobile checkout from the cart API (QA entry point)
**As a** QA engineer **I want** the mobile checkout to load the server-side cart on mount, including after a deep link **so that** an Appium run can seed state and reach checkout.
- Layer: MOB · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: bbbd4ed (toppings kept on hydration)

**Acceptance criteria**
1. Given a token and an empty local cart, when the checkout mounts, then `GET /api/cart` is called and mapped to cart items (`frontend-mobile/src/screens/CheckoutScreen.tsx:72-132`). The effect re-runs when the token changes (`:132`).
2. Given items already in the local cart, then no cart request is made (`frontend-mobile/src/screens/CheckoutScreen.tsx:81`).
3. Given server toppings, then they are kept and priced (`frontend-mobile/src/screens/CheckoutScreen.tsx:89,107-108,112,116`, fix bbbd4ed).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:72-132`, `frontend-mobile/src/screens/CheckoutScreen.tsx:89-116`, `frontend-mobile/src/services/cart.service.ts:7`
**Notes**: The `hydrateCart=true` deep link clears the local cart so this runs (`frontend-mobile/src/hooks/useDeepLinkParams.ts:109`, `frontend-mobile/src/navigation/linking.ts:34`). The commit message of e785a35 (2026-05-19) mentions mobile cart hydration; this was not confirmed with `git log -S`.

### US-CHK-011-API · Unpriced or empty checkouts are accepted
**As a** customer **I want** checkout to refuse items it cannot price **so that** I am never billed for a silent zero-value order.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given an item whose `pizza_id` is not in the catalog (e.g. `p99`), when checkout is called, then the response is 200 with `subtotal` 0.0 and a total equal to delivery plus tax (US: total 2.0; probe).
2. Given `items: []`, when checkout is called, then the response is 200 with subtotal 0.0 (probe).
3. No rule in PRD §6.9 or §7.2 covers this, so the intended behaviour is Unverified.

**Evidence**: `backend/database.py:337-355` (unknown ids skipped at `:339-340`), `backend/models.py:93-96` (`items` has no minimum length or catalog check), `backend/routers/checkout.py:85-125`
**Notes**: Found, and not changed by the 2026-10-28 merge. The order is created and stored with the zero subtotal.

### US-CHK-012-API · Tip taken from another market's tip field
**As a** QA engineer **I want** a tip sent in a different market's field to be ignored **so that** a market's tip is only the one its own field carries.
- Layer: API · Epic: CHK · Persona: QA engineer · Market: JP
- Status: Found

**Acceptance criteria**
1. Given a JP order with `chip: 10` and `tip: 5`, when checkout is called, then `tip_percentage` is 5.0 and tip is 103.0 (probe), even though JP's field is `chip`.
2. `get_tip_percentage` returns the first truthy value of `propina`, `tip`, `trinkgeld`, `chip`, `baksheesh` in that order, regardless of `country_code` (`backend/models.py:122-130`).
3. The stored `customer_info` keeps `chip` as 10 while the charged tip is 5% (`backend/routers/checkout.py:111-120`; code reading only).

**Evidence**: `backend/models.py:104-109`, `backend/models.py:122-130`, `backend/routers/checkout.py:86-91`, `backend/routers/checkout.py:111-120`, `backend/constants.py:124-135`
**Notes**: API-only. Web and mobile send one tip field, so the UI cannot reach this. Found, and not changed by the merge.

### US-CHK-013-API · payment_method is accepted but not recorded
**As a** customer **I want** my chosen payment method to be kept on the order **so that** the order records how I intend to pay.
- Layer: API · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given `payment_method` "paypal", when checkout is called, then the response is 200 but has no `payment_method` key (probe).
2. Given the stored order, then it has no `payment_method` field (probe; `backend/routers/checkout.py:94-104` builds the record without it).
3. `OrderSummary` has no `payment_method` field either (`backend/models.py:132-145`), so no endpoint returns the choice.
4. Whether storage is required is Unverified; PRD §6.9 lists the field as accepted (`documents/Product_Requirement_Doc.md:119`) without a storage rule.

**Evidence**: `backend/models.py:101`, `backend/models.py:132-145`, `backend/routers/checkout.py:94-104`, `frontend/src/features/checkout/useCases/buildCheckoutPayload.js:20`, `frontend-mobile/src/features/checkout/useCases/buildCheckoutPayload.ts:45`
**Notes**: Web and mobile both send the field, so the customer's choice is lost after placement. Found, and not changed by the merge.

### US-CHK-014-API · Server rounds half-values up, the same rule as the clients
**As a** QA engineer **I want** the server's rounding to match the clients' per-currency rounding **so that** the total the app shows is the total charged.
- Layer: API · Epic: CHK · Persona: QA engineer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 88cadbb (half-up rounding shared by API, web and mobile)

**Acceptance criteria**
1. Given 10 small Margherita (`p01`) in US with `tip: 15`, when checkout runs, then subtotal is 129.9, tax 10.39, tip 19.49 and total 161.78 (`tests/api.test.ts:543-566`, watched RED at 19.48 before the fix, then green; suite 56/56).
2. Given a JPY amount of 100.5 (subtotal 1005 at 10% tax), then it rounds to 101, not to the even 100 (probe of `round_currency_amount`).
3. Given any order amount, then `round_currency_amount` takes the exact binary value, discards noise beyond 9 decimals and rounds half up at the currency's decimals (`backend/database.py:35-51`); subtotal, tax, tip and total all go through it (`backend/database.py:357-360`).
4. Given the same inputs, then the Python rule and the clients' rule agree: 7,840,000 grid values (5 markets × subtotal grid × the market tax and 7 tip rates) produced 0 differences (probe, 2026-10-28).

**Evidence**: `backend/database.py:35-51`, `backend/database.py:357-360`, `tests/api.test.ts:543-566`, commit `88cadbb`
**Notes**: Before `88cadbb` the server used Python `round()` (half-to-even on the binary value) and this cart gave tip 19.48 / total 161.77; the server's figure changes on about 2.7% of the grid values, all ties. Catalog price conversion (`convert_usd_amount`, `_convert_price`, the per-item base price) deliberately keeps `round()`, so no catalog price moved. The deployed Render API keeps the old rule until `main` is updated. Related: US-CHK-014-WEB and US-CHK-014-MOB.

### US-CHK-014-WEB · Web total equals the server total (shared half-up rounding)
**As a** customer **I want** the total on the web summary and confirm dialog to equal what the server charges **so that** the amount I agreed to is the amount billed.
- Layer: WEB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 88cadbb

**Acceptance criteria**
1. Given the web checkout, when subtotal, tax, tip and total are computed, then each goes through `roundCurrencyAmount` from `frontend/src/utils/rounding.js` (`frontend/src/pages/Checkout.jsx:256-302`), which is the server's rule (US-CHK-014-API).
2. Given a true half-cent such as 8.54 × 25% = 2.135, then the helper returns 2.14; the previous `Number.EPSILON` formula returned 2.13 (Node harness check, watched RED then green).
3. Given 129.9 × 15%, then the helper returns 19.49, the same as the server (Node harness check).

**Evidence**: `frontend/src/utils/rounding.js:1-28`, `frontend/src/pages/Checkout.jsx:15,256-302`, commit `88cadbb`
**Notes**: Verified with `vite build` and a Node harness over the helper; the Checkout page was not driven in a browser. The summary and the confirm dialog still show the client total (`frontend/src/pages/Checkout.jsx:1080-1090,1124-1146`); it now equals the server's `total`. The client's own figure moves on about 0.43% of the grid values, all ties the old formula rounded down.

### US-CHK-014-MOB · Mobile total equals the server total (shared half-up rounding)
**As a** customer **I want** the mobile summary and confirm dialog to show the amount the server charges **so that** the app is trustworthy.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 88cadbb

**Acceptance criteria**
1. Given the mobile checkout, when subtotal, tax, tip and total are computed, then each goes through `roundCurrencyAmount` from `frontend-mobile/src/utils/rounding.ts` (`frontend-mobile/src/screens/CheckoutScreen.tsx:165-198`), the same rule as web and the server.
2. Given the pizza builder and the order-success screen, then their money formatting uses the same helper (`frontend-mobile/src/screens/PizzaBuilderScreen.tsx:45-51`, `frontend-mobile/src/screens/OrderSuccessScreen.tsx:29-35`), so no screen keeps a private formula.
3. Given 8.54 × 25%, then the helper returns 2.14 (Node harness check, watched RED at 2.13 then green).

**Evidence**: `frontend-mobile/src/utils/rounding.ts:1-28`, `frontend-mobile/src/screens/CheckoutScreen.tsx:29,165-198`, `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:20,45-51`, `frontend-mobile/src/screens/OrderSuccessScreen.tsx:17,29-35`, commit `88cadbb`
**Notes**: Verified with `tsc --noEmit` and the Node harness; not run on a device. The change reaches the published APK only when a release is cut. The confirm dialog shows the client total (`frontend-mobile/src/screens/CheckoutScreen.tsx:890-893`), which now equals the server's.

### US-CHK-015-UX · Confirm dialog does not keep Tab focus inside
**As a** keyboard user **I want** Tab to stay inside the confirm dialog while it is open **so that** I cannot act on the page behind it by mistake.
- Layer: UX · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Found

**Acceptance criteria**
1. Given the web dialog is open, when Tab is pressed on its last button, then focus can move to the page behind it, because the only key handler in the dialog is for Escape (`frontend/src/pages/Checkout.jsx:229-233`). A search for `"Tab"` in `frontend/src` finds no handler; the other key handlers are Escape-only (`frontend/src/components/ConfirmDialog.jsx:31`, `frontend/src/components/PizzaCustomizerModal.jsx:94`).
2. The page behind the dialog is not made inert: `frontend/src/pages/Checkout.jsx:1124-1129` sets `aria-modal` only.
3. The expected focus-containment behaviour follows the modal-dialog pattern; no project spec was found, so the requirement is Unverified.

**Evidence**: `frontend/src/pages/Checkout.jsx:225-237`, `frontend/src/pages/Checkout.jsx:1124-1129`
**Notes**: Mobile is not affected in the same way because the native `Modal` owns focus. Found, and not changed by the merge.

### US-CHK-016-MOB · Edit a checkout line like the web
**As a** customer **I want** Edit on a checkout line to open the pizza builder and merge duplicate lines **so that** I can change my order before I pay.
- Layer: MOB · Epic: CHK · Persona: Customer · Market: MX US CH JP SA
- Status: Done
- Done on: 2026-10-28 · Commit: 09a49fc (checkout Edit button opens the builder and merges like web)

**Acceptance criteria**
1. Given a checkout line, when Edit is pressed, then the app opens `PizzaBuilder` in edit mode with the line's pizza, id and config (`frontend-mobile/src/screens/CheckoutScreen.tsx:693-700`, navigate at `:694`).
2. Given an edit is saved, then the line is updated through `applyCartItemEdit` (`frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:13-34`, `frontend-mobile/src/store/useAppStore.ts:177-178`).
3. Given another line with the same pizza, size and sorted toppings, then the edited line's quantity is merged into it and the edited line is removed (`frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:11-32`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:693-700`, `frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:1-34`, `frontend-mobile/src/store/useAppStore.ts:177-178`
**Notes**: The web equivalent is `frontend/src/pages/Checkout.jsx:960-969` (Edit button) and the editor modal at `:1177-1219`. Line editing is also a CART concern; the CART epic owns the cart screen.
