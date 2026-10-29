# Wave 1 — Backend: menu expansion, temporary accounts, welcome coupon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the backend half of the approved design: 20 pizzas + 6 drinks + 10 desserts with `item_type` cart lines, and temporary accounts (guest / profiled) with a single-use 15% welcome coupon applied at checkout.

**Architecture:** Two parallel worktrees cut from `US-and-Improvements`. **W1 (menu)** adds a `menu.py` data module, two catalog endpoints and the `item_type` / `product_id` cart contract. **W2 (accounts)** adds an `accounts.py` registry owned by `InMemoryDB`, register / guest / logout, `profile_type`, the coupon endpoints, and (only after W1 is merged into the base) the discount in checkout totals. All state stays in `database.py::InMemoryDB` (no persistence); expiry is lazy.

**Tech Stack:** FastAPI 0.109 + Pydantic 2.5 (`backend/`), Vitest 4 + axios HTTP tests (`tests/`), pytest 9 + FastAPI `TestClient` for registry internals that need an injected clock / capacity (`backend/test_accounts.py`).

**Spec:** `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (approved 2026-10-29). Clients (web, mobile) are Wave 2, planned separately once these contracts are merged.

## Global Constraints

- Do not change any existing path, response key, status code, header rule or the 7 test users; `pizza_id` stays the universal product id in cart and order lines (`product_id` is an accepted, echoed alias).
- Required headers stay strict (`Authorization`, `X-Country-Code`, `X-Language` on catalog/cart); register, guest, logout, coupon endpoints need only what the spec says (register/guest: nothing; logout/coupon: `Authorization`).
- HTTP errors keep the `{error, status_code, timestamp}` shape via `HTTPException`; body validation stays FastAPI's 422 `{detail:[...]}`. **All API messages are English and exactly as written here:** `Username already taken` (409), `Too many users` (429), `Invalid coupon code` (400), `Coupon already used` (409), `Unknown product` (422), `No coupon for this account` (404).
- Money goes through `round_currency_amount` (half-up, market decimals) for totals; catalog price conversion keeps `_convert_price`.
- No brand names anywhere in drink data; no alcohol mentioned in any dessert text in any language; Arabic pizza text uses halal-safe wording (beef / turkey, never pork).
- No persistence, no background threads; a backend restart is a clean slate.
- Every new endpoint declares `responses=` for every status it can return (the DOC-002 story depends on it).
- Nothing is pushed, merged to `main`, deployed or built for mobile by the implementer; commits land on the worktree branch only.

## Review Focus

1. Username with surrounding spaces or different case (`"  Alice "`, then `"alice"`): stripped before validation, uniqueness is case-insensitive → second registration 409 — pinned in Task 9.
2. Coupon code typed in lowercase with spaces (`" welcome15-abc123 "`): accepted and reported with the canonical uppercase code — pinned in Task 11.
3. A token issued to an account that was logged out and whose username was registered again: the old token must be 401, never the new account — pinned in Task 8.
4. A checkout that fails after the coupon was validated (missing `zip_code` → 400): the coupon stays `available` — pinned in Task 13.
5. A drink line carrying `size: "family"` and 3 toppings: no upcharge at all — pinned in Task 5.

## Execution notes (read before Task 1)

- Create the worktrees from the base branch yourself (the agent tooling's `isolation: worktree` cuts from `origin/main` and would miss the base-branch fixes):
  ```bash
  git worktree add .worktrees/w1-menu -b w1-menu-backend US-and-Improvements
  git worktree add .worktrees/w2-accounts -b w2-accounts-backend US-and-Improvements
  ```
- Backend per worktree, from `<worktree>/backend`, using the main checkout's venv: `C:/Users/gilsa/Documents/Repos/OmniPizza/backend/venv/Scripts/python.exe -m uvicorn main:app --port 8001` (W1) / `--port 8002` (W2). No `--reload`: restart after every backend edit.
- Vitest per worktree: create a junction so the worktree reuses the installed packages (PowerShell: `New-Item -ItemType Junction -Path <worktree>/tests/node_modules -Target C:/Users/gilsa/Documents/Repos/OmniPizza/tests/node_modules`), then from `<worktree>/tests`: `API_BASE_URL=http://localhost:8001 npx vitest run menu.test.ts` (bash) — `pnpm test -- file` does not isolate; always name the file.
- Pytest (W2 only), from `<worktree>/backend`: `C:/Users/gilsa/Documents/Repos/OmniPizza/backend/venv/Scripts/python.exe -m pytest test_accounts.py -q`.
- "Run the full suite" means, from `<worktree>/tests`: `API_BASE_URL=http://localhost:800N npx vitest run` (api, golden and the new files), plus pytest in W2.
- Commit with explicit paths. Conventional Commits. Do not touch `.gitignore`.
- Merge order: W1 → base; then W2 (Tasks 7–11 can run in parallel with W1; Tasks 12–14 start only after W1 is merged into the base and merged into the W2 branch).

