# Epic PLT — Platform, Delivery & Hardening

How OmniPizza is built, deployed, observed and hardened: the FastAPI skeleton and its probes, Render and Docker deployment, GitHub Pages, the CI workflows, the mobile release pipeline and its iOS simulator-only decision, release history, accessibility and security hardening, and the architecture refactors that the golden net protects.

Evidence basis: branch `worktree-agent-a6dd2f82beadb82a6` after merging `US-and-Improvements` (2026-10-28), which carries origin/main and the same-day fixes. `gh` reads (releases, Pages) were taken the same day. Hardening commits 63a133a, a943483, 0ac97d4, c773043 and the WCAG commits are on main history and are cited by sha.

| ID | Title | Layer | Status |
| :--- | :--- | :--- | :--- |
| US-PLT-001-API | Backend app skeleton, root and health probe | API | Done |
| US-PLT-002-API | Prometheus counters are defined but never recorded | API | Found |
| US-PLT-003-API | Build provenance endpoint `GET /api/version` | API | Done |
| US-PLT-003-WEB | Build-stamped `version.json` on the static site | WEB | Done |
| US-PLT-004-API | API security headers and CORS policy | API | Done |
| US-PLT-005-API | JWT signing secret is a committed default | API | Found |
| US-PLT-006-API | Unhandled exceptions return internal exception text | API | Found |
| US-PLT-007-API | In-memory state resets on every restart | API | Done |
| US-PLT-008-API | Render backend blueprint | API | Done |
| US-PLT-009-API | Docker Compose local stack | API | Done |
| US-PLT-010-WEB | Render static site with SPA and API rewrites | WEB | Done |
| US-PLT-011-WEB | Enforced CSP, HSTS and frame headers on Render | WEB | Done |
| US-PLT-012-WEB | Docker-served web app has no security headers | WEB | Found |
| US-PLT-013-WEB | GitHub Pages landing page | WEB | Done |
| US-PLT-014-WEB | Cypress component tests in CI (non-blocking) | WEB | Done |
| US-PLT-015-MOB | Mobile release pipeline (manual dispatch) | MOB | Done |
| US-PLT-016-MOB | iOS build is simulator-only | MOB | Done |
| US-PLT-017-MOB | Android backup disabled and minSdk 29 | MOB | Done |
| US-PLT-018-MOB | Release history | MOB | Done |
| US-PLT-019-UX | WCAG 1.4.3 contrast sweeps | UX | Done |
| US-PLT-020-UX | WCAG 4.1.2, 4.1.3 and 3.1.1 fixes | UX | Done |
| US-PLT-021-UX | Heading order on Catalog and Order Success | UX | Done |
| US-PLT-022-API | Backend split into feature routers | API | Done |
| US-PLT-023-API | Golden characterization net guards refactors | API | Done |
| US-PLT-024-WEB | Feature-sliced web app | WEB | Done |
| US-PLT-024-MOB | Feature-sliced mobile app | MOB | Done |

---

### US-PLT-001-API · Backend app skeleton, root and health probe
**As a** QA engineer **I want** a stable root and health endpoint on the API **so that** deploy probes and tests can tell the service is up.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given the app, when `GET /health` is called, then 200 with `status: "healthy"`, a UTC `timestamp` and `environment` (verified).
2. Given `GET /`, then 200 with the app name, `version`, and the `docs` and `health` paths (verified).
3. Given the app is assembled, then CORS, the route routers and the exception handlers are registered in `main.py` (see US-PLT-004-API, US-PLT-022-API and US-ATM-017-API).
4. Given Render, then `healthCheckPath: /health` is set (see US-PLT-008-API).

**Evidence**: `backend/main.py:20-27` (app and docs URLs), `:30-36` (CORS), `:48-53` (routers), `:56-63` (root), `:66-72` (health), `backend/config.py:5` (version), `render.yaml:20`.
**Notes**: `environment` comes from `Settings.environment` (default `production`, `config.py:6`); `docker-compose.yml:12` sets `development`.

---

