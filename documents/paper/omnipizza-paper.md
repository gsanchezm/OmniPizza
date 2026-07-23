# When the Bug Is Not in the App: An Empirical Study of LLM-Assisted, Empirically Verified Triage of Automated QA Findings

> **Status:** base document (v0.2, 2026-07-23). Sections 4–6 and 9 are drafted and approved; the
> remaining sections are structured outlines to be developed next. v0.2 incorporates an
> adversarial fact-check of every quantitative claim against the primary sources.
>
> **Working-title alternatives:**
> - *Not Every Failing Check Is a Bug: An Empirical Study of Automated-QA Finding Triage*
> - *The Harness Did It: Characterizing Non-Bug Findings from Automated QA in an Instrumented Sandbox*
>
> **Target:** academic-style preprint (arXiv, cs.SE), adaptable later to an industry track
> (e.g., ICST/ISSTA industry, EuroSTAR). **Language:** English. **Study type:** retrospective
> case study — no new experiments; all evidence is already recorded in the repository.

---

## Abstract (outline)

- One-paragraph arc: instrumented QA sandbox → one week of externally reported automated-QA
  findings → LLM-assisted triage with mandatory empirical verification and human oversight →
  by the final cycle, none of the reported findings is an app bug → taxonomy + recorded triage
  failure modes (2 root-cause retractions, 1 verdict reversal).
- Headline numbers: 19 findings across 6 triage cycles (5 findings-bearing reports plus one
  re-verification round); 11/19 real bugs fixed; first cycle 6/8 real, final cycle 0/3 real —
  a non-monotonic path whose one late all-real cycle (3/3) consisted solely of low-severity
  localization copy drift.
- Closing claim: the instrumentation that enables automation also mediates a distinct class of
  false positives, and root-cause attributions that cross into systems the triager cannot
  observe (the QA harness) are exactly where triage explanations failed.

## 1. Introduction (outline)

- Context: UI/API test automation routinely reports "bugs" that are not application defects;
  triage cost is dominated by exoneration, not fixing. Related industrial pain: flaky tests,
  false alarms, environment noise.
- Gap: little empirical evidence tracing *each* automated-QA finding to a verified root cause,
  and none (to our knowledge) characterizing the recorded failure modes of LLM-assisted triage
  itself.
- Approach: a purpose-built, fully instrumented sandbox (OmniPizza) went through six triage
  cycles in one week (2026-07-16 → 2026-07-22): five findings-bearing automated QA reports plus
  one re-verification round; every finding was triaged by an LLM agent under human supervision
  with a mandatory reproduce-before-verdict rule; every cycle produced a durable, dated
  explanation document.
- Contributions (approved list):
  1. An eight-class verdict taxonomy for automated-QA findings, including an explicit
     "exonerated, cause unattributed" class (Section 5.2).
  2. A retrospective empirical study of 19 findings across 6 triage cycles, each with a
     verified verdict and, where attributable, a verified root cause.
  3. A characterization of the LLM-assisted triage protocol through its recorded failure modes
     (2 retracted root-cause hypotheses, 1 reversed verdict — a triage false negative).
  4. Evidence that test-enabling instrumentation working *as designed* mediates its own class
     of false positives.
  5. The OmniPizza sandbox as a reproducible study platform (public repository and deployments).

## 2. Related Work (outline)