---

# W1 — Menu backend (worktree `.worktrees/w1-menu`, port 8001)

### Task 1: Images and credits for the 24 new items (plus the 12 existing pizzas)

**Files:**
- Create: `documents/image-credits.md`

**Interfaces:**
- Produces: one 500px Wikimedia Commons thumbnail URL per new item id (`p13`–`p20`, `dr01`–`dr06`, `ds01`–`ds10`), used verbatim by Tasks 2 and 3.

- [ ] **Step 1: Find candidate files on Commons** for each item name with the search API (`https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json&srsearch=<term>`), always with a descriptive `User-Agent` (`OmniPizza-QA-sandbox/1.0 (github.com/gsanchezm/OmniPizza)`). Only accept files whose `extmetadata.LicenseShortName` is `CC BY`, `CC BY-SA` (any version), `CC0` or `Public domain` (`prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500`); take the `thumburl` (width 500 is on the thumbnail whitelist; other widths return 400).
- [ ] **Step 2: Review every picture by eye** — download each thumbnail to the scratchpad and open it with the Read tool. Reject any image showing a logo, brand, label, packaging text or a person's face. Drinks must look generic (a glass or a plain bottle/can with no label).
- [ ] **Step 3: Write `documents/image-credits.md`** with one table (`| id | item | Commons file | author | license | source page |`) covering the 24 new items and the 12 existing pizzas (`p01`–`p12`: look their file titles up from the URLs already in `backend/constants.py`). Sort by id.
- [ ] **Step 4: Verify** every URL in the table answers 200 to `curl -I -A "OmniPizza-QA-sandbox/1.0" <thumburl>` (36 lines of `HTTP/2 200`).
- [ ] **Step 5: Commit**

```bash
git add documents/image-credits.md
git commit -m "docs: image credits for the expanded menu (Wikimedia Commons)"
```

### Task 2: Pizzas 13–20 in `PIZZA_CATALOG`

**Files:**
- Modify: `backend/constants.py` (append to `PIZZA_CATALOG`, after `p12`)
- Test: `tests/menu.test.ts` (new)

**Interfaces:**
- Produces: ids `p13`–`p20` with the exact `base_price` and `category` below; the same dict shape as `p01` (`id`, `base_price`, `category`, `image`, `name{en,es,de,fr,ja,ar}`, `description{…}`).

| id | name (en) | category | base_price |
|---|---|---|---|
| p13 | Meat Lovers | meat | 16.99 |
| p14 | Buffalo Chicken | meat | 15.99 |
| p15 | Mexicana | meat | 14.99 |
| p16 | Pesto Chicken | meat | 15.49 |
| p17 | Burrata | popular | 16.49 |
| p18 | Truffle Mushroom | veggie | 17.99 |
| p19 | Mediterranean | veggie | 14.49 |
| p20 | Vegan Garden | veggie | 13.99 |

- [ ] **Step 1: Write the failing tests** in `tests/menu.test.ts` (copy the `login` / `authHeaders` helpers from `api.test.ts`; add an `X-Language` param):

```ts
describe('GET /api/pizzas — 20 pizzas', () => {
  it('returns p01..p20 in order with the new names, prices and categories (US/en)', async () => {
    // ids === ['p01', …, 'p20']; p13 {name:'Meat Lovers', price:16.99, category:'meat'};
    // p20 {name:'Vegan Garden', price:13.99, category:'veggie'}; every item has a non-empty image URL
  });
  it('localizes every pizza in SA/ar and mentions no pork in Arabic', async () => {
    // all 20 names and descriptions are non-empty and differ from the en text;
    // no ar description contains 'لحم خنزير' or 'خنزير'
  });
});
```

- [ ] **Step 2: Run** `API_BASE_URL=http://localhost:8001 npx vitest run menu.test.ts` → FAIL (12 ids, `p13` undefined).
- [ ] **Step 3: Append the 8 entries** to `PIZZA_CATALOG` with the Task 1 image URLs and six-language `name` / `description` in the existing style (ingredients list, Arabic halal-safe: Meat Lovers = beef pepperoni, beef sausage, turkey; Mexicana = beef chorizo). Restart the backend.
- [ ] **Step 4: Run the test** → PASS; run `npx vitest run golden.test.ts` → still green (`SA/ar: all pizza names…` now checks 20).
- [ ] **Step 5: Commit**

```bash
git add backend/constants.py tests/menu.test.ts
git commit -m "feat(menu): grow the pizza catalog to 20"
```

### Task 3: Drinks and desserts data module

**Files:**
- Create: `backend/menu.py`
- Modify: `backend/database.py:1-20` (import `PRODUCT_BY_ID` from `menu`, keep `PIZZA_BY_ID` as `PRODUCT_BY_ID["pizza"]`)
- Test: `backend/test_menu_data.py` (new, pytest, data-only)

