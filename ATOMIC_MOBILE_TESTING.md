# Atomic Mobile Testing — Deep Link Support

Enables the external automation framework (`ahm-poc`) to open the OmniPizza mobile
app directly on any target screen after hydrating state through the API, without
executing a full user journey.

---

## 1. Repository Findings

| Item | Details |
|------|---------|
| Entry point | `frontend-mobile/App.tsx` → `NavigationContainer` wrapping a single `createNativeStackNavigator` |
| Screens | 6: Login, Catalog, PizzaBuilder, Checkout, OrderSuccess, Profile |
| State | Zustand (`useAppStore`) — ephemeral, no persistence layer |
| URI scheme | `omnipizza://` already registered in `app.json` |
| Deep linking before | Not implemented (scheme registered but no handlers) |
| Cart hydration | Exists in `CheckoutScreen` — skips fetch if local cart is non-empty |

---

## 2. Solution Summary

React Navigation's built-in `linking` prop on `NavigationContainer` maps
`omnipizza://<route>` URLs directly to screens, passing all query params as
screen route params.

A separate `useDeepLinkParams` hook processes the side-effect params that
Navigation cannot handle on its own:
- `accessToken=<jwt>` → `setToken()` — injects auth before any downstream fetch
- `market` / `lang` → update Zustand store (country + language)
- `resetSession=true` → `logout()` + navigate to Login
- `hydrateCart=true` → `clearCart()` so `CheckoutScreen`'s existing hydration runs

`PizzaBuilderScreen` was extended with a minimal `pizzaId` + `size` fallback so it
can be reached atomically by ID instead of requiring a full `Pizza` object.

---

## 3. Files Modified

| File | Type | Why |
|------|------|-----|
| `frontend-mobile/src/navigation/types.ts` | **Created** | Typed `RootStackParamList` with deep link params for every screen |
| `frontend-mobile/src/navigation/linking.ts` | **Created** | React Navigation `LinkingOptions` mapping `omnipizza://` routes to screen names |
| `frontend-mobile/src/hooks/useDeepLinkParams.ts` | **Created** | Hook that handles state side effects from URL params (accessToken, market, lang, resetSession, hydrateCart) |
| `frontend-mobile/App.tsx` | **Modified** | Added `linking` prop to `NavigationContainer`, wired `useDeepLinkParams`, exported `navigationRef` |
| `frontend-mobile/src/screens/PizzaBuilderScreen.tsx` | **Modified** | Handle `pizzaId` and `size` deep link params as fallback when no full `pizza` object is passed |

---

## 4. Deep Link Reference

### Supported routes

| Deep Link | Opens Screen | Notes |
|-----------|-------------|-------|
| `omnipizza://login` | LoginScreen | Always accessible |
| `omnipizza://catalog` | CatalogScreen | Requires valid token in store |
| `omnipizza://pizza-builder` | PizzaBuilderScreen | Requires `pizzaId` param |
| `omnipizza://checkout` | CheckoutScreen | Use `hydrateCart=true` for API-injected carts |
| `omnipizza://order-success` | OrderSuccessScreen | Pass `orderId` for test assertions |
| `omnipizza://profile` | ProfileScreen | Requires valid token in store |

### Universal query params (any route)

| Param | Values | Effect |
|-------|--------|--------|
| `accessToken` | JWT string | Sets auth token in store — applied before market/hydrateCart so any downstream fetch is authenticated |
| `market` | `US` `MX` `CH` `JP` | Sets country in store; auto-updates language |
| `lang` | `de` `fr` | Sets CH language preference (ignored for other markets) |
| `resetSession` | `true` | Logs out, clears cart, navigates to Login |

### Route-specific params

| Route | Param | Effect |
|-------|-------|--------|
| `pizza-builder` | `pizzaId=<id>` | Fetches pizza from catalog by ID |
| `pizza-builder` | `size=small\|medium\|large\|family` | Pre-selects size |
| `checkout` | `hydrateCart=true` | Clears local cart so screen fetches from backend |
| any | `accessToken=<jwt>` | Injects auth token — combine with `hydrateCart=true` to bypass login UI entirely |
| `order-success` | `orderId=<id>` | Available in route params for test assertions |

---

## 5. Deep Link Examples

