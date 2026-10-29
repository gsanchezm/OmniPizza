# Epic REG — Temporary Accounts & Guest

Adds two kinds of customer next to the 7 fixed test users: a **guest** (no credentials) and a **profiled** customer with a temporary, non-persistent account that receives the welcome coupon (see PROMO). Nothing survives logout, JWT expiry (30 min) or a backend restart.

Conventions: story 007 is written for the QA persona; its layers are still WEB and MOB (QA is a persona, not a layer). Every acceptance criterion follows from `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md`. Open: the design header says "awaiting owner approval" while its Decisions section says approved on 2026-10-28; confirm approval.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-REG-001-API | Register a temporary account | API | Planned |
| US-REG-001-WEB | Register a temporary account | WEB | Planned |
| US-REG-001-MOB | Register a temporary account | MOB | Planned |
| US-REG-001-UX | Registration screen design | UX | Planned |
| US-REG-002-API | Continue as guest | API | Planned |
| US-REG-002-WEB | Continue as guest | WEB | Planned |
| US-REG-002-MOB | Continue as guest | MOB | Planned |
| US-REG-003-API | Temporary account lifetime: logout and expiry | API | Planned |
| US-REG-003-WEB | Logout deletes the temporary account | WEB | Planned |
| US-REG-003-MOB | Logout deletes the temporary account | MOB | Planned |
| US-REG-004-API | Reserved and duplicate usernames, 200-account cap | API | Planned |
| US-REG-004-WEB | Registration error mapping | WEB | Planned |
| US-REG-004-MOB | Registration error mapping | MOB | Planned |
| US-REG-005-API | profile_type in login responses | API | Planned |
| US-REG-005-WEB | Guest vs profiled Profile | WEB | Planned |
| US-REG-005-MOB | Guest vs profiled Profile | MOB | Planned |
| US-REG-006-UX | Registration language follows the market | UX | Planned |
| US-REG-006-WEB | Registration language follows the market | WEB | Planned |
| US-REG-006-MOB | Registration language follows the market | MOB | Planned |
| US-REG-007-WEB | Login entry points and harness compatibility | WEB | Planned |
| US-REG-007-MOB | Login entry points and harness compatibility | MOB | Planned |

---

### US-REG-001-API · Register a temporary account

**As a** customer **I want** to register a temporary account with a username, a password and an optional full name **so that** I can order with a real account shape without keeping any data afterwards.

- Layer: API · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given a body with `username` (3–50 characters), `password` (6–100 characters) and optional `full_name`, when `POST /api/auth/register` is called, then the response is **201** with the `LoginResponse` fields, `profile_type: "profiled"` and a `coupon` object.
2. Given a username outside 3–50 characters or a password outside 6–100 characters, when registering, then the response is **422** with FastAPI's `{detail: [...]}` body.
3. Given `full_name` was sent, when the new token calls `GET /api/users/me/profile`, then the profile's name is pre-filled with it.
4. Given an active account already holds the username, when registering, then the response is **409** (rules in US-REG-004-API).
5. Given a successful registration, when the new token reads its profile, then the profile starts clean (new `sid`; no state carried over from any earlier account with that name).

**Notes**: Depends on US-REG-004-API (username and cap rules), US-REG-005-API (`profile_type`) and US-PROMO-001-API (coupon creation). Additive: no existing path changes. Coupon object fields: see the Open in US-PROMO-001-API. Required headers: see the Open in US-REG-002-API.

---

### US-REG-001-WEB · Register a temporary account

**As a** customer **I want** a Register page where I enter my details and am signed in straight away **so that** I can start ordering after one form.

- Layer: WEB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Login page, when I choose "Create account", then `/register` opens with labelled username, password and optional full name fields, each with a stable `data-testid`.
2. Given valid input, when I submit, then `POST /api/auth/register` is sent and on **201** I am signed in and taken straight to `/catalog`, where the coupon banner (US-REG-001-UX) shows the returned code (owner decision, 2026-10-28).
3. Given the API answers **409**, **429** or **422**, when I submit, then the form shows the localized message for each (409 username taken, 429 "Too many users", 422 next to the matching field) and I am not signed in.
4. Given a direct navigation to `/register`, when the lazy route loads, then the page is reached through the existing `route-loading` fallback and its own `data-testid` (no page imported from a component).

**Notes**: Depends on US-REG-001-API, US-REG-004-WEB (error copy) and US-REG-006-WEB (language). The market chosen on Login carries over. Required headers: see the Open in US-REG-002-API.