**Interfaces:**
- Produces, in `backend/menu.py`:
  - `ITEM_TYPES: tuple[str, ...] = ("pizza", "drink", "dessert")`
  - `DRINK_CATALOG: list[dict]` ids `dr01`–`dr06`, `category: "soda"`; `DESSERT_CATALOG: list[dict]` ids `ds01`–`ds10`, `category: "dessert"`; same dict shape as a pizza.
  - `MENU_BY_TYPE: dict[str, list[dict]]` = `{"pizza": PIZZA_CATALOG, "drink": DRINK_CATALOG, "dessert": DESSERT_CATALOG}`
  - `PRODUCT_BY_ID: dict[str, dict[str, dict]]` = per type, id → item.
  - `find_product(item_type: str, product_id: str) -> dict | None`

| id | name (en) | base_price | | id | name (en) | base_price |
|---|---|---|---|---|---|---|
| dr01 | Cola | 1.99 | | ds01 | Tiramisu | 5.99 |
| dr02 | Lemon-Lime | 1.99 | | ds02 | Panna Cotta | 4.99 |
| dr03 | Orange | 2.49 | | ds03 | Cannoli | 4.49 |
| dr04 | Ginger Ale | 2.49 | | ds04 | Gelato | 3.99 |
| dr05 | Grape | 2.49 | | ds05 | NY Cheesecake | 6.99 |
| dr06 | Root Beer | 2.99 | | ds06 | Brownie | 3.99 |
| | | | | ds07 | Apple Pie | 4.99 |
| | | | | ds08 | Churros | 4.49 |
| | | | | ds09 | Tres Leches | 5.49 |
| | | | | ds10 | Flan | 4.99 |

Every drink description (all six languages) ends with the volume, e.g. en `"Classic cola soda, 330 ml"`; `330 ml` is text, not a field. Dessert descriptions name the ingredients and never a spirit, wine or liqueur (Tiramisu = coffee-soaked sponge, mascarpone, cocoa).

- [ ] **Step 1: Write the failing pytest** `backend/test_menu_data.py`:

```python
BRANDS = ["coca", "pepsi", "sprite", "fanta", "7up", "schweppes", "canada dry", "a&w", "mountain dew", "dr pepper", "mirinda", "crush", "barq"]
ALCOHOL = ["rum", "liqueur", "marsala", "wine", "amaretto", "kahl", "brandy", "alcohol", "ron ", "licor", "vino", "wein", "likör", "alkohol", "vin ", "alcool", "ラム", "リキュール", "ワイン", "كحول", "نبيذ", "روم"]
def test_drinks_six_ids_prices_and_330ml(): ...   # ids dr01..dr06, base_price per table, category soda, "330 ml" in all 6 descriptions
def test_desserts_ten_ids_and_prices(): ...       # ids ds01..ds10, base_price per table, category dessert
def test_six_languages_everywhere(): ...          # name and description have keys en,es,de,fr,ja,ar, all non-empty, for all 16 items
def test_no_brand_names(): ...                    # no BRANDS substring (casefold) in any drink name/description/image URL
def test_no_alcohol_in_desserts(): ...            # no ALCOHOL substring (casefold) in any dessert text
def test_product_index_and_find(): ...            # PRODUCT_BY_ID["pizza"] has 20 keys; find_product("drink","dr01")["base_price"]==1.99; find_product("drink","p01") is None
```

- [ ] **Step 2: Run** `python -m pytest test_menu_data.py -q` (from `backend/`) → FAIL (`ModuleNotFoundError: menu`).
- [ ] **Step 3: Create `backend/menu.py`** with the data and helpers above; in `database.py` replace the `PIZZA_BY_ID` comprehension with `from menu import PRODUCT_BY_ID, find_product` and `PIZZA_BY_ID = PRODUCT_BY_ID["pizza"]`.
- [ ] **Step 4: Run** pytest → PASS; restart the backend and run `npx vitest run api.test.ts golden.test.ts` → green (behaviour unchanged).
- [ ] **Step 5: Commit**

```bash
git add backend/menu.py backend/database.py backend/test_menu_data.py
git commit -m "feat(menu): drinks and desserts data module"
```

### Task 4: `GET /api/drinks` and `GET /api/desserts`

**Files:**
- Create: `backend/routers/menu.py`
- Modify: `backend/models.py` (add `MenuItem`, `DrinkResponse`, `DessertResponse`), `backend/database.py` (`get_catalog` gains `item_type`), `backend/main.py:49-54` (`include_router(menu_router)`)
- Test: `tests/menu.test.ts`

