# Next Steps - Actionable Implementation Roadmap

**Last Updated**: February 11, 2026  
**Overall Progress**: 19% (24/131 features complete)

---

## 🚀 Immediate Priorities (Next Sprint)

### 1. Visit Service & Visit Data Types
**Status**: ❌ Missing  
**Description**: Complete the "data creation trio" (Patient ✅, Schedule ✅, Visit ❌) to unblock E2E test setup phase.

**Files to Create**:
- `src/lib/entities/visit.types.ts` - VisitDTO, VisitResponse, VisitSchema (Zod)
- `src/lib/api/services/visit.service.ts` - VisitService class with create() method

**Technical Notes**:
- VisitDTO should accept: `patientId`, `doctorId`, `shiftId` (or visit time)
- POST endpoint: `/api/v1/health/visits`
- Return: VisitResponse with `id` + construct URL: `${baseUrl}/visits/${visitId}`
- Match pattern from PatientsService: extract token from storage, set headers, validate payload with Zod
- Contract test: `src/tests/api/visit.spec.ts` - create visit and assert 201 response

**Dependencies**: 
- Patient Service (✅ exists)
- Schedule Service (✅ exists)

**Acceptance Criteria**:
- [ ] VisitSchema validates visit payload
- [ ] Service throws clear error on 4xx/5xx responses
- [ ] Contract test passes

---

### 2. Staging Environment Config
**Status**: ❌ Missing  
**Description**: Unblock staging environment testing by implementing the staging configuration loader.

**File to Create**:
- `src/config/staging.config.ts` - Mirror of dev.config.ts for staging environment

**Technical Notes**:
- Follow pattern from `src/config/dev.config.ts`
- Read from `.env` with variables: `STAGING_BASE_URL`, `STAGING_ADMIN_USERNAME`, `STAGING_ADMIN_PASSWORD`, etc.
- Update `src/config/env-loader.ts` line 12: replace error with actual staging config import
- Environment selection via `process.env.TEST_ENV='staging'`

**Dependencies**: None

**Acceptance Criteria**:
- [ ] `TEST_ENV=staging npm test` works without throwing error
- [ ] Config loader correctly routes to staging config

---

### 3. API Request Manager with Retry Logic
**Status**: ❌ Missing  
**Description**: Centralize API request handling with exponential backoff retry logic. Reduce code duplication across services.

**File to Create**:
- `src/lib/api/request-manager.ts` - ApiRequestManager class

**Technical Notes**:
- Wraps Playwright's `APIRequestContext`
- Implements retry logic:
  - Only retry on 502, 503, 504
  - Backoff formula: `wait = 100ms × 2^k` (k=0,1,2)
  - Max retries: 2
- Error handling:
  - 4xx: throw `ClientError` with URL + request/response body
  - 5xx: throw `ServerError` with details
- Auto-inject headers: `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`
- Methods: `post()`, `get()`, `patch()`, `delete()` with consistent signature

**Dependencies**: None

**Acceptance Criteria**:
- [ ] Existing services (PatientsService, ScheduleService, VisitService) refactored to use ApiRequestManager
- [ ] Unit test verifies 502 retry with correct backoff timing
- [ ] Error messages include request URL and response body
- [ ] No changes to test specs due to service refactor

---

### 4. Base Page Object Class
**Status**: ❌ Missing  
**Description**: Create foundation for all Page Objects. Standardize locator patterns, wait strategies, and common actions.

**File to Create**:
- `src/pages/base.page.ts` - BasePage class (all POM classes inherit from this)

**Technical Notes**:
```typescript
export class BasePage {
  constructor(protected page: Page, protected config: TestConfig) {}
  
  protected async goto(path: string): Promise<void> { }
  protected async waitForElement(locator: Locator, timeout?: number): Promise<void> { }
  protected async fillInput(locator: Locator, value: string): Promise<void> { 
    // wait actionable → clear → fill
  }
  protected async selectByText(locator: Locator, text: string): Promise<void> { 
    // click dropdown → find option by text → click
  }
  protected async clickAndWait(locator: Locator, waitFor: Locator): Promise<void> { }
  protected getCurrentUrl(): string { }
}
```

