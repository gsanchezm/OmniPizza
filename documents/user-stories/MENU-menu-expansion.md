# Epic MENU — Menu Expansion

Pizzas grow from 12 to 20 (`p13`–`p20` added), and the menu gains 6 soft drinks (`dr01`–`dr06`) and 10 desserts (`ds01`–`ds10`). All 5 markets share one menu. Catalog prices are USD and convert per market as today. Drinks and desserts go into the same cart and checkout as pizzas through `item_type`. Images come from Wikimedia Commons, are reviewed by eye for logos, and are credited in a credits file.

Source: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md`. QA is a persona here, not a layer (US-MENU-005-MOB, US-MENU-007-UX, US-MENU-008-WEB and US-MENU-008-MOB use it).

| ID | Title | Layer | Status |
|---|---|---|---|
| US-MENU-001-API | Pizza catalog grows from 12 to 20 | API | Planned |
| US-MENU-001-UX | Translations and images for the new pizzas | UX | Planned |
| US-MENU-002-API | Drinks catalog: GET /api/drinks | API | Planned |
| US-MENU-002-WEB | Drinks on the catalog | WEB | Planned |
| US-MENU-002-MOB | Drinks on the catalog | MOB | Planned |
| US-MENU-002-UX | Drink copy, images and states | UX | Planned |
| US-MENU-003-API | Desserts catalog: GET /api/desserts | API | Planned |
| US-MENU-003-WEB | Desserts on the catalog | WEB | Planned |
| US-MENU-003-MOB | Desserts on the catalog | MOB | Planned |
| US-MENU-003-UX | Dessert copy, images and states | UX | Planned |
| US-MENU-004-API | Mixed cart and checkout | API | Planned |
| US-MENU-004-WEB | Mixed cart and checkout | WEB | Planned |
| US-MENU-004-MOB | Mixed cart and checkout | MOB | Planned |
| US-MENU-005-WEB | Catalog tabs: Pizzas, Drinks, Desserts | WEB | Planned |
| US-MENU-005-MOB | Catalog tabs and section deep link | MOB | Planned |
| US-MENU-005-UX | Tab layout, copy and states | UX | Planned |
| US-MENU-006-API | Chaos personas apply to new items | API | Planned |
| US-MENU-007-UX | Image sourcing, brand-free review and credits | UX | Planned |
| US-MENU-008-WEB | Stable test ids on new web screens and controls | WEB | Planned |
| US-MENU-008-MOB | Stable test ids on new mobile screens and controls | MOB | Planned |

---

### US-MENU-001-API · Pizza catalog grows from 12 to 20

**As a** customer **I want** twenty pizzas to choose from **so that** the menu has real variety.

- Layer: API · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given valid headers, when `GET /api/pizzas` is called in any market, then 20 pizzas are returned and the 12 existing pizzas keep their ids, prices and fields.
2. Given the 8 new pizzas (`p13`–`p20`: Meat Lovers, Buffalo Chicken, Mexicana, Pesto Chicken, Burrata, Truffle Mushroom, Mediterranean, Vegan Garden), when they are returned, then each has `base_price`, `category` (`popular`, `veggie` or `meat`), `image`, and `name` and `description` in en, es, de, fr, ja and ar.
3. Given the Arabic text of any new pizza, when it is read, then it mentions no pork and no alcohol, as today's pizzas do.

**Notes**: Pizza price points are left to the builder (the design gives ranges only for drinks and desserts). Open: does "no pork" also rule out pork ingredients such as pepperoni on Meat Lovers, or only pork wording in the Arabic copy?

---

### US-MENU-001-UX · Translations and images for the new pizzas

**As a** customer **I want** each new pizza to read naturally and look right in my language **so that** the menu works in all 5 markets.

- Layer: UX · Epic: MENU · Persona: Customer · Market: all (SA for RTL)
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu; Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given each new pizza, when the catalog shows it in each locale (en, es, de, fr, ja, ar), then its name and description appear in that locale, with no English text in the other locales.
2. Given the ja and ar copy, when this story is marked Done, then a native speaker has reviewed it (design).
3. Given each new pizza card, when it renders, then its image is the reviewed 500 px Wikimedia thumbnail (US-MENU-007-UX).
4. Given Arabic names and descriptions, when they render on the card, then they read right-to-left and do not overflow at phone width.

**Notes**: Copy wording is left to the builder. Depends on US-MENU-001-API. The pork and alcohol question is recorded on US-MENU-001-API.

---

### US-MENU-002-API · Drinks catalog: GET /api/drinks

**As a** customer **I want** a list of soft drinks **so that** I can add them to my order.

- Layer: API · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given valid headers, when `GET /api/drinks` is called, then 6 items are returned with ids `dr01`–`dr06`, `category: "soda"`, and the names Cola, Lemon-Lime, Orange, Ginger Ale, Grape and Root Beer.
2. Given each drink, when it is returned, then it has one size of 330 ml and a USD price between 1.99 and 2.99 (builder picks each price in range), converted to the market currency with the existing conversion and decimal places (0 for JPY).
3. Given the drink names and descriptions in every locale, when they are read, then no brand name appears.
4. Given a request without `X-Country-Code`, when `GET /api/drinks` is called, then the response is **400**, as for `/api/pizzas`.

**Notes**: Designer's call (owner to confirm): ids `dr01`–`dr06` and category `soda`. The endpoint uses the same dependencies as `/api/pizzas` (headers, translation fallback, USD conversion, `apply_user_behavior`). Open: how the one 330 ml size is represented in the payload (a size label, a volume field, or nothing); the same question applies to desserts (US-MENU-003-API).

---

### US-MENU-002-WEB · Drinks on the catalog (web)

**As a** customer **I want** to browse drinks and add one with a tap **so that** I can add it to my order quickly.

- Layer: WEB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Drinks tab, when it renders, then the 6 drinks show name, description, price in the market currency, image and an add control with a stable `data-testid`.
2. Given the add control, when I click it, then the drink enters the cart with quantity 1 and no size or topping builder opens.
3. Given `problem_user`, when the Drinks tab renders, then prices show $0 and images are broken, as for pizzas.

**Notes**: Depends on US-MENU-002-API, US-MENU-005-WEB (tabs) and US-MENU-004-WEB (cart). Tab state is covered by US-MENU-005-WEB.

---

### US-MENU-002-MOB · Drinks on the catalog (mobile)

**As a** customer **I want** to browse drinks and add one with a tap on my phone **so that** I can add it to my order quickly.

- Layer: MOB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Drinks tab, when it renders, then the 6 drinks show name, description, price, image and an add `btn-` `testID`.
2. Given the add control, when I tap it, then the drink enters the cart with quantity 1 and the pizza builder does not open.
3. Given `problem_user`, when the Drinks tab renders, then prices show $0 and images are broken, as for pizzas.

**Notes**: Depends on US-MENU-002-API, US-MENU-005-MOB and US-MENU-004-MOB.

---

### US-MENU-002-UX · Drink copy, images and states

**As a** customer **I want** drinks to be clearly named, correctly sized and free of brand marks **so that** the list is easy to read in every language.

- Layer: UX · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given each drink, when it is shown in en, es, de, fr, ja or ar, then its name and description are present in that locale and use generic names (no brand name).
2. Given each drink image, when it is reviewed by eye, then no legible brand logo, label or trademark appears (US-MENU-007-UX).
3. Given a drink card, when it renders, then the 330 ml size shows in a localized form, and the layout matches the pizza cards at phone width.
4. Given the add control, when I tap it, then it gives visible feedback that the drink was added.

**Notes**: Copy wording is left to the builder. Depends on how the size is represented in the payload (US-MENU-002-API).

---

### US-MENU-003-API · Desserts catalog: GET /api/desserts

**As a** customer **I want** a list of desserts **so that** I can add them to my order.

- Layer: API · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given valid headers, when `GET /api/desserts` is called, then 10 items are returned with ids `ds01`–`ds10`, `category: "dessert"`, and the names Tiramisu, Panna Cotta, Cannoli, Gelato, NY Cheesecake, Brownie, Apple Pie, Churros, Tres Leches and Flan.
2. Given each dessert, when it is returned, then it is one portion with a USD price between 3.99 and 6.99 (builder picks each price in range), converted to the market currency as pizzas are.
3. Given any of the 5 markets, when `GET /api/desserts` is called, then the same menu is returned (no market-specific menu).
4. Given a request without `X-Country-Code`, when `GET /api/desserts` is called, then the response is **400**, as for `/api/pizzas`.

**Notes**: Designer's call (owner to confirm): ids `ds01`–`ds10` and category `dessert`. Portion representation: see the Open in US-MENU-002-API. Open: the Arabic copy of desserts that are often alcohol-based (Tiramisu, Cannoli); the no-alcohol rule is stated for pizzas only.

---

### US-MENU-003-WEB · Desserts on the catalog (web)

**As a** customer **I want** to browse desserts and add one with a tap **so that** I can add it to my order quickly.

- Layer: WEB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Desserts tab, when it renders, then the 10 desserts show name, description, price in the market currency, image and an add control with a stable `data-testid`.
2. Given the add control, when I click it, then the dessert enters the cart with quantity 1 and no builder opens.
3. Given `problem_user`, when the Desserts tab renders, then prices show $0 and images are broken, as for pizzas.

**Notes**: Depends on US-MENU-003-API, US-MENU-005-WEB and US-MENU-004-WEB.

---

### US-MENU-003-MOB · Desserts on the catalog (mobile)

**As a** customer **I want** to browse desserts and add one with a tap on my phone **so that** I can add it to my order quickly.

- Layer: MOB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Desserts tab, when it renders, then the 10 desserts show name, description, price, image and an add `btn-` `testID`.
2. Given the add control, when I tap it, then the dessert enters the cart with quantity 1 and the pizza builder does not open.
3. Given `problem_user`, when the Desserts tab renders, then prices show $0 and images are broken, as for pizzas.

**Notes**: Depends on US-MENU-003-API, US-MENU-005-MOB and US-MENU-004-MOB.

---

### US-MENU-003-UX · Dessert copy, images and states

**As a** customer **I want** desserts to be clearly named and portioned **so that** the list is easy to read in every language.

- Layer: UX · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given each dessert, when it is shown in en, es, de, fr, ja or ar, then its name and description are present in that locale.
2. Given each dessert image, when it is reviewed by eye, then no legible brand logo, label or trademark appears (US-MENU-007-UX).
3. Given a dessert card, when it renders, then the one-portion wording shows in a localized form and the layout matches the pizza cards at phone width.
4. Given the add control, when I tap it, then it gives visible feedback that the dessert was added.

**Notes**: Copy wording is left to the builder. Arabic alcohol question: see US-MENU-003-API.

---

### US-MENU-004-API · Mixed cart and checkout

**As a** customer **I want** pizzas, drinks and desserts in one order **so that** I get everything at once.

- Layer: API · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given a cart with a pizza, a drink and a dessert, when checkout is called, then one order is created with all three lines, and the same tax, tip and delivery rules apply to each.
2. Given a cart with only one drink, when checkout is called, then the order is created: any combination is allowed and there is no minimum order.
3. Given a cart line without `item_type`, when it is priced, then it is treated as `"pizza"`.
4. Given a drink or dessert line sent with `item_type` and `pizza_id` carrying its id, or with `product_id` as the alias, when it is accepted, then the response echoes `product_id`.
5. Given a drink or dessert line with `size` or `toppings`, when it is priced, then both are ignored: no upcharge, the base price applies.
6. Given a line with `quantity` outside 1–10, when checkout is called, then the response is **422** (body validation).

**Notes**: Designer's call (owner to confirm): `item_type` values `"pizza" | "drink" | "dessert"`, `pizza_id` as the universal field, and `product_id` as an echoed alias. Depends on US-MENU-002-API and US-MENU-003-API. The totals change (US-PROMO-003-API) lands after this backend work. Open: what happens when `pizza_id` and `product_id` are sent with different ids; when `item_type` does not match the id prefix (for example `drink` with `p01`); and when the id is unknown (no status is stated for these cases).

---

### US-MENU-004-WEB · Mixed cart and checkout (web)

**As a** customer **I want** to see drinks, desserts and pizzas together in my cart and checkout **so that** I can review the whole order.

- Layer: WEB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile); Decisions › Menu)

**Acceptance criteria**
1. Given a cart with pizzas, drinks and desserts, when the cart renders, then every line shows its name, quantity and line price, and quantity can be changed within 1–10.
2. Given a cart with only drinks, when I open checkout, then I can place the order (no minimum-order message appears).
3. Given a drink or dessert line, when the checkout request is sent, then it carries `item_type` and the product id in `pizza_id`, with no `size` or `toppings`.
4. Given the checkout summary, when it renders, then drinks and desserts appear as lines with the same tax, tip and delivery lines as pizzas.

**Notes**: Depends on US-MENU-004-API and the catalog stories. Cart lines are edited through the existing cart endpoints.

---

### US-MENU-004-MOB · Mixed cart and checkout (mobile)

**As a** customer **I want** drinks, desserts and pizzas together in my cart and checkout on my phone **so that** I can review the whole order.

- Layer: MOB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile); Decisions › Menu)

**Acceptance criteria**
1. Given a cart with pizzas, drinks and desserts, when the cart renders, then every line shows its name, quantity and line price, and quantity can be changed within 1–10.
2. Given a cart with only drinks, when I open checkout, then I can place the order (no minimum-order message appears).
3. Given a drink or dessert line, when the checkout request is sent, then it carries `item_type` and the product id in `pizza_id`, with no `size` or `toppings`.
4. Given the Checkout screen, when it renders, then drinks and desserts appear as lines with the same tax, tip and delivery lines as pizzas.

**Notes**: Depends on US-MENU-004-API and the mobile catalog stories.

---

### US-MENU-005-WEB · Catalog tabs: Pizzas, Drinks, Desserts (web)

**As a** customer **I want** the catalog split into Pizzas, Drinks and Desserts **so that** I can browse each part of the menu.

- Layer: WEB · Epic: MENU · Persona: Customer · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the catalog, when it renders, then three tabs labelled Pizzas, Drinks and Desserts (localized) appear, each with a stable `data-testid`, and Pizzas is selected on load.
2. Given I select Drinks or Desserts, when the tab opens, then only that section's items are listed.
3. Given I select Pizzas, when the tab opens, then the pizza list and the pizza builder work as today.

**Notes**: Open: the web equivalent of the mobile `?section=` deep link (the design defines it for mobile only), and the response to an invalid section value.

---

### US-MENU-005-MOB · Catalog tabs and section deep link (mobile)

**As a** QA engineer **I want** the catalog tabs to open directly from a deep link **so that** tests can start on the drinks or desserts section.

- Layer: MOB · Epic: MENU · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile))

**Acceptance criteria**
1. Given the Catalog screen, when it renders, then three tabs (Pizzas, Drinks, Desserts) appear with `testID`s, and Pizzas is selected on load.
2. Given the deep link `omnipizza://catalog?section=drinks`, when it opens, then the Drinks tab is selected; `section=desserts` selects Desserts; without `section`, Pizzas is selected.
3. Given a drink or dessert tap, when it happens, then the item is added to the cart without opening the pizza builder.

