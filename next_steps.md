# Dental CRM Test Suite - Next Steps

**Last Updated:** February 19, 2026  
**Current Completion:** 53.8% (42/78 features fully implemented)  
**Report Basis:** Fresh gap analysis between [Project.md](Project.md) and [implementation_status.md](implementation_status.md)  
**Previous Progress:** 52.6% → 53.8% (added Task #9: BasePage abstract class)

---

## 🚀 Immediate Priorities (Next Sprint)

### 1. Config Runtime Validation (Zod Schema) ⭐ BLOCKING
**Description:** Add Zod schema validation to TestConfig. Currently only TypeScript interfaces exist, exposing risk of invalid config at runtime. Many features depend on validated config.

**Dependencies:** Zod already installed in package.json

**Technical Note:**  
- Create `src/config/config.schema.ts` with `ConfigSchema` Zod definition matching `TestConfig` interface
- Update `src/config/env-loader.ts` to validate config before returning: `ConfigSchema.parse(devConfig)`
- Throw detailed `ZodError` with field names if validation fails
- Test by running with incomplete `.env` — should fail with clear field errors

**Blockers:** None  
**Estimated Effort:** 1-2 hours
**Status:** ✅ Done — [src/config/config.schema.ts](src/config/config.schema.ts) + [env-loader.ts](src/config/env-loader.ts)

---

### 2. Logger Utility Component with Secret Masking ⭐ BLOCKING
**Description:** Implement observability layer critical for debugging and CI artifact analysis. Outputs JSON Lines in CI, colorized text locally. Project.md requirement: log operation must complete in < 5ms.

**Dependencies:** None

**Technical Note:**  
- Create `src/utils/logger.ts` with class `Logger`
- Methods: `info()`, `warn()`, `error()`, `debug()` with string interpolation support
- Detect `process.env.CI` to switch output format
- Auto-append `TEST_NAME` and `STEP_NAME` to every log entry (context injection)
- Implement secret masking regex: redact values for keys containing 'pass', 'token', 'secret'
- Example: `password: 'abc123'` → `password: '****'`
- Optional: integrate with Allure reporter to attach WARN/ERROR logs as text attachments

**Blockers:** None  
**Estimated Effort:** 3-4 hours
**Status:** ✅ Done — [src/utils/logger.ts](src/utils/logger.ts) with comprehensive unit tests [src/tests/unit/logger.spec.ts](src/tests/unit/logger.spec.ts)
**Implementation Details:**
- ✅ Dual output format: JSON Lines (CI) vs colorized text (local)
- ✅ Recursive secret masking for password, token, secret, apiKey, api_key, refreshToken
- ✅ Context injection: `Logger.setTestContext(testName, stepName)` auto-appends to all logs
- ✅ ANSI color codes for terminal output (respects NO_COLOR environment variable)
- ✅ Timestamp, log level, message, data serialization
- ✅ Performance: < 5ms per log operation (inline helpers, no async I/O)
- ✅ Error stream handling: errors → stderr, others → stdout
- ✅ Integration: BaseService updated with logging at all request/response boundaries

---

### 3. Allure Reporter Configuration
**Description:** Wire up Allure reporting in Playwright config. Package already in package.json but not configured in playwright.config.ts. Enables visibility into test failures via videos, traces, screenshots.

**Dependencies:** allure-playwright already installed

**Technical Note:**  
- Update `reporter` array in `playwright.config.ts` to include `['allure-reporter', { outputFolder: 'allure-results' }]`
- Keep `['html']` and `['list']` reporters as well
- Create `allure-results/` folder in .gitignore
- Optional: add `.github/workflows/publish-allure.yml` for Allure dashboard integration (defer to Phase 4)

**Blockers:** Task #2 (Logger) - optional but recommended for attaching logs to Allure  
**Estimated Effort:** 1 hour
**Status:** ✅ Done — [playwright.config.ts](playwright.config.ts) with allure-reporter config + [.gitignore](.gitignore) updated
**Implementation Details:**
- ✅ Allure reporter configured: `['allure-reporter', { outputFolder: 'allure-results', deletePreviousResults: false, inlineAttachments: true }]`
- ✅ HTML reporter: `['html', { open: 'never' }]`
- ✅ List reporter: `['list']`
- ✅ allure-results/ and allure-report/ added to .gitignore
- ✅ Setup and chromium projects configured with proper dependencies
- ✅ storageState persistence enabled for authenticated tests
- ✅ Artifact retention: video/trace/screenshot on failure (7 day CI retention policy)
- ✅ Integration with Logger component: INFO/WARN/ERROR logs auto-captured with secret masking
- ✅ Optional: `brew install allure` or `npm install -g allure-commandline` for local report viewing

---

### 4. Create Sanity Test
**Description:** Implement the missing sanity test to verify environment is correctly configured. Simple quick validation that Playwright can launch Chromium.

**Dependencies:** None

**Technical Note:**  
- Create `src/tests/sanity.spec.ts`
- Test code:
```typescript
import { test } from '@playwright/test';

test('Environment sanity check', async ({ page }) => {
  await page.goto('/'); // Uses baseURL from config
  console.log('Environment Ready ✅');
});
```
- Run: `npx playwright test src/tests/sanity.spec.ts`
- This validates: Playwright config is valid, baseURL is reachable, browser launches
- Verify: [src/tests/e2e/smoke/sanity.spec.ts](src/tests/e2e/smoke/sanity.spec.ts) exists and passes

**Blockers:**  None 
**Estimated Effort:** 30 mins
**Status:** ✅ Done — [src/tests/e2e/smoke/sanity.spec.ts](src/tests/e2e/smoke/sanity.spec.ts) passes

---

### 5. Staging Environment Config
**Description:** Implement staging configuration to validate multi-environment support. Currently env-loader.ts throws "not implemented" for staging.

**Dependencies:** Task #1 (Config validation) - should validate staging config too

**Technical Note:**  
- Create `src/config/staging.config.ts` with same shape as `dev.config.ts`
- Pull staging credentials from `.env.staging` or CI environment variables
- Update `src/config/env-loader.ts` switch statement to handle `TEST_ENV='staging'`
- Add `.env.staging.example` template file
- Test: `TEST_ENV=staging npx playwright test --project=setup` should authenticate against staging backend

**Blockers:** Requires staging environment backend (external dependency)  
**Estimated Effort:** 1-2 hours
**Status:** ✅ Done — [src/config/staging.config.ts](src/config/staging.config.ts) implemented

---

---

### 6. Execute Critical Spikes (Risk Mitigation)
**Description:** Run proof-of-concept spikes to validate architecture assumptions before committing to full Phase 5 UI implementation. Essential for de-risking the Dental Chart component.

**Dependencies:** Phase 1-4 complete (API setup layer works)

**Technical Note:**  
Execute these spike scripts in order:
- `spikes/probe-auth-handshake.ts` — Verify cookies saved in admin.json work for API calls (5 mins)
- `spikes/probe-dental-chart-dom.ts` — Inspect DOM of actual patient visit page, test different selector strategies (15 mins)
- `spikes/probe-data-formats.ts` — Validate that PatientFactory/ShiftFactory payloads pass backend validation (10 mins)
- `spikes/probe-docker.sh` — Test Docker image, verify Russian locale, network reachability (10 mins)

**Blockers:** None (optional but de-risks Phase 5)  
**Estimated Effort:** 30-45 mins total (can be parallelized)
**Status:** ❌ Not Started — **CRITICAL BEFORE Phase 5.1** (Dental Chart widget)

---

### 7. API Endpoints Constants (Code Cleanup)
**Description:** Centralize all API routes in a typed enum to prevent string duplication and enable IDE autocomplete.

**Dependencies:** None

**Technical Note:**  
- Create `src/lib/api/api-endpoints.ts`
- Structure:
```typescript
export const API_ENDPOINTS = {
  PATIENTS: {
    CREATE: '/api/v1/patients',
    GET_BY_ID: (id: number) => `/api/v1/patients/${id}`,
  },
  SCHEDULES: {
    CREATE_SHIFT: '/api/v1/schedule/shift',
  },
  VISITS: {
    CREATE: '/api/v1/health/visits',
  },
  GLOSSARY: {
    SPECIALIZATIONS: '/api/v1/glossary/specializations',
  },
  // ... other endpoints
} as const;
```
- Replace hardcoded strings in services: `'/api/v1/patients'` → `API_ENDPOINTS.PATIENTS.CREATE`

**Blockers:** None  
**Estimated Effort:** 1-1.5 hours
**Status:** ❌ Not Started

---

### 8. Create Barrel Exports (index.ts Files)
**Description:** Create barrel export files for cleaner imports across codebase. Convert verbose paths to concise namespace imports.

**Dependencies:** All modules exist (Phase 1-4 complete)

**Technical Note:**  
Create files:
- `src/lib/entities/index.ts` — re-export all type definitions
- `src/lib/api/services/index.ts` — re-export all service classes
- `src/lib/factories/index.ts` — re-export all factories
- `src/config/index.ts` — re-export config utilities

Benefit: `import { PatientService, VisitService } from '@/lib/api/services'` instead of verbose paths

**Blockers:** None  
**Estimated Effort:** 1 hour
**Status:** ❌ Not Started

---

---

## 📋 Critical Path (Phase 5: UI Layer & E2E) - UNBLOCKS DELIVERABLE

**Foundation:** Phase 1-4 complete (API layer 100%, Config 87%, Auth 87%)  
**Blocker:** All items in this section must complete to enable E2E testing  
**Timeline:** Weeks 3-4 (15-20 hours estimated)  
**Team:** Can be parallelized — assign 1-2 developers per component family

### Phase 5: UI Layer & Page Objects

#### 9. Base Page Object Class (Abstract Foundation)
Create abstract base class for all Page Objects to reduce duplication and enforce consistent patterns.

**File:** `src/pages/base.page.ts`  
**Key Methods:** `goto(path)`, `waitForNavigationComplete()`, assertion helpers, element visibility/text checks  
**Dependency:** None

**Estimated Effort:** 1-2 hours
**Status:** ✅ Done — [src/pages/base.page.ts](src/pages/base.page.ts)
**Implementation Details:**
- ✅ Abstract base class with constructor accepting Page and TestConfig
- ✅ Navigation: `goto(path)`, `goBack()`, `reload()` with networkidle waits
- ✅ Wait utilities: `waitForElement(locator, timeout)`, `waitForNavigationComplete()`
- ✅ Visibility checks: `isElementVisible()`, `assertElementVisible()`, `assertElementHidden()`
- ✅ Text assertions: `assertElementText()`, `assertElementContainsText()`, `getElementText()`
- ✅ Input assertions: `assertElementEnabled()`, `assertElementDisabled()`, `getInputValue()`
- ✅ URL assertions: `assertUrlContains(expectedPath)`
- ✅ Utilities: `takeScreenshot(filename)` for debugging
- ✅ Logger integration: all methods log with proper context

---

#### 10. Atom Components - InputField & SelectDropdown
Low-level, reusable UI form components.

**Files:** 
- `src/pages/components/atoms/input-field.atom.ts` 
- `src/pages/components/atoms/select-dropdown.atom.ts`
- `src/pages/components/atoms/index.ts` (export barrel)

**Key Behaviors:**
- InputField.fill(): wait for actionable → clear → fill
- InputField.type(): fill with 50ms delay between keystrokes (triggers JS event listeners)
- SelectDropdown.selectByLabel(): finds visible text in options and clicks

**Estimated Effort:** 2-3 hours
**Status:** ❌ Not Started — **REQUIRED BEFORE ORGANISMS**

---

#### 11. Complex Organisms: Dental Chart Widget (SVG/Canvas Tooth Visualization)
SVG/Canvas-based interactive tooth status visualization. **HIGH COMPLEXITY** - testing strategy must use `page.route` to mock backend responses for stability (per Project.md).

**File:** `src/pages/components/organisms/dental-chart/dental-chart.widget.ts`  
**Key Challenge:** Map all 32 teeth IDs to their SVG/DOM selectors → **TODO in Project.md**  
**Testing Strategy:** Intercept `/api/v1/patient/*/dental` response; inject mock `{ teeth: [{ id: 18, status: 'caries' }] }` → assert UI reflects state

**Key Methods:**
- `selectTooth(toothId: number)` → clicks tooth element
- `getToothStatus(toothId: number)` → returns CSS class or data attribute
- `applyDiagnosis(toothId, condition)` → context menu interaction

**Dependency:** Task #10 (InputField/SelectDropdown atoms)  
**Estimated Effort:** 5-8 hours
**Status:** ❌ Not Started — **CRITICAL COMPLEXITY; RUN SPIKE #36 FIRST**

---

#### 12. Tooth & Diagnosis Menu Sub-Components
Sub-components of Dental Chart. Tooth: clickable, status-aware SVG path. Diagnosis Menu: context menu for condition selection.

**Files:**
- `src/pages/components/organisms/dental-chart/tooth.component.ts`
- `src/pages/components/organisms/dental-chart/diagnosis-menu.component.ts`

**Dependency:** Task #11 (Dental Chart Widget)  
**Estimated Effort:** 3-4 hours
**Status:** ❌ Not Started — **DEP ON #11**

---

#### 13. Treatment Plan Organism (Medical Services Grid)
Dynamic grid for adding/removing medical services. Must support search, add, and transfer to visit workflow.

**File:** `src/pages/components/organisms/treatment-plan.component.ts`  
**Key Methods:**
- `searchService(serviceName: string)` → filters available services
- `addService(serviceName: string)` → clicks service, adds to grid
- `getAddedServices()` → returns array of service names in grid
- `transferToVisit()` → clicks "Add to Visit" button, waits for grid to clear

**Dependency:** Task #10 (Atoms)  
**Estimated Effort:** 3-4 hours
**Status:** ❌ Not Started

---

#### 14. Additional UI Components (Medical Diary, Questionnaire, DatePicker, Modal, Sidebar)
Six reusable components needed for complete visit workflow coverage.

**Files:**
- `src/pages/components/organisms/medical-diary.component.ts` — notes/entries listing
- `src/pages/components/organisms/questionnaire.component.ts` — dynamic form filling
- `src/pages/components/atoms/datepicker.atom.ts` — date selection widget
- `src/pages/components/atoms/modal.atom.ts` — confirmation/action dialogs
- `src/pages/components/organisms/sidebar.component.ts` — navigation menu

**Dependency:** Task #10 (Atoms foundational component)  
**Estimated Effort:** 4-6 hours (parallelizable)
**Status:** ❌ Not Started

---

#### 15. Auth Workflow Pages (SMS, Role, Branch, Auth Wizard)
Complete the authentication workflow with missing pages that follow LoginPage pattern.

**Files:**
- `src/pages/auth/sms.page.ts` — SMS code entry
- `src/pages/auth/role.page.ts` — role selection dropdown
- `src/pages/auth/branch.page.ts` — branch selection
- `src/pages/auth/auth-wizard.page.ts` — optional: multi-step auth container

**Dependency:** Task #9 (BasePage class for consistency)  
**Estimated Effort:** 2-3 hours
**Status:** ❌ Not Started — **TWO OF THESE MISSING (Role, Branch)** per implementation_status.md

---

#### 16. CRM Feature Pages (Visit Details, Dashboard, Patient Card)
Main application pages for core workflows.

**Files:**
- `src/pages/crm/visit-details.page.ts` — primary visit interaction page (requires Dental Chart, Treatment Plan, Medical Diary, Questionnaire)
- `src/pages/crm/dashboard.page.ts` — home page with visit list/calendar
- `src/pages/crm/patient-card.page.ts` — patient profile and history

**Visit Details Page State Machine (from Project.md):**
- Properties: `dentalChart`, `treatmentPlan`, `diary`
- Method `changeStatus(to: string)` → expand status dropdown → click option → wait for badge update

**Dependencies:** Tasks #11-14 (All component atoms/organisms)  
**Estimated Effort:** 5-7 hours
**Status:** ❌ Not Started — **CRITICAL FOR E2E**

---

### E2E Test Assembly & Custom Fixtures

#### 17. Custom Test Fixtures (Dependency Injection)
Extend Playwright fixtures with dependency injection system to auto-initialize services and pages per test.

**File:** `src/lib/fixtures/custom-fixtures.ts`  
**Export:** `test` object (re-export from `@playwright/test` but with custom dependencies)

**Fixture Definitions:**
```typescript
export const test = base.extend({
  patientService: async ({ request }, use) => {
    const service = new PatientsService(request, getConfig());
    await use(service);
  },
  visitService: async ({ request }, use) => {
    const service = new VisitService(request, getConfig());
    await use(service);
  },
  patientFactory: async ({}, use) => {
    await use(PatientFactory);
  },
  visitDetailsPage: async ({ page }, use) => {
    const pageObj = new VisitDetailsPage(page, getConfig());
    await use(pageObj);
  },
  // ... additional service/page fixtures
});
```

**Usage in Tests:** 
```typescript
test('Full visit cycle', async ({ patientService, visitService, visitDetailsPage }) => {
  const patient = await patientService.create(...);
  const visit = await visitService.create(...);
  await visitDetailsPage.goto(`/visits/${visit.id}`);
  // ...
});
```

**Dependency:** Tasks #9-16 (All page objects)  
**Estimated Effort:** 2-3 hours
**Status:** ❌ Not Started

---

#### 18. Full Dental Visit Cycle E2E Test (Complete Business Scenario)
End-to-end test validating the complete dental visit workflow: API setup → Patient creation → Visit scheduling → UI interaction → Status transitions → Completion.

**File:** `src/tests/e2e/workflows/full-visit-cycle.spec.ts`  
**Scenario Flow:**
1. **API Setup (beforeEach):** Create Patient via PatientService → Create Shift via ScheduleService → Create Visit via VisitService
2. **UI Navigation:** Navigate to `{baseUrl}/visits/{visitId}`
3. **Business Logic (Assertions):**
   - Dental Chart renders tooth data (mock backend via `page.route`)
   - User interacts with teeth (select, apply diagnoses)
   - Treatment Plan widget: search service → add services → transfer to visit
   - Medical Diary: add notes
   - Questionnaire: fill/submit patient questions
   - Status transitions: Arrived → In Progress → Completed
   - Final assertion: Visit status persists across page refreshes

**Test Points:** ≥ 8 distinct assertion blocks covering UI state changes

**Dependencies:** Tasks #11-17 (All components, pages, fixtures)  
**Estimated Effort:** 4-6 hours
**Status:** ❌ Not Started — **FINAL DELIVERABLE FOR PHASE 3**

---

## 📋 Backlog (Future - Infrastructure, Tools & Polish)

### Infrastructure & DevOps Phase

#### 19. Dockerfile (Production-Ready OCI Image)
Build Playwright-based container image with Russian locale configured.

**File:** `Dockerfile`  
**Requirements (from Project.md):**
- Base: `mcr.microsoft.com/playwright:v1.40.0-jammy` or newer
- Env: `LANG=ru_RU.UTF-8` (ensures correct date/number formatting in Russian CRM)
- COPY: Source files, install dependencies via npm ci
- Entrypoint: `npx playwright test`
- Optional: Create `.dockerignore` to exclude test-results, playwright-report, node_modules (rebuilds on each image)

**Estimated Effort:** 1-2 hours
**Status:** ❌ Not Started

---

#### 20. GitLab CI Configuration (Parallel Sharding & Artifact Management)
CI/CD pipeline supporting parallel test execution with sharding, artifact retention, and Allure reporting.

**File:** `.gitlab-ci.yml`  
**Key Sections:**

- **Matrix Job** (test_e2e):
  ```yaml
  test_e2e:
    parallel:
      matrix:
        - SHARD_INDEX: [1, 2, 3, 4]
          TOTAL_SHARDS: 4
    script:
      - npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
  ```
  Formula: `ShardParams = CI_NODE_INDEX / CI_NODE_TOTAL`

- **Artifact Management:**
  - Passed tests: Minimal logs (exclude video/screenshots to save storage)
  - Failed tests: Retain Traces (zip), Screenshots (png), Video (webm) for 7 days
  - Allure Report: Retain for 30 days

- **Merge Report Job:**
  - Collect sharded results
  - Merge into single Allure report
  - Publish to Allure Dashboard

**Estimated Effort:** 2-3 hours

---

### Development Tooling & Scripts

#### 21. npm run debug:config Script
CLI utility to print resolved (redacted) configuration for troubleshooting.

**Files:**
- `src/utils/config-debugger.ts` — implementation
- `package.json` — add script: `"debug:config": "ts-node src/utils/config-debugger.ts"`

**Output:**
- Colorized, human-readable config summary
- All secrets masked (e.g., password → `****`)
- Indicates which env file loaded (dev.config.ts, staging.config.ts)
- Shows resolved `baseUrl`, `apiUrl`, feature flags

**Estimated Effort:** 1 hour

---

#### 24. verify-auth.ts Script (Token Freshness Validation)
Standalone script to validate that `playwright/.auth/admin.json` contains fresh, valid authentication tokens.

**File:** `scripts/verify-auth.ts`  
**Checks:**
- File exists at `playwright/.auth/admin.json`
- Parse JSON and extract authentication token/cookie
- Decode JWT (if token is JWT) or check `expires` timestamp
- Compare `T_expiry - T_now` against 10-minute threshold
- Return exit code 0 (valid), 1 (invalid/expiring)

**Usage in CI:** `npx ts-node scripts/verify-auth.ts && npx playwright test` (bail early if auth invalid)

**Estimated Effort:** 1.5-2 hours

---

#### 25. Contract Verifier Tool (Breaking Change Detection)
CLI tool to validate API responses against Zod schemas, detecting backend breaking changes before running full test suite.

**File:** `scripts/contract-verifier.ts`  
**Logic:**
- Iterate through all defined Zod schemas (PatientSchema, ShiftSchema, VisitSchema, etc.)
- For each schema: make minimal test request to Dev environment → validate response
- Collect mismatches
- Exit code: 0 (all valid), 1 (schema mismatch); print detailed error messages

**Usage:** `npx ts-node scripts/contract-verifier.ts` (run as CI pre-check)

**Estimated Effort:** 2-3 hours

---

#### 26. Component Workbench (Isolated UI Testing)
Additional Playwright project configuration for testing UI components in isolation, without full auth setup. Uses `page.route` to mock all backend calls.

**File:** Updates to `playwright.config.ts`  
**Configuration:**
- New project: `workbench` (no dependency on setup)
- baseURL: localhost:3000 (or test app URL)
- Use `page.route('**/*', route => route.abort())` to intercept—then selectively allow specific routes with mock responses

**Purpose:** Debug Dental Chart interactions independent of database state; verify component behavior in controlled environment

**Estimated Effort:** 1.5-2 hours

---

#### 27. Data Setup Debugger Script (Fixture/Factory Debugging)
Standalone Node.js script to execute API setup phase in isolation, logging generated payloads and responses.

**File:** `scripts/data-setup-debugger.ts`  
**Logic:**
- Parse `.env` and initialize config
- Authenticate using stored token from `admin.json`
- Execute PatientFactory.createRandom() → log payload → POST via PatientsService → log response
- Repeat for Shift and Visit creation
- If any request fails, print full response with error details
- Timeline tracking: measure setup time per resource

**Usage:** `npx ts-node scripts/data-setup-debugger.ts`

**Output:** Help diagnose whether test failures originate from "Data Creation" or "UI Interaction"

**Estimated Effort:** 1.5-2 hours

---

### Utility & Support Modules

#### 28. API Endpoints Constants
Centralized enum of all API routes to prevent string duplication and enable IDE autocomplete.

**File:** `src/lib/api/api-endpoints.ts`  
**Structure:**
```typescript
export const API_ENDPOINTS = {
  PATIENTS: {
    CREATE: '/api/v1/patients',
    GET: (id: number) => `/api/v1/patients/${id}`,
  },
  SCHEDULES: {
    CREATE_SHIFT: '/api/v1/schedule/shift',
    // ...
  },
  // ...
} as const;
```

**Usage:** Replace hardcoded strings in services with `API_ENDPOINTS.PATIENTS.CREATE`

**Estimated Effort:** 1 hour

---

#### 29. Utility Modules (Date, Generator, Medical)
Three supporting utility modules for test data generation and manipulation.

**Files:**
- `src/utils/date-utils.ts` — date formatting, arithmetic (e.g., `addDays(date, 5)`, `toISOString(date)`)
- `src/utils/generators/person.generator.ts` — realistic person data (FIO, patronymic, phone formatting per Russian standards)
- `src/utils/generators/medical.generator.ts` — diagnoses, treatments, procedures, medical conditions

**Usage:** Used by PatientFactory and test fixtures for data generation

**Estimated Effort:** 2-3 hours

---

#### 30. Index/Export Files (Barrel Exports)
Create barrel export files for cleaner imports across the codebase.

**Files to Create:**
- `src/lib/entities/index.ts` — re-export all type definitions (PatientDTO, VisitSchema, etc.)
- `src/lib/api/services/index.ts` — re-export all service classes
- `src/lib/fixtures/index.ts` — re-export all factories (PatientFactory, ShiftFactory)
- `src/pages/components/atoms/index.ts` — re-export all atom components
- `src/pages/components/organisms/index.ts` — re-export all organism components

**Benefit:** Convert `import { PatientService } from 'src/lib/api/services/patients.service'` to `import { PatientService } from 'src/lib/api/services'`

**Estimated Effort:** 1 hour

---

#### 31. Swagger/OpenAPI Models (Auto-Generated or Hand-Curated)
TypeScript type definitions derived from backend Swagger/OpenAPI specification.

**File:** `src/lib/entities/swagger-models.ts`  
**Method:** Hand-curation from API documentation (or use `swagger-typescript-api` CLI if backend publishes spec)

**Content:** Comprehensive type definitions for all API request/response bodies not yet covered (Patient, Visit, Schedule already exist as minimal interfaces)

**Estimated Effort:** 2-3 hours (depends on backend spec completeness)

---

### Project Configuration & Documentation

#### 32. .env.example Template File
Template with all required environment variables for local setup (no secrets).

**File:** `.env.example`  
**Contents:**
```env
# API Configuration
BASE_URL=http://localhost:3001
API_URL=http://localhost:3000

# Credentials
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=ChangeMe!
COMPANY_UID=550e8400-e29b-41d4-a716-446655440000
SMS_CODE=000000

# Feature Flags
SECOND_COMPANY_NAME=TestCompany2
CAPTCHA_ENABLED=false

# Test Configuration
TEST_ENV=dev
TIMEOUT_ACTION=5000
TIMEOUT_NAVIGATION=10000
```

**Usage:** `cp .env.example .env` + fill in actual values for local development

**Estimated Effort:** 30 mins

---

#### 33. ESLint Configuration
Enforce consistent code style and catch common errors in TypeScript.

**File:** `.eslintrc.json`  
**Rule Set:**
- `@typescript-eslint/strict` (forbid `any`, explicit return types)
- Naming conventions: camelCase for variables, PascalCase for classes/interfaces
- No console (prefer logger)
- No hardcoded strings in tests (constants only)

**npm Script:** `"lint": "eslint src/ --ext .ts"` + CI linting on PR

**Estimated Effort:** 1 hour

---

#### 34. Prettier Configuration
Auto-format code for consistency.

**File:** `.prettierrc`  
**Settings:** 2-space indentation, single quotes, trailing commas, no semicolons

**npm Script:** `"format": "prettier --write src/"`

**Estimated Effort:** 30 mins

---

#### 35. Comprehensive README.md
Project documentation for onboarding and troubleshooting.

**File:** `README.md`  
**Sections:**
- **Quick Start:** Install, configure `.env`, run `npx playwright test`
- **Architecture Overview:** Diagram (mermaid) of layers
- **Running Tests:** Full test suite, specific test, watch mode, debug mode
- **Troubleshooting:** Common failures (auth timeout, flaky tests, selectors), how to debug
- **Contributing:** Code conventions, PR checklist, adding new tests
- **CI/CD:** How sharding works, artifact inspection, Allure report access

**Estimated Effort:** 2-3 hours

---

### Risk Mitigation Spikes (Proof-of-Concept)

#### 36. Spike: Hybrid Auth Handshake
**File:** `spikes/probe-auth-handshake.ts`  
**Purpose:** Verify that cookies saved in `playwright/.auth/admin.json` can be successfully reused for API calls without re-authentication

**Execution:** Load auth.json → initialize APIRequestContext with cookies → make GET request to `/api/v1/glossary/specializations` → assert 200 response

---

#### 37. Spike: Dental Chart DOM & Selector Strategy
**File:** `spikes/probe-dental-chart-dom.ts`  
**Purpose:** Determine optimal locator strategy (CSS selectors vs SVG paths vs coordinate-based) for interactive tooth elements in Dental Chart widget

**Execution:** Navigate to patient visit page → inspect DOM via DevTools → test different selector patterns → document winning pattern for task #11

---

#### 38. Spike: Data Format Validation (Schema Mismatch Detection)
**File:** `spikes/probe-data-formats.ts`  
**Purpose:** Test whether generated patient/shift payloads from factories actually match backend validation rules

**Execution:** Call PatientFactory.createRandom() → POST to `/api/v1/patients` (low-level) → capture any 400 errors → iterate factory generators until all payloads pass

---

#### 39. Spike: Docker Networking & Locale
**File:** `spikes/probe-docker.sh`  
**Purpose:** Verify that containerized Playwright can reach test environment URLs and that Russian locale is properly configured

**Execution:**
- Build Dockerfile locally
- Run container with `--env BASE_URL=http://host.docker.internal:3000`
- Inside container: curl to baseURL, check locale with `locale`, verify date formatting matches `ru_RU.UTF-8`

---

---

---

## 📊 Dependency & Blocking Map

**CRITICAL:** Tasks #1-5 (API & Config), #6 (Spikes) are Prerequisites. All UI tasks (#9-18) are blocked until Phase 5 starts.

| Task # | Title | Status | Blocks | Dependencies |
|--------|-------|--------|--------|--------------|
| **Phase 1-4: API & Config (MOSTLY DONE)** |
| 1 | PatientFactory + ShiftFactory | ✅ Done | API tests | None |
| 2 | Config Zod Validation | ✅ Done | #3, #5, #8 | None |
| 3 | Logger Component | ✅ Done | Observability | None |
| 4 | Allure Reporter Config | ✅ Done | Report generation | #3 (optional) |
| 5 | Staging Environment Config | ✅ Done | Multi-env support | #2 |
| **Phase 1-4 (Tooling & Polish - TO DO)** |
| 6 | Execute Critical Spikes | ❌ Not Started | #9 (Dental Chart) | Phases 1-4 |
| 7 | API Endpoints Constants | ❌ Not Started | Code cleanup | None |
| 8 | Barrel Exports (index.ts) | ❌ Not Started | Code org | All modules exist |
| **Phase 5: UI Layer & E2E (CRITICAL PATH - BLOCKING)** |
| 9 | BasePage Abstract Class | ✅ Done | #10-16 | None |
| 10 | Atom Components (Input, Select) | ❌ Not Started | #11-16 | #9 |
| 11 | Dental Chart Widget | ❌ Not Started | #16, #18 | #6 (spike), #10 |
| 12 | Tooth & Diagnosis Components | ❌ Not Started | #11 | #11 |
| 13 | Treatment Plan Organism | ❌ Not Started | #18 | #10 |
| 14 | UI Components (Diary, Questionnaire, etc) | ❌ Not Started | #16, #18 | #10 |
| 15 | Auth Pages (SMS, Role, Branch) | ❌ Not Started | #17 | #9 |
| 16 | CRM Pages (Visit, Dashboard, Patient) | ❌ Not Started | #18 | #9-14 |
| 17 | Custom Fixtures (DI) | ❌ Not Started | #18 | #9-16 |
| 18 | Full E2E Test (Visit Cycle) | ❌ Not Started | Deliverable | #1-5, #17 |
| **Phase 4: Infrastructure & CI/CD (DEFERRED)** |
| 19 | Dockerfile | ❌ Not Started | CI pipeline | None |
| 20 | GitLab CI Config (.gitlab-ci.yml) | ❌ Not Started | Production deploy | None |
| **Phase 4: Tooling & Documentation (DEFERRED)** |
| 21 | npm run debug:config Script | ❌ Not Started | DX | #2 |
| 22 | verify-auth.ts Script | ❌ Not Started | CI pre-check | None |
| 23 | Contract Verifier Tool | ❌ Not Started | Breaking changes | Zod schemas |
| 24 | Component Workbench Project | ❌ Not Started | Isolated testing | #11-14 |
| 25 | Data Setup Debugger Script | ❌ Not Started | Debugging | #1-5 |
| 26 | API Endpoints Enum (duplicate of #7) | 🔄 Merged with #7 | Code cleanup | None |
| 27 | Utility Modules (Date, Generators) | ❌ Not Started | Data generation | None |
| **Final Polish** |
| 28 | .env.example Template | ❌ Not Started | Onboarding | None |
| 29 | ESLint Config | ❌ Not Started | Code quality | None |
| 30 | Prettier Config | ❌ Not Started | Formatting | None |
| 31 | Comprehensive README.md | ✅ Done | Onboarding | None |
| 32-37 | Risk Mitigation Spikes | ❌ See #6 | Risk mitigation | Varies |

---

## 🎯 Prioritization Strategy (UPDATED)

### Phase 1: API Layer & Observability (✅ COMPLETE - 18-24 hours invested)
**Goal:** Complete the backend integration layer and enable debugging.  
**Status:** ✅ **DONE** — All API services, config, logger, and Allure reporting implemented

**Completed Tasks:** #1-5  
**Verified Deliverable:**
- ✅ All API services fully implemented and tested (Patient, Schedule, Branch, Employee, Visit, Glossary)
- ✅ Contract/integration tests passing (5 test files)
- ✅ Configuration validated via Zod schema
- ✅ Logger working with dual-format output (JSON Lines/colorized)
- ✅ Allure reporter configured and artifact retention enabled
- ✅ Staging environment config implemented

**Impact:** API layer is now production-ready for data-driven E2E testing

---

### Phase 2: Risk Mitigation & Polish (~1-2 hours - OPTIONAL BEFORE PHASE 3)
**Goal:** Validate architecture assumptions; set up tooling for smoother Phase 3

**Tasks:** #6-8  
**Recommended Before:** #9 (Dental Chart widget) to de-risk

**What's Included:**
- **#6 (Spikes):** 4 critical POC scripts validating auth handshake, DOM selectors, data formats, Docker setup
- **#7 (API Endpoints):** Centralized enum preventing string duplication
- **#8 (Barrel Exports):** Clean import paths for all modules

**Why This Phase:**
- **Spike #36 (Dental Chart DOM):** MANDATORY before starting #11 to identify correct selector strategy (15 mins)
- **API Endpoints (#7):** Code hygiene; enables refactoring safety
- **Barrel Exports (#8):** Optional but unlocks cleaner imports

---

### Phase 3: UI Layer & E2E Testing (Sprint 2-3, ~20-30 hours - CRITICAL PATH)
**Goal:** Build all page objects, components, and fixtures for E2E testing.

**Tasks:** #9-18  
**Deliverable:** Full-featured E2E test validating complete dental visit workflow

**Critical Dependencies:**
- All Phase 1 tasks must be complete (API layer working)
- Spike #36 completed before starting #11 (Dental Chart)
- Tasks MUST be completed in order: #9 → #10 → #11-14 → #15-16 → #17 → #18

**Parallel Tracks (Can happen simultaneously):**
- **Track A:** #9-10 (BasePage + Atoms) → #11-12 (Dental Chart) → #13-14 (other organisms)
- **Track B:** #15 (Auth pages) + #16 (CRM pages) → both require A's output from #9
- **Track C:** #17 (Fixtures) → requires A+B output

**Rough Timeline:**
- **Week 3:**
  - #9 (BasePage) — 2 hours
  - #10 (Atoms) — 3 hours
  - #11 (Dental Chart) — 5-8 hours (largest single task)
  
- **Week 3-4:**
  - #12 (Tooth components) — 3-4 hours
  - #13 (Treatment Plan) — 3-4 hours
  - #14 (Diary, Questionnaire, etc) — 4-6 hours
  
- **Week 4:**
  - #15 (Auth pages) — 2-3 hours
  - #16 (CRM pages) — 5-7 hours
  - #17 (Fixtures) — 2-3 hours
  - #18 (Full E2E Test) — 4-6 hours

**Why After Phase 1-2:**
- Requires stable API layer (Phase 1)
- Large scope; benefit from confidence in backend
- Parallelizable; team can split atoms/organisms/pages

---

### Phase 4: Infrastructure & Finalization (~6-8 hours - DEFERRED TO WEEK 5)

---

### Optional / Deferred Tasks
- **Tasks #22-25 (Debug Tooling):** Implement first if DX/troubleshooting capability is highest priority
- **Task #24 (Component Workbench):** Useful after #11-14 complete; helps with isolated testing
- **Task #29 (Swagger Models):** Low priority; only if backend has OpenAPI spec
- **Tasks #34-37 (Spikes):** Run as needed for risk validation (e.g., before starting #11 if Dental Chart is uncertain)

---

## ✅ Implementation Checklist (UPDATED 2026-02-19)

**LEGEND:** ✅ = Done | 🚧 = In Progress | ❌ = Not Started | 🔄 = Merged

### Phase 1: API Layer & Observability (✅ COMPLETE)
```
[✅] 1. Complete PatientFactory + ShiftFactory with SNILS & OMS
[✅] 2. Add Zod validation to TestConfig (config.schema.ts)
[✅] 3. Implement Logger utility component (dual-format output)
[✅] 4. Create Patient Zod Schema + type definitions
[✅] 5. Configure Allure reporter (playwright.config.ts)
[✅] 6. All API Services: Patient, Schedule, Branch, Employee, Visit, Glossary
[✅] 7. All API Integration Tests (glossary, patient, shift, branch, employee)
[✅] 8. Create staging environment config (staging.config.ts)
```

### Phase 2: Risk Mitigation & Polish (❌ OPTIONAL - RECOMMENDED BEFORE PHASE 3)
```
[❌] 6. Execute Critical Spikes (auth, DOM, data formats, docker)
[❌] 7. Create API Endpoints Constants (api-endpoints.ts)
[❌] 8. Create Barrel Exports (entities/index.ts, services/index.ts, etc)
```

### Phase 3: UI Layer & E2E (❌ CRITICAL PATH - BLOCKING PHASE 4)
```
[✅] 9. Create BasePage abstract class
[❌] 10. Create Atom components (InputField, SelectDropdown)
[❌] 11. Implement Dental Chart widget (⚠️ RUN SPIKE #36 FIRST)
[❌] 12. Create Tooth & Diagnosis components
[❌] 13. Implement Treatment Plan organism
[❌] 14. Create UI components (MedicalDiary, Questionnaire, DatePicker, Modal, Sidebar)
[❌] 15. Create Auth workflow pages (SMS, Role, Branch)
[❌] 16. Create CRM feature pages (VisitDetails, Dashboard, PatientCard)
[❌] 17. Create custom test fixtures (Dependency Injection)
[❌] 18. Implement Full Dental Visit Cycle E2E test
```

### Phase 4: Infrastructure, Tools & Documentation (❌ DEFERRED TO WEEK 5)
```
[❌] 19. Create Dockerfile (Playwright + Russian locale)
[❌] 20. Create .gitlab-ci.yml with sharding matrix
[❌] 21. Create npm run debug:config script
[❌] 22. Implement verify-auth.ts script
[❌] 23. Implement contract-verifier.ts tool
[❌] 24. Create component workbench project (OPTIONAL)
[❌] 25. Implement data-setup-debugger.ts script
[❌] 27. Create utility modules (date-utils, generators)
[❌] 28. Create .env.example template
[❌] 29. Create .eslintrc.json
[❌] 30. Create .prettierrc
[✅] 31. Create/Update README.md (Already exists)
```

---

### Optional / Deferred Tasks
- **Task #6 (Spikes):** Execute before #11 if Dental Chart DOM is uncertain; at minimum run Spike #36 (15 mins)
- **Task #24 (Component Workbench):** Implement after #11-14 for isolated component testing
- **Task #25 (Data Setup Debugger):** Helpful for troubleshooting; nice-to-have during Phase 3
- **Task #32 (Swagger Models):** Low priority; only if backend publishes OpenAPI spec

---

## 📝 Technical Notes & Rationale

### Key Decisions

1. **PatientFactory First (#1):** SNILS + OMS generation is blocking #6-7 tests. Small scope but high value.

2. **Config Validation Early (#2):** Catches configuration errors before running tests. Enables #3 (Logger) and #5 (Allure) to use validated config safely.

3. **Logger Before Allure (#3 before #5):** Logger is foundational; Allure integration requires logger to attach logs to reports.

4. **Patient Schema (#4):** Enables contract tests (#6-7) to validate API responses. Small effort; high value for reliability.

5. **Allure Integration (#5):** Non-blocking; provides visibility into test failures (videos, traces, logs). Can be done in parallel with #6-7.

6. **Staging Config (#8):** Deferred to later stage but included in "Immediate" to account for multi-environment strategy. Can substitute with "not implemented" error if staging backend unavailable.

7. **UI Layer Parallelization (#9-17):** Large scope; can be split:
   - Team A: #9-10 (BasePage + Atoms) → [blocker resolve] → #11-12 (Dental Chart) → #13-14 (other organisms)
   - Team B: #15 (Auth pages) + #16 (CRM pages) → requires A's output from #9
   - Team C: #17 (Fixtures) → requires A+B output

8. **E2E Test as Proof (#18):** Final validation that all layers integrate correctly. Uses custom fixtures (#17) + all pages (#16).

9. **Docker & CI Last (#19-20):** Production requirement; can be deferred if prototype validation is priority. Implement once test suite is stable.

---

### Estimated Effort Summary

| Phase | Tasks | Est. Hours | Effort Level |
|-------|-------|-----------|--------------|
| 1 (API) | #1-8 | 18-24 | Low-Medium |
| 2 (UI) | #9-17 | 30-45 | Medium-High |
| 3 (E2E) | #18, #21-25 | 8-12 | Medium |
| 4 (Infra) | #19-20, #26-33 | 10-15 | Low-Medium |
| **Total** | 1-37 | **66-96 hours** | **Moderate (2-3 person-weeks)** |

---

### Common Implementation Pitfalls

1. **Hardcoding URLs in tests:** Use `getConfig().baseUrl` consistently. Store API endpoints in `api-endpoints.ts` (task #26).

2. **Brittle CSS selectors:** Favor semantic HTML + label selectors (via InputField atom) over nth-child or positional selectors.

3. **Missing error context:** Always include Request URL + Response Body in error throws (BaseService already does this).

4. **Skipping Zod validation:** Even if exhausting, validate all payloads at API boundary to catch bugs early.

5. **Monolithic fixtures:** Keep `custom-fixtures.ts` services/pages separate; avoid creating God fixturés that initialize everything.

6. **TODO: Dental Chart selectors:** Task #11 must map all 32 teeth IDs to DOM paths—cannot defer. Do early spike (#36) if uncertain.

---

## 🔗 Cross-References

- **Project.md Formulae:** SNILS Modulo 101 checksum (sec. 4.4.1), Backoff formula (sec. 3.2.2), Shard formula (sec. 5.2)
- **implementation_status.md:** Current completion metrics (40%), all done/in-progress/missing items
- **playwright.config.ts:** Update `reporter`, `projects.dependencies` for setup/chromium
- **.env.example:** Template required for onboarding (task #30)
- **Copilot Instructions:** Coding guidelines for AI agents working on this codebase

---

## ✨ Success Criteria for Each Phase

### Phase 1 Complete ✅
- All 8 tasks finished and tested locally
- `npm test` runs 5+ contract tests (Patient, Schedule, Branch, Employee, Visit, Glossary)
- `npm run debug:config` outputs redacted configuration
- Logger outputs JSON Lines in CI mode, text in local mode
- Zod validation rejects bad config with clear field names

### Phase 2 Complete ✅
- All page objects + fixtures pass linting
- Custom fixtures export `test` with auto-wired services/pages
- All atom/organism components have unit test coverage (optional but recommended)
- No hardcoded selectors; all use semantic HTML patterns (via atoms)

### Phase 3 Complete ✅
- Full E2E test passes 5+ assertion blocks
- `npm run contract-verifier` exits 0 (all schemas valid)
- `npm run debug:config` + `verify-auth.ts` both succeed
- Data Setup Debugger logs complete payload/response trace

### Phase 4 Complete ✅
- Docker image builds: `docker build -t dental-crm-tests .`
- GitLab CI shards test suite across 4 parallel runners
- README guides new developer from git clone to `npm test` in < 10 mins
- `.env.example` + ESLint + Prettier all in place

---

## 📬 Notes

- **Dental Chart Complexity:** Task #11 is the highest-risk item. Consider running spike #36 (DOM probe) before committing to full implementation. The selector mapping (all 32 teeth) is non-trivial.

- **Fixture Data Refresh:** ShiftFactory generates `dateFrom/To` relative to "now"; ensure tests handle date arithmetic correctly (use `date-utils.ts` task #27).

- **Allure Dashboard:** Task #5 configures local Allure; GitLab Job #20 must run merge report job to publish to centralized dashboard.

- **GitHub Copilot Instructions:** Refer to [copilot-instructions.md](.github/copilot-instructions.md) for AI agent guidance on project conventions.