```
# Open Login (cold reset before test suite)
omnipizza://login?resetSession=true

# Open Catalog in JP market
omnipizza://catalog?market=JP&lang=ja

# Open PizzaBuilder with a specific pizza pre-loaded, family size, MX market
omnipizza://pizza-builder?pizzaId=p02&size=family&market=MX&lang=es

# Open Checkout with API-injected cart (requires POST /api/cart first)
omnipizza://checkout?market=US&lang=en&hydrateCart=true

# Open Checkout injecting token directly — bypasses login UI entirely
omnipizza://checkout?market=JP&hydrateCart=true&accessToken=eyJ...

# Open Checkout in Switzerland, French language
omnipizza://checkout?market=CH&lang=fr&hydrateCart=true

# Open OrderSuccess with order ID for assertion
omnipizza://order-success?orderId=12345&market=JP&lang=ja

# Open Profile in US market
omnipizza://profile?market=US&lang=en
```

---

## 6. External Automation Usage (`ahm-poc`)

The pattern for each atomic test:

```
1. API setup
   POST /api/auth/login                → get token
   POST /api/market   (header)         → set X-Country-Code
   POST /api/cart     { items: [...] } → seed cart

2. Deep link
   driver.execute("mobile: deepLink", {
     url: "omnipizza://checkout?market=MX&lang=es&hydrateCart=true",
     package: "com.omnipizza.app"        // Android
   })

   // iOS (XCUITest / Appium)
   driver.execute("mobile: deepLink", {
     url: "omnipizza://checkout?market=MX&lang=es&hydrateCart=true"
   })

   // Or via adb (Android direct)
   adb shell am start \
     -W -a android.intent.action.VIEW \
     -d "omnipizza://checkout?market=MX&lang=es&hydrateCart=true" \
     com.omnipizza.app

   // Or via xcrun simctl (iOS simulator)
   xcrun simctl openurl booted \
     "omnipizza://checkout?market=MX&lang=es&hydrateCart=true"

3. Assert
   await expect(element(by.id("screen-checkout"))).toBeVisible();
   await expect(element(by.id("text-section-summary"))).toBeVisible();
```

### Flow example — Checkout atomic test (MX market)

```bash
# 1. Login and seed state
TOKEN=$(curl -s -X POST https://omnipizza-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"pizza123"}' | jq -r .access_token)

curl -s -X POST https://omnipizza-backend.onrender.com/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Country-Code: MX" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"pizza_id":"p02","size":"large","quantity":2}]}'

# 2. Open checkout directly — pass token in the deep link (no login UI needed)
adb shell am start -W -a android.intent.action.VIEW \
  -d "omnipizza://checkout?market=MX&lang=es&hydrateCart=true&accessToken=$TOKEN" \
  com.omnipizza.app
```

---

## 7. Manual Validation Steps

### iOS Simulator
```bash
xcrun simctl openurl booted omnipizza://login
xcrun simctl openurl booted omnipizza://catalog?market=JP
xcrun simctl openurl booted "omnipizza://pizza-builder?pizzaId=p02&size=large&market=US"
xcrun simctl openurl booted "omnipizza://checkout?market=MX&lang=es&hydrateCart=true"
xcrun simctl openurl booted "omnipizza://order-success?orderId=abc123&market=US"
xcrun simctl openurl booted omnipizza://profile?market=CH&lang=fr
```

### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "omnipizza://login" com.omnipizza.app
adb shell am start -W -a android.intent.action.VIEW -d "omnipizza://catalog?market=JP" com.omnipizza.app
adb shell am start -W -a android.intent.action.VIEW -d "omnipizza://pizza-builder?pizzaId=p02&size=large&market=US" com.omnipizza.app
adb shell am start -W -a android.intent.action.VIEW -d "omnipizza://checkout?market=MX&lang=es&hydrateCart=true" com.omnipizza.app
adb shell am start -W -a android.intent.action.VIEW -d "omnipizza://order-success?orderId=abc123&market=US" com.omnipizza.app
adb shell am start -W -a android.intent.action.VIEW -d "omnipizza://profile?market=CH&lang=fr" com.omnipizza.app
```

### Validation checklist

- [ ] `omnipizza://login` opens LoginScreen directly
- [ ] `omnipizza://catalog?market=JP` opens CatalogScreen and displays JPY prices
- [ ] `omnipizza://pizza-builder?pizzaId=p02&size=large` loads Pepperoni pizza with Large pre-selected
- [ ] `omnipizza://pizza-builder?pizzaId=unknown` falls back (goBack → Catalog)

