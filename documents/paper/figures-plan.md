# Figures Plan — OmniPizza paper (v0.5)

Six figures, numbered by order of appearance. Production paths:

- **Figures 1, 2, 6 (diagrams):** AI image generation using the prompts below. Caveat:
  image models routinely mangle embedded text — generate the layout, then correct every
  label in an editor against the "exact labels" list, or fall back to Mermaid (sources
  sketched per figure).
- **Figures 3, 4 (screenshots):** captured from the running application via the platform's
  own atomic entry (deterministic, reproducible captures — parameters listed). Capture at a
  stated version and say so in the caption (moving-artifact discipline, Section 5.2).
- **Figure 5 (data chart):** rendered from `findings.csv` with a plotting library. **Do not
  AI-generate this figure**: an image model would fabricate bar heights, violating the rule
  that every figure value must re-derive from the fact sheet or `findings.csv`. An optional
  layout-mock prompt is included for styling reference only.

---

## Figure 1 — Conceptual framework (diagram)

- **Location:** end of Section 2.1, after the flow formula — anchor: *"As a flow: persona →
  (JWT claim) → deterministic fault → (selectors, archives) → measurable observation."*
- **Visual type:** layered block-and-arrow diagram with one dashed feedback loop.
- **Detailed description:** three horizontal layers. Top — *Controllability instruments*:
  `behavior` JWT claim (annotations: $3.0\,\mathrm{s}$ delay · $p=0.5$ checkout failure ·
  $3\times3$ payload pool) and *atomic state injection* (localStorage seeding ·
  `omnipizza://` deep-link params); arrows down. Middle — *The platform* (3 deployables ·
  5 markets / 6 languages · in-memory state) containing an inner block *seeded behavior*
  with the $0-price defect inside. Bottom — *Observability instruments*: selector contract
  ($165$ web / $114$ mobile), required-header rejections, durable triage archive; arrows
  down to *measurable observation*. The point of the figure: a **dashed curved arrow** from
  *seeded behavior* labeled "derivation" into a right-side block *derived test oracle
  (golden suite)*, whose output re-enters observation stamped **"detection = 0"**.
- **AI-generation prompt:**
  > Clean flat vector technical diagram, white background, IEEE-paper style, muted
  > two-color palette (slate gray blocks, one amber accent), no photorealism, no decorative
  > icons, no gradients. Three horizontal layers of labeled rectangles connected by
  > straight downward arrows. Top layer: two rectangles labeled "Controllability:
  > chaos personas (JWT behavior claim)" and "Atomic state injection". Middle layer: one
  > wide rectangle labeled "OmniPizza platform" containing a smaller inner rectangle
  > labeled "Seeded behavior ($0-price defect)". Bottom layer: three rectangles labeled
  > "Selector contract", "Header rejections", "Triage archive", all feeding a rounded node
  > labeled "Measurable observation". One dashed amber curved arrow exits the inner
  > "Seeded behavior" rectangle on the right, loops to a separate rectangle labeled
  > "Derived test oracle (golden suite)", and returns to the bottom layer with a small tag
  > reading "detection = 0". Sans-serif labels, generous whitespace, 16:10 aspect.
  - **Exact labels to verify after generation:** Controllability: chaos personas (JWT
    `behavior` claim) · Atomic state injection · OmniPizza platform · Seeded behavior
    ($0-price defect) · Selector contract · Header rejections · Triage archive · Measurable
    observation · Derived test oracle (golden suite) · derivation · detection = 0.
- **Draft caption:** *Figure 1. Operational map of the theoretical framework.
  Controllability instruments set platform state; observability instruments expose it. The
  dashed path shows the derived-oracle short-circuit: because the characterization suite
  derives its expectations from seeded behavior, the seeded defect is certified rather than
  detected (Sections 2.1, 4.1).*

## Figure 2 — Methodological flow (flowchart)

