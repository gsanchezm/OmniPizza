# Turning the Tables Audit - OmniPizza Paper

Source audited: `documents/paper/omnipizza-paper.md`

Role: hostile peer reviewer / Turnitin-style auditor.

Line references are approximate paragraph-start lines in the Markdown source. I excluded
the bibliography, headings, tables, and formulas from the adjective test because they are
metadata or structured material, not prose.

## Executive Verdict

The paper is not empty AI filler overall; it has concrete counts, artifacts, commits,
procedures, and limitations. The AI-hallmark risk is stylistic: the draft repeatedly
compresses many modifiers into one sentence, uses high-level framing nouns ("laboratory,"
"evidence discipline," "protocol," "phenomenon generator"), and sometimes converts a
technical point into a slogan before proving it.

Most dangerous pattern: the introduction, abstract, discussion, and conclusion often sound
more polished than inspected. The methods and results are stronger because they are tied to
counts and artifacts.

## 1. Adjective Test

These sentences trip the 3+ adjective test and should be reviewed. Not every sentence is
bad; several use technical modifiers legitimately. The issue is cumulative density.

### Abstract

- Line 23
  - Adjective load: shared, CI-scale, nondeterministic.
  - Flagged sentence: "Test-automation research and practice depend on shared objects of study, yet CI-scale signals are pervaded by nondeterministic failures and triage noise."
  - Audit: Mostly acceptable, but "pervaded" plus stacked abstractions sounds academic-bot polished.

- Line 23
  - Adjective load: frozen, offline, production, versioned.
  - Flagged sentence: "Existing objects diverge: defect corpora are frozen for offline scoring, production systems resist inspection, and demo applications carry no versioned testability contracts."
  - Audit: Dense but useful. Keep if the next sentence grounds it.

- Line 23
  - Adjective load: open, publicly deployed, multi-platform, engineered, credential-keyed, data-driven, atomic, versioned.
  - Flagged sentence: "OmniPizza is an open, publicly deployed multi-platform laboratory (FastAPI, React, React Native) whose controllability and observability are engineered features: credential-keyed chaos personas, data-driven market/i18n rules, atomic state injection, and versioned selector contracts."
  - Audit: Major adjective pile-up. This reads like an abstract generated from a feature checklist.

- Line 23
  - Adjective load: snapshot-verified, executed, retrospective, embedded, external, automated.
  - Flagged sentence: "A snapshot-verified artifact description is combined with one executed exemplar and a retrospective embedded case study of a week of external automated QA."
  - Audit: Technically precise, but overloaded. Split method type from data source.

- Line 23
  - Adjective load: seeded, non-executable, absent, golden, expected, inverted, derived.
  - Flagged sentence: "The seeded $0-price defect evaded all four test layers ($0/4$): two layers were non-executable (schema drift; absent tooling), component tests mounted fixtures only, and the golden characterization suite passed $46/46$ asserting the defect as expected behavior - an inverted derived test oracle."
  - Audit: High information value, high compression. Worth splitting for readability.

- Line 23
  - Adjective load: external, real, eight-class, instrumentation-mediated, false, LLM-assisted, cross-boundary.
  - Flagged sentence: "Of $N = 19$ external findings, $11$ were real defects; the eight non-bugs spread across an eight-class verdict taxonomy with two instrumentation-mediated false positives, and LLM-assisted triage logged two retractions - both cross-boundary attributions - and one verdict reversal."
  - Audit: Too much taxonomy in one sentence.

### Introduction

- Line 45
  - Adjective load: automated, modern, continuous-integration, LLM-based, trustworthy.
  - Flagged sentence: "Automated testing is how modern software teams buy confidence: continuous-integration systems execute suites at every change, and an ecosystem of tools - locator engines, contract checkers, accessibility scanners, and lately LLM-based testing tools (Wang et al., 2024) - competes to turn those executions into trustworthy verdicts."
  - Audit: "buy confidence" is slogan-like. This is one of the clearest AI-polish sentences.

