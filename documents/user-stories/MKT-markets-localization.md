# Epic MKT — Markets, Localization & Currency

The five markets (MX, US, CH, JP, SA) as data: market rules and the country table, currency conversion and decimals, per-market tax, delivery fee and tip, the language each market defaults to, the Swiss German/French toggle, market choice at login, Arabic right-to-left layout, flags, and the six-language copy.

Evidence basis: line numbers are at HEAD `b09cfbb` (this worktree after fast-forwarding to `US-and-Improvements`, which carries the 2026-10-28 fixes). Live checks ran the backend in-process with FastAPI `TestClient` and the pricing functions directly; no server or port was used. Locale key counts were measured with a script at HEAD. The PRD (`documents/Product_Requirement_Doc.md`) omits SA from its market, tax and rate lists (lines 17, 66, 82, 127).

| ID | Title | Layer | Status |
|---|---|---|---|
| US-MKT-001-API | Market rules are data (COUNTRY_CONFIG) | API | Done |
| US-MKT-002-API | USD prices converted with fixed rates and market decimals | API | Done |
| US-MKT-003-API | Tax, delivery fee and tip per market in checkout totals | API | Done |
| US-MKT-004-API | X-Language defaults differ between catalog and cart | API | Found |
| US-MKT-005-WEB | Switzerland German or French toggle | WEB | Done |
| US-MKT-005-MOB | Switzerland German or French toggle | MOB | Done |
| US-MKT-006-WEB | Market chosen on the login form sets market and language | WEB | Done |
| US-MKT-006-MOB | Market chosen on the login screen sets market and language | MOB | Done |
| US-MKT-007-WEB | Currency shown in the market's locale | WEB | Done |
| US-MKT-007-MOB | Currency formatting on mobile product cards | MOB | Found |
| US-MKT-008-UX | Arabic renders right-to-left, and only when it should | UX | Done |
| US-MKT-009-UX | Market flags drawn as shapes, not emoji | UX | Done |
| US-MKT-010-UX | Six locales share one key set per platform | UX | Done |

---

### US-MKT-001-API · Market rules are data (COUNTRY_CONFIG)

**As a** QA engineer **I want** every market's rules in one table **so that** market-specific tests are data-driven and adding a market is a config change.

- Layer: API · Epic: MKT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (table created); SA added in d7f4679 (2026-07-09)

**Acceptance criteria**
1. Each market (MX, US, CH, JP, SA) has a currency, symbol, required fields, optional fields, tip field, tip choices, tax rate, delivery fee in USD and languages.
2. Checkout checks the market's required fields from the table, with no per-market branch.
3. The tip value is read from the market's own tip field (`propina`, `tip`, `trinkgeld`, `chip`, `baksheesh`).
4. Adding a market is a config edit, as the checkout comment states.

**Evidence**: `backend/constants.py:89-147` (`COUNTRY_CONFIG`; MX 90-100, US 101-112, CH 113-123, JP 124-135, SA 136-146); `backend/routers/checkout.py:74-83` (required-field check), `:106-113` (country fields driven by config); `backend/models.py:105-109` (tip fields), `:122-130` (`get_tip_percentage`).
**Notes**: The PRD lists only MX, US, CH and JP as supported markets (`documents/Product_Requirement_Doc.md:17,66`), so SA is missing from it.

---

### US-MKT-002-API · USD prices converted with fixed rates and market decimals

**As a** customer **I want** prices shown in my market's currency with the right number of decimals **so that** the amounts are correct and readable.

- Layer: API · Epic: MKT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Catalog base prices are in USD; the market price is the base price times the market rate, rounded.
2. JPY uses 0 decimals; the other markets use 2.
3. The rates are USD 1.0, MXN 17.55, CHF 0.7823, JPY 157.89 and SAR 3.75.
4. Live: Margherita (USD 12.99) is 227.97 MXN, 10.16 CHF, 2051 JPY and 48.71 SAR; US shows 12.99.

**Evidence**: `backend/constants.py:134` (JPY `decimal_places: 0`), `backend/constants.py:154-335` (base prices), `backend/constants.py:342-348` (rates), `backend/database.py:23-31` (`convert_usd_amount`), `backend/database.py:80-82` (`_convert_price`).
**Notes**: The rates are fixed "2026 YTD averages" (`constants.py:338-341`), not live exchange rates. The PRD rate list (line 82) omits SAR.

---

### US-MKT-003-API · Tax, delivery fee and tip per market in checkout totals

**As a** customer **I want** the tax, delivery fee and tip for my market applied at checkout **so that** the total I see is the total I pay.

