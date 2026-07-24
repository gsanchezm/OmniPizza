# OmniPizza: A Controlled Laboratory for Multi-Platform Test Automation

> **Status:** base document (v0.5, 2026-07-23). IMRaD structure: 1 Introduction (CARS) ·
> 2 Related Work (outline) · 3 Methods (derivation, materials, instruments, exemplar
> procedure, case-study method) · 4 Results · 5 Discussion (prose + guidelines + threat
> enumeration) · 6 Conclusion & Availability. The Abstract and the related-work half of
> Section 2 remain outlines (2.1, the theoretical framework, is drafted); everything else is
> drafted prose. All quantitative claims were adversarially fact-checked
> against the repository at the pinned snapshot (Section 3.1).
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

## 1. Introduction

Automated testing is how modern software teams buy confidence: continuous-integration
systems execute suites at every change, and an ecosystem of tools — locator engines,
contract checkers, accessibility scanners, and lately LLM-based testing tools (Wang et al.,
2024) —
competes to turn those executions into trustworthy verdicts. Progress in this field has
always depended on shared objects of study. Researchers measure techniques against curated
infrastructures and defect corpora (Do et al., 2005; Just et al., 2014); practitioners learn
and calibrate against demo systems; and a design tradition running from Freedman (1991) and
Binder (1994) treats controllability and observability as properties a system can be
engineered to have rather than accidents it happens to exhibit.

The available objects of study pull in different directions, and none of them supports the
everyday questions of multi-platform UI and API automation. Defect corpora are controlled
but frozen: they package historical faults for offline scoring, not a running product a
harness can exercise today. Production systems are live but unsafe and closed to inspection,
and the signals obtained by testing them at scale are pervaded by nondeterminism (Memon et
al., 2017; Parry et al., 2022). Demo applications occupy the safe middle and give up the hard parts: they tend to be
single-platform or single-concern — SauceDemo's personas stop at a handful of web behaviors
(Sauce Labs, n.d.); Juice Shop targets security alone (OWASP Foundation, n.d.) — and their
testability machinery carries no compatibility contract — selectors and personas can change
without notice — and has not been studied as a research object in its own right. What is missing is a
system realistic enough for the pitfalls to matter, deterministic enough for claims to be
checkable, and instrumented enough that the instrumentation itself can be examined: a
controlled laboratory rather than a demo.

This paper proposes such a laboratory and examines what one week of real use reveals about
it. OmniPizza is an open, publicly deployed pizza-ordering product — FastAPI backend, React
web, React Native mobile — built so that testability is a product feature: deterministic
failure personas whose behaviors travel in credentials, market and language rules held as
data, sanctioned state-injection entry to any screen, and instrumentation contracts
versioned like public APIs. We describe the design mechanisms and their provenance (RQ1),
catalog what the platform is instrumented to measure and execute one catalog row as an
exemplar (RQ2), evaluate the platform under one week of external automated QA through a
retrospective case study (RQ3), and distill design-for-testability guidelines tagged by the
strength of their evidence (RQ4). The laboratory is designed to serve four audiences —
practitioners training against deliberately embedded pitfalls (viewport-dependent selectors,
custom widgets, RTL, shared-fixture state), tool builders needing a stable benchmark target with
documented seeded defects, researchers needing deterministic phenomena with archival capture
of the triage side of the QA process, and educators needing a free, deployed, resettable
curriculum — though adoption evidence to date is a single external harness (Section 5.2).

The domain is deliberately mundane. Multi-market commerce exercises internationalization and
right-to-left layout, per-market validation rules, currency and tax arithmetic, and checkout
flows — a realistic complexity envelope over a vocabulary small enough that no reader needs
domain training.

- **Research questions** (typed per Wieringa, 2014; each names its evidence and strength):
  - **RQ1 (descriptive design question).** What design mechanisms make a realistic
    multi-platform product function as a controlled testing laboratory — deterministic,
    controllable, observable — without ceasing to be realistic? *Evidence: the verified
    artifact description, Sections 3.1–3.2.*
  - **RQ2 (capability/affordance question).** What testing-related properties is the platform
    instrumented to measure? *Evidence: the affordance catalog, Section 3.3; one row
    executed via the Section 3.4 procedure (results in Section 4.1), the QA-process row
    exercised by Section 4.2, the rest remain design claims.*
  - **RQ3 (validation question).** How does the platform behave under real external
    automated-QA use? *Evidence: the retrospective case study (method in Section 3.5, results in
    Section 4.2) — an existence proof from one deployment and one external harness.*
  - **RQ4 (prescriptive question).** What transferable design-for-testability guidelines,
    with what trade-offs, follow from the design and its evaluation? *Evidence: Section 5.1,
    each guideline tagged by evidence strength.*
- Contributions (approved list):
  1. The platform, made available to the four audiences above: open, publicly deployed,
     reproducible (3 deployables, 5 markets / 6 languages incl. RTL, 7 deterministic chaos
     users, 20 `/api` operations under contract, heterogeneous test suites).
  2. A design-pattern catalog for testability-first product design (Section 3.2).
  3. A catalog of properties the laboratory is instrumented to measure or study (Section 3.3).
  4. Evaluation in real use: one week of external automated QA — 19 findings, a preliminary
     8-class verdict classification, and instrumentation-mediated false positives
     (Sections 3.5 and 4.2).
  5. Design-for-testability guidelines tagged by evidence strength (Section 5.1).

## 2. Related Work and Theoretical Framework (related work: outline)

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
  test-fixture pollution — the phenomena Section 4.2 shows the laboratory generating.
- LLMs in testing and triage; human-AI oversight (context for the evaluation's triage
  protocol).
- Case-study and design-science methodology (Runeson & Höst; Yin; Wieringa).

### 2.1 Theoretical framework: an operational map

Four theoretical lenses did load-bearing work in this study. Each is stated here only in
the form in which it constrained the design, and each abstract concept is anchored to a
variable that Sections 3–4 measure.

