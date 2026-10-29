# Epic CART — Customization & Cart

Building a customized pizza (size and toppings, with a 10-topping cap and an estimated total), adding it to the cart, merging identical lines, changing and removing lines, editing a line from checkout, hydrating checkout from the cart API, clearing the cart on market change and logout, and the cart delivery fee shown on web. Also the cart API (`/api/cart`, `/api/store/market`) that tests use to seed state.

Evidence basis: line numbers are at HEAD `b09cfbb` (this worktree after fast-forwarding to `US-and-Improvements`, which carries the 2026-10-28 fixes). Those fixes are not on `origin/main` (`9ca3767`) or local `main` (`87966da`). Live checks ran the backend in-process with FastAPI `TestClient` against HEAD; no server or port was used. Clients call only `GET /api/cart` (grep at HEAD); the write endpoints are used by tests.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-CART-001-WEB | Build a pizza in the customizer modal | WEB | Done |
| US-CART-001-MOB | Build a pizza on the builder screen | MOB | Done |
| US-CART-002-WEB | Same configuration increments the cart line | WEB | Done |
| US-CART-002-MOB | Same configuration increments the cart line | MOB | Done |
| US-CART-003-API | Seed the cart for automation | API | Done |
| US-CART-004-API | Read the cart enriched with market price and toppings | API | Done |
| US-CART-005-API | Upsert and delete one cart line | API | Done |
| US-CART-006-API | Cart belongs to the login session | API | Done |
| US-CART-007-API | Market switch through the API keeps the cart | API | Done |
| US-CART-008-API | Cart API accepts configurations the builder cannot produce | API | Found |
| US-CART-009-WEB | Cart sidebar lists lines and totals | WEB | Done |
| US-CART-010-WEB | Sidebar delivery fee uses the market fee | WEB | Done |
| US-CART-011-WEB | Change quantity from the sidebar | WEB | Done |
| US-CART-011-MOB | Change quantity on mobile | MOB | Found |
| US-CART-012-WEB | Remove a line on web | WEB | Done |
| US-CART-012-MOB | Remove a line on mobile | MOB | Done |
| US-CART-013-WEB | Edit a line from checkout | WEB | Done |
| US-CART-013-MOB | Edit a line from checkout | MOB | Done |
| US-CART-014-WEB | Checkout hydrates the cart from the backend | WEB | Done |
| US-CART-014-MOB | Checkout hydrates the cart from the backend | MOB | Done |
| US-CART-015-WEB | Checkout line controls keyed by pizza id | WEB | Found |
| US-CART-016-WEB | Cart cleared on market change and login | WEB | Done |
| US-CART-017-MOB | Cart cleared on market change and logout | MOB | Done |
| US-CART-018-WEB | Logout clears the cart and last order | WEB | Done |
| US-CART-019-MOB | Mobile has no cart screen | MOB | Found |
| US-CART-020-UX | Topping cap shown as a disabled state | UX | Done |
| US-CART-021-UX | Customizer focus management and Escape | UX | Done |

---

### US-CART-001-WEB · Build a pizza in the customizer modal