- Layer: API · Epic: MKT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Tax is the subtotal times the market rate: MX 16%, US 8%, CH 8.1%, JP 10%, SA 15%.
2. Delivery fee is USD 2.00 converted to the market currency (every market).
3. The tip is the market's chosen percentage of the subtotal.
4. Live: US Margherita with a 10% tip gives subtotal 12.99, delivery 2.00, tax 1.04, tip 1.30 and total 17.33. MX medium with two toppings gives subtotal 316.97, tax 50.72, and total 402.79 with the 35.10 fee.

**Evidence**: `backend/constants.py:96-146` (tax, fee and tip per market); `backend/database.py:320-324` (delivery fee converted), `:346-349` (subtotal, tax, tip, total); `backend/routers/checkout.py:85-91` (totals call); `backend/models.py:122-130` (`get_tip_percentage`).
**Notes**: Mobile's fallback tax and fee tables, used before `countryInfo` loads, are inline in `frontend-mobile/src/screens/CheckoutScreen.tsx:185-191`. Web's fallback fee table is `frontend/src/constants/market.js:2-8`. The PRD tax list (line 127) omits SA.

---

### US-MKT-004-API · X-Language defaults differ between catalog and cart

**As a** QA engineer **I want** the same default language on every endpoint **so that** a test that omits the header gets predictable text.

- Layer: API · Epic: MKT · Persona: QA · Market: all
- Status: Found
- Commit: af157ce (`X-Language` header first introduced)

**Acceptance criteria**
1. Given `X-Language` is omitted, `GET /api/pizzas` returns English for every market. Live: MX without the header returned "Margherita", not the Spanish name.
2. Given `X-Language` is omitted, `GET /api/cart` uses the market language, because its parameter defaults to `None` and the resolver falls back to the market default (code read; not run live).
3. The market default table is MX `es`, US `en`, CH `de`, JP `ja`, SA `ar` on the backend, web and mobile.

**Evidence**: `backend/routers/catalog.py:52` (`Header("en", alias="X-Language")`); `backend/test_api.py:99` (`Optional[str] = Header(None)`); `backend/database.py:43` (default table), `:46-48` (`_resolve_language`); `frontend/src/store.js:90-96`; `frontend-mobile/src/store/useAppStore.ts:77-83`.
**Notes**: The UI is not affected: the web HTTP client sends the header on every request (`frontend/src/services/httpClient.js:28`), and the mobile client does too (`frontend-mobile/src/api/client.ts:44`). Direct API callers, such as the tests, are affected.

---

### US-MKT-005-WEB · Switzerland German or French toggle

**As a** customer in Switzerland **I want** to switch between German and French **so that** the app reads in the language I prefer.

- Layer: WEB · Epic: MKT · Persona: Customer · Market: CH
- Status: Done
- Done on: 2026-02-07 · Commit: ebeacd3 (saved `chLang` preference); desktop test ids in 64bfde8, mobile-menu test ids in d9beaf7

**Acceptance criteria**
1. The toggle appears only when the market is CH, in the desktop navbar and in the mobile menu.
2. Desktop buttons are `lang-de` and `lang-fr`; mobile-menu buttons are `mobile-lang-de` and `mobile-lang-fr`.
3. `setLanguage` does nothing outside CH.
4. The choice is saved under the `chLang` localStorage key, reused when CH is selected again, and sets the matching locale (`de-CH` or `fr-CH`).

**Evidence**: `frontend/src/components/Navbar.jsx:35,113-140` (desktop, `lang-de` at 118, `lang-fr` at 132), `:169-196` (mobile menu, `mobile-lang-de` at 174, `mobile-lang-fr` at 188); `frontend/src/store.js:126-130` (saved preference), `:142-153` (`setLanguage`; no-op at 144, saved at 147, locale at 149-152).
**Notes**: The toggle is in the authenticated navbar (`frontend/src/App.jsx:39`), not on the login screen.

---

### US-MKT-005-MOB · Switzerland German or French toggle

**As a** customer in Switzerland **I want** to switch between German and French **so that** the app reads in the language I prefer.

- Layer: MOB · Epic: MKT · Persona: Customer · Market: CH
- Status: Done
- Done on: 2026-02-25 · Commit: 37082da (toggle test ids) · Release: v1.0.1

**Acceptance criteria**
1. The toggle shows in the location header and in the custom navbar only when the country is CH.
2. Selecting DE or FR calls `setLanguage`.
3. `setLanguage` does nothing unless the country is CH.
4. The choice is kept in memory (`chLanguage`) and reused when CH is selected again. It is not persisted, so it is lost when the app restarts.

