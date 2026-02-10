# Next Steps - Implementation Roadmap

## 🚀 Immediate Priorities (Next Sprint)

### 1. Visit Service Implementation
**Description**: Create the Visit API service to complete the "data creation trio" (Patient, Shift, Visit). Essential for E2E test setup phase.

**File**: `src/lib/api/services/visit.service.ts`

**Dependencies**: 
- Patient Service (✅ exists)
- Schedule Service (✅ exists)

**Technical Notes**:
- Method: `createVisit(patientId: number, doctorId: number, shiftTime: Date): Promise<VisitResponse>`
- Should POST to `/api/v1/health/visits`
- Extract `accessToken` from storage state (follow PatientsService pattern)
- Return constructed visit URL: `${baseUrl}/visits/${visitId}`
- Add Zod schema validation for VisitDTO in `src/lib/entities/visit.types.ts`

**Acceptance Criteria**:
- Service validates payload against Zod schema
- Returns visit ID and URL
- Handles errors with clear messages
- Contract test passes: `src/tests/api/visit.spec.ts`

---

### 2. API Request Engine (ApiRequestManager Wrapper)
**Description**: Create a centralized wrapper around Playwright's `APIRequestContext` with retry logic and consistent error handling.

**File**: `src/lib/api/request-manager.ts`

**Dependencies**: None (core infrastructure)

**Technical Notes**:
- Wrap `post()`, `get()`, `patch()`, `delete()` methods
- Implement retry logic with exponential backoff: `WaitTime_k = 100ms × 2^k` for k=0..2
- Retry only on 502, 503, 504
- Throw `ClientError` (4xx) with request/response details
- Throw `ServerError` (5xx)
- Auto-inject headers: `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`

**Acceptance Criteria**:
- All existing services (PatientsService, ScheduleService, VisitService) refactored to use ApiRequestManager
- Retry logic unit tests confirm exponential backoff timing
- Error messages include request URL and response body

---

### 3. Base Page Object Class
**Description**: Create the foundation class for all Page Objects. All UI components inherit from this to standardize locator patterns and common methods.

**File**: `src/pages/base.page.ts`

**Dependencies**: None

**Technical Notes**:
- Constructor: `constructor(page: Page, config: TestConfig)`
- Protected properties: `this.page`, `this.config`
- Helper methods:
  - `goto(path: string)`: Navigate to URL
  - `waitForElement(locator: Locator, timeout?: number)`: Wait with custom timeout
  - `fillInput(locator: Locator, value: string)`: Fill + clear + type
  - `selectByText(locator: Locator, text: string)`: Click dropdown option
  - `getCurrentUrl(): string`
- All other page objects inherit: `export class LoginPage extends BasePage { ... }`

**Acceptance Criteria**:
- LoginPage refactored to extend BasePage (removes duplicate locator logic)
- Helper methods tested and work with Playwright's async patterns
- No flakiness in element waits

---

### 4. Custom Test Fixtures
**Description**: Create fixtures that initialize API services and page objects, injecting them into test functions. Bridge between Test Specs and Framework.

**File**: `src/lib/fixtures/custom-fixtures.ts`