**Testability as controllability plus observability** (Freedman, 1991; Binder, 1994). The
lens holds that a system is testable to the degree that its state can be set and its
behavior seen. In this study, controllability is operationalized as the chaos-persona
mechanism and the atomic state-injection entry points: the `behavior` JWT claim with its
fixed parameters — the $3.0\,\mathrm{s}$ delay, the $p = 0.5$ checkout failure (a persona
design parameter, not a significance level), the $3 \times 3$ payload pool of
Section 3.2.1 — and the sanctioned entry parameters of
Section 3.2.3. Observability is operationalized as the selector contract (the $165$ web and
$114$ mobile occurrences of Section 3.2.4), the required-header rejections, and the durable
triage archive of Section 3.5. The lens dictated method, not just vocabulary: because both
properties are claimed to be *engineered*, RQ1 is answered by an artifact description
verified against code (Section 3.1) rather than by perception surveys, and the Section 3.3
catalog enumerates instruments dimension by dimension. As a flow:
$\text{persona} \xrightarrow{\text{JWT claim}} \text{deterministic fault}
\xrightarrow{\text{selectors, archives}} \text{measurable observation}$.

**The oracle problem, in derived form** (Weyuker, 1982; Barr et al., 2015). Barr et al.
classify test oracles into specified, derived, implicit, and none; a characterization suite
is a *derived test oracle* — it learns what to expect from the behavior it observes. For a
sandbox whose defects are intentional, the lens yields a falsifiable prediction: if
$\text{oracle} \leftarrow \text{behavior}$ and $\text{defect} \subseteq \text{behavior}$,
the oracle certifies the defect and $\text{detection} = 0$. The exemplar procedure of
Section 3.4 provides a direct test of this prediction — suites executed as-is, ground truth
confirmed live ($12/12$ items at price $0.0$) before any run — and Section 4.1 reports the
outcome for the derived-oracle layer alongside the other three layers' independent failure
modes; the lens reading itself was applied at analysis time, per the ex-ante/ex-post
discipline of Section 3.1. The abstract concept *ground truth* is operationalized today as the
live-confirmed seeded state and, prospectively, as the machine-readable defect manifest
(Section 5.2).

**Effective false positives** (Sadowski et al., 2018). The abstract notion that a finding's
usefulness is relative to its consumer is operationalized in the three-variable verdict
decomposition of Section 3.5 — binary verdict, eight-class taxonomy, and a
confidence-flagged root-cause narrative — plus the orthogonal `instrumentation-mediated`
flag, all carried per finding in `findings.csv`. Misclassification prevalence (Herzig et
al., 2013) motivated the separation: a single verdict variable would have conflated
retraction with reversal, so the instrument distinguishes them by construction.

**Design science with a case-study validation arm** (Hevner et al., 2004; Wieringa, 2014;
Runeson & Höst, 2009; Yin, 2018). The platform is treated as a designed artifact validated
in context: its rationale is reconstructed and provenance-labeled (Section 3.1), the context
is one week of external automated QA, and the validation is a retrospective embedded case
study whose triangulation requirement is met by three archival sources (Section 3.5). This
lens set the epistemic ceiling in advance — analytic rather than statistical
generalization — which is why the paper's claims are existence proofs, its guidelines carry
evidence-strength tags (Section 5.1), and no inferential statistics appear anywhere.

| Abstract concept | Operationalized as | Where |
|---|---|---|
| Controllability | persona `behavior` claim ($3.0\,\mathrm{s}$; $p = 0.5$; $3 \times 3$ payloads); atomic entry parameters | 3.2.1, 3.2.3 |
| Observability | selector occurrences ($165$ web, $114$ mobile); required-header rejections; durable triage archive | 3.2.4, 3.5 |
| Derived oracle | golden-suite assertions (e.g., `expect(p01.price).toBe(0)`) | 3.4, 4.1 |
| Ground truth | live-confirmed seeded state ($12/12$ at $0.0$); planned defect manifest | 3.4, 5.2 |
| Effective false positive | binary verdict, taxonomy class, and `instrumentation-mediated` flag as separate variables | 3.5, `findings.csv` |
| Triangulation | three archival sources (explanation documents, git history, quoted QA reports) | 3.5 |
| Treatment in context | deployed platform exercised by an external harness | 3.5, 4.2 |
| Analytic generalization | evidence-strength tags on guidelines | 5.1 |

## 3. Methods

The study combines two instruments joined by a low-cost executed exemplar: a design-science
artifact description and a retrospective embedded case study. Research questions map to
evidence as follows: RQ1 → the verified platform description (3.2); RQ2 → the
instrumentation catalog (3.3), with one row executed via the procedure in 3.4 (results in
4.1); RQ3 → the case-study method (3.5; results in 4.2); RQ4 → the guidelines derived in the
discussion (5.1).

### 3.1 Derivation and verification of the platform description

The design rationale was reconstructed exclusively from dated archival sources — the in-repo
product-requirements and design documents, the two atomic-testing guides, the QA-architecture
document, and the git history ($209$ commits, 2026-02-07 → 2026-07-22) — rather than from the
authors' recollection, so that every design claim traces to an artifact a reader can open.
Descriptive accuracy was then enforced mechanically. Every quantitative claim in Sections 3–4
was verified against the repository — code and archival documents — at a pinned snapshot,
commit `83b8ba4` (2026-07-22,
the last product commit of the study window), by an adversarial fact-checking pass run
independently of the drafting pass; the separation was chosen because self-verified
descriptions inherit the drafter's assumptions, and it earned its keep here — three drafted
claims (the required-header enforcement surface, the scope of the injected latency, and a
widget count) were refuted against the code and corrected. Each surviving count carries an explicit counting rule —
what is counted, what is excluded, and the command that reproduces the number — consolidated
in the fact-sheet appendix, a required companion of this paper rather than optional material.