- Flaky tests and test-failure noise (Luo et al.; industrial reports from Google/Microsoft).
- False-positive triage in static analysis and alert deduplication.
- Test-fixture pollution / shared mutable state in test environments.
- LLMs for bug triage, deduplication, and repair; human-AI oversight loops.
- Purpose-built testing sandboxes (e.g., SauceDemo's `problem_user` pattern, OWASP Juice Shop);
  position OmniPizza as an extension: multi-market, multi-platform, chaos-by-identity.
- Case-study methodology in software engineering (Runeson & Höst; Yin).

## 3. Study Context: The OmniPizza Sandbox (outline + key facts)

Purpose-built QA sandbox; testability features are product features. Three deployables
(FastAPI backend, React web, Expo/React Native mobile) plus external test suites.

Key characteristics (to be described in prose; all values verifiable in the repository):

| Dimension | Value |
|---|---|
| Markets (data-driven config) | 5 — MX, US, CH, JP, SA (Arabic, RTL) |
| Languages | 6 — en, es, de, fr, ja, ar |
| Deterministic "chaos" users | 7 — behavior carried in a JWT `behavior` claim (fixed 3 s latency; p=0.5 checkout errors; seeded a11y and security defects; $0 prices/broken images; locked-out login) |
| API surface | 20 `/api` route operations (18 distinct `/api` paths; 22 operations including root and health probes); market-sensitive endpoints gated by a required-header contract (HTTP 400 on missing `X-Country-Code`) |
| Stable selector contract | 165 `data-testid` (web) + 114 `testID` (mobile) occurrences |
| Atomic state-injection entry | web: localStorage seeding + backend cart/market seeding; mobile: `omnipizza://` deep links (`accessToken`, `market`, `lang`, `resetSession`, `hydrateCart`) |
| Persistence | in-memory DB; restart = deterministic reset; profiles keyed per-login session (`sid` JWT claim) |
| External test layers | 41 Vitest API cases (incl. golden characterization suite), Schemathesis contract tests, 11 Cypress component specs, Detox e2e experiments |
| Repository history | 209 commits (2026-02-07 → 2026-07-22), 23% `fix:`; 18 releases on GitHub Releases, v1.0.0–v1.1.8 (four duplicate-case legacy git tags excluded from the count) |

The sandbox is exercised by an *external* automated QA harness (UI + API suites, multiple
markets/languages, web and mobile) that files findings; the harness is not under our control
and its internals are not observable to the triager — a boundary that turns out to matter
(Sections 7.3, 8).

## 4. Study Objective and Research Questions

### 4.1 Objective

We examine the proposition that, in a mature, instrumentation-rich system under continuous
automated QA, real application defects become a shrinking share of reported findings — shrinking
in severity, and (non-monotonically) in rate — while the dominant sources of non-bug findings
become the QA harness itself, shared mutable fixtures, and hosting infrastructure, including the
test-enabling instrumentation working exactly as designed. In our corpus the first cycle was 6/8
real bugs and the final cycle 0/3, with the one late all-real cycle consisting solely of
low-severity localization copy drift. We further characterize the recorded failure modes of
LLM-assisted, empirically verified triage: both retracted root-cause explanations were
attributions about a system outside the triager's observable boundary (the external harness),
while every app-side empirical exoneration survived; the one reversed verdict — a triage false
negative — fell when the harness's assertion semantics became known.

### 4.2 Research questions

- **RQ1 — Prevalence and trend.** What proportion of automated-QA findings corresponds to real
  application defects, and how does that proportion evolve as the system matures?
  *(verdict distribution; the full per-cycle series under final verdicts, with sensitivity to
  initial verdicts; severity-weighted reading of the trend)*
- **RQ2 — Non-bug root causes.** What are the root-cause categories of findings that are *not*
  application bugs? *(taxonomy of Section 5.2 with per-class frequencies, distinguishing
  confirmed attributions from exonerations without attribution)*
- **RQ3 — Triage failure modes.** What triage failures were recorded, how were they detected,
  and how were they corrected? *(2 root-cause retractions and 1 verdict reversal as embedded
  mini-cases; the verdict-correct vs. explanation-correct decomposition of Section 5.1;
  recorded failures are a lower bound on triage error — Section 9)*
- **RQ4 — Instrumentation as confounder.** What role does the test-enabling instrumentation
  itself play in generating false positives? *(the `instrumentation-mediated` flag of
  Section 5.1: confirmed for the cart-hydration and `resetSession` findings; candidate for the
  `seedProfile` mechanism)*

## 5. What We Measure

Retrospective extraction only: every variable below is coded from artifacts that already exist
(triage explanation documents, git history, repository docs). No new measurements are collected.

### 5.1 Units of analysis and variables

**Inclusion criteria.** One finding = one numbered item in the triage explanation document's
contemporaneous segmentation. Excluded from N = 19: (a) one item the reporting team had already
dismissed before the window (a locked-out-user error-message report, cycle 1); (b) two bugs the
QA report itself attributed to the harness's own code (cycle 4); (c) same-pattern sibling bugs
self-discovered during fix sweeps, which were never externally reported (tracked separately).
Exclusions (a) and (b) remove non-bug items from the denominator and therefore bias the measured
real-bug rate *upward*; exclusion (c) understates real-defect prevalence (both noted in
Section 9). One cycle-1 finding aggregates a batch of static-analysis (MobSF) items with mixed
dispositions under one verdict; finding granularity is listed as a construct threat.

**Per finding (N = 19)** — the primary unit. Verdict state is deliberately decomposed into
three variables so that changes can be typed precisely:

| Variable | Type | Source |
|---|---|---|
| Report date / triage cycle | date (6 cycles: 2026-07-16, -18, -19, -20, -21, -22) | explanation docs |
| Platform | web / mobile / backend / build artifact | explanation docs |
| Market & language involved | MX/US/CH/JP/SA × en/es/de/fr/ja/ar | explanation docs |
| Defect category | functional, visual/contrast, localization, security, performance, build/packaging | explanation docs |
| **Binary verdict** (initial, final) | app bug / not app bug — changed in exactly 1 finding (the reversal: not-a-bug → real bug) | explanation docs |
| **Taxonomy class** (initial, final) | Section 5.2 class — changed in 3 findings (the reversal + the 2 retractions) | explanation docs |
| **Root-cause narrative** | free text; `confirmed / candidate / unidentified` confidence flag | explanation docs |
| Instrumentation-mediated | boolean, orthogonal to taxonomy class (Section 4.2 RQ4) | explanation docs |
| Verification method(s) | API replay, physical-device repro, in-page axe-core run, latency measurement, code-plus-live-system inspection | explanation docs |
| Fix commit(s) | commit hash(es), if fixed | git history |
| Retraction / reversal flags | reversal = binary-verdict change; retraction = class/narrative change with binary verdict stable | explanation docs |
| Report-to-fix latency | derived: report date → fix commit date | git history |

**Per triage cycle (N = 6):** findings count; real-bug rate (final verdicts); self-discovered
sibling bugs; release shipped. Four of the six cycles produced a release (cycle 1 → v1.1.4,
cycle 2 → v1.1.5, cycle 4 → v1.1.7, cycle 5 → v1.1.8); the re-verification cycle (07-19) and
the final cycle (07-22) shipped no code change. Release v1.1.6 falls inside the window but
contains only concurrent feature work (two new chaos users) plus a separately-triaged defensive
guard; it is not attributed to the studied cycles.

**Process-level:** number of root-cause retractions (2); verdict reversals (1); sweep
expansions triggered by a confirmed finding; human decision gates exercised (push/release
authorizations per batch).

**Context descriptives (Section 3):** instrumentation counts and repository statistics.
These describe the platform; they are not outcome variables.

### 5.2 Verdict taxonomy (a contribution of this paper)

1. **Real application bug** — defect in app code; reproduced, fixed, and shipped.
2. **Harness artifact** — positively attributed to the reporting harness's behavior (e.g.,
   firing a `resetSession` deep link mid-session).
