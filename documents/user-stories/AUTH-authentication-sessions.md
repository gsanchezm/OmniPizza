# Epic AUTH — Authentication & Sessions

Signing in with the seven deterministic test users (shared password `pizza123`), how a login session is scoped by the JWT `sid` claim, what each client shows on a failed login, and how logout and expired tokens are handled on the API, web and mobile. The market is chosen on the login screen and is not switchable afterwards.

Retroactive stories for implemented behaviour. Status **Done** = verified in code (or in a fix commit); **Found** = a gap that exists today and is not fixed. Fix commits 60774e3, c55c5c5 and 088c650 are merged into this branch (merge of `US-and-Improvements`); their evidence cites the sha and the current path and line.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-AUTH-001-API | Log in with a deterministic test user | API | Done |
| US-AUTH-001-WEB | Sign in on the web login screen | WEB | Done |
| US-AUTH-001-MOB | Sign in on the mobile login screen | MOB | Done |
| US-AUTH-002-API | Get a distinct error for a failed login | API | Done |
| US-AUTH-002-WEB | See why sign-in failed (web) | WEB | Done |
| US-AUTH-002-MOB | See why sign-in failed (mobile) | MOB | Done |
| US-AUTH-002-UX | Login error is announced and styled | UX | Done |
| US-AUTH-003-WEB | Choose the market on the web login screen | WEB | Done |
| US-AUTH-003-MOB | Choose the market on the mobile login screen | MOB | Done |
| US-AUTH-003-UX | Market buttons expose name and selected state | UX | Done |
| US-AUTH-004-API | Keep each login's market, cart and profile separate | API | Done |
| US-AUTH-005-WEB | Fill a test user with one tap (web) | WEB | Done |
| US-AUTH-005-MOB | Fill a test user with one tap (mobile) | MOB | Done |
| US-AUTH-006-MOB | Mobile user list is static and login waits 500 ms | MOB | Found |
| US-AUTH-007-API | Read the test-user catalogue and my identity | API | Done |
| US-AUTH-008-API | Token claims and 30-minute expiry | API | Done |
| US-AUTH-009-API | Logout does not revoke the token server-side | API | Found |
| US-AUTH-009-WEB | Sign out on the web app | WEB | Done |
| US-AUTH-009-MOB | Sign out on the mobile app | MOB | Done |
| US-AUTH-010-API | Protected endpoints reject missing or bad tokens with 401 | API | Done |
| US-AUTH-010-WEB | Return to Login when a session token is rejected (web) | WEB | Done |
| US-AUTH-010-MOB | Return to Login when a session token is rejected (mobile) | MOB | Done |
| US-AUTH-011-WEB | Stay signed in across reloads; reset on a new release | WEB | Done |
| US-AUTH-012-UX | English and LTR on login; logout returns to LTR | UX | Done |

---

### US-AUTH-001-API · Log in with a deterministic test user
**As a** QA engineer **I want** to exchange a test username and password for a bearer token **so that** every automated scenario starts from a known identity.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given `standard_user` / `pizza123`, when `POST /api/auth/login` is called, then the response is 200 with exactly the keys `access_token`, `token_type` (`bearer`), `username` and `behavior` (`standard`). Verified in-process on 2026-10-28.
2. Given a username shorter than 3 or longer than 50 characters, or a password shorter than 6 or longer than 100, when login is called, then the response is 422 with FastAPI's default body `{"detail": [...]}` (verified for a 2-character username and a 5-character password).
3. Given any of the seven test users, when logging in with `pizza123`, then login succeeds, except `locked_out_user` (see US-PER-002-API).

**Evidence**: `backend/routers/auth.py:20-74`, `backend/models.py:7-15`, `backend/auth.py:18-36`, `backend/constants.py:21-64`
**Notes**: The 422 body is FastAPI's default shape, not the `{error, status_code, timestamp}` shape used for other errors (`backend/main.py:75-84`). The login endpoint has no rate limiting; no backend code emits 429.

---

### US-AUTH-001-WEB · Sign in on the web login screen
**As a** customer **I want** to sign in with a username, password and market **so that** I reach the catalog for that market.