### US-PLT-002-API · Prometheus counters are defined but never recorded
**As a** QA engineer **I want** request counters and latencies on `/api/debug/metrics` **so that** load and error rates can be scraped.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap; counters defined in 38b8848, 2026-02-07)

**Acceptance criteria**
1. Expected: `http_requests_total` and `http_request_duration_seconds` carry samples per method, endpoint and status. Actual: both are declared (`backend/main.py:16-17`), but no code calls `.inc()`, `.observe()`, `.labels()` or `.time()` on them (grep).
2. Given two `GET /health` calls then `GET /api/debug/metrics` (verified), the body contains `# TYPE` lines for both metrics but no `http_requests_total{` sample.
3. The endpoint returns `text/plain; charset=utf-8` (verified) and serves the default registry (`backend/routers/debug_chaos.py:47-50`).

**Evidence**: `backend/main.py:16-17`, `backend/routers/debug_chaos.py:6`, `:47-50`.
**Notes**: The PRD lists observability as a goal (`documents/Product_Requirement_Doc.md:276`) and lists the endpoint in §8 (`:190`), so the empty counters are a gap against the stated goal. Process metrics were not checked on Windows.

---

### US-PLT-003-API · Build provenance endpoint `GET /api/version`
**As a** QA engineer **I want** the API to report the commit it runs **so that** each campaign records the backend build it exercised.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-09-02 · Commit: 9ca3767

**Acceptance criteria**
1. Given `RENDER_GIT_COMMIT` is set, then `GET /api/version` returns it as `git_commit` (verified with `abc1234`).
2. Given it is unset, then `git_commit` is `null` (verified).
3. Given the call, then no auth and no `X-Country-Code` are required (`backend/routers/meta.py:9`).
4. Given the process, then `started_at` is captured once at import (`backend/routers/meta.py:23`, `:34`).

**Evidence**: `backend/routers/meta.py:1-35`, `backend/config.py:8-13`, `backend/main.py:13`, `:53`.
**Notes**: Not listed in PRD §8 (`documents/Product_Requirement_Doc.md:168-191`).

---

### US-PLT-003-WEB · Build-stamped `version.json` on the static site
**As a** QA engineer **I want** the deployed web build to publish its commit and build time **so that** the web build can be matched to the API build.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-09-02 · Commit: 9ca3767

**Acceptance criteria**
1. Given a Render static build, then `dist/version.json` is written with `commit` (from `RENDER_GIT_COMMIT`) and `built_at` (UTC) (`render.yaml:30-32`).
2. Given the app build, then `VITE_APP_RELEASE` is set to the same commit (`render.yaml:30`), which also drives the release guard in the web store (US-ATM-001-WEB).
3. Given the repo, then no in-repo code reads `version.json` (grep of `frontend/`); it is published only.

**Evidence**: `render.yaml:27-32`, `frontend/src/store.js:5`.
**Notes**: The file is served from the site root; the request path itself was not exercised.

---

### US-PLT-004-API · API security headers and CORS policy
**As a** QA engineer **I want** every API response to carry basic transport and sniffing headers **so that** browsers apply HSTS and no MIME sniffing.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-30 · Commit: 0ac97d4 (headers); 2026-02-07 · Commit: 38b8848 (CORS)

**Acceptance criteria**
1. Given any API response, then `X-Content-Type-Options: nosniff` and `Strict-Transport-Security: max-age=63072000; includeSubDomains` are set (verified on `/api/version` and on a 404).
2. Given `Origin: https://evil.example` on `GET /`, then `Access-Control-Allow-Origin` echoes that origin and `Access-Control-Allow-Credentials` is `true` (verified); a preflight to `/api/cart` also returns `Access-Control-Allow-Credentials: true` (verified).
3. Given `CORS_ORIGINS` is unset, then the allowed origins default to `["*"]` (`backend/config.py:21`), and `allow_credentials=True` is set (`backend/main.py:33`).
4. The open CORS policy matches the stated QA intent (`documents/Product_Requirement_Doc.md:280`: "CORS open for testing environments").