- Line 56
  - Adjective load: available, different, everyday, multi-platform.
  - Flagged sentence: "The available objects of study pull in different directions, and none of them supports the everyday questions of multi-platform UI and API automation."
  - Audit: Vague framing. "Objects of study pull in different directions" is a soft metaphor.

- Line 56
  - Adjective load: controlled, frozen, historical, offline, running.
  - Flagged sentence: "Defect corpora are controlled but frozen: they package historical faults for offline scoring, not a running product a harness can exercise today."
  - Audit: Stronger than most flagged items because the contrast is concrete.

- Line 56
  - Adjective load: live, unsafe, closed, large-scale/nondeterministic.
  - Flagged sentence: "Production systems are live but unsafe and closed to inspection, and the signals obtained by testing them at scale are pervaded by nondeterminism (Memon et al., 2017; Parry et al., 2022)."
  - Audit: Plausible but broad. "Unsafe and closed" needs either narrowing or examples.

- Line 56
  - Adjective load: safe, hard, single-platform, single-concern, versioned, compatibility.
  - Flagged sentence: "Demo applications occupy the safe middle and give up the hard parts: they tend to be single-platform or single-concern - SauceDemo's personas stop at a handful of web behaviors (Sauce Labs, n.d.); Juice Shop targets security alone (OWASP Foundation, n.d.) - and their testability machinery carries no compatibility contract - selectors and personas can change without notice - and has not been studied as a research object in its own right."
  - Audit: Overextended and adversarial. It tries to compare, critique, and claim novelty in one breath.

- Line 56
  - Adjective load: realistic, deterministic, checkable, instrumented, controlled.
  - Flagged sentence: "What is missing is a system realistic enough for the pitfalls to matter, deterministic enough for claims to be checkable, and instrumented enough that the instrumentation itself can be examined: a controlled laboratory rather than a demo."
  - Audit: Classic three-part AI cadence. The point is valid; the cadence is too neat.

- Line 70
  - Adjective load: open, publicly deployed, pizza-ordering, deterministic, sanctioned, versioned, public.
  - Flagged sentence: "OmniPizza is an open, publicly deployed pizza-ordering product - FastAPI backend, React web, React Native mobile - built so that testability is a product feature: deterministic failure personas whose behaviors travel in credentials, market and language rules held as data, sanctioned state-injection entry to any screen, and instrumentation contracts versioned like public APIs."
  - Audit: Feature-list sentence. Better as two sentences.

- Line 70
  - Adjective load: deliberately embedded, viewport-dependent, custom, shared-fixture, stable, documented, seeded, deterministic, archival, free, deployed, resettable, external.
  - Flagged sentence: "The laboratory is designed to serve four audiences - practitioners training against deliberately embedded pitfalls (viewport-dependent selectors, custom widgets, RTL, shared-fixture state), tool builders needing a stable benchmark target with documented seeded defects, researchers needing deterministic phenomena with archival capture of the triage side of the QA process, and educators needing a free, deployed, resettable curriculum - though adoption evidence to date is a single external harness (Section 5.2)."
  - Audit: Very high AI-hallmark density. The caveat is good, but buried.

- Line 86
  - Adjective load: multi-market, right-to-left, per-market, realistic.
  - Flagged sentence: "Multi-market commerce exercises internationalization and right-to-left layout, per-market validation rules, currency and tax arithmetic, and checkout flows - a realistic complexity envelope over a vocabulary small enough that no reader needs domain training."
  - Audit: "realistic complexity envelope" sounds manufactured.

### Related Work and Framework

- Line 119
  - Adjective load: deterministic, probabilistic-failure, server-side.
  - Flagged sentence: "SauceDemo introduced the deterministic test persona - `problem_user` - as a teaching device (Sauce Labs, n.d.); OmniPizza extends the pattern to latency, probabilistic-failure, accessibility, and security personas, and moves enforcement server-side into the credential."
  - Audit: Acceptable technical density.

