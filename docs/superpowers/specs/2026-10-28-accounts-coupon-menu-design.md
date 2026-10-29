# Temporary accounts, welcome coupon and menu expansion — design

Date: 2026-10-28 · Branch: `US-and-Improvements` · Status: the decisions below were approved by the owner on 2026-10-28; this document as a whole is awaiting final owner approval (see "Calls the designer made" for what is still open)

## Intent and why

OmniPizza is a QA sandbox that is also becoming a showcase of a traceable project. Today every session is one of 7 fixed test users and the menu is 12 pizzas. This change adds the shapes a real ordering product has, so there is more to automate and to track:

1. **Two new kinds of customer next to the 7 test users**: a **guest** (no account, same flow as today) and a **profiled** customer who creates a **temporary, non-persistent account** and receives a **single-use 15% welcome coupon** that lives as long as the account does.
2. **A bigger menu**: pizzas grow from 12 to 20, and the menu gains **6 soft drinks** and **10 desserts**.
3. **Traceability**: every piece of this is a user story created up front with status *Planned*, and **all documentation is updated after implementation**.

## Goals

- Registration, guest entry, logout-that-deletes, a coupon with real business rules (incl. negative flows), and drinks/desserts across API, web and mobile.
- Every existing automation contract keeps working (see Constraints).
- New behaviour is deterministic and testable: stable test ids, deep links, documented status codes, state kept per login `sid`.
- Stories (`documents/user-stories/`) exist as *Planned* before work starts, and flip to *Done* with the commit sha as they ship.

## Non-goals

- No persistence: nothing survives logout, JWT expiry or a backend restart.
- No email, password reset, email verification, real payments, admin tools, multiple coupons or coupon stacking.
- The 7 fixed test users and their chaos behaviours do not change.
- No market-specific menus (all 5 markets share one menu).
- No new chaos persona. Registered users and guests behave as `standard`.

## Anti-goals (failure even if it "works")

- Breaking the external harness (Atomic-Helix-Model-TS): login of the 7 users, existing endpoint paths and response shapes, `data-testid`/`testID`, `omnipizza://` deep links, required headers.
- Any account, coupon, cart, profile or order surviving where the rules say it must be gone.
- Brand names (in names, descriptions or images) for drinks.
- Silent coupon misuse: a coupon consumed by a failed checkout, or applied twice.

## Constraints

- Backend state lives only in `database.py::InMemoryDB`; profile and cart/market session are keyed by the per-login JWT `sid`, not by username. Orders are keyed by username.
- Required headers stay strict: `Authorization`, `X-Country-Code`, `X-Language`.
- Errors: HTTP exceptions use `{error, status_code, timestamp}`; body-validation failures are FastAPI's 422 `{detail:[...]}` (PRD §9). **API error messages are English.**
- Web is the base for parity: align mobile to web.
- Web protected pages are `React.lazy`; do not import a page from a component (breaks code-splitting).
- The repo is public; GitHub issues are created only after review (stories are markdown first).
- Verification tooling on this machine: Cypress cannot run; use the SSR/esbuild harness for web/mobile logic and `tests/` (vitest, restart the backend after every edit) for the API.

## Decisions (approved by the owner on 2026-10-28)

### Entry points and identity

- The Login screen keeps the 7 quick-login users unchanged and adds **"Continue as guest"** and **"Create account"**.
- **Guest**: no credentials. `POST /api/auth/guest` issues a temporary token; no coupon.
- **Profiled**: `POST /api/auth/register` with `username` (3–50), `password` (6–100), optional `full_name` (pre-fills the profile). The 7 test usernames are reserved. An active duplicate username → **409**. More than **200 concurrent temporary accounts** (guests + profiled) → **429** (the clients already map 429 to "Too many users").
- Both responses are the existing `LoginResponse` plus additive `profile_type` (`"test" | "guest" | "profiled"`; the 7 users report `"test"`), and for profiled a `coupon` object.
- A temporary account is **deleted on logout and when its JWT expires** (30 min, `settings.access_token_expire_minutes`). Deleting an account also deletes its `sid` state (session, cart, profile) **and its orders**, so a re-registered username never sees old orders.
- `POST /api/auth/logout` (auth required) is new: temporary accounts are deleted; for the 7 test users it only clears that login's `sid` state. Clients call it best-effort before clearing local state. The existing client-side `logout()` stays as is and is still used by the 401 path.
- `get_current_user` (`middleware.py`) must also resolve a token whose subject is a temporary account. **`POST /api/auth/login` does not authenticate temporary accounts**: logging in with a registered username answers 401 "Invalid username or password", exactly like an unknown user. The account *is* the session created by register/guest, so a second login can never split one account across several `sid`s. The password is validated at registration (length) and not stored.
- Expiry is enforced lazily (purge on registry access), no background thread.