**Evidence**: `backend/main.py:30-36`, `:38-46`, `backend/config.py:21`, `render.yaml:16-17`.
**Notes**: Status is Done because the openness is documented intent. Reflecting any origin together with credentials is a hardening question for the owner, not a finding here. HSTS is sent over plain HTTP too (the code comment says browsers ignore it there, `main.py:38-40`).

---

### US-PLT-005-API · JWT signing secret is a committed default
**As a** QA engineer **I want** the token signing key to come from the deployment, not from the repository **so that** tokens cannot be forged from public source.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap; default from 38b8848, 2026-02-07)

**Acceptance criteria**
1. Expected: `secret_key` is supplied by the environment in production. Actual: `backend/config.py:16` defaults it to the literal `omnipizza-super-secret-key-for-testing-only`.
2. Actual: `render.yaml:13-18` sets `ENVIRONMENT`, `CORS_ORIGINS` and `PYTHON_VERSION` only; `SECRET_KEY` has never appeared in `render.yaml` (git log -S).
3. Actual: no `.env` file is tracked (`git ls-files`), so the default is what runs on Render.
4. The signing and verification calls use this value (`backend/auth.py:48`, `:55`).

**Evidence**: as cited.
**Notes**: The project is a QA sandbox and the secret protects only sandbox tokens. Whether that is acceptable is an owner decision; the story records the state.

---

### US-PLT-006-API · Unhandled exceptions return internal exception text
**As a** QA engineer **I want** unexpected server errors to hide internal details **so that** stack and config fragments are not leaked to callers.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap; handler from 38b8848, 2026-02-07)

**Acceptance criteria**
1. Expected: an unhandled exception returns a generic error without exception text. Actual: the handler returns `detail: str(exc)` alongside `error: "Internal server error"` (`backend/main.py:86-95`).
2. Actual: the PRD documents this shape as the contract (`documents/Product_Requirement_Doc.md:196`), so the behaviour is intentional on paper.
3. Decision needed: keep `str(exc)` for QA diagnosis, or redact it outside sandbox environments.
4. The chaos persona `security_glitch_user` deliberately leaks simulated internal detail on checkout errors (`backend/constants.py:82-86`, `SECURITY_GLITCH_LEAK_MESSAGES`); that is a separate, intended leak.

**Evidence**: `backend/main.py:86-95`, `documents/Product_Requirement_Doc.md:196`, `backend/constants.py:82-86`.
**Notes**: The runtime path was not triggered in this pass (Unverified at runtime); the code is read directly.

---

### US-PLT-007-API · In-memory state resets on every restart
**As a** QA engineer **I want** the backend to start from a clean state on each deploy or restart **so that** chaos tests do not depend on leftovers.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 38b8848

**Acceptance criteria**
1. Given the process starts, then orders and sessions live in plain dictionaries on the `InMemoryDB` instance (`backend/database.py:85-90`).
2. Given the module loads, then one singleton `db = InMemoryDB()` is shared by all routers (`backend/database.py:366`).
3. Given a restart, then no state is recovered; there is no persistence layer in the repo.
4. Given Render, the blueprint comment states the same design (`render.yaml:69-70`) and the PRD lists it as non-functional (`documents/Product_Requirement_Doc.md:277`).

**Evidence**: as cited.
**Notes**: Render's free plan (`render.yaml:10`) may spin the service down; whether that resets state more often is Unverified. Multi-worker deployment would split state: the start command runs a single uvicorn process (`render.yaml:12`), and that is not changed here.

---

### US-PLT-008-API · Render backend blueprint
**As a** QA engineer **I want** the API service defined in a blueprint **so that** deploys are reproducible from the repo.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 4651cae

**Acceptance criteria**
1. Given the blueprint, then the `omnipizza-backend` web service uses Python, region `oregon`, plan `free`, installs `backend/requirements.txt`, and starts `uvicorn main:app` from `backend/` (`render.yaml:4-12`).
2. Given the service, then the health check is `/health` (`render.yaml:20`) and `autoDeploy: true` (`render.yaml:21`).
3. Given the environment, then `ENVIRONMENT=production`, `CORS_ORIGINS=["*"]` and `PYTHON_VERSION=3.11.0` (`render.yaml:13-19`).