**Notes**: Invalid `section` values: see the Open in US-MENU-005-WEB. Universal params alongside `section`: see the Open in US-REG-001-MOB.

---

### US-MENU-005-UX · Tab layout, copy and states

**As a** customer **I want** the three tabs to be readable and clear in every language **so that** I can switch sections without confusion.

- Layer: UX · Epic: MENU · Persona: Customer · Market: all (SA for RTL)
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile), Accessibility)

**Acceptance criteria**
1. Given the three tab labels, when they render at phone width in en, es, de, fr, ja and ar, then none is truncated or overflows.
2. Given the active tab, when it is shown, then it is distinguished by more than colour and meets the same contrast bar as the recent sweeps.
3. Given SA (ar), when the tabs render, then their order follows right-to-left.
4. Given the tabs on web, when a keyboard user navigates them, then each tab is reachable and has an accessible name.

**Notes**: Copy wording is left to the builder. The accessibility requirements come from the design's Clients section.

---

### US-MENU-006-API · Chaos personas apply to new items

**As a** QA engineer **I want** the chaos users to behave the same on drinks and desserts as on pizzas **so that** my persona tests cover the whole menu.

- Layer: API · Epic: MENU · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given `problem_user`, when `GET /api/drinks` or `GET /api/desserts` is called, then every price is $0 and every image URL is broken, as on `/api/pizzas`.
2. Given `a11y_glitch_user`, when a drink or dessert catalog or cart response is returned, then it carries one accessibility defect, as for pizzas (`A11Y_GLITCH_MODES`).
3. Given `performance_glitch_user`, when `GET /api/drinks` or `GET /api/desserts` is called, then the response is delayed by about 3 seconds.
4. Given the 7 existing test users, when the new endpoints are used, then their behaviour is unchanged and no new persona is added.

