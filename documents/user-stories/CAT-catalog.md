# Epic CAT — Catalog

The pizza catalog as customers and automation see it: the market list (`GET /api/countries`), the catalog endpoint (`GET /api/pizzas`) with its language, category and QA-anomaly behaviour, and the web and mobile catalog screens (search, category filter, empty and loading states, product cards, badges, image fallback).

Evidence basis: line numbers are at HEAD `b09cfbb` (this worktree after fast-forwarding to `US-and-Improvements`, which carries the 2026-10-28 fixes). Those fixes are not on `origin/main` (`9ca3767`) or local `main` (`87966da`). Live checks ran the backend in-process with FastAPI `TestClient` against HEAD; no server or port was used.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-CAT-001-API | Catalog translated per request language | API | Done |
| US-CAT-002-API | Catalog rejects a missing or invalid market header | API | Done |
| US-CAT-003-API | Pizza category exposed for filtering | API | Done |
| US-CAT-004-WEB | Search pizzas by name | WEB | Done |
| US-CAT-004-MOB | Search pizzas by name | MOB | Done |
| US-CAT-005-WEB | Category filter offers Sides with no pizzas | WEB | Found |
| US-CAT-005-MOB | Category pills offer Sides with no pizzas | MOB | Found |
| US-CAT-005-UX | Active category is exposed to assistive technology | UX | Done |
| US-CAT-006-WEB | Empty state with a clear-filters reset | WEB | Done |
| US-CAT-006-MOB | Empty state with no reset control | MOB | Found |
| US-CAT-007-WEB | Catalog loading and error states | WEB | Done |
| US-CAT-007-MOB | Catalog loading and error states | MOB | Done |
| US-CAT-008-WEB | Product card shows name, description and price | WEB | Done |
| US-CAT-008-MOB | Product card shows name, description and price | MOB | Done |
| US-CAT-009-WEB | Bestseller and Veggie badges from the API category | WEB | Done |
| US-CAT-009-MOB | Product badges on mobile | MOB | Found |
| US-CAT-010-UX | Broken pizza image shows a placeholder | UX | Done |
| US-CAT-011-API | problem_user sees $0 prices and broken images | API | Done |
| US-CAT-012-API | Market list endpoint | API | Done |

---

### US-CAT-001-API · Catalog translated per request language

**As a** customer **I want** pizza names and descriptions in the language I selected **so that** the menu reads in my language.

- Layer: API · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: af157ce

**Acceptance criteria**
1. Given a valid token and `X-Country-Code`, when `GET /api/pizzas` is called with `X-Language` set to `en`, `es`, `de`, `fr`, `ja` or `ar`, then each pizza's `name` and `description` are returned in that language.
2. Given an `X-Language` value outside that set (for example `xx`), then the English text is returned.
3. Given the catalog, each of the 12 pizzas has a non-empty name and description in all six languages.

**Evidence**: `backend/routers/catalog.py:43-79`, `backend/database.py:43-48` (default language table and `_resolve_language`), `backend/database.py:51-54` (`_translate_field`), `backend/database.py:268-307` (`get_catalog`, translation at 292-293), `backend/constants.py:154-335` (localized dicts). Live (HEAD): `xx` returns "Margherita" for SA; all 12 pizzas have six languages (python check on `PIZZA_CATALOG`).
**Notes**: When `X-Language` is omitted, this endpoint returns English even for MX, JP and SA; see US-MKT-004-API (Found). The translation helpers moved into `database.py` in 4a15f41 (2026-07-12).

---

### US-CAT-002-API · Catalog rejects a missing or invalid market header

**As a** QA engineer **I want** catalog calls without a valid market code to fail **so that** a test cannot silently price in the wrong market.

- Layer: API · Epic: CAT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given no `X-Country-Code` header, when `GET /api/pizzas` is called, then the response is 400 with the detail "X-Country-Code header is required. Valid values: MX, US, CH, JP, SA".
2. Given an unknown code such as `XX`, then the response is 400 "Invalid country code".
3. Given a lowercase code such as `sa`, then it is accepted and treated as `SA` (currency SAR).
4. Given no bearer token, then the request is rejected with 401.

