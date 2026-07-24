# Figures Plan — OmniPizza paper (v0.5)

Four high-value figures, one per category (conceptual framework, methodological flow, data
synthesis, mechanism). Descriptions are build-ready; captions are final-draft APA style.
Every data value is taken from the verified base (fact sheet / `findings.csv`) — figures
introduce no new numbers. Figures 1, 2 and 4 are expressible in Mermaid; Figure 3 renders
from `findings.csv` with any plotting library.

---

## Figure 1 — Conceptual framework (diagram)

- **Location:** end of Section 2.1, immediately after the flow formula — anchor sentence:
  *"As a flow: persona → (JWT claim) → deterministic fault → (selectors, archives) →
  measurable observation."*
- **Visual type:** layered block-and-arrow diagram (no data axes) with one deliberate
  feedback loop.
- **Detailed description:** Three horizontal layers.
  - **Top layer — Controllability instruments** (left-aligned blocks): `behavior` JWT claim
    (annotated: $3.0\,\mathrm{s}$ delay · $p=0.5$ checkout failure · $3\times3$ payload
    pool) and *atomic state injection* (annotated: localStorage seeding · `omnipizza://`
    deep-link params). Arrows point downward into the middle layer.
  - **Middle layer — The platform**: one wide block (3 deployables · 5 markets / 6
    languages · in-memory state), containing a small inner block labeled *seeded behavior*
    with the $0-price defect drawn **inside** it.
  - **Bottom layer — Observability instruments**: selector contract ($165$ web / $114$
    mobile occurrences), required-header rejections, durable triage archive. Arrows point
    downward from platform to observation outputs ("measurable observation").
  - **The loop that makes the figure worth having:** a curved arrow leaving *seeded
    behavior*, labeled **"derivation"**, entering a block on the right labeled *derived
    test oracle (golden suite)*, whose output arrow re-enters the observation layer stamped
    **"detection = 0"**. Style this arrow differently (dashed, warning color): it is the
    oracle-inversion short-circuit of Section 2.1.
- **Draft caption:** *Figure 1. Operational map of the theoretical framework.
  Controllability instruments (credential-keyed personas, atomic state injection) set
  platform state; observability instruments (selector contracts, header rejections, triage
  archive) expose it. The dashed path shows the derived-oracle short-circuit: because the
  characterization suite derives its expectations from seeded behavior, the seeded defect
  is certified rather than detected (Sections 2.1, 4.1).*

## Figure 2 — Methodological flow (flowchart)

- **Location:** Section 3 opening — anchor sentence: *"The study combines two instruments
  joined by a low-cost executed exemplar: a design-science artifact description and a
  retrospective embedded case study."*
- **Visual type:** three-swimlane process flowchart, converging on Results.
- **Detailed description:**
  - **Lane A — Artifact description (RQ1/RQ2):** archival sources (PRD, design docs,
    atomic-testing guides, git history) → drafting pass → **adversarial fact-check at
    pinned snapshot `83b8ba4`** (diamond; back-edge labeled "3 claims refuted → corrected")
    → fact sheet with counting rules → Sections 3.2–3.3.
  - **Lane B — Exemplar (RQ2):** ground truth confirmed live ($12/12$ at $0.0$) → four
    suites executed *as-is* (Schemathesis 3.25.1 · Vitest 4.0.18 · Cypress 15.11.0 · Detox)
    → per-layer outcomes → Section 4.1.
  - **Lane C — Case study (RQ3):** external harness reports (5 findings-bearing + 1
    re-verification cycle) → LLM triage under protocol — two gate diamonds:
    *reproduce-before-verdict* (exonerating verdicts) and *human decision gates* (per
    push/release) → dated explanation documents → coding (binary verdict · 8-class taxonomy
    · confidence · `instrumentation-mediated` flag; human row-by-row review) →
    `findings.csv` → Section 4.2.
  - All three lanes converge into a Results node, which feeds Discussion (guidelines
    tagged by evidence strength).
- **Draft caption:** *Figure 2. Study pipeline. Lane A derives and adversarially verifies
  the artifact description at a pinned repository snapshot; Lane B executes the
  detection-power exemplar against the seeded defect; Lane C codes one week of external
  automated-QA findings under the triage protocol. Diamonds mark verification and
  human-oversight gates; the back-edge in Lane A records the three drafted claims refuted
  during verification.*

## Figure 3 — Data synthesis (complex graph)

- **Location:** Section 4.2, replacing/augmenting the densest results text — anchor
  sentence: *"Real-bug rate per cycle: 6/8 (07-16) → 1/3 (07-18) → re-verification, 0 new
  (07-19) → 1/2 (07-20) → 3/3 (07-21) → 0/3 (07-22)."*