- **Location:** Section 3 opening — anchor: *"The study combines two instruments joined by
  a low-cost executed exemplar…"*
- **Visual type:** three-swimlane process flowchart converging on Results.
- **Detailed description:** Lane A *Artifact description*: archival sources → drafting
  pass → diamond "adversarial fact-check @ snapshot `83b8ba4`" with back-edge "3 claims
  refuted → corrected" → fact sheet → Sections 3.2–3.3. Lane B *Exemplar*: ground truth
  confirmed live ($12/12$ at $0.0$) → four suites as-is (Schemathesis · Vitest · Cypress ·
  Detox) → per-layer outcomes → Section 4.1. Lane C *Case study*: harness reports (5+1
  cycles) → LLM triage with two gate diamonds (reproduce-before-verdict; human gates) →
  explanation documents → coding (4 attributes, human review) → `findings.csv` →
  Section 4.2. All lanes → Results → Discussion.
- **AI-generation prompt:**
  > Clean flat vector flowchart, white background, IEEE-paper style, three horizontal
  > swimlanes separated by thin gray rules, sans-serif labels, rectangles for steps,
  > diamonds for decision gates, no icons, no gradients, no people. Lane titles on the
  > left: "A · Artifact description", "B · Exemplar", "C · Case study". Lane A:
  > "Archival sources" → "Drafting pass" → diamond "Adversarial fact-check @ pinned
  > snapshot" with a curved back-arrow to "Drafting pass" labeled "3 claims refuted →
  > corrected" → "Fact sheet (counting rules)". Lane B: "Ground truth confirmed live" →
  > "Four suites executed as-is" → "Per-layer outcomes". Lane C: "External harness reports
  > (5+1 cycles)" → diamond "Reproduce before verdict" → diamond "Human decision gates" →
  > "Dated explanation documents" → "Coding (4 attributes)" → "findings.csv". All three
  > lanes converge with arrows into a single rounded node on the right labeled "Results
  > (4.1 / 4.2)" which feeds "Discussion (guidelines by evidence strength)". Wide 16:9
  > layout, generous whitespace.
  - **Exact labels to verify:** snapshot `83b8ba4` · "3 claims refuted → corrected" ·
    "$12/12$ at $0.0$" (Lane B first node sublabel) · Schemathesis 3.25.1 · Vitest 4.0.18 ·
    Cypress 15.11.0 · Detox · "5+1 cycles" · reproduce-before-verdict · findings.csv.
- **Draft caption:** *Figure 2. Study pipeline. Lane A derives and adversarially verifies
  the artifact description at a pinned repository snapshot; Lane B executes the
  detection-power exemplar; Lane C codes one week of external automated-QA findings under
  the triage protocol. Diamonds mark verification and human-oversight gates.*

## Figure 3 — The platform across web, mobile, and writing systems (screenshots)

- **Location:** Section 3.2, after the intro paragraph — anchor: *"The product surface is a
  complete ordering flow (login, catalog, pizza builder, checkout, order tracking, profile)
  over a catalog of 12 pizzas localized in 6 languages."*
- **Visual type:** 2 × 2 annotated screenshot composite (platform × market).
- **Detailed description:** Panel A — web catalog, US/en. Panel B — mobile catalog, US/en
  (device frame). Panel C — web checkout, SA/ar (right-to-left layout, `district` field,
  `baksheesh` tip label visible). Panel D — mobile checkout, SA/ar. Optional annotation
  layer: two or three callout arrows per panel pointing at interactive elements with their
  selector names (e.g., `pizza-card-p01`, `btn-checkout`) to make the selector contract
  visible; keep callouts sparse.
