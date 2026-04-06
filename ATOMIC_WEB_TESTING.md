# Atomic Web Testing

Enables the external automation framework (`ahm-poc`) to open the OmniPizza web app
directly on any target screen after seeding state through the API, without executing
the full user journey.

---

## How it works

The web app uses **React Router v6** with standard URL paths. Every route is directly
navigable — no special linking config is required.

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

| Key | Format | Purpose |
|-----|--------|---------|
| `omnipizza-auth` | Zustand JSON `{state:{token,username,behavior},version:0}` | Auth token |
| `countryCode` | Plain string `"MX"` | API header fallback |
| `omnipizza-country` | Zustand JSON | Market + language settings |
| `omnipizza-cart` | Zustand JSON `{state:{items:[]},version:0}` | Cart — keep empty for API hydration |

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
  await request.post(`${BASE_URL}/api/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Country-Code": "MX",
    },
    data: {
      items: [{ pizza_id: "pepperoni", size: "large", quantity: 2 }],
    },
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
  await expect(page.getByTestId("view-order-summary")).toBeVisible();
  await expect(page.getByText("pepperoni", { ignoreCase: true })).toBeVisible();
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

```javascript
test("order-success renders after API order", async ({ page, request }) => {
  const { access_token: token } = await (
    await request.post(`${BASE_URL}/api/auth/login`, {
      data: { username: "standard_user", password: "pizza123" },
    })
  ).json();

  // Seed a completed order in localStorage so OrderSuccess has data
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
            subtotal: 320,
            tax: 51.2,
            tip: 0,
            total: 371.2,
            currency: "MXN",
            currency_symbol: "$",
          },
        },
        version: 0,
      })
    );
  }, { token });

  await page.goto(`${APP_URL}/order-success`);
  await expect(page.getByTestId("text-status-title")).toBeVisible();
});
```

### Reset session before suite

```javascript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("omnipizza-auth");
    localStorage.removeItem("omnipizza-cart");
    localStorage.removeItem("omnipizza-order");
    localStorage.removeItem("countryCode");
  });
});
```

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
  -d '{"items":[{"pizza_id":"pepperoni","size":"large","quantity":2}]}'

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

### Why no special URL params?

The web app stores market and language in Zustand (persisted to `localStorage`). Because
React Router is already URL-based, direct navigation (`/checkout`) works out of the box —
no custom linking config is needed. State is injected via `localStorage` before page load,
not via URL params.

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