**Evidence**: `backend/middleware.py:10-26` (header check; `.upper()` at line 20), `backend/routers/catalog.py:49-51` (dependencies). Live (HEAD): no header returns 400; `XX` returns 400; `sa` returns 200 with SAR; no token returns 401.
**Notes**: The middleware does not validate `X-Language`; unknown values fall back to English (see US-CAT-001-API).

---

### US-CAT-003-API · Pizza category exposed for filtering

**As a** customer **I want** each pizza tagged with a category **so that** the menu can be filtered to popular, veggie or meat options.

- Layer: API · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-05-22 · Commit: ae064c6

**Acceptance criteria**
1. Given `GET /api/pizzas`, each pizza includes a `category` field.
2. Given the catalog today, the categories are `popular` (p01, p04), `veggie` (p05, p06, p11) and `meat` (the other seven pizzas).
3. Given the catalog today, no pizza has category `sides`, although the web and mobile filters offer that value (US-CAT-005-WEB, US-CAT-005-MOB).

**Evidence**: `backend/constants.py:150-153` (taxonomy comment), `backend/constants.py:158,173,188,203,218,233,248,263,278,293,308,323` (category per pizza), `backend/models.py:43-57` (`Pizza.category` at line 52; `PizzaResponse`).
**Notes**: The constants comment states that clients filter from data rather than name keywords. Live count matched (2 popular, 3 veggie, 7 meat).

---

### US-CAT-004-WEB · Search pizzas by name

**As a** customer **I want** to type part of a pizza's name **so that** I can find it quickly.

- Layer: WEB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-21 · Commit: 64bfde8

**Acceptance criteria**
1. Given the catalog is loaded, when text is typed into `search-pizza`, then only pizzas whose localized name contains the text (case-insensitive) stay in the grid.
2. Given a category is selected, search and category apply together.
3. Given no pizza matches, the empty state appears (US-CAT-006-WEB).

**Evidence**: `frontend/src/pages/Catalog.jsx:79-87` (filter), `frontend/src/pages/Catalog.jsx:113-120` (search input), `frontend/src/pages/Catalog.jsx:46-47` (state).
**Notes**: The filter compares `p.name` only (`Catalog.jsx:82`), not the description, so searching for an ingredient such as "mozzarella" matches no pizza. Mobile behaves the same (US-CAT-004-MOB).

---

### US-CAT-004-MOB · Search pizzas by name

**As a** customer **I want** to type part of a pizza's name **so that** I can find it quickly.

- Layer: MOB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-25 · Commit: 37082da (search input `testID` added here)

**Acceptance criteria**
1. Given the catalog is loaded, when text is typed into `input-search-pizza`, then the list keeps pizzas whose localized name contains the text, case-insensitively.
2. Given a category is selected, search and category apply together.
3. Given no pizza matches, the empty text appears (US-CAT-006-MOB).

**Evidence**: `frontend-mobile/src/screens/CatalogScreen.tsx:38-49` (filter), `frontend-mobile/src/screens/CatalogScreen.tsx:63-74` (input and `testID`).
**Notes**: Name only, as on web.

---

### US-CAT-005-WEB · Category filter offers Sides with no pizzas

**As a** customer **I want** the category filter to offer only categories that have pizzas **so that** I am not sent to an empty result.

- Layer: WEB · Epic: CAT · Persona: Customer · Market: all
- Status: Found
- Commit: b86ce69 (category filter with Sides introduced)

**Acceptance criteria**
1. Given All, Popular, Veggie or Meat is selected, the grid shows only pizzas with that category.
2. Given Sides is selected, the grid is empty and the empty state with "clear filters" shows, because the catalog has no `sides` pizza.
3. The Sides button is still rendered in the filter.