Design principles are additionally labeled by provenance. Mechanisms stated as goals in the
founding documents (chaos personas, market-as-data, atomic entry, selector contracts) are
marked *ex-ante*; codifications of operational lessons — the per-login profile keying of
Section 3.2.5, introduced mid-history to fix an observed login race, and a defensive deep-link
guard — are marked *ex-post*. The labeling was adopted so the catalog does not present
hindsight as foresight.

### 3.2 Materials: the OmniPizza platform (RQ1)

Three deployables — FastAPI backend, React/Vite web, Expo/React Native mobile — plus test
suites in and out of the app packages. The product surface is a complete ordering flow (login,
catalog, pizza builder, checkout, order tracking, profile) over a catalog of 12 pizzas
localized in 6 languages. Testability mechanisms are product features with the same
compatibility guarantees as user features.

#### 3.2.1 Chaos-by-identity: failure modes travel in credentials

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
| `security_glitch_user` | XSS-seeded profile fields (one random pair per login from a 3-field × 3-payload pool), internal-error message leaks at p = 0.5, order-ownership bypass |

Because the failure mode is keyed to the *identity*, it composes orthogonally with every
market, language, and platform — no environment flags, no server-side test configuration, and
two tests using different personas never interfere.

#### 3.2.2 Multi-market complexity as data, not code

One configuration table drives 5 markets (MX, US, CH, JP, SA): currency and conversion,
decimal rules (JPY: 0 decimals), tax rates (8–16%), a market-specific required address field
(`colonia` / `zip_code` / `plz` / `prefectura` / `district`), and a localized tip field name
(`propina` / `tip` / `trinkgeld` / `chip` / `baksheesh`). A model-level validation rule
additionally enforces the 5-digit US zip format. SA additionally exercises Arabic
right-to-left layout. Market rules are therefore *enumerable test dimensions*: a test
generator can walk the table instead of reverse-engineering branches.

#### 3.2.3 Atomic state injection: O(1) entry to any screen

Both platforms expose sanctioned bypasses that put a test *directly into* any target state
instead of replaying the user journey:

- **Web:** seed `localStorage` (documented key set with the store-envelope format), seed
  backend state via `POST /api/cart` and `POST /api/store/market`, then navigate straight to
  the target route; the Checkout page hydrates from `GET /api/cart` when its local cart is
  empty.
- **Mobile:** `omnipizza://` deep links to 6 screens with universal parameters
  (`accessToken` bypasses login, `market`, `lang`, `resetSession`, `hydrateCart`), plus a
  Detox launch argument for market selection.

The bypasses are load-bearing, versioned features — and Section 4.2 shows their cost: the
same machinery, working exactly as designed, mediated false positives during real QA use.

#### 3.2.4 Instrumentation contracts as versioned APIs

Every interactive element carries a stable selector (165 `data-testid` occurrences on web,
114 `testID` on mobile, shared prefix convention); routes and response shapes are frozen. The
API surface under contract is 20 `/api` route operations (18 distinct paths; 22 operations
including root and health probes). The market-sensitive *read* endpoints — catalog fetch and
cart hydration — reject requests without an `X-Country-Code` header (HTTP 400); checkout
instead carries the market in its request body. Selector renames are treated as breaking
changes — testability has the same compatibility discipline as a public API.

#### 3.2.5 Ephemeral state as isolation

The backend persists everything in memory: restart = deterministic clean slate. Editable
profile state is keyed to the login session (a per-login `sid` JWT claim), so concurrent
sessions of the same shared test user get isolated profiles — an *ex-post* design lesson: the
keying was introduced mid-history to fix an observed login race. The flip side, warm-instance
state retention on shared fixtures, is deliberately kept: it generates exactly the
shared-fixture phenomena that Section 4.2 studies.

#### 3.2.6 A deliberately embedded automation curriculum

Real-world automation pitfalls are reproduced on purpose: viewport-dependent selector suffixes
that switch at a responsive breakpoint, a deploy-guard key that silently wipes naively seeded
auth state, a persistence envelope that must be reproduced exactly, and a zoo of hand-rolled
interactive widgets (9 on web, 11 on mobile: toasts, confirm modals, custom dropdowns, a fake
in-form payment flow, multi-part date pickers). Practicing against OmniPizza means meeting the
pitfalls production apps contain by accident — here documented and stable.

#### 3.2.7 A reference test portfolio over one system

Four heterogeneous test layers — from in-repo component tests to an external API suite —
target the same product: schema-generated contract tests (Schemathesis, case count scales with
the OpenAPI schema), 41 hand-written API integration cases including a golden characterization
suite (46 executed at runtime via parameterized expansion; fact-sheet counting rule),
11 component-test specs, and platform E2E latency-resilience experiments. This enables
like-for-like comparison of what each layer detects (procedure in Section 3.4; results in
Section 4.1). The product requirements document additionally ships a 13-scenario
negative-flow acceptance matrix (expected status codes and UI outcomes), usable directly as an
oracle dataset.

### 3.3 Instruments: what the laboratory is instrumented to measure (RQ2)

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
| i18n / RTL correctness | 6 languages incl. Arabic RTL; 5 market rule sets; cross-platform copy | cross-platform copy divergence; RTL layout checks; per-market validation coverage | exercised incidentally in Section 4.2 (copy-divergence findings) |
| Test-setup cost and flake surface | atomic entry (3.2.3) vs. full journey to the same state | steps/time-to-state; which flakes disappear under atomic entry | affordance — not yet executed |
| Selector-strategy robustness | viewport-dependent suffixes, widget zoo, RTL | locator survival across viewports/languages | affordance — not yet executed |
| QA process phenomena | deterministic replay + durable triage artifacts + public deployments | triage taxonomies, false-positive provenance, harness-artifact studies | exercised — Section 4.2 |

### 3.4 Exemplar procedure: the seeded $0-price defect across the four layers