3. **Shared-fixture state** — leftover state on shared mutable test users (e.g., an orphan
   backend cart hydrating into a "pre-selected" checkout).
4. **Infrastructure** — hosting/environment effects (e.g., free-tier cold start measured at
   31.5 s vs. 215–663 ms warm).
5. **Accepted-by-design** — behavior is intentional and documented (e.g., debug-signed test APK).
6. **Third-party code** — finding points at library/framework code, not the application
   (e.g., MobSF flagging AndroidX internals).
7. **Not reproducible** — faithful re-execution of the reported scenario does not exhibit the
   reported failure, and no causal mechanism is identified.
8. **Exonerated, cause unattributed** — the application is ruled out empirically, but no
   external attribution is confirmed (candidate mechanisms may exist without confirmation).

Classes 2–4 require *positive* attribution; class 8 exists precisely because the studied
protocol refuses to guess an owner when the evidence stops at exoneration. Classes 2–4 and 8
are all "not an app bug" but have different owners and different prevention strategies —
collapsing them, as most triage practice does, loses actionable information. The
`instrumentation-mediated` flag (Section 5.1) is orthogonal: e.g., the orphan-cart finding is
class 3 *and* instrumentation-mediated (the cart-hydration feature is the vehicle; the leftover
fixture state is the cause).

### 5.3 Headline retrospective numbers (to be tabulated in Results)

All rates use **final** verdicts; the one difference under initial verdicts is noted in the
table.