**Evidence**: `frontend-mobile/src/components/LocationHeader.tsx:23,29-32,49-50` (header toggle); `frontend-mobile/src/components/CustomNavbar.tsx:21,28,31,52` (navbar toggle); `frontend-mobile/src/store/useAppStore.ts:49,92,102,109-114` (`chLanguage`, `setLanguage`; guard at 111); `:89` (no persistence middleware on the store).

---

### US-MKT-006-WEB · Market chosen on the login form sets market and language

**As a** customer **I want** to pick my market when I sign in **so that** prices, currency and language match where I am.

- Layer: WEB · Epic: MKT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-15 · Commit: a39eed8

**Acceptance criteria**
1. The login form shows five market buttons (US, MX, CH, JP, SA), each with a flag and a `market-{code}` test id.
2. The default selection is US.
3. On login, `setCountryCode(selectedMarket)` runs before `login()`.
4. `setCountryCode` sets the market's default language and locale; CH uses the saved DE or FR choice.
5. The app starts in English, and logout returns it to English.

**Evidence**: `frontend/src/pages/Login.jsx:44` (default US), `:80-81` (set market, then login), `:196-219` (buttons; `market-{code}` at 208; flag at 219), `:198-202` (market list); `frontend/src/store.js:82-96` (locale and language tables), `:111-112` (start in English), `:118-138` (`setCountryCode`), `:66` (logout resets to English).
**Notes**: There is no in-app market switcher after login; `setCountryCode` has one caller (`Login.jsx:80`). Changing market clears the cart (US-CART-016-WEB).

---

### US-MKT-006-MOB · Market chosen on the login screen sets market and language

**As a** customer **I want** to pick my market when I sign in **so that** prices, currency and language match where I am.

- Layer: MOB · Epic: MKT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-15 · Commit: a39eed8 · Release: v1.0.0

**Acceptance criteria**
1. The login screen defaults to US and shows five market buttons with a flag and a `btn-market-{code}` test id.
2. Login calls `selectMarket`, which calls `setCountry`.
3. `setCountry` sets the market's default language; CH keeps the DE or FR choice.

**Evidence**: `frontend-mobile/src/screens/LoginScreen.tsx:39-43` (market list), `:51` (default US), `:82` (`selectMarket`), `:174-190` (buttons; flag at 190); `frontend-mobile/src/features/country/useCases/selectMarket.ts:3-8` (calls `setCountry` at 7); `frontend-mobile/src/store/useAppStore.ts:101-107` (`setCountry`).
**Notes**: The mobile navbar's market selector was removed in a39eed8 (commit subject), so there is no in-app switcher.

---

### US-MKT-007-WEB · Currency shown in the market's locale

**As a** customer **I want** prices formatted the way my market writes them **so that** the amounts read naturally.

- Layer: WEB · Epic: MKT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: af157ce (`Intl.NumberFormat` in the catalog page first appears here)

**Acceptance criteria**
1. Each market has a locale: MX `es-MX`, US `en-US`, CH `de-CH` (or `fr-CH` when French is chosen), JP `ja-JP`, SA `ar-SA`.
2. Money is formatted with `Intl.NumberFormat` in the market currency; JPY has no decimals.
3. The customizer and checkout use the same formatting.

**Evidence**: `frontend/src/store.js:82-88` (locale table), `:135` (CH locale); `frontend/src/pages/Catalog.jsx:13-24` (`formatMoney`); `frontend/src/components/CartSidebar.jsx:24-36` (`format`); `frontend/src/components/PizzaCustomizerModal.jsx:30-44` (`formatMoney`); `frontend/src/pages/Checkout.jsx:64` (`formatMoney`).
**Notes**: The formatting is `Intl` behaviour; the exact output strings were not executed in this run.

---

### US-MKT-007-MOB · Currency formatting on mobile product cards

**As a** customer **I want** prices on the phone to read like prices on the web **so that** the two apps match.

- Layer: MOB · Epic: MKT · Persona: Customer · Market: all
- Status: Found
- Commit: b86ce69 (card prints the raw price)

**Acceptance criteria**
1. The product card prints the symbol and price concatenated, with no `Intl` and no fixed decimals. Example: Marinara (USD 12.49) in MXN is 219.2 and prints as "$219.2"; web uses two decimals.
2. The builder and checkout format non-JPY amounts with two decimals, so one pizza shows one decimal on the card and two in the builder.
3. `frontend-mobile/src/utils/currency.ts` (`formatCurrency`, hard-coded formats per country) has no importer at HEAD.