---

### US-REG-001-MOB · Register a temporary account

**As a** customer **I want** the same registration on my phone **so that** I get the same account and coupon on mobile.

- Layer: MOB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Login screen, when I tap "Create account", then the Register screen opens; the deep link `omnipizza://register` opens the same screen.
2. Given valid input, when I submit, then on **201** the app stores the token, signs me in and navigates straight to the Catalog screen, where the coupon banner is shown (owner decision, 2026-10-28).
3. Given the API answers **409**, **429** or **422**, when I submit, then the screen shows the localized message as on web and I am not signed in.
4. Given the Register screen, when it renders, then every interactive element has a `testID` with the `btn-`, `input-`, `text-` or `view-` prefix.

**Notes**: Depends on US-REG-001-API, US-REG-004-MOB and US-REG-006-MOB. The mobile store is ephemeral (no AsyncStorage), so an app restart signs the account out without calling logout; the account is then removed only at JWT expiry (US-REG-003-API). Open: whether `omnipizza://register` and `omnipizza://catalog?section=` accept the universal `market=`, `lang=` and `accessToken=` params like other deep links (harness-relevant).

---

### US-REG-001-UX · Registration screen design

**As a** customer **I want** the registration screen to be clear, accessible and in the app's existing style **so that** the form is easy to finish in every market.

- Layer: UX · Epic: REG · Persona: Customer · Market: all (CH and SA specifics in US-REG-006-UX)
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile); Left to the builder)

**Acceptance criteria**
1. Given the Register screen, when it renders, then it shows username, password and optional full name fields, one primary "Create account" action and a way back to Login, in the Login screen's visual style, with no horizontal scroll at phone width.
2. Given the form, when it is used, then every field has a visible label (placeholder text is not the label), errors are announced to assistive technology, and contrast meets the same bar as the recent sweeps.
3. Given the form, when it is in each state (default, submitting with the action disabled, error for 409, 429 and 422, success), then each state renders with its own copy and the success state shows the coupon code and "15%".
4. Given the copy, when the app ships, then every string exists in all six locale files (en, es, de, fr, ja, ar) on both clients, and the ja and ar copy is reviewed by a native speaker.
5. Given SA (ar), when the screen renders, then it is right-to-left: labels, error text and the banner align right and the field order mirrors.

**Notes**: Copy wording and screen layouts within the existing style are left to the builder (design: Left to the builder). Depends on US-REG-006-UX for language selection. Open: no UX story is listed for the Login entry copy or the coupon field copy (see US-REG-007-WEB and US-PROMO-002-WEB); confirm whether they need one.

---

### US-REG-002-API · Continue as guest

**As a** customer **I want** to enter the app as a guest without any credentials **so that** I can order immediately.

- Layer: API · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given no credentials, when `POST /api/auth/guest` is called, then a `LoginResponse` is returned with `profile_type: "guest"`, a username like `guest_ab12cd34`, and a token valid for 30 minutes.
2. Given a guest response, when it is read, then it contains no `coupon` object.
3. Given a guest token, when it calls the catalog, cart or checkout endpoints, then the guest behaves as `standard` (no chaos behaviour), like `standard_user`.
4. Given 200 active temporary accounts already exist, when a guest is requested, then the response is **429** (US-REG-004-API).

**Notes**: Designer's call (owner to confirm): guests are real entries in the temporary registry, so `get_current_user` and cleanup are uniform. Depends on US-REG-003-API, US-REG-004-API and US-REG-005-API. Open: the success status code of `POST /api/auth/guest` (only register's 201 is stated) and which strict headers (`X-Country-Code`, `X-Language`) guest, register and logout require, since the first two have no token yet.

---

### US-REG-002-WEB · Continue as guest

**As a** customer **I want** a "Continue as guest" button on the Login page **so that** I can start without typing anything.

- Layer: WEB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given the Login page, when I click "Continue as guest" (stable `data-testid`), then `POST /api/auth/guest` is sent and I land where a signed-in test user lands today.
2. Given a guest session, when I reload the page, then I stay signed in until the 30-minute token expires; the next call after expiry gets **401** and the client logs out as it does today.
3. Given the API answers **429** (cap reached), when I click the button, then Login shows the localized "Too many users" message and no session starts.
4. Given the guest flow, when I go through it, then no credentials are requested at any step.

**Notes**: Depends on US-REG-002-API and US-REG-004-WEB. Web keeps auth in localStorage (`omnipizza-auth`), so a backend restart is noticed on the next 401 rather than at once.

