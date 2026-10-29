# Epic DOC — Documentation Sweep

After implementation, every project document is updated and checked against the code's actual values, not with a grep for stale phrases. The OpenAPI document describes each new endpoint and status code. Story statuses flip from Planned to Done with the commit and date that shipped them.

Layer convention: DOC-001 and DOC-003 span every layer, but the ID template needs one layer, so both are filed under API, the same suffix as DOC-002. Open: confirm this convention, or split the documentation work per layer.

Source: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Stories and documentation).

| ID | Title | Layer | Status |
|---|---|---|---|
| US-DOC-001-API | Documentation sweep: documents match the code | API | Planned |
| US-DOC-002-API | OpenAPI descriptions and status codes | API | Planned |
| US-DOC-003-API | Story statuses flip to Done | API | Planned |

---

### US-DOC-001-API · Documentation sweep: documents match the code

**As a** QA engineer **I want** every project document to describe accounts, coupons and the menu exactly as the code behaves **so that** readers and automation are not misled by stale values.

- Layer: API (cross-layer sweep, see Notes) · Epic: DOC · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Stories and documentation)

**Acceptance criteria**
1. Given `documents/Product_Requirement_Doc.md`, when it is checked, then its users (7 test users plus guest and profiled accounts), personas, markets, endpoints table, error contract and test ids match the code's values (20 pizzas, 6 drinks, 10 desserts, 15%, 30-minute token, 200-account cap).
2. Given `API_EXAMPLES.md`, when it is checked, then its examples for register, guest, logout, coupon validate, checkout with `coupon_code` and drink or dessert lines show the real response shapes and status codes, verified against a passing `tests/` run.
3. Given `ATOMIC_WEB_TESTING.md`, when it is checked, then the guest entry, the `/register` route, the coupon and catalog-tab ids and the lazy-route note are current.
4. Given `ATOMIC_MOBILE_TESTING.md`, when it is checked, then `omnipizza://register`, `omnipizza://catalog?section=drinks|desserts`, the new `testID`s and any universal params that apply are current.
5. Given `README.md`, `QUICKSTART.md` and `PROJECT_SUMMARY.md`, when they are checked, then their counts and feature lists match the code (7 test users plus guest and profiled accounts, 20 pizzas, 6 drinks, 10 desserts).
6. Given `CLAUDE.md`, when it is checked, then its layout, architecture (temporary registry, `sid` state, `item_type`), state notes and test-user description match the code.
7. Given `docs/app-built.md`, when it is checked, then it describes the shipped accounts, coupon and menu.
8. Given `documents/Design_Doc.md`, `documents/UI_Design_Doc.md` and `documents/Tech_Stack_Doc.md`, when they are checked, then the screens, state and stack they describe include the new flows.
9. Given `index.html` (the GitHub Pages landing page), when it is checked, then its menu counts and features match the app and it no longer says 12 pizzas.

**Notes**: One AC per document, as requested; this exceeds the usual 3–6 AC guideline on purpose. Depends on every API, WEB, MOB and UX story in the other epics being Done, because the design runs documentation after implementation. "Checked against the code's actual values" means reading the values from the code, not searching for stale phrases.

---

### US-DOC-002-API · OpenAPI descriptions and status codes

**As a** QA engineer **I want** the OpenAPI document at `/api/docs` to describe every new endpoint and status code **so that** automation can be written from the spec.

- Layer: API · Epic: DOC · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Stories and documentation; Decisions › Welcome coupon)

**Acceptance criteria**
1. Given the running backend, when `/api/docs` is opened, then each new endpoint (`POST /api/auth/register`, `POST /api/auth/guest`, `POST /api/auth/logout`, `GET /api/users/me/coupon`, `POST /api/coupons/validate`, `GET /api/drinks`, `GET /api/desserts`) has a summary and description.
2. Given each new endpoint, when its responses are read, then every status code it can return is documented (register 201, 409, 422, 429; validate 200, 400, 409; coupon GET 200, 404; logout codes as decided in US-REG-003-API), following the existing `response_docs.py` pattern.
3. Given an error response, when its schema is read, then HTTP errors show `{error, status_code, timestamp}` and body validation shows FastAPI's `{detail: [...]}`.
4. Given the schemas, when they are read, then `LoginResponse` documents `profile_type` (`test`, `guest`, `profiled`) and the optional `coupon`, `CartItem` documents `item_type` and `product_id`, `CheckoutRequest` documents `coupon_code`, and `OrderSummary` documents `discount` and `coupon_code`.

**Notes**: Depends on the API stories in REG, PROMO and MENU. The documentation follows the existing pattern in `backend/response_docs.py`.

---

### US-DOC-003-API · Story statuses flip to Done

**As a** QA engineer **I want** each story to point to the commit that delivered it **so that** every requirement can be traced to code.

- Layer: API (cross-layer process story, see Notes) · Epic: DOC · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Stories and documentation)

**Acceptance criteria**
1. Given a story that has shipped, when its status is updated, then its status line changes from `Planned` to `Done · <commit sha> · <YYYY-MM-DD>` and its row in the epic's summary table changes to match.
2. Given a story, when it is marked Done, then its acceptance criteria have been verified (by the `tests/` suite, the SSR/esbuild harness for web and mobile logic, or a manual check) and its documentation has been updated under US-DOC-001-API.
3. Given the final documentation sweep, when the stories are read, then none remains Planned unless it was explicitly deferred, with the reason written in its Notes.

**Notes**: GitHub issues are created only after review (design Constraints); these markdown stories come first. Filed under API by the same convention as US-DOC-001-API (see the Open in this epic's introduction).
