# OmniPizza Platform Fact Sheet

Required companion to `omnipizza-paper.md` (v0.5, IMRaD numbering). Every quantitative claim
in the paper's Sections 3–4, with its **counting rule** and an **executable read-only
verification command**.

- **Pinned snapshot:** commit `83b8ba4` (2026-07-22, the last product commit of the study
  window). Measurements taken 2026-07-23 at HEAD `397e095`; `git diff 83b8ba4..HEAD` touches
  only `documents/paper/`, so every product-code measurement holds identically for both trees.
- **Verification protocol:** each command was run by one extraction pass and independently
  re-run by a second adversarial pass; all values reproduced. One command was corrected during
  re-run (widget-zoo row — see Caveats).
- Commands assume the repo root as working directory and a POSIX shell. `python -c` commands
  may create gitignored `backend/__pycache__/` bytecode as a side effect; nothing tracked is
  mutated.

## 1. Backend behaviors (Sections 3.2.1 and 3.3)

| Claim (§) | Value | Counting rule | Command | Measured (2026-07-23) |
|---|---|---|---|---|
| Deterministic chaos users (3.2.1) | 7 | entries in `TEST_USERS`, `backend/constants.py` | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print(len(c.TEST_USERS),sorted(c.TEST_USERS))"` | 7: a11y_glitch, error, locked_out, performance_glitch, problem, security_glitch, standard |
| performance_glitch delay (3.2.1, 3.3) | 3.0 s on exactly 2 endpoints | `time.sleep` arg in `middleware.py::apply_user_behavior`; scope = routes declaring `Depends(apply_user_behavior)` | `grep -n 'time.sleep' backend/middleware.py && grep -rn 'Depends(apply_user_behavior)' backend/routers backend/test_api.py backend/main.py` | `time.sleep(3.0)` at middleware.py:58; only GET `/api/pizzas` (catalog.py:45) and POST `/api/checkout` (checkout.py:16) |
| error_user failure probability (3.2.1, 3.3) | p = 0.5 | probability literal in `database.py::should_trigger_error` | `grep -n -A3 'def should_trigger_error' backend/database.py` | `random.random() < 0.5` (database.py:331), behaviors `('error','security_glitch')` |
| problem_user data mutation (3.2.1, 3.3) | $0 prices + broken image | catalog/cart builders override price and image when behavior == 'problem' | `grep -n -B2 -A2 "== 'problem'" backend/database.py` | `price = 0.0` and `image = 'https://broken-image-url.com/404.jpg'` at database.py:213-215 and :263-265 |
| a11y_glitch modes (3.2.1, 3.3) | 3 modes; wrong-lang draws among 6 languages; catalog/cart calls only | `len(A11Y_GLITCH_MODES)`, `len(A11Y_GLITCH_LANGS)`; draw sites = `random.choice` in catalog+cart builders | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print(c.A11Y_GLITCH_MODES,c.A11Y_GLITCH_LANGS)"` | 3 modes (missing_name, wrong_lang, extreme_text); 6 langs; draws at database.py:200 and :248 |
| security_glitch seeding (3.2.1) | 3 profile fields × 3 payloads; leaks at p = 0.5 | pool sizes in `constants.py`; per-login sampling in `auth.py` | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print(c.SECURITY_GLITCH_PROFILE_FIELDS,len(c.SECURITY_GLITCH_PAYLOADS))"` | 3 fields (full_name, address, notes) × 3 payloads; **one random (field, payload) pair seeded per login** (auth.py:55-58), not all 9 at once |
| Debug latency-spike endpoint (3.3) | 0.5–5 s random | `random.uniform` bounds in the handler | `grep -n -A4 'latency-spike' backend/routers/debug_chaos.py` | `random.uniform(0.5, 5.0)` + `time.sleep` (debug_chaos.py:20-21) |

## 2. Markets and i18n (Section 3.2.2)

