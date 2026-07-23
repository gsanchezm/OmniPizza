# OmniPizza: A Controlled Laboratory for Multi-Platform Test Automation

> **Status:** base document (v0.4, 2026-07-23). Platform-centered framing (pivot from the
> earlier triage-centered draft); the one-week QA triage study is the evaluation (Section 5).
> Sections 3–6 are drafted as verified-fact skeletons; Sections 1–2 and 7–8 are outlines.
> All quantitative claims were adversarially fact-checked against the repository at the
> pinned snapshot (Section 3.1); three claims refuted in review were corrected in this version.
>
> **Working-title alternatives:**
> - *Testability as a Product Feature: OmniPizza, an Open Multi-Market Testbed for QA Automation*
> - *A Pizza Shop as a Laboratory: A Realistic, Deterministic Testbed for Multi-Platform Test Automation*
>
> **Target:** academic-style preprint (arXiv, cs.SE), adaptable to tool/artifact or industry
> tracks. **Language:** English. **Study type:** artifact (design-science) paper with a
> retrospective case-study evaluation — no new experiments; all evidence already exists in the
> repository.

---

## Abstract (outline)

- Pitch: practicing, benchmarking, and studying test automation needs a system that is
  realistic enough to matter and controlled enough to measure — production apps are neither
  safe nor deterministic; existing sandboxes are single-platform or single-concern.
- OmniPizza: an open, publicly deployed pizza-ordering product (FastAPI backend, React web,
  Expo/React Native mobile) built so that testability is a product feature: 7 deterministic
  chaos users whose failure modes travel in the JWT, 5 data-driven markets / 6 languages
  including Arabic RTL, atomic state-injection entry to any screen, and versioned
  instrumentation contracts (165 web + 114 mobile stable-selector occurrences).
- Evaluation: one week of real external automated-QA use (19 findings, 6 triage cycles)
  provides initial evidence for the laboratory in both roles — app under test and generator of
  study-able QA phenomena — including false positives mediated by the test-enabling
  instrumentation itself.
- Output: a design-pattern catalog for testability, a catalog of what the laboratory is
  instrumented to measure — one row executed as an exemplar: the seeded $0-price defect goes
  undetected by all four existing test layers as-is (Section 4.1) — and design-for-testability
  guidelines tagged by evidence strength.

## 1. Introduction (outline)

- Motivation: where do you practice test automation — functional, performance,
  accessibility, security, visual, across web and mobile — evaluate a new testing tool, or
  study QA processes? Production systems are unsafe, nondeterministic, and unobservable; toy demos
  lack the failure modes that make automation hard. The gap is a *controlled laboratory*:
  realistic product surface, deterministic and enumerable failure modes, sanctioned
  observability/controllability.
- Who it is designed to serve (intended audiences; adoption evidence to date is one external
  QA harness — Section 7): **practitioners** (a training ground whose pitfalls —
  viewport-dependent selectors, custom widgets, RTL, state races — are deliberately embedded,
  not accidental); **tool builders** (a stable benchmark target with documented seeded
  defects; a machine-readable defect manifest is planned supplementary material);
  **researchers** (deterministic phenomena plus complete archival capture of the triage side
  of the QA process — the harness side is unobserved); **educators** (a free, deployed,
  resettable curriculum).
- Why a pizza shop: multi-market commerce exercises i18n/RTL, per-market validation rules,
  currency/tax arithmetic, and checkout flows — a realistic complexity envelope with a small
  domain vocabulary.
- **Research questions** (typed per Wieringa; each names its evidence and strength):
  - **RQ1 (descriptive design question).** What design mechanisms make a realistic
    multi-platform product function as a controlled testing laboratory — deterministic,
    controllable, observable — without ceasing to be realistic? *Evidence: the verified
    artifact description, Section 3.*
  - **RQ2 (capability/affordance question).** What testing-related properties is the platform
    instrumented to measure? *Evidence: the affordance catalog, Section 4; one row
    is executed as an exemplar (4.1), the QA-process row is exercised by Section 5, the rest
    remain design claims.*
  - **RQ3 (validation question).** How does the platform behave under real external
    automated-QA use? *Evidence: the retrospective case study, Section 5 — an existence
    proof from one deployment and one external harness.*
  - **RQ4 (prescriptive question).** What transferable design-for-testability guidelines,
    with what trade-offs, follow from the design and its evaluation? *Evidence: Section 6,
    each guideline tagged by evidence strength.*