To convert one catalog row from design claim into evidence, the Section 3.2.7 portfolio was
executed **as-is** — no suite modified — against the seeded `problem_user` defect on
2026-07-23, on a local instance at the pinned snapshot (backend served on port $8000$ with a
fresh in-memory state; Vitest 4.0.18 via `npx vitest run`, with the repository-pinned
`fileParallelism: false` because the suites share one stateful backend; Cypress 15.11.0
headless via `cypress run --component`; Schemathesis 3.25.1 under pytest 7.4.4 with
`max_examples = 50` per endpoint). Ground truth was confirmed live before the runs: a
`problem_user` login followed by a catalog fetch returned $12/12$ pizzas at price $0.0$ with
the broken image URL. Outcomes are reported in Section 4.1.

### 3.5 Case-study method: one week of external automated QA (RQ3)

**Setting.** An external automated QA harness — UI and API suites spanning multiple markets
and languages on web and mobile, operated by a third party and observable to the authors only
through its reports — exercised the publicly deployed platform over one week
(2026-07-16 → 2026-07-22). Six triage cycles resulted: five findings-bearing reports plus one
re-verification round. Each finding was triaged by an LLM agent (Claude, Anthropic) under
standing human-defined rules with per-batch human decision gates, and each cycle produced a
durable, dated explanation document at triage time — before this paper was conceived
(document-provenance caveats: Section 5.2).

**Design.** The evaluation was framed as a retrospective embedded single-case case study
(Runeson & Höst, 2009; Yin, 2018): the case is the week of operation; the embedded units are
the findings. A retrospective design was chosen because the triage occurred as normal
engineering work, which removes design-for-publication bias from the process under study —
at the cost of the self-report concerns disclosed in Section 5.2.

**Data and inclusion.** Three archival sources were triangulated: the six dated explanation
documents (written in Spanish), the git history (fix commits are cited by hash inside the
documents and were re-resolved against the repository), and the QA-report content as quoted
in the documents — the raw reports are deleted by the triage workflow and survive only as
quotations, a stated limitation. One finding equals one numbered item in the documents'
contemporaneous segmentation; the rule was adopted to avoid re-segmenting the corpus with
hindsight. Three exclusion rules yield $N = 19$: one item the reporting team had dismissed
before the window, two bugs the report itself attributed to the harness's own code, and
same-pattern sibling bugs self-discovered during fix sweeps. The first two exclusions remove
non-bugs from the denominator and therefore bias the measured real-bug rate *upward*; the
direction is stated so readers can reason about it (Section 5.2).

**Coding.** Findings were coded by an LLM-assisted extraction pass over the Spanish-language
sources and reviewed by a human row by row against the quoted text; translation into English
occurred during coding and was human-reviewed. Verdict state was deliberately decomposed into
three variables — a binary verdict (app bug / not app bug), one of eight taxonomy classes,
and a root-cause narrative carrying a `confirmed` / `candidate` / `unidentified` confidence
flag — because the corpus contains events a single verdict variable would conflate: two
root-cause retractions that left binary verdicts standing, and one verdict reversal that
flipped a binary verdict outright. A fourth coded attribute, the `instrumentation-mediated`
flag, takes the values true / false / candidate and is set to true only when a sanctioned
state-injection mechanism — cart hydration, `resetSession`, profile seeding — is the vehicle
of the finding; harness usage patterns such as parallel logins do not qualify. All rates use
final verdicts; the one divergence under
initial verdicts (a cycle scored $3/3$ finally but $2/3$ initially) is reported alongside.
The full coding table ships as `findings.csv` (appendix), which also records the release
each cycle's fixes shipped in, because $11$ bugs were fixed and five releases shipped
*during* the window (four of them triage-driven; the fifth, v1.1.6, was concurrent feature
work) — per-cycle rates therefore describe a moving artifact, a threat Section 5.2 records.

**Protocol under study.** The triage protocol itself — the object of RQ3 — enforced
empirical reproduction against the running system (API replay, seeded-state reproduction,
on-device reproduction via `adb`, in-page axe-core runs) before any verdict that exonerated
the app; confirmed bugs with self-evident code-level causes could be verdicted by code audit
plus targeted measurement. It further required fix-and-commit with conventional-commit hashes
for confirmed bugs, durable explanation documents for every cycle, and explicit human
authorization per push and release.

## 4. Results

### 4.1 The exemplar: the seeded $0-price defect across the four layers

No failure attributable to the seeded defect was reported by any layer — $0/4$ detection.
Two of the four layers did not execute. Per-layer observations:

| Layer | Observed outcome (as-is) |
|---|---|
| Contract (Schemathesis) | Collection failed before any case ran: version 3.25.1 raises `SchemaError` on the backend's OpenAPI 3.1.0 document ("currently not fully supported"). Independently, `price` carries no `minimum` constraint in either response schema (`Pizza`, `EnrichedCartItem`); a value of $0$ is schema-valid |
| API integration (Vitest) | $46/46$ cases passed with the defect active. Two cases assert the defect as expected behavior for `problem_user`: `expect(p01.price).toBe(0)` and the broken-image URL (`tests/golden.test.ts`) |
| Component (Cypress) | $14/15$ cases across $11$ specs passed. Every spec mounts against fixture data (`price: 12.99`); none issues a backend request. The one failing spec (`ProductCard.cy.jsx`) raised `TypeError: t is not a function` at mount; the spec predates the component's `t` prop. The layer runs under `continue-on-error: true` in CI |
| E2E (Detox) | Did not execute. `detox` and `jest` are absent from the workspace's dependencies; `e2e/jest.config.js`, referenced by `.detoxrc.js`, does not exist; the released `androidTest` APK contains $4$ entries ($8{,}518$ bytes) and no Detox classes. The single spec contains no price assertion and authenticates only as `standard_user` and `performance_glitch_user` |

Interpretation of these outcomes — the detection-vs-characterization tension, the decayed
layers, and the oracle requirement they imply — is deferred to Section 5.

### 4.2 One week of external automated QA

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

Interpretation of these results is deferred to Section 5.

## 5. Discussion