- Line 128
  - Adjective load: historical, controlled, shared, experimental.
  - Flagged sentence: "Defects4J packages historical Java faults for controlled tool evaluation (Just et al., 2014), BugsJS does the same for JavaScript (Gyimesi et al., 2019), and the SIR infrastructure made the early case for shared experimental artifacts (Do et al., 2005)."
  - Audit: Fine, but citation-stacked.

- Line 128
  - Adjective load: frozen, live, seeded, reproducible, running.
  - Flagged sentence: "These corpora are deliberately frozen; OmniPizza is deliberately live - its seeded failure modes are reproducible against a running deployment, and the surrounding process (findings, verdicts, retractions) is archived as data."
  - Audit: "deliberately frozen / deliberately live" is rhetorically tidy. It may read as over-shaped.

- Line 137
  - Adjective load: algorithmic, contractual, stable, versioned, viewport-dependent.
  - Flagged sentence: "Robust-locator work such as Robula+ treats selector fragility as an algorithmic problem (Leotta et al., 2016); OmniPizza treats it as a contractual one - stable selectors versioned like an API - while deliberately embedding the fragility (viewport-dependent suffixes) that such algorithms target."
  - Audit: Strong technical contrast, but long.

- Line 157
  - Adjective load: methodological, LLM-assisted, human, design-science, validated, operational.
  - Flagged sentence: "Finally, the study sits in two methodological currents - LLM-assisted testing and triage under human oversight (Wang et al., 2024; Kang et al., 2023; Fan et al., 2023; Amershi et al., 2019) and design-science artifacts validated by case study (Hevner et al., 2004; Wieringa, 2014; Runeson & Höst, 2009; Yin, 2018) - both applied as operational constraints in Section 2.1 rather than rehearsed here."
  - Audit: Citation-loaded bridge sentence. Reads more like literature positioning than analysis.

- Line 199
  - Adjective load: abstract, relative, three-variable, binary, eight-class, confidence-flagged, orthogonal, instrumentation-mediated.
  - Flagged sentence: "The abstract notion that a finding's usefulness is relative to its consumer is operationalized in the three-variable verdict decomposition of Section 3.5 - binary verdict, eight-class taxonomy, and a confidence-flagged root-cause narrative - plus the orthogonal `instrumentation-mediated` flag, all carried per finding in `findings.csv`."
  - Audit: Too many conceptual nouns and modifiers. Split the variables into a list.

- Line 207
  - Adjective load: designed, validated, provenance-labeled, external, automated, retrospective, embedded, archival.
  - Flagged sentence: "The platform is treated as a designed artifact validated in context: its rationale is reconstructed and provenance-labeled (Section 3.1), the context is one week of external automated QA, and the validation is a retrospective embedded case study whose triangulation requirement is met by three archival sources (Section 3.5)."
  - Audit: Accurate but heavily institutional. Could be plainer.

### Methods and Materials

- Line 238
  - Adjective load: dated, archival, in-repo, atomic-testing.
  - Flagged sentence: "The design rationale was reconstructed exclusively from dated archival sources - the in-repo product-requirements and design documents, the two atomic-testing guides, the QA-architecture document, and the git history ($209$ commits, 2026-02-07 -> 2026-07-22) - rather than from the authors' recollection, so that every design claim traces to an artifact a reader can open."
  - Audit: Good evidence discipline, but long.

- Line 238
  - Adjective load: quantitative, archival, pinned, adversarial, independent, drafted, corrected.
  - Flagged sentence: "Every quantitative claim in Sections 3-4 was verified against the repository - code and archival documents - at a pinned snapshot, commit `83b8ba4` (2026-07-22, the last product commit of the study window), by an adversarial fact-checking pass run independently of the drafting pass; the separation was chosen because self-verified descriptions inherit the drafter's assumptions, and it earned its keep here - three drafted claims (the required-header enforcement surface, the scope of the injected latency, and a widget count) were refuted against the code and corrected."
  - Audit: Too long. The evidence is valuable but the sentence performs its rigor.