**Dependencies**:
- Base Page Object (needs #3)
- Patient, Schedule, Visit services (needs Patient ✅, Schedule ✅, Visit #1)

**Technical Notes**:
- Extend Playwright's `test`:
  ```typescript
  export const test = base.extend({
    patientService: async ({ request }, use) => { ... },
    scheduleService: async ({ request }, use) => { ... },
    visitService: async ({ request }, use) => { ... },
    loginPage: async ({ page, context }, use) => { ... },
  });
  ```
- Fixture `dentalVisitFlow` orchestrates full setup:
  - Create Shift (for doctor)
  - Create Patient
  - Create Visit
  - Return: `{ patientId, visitId, visitUrl, visitPage }`

**Acceptance Criteria**:
- Fixtures auto-initialize with auth context
- Test can access all services and pages via fixture injection
- No manual service instantiation in tests

---

### 5. Full Dental Visit Cycle E2E Test
**Description**: Implement the core smoke test validating the complete hybrid strategy: API setup → UI business logic.

**File**: `src/tests/e2e/full-visit-cycle.spec.ts` or update `src/tests/e2e/smoke/api-check.spec.ts`

**Dependencies**:
- Visit Service (#1)
- Custom Fixtures (#4)
- Dental Chart Component (#11 in backlog, or mock for now)
- Treatment Plan Component (#12 in backlog, or mock for now)

**Technical Notes**:
- Test structure:
  ```typescript
  test('Full Dental Visit Cycle', async ({ dentalVisitFlow, visitPage }) => {
    // dentalVisitFlow creates shift, patient, visit
    // visitPage is instantiated and navigated
    
    // UI Step 1: Change status to 'Arrived'
    await visitPage.changeStatus('Arrived');
    
    // UI Step 2: Record dental findings
    await visitPage.dentalChart.selectTooth(18);
    await visitPage.dentalChart.markCondition('caries');
    
    // UI Step 3: Add treatment
    await visitPage.treatmentPlan.addService('Filling');
    
    // UI Step 4: Complete visit
    await visitPage.changeStatus('Completed');
    
    // Assertions
    expect await visitPage.statusBadge.toHaveText('Completed');
  });
  ```
- For now, mock Dental Chart and Treatment Plan with `page.route()` to intercept API calls

**Acceptance Criteria**:
- Test passes reliably (3 consecutive runs)
- Covers critical path: create → navigate → change status → assert
- Handles API failures gracefully
- Ready for UI component integration once they're built

---

### 6. Add SNILS & OMS Generation to PatientFactory
**Description**: Enhance the data factory to generate valid Russian identifiers with proper checksum validation.

**File**: Update `src/lib/fixtures/patient.factory.ts`

**Dependencies**: None

**Technical Notes**:
- **SNILS Checksum Algorithm** (from Project.md):
  ```
  S = Σ(d_i × (10 - i)) for i=1..9
  C = S if S < 100
      else 0 if S == 100
      else S mod 101
  ```
  - Implement `calculateSnilsChecksum(snilsBase: string): string`
  - Generate 9 random digits, append checksum

- **OMS Policy**: Generate 16-digit string (all numeric)
  - `policyOmsNumber: faker.string.numeric(16)`

- Update `PatientPayload` interface to include these fields

**Acceptance Criteria**:
- Generated SNILS passes modulo 101 validation
- OMS is exactly 16 digits
- Factory returns valid payloads on every call
- Unit test: verify 100 random SNILS all have correct checksums

---

### 7. Patient Zod Schema & Validation in Service
**Description**: Add runtime contract validation for Patient payloads to catch data mismatches early.

**File**: Update or create `src/lib/entities/patient.types.ts`

**Dependencies**: None

**Technical Notes**:
- Add PatientSchema (from Project.md spec):
  ```typescript
  const PatientSchema = z.object({
    id: z.number().optional(),
    user: z.object({
      surname: z.string(),
      name: z.string(),
      patronymic: z.string().nullable(),
      birthday: z.string().regex(/\d{4}-\d{2}-\d{2}/),
      snils: z.string().regex(/\d{11}/), // 11 digits
      phone: z.string()
    }),
    policyOmsNumber: z.string().length(16),
    passport: z.object({
      number: z.string(),
      series: z.string()
    })
  });
  ```
- Integrate into PatientsService: validate payload before POST
- Add `.parse()` (throws) or `.safeParse()` (returns result)

**Acceptance Criteria**:
- Service validates and throws descriptive error if payload invalid
- Unit test: verify invalid SNILS is rejected
- Unit test: verify truncated phone is rejected

---

## 📋 Backlog (Future)

### Phase 5: UI Components & Pages (12-15 items)

#### Design System (Atoms)
- **InputField Component** (`src/pages/components/atoms/input-field.atom.ts`)
  - Wraps `locator.fill()` with wait-for-actionable + clear semantics
  - Method: `fill(value: string)` with 50ms delay for search fields
  
- **SelectDropdown Component** (`src/pages/components/atoms/select-dropdown.atom.ts`)
  - Handle HTML `<select>` and custom div-based dropdowns
  - Method: `selectByText(text: string)`

#### Business Widgets (Organisms)
- **Dental Chart Component** (`src/pages/components/dental-chart.widget.ts`)
  - Methods: `selectTooth(number)`, `markCondition(type)`, `saveChart()`
  - Must use `page.route()` to mock backend responses for stable tests
  - TODO from Project.md: Map all 32 teeth IDs to SVG path selectors
  
- **Tooth Component** (`src/pages/components/tooth.component.ts`)
  - Represents individual tooth UI element
  - Status classes: `.status-caries`, `.status-healthy`, etc.
  
- **Diagnosis Menu Component** (`src/pages/components/diagnosis-menu.component.ts`)
  - Dropdown for selecting tooth conditions
  
- **Treatment Plan Component** (`src/pages/components/treatment-plan.component.ts`)
  - Methods: `searchService(name)`, `addService()`, `transferToVisit()`, `savePlan()`
  - Dynamic grid allowing service additions
  
- **Medical Diary Component** (`src/pages/components/medical-diary.component.ts`)
  - Record doctor notes and observations
  
- **Questionnaire Component** (`src/pages/components/questionnaire.component.ts`)
  - Patient intake form
  
- **DatePicker Component** (`src/pages/components/datepicker.component.ts`)
  
- **Modal Component** (`src/pages/components/modal.component.ts`)
  
- **Sidebar Component** (`src/pages/components/sidebar.component.ts`)

#### Page Objects
- **Dashboard Page** (`src/pages/crm/dashboard.page.ts`)
  
- **Patient Card Page** (`src/pages/crm/patient-card.page.ts`)
  
- **Visit Details Page** (`src/pages/crm/visit-details.page.ts`)
  - Composition: `dentalChart`, `treatmentPlan`, `diary`, `questionnaire`
  - State machine: track visit status
  - Method: `changeStatus(to: string)` - expand dropdown, click option, wait for badge update
  - Methods: `fillQuestionnaire()`, `fillDiary()`, `completeVisit()`
  
- **Auth Flow Pages** (enhance existing)
  - SMS Page (`src/pages/auth/sms.page.ts`)
  - Role Selection Page (`src/pages/auth/role.page.ts`)
  - Branch Selection Page (`src/pages/auth/branch.page.ts`)
  - Auth Wizard integration (`src/pages/auth/auth.wizard.ts`)

---

### Phase 6: Additional API Services & Data Models (4-5 items)

- **Glossary Service** (`src/lib/api/services/glossary.service.ts`)
  - Methods: `getSpecializationId(name)`, `getBranchId()`, `getJobPositionId()`
  - Fetch reference lists from API, return first matching ID
  - Test: `src/tests/api/glossary.spec.ts`

- **Visit Data Types & Schema** (`src/lib/entities/visit.types.ts`)
  - VisitDTO, VisitResponse, VisitSchema with Zod

- **Additional Data Models**
  - Swagger models export (`src/lib/entities/swagger-models.ts`)
  - Entity index exports (`src/lib/entities/index.ts`)
  - Service index exports (`src/lib/api/services/index.ts`)
  - Fixtures index exports (`src/lib/fixtures/index.ts`)

---

### Phase 7: Data Generation & Utilities (5-6 items)

- **Advanced Data Generators**
  - Person Generator (`src/utils/generators/person.generator.ts`) - encapsulate Faker logic
  - Medical Generator (`src/utils/generators/medical.generator.ts`) - diagnosis, treatment codes
  
- **Utility Modules**
  - Date Utilities (`src/utils/date-utils.ts`) - format dates for Russian locale
  - Logger (`src/utils/logger.ts`) - JSON Lines (CI) vs Colorized Text (local), Allure integration
  - API Endpoints Constants (`src/lib/api/api-endpoints.ts`) - centralized endpoint URLs

- **Fixtures**
  - API Fixtures (`src/lib/fixtures/api.fixture.ts`) - pre-initialized request contexts
  - Pages Fixtures (`src/lib/fixtures/pages.fixture.ts`) - pre-bound page objects

---

### Phase 8: Verification & Tooling Scripts (4 items)

- **verify-auth.ts** (`scripts/verify-auth.ts`)
  - Check if `admin.json` exists, parse, decode JWT, check token expiry
  - Force fresh login if expiry < 10 minutes
  - Usage: `npx ts-node scripts/verify-auth.ts`

- **Contract Verifier** (`scripts/contract-verifier.ts`)
  - Iterate through Zod schemas
  - Make test requests to Dev environment
  - Validate responses against schemas
  - Exit code 0/1

- **Component Workbench** (`playwright.config.ts` update)
  - New project: `workbench` (skips globalSetup)
  - Mounts components in blank page with `page.route()` mocks
  - Usage: `npx playwright test --project=workbench`

- **Data Setup Debugger** (`scripts/data-setup-debugger.ts`)
  - Execute `dentalVisitFlow` fixture logic standalone
  - Log generated payloads and API responses
  - Helps diagnose data creation failures

---

### Phase 9: CI/CD Infrastructure (4 items)

- **Dockerfile** (`Dockerfile`)
  - Base: `mcr.microsoft.com/playwright:v1.40.0-jammy` or newer
  - Set `LANG=ru_RU.UTF-8`
  - Copy package.json, npm ci, copy src/, entrypoint: `npx playwright test`

- **GitLab CI Configuration** (`.gitlab-ci.yml`)
  - `test_e2e` job with parallel matrix
  - Sharding formula: `--shard=$CI_NODE_INDEX/$CI_NODE_TOTAL`
  - Example: 4 shards (1/4, 2/4, 3/4, 4/4)
  - Artifacts: `allure-results` (7-day retention), `test-results/` (7 days)

- **Allure Reporter Integration** (update `playwright.config.ts`)
  - Add reporter: `['allure-playwright']`
  - Output folder: `allure-results/`
  - Attach high-severity logs (ERROR, WARN) as text attachments
  - 30-day retention for reports

- **Project Configuration Files**
  - `.env.example` - list all required environment variables
  - `.eslintrc.json` - linting rules
  - `.prettierrc` - code formatting
  - `README.md` - setup, run, troubleshoot guide

---

### Phase 10: Critical Spike Scripts (Backlog/Proof of Concept Validation)

- **probe-auth-handshake.ts** (`spikes/probe-auth-handshake.ts`)
  - Validate hybrid strategy: UI login → save state → API call with that state
  - Attempt `GET /api/v1/users/me`, expect 200

- **probe-dental-chart-dom.ts** (`spikes/probe-dental-chart-dom.ts`)
  - Navigate to patient chart, determine if SVG or Canvas
  - Log DOM structure, test click strategies

- **probe-data-formats.ts** (`spikes/probe-data-formats.ts`)
  - Use Faker to generate SNILS/Phone, POST to `/api/v1/patients`
  - Identify validation rules if API returns 400

- **probe-docker.sh** + **Dockerfile.probe** (`spikes/probe-docker.*`)
  - Build minimal container, curl test env, verify network connectivity

---

## Dependencies Summary

```
Immediate Sprint:
  Visit Service (#1)
    ↓
  API Request Manager (#2)  [parallel with #1]
    ↓
  Base Page Object (#3)     [parallel with #1, #2]
    ↓
  Custom Fixtures (#4)      [depends on #1, #3]
    ↓
  Full Visit Cycle E2E (#5) [depends on #1, #4]

Alongside:
  SNILS/OMS Factory (#6)    [no dependencies]
  Patient Zod Schema (#7)   [no dependencies]

Backlog:
  All UI Components → depends on Base Page (#3)
  Glossary Service → no dependencies
  Docker/CI → no dependencies
  Spikes → exploratory only
```

---

## Estimated Effort & Sequencing

| Task | Est. Hours | Priority | Sprint |
|------|-----------|----------|--------|
| Visit Service | 2-3 | P1 | 1 |
| API Request Manager | 3-4 | P1 | 1 |
| Base Page Object | 2-3 | P1 | 1 |
| Custom Fixtures | 2-3 | P1 | 1 |
| Full Visit Cycle E2E | 2-4 | P1 | 1 |
| SNILS/OMS Factory | 1-2 | P1 | 1 |
| Patient Zod Schema | 1-2 | P1 | 1 |
| **Sprint 1 Total** | **13-21** | | |
| Dental Chart Component | 5-7 | P2 | 2 |
| Treatment Plan Component | 4-5 | P2 | 2 |
| Visit Details Page | 3-4 | P2 | 2 |
| Other UI Components (10 items) | 15-20 | P2 | 2-3 |
| Docker & CI | 4-6 | P2 | 3 |
| Logging & Utilities | 3-4 | P3 | 3 |
| Verification Tools | 4-6 | P3 | 3 |

---

## Success Criteria for "Immediate Priorities" Completion

When all 7 items in the Immediate Priorities section are complete:

✅ All data services (Patient, Schedule, Visit) working with reliable error handling  
✅ Foundation page objects and fixtures allowing test composition  
✅ Full end-to-end smoke test passing reliably  
✅ Data factory generating valid Russian identifiers  
✅ TypeScript strict validation on all API payloads  

At this point, the **Hybrid Testing Strategy** is fully validated and the framework is ready for UI component build-out.