- Layer: WEB · Epic: AUTH · Persona: Customer · Market: all (US preselected)
- Status: Done
- Done on: 2026-02-07 · Commit: b1ea1a2

**Acceptance criteria**
1. Given the Login page is open, when it renders, then the username and password fields are pre-filled with `standard_user` / `pizza123` and the US market is selected (`frontend/src/pages/Login.jsx:30-31,43-44`).
2. Given both fields are non-blank, when Sign In is submitted, then the page calls login, stores the token, sets the selected market and navigates to `/catalog` (`Login.jsx:65-83`; `frontend/src/store.js:37-41`).
3. Given a blank username or password, when Sign In is submitted, then "Invalid credentials" is shown and no request is sent (`Login.jsx:68-71`).

**Evidence**: `frontend/src/pages/Login.jsx:30-31,43-44,65-83,230-238`, `frontend/src/store.js:37-41`
**Notes**: The button shows "Signing In..." while the request is in flight (`Login.jsx:230-238`). The pre-fill is a harness convenience.

---

### US-AUTH-001-MOB · Sign in on the mobile login screen
**As a** customer **I want** to sign in on my phone with a market **so that** the app opens on that market's catalog.

- Layer: MOB · Epic: AUTH · Persona: Customer · Market: all (US preselected)
- Status: Done
- Done on: 2026-02-07 · Commit: cac3d07

**Acceptance criteria**
1. Given the Login screen opens, when it renders, then username `standard_user`, password `pizza123` and market US are preset (`frontend-mobile/src/screens/LoginScreen.tsx:47-51`).
2. Given valid input, when Sign In is pressed, then the app waits 500 ms, calls login, applies the selected market through `selectMarket` and stores the token; the screen then replaces itself with Catalog (`LoginScreen.tsx:76-86,57-66`).
3. Given a blank field, when Sign In is pressed, then "Invalid credentials" is shown and no request is sent (`LoginScreen.tsx:68-72`).

**Evidence**: `frontend-mobile/src/screens/LoginScreen.tsx:47-86`, `frontend-mobile/src/features/country/useCases/selectMarket.ts`
**Notes**: The 500 ms wait is covered as a Found gap in US-AUTH-006-MOB.

---

### US-AUTH-002-API · Get a distinct error for a failed login
**As a** QA engineer **I want** wrong, locked-out and malformed logins to fail with distinct codes and messages **so that** tests can assert each failure.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given a wrong password or an unknown username, when login is called, then the response is 401 with `error` = `Invalid username or password` (verified; `backend/routers/auth.py:43-50`).
2. Given `locked_out_user` with any password, when login is called, then the response is 403 with `error` = `Sorry, this user has been locked out.` (verified with both the right and a wrong password; the lock is checked before the password, `backend/auth.py:25-34`).
3. Given any HTTPException, the body is `{error, status_code, timestamp}` (`backend/main.py:75-84`). The `WWW-Authenticate: Bearer` header that `auth.py` sets is not received by the client (verified: header absent).

**Evidence**: `backend/routers/auth.py:43-50`, `backend/auth.py:25-34,58-62`, `backend/main.py:75-84`
**Notes**: Drift: the exception handler at `main.py:75-84` does not forward `exc.headers`, so the `WWW-Authenticate` header is dropped even though the code sets it.

---

### US-AUTH-002-WEB · See why sign-in failed (web)
**As a** customer **I want** a clear message when my sign-in fails **so that** I know whether to retry or stop.

- Layer: WEB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-12 · Commit: 27c87b5

**Acceptance criteria**
1. Given a 401 on login, when the request fails, then the page shows "Invalid credentials" (`frontend/src/pages/Login.jsx:95-96`).
2. Given a 403 with a server message, when the request fails, then the page shows that message verbatim, for example "Sorry, this user has been locked out." (`Login.jsx:88,91-94`).
3. Given a failed attempt, when the error is shown, then the user stays on `/` and the typed values remain (`frontend/src/services/httpClient.js:46-47` skips the logout redirect because there is no session token).

**Evidence**: `frontend/src/pages/Login.jsx:84-100`, `frontend/src/services/httpClient.js:46-56`
**Notes**: Found within this story: the "Too many users" branch (`Login.jsx:89-90`, status 429 or `users_limit`) cannot be reached, because no backend code emits 429 or `users_limit`. Every 422 (for example a 2-character username) also lands on "Invalid credentials".

