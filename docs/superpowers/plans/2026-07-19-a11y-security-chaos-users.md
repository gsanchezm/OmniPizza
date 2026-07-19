# a11y_glitch_user & security_glitch_user Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new deterministic chaos test users — `a11y_glitch_user` and `security_glitch_user` — to the OmniPizza backend, following the existing `TEST_USERS` pattern, plus the frontend/mobile Quick Login touch-ups and integration tests that prove each failure mode.

**Architecture:** Two new `UserBehavior` enum values + `TEST_USERS` entries in `backend/constants.py`. Each behavior's effect is injected as an `elif` branch at the exact points the existing chaos users (`problem`, `error`) already use (`database.py::get_catalog`/`get_enriched_cart`, `checkout.py`, `routers/auth.py::login`) — no new abstraction layer. Canned data (failure-mode lists, XSS payloads, fake leak messages) lives in `constants.py`, matching how `COUNTRY_CONFIG`/`CURRENCY_RATES` already centralize config.

**Tech Stack:** Python 3.11 / FastAPI (backend), TypeScript / Vitest / axios (integration tests in `tests/`), React (`frontend/`), React Native / Expo (`frontend-mobile/`).

**Full design spec:** `docs/superpowers/specs/2026-07-19-a11y-security-chaos-users-design.md` — read this first for the *why* behind every decision below.

## Global Constraints

- Password for every test user is `pizza123` (unchanged).
- Backend runs with **no `--reload`** (`backend/main.py` → `uvicorn.run(app, ...)`) — after every backend code edit, kill and restart the process on `:8000` before re-running tests, or the suite silently tests stale code.
- Backend venv already exists at `backend/venv` — run it with `backend/venv/Scripts/python.exe main.py` (Windows).
- `tests/vitest.config.ts` sets `fileParallelism: false` — do not remove it. Tests share one stateful in-memory backend.
- `pnpm test -- <file>` does **not** isolate a single file on this pnpm/Windows setup — from `tests/`, use `npx vitest run <file>` instead.
- `GET /api/pizzas` defaults `X-Language` server-side to `"en"` if the header is omitted — always send `X-Language` explicitly in new tests that assert on translated text.
- Do not change the behavior of any existing chaos user (`standard`, `locked_out`, `problem`, `performance_glitch`, `error`) — all new branches are additive `elif`s.

## Local Dev Loop (used by every task below)

Terminal A (keep running, restart after each backend edit):
```bash
cd backend && ./venv/Scripts/python.exe main.py
```

Terminal B (run after Terminal A is up):
```bash
cd tests && npx vitest run golden.test.ts
```

To restart Terminal A: `Ctrl+C`, then re-run the command. The in-memory DB resets on restart — that's expected and desired between tasks.

---

### Task 1: Data model — register the two new chaos users

**Files:**
- Modify: `backend/constants.py:4-9` (`UserBehavior` enum), `backend/constants.py:19-50` (`TEST_USERS`)
- Test: `tests/golden.test.ts` (new file-end `describe` block)

**Interfaces:**
- Produces: `UserBehavior.A11Y_GLITCH == "a11y_glitch"`, `UserBehavior.SECURITY_GLITCH == "security_glitch"`; `TEST_USERS["a11y_glitch_user"]`, `TEST_USERS["security_glitch_user"]` (same shape as every other entry: `username`, `password`, `behavior`, `description`). Also produces the canned data every later task consumes: `A11Y_GLITCH_MODES`, `A11Y_GLITCH_LANGS`, `SECURITY_GLITCH_PROFILE_FIELDS`, `SECURITY_GLITCH_PAYLOADS`, `SECURITY_GLITCH_LEAK_MESSAGES` (all plain lists in `constants.py`).

- [ ] **Step 1: Write the failing test**

Append to `tests/golden.test.ts`:

```typescript
describe('Golden: new chaos users are registered', () => {
  it('a11y_glitch_user and security_glitch_user appear in /api/auth/users and can log in', async () => {
    const listRes = await axios.get(`${API_URL}/api/auth/users`);
    const usernames = listRes.data.map((u: any) => u.username);
    expect(usernames).toContain('a11y_glitch_user');
    expect(usernames).toContain('security_glitch_user');

    const a11yToken = await login('a11y_glitch_user');
    expect(typeof a11yToken).toBe('string');

    const securityToken = await login('security_glitch_user');
    expect(typeof securityToken).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Start Terminal A (`cd backend && ./venv/Scripts/python.exe main.py`), then in Terminal B:
```bash
cd tests && npx vitest run golden.test.ts -t "new chaos users are registered"
```
Expected: FAIL — `usernames` does not contain `'a11y_glitch_user'` (the login calls would also 401, since `TEST_USERS.get(username)` returns `None` for both).

- [ ] **Step 3: Implement**

In `backend/constants.py`, change the `UserBehavior` enum:

```python
class UserBehavior(str, Enum):
    STANDARD = "standard"
    LOCKED_OUT = "locked_out"
    PROBLEM = "problem"
    PERFORMANCE_GLITCH = "performance_glitch"
    ERROR = "error"
    A11Y_GLITCH = "a11y_glitch"
    SECURITY_GLITCH = "security_glitch"
```

Add two entries at the end of `TEST_USERS` (after `"error_user"`, before the closing `}`):

```python
    "error_user": {
        "username": "error_user",
        "password": "pizza123",
        "behavior": UserBehavior.ERROR,
        "description": "El botón de Checkout lanza un error 500 al azar"
    },
    "a11y_glitch_user": {
        "username": "a11y_glitch_user",
        "password": "pizza123",
        "behavior": UserBehavior.A11Y_GLITCH,
        "description": "Catálogo y carrito muestran, al azar, un problema de accesibilidad distinto en cada llamada"
    },
    "security_glitch_user": {
        "username": "security_glitch_user",
        "password": "pizza123",
        "behavior": UserBehavior.SECURITY_GLITCH,
        "description": "Perfil sembrado con payload sin sanear, detalle de orden sin validar dueño, y errores de checkout con detalles internos filtrados"
    }
}
```

Then add the canned data blocks used by Tasks 2, 3, 5 — put them right after `TEST_USERS`, before `# Country-specific configurations`:

```python
# a11y_glitch_user: interchangeable per-call failure modes for catalog/cart
# (database.py::get_catalog / get_enriched_cart). One mode is chosen per
# call, independently — consecutive calls may land on different modes.
A11Y_GLITCH_MODES = ["missing_name", "wrong_lang", "extreme_text"]
A11Y_GLITCH_LANGS = ["en", "es", "de", "fr", "ja", "ar"]

# security_glitch_user: canned fixtures for its three endpoint-bound failures.
# Profile poisoning (routers/auth.py::login) picks one field + one payload.
SECURITY_GLITCH_PROFILE_FIELDS = ["full_name", "address", "notes"]
SECURITY_GLITCH_PAYLOADS = [
    "<script>alert('xss-test')</script>",
    "<img src=x onerror=\"console.warn('xss-test')\">",
    "\"><svg onload=alert(1)>"
]
# Checkout info-leak (checkout.py::checkout), only used when
# should_trigger_error() fires for this behavior.
SECURITY_GLITCH_LEAK_MESSAGES = [
    "Traceback (most recent call last):\n  File \"checkout.py\", line 214, in process_payment\nsqlite3.OperationalError: database is locked",
    "psycopg2.OperationalError: FATAL: password authentication failed for user \"omnipizza_prod\" at 10.0.4.12:5432",
    "Unhandled exception: /home/deploy/omnipizza/backend/.env not found (SECRET_KEY missing)"
]
```

