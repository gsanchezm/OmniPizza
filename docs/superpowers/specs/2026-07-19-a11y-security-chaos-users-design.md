# OmniPizza — Accessibility & Security Chaos Test Users — Design

**Date:** 2026-07-19
**Status:** Approved
**Author:** Claude (brainstorming session "a11y/security chaos users")

## 1. Context

OmniPizza already ships five deterministic "chaos" test users (`TEST_USERS` in
`backend/constants.py`), each driving a specific misbehavior via the JWT `behavior` claim:
`standard_user` (clean), `locked_out_user` (403 at login), `problem_user` ($0 prices + broken
images), `performance_glitch_user` (3s delay on every call), `error_user` (random 500 on
checkout).

This design adds two more, following the exact same pattern: `a11y_glitch_user` (accessibility
automation target) and `security_glitch_user` (security automation target). Both are for
**defensive QA automation** — exercising axe-style accessibility scanners and security-test
suites (XSS output-encoding checks, IDOR checks, information-exposure checks) against the app,
the same way `error_user`/`problem_user` already exercise resilience/negative-path automation.

## 2. Decisions locked with the owner

| # | Topic | Decision |
|---|-------|----------|
| 1 | Two concerns, two users | Accessibility and security are **separate** users, not one combined user — a failing automated check should be unambiguous about which concern it's exercising. |
| 2 | Randomness model | Each user is **always** broken in some way — never a clean/no-op turn — but **which** specific failure appears varies. (Rejected: a 50/50 clean-vs-broken coin flip like `error_user`, because it makes automation less deterministic-to-assert for these two.) |
| 3 | `a11y_glitch_user` scope | 3 interchangeable failure modes, chosen independently per catalog/cart call: missing accessible name, wrong announced language, extreme text length. |
| 4 | `security_glitch_user` scope | 3 endpoint-bound failures, each **always** firing when its endpoint is hit, **except** the checkout leak, which keeps `error_user`'s existing 50% trigger rate (checkout must still be able to succeed, or this user could never complete an order or reach other flows). |

## 3. Data model

`backend/constants.py`:

```python
class UserBehavior(str, Enum):
    ...
    A11Y_GLITCH = "a11y_glitch"
    SECURITY_GLITCH = "security_glitch"

TEST_USERS = {
    ...
    "a11y_glitch_user": {
        "username": "a11y_glitch_user",
        "password": "pizza123",
        "behavior": UserBehavior.A11Y_GLITCH,
        "description": "Catálogo y carrito muestran, al azar, un problema de accesibilidad distinto en cada llamada",
    },
    "security_glitch_user": {
        "username": "security_glitch_user",
        "password": "pizza123",
        "behavior": UserBehavior.SECURITY_GLITCH,
        "description": "Perfil sembrado con payload sin sanear, detalle de orden sin validar dueño, y errores de checkout con detalles internos filtrados",
    },
}
```

No changes needed to `authenticate_user`, `/api/auth/login`, `/api/auth/users`, or JWT
minting — all already iterate `TEST_USERS` generically.

## 4. `a11y_glitch_user` — catalog & cart

Injected at the same two points `problem_user` already uses: `database.py::get_catalog` and
`database.py::get_enriched_cart`. Both currently branch `if behavior == "problem": ...`; add an
`elif behavior == "a11y_glitch":` branch.

**Per call** (not per session, not per item — matches `error_user`'s independent-per-call coin
flip, so consecutive calls can land on different modes), pick one of three modes uniformly at
random and apply it to every item in that response:

- **`missing_name`** — `name = ""` for every item. Price/currency conversion proceeds normally.
  The frontend already threads `pizza.name` into the product-card `<h3>`, the image `alt`, and
  the "add to cart" `aria-label` (`ProductCard.jsx`, `CartSidebar.jsx`, `Checkout.jsx`), so this
  produces an empty heading and an under-specified button name without any frontend changes.
- **`wrong_lang`** — translate `name`/`description` using a language drawn from
  `{en, es, de, fr, ja, ar}` **excluding** the language resolved from `X-Language`/market
  default. The page's declared language no longer matches its actual text content.