- Contributions (approved list):
  1. The platform, made available to the four audiences above: open, publicly deployed,
     reproducible (3 deployables, 5 markets / 6 languages incl. RTL, 7 deterministic chaos
     users, 20 `/api` operations under contract, heterogeneous test suites).
  2. A design-pattern catalog for testability-first product design (Section 3).
  3. A catalog of properties the laboratory is instrumented to measure or study (Section 4).
  4. Evaluation in real use: one week of external automated QA — 19 findings, a preliminary
     8-class verdict classification, and instrumentation-mediated false positives (Section 5).
  5. Design-for-testability guidelines tagged by evidence strength (Section 6).

## 2. Related Work (outline)

- Testing sandboxes and demo apps: SauceDemo (origin of the `problem_user` pattern — OmniPizza
  extends it to latency, probabilistic, a11y, and security personas), OWASP Juice Shop
  (security training), TodoMVC / RealWorld (implementation benchmarks, not testing
  laboratories).
- Defect benchmarks (Defects4J, BugsJS): curated *historical defects* for tool evaluation —
  contrast with a *living* laboratory of seeded, deterministic, currently-reproducible failure
  modes plus process capture.
- Design for testability: controllability/observability as testability dimensions (Binder;
  Freedman) — OmniPizza operationalizes both as product features.
- Flaky tests and test-failure noise (Luo et al.; industrial reports); false-positive triage;
  test-fixture pollution — the phenomena Section 5 shows the laboratory generating.
- LLMs in testing and triage; human-AI oversight (context for the evaluation's triage
  protocol).
- Case-study and design-science methodology (Runeson & Höst; Yin; Wieringa).

## 3. The OmniPizza Platform: Design Principles (RQ1)

Three deployables — FastAPI backend, React/Vite web, Expo/React Native mobile — plus test
suites in and out of the app packages. The product surface is a complete ordering flow (login,
catalog, pizza builder, checkout, order tracking, profile) over a catalog of 12 pizzas
localized in 6 languages. Testability mechanisms are product features with the same
compatibility guarantees as user features.

### 3.1 How this description was derived and verified (method)

The design rationale is reconstructed from archival sources: the in-repo product and design
documents, the atomic-testing guides, the QA-architecture document, and git history. Every
quantitative claim in Sections 3–5 was verified against the code at a pinned repository
snapshot — commit `83b8ba4` (2026-07-22, the last product commit of the study window) — by an
adversarial fact-checking pass independent of the drafting pass; each count carries an
explicit counting rule, consolidated in the fact-sheet appendix (a required companion of this
paper, not optional material). Design principles are labeled by provenance: *ex-ante* goals
stated in the founding documents (chaos personas, market-as-data, atomic entry, selector
contracts) vs. *ex-post* codifications of operational lessons (per-login profile keying was
introduced mid-history as a race fix, Section 3.6; a defensive deep-link guard likewise) —
the catalog does not present hindsight as foresight.

### 3.2 Chaos-by-identity: failure modes travel in credentials

Seven deterministic test users (shared password), each carrying a `behavior` claim in its JWT
that the backend enforces server-side:

| User | Enforced behavior |
|---|---|
| `standard_user` | nominal behavior |
| `locked_out_user` | login always rejected |
| `problem_user` | $0 prices and broken catalog images |
| `performance_glitch_user` | fixed 3.0 s delay injected on the behavior-enabled endpoints (catalog fetch and checkout) |
| `error_user` | checkout fails with HTTP 500 at p = 0.5 |
| `a11y_glitch_user` | one accessibility defect mode per catalog/cart call, drawn from 3 modes; the wrong-language mode draws among the 6 supported languages |
| `security_glitch_user` | XSS-seeded profile fields (3 fields × 3 payloads), internal-error message leaks at p = 0.5, order-ownership bypass |

Because the failure mode is keyed to the *identity*, it composes orthogonally with every
market, language, and platform — no environment flags, no server-side test configuration, and
two tests using different personas never interfere.

### 3.3 Multi-market complexity as data, not code

One configuration table drives 5 markets (MX, US, CH, JP, SA): currency and conversion,
decimal rules (JPY: 0 decimals), tax rates (8–16%), a market-specific required address field
(`colonia` / `zip_code` / `plz` / `prefectura` / `district`), and a localized tip field name
(`propina` / `tip` / `trinkgeld` / `chip` / `baksheesh`). A model-level validation rule
additionally enforces the 5-digit US zip format. SA additionally exercises Arabic
right-to-left layout. Market rules are therefore *enumerable test dimensions*: a test
generator can walk the table instead of reverse-engineering branches.