---

### US-AUTH-002-MOB · See why sign-in failed (mobile)
**As a** customer **I want** a clear message when my sign-in fails **so that** I know what happened on my phone.

- Layer: MOB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-05-15 · Commit: 227c716

**Acceptance criteria**
1. Given a 401 on login, when the request fails, then "Invalid credentials" is shown in the error text (`frontend-mobile/src/screens/LoginScreen.tsx:98-99,198`).
2. Given a 403 with a server message, when the request fails, then that message is shown (`LoginScreen.tsx:94-97`).
3. Given a new attempt, when Sign In is pressed, then the previous error is cleared first (`LoginScreen.tsx:74`).

**Evidence**: `frontend-mobile/src/screens/LoginScreen.tsx:68-100,198`
**Notes**: Same unreachable "Too many users" branch as US-AUTH-002-WEB (`LoginScreen.tsx:92-93`). Commit 227c716 is the first commit that contains that string in `LoginScreen.tsx`.

---

### US-AUTH-002-UX · Login error is announced and styled
**As a** customer using assistive technology **I want** a failed sign-in to be announced **so that** I notice it without searching the screen.

- Layer: UX · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-12 · Commit: 27c87b5

**Acceptance criteria**
1. Given a login error on web, when it appears, then it sits in a red bordered box with `role="alert"` and `aria-live="assertive"` (`frontend/src/pages/Login.jsx:224-228`).
2. Given a login error on mobile, when it appears, then it is text with `accessibilityLiveRegion="polite"` and a readable testID `text-login-error` (`frontend-mobile/src/screens/LoginScreen.tsx:198`).

**Evidence**: `frontend/src/pages/Login.jsx:224-228`, `frontend-mobile/src/screens/LoginScreen.tsx:198`
**Notes**: Announcement politeness differs (assertive on web, polite on mobile). The reason is not documented; the mobile line's origin is not pinpointed beyond the mobile login errors.

---

### US-AUTH-003-WEB · Choose the market on the web login screen
**As a** customer **I want** to pick my market before signing in **so that** prices, currency and language match where I am.

- Layer: WEB · Epic: AUTH · Persona: Customer · Market: US, MX, CH, JP, SA
- Status: Done
- Done on: 2026-02-15 · Commit: a39eed8

**Acceptance criteria**
1. Given the Login page, when it renders, then five market buttons (US, MX, CH, JP, SA) sit in a group labelled "Select market", each with testid `market-<code>` (`frontend/src/pages/Login.jsx:196-222`).
2. Given a market is picked and sign-in succeeds, when the login completes, then that market is set for the session (`Login.jsx:80`, `store.js:118-139`). The default is US (`Login.jsx:43-44`).
3. Given the market changes, when `setCountryCode` runs, then the cart is cleared (`frontend/src/store.js:120`). `setCountryCode` is called only from the Login page, so there is no in-app switcher (grep of `frontend/src`).

**Evidence**: `frontend/src/pages/Login.jsx:43-44,80,196-222`, `frontend/src/store.js:118-139`
**Notes**: The fallback before login is MX (`frontend/src/store.js:104`; `frontend/src/services/httpClient.js:27`). Only the login form defaults to US.

---

### US-AUTH-003-MOB · Choose the market on the mobile login screen
**As a** customer **I want** to pick my market on my phone before signing in **so that** the app opens on the right market.

- Layer: MOB · Epic: AUTH · Persona: Customer · Market: US, MX, CH, JP, SA
- Status: Done
- Done on: 2026-02-15 · Commit: a39eed8

**Acceptance criteria**
1. Given the Login screen, when it renders, then five market buttons (testIDs `btn-market-<code>`) sit in `view-market-selection`, and US is selected by default (`frontend-mobile/src/screens/LoginScreen.tsx:51,174-183`).
2. Given sign-in succeeds, when the login completes, then `selectMarket` calls `setCountry`, which sets the market, resets the language to the market default and clears the cart (`LoginScreen.tsx:82`; `frontend-mobile/src/store/useAppStore.ts:101-106`).
3. Given a deep link with `market=US|MX|CH|JP|SA`, when it opens, then the market is set without the login screen (`frontend-mobile/src/hooks/useDeepLinkParams.ts:94-100`).

