# Dental CRM Test Suite — Implementation Status

**Last Updated:** 2026-03-18
**Report Type:** Comprehensive Gap Analysis (Project.md Features vs. Actual Codebase)
**Scan Scope:** All TypeScript/JavaScript files, config files, and infrastructure files

> ⚠️ **Previous report (2026-03-05) contained inaccuracies** — it claimed ✅ for 17 Phase 5 UI components using wrong file paths. This report is based on a verified file-by-file codebase scan.

---

## Executive Summary

| Metric | Count |
|--------|-------|
| ✅ Features Done | 52 |
| 🚧 In Progress | 1 |
| ❌ Missing | 21 |
| **Overall Completion** | **70.3% (52/74)** |

**Critical Gap**: Phase 5 complex UI organisms (Dental Chart, Treatment Plan, Visit Status, etc.) and the Visit Details Page composition are **0% implemented**. These are required to complete the core `complete-visit-flow.spec.ts` workflow.

---

## Milestone 1: Proof of Concept & Risk Mitigation

### Phase 1: Project Initialization — 5/5 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| NPM init + production/dev dependencies | ✅ Done | [package.json](package.json) — @playwright/test@1.58.1, @faker-js/faker@10.2.0, zod@4.3.6 |
| TypeScript strict mode | ✅ Done | [tsconfig.json](tsconfig.json) — `"strict": true`, `baseUrl: "."`, `@/*` path alias |
| Directory hierarchy (`src/config`, `lib/api`, `pages`, `tests`, etc.) | ✅ Done | [src/](src/) — all spec-required subdirectories present |
| `.gitignore` with secrets exclusion | ✅ Done | [.gitignore](.gitignore) — node_modules, .env, playwright/.auth, test-results excluded |
| Sanity test (`src/tests/sanity.spec.ts`) | ✅ Done | [src/tests/e2e/smoke/sanity.spec.ts](src/tests/e2e/smoke/sanity.spec.ts) |

### Phase 2: Critical Spikes — 4/4 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| Auth handshake spike (cookies vs tokens) | ✅ Done | [spikes/probe-auth-handshake.ts](spikes/probe-auth-handshake.ts) |
| Dental chart DOM structure spike | ✅ Done | [spikes/probe-dental-chart-dom.ts](spikes/probe-dental-chart-dom.ts) |
| Data format validation spike (Faker + API) | ✅ Done | [spikes/probe-data-formats.ts](spikes/probe-data-formats.ts) |
| Docker connectivity spike | ✅ Done | [spikes/probe-docker.sh](spikes/probe-docker.sh) |

---

## Milestone 2: Framework Core & Data Layer

### Phase 3: Configuration & Auth Infrastructure

#### Config Sub-Phase — 5/7 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| `AppConfig` interface with all required fields | ✅ Done | [src/config/config.interface.ts](src/config/config.interface.ts) — baseUrl, credentials, features, timeouts |
| Zod schema + runtime validation (fail with exit code 1) | ✅ Done | [src/config/config.schema.ts](src/config/config.schema.ts) + [src/config/env-loader.ts](src/config/env-loader.ts) |
| `TEST_ENV` routing (dev/staging switch) | ✅ Done | [src/config/env-loader.ts](src/config/env-loader.ts) — `getConfig()` with environment branching |
| Dev environment config | ✅ Done | [src/config/dev.config.ts](src/config/dev.config.ts) — populated from `process.env` with fallbacks |
| Secret masking (pass/token/secret keys) | ✅ Done | [src/utils/logger.ts](src/utils/logger.ts) — auto-redaction in all log output |
| **Staging environment config** | ❌ Missing | `src/config/staging.config.ts` — file does not exist |
| **`npm run debug:config` script** | ❌ Missing | No `debug:config` entry in `package.json` scripts |