**Interfaces:**
- `InMemoryDB.get_catalog(self, country_code, behavior="standard", language=None, item_type: str = "pizza") -> List[Dict]` iterates `MENU_BY_TYPE[item_type]`; existing callers unchanged.
- `class MenuItem(BaseModel)`: same nine fields as `Pizza` (`id, name, description, price, base_price, currency, currency_symbol, image, category`). `class DrinkResponse(BaseModel)`: `drinks: List[MenuItem]`, `country_code: str`, `currency: str`. `class DessertResponse`: `desserts: List[MenuItem]`, same two fields.
- Endpoints mirror `get_pizzas` exactly (`require_country_header`, `apply_user_behavior`, `X-Language` default `"en"`, `responses={**AUTH_RESPONSES, **COUNTRY_HEADER_RESPONSES}`, tags `["Drinks"]` / `["Desserts"]`, a `summary=`).

- [ ] **Step 1: Write the failing tests** in `tests/menu.test.ts`:

```ts
describe('GET /api/drinks and /api/desserts', () => {
  it('drinks: 6 items dr01..dr06, category soda, US prices, 330 ml in the description', …); // dr01 1.99, dr06 2.99
  it('desserts: 10 items ds01..ds10, category dessert, ds01 5.99 / ds05 6.99 (US/en)', …);
  it('converts and localizes like pizzas: MX/es dr01 34.92 Spanish name; JP/ja dr01 314 and ds01 946 (integers)', …);
  it('requires X-Country-Code (400) and a token (401) on both', …);
  it('problem_user gets price 0 and the broken image on both', …); // image === 'https://broken-image-url.com/404.jpg'
});
```

- [ ] **Step 2: Run** `npx vitest run menu.test.ts` → FAIL (404 on `/api/drinks`).
- [ ] **Step 3: Implement** the models, the `item_type` parameter and `backend/routers/menu.py` (two handlers calling `db.get_catalog(..., item_type="drink" | "dessert")`), mount it in `main.py`. Restart the backend.
- [ ] **Step 4: Run** `npx vitest run menu.test.ts` → PASS; full suite green.
- [ ] **Step 5: Commit**

```bash
git add backend/routers/menu.py backend/models.py backend/database.py backend/main.py tests/menu.test.ts
git commit -m "feat(menu): GET /api/drinks and GET /api/desserts"
```

### Task 5: `item_type` and `product_id` on cart and checkout lines

**Files:**
- Modify: `backend/models.py:60-80` (`CartItem`, `EnrichedCartItem`), `backend/menu.py` (`assert_known_products`), `backend/database.py` (`get_enriched_cart`, `calculate_order_total`), `backend/test_api.py` (`seed_cart`, `put_cart_item`), `backend/routers/checkout.py:41-125`
- Test: `tests/menu.test.ts`

**Interfaces:**
- `CartItem`: `pizza_id: Optional[str] = None`, `product_id: Optional[str] = None`, `item_type: Literal["pizza", "drink", "dessert"] = "pizza"`, rest unchanged. A `model_validator(mode="after")` fills whichever id is missing from the other, raises `ValueError("pizza_id or product_id is required")` when both are missing and `ValueError("pizza_id and product_id must match")` when they differ (both → FastAPI 422).
- `EnrichedCartItem` gains `item_type: str = "pizza"` and `product_id: str`.
- `menu.assert_known_products(items: Iterable[dict]) -> None`: for every item whose `item_type` is `drink` or `dessert` and whose id is not in that menu, raise `HTTPException(422, "Unknown product")`. Unknown *pizza* ids stay lenient (skipped, as today).
- `calculate_order_total`: unit price for `drink` / `dessert` = `_convert_price(base_price)` with no size or topping upcharge; pizzas unchanged. Called by checkout after `assert_known_products`.
- `seed_cart`, `put_cart_item` and `checkout` call `assert_known_products([...dicts])` before storing / pricing.
- `get_enriched_cart` looks the product up by `(item_type, pizza_id)`, echoes `item_type` and `product_id`, and keeps `size` / `toppings` as stored.

- [ ] **Step 1: Write the failing tests** in `tests/menu.test.ts`:

```ts
describe('item_type and product_id', () => {
  it('seeds a drink and a dessert line and reads them back enriched (US/en)', …);
  // POST /api/cart [{pizza_id:'dr01',item_type:'drink',quantity:2},{product_id:'ds01',item_type:'dessert',quantity:1}]
  // GET /api/cart: line 0 {name:'Cola', item_type:'drink', product_id:'dr01', pizza_id:'dr01', price:1.99}; line 1 pizza_id 'ds01'
  it('rejects mismatched ids, a non-pizza unknown id and an invalid item_type with 422', …);
  // {pizza_id:'p01',product_id:'dr01'} → 422; {pizza_id:'p01',item_type:'drink'} → 422 error 'Unknown product'; item_type:'snack' → 422
  it('keeps the lenient legacy behaviour for an unknown pizza id', …); // POST /api/cart [{pizza_id:'zzz'}] → 200
  it('checkout prices a mixed US cart and ignores size/toppings on non-pizza lines', …);
  // items p01 small ×1, dr01 ×2 size 'family' toppings ['pepperoni','olives','onion'], ds01 ×1; zip_code '12345', tip 0
  // subtotal 22.96, delivery_fee 2, tax 1.84, tip 0, total 26.8; items[1].item_type === 'drink'
  it('rejects a checkout line with an unknown dessert id with 422 Unknown product', …);
});
```

