# Mobile Performance (Piece 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Apply two behavior-preserving performance improvements to the Expo/React Native app in `frontend-mobile/`: (1) effective render memoization of the catalog list, and (2) Zustand field selectors to stop app-wide re-renders. NO virtualization (excluded by decision), NO change to `testID`/behavior.

**Architecture:** `React.memo` the pizza card with stabilized props (`useMemo` the filtered list, `useCallback` the press handler); migrate whole-object `useAppStore()` destructuring to per-field selectors so a store write only re-renders the components that read the changed field.

**Tech Stack:** React Native 0.81 / Expo 54, Zustand (single ephemeral store, no persist/devtools).

## Global Constraints

- **No behavior change**; **no `testID`/`accessibilityLabel` changes** — mobile testIDs are an external Appium/XCUITest contract (helper `src/utils/qa.ts`).
- **Do NOT virtualize** (no `FlatList`) — excluded by decision; the `.map()`+`ScrollView` structure stays so off-screen rows remain mounted for selectors.
- **Field selectors must be behavior-identical:** `const { a, b } = useAppStore()` → `const a = useAppStore((s) => s.a); const b = useAppStore((s) => s.b);`. Select each state field and each action individually. Zustand actions are stable references, so selecting them individually is safe. Do not change any store logic or the store file.
- Verification: `tsc` typecheck (implementer) + a controller-run on-device smoke on the connected Android via Expo Go.

---

## Task 1: Memoize the catalog list

**Files:**
- Modify: `frontend-mobile/src/screens/CatalogScreen.tsx`
- Modify: `frontend-mobile/src/components/MobileProductCard.tsx`

**Interfaces:** `MobileProductCard` stays a named export `export const MobileProductCard`, now `React.memo`-wrapped; its props (`pizza`, `onPress`) are unchanged.

- [ ] **Step 1: `CatalogScreen` — import hooks and stabilize**

Change the React import at the top:
```tsx
import React, { useState, useMemo, useCallback } from "react";
```

Replace the `openBuilderAdd` function (currently lines ~30-32):
```tsx
  const openBuilderAdd = (pizza: Pizza) => {
    navigation.navigate("PizzaBuilder", { mode: "add", pizza });
  };
```
with a `useCallback`:
```tsx
  const openBuilderAdd = useCallback(
    (pizza: Pizza) => {
      navigation.navigate("PizzaBuilder", { mode: "add", pizza });
    },
    [navigation]
  );
```

Replace the `filteredPizzas` expression (currently lines ~34-41):
```tsx
  const filteredPizzas = (pizzas || []).filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchCat =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });
```
with a `useMemo`:
```tsx
  const filteredPizzas = useMemo(
    () =>
      (pizzas || []).filter((p) => {
        const matchSearch = p.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchCat =
          selectedCategory === "all" || p.category === selectedCategory;
        return matchSearch && matchCat;
      }),
    [pizzas, searchQuery, selectedCategory]
  );
```
(The `.map()` render at lines ~92-98 stays exactly as-is — `onPress={openBuilderAdd}`.)

- [ ] **Step 2: `MobileProductCard` — wrap in `React.memo`**

In `frontend-mobile/src/components/MobileProductCard.tsx`, change the export (line 14) from:
```tsx
export const MobileProductCard = ({ pizza, onPress }: MobileProductCardProps) => {
```
to a memoized component, keeping the SAME named export. Replace the declaration line with:
```tsx
const MobileProductCardComponent = ({ pizza, onPress }: MobileProductCardProps) => {
```
and add, immediately after the component's closing `};` (before the `const styles = StyleSheet.create(`):
```tsx
export const MobileProductCard = React.memo(MobileProductCardComponent);
```
Do not change the component body or any `testID`/`accessibilityLabel`. (`useRTL()` stays inside — a `React.memo` card correctly re-renders on a language/RTL change, which is rare.)

- [ ] **Step 3: Typecheck**

From `frontend-mobile/`: `npx tsc --noEmit`. Expected: no NEW errors in `CatalogScreen.tsx` / `MobileProductCard.tsx`. (If the project has pre-existing tsc errors elsewhere, note them but ensure your two files are clean.)

- [ ] **Step 4: Commit**

```bash
git add frontend-mobile/src/screens/CatalogScreen.tsx frontend-mobile/src/components/MobileProductCard.tsx
git commit -m "perf(mobile): memoize catalog list (React.memo card + useMemo/useCallback)"
```

