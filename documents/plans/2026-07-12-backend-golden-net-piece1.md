# Backend QA Refactor — Golden Net + B/C/D (Pieza 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a golden characterization-test net that pins current backend behavior, then apply three behavior-preserving cleanups (O(1) catalog index, DRY translation/price helpers, data-driven checkout) without changing a single observable value.

**Architecture:** This is a *refactoring under a characterization net*, not TDD of new behavior. Task 1 writes tests that pass **green against the unmodified backend** (they record what the system does today). Tasks 2–4 then change internals; the golden net must stay green after each. If a Task-2/3/4 change turns the net red, the change altered behavior → revert/fix it (do **not** edit the expected values). Expected literals in Task 1 were computed independently by importing the backend's pure pricing functions.

**Tech Stack:** Python 3.11+ FastAPI backend (`backend/`), Vitest 4 + axios integration tests (`tests/`, TypeScript, pnpm 10).

## Global Constraints

- **No observable behavior change.** API routes, request/response shapes (`OrderSummary`, `customer_info`, `Pizza`), status codes, and chaos-user behavior stay byte-identical.
- **Golden values are ground truth** (computed from `backend/constants.py` + `backend/database.py` on 2026-07-12). Do not invent numbers.
- **Test target:** local backend at `http://localhost:8000` (override via `API_BASE_URL`). Password `pizza123` (override via `TEST_USER_PASSWORD`).
- **First pizza is `p01` "Margherita"** (`base_price` 12.99 USD); second is `p02` "Pepperoni" (14.99 USD). Catalog is static.
- **Checkout POST** sends `Authorization` + `Content-Type: application/json`; market is in the body (`country_code`), **not** a header. **GET /api/pizzas** requires `X-Country-Code` and reads `X-Language` (defaults to `"en"` when absent — so a market's native language must be requested explicitly).
- **`customer_info` is observable only via `GET /api/orders`** (list) — `POST /api/checkout` and `GET /api/orders/{id}` return `OrderSummary`, which omits it. Find the order by `order_id`.
- **JS number semantics:** JSON has no int/float split, so `expect(x).toBe(2051)` matches a server `2051.0`. Assert numeric literals directly.
- **Conventional Commits** (`test:`/`refactor:`). Commit after every task. Work on branch `refactor/backend-qa-golden-net`.

---

## Prerequisites (once, before Task 1)

- [ ] **P1: Install backend deps and start the server**

The pure-function values were captured without a server, but the golden tests hit the live HTTP API, which needs FastAPI/uvicorn.

Run (leave the server running in its own terminal):
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py                                     # serves on :8000
```
Expected: `Uvicorn running on http://0.0.0.0:8000`. Sanity-check: `curl http://localhost:8000/health` → `{"status":"healthy",...}`.

- [ ] **P2: Install test deps**

```bash
cd tests
pnpm install
```
Expected: install completes; `node_modules/.bin/vitest` exists.

---

## Task 1: Golden characterization net

**Files:**
- Create: `tests/golden.test.ts`

**Interfaces:**
- Consumes: live backend endpoints `POST /api/auth/login`, `GET /api/pizzas`, `POST /api/checkout`, `GET /api/orders`.
- Produces: a green regression net that Tasks 2–4 must keep green. No code exports.

- [ ] **Step 1: Write the golden test file**

Create `tests/golden.test.ts` with exactly this content:

```ts
import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'pizza123';

async function login(username: string): Promise<string> {
  const res = await axios.post(`${API_URL}/api/auth/login`, { username, password: PASSWORD });
  return res.data.access_token;
}

function checkoutHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function catalogHeaders(token: string, country: string, lang: string) {
  return { Authorization: `Bearer ${token}`, 'X-Country-Code': country, 'X-Language': lang };
}

// customer_info is only visible via the orders list, not the OrderSummary responses.
async function findOrderById(token: string, orderId: string): Promise<any> {
  const res = await axios.get(`${API_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const order = res.data.orders.find((o: any) => o.order_id === orderId);
  if (!order) throw new Error(`order ${orderId} not found in /api/orders`);
  return order;
}

// Ground truth captured 2026-07-12 from calculate_order_total() for a
// [{p01, quantity: 2}] cart with a 15% tip, per market.
const GOLDEN: Record<
  string,
  {
    symbol: string;
    requiredField: string;
    requiredValue: string;
    tipField: string;
    totals: {
      subtotal: number; delivery_fee: number; tax_rate: number;
      tip_percentage: number; tax: number; tip: number; total: number; currency: string;
    };
  }
> = {
  MX: {
    symbol: '$', requiredField: 'colonia', requiredValue: 'Roma Norte', tipField: 'propina',
    totals: { subtotal: 455.94, delivery_fee: 35.1, tax_rate: 0.16, tip_percentage: 15, tax: 72.95, tip: 68.39, total: 632.38, currency: 'MXN' },
  },
  US: {
    symbol: '$', requiredField: 'zip_code', requiredValue: '12345', tipField: 'tip',
    totals: { subtotal: 25.98, delivery_fee: 2.0, tax_rate: 0.08, tip_percentage: 15, tax: 2.08, tip: 3.9, total: 33.96, currency: 'USD' },
  },
  CH: {
    symbol: 'CHF', requiredField: 'plz', requiredValue: '8001', tipField: 'trinkgeld',
    totals: { subtotal: 20.32, delivery_fee: 1.56, tax_rate: 0.081, tip_percentage: 15, tax: 1.65, tip: 3.05, total: 26.58, currency: 'CHF' },
  },
  JP: {
    symbol: '¥', requiredField: 'prefectura', requiredValue: 'Tokyo', tipField: 'chip',
    totals: { subtotal: 4102, delivery_fee: 316, tax_rate: 0.1, tip_percentage: 15, tax: 410, tip: 615, total: 5443, currency: 'JPY' },
  },
  SA: {
    symbol: 'ر.س', requiredField: 'district', requiredValue: 'Al Olaya', tipField: 'baksheesh',
    totals: { subtotal: 97.42, delivery_fee: 7.5, tax_rate: 0.15, tip_percentage: 15, tax: 14.61, tip: 14.61, total: 134.14, currency: 'SAR' },
  },
};

describe('Golden: checkout totals + customer_info per market', () => {
  it.each(Object.entries(GOLDEN))(
    '%s: OrderSummary totals and stored customer_info match golden',
    async (market, g) => {
      const token = await login('standard_user');
      const catalog = await axios.get(`${API_URL}/api/pizzas`, {
        headers: catalogHeaders(token, market, 'en'),
      });
      const pizzaId = catalog.data.pizzas[0].id; // p01

      const body: Record<string, unknown> = {
        country_code: market,
        items: [{ pizza_id: pizzaId, quantity: 2 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        [g.requiredField]: g.requiredValue,
        [g.tipField]: 15,
      };

      const res = await axios.post(`${API_URL}/api/checkout`, body, {
        headers: checkoutHeaders(token),
      });

      expect(res.status).toBe(200);
      const d = res.data;
      expect(d.subtotal).toBe(g.totals.subtotal);
      expect(d.delivery_fee).toBe(g.totals.delivery_fee);
      expect(d.tax_rate).toBe(g.totals.tax_rate);
      expect(d.tip_percentage).toBe(g.totals.tip_percentage);
      expect(d.tax).toBe(g.totals.tax);
      expect(d.tip).toBe(g.totals.tip);
      expect(d.total).toBe(g.totals.total);
      expect(d.currency).toBe(g.totals.currency);
      expect(d.currency_symbol).toBe(g.symbol);

      const order = await findOrderById(token, d.order_id);
      expect(order.customer_info).toEqual({
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        [g.requiredField]: g.requiredValue,
        [g.tipField]: 15,
      });
    },
  );
});

describe('Golden: MX optional-field inclusion rules', () => {
  it('propina=0 is preserved; zip_code included only when truthy', async () => {
    const token = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [{ pizza_id: pizzaId, quantity: 2 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
        zip_code: '54321',
        propina: 0,
      },
      { headers: checkoutHeaders(token) },
    );

    expect(res.status).toBe(200);
    expect(res.data.tip_percentage).toBe(0);
    expect(res.data.tip).toBe(0);

    const order = await findOrderById(token, res.data.order_id);
    expect(order.customer_info).toEqual({
      name: 'QA Bot',
      address: '123 Test Street',
      phone: '5551234567',
      colonia: 'Roma Norte',
      zip_code: '54321',
      propina: 0,
    });
  });
});

describe('Golden: multi-item cart (distinct pizza_ids) totals', () => {
  it('MX: large + toppings + second pizza matches golden', async () => {
    const token = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const p01 = catalog.data.pizzas.find((p: any) => p.id === 'p01').id;
    const p02 = catalog.data.pizzas.find((p: any) => p.id === 'p02').id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [
          { pizza_id: p01, quantity: 2, size: 'large', toppings: ['a', 'b'] },
          { pizza_id: p02, quantity: 1 },
        ],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
        propina: 15,
      },
      { headers: checkoutHeaders(token) },
    );

    expect(res.status).toBe(200);
    const d = res.data;
    expect(d.subtotal).toBe(933.01);
    expect(d.delivery_fee).toBe(35.1);
    expect(d.tax).toBe(149.28);
    expect(d.tip).toBe(139.95);
    expect(d.total).toBe(1257.34);
    expect(d.currency).toBe('MXN');
  });
});

describe('Golden: catalog translation + pricing', () => {
  it('MX/es: p01 Spanish name + description, converted price', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    const p02 = res.data.pizzas.find((p: any) => p.id === 'p02');
    expect(p01.name).toBe('Margarita');
    expect(p01.description).toBe('Tomate, mozzarella, albahaca');
    expect(p01.price).toBe(227.97);
    expect(p01.currency).toBe('MXN');
    expect(p01.currency_symbol).toBe('$');
    expect(p02.name).toBe('Pepperoni');
    expect(p02.price).toBe(263.07);
  });

  it('MX/en: p01 falls back to English, same price', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'en'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    expect(p01.name).toBe('Margherita');
    expect(p01.description).toBe('Tomato, mozzarella, basil');
    expect(p01.price).toBe(227.97);
  });

  it('JP/ja: p01 Japanese name + integer yen price (decimal_places=0)', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'JP', 'ja'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    expect(p01.name).toBe('マルゲリータ');
    expect(p01.description).toBe('トマト、モッツァレラ、バジル');
    expect(p01.price).toBe(2051);
    expect(p01.currency_symbol).toBe('¥');
  });
});