- [ ] **Step 2: Run** → FAIL (`item_type` missing from `GET /api/cart`, subtotal wrong).
- [ ] **Step 3: Implement** the model changes, `assert_known_products`, the pricing branch and the enriched-cart lookup; wire the three call sites. Restart the backend.
- [ ] **Step 4: Run** `npx vitest run menu.test.ts` → PASS; full suite green (goldens unchanged: no coupon, pizzas priced as before).
- [ ] **Step 5: Commit**

```bash
git add backend/models.py backend/menu.py backend/database.py backend/test_api.py backend/routers/checkout.py tests/menu.test.ts
git commit -m "feat(menu): item_type and product_id on cart and checkout lines"
```

### Task 6: W1 wrap-up

- [ ] **Step 1:** Full suite from `<w1>/tests` (`npx vitest run`) and `python -m pytest test_menu_data.py -q` → all green; `curl -s localhost:8001/api/openapi.json | python -c "import json,sys; s=json.load(sys.stdin); print(sorted(p for p in s['paths'] if 'drink' in p or 'dessert' in p))"` prints both new paths.
- [ ] **Step 2:** Report the branch name and the list of commits; do not merge or push (the orchestrator merges W1 into `US-and-Improvements`).

---

# W2 — Accounts and coupon backend (worktree `.worktrees/w2-accounts`, port 8002)

### Task 7: Temporary-account registry

**Files:**
- Create: `backend/accounts.py`, `backend/test_accounts.py`
- Modify: `backend/database.py` (`InMemoryDB.__init__` + account methods)

**Interfaces (produced):**
- `backend/accounts.py`:
  - `MAX_TEMPORARY_ACCOUNTS = 200`, `COUPON_PERCENT = 15`, `COUPON_PREFIX = "WELCOME15-"`, `PROFILE_TEST = "test"`, `PROFILE_GUEST = "guest"`, `PROFILE_PROFILED = "profiled"`
  - `def now() -> datetime` (returns `datetime.utcnow()`; tests monkeypatch it)
  - `def generate_coupon_code() -> str` → `COUPON_PREFIX` + 6 chars from `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` via `secrets.choice`
  - `class UsernameTaken(Exception)`, `class TooManyAccounts(Exception)`, `class InvalidCoupon(Exception)`, `class CouponUsed(Exception)`
  - `class TemporaryAccountRegistry:`
    - `__init__(self, reserved: Iterable[str], ttl_minutes: int, capacity: int = MAX_TEMPORARY_ACCOUNTS)`
    - `purge_expired(self) -> List[dict]` removes and returns accounts with `expires_at <= now()`
    - `count_active(self) -> int`
    - `register(self, username: str, full_name: Optional[str]) -> dict` — strips `username`; raises `UsernameTaken` if `username.casefold()` is reserved or active, `TooManyAccounts` if `count_active() >= capacity`; stores `{"username", "key", "profile_type": "profiled", "sid": uuid4().hex, "behavior": "standard", "description": "Temporary profiled account", "full_name", "expires_at": now()+ttl, "coupon": {"code", "percent": 15, "status": "available"}}`
    - `create_guest(self) -> dict` — username `guest_` + 8 hex chars, `profile_type: "guest"`, `coupon: None`, same cap rule
    - `get(self, username: str) -> Optional[dict]` (by `casefold()`), `delete(self, username: str) -> Optional[dict]`
    - `resolve_coupon(self, username: str, code: str) -> dict` — normalizes `code.strip().upper()`; raises `InvalidCoupon` when the account is missing, has no coupon or the code differs; `CouponUsed` when `status == "used"`; returns the coupon dict
    - `consume_coupon(self, username: str) -> None` sets `status = "used"`
  - Every public method calls `purge_expired()` first.
- `backend/database.py` (`InMemoryDB`):
  - `self.accounts = TemporaryAccountRegistry(reserved=TEST_USERS.keys(), ttl_minutes=settings.access_token_expire_minutes)`
  - `clear_session_state(self, session_id: str) -> None` pops `sessions` and `user_profiles` for that sid
  - `_cascade_delete(self, account: dict) -> None` = `clear_session_state(account["sid"])` + drop every order whose `username == account["username"]`
  - `purge_expired_accounts(self) -> int` (cascades each purged account), `register_account(username, full_name) -> dict` (seeds `full_name` into the sid profile when given), `create_guest_account() -> dict`, `get_account(username) -> Optional[dict]`, `delete_account(username) -> bool` (cascade), `get_coupon(username) -> Optional[dict]`, `resolve_coupon(username, code) -> dict`, `consume_coupon(username) -> None` — each purges first via the registry.

- [ ] **Step 1: Write the failing pytest** `backend/test_accounts.py` (pure registry + db, no HTTP yet):