| Cycle | Date (2026) | Findings | Real bugs (final) | Release |
|---|---|---|---|---|
| 1 | 07-16 | 8 | 6 | v1.1.4 |
| 2 | 07-18 | 3 | 1 | v1.1.5 |
| 3 | 07-19 | 0 (re-verification round) | — | — |
| 4 | 07-20 | 2 | 1 | v1.1.7 |
| 5 | 07-21 | 3 | 3 (2 under initial verdicts; one reversal) | v1.1.8 |
| 6 | 07-22 | 3 | 0 | — |

- Verdict distribution over the 19 findings: **11 real bugs fixed (11/19); 3 attributed
  non-bugs** (1 harness artifact, 1 shared-fixture state, 1 infrastructure); **2 exonerated
  with cause unattributed** (one with a candidate mechanism — `seedProfile` — confirmed possible
  but not confirmed as the actual cause; one with the cause never identified); **1
  accepted-by-design; 1 third-party; 1 not reproducible**.
- The rate series is non-monotonic (75% → 33% → n/a → 50% → 100% → 0%); the decline is in
  severity and at the endpoints: cycle 1's real bugs included functional and security-relevant
  defects, cycle 5's were exclusively low-severity localization copy divergences, and cycle 6
  contained no app bug at all.
- 2 root-cause retractions (07-19) with binary verdicts left standing; 1 full verdict reversal
  (a cycle-5 finding initially exonerated as stale-fixture, re-judged a real cross-platform copy
  divergence on 07-22 after the harness's contains-substring assertion semantics and an Arabic
  orthographic contraction were established) — a triage **false negative**.
- 2 findings confirmed **instrumentation-mediated** (cart hydration; `resetSession` deep link)
  plus 1 candidate (`seedProfile` wipe mechanism, confirmed possible against the live system).

## 6. Methodology

### 6.1 Design

Retrospective **embedded single-case case study** (Runeson & Höst 2009; Yin 2018): the case is
one week of automated-QA operation against the OmniPizza sandbox; embedded units are the 19
findings within 6 triage cycles. The single-case rationale is the *revelatory* one: a fully
instrumented sandbox with near-total artifact capture (dated triage documents, commit hashes,
deterministic state) allows per-finding causal tracing that ordinary industrial settings rarely
preserve — with the flip side that the same properties bound generalization (Section 9). In
Runeson & Höst's terms all data are third-degree (archival): documents and version-control
records produced for other purposes, with no in-vivo observation or interviews. The triage was
performed as normal engineering work before this paper was conceived, which *reduces* (not
removes) design-for-publication bias: the explanation documents were written to be read — and
potentially rebutted — by the external QA team, making them advocacy-adjacent artifacts; the
mitigating evidence is that they record their own errors (retractions, an honest
"cause never identified" negative), which pure advocacy documents rarely do.

### 6.2 The studied triage protocol

The object of study is the triage protocol as practiced and documented:

1. Findings arrive as automated QA reports (external harness; UI + API suites).
2. An LLM agent (Claude, Anthropic) performs triage under standing human-defined rules:
   - **Empirical verification over code reading**: no verdict without reproducing against the
     running system (local and/or the deployed Render instance) — API replay, seeded-state
     reproduction, on-device repro via `adb`, in-page axe-core runs.
   - **Fix-and-commit** for confirmed real bugs, with conventional-commit hashes as audit trail.
   - **Durable explanation documents** for every cycle: rejected findings become dated
     `EXPLANATION_qa_report_*.md` files rather than silent dismissals.
   - **Human decision gates**: pushes, releases, and scope expansions require explicit
     per-batch user authorization.
3. Follow-up cycles may retract earlier root-cause hypotheses or reverse verdicts when new
   evidence (including QA counter-evidence) arrives — these events are recorded, not erased.

### 6.3 Data sources (triangulation)

1. **Six explanation documents** (`documents/explanation/EXPLANATION_qa_report_2026-07-{16,18,19,20,21,22}.md`,
   written in Spanish) — primary source for verdicts, root causes, verification methods.
2. **Git history** — 209 commits, releases v1.0.0–v1.1.8, fix commits referenced by hash in the
   explanation docs; provides independent timestamps and diffs.
3. **QA report content as quoted** within the explanation documents (the original external
   reports are not retained as files; a limitation, Section 9).
4. **Repository documentation** — PRD, design docs, `ATOMIC_WEB_TESTING.md`,
   `ATOMIC_MOBILE_TESTING.md`, `arquitectura_qa.md` — for the platform description (Section 3).

All sources are archival (third-degree) in the Runeson & Höst sense: produced for purposes
other than this study.