---

## Task 2: Zustand field selectors (stop app-wide re-renders)

**Files (each has one whole-object `useAppStore()` to convert):**
- `frontend-mobile/src/components/BottomNavBar.tsx:21` — `{ logout, cartItems }`
- `frontend-mobile/src/components/CustomNavbar.tsx:19` — `{ country, language, setLanguage }`
- `frontend-mobile/src/components/LocationHeader.tsx:21` — `{ country, language, setLanguage }`
- `frontend-mobile/src/screens/CatalogScreen.tsx:25` — `{ country, language }`
- `frontend-mobile/src/screens/CheckoutScreen.tsx:83-84` — `{ country, countryInfo, cartItems, clearCart, profile, setProfile, setLastOrder, token, language }`
- `frontend-mobile/src/screens/ProfileScreen.tsx:50` — `{ profile, setProfile }`
- `frontend-mobile/src/screens/OrderSuccessScreen.tsx:23` — `{ lastOrder }`
- `frontend-mobile/src/screens/PizzaBuilderScreen.tsx:66-67` — `{ country, language, addConfiguredItem, updateCartItem }`

**Interfaces:** none change — same local variable names, same values, only the subscription narrows.

- [ ] **Step 1: Convert each whole-object destructure to per-field selectors**

For EACH file above, replace the single `const { ... } = useAppStore();` with one `useAppStore((s) => s.<field>)` per destructured name, preserving the variable names. Examples (apply the same pattern to all 8):

`BottomNavBar.tsx`:
```tsx
  const logout = useAppStore((s) => s.logout);
  const cartItems = useAppStore((s) => s.cartItems);
```

`CatalogScreen.tsx`:
```tsx
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
```

`CheckoutScreen.tsx` (all nine):
```tsx
  const country = useAppStore((s) => s.country);
  const countryInfo = useAppStore((s) => s.countryInfo);
  const cartItems = useAppStore((s) => s.cartItems);
  const clearCart = useAppStore((s) => s.clearCart);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const setLastOrder = useAppStore((s) => s.setLastOrder);
  const token = useAppStore((s) => s.token);
  const language = useAppStore((s) => s.language);
```

`CustomNavbar.tsx` and `LocationHeader.tsx`:
```tsx
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
```

`ProfileScreen.tsx`:
```tsx
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
```

`OrderSuccessScreen.tsx`:
```tsx
  const lastOrder = useAppStore((s) => s.lastOrder);
```

`PizzaBuilderScreen.tsx`:
```tsx
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const addConfiguredItem = useAppStore((s) => s.addConfiguredItem);
  const updateCartItem = useAppStore((s) => s.updateCartItem);
```
Do NOT touch `useAppStore.getState()` calls (those are outside render and unaffected) or the store definition itself. Keep all other lines identical.

- [ ] **Step 2: Typecheck**

From `frontend-mobile/`: `npx tsc --noEmit`. Expected: no NEW errors introduced by these edits (same variable names/types).

- [ ] **Step 3: Commit**

```bash
git add frontend-mobile/src/components/BottomNavBar.tsx frontend-mobile/src/components/CustomNavbar.tsx frontend-mobile/src/components/LocationHeader.tsx frontend-mobile/src/screens/CatalogScreen.tsx frontend-mobile/src/screens/CheckoutScreen.tsx frontend-mobile/src/screens/ProfileScreen.tsx frontend-mobile/src/screens/OrderSuccessScreen.tsx frontend-mobile/src/screens/PizzaBuilderScreen.tsx
git commit -m "perf(mobile): use Zustand field selectors to narrow store subscriptions"
```

## Verification (controller-run)

`npx tsc --noEmit` clean for the touched files, then an on-device smoke on the connected Android (`R5CX71NFF9H`) via Expo Go: login → catalog (search filters, add-to-cart opens the builder) → checkout, confirming the flow works and `testID`s are intact. Behavior-preserving, so the visible app should be identical.

## Self-review notes

- `React.memo` on `MobileProductCard` is only effective because Task 1 also stabilizes `openBuilderAdd` (`useCallback`) and `filteredPizzas` (`useMemo`) — all three are required.
- Field selectors are pure subscription-narrowing: same values, same variable names, so behavior (including cart-clearing side effects in `setCountry`/`logout`) is unchanged.
- No `FlatList` — off-screen `card-pizza-*` rows stay mounted for the selector contract.