#### Auth Sub-Phase — 6/6 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| `LoginPage` (navigate, login, CAPTCHA conditional, form submit) | ✅ Done | [src/pages/auth/login.page.ts](src/pages/auth/login.page.ts) — `performLogin()` handles full flow |
| `SmsPage` (enterSmsCode, submit, getValue) | ✅ Done | [src/pages/auth/sms.page.ts](src/pages/auth/sms.page.ts) |
| `RolePage` (selectRole, submit) | ✅ Done | [src/pages/auth/role.page.ts](src/pages/auth/role.page.ts) |
| `BranchPage` (selectBranch, search, submit) | ✅ Done | [src/pages/auth/branch.page.ts](src/pages/auth/branch.page.ts) |
| Global auth setup → saves to `playwright/.auth/admin.json` | ✅ Done | [src/tests/auth.setup.ts](src/tests/auth.setup.ts) |
| `playwright.config.ts` with `setup` + `chromium` projects | ✅ Done | [playwright.config.ts](playwright.config.ts) — `dependsOn: ['setup']`, `storageState` injected |

#### Auth Verification Tools — 0/2 ❌

| Feature | Status | Proof |
|---------|--------|-------|
| **Session cookie existence validation before save** | ❌ Missing | `auth.setup.ts` saves state without asserting cookie presence |
| **`scripts/verify-auth.ts`** (JWT expiry check) | ❌ Missing | `scripts/` directory does not exist |

### Phase 4: API Layer & Data Services — 15/17 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| API Request Engine wrapping `APIRequestContext` | ✅ Done | [src/lib/api/services/base.service.ts](src/lib/api/services/base.service.ts) — `get<T>()`, `post<T,D>()` |
| `Content-Type: application/json` header injection | ✅ Done | [src/lib/api/services/base.service.ts](src/lib/api/services/base.service.ts) — `getHeaders()` |
| `ClientError` for 4xx responses | ✅ Done | [src/lib/api/services/base.service.ts](src/lib/api/services/base.service.ts) — `handleResponseError()` |
| `ServerError` for 5xx responses | ✅ Done | [src/lib/api/services/base.service.ts](src/lib/api/services/base.service.ts) — `handleResponseError()` |
| Retry 502/503/504 with exponential backoff (`100ms × 2^k`) | ✅ Done | [src/utils/retry.utils.ts](src/utils/retry.utils.ts) — `withRetry<T>()` |
| API endpoints constants | ✅ Done | [src/lib/api/api-endpoints.ts](src/lib/api/api-endpoints.ts) — `API_ENDPOINTS` enum + `buildEndpointUrl()` |
| Glossary service (`getSpecializationId`, `getBranchId`, `getJobPositionId`) | ✅ Done | [src/lib/api/services/glossary.service.ts](src/lib/api/services/glossary.service.ts) — with in-memory caching |
| `PatientFactory` with Builder pattern, SNILS, OMS 16-digit, seed | ✅ Done | [src/lib/factories/patient.factory.ts](src/lib/factories/patient.factory.ts) |
| Patient Zod schema (`PatientPayload`) | ✅ Done | [src/lib/entities/patient.types.ts](src/lib/entities/patient.types.ts) |
| `PatientService.create(payload)` → POST `/api/v1/patients` → returns `id` | ✅ Done | [src/lib/api/services/patients.service.ts](src/lib/api/services/patients.service.ts) |
| SNILS Modulo 101 checksum algorithm | ✅ Done | [src/utils/snils.utils.ts](src/utils/snils.utils.ts) — `calculateSnilsChecksum()` |
| Shift Zod schema (`ShiftDTO`) | ✅ Done | [src/lib/entities/schedule.types.ts](src/lib/entities/schedule.types.ts) |
| `ScheduleService.createShift(payload)` → POST `/api/v1/schedule/shift` | ✅ Done | [src/lib/api/services/schedule.service.ts](src/lib/api/services/schedule.service.ts) |
| Visit Zod schema (`VisitDTO`) | ✅ Done | [src/lib/entities/visit.types.ts](src/lib/entities/visit.types.ts) |
| `VisitService.create(payload)` → POST `/api/v1/health/visits` | ✅ Done | [src/lib/api/services/visit.service.ts](src/lib/api/services/visit.service.ts) |
| **`dateTo > dateFrom` validation in Schedule service** | ❌ Missing | `schedule.service.ts` has no date comparison guard |
| **Visit service returns constructed URL** (`BaseURL + "/visits/" + VisitID`) | ❌ Missing | `visit.service.ts` returns `VisitResponse` object — URL must be built manually in test |

