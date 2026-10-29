# Epic PRF — Profile

The editable personal profile (full name, phone, delivery address, birthday, delivery notes) that the backend keeps per login session, the web and mobile screens that edit it, its pre-fill into checkout, Delete Account, and the QA-only atomic seed and reset endpoints. Profile state follows the login: a new login always starts from an empty profile.

Retroactive stories for implemented behaviour. Status **Done** = verified in code (or in a fix commit); **Found** = a gap that exists today and is not fixed. Fix commits 088c650 and 60774e3 are merged into this branch (merge of `US-and-Improvements`); their evidence cites the sha and the current path and line.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-PRF-001-API | Read and update my editable profile | API | Done |
| US-PRF-001-WEB | Edit my personal details and save them (web) | WEB | Done |
| US-PRF-001-MOB | Edit my personal details and save them (mobile) | MOB | Done |
| US-PRF-002-API | Birthday is stored as free text | API | Found |
| US-PRF-002-WEB | Set my birthday with a date picker | WEB | Done |
| US-PRF-002-MOB | Set my birthday with three dropdowns | MOB | Done |
| US-PRF-003-WEB | Cancel leaves the profile without saving | WEB | Found |
| US-PRF-003-MOB | Cancel returns to the previous screen | MOB | Done |
| US-PRF-004-WEB | Checkout pre-fills my details from my profile | WEB | Done |
| US-PRF-004-MOB | Checkout pre-fills my details from my profile | MOB | Done |
| US-PRF-005-WEB | Delete my account from the profile page | WEB | Done |
| US-PRF-005-MOB | Delete my account from the profile screen | MOB | Done |
| US-PRF-005-UX | Delete confirmation dialog manages focus | UX | Done |
| US-PRF-006-API | Atomic profile seed and reset | API | Done |
| US-PRF-007-WEB | Profile header shows fixed sample data | WEB | Found |
| US-PRF-007-MOB | Profile header shows fixed sample data | MOB | Found |
| US-PRF-008-WEB | Logout clears my cached profile | WEB | Done |
| US-PRF-008-MOB | Logout does not clear my in-memory profile | MOB | Found |

---

### US-PRF-001-API · Read and update my editable profile
**As a** customer **I want** my saved details kept on the server **so that** they stay put while I move between screens in the same login.

- Layer: API · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-05-22 · Commit: ae064c6

**Acceptance criteria**
1. Given a login, when `GET /api/users/me/profile` is called, then the response carries `username`, `premium` (true by default), `full_name`, `phone`, `address`, `notes` and `birthday` (`backend/routers/auth.py:103-112`; `backend/database.py:93-106`; verified defaults).
2. Given a `PATCH` with some fields, when it is applied, then only the sent fields change and a `null` value is ignored rather than clearing the field (`backend/routers/auth.py:115-131`; `backend/database.py:111-117`; verified: a `null` `full_name` left `Ana` in place).
3. Given a `PATCH` with `premium`, when it is applied, then the request is accepted (200) and `premium` stays `true`, because `UserProfileUpdate` has no `premium` field (`backend/models.py:34-40`; verified).
4. Given a non-string value such as `full_name: 12345`, when it is patched, then the response is 422 (verified).

**Evidence**: `backend/routers/auth.py:103-131`, `backend/models.py:23-40`, `backend/database.py:93-117`
**Notes**: Drift: the brief lists `premium` among the PATCH fields, but the code does not accept it on PATCH. `premium` can be seeded through `POST /api/profile` (`backend/models.py:200`; US-PRF-006-API). Profile state is keyed by the login's `sid` (US-AUTH-004-API).

---

### US-PRF-001-WEB · Edit my personal details and save them (web)
**As a** customer **I want** to edit my name, phone, address and delivery notes and save them **so that** checkout can reuse them.

- Layer: WEB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-05-22 · Commit: ae064c6

**Acceptance criteria**
1. Given the Profile page opens, when it mounts, then the profile is loaded from `GET /api/users/me/profile` and the fields are filled (`frontend/src/pages/Profile.jsx:19`; `frontend/src/features/profile/useCases/loadProfile.js:4-13`).
2. Given a field is edited, when the user types, then the profile store updates at once (`Profile.jsx:112,124,138,152,166`).
3. Given Save Changes is pressed, when the request succeeds, then one `PATCH` sends `full_name`, `phone`, `address`, `notes` and `birthday`, the store is refreshed and an alert shows the saved message (`Profile.jsx:22-26`; `frontend/src/features/profile/useCases/saveProfile.js:4-25`).
4. Given the save fails, when the error arrives, then an alert shows the response's `detail` or "Failed to save profile" (`Profile.jsx:26-28`).

