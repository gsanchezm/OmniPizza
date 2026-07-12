# Atomic Web Testing

Enables the external automation framework (`ahm-poc`) to open the OmniPizza web app
directly on any target screen after seeding state through the API, without executing
the full user journey.

---

## How it works

The web app uses **React Router v6** with standard URL paths. Every route is directly
navigable — no special linking config is required.

The protected pages (`/catalog`, `/checkout`, `/profile`, `/order-success`) are
**`React.lazy`-loaded** behind a single `<Suspense>` boundary, so a direct navigation
first paints a brief fallback (`data-testid="route-loading"`) while the route's JS
chunk loads, then mounts the page. Playwright/WebDriver auto-waiting on the page's own
`data-testid` (e.g. the checkout order summary) transparently absorbs this — no test
change is needed. Only replace any **hard `waitForTimeout`** before an assertion with a
wait on the target element. (`Login` stays eagerly loaded, so `/` has no fallback.)

The **Checkout page already fetches `GET /api/cart` on mount** and hydrates the
local cart from the backend **when the local Zustand cart is empty**. This is the
core mechanism for atomic cart injection.

The Zustand stores are **persisted to `localStorage`**, so automation can set auth
state before page load via `localStorage` injection (Playwright `addInitScript`) or
`storageState`.

---

## Route Reference

| URL | Page | Auth Required |
|-----|------|---------------|
| `/` | Login | No |
| `/catalog` | Catalog | Yes |
| `/checkout` | Checkout | Yes — auto-hydrates cart from `GET /api/cart` |
| `/profile` | Profile | Yes |
| `/order-success` | Order Success | Yes |

Protected routes redirect to `/` automatically if no token is found in `localStorage`.

---

## LocalStorage Keys

Every key below is written by `frontend/src/store.js` (the single source of all
`localStorage` writes on the web app). "Persisted store" keys are managed by Zustand's
`persist` middleware and always wrap state as `{ "state": { … }, "version": 0 }`.
"Flat mirror" keys are plain strings written directly alongside the store.

| Key | Kind | Exact shape | Written by | Read by |
|-----|------|-------------|-----------|---------|
| `omnipizza-auth` | Persisted store | `{state:{token,username,behavior},version:0}` | `useAuthStore` persist | rehydrate; `token` → `Authorization` header (if it looks like a JWT) |
| `omnipizza-country` | Persisted store | `{state:{countryCode,countryInfo,language,locale,currency},version:0}` | `useCountryStore` persist | rehydrate; `countryCode` → `X-Country-Code`, `language` → `X-Language` |
| `omnipizza-cart` | Persisted store | `{state:{items:[…]},version:0}` | `useCartStore` persist | Checkout hydration guard — keep **empty** to force `GET /api/cart` hydration |
| `omnipizza-profile` | Persisted store | `{state:{fullName,address,phone,notes},version:0}` | `useProfileStore` persist | Profile screen (overwritten by `GET /api/users/me/profile` on mount) |
| `omnipizza-order` | Persisted store | `{state:{lastOrder},version:0}` | `useOrderStore` persist | Order-success screen |
| `token` | Flat mirror | JWT string | `login()` (`store.js`) | auth store initializer on cold load |
| `username` | Flat mirror | string | `login()` | auth store initializer |
| `countryCode` | Flat mirror | e.g. `"MX"` | `setCountryCode()` | country store initializer (fallback only) |
| `chLang` | Flat mirror | `"de"` / `"fr"` | `setLanguage()` (CH only) | restores the CH DE/FR choice on market switch |
| `omnipizza-release` | Flat mirror | build id string | module load | deploy-mismatch guard (see the gotcha below) |

> **Markets:** `MX`, `US`, `CH`, `JP`, `SA` (Saudi Arabia / Arabic, RTL). Selecting a
> market sets `language` to that market's default (`MX→es`, `US→en`, `CH→de`, `JP→ja`,
> `SA→ar`); only CH exposes a runtime DE/FR toggle.