### 3.4 Atomic state injection: O(1) entry to any screen

Both platforms expose sanctioned bypasses that put a test *directly into* any target state
instead of replaying the user journey:

- **Web:** seed `localStorage` (documented key set with the store-envelope format), seed
  backend state via `POST /api/cart` and `POST /api/store/market`, then navigate straight to
  the target route; the Checkout page hydrates from `GET /api/cart` when its local cart is
  empty.
- **Mobile:** `omnipizza://` deep links to 6 screens with universal parameters
  (`accessToken` bypasses login, `market`, `lang`, `resetSession`, `hydrateCart`), plus a
  Detox launch argument for market selection.

The bypasses are load-bearing, versioned features — and Section 5 shows their cost: the same
machinery, working exactly as designed, mediated false positives during real QA use.

### 3.5 Instrumentation contracts as versioned APIs

Every interactive element carries a stable selector (165 `data-testid` occurrences on web,
114 `testID` on mobile, shared prefix convention); routes and response shapes are frozen. The
API surface under contract is 20 `/api` route operations (18 distinct paths; 22 operations
including root and health probes). The market-sensitive *read* endpoints — catalog fetch and
cart hydration — reject requests without an `X-Country-Code` header (HTTP 400); checkout
instead carries the market in its request body. Selector renames are treated as breaking
changes — testability has the same compatibility discipline as a public API.

### 3.6 Ephemeral state as isolation

The backend persists everything in memory: restart = deterministic clean slate. Editable
profile state is keyed to the login session (a per-login `sid` JWT claim), so concurrent
sessions of the same shared test user get isolated profiles — an *ex-post* design lesson: the
keying was introduced mid-history to fix an observed login race. The flip side, warm-instance
state retention on shared fixtures, is deliberately kept: it generates exactly the
shared-fixture phenomena that Section 5 studies.

### 3.7 A deliberately embedded automation curriculum

Real-world automation pitfalls are reproduced on purpose: viewport-dependent selector suffixes
that switch at a responsive breakpoint, a deploy-guard key that silently wipes naively seeded
auth state, a persistence envelope that must be reproduced exactly, and a zoo of hand-rolled
interactive widgets (9 on web, 11 on mobile: toasts, confirm modals, custom dropdowns, a fake
in-form payment flow, multi-part date pickers). Practicing against OmniPizza means meeting the
pitfalls production apps contain by accident — here documented and stable.

### 3.8 A reference test portfolio over one system

Four heterogeneous test layers — from in-repo component tests to an external API suite —
target the same product: schema-generated contract tests (Schemathesis, case count scales with
the OpenAPI schema), 41 hand-written API integration cases including a golden characterization
suite, 11 component-test specs, and platform E2E latency-resilience experiments. This enables
like-for-like comparison of what each layer detects (executed as an exemplar in Section 4.1). The product requirements document additionally ships a 13-scenario
negative-flow acceptance matrix (expected status codes and UI outcomes), usable directly as an
oracle dataset.

## 4. What the Laboratory Is Instrumented to Measure (RQ2)

Catalog format: dimension → instrument the platform provides → example measurement → status.
This is an *affordance* catalog: rows are design claims about what studies the platform
enables, not executed results; the status column records which rows this paper exercises.