**Evidence**: `frontend/src/pages/Profile.jsx:19-28,107-166,181-191`, `frontend/src/features/profile/useCases/loadProfile.js:4-13`, `frontend/src/features/profile/useCases/saveProfile.js:4-25`, `frontend/src/features/profile/repositories/profileRepository.js:3-8`
**Notes**: Drift: the API's error body uses `error`, not `detail` (`backend/main.py:75-84`), so the specific server message is never shown; the fallback text always appears for HTTP errors. Save feedback is `window.alert` (`saveProfile.js` default `notify`).

---

### US-PRF-001-MOB · Edit my personal details and save them (mobile)
**As a** customer **I want** to edit and save my details on my phone **so that** checkout can reuse them.

- Layer: MOB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-05-22 · Commit: dde43ba

**Acceptance criteria**
1. Given the Profile screen opens, when it mounts, then the profile is loaded from the server (`frontend-mobile/src/screens/ProfileScreen.tsx:65`; `frontend-mobile/src/features/profile/useCases/loadProfile.ts`).
2. Given a field is typed in, when the text changes, then the store updates (`ProfileScreen.tsx:190,202,214,232` for `input-profile-fullname`, `input-profile-phone`, `input-profile-address` and `input-profile-notes`).
3. Given Save Changes is pressed, when the request succeeds, then one `PATCH` sends the five fields, the store is refreshed and a native alert shows the saved message (`ProfileScreen.tsx:91-103`; `frontend-mobile/src/features/profile/useCases/saveProfile.ts`).
4. Given the save fails, when the error arrives, then an alert shows `detail` or "Failed to save profile" (`ProfileScreen.tsx:99`).

**Evidence**: `frontend-mobile/src/screens/ProfileScreen.tsx:64-103,185-237,273-294`, `frontend-mobile/src/features/profile/useCases/saveProfile.ts`, `frontend-mobile/src/features/profile/repositories/profileRepository.ts`
**Notes**: Same `detail` versus `error` drift as US-PRF-001-WEB.

---

### US-PRF-002-API · Birthday is stored as free text
**As a** QA engineer **I want** the server to reject a birthday that is not a real calendar date **so that** bad data is caught at the API.

- Layer: API · Epic: PRF · Persona: QA · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: `birthday` is a valid `YYYY-MM-DD` date. Current: any string is stored and returned; `2026-02-31` was accepted and returned unchanged (verified).
2. Expected: a malformed birthday returns 422. Current: `UserProfileUpdate.birthday` is an unvalidated `Optional[str]` (`backend/models.py:40`), so no 422 is raised.

**Evidence**: `backend/models.py:34-40,189-200`, `backend/routers/auth.py:115-131`
**Notes**: The web date picker (US-PRF-002-WEB) cannot produce an impossible date, but the mobile dropdowns can (US-PRF-002-MOB), and the API accepts both.

---

### US-PRF-002-WEB · Set my birthday with a date picker
**As a** customer **I want** to pick my birthday from a calendar **so that** it is saved in a standard format.

- Layer: WEB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-09 · Commit: 61a4751

**Acceptance criteria**
1. Given the Profile page, when it renders, then the birthday is a native `<input type="date">` with testid `profile-birthday` (`frontend/src/pages/Profile.jsx:143-153`).
2. Given a date is chosen, when it changes, then the store's `birthday` is set to the value the browser reports, and it is saved with the rest (`Profile.jsx:152`; `saveProfile.js:9-16`).

**Evidence**: `frontend/src/pages/Profile.jsx:143-153`, `frontend/src/features/profile/useCases/saveProfile.js:9-16`
**Notes**: The browser control does not permit impossible dates, so this path cannot send `2026-02-31`.

---

### US-PRF-002-MOB · Set my birthday with three dropdowns
**As a** customer **I want** to pick my birthday with three dropdowns **so that** I can enter it without a native date control.

- Layer: MOB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-09 · Commit: 61a4751