### Observability Engine (Logger) — 3/4 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| JSON Lines format when `process.env.CI` is set | ✅ Done | [src/utils/logger.ts](src/utils/logger.ts) |
| Colorized text format for local execution | ✅ Done | [src/utils/logger.ts](src/utils/logger.ts) |
| Auto-inject test name + step name into every log entry | ✅ Done | [src/utils/logger.ts](src/utils/logger.ts) |
| **Allure attachment for ERROR/WARN logs** | ❌ Missing | `logger.ts` has no `allure.attachment()` calls |

---

## Milestone 3: Target Scenario Implementation

### Phase 5: UI Components & Pages

#### Design System Atoms — 2/2 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| `InputField` atom (`fill()`, `type()` with 50ms delay) | ✅ Done | [src/pages/components/atoms/input-field.atom.ts](src/pages/components/atoms/input-field.atom.ts) |
| `SelectDropdown` atom (visible text selection) | ✅ Done | [src/pages/components/atoms/select-dropdown.atom.ts](src/pages/components/atoms/select-dropdown.atom.ts) |

#### Business Widgets (Organisms) — 0/2 ❌

| Feature | Status | Proof |
|---------|--------|-------|
| **`DentalChart` widget** (`selectTooth`, `markCondition`, `saveChart`, `page.route` visual isolation) | ❌ Missing | `src/pages/components/dental-chart/dental-chart.widget.ts` — does not exist |
| **`TreatmentPlan` component** (`addService`, `transferToVisit`) | ❌ Missing | `src/pages/components/treatment-plan.component.ts` — does not exist |

#### CRM Page Objects — 0/3 (1 partial) ❌

| Feature | Status | Proof |
|---------|--------|-------|
| **`VisitDetailsPage`** (`dentalChart` + `treatmentPlan` + `diary` composition, `changeStatus(to)`) | 🚧 In Progress | `src/pages/crm/visit-details.page.ts` — does not exist. [`src/pages/visit.page.ts`](src/pages/visit.page.ts) exists with `clickTooth()` + `clickStateButton()` but no component composition |
| **`DashboardPage`** (`isVisible`, `navigate`) | ❌ Missing | `src/pages/crm/dashboard.page.ts` — does not exist |
| **`PatientCardPage`** (`getPatientInfo`, `editPatient`) | ❌ Missing | `src/pages/crm/patient-card.page.ts` — does not exist |

#### Supporting Components — 0/4 ❌

| Feature | Status | Proof |
|---------|--------|-------|
| **`MedicalDiary` component** (`addNote`, `getNotes`) | ❌ Missing | `src/pages/components/medical-diary.component.ts` — does not exist |
| **`Questionnaire` component** (`fillQuestion`, `submit`) | ❌ Missing | `src/pages/components/questionnaire.component.ts` — does not exist |
| **`VisitStatus` component** (`changeStatus`, `getStatus`) | ❌ Missing | `src/pages/components/visit-status.component.ts` — does not exist |
| **`Sidebar` component** (`navigateTo`, `isMenuVisible`) | ❌ Missing | `src/pages/components/sidebar.component.ts` — does not exist |

#### Extra (Implemented beyond spec) ✅

| Feature | Status | Proof |
|---------|--------|-------|
| `CreateVisitModal` page object (full modal lifecycle) | ✅ Bonus | [src/pages/modals/create-visit-modal.page.ts](src/pages/modals/create-visit-modal.page.ts) |
| `BranchService` + `EmployeeService` (API) | ✅ Bonus | [src/lib/api/services/branch.service.ts](src/lib/api/services/branch.service.ts), [src/lib/api/services/employee.service.ts](src/lib/api/services/employee.service.ts) |
| `ShiftFactory` + `VisitFormFactory` | ✅ Bonus | [src/lib/factories/shift.factory.ts](src/lib/factories/shift.factory.ts), [src/lib/factories/visit-form.factory.ts](src/lib/factories/visit-form.factory.ts) |

