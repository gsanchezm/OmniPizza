# OmniPizza Platform — Response to QA Bug Report (2026-05-22)

Thanks for the detailed report. We verified every item against the live code in `main` (commit `9deed6d`). Below is the per-item triage, what we shipped in this change, and what the test suite needs to adjust.

> TL;DR
> - **Shipped fixes (web + mobile):** `screen-*` wrappers on every web page, `category` field on `/api/pizzas` with web + mobile catalog filters now reading from it, new `GET`/`PATCH /api/users/me/profile` endpoints wired into the web AND mobile Profile screens.
> - **Test-side adjustments needed:** correct the `mobile-logout-btn` claim, drop the slug assumption on pizza ids, stop expecting a `/customizer` deep-link route, accept that proper-name pizzas are not translated.

---

## Triage by item

### P0 — Profile persistence (`/api/users/me/profile`)
**Status:** Feature gap → **shipped**.

The endpoints did not exist before today (only `GET /api/auth/profile`, which returns `{username, behavior, description}` and is not editable). The web `Save Changes` button only ran `window.alert(...)` and never round-tripped to the backend.

What we shipped:
- `GET /api/users/me/profile` → `200 UserProfileDetails { username, premium, full_name, phone, address, notes }`
- `PATCH /api/users/me/profile` → `200 UserProfileDetails`, accepts partial body `{ full_name?, phone?, address?, notes? }`
- Per-user storage in `InMemoryDB.user_profiles` (resets with the container, like everything else).
- Web `Profile` page now hydrates from `GET` on mount and the save button calls `PATCH`.

Caveat: profile state is **per-user, ephemeral**, by design — when the backend container restarts, every profile (and every order/cart) is wiped. The contract test should assume the profile starts empty after a deploy/restart.

### P0 — `[data-testid='screen-catalog']` wrapper
**Status:** Reasonable convention → **shipped**. Report contained a factual error.

We added `data-testid="screen-*"` to every page root:

| Route | Test id |
|---|---|
| `/` | `screen-login` |
| `/catalog` | `screen-catalog` (only after `GET /api/pizzas` resolves; loading/error states keep `catalog-loading` / `catalog-error`) |
| `/checkout` | `screen-checkout` (both the empty-cart and items-loaded views) |
| `/profile` | `screen-profile` |
| `/order-success` | `screen-order-success` |

**Heads up on the framing:** the report described this as adding a wrapper consistent with `screen-login` / `screen-checkout` / `screen-order-success` "which already exist". Worth double-checking against the live DOM — those ids did not exist before this change. The pre-existing convention was just `catalog-loading` / `catalog-error`. We treated this as "add a new page-wrapper convention across all five screens" rather than "patch one missing wrapper", which is what actually landed.

### P1 — Mobile logout button testid
**Status:** Not a bug — report is factually incorrect.

`frontend/src/components/Navbar.jsx`:
- Line 144 — desktop button: `<button data-testid="logout-btn" ...>`
- Line 232 — mobile menu button: `<button data-testid="mobile-logout-btn" ...>`

Both have lived in the file for some time. The mobile menu does have a distinct `mobile-logout-btn`. Please re-run the locator against the rendered DOM with the mobile menu open (it only mounts when `mobileOpen === true`, i.e. after clicking `mobile-menu-btn`) — that's the likely root cause of "can't find it".

### P1 — Category taxonomy
**Status:** Real contract gap → **shipped**. Test data needs to align.

- The frontend has always offered the categories: `all`, `popular`, `veggie`, `meat`, `sides` (`CategoryFilter.jsx`).
- The backend was not returning a `category` field at all, and the web was running a fragile keyword heuristic client-side. That is now removed.
- `GET /api/pizzas` now returns `category` per pizza using this canonical taxonomy:

| Bucket | Pizza ids |
|---|---|
| `popular` | p01 Margherita, p04 Four Cheese |
| `veggie`  | p05 Veggie, p06 Marinara, p11 Funghi |
| `meat`    | p02 Pepperoni, p03 Hawaiian, p07 Capricciosa, p08 Diavola, p09 Prosciutto, p10 Quattro Stagioni, p12 BBQ Chicken |
| `sides`   | (empty — there are no side items in the catalog yet) |

**Test-side adjustment needed:** the feature files use `classic`, `vegetarian`, `premium`. Those are not — and never have been — valid categories in OmniPizza. Update the examples to use `all` / `popular` / `veggie` / `meat`. Drop `CatalogDao.categoryOf(...)` name-heuristic and read `pizza.category` from the API response instead.

### P1 — Opaque pizza ids `p01`..`p12`
**Status:** Not a bug — intentional. Documentation only.

The ids `p01`..`p12` are **opaque** and **stable across markets and languages**. They are not slugs. They are not derived from the (localized) name. They are not promised to be human-readable.

The assumption that `Pepperoni` → `pepperoni` was never advertised by the API; the comment in `catalog.route.ts:339` is a test-side guess that turned out to be wrong. Treating ids as opaque is the right design — slug-style ids would couple us to English naming and would break across markets the moment marketing renames a pizza.

The contract is: **look up ids from the response, do not derive them.** We will not be changing this.

