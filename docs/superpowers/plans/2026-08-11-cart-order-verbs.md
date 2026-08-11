# Cart Item CRUD & Order Cancellation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `PUT`/`DELETE /api/cart/items/{item_id}` and `PATCH /api/orders/{order_id}` to the API, fix the shared-cart race this exposes by moving the test session (market + cart) from `username`-keying to `session_id`-keying, and bring every living doc that enumerates these endpoints back in sync.

**Architecture:** No storage engine change — everything builds on the existing `InMemoryDB` dict. Two independent backend tracks (cart-item endpoints in `test_api.py`/`database.py`, order cancellation in `checkout.py`/`database.py`) touch disjoint methods in shared files, so they run in parallel worktrees; a third, purely-textual track updates documentation from the fixed contract below, in parallel with both. A final sequential task merges all three and runs the full test suite against the integrated backend.

**Tech Stack:** Python 3.11 / FastAPI / Pydantic 2 (backend), TypeScript / Vitest / axios (`tests/api.test.ts`), Schemathesis (`tests/test_contract.py`, schema-driven — needs no new *test* code to cover new endpoints, but needed a small API-compatibility fix, see Task 2), curl (manual verification where the design spec deliberately excludes automated coverage).

**Environment note (this machine only, not project policy):** the pinned `backend/requirements.txt` versions fail to build here (no prebuilt `pydantic-core` wheel for the installed Python 3.14, and building from source errors out). The existing `backend/venv` in the main repo checkout already has newer, working, unpinned versions installed and is known-good (verified: 46/46 `tests/api.test.ts`/`golden.test.ts` pass through it). Every worktree below reuses that one venv by absolute path — `C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe` — rather than creating a fresh one. Run backend commands as `<that path> main.py` from each worktree's own `backend/` directory; imports resolve correctly since Python uses the script's own directory, not the venv's location.

**Design spec:** `docs/superpowers/specs/2026-08-11-cart-order-verbs-design.md` — read it first; this plan implements it exactly, including its two corrections (no persistence migration; cart-item endpoints get contract-test coverage only, not hand-written Vitest, per the existing `tests/README.md` boundary).

## Global Constraints

