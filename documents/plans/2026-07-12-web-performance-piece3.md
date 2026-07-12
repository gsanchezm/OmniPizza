# Web Performance (Piece 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Apply three web performance improvements to `frontend/` — route code-splitting (React.lazy), correct render memoization (React.memo with stabilized props), and Zustand `devtools` middleware — with ZERO change to behavior, `data-testid` selectors, or `localStorage` persist keys.

**Architecture:** Lazy-load the 4 protected pages behind `<Suspense>`; make `ProductCard`/`CartSidebar` `React.memo` effective by stabilizing the callbacks/`tid` passed to them; wrap the 5 stores in `devtools`. Verified by a real browser drive against a running backend.

**Tech Stack:** React 18, Vite, react-router-dom, Zustand.

## Global Constraints

- **No behavior change** for the user: same flows, same rendered output, same prices/translations on market/language switch.
- **`data-testid` selectors are a contract** — do not rename or drop any. `ProductCard` testids use `tid(...)` which appends `-desktop`/`-responsive`; that suffix MUST be preserved (so `tid` stays, just made stable).
- **`localStorage` persist keys are load-bearing** (`omnipizza-auth/-country/-cart/-profile/-order`) for atomic web testing — `devtools` must NOT change persist key names or store shapes. Do NOT merge the 5 stores.
- Order of Zustand middleware: `create(devtools(persist(fn, persistOpts), devtoolsOpts))` — devtools outermost.
- Verification: `pnpm build` compiles (implementer), then a controller-run browser drive.

---

## Task 1: Zustand devtools middleware (safe, do first)

**Files:**
- Modify: `frontend/src/store.js`

- [ ] **Step 1: Import devtools**

Change the import line:
```js
import { persist } from "zustand/middleware";
```
to:
```js
import { persist, devtools } from "zustand/middleware";
```

- [ ] **Step 2: Wrap each of the 5 stores with `devtools`**

For each `create(persist(<fn>, { name: "<key>" }))`, wrap as `create(devtools(persist(<fn>, { name: "<key>" }), { name: "<StoreName>" }))`. Do NOT change `<fn>`, the persist `name`, or any store logic. Apply to all five:
- `useAuthStore` → devtools name `"AuthStore"`, persist name unchanged `"omnipizza-auth"`
- `useCountryStore` → devtools name `"CountryStore"`, persist name unchanged `"omnipizza-country"`
- `useCartStore` → devtools name `"CartStore"`, persist name unchanged `"omnipizza-cart"`
- `useProfileStore` → devtools name `"ProfileStore"`, persist name unchanged `"omnipizza-profile"`
- `useOrderStore` → devtools name `"OrderStore"`, persist name unchanged `"omnipizza-order"`

Example (auth store):
```js
export const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        /* ...unchanged body... */
      }),
      { name: "omnipizza-auth" }
    ),
    { name: "AuthStore" }
  )
);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store.js && git commit -m "feat(web): add Zustand devtools middleware to stores"
```

---

## Task 2: Route code-splitting with React.lazy (App.jsx)

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Convert the 4 protected pages to lazy imports**

Change the top imports. Keep `Login`, `Navbar`, `ProtectedRoute`, `Toast` as eager imports (used on the entry route / every route). Replace the eager page imports for the protected pages:
```jsx
import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useCountryStore } from "./store";
import { useCountryFeatureInfo } from "./features/country/hooks/useCountryFeatureInfo";

import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";
import Toast from "./components/Toast";

const Catalog = lazy(() => import("./pages/Catalog"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Profile = lazy(() => import("./pages/Profile"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
```

- [ ] **Step 2: Wrap `<Routes>` in `<Suspense>`**