**Evidence**: `frontend/src/components/CategoryFilter.jsx:4-10` (Sides at line 9), `frontend/src/components/CategoryFilter.jsx:16-32` (buttons), `frontend/src/pages/Catalog.jsx:83-85,145-150`, `backend/constants.py:150-153`.
**Notes**: Not a runtime error. The backend comment already acknowledges that the catalog has no sides.

---

### US-CAT-005-MOB · Category pills offer Sides with no pizzas

**As a** customer **I want** the category pills to offer only categories that have pizzas **so that** I am not sent to an empty result.

- Layer: MOB · Epic: CAT · Persona: Customer · Market: all
- Status: Found
- Commit: b86ce69 (category pills with Sides introduced)

**Acceptance criteria**
1. Given All, Popular, Veggie or Meat is selected, the list shows only pizzas with that category.
2. Given Sides is selected, the list is empty and the "no pizzas" text shows, because the catalog has no `sides` pizza.
3. The Sides pill is still rendered (`btn-category-sides`).

**Evidence**: `frontend-mobile/src/components/CategoryPills.tsx:7-13` (Sides at line 12), `frontend-mobile/src/components/CategoryPills.tsx:29-48` (pills, `btn-category-{id}` at line 38), `frontend-mobile/src/screens/CatalogScreen.tsx:44-46,108-110`, `backend/constants.py:150-153`.

---

### US-CAT-005-UX · Active category is exposed to assistive technology

**As a** customer using a screen reader **I want** the selected category announced **so that** I know which filter is active.

- Layer: UX · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-13 · Commit: cf8d2c9

**Acceptance criteria**
1. Web: each category button has `aria-pressed` set to whether it is the selected category, inside a group labelled with the translated "categories" string.
2. Mobile: each pill has `accessibilityRole="tab"` and `accessibilityState.selected` set to whether it is active.

**Evidence**: `frontend/src/components/CategoryFilter.jsx:16` (group label), `frontend/src/components/CategoryFilter.jsx:20` (`aria-pressed`), `frontend-mobile/src/components/CategoryPills.tsx:36-37` (`accessibilityRole`, `accessibilityState`).
**Notes**: Introduced with the WCAG fixes in cf8d2c9 (2026-07-13).

---

### US-CAT-006-WEB · Empty state with a clear-filters reset

**As a** customer **I want** a one-tap reset when nothing matches **so that** I can get back to the full menu.

- Layer: WEB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-21 · Commit: 64bfde8

**Acceptance criteria**
1. Given the filtered list is empty, the text `noPizzasFound` and a `clear-filters` button are shown.
2. When `clear-filters` is pressed, the search text is cleared and the category resets to All.

**Evidence**: `frontend/src/pages/Catalog.jsx:145-150`.

---

### US-CAT-006-MOB · Empty state with no reset control

**As a** customer **I want** a reset control when nothing matches **so that** I can get back to the full menu without retyping.

- Layer: MOB · Epic: CAT · Persona: Customer · Market: all
- Status: Found
- Commit: 37082da (empty-state text `testID` added here)

**Acceptance criteria**
1. Given no pizza matches, the text `noPizzasFound` is shown (`text-empty-results`).
2. There is no button that clears the search or resets the category; the user must edit the search box or tap All.

**Evidence**: `frontend-mobile/src/screens/CatalogScreen.tsx:79-84` (category pills), `frontend-mobile/src/screens/CatalogScreen.tsx:108-110` (empty text only).

---

### US-CAT-007-WEB · Catalog loading and error states

**As a** customer **I want** a loading message and a clear error **so that** I know what the catalog is doing.

- Layer: WEB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-21 · Commit: 64bfde8 (`catalog-loading` `data-testid` added here)

**Acceptance criteria**
1. While `/api/pizzas` is loading, `catalog-loading` shows the `loadingMenu` text.
2. If the request fails, `catalog-error` shows the translated `catalogLoadFailed` text.
3. The catalog reloads when market or language changes.