- **`extreme_text`** — repeat the translated `name` (and `description`, catalog only) 15 times,
  space-joined, to produce an abnormally long string, for overflow/truncation/reflow testing.

## 5. `security_glitch_user` — profile, order, checkout

Three endpoint-bound failures. Unlike the a11y modes, these are not interchangeable (an
order-detail fetch can't "randomly become" a profile XSS payload), so each fires deterministically
at its own endpoint when this behavior is active:

- **Profile poisoning (always, at login)** — in `routers/auth.py::login`, when
  `user["behavior"] == "security_glitch"`, call the existing
  `db.seed_user_profile(sid, username, {field: payload})` right after minting the token. Pick one
  field at random from `{full_name, address, notes}` and one payload at random from a small canned
  list of standard non-destructive XSS probe strings (e.g. `<script>alert('xss-test')</script>`,
  `<img src=x onerror="console.warn('xss-test')">`, `"><svg onload=alert(1)>`). These test
  output-encoding only — they do nothing if the frontend escapes rendered profile fields
  correctly.
- **IDOR on order detail (always)** — in `checkout.py::get_order`, the existing ownership check
  (`if order["username"] != current_user["username"]: raise 403`) is skipped when
  `current_user["behavior"] == "security_glitch"`. The tester supplies the `order_id` of an order
  placed by a different user (e.g. `standard_user`) and this user can read it regardless of
  ownership — a standard broken-object-level-authorization (IDOR) test fixture.
- **Checkout information leak (50%, same rate as `error_user`)** — generalize
  `database.py::should_trigger_error` to also fire for `security_glitch` at the same 50% rate.
  When it fires for this behavior, `checkout.py` raises the 500 with a `detail` that looks like a
  leaked internal error (simulated traceback / DB connection string / missing-secret message)
  instead of the generic `error_user` message — so a security suite can assert the API response
  never contains that kind of internal detail. Checkout is *not* always-broken for this user,
  because it also needs to succeed sometimes — both to produce this user's own orders and to keep
  other flows (profile, IDOR target creation by other users) reachable.

## 6. Frontend / mobile / docs touch points

- `frontend/src/pages/Login.jsx` — add `a11y_glitch_user: "A11y"` and
  `security_glitch_user: "Security"` to `USER_HINTS`. `TEST_USER_FALLBACK` is derived from
  `Object.keys(USER_HINTS)`, so this alone extends the deterministic pre-fetch panel.
- `frontend-mobile/src/screens/LoginScreen.tsx` — add the same two entries to the static
  `TEST_USERS` array (mobile has no dynamic `/api/auth/users` fetch for this panel — it's fully
  static, so it must be edited directly or the two users never appear in Quick Login on mobile).
- `backend/routers/auth.py` — update the `/api/auth/login` docstring's test-user list.
- No test in `tests/` asserts a fixed count or enumeration of `TEST_USERS` / `/api/auth/users`
  (confirmed by grep across `golden.test.ts`, `api.test.ts`, `test_contract.py`) — adding entries
  is additive and doesn't break existing suites.

## 7. Testing / verification

New cases in `tests/golden.test.ts`, alongside the existing `problem_user chaos behavior` block:

- `a11y_glitch_user`: log in, call catalog (and cart) several times, assert each response matches
  exactly one of the three expected shapes (empty name / language mismatch / abnormal length) —
  proves the 3-way branch is reachable and mutually exclusive per call.
- `security_glitch_user`: log in and assert the profile GET reflects one of the seeded payloads in
  one of the three fields; create an order as `standard_user`, then fetch it as
  `security_glitch_user` and assert 200 (not 403) with the other user's data; call checkout
  repeatedly and assert that whenever a 500 fires, its `error` field matches one of the
  leak-simulation strings (never the generic `error_user` message).

Manual/local verification: run the backend locally, log in as each new user via `/api/docs`, and
confirm catalog/cart/profile/order/checkout responses match this spec before running the
automated suite.