**Evidence**: `render.yaml:4-21`, `backend/Dockerfile:1` (same Python minor).
**Notes**: The blueprint sets no branch, so which branch auto-deploys is Unverified. `requirements.txt` includes test tooling (`pytest`, `schemathesis`, `httpx`; lines 8-11), so the deployed image installs it. The mobile API origin is hard-coded to this service at `frontend-mobile/src/api/client.ts:27`.

---

### US-PLT-009-API · Docker Compose local stack
**As a** QA engineer **I want** the API and the web app to run locally with one command **so that** tests can run without Render.

- Layer: API · Epic: PLT · Persona: QA · Market: all (the stack also serves WEB; API layer chosen as the closest owner of the file)
- Status: Done
- Done on: 2026-02-07 · Commit: 4651cae; ports bound to loopback 2026-07-29 · Commit: 45413da

**Acceptance criteria**
1. Given `docker-compose up`, then the backend builds from `backend/` and listens on `127.0.0.1:8000` (`docker-compose.yml:4-10`).
2. Given the backend, then `CORS_ORIGINS=["http://localhost:3000"]` and `ENVIRONMENT=development` (`docker-compose.yml:11-13`).
3. Given the frontend, then it builds from `frontend/` and listens on `127.0.0.1:3000` (`docker-compose.yml:22-28`).
4. Given the frontend build, it uses `pnpm@10.29.1` and nginx (`frontend/Dockerfile:1-19`), and nginx proxies `/api` to `backend:8000` (`frontend/nginx.conf:12-13`).

**Evidence**: `docker-compose.yml:1-38`, `backend/Dockerfile:1-20`, `frontend/Dockerfile:1-19`, `frontend/nginx.conf:12-22`.
**Notes**: The backend healthcheck calls `curl` (`docker-compose.yml:14-15`) and the base image is `python:3.11-slim` (`backend/Dockerfile:1`), which does not install `curl`; the container health result is Unverified (no image built here). The Dockerfile's own HEALTHCHECK uses Python instead (`backend/Dockerfile:16-17`).

---

### US-PLT-010-WEB · Render static site with SPA and API rewrites
**As a** QA engineer **I want** the web app served from Render with the API proxied under `/api` **so that** the browser calls one origin.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-07 · Commit: 4651cae

**Acceptance criteria**
1. Given the static service, then it builds `frontend/` with `pnpm install --frozen-lockfile` and `pnpm build`, and publishes `frontend/dist` (`render.yaml:24-33`).
2. Given a request to `/api/*`, then it is rewritten to the backend (`render.yaml:37-40`).
3. Given any other path, then it is rewritten to `/index.html` so client routes resolve (`render.yaml:41-43`).
4. Given `VITE_API_URL`, then it is not set in the blueprint (`sync: false`, `render.yaml:34-36`), so the value must be set in the dashboard.

**Evidence**: `render.yaml:24-43`, `frontend/src/services/httpClient.js:5` (fallback `http://localhost:8000` when unset).
**Notes**: If `VITE_API_URL` is unset in the dashboard, the built app calls localhost; that is a deployment-time setting, not visible in the repo (Unverified for the live service).

---

### US-PLT-011-WEB · Enforced CSP, HSTS and frame headers on Render
**As a** QA engineer **I want** the deployed site to send a strict CSP, HSTS and frame restrictions **so that** injected scripts and framing are blocked.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-17 · Commit: 63a133a (CSP) and a943483 (HSTS); 2026-07-30 · Commit: 0ac97d4 (CSP `form-action`)

**Acceptance criteria**
1. Given a response, then `X-Frame-Options: DENY` is set (`render.yaml:45-47`).
2. Given a response, then `X-Content-Type-Options: nosniff` and `Strict-Transport-Security: max-age=63072000; includeSubDomains` are set (`render.yaml:48-53`).
3. Given a response, then the CSP sets `default-src 'self'`, `script-src 'self'`, `frame-ancestors 'none'` and `form-action 'self'` (`render.yaml:54-66`).
4. Given the CSP, then `connect-src` allows `'self'` and the backend origin, and `img-src` names the image hosts the app uses (`render.yaml:57-62`).