### 6.4 Coding and analysis procedure

- **Extraction:** an LLM-assisted pass codes each finding on the Section 5.1 variables directly
  from the explanation documents; a human pass reviews every coded row against the source text.
  The primary sources are in Spanish and the paper is in English; translation happens during
  coding and is human-reviewed, with original-language excerpts preserved in supplementary
  material (the reversal mini-case additionally involves Arabic-script codepoint evidence).
  The full coding table ships as supplementary material (`findings.csv`, planned companion
  file, carrying the confidence and instrumentation-mediated flags).
- **RQ1:** descriptive statistics — verdict distribution overall and per cycle under final
  verdicts, with the initial-verdict sensitivity reported (cycle 5: 2/3 vs. 3/3); the full
  non-monotonic series is always shown; no inferential statistics at N = 19.
- **RQ2:** qualitative coding of non-bug root causes into the Section 5.2 taxonomy, reporting
  confirmed attributions (classes 2–4) separately from exonerations without attribution
  (class 8); per-class narrative of the causal mechanism.
- **RQ3:** the 2 retractions and 1 reversal analyzed as embedded mini-cases: what evidence the
  original conclusion rested on, what evidence overturned it, and — using the Section 5.1
  three-variable decomposition — whether the *binary verdict*, the *taxonomy class*, or only
  the *root-cause narrative* changed.
- **RQ4:** mechanism tracing for the instrumentation-mediated findings: feature intent (from
  the atomic-testing docs) vs. observed effect in the report; confirmed vs. candidate
  attribution.

### 6.5 Transparency of AI involvement

The same class of LLM agent participates twice: as the triage agent under study, and as an
analysis assistant for this paper. We disclose both roles; all coded values remain traceable to
dated, human-reviewed repository artifacts, and the coding table is human-verified. The paper's
claims are about the *documented protocol and its recorded outcomes*, not about model internals.

## 7. Results (outline — one subsection per RQ)

- 7.1 Verdict distribution and temporal trend (RQ1): table of 19 findings; the full per-cycle
  series (final verdicts, with initial-verdict sensitivity); the severity-weighted convergence
  reading, addressing the all-real cycle 5 head-on (3/3 real, all low-severity localization
  drift) rather than letting it sit against the thesis.
- 7.2 Root causes of non-bug findings (RQ2): taxonomy frequencies (3 attributed, 2 exonerated
  unattributed, 1 by-design, 1 third-party, 1 not reproducible); one short mechanism narrative
  per class (orphan cart; `resetSession` timing; cold start; the two unattributed exonerations).
- 7.3 Triage failure modes (RQ3): mini-cases — (a) re-auth hypothesis retracted, (b)
  stale-selector hypothesis retracted (original failure cause never identified — an honest
  negative), (c) Arabic `outForDelivery` verdict reversal. In (a) and (b) the binary verdicts
  survived while the explanations did not — and both failed explanations were attributions about
  the unobservable external harness; in (c) the verdict itself fell. Detection of all three
  depended on QA's re-verification coverage, which was asymmetric (web re-checked; the mobile
  contrast sweep taken on faith) — hence "recorded failures" is a lower bound.
- 7.4 Instrumentation as false-positive mediator (RQ4): 2 confirmed + 1 candidate; the
  observability/controllability machinery added for automation becomes a confounder in triage.
- Secondary observations (each tied to an RQ during drafting): weak contains-substring oracles
  masking a 5-language regression in 4 of 5 languages (RQ3 — assertion semantics); each
  confirmed finding triggering a bounded same-pattern sweep that found additional unreported
  bugs (RQ1 — the external count understates defect prevalence); the ancestor-opacity contrast
  miss as a method gap distinct from a coverage gap (RQ3).

## 8. Discussion (outline)

- Implications for practice: triage effort shifts from fixing to exonerating as systems mature;
  budget accordingly. Taxonomy classes 2–4 and 8 need different owners (harness team, fixture
  policy, infra, "needs joint investigation") — routing findings by class is actionable.
- Design tension: the same atomic entry points that make automation cheap mediate false
  positives; sanctioned bypasses need guardrails (e.g., refusing `resetSession` mid-scenario).
- The observable-boundary lesson: empirical verification reliably settled every claim about the
  system under the triager's control (all app-side exonerations survived), but both retracted
  explanations were conjectures about the external harness's internals — outside the
  reproducible boundary. Actionable rule: label cross-boundary attributions as hypotheses and
  hand them to the owning team for confirmation (which is what eventually happened with the
  `seedProfile` candidate).