---

### US-REG-002-MOB · Continue as guest

**As a** customer **I want** a "Continue as guest" button on the Login screen **so that** I can start without typing anything on my phone.

- Layer: MOB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given the Login screen, when I tap "Continue as guest" (a `btn-` `testID`), then `POST /api/auth/guest` is sent and I land where a signed-in test user lands today.
2. Given the API answers **429**, when I tap the button, then the localized "Too many users" message shows and no session starts.
3. Given a guest session, when the app is restarted, then I am signed out (the store is ephemeral), and the guest account is removed only at JWT expiry.

**Notes**: Depends on US-REG-002-API and US-REG-004-MOB. Same open questions as US-REG-002-API.

---

### US-REG-003-API · Temporary account lifetime: logout and expiry

**As a** QA engineer **I want** a temporary account and everything it created to disappear on logout or on expiry **so that** nothing of a session outlives it.

- Layer: API · Epic: REG · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity; Constraints)

**Acceptance criteria**
1. Given a guest or profiled token, when `POST /api/auth/logout` is called, then the account is deleted together with its `sid` state (session, cart, profile) and all of its orders, and the endpoint answers success.
2. Given a test-user token, when `POST /api/auth/logout` is called, then only that login's `sid` state is cleared; the test user's orders remain and a new login starts clean.
3. Given a temporary token whose 30-minute lifetime has passed, when any authenticated endpoint is called, then the response is **401** and the account and its orders are gone; the purge is lazy (on registry access), so removal happens at the first registry access after expiry, with no background thread.
4. Given a profiled account removed by logout or expiry, when the same username registers again, then the response is **201** and the new account's order history is empty.

**Notes**: Depends on US-REG-001-API and US-REG-002-API. Orders are keyed by username, not by `sid`, so deletion must sweep them explicitly. Expiry uses `settings.access_token_expire_minutes` (30); the design describes no refresh. Open: the status code of a successful logout (200 or 204 is not stated), and the status for logout without a token or with an expired one (the design says only "auth required").

---

### US-REG-003-WEB · Logout deletes the temporary account

**As a** customer **I want** Logout to end my temporary session completely **so that** my account is removed when I leave.

- Layer: WEB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given a signed-in temporary account, when I click Logout, then the client calls `POST /api/auth/logout` first, then clears local auth and cart state and returns to Login as it does today.
2. Given the logout call fails (network error or a non-2xx answer), when I click Logout, then local state is still cleared and I am signed out; the backend removes the account at expiry at the latest.
3. Given a test user, when I click Logout, then the same call is made, the page returns to Login as today, and the test user can log in again.
4. Given any call answers **401**, when the client handles it, then it uses the existing client-side `logout()` only and does not call the new endpoint.

**Notes**: Depends on US-REG-003-API. The existing client-side `logout()` stays as it is and is still used by the 401 path (design). Designer's call: clients call the endpoint best-effort.

---

### US-REG-003-MOB · Logout deletes the temporary account

**As a** customer **I want** Logout on my phone to end my temporary session completely **so that** my account is removed when I leave.

- Layer: MOB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given a signed-in temporary account, when I tap Logout (a `btn-` `testID`), then the app calls `POST /api/auth/logout` first, then clears local state and returns to Login.
2. Given the logout call fails, when I tap Logout, then local state is still cleared and I am signed out.
3. Given a test user, when I tap Logout, then the same call is made and the test user can log in again.
4. Given the app is closed without logout, when it is reopened, then no logout call has been made and the account is removed only at JWT expiry.

**Notes**: Depends on US-REG-003-API. The mobile store is ephemeral, so local state is always cleared on restart (see US-REG-001-MOB).

---

### US-REG-004-API · Reserved and duplicate usernames, 200-account cap

**As a** customer **I want** a clear answer when my username is taken or the sandbox is full **so that** I can pick another name or try again later.

- Layer: API · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given an active account holds `alice`, when registration asks for `alice`, then the response is **409** with the `{error, status_code, timestamp}` body and an English message.
2. Given an account that holds `alice` has expired or been logged out, when registration asks for `alice`, then the response is **201** (only active duplicates conflict).
3. Given 199 active temporary accounts (guests and profiled together), when one more is created, then it succeeds; given 200 active, when one more guest or registration is requested, then the response is **429** with the same error body.
4. Given one of the 7 test usernames, when registration asks for it, then the request is refused because the name is reserved.