> **⚠️ `omnipizza-release` gotcha (silent auth wipe):** on load, `store.js` compares
> `omnipizza-release` against `import.meta.env.VITE_APP_RELEASE`. On mismatch it **removes
> `token`, `username`, and `omnipizza-auth`** to avoid stale-deploy sessions. A seeded
> session whose `omnipizza-release` differs from the deployed build is therefore wiped
> before your test runs. For deterministic seeding, also seed
> `localStorage.setItem("omnipizza-release", "<current VITE_APP_RELEASE>")` (or any value,
> as long as it is present — the guard only fires on a *change*).

---

## Where does the seeded state come from? (annotated `setup()`)

When an AI (or a human) writes a Playwright seed like the one below, every value maps
to a specific line in `frontend/src/store.js`. This is the "source of truth" map so the
seed mirrors *exactly* what the UI login writes — nothing more, nothing less.

```ts
setup("authenticate as standard_user", async ({ browser, request }) => {
  // (1) Log in via API to get the JWT. This is the SAME token the UI login obtains;
  //     the SPA never invents a token client-side.
  const apiRes = await request.post(`${API_URL}/api/auth/login`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  const { access_token } = await apiRes.json();

  // (2) `username`/`behavior` are DERIVED FROM THE TOKEN (JWT claims: sub, behavior).
  //     The SPA reads them the same way — see auth.create_access_token on the backend
  //     ({"sub": username, "behavior": behavior}) and useAuthStore.login(token, username, behavior).
  const claims  = decodeJwt(access_token);
  const username = claims.sub ?? USERNAME;
  const behavior = claims.behavior ?? "standard";
  const market   = MARKETS[COUNTRY] ?? MARKETS.MX;   // { language, locale, currency }

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE_URL);

  await page.evaluate(([token, user, beh, countryCode, mkt]) => {
    const { language, locale, currency } = mkt;

    // ── omnipizza-auth ──────────────────────────────────────────────────────
    //   Source: useAuthStore (persist name "omnipizza-auth"), store.js.
    //   Zustand persist ALWAYS wraps state as { state, version:0 }. The auth store's
    //   persisted fields are exactly { token, username, behavior }. This object — NOT a
    //   flat `access_token` key — is the session source of truth the ProtectedRoute reads.
    localStorage.setItem("omnipizza-auth",
      JSON.stringify({ state: { token, username: user, behavior: beh }, version: 0 }));

    // ── omnipizza-country ───────────────────────────────────────────────────
    //   Source: useCountryStore (persist name "omnipizza-country"), store.js.
    //   Persisted fields: { countryCode, countryInfo, language, locale, currency }.
    //   The catalog guard needs a chosen market here or it bounces back to "/".
    //   `countryCode` drives the X-Country-Code header; `language` drives X-Language.
    localStorage.setItem("omnipizza-country",
      JSON.stringify({ state: { countryCode, countryInfo: null, language, locale, currency }, version: 0 }));

    // ── Flat mirrors ────────────────────────────────────────────────────────
    //   Source: useAuthStore.login() writes `token`+`username`; setCountryCode() writes
    //   `countryCode`. They exist so the store initializers can cold-start from a flat
    //   value before the persisted object rehydrates. Seed them to match the objects above.
    localStorage.setItem("token", token);
    localStorage.setItem("username", user);
    localStorage.setItem("countryCode", countryCode);

    // ── (recommended) omnipizza-release ───────────────────────────────────────
    //   Present it so the deploy-mismatch guard in store.js does NOT wipe the auth you
    //   just seeded. Any value works as long as it doesn't CHANGE between load and reload.
    localStorage.setItem("omnipizza-release", "test-seed");
  }, [access_token, username, behavior, COUNTRY, market]);
});
```

**Reset recipe (fully deterministic):** removing only `omnipizza-auth` is **not**
enough — the auth store initializer reads the flat `token`/`username` keys, so a stale
session can rehydrate. Clear all of these:

```ts
["omnipizza-auth","token","username","omnipizza-country","countryCode",
 "chLang","omnipizza-cart","omnipizza-profile","omnipizza-order"]
  .forEach((k) => localStorage.removeItem(k));
```

---

## Atomic Test Pattern

```
1. Get token via POST /api/auth/login
2. Inject auth + market into localStorage before page load
3. Seed cart via POST /api/cart
4. Navigate directly to /checkout
5. Checkout fetches GET /api/cart → hydrates the cart UI automatically
6. Assert
```

---

## Playwright Examples

### Checkout atomic test (MX market)

```javascript
const BASE_URL = "https://omnipizza-backend.onrender.com";
const APP_URL  = "https://omnipizza-frontend.onrender.com";

test("checkout renders API-seeded cart for MX", async ({ page, request }) => {
  // 1. Get token
  const loginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { username: "standard_user", password: "pizza123" },
  });
  const { access_token: token } = await loginRes.json();

  // 2. Seed cart
  //    Note: POST /api/cart is per-user and does NOT read X-Country-Code.
  //    Use POST /api/store/market (below) to set the market for the session.
  await request.post(`${BASE_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      items: [{ pizza_id: "p02", size: "large", quantity: 2 }],
    },
  });

  // 2b. Set market for the session
  await request.post(`${BASE_URL}/api/store/market`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { country_code: "MX" },
  });

  // 3. Inject auth + market into localStorage before page load
  await page.addInitScript(({ token }) => {
    localStorage.setItem(
      "omnipizza-auth",
      JSON.stringify({ state: { token, username: "standard_user", behavior: null }, version: 0 })
    );
    localStorage.setItem("countryCode", "MX");
    localStorage.setItem(
      "omnipizza-country",
      JSON.stringify({
        state: { countryCode: "MX", language: "es", locale: "es-MX", currency: "MXN", countryInfo: null },
        version: 0,
      })
    );
    // Empty cart so Checkout fetches from API
    localStorage.setItem(
      "omnipizza-cart",
      JSON.stringify({ state: { items: [] }, version: 0 })
    );
  }, { token });

  // 4. Navigate directly to checkout
  await page.goto(`${APP_URL}/checkout`);

  // 5. Assert — cart hydrated from API
  await expect(page.getByTestId("order-summary-title")).toBeVisible();
  await expect(page.getByText("pepperoni", { ignoreCase: true })).toBeVisible();
  await expect(page.getByTestId("order-tip-0")).toBeVisible();
});
```

### Profile atomic test

```javascript
test("profile page loads directly", async ({ page, request }) => {
  const { access_token: token } = await (
    await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: "standard_user", password: "pizza123" },
    })
  ).json();

  await page.addInitScript(({ token }) => {
    localStorage.setItem(
      "omnipizza-auth",
      JSON.stringify({ state: { token, username: "standard_user", behavior: null }, version: 0 })
    );
  }, { token });

  await page.goto(`${APP_URL}/profile`);
  await expect(page.getByTestId("input-profile-fullname")).toBeVisible();
});
```

### Order Success atomic test

Two variants — pick the one that fits your suite:

**Variant A — `?orderId=` URL param (recommended; no localStorage shape coupling):**

```javascript
test("order-success hydrates lastOrder via ?orderId=", async ({ page, request }) => {
  // 1. Login + place a real order so we have a real order_id
  const { access_token: token } = await (
    await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: "standard_user", password: "pizza123" },
    })
  ).json();

  const checkout = await request.post(`${BASE_URL}/api/checkout`, {
    headers: { Authorization: `Bearer ${token}`, "X-Country-Code": "MX" },
    data: {
      country_code: "MX",
      items: [{ pizza_id: "p02", size: "large", quantity: 1 }],
      name: "QA", address: "Av. Test 1", phone: "5500000000",
      colonia: "Roma Norte",
    },
  });
  const { order_id } = await checkout.json();

  // 2. Inject only the auth token; OrderSuccess will call GET /api/orders/{id}
  await page.addInitScript(({ token }) => {
    localStorage.setItem(
      "omnipizza-auth",
      JSON.stringify({ state: { token, username: "standard_user", behavior: null }, version: 0 })
    );
  }, { token });

  // 3. Open order-success with the orderId param
  await page.goto(`${APP_URL}/order-success?orderId=${order_id}`);

  // 4. Assert — order block (gated by `lastOrder`) becomes visible
  await expect(page.getByTestId("order-id")).toContainText(order_id);
  await expect(page.getByTestId("order-total")).toBeVisible();
});
```

**Variant B — `localStorage` seed (offline / no live backend):**

```javascript
test("order-success renders from localStorage seed", async ({ page, request }) => {
  const { access_token: token } = await (
    await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: "standard_user", password: "pizza123" },
    })
  ).json();

  await page.addInitScript(({ token }) => {
    localStorage.setItem(
      "omnipizza-auth",
      JSON.stringify({ state: { token, username: "standard_user", behavior: null }, version: 0 })
    );
    localStorage.setItem(
      "omnipizza-order",
      JSON.stringify({
        state: {
          lastOrder: {
            order_id: "test-abc123",
            subtotal: 320, delivery_fee: 35.1, tax_rate: 0.16, tip_percentage: 0,
            tax: 51.2, tip: 0, total: 406.3,
            currency: "MXN", currency_symbol: "$",
          },
        },
        version: 0,
      })
    );
  }, { token });

  await page.goto(`${APP_URL}/order-success`);
  await expect(page.getByTestId("order-success-title")).toBeVisible();
});
```

### Reset session before suite

Remove **all** session keys — clearing only `omnipizza-auth` leaves the flat
`token`/`username` mirrors behind, and the auth store initializer will rehydrate from
them, so the app still appears logged in.

```javascript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    [
      "omnipizza-auth", "token", "username",
      "omnipizza-country", "countryCode", "chLang",
      "omnipizza-cart", "omnipizza-profile", "omnipizza-order",
    ].forEach((k) => localStorage.removeItem(k));
  });
});
```

---

## Interactive widgets (for UI automation practice)

These hand-rolled widgets exist to exercise common automation techniques. All expose
stable `data-testid`s.

| Widget | Where | Key `data-testid`s | Technique |
|--------|-------|--------------------|-----------|
| Add-to-cart toast | global (fires on add) | `toast`, `toast-message`, `toast-close` | transient element: wait-appear / auto-dismiss / close |
| Pre-order confirm modal | Checkout (place order) | `confirm-order-modal`, `confirm-order-total`, `confirm-order-yes`, `confirm-order-cancel` | modal: wait overlay → confirm/cancel |
| Tip tooltip | Checkout (tip ℹ️) | `tip-info`, `tip-tooltip` | hover/focus popover |
| Order-details accordion | Order Success | `order-details-toggle`, `order-details-panel` | expand/collapse, conditional visibility |
| Country flags | Login | `flag-{US\|MX\|CH\|JP\|SA}`, `market-{code}` | image assertion (real SVG flags, not emoji) |
| Payment radio group | Checkout | `payment-method-{card\|cash\|paypal}` (`role="radiogroup"`, `aria-checked`) | radio selection; conditional fields per choice |
| Emulated PayPal form | Checkout (PayPal selected) | `paypal-email`, `paypal-password`, `paypal-login-btn`, `paypal-demo-note` | conditional form; demo only, does not place the order |
| Card expiry dropdowns | Checkout (Credit Card selected) | `card-expiry-month`, `card-expiry-year` (native `<select>`) | select option (real HTML selects) |
| Birthday date picker | Profile | `profile-birthday` (native `<input type="date">`) | date input |

> The market dropdown was **removed** — switching market mid-session cleared the cart, so
> the market is chosen at login (`market-{code}` on the Login page) by design.

> The confirm modal intercepts the place-order button, so a test that used to click
> `place-order-btn` and immediately assert success must now also click `confirm-order-yes`.

---

## Using Playwright `storageState`

For test suites that reuse the same auth session across many tests:

```javascript
// global-setup.ts
import { request } from "@playwright/test";

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: "https://omnipizza-backend.onrender.com" });
  const { access_token: token } = await (
    await api.post("/api/auth/login", {
      data: { username: "standard_user", password: "pizza123" },
    })
  ).json();

  // Write a storage state file with the auth token injected
  await page.addInitScript(({ token }) => {
    localStorage.setItem(
      "omnipizza-auth",
      JSON.stringify({ state: { token, username: "standard_user", behavior: null }, version: 0 })
    );
  }, { token });

  await page.context().storageState({ path: "playwright/.auth/standard_user.json" });
}