| Claim (§) | Value | Counting rule | Command | Measured (2026-07-23) |
|---|---|---|---|---|
| Markets (3.2.2) | 5 | keys of `COUNTRY_CONFIG` | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print(sorted(str(k) for k in c.COUNTRY_CONFIG))"` | CH, JP, MX, SA, US |
| Languages (3.2, 3.2.2, 3.3) | 6 incl. Arabic RTL | union of `languages` lists across `COUNTRY_CONFIG` | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;langs=set();[langs.update(v['languages']) for v in c.COUNTRY_CONFIG.values()];print(sorted(langs))"` | ar, de, en, es, fr, ja |
| Pizza catalog (3.2) | 12 pizzas × 6 languages | `len(PIZZA_CATALOG)`; languages = keys of a localized name dict | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print(len(c.PIZZA_CATALOG), len(c.PIZZA_CATALOG[0]['name']))"` | 12 / 6 |
| Tax-rate range (3.2.2) | 8–16% | min/max of `tax_rate` across entries | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print({str(k):v['tax_rate'] for k,v in c.COUNTRY_CONFIG.items()})"` | US 0.08, CH 0.081, JP 0.10, SA 0.15, MX 0.16 |
| JPY decimals (3.2.2) | 0 | `decimal_places` for JP | see markets command | 0 |
| Required address field (3.2.2) | 1 per market: colonia / zip_code / plz / prefectura / district | `required_fields` per entry | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print({str(k):v['required_fields'] for k,v in c.COUNTRY_CONFIG.items()})"` | exactly 1 each, names as listed |
| Tip field name (3.2.2) | propina / tip / trinkgeld / chip / baksheesh | `tip_field` per entry | `python -c "import sys;sys.path.insert(0,'backend');import constants as c;print({str(k):v['tip_field'] for k,v in c.COUNTRY_CONFIG.items()})"` | as listed |
| US zip validation (3.2.2) | 5 digits, model-level | Pydantic validator in `backend/models.py` (`isdigit` + `len == 5`) | `grep -n -A5 "@validator('zip_code')" backend/models.py` | models.py:112-117; **also applies to MX's optional zip_code** (see Caveats) |

## 3. API surface, contracts, atomic entry (Sections 3.2.3–3.2.4)

| Claim (§) | Value | Counting rule | Command | Measured (2026-07-23) |
|---|---|---|---|---|
| Deployables (3.2) | 3 | top-level app dirs with independent install/build | `ls -d backend frontend frontend-mobile` | all present |
| API operations (3.2.4) | 20 `/api` ops; 18 distinct paths; 22 incl. `/` + `/health` | FastAPI route decorators across `backend/main.py`, `backend/test_api.py`, `backend/routers/*.py` | `python -c "import re,glob;files=['backend/main.py','backend/test_api.py']+sorted(glob.glob('backend/routers/*.py'));paths=[p for f in files for p in re.findall(r'@(?:app\|router)\\.(?:get\|post\|put\|delete\|patch)\\(\\s*\\\"([^\\\"]+)\\\"',open(f,encoding='utf-8').read())];api=[p for p in paths if p.startswith('/api')];print(len(api),len(set(api)),len(paths))"` | 20 / 18 / 22 |
| Required-header enforcement (3.2.4) | HTTP 400; exactly 2 read endpoints | routes declaring `Depends(require_country_header)`; middleware raises 400 | `grep -rn 'Depends(require_country_header)' backend && grep -n -A3 'if not x_country_code' backend/middleware.py` | GET `/api/pizzas` + GET `/api/cart`; 400 at middleware.py:14-17; checkout has no header dependency (market in body) |
| Web selector occurrences (Abstract, 3.2.4) | 165 | literal `data-testid` occurrences under `frontend/src` (occurrences, not distinct IDs) | `grep -ro 'data-testid' frontend/src \| wc -l` | 165 |
| Mobile selector occurrences (Abstract, 3.2.4) | 114 | literal `testID` occurrences in `frontend-mobile/src` + `App.tsx` | `grep -ro 'testID' frontend-mobile/src frontend-mobile/App.tsx \| wc -l` | 114 |
| Deep-link screens (3.2.3) | 6 screens; 5 universal params | top-level `config.screens` entries in `linking.ts` (the `customizer` alias is not a distinct screen) | inspect `frontend-mobile/src/navigation/linking.ts:39-46` | Login, Catalog, PizzaBuilder, Checkout, OrderSuccess, Profile; accessToken, market, lang, resetSession, hydrateCart |