- Backend has no `--reload`. After every backend code edit, stop the running `python main.py` process and restart it before running any test against it.
- Run a single Vitest file with `npx vitest run <file>` from `tests/` — `pnpm test -- <file>` does not isolate to one file in this setup.
- `tests/vitest.config.ts` already sets `fileParallelism: false` (shared stateful backend) — do not change this.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`) per `CONTRIBUTING.md`.
- Do not touch anything under `documents/paper/` — there is an active, unrelated snapshot-freeze decision pending there.
- `docs/` is gitignored in this repo (`/docs` in `.gitignore`) except for specific force-added files; this plan document and the design spec were both added with `git add -f`. No action needed here — just don't be surprised `git status` doesn't show `docs/` by default.
- New/changed backend response fields must stay additive — do not rename or remove any existing field (`tests/golden.test.ts`, `tests/api.test.ts`, and `tests/test_contract.py` were all checked in the design phase and only do partial/sub-object matches, but stay additive to keep it that way).

## Worktree / Track Assignment

Use `superpowers:using-git-worktrees` to create three isolated worktrees before starting Tasks 1, 4, and 6 respectively (one worktree per track below, at the first task in each). Tracks A and B touch `backend/models.py` and `backend/database.py` in disjoint classes/methods — expect a clean merge. Track C only reads this plan, not the code, so it has no file overlap with A or B at all.

| Track | Tasks | Suggested worktree | Depends on |
|---|---|---|---|
| A — Cart items | 1, 2, 3 | `../omnipizza-cart-items` | nothing |
| B — Order cancellation | 4, 5 | `../omnipizza-order-cancel` | nothing |
| C — Documentation | 6, 7, 8 | `../omnipizza-verb-docs` | nothing (writes from this plan's fixed contract, not from A/B's code) |
| Integration | 9 | main worktree | A + B + C all merged |

Task 2 (Schemathesis 4.x compatibility + documenting every existing endpoint's real error responses) rides in Track A's worktree between Tasks 1 and 3, since Task 3 is the first task that needs `test_contract.py` working and needs `backend/response_docs.py` to exist — but Task 2 itself only touches `tests/test_contract.py`, `backend/response_docs.py`, and the `responses=` kwarg on existing endpoints across `auth.py`/`catalog.py`/`checkout.py`/`test_api.py`, none of which overlaps with Task 1's or Task 3's actual cart logic.

## File Structure

| File | Responsibility |
|---|---|
| `backend/response_docs.py` | New (Task 2). Shared `AUTH_RESPONSES`/`COUNTRY_HEADER_RESPONSES` OpenAPI `responses=` fragments, imported by every existing authenticated endpoint so Schemathesis stops flagging their real error codes as undocumented. |
| `backend/routers/auth.py`, `backend/routers/catalog.py` | Gain `responses=` on their existing endpoints (Task 2) — no behavior change, additive OpenAPI metadata only. |
| `backend/models.py` | Pydantic schemas. Gains `item_id` on `CartItem`/`EnrichedCartItem`, `status` on `OrderSummary`, new `OrderStatusUpdate`. |
| `backend/database.py` | `InMemoryDB`. Session methods (`_ensure_session`, `set_test_market`, `set_test_cart`, `reset_test_session`, `get_test_session`, `get_enriched_cart`) move from `username`- to `session_id`-keying; gains `upsert_cart_item`, `remove_cart_item`, `cancel_order`. |
| `backend/test_api.py` | Atomic test-setup router. Existing handlers switch to `session_id` and gain `responses=` (Task 2); gains `PUT`/`DELETE /api/cart/items/{item_id}` (Task 3). |
| `backend/routers/checkout.py` | Orders router. Gains `responses=` on its 3 existing endpoints (Task 2). `checkout()`/`get_order()` expose `status` (Task 4); gains `PATCH /api/orders/{order_id}` (Task 5); all three converge on one `_order_summary()` helper instead of three inline `OrderSummary(...)` constructions. |
| `tests/api.test.ts` | Gains: cart session-isolation regression test, `OrderSummary.status` exposure test, 5 `PATCH /api/orders` cases. |
| `tests/test_contract.py` | Schemathesis 3.x → 4.x API compatibility fix (Task 2) — this machine's environment can only install 4.x; unrelated to the new feature, discovered during pre-flight. |
| `README.md`, `index.html`, `API_EXAMPLES.md` | Primary living API docs — full endpoint lists + examples. |
| `CLAUDE.md`, `tests/README.md`, `PROJECT_SUMMARY.md`, `QUICKSTART.md`, `frontend/public/README.md` | Secondary living reference docs — smaller mentions/lists. |
| `documents/Product_Requirement_Doc.md`, `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md` | Spec table + atomic-testing guides — table rows / brief mentions. |

---

## Task 1: Session-identity migration (`username` → `session_id`) + cart line `item_id`

**Files:**
- Modify: `backend/models.py:60-64` (`CartItem`), `:67-76` (`EnrichedCartItem`)
- Modify: `backend/database.py:139-232` (`_ensure_session`, `set_test_market`, `set_test_cart`, `reset_test_session`, `get_test_session`, `get_enriched_cart`)
- Modify: `backend/test_api.py` (`_session_response` and every handler that calls it)
- Test: `tests/api.test.ts` (new `describe('Cart session isolation', ...)`)

**Interfaces:**
- Produces: `db.set_test_market(session_id, country_code)`, `db.set_test_cart(session_id, items)`, `db.reset_test_session(session_id)`, `db.get_test_session(session_id)`, `db.get_enriched_cart(session_id, country_code, behavior, language)` — all now take `session_id` as first arg, not `username`. `CartItem.item_id: Optional[str]`, `EnrichedCartItem.item_id: str`.
- Consumes: `current_user["session_id"]`, already produced by `get_current_user` in `backend/middleware.py:50` (no change needed there).

- [ ] **Step 1: Start the backend** (needed for every later step in this plan)

Run in its own terminal, leave it running:
```bash
cd backend
python main.py
```
Leave this running for the rest of the plan. After any edit to a file under `backend/`, stop it (Ctrl+C) and re-run this command before testing again — there is no `--reload`.

- [ ] **Step 2: Write the failing regression test**

Append to `tests/api.test.ts` (after the existing `describe('Profile session isolation', ...)` block, matching its style):

```typescript
// ---------------------------------------------------------------------------
// Cart session isolation (parallel-login leak fix)
// ---------------------------------------------------------------------------
describe('Cart session isolation', () => {
  it('keeps two concurrent logins for the same user on separate carts', async () => {
    // Session A: seed a cart with one item.
    const tokenA = await login('standard_user');
    await axios.post(
      `${API_URL}/api/cart`,
      { items: [{ pizza_id: 'p01', quantity: 1, size: 'small' }] },
      { headers: { Authorization: `Bearer ${tokenA}` } },
    );

    // Session B: a second, concurrent login for the same username seeds a
    // DIFFERENT cart. Before the session_id migration, both logins share one
    // username-keyed cart, so this POST silently overwrites Session A's.
    const tokenB = await login('standard_user');
    await axios.post(
      `${API_URL}/api/cart`,
      { items: [{ pizza_id: 'p02', quantity: 2, size: 'large' }] },
      { headers: { Authorization: `Bearer ${tokenB}` } },
    );

    // Session A's cart must still show its own item, untouched by Session B.
    const cartA = await axios.get(`${API_URL}/api/cart`, {
      headers: authHeaders(tokenA, 'MX'),
    });
    expect(cartA.data.cart_items).toHaveLength(1);
    expect(cartA.data.cart_items[0].pizza_id).toBe('p01');

    const cartB = await axios.get(`${API_URL}/api/cart`, {
      headers: authHeaders(tokenB, 'MX'),
    });
    expect(cartB.data.cart_items).toHaveLength(1);
    expect(cartB.data.cart_items[0].pizza_id).toBe('p02');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
cd tests
npx vitest run api.test.ts -t "Cart session isolation"
```
Expected: FAIL. `cartA.data.cart_items[0].pizza_id` will actually be `'p02'` (Session B's write clobbered Session A's cart, since both share one `username`-keyed record today).

- [ ] **Step 4: Add `item_id` to the cart models**

In `backend/models.py`, replace the `CartItem` class:

```python
class CartItem(BaseModel):
    pizza_id: str
    quantity: int = Field(ge=1, le=10)
    size: str = "small"
    toppings: List[str] = Field(default_factory=list)
    item_id: Optional[str] = None
```

And `EnrichedCartItem`:

```python
class EnrichedCartItem(BaseModel):
    pizza_id: str
    item_id: str
    name: str
    size: str
    quantity: int
    price: float
    base_price: float
    currency: str
    currency_symbol: str
    image: str
```

- [ ] **Step 5: Migrate `database.py` session storage to `session_id` keying**

Replace `_ensure_session` through `get_test_session` (current lines 139–181):

```python
    def _ensure_session(self, session_id: str) -> Dict[str, Any]:
        session = self.sessions.get(session_id)
        if session is None:
            session = {
                "country_code": CountryCode.MX.value,
                "cart_items": [],
                "updated_at": datetime.utcnow(),
            }
            self.sessions[session_id] = session
        return session

    def create_order(self, order_data: Dict[str, Any]) -> str:
        order_id = f"ORDER-{uuid.uuid4().hex[:8].upper()}"
        order_data["order_id"] = order_id
        order_data["timestamp"] = datetime.utcnow()
        order_data["status"] = "pending"
        self.orders[order_id] = order_data
        return order_id

    def get_order(self, order_id: str) -> Dict[str, Any]:
        return self.orders.get(order_id)

    def get_user_orders(self, username: str) -> List[Dict[str, Any]]:
        return [order for order in self.orders.values() if order.get("username") == username]

    def set_test_market(self, session_id: str, country_code: CountryCode) -> Dict[str, Any]:
        session = self._ensure_session(session_id)
        session["country_code"] = country_code.value
        session["updated_at"] = datetime.utcnow()
        return session

    def set_test_cart(self, session_id: str, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        session = self._ensure_session(session_id)
        session["cart_items"] = [
            {**item, "item_id": item.get("item_id") or f"ITEM-{uuid.uuid4().hex[:8].upper()}"}
            for item in items
        ]
        session["updated_at"] = datetime.utcnow()
        return session

    def reset_test_session(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)

    def get_test_session(self, session_id: str) -> Dict[str, Any]:
        return self._ensure_session(session_id)
```

(Only `set_test_market`, `set_test_cart`, `reset_test_session`, `get_test_session`, and `_ensure_session` change — `create_order`/`get_order`/`get_user_orders` are shown only for context and are unchanged; don't touch them here.)

In `get_enriched_cart` (current lines 183-232), rename the first parameter and add `item_id` to the enriched output:

```python
    def get_enriched_cart(
        self,
        session_id: str,
        country_code: CountryCode,
        behavior: str = "standard",
        language: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        session = self._ensure_session(session_id)
        cart_items = session["cart_items"]
```

(rest of the method body is unchanged except the `enriched.append({...})` call, which gains one key:)

```python
            enriched.append({
                "pizza_id": item["pizza_id"],
                "item_id": item.get("item_id"),
                "name": name,
                "size": item.get("size", "small"),
                "quantity": item["quantity"],
                "price": price,
                "base_price": pizza["base_price"],
                "currency": currency,
                "currency_symbol": currency_symbol,
                "image": image,
            })
```

- [ ] **Step 6: Update `test_api.py` call sites**

Replace `_session_response`:

```python
def _session_response(username: str, session_id: str) -> TestSessionStateResponse:
    session = db.get_test_session(session_id)
    return TestSessionStateResponse(
        username=username,
        country_code=session["country_code"],
        cart_items=session["cart_items"],
        updated_at=session["updated_at"],
    )
```

Replace the body of `set_market`:

```python
async def set_market(
    request: TestMarketRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.set_test_market(session_id, request.country_code)
    logger.info("session_api.set_market user=%s country=%s", username, request.country_code.value)
    return _session_response(username, session_id)
```

Replace the body of `seed_cart` (and update its `description=` docstring — see Step 7):

```python
async def seed_cart(
    request: TestCartSetupRequest,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.set_test_cart(session_id, [item.dict() for item in request.items])
    logger.info("session_api.seed_cart user=%s item_count=%d", username, len(request.items))
    return _session_response(username, session_id)
```

Replace the body of `get_cart`:

```python
async def get_cart(
    current_user: dict = Depends(get_current_user),
    country_code: str = Depends(require_country_header),
    x_language: Optional[str] = Header(None),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    behavior = current_user.get("behavior", "standard")
    if hasattr(behavior, "value"):
        behavior = behavior.value

    cc = CountryCode(country_code)
    session = db.get_test_session(session_id)
    enriched = db.get_enriched_cart(session_id, cc, behavior, x_language)

    return CartResponse(
        username=username,
        country_code=country_code,
        cart_items=enriched,
        updated_at=session["updated_at"],
    )
```

Replace the body of `reset_state` (and update its `description=` — see Step 7):

```python
async def reset_state(
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.reset_test_session(session_id)
    db.reset_user_profile(session_id, username)
    logger.info("session_api.reset_state user=%s", username)
    return _session_response(username, session_id)
```

Replace the body of `get_state`:

```python
async def get_state(
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    return _session_response(username, session_id)
```

- [ ] **Step 7: Update the two docstrings that describe the old per-username behavior**

In `set_market`'s `@router.post("/api/store/market", ...)` decorator, replace the `description=` string:

```python
    description=(
        "Sets `country_code` on the current login session. The session is "
        "**per-login-session (keyed by the JWT `sid` claim), not per-(user, "
        "market)** — switching markets here does NOT clear or partition the "
        "cart. To replace the cart, call `POST /api/cart` or "
        "`POST /api/session/reset` separately."
    ),
```

In `seed_cart`'s `@router.post("/api/cart", ...)` decorator, replace the `description=` string:

```python
    description=(
        "Replaces the current login session's cart with the supplied items. "
        "**The cart is per-login-session (keyed by the JWT `sid` claim), not "
        "per-username or per-market** — this endpoint does not read the "
        "`X-Country-Code` header and does not change the session's market. "
        "Two concurrent logins for the same username (e.g. two market "
        "scenarios run in parallel) get isolated carts. Each seeded line gets "
        "a stable `item_id` (server-generated unless you supply your own), "
        "addressable via `PUT`/`DELETE /api/cart/items/{item_id}`. Use "
        "`POST /api/store/market` to set the market, and `GET /api/cart` "
        "(which does require `X-Country-Code`) to read the cart enriched with "
        "market-specific pricing/currency."
    ),
```

- [ ] **Step 8: Restart the backend and run the test again**

Stop `python main.py` (Ctrl+C) and restart it, then:

```bash
cd tests
npx vitest run api.test.ts -t "Cart session isolation"
```
Expected: PASS.

- [ ] **Step 9: Run the full existing suite to check for regressions**

```bash
cd tests
npx vitest run
```
Expected: all PASS (in particular `Profile session isolation` and every `Golden:` case in `golden.test.ts`, since `db.orders`/`get_user_orders` and the profile methods were untouched).

- [ ] **Step 10: Commit**

```bash
git add backend/models.py backend/database.py backend/test_api.py tests/api.test.ts
git commit -m "fix: key cart/market test session by login sid, not username

Two parallel logins for the same test user (e.g. two market scenarios run
concurrently) shared one username-keyed cart, so a write from one could
silently clobber the other. Mirrors the sid-keyed profile fix from
2026-07-17. Also assigns a stable item_id per cart line, needed for the
upcoming per-line PUT/DELETE endpoints."
```

---

## Task 2: Fix `tests/test_contract.py` for Schemathesis 4.x, and document every endpoint's real error responses

**Why this task exists:** discovered during pre-flight, unrelated to the cart/order feature. `requirements.txt` pins `schemathesis==3.25.1`, but that version can't build on this machine (Python 3.14, no prebuilt `pydantic-core` wheel for the pinned `pydantic` it needs, and building from source fails). The version that *does* install cleanly here, 4.24.3, renamed `schemathesis.from_uri` and changed `schema.parametrize()` to take no filter arguments. Fixing just that (Steps 1-3) makes the file loadable and runnable again, but a full run then surfaces a second, deeper, also-pre-existing problem: FastAPI only auto-documents the response codes it can prove from type hints (the declared `response_model`'s success code, and `422` for request-body/query validation). Every `raise HTTPException(...)` inside a handler or a dependency (`require_country_header`'s `400`, `get_current_user`'s `401`, every endpoint's own `403`/`404`/`409`/`500`) is real, reachable app behavior that the auto-generated OpenAPI schema never mentions — so Schemathesis's `UndefinedStatusCode` check flags nearly every authenticated endpoint. Both problems were verified live (schemathesis 4.24.3 + pytest 9.1.1, installed into the borrowed venv) before writing this task: the rename fix alone still left 20 of 29 tests failing, all `UndefinedStatusCode` except one unrelated `KeyError` in a hand-written test and one Hypothesis-vs-stdlib `UnicodeEncodeError` (see Step 8's note).

**Files:**
- Modify: `tests/test_contract.py`
- Create: `backend/response_docs.py`
- Modify: `backend/routers/auth.py`, `backend/routers/catalog.py`, `backend/routers/checkout.py`, `backend/test_api.py` (add `responses=` to existing endpoints only — Task 3 and Task 5 add `responses=` to the two new endpoint families themselves, as part of writing them, not here)

**Interfaces:**
- Produces: `backend/response_docs.py` exports `AUTH_RESPONSES: dict` (`{401: {...}}`) and `COUNTRY_HEADER_RESPONSES: dict` (`{400: {...}}`), imported by every router that needs them.

- [ ] **Step 1: Confirm it's currently broken**

```bash
cd tests
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" -m pip install -q schemathesis pytest
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" -m pytest test_contract.py -v -k test_api_contract
```
Expected: collection ERROR — `AttributeError: module 'schemathesis' has no attribute 'from_uri'`. (The backend doesn't need to be running yet for this step; the error happens before any request is made.)

- [ ] **Step 2: Fix the schema loader**

In `tests/test_contract.py`, replace:

```python
schema = schemathesis.from_uri(f"{API_BASE_URL}/api/openapi.json")
```

with:

```python
schema = schemathesis.openapi.from_url(f"{API_BASE_URL}/api/openapi.json")
```

- [ ] **Step 3: Fix the three filtered `parametrize()` calls**

`schema.parametrize()` no longer accepts `endpoint=`/`method=` kwargs in 4.x — filter first with `schema.include(...)`, then call `.parametrize()` on the filtered schema. The unfiltered `@schema.parametrize()` on `test_api_contract` (no arguments) is correct already and needs no change.

Replace:

```python
@schema.parametrize(endpoint="/api/auth/login", method="POST")
```

with:

```python
@schema.include(path="/api/auth/login", method="POST").parametrize()
```

Replace:

```python
@schema.parametrize(endpoint="/api/pizzas", method="GET")
```

with:

```python
@schema.include(path="/api/pizzas", method="GET").parametrize()
```

Replace:

```python
@schema.parametrize(endpoint="/api/checkout", method="POST")
```

with:

```python
@schema.include(path="/api/checkout", method="POST").parametrize()
```

- [ ] **Step 4: Confirm the rename alone isn't enough**

```bash
cd ../backend
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" main.py &
```
Wait a few seconds for startup, then:

```bash
cd ../tests
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" -m pytest test_contract.py -v
```
Expected: most `test_api_contract[...]` cases FAIL with `UndefinedStatusCode` (e.g. "Received: 401, Documented: 200, 422"). This confirms the second problem before fixing it — Steps 5-9 fix it.

- [ ] **Step 5: Create the shared response-doc fragments**

Create `backend/response_docs.py`:

```python
"""Shared OpenAPI `responses=` fragments, so FastAPI's generated schema
documents every status code a dependency or handler can actually return.
Without these, Schemathesis's contract test (tests/test_contract.py)
flags any code the schema doesn't list as undocumented, even though the
app returns it by design — e.g. every authenticated endpoint returning
401 for a missing or invalid token."""

AUTH_RESPONSES = {401: {"description": "Missing or invalid Authorization bearer token"}}
COUNTRY_HEADER_RESPONSES = {400: {"description": "Missing or invalid X-Country-Code header"}}
```

- [ ] **Step 6: Add `responses=` to `backend/routers/auth.py`'s 4 endpoints**

Add the import:

```python
from response_docs import AUTH_RESPONSES
```

`login` has no auth dependency (you're logging in), so its codes are hand-written, not from `AUTH_RESPONSES`. Replace:

```python
@router.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])
```

with:

```python
@router.post(
    "/api/auth/login",
    response_model=LoginResponse,
    tags=["Authentication"],
    responses={
        401: {"description": "Invalid username or password"},
        403: {"description": "User is locked out"},
    },
)
```

The other 3 endpoints in this file all depend on `get_current_user` only — same mechanical addition each time. Replace:

```python
@router.get("/api/auth/profile", response_model=UserProfile, tags=["Authentication"])
```

with:

```python
@router.get(
    "/api/auth/profile",
    response_model=UserProfile,
    tags=["Authentication"],
    responses={**AUTH_RESPONSES},
)
```

Add `responses={**AUTH_RESPONSES},` as a new line inside the `@router.get("/api/users/me/profile", ...)` decorator's argument list (it already spans multiple lines — add the new line after `summary=...,`, before the closing `)`), and the same inside `@router.patch("/api/users/me/profile", ...)`. Both follow the exact pattern shown above — one new kwarg line, no other changes.

- [ ] **Step 7: Add `responses=` to `backend/routers/catalog.py`'s `GET /api/pizzas`**

Add the import:

```python
from response_docs import AUTH_RESPONSES, COUNTRY_HEADER_RESPONSES
```

Replace:

```python
@router.get("/api/pizzas", response_model=PizzaResponse, tags=["Pizzas"])
```

with:

```python
@router.get(
    "/api/pizzas",
    response_model=PizzaResponse,
    tags=["Pizzas"],
    responses={**AUTH_RESPONSES, **COUNTRY_HEADER_RESPONSES, 500: {"description": "Unexpected server error"}},
)
```

(`GET /api/countries` has no auth dependency and no raised exceptions — leave it unchanged.)

- [ ] **Step 8: Add `responses=` to `backend/routers/checkout.py`'s 3 existing endpoints**

Add to the existing models/constants imports:

```python
from response_docs import AUTH_RESPONSES
```

Replace:

```python
@router.post("/api/checkout", response_model=OrderSummary, tags=["Orders"])
```

with:

```python
@router.post(
    "/api/checkout",
    response_model=OrderSummary,
    tags=["Orders"],
    responses={
        **AUTH_RESPONSES,
        400: {"description": "Missing a market-required checkout field"},
        500: {"description": "Random chaos error (error_user/security_glitch_user)"},
    },
)
```

Replace:

```python
@router.get("/api/orders", tags=["Orders"])
```

with:

```python
@router.get("/api/orders", tags=["Orders"], responses={**AUTH_RESPONSES})
```

Replace:

```python
@router.get("/api/orders/{order_id}", response_model=OrderSummary, tags=["Orders"])
```

with:

```python
@router.get(
    "/api/orders/{order_id}",
    response_model=OrderSummary,
    tags=["Orders"],
    responses={
        **AUTH_RESPONSES,
        403: {"description": "Order belongs to another user"},
        404: {"description": "Order not found"},
    },
)
```

- [ ] **Step 9: Add `responses=` to `backend/test_api.py`'s 6 existing endpoints**

Add to the existing imports:

```python
from response_docs import AUTH_RESPONSES, COUNTRY_HEADER_RESPONSES
```

`set_market`, `seed_cart`, `seed_profile`, `reset_state` each depend on `get_current_user` only and each already have a multi-line decorator (from Task 1's docstring updates, for `set_market`/`seed_cart`) or their original one (`seed_profile`, `reset_state`) — add `responses={**AUTH_RESPONSES},` as a new line in each, same placement pattern as Step 6's multi-line examples (a new kwarg line before the closing `)`).

Replace:

```python
@router.get("/api/cart", response_model=CartResponse, tags=["Cart"])
```

with:

```python
@router.get(
    "/api/cart",
    response_model=CartResponse,
    tags=["Cart"],
    responses={**AUTH_RESPONSES, **COUNTRY_HEADER_RESPONSES},
)
```

Replace:

```python
@router.get("/api/session", response_model=TestSessionStateResponse, tags=["Session"])
```

with:

```python
@router.get(
    "/api/session",
    response_model=TestSessionStateResponse,
    tags=["Session"],
    responses={**AUTH_RESPONSES},
)
```

- [ ] **Step 10: Restart the backend and run the full contract suite**

```bash
cd ../backend
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" main.py &
```
Wait a few seconds, then:

```bash
cd ../tests
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" -m pytest test_contract.py -v
```
Expected: no `UndefinedStatusCode` failures. Two pre-existing, unrelated issues may still appear and are **not** this task's job to fix:
- `test_locked_out_user_behavior` — a hand-written test asserting `response.json()["detail"]`, but this app's exception handler (`main.py`) reshapes errors to `{"error": ..., "status_code": ..., "timestamp": ...}`. Pre-existing mismatch, unrelated to schemathesis versioning or undocumented status codes.
- An occasional `UnicodeEncodeError` from Python's own `http.client` when Hypothesis fuzzes unusual unicode into a header value — a test-tooling/stdlib interaction, not an app defect, and not guaranteed to reproduce on every run (depends on Hypothesis's random seed).

If any `UndefinedStatusCode` failure remains, find which endpoint it's on and add the missing code to that endpoint's `responses=` (same pattern as Steps 6-9) before moving on — don't leave a real gap in the audit.

- [ ] **Step 11: Commit**

```bash
git add tests/test_contract.py backend/response_docs.py backend/routers/auth.py backend/routers/catalog.py backend/routers/checkout.py backend/test_api.py
git commit -m "fix: schemathesis 4.x compatibility + document real error responses

schemathesis.from_uri and schema.parametrize(endpoint=, method=) were
removed/changed in 4.x; both pre-existing breakages on this machine,
unrelated to the cart/order feature, surfaced during this plan's
pre-flight check.

Also adds responses= to every existing endpoint so FastAPI's generated
OpenAPI schema documents the error codes each one actually returns
(401 from get_current_user, 400 from require_country_header, and each
endpoint's own explicit HTTPException raises) — previously undocumented,
which is what made most of test_contract.py's schema-driven checks fail
regardless of the schemathesis version."
```

---

## Task 3: `PUT`/`DELETE /api/cart/items/{item_id}`

**Files:**
- Modify: `backend/database.py` (add `upsert_cart_item`, `remove_cart_item`)
- Modify: `backend/test_api.py` (imports + two new endpoints)
- Verify: manual curl (see design spec §8 — no hand-written Vitest for this endpoint family; contract coverage comes from `tests/test_contract.py`'s schema-driven `test_api_contract`, which needs no code change to pick up new routes)

**Interfaces:**
- Consumes: `db._ensure_session(session_id)` from Task 1.
- Produces: `db.upsert_cart_item(session_id, item_id, item) -> Dict[str, Any]`, `db.remove_cart_item(session_id, item_id) -> bool`.

- [ ] **Step 1: Add the two `database.py` methods**

Add directly after `set_test_cart` (which Task 1 already modified):

```python
    def upsert_cart_item(self, session_id: str, item_id: str, item: Dict[str, Any]) -> Dict[str, Any]:
        session = self._ensure_session(session_id)
        stored = {**item, "item_id": item_id}
        items = session["cart_items"]
        for i, existing in enumerate(items):
            if existing.get("item_id") == item_id:
                items[i] = stored
                break
        else:
            items.append(stored)
        session["updated_at"] = datetime.utcnow()
        return stored

    def remove_cart_item(self, session_id: str, item_id: str) -> bool:
        session = self._ensure_session(session_id)
        items = session["cart_items"]
        filtered = [i for i in items if i.get("item_id") != item_id]
        if len(filtered) == len(items):
            return False
        session["cart_items"] = filtered
        session["updated_at"] = datetime.utcnow()
        return True
```

- [ ] **Step 2: Add the imports `test_api.py` needs**

Replace the top of `backend/test_api.py`:

```python
import logging
from fastapi import APIRouter, Depends, Header, HTTPException, status
from typing import Optional

from constants import CountryCode
from database import db
from middleware import get_current_user, require_country_header
from models import (
    CartItem,
    CartResponse,
    TestCartSetupRequest,
    TestMarketRequest,
    TestProfileSeedRequest,
    TestSessionStateResponse,
    UserProfileDetails,
)
from response_docs import AUTH_RESPONSES
```

(`AUTH_RESPONSES` comes from Task 2, which runs before this one in this same worktree — `backend/response_docs.py` already exists and `test_api.py`'s other 6 endpoints already import from it by the time this task runs.)

- [ ] **Step 3: Add the two endpoints**

Add after the existing `get_cart` handler (before `seed_profile`):

```python
@router.put(
    "/api/cart/items/{item_id}",
    response_model=TestSessionStateResponse,
    tags=["Cart"],
    summary="Create or replace one cart line (atomic test setup)",
    description=(
        "Upsert semantics: if `item_id` isn't in the caller's session yet, a "
        "new line is created; if it is, that line is fully replaced. Any "
        "`item_id` in the request body is ignored — the URL is authoritative. "
        "Does not read `X-Country-Code`; use `GET /api/cart` for enriched, "
        "priced items."
    ),
    responses={**AUTH_RESPONSES},
)
async def put_cart_item(
    item_id: str,
    request: CartItem,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    db.upsert_cart_item(session_id, item_id, request.dict(exclude={"item_id"}))
    logger.info("session_api.put_cart_item user=%s item_id=%s", username, item_id)
    return _session_response(username, session_id)


@router.delete(
    "/api/cart/items/{item_id}",
    response_model=TestSessionStateResponse,
    tags=["Cart"],
    summary="Remove one cart line (atomic test setup)",
    responses={**AUTH_RESPONSES, 404: {"description": "item_id not found in the caller's session"}},
)
async def delete_cart_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    username = current_user["username"]
    session_id = current_user["session_id"]
    removed = db.remove_cart_item(session_id, item_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cart item {item_id} not found",
        )
    logger.info("session_api.delete_cart_item user=%s item_id=%s", username, item_id)
    return _session_response(username, session_id)
```

- [ ] **Step 4: Restart the backend**

Stop `python main.py` (Ctrl+C) and restart it.

- [ ] **Step 5: Manual verification (this endpoint family's test, per the design spec)**

Run each in order, checking the noted expectation. (Requires `jq`; if unavailable, drop the `| jq ...` part and read the raw JSON.)

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"pizza123"}' | jq -r '.access_token')

# 2. PUT a new line with a client-chosen item_id
curl -s -X PUT http://localhost:8000/api/cart/items/test-item-1 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pizza_id":"p01","quantity":2,"size":"large"}' | jq '.cart_items'
# Expect: one item, item_id "test-item-1", pizza_id "p01", quantity 2, size "large"

# 3. PUT again to the SAME item_id — replaces, does not duplicate
curl -s -X PUT http://localhost:8000/api/cart/items/test-item-1 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"pizza_id":"p01","quantity":5,"size":"large"}' | jq '.cart_items | length, .[0].quantity'
# Expect: length 1, quantity 5

# 4. DELETE it
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8000/api/cart/items/test-item-1 \
  -H "Authorization: Bearer $TOKEN"
# Expect: 200

# 5. GET confirms it's gone
curl -s http://localhost:8000/api/cart -H "Authorization: Bearer $TOKEN" -H "X-Country-Code: MX" | jq '.cart_items'
# Expect: []

# 6. DELETE an item_id that no longer exists
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8000/api/cart/items/test-item-1 \
  -H "Authorization: Bearer $TOKEN"
# Expect: 404
```

- [ ] **Step 6: Run the Schemathesis contract test to confirm auto-coverage picked up the new routes**

Requires Task 2's `test_contract.py` fix to already be in place (it should be — Task 2 runs before this one in Track A). Use the same borrowed venv as the rest of this plan (see the "Environment note" near the top):

```bash
cd tests
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" -m pytest test_contract.py -v -k test_api_contract
```
Expected: PASS, and the verbose output lists `PUT /api/cart/items/{item_id}` and `DELETE /api/cart/items/{item_id}` among the tested cases.

- [ ] **Step 7: Commit**

```bash
git add backend/database.py backend/test_api.py
git commit -m "feat: add PUT/DELETE /api/cart/items/{item_id}

Per-line cart upsert and removal, on top of the session_id-keyed storage
from the prior commit. Contract coverage is via the existing schema-driven
Schemathesis test, not hand-written Vitest — see the design spec's test
plan for why (this endpoint family is atomic test-setup, same boundary
tests/README.md already documents for POST/GET /api/cart)."
```

---

## Task 4: Expose `status` on `OrderSummary`

**Files:**
- Modify: `backend/models.py:129-141` (`OrderSummary`)
- Modify: `backend/routers/checkout.py` (`checkout()` and `get_order()` return statements)
- Test: `tests/api.test.ts`

**Interfaces:**
- Produces: `OrderSummary.status: str`.

- [ ] **Step 1: Write the failing test**

Append to `tests/api.test.ts`:

```typescript
// ---------------------------------------------------------------------------
// OrderSummary status field
// ---------------------------------------------------------------------------
describe('OrderSummary status field', () => {
  it('checkout and order-detail responses include status: "pending"', async () => {
    const token = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'MX'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    const checkoutRes = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [{ pizza_id: pizzaId, quantity: 1 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.data.status).toBe('pending');

    const orderRes = await axios.get(`${API_URL}/api/orders/${checkoutRes.data.order_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(orderRes.data.status).toBe('pending');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd tests
npx vitest run api.test.ts -t "OrderSummary status field"
```
Expected: FAIL — `checkoutRes.data.status` is `undefined` (`OrderSummary` doesn't expose it yet).

- [ ] **Step 3: Add `status` to `OrderSummary`**

In `backend/models.py`, replace the `OrderSummary` class:

```python
class OrderSummary(BaseModel):
    order_id: str
    status: str
    subtotal: float
    delivery_fee: float
    tax_rate: float
    tip_percentage: float
    tax: float
    tip: float
    total: float
    currency: str
    currency_symbol: str
    items: List[Dict[str, Any]]
    timestamp: datetime
```

- [ ] **Step 4: Wire `status` into both `checkout.py` responses**

In `backend/routers/checkout.py`, in `checkout()`, replace the `return OrderSummary(...)` at the end of the function:

```python
    return OrderSummary(
        order_id=order["order_id"],
        status=order["status"],
        subtotal=order["subtotal"],
        delivery_fee=order["delivery_fee"],
        tax_rate=order["tax_rate"],
        tip_percentage=order["tip_percentage"],
        tax=order["tax"],
        tip=order["tip"],
        total=order["total"],
        currency=order["currency"],
        currency_symbol=country_config["currency_symbol"],
        items=order["items"],
        timestamp=order["timestamp"]
    )
```

And the same change in `get_order()`'s `return OrderSummary(...)`:

```python
    return OrderSummary(
        order_id=order["order_id"],
        status=order["status"],
        subtotal=order["subtotal"],
        delivery_fee=order["delivery_fee"],
        tax_rate=order["tax_rate"],
        tip_percentage=order["tip_percentage"],
        tax=order["tax"],
        tip=order["tip"],
        total=order["total"],
        currency=order["currency"],
        currency_symbol=country_config["currency_symbol"],
        items=order["items"],
        timestamp=order["timestamp"]
    )
```

- [ ] **Step 5: Restart the backend and run the test again**

```bash
cd tests
npx vitest run api.test.ts -t "OrderSummary status field"
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/models.py backend/routers/checkout.py tests/api.test.ts
git commit -m "feat: expose status on OrderSummary

Already stored internally (create_order sets 'pending'), just wasn't
returned. Additive field, needed by the upcoming PATCH cancel endpoint."
```

---

## Task 5: `PATCH /api/orders/{order_id}` — cancel a pending order

**Files:**
- Modify: `backend/models.py` (new `OrderStatusUpdate`)
- Modify: `backend/database.py` (new `cancel_order`)
- Modify: `backend/routers/checkout.py` (import + shared `_order_summary()` helper + new endpoint)
- Test: `tests/api.test.ts`

**Interfaces:**
- Consumes: `OrderSummary` (Task 4), `db.get_order(order_id)` (existing).
- Produces: `db.cancel_order(order_id) -> Optional[Dict[str, Any]]`, `OrderStatusUpdate.status: Literal["cancelled"]`, `_order_summary(order, currency_symbol) -> OrderSummary` (module-private helper in `checkout.py`).

**Note on `responses=`:** Step 7 below documents this endpoint's error codes as a literal inline dict, not an import from `backend/response_docs.py`. That file is real (Task 2 creates it) but lives in Track A's worktree — this task runs in Track B's separate worktree, which won't have it until Task 9 merges both. A 4-line literal dict here is a smaller, more localized duplication than the 14-line `OrderSummary` block Step 5 just eliminated, and resolving it would mean either an awkward cross-worktree file dependency or deferring this endpoint's contract-test coverage to after the merge — not worth it for one dict.

**Pre-flight note:** before this task existed, `checkout()` and `get_order()` each independently built an identical 14-line `OrderSummary(...)` construction — that's already a pre-existing duplication. This task's new endpoint would be a third copy of the same block, which is exactly the kind of thing a code reviewer flags on principle once something repeats three times. Step 5 below extracts a shared helper and refactors the two existing endpoints to use it *before* writing the new one, so all three converge on one implementation instead of three.

- [ ] **Step 1: Write the failing tests**

Append to `tests/api.test.ts`:

```typescript
// ---------------------------------------------------------------------------
// PATCH /api/orders/{order_id} — cancellation
// ---------------------------------------------------------------------------
describe('PATCH /api/orders/{order_id}', () => {
  async function placeOrder(token: string): Promise<string> {
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'MX'),
    });
    const pizzaId = catalog.data.pizzas[0].id;
    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [{ pizza_id: pizzaId, quantity: 1 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    return res.data.order_id;
  }

  it('cancels a pending order', async () => {
    const token = await login('standard_user');
    const orderId = await placeOrder(token);

    const res = await axios.patch(
      `${API_URL}/api/orders/${orderId}`,
      { status: 'cancelled' },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('cancelled');
    expect(res.data.order_id).toBe(orderId);
  });

  it('rejects cancelling an already-cancelled order with 409', async () => {
    const token = await login('standard_user');
    const orderId = await placeOrder(token);
    await axios.patch(
      `${API_URL}/api/orders/${orderId}`,
      { status: 'cancelled' },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    try {
      await axios.patch(
        `${API_URL}/api/orders/${orderId}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(409);
    }
  });

  it("rejects cancelling another user's order with 403", async () => {
    const ownerToken = await login('standard_user');
    const orderId = await placeOrder(ownerToken);

    const otherToken = await login('problem_user');
    try {
      await axios.patch(
        `${API_URL}/api/orders/${orderId}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${otherToken}` } },
      );
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(403);
    }
  });

  it('lets security_glitch_user cancel any order (deliberate IDOR bypass)', async () => {
    const ownerToken = await login('standard_user');
    const orderId = await placeOrder(ownerToken);

    const glitchToken = await login('security_glitch_user');
    const res = await axios.patch(
      `${API_URL}/api/orders/${orderId}`,
      { status: 'cancelled' },
      { headers: { Authorization: `Bearer ${glitchToken}` } },
    );
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('cancelled');
  });

  it('returns 404 for an unknown order_id', async () => {
    const token = await login('standard_user');
    try {
      await axios.patch(
        `${API_URL}/api/orders/ORDER-DOESNOTEXIST`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(404);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd tests
npx vitest run api.test.ts -t "PATCH /api/orders"
```
Expected: FAIL on all 5 — the route doesn't exist yet (404 from FastAPI's default handler, not from application logic, so even the "returns 404" case fails: it's checking for the *app's* 404, and status codes will not line up reliably before the route exists).

- [ ] **Step 3: Add `OrderStatusUpdate` to `models.py`**

Add directly after the `OrderSummary` class (before `# Country Info Model`):

```python
class OrderStatusUpdate(BaseModel):
    """PATCH /api/orders/{order_id} body — cancellation is the only supported transition."""
    status: Literal["cancelled"]
```

- [ ] **Step 4: Add `cancel_order` to `database.py`**

Add directly after `get_order`:

```python
    def cancel_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        order = self.orders.get(order_id)
        if order is not None:
            order["status"] = "cancelled"
        return order
```

- [ ] **Step 5: Extract the shared `_order_summary()` helper and refactor the two existing endpoints to use it**

In `backend/routers/checkout.py`, update the models import line:

```python
from models import CheckoutRequest, OrderSummary, OrderStatusUpdate
```

Add this module-level helper directly after the imports, before `router = APIRouter()`:

```python
def _order_summary(order: dict, currency_symbol: str) -> OrderSummary:
    return OrderSummary(
        order_id=order["order_id"],
        status=order["status"],
        subtotal=order["subtotal"],
        delivery_fee=order["delivery_fee"],
        tax_rate=order["tax_rate"],
        tip_percentage=order["tip_percentage"],
        tax=order["tax"],
        tip=order["tip"],
        total=order["total"],
        currency=order["currency"],
        currency_symbol=currency_symbol,
        items=order["items"],
        timestamp=order["timestamp"]
    )
```

Replace the `return OrderSummary(...)` at the end of `checkout()` (the one Task 4 added `status=order["status"]` to) with:

```python
    return _order_summary(order, country_config["currency_symbol"])
```

Replace the `return OrderSummary(...)` at the end of `get_order()` the same way:

```python
    return _order_summary(order, country_config["currency_symbol"])
```

Both functions already compute a local `country_config` before this return line — leave that computation as-is, only the final `return` changes.

- [ ] **Step 6: Restart the backend and run the full suite to confirm the refactor changed no behavior**

```bash
cd tests
npx vitest run
```
Expected: all PASS (in particular the Task 4 "OrderSummary status field" test and every `Golden:` case, since `_order_summary()` produces byte-identical output to the inline construction it replaced).

- [ ] **Step 7: Add the PATCH endpoint, using the helper**

Add after `get_order`:

```python
@router.patch(
    "/api/orders/{order_id}",
    response_model=OrderSummary,
    tags=["Orders"],
    responses={
        401: {"description": "Missing or invalid Authorization bearer token"},
        403: {"description": "Order belongs to another user"},
        404: {"description": "Order not found"},
        409: {"description": "Order is not in pending status"},
    },
)
async def cancel_order(
    order_id: str,
    request: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Cancel an order. The only supported transition is pending -> cancelled;
    any other current status returns 409. Ownership check mirrors
    GET /api/orders/{order_id}, including the security_glitch_user IDOR
    bypass — same deliberate chaos behavior, now on two endpoints instead
    of one."""
    order = db.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )

    if order["username"] != current_user["username"] and current_user["behavior"] != "security_glitch":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if order["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Order already {order['status']}, cannot cancel"
        )

    order = db.cancel_order(order_id)
    country_config = COUNTRY_CONFIG[CountryCode(order["country_code"])]

    return _order_summary(order, country_config["currency_symbol"])
```

- [ ] **Step 8: Run the tests written in Step 1**

They were written before any of Steps 3-7 existed (correct TDD order: test first). Steps 5-6 (helper extraction) landed between "write the test" and "make it pass" only because the helper needed to prove itself against the *existing* two endpoints first — that's a legitimate mid-flight refactor, not a reason to re-write the test. Run:

```bash
cd tests
npx vitest run api.test.ts -t "PATCH /api/orders"
```
Expected: all 5 PASS.

- [ ] **Step 9: Run the full suite**

```bash
cd tests
npx vitest run
```
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/models.py backend/database.py backend/routers/checkout.py tests/api.test.ts
git commit -m "feat: add PATCH /api/orders/{order_id} to cancel pending orders

Single supported transition (pending -> cancelled), 409 otherwise. Reuses
the same ownership check as GET /api/orders/{order_id}, including the
security_glitch_user IDOR bypass, so the chaos behavior stays consistent
across both endpoints. Extracts _order_summary() out of checkout()/
get_order(), which independently duplicated the same 14-line construction
before this — a third inline copy would have been one too many."
```

---

## Task 6: Primary docs — `README.md`, `index.html`, `API_EXAMPLES.md`

**Files:**
- Modify: `README.md` (`### Session Setup Endpoints` section, ~line 131-147)
- Modify: `index.html` (`#api-docs` → "Session Setup Routes" block, ~line 382-388 — this file **is** the GitHub Pages source; no separate Pages branch/workflow/`_config.yml` exists)
- Modify: `API_EXAMPLES.md` (`## Orders` and `## Session Setup Endpoints` sections)

No test framework applies to prose — verification is a grep-based self-check in Step 4.

- [ ] **Step 1: Update `README.md`**

Replace the `### Session Setup Endpoints` section:

```markdown
### Session Setup Endpoints

Atomic state setup endpoints exist for external automation runners (Playwright/Appium/Gatling). The session (market + cart) is keyed by the current login's JWT `sid` claim, not by username — two concurrent logins for the same test user get isolated carts.

- `POST /api/store/market`
- `POST /api/cart` — seed cart items (pizza_id, quantity, size); each line gets an `item_id` (server-generated unless you supply your own)
- `GET /api/cart` — retrieve enriched cart (joined with pizza catalog: name, price, image, currency), including `item_id` per line
- `PUT /api/cart/items/{item_id}` — create or replace one cart line (upsert)
- `DELETE /api/cart/items/{item_id}` — remove one cart line
- `POST /api/session/reset`
- `GET /api/session`

Access rules:

- Require:
  - `Authorization: Bearer <token>`
  - `X-Country-Code` header (for `GET /api/cart` to resolve pricing/currency)

These endpoints reuse the same JWT generated by `/api/auth/login`.
```

Then insert a new subsection directly after the existing `### Cart Hydration (API State Injection)` section and before the `---` that precedes `## What's inside`:

```markdown
### Order Management

- `GET /api/orders` / `GET /api/orders/{order_id}` — order history and detail (existing)
- `PATCH /api/orders/{order_id}` — cancel a `pending` order (`{"status": "cancelled"}`). Returns `409` if the order isn't `pending`, `404` if it doesn't exist, `403` if it belongs to another user (except `security_glitch_user`, which bypasses ownership by design).
```

- [ ] **Step 2: Update `index.html`**

Replace the "Session Setup Routes" `<pre>` block:

```html
        <h3 style="margin-top: 3rem">Session Setup Routes</h3>
        <pre class="code-window" data-title="backend/session-routes.http"><code><span class="tok-method">POST</span>   <span class="tok-path">/api/store/market</span>
<span class="tok-method">POST</span>   <span class="tok-path">/api/cart</span>                     <span class="tok-comment"># seed cart items</span>
<span class="tok-method">GET</span>    <span class="tok-path">/api/cart</span>                     <span class="tok-comment"># enriched cart (+ X-Country-Code)</span>
<span class="tok-method">PUT</span>    <span class="tok-path">/api/cart/items/{item_id}</span>     <span class="tok-comment"># create/replace one line</span>
<span class="tok-method">DELETE</span> <span class="tok-path">/api/cart/items/{item_id}</span>     <span class="tok-comment"># remove one line</span>
<span class="tok-method">POST</span>   <span class="tok-path">/api/session/reset</span>
<span class="tok-method">GET</span>    <span class="tok-path">/api/session</span>
<span class="tok-key">Authorization</span>: <span class="tok-val">Bearer &lt;token&gt;</span> <span class="tok-comment">(reuse app token)</span>
<span class="tok-comment"># Session is keyed by the login's JWT "sid" claim — concurrent logins for</span>
<span class="tok-comment"># the same username get isolated carts.</span></code></pre>

        <h3 style="margin-top: 3rem">Order Management Routes</h3>
        <pre class="code-window" data-title="backend/order-routes.http"><code><span class="tok-method">GET</span>   <span class="tok-path">/api/orders</span>
<span class="tok-method">GET</span>   <span class="tok-path">/api/orders/{order_id}</span>
<span class="tok-method">PATCH</span> <span class="tok-path">/api/orders/{order_id}</span>        <span class="tok-comment"># cancel: {"status": "cancelled"}, pending only</span>
<span class="tok-key">Authorization</span>: <span class="tok-val">Bearer &lt;token&gt;</span></code></pre>
```

- [ ] **Step 3: Update `API_EXAMPLES.md`**

Under `## Orders`, after the existing "Get Specific Order" example, update its response JSON to include `status` (insert `"status": "pending",` as the second key, after `"order_id"`), then add a new subsection:

```markdown
### Cancel Order

Only `pending` orders can be cancelled.

```bash
curl -X PATCH http://localhost:8000/api/orders/ORDER-A1B2C3D4 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

Response (200):
```json
{
  "order_id": "ORDER-A1B2C3D4",
  "status": "cancelled",
  "subtotal": 12.99,
  "delivery_fee": 2.0,
  "tax_rate": 0.08,
  "tip_percentage": 0.0,
  "tax": 1.04,
  "tip": 0.0,
  "total": 16.03,
  "currency": "USD",
  "currency_symbol": "$",
  "items": [...],
  "timestamp": "2026-04-18T10:30:00"
}
```

Errors: `404` if the order doesn't exist; `403` if it belongs to another user (except `security_glitch_user`); `409` if the order isn't `pending` (e.g. already cancelled).
```

Under `## Session Setup Endpoints`, replace the stale ownership note (currently `> **The cart is per-user, not per-market.**`) with:

```markdown
> **The cart is per-login-session, not per-username or per-market.** `POST /api/cart` does **not** read `X-Country-Code` and does **not** change the session's market — use `POST /api/store/market` (above) to switch markets. `GET /api/cart` does require `X-Country-Code` because it enriches items with market-specific pricing/currency. Two concurrent logins for the same username get isolated carts.
```

Add `"item_id": "ITEM-A1B2C3D4",` as the second key (after `"pizza_id"`) in the "Get Cart (Enriched)" response JSON example, then insert two new subsections directly after "Get Cart (Enriched)" and before "Read Current Session State":

```markdown
### Update One Cart Line

Upsert — creates the line if `item_id` is new, replaces it if it already exists.

```bash
curl -X PUT http://localhost:8000/api/cart/items/ITEM-A1B2C3D4 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pizza_id": "p01", "quantity": 3, "size": "large"}'
```

Response: same shape as `POST /api/store/market` / `POST /api/cart` (`TestSessionStateResponse` — the whole session, not just the one line).

### Remove One Cart Line

```bash
curl -X DELETE http://localhost:8000/api/cart/items/ITEM-A1B2C3D4 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Errors: `404` if `item_id` isn't in the caller's session.
```

- [ ] **Step 4: Verify**

```bash
grep -n "item_id\|PATCH /api/orders\|PUT /api/cart/items\|DELETE /api/cart/items" README.md index.html API_EXAMPLES.md
```
Expected: matches in all three files, in each section touched above.

- [ ] **Step 5: Commit**

```bash
git add README.md index.html API_EXAMPLES.md
git commit -m "docs: document PUT/DELETE cart items and PATCH order cancellation

Covers the GitHub Pages landing page (index.html), the repo README, and
the curl reference in API_EXAMPLES.md. Also corrects two now-stale
'per-user' cart ownership notes to 'per-login-session'."
```

---

## Task 7: Secondary reference docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `tests/README.md`
- Modify: `PROJECT_SUMMARY.md`
- Modify: `QUICKSTART.md`
- Modify: `frontend/public/README.md`

- [ ] **Step 1: Update `CLAUDE.md`**

In the `## Architecture` → `### Backend (backend/)` bullet list, replace the "Profile is keyed by session, not username" bullet:

```markdown
- **Profile and cart/market session state are both keyed by session, not username** (profile since the 2026-07-17 fix for a login-race condition; cart/market since the 2026-08-11 fix for the same class of bug surfacing in parallel cart-mutation tests) — every `POST /api/auth/login` mints a per-token `sid` JWT claim, and `get/update/reset/seed_user_profile` plus the session methods in `database.py` (`set_test_market`, `set_test_cart`, `get_test_session`, `reset_test_session`) store state under that `sid`, not under `username`. This means a fresh login always starts with a clean profile and cart automatically (no explicit reset call needed), and two concurrent logins for the same shared test user (e.g. two market scenarios authenticating as `standard_user` in parallel) get isolated profiles and carts instead of one clobbering the other.
```

- [ ] **Step 2: Update `tests/README.md`**

Replace the "Atomic setup endpoints (external runners only)" paragraph:

```markdown
### Atomic setup endpoints (external runners only)

Atomic setup orchestration is implemented outside this repository (for example in Playwright/Appium/Gatling projects).
This `tests/` package does not call the session setup endpoints directly (`/api/store/market`, `/api/cart`, `/api/cart/items/{item_id}` [PUT/DELETE], `/api/session`, `/api/session/reset`) — with one exception: a regression test for cart session-isolation (see "What is Tested" below) exercises `POST`/`GET /api/cart` directly, since that's core business-logic correctness (two logins must not share a cart), not atomic-setup mechanics. Contract coverage for the setup endpoints themselves comes from the schema-driven Schemathesis test in `test_contract.py`.
Those endpoints authenticate with the same bearer token returned by `/api/auth/login`.
```

Add two rows to the "What is Tested" table:

```markdown
| `PATCH /api/orders/{order_id}` | Cancellation: pending→cancelled (200), already-cancelled (409), wrong owner (403, except `security_glitch_user` bypass), unknown id (404) |
| `Cart session isolation` | Two concurrent logins for the same username get isolated carts (regression test for the session_id-keying fix) |
```

- [ ] **Step 3: Update `PROJECT_SUMMARY.md`**

Change the endpoint count line (`- **Endpoints API**: 15+ (...)`) to:

```markdown
- **Endpoints API**: 20+ (`/api/auth`, `/api/countries`, `/api/pizzas`, `/api/checkout`, `/api/orders` [incl. `PATCH` cancel], `/api/debug`, `/api/store/market`, `/api/cart` [incl. `PUT`/`DELETE /items/{item_id}`], `/api/session*`)
```

- [ ] **Step 4: Update `QUICKSTART.md`**

At the end of the "Cart State Injection (E2E Automation)" section (after the line `Both web and mobile checkout screens call GET /api/cart on load and populate the cart store from the backend response.`), add:

```markdown
Individual lines can also be adjusted without reseeding the whole cart: `PUT /api/cart/items/{item_id}` (create or replace one line) and `DELETE /api/cart/items/{item_id}` (remove one line). See `API_EXAMPLES.md` for full examples.
```

- [ ] **Step 5: Update `frontend/public/README.md`**

In the "Main endpoints" list, add one line:

```markdown
- `PATCH /api/orders/{order_id}` — cancel a pending order
```

- [ ] **Step 6: Verify**

```bash
grep -rn "item_id\|PATCH /api/orders\|session_id\|sid.*claim" CLAUDE.md tests/README.md PROJECT_SUMMARY.md QUICKSTART.md frontend/public/README.md
```
Expected: matches in all five files.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md tests/README.md PROJECT_SUMMARY.md QUICKSTART.md frontend/public/README.md
git commit -m "docs: sync secondary reference docs with the new verbs and sid keying"
```

---

## Task 8: PRD + atomic-testing guides

**Files:**
- Modify: `documents/Product_Requirement_Doc.md` (§6.7.1, §6.10, and the endpoint table)
- Modify: `ATOMIC_WEB_TESTING.md`
- Modify: `ATOMIC_MOBILE_TESTING.md`

- [ ] **Step 1: Update `documents/Product_Requirement_Doc.md` §6.7.1 (Cart API)**

Add after the existing bullets in that section:

```markdown
* `PUT /api/cart/items/{item_id}` — upsert one cart line; creates if `item_id` is new, replaces if it exists. Requires `Authorization` only (no `X-Country-Code`).
* `DELETE /api/cart/items/{item_id}` — removes one cart line. `404` if `item_id` doesn't exist in the caller's session.
* Cart state (and market) is keyed by the login's JWT `sid` claim, not by username — concurrent logins for the same test user get isolated carts.
```

- [ ] **Step 2: Update §6.10 (Orders and Access Control)**

Add after the existing bullets:

```markdown
* `PATCH /api/orders/{order_id}` — cancels an order (`{"status": "cancelled"}`). Only `pending` orders can be cancelled (`409` otherwise). Ownership rules match `GET /api/orders/{order_id}`: `403` if not owned, except `security_glitch_user` (deliberate IDOR bypass). `404` if the order doesn't exist.
```

- [ ] **Step 3: Update the endpoint table**

Correct the pre-existing inaccuracy on the `POST /api/cart` row (it lists `X-Country-Code` as a required header, but that endpoint never reads it — confirmed against `test_api.py`'s own docstring while adding the rows below it, so fixing it here keeps the table internally consistent instead of leaving one known-wrong row next to new accurate ones):

```markdown
| `POST /api/cart` | Yes | `Authorization` | `200` seeded cart | `400`, `401` |
```

Add three new rows after the `GET /api/orders/{id}` row:

```markdown
| `PUT /api/cart/items/{item_id}` | Yes | `Authorization` | `200` upserted cart | `401` |
| `DELETE /api/cart/items/{item_id}` | Yes | `Authorization` | `200` updated cart | `401`, `404` |
| `PATCH /api/orders/{order_id}` | Yes | `Authorization` | `200` order summary | `401`, `403`, `404`, `409` |
```

- [ ] **Step 4: Update `ATOMIC_WEB_TESTING.md`**

Near the existing cart-seeding section (the `// 2. Seed cart` Playwright example), add one sentence directly after it:

```markdown
Individual lines can be adjusted after seeding via `PUT`/`DELETE /api/cart/items/{item_id}`, without reseeding the whole cart — see `API_EXAMPLES.md`.
```

Near the existing atomic order-success section (the `GET /api/orders/{id}` mention), add one sentence directly after it:

```markdown
`PATCH /api/orders/{id}` (`{"status": "cancelled"}`) is also available for testing order-cancellation UI states, subject to the same ownership rules as the GET.
```

- [ ] **Step 5: Update `ATOMIC_MOBILE_TESTING.md`**

Near the existing `POST /api/cart` seeding example, add:

```markdown
Individual lines can be adjusted after seeding via `PUT`/`DELETE /api/cart/items/{item_id}`, without reseeding the whole cart — see `API_EXAMPLES.md`.
```

Near the `orderId` deep-link param documentation (`GET /api/orders/{id}` → `lastOrder`), add:

```markdown
`PATCH /api/orders/{id}` (`{"status": "cancelled"}`) is also available for testing order-cancellation states, subject to the same ownership rules as the GET.
```

- [ ] **Step 6: Verify**

```bash
grep -n "item_id\|PATCH /api/orders" documents/Product_Requirement_Doc.md ATOMIC_WEB_TESTING.md ATOMIC_MOBILE_TESTING.md
```
Expected: matches in all three files.

- [ ] **Step 7: Commit**

```bash
git add documents/Product_Requirement_Doc.md ATOMIC_WEB_TESTING.md ATOMIC_MOBILE_TESTING.md
git commit -m "docs: sync PRD and atomic-testing guides with the new verbs

Also corrects a pre-existing inaccuracy in the PRD endpoint table (POST
/api/cart never reads X-Country-Code, despite what the table said)."
```

---

## Task 9: Integration

**Files:** none new — merges Tasks 1-8 and verifies the result.

- [ ] **Step 1: Merge all three tracks**

Merge the Track A (Tasks 1, 2, 3), Track B (Tasks 4, 5), and Track C (Tasks 6, 7, 8) branches/worktrees into the integration branch (or `main`, per whatever the executor's branch strategy is), resolving any conflicts in `backend/models.py`/`backend/database.py` — expected to be clean (Tasks 1/3 touch cart-related classes/methods, Tasks 4/5 touch order-related ones). `backend/response_docs.py` (Task 2, Track A) and `backend/routers/checkout.py`'s literal `responses=` dict on the PATCH endpoint (Task 5, Track B — see that task's note on why it isn't an import) coexist without conflict; no action needed to reconcile them.

- [ ] **Step 2: Restart the backend on the merged code**

```bash
cd backend
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" main.py &
```

- [ ] **Step 3: Run the full Vitest suite**

```bash
cd tests
npx vitest run
```
Expected: all PASS, including every test added in Tasks 1, 4, and 5.

- [ ] **Step 4: Run the Schemathesis contract suite**

```bash
cd tests
"C:\Users\gilsa\Documents\Repos\OmniPizza\backend\venv\Scripts\python.exe" -m pytest test_contract.py -v
```
Expected: no `UndefinedStatusCode` failures anywhere, including the new `PUT`/`DELETE /api/cart/items/{item_id}` and `PATCH /api/orders/{order_id}` cases (their own `responses=` were written in Tasks 3 and 5). The two pre-existing, unrelated exceptions noted in Task 2 Step 10 (`test_locked_out_user_behavior`'s `detail`-vs-`error` key mismatch, and the occasional Hypothesis-unicode `UnicodeEncodeError`) are still not this plan's job to fix — confirm they're the *only* remaining failures, if any.

- [ ] **Step 5: Replay Task 3's manual curl sequence against the merged build**

Re-run all six commands from Task 3 Step 5. Confirms the cart-item endpoints still behave correctly after merging with Track B's changes to `backend/database.py`.

- [ ] **Step 6: Spot-check the docs against final behavior**

```bash
grep -rn "PUT /api/cart/items\|DELETE /api/cart/items\|PATCH /api/orders" README.md index.html API_EXAMPLES.md CLAUDE.md tests/README.md PROJECT_SUMMARY.md QUICKSTART.md frontend/public/README.md documents/Product_Requirement_Doc.md ATOMIC_WEB_TESTING.md ATOMIC_MOBILE_TESTING.md
```

Confirm every path and status code mentioned matches what actually shipped (in particular: the `409`/`403`/`404` codes for `PATCH /api/orders`, and that no doc claims `X-Country-Code` is required by the new cart-item endpoints).

- [ ] **Step 7: Confirm no unrelated files were touched**

```bash
git status --short
git diff --stat main...HEAD  # or the appropriate base ref
```
Expected: only the files listed in this plan's File Structure table. In particular, nothing under `documents/paper/`.