**Evidence**: `frontend-mobile/src/screens/LoginScreen.tsx:51,82,174-183`, `frontend-mobile/src/store/useAppStore.ts:101-106`, `frontend-mobile/src/hooks/useDeepLinkParams.ts:94-100`
**Notes**: There is no in-app market switcher on mobile either; the market is picked at login or by a deep link.

---

### US-AUTH-003-UX · Market buttons expose name and selected state
**As a** customer using assistive technology **I want** each market button to announce its name and whether it is selected **so that** I know my current choice.

- Layer: UX · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-13 · Commit: cf8d2c9

**Acceptance criteria**
1. Given the web market buttons, when they render, then the group has `role="group"` and `aria-label="Select market"`, each button has `aria-pressed` set to its selection and `aria-label="Select <code>"` (`frontend/src/pages/Login.jsx:196-217`).
2. Given the mobile market buttons, when they render, then each has `accessibilityRole="radio"`, `accessibilityState={{ selected }}` and a readable label (`frontend-mobile/src/screens/LoginScreen.tsx:178-183`).

**Evidence**: `frontend/src/pages/Login.jsx:196-217`, `frontend-mobile/src/screens/LoginScreen.tsx:178-183`
**Notes**: Commit cf8d2c9 is the WCAG 4.1.2 fix; the first commit that added `aria-pressed` was not pinpointed separately.

---

### US-AUTH-004-API · Keep each login's market, cart and profile separate
**As a** QA engineer **I want** two logins of the same test user to keep separate market, cart and profile state **so that** parallel scenarios cannot corrupt each other.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-08-11 · Commit: b407760

**Acceptance criteria**
1. Given two logins of `standard_user`, when each token is decoded, then each carries its own `sid` (`backend/routers/auth.py:60-63`; verified: the two sids differ).
2. Given session A saves a profile name, when session B reads its profile, then the name is empty (`backend/database.py:93-117`; verified).
3. Given session A sets market JP and a cart, when session B reads its session, then B is still MX with an empty cart (`backend/database.py:139-148,170-183`; verified).
4. `POST /api/store/market` changes only the caller's market and leaves the cart as it was (`backend/test_api.py:34-56`). The clients clear the cart on market change (`frontend/src/store.js:120`; `frontend-mobile/src/store/useAppStore.ts:101-106`), so server and client disagree on this.

**Evidence**: `backend/routers/auth.py:52-63`, `backend/database.py:93-117,139-148,170-183`, `backend/test_api.py:34-56`
**Notes**: The profile was keyed by `sid` in 82d1b74 (2026-07-17); cart and market were keyed by `sid` in b407760 (2026-08-11). Verified in-process with a scratch script; no server started.

---

### US-AUTH-005-WEB · Fill a test user with one tap (web)
**As a** QA engineer **I want** one-tap pills for each test user **so that** I can switch identities quickly.

- Layer: WEB · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-21 · Commit: 64bfde8

**Acceptance criteria**
1. Given the Login page, when it renders, then seven pills appear, labelled Standard, Locked, Problem, Glitch, Error, A11y and Security, each with testid `user-<username>` (`frontend/src/pages/Login.jsx:11-19,253-267`).
2. Given a pill is tapped, when it is clicked, then username and password `pizza123` are filled and nothing is submitted (`Login.jsx:103-106`).
3. Given `GET /api/auth/users` fails or returns nothing, when the page loads, then the static list is shown (`Login.jsx:27,46-54`).

**Evidence**: `frontend/src/pages/Login.jsx:11-27,46-54,103-106,253-267`
**Notes**: A user with no label in `USER_HINTS` shows its raw username (`Login.jsx:262`).

---

### US-AUTH-005-MOB · Fill a test user with one tap (mobile)
**As a** QA engineer **I want** one-tap pills for each test user on my phone **so that** I can switch identities quickly.

- Layer: MOB · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-25 · Commit: 37082da