**Notes**: Designer's call (owner to confirm): the cap counts guests and profiled together, and the count is taken after the lazy purge described in US-REG-003-API. "Active" means not expired and not logged out. Today no backend route emits **429**; this story makes it the first. Open: the status code for a reserved test username (the design gives 409 only for an active duplicate). Open: whether usernames are case-insensitive. Open: the exact English texts of the 409 and 429 messages (the design requires them to stay English and stable for assertions, but does not fix them).

---

### US-REG-004-WEB · Registration error mapping (web)

**As a** customer **I want** registration errors in my language **so that** I know what to change.

- Layer: WEB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given the API answers **409**, when I submit, then the username field shows a localized "username already taken" message and the English API text is not shown.
2. Given the API answers **429**, when I submit, then the form shows the localized "Too many users" message and no session starts.
3. Given the API answers **422**, when I submit, then each error appears next to the field it refers to, in the current language.
4. Given the API refuses a reserved test username (status per US-REG-004-API), when I submit, then the username field shows an error.

**Notes**: Depends on US-REG-004-API. Clients map known statuses to localized copy (design). Exact copy is left to the builder.

---

### US-REG-004-MOB · Registration error mapping (mobile)

**As a** customer **I want** registration errors on my phone in my language **so that** I know what to change.

- Layer: MOB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given the API answers **409**, when I submit, then the username field shows the localized "username already taken" message and the English API text is not shown.
2. Given the API answers **429**, when I submit, then the screen shows the localized "Too many users" message and no session starts.
3. Given the API answers **422**, when I submit, then each error appears under the field it refers to, in the current language.
4. Given the API refuses a reserved test username (status per US-REG-004-API), when I submit, then the username field shows an error.

**Notes**: Depends on US-REG-004-API. Same open question as US-REG-004-WEB about the reserved-name status.

---

### US-REG-005-API · profile_type in login responses

**As a** QA engineer **I want** every login-type response to say which kind of account it is **so that** automation can branch on account kind.

- Layer: API · Epic: REG · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity)

**Acceptance criteria**
1. Given any of the 7 test users, when `POST /api/auth/login` succeeds, then the response has `profile_type: "test"` and every existing field unchanged.
2. Given `POST /api/auth/guest` succeeds, when the response is read, then `profile_type` is `"guest"`.
3. Given `POST /api/auth/register` succeeds, when the response is read, then `profile_type` is `"profiled"` and a `coupon` object is present.
4. Given the field is additive, when the existing harness reads a login response, then every existing field keeps its name and type.

**Notes**: Designer's call: the `profile_type` values are `"test" | "guest" | "profiled"`. Open: where a client learns `profile_type` after a page reload, since the design names only the login, register and guest responses. Open: whether `GET /api/auth/users` keeps listing only the 7 test users (it lists `TEST_USERS` today).

---

### US-REG-005-WEB · Guest vs profiled Profile (web)

**As a** customer **I want** my Profile to match my account kind **so that** I know whether a 15% coupon is available to me.

- Layer: WEB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given a guest, when Profile loads, then it shows a "Create an account for 15% off" prompt (stable `data-testid`) that links to `/register`, and no coupon.
2. Given a profiled customer, when Profile loads, then the guest prompt is not shown and the coupon appears as described in US-PROMO-001-WEB.

**Notes**: Depends on US-REG-005-API, US-PROMO-001-WEB and US-REG-001-WEB. Account kind after a reload: see the Open in US-REG-005-API. Open: Profile for test users; the design names only the guest and profiled variants, so no test-user Profile rule is written here.

---

### US-REG-005-MOB · Guest vs profiled Profile (mobile)

**As a** customer **I want** my Profile on my phone to match my account kind **so that** I know whether a 15% coupon is available to me.

- Layer: MOB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given a guest, when the Profile screen opens, then it shows a "Create an account for 15% off" prompt (a `btn-` `testID`) that opens the Register screen, and no coupon.
2. Given a profiled customer, when the Profile screen opens, then the guest prompt is not shown and the coupon appears as described in US-PROMO-001-MOB.

**Notes**: Depends on US-REG-005-API, US-PROMO-001-MOB and US-REG-001-MOB. Same open question as US-REG-005-WEB about the account kind after a restart. Profile for test users: see the Open in US-REG-005-WEB.

---

### US-REG-006-UX · Registration language follows the selected market

**As a** customer **I want** the registration screen to speak the language of the market I chose on Login **so that** it matches the rest of the app.