Wrap the existing `<Routes>...</Routes>` block with a Suspense boundary and a neutral fallback:
```jsx
<Suspense fallback={<div data-testid="route-loading" className="min-h-screen lux-bg" />}>
  <Routes>
    {/* ...unchanged routes... */}
  </Routes>
</Suspense>
```
Do not change the routes themselves.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx && git commit -m "perf(web): code-split protected routes with React.lazy + Suspense"
```

---

## Task 3: Effective render memoization (the props must be stable)

**Files:**
- Modify: `frontend/src/hooks/useResponsive.js` (stabilize `tid`)
- Modify: `frontend/src/components/ProductCard.jsx` (`React.memo`)
- Modify: `frontend/src/components/CartSidebar.jsx` (`React.memo`)
- Modify: `frontend/src/pages/Catalog.jsx` (stabilize the callbacks passed to the memoized children)

**Interfaces:** `ProductCard` now calls `formatPrice(pizza.price, pizza.currency, pizza.currency_symbol)` (3 args). `Catalog` passes a stable `formatPrice` with signature `(val, curr, symbol) => string`.

- [ ] **Step 1: Stabilize `tid` in `useResponsive.js`**

`tid` is recreated every render, which would defeat `React.memo` on `ProductCard` (and its testid string is a contract, so it must keep the suffix). Memoize it:
```js
import { useState, useEffect, useCallback } from "react";
```
and replace `const tid = (base) => `${base}${suffix}`;` with:
```js
  const tid = useCallback((base) => `${base}${suffix}`, [suffix]);
```

- [ ] **Step 2: `React.memo` on `ProductCard` and use the 3-arg `formatPrice`**

In `frontend/src/components/ProductCard.jsx`: change the price line from `{formatPrice(pizza.price, pizza.currency)}` to `{formatPrice(pizza.price, pizza.currency, pizza.currency_symbol)}`, and export memoized:
```jsx
function ProductCard({ pizza, onAdd, formatPrice, t, tid }) {
  /* ...unchanged body, except the price line uses the 3-arg formatPrice... */
}

export default React.memo(ProductCard);
```

- [ ] **Step 3: `React.memo` on `CartSidebar`**

In `frontend/src/components/CartSidebar.jsx`, wrap the default export:
```jsx
function CartSidebar({ cartItems, onCheckout, onRemove, onUpdateQty }) {
  /* ...unchanged body... */
}

export default React.memo(CartSidebar);
```

- [ ] **Step 4: Stabilize the callbacks in `Catalog.jsx`**

Add `useCallback` to the import: `import React, { useMemo, useState, useCallback } from "react";`

Replace `handleOpenModal` and `handleCheckout` with memoized versions, and add a stable `formatPrice`:
```jsx
  const handleOpenModal = useCallback((pizza) => {
    setSelectedPizza(pizza);
    setModalOpen(true);
  }, []);

  const handleCheckout = useCallback(() => {
    navigate("/checkout");
  }, [navigate]);

  const formatPrice = useCallback(
    (val, curr, symbol) => formatMoney(val, curr, locale, symbol),
    [locale]
  );
```
(Leave `handleCloseModal` and `handleConfirm` as-is — they are passed to the keyed modal, not the memoized list.)

Then change the `ProductCard` usage in the map to pass the stable `formatPrice` (remove the inline arrow):
```jsx
                    {filteredPizzas.map(pizza => (
                       <ProductCard
                         key={pizza.id}
                         pizza={pizza}
                         onAdd={handleOpenModal}
                         formatPrice={formatPrice}
                         tid={tid}
                       />
                    ))}
```

- [ ] **Step 5: Compile check**

From `frontend/`: `pnpm build`. Expected: build succeeds, no errors. If the build tooling misbehaves on this machine, report it (the controller will verify at runtime).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useResponsive.js frontend/src/components/ProductCard.jsx frontend/src/components/CartSidebar.jsx frontend/src/pages/Catalog.jsx
git commit -m "perf(web): memoize ProductCard/CartSidebar with stabilized props"
```

## Verification (controller-run, browser)

Start `vite dev` (against the local backend on :8000), drive with Chrome: login (`standard_user`/`pizza123`) → catalog → search + category filter + add-to-cart (modal) → checkout → place order → order-success; then switch market and language and confirm prices + names re-render correctly (the key check that memoization introduced no stale renders). Confirm `data-testid`s resolve and the console is clean.

## Self-review notes

- `tid` stability is the linchpin of `ProductCard` memo — without Step 1, the memo is inert (new `tid` ref every render).
- `devtools` must not alter persist keys/shapes; a Playwright `addInitScript` seeding `omnipizza-auth` etc. must still hydrate identically.
- `Login` stays eager so the entry/unauthenticated view has no Suspense flash.