The exemplar's headline number is small but pointed. Zero of four layers flagged a defect
whose ground truth was known and confirmed live. The data suggest that in a sandbox whose
defects are intentional, detection and characterization pull in opposite directions: the
suite that watches the catalog most closely is precisely the one that certifies $0$ prices
as correct. This reads as Weyuker's (1982) oracle problem in inverted form — an oracle
exists and executes, but it is aligned with the defect rather than with the requirement.
Barr et al. (2015) classify test oracles into specified, derived, implicit, and none; a
characterization suite is a derived test oracle, and derivation is the vulnerability here,
because it derives from behavior and the behavior is seeded. Where defect benchmarks treat curated faults as ground truth against
which detection is scored (Just et al., 2014; Do et al., 2005), a living sandbox apparently
must maintain the opposite discipline: keeping at least one oracle blind to what the
platform seeded. The planned defect manifest is that discipline made explicit.

The two non-executable layers tell a quieter story. Schema-version drift and missing tooling
are not exotic failures; they are the ordinary bugginess of test code that Vahabzadeh et al.
(2015) document, compounded here by a CI configuration that runs the component layer
non-blocking — so its one failing spec had no channel through which to be noticed. It is
plausible that the non-blocking setting, adopted to keep noise out of the merge path, worked
exactly as intended and still produced rot: Sadowski et al. (2018) argue that developers
discount findings they perceive as non-actionable, and a permanently ignorable suite is the
limit case of non-actionability. The mechanism that protects trunk velocity also silences
the smoke alarm.

The evaluation's non-bug findings sit at a recognizable rate but an unfamiliar address.
Eight of nineteen findings ($8/19$) were, under final verdicts, not application bugs —
the same order of magnitude as the roughly one-third misclassification Herzig et al. (2013)
report for issue trackers, and consistent with the flaky-test literature's finding that
non-deterministic and environment-coupled failures pervade large CI signals (Luo et al.,
2014; Parry et al., 2022) and account for a large share of observed pass-to-fail transitions
at scale (Memon et al., 2017). The provenance, however, is where our data
diverge from the standard account. While the static-analysis literature locates false alarms
in the analyzer (Bessey et al., 2010; Johnson et al., 2013), and Sadowski et al. (2018)
relocate them in the developer's judgment, the two confirmed instrumentation-mediated
findings suggest a third locus: the sanctioned test-entry machinery itself, operating as
designed. Fixture pollution completes the picture — the orphan-cart finding is a field
instance of the state pollution Gyori et al. (2015) detect and Zhang et al. (2014) found in
every suite they examined, except that here the polluting writes arrived from other tests
through a shared account on a warm in-memory instance. Bettenburg et al. (2008) found that reporters and
developers value different information; the verdict reversal is a concrete instance in which
the missing information was not reporter effort but the harness's assertion semantics,
which is why guideline 7 argues for machine-carried metadata rather than better prose.

On the design side, the friction is with chaos engineering's canonical form. Basiri et al.
(2016) advocate injecting real-world events into production systems — randomized in tools
such as Chaos Monkey — evaluated against steady-state hypotheses; OmniPizza's chaos is
nearly the opposite — deterministic, credential-keyed,
composable — and aligns more closely with Binder's (1994) controllability/observability
program and Freedman's (1991) domain testability than with production experimentation. We do
not read the two as competitors. The data suggest that determinism is what makes a teaching
and benchmarking laboratory usable — the same persona always fails the same way, so a
detection claim is checkable — while randomized production chaos answers a different
question about a specific deployment's resilience. The $p = 0.5$ error persona sits
deliberately between the two regimes: probabilistic per request, deterministic in
distribution. Sauce Labs' `problem_user` demonstrated the persona pattern's teaching value
(Sauce Labs, n.d.); the extension here is breadth — latency, probabilistic failure,
accessibility, security — and server-side enforcement through the JWT.

The triage results speak to the LLM-in-testing literature more cautiously than that
literature sometimes speaks of itself. Kang et al. (2023) show that LLMs can reproduce
reported bugs from their reports; Wang et al. (2024) map LLM use across the testing
lifecycle; Fan et al. (2023) flag hallucination and the need for oversight as open problems.
Our week of triage is consistent with all three, and it is plausible that the protocol, not
the model, carried the reliability we observed: the two retracted explanations were the two
root-cause claims that reached beyond the reproducible boundary — attributions about a
harness the agent could not observe — and the one reversed verdict rested on a kindred gap,
the harness's unobserved assertion semantics; every claim disciplined by
reproduce-before-verdict survived. This aligns with Amershi et al.'s (2019) guidelines that
an AI system's mistakes should be efficiently dismissible and correctable (G8–G9); the
per-batch human gates and the durable, dated explanation documents were the visibility
mechanism. Runeson
et al. (2007) automated triage support with the natural-language processing of their day.
The continuity is the pattern, not the tooling: automation proposes, evidence disposes.

The limitations are substantial, and they are worth stating plainly. This is one case — one
purpose-built sandbox, one week, one external harness, nineteen findings — numbers that
support existence claims and nothing stronger, which is why no inferential statistics appear
anywhere in this paper. The authors built the platform, defined the triage rules, supervised
the triage, and now evaluate all three; case-study methodology files this under participant
observation with its attendant bias (Runeson & Höst, 2009; Yin, 2018), only partly mitigated
by the archival trail and the adversarial fact-checking of every count. The verdict
classification was induced post hoc from the same nineteen findings it organizes, by a
single coder pipeline, with several classes at $n = 1$; recorded triage failures are a lower
bound because external re-verification coverage was asymmetric. The artifact moved during
the window — eleven fixes, five releases — and three of the six source documents entered
version control only after the window closed. Generalization from a system designed to be
testable toward systems that are not is analytic at best. The sandbox measures what it was
built to exhibit. That circularity is disclosed here, not resolved.

### 5.1 Design-for-testability guidelines (RQ4)

Transferable patterns, each tagged with the strength of its evidence:

1. **Put failure modes in credentials.** Deterministic chaos personas compose orthogonally
   with every other test dimension and need no environment mutation. *[Grounded in design
   history, Section 3.2.1.]* Trade-off (anticipated, not yet observed): personas are part of
   the public contract; changing their behavior is a breaking change.