- Layer: UX · Epic: REG · Persona: Customer · Market: all (CH and SA specifics)
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Registration language (owner question, answered))

**Acceptance criteria**
1. Given no market has been chosen, when the Register screen opens, then its copy is in English.
2. Given a market is chosen on Login, when the Register screen opens, then its copy uses that market's language, exactly as Login does.
3. Given CH, when the Register screen opens, then the DE/FR toggle is shown and switches all of its copy between German and French.
4. Given SA, when the Register screen opens, then it renders right-to-left with the same mirroring as Login.
5. Given any API error, when it is shown, then the message is localized (409, 429 and 422 copy exists in en, es, de, fr, ja and ar) and the English API text is never shown.

**Notes**: The design makes the registration UI follow the market exactly like Login, so there is no in-app market switcher. Depends on US-REG-001-UX. Ja and ar copy needs native review (design).

---

### US-REG-006-WEB · Registration language follows the selected market (web)

**As a** customer **I want** `/register` to use the market I selected on Login **so that** I see the same language there.

- Layer: WEB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Registration language (owner question, answered))

**Acceptance criteria**
1. Given a market selected on Login, when `/register` opens, then its copy uses that market's language (the selection persisted under `omnipizza-country`).
2. Given CH, when `/register` opens, then the DE/FR toggle is shown and switches the copy.
3. Given SA, when `/register` opens, then the document renders right-to-left.
4. Given no market selected (for example a direct navigation to `/register`), when the page opens, then its copy is in English.

**Notes**: Depends on US-REG-006-UX. The API still answers in English, so the language is a client concern only.

---

### US-REG-006-MOB · Registration language follows the selected market (mobile)

**As a** customer **I want** the Register screen on my phone to use the market I selected on Login **so that** I see the same language there.

- Layer: MOB · Epic: REG · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Registration language (owner question, answered))

**Acceptance criteria**
1. Given a market selected on Login, when the Register screen opens, then its copy uses that market's language.
2. Given CH, when the Register screen opens, then the DE/FR toggle is shown and switches the copy.
3. Given SA, when the Register screen opens, then it renders right-to-left through the existing state-driven `useRTL()` path.
4. Given no market selected, when the Register screen opens, then its copy is in English.

**Notes**: Depends on US-REG-006-UX. Do not use `I18nManager.forceRTL` for this screen: a forced direction plus reload would wipe the ephemeral store. The state-driven `useRTL()` hook is the existing path.

---

### US-REG-007-WEB · Login entry points and harness compatibility (web)

**As a** QA engineer **I want** the Login page to keep the 7 quick-login users unchanged next to the new entries **so that** the external harness keeps logging in while customers get "Continue as guest" and "Create account".

- Layer: WEB · Epic: REG · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity; Anti-goals)

**Acceptance criteria**
1. Given the Login page, when it renders, then the 7 test users keep their labels and `data-testid`s, and "Continue as guest" and "Create account" are added with stable test ids.
2. Given a quick login of a test user with `pizza123`, when it runs, then the flow and the response are unchanged (`profile_type` is additive).
3. Given the harness selectors for the 7 users, when the Login page loads, then they resolve without any new step (no extra modal or screen before login).

**Notes**: Depends on US-REG-002-WEB and US-REG-001-WEB. The design lists no UX story for the two entry labels (see US-REG-001-UX Open). Harness-compatibility concern: any renamed `data-testid` on this page breaks the external harness.

---

### US-REG-007-MOB · Login entry points and harness compatibility (mobile)

**As a** QA engineer **I want** the Login screen to keep the 7 quick-login users unchanged next to the new entries **so that** the external harness keeps logging in while customers get "Continue as guest" and "Create account".

- Layer: MOB · Epic: REG · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Entry points and identity; Anti-goals)

**Acceptance criteria**
1. Given the Login screen, when it renders, then the 7 quick-login users keep their existing labels and `testID`s, and the new "Continue as guest" and "Create account" buttons use the `btn-` prefix.
2. Given the deep links `omnipizza://` with `accessToken` (bypasses Login) and `market` (selects the market on Login), when they open, then they behave as today with the new entries present.
3. Given a quick login of a test user with `pizza123`, when it runs, then the flow and the response are unchanged.

**Notes**: Depends on US-REG-002-MOB and US-REG-001-MOB. Harness compatibility: the existing `testID`s and deep links are part of the harness contract; renaming any is a breaking change.
