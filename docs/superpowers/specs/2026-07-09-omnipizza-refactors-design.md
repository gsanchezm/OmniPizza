# OmniPizza — Multi-Workstream Refactor Design

**Date:** 2026-07-09
**Status:** Draft for review
**Author:** Claude (brainstorming session "omnipizza")

## 1. Context

OmniPizza is a deliberately-shaped QA testing sandbox (FastAPI backend, React/Vite web,
Expo/React Native mobile, external test suite). This design covers six independent workstreams
requested by the owner. Each ships as its own focused commit/PR in the order below.

The design is grounded in a full codebase exploration (2026-07-09). All file:line references
were read from the live repo. The Profile bug was **reproduced empirically against the live
Render deployment**, not inferred from code.

## 2. Decisions locked with the owner

| # | Topic | Decision |
|---|-------|----------|
| 2 | Profile "save" | **Keep persistence, fix the cross-session leak** (isolate per session). Supersedes the original "only emulate" phrasing. |
| 7 | Arabic | **Full RTL** — web `dir="rtl"`, mobile `I18nManager` + mirrored logical styles. |
| 6 | Flags | **Local flag assets** per market — SVG on web, PNG on mobile (avoids a native dep); offline, deterministic on Windows/iOS/Android/web. |
| 1 | Widgets | **Core set of 5**: country/language dropdown, pre-order confirmation modal, add-to-cart toast, tip tooltip, order-success accordion. |

## 3. Delivery order (one commit/PR each)

1. **A — Profile leak fix** (backend + web + mobile). Real bug, small, verifiable.
2. **B — Real flags** (SVG assets, web + mobile).
3. **C — Mobile overflow fixes** (guided by the audit).
4. **D — Automation widgets** (core 5, web + mobile).
5. **E — Saudi Arabia + Arabic + full RTL** (backend + web + mobile).
6. **F — Docs + localStorage sourcing** (last, so it reflects everything above).

RTL (E) intentionally comes after the widgets and overflow work so the new widgets and the
overflow fixes are authored RTL-aware once and don't need a second pass.

---

## 4. Workstream A — Profile leak fix

### Problem (reproduced live)
The profile is per-user mutable state keyed by `username` in `backend/database.py`
(`self.user_profiles: Dict[str, Dict]`, `update_user_profile` at ~L61). Reproduction against
`https://omnipizza-backend.onrender.com`:

- Session A `PATCH /api/users/me/profile` with `full_name:"田中太郎"`, `notes:"配達は玄関に置いてください"`.
- Session B (brand-new `POST /api/auth/login`, new token, same shared `standard_user`)
  `GET /api/users/me/profile` → **returned the same Japanese data.**

So "always Japanese on Save" is **leaked field data** from a prior JP-market tester, not the
localized success toast. The backend's own `reset_user_profile` docstring already documents this
as a defect ("any save by any session leaks into the next render").

### Fix — isolate the profile per session
Session boundary = login. On `POST /api/auth/login`, reset that user's profile to deterministic
defaults, so:

- **Within a login-session:** saves persist; `GET` returns saved data. (Persistence preserved — the owner's requirement.)
- **A new login (new session):** profile starts clean. (Leak closed.)

**Backend changes:**
- `backend/main.py` login handler → call `db.reset_user_profile(username)` on successful login.
- `backend/database.py::reset_user_profile` → confirm it resets to deterministic defaults
  (empty strings + `premium` flag as today). Keep the method; wire it in.
- The atomic test-state reset endpoints (`test_api.py` session reset) should also reset the
  profile so seeded sessions start clean.

**Web changes (`frontend/`):**
- `store.js` — `logout()` must also clear the persisted `omnipizza-profile` key so a stale
  profile can't survive a logout in the same browser. On login, re-hydrate profile from `GET`
  (overwrite local store). Persistence otherwise stays (owner wants it).

**Mobile changes (`frontend-mobile/`):**
- `useAppStore` is already ephemeral (no persistence) and `logout` clears profile — verify
  `setToken`/login path refetches a clean profile. Likely no change beyond confirmation.

### Verification
- Re-run the exact live reproduction: after the fix, Session B's `GET` must return clean
  defaults, not Session A's Japanese.
- Add a backend test in `tests/api.test.ts`: login → PATCH Japanese → login again → GET returns clean.

### Note on the success toast
The toast (`t('profileSaved')` → `プロフィールを保存しました` under JP) is **correct i18n** and is
left as-is, per the "keep persistence" decision (owner did not pick "always English"). If leaked
data was the whole complaint, this is already resolved by the leak fix.

---

## 5. Workstream B — Real country flags

### Problem
No flag asset or flag library exists. Flags are Unicode regional-indicator emoji (`🇺🇸` etc.)
inside a CSS/RN circle. On Windows (Chrome/Edge/RN) there are no flag glyphs, so the browser
renders the two component letters → the reported "circle with MX/US/CH/JP".

Locations: `frontend/src/pages/Login.jsx:169-192` (`market-{code}`),
`frontend/src/pages/Catalog.jsx:13-18` (`MARKET_OPTIONS`, currently unused),
`frontend-mobile/src/screens/LoginScreen.tsx:35-40,161-178`,
`frontend-mobile/src/components/LocationHeader.tsx` / `CustomNavbar.tsx`.

### Fix — bundle local round-flag SVGs
- Add small round-flag assets per market under `frontend/src/assets/flags/` (SVG) and
  `frontend-mobile/assets/flags/` (SVG via `react-native-svg` **or** PNG @1x/@2x/@3x if we
  avoid adding a dependency). Decision: prefer **PNG** on mobile to avoid a new native dep;
  **SVG** (inline or `<img>`) on web.
- Create a single source-of-truth flag map keyed by country code so all call sites share it:
  - Web: a `Flag` component (`frontend/src/components/Flag.jsx`) → renders `<img src=… alt=code>`,
    keeps the circular frame, `data-testid="flag-{code}"`.
  - Mobile: a `Flag` component (`frontend-mobile/src/components/Flag.tsx`) → `<Image>` with
    `getTestProps("flag-{code}")`.
- Replace emoji at every call site with `<Flag code=… />`. Keep existing `market-{code}` testids.
- Includes the `SA` flag from the start (workstream E depends on it).

### Verification
- Screenshot the web Login market selector on the live/local build → real flags, not letters.

---

## 6. Workstream C — Mobile overflow fixes

Guided by the overflow audit. Apply `numberOfLines` + `ellipsizeMode="tail"` (or `flexShrink`,
`minWidth:0`) to the confirmed hotspots. German strings (e.g. `"PREMIUM-MITGLIED"`,
`"Änderungen speichern"`, `"KONTAKTINFORMATIONEN"`) and the upcoming Arabic are the drivers.

Hotspots (file:line):
- `ProfileScreen.tsx` — username+badge row (`88/251/256/264`), Save/Cancel/Delete buttons (`177/340/350/360`).
- `PizzaBuilderScreen.tsx` — fixed-width topping cards (`316/508/536`), header title (`183/394`),
  size pills (`472/483`), section header + bottom bar (`450/583/597`).
- `CheckoutScreen.tsx` — uppercase section titles + field labels (`726/946`), cost rows (`847/852`),
  payment labels (`786/791`), place-order button (`700/937`).
- `BottomNavBar.tsx` — 4 equal tabs, long labels (`70/106`).
- `MobileProductCard.tsx` — price vs fixed add button (`99/105/110`).
- `PizzaCard.tsx` — name has no `numberOfLines` (`35/62`).
- `OrderSuccessScreen.tsx` — `statusTitle` gap (`76/268`).

Pattern used as reference (already correct): `OrderSuccessScreen.tsx`, `CustomNavbar.tsx`
(`numberOfLines={1}`, `flexShrink:0`, `minWidth:0`).

Where a style is touched, physical props (`marginLeft/Right`, `textAlign:'left'`) are converted
to logical props (`marginStart/End`) in preparation for RTL (workstream E).

### Verification
- Render each screen at a small width with German active; confirm no clipping/collision.

---

## 7. Workstream D — Automation widgets (core 5)

The app is poor in element types: no real `<select>`, no toast, no tooltip, no accordion, and
no modal at all on mobile (only `Alert.alert`). Each widget teaches a distinct automation
technique and lives in a **natural home** (no fake screens). All follow existing testid
conventions: mobile via `qa.ts` (`getTestProps` / `getReadableTextProps`), web via `data-testid`
+ `tid()` where a desktop/responsive split is needed.

| Widget | Web home | Mobile home | Key testids |
|--------|----------|-------------|-------------|
| **Country/Language dropdown** | Navbar/Catalog (`Catalog.jsx:13` `MARKET_OPTIONS` already declared, unused) → `setCountryCode` | `LocationHeader.tsx` / header → `setCountry`/`setLanguage` | `market-dropdown`, `market-option-{code}`, `lang-dropdown`, `lang-option-{code}` |
| **Confirmation modal (pre-order)** | intercept `place-order-btn` (`Checkout.jsx:1068`) | wrap `btn-place-order` (`CheckoutScreen.tsx:694`) — first real RN `Modal` | `confirm-order-modal`, `confirm-order-yes`, `confirm-order-cancel` |
| **Toast on add-to-cart** | `Catalog.jsx:69` / `confirm-add-to-cart` | `PizzaBuilderScreen.tsx:121` / `btn-add-pizza-{id}` | `toast`, `toast-message` (role/status) |
| **Tooltip on tip info** | tip block `Checkout.jsx:1022` (ℹ️) | `CheckoutScreen.tsx:623` (`icon-tip-info`) | `tip-tooltip` |
| **Accordion on Order Success** | replace static placeholder `OrderSuccess.jsx:123` | `OrderSuccessScreen.tsx:128` (`btn-order-details` caret) | `order-details-toggle`, `order-details-panel` |

Implementation notes:
- No UI library exists in either app. Build hand-rolled, matching the existing custom modal
  pattern (`PizzaCustomizerModal.jsx` = `position:fixed inset-0 z-[9999]`) on web and RN
  `Modal`/`Pressable` on mobile. (A library could be added, but hand-rolled keeps deps flat and
  the DOM predictable for automation — chosen.)
- Web dropdown = accessible custom listbox (button + `role="listbox"`/`option`, keyboard nav)
  so both "native-select" and "custom-widget" automation styles are demonstrable. Optionally
  also expose one real `<select>` somewhere for contrast (e.g. an address-type select) — TBD,
  not in the core 5.
- Toast auto-dismisses (~3s) and is also manually dismissible, to exercise both timing-based
  and explicit-wait strategies.
- All new widgets authored RTL-aware (logical props) since E follows.

### Verification
- Web: add Cypress component tests for the dropdown, modal, toast (repo already runs Cypress CT).
- Mobile: exercise via a Detox/manual pass; confirm testids resolve on Android (content-desc +
  resource-id via `qa.ts`) and iOS.

---

## 8. Workstream E — Saudi Arabia (SA) + Arabic (ar) + full RTL

### 8a. New market data (proposed values — confirm/adjust)

| Field | Value |
|-------|-------|
| Country code | `SA` |
| Currency | `SAR`, symbol `ر.س`, 2 decimals |
| `CURRENCY_RATES["SAR"]` | `3.75` (USD-pegged) |
| Tax rate | `0.15` (Saudi VAT 15%) |
| Delivery fee | `delivery_fee_usd: 2.0` (consistent with others) |
| Required address field | `district` (Arabic label `الحي`) — mirrors MX `colonia` |
| Tip field name | `baksheesh` (Arabic label `بقشيش`) |
| Tip percentages | `[0, 5, 10, 15]` |
| Language(s) | `["ar"]` |

### 8b. Blast radius (from exploration — complete file list)

**Backend:**
- `constants.py` — add `CountryCode.SA`, `COUNTRY_CONFIG[SA]`, `CURRENCY_RATES["SAR"]`,
  and `ar` keys in `PIZZA_CATALOG` name/description dicts (or rely on `en` fallback).
- `database.py` — add `"SA":"ar"` to both `default_lang` maps (~L144, ~L199).
- `main.py` — checkout branch to persist `district`; docstrings.
- `middleware.py` — update the two hardcoded `"Valid values: MX, US, CH, JP"` strings.
- `models.py` — add `district`/`baksheesh` optional fields; adjust zip validator if needed.

**Web:**
- `store.js` — `MARKET`, `DEFAULT_LANG_BY_MARKET`.
- `Login.jsx` market button list, `Catalog.jsx` `MARKET_OPTIONS`, `money.js` (SAR = 2 decimals),
  `buildCheckoutPayload.js` (`district` + `baksheesh`), `Checkout.jsx` field block + inline
  `ar` translation keys.
- `i18n.js` + new `frontend/src/i18n/locales/ar.json`.

**Mobile:**
- `useAppStore.ts` — extend `CountryCode`/`LanguageCode` unions, `MARKET_LANG`.
- `LoginScreen.tsx` (`MARKETS` + selected type), `LocationHeader.tsx`/`CustomNavbar.tsx` labels,
  `currency.ts` (SAR case), `buildCheckoutPayload.ts`, `validateCheckoutForm.ts`,
  `CheckoutScreen.tsx` (field UI + fallback tax `0.15`/fee at L168/174), `types/api.ts`.
- `i18n.ts` + new `frontend-mobile/src/i18n/locales/ar.json`.

**Repo tests/docs:** `tests/api.test.ts` (+SA checkout case), `README`, `CLAUDE.md` market list.

### 8c. Full RTL

**Web:**
- Set `document.documentElement.dir = 'rtl'` and `lang='ar'` when `language==='ar'`, else `'ltr'`
  (a small effect driven by the country store). Native browser flipping handles most flex/text;
  fix any hardcoded physical spacing that breaks. Use Tailwind `rtl:` variants / logical classes
  where needed.

**Mobile:**
- Use `I18nManager.allowRTL(true)` + `forceRTL(true/false)` based on the active language at app
  startup. **Known constraint:** toggling RTL at runtime requires an app reload to fully apply
  (`expo-updates` `reloadAsync` or `DevSettings.reload`); switching to/from Arabic triggers a
  reload with a brief notice. Convert remaining hardcoded `marginLeft/Right`, `left/right`,
  `textAlign:'left'` to logical `start/end` so layout mirrors. Header language toggles
  (currently DE/FR-only) generalized to include `ar`.

### Verification
- Backend: `GET /api/countries` returns SA with SAR/15%/`district`; `POST /api/checkout` for SA
  persists `district` + `baksheesh` and computes SAR totals.
- Web: select SA → Arabic UI, RTL layout, real SA flag, correct currency.
- Mobile: same, with the reload note honored.

---

## 9. Workstream F — Docs + localStorage sourcing

### Goal
Make it unambiguous where every seeded client-state value comes from, so AI-generated
Playwright/Appium tests (like the pasted `setup()` snippet) are correct.

### Fixes to existing docs
`ATOMIC_WEB_TESTING.md`:
- Complete the localStorage key table — add the missing real keys: flat `token`, flat `username`,
  `chLang`, `omnipizza-release`, `omnipizza-profile`, `omnipizza-order`.
- Fix the reset snippet (currently leaves flat `token`/`username`, which rehydrates
  `useAuthStore` → app still looks logged in). A correct reset also removes `token`, `username`,
  `omnipizza-country`, `omnipizza-profile`, `chLang`.
- Document the `omnipizza-release` / `VITE_APP_RELEASE` gotcha: on mismatch the app wipes
  `omnipizza-auth` + flat token/username on load, silently breaking a seeded session — so tests
  should also seed `omnipizza-release`.
- Document that `X-Country-Code`/`X-Language` come from **store state** (rehydrated
  `omnipizza-country`), not the flat `countryCode` key directly, and that `Authorization` is
  attached only if the token passes `isLikelyJwt` (3 dot-separated segments).

`ATOMIC_MOBILE_TESTING.md`:
- Fix `lang` examples: only `de|fr` reach `setLanguage`; `ja/es/en` are silently ignored (market
  default sets language). Correct the misleading `lang=ja/es/en` examples.
- Note `orderId` is processed on any deep-link URL (not route-scoped).
- Document `detoxCountryCode` (Detox launch-arg override).
- Document the `customizer`/`item` → `pizza-builder` alias and the `language` alias for `lang`.
- Note mobile default market is `US` vs web `MX`.

### New authoritative section
Add a **"Client-State Sourcing"** reference (table: key → persisted shape → written by (file:line)
→ read by) for web and mobile, plus a **line-by-line annotation of the pasted `setup()` snippet**
tying each `localStorage.setItem` to the exact store/persist config it mirrors
(`omnipizza-auth` ← `useAuthStore` persist; `omnipizza-country` ← `useCountryStore` persist; flat
mirrors ← `login()`/`setCountryCode`). Include the corrected reset recipe.

### Other docs
- `API_EXAMPLES.md` — add SA examples; verify existing examples against current endpoints.
- `README.md`, `CLAUDE.md` — update market list (MX/US/CH/JP → +SA), mention Arabic/RTL and the
  new widgets.

---

## 10. Testing & verification strategy (overall)

- **Profile (A):** live before/after reproduction + a `tests/api.test.ts` case.
- **Flags (B):** screenshot verification.
- **Overflow (C):** small-width render with German active.
- **Widgets (D):** Cypress component tests (web) + testid resolution check (mobile).
- **SA/RTL (E):** API checks for SA config/checkout; UI check of Arabic + RTL + flag + currency.
- **Docs (F):** every documented key/param re-checked against code (the doc is only useful if exact).
- Follow the repo's Conventional Commits (`fix:`, `feat:`, `docs:`, `refactor:`).

## 11. Open questions / defaults (non-blocking)

1. **SA config values (§8a)** — proposed defaults (SAR, symbol `ر.س`, VAT 15%, required
   `district`, tip `baksheesh`). Confirm or adjust; I'll proceed with these if no change.
2. **Mobile RTL reload** — accepted as a known constraint of `I18nManager`. If a no-reload
   experience is required, we'd fall back to per-component RTL styling only (less authentic).
3. **Extra `<select>` for contrast** — optional real native `<select>` (address-type) in addition
   to the custom dropdown, to demo both. Default: skip unless wanted.
4. **Profile "emulate-only" reversal** — the original goal text said "only emulate, don't save";
   the locked decision is "keep persistence, fix leak". If pure emulation (no PATCH at all) is
   actually wanted, say so and A changes to stubbing the network call.