// playwright.config.ts
export default {
  use: {
    storageState: "playwright/.auth/standard_user.json",
  },
};
```

---

## Shell-based API Setup (cURL)

For non-Playwright runners (WebdriverIO, Selenium, Gatling):

```bash
BASE_URL="https://omnipizza-backend.onrender.com"

# 1. Login
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"pizza123"}' \
  | jq -r .access_token)

# 2. Set market
curl -s -X POST "$BASE_URL/api/store/market" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"country_code":"MX"}'

# 3. Seed cart
curl -s -X POST "$BASE_URL/api/cart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Country-Code: MX" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"pizza_id":"p02","size":"large","quantity":2}]}'

# 4. Verify cart
curl -s "$BASE_URL/api/cart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Country-Code: MX" | jq .

# 5. Inject token into browser via driver execute (WebdriverIO example)
# driver.execute(() => {
#   localStorage.setItem('omnipizza-auth', JSON.stringify({
#     state: { token: TOKEN, username: 'standard_user', behavior: null }, version: 0
#   }));
# });
# driver.url('/checkout');
```

---

## Manual Validation Steps

```
□ Navigate to /catalog while unauthenticated → redirected to /
□ Set auth in localStorage → navigate to /catalog → catalog loads without login
□ Seed cart via POST /api/cart → navigate to /checkout with empty localStorage cart
  → Checkout shows the API-seeded items in the order summary
