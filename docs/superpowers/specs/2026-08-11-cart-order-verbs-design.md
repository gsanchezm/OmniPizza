# OmniPizza — PUT/PATCH/DELETE Verb Expansion (Cart Items & Order Cancellation) — Design

**Date:** 2026-08-11
**Status:** Approved
**Author:** Claude (brainstorming session "omnipizza")

## 1. Context

The API today is overwhelmingly GET/POST, with a single existing exception
(`PATCH /api/users/me/profile`). The owner wants broader REST verb coverage —
specifically PUT, PATCH, DELETE — and asked separately about adding a
persistence layer that survives... but wipes every "session."

Investigation found the persistence question already answered by the current
design: `InMemoryDB` (a Python dict) already persists for exactly the process
lifetime and wipes on exactly server restart/redeploy, at $0 cost, which is
identical to the trigger the owner confirmed they want. Migrating to SQLite
with the same wipe trigger would change zero observable behavior while
rewriting `database.py` and every router — real regression risk (sid-keyed
profile isolation, atomic entrypoints the external `Atomic-Helix-Model-TS`
harness depends on) for no functional gain. **Decision: keep `InMemoryDB`
as-is.** All effort goes into the verb expansion.

## 2. Decisions locked with the owner

| # | Topic | Decision |
|---|-------|----------|
| 1 | Persistence engine | **No migration.** Stay on `InMemoryDB`; the dict already does what was asked for, for free. |
| 2 | Verb scope | Cart items (PUT + DELETE, per-line) and Orders (PATCH, cancel-only). No profile DELETE (low value, already covered by `POST /api/session/reset`). No order DELETE (cancellation is a status change, not a removal — cancelled orders must stay visible in history). |
| 3 | Order cancellation guard | Only orders with `status == "pending"` can be cancelled; anything else is a **409 Conflict**, not 400. |
| 4 | Cart session identity | Move the whole test session record (`market` + `cart_items`, currently keyed by `username`) to keyed-by-`session_id` (the JWT `sid` claim) — same pattern the editable profile already uses since the 2026-07-17 race-condition fix. |
| 5 | Documentation | Update README.md **and** `index.html` (the GitHub Pages landing page) — both independently document the session-setup endpoint list and need to stay in sync. |
| 6 | Implementation process | Use git worktrees to parallelize independent tracks of work. |

## 3. Why the cart-identity migration is in scope

With per-line PUT/DELETE, two parallel login sessions for the same shared test
user (e.g. two market scenarios both authenticating as `standard_user` at the
same time — a realistic pattern for parallel E2E suites) share one
`username`-keyed cart today. A `DELETE` fired by one scenario could silently
remove a line the other scenario just seeded, non-deterministically. The
existing `POST /api/cart` (whole-cart replace) is immune to this — last
writer wins, no partial mutation — but the new line-level verbs are not.

**Verified this doesn't break the documented atomic entrypoints:**
- Web (`ATOMIC_WEB_TESTING.md` pattern): Playwright seeds via `POST /api/cart`
  then navigates to `/checkout`, which reads `GET /api/cart` — both calls
  already require the *same* bearer token, hence the same `sid`.
- Mobile (`useDeepLinkParams.ts`): `accessToken=<jwt>` is set into the store
  *before* `hydrateCart=true` clears the local cart, so the same token drives
  both the seed and the hydration read.

Both known atomic paths already reuse one token across seed+read, so moving
the keying to `session_id` changes nothing observable for them — it only
closes the parallel-session gap.

## 4. Data model changes (`backend/models.py`)

- `CartItem` gains `item_id: Optional[str] = None`. If the client supplies it
  in `POST /api/cart`, it's kept (lets a harness seed and know the id in one
  call, no round trip); if omitted, the server generates `ITEM-XXXXXXXX`
  (8 hex chars, same shape as `ORDER-XXXXXXXX`).
- `EnrichedCartItem` gains `item_id` (so `GET /api/cart` exposes it).
- `TestSessionStateResponse.cart_items` (typed `List[CartItem]`) picks up
  `item_id` automatically once `CartItem` has the field.
- `OrderSummary` gains `status: str`. Already stored internally
  (`db.create_order` sets `"pending"`); just wasn't exposed. Verified against
  `tests/golden.test.ts`, `tests/api.test.ts`, and `test_contract.py` — no
  test does a strict full-shape match on `OrderSummary` or the cart response,
  only sub-object matches (e.g. `customer_info`). This is a safe additive
  field.