**Evidence**: `render.yaml:44-66`, `index.html:511-512` (landing page describes the same headers).
**Notes**: `style-src` allows `'unsafe-inline'` (`render.yaml:60`), a deliberate concession. Enforcement in a real browser was not run here (Unverified).

---

### US-PLT-012-WEB · Docker-served web app has no security headers
**As a** QA engineer **I want** the Docker-served web app to send the same headers as Render **so that** local runs test the same policy.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Found
- Done on: n/a (gap)

**Acceptance criteria**
1. Expected: the nginx server sends CSP, HSTS, `X-Frame-Options` and `nosniff`, as Render does.
2. Actual: `frontend/nginx.conf:1-28` has no `add_header` directive; it only serves static files, proxies `/api` and enables gzip.
3. Actual: the compose service exposes the nginx port on loopback (`docker-compose.yml:27-28`), so the Render policy is never exercised locally.

**Evidence**: `frontend/nginx.conf:1-28`, `docker-compose.yml:22-33`, `render.yaml:44-66`.
**Notes**: The Render CSP's `connect-src` names the production backend, which a local stack would not use anyway; any local policy would need its own origin list.

---

### US-PLT-013-WEB · GitHub Pages landing page
**As a** QA engineer **I want** a public landing page that links to the docs and the release downloads **so that** testers can find the platform entry points.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-22 · Commit: e28b8f1 (first landing page); last content sync d6749d4 (2026-07-29)

**Acceptance criteria**
1. Given the repository, then `index.html` at the root is the landing page (`index.html:6` title, `:62` heading).
2. Given the landing page, then it links to `/api/docs`, `/api/redoc` and `/api/openapi.json` on the production backend (`index.html:352`, `:361`, `:370`) and to GitHub Releases (`index.html:132-178`).
3. Given GitHub Pages (read via `gh api repos/gsanchezm/OmniPizza/pages`, 2026-10-28), then the build is `legacy`, source `main` path `/`, status `built`, HTTPS enforced.
4. Given a push to `main`, then Pages rebuilds from the root (follows from the configuration in AC 3; the build-on-push behaviour was not observed).

**Evidence**: `index.html:6`, `:62`, `:132-178`, `:352-370`; gh API output as above.
**Notes**: The landing page is not part of the Render build. Its claims about the product are a separate drift surface.

---

### US-PLT-014-WEB · Cypress component tests in CI (non-blocking)
**As a** QA engineer **I want** component tests to run on PRs that touch the web app **so that** UI regressions surface early without blocking merges.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457

**Acceptance criteria**
1. Given a pull request that changes `frontend/**` or the workflow file, then the Cypress job runs (`.github/workflows/frontend-component-tests.yml:3-7`).
2. Given the job, then `continue-on-error: true` makes its result non-blocking (`:14`).
3. Given the job, then it installs with `pnpm install --no-frozen-lockfile` (`:35`) and runs `pnpm test:ct` (`:38`), which is `cypress run --component` (`frontend/package.json:27`).
4. Given the suite, then 12 component specs exist under `frontend/cypress/component`.
5. Given `workflow_dispatch`, then the job can be started by hand (`:8`).

**Evidence**: as cited.
**Notes**: Not run in this pass (Unverified). `--no-frozen-lockfile` in CI means the lock file can drift during a run; that is noted, not changed.

---

### US-PLT-015-MOB · Mobile release pipeline (manual dispatch)
**As a** QA engineer **I want** Android and iOS-simulator artifacts built and attached to a GitHub Release on demand **so that** testers get a versioned build.

- Layer: MOB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-02-16 · Commit: c49c9ae (pipeline); manual-only from 2026-02-24 · Commit: b14c936; test-APK step removed 2026-07-29 · Commit: 141776a