**Evidence**: `frontend-mobile/src/components/MobileProductCard.tsx:42` (raw `symbol` + `price`); `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:50-56` (`formatMoney`, `toFixed(2)`); `frontend-mobile/src/screens/CheckoutScreen.tsx:51-57` (`money`); `frontend-mobile/src/utils/currency.ts:1-16`; `git grep` for `formatCurrency` at HEAD (definition only).
**Notes**: Other MXN prices that print with one decimal on the card: p06 219.2, p07 and p10 289.4, p11 254.3 (computed from the base prices at 17.55, rounded to 2 decimals).

---

### US-MKT-008-UX · Arabic renders right-to-left, and only when it should

**As a** customer who chose Saudi Arabia **I want** the app to read right-to-left once I am signed in **so that** Arabic reads naturally, and the login screen stays readable in English.

- Layer: UX · Epic: MKT · Persona: Customer · Market: SA
- Status: Done
- Done on: 2026-07-09 · Commit: 65d79d0 (web RTL, SA market) and 069bc45 (mobile reactive RTL) · Release: v1.1.0 (mobile)

**Acceptance criteria**
1. Web: `document.documentElement.dir` is `rtl` only when the user is signed in and the language is Arabic.
2. Web: the login screen stays left-to-right, and logout returns the store to English.
3. Mobile: direction follows `language === "ar"` through `useRTL`, which sets text alignment, row order and writing direction per component.
4. Mobile: the native direction is fixed to left-to-right, so the layout flips from state without a reload.
5. Mobile: logout returns the app to English.

**Evidence**: `frontend/src/App.jsx:24-33` (dir and lang effect); `frontend/src/store.js:62-66` (logout resets language); `frontend-mobile/src/hooks/useRTL.ts:11-13,22-28` (hook and bidi note); `frontend-mobile/src/components/MobileProductCard.tsx:17`; `frontend-mobile/src/screens/CheckoutScreen.tsx:65`; `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:69`; `frontend-mobile/App.tsx:25-31` (rationale at 25-30; `I18nManager.allowRTL(false)` at 31); `frontend-mobile/src/store/useAppStore.ts:120-130` (logout language at 129).
**Notes**: Visual output was not inspected in this run; the evidence is static. `App.tsx:25-30` explains why the mobile app avoids `I18nManager.forceRTL`.

---

### US-MKT-009-UX · Market flags drawn as shapes, not emoji

**As a** customer **I want** a clear flag for each market **so that** I can tell the markets apart on every platform.

- Layer: UX · Epic: MKT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-09 · Commit: c5ac13e · Release: v1.1.0

**Acceptance criteria**
1. Web: `Flag` draws each market flag as inline SVG with `data-testid="flag-{CODE}"`.
2. Mobile: `Flag` draws the flag from React Native views with `testID` `flag-{CODE}`.
3. Web: an unknown code draws a neutral disc with the code instead of failing.
4. Flags appear on the login market buttons on both platforms.

**Evidence**: `frontend/src/components/Flag.jsx:3-13` (rationale and test id), `:90-107` (component; unknown-code branch at 95-100; test id at 107 and 133); `frontend-mobile/src/components/Flag.tsx:5-15` (rationale), `:89-106` (component; test id at 93); `frontend/src/pages/Login.jsx:219`; `frontend-mobile/src/screens/LoginScreen.tsx:190`.
**Notes**: The comments give the reason: regional-indicator emoji render as two letters on Windows and some Android devices. Mobile's behaviour for an unknown code was not verified.

---

### US-MKT-010-UX · Six locales share one key set per platform

**As a** QA engineer **I want** every locale to have the same keys **so that** a missing translation is caught instead of shown as a raw key.

- Layer: UX · Epic: MKT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-18 · Commit: afa1035 (i18n added); `ar` locale added in 65d79d0 (2026-07-09)

**Acceptance criteria**
1. Web: `en`, `es`, `de`, `fr`, `ja` and `ar` each have 171 keys with identical names (`frontend/src/i18n/locales/*.json`).
2. Mobile: each of the six locales has 165 keys with identical names (`frontend-mobile/src/i18n/locales/*.json`).
3. Web lookup falls back to English, then to the key itself.
4. Mobile lookup uses the same fallback chain.

**Evidence**: `frontend/src/i18n.js:19-22` (`useT`; fallback at 21); `frontend-mobile/src/i18n.ts:21-24` (`useT`; fallback at 23); locale files at HEAD (key counts measured by script: web 171, mobile 165).
**Notes**: Parity was measured with a script; translation quality was not reviewed. The platforms keep different key sets (web has `clearFilters`, mobile has `addPizza`), and each dictionary holds the keys its screens use.
</content>