- **Visual type:** stacked-bar timeline with overlaid rate line and event annotations
  (single panel; source: `findings.csv`).
- **Detailed description:**
  - **X-axis:** the six triage cycles by date (2026-07-16, 07-18, 07-19, 07-20, 07-21,
    07-22); tick sublabels carry the shipped release where one exists (v1.1.4, v1.1.5, —,
    v1.1.7, v1.1.8, —).
  - **Left Y-axis (bars):** findings per cycle ($8, 3, 0, 2, 3, 3$) as stacked bars
    segmented by **final taxonomy class** (8-class legend: real bug; harness artifact;
    shared-fixture; infrastructure; by-design; third-party; not reproducible;
    exonerated-unattributed). The 07-19 position shows an empty slot labeled
    "re-verification".
  - **Right Y-axis (line):** real-bug rate under final verdicts (0.75, 0.33, —, 0.50,
    1.00, 0.00) drawn as a point-marked line; at 07-21 add a hollow companion marker at
    0.67 labeled "initial verdicts" to expose the reversal's effect.
  - **Event annotations:** hatched outline on the instrumentation-mediated segments
    (F17, F18 confirmed; F09 candidate with lighter hatch); an arrow at 07-21→07-22
    labeled "F15 verdict reversal"; two small markers on the 07-18 bar labeled
    "root causes retracted 07-19 (F09, F10)".
  - Grayscale-safe palette; class colors must survive monochrome print via hatch patterns.
- **Draft caption:** *Figure 3. The 19 externally reported findings by triage cycle,
  segmented by final verdict class (bars, left axis), with the per-cycle real-bug rate
  under final verdicts (line, right axis; hollow marker: initial-verdict sensitivity at
  the reversed cycle). Hatching marks instrumentation-mediated findings; annotations mark
  the two root-cause retractions and the verdict reversal. Rates describe a moving
  artifact — five releases shipped in-window (Section 5.2).*

## Figure 4 — Mechanism (schematic)

- **Location:** Section 4.2, first highlight bullet — anchor sentence: *"cart hydration
  surfacing an orphan cart left by earlier tests (class: shared-fixture state; the
  hydration feature is the vehicle, the leftover fixture the cause)."*
- **Visual type:** UML sequence diagram, two temporal phases on shared lifelines.
- **Detailed description:** Lifelines: *Earlier test (any client)* · *Backend (warm
  in-memory DB)* · *Harness browser session* · *Checkout page* · *Triage*.
  - **Phase 1 — seeding (earlier the same day):** earlier test → Backend:
    `POST /api/cart` as shared `standard_user` (note: "orphan cart persists — warm
    instance, no restart"). The backend lifeline gains an activation box labeled *shared
    fixture state* that visibly spans into Phase 2.
  - **Phase 2 — manifestation:** Harness → login as `standard_user` → opens Checkout →
    Checkout page self-message: "local cart empty" → Checkout → Backend: `GET /api/cart`
    (labeled **sanctioned hydration — working as designed**) → returns the orphan cart →
    UI shows "pre-selected Pepperoni" → Harness files finding.
  - **Verdict strip (bottom):** Triage annotations: control account (`problem_user`)
    shows empty checkout; backend timestamp matches same-day activity; local-cart-leak
    hypothesis falsified → verdict: *shared-fixture state*,
    `instrumentation-mediated = true` (vehicle: hydration; cause: leftover fixture).
  - Visual emphasis: the hydration call gets the "as designed" tag; the defect is the
    *state*, not the call — that separation is the figure's point.
- **Draft caption:** *Figure 4. Mechanism of an instrumentation-mediated false positive
  (finding F17). An orphan cart seeded by earlier tests on the shared account persists in
  the warm in-memory instance; the checkout page's sanctioned hydration
  (GET /api/cart on empty local cart) later surfaces it to the harness as a
  "pre-selected item" defect. The atomic-entry feature is the vehicle; the shared
  mutable fixture is the cause (Sections 3.2.3, 3.2.5, 4.2).*

---

**Build notes.** Figures 1–2 and 4: Mermaid (`flowchart` / `sequenceDiagram`) or
draw.io/TikZ for print. Figure 3: matplotlib/Vega from `findings.csv` (columns: `cycle`,
`report_date`, `final_class`, `instrumentation_mediated`, `release`; rates computed from
`final_verdict`). All values must re-derive from the companions — if a figure needs a
number that is not in the fact sheet or `findings.csv`, the number is wrong or the
companion is missing a row.