**Acceptance criteria**
1. Given the Profile screen, when it renders, then the birthday shows three dropdowns: day 1–31, month 1–12 and year 2015 down to 1950 (`frontend-mobile/src/screens/ProfileScreen.tsx:28-42,243-268`; testIDs `input-birthday-day`, `input-birthday-month`, `input-birthday-year`).
2. Given all three parts are chosen, when the selection changes, then the store's birthday is set to `YYYY-MM-DD`; otherwise it is empty (`ProfileScreen.tsx:81-89`).
3. Given a saved birthday, when the screen loads, then the dropdowns are seeded from it (`ProfileScreen.tsx:70-79`).

**Evidence**: `frontend-mobile/src/screens/ProfileScreen.tsx:28-89,243-268`
**Notes**: The day list is 1–31 for every month, so 31 February can be chosen and saved (`ProfileScreen.tsx:28-31,88`; US-PRF-002-API). A saved year outside 1950–2015 is seeded into the store, but no dropdown option matches it: Unverified (not exercised on a device).

---

### US-PRF-003-WEB · Cancel leaves the profile without saving
**As a** customer **I want** Cancel to discard my unsaved edits and leave the page **so that** I can back out of a change.

- Layer: WEB · Epic: PRF · Persona: Customer · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: Cancel discards unsaved edits and returns to the previous screen. Current: the button (`profile-cancel-btn`) has no click handler (`frontend/src/pages/Profile.jsx:178-180`).
2. Expected: a click has a visible result. Current: clicking changes nothing.

**Evidence**: `frontend/src/pages/Profile.jsx:178-180`
**Notes**: Mobile Cancel does navigate back (US-PRF-003-MOB). Web edits stay in the local store until the page mounts again.

---

### US-PRF-003-MOB · Cancel returns to the previous screen
**As a** customer **I want** Cancel to take me back **so that** I can leave the profile without saving.

- Layer: MOB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: ebeacd3 (Profile screen origin)

**Acceptance criteria**
1. Given Cancel is pressed, when it runs, then `navigation.goBack()` is called (`frontend-mobile/src/screens/ProfileScreen.tsx:278-279`, testID `btn-cancel-profile`).
2. Given unsaved edits, when the screen is opened again, then `loadProfile` replaces them with the server values (`ProfileScreen.tsx:65`).

**Evidence**: `frontend-mobile/src/screens/ProfileScreen.tsx:65,278-279`
**Notes**: Cancel does not reset the store itself; the reload on mount is what discards the edits.

---

### US-PRF-004-WEB · Checkout pre-fills my details from my profile
**As a** customer **I want** checkout to fill my name, address and phone from my saved profile **so that** I do not retype them.

- Layer: WEB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: ebeacd3

**Acceptance criteria**
1. Given checkout mounts, when the form initialises, then name, address and phone are taken from the profile store (`frontend/src/pages/Checkout.jsx:190-196`).
2. Given checkout's pre-fill, when it runs, then notes and birthday are not used; checkout pre-fills three fields only (`frontend/src/pages/Checkout.jsx:190-196`).

**Evidence**: `frontend/src/pages/Checkout.jsx:190-196`, `frontend/src/pages/Profile.jsx:19`, `frontend/src/store.js:238-251`
**Notes**: The store is filled only by the Profile page's `loadProfile` (`frontend/src/pages/Profile.jsx:19`) and by the local cache `omnipizza-profile` (`frontend/src/store.js:249`). So a profile seeded through the API and then opened directly in checkout does not pre-fill until the Profile page has loaded it, and logout clears the cache (US-PRF-008-WEB). Mobile's in-memory profile survives logout (US-PRF-008-MOB).

---

### US-PRF-004-MOB · Checkout pre-fills my details from my profile
**As a** customer **I want** checkout on my phone to fill my name, address and phone from my profile **so that** I do not retype them.

- Layer: MOB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: ebeacd3

**Acceptance criteria**
1. Given checkout mounts, when the form initialises, then name, address and phone are read from the in-memory profile (`frontend-mobile/src/screens/CheckoutScreen.tsx:71,140-142`).
2. Given checkout, when it runs, then it does not call `loadProfile`; only the Profile screen does (`frontend-mobile/src/screens/ProfileScreen.tsx:65`).

**Evidence**: `frontend-mobile/src/screens/CheckoutScreen.tsx:71,140-142`, `frontend-mobile/src/screens/ProfileScreen.tsx:65`, `frontend-mobile/src/store/useAppStore.ts:96,120-130`
**Notes**: The in-memory profile is refreshed only when the Profile screen mounts, and it survives logout (US-PRF-008-MOB). Code read; the pre-fill was not run on a device.

---