**As a** customer **I want** to choose a size and toppings and see the price before I add a pizza **so that** I know what I am paying for.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 (first commit in the modal's history)

**Acceptance criteria**
1. Given a pizza card, when add is pressed, the customizer opens with four sizes (small, medium, large, family) and the topping groups.
2. Size surcharges (+0, +3, +4, +5 USD) and the per-topping price are converted to the local currency and rounded up.
3. The unit price is the localized base price, plus the size surcharge, plus the per-topping price times the topping count; it is shown as the estimated total.
4. Toggling a topping adds or removes it; a tenth topping is the maximum (the cap is UX, see US-CART-020-UX).
5. Confirm sends size, toppings and unit price to the page, which adds the line.

**Evidence**: `frontend/src/constants/pizza.js:1-22` (sizes), `frontend/src/constants/pizza.js:24-164` (23 toppings in four groups), `frontend/src/utils/pizzaPricing.js:9-21` (`usdToLocalCeil`, `computeUnitPrice`), `frontend/src/components/PizzaCustomizerModal.jsx:68-69,105-118,128-135,195-216,218-264,278,283-290`, `frontend/src/pages/Catalog.jsx:52-67`.
**Notes**: The backend recomputes the order total at checkout with the same rule (`backend/database.py:309-349`). Live: MX `p01` medium with two toppings gives subtotal 316.97 (227.97 + 53 + 2 x 18). Edit mode reuses this modal (US-CART-013-WEB). 13 of the 23 topping images are `placehold.co` URLs (`frontend/src/constants/pizza.js`).

---

### US-CART-001-MOB · Build a pizza on the builder screen

**As a** customer **I want** the same size and topping choices on the phone **so that** the two apps match.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 · Release: v1.0.0

**Acceptance criteria**
1. From a catalog card, add opens `PizzaBuilder` in add mode.
2. Sizes and the 23 toppings come from shared option lists.
3. The unit price uses the same formula as web and is shown as the estimated total.
4. Toppings are capped at 10.
5. Confirm adds the configured item, goes back, and shows the added-to-cart toast.

**Evidence**: `frontend-mobile/src/screens/CatalogScreen.tsx:31-36`; `frontend-mobile/src/components/MobileProductCard.tsx:44-50`; `frontend-mobile/src/constants/pizza.ts:1-6` (sizes); `frontend-mobile/src/pizzaOptions.ts:3-51` (four topping groups); `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:24-42` (`computeUnitPrice`), `:101-108` (size and toppings state), `:117-124` (cap), `:126-143` (confirm; add call at 140, toast at 141), `:365-370` (`view-estimated-total`).
**Notes**: `computeUnitPrice` is duplicated in the screen rather than shared with the web utility; the formula is the same. Mobile has no image for 13 of 23 toppings (text only); `pizzaOptions.ts` has 10 `require(` images.

---

### US-CART-002-WEB · Same configuration increments the cart line

**As a** customer **I want** adding the same pizza again to raise its quantity **so that** my cart does not fill with duplicate lines.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 (earliest commit with the merge check)

**Acceptance criteria**
1. Given a line with the same pizza, size and topping set, when that configuration is added, then its quantity goes up by 1 and no line is created.
2. The topping order does not matter, because the topping list is sorted before the comparison.
3. A different size or topping set creates a new line with its own id.

**Evidence**: `frontend/src/store.js:174-206` (`addConfiguredItem`; signature at 175; merge at 178-186; new line at 188-205).

---

### US-CART-002-MOB · Same configuration increments the cart line

**As a** customer **I want** adding the same pizza again to raise its quantity **so that** my cart does not fill with duplicate lines.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 · Release: v1.0.0 (shared signature helper added in 09a49fc, 2026-10-28)

**Acceptance criteria**
1. Given a line with the same configuration, when it is added again, then its quantity goes up by 1.
2. The signature is built by one shared helper for add, hydration and edit.
3. A different configuration creates a new line with its own unit price.

**Evidence**: `frontend-mobile/src/store/useAppStore.ts:134-167` (`addConfiguredItem`; merge at 139-148); `frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:4-6` (`cartItemSignature`); `frontend-mobile/src/screens/CheckoutScreen.tsx:117` (hydration uses the helper).

---

### US-CART-003-API · Seed the cart for automation

**As a** QA engineer **I want** to seed a cart through the API **so that** a UI test can start at checkout with a known cart.

- Layer: API · Epic: CART · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457 (seed endpoint and session helpers)

**Acceptance criteria**
1. Given a valid token, `POST /api/cart` replaces the caller's cart with the supplied items and returns the session state.
2. Each seeded line gets a server-generated `item_id` unless one is supplied.
3. The endpoint does not read `X-Country-Code`.
4. Quantity is limited to 1-10 by the cart model. Live: a `PUT` with quantity 11 returns 422, using the same model.

**Evidence**: `backend/test_api.py:59-87` (`seed_cart`; docstring 63-76 states that the header is not read), `backend/database.py:176-183` (`set_test_cart`), `backend/models.py:60-65` (`CartItem`; quantity at line 62).
**Notes**: Live (HEAD): `POST /api/cart` returned the line with a generated `ITEM-...` id.

---

### US-CART-004-API · Read the cart enriched with market price and toppings

**As a** customer **I want** my cart to reload with the right names, prices and toppings **so that** checkout shows what I built.

- Layer: API · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: bbbd4ed (toppings field); the endpoint dates to 75a849f (2026-03-11)

**Acceptance criteria**
1. `GET /api/cart` requires `X-Country-Code`; a missing header returns 400.
2. Each line returns name, price, currency and symbol for that market; the price is the base price times the market rate (live: MX `p01` 227.97; US 12.99).
3. A line whose `pizza_id` is not in the catalog is dropped from the response.
4. Each line includes `toppings`, `[]` when there are none (live on HEAD: `['pepperoni', 'mozzarella']` returned).
5. `X-Language` is optional; when it is omitted, names use the market language (code read; not run live).

**Evidence**: `backend/test_api.py:90-116` (`get_cart`; `x_language` at 99); `backend/middleware.py:10-17`; `backend/database.py:214-265` (`get_enriched_cart`; unknown-id skip at 236-237; toppings at 256); `backend/database.py:46-48` (default language); `backend/models.py:68-79` (`EnrichedCartItem`; `toppings` at 73).
**Notes**: Before bbbd4ed the response had no `toppings` field, so a cart seeded with toppings hydrated without them. Commit 91d036c documents the toppings field in the endpoint's response shape.

---

### US-CART-005-API · Upsert and delete one cart line

**As a** QA engineer **I want** to add, change and remove a single cart line by id **so that** tests can set up exact cart states.

- Layer: API · Epic: CART · Persona: QA · Market: all
- Status: Done
- Done on: 2026-08-12 · Commit: 503f4d6

**Acceptance criteria**
1. `PUT /api/cart/items/{item_id}` creates the line when the id is unknown and fully replaces it when known. Live: an unknown id added a line; a known id changed its quantity to 5.
2. An `item_id` in the body is ignored; the URL is authoritative.
3. `DELETE /api/cart/items/{item_id}` returns 404 "Cart item <id> not found" for an unknown id. Live: confirmed.
4. Both return the session state and neither reads `X-Country-Code`.

**Evidence**: `backend/test_api.py:119-142` (`put_cart_item`; docstring 124-130; body `item_id` excluded at 140), `backend/test_api.py:145-165` (`delete_cart_item`; 404 at 159-163), `backend/database.py:185-206` (`upsert_cart_item`, `remove_cart_item`).
**Notes**: Web and mobile never call these endpoints (grep at HEAD: only `GET /api/cart`), so client edits stay local until checkout.

---

### US-CART-006-API · Cart belongs to the login session

**As a** QA engineer **I want** two logins for the same user to have separate carts **so that** parallel tests do not overwrite each other.

- Layer: API · Epic: CART · Persona: QA · Market: all
- Status: Done
- Done on: 2026-08-11 · Commit: b407760 (cart and market session keyed by login `sid`)

**Acceptance criteria**
1. Login creates a random session id and stores it as the JWT `sid` claim.
2. Cart and session calls read the caller's `sid` from the token, not the username.
3. Two logins for the same user get separate carts. Live: after one login added a line, a second login saw 0 lines while the first kept 1.
4. A new login starts with an empty cart.

**Evidence**: `backend/routers/auth.py:53-62` (comment at 53-54; `sid` at 60, claim at 62); `backend/middleware.py:47-50` (`session_id` from the `sid` claim); `backend/database.py:139-148` (`_ensure_session`).
**Notes**: The profile was keyed by `sid` earlier, in 82d1b74 (2026-07-17).

---

### US-CART-007-API · Market switch through the API keeps the cart

**As a** QA engineer **I want** the market endpoint to change only the market **so that** a test controls the cart separately.

- Layer: API · Epic: CART · Persona: QA · Market: all
- Status: Done
- Done on: 2026-08-11 · Commit: b407760 (docstring added here)

**Acceptance criteria**
1. `POST /api/store/market` sets `country_code` on the caller's session only.
2. Cart lines are untouched by the switch. Live: switching MX to JP left the seeded line in place.
3. The docstring states this is deliberate: switching does not clear or partition the cart.
4. Contrast: web and mobile clear the cart on market change (US-CART-016-WEB, US-CART-017-MOB), so an API-driven switch mid-cart leaves a different state than the UI.

**Evidence**: `backend/test_api.py:34-56` (`set_market`; docstring 39-45), `backend/database.py:170-174` (`set_test_market`).

---

### US-CART-008-API · Cart API accepts configurations the builder cannot produce

**As a** QA engineer **I want** the cart API to reject configurations the builder cannot make **so that** automation cannot reach states the UI cannot reach.

- Layer: API · Epic: CART · Persona: QA · Market: all
- Status: Found
- Commit: a53274d (toppings list added to the cart model)

**Acceptance criteria**
1. Given 11 or 12 toppings, `POST /api/cart` stores them. The cap of 10 exists only in the client. Live: 12 accepted.
2. Given an unknown size such as `gigantic`, the API stores it, and checkout prices it as `small`. Live: MX `p01` subtotal is 227.97 for both `gigantic` and `small`.
3. Given a `pizza_id` that is not in the catalog, checkout counts it as 0 with no error. Live: subtotal 0.0 for `p99`.
4. Checkout validates only the market-required fields, not sizes, toppings or ids.

**Evidence**: `backend/models.py:60-65` (`size` is a free string at 63; `toppings` has no maximum at 64); `backend/database.py:337-342` (`SIZE_UPCHARGE_USD.get(size_key, 0)`; toppings counted), `backend/database.py:326-328` (unknown ids skipped); `backend/routers/checkout.py:74-83` (required-field check only), `:85-91` (totals); `frontend/src/components/PizzaCustomizerModal.jsx:115` and `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:121` (the client-side cap).
**Notes**: The UI cannot produce these lines; they are reachable only through the API. The code has no rule that rejects them.

---

### US-CART-009-WEB · Cart sidebar lists lines and totals

**As a** customer **I want** a running cart beside the catalog on a wide screen **so that** I see my order as I shop.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-18 · Commit: b86ce69 (sidebar file first appears)

**Acceptance criteria**
1. The sidebar is shown only from the `lg` breakpoint up.
2. With no lines, `cart-sidebar-empty` shows the empty text.
3. Each line shows its size label with the surcharge and the topping count.
4. Subtotal, delivery fee and total are shown in `cart-subtotal-value`, `cart-delivery-fee-value` and `cart-total-value`.
5. The checkout button navigates to `/checkout`.

**Evidence**: `frontend/src/pages/Catalog.jsx:69-71,153-161` (`hidden lg:block` at 154; `onRemove` passed at 158); `frontend/src/components/CartSidebar.jsx:9,38-58,61,70-86,113-128`.
**Notes**: Web only; mobile has no sidebar (US-CART-019-MOB). The sidebar receives `onRemove` but never renders a remove control (`CartSidebar.jsx:9`); lines are removed by lowering quantity to 0 or from checkout.

---

### US-CART-010-WEB · Sidebar delivery fee uses the market fee

**As a** customer **I want** the cart total to include the real delivery fee for my market **so that** the total matches what I am charged.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: a903683 (fix on `US-and-Improvements`; not in v1.1.8)

**Acceptance criteria**
1. The delivery fee is `countryInfo.delivery_fee` once `GET /api/countries` has loaded for the market.
2. Before that, the fallback table in `constants/market.js` applies: MX 35.1, US 2, CH 1.56, JP 316, SA 7.5. These match the API values (live).
3. The total is subtotal plus this fee.

**Evidence**: `frontend/src/components/CartSidebar.jsx:6,16-22` (fee and total), `frontend/src/constants/market.js:1-9` (fallback table; values at 4-8); commit `a903683`.
**Notes**: The sidebar used a hard-coded 2.50 in every currency before this fix (introduced in b86ce69).

---

### US-CART-011-WEB · Change quantity from the sidebar

**As a** customer **I want** to raise or lower a line's quantity from the cart **so that** I do not have to rebuild the pizza.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-21 · Commit: 64bfde8

**Acceptance criteria**
1. The `+` button sets the line quantity to quantity plus 1.
2. The `−` button sets it to quantity minus 1.
3. A quantity of 0 or less removes the line.
4. Each button has an accessible name that includes the pizza name.

**Evidence**: `frontend/src/components/CartSidebar.jsx:89-106` (buttons; `onUpdateQty` at 93 and 100; aria labels at 94 and 101); `frontend/src/store.js:215-225` (`setQty`; removal at 216-218).

---

### US-CART-011-MOB · Change quantity on mobile

**As a** customer **I want** to raise or lower a line's quantity on the phone **so that** I can change my order without rebuilding it.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Found
- Commit: 376caf6 (`setQty` in the mobile store)

**Acceptance criteria**
1. The store exposes `setQty`, and a quantity of 0 or less removes the line.
2. No mobile screen or component calls `setQty`. Checked at HEAD: the only matches are the type declaration (line 70) and the definition (line 180).
3. The checkout line controls are Edit and Remove only, so a customer changes a quantity by removing the line and adding the pizza again.

**Evidence**: `frontend-mobile/src/store/useAppStore.ts:70,180-184` (declaration and definition); `frontend-mobile/src/screens/CheckoutScreen.tsx:696-716` (Edit and Remove only); `git grep setQty` at HEAD.
**Notes**: Web has +/- in the sidebar (US-CART-011-WEB). Related: US-CART-019-MOB.

---

### US-CART-012-WEB · Remove a line on web

**As a** customer **I want** to remove an item from my order **so that** I do not pay for it.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-24 · Commit: c42e87e (Remove control with its test id on the checkout summary)

**Acceptance criteria**
1. Checkout shows a Remove control per line that removes that line by its id.
2. In the sidebar, `−` at quantity 1 removes the line.

**Evidence**: `frontend/src/pages/Checkout.jsx:975-981` (Remove button, `removeItem(it.id)` at 977); `frontend/src/store.js:208` (`removeItem`); `frontend/src/components/CartSidebar.jsx:92-96`; `frontend/src/store.js:215-218`.
**Notes**: The Remove test id uses the pizza id (US-CART-015-WEB).

---

### US-CART-012-MOB · Remove a line on mobile

**As a** customer **I want** to remove an item from my order **so that** I do not pay for it.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-25 · Commit: 37082da (Remove `testID`) · Release: v1.0.1

**Acceptance criteria**
1. The Remove control (`btn-remove-item-{id}`) removes that line from the local cart by its id.
2. Removal is local only; no cart API call is made.

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:714-716` (Remove calls `removeCartItem(item.id)`); `frontend-mobile/src/store/useAppStore.ts:169-170` (`removeCartItem`).

---

### US-CART-013-WEB · Edit a line from checkout

**As a** customer **I want** to change a line's size or toppings from checkout **so that** I can fix an order without removing it.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 (earliest commit with the edit merge)

**Acceptance criteria**
1. Edit opens the customizer prefilled with the line's size and toppings.
2. Confirm recomputes the unit price for the new configuration.
3. If another line already has the new signature, the quantities are added and the edited line is removed.
4. Otherwise the line is updated in place with the new signature, configuration and unit price.

**Evidence**: `frontend/src/pages/Checkout.jsx:966-974` (Edit button and handler), `:1182-1186` (modal with `initialConfig`), `:1187-1196` (price), `:1197-1220` (merge or update); `frontend/src/components/PizzaCustomizerModal.jsx:68-69,75-79` (prefill from `initialConfig`).
**Notes**: The Edit test id uses the pizza id (US-CART-015-WEB).

---

### US-CART-013-MOB · Edit a line from checkout

**As a** customer **I want** to change a line's size or toppings from checkout on my phone **so that** I can fix an order without removing it.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: 09a49fc (fix on `US-and-Improvements`; not in v1.1.8)

**Acceptance criteria**
1. Edit opens the builder with `mode: "edit"`, the line id and the line's config.
2. Confirm in edit mode calls `editCartItem`, which calls `applyCartItemEdit`.
3. If another line has the new signature, quantities add up and the edited line goes away; otherwise the line is updated in place with the new signature and price.

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:696-712` (Edit navigates at 699); `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:135-137` (edit branch); `frontend-mobile/src/store/useAppStore.ts:177-178` (`editCartItem`); `frontend-mobile/src/features/checkout/useCases/applyCartItemEdit.ts:13-34` (merge at 22-29; in-place update at 31-33).
**Notes**: Before 09a49fc the Edit button had an empty handler; the builder already supported edit mode.

---

### US-CART-014-WEB · Checkout hydrates the cart from the backend

**As a** customer **I want** checkout to show my cart when the local cart is empty **so that** the order is complete (and so that tests can seed checkout through the API).

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: bbbd4ed (toppings kept; base hydration from 75a849f, 2026-03-11)

**Acceptance criteria**
1. Hydration runs only when the local cart is empty.
2. It reads `GET /api/cart` and rebuilds each line with size, toppings, signature and unit price.
3. Toppings from the response are kept and priced.
4. A failed request leaves the local cart as it is.

**Evidence**: `frontend/src/pages/Checkout.jsx:126-181` (effect; empty-cart guard 135; fetch 137; mapping 141-170; toppings 143 and 165; price 157; signature 161; `setState` 173; error path 175-177).
**Notes**: Before bbbd4ed the toppings were hard-coded to `[]` (commit body).

---

### US-CART-014-MOB · Checkout hydrates the cart from the backend

**As a** customer **I want** checkout to show my cart when the local cart is empty **so that** the order is complete.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: bbbd4ed (toppings kept; base hydration from 75a849f, 2026-03-11)

**Acceptance criteria**
1. Hydration runs only when `cartItems` is empty.
2. It calls `cartService.getCart()` and rebuilds lines with size, toppings, signature and unit price.
3. Toppings are kept and priced.
4. A failure keeps the local cart; hydration reruns when the token changes.

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:77-137` (effect; guard 86; fetch 88; toppings 94; price 112-113; signature 117; `setState` 129; catch 131-133; token dependency 137); `frontend-mobile/src/services/cart.service.ts:7` (`toppings?` on `EnrichedCartItem`).

---

### US-CART-015-WEB · Checkout line controls keyed by pizza id

**As a** QA engineer **I want** each cart line to have its own selectors **so that** a test can edit or remove one of two lines of the same pizza.

- Layer: WEB · Epic: CART · Persona: QA · Market: all
- Status: Found
- Commit: c42e87e (test ids added to the checkout summary)

**Acceptance criteria**
1. The checkout Edit and Remove controls use `order-item-edit-{pizza_id}` and `order-item-remove-{pizza_id}`.
2. Two lines of the same pizza with different sizes or toppings therefore share those selectors, so automation cannot address one of them.
3. Each hydrated line has its own generated id, which these selectors do not use. Mobile keys the same controls by line id.

**Evidence**: `frontend/src/pages/Checkout.jsx:966` (Edit `data-testid`), `:976` (Remove `data-testid`), `:160` (line id); `frontend/src/components/CartSidebar.jsx:72,92,99` (sidebar test ids also use `pizza_id`); `frontend-mobile/src/screens/CheckoutScreen.tsx:706,716` (mobile uses `item.id`).
**Notes**: Code read only; not reproduced in a browser.

---

### US-CART-016-WEB · Cart cleared on market change and login

**As a** customer **I want** a cart from one market never to carry into another **so that** prices and currency stay consistent.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-15 · Commit: 79c94ea (earliest commit with the clear-on-market-change line)

**Acceptance criteria**
1. `setCountryCode` clears the cart before it applies the new market.
2. Login is the only caller of `setCountryCode` on web, so every web login clears the local cart.
3. The API cart is per login session (US-CART-006-API), so a fresh login also starts with an empty API cart.

**Evidence**: `frontend/src/store.js:118-139` (`setCountryCode`; clear at 120); `frontend/src/pages/Login.jsx:80` (the only call site, per grep at HEAD).
**Notes**: There is no in-app market switcher on web; the market is chosen on the login form (US-MKT-006-WEB).

---

### US-CART-017-MOB · Cart cleared on market change and logout

**As a** customer **I want** a cart from one market never to carry into another, and nothing to remain after logout **so that** the next session starts clean.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-15 · Commit: 79c94ea (market clear); logout clear since ebeacd3 (2026-02-07) · Release: v1.0.0 (both commits contained in v1.0.0)

**Acceptance criteria**
1. `setCountry` clears `cartItems`.
2. Login uses `selectMarket`, which calls `setCountry`.
3. Logout clears `cartItems` and `lastOrder`.
4. The deep-link parameter `market=` calls `setCountry`, and `hydrateCart=true` clears the cart.

**Evidence**: `frontend-mobile/src/store/useAppStore.ts:101-107` (`setCountry`; clear at 106), `:120-130` (`logout`; clear at 123); `frontend-mobile/src/screens/LoginScreen.tsx:82`; `frontend-mobile/src/features/country/useCases/selectMarket.ts:3-8` (calls `setCountry` at 7); `frontend-mobile/src/hooks/useDeepLinkParams.ts:95-98,110-111`.

---

### US-CART-018-WEB · Logout clears the cart and last order

**As a** customer **I want** logout to clear my cart and last order **so that** the next person on this browser cannot see them.

- Layer: WEB · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: 60774e3 (fix on `US-and-Improvements`; not in v1.1.8)

**Acceptance criteria**
1. `logout()` clears the cart.
2. It also clears the last order.
3. The 401 path calls the same `logout()`, so an expired session clears both as well.

**Evidence**: `frontend/src/store.js:43-61` (`logout`; `clearCart` at 57; `clearLastOrder` at 60); `frontend/src/services/httpClient.js:46-48` (401 path calls `logout`).
**Notes**: Before 60774e3 the web cart and last order stayed in localStorage across logout.

---

### US-CART-019-MOB · Mobile has no cart screen

**As a** customer **I want** a cart I can open from anywhere **so that** I can review my order before paying.

- Layer: MOB · Epic: CART · Persona: Customer · Market: all
- Status: Found
- Commit: n/a (structural: the stack has never had a Cart route)

**Acceptance criteria**
1. The stack has Login, Catalog, Checkout, Profile, OrderSuccess and PizzaBuilder screens, with no Cart route.
2. The bottom bar's "Checkout" tab is where the cart lives; its badge shows the line count.
3. Cart lines can be viewed, edited and removed only on the checkout screen.

**Evidence**: `frontend-mobile/App.tsx:83-88` (stack screens); `frontend-mobile/src/components/BottomNavBar.tsx:35-43` (tabs; Checkout as the cart tab with badge at 40).

---

### US-CART-020-UX · Topping cap shown as a disabled state

**As a** customer **I want** to see when I cannot add another topping **so that** I am not surprised by a button that does nothing.

- Layer: UX · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 376caf6 (earliest commit with the 10-topping check)

**Acceptance criteria**
1. Web: once 10 toppings are selected, unselected toppings are disabled and dimmed; selected toppings stay enabled.
2. Mobile: the same condition disables the option, dims it to 0.5 opacity and sets `accessibilityState.disabled`.

**Evidence**: `frontend/src/components/PizzaCustomizerModal.jsx:111-118,239-240` (disabled and `opacity-40 cursor-not-allowed`); `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:292-304` (disabled, opacity 0.5, accessibility state).
**Notes**: The cap is enforced in the UI only (US-CART-008-API).

---

### US-CART-021-UX · Customizer focus management and Escape

**As a** customer using a keyboard or screen reader **I want** focus to move into the customizer, return when it closes, and close on Escape **so that** I can use it without a mouse.

- Layer: UX · Epic: CART · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-13 · Commit: cf8d2c9 (WCAG 2.4.3 fix)

**Acceptance criteria**
1. On open, focus moves to the close button.
2. Escape closes the modal.
3. On close, focus returns to the element that opened it.
4. A click on the dimmed backdrop closes it.

**Evidence**: `frontend/src/components/PizzaCustomizerModal.jsx:86-101` (focus and Escape effect), `:154` (backdrop click).
**Notes**: Web only; the mobile builder is a full screen, not a modal.
</content>
