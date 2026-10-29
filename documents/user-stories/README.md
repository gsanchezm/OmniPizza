# OmniPizza — User Stories

Retroactive user stories for what OmniPizza already does, plus *Planned* stories for work that has not started, so the repository can double as a traceable project. Generated on 2026-10-28.

**280 stories** · 183 Done · 40 Found · 57 Planned

## How to read this

- **Epic** = a plain theme (Checkout, Orders, …). It has no layer.
- **User story** = one capability in one **layer**: `API`, `WEB`, `MOB` or `UX` (design: visual states, RTL, accessibility, copy). `ALL` marks the few cross-cutting documentation stories. A story exists only for a layer that really has behaviour.
- **ID** = `US-<EPIC>-<NNN>-<LAYER>`. Sibling layers of one capability share the number (`US-CHK-007-API`, `-WEB`, `-MOB`).
- **Persona** is a field: *Customer* (the pizza app) or *QA engineer* (testability features).
- **Status**: **Done** = verified in the code at the time of writing; **Found** = a gap or inconsistency that exists today and is not fixed; **Planned** = designed but not started.
- **Evidence**: every acceptance criterion cites `path:line` or a commit sha. Line numbers are as of branch `US-and-Improvements` (which includes `origin/main`); they drift as code changes, so prefer the commit sha when in doubt.
- Stories are written in English. GitHub issues are created from these files only after review.

## Epics

| Epic | Theme | Stories | Done | Found | Planned | Layers |
|---|---|--:|--:|--:|--:|---|
| [AUTH](AUTH-authentication-sessions.md) | Authentication & Sessions | 24 | 22 | 2 |  | API 7, WEB 7, MOB 7, UX 3 |
| [MKT](MKT-markets-localization.md) | Markets, Localization & Currency | 13 | 11 | 2 |  | API 4, WEB 3, MOB 3, UX 3 |
| [CAT](CAT-catalog.md) | Catalog | 19 | 15 | 4 |  | API 5, WEB 6, MOB 6, UX 2 |
| [CART](CART-cart.md) | Customization & Cart | 27 | 23 | 4 |  | API 6, WEB 11, MOB 8, UX 2 |
| [CHK](CHK-checkout.md) | Checkout & Pricing | 36 | 27 | 9 |  | API 11, WEB 11, MOB 12, UX 2 |
| [ORD](ORD-orders.md) | Orders | 15 | 11 | 4 |  | API 6, WEB 5, MOB 4 |
| [PRF](PRF-profile.md) | Profile | 18 | 13 | 5 |  | API 3, WEB 7, MOB 7, UX 1 |
| [PER](PER-test-personas-chaos.md) | Test Personas & Chaos | 15 | 15 |  |  | API 9, WEB 3, MOB 3 |
| [ATM](ATM-atomic-entry.md) | Atomic Entry & Testability | 30 | 24 | 6 |  | API 11, WEB 7, MOB 11, UX 1 |
| [PLT](PLT-platform-delivery-hardening.md) | Platform, Delivery & Hardening | 26 | 22 | 4 |  | API 11, WEB 7, MOB 5, UX 3 |
| [REG](REG-accounts-guest.md) | Temporary Accounts & Guest | 21 |  |  | 21 | API 5, WEB 7, MOB 7, UX 2 |
| [PROMO](PROMO-welcome-coupon.md) | Welcome Coupon | 13 |  |  | 13 | API 5, WEB 4, MOB 4 |
| [MENU](MENU-menu-expansion.md) | Menu Expansion | 20 |  |  | 20 | API 5, WEB 5, MOB 5, UX 5 |
| [DOC](DOC-documentation-sweep.md) | Documentation Sweep | 3 |  |  | 3 | ALL 3 |

Stories per layer: API 88, WEB 83, MOB 82, UX 24, ALL 3.

## Found — gaps that exist today

Behaviour that is missing or inconsistent and has **not** been fixed. These are the candidates for the backlog.