### US-PRF-005-WEB · Delete my account from the profile page
**As a** QA engineer **I want** Delete Account to erase this login's profile, cart and market and sign me out **so that** the sandbox returns to a clean state after a scenario.

- Layer: WEB · Epic: PRF · Persona: QA · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: 088c650 (merged into this branch)

**Acceptance criteria**
1. Given Delete Account is pressed, when it runs, then a confirmation dialog opens (`frontend/src/pages/Profile.jsx:172,206-215`; testid `delete-account-btn`).
2. Given the dialog is confirmed, when it runs, then `POST /api/session/reset` is called (`frontend/src/features/profile/repositories/profileRepository.js:4,10`), then the user is logged out (`frontend/src/features/profile/useCases/deleteAccount.js`).
3. Given the reset call fails, when the error arrives, then the user stays signed in, the dialog stays open and an alert shows the server's `error` or a generic message (`frontend/src/pages/Profile.jsx:34-45`).

**Evidence**: `frontend/src/pages/Profile.jsx:34-45,172,206-215`, `frontend/src/features/profile/repositories/profileRepository.js:4,10`, `frontend/src/features/profile/useCases/deleteAccount.js`
**Notes**: The fixed test user is not removed; the dialog says so. The reset also returns the market to MX (US-PRF-006-API). Before 088c650 the button had no `onClick` (`9ca3767:frontend/src/pages/Profile.jsx:156`).

---

### US-PRF-005-MOB · Delete my account from the profile screen
**As a** QA engineer **I want** Delete Account on my phone to erase this login's data and sign me out **so that** the device returns to a clean state.

- Layer: MOB · Epic: PRF · Persona: QA · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: 088c650 (merged into this branch)

**Acceptance criteria**
1. Given Delete Account is pressed, when it runs, then a `ConfirmDialog` opens (`frontend-mobile/src/screens/ProfileScreen.tsx:300-319`; testID `btn-delete-account`).
2. Given the dialog is confirmed, when it runs, then `POST /api/session/reset` is called (`frontend-mobile/src/features/profile/repositories/profileRepository.ts:4,29`), then the store logs out (`frontend-mobile/src/features/profile/useCases/deleteAccount.ts:9-18`), and navigation resets to Login (`frontend-mobile/src/screens/ProfileScreen.tsx:110-111`).
3. Given the reset call fails, when the error arrives, then the user stays signed in and an alert shows the server's `error` or a generic message (`frontend-mobile/src/screens/ProfileScreen.tsx:105-116`).

**Evidence**: `frontend-mobile/src/screens/ProfileScreen.tsx:105-116,300-319`, `frontend-mobile/src/features/profile/repositories/profileRepository.ts:4,29`
**Notes**: Before 088c650 the delete button had no `onPress` (`9ca3767:frontend-mobile/src/screens/ProfileScreen.tsx:281-285`).

---

### US-PRF-005-UX · Delete confirmation dialog manages focus
**As a** customer using a keyboard or assistive technology **I want** the confirmation to take focus and close with Escape **so that** a destructive action is not triggered by accident.

- Layer: UX · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: 088c650 (merged into this branch)

**Acceptance criteria**
1. Given the web dialog opens, when it shows, then focus moves to Cancel, Escape cancels, and focus returns to the opener on close (`frontend/src/components/ConfirmDialog.jsx:28-36`).
2. Given the mobile dialog opens, when it shows, then it is an RN `Modal` with `accessibilityViewIsModal` (`frontend-mobile/src/components/ConfirmDialog.tsx:31-45`).
3. Given the dialog, when it renders, then its title, body, confirm and failure strings come from the locale files, four keys in each of six locales per platform (stat of `088c650`).

**Evidence**: `frontend/src/components/ConfirmDialog.jsx:5,28-36`, `frontend-mobile/src/components/ConfirmDialog.tsx:31-45`
**Notes**: The web comments say focus moves and returns; no focus trap is claimed here.

---

### US-PRF-006-API · Atomic profile seed and reset
**As a** QA engineer **I want** to pin the profile to a known baseline and clear it **so that** visual and API tests are reproducible.

- Layer: API · Epic: PRF · Persona: QA · Market: all
- Status: Done
- Done on: 2026-05-30 · Commit: 124b268