### Valid `pizza_id` values (catalog IDs)

The backend enriches cart items against the catalog. `POST /api/cart` silently accepts any `pizza_id`, but `GET /api/cart` returns `cart_items: []` when the ID is not in the catalog. Always use one of these:

| ID | Pizza | ID | Pizza |
|----|-------|----|-------|
| `p01` | Margherita | `p07` | Capricciosa |
| `p02` | Pepperoni | `p08` | Diavola |
| `p03` | Hawaiian | `p09` | Prosciutto |
| `p04` | Four Cheese | `p10` | Quattro Stagioni |
| `p05` | Veggie | `p11` | Funghi |
| `p06` | Marinara | `p12` | BBQ Chicken |
- [ ] `omnipizza://checkout?hydrateCart=true` with seeded backend cart shows correct items
- [ ] `omnipizza://checkout?hydrateCart=true&accessToken=<jwt>` hydrates cart without prior login
- [ ] `omnipizza://checkout?market=MX` shows MX-specific fields (colonia, zip)
- [ ] Tip buttons expose `btn-tip-0`, `btn-tip-5`, `btn-tip-10`, `btn-tip-15`
- [ ] Summary values expose readable text for Appium/XCUITest (`text-subtotal-value`, `text-tax-value`, `text-total-value`)
- [ ] `omnipizza://order-success?orderId=12345` opens OrderSuccess screen
- [ ] `omnipizza://profile?market=CH&lang=fr` opens Profile with French locale
- [ ] `omnipizza://login?resetSession=true` clears session and lands on Login
- [ ] Warm start (app already open): deep link switches screen correctly

---

## 8. Technical Notes

### Architecture decisions

**Why React Navigation `linking` + a separate hook?**
React Navigation's `linking` config handles URL-to-screen routing automatically
(both cold start and warm start). The hook handles state mutations that don't map
to screen params — you cannot tell Navigation to "also call `setCountry()`" via URL
mapping alone.

**Why `hydrateCart` clears local cart instead of fetching itself?**
`CheckoutScreen` already has robust cart hydration logic (with error fallback,
cancellation, cart item normalization). Duplicating that in the hook would violate
DRY. The hook just signals intent by clearing the local cart; the screen does the rest.

**Why `resetSession` navigates to Login via `navRef.reset()`?**
`navigation.navigate("Login")` would push Login onto the stack, preserving the
current screen in history. `reset()` replaces the entire stack, which matches the
expected behavior for a full session reset.

### Edge cases

| Scenario | Behavior |
|----------|---------|
| `omnipizza://pizza-builder` with no `pizzaId` | Screen renders `null` (existing behavior — `if (!pizza) return null`) |
| `omnipizza://pizza-builder?pizzaId=<nonexistent>` | Screen calls `navigation.goBack()` |
| `omnipizza://checkout` with empty local cart but no backend cart | Hydration runs, finds nothing, screen renders with empty cart |
| `market=CH&lang=es` | `setCountry("CH")` sets German, then `setLanguage("es")` is ignored (not de/fr) |
| Deep link while unauthenticated | Screen renders normally; screens that require a token will hit API errors and their own fallback UIs |
| Cold start timing | `getInitialURL()` is awaited asynchronously; `navigationRef.isReady()` guard prevents navigation before container mounts |

### Auth injection via `accessToken`

External automation frameworks can bypass the login screen entirely by passing
`accessToken=<jwt>` in the deep link. The hook calls `setToken()` before applying
`market`, `hydrateCart`, or any other param — so the token is in the Zustand store
before `CheckoutScreen` mounts and fires `GET /api/cart`.

Obtain the token via `POST /api/auth/login`, then pass it verbatim in the URL:

```bash
TOKEN=$(curl -s -X POST https://omnipizza-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"pizza123"}' | jq -r .access_token)

xcrun simctl openurl booted \
  "omnipizza://checkout?market=MX&lang=es&hydrateCart=true&accessToken=$TOKEN"
```

Screens that require authentication but receive no `accessToken` param continue to
handle auth errors through their own existing fallback UIs.