| Story | Title | Layer |
|---|---|---|
| [US-AUTH-006-MOB](AUTH-authentication-sessions.md#us-auth-006-mob--mobile-user-list-is-static-and-login-waits-500-ms) | Mobile user list is static and login waits 500 ms | MOB |
| [US-AUTH-009-API](AUTH-authentication-sessions.md#us-auth-009-api--logout-does-not-revoke-the-token-server-side) | Logout does not revoke the token server-side | API |
| [US-MKT-004-API](MKT-markets-localization.md#us-mkt-004-api--x-language-defaults-differ-between-catalog-and-cart) | X-Language defaults differ between catalog and cart | API |
| [US-MKT-007-MOB](MKT-markets-localization.md#us-mkt-007-mob--currency-formatting-on-mobile-product-cards) | Currency formatting on mobile product cards | MOB |
| [US-CAT-005-WEB](CAT-catalog.md#us-cat-005-web--category-filter-offers-sides-with-no-pizzas) | Category filter offers Sides with no pizzas | WEB |
| [US-CAT-005-MOB](CAT-catalog.md#us-cat-005-mob--category-pills-offer-sides-with-no-pizzas) | Category pills offer Sides with no pizzas | MOB |
| [US-CAT-006-MOB](CAT-catalog.md#us-cat-006-mob--empty-state-with-no-reset-control) | Empty state with no reset control | MOB |
| [US-CAT-009-MOB](CAT-catalog.md#us-cat-009-mob--product-badges-on-mobile) | Product badges on mobile | MOB |
| [US-CART-008-API](CART-cart.md#us-cart-008-api--cart-api-accepts-configurations-the-builder-cannot-produce) | Cart API accepts configurations the builder cannot produce | API |
| [US-CART-011-MOB](CART-cart.md#us-cart-011-mob--change-quantity-on-mobile) | Change quantity on mobile | MOB |
| [US-CART-015-WEB](CART-cart.md#us-cart-015-web--checkout-line-controls-keyed-by-pizza-id) | Checkout line controls keyed by pizza id | WEB |
| [US-CART-019-MOB](CART-cart.md#us-cart-019-mob--mobile-has-no-cart-screen) | Mobile has no cart screen | MOB |
| [US-CHK-006-MOB](CHK-checkout.md#us-chk-006-mob--name-and-address-length-checks-on-mobile) | Name and address length checks on mobile | MOB |
| [US-CHK-009-WEB](CHK-checkout.md#us-chk-009-web--save-entered-details-to-the-profile-after-checkout) | Save entered details to the profile after checkout | WEB |
| [US-CHK-011-API](CHK-checkout.md#us-chk-011-api--unpriced-or-empty-checkouts-are-accepted) | Unpriced or empty checkouts are accepted | API |
| [US-CHK-012-API](CHK-checkout.md#us-chk-012-api--tip-taken-from-another-markets-tip-field) | Tip taken from another market's tip field | API |
| [US-CHK-013-API](CHK-checkout.md#us-chk-013-api--payment_method-is-accepted-but-not-recorded) | payment_method is accepted but not recorded | API |
| [US-CHK-014-API](CHK-checkout.md#us-chk-014-api--server-rounds-half-values-with-python-round) | Server rounds half-values with Python round() | API |
| [US-CHK-014-WEB](CHK-checkout.md#us-chk-014-web--web-total-can-differ-from-the-server-by-one-minor-unit) | Web total can differ from the server by one minor unit | WEB |
| [US-CHK-014-MOB](CHK-checkout.md#us-chk-014-mob--mobile-total-can-differ-from-the-server-by-one-minor-unit) | Mobile total can differ from the server by one minor unit | MOB |
| [US-CHK-015-UX](CHK-checkout.md#us-chk-015-ux--confirm-dialog-does-not-keep-tab-focus-inside) | Confirm dialog does not keep Tab focus inside | UX |
| [US-ORD-009-WEB](ORD-orders.md#us-ord-009-web--order-details-list-shows-placeholder-rows-and-wrong-currency) | Order details list shows placeholder rows and wrong currency | WEB |
| [US-ORD-010-API](ORD-orders.md#us-ord-010-api--order-history-rows-are-not-ordersummary) | Order history rows are not OrderSummary | API |
| [US-ORD-011-WEB](ORD-orders.md#us-ord-011-web--orderid-shows-no-error-state-for-403-or-404) | `?orderId=` shows no error state for 403 or 404 | WEB |
| [US-ORD-011-MOB](ORD-orders.md#us-ord-011-mob--orderid-deep-link-shows-no-error-state-for-403-or-404) | `orderId` deep link shows no error state for 403 or 404 | MOB |
| [US-PRF-002-API](PRF-profile.md#us-prf-002-api--birthday-is-stored-as-free-text) | Birthday is stored as free text | API |
| [US-PRF-003-WEB](PRF-profile.md#us-prf-003-web--cancel-leaves-the-profile-without-saving) | Cancel leaves the profile without saving | WEB |
| [US-PRF-007-WEB](PRF-profile.md#us-prf-007-web--profile-header-shows-fixed-sample-data) | Profile header shows fixed sample data | WEB |
| [US-PRF-007-MOB](PRF-profile.md#us-prf-007-mob--profile-header-shows-fixed-sample-data) | Profile header shows fixed sample data | MOB |
| [US-PRF-008-MOB](PRF-profile.md#us-prf-008-mob--logout-does-not-clear-my-in-memory-profile) | Logout does not clear my in-memory profile | MOB |
| [US-ATM-004-API](ATM-atomic-entry.md#us-atm-004-api--get-apicart-silently-drops-unknown-pizzas) | `GET /api/cart` silently drops unknown pizzas | API |
| [US-ATM-012-WEB](ATM-atomic-entry.md#us-atm-012-web--documented-web-automation-hooks-match-the-code) | Documented web automation hooks match the code | WEB |
| [US-ATM-012-MOB](ATM-atomic-entry.md#us-atm-012-mob--documented-mobile-test-id-prefixes-match-the-code) | Documented mobile test-id prefixes match the code | MOB |
| [US-ATM-016-API](ATM-atomic-entry.md#us-atm-016-api--x-language-is-documented-as-required-but-is-optional) | `X-Language` is documented as required but is optional | API |
| [US-ATM-017-API](ATM-atomic-entry.md#us-atm-017-api--error-body-shapes-are-not-uniform-unknown-route-404-undocumented) | Error body shapes are not uniform; unknown-route 404 undocumented | API |
| [US-ATM-020-API](ATM-atomic-entry.md#us-atm-020-api--legacy-schemathesis-contract-test-does-not-match-its-pins) | Legacy Schemathesis contract test does not match its pins | API |
| [US-PLT-002-API](PLT-platform-delivery-hardening.md#us-plt-002-api--prometheus-counters-are-defined-but-never-recorded) | Prometheus counters are defined but never recorded | API |
| [US-PLT-005-API](PLT-platform-delivery-hardening.md#us-plt-005-api--jwt-signing-secret-is-a-committed-default) | JWT signing secret is a committed default | API |
| [US-PLT-006-API](PLT-platform-delivery-hardening.md#us-plt-006-api--unhandled-exceptions-return-internal-exception-text) | Unhandled exceptions return internal exception text | API |
| [US-PLT-012-WEB](PLT-platform-delivery-hardening.md#us-plt-012-web--docker-served-web-app-has-no-security-headers) | Docker-served web app has no security headers | WEB |

## Planned — not started

Designed in `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md`; nothing is implemented yet.

| Story | Title | Layer |
|---|---|---|
| [US-REG-001-API](REG-accounts-guest.md#us-reg-001-api--register-a-temporary-account) | Register a temporary account | API |
| [US-REG-001-WEB](REG-accounts-guest.md#us-reg-001-web--register-a-temporary-account) | Register a temporary account | WEB |
| [US-REG-001-MOB](REG-accounts-guest.md#us-reg-001-mob--register-a-temporary-account) | Register a temporary account | MOB |
| [US-REG-001-UX](REG-accounts-guest.md#us-reg-001-ux--registration-screen-design) | Registration screen design | UX |
| [US-REG-002-API](REG-accounts-guest.md#us-reg-002-api--continue-as-guest) | Continue as guest | API |
| [US-REG-002-WEB](REG-accounts-guest.md#us-reg-002-web--continue-as-guest) | Continue as guest | WEB |
| [US-REG-002-MOB](REG-accounts-guest.md#us-reg-002-mob--continue-as-guest) | Continue as guest | MOB |
| [US-REG-003-API](REG-accounts-guest.md#us-reg-003-api--temporary-account-lifetime-logout-and-expiry) | Temporary account lifetime: logout and expiry | API |
| [US-REG-003-WEB](REG-accounts-guest.md#us-reg-003-web--logout-deletes-the-temporary-account) | Logout deletes the temporary account | WEB |
| [US-REG-003-MOB](REG-accounts-guest.md#us-reg-003-mob--logout-deletes-the-temporary-account) | Logout deletes the temporary account | MOB |
| [US-REG-004-API](REG-accounts-guest.md#us-reg-004-api--reserved-and-duplicate-usernames-200-account-cap) | Reserved and duplicate usernames, 200-account cap | API |
| [US-REG-004-WEB](REG-accounts-guest.md#us-reg-004-web--registration-error-mapping-web) | Registration error mapping (web) | WEB |
| [US-REG-004-MOB](REG-accounts-guest.md#us-reg-004-mob--registration-error-mapping-mobile) | Registration error mapping (mobile) | MOB |
| [US-REG-005-API](REG-accounts-guest.md#us-reg-005-api--profile_type-in-login-responses) | profile_type in login responses | API |
| [US-REG-005-WEB](REG-accounts-guest.md#us-reg-005-web--guest-vs-profiled-profile-web) | Guest vs profiled Profile (web) | WEB |
| [US-REG-005-MOB](REG-accounts-guest.md#us-reg-005-mob--guest-vs-profiled-profile-mobile) | Guest vs profiled Profile (mobile) | MOB |
| [US-REG-006-UX](REG-accounts-guest.md#us-reg-006-ux--registration-language-follows-the-selected-market) | Registration language follows the selected market | UX |
| [US-REG-006-WEB](REG-accounts-guest.md#us-reg-006-web--registration-language-follows-the-selected-market-web) | Registration language follows the selected market (web) | WEB |
| [US-REG-006-MOB](REG-accounts-guest.md#us-reg-006-mob--registration-language-follows-the-selected-market-mobile) | Registration language follows the selected market (mobile) | MOB |
| [US-REG-007-WEB](REG-accounts-guest.md#us-reg-007-web--login-entry-points-and-harness-compatibility-web) | Login entry points and harness compatibility (web) | WEB |
| [US-REG-007-MOB](REG-accounts-guest.md#us-reg-007-mob--login-entry-points-and-harness-compatibility-mobile) | Login entry points and harness compatibility (mobile) | MOB |
| [US-PROMO-001-API](PROMO-welcome-coupon.md#us-promo-001-api--welcome-coupon-issued-at-registration) | Welcome coupon issued at registration | API |
| [US-PROMO-001-WEB](PROMO-welcome-coupon.md#us-promo-001-web--coupon-shown-after-registration-and-in-profile) | Coupon shown after registration and in Profile | WEB |
| [US-PROMO-001-MOB](PROMO-welcome-coupon.md#us-promo-001-mob--coupon-shown-after-registration-and-in-profile) | Coupon shown after registration and in Profile | MOB |
| [US-PROMO-002-API](PROMO-welcome-coupon.md#us-promo-002-api--coupon-preview-with-post-apicouponsvalidate) | Coupon preview with POST /api/coupons/validate | API |
| [US-PROMO-002-WEB](PROMO-welcome-coupon.md#us-promo-002-web--coupon-field-at-checkout-web) | Coupon field at checkout (web) | WEB |
| [US-PROMO-002-MOB](PROMO-welcome-coupon.md#us-promo-002-mob--coupon-field-at-checkout-mobile) | Coupon field at checkout (mobile) | MOB |
| [US-PROMO-003-API](PROMO-welcome-coupon.md#us-promo-003-api--discount-math-and-rounding-per-market) | Discount math and rounding per market | API |
| [US-PROMO-003-WEB](PROMO-welcome-coupon.md#us-promo-003-web--discount-line-in-summary-and-order-success-web) | Discount line in summary and order success (web) | WEB |
| [US-PROMO-003-MOB](PROMO-welcome-coupon.md#us-promo-003-mob--discount-line-in-summary-and-order-success-mobile) | Discount line in summary and order success (mobile) | MOB |
| [US-PROMO-004-API](PROMO-welcome-coupon.md#us-promo-004-api--single-use-coupon-lifetime) | Single-use coupon lifetime | API |
| [US-PROMO-005-API](PROMO-welcome-coupon.md#us-promo-005-api--negative-coupon-flows) | Negative coupon flows | API |
| [US-PROMO-005-WEB](PROMO-welcome-coupon.md#us-promo-005-web--coupon-error-handling-web) | Coupon error handling (web) | WEB |
| [US-PROMO-005-MOB](PROMO-welcome-coupon.md#us-promo-005-mob--coupon-error-handling-mobile) | Coupon error handling (mobile) | MOB |
| [US-MENU-001-API](MENU-menu-expansion.md#us-menu-001-api--pizza-catalog-grows-from-12-to-20) | Pizza catalog grows from 12 to 20 | API |
| [US-MENU-001-UX](MENU-menu-expansion.md#us-menu-001-ux--translations-and-images-for-the-new-pizzas) | Translations and images for the new pizzas | UX |
| [US-MENU-002-API](MENU-menu-expansion.md#us-menu-002-api--drinks-catalog-get-apidrinks) | Drinks catalog: GET /api/drinks | API |
| [US-MENU-002-WEB](MENU-menu-expansion.md#us-menu-002-web--drinks-on-the-catalog-web) | Drinks on the catalog (web) | WEB |
| [US-MENU-002-MOB](MENU-menu-expansion.md#us-menu-002-mob--drinks-on-the-catalog-mobile) | Drinks on the catalog (mobile) | MOB |
| [US-MENU-002-UX](MENU-menu-expansion.md#us-menu-002-ux--drink-copy-images-and-states) | Drink copy, images and states | UX |
| [US-MENU-003-API](MENU-menu-expansion.md#us-menu-003-api--desserts-catalog-get-apidesserts) | Desserts catalog: GET /api/desserts | API |
| [US-MENU-003-WEB](MENU-menu-expansion.md#us-menu-003-web--desserts-on-the-catalog-web) | Desserts on the catalog (web) | WEB |
| [US-MENU-003-MOB](MENU-menu-expansion.md#us-menu-003-mob--desserts-on-the-catalog-mobile) | Desserts on the catalog (mobile) | MOB |
| [US-MENU-003-UX](MENU-menu-expansion.md#us-menu-003-ux--dessert-copy-images-and-states) | Dessert copy, images and states | UX |
| [US-MENU-004-API](MENU-menu-expansion.md#us-menu-004-api--mixed-cart-and-checkout) | Mixed cart and checkout | API |
| [US-MENU-004-WEB](MENU-menu-expansion.md#us-menu-004-web--mixed-cart-and-checkout-web) | Mixed cart and checkout (web) | WEB |
| [US-MENU-004-MOB](MENU-menu-expansion.md#us-menu-004-mob--mixed-cart-and-checkout-mobile) | Mixed cart and checkout (mobile) | MOB |
| [US-MENU-005-WEB](MENU-menu-expansion.md#us-menu-005-web--catalog-tabs-pizzas-drinks-desserts-web) | Catalog tabs: Pizzas, Drinks, Desserts (web) | WEB |
| [US-MENU-005-MOB](MENU-menu-expansion.md#us-menu-005-mob--catalog-tabs-and-section-deep-link-mobile) | Catalog tabs and section deep link (mobile) | MOB |
| [US-MENU-005-UX](MENU-menu-expansion.md#us-menu-005-ux--tab-layout-copy-and-states) | Tab layout, copy and states | UX |
| [US-MENU-006-API](MENU-menu-expansion.md#us-menu-006-api--chaos-personas-apply-to-new-items) | Chaos personas apply to new items | API |
| [US-MENU-007-UX](MENU-menu-expansion.md#us-menu-007-ux--image-sourcing-brand-free-review-and-credits) | Image sourcing, brand-free review and credits | UX |
| [US-MENU-008-WEB](MENU-menu-expansion.md#us-menu-008-web--stable-test-ids-on-new-web-screens-and-controls) | Stable test ids on new web screens and controls | WEB |
| [US-MENU-008-MOB](MENU-menu-expansion.md#us-menu-008-mob--stable-test-ids-on-new-mobile-screens-and-controls) | Stable test ids on new mobile screens and controls | MOB |
| [US-DOC-001-ALL](DOC-documentation-sweep.md#us-doc-001-all--documentation-sweep-documents-match-the-code) | Documentation sweep: documents match the code | ALL |
| [US-DOC-002-ALL](DOC-documentation-sweep.md#us-doc-002-all--openapi-descriptions-and-status-codes) | OpenAPI descriptions and status codes | ALL |
| [US-DOC-003-ALL](DOC-documentation-sweep.md#us-doc-003-all--story-statuses-flip-to-done) | Story statuses flip to Done | ALL |