**Acceptance criteria**
1. Given the Login screen, when it renders, then seven pills appear with testIDs `btn-user-<id>` and labels Standard, Locked, Problem, Glitch, Error, A11y and Security (`frontend-mobile/src/screens/LoginScreen.tsx:28-36,218-229`).
2. Given a pill is pressed, then username and `pizza123` are filled and nothing is submitted (`LoginScreen.tsx:106-109`).

**Evidence**: `frontend-mobile/src/screens/LoginScreen.tsx:28-36,106-109,218-229`
**Notes**: The list is static, see US-AUTH-006-MOB.

---

### US-AUTH-006-MOB · Mobile user list is static and login waits 500 ms
**As a** QA engineer **I want** the mobile quick-login list to come from the server's test-user catalogue **so that** a new test user appears without an app release.

- Layer: MOB · Epic: AUTH · Persona: QA · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: the list is read from `GET /api/auth/users` as the web does. Current: the seven entries are hardcoded (`frontend-mobile/src/screens/LoginScreen.tsx:28-36`). `getTestUsers` exists in `frontend-mobile/src/features/auth/useCases/getTestUsers.ts:3-4`, but no screen calls it (grep of `frontend-mobile/src`).
2. Expected: sign-in responds at once. Current: every sign-in waits 500 ms before the request (`LoginScreen.tsx:76-78`).

**Evidence**: `frontend-mobile/src/screens/LoginScreen.tsx:28-36,76-80`, `frontend-mobile/src/features/auth/useCases/getTestUsers.ts:3-4`
**Notes**: Origin of the delay: `cef2a31` (2026-02-18). The mobile request timeout is 60 s (`frontend-mobile/src/api/client.ts:33`), so the delay does not affect timeouts.

---

### US-AUTH-007-API · Read the test-user catalogue and my identity
**As a** QA engineer **I want** to list the test users and read my current identity **so that** scripts can discover personas without hardcoding them.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given no token, when `GET /api/auth/users` is called, then the response is 200 with seven entries carrying `username`, `behavior` and `description`; no password is returned (`backend/routers/auth.py:76-86`; `backend/models.py:17-20`; verified seven users).
2. Given a valid token, when `GET /api/auth/profile` is called, then the response carries the caller's `username`, `behavior` and `description` (`backend/routers/auth.py:88-100`; verified).
3. Given no token, when `GET /api/auth/profile` is called, then the response is 401 with `error` = `Not authenticated` (`backend/middleware.py:28-31`; verified).

**Evidence**: `backend/routers/auth.py:76-100`, `backend/models.py:17-20`, `backend/middleware.py:28-50`
**Notes**: The web app calls `/api/auth/users` (`frontend/src/services/auth.service.js:6`); the mobile app does not (US-AUTH-006-MOB). `/api/auth/profile` is not called by either client.

---

### US-AUTH-008-API · Token claims and 30-minute expiry
**As a** QA engineer **I want** each token to carry the user, the persona and a per-login session id, and to expire after 30 minutes **so that** tests can reason about session lifetime.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848 (expiry); 82d1b74 (`sid`, 2026-07-17)

**Acceptance criteria**
1. Given a successful login, when the token is decoded, then its claims are exactly `sub`, `behavior`, `sid` and `exp` (`backend/routers/auth.py:60-63`; verified).
2. Given a token issued now, when its `exp` is read, then it is 30 minutes ahead (`backend/config.py:18`, `backend/auth.py:42-47`; verified 30.0 minutes).
3. Given the `sid` claim, when it is read, then it is a 32-character hex id that is new for every login (`backend/routers/auth.py:60`; verified 32 characters).

**Evidence**: `backend/routers/auth.py:52-63`, `backend/auth.py:38-62`, `backend/config.py:16-18`
**Notes**: The signing key defaults to a test-only string (`backend/config.py:16`). Tokens are not revoked on logout (US-AUTH-009-API).

---

### US-AUTH-009-API · Logout does not revoke the token server-side
**As a** QA engineer **I want** logout to invalidate the session token on the server **so that** a copied token stops working.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Found

**Acceptance criteria**
1. Expected: a logout call ends the token's validity. Current: there is no logout route; `POST /api/auth/logout` returns 404 (verified).
2. Expected: the server rejects a token once the client has logged out. Current: the token is accepted until `exp`, because `decode_access_token` checks only the signature and expiry (`backend/auth.py:52-62`). No denylist or revoke path exists (grep of `backend`).