**Notes**: AC 3 follows from the design: the new endpoints use the same dependencies as `/api/pizzas`, including `apply_user_behavior`. The design says no new chaos persona is added and registered users and guests behave as `standard`.

---

### US-MENU-007-UX · Image sourcing, brand-free review and credits

**As a** QA engineer **I want** every new image reviewed by eye and credited **so that** the repository carries no brand marks and every licence can be traced.

- Layer: UX · Epic: MENU · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Menu)

**Acceptance criteria**
1. Given the 24 new images (8 pizzas, 6 drinks, 10 desserts), when they are sourced, then each is a Wikimedia Commons image shown as a 500 px thumbnail (500 is a width the thumbnail endpoint accepts; 512 is not).
2. Given each image, when it is reviewed by eye, then it shows no brand logo, label or trademark; an image that fails is replaced, not shipped.
3. Given the credits file, when it is read, then each image has its author and licence (CC BY or CC BY-SA).
4. Given the Android build, when a new image loads, then it loads with the existing descriptive User-Agent in `remoteImageSource`, with no per-image header work.

**Notes**: Which images to pick is left to the builder. Open: the credits file's location and any fields beyond author and licence.

---

### US-MENU-008-WEB · Stable test ids on new web screens and controls

**As a** QA engineer **I want** every new web control to have a stable `data-testid` **so that** the external harness can target it.