**Evidence**: `frontend/src/pages/Catalog.jsx:49,91-92`; `frontend/src/features/catalog/hooks/useCatalogPizzas.js:4-32` (error key at line 20; reload effect at 27-29).

---

### US-CAT-007-MOB · Catalog loading and error states

**As a** customer **I want** a loading indicator and a clear error **so that** I know what the catalog is doing.

- Layer: MOB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: cac3d07 (loader present in the initial commit)

**Acceptance criteria**
1. While loading, an activity indicator with `loader-catalog` is shown.
2. On failure, the translated error text (`text-catalog-error`) is shown.
3. The fetch waits for a token, so a deep-link cold start does not request without auth and reruns once the token is set.

**Evidence**: `frontend-mobile/src/screens/CatalogScreen.tsx:87-98`; `frontend-mobile/src/features/catalog/hooks/useCatalogPizzas.ts:19-32` (error key `catalogLoadFailed` at line 28), `:34-44` (token gate).

---

### US-CAT-008-WEB · Product card shows name, description and price

**As a** customer **I want** each card to show the pizza, its description and its price in my market **so that** I can compare options.

- Layer: WEB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-18 · Commit: b86ce69 (card file first appears here)

**Acceptance criteria**
1. Each card shows the localized name (`pizza-name-{id}`) and description (`pizza-description-{id}`) from the API.
2. The price (`pizza-price-{id}`) is rendered through `formatPrice` with the pizza's currency (Intl formatting, see US-MKT-007-WEB).
3. The add button (`add-to-cart-{id}`) opens the customizer for that pizza.

**Evidence**: `frontend/src/components/ProductCard.jsx:36-42` (name, description, price), `frontend/src/components/ProductCard.jsx:44-53` (add button); `frontend/src/pages/Catalog.jsx:52-55,134-143` (open customizer; card list).
**Notes**: The image and badge are covered by US-CAT-009-WEB and US-CAT-010-UX.

---

### US-CAT-008-MOB · Product card shows name, description and price

**As a** customer **I want** each card to show the pizza, its description and its price **so that** I can compare options.

- Layer: MOB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-18 · Commit: b86ce69 (card file first appears here)

**Acceptance criteria**
1. Each card (`card-pizza-{id}`) shows the localized name and description (`text-pizza-name-{id}`, `text-pizza-desc-{id}`).
2. The price (`text-pizza-price-{id}`) is shown as currency symbol plus price; the formatting gap is US-MKT-007-MOB (Found).
3. The add button (`btn-add-pizza-{id}`) opens the builder in add mode.

**Evidence**: `frontend-mobile/src/components/MobileProductCard.tsx:19,38-42,44-50`; `frontend-mobile/src/screens/CatalogScreen.tsx:31-36` (navigate to builder in add mode), `:101-107` (list).
**Notes**: `frontend-mobile/src/components/PizzaCard.tsx` has a similar card that nothing imports at HEAD (dead code).

---

### US-CAT-009-WEB · Bestseller and Veggie badges from the API category

**As a** customer **I want** popular and veggie pizzas marked on their cards **so that** I can spot them quickly.

- Layer: WEB · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: f96c194 (fix on `US-and-Improvements`; not in any release, see Notes)

**Acceptance criteria**
1. A pizza with `category: popular` shows the Bestseller badge.
2. A pizza with `category: veggie` shows the Veggie badge.
3. A pizza with `category: meat` shows no badge.

**Evidence**: `frontend/src/components/ProductCard.jsx:6-16` (badge branches on `pizza.category`); `backend/models.py:43-52` (`Pizza` carries `category`, no `type`); commit `f96c194` diff.
**Notes**: Before f96c194 the card tested `pizza.type`, which `GET /api/pizzas` never returns, so no badge rendered; the pre-fix code also tied Bestseller to `meat`. Local `main` (`87966da`) still has the pre-fix code. The popular -> Bestseller mapping is a product call flagged in the commit body. Not in v1.1.8.

---