describe('Golden: problem_user chaos behavior', () => {
  it('MX: problem_user gets $0 prices and the broken image', async () => {
    const token = await login('problem_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    expect(p01.price).toBe(0);
    expect(p01.image).toBe('https://broken-image-url.com/404.jpg');
  });
});
```

- [ ] **Step 2: Run the net against the UNMODIFIED backend**

Run: `cd tests && pnpm test -- golden.test.ts`
Expected: **all tests PASS** (green). This confirms the literals match today's behavior — that is the "golden" baseline.

If any assertion fails here, the *literal is wrong*, not the backend. Correct the expected value in `golden.test.ts` to the actual clean-backend value (re-derive it if needed), then re-run until green. Do this **only** in Task 1, never in Tasks 2–4.

- [ ] **Step 3: Commit the net**

```bash
git add tests/golden.test.ts
git commit -m "test(backend): add golden characterization net for checkout, catalog, chaos"
```

---

## Task 2: O(1) catalog lookup (spec §C)

**Files:**
- Modify: `backend/database.py` (add index near top; replace two linear scans at ~line 157 and ~line 268)

**Interfaces:**
- Consumes: `PIZZA_CATALOG` (already imported).
- Produces: module-level `PIZZA_BY_ID: Dict[str, Dict[str, Any]]`.

- [ ] **Step 1: Add the id index**

In `backend/database.py`, immediately after the `TOPPING_UPCHARGE_USD = 1` line (before `def convert_usd_amount`), add:

```python
# Index the catalog by id once so per-item lookups are O(1) instead of a
# linear scan of PIZZA_CATALOG on every cart item.
PIZZA_BY_ID: Dict[str, Dict[str, Any]] = {pizza["id"]: pizza for pizza in PIZZA_CATALOG}
```

- [ ] **Step 2: Replace the scan in `get_enriched_cart`**

Find (inside the `for item in cart_items:` loop):
```python
            pizza = next((p for p in PIZZA_CATALOG if p["id"] == item["pizza_id"]), None)
            if not pizza:
                continue
```
Replace with:
```python
            pizza = PIZZA_BY_ID.get(item["pizza_id"])
            if not pizza:
                continue
```

- [ ] **Step 3: Replace the scan in `calculate_order_total`**

Find (inside the `for item in items:` loop):
```python
            pizza = next((p for p in PIZZA_CATALOG if p["id"] == item["pizza_id"]), None)
            if pizza:
```
Replace with:
```python
            pizza = PIZZA_BY_ID.get(item["pizza_id"])
            if pizza:
```

- [ ] **Step 4: Verify the net stays green**

Run: `cd tests && pnpm test -- golden.test.ts`
Expected: all PASS (totals + catalog unchanged). If red → the index changed behavior; fix the index, don't touch expectations.

- [ ] **Step 5: Commit**

```bash
git add backend/database.py
git commit -m "refactor(backend): index PIZZA_CATALOG by id for O(1) item lookup"
```

---

## Task 3: DRY translation + price helpers (spec §D)

**Files:**
- Modify: `backend/database.py` (add 3 private helpers; use them in `get_enriched_cart` and `get_catalog`)

**Interfaces:**
- Produces (module-level): `_resolve_language(country_code, language) -> str`, `_translate_field(value, lang) -> Any`, `_convert_price(base_price_usd, conversion_rate, decimal_places) -> float`.
- Behavior to preserve: `get_catalog` translates **name AND description**; `get_enriched_cart` translates **name only**. The `problem` branch (price 0.0 + broken image) stays inline in both.

- [ ] **Step 1: Add the helpers**

In `backend/database.py`, after `round_currency_amount(...)` and before `class InMemoryDB:`, add:

```python
_DEFAULT_LANG_BY_COUNTRY = {"MX": "es", "US": "en", "CH": "de", "JP": "ja", "SA": "ar"}


def _resolve_language(country_code, language: Optional[str]) -> str:
    cc = country_code.value if hasattr(country_code, "value") else str(country_code)
    return (language or _DEFAULT_LANG_BY_COUNTRY.get(cc, "en")).lower()


def _translate_field(value, lang: str):
    if isinstance(value, dict):
        return value.get(lang) or value.get("en") or next(iter(value.values()))
    return value


def _convert_price(base_price_usd: float, conversion_rate: float, decimal_places: int):
    converted = base_price_usd * conversion_rate
    return round(converted) if decimal_places == 0 else round(converted, decimal_places)
```

- [ ] **Step 2: Use them in `get_enriched_cart`**

Replace the language block:
```python
        default_lang = {"MX": "es", "US": "en", "CH": "de", "JP": "ja", "SA": "ar"}
        cc = country_code.value if hasattr(country_code, "value") else str(country_code)
        lang = (language or default_lang.get(cc, "en")).lower()
```
with:
```python
        lang = _resolve_language(country_code, language)
```

Then replace the name-translation + price block:
```python
            name_val = pizza.get("name")
            if isinstance(name_val, dict):
                name = name_val.get(lang) or name_val.get("en") or next(iter(name_val.values()))
            else:
                name = name_val

            converted_price = pizza["base_price"] * conversion_rate

            if behavior == "problem":
                price = 0.0
                image = "https://broken-image-url.com/404.jpg"
            else:
                if decimal_places == 0:
                    price = round(converted_price)
                else:
                    price = round(converted_price, decimal_places)
                image = pizza["image"]
```
with:
```python
            name = _translate_field(pizza.get("name"), lang)

            if behavior == "problem":
                price = 0.0
                image = "https://broken-image-url.com/404.jpg"
            else:
                price = _convert_price(pizza["base_price"], conversion_rate, decimal_places)
                image = pizza["image"]
```

- [ ] **Step 3: Use them in `get_catalog`**

Replace the language block:
```python
        default_lang_by_country = {"MX": "es", "US": "en", "CH": "de", "JP": "ja", "SA": "ar"}
        cc = country_code.value if hasattr(country_code, "value") else str(country_code)
        lang = (language or default_lang_by_country.get(cc, "en")).lower()
```
with:
```python
        lang = _resolve_language(country_code, language)
```

Then replace the translation + price block:
```python
            # ✅ Translate name/description if they are dicts
            name_val = pizza.get("name")
            desc_val = pizza.get("description")

            if isinstance(name_val, dict):
                pizza_copy["name"] = name_val.get(lang) or name_val.get("en") or next(iter(name_val.values()))
            else:
                pizza_copy["name"] = name_val

            if isinstance(desc_val, dict):
                pizza_copy["description"] = desc_val.get(lang) or desc_val.get("en") or next(iter(desc_val.values()))
            else:
                pizza_copy["description"] = desc_val

            # Convert price to country currency
            converted_price = pizza["base_price"] * conversion_rate

            # Apply behavior modifications
            if behavior == "problem":
                pizza_copy["price"] = 0.0
                pizza_copy["image"] = "https://broken-image-url.com/404.jpg"
            else:
                if decimal_places == 0:
                    pizza_copy["price"] = round(converted_price)
                else:
                    pizza_copy["price"] = round(converted_price, decimal_places)
```
with:
```python
            # Translate name/description if they are localized dicts
            pizza_copy["name"] = _translate_field(pizza.get("name"), lang)
            pizza_copy["description"] = _translate_field(pizza.get("description"), lang)

            # Convert price to country currency; problem users get $0 + broken image
            if behavior == "problem":
                pizza_copy["price"] = 0.0
                pizza_copy["image"] = "https://broken-image-url.com/404.jpg"
            else:
                pizza_copy["price"] = _convert_price(pizza["base_price"], conversion_rate, decimal_places)
```

- [ ] **Step 4: Verify the net stays green**

Run: `cd tests && pnpm test -- golden.test.ts`
Expected: all PASS — the MX/es, MX/en, JP/ja translation tests and problem_user test specifically guard this refactor. If red → a helper diverged from the inline logic; fix the helper.

- [ ] **Step 5: Commit**

```bash
git add backend/database.py
git commit -m "refactor(backend): extract shared language/translation/price helpers (DRY)"
```

---

## Task 4: Data-driven checkout field assembly (spec §B, Open/Closed)

**Files:**
- Modify: `backend/main.py` (replace the per-country `if/elif` block at lines 284–306)

**Interfaces:**
- Consumes: `country_config = COUNTRY_CONFIG[request.country_code]` (already bound at ~line 253) with keys `required_fields`, `optional_fields`, `tip_field`.
- Behavior to preserve exactly: required fields copied unconditionally; the tip field copied when `is not None` (so `0` is kept); every other optional field copied only when truthy.

- [ ] **Step 1: Replace the if/elif block**

In `backend/main.py`, find this block (the comment `# Add country-specific fields` through the end of the `elif request.country_code == CountryCode.SA:` branch):
```python
    # Add country-specific fields
    if request.country_code == CountryCode.MX:
        order_data["customer_info"]["colonia"] = request.colonia
        if request.zip_code:
            order_data["customer_info"]["zip_code"] = request.zip_code
        if request.propina is not None:
            order_data["customer_info"]["propina"] = request.propina
    elif request.country_code == CountryCode.US:
        order_data["customer_info"]["zip_code"] = request.zip_code
        if request.tip is not None:
            order_data["customer_info"]["tip"] = request.tip
    elif request.country_code == CountryCode.CH:
        order_data["customer_info"]["plz"] = request.plz
        if request.trinkgeld is not None:
            order_data["customer_info"]["trinkgeld"] = request.trinkgeld
    elif request.country_code == CountryCode.JP:
        order_data["customer_info"]["prefectura"] = request.prefectura
        if request.chip is not None:
            order_data["customer_info"]["chip"] = request.chip
    elif request.country_code == CountryCode.SA:
        order_data["customer_info"]["district"] = request.district
        if request.baksheesh is not None:
            order_data["customer_info"]["baksheesh"] = request.baksheesh
```
Replace it with:
```python
    # Country-specific fields, driven by COUNTRY_CONFIG (Open/Closed): adding a
    # market is a config edit, not a new elif branch.
    #   required_fields -> always copied (already validated non-empty above)
    #   tip_field       -> copied if not None (so an explicit 0 is preserved)
    #   other optional  -> copied only if truthy (mirrors the old `if request.x:`)
    tip_field = country_config["tip_field"]
    for field in country_config["required_fields"]:
        order_data["customer_info"][field] = getattr(request, field)
    for field in country_config["optional_fields"]:
        value = getattr(request, field, None)
        if field == tip_field:
            if value is not None:
                order_data["customer_info"][field] = value
        elif value:
            order_data["customer_info"][field] = value
```

- [ ] **Step 2: Verify the net stays green**

Run: `cd tests && pnpm test -- golden.test.ts`
Expected: all PASS. The per-market `customer_info` `toEqual` checks and the MX `propina=0` / `zip_code` frontier test specifically guard this refactor. If red → the data-driven rule diverged from a per-market branch; fix the loop logic.

- [ ] **Step 3: Run the full existing suite for regressions**

Run: `cd tests && pnpm test`
Expected: `golden.test.ts` + `api.test.ts` all PASS (no route/status regressions).

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "refactor(backend): drive checkout field assembly from COUNTRY_CONFIG (Open/Closed)"
```

---

## Done criteria

- `tests/golden.test.ts` exists and is green.
- `backend/database.py` uses `PIZZA_BY_ID` and the three shared helpers; no duplicated language/translation/price logic between `get_catalog` and `get_enriched_cart`.
- `backend/main.py` checkout has no per-country `if/elif`; fields come from `COUNTRY_CONFIG`.
- `cd tests && pnpm test` passes entirely.
- Four commits on `refactor/backend-qa-golden-net` (1 test + 3 refactor).

## Self-review notes (already applied)

- **Spec coverage:** §C→Task 2, §D→Task 3, §B→Task 4, golden net (spec Paso 1)→Task 1. §A (router split) and §E (reset-db) are out of scope per the spec.
- **Frontier cases covered:** `propina=0` present (tip-if-not-None), `zip_code` present-if-truthy / absent-if-omitted, JP `decimal_places=0` integer price, SA→English translation fallback, `problem_user` $0 + broken image.
- **Type consistency:** helper names (`_resolve_language`, `_translate_field`, `_convert_price`, `PIZZA_BY_ID`) are used identically where introduced and consumed.