**Acceptance criteria**
1. Given the workflow, then it runs only on `workflow_dispatch` with a required `version` input and an optional `release_notes` input (`.github/workflows/mobile-release.yml:3-12`).
2. Given the Android job, then it runs `expo prebuild --platform android --clean`, `gradlew assembleRelease`, renames the APK and uploads it (`:51`, `:61`, `:65`, `:67-72`).
3. Given the iOS job on `macos-latest`, then it prebuilds, runs `pod install`, runs `xcodebuild -sdk iphonesimulator`, zips the `.app` and uploads it (`:76`, `:101`, `:104`, `:106-113`, `:115-118`, `:120-124`).
4. Given the release job, then it creates the GitHub Release with `softprops/action-gh-release@v2`, tag from `version`, generated notes, and the APK and simulator zip as assets (`:145-153`).
5. Given the repository, then `frontend-mobile/android` and `frontend-mobile/ios` are not tracked (`git ls-files` returns nothing), so both are generated in CI.

**Evidence**: as cited.
**Notes**: No in-repo mobile e2e runner; the external harness drives these builds (see US-ATM-013-MOB). The `androidTest` APK step was removed with the Detox scaffolding (141776a).

---

### US-PLT-016-MOB · iOS build is simulator-only
**As a** QA engineer **I want** iOS produced only as a simulator `.app` **so that** no App Store or device build is implied by the pipeline.

- Layer: MOB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-09 · Commit: 03bfb17 (decision documented); simulator build since 2026-02-16 · Commit: c49c9ae

**Acceptance criteria**
1. Given the iOS job, then the build uses `-sdk iphonesimulator` (`.github/workflows/mobile-release.yml:112`) and the artifact is a zipped `.app` (`:117-118`).
2. Given the repository, then no `.ipa`, TestFlight or App Store step exists in any workflow (grep).
3. Given the README, then it states the iOS build targets the simulator and cannot install on a device without a distribution certificate (`README.md:25`).
4. Given the mobile automation doc, then iOS is "simulator-only by design" and "there is no `.ipa`" (`ATOMIC_MOBILE_TESTING.md:9-10`).

**Evidence**: as cited.
**Notes**: The decision is recorded in docs (03bfb17); no decision record file exists beyond those lines.

---

### US-PLT-017-MOB · Android backup disabled and minSdk 29
**As a** QA engineer **I want** Android app data excluded from cloud and device backups, and a minimum API level of 29 **so that** user data is not copied out and older devices are excluded.

- Layer: MOB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-17 · Commit: c773043

**Acceptance criteria**
1. Given `frontend-mobile/app.json`, then `android.allowBackup` is `false` (`:21`).
2. Given the same file, then the `expo-build-properties` plugin sets `minSdkVersion` to 29 (`:30-38`, value at `:35`).
3. Given the build, then the minimum is enforced at prebuild, not by a committed `android/` project.

**Evidence**: `frontend-mobile/app.json:15-22`, `:30-38`.
**Notes**: Devices below API 29 cannot install the APK. The mobile version is `1.1.8` (`app.json:6`), matching the latest release (US-PLT-018-MOB).

---

### US-PLT-018-MOB · Release history
**As a** QA engineer **I want** a dated list of published versions **so that** a test run can name the build it used.

- Layer: MOB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-04-07 (v1.0.0 first release) · Commit: n/a (GitHub Releases)

**Acceptance criteria**
1. Given `gh release list --limit 30` (read-only, 2026-10-28), then 18 releases exist, from v1.0.0 to v1.1.8 (table below).
2. Given the list, then v1.1.8 is marked `Latest`.
3. Given `frontend-mobile/app.json:6`, then the app version `1.1.8` matches the latest release.

| Release | Published (UTC) | Release | Published (UTC) |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-04-07 | v1.1.0 | 2026-07-09 |
| v1.0.1 | 2026-04-18 | v1.1.1 | 2026-07-10 |
| v1.0.2 | 2026-05-15 | v1.1.2 | 2026-07-14 |
| v1.0.3 | 2026-05-20 | v1.1.3 | 2026-07-14 |
| v1.0.4 | 2026-05-23 | v1.1.4 | 2026-07-17 |
| v1.0.5 | 2026-05-28 | v1.1.5 | 2026-07-18 |
| v1.0.6 | 2026-05-29 | v1.1.6 | 2026-07-20 |
| v1.0.7 | 2026-05-29 | v1.1.7 | 2026-07-21 |
| v1.0.8 | 2026-06-02 | v1.1.8 (Latest) | 2026-07-22 |