**Dependencies**: None

**Acceptance Criteria**:
- [ ] LoginPage refactored to extend BasePage (removes duplicate logic)
- [ ] Helper methods tested with async patterns
- [ ] No flakiness in element waits (use proper timeouts)

---

### 5. Utility Functions: SNILS & OMS Generation
**Status**: 🚧 In Progress (PatientFactory incomplete)  
**Description**: Add Russian identifier generation to PatientFactory. SNILS requires checksum calculation.

**File to Update**:
- `src/lib/fixtures/patient.factory.ts` - Add SNILS checksum + OMS generation

**Technical Notes**:
- SNILS checksum algorithm (Project.md):
  ```
  S = Σ(d_i × (10 - i)) for i=1..9
  C = S if S < 100
      else 0 if S == 100
      else S mod 101
  Result: 9 random digits + 2-digit checksum
  ```
- OMS Policy: 16-digit numeric string
- Implement helper function: `calculateSnilsChecksum(base9Digits: string): string`
- Generate passport with proper structure

**Dependencies**: None

**Acceptance Criteria**:
- [ ] 100 generated SNILSs pass modulo 101 checksum validation
- [ ] OMS policy is exactly 16 digits
- [ ] PatientFactory.createRandom() returns truly valid payloads every time
- [ ] Unit test: verify SNILS pass validation

---

### 6. Patient Zod Schema Validation
**Status**: ❌ Missing  
**Description**: Add runtime contract validation for Patient payloads. Catch data mismatches before API calls.

**File to Update**:
- `src/lib/entities/patient.types.ts` - Add PatientSchema (Zod)

**Technical Notes**:
- Add schema per Project.md specification:
  ```typescript
  export const PatientSchema = z.object({
    id: z.number().optional(),
    user: z.object({
      surname: z.string().min(1),
      name: z.string().min(1),
      patronymic: z.string().nullable().optional(),
      birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      snils: z.string().regex(/^\d{11}$/), // 11 digits
      phone: z.string().regex(/^7\d{10}$/) // Russian format
    }),
    policyOmsNumber: z.string().length(16),
    passport: z.object({
      number: z.string(),
      series: z.string()
    })
  })
  ```
- Integrate into PatientsService: `PatientSchema.parse(payload)` before POST
- Use `.safeParse()` if you want error object instead of throwing