### US-CAT-009-MOB · Product badges on mobile

**As a** customer **I want** Bestseller and Veggie badges on mobile cards **so that** the two apps show the same information.

- Layer: MOB · Epic: CAT · Persona: Customer · Market: all
- Status: Found
- Commit: b86ce69 (card introduced without badges)

**Acceptance criteria**
1. Mobile product cards never show a Bestseller or Veggie badge; the card has no category branch.
2. Veggie on mobile is only a filter pill, not a card badge.

**Evidence**: `frontend-mobile/src/components/MobileProductCard.tsx:15-52` (no `category` reference), `frontend-mobile/src/components/CategoryPills.tsx:10`.
**Notes**: Web shows badges since f96c194 (US-CAT-009-WEB), so the two platforms differ.

---

### US-CAT-010-UX · Broken pizza image shows a placeholder

**As a** customer **I want** a broken picture to show a placeholder **so that** the menu never shows an empty box.

- Layer: UX · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-05-28 · Commit: c0fd871 (mobile placeholder tile; web fallback dates to b86ce69)

**Acceptance criteria**
1. Web: when a card image fails, `onError` replaces the source with a generic pizza photo.
2. Web: the cart sidebar thumbnail and the customizer image use the same fallback.
3. Mobile: a branded tile with a pizza emoji sits behind the remote image, so a failed load shows the tile instead of a black box.
4. Mobile: remote images send a descriptive User-Agent, so Wikimedia does not return 403 on Android.

**Evidence**: `frontend/src/components/ProductCard.jsx:28`; `frontend/src/components/CartSidebar.jsx:80`; `frontend/src/components/PizzaCustomizerModal.jsx:185-187`; `frontend-mobile/src/components/MobileProductCard.tsx:20-33`; `frontend-mobile/src/utils/image.ts:4-23`.
**Notes**: The web fallback is itself a remote image; if it also fails, the broken image shows.

---

### US-CAT-011-API · problem_user sees $0 prices and broken images

**As a** QA engineer **I want** problem_user to return zero prices and broken images **so that** UI tests can check how the app handles bad catalog data.

- Layer: API · Epic: CAT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `problem_user`, `GET /api/pizzas` returns `price` 0.0 and image `https://broken-image-url.com/404.jpg` for every pizza.
2. Given any other user, prices are converted from USD as normal.
3. Given `problem_user`, `GET /api/cart` also returns price 0 and the broken image for each line (code read only; not run live).

**Evidence**: `backend/database.py:296-300` (catalog: test at 296, price at 297, image at 298, other users converted at 299-300); `backend/database.py:244-246` (cart branch); `backend/constants.py:34-39` (user description). Live (HEAD): MX `p01` returns price 0.0 with the broken URL.
**Notes**: On web the broken URL is hidden behind the generic photo (`ProductCard.jsx:28`), so the visible symptom is $0 with a stock picture. On mobile it is the placeholder tile (`MobileProductCard.tsx:20-33`).

---

### US-CAT-012-API · Market list endpoint

**As a** customer **I want** the app to know the supported markets with their currency and fees **so that** I can pick my market at login.

- Layer: API · Epic: CAT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. `GET /api/countries` returns one entry per market, five in total: MX, US, CH, JP, SA.
2. The call needs no Authorization header and no `X-Country-Code` header.
3. `delivery_fee` is USD 2.00 converted to the market currency (live: MX 35.1, US 2.0, CH 1.56, JP 316.0, SA 7.5).
4. `decimal_places` is 0 for JPY and 2 for the other markets.

**Evidence**: `backend/routers/catalog.py:14-39`; `backend/models.py:152-164` (`CountryInfo`); `backend/constants.py:89-147`. Live (HEAD): 200 with no headers; five entries as listed.
**Notes**: Clients read it on web (`frontend/src/features/country/hooks/useCountryFeatureInfo.js:16-28`) and mobile (`frontend-mobile/App.tsx:56-62`). Market rules are in US-MKT-001-API.
</content>