- Line 289
  - Adjective load: decimal, market-specific, required, localized.
  - Flagged sentence: "One configuration table drives 5 markets (MX, US, CH, JP, SA): currency and conversion, decimal rules (JPY: 0 decimals), tax rates (8-16%), a market-specific required address field (`colonia` / `zip_code` / `plz` / `prefectura` / `district`), and a localized tip field name (`propina` / `tip` / `trinkgeld` / `chippu` / `iikramiya`)."
  - Audit: Dense but concrete. Keep unless space is a concern.

- Line 315
  - Adjective load: interactive, stable, web, mobile, shared.
  - Flagged sentence: "Every interactive element carries a stable selector (165 `data-testid` occurrences on web, 114 `testID` on mobile, shared prefix convention); routes and response shapes are frozen."
  - Audit: Acceptable; all adjectives support reproducibility.

- Line 325
  - Adjective load: editable, concurrent, shared, isolated, ex-post.
  - Flagged sentence: "Editable profile state is keyed to the login session (a per-login `sid` JWT claim), so concurrent sessions of the same shared test user get isolated profiles - an *ex-post* design lesson: the keying was introduced mid-history to fix an observed login race."
  - Audit: Solid, but sentence is overloaded.

- Line 334
  - Adjective load: real-world, viewport-dependent, responsive, seeded, hand-rolled, interactive, web, mobile.
  - Flagged sentence: "Real-world automation pitfalls are reproduced on purpose: viewport-dependent selector suffixes that switch at a responsive breakpoint, a deploy-guard key that silently wipes naively seeded auth state, a persistence envelope that must be reproduced exactly, and a zoo of hand-rolled interactive widgets spanning web and mobile (quantity steppers, radio groups, checkbox cards, tab panels, ARIA comboboxes, payment toggles)."
  - Audit: Strong content, but "zoo" is informal and list-heavy.

- Line 343
  - Adjective load: heterogeneous, external, schema-generated, hand-written, golden, parameterized.
  - Flagged sentence: "Four heterogeneous test layers - from in-repo component tests to an external API suite - target the same product: schema-generated contract tests (Schemathesis, case count scales with the OpenAPI schema), 41 hand-written API integration cases including a golden characterization suite, a Vitest/React Testing Library component layer (137 test declarations), and Cypress E2E specifications parameterized over viewports and personas."
  - Audit: High technical density, not fluff. Still difficult to read.

- Line 385
  - Adjective load: external, automated, multiple, web, mobile, third-party, observable, deployed.
  - Flagged sentence: "An external automated QA harness - UI and API suites spanning multiple markets and languages on web and mobile, operated by a third party and observable to the authors only through its reports - exercised the publicly deployed platform over one week (2026-07-16 -> 2026-07-22)."
  - Audit: Necessary detail, but too many qualifiers between subject and verb.

- Line 400
  - Adjective load: archival, dated, Spanish, cited, quoted, original, surviving.
  - Flagged sentence: "Three archival sources were triangulated: the six dated explanation documents (written in Spanish), the git history (fix commits are cited by hash inside the documents and were re-resolved against the repository), and the QA-report content as quoted in the explanations (the original submitted reports were deleted outside the authors' control, so quoted excerpts are the surviving primary text)."
  - Audit: Important caveat, but it should be split to keep the provenance clear.

- Line 412
  - Adjective load: binary, eight-class, root-cause, confirmed, candidate, unidentified.
  - Flagged sentence: "Verdict state was deliberately decomposed into three variables - a binary verdict (app bug / not app bug), one of eight taxonomy classes, and a root-cause narrative carrying a `confirmed` / `candidate` / `unidentified` confidence flag - because the corpus contains events a single binary verdict would obscure: a retraction changes the explanation while preserving the final verdict, whereas the finding 5.1 reversal flipped the binary verdict itself."
  - Audit: Conceptually sound, but sentence length and taxonomy make it feel machine-compressed.

