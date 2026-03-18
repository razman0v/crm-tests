# Dental CRM Test Suite — Next Steps & Roadmap

**Last Updated:** 2026-03-18
**Basis:** Verified codebase scan → [implementation_status.md](implementation_status.md)
**Current Completion:** 70.3% (52/74 features)
**Remaining Features:** 21 missing + 1 in-progress

> ⚠️ **Previous roadmap (2026-03-05) was based on incorrect status data** — it claimed Phases 1–5 were 100% done. This document is rebuilt from a verified file-by-file scan.

---

## Current Reality Check

| Phase | Reported (old) | Actual (verified) |
|-------|---------------|-------------------|
| Phase 1: Project Init | 100% ✅ | 100% ✅ |
| Phase 2: Spikes | 100% ✅ | 100% ✅ |
| Phase 3: Config + Auth | 100% ✅ | 74% 🚧 |
| Phase 4: API Layer | 100% ✅ | 88% 🚧 |
| Phase 5: UI Components | **100% ✅** | **~14% ❌** |
| Phase 6: E2E Tests | 100% ✅ | 71% 🚧 |
| Phase 7: Infra + CI/CD | 57% 🚧 | 54% 🚧 |
| Verification Tooling | 0% | 0% ❌ |

**Root cause of gap:** 9 UI components/pages (Dental Chart, Treatment Plan, Visit Details composition, etc.) were listed as ✅ Done with invented file paths — none of them exist on disk.

---

## Blocking Dependency Map

```
[DentalChart widget]──────┐
[TreatmentPlan component]─┤
[MedicalDiary component]──┼──▶ [VisitDetailsPage] ──▶ [complete-visit-flow.spec.ts]
[Questionnaire component]─┤         (Steps 7-14)           (currently stubbed)
[VisitStatus component]───┘

[.gitlab-ci.yml] ──▶ [Parallel sharding] ──▶ [T_total ≤ 15 min SLA]

[staging.config.ts] ──▶ [Multi-env support]

[patients.spec.ts] ──▶ [Full API contract coverage]
[visits.spec.ts]   ──▶ [Full API contract coverage]

[Contract Verifier] ──▶ [Pre-run API health gate]
```

**Most items below are independent** — staging config, CI, and tooling scripts can be done in parallel with UI components.

---

## Missing Features — Detailed Breakdown

### CATEGORY A: UI Organisms (BLOCKING E2E) — 0/5 ❌

These are the critical-path blockers. `complete-visit-flow.spec.ts` Steps 7–14 are currently stubbed with a `// TODO` comment because these components don't exist.

---

#### A1. `VisitStatus` Component
**File to create:** `src/pages/components/visit-status.component.ts`
**Missing pieces:**
- `changeStatus(to: string)` — expands status dropdown, clicks target option, waits for badge to update
- `getStatus()` — reads current status badge text
- Locator for the status dropdown (from `visit.page.ts`: `clickStateButton()` exists but is not encapsulated)

**Dependencies:** `BasePage` ✅ (already exists)
**Effort:** 2–3 h
**Priority:** P0 — needed before `VisitDetailsPage` can work
**Acceptance:** `changeStatus('Пациент пришел')` updates the visible badge; `getStatus()` returns the new value

---