## 5. Session-identity migration (`backend/database.py`, `backend/test_api.py`)

`InMemoryDB.sessions` moves from keyed-by-`username` to keyed-by-`session_id`:

- `_ensure_session`, `set_test_market`, `set_test_cart`, `reset_test_session`,
  `get_test_session` all take `session_id` instead of `username`.
- `test_api.py` call sites switch from `current_user["username"]` to
  `current_user["session_id"]` for these calls — `current_user["session_id"]`
  already exists (minted by `get_current_user`, used today for profile calls).
- Response bodies still show `username` (from `current_user["username"]`
  directly, not from the stored record) — no visible API change to existing
  fields.
- `set_test_cart` assigns `item_id` per line at write time if the client
  didn't supply one.
- New `database.py` methods: `upsert_cart_item(session_id, item_id, item)` and
  `remove_cart_item(session_id, item_id)`.
- `POST /api/store/market` and `POST /api/cart` docstrings update from
  "per-user" to "per-login-session."

**Not changing:** `db.orders` stays keyed by `username` — orders have a
globally unique `order_id`, so there's no shared-mutable-container risk
analogous to the cart.

## 6. New endpoints — contract

**`PUT /api/cart/items/{item_id}`** (tag `Cart`, `test_api.py`, `get_current_user`, no `X-Country-Code`)
Body: `CartItem` shape (`pizza_id`, `quantity`, `size`, `toppings`). Upsert —
if `item_id` doesn't exist in the caller's session, it's created; if it does,
it's fully replaced. Any `item_id` in the body is ignored; the URL is
authoritative. Returns `TestSessionStateResponse`. Always 200.

(Reusing `CartItem` here rather than a separate request model means its
`item_id` field is meaningful in `POST /api/cart` — respected if present —
but ignored in this endpoint's body. One shared model, deliberately, over a
near-duplicate type just to drop one field.)

**`DELETE /api/cart/items/{item_id}`** (tag `Cart`, same deps)
Removes the line. Returns `TestSessionStateResponse`. 404 if `item_id` isn't
in the caller's session.

**`PATCH /api/orders/{order_id}`** (tag `Orders`, `routers/checkout.py`, `get_current_user`)
Body: `{"status": "cancelled"}` (only valid value — no generic state machine).
Order of checks:
1. 404 if order doesn't exist
2. 403 if not owned — **except** `security_glitch_user`, which keeps the same
   deliberate IDOR bypass `GET /api/orders/{id}` already has
3. 409 if current `status != "pending"` ("Order already {status}, cannot cancel")
4. 200 with updated `OrderSummary` (`status="cancelled"`)

Deliberately **not** using `apply_user_behavior` — matches the sibling
`GET /api/orders*` endpoints (no `performance_glitch` delay, no chaos 500).
Only the security_glitch ownership bypass is preserved, since that's
documented as a deliberate feature of that specific user, not of the
dependency used.

## 7. Documentation — full inventory

Traced every file that enumerates these endpoints via grep across `*.md` and
`*.html`, then classified each as living (tracks current API surface) or
historical (frozen point-in-time record).

**Must update (living):**

| File | What changes |
|---|---|
| `README.md` | `### Session Setup Endpoints` list + note on session-per-login (not per-username) |
| `index.html` | `#api-docs` → "Session Setup Routes" code block (this **is** the GitHub Pages source — confirmed no separate `_config.yml`/`gh-pages` branch/Pages workflow exists, so this file at repo root is the page itself) |
| `API_EXAMPLES.md` | New curl examples for PUT/DELETE cart item + PATCH order, alongside existing session-endpoint examples |
| `CLAUDE.md` | Cart/session keying bullet (already username-based per current text — corrected to session_id) |
| `tests/README.md` | Endpoint parenthetical + "What is Tested" table (see §8 — cart items stay in the "external harness" bucket, PATCH order joins the internal-suite bucket) |
| `PROJECT_SUMMARY.md` | Endpoint count ("15+" → updated) + the two spots listing cart/session endpoints |
| `QUICKSTART.md` | Orders endpoint list gains PATCH |
| `documents/Product_Requirement_Doc.md` | §6.7.1 Cart API, §6.10 Orders and Access Control, and the endpoint auth/error table |
| `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md` | Brief mention only — new item-level verbs exist as an option; these docs stay focused on the whole-cart hydration pattern, which is unchanged |