### P2 — `/customizer` deep-link route
**Status:** Not a bug — feature does not exist and was not planned.

`App.jsx` defines exactly five routes: `/`, `/catalog`, `/checkout`, `/profile`, `/order-success`. The pizza customizer is a **modal** (`PizzaCustomizerModal`) opened from `Catalog.jsx` (and also from `Checkout.jsx` for edits). There is no URL route, and the modal has no public URL anchor.

If the testing strategy needs a deterministic atomic entry into the customizer, that is a **feature request**, not a defect. The molecule's own comment (`pizzaBuilder-open.molecule.ts:42-44`) acknowledges this is "a TDD expectation". For now, the supported atomic path is: seed cart via `POST /api/cart`, navigate to `/catalog`, click `add-to-cart-p{id}-desktop` (or whatever resolves the card), and operate the modal. Happy to discuss adding `/customizer?item=...` as a sandboxed entry point if there is a clear automation need — please file it as a feature request and we'll scope it.

### Cross-cutting — pizza name localization
**Status:** Not a bug — intentional.

`Pepperoni`, `Marinara`, `Prosciutto`, `Diavola`, `Funghi`, `Capricciosa`, `Quattro Stagioni` are proper Italian names. They are intentionally left untranslated in every market (see `constants.py::PIZZA_CATALOG`). `Margherita`/`Margarita`, `Hawaiian`/`Hawaiana`/`Hawaii`, `Veggie`/`Vegetariana`/`Vegetarisch`/`Végétarienne`/`ベジタリアン` are common-noun pizzas and do get localized.

For test data: **use the `id` (p01..p12) as the cross-market join key.** Name strings will vary, and that is correct.

---

## What we are not changing

| Reported as | Why we are not changing it |
|---|---|
| `mobile-logout-btn` "wrong id" | The id exists. The selector is right; the test environment is the issue. |
| Pizza ids `p01..p12` should be slugs | Opaque ids are an intentional design choice. |
| `/customizer` deep-link missing | The customizer is a modal, not a route — by design. File as a feature request if needed. |
| Pepperoni / Marinara not translated in MX | Proper nouns are intentionally untranslated. |

## Action items for QA

- [ ] Switch `screen-catalog` / `screen-checkout` / `screen-login` / `screen-profile` / `screen-order-success` selectors on after deploy — they're now live.
- [ ] Update feature examples to use `popular` / `veggie` / `meat` (drop `classic` / `vegetarian` / `premium`); switch `CatalogDao` to read `pizza.category` from the API.
- [ ] Drop the slug-fallback id resolution in `CatalogRoute` / `PizzaBuilderDao` — ids are opaque, `p01..p12`. (You noted this is already self-corrected — confirming it's the right direction.)
- [ ] Remove the `/customizer` deep-link from `customize-pizza.feature` and route the builder scenarios through the catalog modal instead, or file a feature request if a deep-link is required.
- [ ] Re-check `mobile-logout-btn` against the rendered DOM with the responsive menu opened (click `mobile-menu-btn` first).
- [ ] Re-run the profile contract test against the deployed backend once this change is live. Expected: `200` on both endpoints; profile resets to empty values when the backend container restarts (by design — in-memory DB).

## What landed in OmniPizza

- `backend/constants.py` — `PIZZA_CATALOG[*].category` added (`popular` / `veggie` / `meat`).
- `backend/models.py` — `Pizza.category: str`, new `UserProfileDetails` + `UserProfileUpdate` models.
- `backend/database.py` — `InMemoryDB.user_profiles` plus `get_user_profile` / `update_user_profile`.
- `backend/main.py` — `GET` and `PATCH /api/users/me/profile`.
- `frontend/src/pages/{Login,Catalog,Checkout,Profile,OrderSuccess}.jsx` — `data-testid="screen-*"` on each page root.
- `frontend/src/pages/Catalog.jsx` — heuristic name-keyword filter replaced by `pizza.category` lookup.
- `frontend/src/features/profile/repositories/profileRepository.js` (new), `useCases/loadProfile.js` (new), `useCases/saveProfile.js` (rewired to call `PATCH`).
- `frontend/src/pages/Profile.jsx` — hydrates via `GET` on mount, save now persists through the backend.
- `frontend-mobile/src/types/api.ts` — `Pizza.category?: string` added (optional because cart-hydrated pizza objects in `CheckoutScreen` do not carry it; the catalog response always does).
- `frontend-mobile/src/screens/CatalogScreen.tsx` — heuristic name-keyword filter replaced by `pizza.category` lookup.
- `frontend-mobile/src/features/profile/repositories/profileRepository.ts` (new), `useCases/loadProfile.ts` (new), `useCases/saveProfile.ts` (rewired to call `PATCH`).
- `frontend-mobile/src/screens/ProfileScreen.tsx` — hydrates via `GET` on mount; save now persists through the backend and surfaces server errors via `Alert`.

> Mobile note: the existing `screen-catalog` and `screen-profile` testIDs on the mobile screens are already in place (set as `testID` + `accessibilityLabel` on the root SafeAreaView/View). No new mobile testIDs were added in this change.