2. **Make market/i18n rules data, not branches.** Enumerable rule tables turn compliance into
   walkable test dimensions. *[Grounded in design history, Section 3.2.2; trade-off observed
   in Section 4.2: drift between rule table/copy and platforms is itself a bug class.]*
3. **Ship sanctioned state-injection entry points — and treat their side effects as part of
   the design.** O(1) setup removes the flakiest part of E2E suites *[grounded in design
   history, Section 3.2.3]*; the observed cost is that the same bypasses mediate false
   positives *[observed in Section 4.2]*. The prescriptive half — guardrails such as refusing
   `resetSession` mid-scenario, plus usage telemetry — is proposed future design: OmniPizza
   currently ships only a partial defensive guard and no telemetry.
4. **Version your instrumentation.** Selectors, headers, and response shapes treated as a
   public API make automation durable. *[Grounded in design rationale, Section 3.2.4; no
   breaking-rename episode occurred in the evaluation window to test it.]*
5. **Prefer resettable state; key mutable session state to the login.** Restart-as-reset plus
   per-login profile isolation removed an observed race *[grounded in design history,
   Section 3.2.5]*; where shared mutable fixtures remain, their leftovers mimic deterministic
   app bugs *[observed in Section 4.2]* — decide per state class, deliberately.
6. **Make triage durable and falsifiable.** Dated explanation documents that record their own
   retractions turn triage into auditable data — and any attribution about a system you cannot
   observe is a hypothesis for its owner, not a verdict. *[Observed in Section 4.2: both
   retracted explanations were cross-boundary attributions.]*
7. **Carry assertion semantics with findings.** A contains-vs-exact mismatch flipped a
   verdict; harness assertion contracts should travel as metadata with each reported finding.
   *[Conjecture generalized from a single observed incident.]*

### 5.2 Threats to validity (detailed enumeration — outline)

- Artifact-paper threats: the authors built the platform (adoption evidence is exactly one
  external harness; the four audiences of Section 1 are intended, not demonstrated); sandbox
  realism vs. production representativeness (deliberately seeded chaos inflates specific
  phenomena; free-tier hosting inflates the infrastructure class); no machine-readable
  ground-truth manifest of seeded defects yet (the tool-builder pitch depends on it; planned
  as supplementary material); archival sustainability (live deployments sit on a free tier —
  an archived snapshot with a pinned commit/DOI is committed to in Section 6).
- Evaluation threats (condensed from the Section 3.5 instrument): self-reported triage documents
  written by the triaging agent; researcher-as-participant; LLM-as-triager validity as its own
  threat class; recorded triage failures are a lower bound (external re-verification coverage
  was asymmetric); N = 19 under stated inclusion rules whose exclusions bias the real-bug rate
  upward; the study window ends where the data stopped; primary sources in Spanish, coding
  involves human-reviewed translation; three of the six explanation documents entered version
  control only after the study window closed, so their at-triage provenance rests on
  file-system timestamps.
- Taxonomy construct validity: the 8-class classification is preliminary — induced post hoc
  from the same 19 findings by a single coder pipeline (LLM + one supervising author), several
  classes have n = 1, no second coder or inter-rater reliability yet.
- Moving-target artifact: 11 bugs were fixed and 5 releases shipped *during* the evaluation
  window (4 triage-driven; v1.1.6 was concurrent feature work), so per-cycle rates measure a
  changing artifact (`findings.csv` records the release each cycle's fixes shipped in; a true
  version-in-effect column remains future work).
- Third-party ethics: the evaluation publishes failure attributions about an identifiable
  external harness operator whose system we cannot observe — attributions are labeled as
  hypotheses, and the operator remains anonymous.
- Documentation drift as a user-facing hazard: parts of the in-repo product documentation
  predate the newest market and chaos users (they describe 4 markets / 5 personas vs. the
  current 5 / 7) — a caveat for platform adopters and itself a measurable phenomenon.
- Scope boundary: one catalog row was executed as a low-cost exemplar (procedure 3.4,
  results 4.1; 2026-07-23, local instance at the pinned snapshot); the remaining Section 3.3
  rows are enabled, not executed — by design of this paper; candidates for follow-up work. Guideline
  generalizability is bounded by one domain (e-commerce), one team.

## 6. Conclusion & Availability

A laboratory is a promise about the future, not a report about the past. The promise this
platform makes to its audiences is compatibility: personas, selectors, entry points, and
response shapes held stable the way public APIs are held stable, so that a test written
against the sandbox today still means something tomorrow. For builders of production
systems, the implication runs in the same direction. The machinery that makes software cheap
to test is itself software — with failure modes, side effects, and versioning obligations of
its own — and budgeting for those obligations up front is what separates designed
testability from accumulated test debt.

For benchmark designers, the implication is sharper. A living benchmark cannot borrow the
defect-corpus contract, in which ground truth sits safely outside the system under study;
when the defects live inside the artifact and its suites characterize behavior, ground truth
must be deliberately severed from behavior and carried in an artifact of its own. It is
plausible that any long-lived teaching sandbox drifts toward certifying its own seeded
faults unless a machine-readable manifest — versioned, oracle-independent, checkable against
the deployment — anchors what *defect* means. We regard such manifests as benchmark hygiene,
not an optional extra.

For AI-assisted quality work, the implication is that evidence discipline, not model choice,
may be the design surface that matters most. If verdicts fail where claims outrun the
observable and hold where a protocol forces reproduction first, then teams adopting LLM
triage should engineer the boundary: label cross-system attributions as hypotheses, carry
assertion semantics as metadata, and keep human gates where errors would otherwise be
invisible. The interesting question stops being whether a model can triage. It becomes which
protocol makes any triager's failures cheap to catch.