**Evidence**: `backend/auth.py:52-62`, `backend/middleware.py:28-50`
**Notes**: Client logout clears local state only (`frontend/src/store.js:43-68`; `frontend-mobile/src/store/useAppStore.ts:120-130`). Likely by design for a stateless 30-minute token in a QA sandbox; recorded because client logout implies the token is dead, and no test asserts revocation.

---

### US-AUTH-009-WEB · Sign out on the web app
**As a** customer **I want** to sign out **so that** the next person on this browser starts clean.

- Layer: WEB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: 60774e3 (cart and last-order clear; merged into this branch)

**Acceptance criteria**
1. Given the Navbar logout (`logout-btn`, or `mobile-logout-btn` in the menu), when it is pressed, then token, username and the cached profile are removed, the profile store is emptied and the app navigates to `/` (`frontend/src/components/Navbar.jsx:37-41,146,240`; `frontend/src/store.js:43-53`).
2. Given logout, when it runs, then the cart and last order are cleared as well (`frontend/src/store.js:57,60`; added by 60774e3).
3. Given no token, when a protected route is opened, then the user is redirected to `/` (`frontend/src/routes/ProtectedRoute.jsx:9-10`).

**Evidence**: `frontend/src/components/Navbar.jsx:37-41,146,240`, `frontend/src/store.js:43-68`, `frontend/src/routes/ProtectedRoute.jsx:9-10`
**Notes**: Commit 60774e3 is merged into this branch (merge of `US-and-Improvements`).

---

### US-AUTH-009-MOB · Sign out on the mobile app
**As a** customer **I want** to sign out from the bottom bar **so that** I return to the Login screen with nothing left from my session.

- Layer: MOB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: cac3d07 (store logout); 7dc4112 (bar returns to Login, 2026-02-21)

**Acceptance criteria**
1. Given the bottom-bar logout, when it is pressed, then the store logs out and navigation resets to Login (`frontend-mobile/src/components/BottomNavBar.tsx:29-32`).
2. Given the store logout, when it runs, then token, cart, last order and country info are cleared and the language returns to English (`frontend-mobile/src/store/useAppStore.ts:120-130`).

**Evidence**: `frontend-mobile/src/components/BottomNavBar.tsx:29-32`, `frontend-mobile/src/store/useAppStore.ts:120-130`
**Notes**: The store logout does not clear the in-memory profile; see US-PRF-008-MOB.

---

### US-AUTH-010-API · Protected endpoints reject missing or bad tokens with 401
**As a** QA engineer **I want** a missing, malformed, expired or unknown token to fail with 401 **so that** tests can assert auth failures on any endpoint.

- Layer: API · Epic: AUTH · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given no `Authorization` header, when a protected endpoint is called, then the response is 401 with `error` = `Not authenticated` (verified on `GET /api/auth/profile`).
2. Given a malformed token, when it is decoded, then the response is 401 with `error` = `Could not validate credentials` (`backend/auth.py:58-62`; verified).
3. Given a token whose `sub` is not a known test user, when it is used, then the response is 401 with `error` = `User not found` (`backend/middleware.py:40-45`; code read, not exercised).

**Evidence**: `backend/auth.py:52-62`, `backend/middleware.py:28-50`, `backend/main.py:75-84`
**Notes**: Expiry is enforced by the JWT library (`exp` check in `decode`); no in-repo test asserts the expired case, so the expired-token path is code-read only.

---

### US-AUTH-010-WEB · Return to Login when a session token is rejected (web)
**As a** customer **I want** an expired session to send me back to Login **so that** I am not left on screens that keep failing.

- Layer: WEB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-12 · Commit: 27c87b5 (session guard); 48eaab5 (2026-02-08, original 401 logout)

**Acceptance criteria**
1. Given a session token exists and a request returns 401, when the response arrives, then the app logs out, removes `omnipizza-auth` and navigates to `/` (`frontend/src/services/httpClient.js:46-56`).
2. Given a login attempt with no token, when it returns 401, then there is no redirect and the error stays on the form (`httpClient.js:40-46`; `frontend/src/pages/Login.jsx:95-96`).
3. Given any other status, when it arrives, then the error is passed to the caller unchanged (`httpClient.js:57`).