#### A2. `DentalChart` Widget
**File to create:** `src/pages/components/dental-chart/dental-chart.widget.ts`
**Missing pieces:**
- `selectTooth(number: number)` — clicks SVG path by tooth ID (spike `probe-dental-chart-dom.ts` ✅ has the selector strategy)
- `markCondition(type: string)` — selects from condition context menu after tooth click
- `saveChart()` — submits the chart state
- Visual isolation method using `page.route` (mock `{ "teeth": [{ "id": 18, "status": "caries" }] }`)
- Map of 32 teeth IDs → SVG path selectors (the spec's explicit **TODO**)

**Dependencies:** `BasePage` ✅, dental chart DOM spike ✅ (use it to extract selectors)
**Effort:** 5–8 h (largest single item — 32 teeth mapping is non-trivial)
**Priority:** P0
**Acceptance:** `selectTooth(18)` → `markCondition('caries')` → `saveChart()` completes without error; `page.route` mock shows tooth 18 as `.status-caries`

---

#### A3. `TreatmentPlan` Component
**File to create:** `src/pages/components/treatment-plan.component.ts`
**Missing pieces:**
- `addService(serviceName: string)` — searches for and adds a medical service to the plan
- `transferToVisit()` — clicks "Add to Visit" button, waits for the grid to empty
- `savePlan()` — persists the treatment plan

**Dependencies:** `BasePage` ✅, `InputField` atom ✅
**Effort:** 3–4 h
**Priority:** P0
**Acceptance:** `addService('Пломбирование')` adds a row; `transferToVisit()` empties the plan grid

---

#### A4. `MedicalDiary` Component
**File to create:** `src/pages/components/medical-diary.component.ts`
**Missing pieces:**
- `addNote(text: string)` — fills diary entry textarea
- `getNotes()` — returns array of existing note texts
- Save/submit trigger

**Dependencies:** `BasePage` ✅
**Effort:** 2–3 h
**Priority:** P0
**Acceptance:** `addNote('Жалобы на боль')` persists and appears in `getNotes()`

---

#### A5. `Questionnaire` Component
**File to create:** `src/pages/components/questionnaire.component.ts`
**Missing pieces:**
- `fillQuestion(label: string, answer: string)` — finds question by label, fills answer
- `submit()` — submits completed questionnaire
- Handle both text input and radio/checkbox answer types

**Dependencies:** `BasePage` ✅, `InputField` atom ✅
**Effort:** 2–3 h
**Priority:** P0
**Acceptance:** `fillQuestion('Аллергии', 'Нет')` saves without error; `submit()` closes questionnaire section

---

### CATEGORY B: CRM Pages (BLOCKING E2E) — 0/3 ❌

---

#### B1. `VisitDetailsPage` (Composition)
**File to create:** `src/pages/crm/visit-details.page.ts`

> **Note:** `src/pages/visit.page.ts` exists and has `clickTooth()` + `clickStateButton()` but it is **not** the spec-required composition. It can be used as reference for locators.

**Missing pieces:**
- Class with properties: `dentalChart: DentalChart`, `treatmentPlan: TreatmentPlan`, `diary: MedicalDiary`, `questionnaire: Questionnaire`, `visitStatus: VisitStatus`
- `changeStatus(to: string)` — delegates to `this.visitStatus.changeStatus(to)`
- `completeVisit()` — orchestrates full workflow (status → chart → plan → diary → final status)
- `goto(visitId: number)` — navigates to `BaseURL + '/visits/' + visitId`

**Dependencies:** A1–A5 (all organisms), `BasePage` ✅
**Effort:** 2–3 h (mostly composition, locators already exist in `visit.page.ts`)
**Priority:** P0 — unblocks `complete-visit-flow.spec.ts` Steps 7–14
**Acceptance:** `visitDetailsPage.changeStatus('Завершен')` updates the status badge end-to-end

---

#### B2. `DashboardPage`
**File to create:** `src/pages/crm/dashboard.page.ts`
**Missing pieces:**
- `isVisible()` — asserts post-login landing element present
- `navigate()` — `goto('/')` with navigation wait
- Used by `auth.setup.ts` to confirm successful login

**Dependencies:** `BasePage` ✅
**Effort:** 1 h
**Priority:** P1 — also needed for auth setup validation
**Acceptance:** `dashboardPage.isVisible()` returns `true` after login

---

#### B3. `PatientCardPage`
**File to create:** `src/pages/crm/patient-card.page.ts`
**Missing pieces:**
- `goto(patientId: number)`
- `getPatientName()` — reads patient full name
- `editPatient()` — opens edit mode

**Dependencies:** `BasePage` ✅
**Effort:** 2 h
**Priority:** P2 — not needed for core E2E flow, useful for future patient-management tests
**Acceptance:** `patientCard.getPatientName()` matches the name from `PatientFactory`

---

### CATEGORY C: E2E Test Fixes — 1 in-progress 🚧

---

#### C1. Fix `complete-visit-flow.spec.ts` (Steps 7–14 + hardcoded data)
**File:** `src/tests/e2e/workflows/complete-visit-flow.spec.ts`
**Current issues (from code review):**
1. **Steps 7–14 are stubbed** — `// TODO: Continue with remaining steps` with only a questionnaire tab click
2. **Hardcoded patient data** — `snils: '12345678901'`, `name: 'Петров'`, `phone: '+79991234567'` should come from `PatientFactory.createRandom()`
3. **DoctorBranchId hardcoded as `1`** — `doctorBranchId = 1; // TODO: Replace with actual glossary call`
4. **Visit URL constructed inline** — `visitPage.goto(visit.id)` works but spec requires `BaseURL + "/visits/" + VisitID` pattern

**Missing pieces:**
- Replace hardcoded patient data with `PatientFactory.createRandom()`
- Resolve real `doctorBranchId` via `glossaryService.getJobPositionId()` or `employeeService`
- Implement Steps 7–14: dental chart interaction, treatment plan, diary, questionnaire, final status change
- These steps depend on **B1 `VisitDetailsPage`** being implemented first

**Dependencies:** A1–A5, B1 (all organisms + composed page)
**Effort:** 3–4 h (after B1 is done)
**Priority:** P0 — this is the primary deliverable
**Acceptance:** Test passes 3/3 runs with no TODOs remaining; all 14 steps execute against real UI

---

#### C2. Add `patients.spec.ts` API Contract Test
**File to create:** `src/tests/api/patients.spec.ts`
**Missing pieces:**
- `PatientService.create()` with `PatientFactory.createRandom()` payload
- Assert response status 201 and `id > 0`
- Assert response matches `PatientSchema` (Zod parse)

**Dependencies:** `PatientFactory` ✅, `PatientService` ✅, `PatientSchema` ✅
**Effort:** 1 h
**Priority:** P1 — completes API contract test coverage
**Acceptance:** Test hits real dev API, asserts 201 + valid `id`

---

#### C3. Add `visits.spec.ts` API Contract Test
**File to create:** `src/tests/api/visits.spec.ts`
**Missing pieces:**
- Create prerequisite shift + patient via API
- `VisitService.create()` with real `patientId` + `doctorId`
- Assert 201 + `id > 0` + `status === 'PLANNED'`

**Dependencies:** `PatientService` ✅, `ScheduleService` ✅, `VisitService` ✅
**Effort:** 1.5 h
**Priority:** P1
**Acceptance:** Test creates a visit and reads back the visit object from the API

---

### CATEGORY D: Configuration & Auth Gaps — 0/4 ❌

---

#### D1. `staging.config.ts`
**File to create:** `src/config/staging.config.ts`
**Missing pieces:**
- Mirror of `dev.config.ts` reading from `process.env` with staging defaults
- Referenced by `env-loader.ts` when `TEST_ENV=staging`

**Dependencies:** `config.interface.ts` ✅, `env-loader.ts` ✅
**Effort:** 30 min (copy-paste + adjust base URLs)
**Priority:** P2 — needed for multi-environment strategy
**Acceptance:** `TEST_ENV=staging npx playwright test` resolves staging URL without error

---

#### D2. `npm run debug:config` Script
**File to create:** `src/utils/config-debugger.ts` + `package.json` script entry
**Missing pieces:**
- Standalone ts-node script that calls `getConfig()`, prints resolved + redacted output to stdout
- Add `"debug:config": "ts-node src/utils/config-debugger.ts"` to `package.json` scripts

**Sample output:**
```
✅ Config Resolved (env: dev)
  baseUrl:    http://crm.example.com
  apiUrl:     http://crm.example.com/api
  credentials.admin.user: admin@clinic.ru
  credentials.admin.pass: *** (masked)
  features.captchaEnabled: false
  features.smsAutoFill: true
  timeouts.action: 5000
  timeouts.navigation: 10000
```

**Dependencies:** `getConfig()` ✅, `logger.ts` ✅
**Effort:** 1 h
**Priority:** P2
**Acceptance:** `npm run debug:config` prints masked config; `pass`/`token`/`secret` fields show `***`

---

#### D3. Session Cookie Validation in `auth.setup.ts`
**File:** `src/tests/auth.setup.ts`
**Missing pieces:**
- After `storageState` is saved, parse `admin.json` and assert at least one cookie with `name` matching `JSESSIONID` or `connect.sid` exists
- If no cookie found → throw descriptive error before any test runs

**Dependencies:** `auth.setup.ts` ✅
**Effort:** 1 h
**Priority:** P2 — prevents silent auth failures in CI
**Acceptance:** If login produces no session cookie, setup exits with a clear message, not a timeout 30 tests later

---

#### D4. `scripts/verify-auth.ts`
**File to create:** `scripts/verify-auth.ts`
**Logic per spec:**
1. Check `playwright/.auth/admin.json` exists
2. Parse JSON → extract cookie `expires` timestamp
3. If `expires - now < 10 min` → exit code 1 (stale)
4. Otherwise → exit code 0 (fresh)
5. Can be used as CI `before_script` gate

**Dependencies:** `playwright/.auth/admin.json` (runtime), `admin.json` format
**Effort:** 1.5 h
**Priority:** P3
**Acceptance:** Script returns exit code 1 on stale/missing auth, exit code 0 on fresh session

---

### CATEGORY E: API Correctness Gaps — 0/2 ❌

---

#### E1. Visit Service — Return Constructed URL
**File:** `src/lib/api/services/visit.service.ts`
**Current:** `create()` returns `VisitResponse` object (id, patientId, etc.)
**Spec requires:** Also return `visitUrl = config.baseUrl + "/visits/" + visit.id`
**Missing pieces:**
- Add `visitUrl: string` to `VisitResponse` (or return `{ visit: VisitResponse, visitUrl: string }`)
- Construct URL using `getConfig().baseUrl`

**Dependencies:** `visit.service.ts` ✅, `getConfig()` ✅
**Effort:** 30 min
**Priority:** P2 — improves test code clarity; `complete-visit-flow.spec.ts` currently navigates manually
**Acceptance:** `const { visitUrl } = await visitService.create(payload)` returns navigable URL string

---

#### E2. Schedule Service — `dateTo > dateFrom` Validation
**File:** `src/lib/api/services/schedule.service.ts`
**Current:** `createShift()` sends payload without date order validation
**Spec requires:** Guard `if (dateTo <= dateFrom) throw new Error(...)`
**Missing pieces:**
- Add validation before POST request
- Use ISO string comparison (both are already ISO format)

**Dependencies:** `schedule.service.ts` ✅
**Effort:** 30 min
**Priority:** P3 — defensive check; unlikely to be hit with `ShiftFactory` but required by spec
**Acceptance:** `createShift({ dateFrom: T, dateTo: T-1h })` throws before hitting the API

---

### CATEGORY F: Observability Gap — 0/1 ❌

---

#### F1. Logger — Allure Attachment for `ERROR`/`WARN`
**File:** `src/utils/logger.ts`
**Current:** Logger outputs to stdout (JSON/colorized). No Allure integration.
**Missing pieces:**
- In `error()` and `warn()` methods, call `allure.attachment('log', text, 'text/plain')` (requires `allure-playwright` API)
- Only attach when running inside a test context (check `allure` availability)

**Dependencies:** `logger.ts` ✅, `allure-playwright` ✅ (already installed)
**Effort:** 1.5 h
**Priority:** P3 — improves failure debugging in CI; not blocking any test execution
**Acceptance:** Failed test Allure report shows `ERROR` log entries as text attachments

---

### CATEGORY G: CI/CD Gap — 0/1 ❌

---

#### G1. `.gitlab-ci.yml` with Sharding
**File to create:** `.gitlab-ci.yml`
**Missing pieces:**
- `setup` job: run `--project=setup` to generate `admin.json`; cache as artifact
- `test_e2e` job: parallel matrix `SHARD_INDEX: [1,2,3,4]`, `TOTAL_SHARDS: 4`
- Script: `npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL`
- Artifacts: traces + screenshots on failure (7-day retention), Allure results (30-day retention)
- `report` job: merge shard Allure results into single report

```yaml
# Skeleton:
test_e2e:
  image: mcr.microsoft.com/playwright:v1.58.1-jammy
  parallel:
    matrix:
      - SHARD_INDEX: [1, 2, 3, 4]
        TOTAL_SHARDS: 4
  script:
    - npm ci
    - npx playwright test --shard=$SHARD_INDEX/$TOTAL_SHARDS
  artifacts:
    paths: [allure-results/, test-results/]
    expire_in: 7 days
    when: on_failure
```

**Dependencies:** `Dockerfile` ✅, `playwright.config.ts` ✅
**Effort:** 2–3 h
**Priority:** P1 — required to meet the `T_total ≤ 15 min` SLA
**Acceptance:** Pipeline runs 4 parallel jobs; Allure report merges all shard results

---

### CATEGORY H: Verification Tooling — 0/3 ❌

---

#### H1. Contract Verifier CLI
**File to create:** `scripts/contract-verifier.ts`
**Logic:**
1. Authenticate (reuse `admin.json`)
2. For each service: make a minimal GET to list endpoint, parse first result, run `schema.safeParse()`
3. Print pass/fail per schema
4. Exit code 0 (all valid) or 1 (any mismatch)

**Dependencies:** All Zod schemas ✅, `BaseService` ✅
**Effort:** 2–3 h
**Priority:** P3
**Acceptance:** `npm run contract:verify` exits 0 on healthy API; exits 1 if backend changes a field type

---

#### H2. Component Workbench
**File:** Add project to `playwright.config.ts`
**What it is:** A separate Playwright project that skips `globalSetup`, uses `page.route` to mock all backend calls, and allows testing UI components without real data.
**Primarily useful for:** Iterating on `DentalChart` without needing a real patient in the DB.

**Dependencies:** A1–A5 (organisms must exist first)
**Effort:** 1.5 h
**Priority:** P4 (implement after A2 `DentalChart` is done)
**Acceptance:** `npx playwright test --project=workbench` runs dental chart test with mocked API response

---

#### H3. Data Setup Debugger
**File to create:** `scripts/data-setup-debugger.ts`
**Logic:** Standalone Node.js script that runs the fixture setup sequence (create shift → patient → visit) and logs every payload + API response. Helps distinguish "API data creation failed" from "UI interaction failed."

**Dependencies:** All API services ✅, `PatientFactory` ✅
**Effort:** 1.5–2 h
**Priority:** P4
**Acceptance:** `npm run debug:data-setup` prints step-by-step payloads and `201` responses to stdout

---

## Sprint Roadmap

### Sprint 1 — Unblock Core E2E (Est. 20–25 h)
**Goal:** Implement all missing UI organisms, compose `VisitDetailsPage`, fix `complete-visit-flow.spec.ts` Steps 7–14.

**Track A — Organisms (can be done in parallel):**
| Task | File | Effort |
|------|------|--------|
| A1: VisitStatus component | `src/pages/components/visit-status.component.ts` | 2–3 h |
| A3: TreatmentPlan component | `src/pages/components/treatment-plan.component.ts` | 3–4 h |
| A4: MedicalDiary component | `src/pages/components/medical-diary.component.ts` | 2–3 h |
| A5: Questionnaire component | `src/pages/components/questionnaire.component.ts` | 2–3 h |
| A2: DentalChart widget | `src/pages/components/dental-chart/dental-chart.widget.ts` | 5–8 h |

**Track B — Composition (after Track A):**
| Task | File | Effort |
|------|------|--------|
| B1: VisitDetailsPage | `src/pages/crm/visit-details.page.ts` | 2–3 h |
| C1: Fix complete-visit-flow.spec.ts | (existing file) | 3–4 h |

**Sprint 1 Completion Criteria:**
- [ ] `complete-visit-flow.spec.ts` passes 3/3 runs with no TODOs
- [ ] No hardcoded patient data — all from `PatientFactory.createRandom()`
- [ ] All 14 steps execute; final assertion on visit status = 'Завершен'
- [ ] `VisitDetailsPage` created at correct spec path

---

### Sprint 2 — CI/CD + Config + API Tests (Est. 8–10 h)
**Goal:** Unblock production deployment and complete API coverage.

| Task | File | Effort | Priority |
|------|------|--------|----------|
| G1: `.gitlab-ci.yml` | `.gitlab-ci.yml` | 2–3 h | P1 |
| C2: `patients.spec.ts` | `src/tests/api/patients.spec.ts` | 1 h | P1 |
| C3: `visits.spec.ts` | `src/tests/api/visits.spec.ts` | 1.5 h | P1 |
| D1: `staging.config.ts` | `src/config/staging.config.ts` | 0.5 h | P2 |
| D2: `debug:config` script | `src/utils/config-debugger.ts` | 1 h | P2 |
| E1: Visit URL return | `src/lib/api/services/visit.service.ts` | 0.5 h | P2 |
| D3: Session cookie validation | `src/tests/auth.setup.ts` | 1 h | P2 |
| B2: DashboardPage | `src/pages/crm/dashboard.page.ts` | 1 h | P2 |

**Sprint 2 Completion Criteria:**
- [ ] CI pipeline triggers on push, runs 4 parallel shards
- [ ] All API contract tests pass (`patients`, `visits`, `schedule`, `branch`, `employee`, `glossary`)
- [ ] `TEST_ENV=staging` resolves staging config without error
- [ ] `npm run debug:config` prints redacted config

---

### Sprint 3 — Tooling + Polish (Est. 8–10 h)
**Goal:** Verification tooling, defensive fixes, minor component additions.

| Task | File | Effort | Priority |
|------|------|--------|----------|
| H1: Contract Verifier CLI | `scripts/contract-verifier.ts` | 2–3 h | P3 |
| D4: `verify-auth.ts` | `scripts/verify-auth.ts` | 1.5 h | P3 |
| F1: Logger Allure attachment | `src/utils/logger.ts` | 1.5 h | P3 |
| E2: Schedule date validation | `src/lib/api/services/schedule.service.ts` | 0.5 h | P3 |
| B3: PatientCardPage | `src/pages/crm/patient-card.page.ts` | 2 h | P4 |
| H2: Component Workbench | `playwright.config.ts` | 1.5 h | P4 |
| H3: Data Setup Debugger | `scripts/data-setup-debugger.ts` | 1.5 h | P4 |

**Sprint 3 Completion Criteria:**
- [ ] `npm run contract:verify` exits 0 on healthy dev API
- [ ] Failed test reports in Allure show ERROR log attachments
- [ ] `scripts/verify-auth.ts` integrated into CI `before_script`

---

## Effort Summary

| Category | Tasks | Estimated Hours | Completion Impact |
|----------|-------|-----------------|-------------------|
| UI Organisms (A1–A5) | 5 items | 14–21 h | +28 features → 76% |
| CRM Pages (B1–B3) | 3 items | 5–7 h | +3 features → 80% |
| E2E Fixes (C1–C3) | 3 items | 5.5–6.5 h | +3 features → 84% |
| Config/Auth (D1–D4) | 4 items | 4 h | +4 features → 90% |
| API Fixes (E1–E2) | 2 items | 1 h | +2 features → 93% |
| Observability (F1) | 1 item | 1.5 h | +1 feature → 94% |
| CI/CD (G1) | 1 item | 2–3 h | +1 feature → 96% |
| Tooling (H1–H3) | 3 items | 5–7 h | +3 features → 100% |
| **TOTAL** | **22 items** | **38–51 h** | **+30 features** |

---

## Validation Checklist (Before Production Go-Live)

### E2E Flow
- [ ] `npx playwright test workflows/complete-visit-flow.spec.ts` passes 3/3 runs
- [ ] No `// TODO` comments remain in `complete-visit-flow.spec.ts`
- [ ] All patient data generated by `PatientFactory.createRandom()` — no hardcoded SNILS/names
- [ ] Visit navigation uses `visitUrl` from `VisitService.create()` response

### API Layer
- [ ] `npx playwright test src/tests/api/` — all 6 spec files pass (patients, visits, schedule, branch, employee, glossary)
- [ ] `npm run contract:verify` exits 0 against dev environment

### CI/CD
- [ ] `docker build -t dental-crm-tests .` succeeds locally
- [ ] `.gitlab-ci.yml` triggers 4 parallel jobs on push
- [ ] Allure report generated with results from all shards merged
- [ ] Artifact retention: traces/screenshots expire in 7 days, Allure in 30 days

### Configuration
- [ ] `npm run debug:config` prints redacted config (no plaintext passwords)
- [ ] `TEST_ENV=staging npx playwright test --project=setup` runs without error
- [ ] `npx ts-node scripts/verify-auth.ts` exits 0 on fresh session, 1 on expired

### Reliability
- [ ] Full suite passes 3/3 runs (zero flakiness baseline)
- [ ] Total suite runtime ≤ 15 min on 4-shard CI (formula: `Σ(t_i) / 4 + C_setup ≤ 15 min`)

---

## Acceptance Criteria per Milestone

### Milestone 3 (Target Scenario) — Currently 37%
**Done when:**
- `VisitDetailsPage` exists at `src/pages/crm/visit-details.page.ts` with all 5 components composed
- `complete-visit-flow.spec.ts` executes all 14 steps with real assertions (not TODOs)
- All test data comes from factories, no hardcoded values

### Milestone 4 (CI/CD) — Currently 54%
**Done when:**
- `.gitlab-ci.yml` exists and pipeline passes on main branch
- 4-shard execution completes in ≤ 15 minutes
- All 6 API contract spec files pass

### Full Completion — Currently 70.3%
**Done when:**
- All 74 spec features are ✅
- Verification tooling scripts are executable
- Staging environment is reachable via `TEST_ENV=staging`

---

## Cross-References

- **Architecture spec:** [Project.md](Project.md)
- **Current status:** [implementation_status.md](implementation_status.md)
- **Memory:** SNILS Modulo 101 formula → `src/utils/snils.utils.ts`; Backoff `100ms × 2^k` → `src/utils/retry.utils.ts`
- **Locator conventions:** `getByLabel(/RU|EN/i)`, `.FieldLayoutView` dropdowns — see MEMORY.md
- **DentalChart selectors:** consult `spikes/probe-dental-chart-dom.ts` output before implementing A2

---

**Next Review Date:** 2026-03-25 (after Sprint 1)