That question is now directly testable, and this platform is built to test it. Nearer-term
steps are already queued — the unexecuted catalog rows, independent adoption studies — but
the pathway this study specifically unlocks is a within-platform protocol ablation: replay
the archived findings stream — the reports as quoted in the explanation documents, the only
form in which the raw reports survive, with the selection bias that implies — through the
same model under toggled protocol components (reproduce-before-verdict on and off; human
gates on and off) and score the resulting verdicts against the adjudicated final verdicts in
`findings.csv`. Cycles that retain raw reports and capture harness assertion contracts per
guideline 7 extend the design to unselected inputs, to an assertion-metadata arm, and to
seeded-defect probes scored against the manifest. Retraction and reversal rates become
measured outcomes instead of anecdotes. Anyone can run it; the laboratory is public.

**Availability.** Public repository
(`https://github.com/gsanchezm/OmniPizza` — backend, web, mobile, tests, documentation,
including the fact sheet and `findings.csv` under `documents/paper/`) and live deployments
(`https://omnipizza-backend.onrender.com`, `https://omnipizza-frontend.onrender.com`); an
archived snapshot (pinned commit, DOI) will accompany the preprint.

## References

APA 7. All 35 entries verified against their canonical records (DOI resolution or publisher /
official page) on 2026-07-23; a verified reserve list is kept in the progress index.