| Dimension | Instrument | Example measurement | Status |
|---|---|---|---|
| Detection power per test layer | the same seeded defect (e.g., `problem_user`'s $0 prices) observable at contract, API, component, and E2E layers | which layers catch it; cost per detection | **executed as an exemplar (4.1): 0 of 4 layers detect it as-is** |
| Latency resilience | `performance_glitch_user` (fixed 3 s on catalog fetch and checkout) + debug latency-spike endpoint (0.5–5 s random) | timeout handling, loading-state correctness, flake rate vs. delay | affordance — not yet executed |
| Probabilistic-failure handling | `error_user` (checkout 500 at p = 0.5) | retry logic, error-UX consistency, test-retry policy behavior | affordance — not yet executed |
| Accessibility detection | `a11y_glitch_user` (3 defect modes on catalog/cart calls) | recall of a11y tooling against known seeded defects | affordance — not yet executed |
| Security detection | `security_glitch_user` (XSS payloads, info leaks, ownership bypass) | scanner recall against known seeded vulnerabilities | affordance — not yet executed |
| i18n / RTL correctness | 6 languages incl. Arabic RTL; 5 market rule sets; cross-platform copy | cross-platform copy divergence; RTL layout checks; per-market validation coverage | exercised incidentally in Section 5 (copy-divergence findings) |
| Test-setup cost and flake surface | atomic entry (3.4) vs. full journey to the same state | steps/time-to-state; which flakes disappear under atomic entry | affordance — not yet executed |
| Selector-strategy robustness | viewport-dependent suffixes, widget zoo, RTL | locator survival across viewports/languages | affordance — not yet executed |
| QA process phenomena | deterministic replay + durable triage artifacts + public deployments | triage taxonomies, false-positive provenance, harness-artifact studies | exercised — Section 5 |

### 4.1 An executed exemplar: the seeded $0-price defect across the four layers

To convert one catalog row from design claim into evidence, we ran the Section 3.8 portfolio
**as-is** — no suite modified — against the seeded `problem_user` defect on 2026-07-23, on a
local instance at the pinned snapshot. Ground truth was confirmed live before the runs
(12/12 catalog pizzas at price 0.0 with the broken image URL). Outcome: **none of the four
layers detects the defect**, each for a different, instructive reason:

| Layer | As-is outcome |
|---|---|
| Contract (Schemathesis) | **Non-executable:** the pinned 3.25.1 loader rejects the backend's current OpenAPI 3.1.0 schema; moreover `price` is an unconstrained `number` in both response schemas, so even a working contract run could not flag $0 — undetectable *by construction* |
| API integration (Vitest) | **Inverted oracle:** 46/46 green with the defect active — the golden characterization suite *asserts* `price = 0` and the broken image for `problem_user` as expected sandbox behavior; it would fail only if the seeded defect were removed |
| Component (Cypress) | **Structurally blind:** components mount against hardcoded fixtures (price 12.99) and never contact the backend; incidentally 1 of 11 specs fails on mount for an unrelated staleness (the component gained an i18n prop after the spec was written) — invisible in CI because this layer runs non-blocking |
| E2E (Detox) | **Scaffolding only:** `detox`/`jest` are absent from the workspace's dependencies, the jest config referenced by `.detoxrc.js` does not exist, and the released `androidTest` APK (8.5 KB, 4 entries) contains no Detox instrumentation; the one spec targets only the standard and performance-glitch personas, with no price oracle |

Reading: in a sandbox whose seeded defects are *intentional*, detection and characterization
pull in opposite directions — the only layer that observes the defect pins it as correct.
Two of the four layers had silently decayed into non-executability (schema-version drift;
missing tooling), a fact the exemplar surfaced and the status column now records. The
measurement this row promises (per-layer detection power) therefore additionally requires
defect-blind oracles — which the planned machine-readable seeded-defect manifest (Section 7)
would enable.

## 5. Evaluation: One Week of External Automated QA (RQ3)

**Setting.** An external automated QA harness (UI + API suites, multiple markets and
languages, web and mobile) — not under our control and not observable to us — exercised the
deployed platform and filed findings over one week (2026-07-16 → 07-22): six triage cycles,
five findings-bearing reports plus one re-verification round. Every finding was triaged by an
LLM agent under human supervision; every cycle produced a durable, dated explanation document.

**Method (self-contained summary).** Retrospective embedded case study (Runeson & Höst) over
archival artifacts: the six dated explanation documents, git history, and QA report content as
quoted therein. One finding = one numbered item in the explanation documents' contemporaneous
segmentation; excluded from N = 19: one item pre-dismissed by the reporting team, two bugs the
report itself attributed to the harness's own code, and self-discovered sibling bugs from fix
sweeps (the first two exclusions bias the measured real-bug rate *upward*; Section 7). Coding:
an LLM-assisted pass over the Spanish-language sources, human-reviewed row by row; verdict
state is decomposed into a binary verdict, a taxonomy class, and a root-cause narrative with a
confidence flag; rates use final verdicts (one cycle's 3/3 was 2/3 under initial verdicts).
The studied triage protocol enforced reproduce-before-verdict against the running system,
fix-and-commit for confirmed bugs, durable explanation documents, and human decision gates.
The full coding table ships as `findings.csv` (appendix), which also pins the artifact version
(release tag) in effect at each cycle.

**The laboratory as app under test.** 19 findings; 11/19 real bugs, all fixed and shipped
(4 of the 6 cycles produced a release). Real-bug rate per cycle: 6/8 (07-16) → 1/3 (07-18) →
re-verification, 0 new (07-19) → 1/2 (07-20) → 3/3 (07-21) → 0/3 (07-22) — non-monotonic; the
decline is in severity and at the endpoints (the late all-real cycle was exclusively
low-severity localization copy drift).

**The laboratory as phenomenon generator.** All 19 findings distribute into a preliminary
8-class verdict classification (real bug; harness artifact; shared-fixture state;
infrastructure; accepted-by-design; third-party; not reproducible; exonerated-unattributed).
The 8 non-bug findings decompose as: 1 harness artifact, 1 shared-fixture state, 1
infrastructure, 2 exonerated-unattributed, 1 accepted-by-design, 1 third-party, 1 not
reproducible. Highlights:

- **Instrumentation-mediated false positives:** 2 confirmed — a `resetSession` deep link fired
  mid-session by the harness (class: harness artifact) and cart hydration surfacing an orphan
  cart left by earlier tests (class: shared-fixture state; the hydration feature is the
  vehicle, the leftover fixture the cause) — plus 1 candidate (profile seeding, one of the
  exonerated-unattributed pair). The `instrumentation-mediated` attribute is orthogonal to the
  class.
- **Environment phenomena:** a single opportunistically measured free-tier cold start of
  31.5 s (warm requests ranged 215–663 ms over repeated checks) presenting as a
  market-specific "slow tracking" bug.
- **Triage failure modes:** 2 root-cause retractions and 1 verdict reversal (a triage false
  negative flipped when the harness's contains-substring assertion semantics became known) —
  both retracted explanations were attributions about the unobservable external harness, while
  every app-side empirical exoneration survived.

**Reading (hedged).** In this single deployment, findings classified as real bugs declined at
the endpoints of the window (with a late low-severity spike) — consistent with, but not
demonstrating, app convergence; with one harness we cannot exclude alternative explanations
such as saturation of the harness's check inventory. The non-bug findings instantiate several
phenomenon classes the design targets; because the classification was derived from these same
findings, this is an existence proof of phenomenon generation, not a confirmation of the
Section 4 catalog.

## 6. Design-for-Testability Guidelines (RQ4)

Transferable patterns, each tagged with the strength of its evidence:

1. **Put failure modes in credentials.** Deterministic chaos personas compose orthogonally
   with every other test dimension and need no environment mutation. *[Grounded in design
   history, Section 3.2.]* Trade-off (anticipated, not yet observed): personas are part of the
   public contract; changing their behavior is a breaking change.
2. **Make market/i18n rules data, not branches.** Enumerable rule tables turn compliance into
   walkable test dimensions. *[Grounded in design history, Section 3.3; trade-off observed in
   Section 5: drift between rule table/copy and platforms is itself a bug class.]*
3. **Ship sanctioned state-injection entry points — and treat their side effects as part of
   the design.** O(1) setup removes the flakiest part of E2E suites *[grounded in design
   history, Section 3.4]*; the observed cost is that the same bypasses mediate false positives
   *[observed in Section 5]*. The prescriptive half — guardrails such as refusing
   `resetSession` mid-scenario, plus usage telemetry — is proposed future design: OmniPizza
   currently ships only a partial defensive guard and no telemetry.
4. **Version your instrumentation.** Selectors, headers, and response shapes treated as a
   public API make automation durable. *[Grounded in design rationale, Section 3.5; no
   breaking-rename episode occurred in the evaluation window to test it.]*
5. **Prefer resettable state; key mutable session state to the login.** Restart-as-reset plus
   per-login profile isolation removed an observed race *[grounded in design history,
   Section 3.6]*; where shared mutable fixtures remain, their leftovers mimic deterministic
   app bugs *[observed in Section 5]* — decide per state class, deliberately.
6. **Make triage durable and falsifiable.** Dated explanation documents that record their own
   retractions turn triage into auditable data — and any attribution about a system you cannot
   observe is a hypothesis for its owner, not a verdict. *[Observed in Section 5: both
   retracted explanations were cross-boundary attributions.]*
7. **Carry assertion semantics with findings.** A contains-vs-exact mismatch flipped a
   verdict; harness assertion contracts should travel as metadata with each reported finding.
   *[Conjecture generalized from a single observed incident.]*

## 7. Discussion, Limitations & Threats (outline)

- Artifact-paper threats: the authors built the platform (adoption evidence is exactly one
  external harness; the four audiences of Section 1 are intended, not demonstrated); sandbox
  realism vs. production representativeness (deliberately seeded chaos inflates specific
  phenomena; free-tier hosting inflates the infrastructure class); no machine-readable
  ground-truth manifest of seeded defects yet (the tool-builder pitch depends on it; planned
  as supplementary material); archival sustainability (live deployments sit on a free tier —
  an archived snapshot with a pinned commit/DOI is committed to in Section 8).
- Evaluation threats (condensed from the Section 5 instrument): self-reported triage documents
  written by the triaging agent; researcher-as-participant; LLM-as-triager validity as its own
  threat class; recorded triage failures are a lower bound (external re-verification coverage
  was asymmetric); N = 19 under stated inclusion rules whose exclusions bias the real-bug rate
  upward; the study window ends where the data stopped; primary sources in Spanish, coding
  involves human-reviewed translation.
- Taxonomy construct validity: the 8-class classification is preliminary — induced post hoc
  from the same 19 findings by a single coder pipeline (LLM + one supervising author), several
  classes have n = 1, no second coder or inter-rater reliability yet.
- Moving-target artifact: 11 bugs were fixed and 4 releases shipped *during* the evaluation
  window, so per-cycle rates measure a changing artifact (mitigated by pinning the release tag
  per cycle in `findings.csv`).
- Third-party ethics: the evaluation publishes failure attributions about an identifiable
  external harness operator whose system we cannot observe — attributions are labeled as
  hypotheses, and the operator remains anonymous.
- Documentation drift as a user-facing hazard: parts of the in-repo product documentation
  predate the newest market and chaos users (they describe 4 markets / 5 personas vs. the
  current 5 / 7) — a caveat for platform adopters and itself a measurable phenomenon.
- Scope boundary: one catalog row was executed as a low-cost exemplar (Section 4.1,
  2026-07-23, local instance at the pinned snapshot); the remaining Section 4 rows are
  enabled, not executed — by design of this paper; candidates for follow-up work. Guideline
  generalizability is bounded by one domain (e-commerce), one team.

## 8. Conclusion & Availability (outline)

- Restate: a realistic product can be a controlled laboratory if determinism, controllability,
  and observability are product features; one week of real external QA use provides an
  existence proof in both roles — app under test and phenomenon generator — including the
  instructive failure mode where the laboratory's own instrumentation mediates false
  positives.
- Future work: independent adoption studies; executing the Section 4 catalog (per-layer
  detection power, atomic-entry setup-cost comparison); a machine-readable seeded-defect
  manifest; harness-side assertion-semantics metadata.
- Availability: public repository (backend, web, mobile, tests, documentation) and live
  deployments (`https://omnipizza-backend.onrender.com`,
  `https://omnipizza-frontend.onrender.com`); an archived snapshot (pinned commit, DOI) will
  accompany the preprint.

## References (candidates — to be completed)

- P. Runeson, M. Höst. *Guidelines for conducting and reporting case study research in
  software engineering.* Empirical Software Engineering, 2009.
- R. K. Yin. *Case Study Research and Applications*, 6th ed., 2018.
- R. J. Wieringa. *Design Science Methodology for Information Systems and Software
  Engineering.* Springer, 2014.
- R. V. Binder. *Design for testability in object-oriented systems.* CACM, 1994.
- R. S. Freedman. *Testability of software components.* IEEE TSE, 1991.
- Q. Luo, F. Hariri, L. Eloussi, D. Marinov. *An empirical analysis of flaky tests.* FSE 2014.
- J. Micco. *The state of continuous integration testing at Google.* 2017.
- Defects4J / BugsJS / Juice Shop / SauceDemo sources (to be pinned for Section 2).

## Appendix / supplementary material

- **Platform fact sheet (required companion):** every Section 3–5 number with its counting
  rule and the pinned snapshot commit (endpoint operations vs. paths; selector *occurrence*
  counts vs. distinct IDs; release count excluding duplicate-case legacy tags; widget-table
  row counts).
- `findings.csv` — coding table of the 19 evaluation findings (verdict decomposition,
  confidence and instrumentation-mediated flags, artifact version per cycle), with
  original-language excerpts.
- Machine-readable seeded-defect manifest (planned; required for the tool-builder use case).
- Pointers to primary artifacts: `documents/explanation/EXPLANATION_qa_report_*.md`,
  `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md`, `backend/constants.py`, fix commits by
  hash.

---

*Data availability:* the study platform and all primary artifacts are public: repository
(backend, web, mobile, tests, documentation) and live deployments
(`https://omnipizza-backend.onrender.com`, `https://omnipizza-frontend.onrender.com`).