□ Set omnipizza-order in localStorage → navigate to /order-success → order details visible
□ Navigate to /profile with valid auth → profile fields visible
□ Remove omnipizza-auth → navigate to /checkout → redirected to /
```

---

## Technical Notes

### Why mostly no special URL params?

The web app stores market and language in Zustand (persisted to `localStorage`). Because
React Router is already URL-based, direct navigation (`/checkout`) works out of the box —
no custom linking config is needed. State is injected via `localStorage` before page load,
not via URL params.

**Exception:** `/order-success?orderId=<id>` is read by the page and calls
`GET /api/orders/{id}` to populate `lastOrder` in the Zustand store. This avoids
hardcoding the order shape into test fixtures — the backend is the source of truth.

### Cart hydration guard

```javascript
// frontend/src/pages/Checkout.jsx
if (useCartStore.getState().items.length > 0) return; // skip — normal shopping flow
const res = await cartService.getCart();               // hydrate from API
```

The guard means: if the local cart already has items (user built it through the UI),
no API fetch happens. If the cart is empty (automated test that skipped the UI journey),
the Checkout fetches `GET /api/cart` and builds the order summary from backend state.

### localStorage Zustand format

Zustand `persist` wraps state as `{"state": {...}, "version": 0}`. Always include the
`version: 0` field when injecting manually, otherwise Zustand may discard the state as
a version mismatch.

### ProtectedRoute redirect

If `omnipizza-auth` is absent or its `state.token` is null, `ProtectedRoute` redirects
to `/` on every protected route. Set the auth key **before** `page.goto()` using
`page.addInitScript()` so it is available on the very first load.