**Dependencies**: 
- SNILS/OMS generation (#5)

**Acceptance Criteria**:
- [ ] Invalid SNILS rejected with clear error
- [ ] Truncated phone rejected
- [ ] Valid payload created in contract test passes validation
- [ ] Unit test: verify schema validation logic

---

### 7. Custom Test Fixtures (Dependency Injection)
**Status**: ❌ Missing  
**Description**: Wire services and page objects into test functions via Playwright fixtures. Bridge test specs to framework.

**File to Create**:
- `src/lib/fixtures/custom-fixtures.ts` - Custom fixtures for services + pages

**Technical Notes**:
```typescript
export const test = base.extend({
  patientService: async ({ request }, use) => {
    const service = new PatientsService(request);
    await use(service);
  },
  scheduleService: async ({ request }, use) => {
    // ...
  },
  visitService: async ({ request }, use) => {
    // ...
  },
  // Page fixtures
  loginPage: async ({ page }, use) => {
    const page = new LoginPage(page, getConfig());
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

**Advanced Fixture**: `dentalVisitFlow`
- Creates Shift → Patient → Visit in setup phase
- Returns: `{ patientId, visitId, visitUrl, doctor, shiftTime }`
- Used by tests to prepare data without manual API calls

**Dependencies**: 
- Visit Service (#1)
- Base Page Object (#4)

**Acceptance Criteria**:
- [ ] Services auto-initialized with auth context
- [ ] Page objects auto-initialized with page + config
- [ ] dentalVisitFlow fixture orchestrates full setup
- [ ] Test can use: `test('...', async ({ patientService, loginPage, dentalVisitFlow }) => { })`

---

### 8. Full Dental Visit E2E Test (Smoke)
**Status**: 🚧 In Progress (partial implementation)  
**Description**: Validate the complete hybrid strategy: API setup → UI business logic. Will expand as UI components built.

**File to Update**:
- `src/tests/e2e/smoke/api-check.spec.ts` - Rename or create `full-visit-cycle.spec.ts`

**Technical Notes**:
- Current test only creates patient, no visit setup
- **Step 1 (API)**: Use custom fixtures to create Shift, Patient, Visit
- **Step 2 (UI)**: Navigate to visit URL, instantiate VisitDetailsPage
- **Step 3 (UI)**: Change status to 'Arrived' (no Dental Chart yet—mock with page.route)
- **Step 4 (Assertion)**: Verify status badge shows 'Arrived'
- For Dental Chart/Treatment Plan: use `page.route()` to mock API responses until components built

```typescript
test('Full Dental Visit Cycle', async ({ dentalVisitFlow, visitDetailsPage }) => {
  // dentalVisitFlow handles: shift → patient → visit creation
  const { visitUrl, patientId, visitId } = await dentalVisitFlow;
  
  // UI: Navigate to created visit
  await visitDetailsPage.goto(visitUrl);
  
  // UI: Change status (minimal, no chart yet)
  await visitDetailsPage.changeStatus('Arrived');
  
  // Assertion
  expect(await visitDetailsPage.getStatusText()).toContain('Arrived');
});
```

**Dependencies**: 
- Visit Service (#1)
- Custom Fixtures (#7)
- Visit Details Page (backlog, but can mock for now)

**Acceptance Criteria**:
- [ ] Test passes 3 consecutive runs (no flakies)
- [ ] Covers critical path: create → navigate → change status
- [ ] Graceful API error handling
- [ ] Ready for UI component integration

---

### Visit Details Page Object
**Status**: ❌ Missing  
**File**: `src/pages/crm/visit-details.page.ts`

**Methods to Implement**:
- `goto(visitUrl: string)`
- `changeStatus(newStatus: string)` - click status dropdown, select option, wait for badge update
- `fillQuestionnaire(data: object)` - populate patient intake form
- `fillDiary(notes: string)` - record doctor observations
- `completeVisit()` - final submit action

**Dependent Components** (mark for Phase 3):
- Dental Chart Component (complex, SVG/Canvas interactions)
- Treatment Plan Component (dynamic grid with service additions)
- Medical Diary Component (rich text editor)
- Questionnaire Component (form with validations)

---

### Glossary Service (FK Resolution)
**Status**: ❌ Missing  
**File**: `src/lib/api/services/glossary.service.ts`

**Methods Needed**:
- `getSpecializationId(name: string)` - fetch from API, return first match ID
- `getBranchId()` - get current branch ID
- `getJobPositionId(name: string)` - parse job position from list

**Test**: `src/tests/api/glossary.spec.ts`
- Verify methods return valid IDs
- Used by EmployeeService to create doctors with correct FK references

---

### Allure Reporter Integration
**Status**: 🚧 In Progress  
**Files to Update**:
- `playwright.config.ts` - Add `['allure-playwright']` to reporters array, set output folder
- Update Logger to attach high-severity events (ERROR, WARN) to Allure

**Acceptance Criteria**:
- [ ] `allure-results/` folder generated after test run
- [ ] Failed test artifacts include logs, screenshots, traces
- [ ] Report summary shows test count and pass/fail ratio

---

## 📋 Medium-Priority Backlog (Sprint 2-3)

### UI Components (Atoms & Organisms)
All depend on Base Page Object (#4). Recommended order:

1. **InputField & SelectDropdown** (Atoms) - building blocks for all forms
2. **Dental Chart Component** (Organism) - complex, high-risk. Use `page.route()` to mock API
3. **Treatment Plan Component** (Organism) - dynamic grid, service selection
4. **Medical Diary & Questionnaire** (Organisms) - form capture
5. **Dashboard, Patient Card, SMS/Role/Branch Pages** - Auth flow enhancements

---

### Logging & Observability
**Status**: ❌ Missing  
**Files to Create**:
- `src/utils/logger.ts` - JSON Lines (CI) vs Colorized Text (local), Allure integration
- `scripts/verify-auth.ts` - Check auth state validity, JWT decode, token expiry

**Test Command**: `npm run debug:config` (add to package.json scripts)

---

## 📋 Lower-Priority Backlog (Sprint 3+)

### CI/CD Infrastructure
- **Dockerfile** - Base: `mcr.microsoft.com/playwright:v1.40.0-jammy`, `LANG=ru_RU.UTF-8`
- **.gitlab-ci.yml** - Parallel matrix with sharding formula: `--shard=$CI_NODE_INDEX/$CI_NODE_TOTAL`
- **Artifact retention** - Failed tests: 7 days (traces/videos), Allure: 30 days

### Data Generation & Utilities
- **Person/Medical Generators** - Encapsulate Faker logic
- **Date Utilities** - Russian locale formatting
- **API Endpoints Constants** - Centralized endpoint URLs

### Verification & Debugging Tools
- **Contract Verifier** (`scripts/contract-verifier.ts`) - Validate Zod schemas against Dev API
- **Component Workbench** - New Playwright project skipping globalSetup, using page.route() mocks
- **Data Setup Debugger** - Run fixture logic standalone, log payloads/responses

### Critical Spike Scripts (Optional, Low Risk now)
- `spikes/probe-auth-handshake.ts` - Already validated during setup phase
- `spikes/probe-dental-chart-dom.ts` - Defer until UI components built
- Similar probes for data formats and Docker connectivity

---

## Dependency Graph

```
Immediate Priorities (critical path):
  Visit Service (#1)
    ↓
  Custom Fixtures (#7)         API Request Manager (#3) [parallel]
    ↓                           ↓
  Full Visit E2E (#8)           Services refactor
    
Foundational (enable everything else):
  Base Page Object (#4)
    ↓
  All UI Components (backlog)

Data Quality:
  SNILS/OMS Generation (#5) →  Patient Zod Schema (#6)
    ↓
  PatientFactory confidence

Blocking Nothing:
  Staging Config (#2)
  Glossary Service
  Allure Integration
  Logging
```

---

## Sprint 1 Estimate

| Task | Hours | Priority |
|------|-------|----------|
| Visit Service + Types | 2-3h | P1 |
| Staging Config | 0.5h | P1 |
| API Request Manager | 3-4h | P1 |
| Base Page Object | 2-3h | P1 |
| SNILS/OMS Generation | 1-2h | P1 |
| Patient Zod Schema | 1h | P1 |
| Custom Fixtures | 2-3h | P1 |
| Full Visit E2E | 2-3h | P1 |
| **Total** | **14-21h** | |

**Expected Outcome**: Hybrid testing strategy fully operational. Reliable data creation + E2E navigation. Ready for UI component build-out.

---

## Implementation Order (Recommended Sequence)

1. **Visit Types & Service** (enables data creation)
2. **Staging Config** (quick win, unblocks environments)
3. **API Request Manager** (refactor all services)
4. **SNILS/OMS + Zod** (data quality infrastructure)
5. **Base Page Object** (foundation for all POM)
6. **Custom Fixtures** (wiring framework together)
7. **Full Visit E2E** (validate complete flow)

After Sprint 1 succeeds, tackle UI components in order of criticality: Dental Chart > Treatment Plan > Visit Details > Auth enhancements > Dashboard.

---

## Definition of Done (Immediate Priorities)

**Sprint 1 is complete when**:
- ✅ All 8 immediate tasks implemented and tested
- ✅ `npx playwright test` runs full suite without errors
- ✅ E2E test passes reliably (3+ consecutive runs)
- ✅ Code review complete (no TypeScript errors, proper error handling)
- ✅ Documentation updated (README, comments)

**At this point**, the framework is stable enough for team onboarding and ready for UI component integration phase.