- Line 430
  - Adjective load: empirical, running, seeded-state, on-device, confirmed, self-evident, targeted.
  - Flagged sentence: "The triage protocol itself - the object of RQ3 - enforced empirical reproduction against the running system (API replay, seeded-state reproduction, on-device reproduction via `adb`, in-page axe-core runs) before any verdict that exonerated the app; confirmed bugs, including self-evident UI/layout defects, were fixed without requiring every diagnostic channel."
  - Audit: Strong protocol detail. Rewrite as two sentences.

### Results, Discussion, Conclusion

- Line 463
  - Adjective load: preliminary, real, shared-fixture, third-party, not reproducible, exonerated-unattributed.
  - Flagged sentence: "All 19 findings distribute into a preliminary 8-class verdict classification (real bug; harness artifact; shared-fixture state; infrastructure; accepted-by-design; third-party; not reproducible; exonerated-unattributed)."
  - Audit: Useful but list-like.

- Line 501
  - Adjective load: exotic, ordinary, non-blocking, failing.
  - Flagged sentence: "Schema-version drift and missing tooling are not exotic failures; they are the ordinary bugginess of test code that Vahabzadeh et al. (2015) document, compounded here by a CI configuration that runs the component layer non-blocking - so its one failing spec had no channel through which to be noticed."
  - Audit: Good point, slightly over-editorial.

- Line 501
  - Adjective load: plausible, non-blocking, non-actionable, permanently ignorable.
  - Flagged sentence: "It is plausible that the non-blocking setting, adopted to keep noise out of the merge path, worked exactly as intended and still produced rot: Sadowski et al. (2018) argue that developers discount findings they perceive as non-actionable, and a permanently ignorable suite is the purest possible non-actionable signal."
  - Audit: "purest possible" is the sort of flourish reviewers dislike.

- Line 501
  - Adjective load: nominally healthy, pinned, planned, physical, allowed.
  - Flagged sentence: "Executing even the nominally healthy layers was not tidy: on the study machine, the pinned Cypress binary twice failed to unpack through its own installer and had to be downloaded and extracted by hand before the component suite would start, and a planned run of the E2E layer on physical Android hardware was mooted when the phone terminal allowed `npm install` but not enough toolchain execution to run Cypress or Expo automation."
  - Audit: This is valuable context but too anecdotal and too long.

- Line 516
  - Adjective load: final, flaky-test, non-deterministic, environment-coupled.
  - Flagged sentence: "Eight of nineteen findings ($8/19$) were, under final verdicts, not application bugs - the same order of magnitude as the roughly one-third misclassification Herzig et al. (2013) report for issue trackers, and consistent with the flaky-test literature's finding that non-deterministic and environment-coupled signals dominate at scale (Memon et al., 2017)."
  - Audit: The comparison is useful but "same order of magnitude" is a hedge.

- Line 535
  - Adjective load: randomized, deterministic, credential-keyed, composable.
  - Flagged sentence: "Basiri et al. (2016) advocate injecting real-world events into production systems - randomized in tools such as Chaos Monkey - evaluated against steady-state hypotheses; OmniPizza's chaos is nearly the opposite - deterministic, credential-keyed, composable - and aligns more closely with Binder's (1994) controllability/observability program and Freedman's (1991) domain testability than with production experimentation."
  - Audit: Strong contrast, but it stacks two literatures and the paper's novelty into one sentence.

- Line 535
  - Adjective load: usable, checkable, randomized, production, different, specific.
  - Flagged sentence: "The data suggest that determinism is what makes a teaching and benchmarking laboratory usable - the same persona always fails the same way, so a detection claim is checkable - while randomized production chaos answers a different question about a specific deployment's resilience."
  - Audit: Good argument. Slightly slogan-shaped.

- Line 550
  - Adjective load: cautious, LLM-in-testing, literary/current.
  - Flagged sentence: "The triage results speak to the LLM-in-testing literature more cautiously than that literature sometimes speaks of itself."
  - Audit: Clever but hostile to the literature. This sounds like reviewer bait.