**Evidence**: `gh release list --limit 30` output (2026-10-28); `frontend-mobile/app.json:6`.
**Notes**: Dates are the `gh` published timestamps, shown in UTC. Mapping each release to its commit was not done (no `git tag`, by rule). The `1.0.x` line predates the Saudi market (`d7f4679`, 2026-07-09).

---

### US-PLT-019-UX · WCAG 1.4.3 contrast sweeps
**As a** low-vision customer **I want** text and labels to meet the minimum contrast **so that** I can read prices, labels and buttons.

- Layer: UX · Epic: PLT · Persona: Customer · Market: all (CH language toggle included)
- Status: Done
- Done on: 2026-07-17 · Commit: 8b3e7d6 (first pass)

**Acceptance criteria**
1. Given the catalog page, then its text was brought to WCAG 1.4.3 contrast and a page-level h1 was added (8b3e7d6, 2026-07-17).
2. Given brand-orange text and gray-500 labels on web, then a sweep corrected them app-wide (e6bfb9e, 2026-07-18).
3. Given the CH-only language toggle in the navbar, then its contrast gap was fixed (816c68c, 2026-07-18).
4. Given mobile, then the web fixes were mirrored (85afd81, 2026-07-18) and a gray-500-equivalent gap was closed (b8c82d0, 2026-07-20).
5. Given the checkout payment method in its inactive state, then the `opacity-60` compositing was accounted for (fd73b6d, 2026-07-20).

**Evidence**: commits 8b3e7d6, e6bfb9e, 816c68c, 85afd81, fd73b6d, b8c82d0 (by sha; ratios not re-measured here).
**Notes**: Contrast ratios are Unverified in this pass. The opacity case is why a sweep must compound ancestor opacity, not only read declared colours.

---

### US-PLT-020-UX · WCAG 4.1.2, 4.1.3 and 3.1.1 fixes
**As a** screen-reader customer **I want** controls to have names, status messages to be announced and the page language to be declared **so that** the app works with assistive technology.

- Layer: UX · Epic: PLT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-13 · Commit: cf8d2c9 (30 files, web and mobile)

**Acceptance criteria**
1. Given the document, then `<html lang="en">` is set in the base page (`frontend/index.html:2`) and the language follows the authenticated market at runtime (`frontend/src/App.jsx:31-32`).
2. Given a toast, then it is a `role="status"` live region with `aria-live="polite"` (`frontend/src/components/Toast.jsx:21-22`).
3. Given a login or checkout error, then it is a `role="alert"` with `aria-live="assertive"` (`frontend/src/pages/Login.jsx:225`, `frontend/src/pages/Checkout.jsx:374-375`).
4. Given mobile controls, then they carry a readable `accessibilityLabel` and the bottom navigation items are `accessibilityRole="tab"` (`frontend-mobile/src/utils/qa.ts:58-72`, `frontend-mobile/src/components/BottomNavBar.tsx:55-60`).

**Evidence**: as cited; commit cf8d2c9 stat (30 files).
**Notes**: Assistive-technology behaviour was not exercised (Unverified).

---

### US-PLT-021-UX · Heading order on Catalog and Order Success
**As a** screen-reader customer **I want** headings to follow a logical order **so that** I can navigate the page by heading.

- Layer: UX · Epic: PLT · Persona: Customer · Market: all
- Status: Done
- Done on: 2026-07-30 · Commit: 010815b

**Acceptance criteria**
1. Given the Order Success page, then the title is an `h1` (`frontend/src/pages/OrderSuccess.jsx:80`).
2. Given a catalog card, then the pizza name is an `h2` under the page heading (`frontend/src/components/ProductCard.jsx:36`).
3. Given the commit, then only those two files changed (010815b, 2 lines each).
4. Given every page, then no level is skipped (not audited end to end; Unverified).