- Layer: WEB · Epic: MENU · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile); Anti-goals)

**Acceptance criteria**
1. Given every new interactive element (Login entries, register form, coupon field and apply action, coupon banner, Profile coupon section, guest prompt, catalog tabs, drink and dessert add controls, cart lines), when it renders, then it has a `data-testid` that follows the existing web convention.
2. Given the existing web pages, when the change ships, then no existing `data-testid` is renamed or removed.
3. Given a direct navigation to a new lazy page (`/register`), when the page loads, then it is reached through the `route-loading` fallback and the wait on its own `data-testid` absorbs that fallback.

**Notes**: Exact names are left to the builder. The PRD's test-id list is updated in US-DOC-001-API. Renaming an existing id is a breaking change for the harness.

---

### US-MENU-008-MOB · Stable test ids on new mobile screens and controls

**As a** QA engineer **I want** every new mobile control to have a stable `testID` **so that** the external harness can target it.

- Layer: MOB · Epic: MENU · Persona: QA · Market: all
- Status: Planned
- Planned on: 2026-10-28 · Design: `docs/superpowers/specs/2026-10-28-accounts-coupon-menu-design.md` (Decisions › Clients (web and mobile); Anti-goals)

**Acceptance criteria**
1. Given every new interactive element on mobile, when it renders, then it has a `testID` with the `btn-`, `input-`, `text-` or `view-` prefix that matches the existing convention.
2. Given a visible node, when it renders, then it exposes readable text as today, for Appium `getText()`.
3. Given the existing mobile screens, when the change ships, then no existing `testID` is renamed or removed.

**Notes**: Exact names are left to the builder. The `testID` list is documented in US-DOC-001-API. Renaming an existing `testID` is a breaking change for the harness.