- Line 550
  - Adjective load: plausible, retracted, reproducible, unobserved, disciplined.
  - Flagged sentence: "Our week of triage is consistent with all three, and it is plausible that the protocol, not the model, carried the reliability we observed: the two retracted explanations were the two root-cause claims that reached beyond the reproducible boundary - attributions about a harness the agent could not observe - while every disciplined empirical exoneration survived."
  - Audit: Long and overconfident around causality.

- Line 566
  - Adjective load: purpose-built, external, inferential, statistical.
  - Flagged sentence: "This is one case - one purpose-built sandbox, one week, one external harness, nineteen findings - numbers that support existence claims and nothing stronger, which is why no inferential statistics appear."
  - Audit: Good limitation. Keep.

- Line 659
  - Adjective load: plausible, long-lived, teaching, seeded, machine-readable, versioned, oracle-independent, checkable.
  - Flagged sentence: "It is plausible that any long-lived teaching sandbox drifts toward certifying its own seeded faults unless a machine-readable manifest - versioned, oracle-independent, checkable against the deployment - anchors what *defect* means."
  - Audit: Interesting, but "plausible that any" is too broad from one case.

- Line 676
  - Adjective load: unexecuted, independent, archived, quoted, raw, toggled, human, adjudicated.
  - Flagged sentence: "Nearer-term steps are already queued - the unexecuted catalog rows, independent adoption studies - but the pathway this study specifically unlocks is a within-platform protocol ablation: replay the archived findings stream - the reports as quoted in the explanation documents, the only form in which the raw reports survive, with the selection bias that implies - through the same model under toggled protocol components (reproduce-before-verdict on and off; human gates on and off) and score the resulting verdicts against the adjudicated final verdicts in `findings.csv`."
  - Audit: Too long for a conclusion. Split into planned work and protocol-ablation design.

## 2. Ghost Citation Check

These citations are not necessarily fake. They look generic or mutable enough that a hostile
reviewer could call them weak unless the source is pinned more tightly.

| Citation | Why It Looks Generic | Fix |
|---|---|---|
| Sauce Labs, n.d. / Swag Labs | Demo homepage, mutable behavior, no version or archived snapshot. | Cite an official doc page, release note, or archived snapshot used for the claim about `problem_user`. |
| OWASP Foundation, n.d. / Juice Shop | Project page supports a broad claim but not a stable versioned artifact claim. | Cite the Juice Shop release, repository tag, or official challenge documentation. |
| TasteJS, n.d. / TodoMVC | Landing page tagline, not a stable benchmark specification. | Cite the GitHub repository commit/tag or archived project page. |
| Deque Systems, 2026 / axe-core GitHub | Software citation points to a moving GitHub repository. The year also implies current project state, not necessarily the tested version. | Cite the exact npm package version or GitHub release/tag used by the test environment. |
| "canonical record" verification note in References | The phrase says every entry was verified, but the reader cannot inspect the verification log from the reference list alone. | Add or link a small verification appendix with DOI/page checked and date. |
| Wang et al., 2024 for "LLM-based testing tools" | The citation is real, but the sentence uses it to support a broad ecosystem claim. | Add 1-2 concrete tool examples or narrow the claim to "LLM-based testing research." |
| Live deployments in Availability | Not a citation problem, but live URLs are mutable and not archival evidence. | Pair them with the promised DOI or an archived release snapshot before submission. |

## 3. Repetitive Sentence Structure

Strict checklist result: no paragraph found where every sentence starts with "The" or
"This."

Near misses:

- Line 566: limitation paragraph starts with a repeated pattern: "The / This / The / The / The / Generalization / The / That." It passes the strict test, but the rhythm is monotonous.
- Line 488: early discussion rhythm leans on "The / Zero / The / This." Not a violation, but it adds to the formal, generated cadence.
- Line 501: "The / Schema / It / The / Executing / The." Again, not a strict failure, but "The" is doing too much paragraph-opening work.