## 4. Test portfolio and embedded curriculum (Sections 3.2.6–3.2.7)

| Claim (§) | Value | Counting rule | Command | Measured (2026-07-23) |
|---|---|---|---|---|
| Widget zoo (3.2.6) | 9 web / 11 mobile | body rows of the "Interactive widgets" tables (header `\| Widget` and separator rows excluded) | `awk '/^## Interactive widgets/{f=1;next} f&&/^##[^#]/{f=0} f' ATOMIC_WEB_TESTING.md \| grep -E '^\| [^-\|: ]' \| grep -cv '^\| Widget'` (same for mobile file) | 9 / 11 |
| Test layers (3.2.7) | 4 | distinct suite technologies: Schemathesis, Vitest API, Cypress component, E2E latency experiments | `ls tests/test_contract.py tests/api.test.ts frontend/cypress/component frontend-mobile/e2e/experiments/latency_resilience.e2e.js` | all 4 present |
| API integration cases (3.2.7) | 41 = 23 + 18 | lines starting `it(`/`test(` in `tests/api.test.ts` + `tests/golden.test.ts` | `grep -cE '^\s*(it\|test)\(' tests/api.test.ts tests/golden.test.ts` | 23 + 18 |
| Component-test specs (3.2.7) | 11 | `*.cy.jsx` files under `frontend/` excl. node_modules | `find frontend -name '*.cy.jsx' -not -path '*/node_modules/*' \| wc -l` | 11 |
| Negative-flow matrix (3.2.7) | 13 scenarios | body rows with ID starting `NF-` in PRD §10.1 | `grep -c '^\| \`NF-' documents/Product_Requirement_Doc.md` | 13 (AUTH×4, CAT×2, PERF×1, CHECKOUT×4, ORDER×2) |

## 5. Evaluation (Sections 3.5 and 4.2)