- **Capture protocol (deterministic, via the platform's own atomic entry):**
  - Web (A, C): Chrome at $1280\times800$, `https://omnipizza-frontend.onrender.com`.
    A: log in as `standard_user` / `pizza123`, market US → catalog. C: log in selecting
    SA/ar at the Login screen (market is chosen at login) → seed a cart if desired via
    `POST /api/cart` → open checkout. Wake the free-tier backend first (one `/health`
    request) to avoid cold-start artifacts.
  - Mobile (B, D): Android APK v1.1.8 (GitHub Releases). Deterministic entry:
    `omnipizza://catalog?accessToken=<jwt>&market=US&lang=en` and
    `omnipizza://checkout?accessToken=<jwt>&market=SA&lang=ar&hydrateCart=true`.
  - State the capture version in the caption; re-capture if the UI ships changes.
- **Draft caption:** *Figure 3. The mirrored product surface. Catalog (top) and checkout
  (bottom) on web (left) and mobile (right); the right column shows the Saudi market in
  Arabic, exercising right-to-left layout, the market-specific `district` field, and the
  localized tip label. Screenshots captured at v1.1.8 via the platform's atomic-entry
  parameters (Section 3.2.3); callouts name the stable selectors of Section 3.2.4.*

## Figure 4 — The seeded defect, observed (evidence screenshot)

- **Location:** Section 3.4 — anchor: *"Ground truth was confirmed live before the runs: a
  `problem_user` login followed by a catalog fetch returned $12/12$ pizzas at price $0.0$
  with the broken image URL."* (Referenced again from Section 4.1.)
- **Visual type:** single annotated screenshot, optionally paired with a cropped API
  response.
- **Detailed description:** web catalog logged in as `problem_user` / `pizza123` (US/en):
  every card shows $\$0.00$ and the broken-image placeholder. Side strip (optional): the
  corresponding `GET /api/pizzas` JSON excerpt with `"price": 0.0` and the
  `broken-image-url.com` string highlighted — the same ground truth at UI and API level.
  One callout: "seeded by the `behavior` JWT claim — no environment flag".
- **Capture protocol:** wake backend; log in as `problem_user`; catalog renders the defect
  deterministically (persona-keyed, so the capture is reproducible by anyone). API strip
  via `curl` with the persona's token, `X-Country-Code: US`, `X-Language: en`.
- **Draft caption:** *Figure 4. Ground truth for the exemplar. The `problem_user` persona
  deterministically seeds $0.00 prices and broken catalog images (left: rendered catalog;
  right: the corresponding API response). This is the defect that all four test layers
  failed to flag in Section 4.1. Captured at v1.1.8.*

## Figure 5 — Findings by cycle and class (data chart — render from data)

- **Location:** Section 4.2 — anchor: *"Real-bug rate per cycle: 6/8 (07-16) → 1/3 (07-18)
  → re-verification, 0 new (07-19) → 1/2 (07-20) → 3/3 (07-21) → 0/3 (07-22)."*
- **Visual type:** stacked-bar timeline with overlaid rate line and event annotations.
- **Detailed description:** X = six cycles by date, sublabels with shipped release
  (v1.1.4, v1.1.5, —, v1.1.7, v1.1.8, —). Left Y (bars) = findings per cycle
  ($8,3,0,2,3,3$) stacked by final taxonomy class (8-class legend); 07-19 slot labeled
  "re-verification". Right Y (line) = real-bug rate under final verdicts
  ($0.75, 0.33, —, 0.50, 1.00, 0.00$), hollow marker at $0.67$ on 07-21 labeled "initial
  verdicts". Hatching on instrumentation-mediated segments (F17, F18; lighter for
  candidate F09); annotations for the two retractions (07-18 bar, resolved 07-19) and the
  F15 reversal (07-21→07-22 arrow). Grayscale-safe palette with hatch patterns.
- **Production:** matplotlib/Vega from `findings.csv` (`cycle`, `report_date`,
  `final_class`, `final_verdict`, `instrumentation_mediated`, `release`). **Not
  AI-generated.** Optional styling-mock prompt (layout reference only, discard any
  depicted values):
  > Minimal flat two-panel-free chart mockup, white background: six stacked bars over a
  > date axis with a secondary line and round markers, small legend of eight muted
  > categories, sparse annotation arrows, IEEE single-column proportions, sans-serif.