- [ ] **Step 4: Run test to verify it passes**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "new chaos users are registered"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/constants.py tests/golden.test.ts
git commit -m "feat(backend): register a11y_glitch_user and security_glitch_user"
```

---

### Task 2: `a11y_glitch_user` — catalog & cart failure modes

**Files:**
- Modify: `backend/database.py` (`get_catalog`, `get_enriched_cart`, plus one new helper)
- Test: `tests/golden.test.ts`

**Interfaces:**
- Consumes: `A11Y_GLITCH_MODES`, `A11Y_GLITCH_LANGS` (Task 1, `constants.py`).
- Produces: `_a11y_glitch_text(raw_value, lang: str, mode: str, field: str) -> Any` — a module-level helper in `database.py` used only by `get_catalog`/`get_enriched_cart`.

- [ ] **Step 1: Write the failing test**

Append to `tests/golden.test.ts`:

```typescript
describe('Golden: a11y_glitch_user catalog behavior', () => {
  it('MX/es: every call lands on exactly one of the three a11y modes; price/currency unaffected', async () => {
    const token = await login('a11y_glitch_user');
    const seenModes = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const res = await axios.get(`${API_URL}/api/pizzas`, {
        headers: catalogHeaders(token, 'MX', 'es'),
      });
      const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');

      expect(p01.price).toBe(227.97);
      expect(p01.currency).toBe('MXN');
      expect(p01.image).not.toBe('https://broken-image-url.com/404.jpg');

      if (p01.name === '') {
        seenModes.add('missing_name');
      } else if (p01.name.length > 100) {
        seenModes.add('extreme_text');
      } else if (p01.name !== 'Margarita') {
        seenModes.add('wrong_lang');
      } else {
        throw new Error(`unexpected clean name for a11y_glitch_user: ${JSON.stringify(p01.name)}`);
      }
    }

    expect(seenModes).toEqual(new Set(['missing_name', 'wrong_lang', 'extreme_text']));
  });
});