| Claim (§) | Value | Counting rule | Command | Measured (2026-07-23) |
|---|---|---|---|---|
| Study window / cycles (3.5/4.2) | 6 cycles = 5 findings-bearing + 1 re-verification; 2026-07-16 → 07-22 | `EXPLANATION_qa_report_*.md` files; the 07-19 doc is explicitly a re-verification | `ls documents/explanation/EXPLANATION_qa_report_*.md` | 6 files, dates as claimed |
| N = 19 findings (3.5/4.2) | 19 = 8+3+0+2+3+3 | numbered `## N.` items across the 5 findings-bearing docs; pre-dismissed item unnumbered and excluded | `for f in <the five docs>; do grep -cE '^## [0-9]+[.)]' $f; done` | 8+3+2+3+3 = 19 |
| Real bugs (3.5/4.2) | 11/19 under final verdicts | items with final real-bug verdict: 07-16 ×6, 07-18 ×1, 07-20 ×1, 07-21 ×3 (incl. reversed #2) | manual: verdict headers + Resumen tables of the docs | 6+1+1+3+0 = 11 |
| Per-cycle rates (3.5/4.2) | 6/8, 1/3, 0 new, 1/2, 3/3, 0/3 | denominator = numbered items; numerator = final real-bug verdicts | `grep -E '^## [0-9]+[.)]' documents/explanation/EXPLANATION_qa_report_*.md` + verdict headers | exact match; cycle 5 initially 2/3 ("veredicto original corregido") |
| Verdict classification (3.5/4.2) | 8 classes | classes enumerated in §5; 11 real + 7 non-real classes | manual: the §5 list | 8 exactly |
| Non-bug decomposition (3.5/4.2) | 1+1+1+2+1+1+1 = 8 | final classes of the 8 non-real items (see `findings.csv` rows F02, F06, F09, F10, F13, F17, F18, F19) | manual: verdict language of each doc | matches one-to-one |
| Instrumentation-mediated false positives (3.5/4.2) | 2 confirmed + 1 candidate | non-bug findings whose vehicle is a sanctioned test-entry mechanism: F18 (resetSession), F17 (cart hydration); candidate F09 (seedProfile, "Candidato alternativo (sin confirmar)") | manual: 07-22 items 1-2; 07-19 item 1 | 2 + 1 |
| Retractions / reversal (3.5/4.2) | 2 + 1 | retractions = 07-19 items 1-2 ("no se sostiene", both about the external harness); reversal = 07-21 #2 | `grep -E '^## [0-9]' <07-19 and 07-21 docs>` | 2 + 1 |
| Cold/warm latency (3.5/4.2) | 31.5 s; 215–663 ms | figures quoted in the 07-20 doc: **one** cold `/health` start; warm `GET /api/orders/{id}` repeats | `grep -n '31.5' documents/explanation/EXPLANATION_qa_report_2026-07-20.md` | 31.5 s at line 170; warm 215/235/413/663 ms at lines 170-174 |
| Releases from cycles (3.5/4.2) | 4 of 6 | attribution rule: 07-16→v1.1.4, 07-18→v1.1.5, 07-20→v1.1.7, 07-21→v1.1.8; v1.1.6 (in-window) was feature work, not triage output | `git for-each-ref --format='%(refname:short) %(creatordate:short)' refs/tags \| grep v1.1` | tags dated 07-17/18/19/20/21; attribution from the explanation docs, **not derivable from tags alone** |
| Releases total (Section 3.2 / Appendix) | 18 distinct versions (22 raw tags) | tags normalized (strip `v`/`V`, lowercase), deduplicated; excludes 1.0.1, V1.0.0, V1.0.4, V1.0.5 | `git tag \| sed 's/^[Vv]//' \| sort -u \| wc -l && git tag \| wc -l` | 18 / 22 |
| Snapshot pin (3.1) | `83b8ba4`, 2026-07-22 | commit date; "last product commit" = no later commit touches product code | `git show -s --format='%H %ad' --date=short 83b8ba4 && git diff --stat 83b8ba4..HEAD` | date matches; diff to HEAD touches only `documents/paper/` |
| Repository history (3.1) | 209 commits, 2026-02-07 → 2026-07-22 | commits reachable from the pinned snapshot `83b8ba4` (not HEAD) | `git rev-list --count 83b8ba4 && git log --reverse --format='%ad' --date=short 83b8ba4 \| head -1` | 209; first commit 2026-02-07; snapshot 2026-07-22 |

## 6. Sections 3.4/4.1 exemplar execution (2026-07-23)

Environment: local backend (`python main.py`, port 8000) at product snapshot `83b8ba4`
(working tree product-code-identical); fresh in-memory state; suites run **as-is**, unmodified.
Contract layer executed with Schemathesis 3.25.1 under pytest 7.4.4 (`tests/requirements.txt`),
Hypothesis `max_examples = 50` per endpoint with a 5000 ms deadline (`tests/test_contract.py:19-23`).

| Step / layer | Command | Outcome |
|---|---|---|
| Ground truth (live) | login `problem_user` → `GET /api/pizzas` (US/en headers) | 12/12 pizzas `price: 0.0`, image `https://broken-image-url.com/404.jpg` |
| Contract (Schemathesis 3.25.1, pinned) | `pytest test_contract.py -v` (deps from `tests/requirements.txt`) | collection error: "The provided schema uses Open API 3.1.0, which is currently not fully supported" — layer non-executable as-is |
| Contract, by construction | `curl /api/openapi.json` → inspect `Pizza.price` / `EnrichedCartItem.price` | both are `{"type": "number"}` with no `minimum`/`exclusiveMinimum` → $0 is schema-valid; undetectable by any contract run |
| API integration (Vitest 4.0.18) | `npx vitest run` in `tests/` | 46/46 passed with defect active, incl. "problem_user gets $0 prices and the broken image" (`expect(p01.price).toBe(0)`) — inverted oracle |
| Component (Cypress 15.11.0) | `npx cypress run --component` in `frontend/` | 14/15 passed; `ProductCard.cy.jsx` fails on mount with `t is not a function` — spec omits the `t` prop the component acquired later (fixture `type: "meat"` renders the badge calling `t("bestseller")`); unrelated to the seeded defect; masked in CI by `continue-on-error` |
| E2E (Detox) | inspection: `frontend-mobile/package.json`, `e2e/jest.config.js`, released `omnipizza-debug-androidTest.apk` (v1.1.8) | non-executable as-is: no `detox`/`jest` devDependencies; `e2e/jest.config.js` (referenced by `.detoxrc.js`) does not exist; androidTest APK is 8,518 bytes / 4 entries with zero Detox classes; spec has no price oracle and targets standard/performance-glitch only |

Headline: **0 of 4 layers detect the seeded defect as-is**; 2 of 4 layers are currently
non-executable (schema-version drift; missing tooling).

## Caveats (must accompany any use of the numbers above)

1. **Archival gap (resolved 2026-07-23):** three of the six explanation documents the
   evaluation depends on (`EXPLANATION_qa_report_2026-07-{19,20,22}.md`) plus
   `arquitectura_qa.md` were untracked at measurement time; they were committed in `78b7631`.
   Note they are therefore absent from the pinned product snapshot `83b8ba4` and entered
   version control after the study window closed — their pre-commit provenance rests on
   file-system timestamps and the working tree.
2. **Exclusions partially verifiable:** of the three exclusion rules behind N = 19, the
   pre-dismissed locked-out item is archived in the 07-16 doc, but the two harness-own-code
   bugs rest on unarchived primary sources (raw QA reports are deleted per the triage
   workflow; `documents/bugs/` is empty).
3. **Zip-validator scope:** the 5-digit rule also applies to MX's *optional* `zip_code`; the
   paper mentions only US. The value (5 digits) is correct; the scope is slightly wider.
   The `zip_code_pattern` entry in `COUNTRY_CONFIG` is dead config — no code reads it.
4. **security_glitch sampling:** each login seeds exactly **one** random (field, payload)
   pair from the 3 × 3 pool, not all nine at once.
5. **Cold-start precision:** 31.5 s is a single opportunistic measurement, not a mean.
6. **Widget-count command:** the naive row-count regex also matches the table header; the
   command above excludes it (this exact mistake was caught during independent re-run).
7. **Release attribution:** the cycle→release mapping carries information from the
   explanation docs; tags alone cannot distinguish v1.1.6 (feature release) from
   triage-driven releases.
8. **`instrumentation_mediated` flag definition** (`findings.csv`): true only when a
   *sanctioned state-injection mechanism* (cart hydration, `resetSession`, `seedProfile`) is
   the vehicle. F01's login race manifested under harness parallelism — a usage pattern, not
   an injection mechanism — and is coded `false`.
9. **Source vs. runtime test counts:** "41 API integration cases" counts source-level
   `it(`/`test(` declarations (23 + 18). At runtime Vitest executes **46** tests (23 + 23):
   parametrized loops in `golden.test.ts` expand five additional cases. Both numbers are
   correct under their respective counting rules; the Section 6 exemplar reports the runtime
   figure (46/46).