- Alameer, A., Mahajan, S., & Halfond, W. G. J. (2016). Detecting and localizing internationalization presentation failures in web applications. In *2016 IEEE International Conference on Software Testing, Verification and Validation (ICST)* (pp. 202–212). IEEE. https://doi.org/10.1109/ICST.2016.36
- Amershi, S., Weld, D., Vorvoreanu, M., Fourney, A., Nushi, B., Collisson, P., Suh, J., Iqbal, S., Bennett, P. N., Inkpen, K., Teevan, J., Kikin-Gil, R., & Horvitz, E. (2019). Guidelines for human-AI interaction. In *Proceedings of the 2019 CHI Conference on Human Factors in Computing Systems (CHI '19)* (Paper 3, pp. 1–13). ACM. https://doi.org/10.1145/3290605.3300233
- Barr, E. T., Harman, M., McMinn, P., Shahbaz, M., & Yoo, S. (2015). The oracle problem in software testing: A survey. *IEEE Transactions on Software Engineering*, *41*(5), 507–525. https://doi.org/10.1109/TSE.2014.2372785
- Basiri, A., Behnam, N., de Rooij, R., Hochstein, L., Kosewski, L., Reynolds, J., & Rosenthal, C. (2016). Chaos engineering. *IEEE Software*, *33*(3), 35–41. https://doi.org/10.1109/MS.2016.60
- Bell, J., & Kaiser, G. (2014). Unit test virtualization with VMVM. In *Proceedings of the 36th International Conference on Software Engineering (ICSE 2014)* (pp. 550–561). ACM. https://doi.org/10.1145/2568225.2568248
- Bessey, A., Block, K., Chelf, B., Chou, A., Fulton, B., Hallem, S., Henri-Gros, C., Kamsky, A., McPeak, S., & Engler, D. (2010). A few billion lines of code later: Using static analysis to find bugs in the real world. *Communications of the ACM*, *53*(2), 66–75. https://doi.org/10.1145/1646353.1646374
- Bettenburg, N., Just, S., Schröter, A., Weiss, C., Premraj, R., & Zimmermann, T. (2008). What makes a good bug report? In *Proceedings of the 16th ACM SIGSOFT International Symposium on Foundations of Software Engineering (FSE-16)* (pp. 308–318). ACM. https://doi.org/10.1145/1453101.1453146
- Binder, R. V. (1994). Design for testability in object-oriented systems. *Communications of the ACM*, *37*(9), 87–101. https://doi.org/10.1145/182987.184077
- Campbell, A., Adams, C., Bradley Montgomery, R., Cooper, M., & Kirkpatrick, A. (Eds.). (2024). *Web Content Accessibility Guidelines (WCAG) 2.2* (W3C Recommendation, 12 December 2024). World Wide Web Consortium. https://www.w3.org/TR/2024/REC-WCAG22-20241212/
- Deque Systems. (2026). *axe-core: Accessibility engine for automated Web UI testing* [Computer software]. GitHub. Retrieved July 23, 2026, from https://github.com/dequelabs/axe-core
- Do, H., Elbaum, S., & Rothermel, G. (2005). Supporting controlled experimentation with testing techniques: An infrastructure and its potential impact. *Empirical Software Engineering*, *10*(4), 405–435. https://doi.org/10.1007/s10664-005-3861-2
- Fan, A., Gokkaya, B., Harman, M., Lyubarskiy, M., Sengupta, S., Yoo, S., & Zhang, J. M. (2023). Large language models for software engineering: Survey and open problems. In *2023 IEEE/ACM International Conference on Software Engineering: Future of Software Engineering (ICSE-FoSE)* (pp. 31–53). IEEE. https://doi.org/10.1109/ICSE-FoSE59343.2023.00008
- Freedman, R. S. (1991). Testability of software components. *IEEE Transactions on Software Engineering*, *17*(6), 553–564. https://doi.org/10.1109/32.87281
- Gyimesi, P., Vancsics, B., Stocco, A., Mazinanian, D., Beszédes, Á., Ferenc, R., & Mesbah, A. (2019). BugsJS: A benchmark of JavaScript bugs. In *2019 12th IEEE Conference on Software Testing, Validation and Verification (ICST)* (pp. 90–101). IEEE. https://doi.org/10.1109/ICST.2019.00019
- Gyori, A., Shi, A., Hariri, F., & Marinov, D. (2015). Reliable testing: Detecting state-polluting tests to prevent test dependency. In *Proceedings of the 2015 International Symposium on Software Testing and Analysis (ISSTA 2015)* (pp. 223–233). ACM. https://doi.org/10.1145/2771783.2771793
- Herzig, K., Just, S., & Zeller, A. (2013). It's not a bug, it's a feature: How misclassification impacts bug prediction. In *Proceedings of the 35th International Conference on Software Engineering (ICSE 2013)* (pp. 392–401). IEEE. https://doi.org/10.1109/ICSE.2013.6606585
- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, *28*(1), 75–106. https://doi.org/10.2307/25148625
- Johnson, B., Song, Y., Murphy-Hill, E., & Bowdidge, R. (2013). Why don't software developers use static analysis tools to find bugs? In *Proceedings of the 35th International Conference on Software Engineering (ICSE 2013)* (pp. 672–681). IEEE. https://doi.org/10.1109/ICSE.2013.6606613
- Just, R., Jalali, D., & Ernst, M. D. (2014). Defects4J: A database of existing faults to enable controlled testing studies for Java programs. In *Proceedings of the 2014 International Symposium on Software Testing and Analysis* (pp. 437–440). ACM. https://doi.org/10.1145/2610384.2628055
- Kang, S., Yoon, J., & Yoo, S. (2023). Large language models are few-shot testers: Exploring LLM-based general bug reproduction. In *2023 IEEE/ACM 45th International Conference on Software Engineering (ICSE)* (pp. 2312–2323). IEEE. https://doi.org/10.1109/ICSE48619.2023.00194
- Leotta, M., Stocco, A., Ricca, F., & Tonella, P. (2016). Robula+: An algorithm for generating robust XPath locators for web testing. *Journal of Software: Evolution and Process*, *28*(3), 177–204. https://doi.org/10.1002/smr.1771
- Luo, Q., Hariri, F., Eloussi, L., & Marinov, D. (2014). An empirical analysis of flaky tests. In *Proceedings of the 22nd ACM SIGSOFT International Symposium on Foundations of Software Engineering* (pp. 643–653). ACM. https://doi.org/10.1145/2635868.2635920
- Memon, A., Gao, Z., Nguyen, B., Dhanda, S., Nickell, E., Siemborski, R., & Micco, J. (2017). Taming Google-scale continuous testing. In *2017 IEEE/ACM 39th International Conference on Software Engineering: Software Engineering in Practice Track (ICSE-SEIP)* (pp. 233–242). IEEE. https://doi.org/10.1109/ICSE-SEIP.2017.16
- OWASP Foundation. (n.d.). *OWASP Juice Shop*. Retrieved July 23, 2026, from https://owasp.org/www-project-juice-shop/
- Parry, O., Kapfhammer, G. M., Hilton, M., & McMinn, P. (2022). A survey of flaky tests. *ACM Transactions on Software Engineering and Methodology*, *31*(1), 1–74. https://doi.org/10.1145/3476105
- Runeson, P., Alexandersson, M., & Nyholm, O. (2007). Detection of duplicate defect reports using natural language processing. In *Proceedings of the 29th International Conference on Software Engineering (ICSE '07)* (pp. 499–510). IEEE. https://doi.org/10.1109/ICSE.2007.32
- Runeson, P., & Höst, M. (2009). Guidelines for conducting and reporting case study research in software engineering. *Empirical Software Engineering*, *14*(2), 131–164. https://doi.org/10.1007/s10664-008-9102-8
- Sadowski, C., Aftandilian, E., Eagle, A., Miller-Cushon, L., & Jaspan, C. (2018). Lessons from building static analysis tools at Google. *Communications of the ACM*, *61*(4), 58–66. https://doi.org/10.1145/3188720
- Sauce Labs. (n.d.). *Swag Labs (Sauce Labs sample application)* [Demo web application]. Retrieved July 23, 2026, from https://www.saucedemo.com/
- Vahabzadeh, A., Milani Fard, A., & Mesbah, A. (2015). An empirical study of bugs in test code. In *2015 IEEE International Conference on Software Maintenance and Evolution (ICSME)* (pp. 101–110). IEEE. https://doi.org/10.1109/ICSM.2015.7332456
- Wang, J., Huang, Y., Chen, C., Liu, Z., Wang, S., & Wang, Q. (2024). Software testing with large language models: Survey, landscape, and vision. *IEEE Transactions on Software Engineering*, *50*(4), 911–936. https://doi.org/10.1109/TSE.2024.3368208
- Weyuker, E. J. (1982). On testing non-testable programs. *The Computer Journal*, *25*(4), 465–470. https://doi.org/10.1093/comjnl/25.4.465
- Wieringa, R. J. (2014). *Design science methodology for information systems and software engineering*. Springer. https://doi.org/10.1007/978-3-662-43839-8
- Yin, R. K. (2018). *Case study research and applications: Design and methods* (6th ed.). SAGE Publications.
- Zhang, S., Jalali, D., Wuttke, J., Muşlu, K., Lam, W., Ernst, M. D., & Notkin, D. (2014). Empirically revisiting the test independence assumption. In *Proceedings of the 2014 International Symposium on Software Testing and Analysis (ISSTA 2014)* (pp. 385–396). ACM. https://doi.org/10.1145/2610384.2610404

## Appendix / supplementary material

- **Platform fact sheet (required companion):** every Sections 3–4 number with its counting
  rule and the pinned snapshot commit (endpoint operations vs. paths; selector *occurrence*
  counts vs. distinct IDs; release count excluding legacy tags duplicated only by letter case;
  widget-table row counts).
- `findings.csv` — coding table of the 19 evaluation findings (verdict decomposition, a
  confidence flag, the `instrumentation-mediated` flag with value set
  true / false / candidate, and the release each cycle's fixes shipped in), with
  original-language excerpts.
- Machine-readable seeded-defect manifest (planned; required for the tool-builder use case).
- Pointers to primary artifacts: `documents/explanation/EXPLANATION_qa_report_*.md`,
  `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md`, `backend/constants.py`, fix commits by
  hash.

---

*Data availability:* the study platform and its primary artifacts are public: repository
(`https://github.com/gsanchezm/OmniPizza`, including the fact sheet and `findings.csv` under
`documents/paper/`) and live deployments (`https://omnipizza-backend.onrender.com`,
`https://omnipizza-frontend.onrender.com`); the seeded-defect manifest is planned, and an
archived snapshot (pinned commit, DOI) will accompany the preprint.