describe('Golden: a11y_glitch_user cart behavior', () => {
  it('MX/es: enriched cart name lands on one of the three a11y modes', async () => {
    const token = await login('a11y_glitch_user');
    await seedCart(token, [{ pizza_id: 'p01', quantity: 2 }]);
    const seenModes = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const res = await axios.get(`${API_URL}/api/cart`, {
        headers: catalogHeaders(token, 'MX', 'es'),
      });
      const item = res.data.cart_items[0];

      expect(item.price).toBe(227.97);
      expect(item.currency).toBe('MXN');

      if (item.name === '') {
        seenModes.add('missing_name');
      } else if (item.name.length > 100) {
        seenModes.add('extreme_text');
      } else if (item.name !== 'Margarita') {
        seenModes.add('wrong_lang');
      } else {
        throw new Error(`unexpected clean name for a11y_glitch_user: ${JSON.stringify(item.name)}`);
      }
    }

    expect(seenModes).toEqual(new Set(['missing_name', 'wrong_lang', 'extreme_text']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Restart Terminal A (picks up Task 1's changes), then:
```bash
cd tests && npx vitest run golden.test.ts -t "a11y_glitch_user"
```
Expected: FAIL — `a11y_glitch_user` currently behaves like `standard_user`, so every call returns the clean `'Margarita'` name and the `else throw` branch fires.

- [ ] **Step 3: Implement**

In `backend/database.py`, add the helper right after `_translate_field` (around line 51):

```python
def _a11y_glitch_text(raw_value, lang: str, mode: str, field: str):
    """Apply the a11y_glitch_user failure `mode` to one localized field.
    `raw_value` is the pre-translation dict (or scalar) as stored in
    PIZZA_CATALOG — needed so `wrong_lang` can pick a *different* language's
    text, not just mutate the already-resolved string."""
    translated = _translate_field(raw_value, lang)

    if mode == "missing_name":
        return "" if field == "name" else translated

    if mode == "wrong_lang":
        if not isinstance(raw_value, dict):
            return translated
        other_langs = [l for l in A11Y_GLITCH_LANGS if l != lang and l in raw_value]
        wrong_lang = random.choice(other_langs) if other_langs else lang
        return raw_value.get(wrong_lang, translated)

    if mode == "extreme_text":
        return " ".join([str(translated)] * 15)

    return translated
```

Update the import line at the top of `database.py` (currently line 2):

```python
from constants import (
    PIZZA_CATALOG, COUNTRY_CONFIG, CURRENCY_RATES, CountryCode,
    A11Y_GLITCH_MODES, A11Y_GLITCH_LANGS,
)
```

In `get_enriched_cart`, replace the loop body (currently lines ~176-200):

```python
        lang = _resolve_language(country_code, language)
        a11y_mode = random.choice(A11Y_GLITCH_MODES) if behavior == "a11y_glitch" else None

        enriched: List[Dict[str, Any]] = []
        for item in cart_items:
            pizza = PIZZA_BY_ID.get(item["pizza_id"])
            if not pizza:
                continue

            if behavior == "a11y_glitch":
                name = _a11y_glitch_text(pizza.get("name"), lang, a11y_mode, "name")
            else:
                name = _translate_field(pizza.get("name"), lang)

            if behavior == "problem":
                price = 0.0
                image = "https://broken-image-url.com/404.jpg"
            else:
                price = _convert_price(pizza["base_price"], conversion_rate, decimal_places)
                image = pizza["image"]

            enriched.append({
                "pizza_id": item["pizza_id"],
                "name": name,
                "size": item.get("size", "small"),
                "quantity": item["quantity"],
                "price": price,
                "base_price": pizza["base_price"],
                "currency": currency,
                "currency_symbol": currency_symbol,
                "image": image,
            })

        return enriched
```

In `get_catalog`, replace the loop body (currently lines ~219-240):

```python
        lang = _resolve_language(country_code, language)
        a11y_mode = random.choice(A11Y_GLITCH_MODES) if behavior == "a11y_glitch" else None

        catalog: List[Dict[str, Any]] = []

        for pizza in PIZZA_CATALOG:
            pizza_copy = pizza.copy()

            if behavior == "a11y_glitch":
                pizza_copy["name"] = _a11y_glitch_text(pizza.get("name"), lang, a11y_mode, "name")
                pizza_copy["description"] = _a11y_glitch_text(pizza.get("description"), lang, a11y_mode, "description")
            else:
                pizza_copy["name"] = _translate_field(pizza.get("name"), lang)
                pizza_copy["description"] = _translate_field(pizza.get("description"), lang)

            if behavior == "problem":
                pizza_copy["price"] = 0.0
                pizza_copy["image"] = "https://broken-image-url.com/404.jpg"
            else:
                pizza_copy["price"] = _convert_price(pizza["base_price"], conversion_rate, decimal_places)

            pizza_copy["currency"] = currency
            pizza_copy["currency_symbol"] = currency_symbol

            catalog.append(pizza_copy)

        return catalog
```

- [ ] **Step 4: Run test to verify it passes**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "a11y_glitch_user"
```
Expected: PASS. Also re-run the full file once to confirm no regression on `problem_user`/`standard_user` golden cases:
```bash
cd tests && npx vitest run golden.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/database.py tests/golden.test.ts
git commit -m "feat(backend): a11y_glitch_user random catalog/cart accessibility failures"
```

---

### Task 3: `security_glitch_user` — profile poisoning at login

**Files:**
- Modify: `backend/routers/auth.py` (`login`, plus the docstring listing test users)
- Test: `tests/golden.test.ts`

**Interfaces:**
- Consumes: `SECURITY_GLITCH_PROFILE_FIELDS`, `SECURITY_GLITCH_PAYLOADS` (Task 1); `db.seed_user_profile(session_id: str, username: str, fields: dict) -> dict` (already exists, `database.py:101`).
- Produces: after `POST /api/auth/login` for `security_glitch_user`, `GET /api/users/me/profile` returns exactly one of `full_name`/`address`/`notes` set to one of the three canned payloads; the other two stay at their default `""`.

- [ ] **Step 1: Write the failing test**

Append to `tests/golden.test.ts`:

```typescript
describe('Golden: security_glitch_user profile poisoning', () => {
  it('login seeds exactly one profile field with one canned XSS-probe payload', async () => {
    const PAYLOADS = [
      "<script>alert('xss-test')</script>",
      "<img src=x onerror=\"console.warn('xss-test')\">",
      "\"><svg onload=alert(1)>",
    ];
    const FIELDS = ['full_name', 'address', 'notes'] as const;

    const token = await login('security_glitch_user');
    const res = await axios.get(`${API_URL}/api/users/me/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const poisoned = FIELDS.filter((f) => PAYLOADS.includes(res.data[f]));
    expect(poisoned.length).toBe(1);

    const clean = FIELDS.filter((f) => f !== poisoned[0]);
    clean.forEach((f) => expect(res.data[f]).toBe(''));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "security_glitch_user profile poisoning"
```
Expected: FAIL — `poisoned.length` is `0` (profile starts at the clean default for every user today).

- [ ] **Step 3: Implement**

In `backend/routers/auth.py`, replace the existing `from constants import TEST_USERS` line with:

```python
import random
from constants import TEST_USERS, SECURITY_GLITCH_PROFILE_FIELDS, SECURITY_GLITCH_PAYLOADS
```

Update the `login` docstring (currently lines 20-29) to list all seven users:

```python
    """
    Authenticate user with predefined test credentials

    Test users:
    - standard_user / pizza123 (normal flow)
    - locked_out_user / pizza123 (locked out error)
    - problem_user / pizza123 (broken UI)
    - performance_glitch_user / pizza123 (3s delay)
    - error_user / pizza123 (random 500 errors)
    - a11y_glitch_user / pizza123 (random accessibility failure per call)
    - security_glitch_user / pizza123 (poisoned profile, IDOR, leaked checkout errors)
    """
```

Change the token-minting block (currently lines 47-49) to capture `sid` in a variable, then seed the profile when applicable:

```python
    sid = uuid.uuid4().hex
    access_token = create_access_token(
        data={"sub": user["username"], "behavior": user["behavior"], "sid": sid}
    )

    if user["behavior"] == "security_glitch":
        field = random.choice(SECURITY_GLITCH_PROFILE_FIELDS)
        payload = random.choice(SECURITY_GLITCH_PAYLOADS)
        db.seed_user_profile(sid, user["username"], {field: payload})
```

- [ ] **Step 4: Run test to verify it passes**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "security_glitch_user profile poisoning"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/routers/auth.py tests/golden.test.ts
git commit -m "feat(backend): seed security_glitch_user profile with an XSS-probe payload at login"
```

---

### Task 4: `security_glitch_user` — IDOR on order detail

**Files:**
- Modify: `backend/routers/checkout.py` (`get_order`)
- Test: `tests/golden.test.ts`

**Interfaces:**
- Consumes: nothing new — reuses `current_user["behavior"]` already available via `Depends(get_current_user)`.
- Produces: `GET /api/orders/{order_id}` returns 200 (not 403) for `security_glitch_user` regardless of the order's owner.

- [ ] **Step 1: Write the failing test**

Append to `tests/golden.test.ts`:

```typescript
describe('Golden: security_glitch_user IDOR on order detail', () => {
  it("reads another user's order by id instead of getting 403", async () => {
    const ownerToken = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(ownerToken, 'US', 'en'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    const checkoutRes = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'US',
        items: [{ pizza_id: pizzaId, quantity: 1 }],
        name: 'Order Owner',
        address: '1 Owner Street',
        phone: '5550000000',
        zip_code: '12345',
        tip: 0,
      },
      { headers: checkoutHeaders(ownerToken) },
    );
    const orderId = checkoutRes.data.order_id;

    const attackerToken = await login('security_glitch_user');
    const res = await axios.get(`${API_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });

    expect(res.status).toBe(200);
    expect(res.data.order_id).toBe(orderId);
    expect(res.data.subtotal).toBe(checkoutRes.data.subtotal);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "IDOR on order detail"
```
Expected: FAIL — the request throws with HTTP 403 ("Access denied"), since `axios` rejects on non-2xx and the test's `expect(res.status)` line is never reached (the `await axios.get(...)` call itself throws).

- [ ] **Step 3: Implement**

In `backend/routers/checkout.py`, in `get_order` (currently lines 113-132), change the ownership check:

```python
    if order["username"] != current_user["username"] and current_user["behavior"] != "security_glitch":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
```

- [ ] **Step 4: Run test to verify it passes**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "IDOR on order detail"
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/routers/checkout.py tests/golden.test.ts
git commit -m "feat(backend): security_glitch_user bypasses order-ownership check (IDOR fixture)"
```

---

### Task 5: `security_glitch_user` — checkout information leak

**Files:**
- Modify: `backend/database.py` (`should_trigger_error`), `backend/routers/checkout.py` (`checkout`)
- Test: `tests/golden.test.ts`

**Interfaces:**
- Consumes: `SECURITY_GLITCH_LEAK_MESSAGES` (Task 1).
- Produces: `should_trigger_error(behavior: str) -> bool` now also returns the 50/50 result for `"security_glitch"` (previously only `"error"`). When it fires for `security_glitch_user`, `POST /api/checkout`'s 500 `detail` is one of `SECURITY_GLITCH_LEAK_MESSAGES`, never the generic `error_user` string.

- [ ] **Step 1: Write the failing test**

Change the top-of-file import in `tests/golden.test.ts` from `import axios from 'axios';` to also
pull in the `AxiosError` type (matching the style already used in `tests/api.test.ts`):

```typescript
import axios, { AxiosError } from 'axios';
```

Then append to `tests/golden.test.ts`:

```typescript
describe('Golden: security_glitch_user checkout information leak', () => {
  it('every triggered 500 leaks a simulated internal detail, never the generic error_user message', async () => {
    const LEAK_MESSAGES = [
      'Traceback (most recent call last):\n  File "checkout.py", line 214, in process_payment\nsqlite3.OperationalError: database is locked',
      'psycopg2.OperationalError: FATAL: password authentication failed for user "omnipizza_prod" at 10.0.4.12:5432',
      'Unhandled exception: /home/deploy/omnipizza/backend/.env not found (SECRET_KEY missing)',
    ];

    const token = await login('security_glitch_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'US', 'en'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    let sawSuccess = false;
    let sawError = false;

    for (let i = 0; i < 20; i++) {
      try {
        const res = await axios.post(
          `${API_URL}/api/checkout`,
          {
            country_code: 'US',
            items: [{ pizza_id: pizzaId, quantity: 1 }],
            name: 'QA Bot',
            address: '123 Test Street',
            phone: '5551234567',
            zip_code: '12345',
            tip: 0,
          },
          { headers: checkoutHeaders(token) },
        );
        expect(res.status).toBe(200);
        sawSuccess = true;
      } catch (err) {
        const error = err as AxiosError;
        expect(error.response?.status).toBe(500);
        const body = error.response?.data as Record<string, string>;
        expect(LEAK_MESSAGES).toContain(body.error);
        expect(body.error).not.toBe('Random checkout error triggered for testing purposes');
        sawError = true;
      }
    }

    expect(sawSuccess).toBe(true);
    expect(sawError).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "checkout information leak"
```
Expected: FAIL — `sawError` stays `false` (today `security_glitch` isn't in `should_trigger_error`'s check, so checkout always succeeds for this user).

- [ ] **Step 3: Implement**

In `backend/database.py`, change `should_trigger_error` (currently lines 295-298):

```python
    def should_trigger_error(self, behavior: str) -> bool:
        if behavior in ("error", "security_glitch"):
            return random.random() < 0.5
        return False
```

In `backend/routers/checkout.py`, replace the existing `from constants import COUNTRY_CONFIG, CountryCode` line with:

```python
import random
from constants import COUNTRY_CONFIG, CountryCode, SECURITY_GLITCH_LEAK_MESSAGES
```

Change the error-trigger block in `checkout` (currently lines 34-39):

```python
    # Check if error_user/security_glitch_user should trigger an error
    if db.should_trigger_error(current_user["behavior"]):
        if current_user["behavior"] == "security_glitch":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=random.choice(SECURITY_GLITCH_LEAK_MESSAGES)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Random checkout error triggered for testing purposes"
        )
```

- [ ] **Step 4: Run test to verify it passes**

Restart Terminal A, then:
```bash
cd tests && npx vitest run golden.test.ts -t "checkout information leak"
```
Expected: PASS. Then run the whole suite once to confirm nothing else regressed:
```bash
cd tests && npx vitest run
```
Expected: all PASS (`api.test.ts`, `golden.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add backend/database.py backend/routers/checkout.py tests/golden.test.ts
git commit -m "feat(backend): security_glitch_user leaks simulated internal details on checkout errors"
```

---

### Task 6: Web Quick Login — add both users to `Login.jsx`

**Files:**
- Modify: `frontend/src/pages/Login.jsx:11-17`

**Interfaces:**
- Consumes: nothing new — `USER_HINTS` keys already drive `TEST_USER_FALLBACK` (line 25) and the fetched `/api/auth/users` list already includes the two new users after Task 1.
- Produces: two new chip buttons in the Quick Login panel.

- [ ] **Step 1: Implement**

In `frontend/src/pages/Login.jsx`, change `USER_HINTS`:

```javascript
const USER_HINTS = {
  standard_user: "Standard",
  locked_out_user: "Locked",
  problem_user: "Problem",
  performance_glitch_user: "Glitch",
  error_user: "Error",
  a11y_glitch_user: "A11y",
  security_glitch_user: "Security",
};
```

- [ ] **Step 2: Verify manually**

With the backend running (Task 1-5 already applied) and `cd frontend && pnpm dev`, open the login page and confirm two new chips ("A11y", "Security") appear in the Quick Login panel and clicking one fills the username field with the corresponding `..._user` value.

- [ ] **Step 3: Run the existing Cypress component suite (must still pass — it stubs `/api/auth/users` with an empty array, so it's unaffected by this change, but confirm)**

```bash
cd frontend && pnpm test:ct
```
Expected: all PASS (no new tests needed — `Login.cy.jsx` doesn't assert on `USER_HINTS` contents).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "feat(web): add a11y_glitch_user and security_glitch_user to Quick Login"
```

---

### Task 7: Mobile Quick Login — add both users to `LoginScreen.tsx`

**Files:**
- Modify: `frontend-mobile/src/screens/LoginScreen.tsx:28-34`

**Interfaces:**
- Consumes: nothing new — mobile's Quick Login list is fully static (no `/api/auth/users` fetch), so both users must be added here directly or they will never appear on mobile.
- Produces: two new chips in the mobile Quick Login list.

- [ ] **Step 1: Implement**

In `frontend-mobile/src/screens/LoginScreen.tsx`, change `TEST_USERS`:

```typescript
const TEST_USERS = [
  { id: "standard_user", label: "Standard" },
  { id: "locked_out_user", label: "Locked" },
  { id: "problem_user", label: "Problem" },
  { id: "performance_glitch_user", label: "Glitch" },
  { id: "error_user", label: "Error" },
  { id: "a11y_glitch_user", label: "A11y" },
  { id: "security_glitch_user", label: "Security" },
];
```

- [ ] **Step 2: Verify manually**

With `frontend-mobile/src/api/client.ts` pointed at a reachable backend (local or Render) and `cd frontend-mobile && pnpm ios` (or `pnpm android`), confirm the two new chips appear on the Login screen and tapping one fills the username field.

- [ ] **Step 3: Commit**

```bash
git add frontend-mobile/src/screens/LoginScreen.tsx
git commit -m "feat(mobile): add a11y_glitch_user and security_glitch_user to Quick Login"
```

---

## Plan Self-Review Notes

- **Spec coverage:** Section 3 (data model) → Task 1. Section 4 (a11y modes) → Task 2. Section 5 (profile poisoning / IDOR / checkout leak) → Tasks 3/4/5. Section 6 (frontend/mobile/docs touch points) → Tasks 3 (docstring), 6, 7. Section 7 (testing) → the test written in each task. No spec section is without a task.
- **Type/name consistency checked:** `_a11y_glitch_text` signature `(raw_value, lang, mode, field)` is identical across its definition (Task 2) and both call sites (`get_catalog`, `get_enriched_cart`, same task). `SECURITY_GLITCH_*` constant names match between their definition (Task 1) and every consumer (Tasks 2, 3, 5). `should_trigger_error`'s signature (`behavior: str) -> bool`) is unchanged — only its body's tuple check grows.
- **No placeholders:** every step above has literal code or literal shell commands with a stated expected result.