**Evidence**: `frontend/src/services/httpClient.js:37-59`
**Notes**: The redirect is a full page load (`window.location.assign("/")`, `httpClient.js:54`).

---

### US-AUTH-010-MOB · Return to Login when a session token is rejected (mobile)
**As a** customer **I want** an expired session on my phone to send me back to Login **so that** I can sign in again.

- Layer: MOB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-10-28 · Commit: c55c5c5 (merged into this branch)

**Acceptance criteria**
1. Given an authenticated request returns 401 and a session token exists, when the response arrives, then the app logs out and resets navigation to Login (`frontend-mobile/src/api/unauthorized.ts:13-19`; `frontend-mobile/src/api/client.ts:53-64`, handler call at `client.ts:57`).
2. Given a 401 on a login attempt (no token), a 403, a 5xx or a network error, when it arrives, then the handler does nothing (`frontend-mobile/src/api/unauthorized.ts:15`).
3. Any other error is rethrown unchanged after the handler runs (`frontend-mobile/src/api/client.ts:62`).

**Evidence**: `frontend-mobile/src/api/unauthorized.ts:13-19`, `frontend-mobile/src/api/client.ts:53-64`, `frontend-mobile/src/navigation/navigationRef.ts:8-12`
**Notes**: Commit c55c5c5 is merged into this branch. The reset to Login goes through `resetToLogin` (`frontend-mobile/src/navigation/navigationRef.ts:8-12`).

---

### US-AUTH-011-WEB · Stay signed in across reloads; reset on a new release
**As a** customer **I want** my session to survive a page reload **so that** I do not sign in again every time, and **so that** a stale session is dropped after a redeploy.

- Layer: WEB · Epic: AUTH · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-02-08 · Commit: 48eaab5 (release reset origin)

**Acceptance criteria**
1. Given a signed-in user, when the page reloads, then the token, username and behaviour are restored from localStorage (`frontend/src/store.js:33-34`; persist name `omnipizza-auth` at `store.js:70`).
2. Given `VITE_APP_RELEASE` differs from the stored `omnipizza-release`, when the app boots, then `token`, `username` and `omnipizza-auth` are removed and the user lands on Login (`frontend/src/store.js:5-24`).
3. Given no token, when a protected route is requested, then the user is redirected to `/` (`frontend/src/routes/ProtectedRoute.jsx:9-10`; `frontend/src/App.jsx:50`).

**Evidence**: `frontend/src/store.js:5-24,29-70`, `frontend/src/routes/ProtectedRoute.jsx:6-10`, `frontend/src/App.jsx:50`
**Notes**: The release reset keeps the cart, market and language keys (the cart removal is commented out at `store.js:19-20`).

---

### US-AUTH-012-UX · English and LTR on login; logout returns to LTR
**As a** customer who signed in as an Arabic-market user **I want** the login screen and the post-logout screens to be readable in English **so that** a previous RTL session does not leave the next screen reversed.

- Layer: UX · Epic: AUTH · Persona: Customer · Market: all (SA is RTL)
- Status: Done
- Done on: 2026-07-09 · Commit: 65d79d0 (SA market with full RTL; this commit introduced the `document.documentElement.dir` effect)

**Acceptance criteria**
1. Given the app is not signed in, when it renders, then `dir` is `ltr` and `lang` is `en` (`frontend/src/App.jsx:29-32`).
2. Given a signed-in Arabic session, when it renders, then `dir` is `rtl` and `lang` is `ar` (`App.jsx:29-32`).
3. Given logout, when it completes, then web resets language to `en` and locale to `en-US` (`frontend/src/store.js:65-67`), and mobile resets language to `en` (`frontend-mobile/src/store/useAppStore.ts:129`).

**Evidence**: `frontend/src/App.jsx:20,24-33`, `frontend/src/store.js:65-67`, `frontend-mobile/src/store/useAppStore.ts:120-130`
**Notes**: The market's language is re-applied on the next login (`frontend/src/pages/Login.jsx:80`).