## 4. AI Hallmarks and Fluff

- Over-polished thesis slogans:
  - "Automated testing is how modern software teams buy confidence."
  - "A laboratory is a promise about the future, not a report about the past."
  - "The interesting question stops being whether a model can triage."

- Abstract nouns stacked as authority signals:
  - "evidence discipline"
  - "analytic generalization"
  - "instrumentation-mediated"
  - "protocol ablation"
  - "phenomenon generator"

- Reviewer-risk phrasing:
  - "the purest possible non-actionable signal"
  - "more cautiously than that literature sometimes speaks of itself"
  - "any long-lived teaching sandbox"

- Compression risk:
  - Several sentences attempt to state method, data, caveat, and interpretation at once. This makes the paper look more machine-shaped even when the evidence is real.

## 5. Five Weakest Sentences and Human Rewrites

### Weak Sentence 1

Original:
"Automated testing is how modern software teams buy confidence: continuous-integration systems execute suites at every change, and an ecosystem of tools - locator engines, contract checkers, accessibility scanners, and lately LLM-based testing tools (Wang et al., 2024) - competes to turn those executions into trustworthy verdicts."

Why weak:
The sentence opens with a slogan, then packs a tool taxonomy and citation into the same breath.

Human rewrite:
"Modern teams rely on automated tests in CI to decide whether a change is safe to ship. Around those tests, tools for locators, contracts, accessibility, and LLM-assisted analysis try to make failures easier to interpret."

### Weak Sentence 2

Original:
"Demo applications occupy the safe middle and give up the hard parts: they tend to be single-platform or single-concern - SauceDemo's personas stop at a handful of web behaviors (Sauce Labs, n.d.); Juice Shop targets security alone (OWASP Foundation, n.d.) - and their testability machinery carries no compatibility contract - selectors and personas can change without notice - and has not been studied as a research object in its own right."

Why weak:
It overclaims against comparator systems and bundles too many criticisms together.

Human rewrite:
"Demo applications are easier to test than production systems, but they usually narrow the problem. SauceDemo focuses on a small set of web personas, and Juice Shop focuses on security; neither provides a versioned contract for testability mechanisms such as selectors and personas."

### Weak Sentence 3

Original:
"What is missing is a system realistic enough for the pitfalls to matter, deterministic enough for claims to be checkable, and instrumented enough that the instrumentation itself can be examined: a controlled laboratory rather than a demo."

Why weak:
The three-part cadence is polished but generic. It sounds like the abstract of any benchmark paper.

Human rewrite:
"The gap is a running system that combines realistic UI/API behavior with deterministic faults and inspectable test instrumentation."

### Weak Sentence 4

Original:
"The laboratory is designed to serve four audiences - practitioners training against deliberately embedded pitfalls (viewport-dependent selectors, custom widgets, RTL, shared-fixture state), tool builders needing a stable benchmark target with documented seeded defects, researchers needing deterministic phenomena with archival capture of the triage side of the QA process, and educators needing a free, deployed, resettable curriculum - though adoption evidence to date is a single external harness (Section 5.2)."

Why weak:
It reads like a grant abstract. The real limitation is important but hidden at the end.

Human rewrite:
"OmniPizza targets four groups: practitioners, tool builders, researchers, and educators. The current adoption evidence is still narrow: one external harness used the platform during the study week."

### Weak Sentence 5

Original:
"The triage results speak to the LLM-in-testing literature more cautiously than that literature sometimes speaks of itself."

Why weak:
It is clever, but it sounds smug and vague. A hostile reviewer may treat it as rhetoric replacing evidence.

Human rewrite:
"The triage results support a narrower claim than much of the current LLM-testing literature: in this study, reliability appears to come from the reproduction protocol, not from the model alone."

## Final Auditor Notes

Keep the evidence-heavy spine. Cut the slogan layer. The paper will sound more human if it
uses shorter sentences around the novelty claim and lets the artifact details carry the
authority instead of adjectives doing that work.