```python
def test_register_returns_profiled_account_with_available_coupon(): ...  # profile_type, coupon code matches r"^WELCOME15-[A-Z2-9]{6}$", percent 15, status available
def test_username_is_stripped_and_unique_case_insensitively(): ...      # register("  Alice ") then register("alice") raises UsernameTaken; stored username == "Alice"
def test_reserved_test_usernames_are_taken(): ...                        # register("Standard_User") raises UsernameTaken
def test_capacity_counts_guests_and_profiled(): ...                      # capacity=2: one guest + one register ok, third raises TooManyAccounts
def test_expired_accounts_are_purged_lazily_and_cascade(monkeypatch): ...# db.register_account + an order for it + a cart line; advance accounts.now by 31 min; db.get_account → None; order and session gone
def test_delete_account_removes_orders_sessions_and_profile(): ...
def test_coupon_resolve_normalizes_and_rejects(): ...                    # " welcome15-xxxxxx " → ok; wrong code → InvalidCoupon; after consume → CouponUsed; guest → InvalidCoupon
```

- [ ] **Step 2: Run** `python -m pytest test_accounts.py -q` (from `backend/`) → FAIL (`ModuleNotFoundError: accounts`).
- [ ] **Step 3: Implement** `backend/accounts.py` and the `InMemoryDB` methods.
- [ ] **Step 4: Run** pytest → PASS.
- [ ] **Step 5: Commit**

```bash
git add backend/accounts.py backend/database.py backend/test_accounts.py
git commit -m "feat(accounts): temporary account registry with lazy expiry and cascade delete"
```

### Task 8: `get_current_user` resolves temporary accounts; `profile_type` everywhere

**Files:**
- Modify: `backend/middleware.py:28-50`, `backend/models.py:11-20` (`LoginResponse`, `UserProfile`), `backend/routers/auth.py:30-100`
- Test: `backend/test_accounts.py` (TestClient), `tests/accounts.test.ts` (new)

**Interfaces:**
- `get_current_user` returns, for a test user, `{**user, "session_id": sid, "profile_type": "test"}`; for a temporary account `{"username", "behavior": "standard", "description", "session_id": account["sid"], "profile_type": account["profile_type"]}`; **401 `User not found` when the token's `sid` differs from the account's `sid`** or the account is gone.
- `LoginResponse` gains `profile_type: Literal["test","guest","profiled"] = "test"` and `coupon: Optional[Coupon] = None`; `class Coupon(BaseModel)`: `code: str`, `percent: int`, `status: Literal["available","used"]`. `UserProfile` gains `profile_type: str = "test"`.
- JWT claims for every token: `sub`, `behavior`, `sid`, `profile_type`.
- `POST /api/auth/login` is unchanged apart from `profile_type: "test"` in the response (a registered username still answers 401 `Invalid username or password`).

- [ ] **Step 1: Write the failing tests**
  - pytest (TestClient, `from main import app`): `test_stale_token_after_reregistration_is_401` — register `bob` via `db.register_account`, mint a token with `create_access_token({"sub":"bob","behavior":"standard","sid":old_sid,"profile_type":"profiled"})`, `db.delete_account("bob")`, register `bob` again, `GET /api/auth/profile` with the old token → 401 `{"error":"User not found"}`.
  - vitest `tests/accounts.test.ts`: `'login response and GET /api/auth/profile carry profile_type "test" for standard_user'`.
- [ ] **Step 2: Run** both → FAIL.
- [ ] **Step 3: Implement** the middleware branch, the models and the `profile_type` claim in `login`. Restart the backend.
- [ ] **Step 4: Run** pytest + `npx vitest run accounts.test.ts api.test.ts golden.test.ts` → PASS.
- [ ] **Step 5: Commit**

```bash
git add backend/middleware.py backend/models.py backend/routers/auth.py backend/test_accounts.py tests/accounts.test.ts
git commit -m "feat(accounts): resolve temporary accounts in get_current_user, profile_type in auth responses"
```

### Task 9: `POST /api/auth/register` and `POST /api/auth/guest`

**Files:**
- Modify: `backend/routers/auth.py`, `backend/models.py` (`RegisterRequest`)
- Test: `tests/accounts.test.ts`, `backend/test_accounts.py`

**Interfaces:**
- `class RegisterRequest(BaseModel)`: `username: str = Field(..., min_length=3, max_length=50)`, `password: str = Field(..., min_length=6, max_length=100)`, `full_name: Optional[str] = Field(None, max_length=100)`. The password is validated here and never stored.
- `POST /api/auth/register` → **201** `LoginResponse` with `profile_type: "profiled"`, `behavior: "standard"`, `coupon` set; `responses={**MALFORMED_BODY_RESPONSES, 409: {"description": "Username already taken"}, 429: {"description": "Too many users"}}`; `UsernameTaken` → 409 `Username already taken`, `TooManyAccounts` → 429 `Too many users`.
- `POST /api/auth/guest` (no body) → **201** `LoginResponse` with `profile_type: "guest"`, `coupon: null`, username `guest_xxxxxxxx`; `responses={429: …}`.
- Both need no headers.