- Weak assertion semantics (contains-substring) can flip verdicts; harness assertion contracts
  should travel as metadata with each finding.

## 9. Threats to Validity

- **Construct:** verdicts are the triager's own conclusions; no independent adjudication panel.
  The 2 retractions + 1 reversal are a *lower bound* on triage error: detection depended on
  QA's re-verification, whose coverage was asymmetric (web re-checked; mobile taken on faith) —
  any standing exoneration resting on unstated harness semantics could be wrong undetected.
  Finding granularity follows the triage documents' contemporaneous segmentation (one MobSF
  batch row aggregates heterogeneous items with mixed dispositions). Mitigations: every verdict
  ties to a reproducible check with recorded commands/output; one verdict was in fact reversed
  when counter-evidence arrived — the process admits error.
- **Internal:** the explanation documents were written by the same agent that performed the
  triage (self-report bias); the human author defined the triage rules, supervised the triage,
  authorized every fix, and co-authors this evaluation (researcher-as-participant); coding
  happens with hindsight. The declining-noise narrative is partly endogenous: fixes in cycle
  *k* mechanically suppress the findings cycle *k+1* could have re-reported, and the harness
  itself was non-stationary within the window (mobile automation paused mid-week; the report
  mix shifted from a static-analysis-heavy first cycle to localization-only late cycles).
  Mitigations: triangulation with git timestamps and hashes; human review of every coded row.
- **External:** single case; one week; the study window is where the data stopped, not a design
  choice — it ends the day before the study was conceived, exactly when the real-bug rate hit
  0/3 (stopping-rule threat). A sandbox *designed* for automation with deliberately seeded
  chaos behaviors and free-tier hosting idiosyncrasies (cold starts) inflates specific classes.
  Generalization is analytic, not statistical.
- **Reliability:** the in-memory database cannot be archived post-hoc (state at report time is
  reconstructed, not preserved); original external QA reports survive only as quotations inside
  the explanation documents; N = 19 depends on stated inclusion rules (Section 5.1) whose
  exclusions (a)/(b) bias the measured real-bug rate upward; primary sources are Spanish and
  coding involves human-reviewed translation.
- **AI involvement:** an LLM participated in both the studied process and the analysis
  (Section 6.5); coding is human-verified and source-traceable.

## 10. Conclusion (outline)

- Restate: 19 findings, one week; 75% real in the first cycle (6/8) → 0% in the last (0/3),
  11/19 overall, with the decline carried by severity as much as rate; an eight-class taxonomy
  whose "exonerated, unattributed" class embodies the protocol's refusal to guess; two
  retractions and one reversal as evidence that empirical verification settles what is
  observable — and that cross-boundary attributions, not unverified code reading, were where
  explanations failed; instrumentation itself is a first-class mediator of false positives.
- Future work: multi-case replication on non-sandbox systems; harness-side assertion-semantics
  metadata; controlled experiments on atomic-entry guardrails (out of scope here by design).

## References (candidates — to be completed)

- P. Runeson, M. Höst. *Guidelines for conducting and reporting case study research in software
  engineering.* Empirical Software Engineering, 2009.
- R. K. Yin. *Case Study Research and Applications*, 6th ed., 2018.
- Q. Luo, F. Hariri, L. Eloussi, D. Marinov. *An empirical analysis of flaky tests.* FSE 2014.
- J. Micco. *The state of continuous integration testing at Google.* 2017.
- Flaky-test and static-analysis-false-positive triage literature (to be surveyed for Section 2).

## Appendix / supplementary material (planned)

- `findings.csv` — full coding table of the 19 findings (one row per finding, Section 5.1
  variables including confidence and instrumentation-mediated flags), plus original-language
  excerpts for quoted evidence.
- Pointers to primary artifacts: `documents/explanation/EXPLANATION_qa_report_*.md`, fix commits
  by hash, `ATOMIC_WEB_TESTING.md`, `ATOMIC_MOBILE_TESTING.md`, `backend/constants.py`.

---

*Data availability:* the study platform and all primary artifacts are public:
repository (backend, web, mobile, tests, documentation) and live deployments
(`https://omnipizza-backend.onrender.com`, `https://omnipizza-frontend.onrender.com`).