- **Draft caption:** *Figure 5. The 19 externally reported findings by triage cycle,
  segmented by final verdict class (bars, left axis), with the per-cycle real-bug rate
  under final verdicts (line, right axis; hollow marker: initial-verdict sensitivity at the
  reversed cycle). Hatching marks instrumentation-mediated findings; annotations mark the
  two root-cause retractions and the verdict reversal. Rates describe a moving artifact —
  five releases shipped in-window (Section 5.2).*

## Figure 6 — Mechanism of an instrumentation-mediated false positive (schematic)

- **Location:** Section 4.2, first highlight bullet — anchor: *"cart hydration surfacing an
  orphan cart left by earlier tests…"*
- **Visual type:** UML sequence diagram, two temporal phases on shared lifelines.
- **Detailed description:** lifelines *Earlier test* · *Backend (warm in-memory DB)* ·
  *Harness session* · *Checkout page* · *Triage*. Phase 1: earlier test →
  `POST /api/cart` as shared `standard_user`; backend activation box *shared fixture
  state* persists visibly into Phase 2. Phase 2: harness logs in → Checkout → "local cart
  empty" self-message → `GET /api/cart` tagged **"sanctioned hydration — working as
  designed"** → orphan cart returned → UI shows pre-selected item → finding filed. Bottom
  strip: triage annotations (control account empty; same-day backend timestamp;
  local-leak hypothesis falsified) → verdict *shared-fixture state*,
  `instrumentation-mediated = true`.
- **AI-generation prompt:**
  > Clean flat vector UML sequence diagram, white background, IEEE-paper style, five
  > vertical lifelines with header boxes labeled "Earlier test", "Backend (warm in-memory
  > DB)", "Harness session", "Checkout page", "Triage". Sans-serif, no icons, no
  > gradients. Two phases separated by a horizontal dashed rule labeled "later, same day".
  > Phase 1: solid arrow from "Earlier test" to "Backend" labeled "POST /api/cart (shared
  > user)"; a tall thin amber activation rectangle on the Backend lifeline labeled "orphan
  > cart persists" extending down through phase 2. Phase 2: arrows "login (shared user)"
  > from Harness to Backend; self-arrow on "Checkout page" labeled "local cart empty";
  > arrow Checkout → Backend labeled "GET /api/cart — sanctioned hydration, as designed";
  > return arrow labeled "orphan cart"; arrow Checkout → Harness labeled "UI shows
  > pre-selected item"; arrow Harness → Triage labeled "finding filed". Bottom: a light
  > gray note box under Triage reading "verdict: shared-fixture state ·
  > instrumentation-mediated = true". Tall 3:4 layout.
  - **Exact labels to verify:** POST /api/cart · GET /api/cart · standard_user ·
    "sanctioned hydration — working as designed" · "shared-fixture state" ·
    "instrumentation-mediated = true".
- **Draft caption:** *Figure 6. Mechanism of an instrumentation-mediated false positive
  (finding F17). An orphan cart seeded by earlier tests on the shared account persists in
  the warm in-memory instance; the checkout page's sanctioned hydration later surfaces it
  to the harness as a "pre-selected item" defect. The atomic-entry feature is the vehicle;
  the shared mutable fixture is the cause (Sections 3.2.3, 3.2.5, 4.2).*

---

**Integrity rule.** Every value in every figure must re-derive from the fact sheet or
`findings.csv`; screenshots must state their capture version. If a figure needs a number
that is not in a companion, the number is wrong or the companion is missing a row.
**Mermaid fallback:** Figures 1, 2 and 6 have direct Mermaid equivalents (`flowchart LR`,
`flowchart` with subgraphs, `sequenceDiagram`) if AI-generated text proves uncorrectable.