### Phase 6: E2E Scenario Assembly — 5/7 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| Custom fixtures DI (`patientService`, `scheduleService`, `visitService`, `visitPage`, `createVisitModal`) | ✅ Done | [src/lib/fixtures/index.ts](src/lib/fixtures/index.ts) |
| Complete visit flow E2E spec | ✅ Done | [src/tests/e2e/workflows/complete-visit-flow.spec.ts](src/tests/e2e/workflows/complete-visit-flow.spec.ts) — 14-step journey (API setup → state transitions) |
| Create visit modal smoke test | ✅ Done | [src/tests/e2e/smoke/create-visit-modal.spec.ts](src/tests/e2e/smoke/create-visit-modal.spec.ts) |
| Auth workflow integration test | ✅ Done | [src/tests/e2e/smoke/auth-workflow.spec.ts](src/tests/e2e/smoke/auth-workflow.spec.ts) |
| API contract tests (glossary, shifts, branch, employee) | ✅ Done | [src/tests/api/](src/tests/api/) — `glossary.spec.ts`, `create-shift.spec.ts`, `branch.spec.ts`, `employee.spec.ts` |
| **Patient service integration test** (`201` + valid `id`) | ❌ Missing | `src/tests/api/patients.spec.ts` — does not exist |
| **Visit service integration test** | ❌ Missing | `src/tests/api/visits.spec.ts` — does not exist |

---

## Milestone 4: CI/CD & Scalability

### Phase 7: Infrastructure Finalization — 7/9 ✅

| Feature | Status | Proof |
|---------|--------|-------|
| `Dockerfile` with Playwright image | ✅ Done | [Dockerfile](Dockerfile) — base: `mcr.microsoft.com/playwright:v1.58.1-jammy` |
| Russian locale (`LANG=ru_RU.UTF-8`) in container | ✅ Done | [Dockerfile](Dockerfile) — `ENV LANG=ru_RU.UTF-8` |
| Allure reporter in `playwright.config.ts` | ✅ Done | [playwright.config.ts](playwright.config.ts) — `['allure-playwright', { outputFolder: 'allure-results' }]` |
| Logger with CI/local dual transport | ✅ Done | [src/utils/logger.ts](src/utils/logger.ts) |
| `.env.example` template | ✅ Done | [.env.example](.env.example) — BASE_URL, credentials, SMS_CODE, COMPANY_UID |
| Barrel exports (services, entities, config) | ✅ Done | [src/lib/api/services/index.ts](src/lib/api/services/index.ts), [src/lib/entities/index.ts](src/lib/entities/index.ts) |
| `README.md` | ✅ Done | [README.md](README.md) — allure:serve + allure:generate commands |
| **`.gitlab-ci.yml` with parallel sharding** (`SHARD_INDEX/TOTAL_SHARDS`) | ❌ Missing | File does not exist in repository root |
| **Staging config** for `TEST_ENV=staging` | ❌ Missing | `src/config/staging.config.ts` — does not exist |

### Verification Tooling — 0/3 ❌