**Acceptance criteria**
1. Given `POST /api/profile` with some fields, when it runs, then the caller's profile is replaced by the defaults with those fields overlaid; unsent fields revert to their defaults (`backend/test_api.py:168-190`; `backend/database.py:127-137`; verified: `full_name` set, `premium` false, other fields empty).
2. Given `POST /api/session/reset`, when it runs, then the caller's market becomes MX, the cart is emptied and the profile returns to defaults (`backend/test_api.py:193-215`; verified).
3. Neither endpoint reads `X-Country-Code` (`backend/test_api.py:168-215`; the handlers depend only on `get_current_user`).

**Evidence**: `backend/test_api.py:168-215`, `backend/database.py:119-137,208-209`, `backend/models.py:189-200`
**Notes**: The reset sets the market to MX, the default for a fresh session (`backend/database.py:143`), not US. The login form's US default applies only at the next sign-in (`frontend/src/pages/Login.jsx:80`).

---

### US-PRF-007-WEB · Profile header shows fixed sample data
**As a** customer **I want** the profile header to show my name and membership status **so that** it reflects my account.

- Layer: WEB · Epic: PRF · Persona: Customer · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: the header shows my own name and membership. Current: the avatar is a fixed DiceBear image seeded "Alexander" (`frontend/src/pages/Profile.jsx:63-64`); the name falls back to the literal "Alexander Sterling" (`Profile.jsx:77`); the badge always says Premium (`Profile.jsx:79-81`); the joined line is fixed to "March 2023" (`Profile.jsx:86`).
2. Expected: the badge reflects the profile's `premium` flag. Current: only five fields are mapped from the API, and `premium` is not one of them (`frontend/src/features/profile/useCases/loadProfile.js:6-12`).

**Evidence**: `frontend/src/pages/Profile.jsx:63-86`, `frontend/src/features/profile/useCases/loadProfile.js:6-12`
**Notes**: The avatar is an external image (`api.dicebear.com`) and needs network access.

---

### US-PRF-007-MOB · Profile header shows fixed sample data
**As a** customer **I want** the profile header on my phone to show my name and membership **so that** it reflects my account.

- Layer: MOB · Epic: PRF · Persona: Customer · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: the header shows my name and membership. Current: the avatar is a fixed DiceBear image seeded "Alexander" (`frontend-mobile/src/screens/ProfileScreen.tsx:136-144`); the name falls back to "Alexander Sterling" (`ProfileScreen.tsx:160-161`); the badge always says PREMIUM (`ProfileScreen.tsx:163-166`); the joined line is fixed (`ProfileScreen.tsx:169-170`).
2. Expected: the badge reflects `premium`. Current: `loadProfile.ts` maps five fields and drops `premium`.

**Evidence**: `frontend-mobile/src/screens/ProfileScreen.tsx:136-170`, `frontend-mobile/src/features/profile/useCases/loadProfile.ts`
**Notes**: Same gap as US-PRF-007-WEB.

---

### US-PRF-008-WEB · Logout clears my cached profile
**As a** customer **I want** the previous user's profile cleared when I sign out **so that** it cannot show for the next person on this browser.

- Layer: WEB · Epic: PRF · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-09 · Commit: d3b5e51 (introduced the logout profile reset)

**Acceptance criteria**
1. Given logout, when it runs, then `omnipizza-profile` is removed from localStorage and the profile store is set to empty values (`frontend/src/store.js:49-53`).
2. Given the next login, when the Profile page has not been opened, then the local profile is empty until `loadProfile` runs (`frontend/src/pages/Profile.jsx:19`).

**Evidence**: `frontend/src/store.js:43-53,238-251`, `frontend/src/pages/Profile.jsx:19`
**Notes**: The cleared profile is the one Checkout pre-fills from (US-PRF-004-WEB).

---

### US-PRF-008-MOB · Logout does not clear my in-memory profile
**As a** customer **I want** the previous user's profile cleared on sign-out **so that** it cannot show in checkout for the next user on the same phone.

- Layer: MOB · Epic: PRF · Persona: Customer · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: logout clears the profile held for the previous user. Current: `logout` sets token, cart items, last order, country info and language, and leaves `profile` untouched (`frontend-mobile/src/store/useAppStore.ts:120-130`; default profile at `useAppStore.ts:96`).
2. Consequence: after logout and a login as another user, checkout can pre-fill name, address and phone from the previous user's in-memory profile until the Profile screen is opened (`frontend-mobile/src/screens/CheckoutScreen.tsx:140-142`).

**Evidence**: `frontend-mobile/src/store/useAppStore.ts:96,120-130`, `frontend-mobile/src/screens/CheckoutScreen.tsx:140-142`
**Notes**: Code read only; not reproduced on a device or in a test run.