- [ ] **Step 1: Write the failing tests**
  - vitest: `'register: 201 with token, profile_type profiled and an available WELCOME15 coupon'`; `'register pre-fills full_name in GET /api/users/me/profile and starts with an empty cart'`; `'register trims and is case-insensitive: "  Zoe_One " then "zoe_one" → 409 Username already taken'`; `'register a reserved test username (Standard_User) → 409'`; `'register validation: 2-char username and 5-char password → 422'`; `'a registered username cannot use POST /api/auth/login (401)'`; `'guest: 201 with profile_type guest, no coupon, username starting with guest_'`.
  - pytest: `test_register_and_guest_return_429_when_capacity_reached` — `monkeypatch.setattr(db.accounts, "capacity", 1)`, one guest 201, then register → 429 `{"error":"Too many users"}`.
- [ ] **Step 2: Run** → FAIL (404).
- [ ] **Step 3: Implement** the two handlers (register → `db.register_account`, guest → `db.create_guest_account`, then `create_access_token` with the four claims). Restart.
- [ ] **Step 4: Run** → PASS; full suite green.
- [ ] **Step 5: Commit**

```bash
git add backend/routers/auth.py backend/models.py tests/accounts.test.ts backend/test_accounts.py
git commit -m "feat(accounts): POST /api/auth/register and POST /api/auth/guest"
```

### Task 10: `POST /api/auth/logout`

**Files:**
- Modify: `backend/routers/auth.py`, `backend/models.py` (`LogoutResponse`)
- Test: `tests/accounts.test.ts`

**Interfaces:**
- `class LogoutResponse(BaseModel)`: `status: Literal["logged_out"] = "logged_out"`.
- `POST /api/auth/logout` (auth only) → 200 `{"status":"logged_out"}`; temporary account → `db.delete_account(username)`; test user → `db.clear_session_state(sid)`; `responses={**AUTH_RESPONSES}`.

- [ ] **Step 1: Write the failing tests** in `tests/accounts.test.ts`:
  - `'logout deletes a profiled account: the token is 401 afterwards, the username can be registered again and sees no old orders'` (register → checkout one US order → logout → old token `GET /api/orders` 401 → register same name → `GET /api/orders` → `orders: []`).
  - `'logout of a test user clears only that login: cart and profile reset, a second login of the same user is unaffected'` (login A, seed cart + profile; login B, seed cart; logout A → A's token still valid for `GET /api/cart` but `cart_items: []` and profile `full_name: ""`; B's cart intact).
  - `'logout without a token → 401'`.
- [ ] **Step 2: Run** → FAIL (404).
- [ ] **Step 3: Implement.** Restart.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit**

```bash
git add backend/routers/auth.py backend/models.py tests/accounts.test.ts
git commit -m "feat(accounts): POST /api/auth/logout deletes temporary accounts"
```

### Task 11: `GET /api/users/me/coupon` and `POST /api/coupons/validate`

**Files:**
- Create: `backend/routers/coupons.py`
- Modify: `backend/models.py` (`CouponValidateRequest`, `CouponValidateResponse`), `backend/main.py` (`include_router(coupons_router)`)
- Test: `tests/accounts.test.ts`

**Interfaces:**
- `GET /api/users/me/coupon` (auth) → 200 `Coupon`; 404 `No coupon for this account` for guests and test users; tags `["Coupons"]`; `responses={**AUTH_RESPONSES, 404: …}`.
- `class CouponValidateRequest(BaseModel)`: `code: str = Field(..., min_length=1, max_length=64)`. `class CouponValidateResponse(BaseModel)`: `valid: bool = True`, `code: str`, `percent: int`.
- `POST /api/coupons/validate` (auth) → 200 `{valid: true, code: <canonical>, percent: 15}`; `InvalidCoupon` → 400 `Invalid coupon code`; `CouponUsed` → 409 `Coupon already used`; `responses` list 400, 401, 409 and `MALFORMED_BODY_RESPONSES`. Validation never consumes the coupon.

- [ ] **Step 1: Write the failing tests**: `'GET coupon: profiled 200 {code, percent 15, status available}; guest 404; standard_user 404'`; `'validate: lowercase + spaces of the own code → 200 with the canonical code; still available afterwards'`; `'validate: another account's code → 400 Invalid coupon code; made-up code → 400; guest with any code → 400; standard_user → 400'`.
- [ ] **Step 2: Run** → FAIL (404).
- [ ] **Step 3: Implement** `routers/coupons.py`, mount it. Restart.
- [ ] **Step 4: Run** → PASS; full suite green.
- [ ] **Step 5: Commit**

```bash
git add backend/routers/coupons.py backend/models.py backend/main.py tests/accounts.test.ts
git commit -m "feat(coupon): GET /api/users/me/coupon and POST /api/coupons/validate"
```