### Registration language (owner question, answered)

The registration UI uses **the language of the selected market**, exactly like Login: it starts in English, switches when a market is chosen, CH keeps the DE/FR toggle and SA renders RTL. **API error messages stay English** (stable for assertions); the clients map known statuses (409 username taken, 429 too many users, 422 field errors) to localized copy.

### Welcome coupon

- Created at registration: 15%, code like `WELCOME15-XXXXXX`, shown in Profile and in the register response. `GET /api/users/me/coupon` returns it (404 for guests and test users).
- Entered in a **coupon field at checkout**. `POST /api/coupons/validate {code}` returns `{valid, percent}` so clients show the discount before placing.
- `CheckoutRequest` gains optional `coupon_code`. `OrderSummary` gains `discount` (0.0 when none) and `coupon_code` (null when none). `subtotal` stays the pre-discount items subtotal.
- Math (all rounded with the market's existing rounding): `discount = round(subtotal × 15%)`; taxable base = `subtotal − discount`; `tax` and `tip` are computed on the discounted subtotal; `total = discounted + delivery + tax + tip`. Delivery is never discounted. With no coupon every existing number is unchanged.
- Rules: unknown code or a code that is not the caller's own → **400** `Invalid coupon code` (same answer, so codes cannot be probed); already used → **409** `Coupon already used`; guests and test users sending any code → 400.
- **Lifetime (owner decision, 2026-10-28):** the coupon is **single-use and optional**. It stays `available` until it is used, for any order of the account, not only the first one. It never expires on its own: placing an order without it does not forfeit it. It disappears with the account (logout or JWT expiry), because the account is not persisted. There is no `expired` state.
- The coupon is consumed **only when the order is created** (a failed checkout consumes nothing) and is **not restored** if the order is cancelled.

### Menu

- `PIZZA_CATALOG` grows to 20 (`p13`–`p20`): Meat Lovers, Buffalo Chicken, Mexicana, Pesto Chicken, Burrata, Truffle Mushroom, Mediterranean, Vegan Garden. Same structure as today: `base_price`, `category` (popular | veggie | meat), `image`, `name`/`description` in en, es, de, fr, ja, ar. Arabic text has no pork or alcohol, like the current pizzas.
- **Drinks** (`dr01`–`dr06`, category `soda`): Cola, Lemon-Lime, Orange, Ginger Ale, Grape, Root Beer. One size (330 ml), USD 1.99–2.99, no brand names anywhere.
- **Desserts** (`ds01`–`ds10`, category `dessert`): Tiramisu, Panna Cotta, Cannoli, Gelato, NY Cheesecake, Brownie, Apple Pie, Churros, Tres Leches, Flan. One portion, USD 3.99–6.99, same menu in all 5 markets.
- `GET /api/pizzas` is unchanged apart from returning 20. New `GET /api/drinks` and `GET /api/desserts` use the same dependencies as `/api/pizzas` (headers, translation fallback, USD→market conversion and decimals, `apply_user_behavior`). `problem_user` ($0 + broken image) and `a11y_glitch_user` apply to the new items too.
- Cart/checkout lines gain `item_type` (`"pizza"` default | `"drink"` | `"dessert"`). `pizza_id` keeps carrying the product id for every type (legacy name); `product_id` is accepted as an alias and echoed. `size` and `toppings` are ignored (no upcharge) for non-pizza items. Quantity stays 1..10. Any combination of items is allowed; there is no minimum order. Same tax, tip and delivery rules for all item types.
- Images: Wikimedia Commons 500px thumbnails like the current pizzas, **each image reviewed by eye for logos**, with a credits file listing author and license (CC BY / CC BY-SA). The Android descriptive User-Agent already handled by `remoteImageSource` applies.

### Clients (web and mobile)

- Login: guest and create-account entries. Register screen/route (`/register`, `omnipizza://register`). **After a successful registration the client signs the user in and goes straight to the catalog** (web `/catalog`, mobile `Catalog` screen), where the coupon banner is shown (owner decision, 2026-10-28).
- Catalog: tabs **Pizzas | Drinks | Desserts**; drinks and desserts add straight to the cart (no builder). Deep link `omnipizza://catalog?section=drinks|desserts`.
- Cart, checkout and order summary list drinks/desserts; checkout has the coupon field and a discount line; order success shows the discount. Profile shows the coupon (profiled) or a "create an account for 15% off" prompt (guest).
- Logout calls the new endpoint first. Strings go into all 6 locale files of each client. New interactive elements get stable ids following the existing conventions (web `data-testid`, mobile `testID` with `btn-/input-/text-/view-` prefixes).
- Accessibility: labelled form fields, errors announced, RTL for SA, same contrast bar as the recent sweeps.

### Stories and documentation

- Stories for this work are written **now** as *Planned* (epics REG accounts & guest, PROMO coupon, MENU menu expansion, DOC documentation sweep), split by layer API | WEB | MOB | UX.
- **After implementation, all documentation is updated and checked against the code's values** (not by grep for stale phrases): PRD (users, personas, markets, endpoints table, error contract, test ids), `API_EXAMPLES.md`, `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md`, `README.md`, `QUICKSTART.md`, `PROJECT_SUMMARY.md`, `CLAUDE.md`, `docs/app-built.md`, `documents/Design_Doc.md`, `UI_Design_Doc.md`, `Tech_Stack_Doc.md`, the OpenAPI descriptions, the GitHub Pages landing page, and the story statuses.

## Base and delivery

- **Base branch: `US-and-Improvements`.** It already contains `origin/main` (merge `b09cfbb`, which brought `/api/version`) and today's 11 fixes (toppings in the cart, cart-sidebar fee, badges, mobile Edit, 401 handling, Delete Account, …). All implementation worktrees are cut from it.
- **Tooling gotcha:** worktrees created by the agent tooling's `isolation: worktree` are cut from `origin/main`, not from the current branch, so they would miss the fixes. Create implementation worktrees explicitly from the base, e.g. `git worktree add .worktrees/<name> -b <branch> US-and-Improvements` (`/.worktrees` is already gitignored).
- **Delivery:** the owner opens the PR to `main` later. Merging to `main` deploys the backend and web on Render. Nothing is pushed, merged to `main` or deployed, and **no mobile APK/simulator build is made, without the owner's explicit confirmation for that batch.** Mobile changes reach users only through a release the owner triggers.
- "Done with the commit sha" in the stories refers to commits on the base branch (shas are stable through a normal merge, not through a squash).

## Work plan (up to 5 git worktrees)

Wave 1 (parallel): **W1 menu backend** (new menu module + endpoints + `item_type` + golden/api tests); **W2 accounts backend** (registry, register/guest/logout, expiry, deletion of orders, coupon validate + totals — the totals change lands after W1 merges because both touch pricing); **W3 stories/docs** (Planned stories now, statuses later).
Wave 2 (after W1 and W2 contracts are merged): **W4 web**, **W5 mobile**. Then a final **documentation sweep** (reuse W3) and story status updates. Order of merge: W1 → W2 → W4/W5 → docs.

## Calls the designer made (owner to confirm or change)

- ~~"First purchase only" is implemented as: valid for the account's first order; forfeited if that order is placed without it.~~ **Overridden by the owner (2026-10-28):** the coupon is single-use and valid for any order while the account exists; see *Welcome coupon › Lifetime*.
- **After registration the client lands on the catalog** (owner decision, 2026-10-28), not on Profile or Login.
- `product_id` alias + `item_type`, with `pizza_id` kept as the universal field; ids `dr01..dr06`, `ds01..ds10`; categories `soda` / `dessert`.
- New endpoints `POST /api/auth/logout`, `GET /api/users/me/coupon`, `POST /api/coupons/validate`; status codes 400/409/429 as above; registration returns 201.
- Temporary accounts cannot be used with `POST /api/auth/login` (401); they only exist through the token returned by register/guest.
- Expiry enforced lazily; orders deleted with the account; logout of a test user clears only that login's `sid` state; cap of 200 counts guests and profiled together.
- Guests are real entries in the temporary registry (so `get_current_user` and cleanup are uniform) and have usernames like `guest_ab12cd34`.
- Coupon preview in clients goes through the validate endpoint, not client-side math.

## Contract details settled by the designer

(Raised by the story review; the builder should not have to guess. The owner can override any of them.)

- **Status codes:** `POST /api/auth/register` and `POST /api/auth/guest` → 201 with the `LoginResponse` shape; `POST /api/auth/logout` → 200 `{"status":"logged_out"}`; a missing or invalid token on logout → 401 like the other authenticated endpoints. Register, guest and logout do not need `X-Country-Code`/`X-Language` (same as login).
- **Usernames** are unique case-insensitively (the original spelling is kept for display); reserved test names are matched case-insensitively and answer the same 409 as a duplicate. English texts: 409 `Username already taken`, 429 `Too many users`.
- **`profile_type`** is returned by login/register/guest, by `GET /api/auth/profile`, and carried in the JWT, so clients can restore it after a reload. `GET /api/auth/users` still lists only the 7 test users.
- **Coupon object** = `{code, percent, status}` with `status` `available | used`. `GET /api/users/me/coupon` keeps answering 200 after use (`used`); 404 only for guests and test users.
- **`POST /api/coupons/validate`** → 200 `{valid: true, code, percent}`; failures use the same status and message as checkout (400 invalid, 409 used). The discount **amount** shown in the preview uses each client's rounding helper; the server's `OrderSummary` is authoritative. The client-vs-server rounding gap (US-CHK-014) was fixed on the base branch in `88cadbb` (half-up rule shared by `round_currency_amount` and the two `utils/rounding` helpers), so the preview and the server agree; the discount must go through the same helpers.
- **A cancelled order does not restore the coupon**: it is spent when the order is created. Guests and test users sending any `coupon_code` get 400 `Invalid coupon code`. The random 500 of `error_user`/`security_glitch_user` happens before the coupon is touched (those are test users, so they never carry a coupon anyway).
- **Unknown or mismatched item** (`item_type` drink/dessert with an id that is not in that menu) → 422 `Unknown product`; the lenient legacy behaviour for unknown *pizza* ids is left as is (tracked as *Found*).
- **Menu text:** "330 ml" is part of each drink's description, not a payload field; desserts have no portion field. English descriptions follow the existing style; Arabic text uses halal-safe wording like the current pizzas (beef/turkey variants, no pork); no dessert description mentions alcohol in any language.
- **Deep links / routes:** `omnipizza://register`, `omnipizza://catalog?section=drinks|desserts` (an unknown section falls back to pizzas); web equivalents `/register` and `/catalog?section=drinks|desserts`.
- **Image credits** live in `documents/image-credits.md` (item id, title, author, license, source URL).
- **Story layers:** API, WEB, MOB, UX; cross-cutting documentation stories use layer `ALL`. Personas (Customer, QA) are a field, not a layer.
- Profile for test users is unchanged (no coupon, no prompt).

## Left to the builder

Module and file layout (apart from keeping menu data out of `constants.py`/`database.py` hot spots where practical), exact Pydantic models, coupon code generation, the register/guest screen layouts within the existing visual style, copy wording per language (ja/ar to be reviewed by a native speaker), which Wikimedia images to pick, price points within the stated ranges, and test structure.
