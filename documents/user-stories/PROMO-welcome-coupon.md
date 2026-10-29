# Epic PROMO — Welcome Coupon

A profiled (temporary) account receives one 15% coupon, valid on its first order only. The coupon is consumed when the order is created, is not restored when that order is cancelled, and never stacks with another coupon. The discount applies the same way in all 5 markets (currency and decimals differ); delivery is never discounted. Guests and test users cannot use a coupon.

Source: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md`.

| ID | Title | Layer | Status |
|---|---|---|---|
| US-PROMO-001-API | Welcome coupon issued at registration | API | Planned |
| US-PROMO-001-WEB | Coupon shown after registration and in Profile | WEB | Planned |
| US-PROMO-001-MOB | Coupon shown after registration and in Profile | MOB | Planned |
| US-PROMO-002-API | Coupon preview with POST /api/coupons/validate | API | Planned |
| US-PROMO-002-WEB | Coupon field at checkout | WEB | Planned |
| US-PROMO-002-MOB | Coupon field at checkout | MOB | Planned |
| US-PROMO-003-API | Discount math and rounding per market | API | Planned |
| US-PROMO-003-WEB | Discount line in summary and order success | WEB | Planned |
| US-PROMO-003-MOB | Discount line in summary and order success | MOB | Planned |
| US-PROMO-004-API | First-purchase-only rule | API | Planned |
| US-PROMO-005-API | Negative coupon flows | API | Planned |
| US-PROMO-005-WEB | Coupon error handling | WEB | Planned |
| US-PROMO-005-MOB | Coupon error handling | MOB | Planned |

---

### US-PROMO-001-API · Welcome coupon issued at registration

**As a** customer **I want** a 15% welcome coupon when I register **so that** my first order gets a discount.

- Layer: API · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon)

**Acceptance criteria**
1. Given a successful registration, when the register response is read, then its `coupon` has `percent` 15 and a code of the form `WELCOME15-XXXXXX`.
2. Given a profiled token, when `GET /api/users/me/coupon` is called, then the response is **200** with the same code and `percent` 15.
3. Given a guest token, when `GET /api/users/me/coupon` is called, then the response is **404**.
4. Given a test-user token, when `GET /api/users/me/coupon` is called, then the response is **404**.

**Notes**: Depends on US-REG-001-API. Coupon code generation (including the alphabet of the six-character suffix) is left to the builder. Open: the fields of the `coupon` object beyond `percent` and the code, and what `GET /api/users/me/coupon` returns after the coupon is used (200 with a used state, or 404).

---

### US-PROMO-001-WEB · Coupon shown after registration and in Profile

**As a** customer **I want** to see my welcome coupon right after I register and later in my Profile **so that** I know what I can use.

- Layer: WEB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given a profiled customer who just registered, when the coupon banner appears, then it shows the code and 15% from the register response, with no extra call.
2. Given a profiled customer, when Profile loads, then the code and 15% appear in a coupon section with a stable `data-testid`.
3. Given a guest or a test user, when Profile loads, then no coupon section is shown and no error is displayed for the 404 from `GET /api/users/me/coupon`.

**Notes**: Depends on US-PROMO-001-API, US-REG-001-WEB and US-REG-005-WEB. Coupon copy: see the UX Open in US-REG-001-UX.

---

### US-PROMO-001-MOB · Coupon shown after registration and in Profile

**As a** customer **I want** to see my welcome coupon on my phone right after I register and later in my Profile **so that** I know what I can use.

- Layer: MOB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given a profiled customer who just registered, when the coupon banner appears, then it shows the code and 15% from the register response, with no extra call.
2. Given a profiled customer, when the Profile screen opens, then the code and 15% appear in a section with a `text-` `testID`.
3. Given a guest or a test user, when the Profile screen opens, then no coupon section is shown and no error is displayed for the 404.

**Notes**: Depends on US-PROMO-001-API, US-REG-001-MOB and US-REG-005-MOB.

---

### US-PROMO-002-API · Coupon preview with POST /api/coupons/validate

**As a** customer **I want** to check my coupon before I place the order **so that** I see the discount first.

- Layer: API · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon)

**Acceptance criteria**
1. Given a profiled customer with an unused coupon and no order yet, when `POST /api/coupons/validate` is called with `{code}`, then the response is **200** with `{valid: true, percent: 15}`.
2. Given a validate call, when it is repeated or followed by checkout, then no coupon state changes; validate never consumes the coupon.
3. Given an unknown code or another account's code, when it is validated, then the response is **400** with the message `Invalid coupon code` (the same answer for both, so codes cannot be probed).
4. Given a coupon that is already used or no longer valid, when it is validated, then the response is **409**.
5. Given a guest or a test user sending any code, when it is validated, then the response is **400**.

**Notes**: Depends on US-PROMO-001-API. Open: whether validate can answer **200** with `valid: false` for an unusable code, or only uses **400** and **409**; the `{valid, percent}` shape suggests the former, while the rules above suggest the latter.

---

### US-PROMO-002-WEB · Coupon field at checkout (web)

**As a** customer **I want** a coupon field on the checkout page **so that** I can apply my welcome coupon before I pay.

- Layer: WEB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Checkout page, when it renders, then a labelled coupon input and an apply action (stable `data-testid`s) appear in the checkout form.
2. Given a valid code, when I apply it, then `POST /api/coupons/validate` is called and the field shows the 15% as accepted; the client computes no discount itself.
3. Given the API answers **400**, when I apply a code, then the localized "invalid coupon code" message shows under the field; given **409**, then the localized "already used or no longer valid" message shows.
4. Given I place an order with an accepted code, when the checkout request is sent, then it carries `coupon_code`.

**Notes**: Depends on US-PROMO-002-API and US-PROMO-003-API. Open: how checkout previews the discounted total without client-side math, since validate returns only `valid` and `percent` and the design defines no preview-totals call. Open: whether the coupon field is shown to guests and test users (who get **400** for any code) or hidden for them. Coupon copy: see the UX Open in US-REG-001-UX.

---

### US-PROMO-002-MOB · Coupon field at checkout (mobile)

**As a** customer **I want** a coupon field on the checkout screen **so that** I can apply my welcome coupon before I pay on my phone.

- Layer: MOB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Checkout screen, when it renders, then a labelled `input-` coupon field and an apply `btn-` action appear in the checkout form.
2. Given a valid code, when I apply it, then `POST /api/coupons/validate` is called and the screen shows the 15% as accepted; the app computes no discount itself.
3. Given the API answers **400**, when I apply a code, then the localized invalid-code message shows under the field; given **409**, then the localized used or no-longer-valid message shows.
4. Given I place an order with an accepted code, when the checkout request is sent, then it carries `coupon_code`.

**Notes**: Depends on US-PROMO-002-API and US-PROMO-003-API. Same open questions as US-PROMO-002-WEB (totals preview, visibility for guests and test users).

---

### US-PROMO-003-API · Discount math and rounding per market

**As a** QA engineer **I want** one exact discount formula **so that** totals can be asserted to the cent in every market.

- Layer: API · Epic: PROMO · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon)

**Acceptance criteria**
1. Given a subtotal S and an accepted coupon, when the order is created, then `discount = round(S × 15%)` using the market's existing decimal places (0 for JPY); for example, a USD subtotal of 10.01 gives a discount of 1.50.
2. Given an accepted coupon, when totals are computed, then tax and tip are computed on `S − discount`, delivery is added unchanged, and `total = (S − discount) + delivery + tax + tip`.
3. Given no coupon, when an order is created, then every existing number (subtotal, delivery, tax, tip, total) is unchanged.
4. Given any order, when `OrderSummary` is returned, then `subtotal` is still the pre-discount items subtotal, `discount` is `0.0` without a coupon, and `coupon_code` is `null` without a coupon.
5. Given the 5 markets (MX, US, CH, JP, SA), when the same order is priced, then only currency, decimal places and tip field differ; the formula is one code path.

**Notes**: Depends on US-MENU-004-API: the design lands the totals change after the menu backend merges, because both touch pricing. Golden-test coverage of the no-coupon numbers (AC 3) is the regression guard. Left to the builder: module structure and models.

---

### US-PROMO-003-WEB · Discount line in summary and order success (web)

**As a** customer **I want** the discount shown in my order summary and on the success page **so that** I can see what I saved.

- Layer: WEB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given a coupon applied at checkout, when the order summary renders, then a discount line shows the amount in the market currency and the coupon code, with a stable `data-testid`.
2. Given an order is placed with a coupon, when the order success page renders, then it shows the discount and coupon code from `OrderSummary`.
3. Given no coupon, when the order success page renders, then no coupon code appears and the totals match today's.

**Notes**: Depends on US-PROMO-003-API and US-PROMO-002-WEB. Server-side totals before placing: see the Open in US-PROMO-002-WEB.

---

### US-PROMO-003-MOB · Discount line in summary and order success (mobile)

**As a** customer **I want** the discount shown in my order summary and on the success screen **so that** I can see what I saved.

- Layer: MOB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given a coupon applied at checkout, when the summary renders, then a discount line shows the amount in the market currency and the coupon code, with a `text-` `testID`.
2. Given an order is placed with a coupon, when the Order Success screen renders, then it shows the discount and coupon code from `OrderSummary`.
3. Given no coupon, when the Order Success screen renders, then no coupon code appears and the totals match today's.

**Notes**: Depends on US-PROMO-003-API and US-PROMO-002-MOB. Same open question as US-PROMO-003-WEB about server-side totals before placing.

---

### US-PROMO-004-API · First-purchase-only rule

**As a** customer **I want** my welcome coupon to apply to my first order only **so that** it cannot be reused or stacked.

- Layer: API · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Calls the designer made)

**Acceptance criteria**
1. Given an unused coupon, when the account's first order is created with it, then the discount applies and the coupon is consumed at creation.
2. Given a consumed coupon, when a later order or a validate call uses it, then the response is **409**.
3. Given the account's first order is placed without the coupon, when the coupon is later validated or sent at checkout, then the response is **409** (no longer valid).
4. Given a consumed coupon, when the order that used it is cancelled through `PATCH /api/orders/{order_id}`, then the coupon stays consumed and reuse returns **409**.

**Notes**: Designer's call (owner to confirm): "first purchase" means the account's first order; the coupon is consumed when that order is created; a first order placed without it makes the coupon invalid. Open: whether a first order that was later cancelled still counts as "placed without it".

---

### US-PROMO-005-API · Negative coupon flows

**As a** QA engineer **I want** every invalid coupon path to answer a documented status **so that** automation can assert each one.

- Layer: API · Epic: PROMO · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon)

**Acceptance criteria**
1. Given an unknown code, when it is sent to validate or to checkout, then the response is **400** with the message `Invalid coupon code`.
2. Given another account's code, when it is sent to validate or to checkout, then the response is the same **400** and message.
3. Given a used or no-longer-valid code, when it is sent to validate or to checkout, then the response is **409**.
4. Given a guest or a test user sending any code, when it is sent, then the response is **400**.
5. Given checkout fails with a coupon attached (for example a **422** body error, or the random failure described in the design), when the failure happens, then the coupon is not consumed and a retry with the same code succeeds.

**Notes**: Open: the design says a failed checkout "including the random 500 of `error_user`" consumes nothing, but `error_user` is a test user and any code from a test user gets **400**, so that path cannot carry a coupon. Confirm which failure path is meant for AC 5.

---

### US-PROMO-005-WEB · Coupon error handling (web)

**As a** customer **I want** a clear message when my coupon cannot be used **so that** I know why the order did not go through.

- Layer: WEB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon)

**Acceptance criteria**
1. Given checkout answers **400** for the coupon, when I place the order, then the localized invalid-code message shows and no success page appears.
2. Given checkout answers **409** for the coupon, when I place the order, then the localized used or no-longer-valid message shows and no success page appears.
3. Given checkout fails for another reason (for example a **500**), when I place the order, then an error shows, no success page appears, and I can retry.

**Notes**: Depends on US-PROMO-005-API and US-PROMO-002-WEB. Exact copy is left to the builder.

---

### US-PROMO-005-MOB · Coupon error handling (mobile)

**As a** customer **I want** a clear message on my phone when my coupon cannot be used **so that** I know why the order did not go through.

- Layer: MOB · Epic: PROMO · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Welcome coupon)

**Acceptance criteria**
1. Given checkout answers **400** for the coupon, when I place the order, then the localized invalid-code message shows and the Order Success screen does not open.
2. Given checkout answers **409** for the coupon, when I place the order, then the localized used or no-longer-valid message shows and the Order Success screen does not open.
3. Given checkout fails for another reason, when I place the order, then an error shows, the Order Success screen does not open, and I can retry.

**Notes**: Depends on US-PROMO-005-API and US-PROMO-002-MOB.