**Explicitly out of scope (historical/frozen — do not touch):**
`documents/paper/**` (active snapshot-freeze per prior decision — touching
any file here needs its own separate check), `documents/explanation/
EXPLANATION_qa_report_*.md` (point-in-time QA triage records),
`documents/plans/2026-07-12-*.md`, `documents/specs/2026-07-12-*.md`,
`.superpowers/sdd/*.md` (frozen historical plans/task records),
`VALIDATION_CHECKLIST.md` (a one-time "we validated this build" checklist,
not a living spec). `documents/Design_Doc.md`, `documents/Tech_Stack_Doc.md`,
`documents/UI_Design_Doc.md`, `docs/app-built.md` checked and contain nothing
endpoint-specific to update.

## 8. Test plan (corrected against the existing documented boundary)

`tests/README.md` explicitly states the internal Vitest suite does **not**
call session-setup endpoints (`/api/store/market`, `/api/cart`, `/api/session*`)
directly — that's the external harness's job. The new cart-item endpoints are
part of that same family (`test_api.py`), so they follow the same rule:

- **Cart PUT/DELETE:** no hand-written Vitest cases. Coverage comes from the
  schema-driven Schemathesis contract test (`test_api_contract` in
  `test_contract.py`, unfiltered `@schema.parametrize()`), which already
  auto-generates cases against every path in the live OpenAPI schema — new
  endpoints are picked up with no code change. `tests/README.md`'s endpoint
  parenthetical is extended to name the two new routes so the boundary stays
  accurate and explicit rather than silently stale.
- **Order PATCH:** hand-written Vitest cases, because `GET /api/orders*` is
  already inside the internal suite's scope (it's "real" business logic, not
  atomic test setup). New cases in `tests/api.test.ts`: cancel a pending
  order (200, `status: "cancelled"`); cancel an already-cancelled order (409);
  cancel someone else's order as a non-`security_glitch` user (403); cancel
  as `security_glitch_user` (bypasses ownership, matches existing IDOR
  pattern); cancel an unknown `order_id` (404).
- **Regression check for the sid migration:** two logins as `standard_user`
  seeding different carts must not observe each other's items. This is core
  business-logic correctness (not atomic-setup mechanics), so it gets one
  hand-written Vitest case despite touching `/api/cart` — flagging this as
  the one deliberate exception to the boundary above, since it's the
  regression test for §3's actual bug, not a test of the atomic-setup
  mechanism itself.

## 9. Implementation strategy — worktrees

Two independently-mergeable code tracks (no file overlap beyond
non-conflicting additions to shared files) plus a documentation track that
only depends on the contract already fixed in §6, not on the code landing
first:

| Track | Worktree | Files | Content |
|---|---|---|---|
| **A — Cart** | `../omnipizza-cart-items` | `models.py` (CartItem/EnrichedCartItem), `database.py` (session methods), `test_api.py` (PUT/DELETE + sid migration) | item_id, upsert/delete, username→sid migration |
| **B — Orders** | `../omnipizza-order-cancel` | `models.py` (OrderSummary), `database.py` (cancel logic), `routers/checkout.py` (PATCH) | status field, pending→cancelled transition |
| **C — Docs** | `../omnipizza-verb-docs` | The 9 files in §7 | Written directly from this spec's §6 contract |

`models.py` and `database.py` are touched by both A and B, but in disjoint
classes/methods — low merge-conflict risk, ordinary `git merge` handles it.

**Not parallelizable:** running the backend + full test suite
(`fileParallelism:false`, shared in-memory state per existing test-run
convention) against the *integrated* result. That's a sequential step after
A + B are merged together, and Track C's doc claims get spot-checked against
the merged code at the same time (implementation may have deviated from spec
during coding).

## 10. Non-goals (explicit)

- No persistence engine change (§1)
- No `DELETE /api/orders/{id}`
- No `DELETE /api/users/me/profile`
- No generic order status state machine — only `pending → cancelled`
- No frontend/mobile UI wiring — these remain backend/automation-surface
  endpoints, like the rest of `test_api.py`
- No TTL/cleanup for orphaned `session_id`-keyed records — matches the
  existing accepted behavior for profile records (garbage until process
  restart, acceptable for a QA sandbox)
- No touching `documents/paper/**` (separate active decision, out of scope here)
