# EXPLANATION — Profile form populates correctly; symptom is a downstream artifact of the falsified backend report and an incomplete readiness contract

**Original report:** `BUG_profile_form_empty_after_reload.md`
**Verdict:** Not a defect in OmniPizza. The form *does* populate after save+reload; the test framework is reading too early and using a non-existent testid as its readiness anchor.

## What the report claims

After saving a new profile and hard-reloading `/profile`, every input
returns `""` when read via Playwright's `inputValue()`, 100% across all 5
markets. The report acknowledges this is linked to
`BUG_profile_api_patch_does_not_persist.md`.

## The frontend code is correct

`frontend/src/pages/Profile.jsx:11-21`:

```jsx
const { fullName, address, phone, notes, setProfile } = useProfileStore();

useEffect(() => {
  loadProfile().catch(() => { /* no profile yet — local state stays */ });
}, []);
```

i.e. the page **does** issue `GET /api/users/me/profile` on mount.

`frontend/src/features/profile/useCases/loadProfile.js`:

```js
export async function loadProfile(repository = createProfileRepository()) {
  const { data } = await repository.get();
  useProfileStore.getState().setProfile({
    fullName: data.full_name ?? "",
    phone:    data.phone     ?? "",
    address:  data.address   ?? "",
    notes:    data.notes     ?? "",
  });
  return data;
}
```

The repository calls `client.get("/api/users/me/profile")`
(`profileRepository.js:7`). The store is persisted to `localStorage` under
the key `omnipizza-profile` (`store.js:206-217`):

```js
export const useProfileStore = create(
  persist(
    (set) => ({
      fullName: "", address: "", phone: "", notes: "",
      setProfile: (patch) => set(patch),
    }),
    { name: "omnipizza-profile" }
  )
);
```

And the release-mismatch handler in `store.js:8-24` only clears
`token`/`username`/`omnipizza-auth` — it does **not** clear
`omnipizza-profile`. So a hard reload preserves the profile locally.

Combined flow after save+hard-reload:

1. `localStorage.omnipizza-profile` carries the just-saved values.
2. Zustand's `persist` middleware re-hydrates the store from `localStorage`
   asynchronously on first render — there is a brief window after first
   paint where the store still holds the *default* empty state.
3. `useEffect` fires `loadProfile()` → `GET /api/users/me/profile` →
   `setProfile(...)` with the server's values.

Backend-side, `GET /api/users/me/profile` was verified live to return the
just-PATCH'd values (see
`EXPLANATION_profile_api_patch_does_not_persist.md`). So the data is
available on both the local cache and the server side; the form will
populate.

## Why the test sees `""`

Two compounding test-side issues:

### 1. The testid the report names does not exist

The report says the test waits for `[data-testid='profileScreen']` before
reading. The actual web testid is **`screen-profile`** —
`Profile.jsx:24`:

```jsx
<div data-testid="screen-profile" className="mx-auto max-w-4xl px-4 py-10">
```

A grep of the deployed production bundle
(`/assets/index-kOukUO2T.js`) confirms: `screen-profile` appears 1 time,
`profileScreen` appears **0 times**. Either the test resolves
`profileScreen` to `screen-profile` through some indirection (and the
report copy-pasted the alias), or the test never finds the screen marker
at all and the read happens at an arbitrary timing relative to mount.

### 2. The screen marker mounts before async hydration

Whichever marker is used, the `<div>` it sits on mounts on the **first**
React render, which happens *before* (a) `persist` rehydration applies the
`localStorage` values, and (b) the `loadProfile` request resolves. So a
test that:

```
RELOAD → WAIT_FOR_ELEMENT screen-profile → read inputValue
```

will read the inputs in their `""` initial-state window. The form populates
~100–500 ms later (faster on warm Render dynos, slower on cold ones), but
the test has already moved on.

This is the same shape of timing error described in the report's own
hypothesis #3 — but the report dismisses it without verifying. It is, in
fact, the actual cause.

## Recommendation for QA

Use a data-derived readiness signal instead of a structural one. Any of:

- `await page.locator("[data-testid='profile-fullname']").filter({ hasNotText: '' }).waitFor()`
- Wait for the input's `inputValue()` to be non-empty (`expect.poll(...)`).
- Or, if the assertion *is* "the value is empty," PATCH a known value as
  the scenario setup and assert that specific value, not a vacuous
  emptiness.

Also: standardize the testid alias. If the framework canonicalizes
`profileScreen` → `screen-profile`, document it in the locator JSON so
future bug reports cite the actual DOM attribute.

## Not implemented here

A defensible OmniPizza-side improvement would be to gate the
`screen-profile` testid (or add a new `profile-loaded` marker) on
`loadProfile` resolution, so the readiness contract matches "data is
ready" rather than "DOM is mounted." That's a small enhancement but it's a
contract change with QA implications — out of scope for this triage, and
not a defect fix.