| Feature | Status | Proof |
|---------|--------|-------|
| **Contract Verifier CLI** (iterate Zod schemas → hit dev API → exit 0/1) | ❌ Missing | No script or file found |
| **Component Workbench** (isolated Playwright project with `page.route` mocking) | ❌ Missing | No separate `workbench` project in `playwright.config.ts` |
| **Data Setup Debugger** (standalone Node.js script running fixture logic) | ❌ Missing | No script found in `scripts/` (directory doesn't exist) |

---

## Phase Completion Summary

| Phase | Name | Done | Missing | In Progress | Completion |
|-------|------|------|---------|-------------|------------|
| 1 | Project Initialization | 5 | 0 | 0 | **100%** |
| 2 | Critical Spikes | 4 | 0 | 0 | **100%** |
| 3a | Configuration | 5 | 2 | 0 | **71%** |
| 3b | Auth Infrastructure | 6 | 2 | 0 | **75%** |
| 4 | API Layer & Services | 15 | 2 | 0 | **88%** |
| 4b | Observability (Logger) | 3 | 1 | 0 | **75%** |
| 5a | Design System Atoms | 2 | 0 | 0 | **100%** |
| 5b | Business Widgets | 0 | 2 | 0 | **0%** ⚠️ |
| 5c | CRM Page Objects | 0 | 2 | 1 | **0%** ⚠️ |
| 5d | Supporting Components | 0 | 4 | 0 | **0%** ⚠️ |
| 6 | E2E Scenario Assembly | 5 | 2 | 0 | **71%** |
| 7 | Infrastructure | 7 | 2 | 0 | **78%** |
| 7b | Verification Tooling | 0 | 3 | 0 | **0%** |
| **TOTAL** | | **52** | **21** | **1** | **70.3%** |

---

## Milestone Completion Status

| Milestone | Status | Completion |
|-----------|--------|------------|
| 1: Proof of Concept | ✅ Done | 100% |
| 2: Framework Core & Data Layer | 🚧 In Progress | 84% |
| 3: Target Scenario Implementation | ❌ Blocked | 37% |
| 4: CI/CD & Scalability | ❌ Blocked | 54% |

---

## Blocking Issues & Critical Path

### BLOCKER 1 — Complex UI Components Missing (Phase 5)
The following components are required by `complete-visit-flow.spec.ts` but do not exist:
- `DentalChart` widget → `selectTooth()`, `markCondition()`
- `TreatmentPlan` component → `addService()`, `transferToVisit()`
- `MedicalDiary` component
- `Questionnaire` component
- `VisitStatus` component
- `VisitDetailsPage` composition

**Impact**: The core E2E workflow (`complete-visit-flow.spec.ts`) cannot complete the dental chart and treatment plan steps without these.

### BLOCKER 2 — GitLab CI Pipeline Missing
`.gitlab-ci.yml` does not exist. The sharding formula and parallel matrix are unimplemented.
**Impact**: Scalability goal (`T_total ≤ 15 min`) cannot be validated.

---

## Recommended Next Steps (Priority Order)

1. **Implement `VisitDetailsPage` composition** with `VisitStatus`, `DentalChart`, `TreatmentPlan`, `MedicalDiary` sub-components — unblocks the core E2E flow
2. **Add `.gitlab-ci.yml`** with 4-shard parallel matrix — unblocks CI/CD milestone
3. **Add `staging.config.ts`** + `debug:config` npm script — completes config layer
4. **Add `VisitService` URL construction** (return `BaseURL + "/visits/" + VisitID`) — matches spec
5. **Add Allure attachment in logger** for `ERROR`/`WARN` severity
6. **Add `patients.spec.ts` + `visits.spec.ts`** API contract tests
7. **Add `scripts/verify-auth.ts`** with JWT expiry check

---

## File Location Reference (Verified Paths)

### Core Framework
- [src/config/env-loader.ts](src/config/env-loader.ts) — Config routing + Zod validation
- [src/lib/api/services/base.service.ts](src/lib/api/services/base.service.ts) — API engine + error handling
- [src/utils/logger.ts](src/utils/logger.ts) — Multi-transport logger
- [src/utils/retry.utils.ts](src/utils/retry.utils.ts) — Exponential backoff
- [src/utils/snils.utils.ts](src/utils/snils.utils.ts) — SNILS Modulo 101

### Data Layer
- [src/lib/factories/patient.factory.ts](src/lib/factories/patient.factory.ts) — `PatientBuilder` + `PatientFactory`
- [src/lib/factories/shift.factory.ts](src/lib/factories/shift.factory.ts) — `ShiftFactory`
- [src/lib/factories/visit-form.factory.ts](src/lib/factories/visit-form.factory.ts) — `VisitFormFactory`
- [src/lib/fixtures/index.ts](src/lib/fixtures/index.ts) — All custom fixtures

### Tests
- [src/tests/e2e/workflows/complete-visit-flow.spec.ts](src/tests/e2e/workflows/complete-visit-flow.spec.ts) — Main E2E scenario
- [src/tests/e2e/smoke/create-visit-modal.spec.ts](src/tests/e2e/smoke/create-visit-modal.spec.ts) — Modal smoke test
- [src/tests/auth.setup.ts](src/tests/auth.setup.ts) — Global auth setup

### Missing (to be created)
- `src/pages/components/dental-chart/dental-chart.widget.ts`
- `src/pages/components/treatment-plan.component.ts`
- `src/pages/components/visit-status.component.ts`
- `src/pages/crm/visit-details.page.ts`
- `src/config/staging.config.ts`
- `.gitlab-ci.yml`

---

**End of Report**