> **Merge gate:** stop here until the orchestrator has merged W1 into `US-and-Improvements` and merged the base into `w2-accounts-backend` (resolving `models.py`, `database.py`, `routers/checkout.py`, `main.py`). Re-run the full suite on the merged branch before Task 12.

### Task 12: Discount in `calculate_order_total`

**Files:**
- Modify: `backend/database.py` (`calculate_order_total`)
- Test: `backend/test_accounts.py`

**Interfaces:**
- `calculate_order_total(self, items, country_code, tip_percentage: float = 0.0, discount_percent: float = 0.0) -> Dict[str, float]` returns the existing keys plus `discount`. Math: `subtotal` (pre-discount, as today) → `discount = round_currency_amount(subtotal * discount_percent / 100)` → `discounted = subtotal - discount` → `tax = round(discounted * tax_rate)`, `tip = round(discounted * tip% )`, `total = round(discounted + delivery_fee + tax + tip)`. With `discount_percent == 0` every existing number is identical and `discount == 0.0`.

- [ ] **Step 1: Write the failing pytest** `test_totals_with_discount`: `db.calculate_order_total([{"pizza_id":"p01","quantity":2,"item_type":"pizza"}], CountryCode.US, 15, 15)` → `{subtotal: 25.98, discount: 3.9, delivery_fee: 2.0, tax: 1.77, tip: 3.31, total: 29.16}`; same call with `discount_percent=0` → `discount 0.0, total 33.96` (the golden); JP with discount → every amount is an integer and `discount == round(subtotal*0.15)`.
- [ ] **Step 2: Run** → FAIL (unexpected keyword / missing key).
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** pytest → PASS; `npx vitest run golden.test.ts` → unchanged.
- [ ] **Step 5: Commit**

```bash
git add backend/database.py backend/test_accounts.py
git commit -m "feat(coupon): discount in calculate_order_total"
```

### Task 13: `coupon_code` at checkout, `discount` in `OrderSummary`

**Files:**
- Modify: `backend/models.py` (`CheckoutRequest.coupon_code`, `OrderSummary.discount`, `OrderSummary.coupon_code`), `backend/routers/checkout.py` (`checkout`, `_order_summary`)
- Test: `tests/coupon-checkout.test.ts` (new)

**Interfaces:**
- `CheckoutRequest.coupon_code: Optional[str] = None` (None or whitespace-only = no coupon). `OrderSummary.discount: float = 0.0`, `OrderSummary.coupon_code: Optional[str] = None`; `_order_summary` reads `order.get("discount", 0.0)` / `order.get("coupon_code")` so old orders still serialize.
- Order of checks in `checkout`: chaos 500 → required market fields → `assert_known_products` → coupon (`db.resolve_coupon` → 400 `Invalid coupon code` / 409 `Coupon already used`) → `calculate_order_total(..., discount_percent)` → `create_order` (stores `discount`, `coupon_code`) → **then** `db.consume_coupon(username)`. `responses` gains 400 (coupon) and 409.

- [ ] **Step 1: Write the failing tests** in `tests/coupon-checkout.test.ts` (helpers: `register()` returns `{token, coupon}`):
  - `'US checkout with the coupon: p01 ×2, tip 15 → subtotal 25.98, discount 3.9, tax 1.77, tip 3.31, total 29.16, coupon_code echoed; GET /api/orders/{id} shows the same'`.
  - `'the coupon is consumed only by a created order: a 400 checkout (missing zip_code) with the coupon leaves it available; the next successful checkout uses it; a third checkout with it → 409 Coupon already used; GET coupon → status used'`.
  - `'an order without the coupon keeps it available (any order, not only the first)'`.
  - `'cancelling the discounted order does not restore the coupon'` (PATCH cancelled → GET coupon still `used`, validate → 409).
  - `'guest and standard_user sending any coupon_code → 400 Invalid coupon code; empty string coupon_code is ignored (200, discount 0)'`.
  - `'JP: discount and totals are integers'`.
- [ ] **Step 2: Run** `npx vitest run coupon-checkout.test.ts` → FAIL (`discount` undefined).
- [ ] **Step 3: Implement.** Restart.
- [ ] **Step 4: Run** → PASS; full suite (vitest + pytest) green.
- [ ] **Step 5: Commit**

```bash
git add backend/models.py backend/routers/checkout.py tests/coupon-checkout.test.ts
git commit -m "feat(coupon): coupon_code at checkout with discount in OrderSummary"
```

### Task 14: W2 wrap-up

- [ ] **Step 1:** Full suite from `<w2>/tests` and pytest from `<w2>/backend` → green. `curl -s localhost:8002/api/openapi.json` lists `/api/auth/register`, `/api/auth/guest`, `/api/auth/logout`, `/api/users/me/coupon`, `/api/coupons/validate` with the status codes above.
- [ ] **Step 2:** Report the branch name and commits; do not merge or push.