**Evidence**: as cited.
**Notes**: The earlier page-level h1 for the catalog came in 8b3e7d6 (2026-07-17).

---

### US-PLT-022-API · Backend split into feature routers
**As a** QA engineer **I want** endpoints grouped by feature in separate routers **so that** changes stay local and the paths stay stable.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-12 · Commit: 31e447b

**Acceptance criteria**
1. Given `main.py`, then it imports and mounts the routers for auth, catalog, checkout, debug/chaos, meta and the test-state API (`backend/main.py:8-13`, `:48-53`).
2. Given `backend/routers/`, then it contains `auth.py`, `catalog.py`, `checkout.py`, `debug_chaos.py`, `meta.py` (added 2026-09-02) and `__init__.py`.
3. Given the state-injection API, then `backend/test_api.py` stays at the backend root as its own router.
4. Given a route moved between routers, the path is unchanged (checked by the golden net, US-PLT-023-API).

**Evidence**: as cited.
**Notes**: CLAUDE.md's router list omits `meta.py`. The split is a refactor, so no behaviour change is claimed beyond the golden net.

---

### US-PLT-023-API · Golden characterization net guards refactors
**As a** QA engineer **I want** pinned checkout totals and catalog behaviour per market **so that** refactors cannot change results silently.

- Layer: API · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-07-12 · Commit: e994fae (first net); later additions 36764df, 74fecc2, cebd983, bf90477, 3b715b9 (2026-07-19)

**Acceptance criteria**
1. Given `tests/golden.test.ts`, then totals per market are pinned to a ground-truth table (`tests/golden.test.ts:39-74`).
2. Given the net, then it covers multi-item carts, MX optional fields, catalog translation, cart enrichment and the chaos users (describe blocks at lines 76-565).
3. Given the plan, then the piece-one plan exists at `documents/plans/2026-07-12-backend-golden-net-piece1.md`.
4. Given a run, then the net needs a live backend (Unverified in this pass; see US-ATM-019-API).

**Evidence**: as cited.
**Notes**: Shared with ATM-019-API, which covers the suites as a QA capability.

---

### US-PLT-024-WEB · Feature-sliced web app
**As a** QA engineer **I want** each feature split into repositories and use-cases **so that** HTTP details and orchestration stay out of pages.

- Layer: WEB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457

**Acceptance criteria**
1. Given `frontend/src/features/`, then slices exist for auth, catalog, checkout, country, orderSuccess and profile.
2. Given a slice, then it has `repositories/` for endpoint calls and `useCases/` or `hooks/` for orchestration (for example `frontend/src/features/checkout/useCases/placeOrder.js`).
3. Given legacy callers, then compatibility hooks remain under `frontend/src/hooks/` (for example `usePizzas.js`).

**Evidence**: `frontend/src/features/*` (file list), `frontend/src/hooks/usePizzas.js`.
**Notes**: Migration is incremental (CLAUDE.md); some pages still call older hooks.

---

### US-PLT-024-MOB · Feature-sliced mobile app
**As a** QA engineer **I want** the same feature slices as the web app **so that** parity work maps one to one.

- Layer: MOB · Epic: PLT · Persona: QA · Market: all
- Status: Done
- Done on: 2026-03-10 · Commit: c50b457

**Acceptance criteria**
1. Given `frontend-mobile/src/features/`, then slices exist for auth, catalog, checkout, country, orderSuccess and profile.
2. Given a slice, then it has repositories and use-cases (for example `frontend-mobile/src/features/checkout/useCases/placeOrder.ts`).
3. Given legacy hooks, then `frontend-mobile/src/hooks/usePizzas.ts` and `useRTL.ts` remain.

**Evidence**: `frontend-mobile/src/features/*` (file list), `frontend-mobile/src/hooks/usePizzas.ts`.
**Notes**: Mirrors US-PLT-024-WEB; screens still call services directly in places (for example `CheckoutScreen.tsx:88` calls `cartService`).
