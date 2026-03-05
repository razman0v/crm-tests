# Dental CRM Test Suite - Next Steps & Roadmap

**Last Updated:** March 5, 2026  
**Current Completion:** 69.2% (54/78 features fully implemented)  
**Report Basis:** Synced with [implementation_status.md](implementation_status.md)  
**Total Missing Features:** 24 items remaining to target 100% completion

---

## � Current Status Overview

| Phase | Description | Status | Completion |
|-------|-------------|--------|------------|
| **Phase 1** | Project Initialization | ✅ Done | 5/5 (100%) |
| **Phase 2** | Critical Spikes (Probes) | ✅ Done | 4/4 (100%) |
| **Phase 3** | Configuration & Auth | ✅ Done | 6/6 (100%) |
| **Phase 4** | API Layer & Services | ✅ Done | 16/16 (100%) |
| **Phase 5** | UI Components & Pages | ✅ Done | 17/17 (100%) |
| **Phase 6** | E2E Scenarios | ✅ Done | 6/6 (100%) |
| **Phase 7** | Infrastructure & CI/CD | 🔄 In Progress | 8/14 (57%) |
| **Phase 8** | Development Tools & Scripts | ❌ Missing | 0/10 (0%) |
| **Phase 9** | Documentation & Polish | ❌ Missing | 0/6 (0%) |

---

## 🚀 Sprint Roadmap

### **Sprint 1: Foundation Complete (Completed)**
**Timeline:** Weeks 1-2 (40+ hours invested)  
**Status:** ✅ **DELIVERED**

**Deliverables:**
- ✅ Full API layer with 8 services (Patients, Schedule, Shifts, Visits, Branches, Employees, Glossary, Auth)
- ✅ Type-safe config system with Zod validation
- ✅ Observability layer (Logger with secret masking, Allure integration)
- ✅ 17 Page Objects covering all UI flows (Auth, CRM, Components)
- ✅ E2E test scenarios (Auth workflow, Full visit cycle, API contracts)
- ✅ Docker image foundation with Russian locale

**Key Achievement:** Hybrid testing strategy fully operational (API setup + UI verification)

---

### **Sprint 2: Production Readiness (Current Sprint)**
**Timeline:** Week 3 (15-20 hours estimated)  
**Status:** 🚀 **IN PROGRESS**  
**Goal:** Complete infrastructure, tooling, and documentation for production deployment

**High Priority (Must Complete):**
1. **Dockerfile Refinement** (Production-grade OCI image) — 2 hours
2. **GitLab CI Configuration** (Parallel sharding, artifact retention) — 3 hours
3. **Debug Scripts** (config-debugger, verify-auth, contract-verifier) — 4 hours
4. **Utility Modules** (Date utils, Generators) — 3 hours
5. **.env.example Template** (Onboarding & secrets management) — 1 hour

**Lower Priority (Nice-to-Have):**
- ESLint & Prettier config
- Component Workbench (isolated testing)
- Enhanced README with architecture diagrams

---

### **Sprint 3: Production Go-Live (Week 4)**
**Timeline:** Week 4 (5-10 hours)  
**Status:** 📋 **PLANNED**  
**Goal:** Final validation, CI/CD verification, team onboarding

**Activities:**
- Run full test suite 3x to verify zero flakiness
- Execute Docker build and CI pipeline locally
- Document troubleshooting guide for common failures
- Record demo video of test execution

---

## ❌ Missing Features (24 Remaining)

### **Category A: Infrastructure & DevOps (2 items)**

#### 1. Dockerfile Production Refinement
**File:** `Dockerfile`  
**Current State:** Basic structure exists; needs hardening  
**What's Missing:**
- Optimize layer caching (node_modules should not rebuild on code changes)
- Add health check for Docker containers
- Configure proper signal handling (SIGTERM → graceful shutdown)
- Add build args for flexible base image versioning

**Technical Details:**
```dockerfile
# Missing: Multi-stage build for smaller final image
# Missing: USER playwright (non-root for security)
# Missing: HEALTHCHECK (for container orchestration)
# Missing: --ci and --no-cache flags optimization
```

**Dependencies:** None  
**Estimated Effort:** 1-2 hours  
**Priority:** High (needed for CI/CD)  
**Next Step:** Review current Dockerfile; add multi-stage pattern + healthcheck
---

#### 2. GitLab CI Pipeline (.gitlab-ci.yml)
**File:** `.gitlab-ci.yml`  
**Current State:** Does not exist  
**What's Missing:**
- Parallel job matrix for test sharding (4+ concurrent runners)
- Artifact retention policy (7 days for test results, 30 days for Allure reports)
- Merge strategy to combine shard results into single Allure report
- Deployment gate (only deploy if all tests pass)

**Technical Details:**
```yaml
# Multi-shard execution
test_e2e:
  parallel:
    matrix:
      - SHARD_INDEX: [1, 2, 3, 4]
        TOTAL_SHARDS: 4
  script:
    - npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL

# Artifacts: retain failed traces for debugging
artifacts:
  paths:
    - test-results/
    - allure-results/
  reports:
    junit: test-results/junit.xml
  expire_in: 7 days
  when: on_failure
```

**Dependencies:** Dockerfile must be functional  
**Estimated Effort:** 2-3 hours  
**Priority:** High (unblocks CI/CD)  
**Next Step:** Create .gitlab-ci.yml with sharding matrix + artifact config

---

### **Category B: Development Tools & Scripts (4 items)**

#### 3. npm run debug:config Script
**File:** `src/utils/config-debugger.ts`  
**Current State:** Does not exist  
**What's Missing:**
- Utility script to print resolved (redacted) configuration
- Used for troubleshooting environment setup

**Technical Details:**
```bash
npx ts-node src/utils/config-debugger.ts

# Output (example):
# ✅ Config Resolved Successfully
# Environment: dev
# Base URL: http://localhost:3000
# Company UID: comp-abc123
# Features:
#   - smsEnabled: true
#   - captchaEnabled: false
#   - multiCompanySupport: true
# Credentials: (masked)
#   - username: admin@example.com
#   - password: ****
#   - smsCode: ****
```

**Dependencies:** Config system already complete  
**Estimated Effort:** 1 hour  
**Priority:** Medium (development experience)  
**Next Step:** Create src/utils/config-debugger.ts; add npm script to package.json

---

#### 4. scripts/verify-auth.ts (Token Freshness Validation)
**File:** `scripts/verify-auth.ts`  
**Current State:** Does not exist  
**What's Missing:**
- Standalone script to validate `playwright/.auth/admin.json`
- Checks token expiry and validity
- Used as CI pre-check before running tests

**Technical Details:**
```bash
npx ts-node scripts/verify-auth.ts

# Checks:
# 1. File exists at playwright/.auth/admin.json
# 2. Parse JSON and extract tokens
# 3. Check JWT expiry (if JWT) or cookie expiry
# 4. If expiring within 10 mins: return error code 1 (force refresh)
# 5. Otherwise: return 0 (valid)

# Exit codes:
# 0 = Auth is fresh and valid
# 1 = Auth expired or missing (requires re-run of --project=setup)
```

**Dependencies:** Auth setup (already complete)  
**Estimated Effort:** 1.5 hours  
**Priority:** Medium (CI reliability)  
**Next Step:** Create scripts/verify-auth.ts with JWT/cookie validation logic

---

#### 5. scripts/contract-verifier.ts (API Contract Validation)
**File:** `scripts/contract-verifier.ts`  
**Current State:** Does not exist  
**What's Missing:**
- CLI tool to detect breaking changes in backend API before running tests
- Iterates through all Zod schemas and validates API responses
- Acts as early warning system for API contract violations

**Technical Details:**
```bash
npx ts-node scripts/contract-verifier.ts

# Workflow:
# 1. For each service (Patient, Schedule, Visit, etc.)
#    a. Make test GET request to list endpoint
#    b. Take first response object
#    c. Validate against Zod schema
#    d. Report any mismatches
# 2. Exit with code 0 (all valid) or 1 (schema mismatch found)
# 3. Print detailed error messages for debugging

# Output (example):
# ✅ PatientSchema validation passed
# ❌ ScheduleSchema validation failed
#    Expected: dateFrom (string, ISO format)
#    Received: dateFrom (number, epoch ms)
```

**Dependencies:** All Zod schemas (already complete)  
**Estimated Effort:** 2-3 hours  
**Priority:** Medium (contract safety)  
**Next Step:** Create scripts/contract-verifier.ts with schema iteration + validation

---

#### 6. Component Workbench (Isolated Testing Project)
**File:** Additional Playwright project in `playwright.config.ts`  
**Current State:** Not configured  
**What's Missing:**
- New Playwright project for testing UI components in isolation
- No auth setup required; uses `page.route` to mock backend
- Enables rapid iteration on complex widgets (Dental Chart, Treatment Plan)

**Technical Details:**
```typescript
// In playwright.config.ts, add new project:
{
  name: 'workbench',
  use: {
    ...devices['chromium'],
    baseURL: 'http://localhost:3000',
  },
  testMatch: '**/workbench/**/*.spec.ts',
  // No dependencies; no storageState
}

// Test example (workbench/dental-chart-interactive.spec.ts):
test('Dental Chart - tooth selection flow', async ({ page }) => {
  // Mock API: intercept backend requests
  await page.route('**/api/v1/**', route => {
    // Return mock response or abort
  });
  
  // Navigate to patient visit page
  await page.goto('/visits/123');
  
  // Test without needing real database state
  const toothElement = page.locator('[data-tooth-id="18"]');
  await toothElement.click();
  await expect(toothElement).toHaveClass('selected');
});
```

**Dependencies:** All UI components (already complete)  
**Estimated Effort:** 1.5-2 hours  
**Priority:** Low (nice-to-have for development velocity)  
**Next Step:** Add 'workbench' project to playwright.config.ts; create sample tests

---

### **Category C: Utility Modules (2 items)**

#### 7. Utility Modules: Date & Generator Functions
**File:** 
- `src/utils/date-utils.ts` (Date arithmetic, formatting)
- `src/utils/generators/person.generator.ts` (Russian person data)
- `src/utils/generators/medical.generator.ts` (Medical data)

**Current State:** Do not exist  
**What's Missing:**
- Date arithmetic helpers: `addDays(date, 5)`, `subtractMonths(date, 1)`, `getWeekday(date)`, etc.
- Russian person name generation: realistic FIO, patronymic, phone formatting
- Medical data generation: diagnoses, treatments, procedures, medical conditions

**Technical Details:**
```typescript
// date-utils.ts
export function addDays(date: Date, days: number): Date { }
export function toISOString(date: Date): string { } // YYYY-MM-DD
export function getWeekday(date: Date): string { } // 'Monday', 'Вторник', etc.
export function isoToDate(iso: string): Date { }

// person.generator.ts
export function generateRussianName(): { first: string, last: string, patronymic: string }
export function generatePhoneNumber(format?: 'ru_RU'): string // +7-XXX-XXX-XX-XX
export function generateSnils(): string // Valid SNILS with checksum

// medical.generator.ts
export function generateDiagnosis(): string // Random ICD-10 code + name
export function generateTreatment(): string // Tooth treatment type
export function generateProcedure(): string // Medical procedure name
```

**Dependencies:** None (optional enhancement for factories)  
**Estimated Effort:** 2-3 hours  
**Priority:** Low (factories work without these; improves data variety)  
**Next Step:** Create utility modules as optional enhancement post-Sprint 2

---

#### 8. API Endpoints Constants Enhancement
**File:** `src/lib/api/api-endpoints.ts`  
**Current State:** Basic enum exists  
**What's Missing:**
- Add query parameter builders: `buildUrl(endpoint, params)`
- Document each endpoint with HTTP method, request/response types
- Add endpoint grouping by resource (Patients, Schedule, etc.)

**Technical Details:**
```typescript
// Current: Just endpoint strings
// Missing: Query param builders + full JSDoc

export const API_ENDPOINTS = {
  PATIENTS: {
    CREATE: '/api/v1/patients',
    LIST: '/api/v1/patients',  // GET with query params
    GET: (id: number) => `/api/v1/patients/${id}`,
    UPDATE: (id: number) => `/api/v1/patients/${id}`,
    DELETE: (id: number) => `/api/v1/patients/${id}`,
  },
  // ... more resources
} as const;

// Helper function (missing)
export function buildEndpointUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  const url = new URL(endpoint, 'http://localhost');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.pathname + url.search;
}
```

**Dependencies:** None (enhancement to existing file)  
**Estimated Effort:** 1 hour  
**Priority:** Very Low (cosmetic improvement)  
**Next Step:** Optional post-Sprint 2 refactor

---

### **Category D: Documentation & Onboarding (6 items)**

#### 9. .env.example Template File
**File:** `.env.example`  
**Current State:** Does not exist  
**What's Missing:**
- Template file showing all required environment variables
- Helps new developers understand what to set up locally

**Technical Details:**
```bash
# .env.example
BASE_URL=http://localhost:3000
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=super_secret_password
COMPANY_UID=company-uuid-here
SMS_CODE=123456
SECOND_COMPANY_NAME=ООО Стоматология
```

**Dependencies:** None  
**Estimated Effort:** 30 mins  
**Priority:** High (onboarding blocker)  
**Next Step:** Create .env.example with comments

---

#### 10. ESLint Configuration
**File:** `.eslintrc.json` or `eslint.config.js`  
**Current State:** Does not exist  
**What's Missing:**
- Linting rules for code quality
- Catches common errors (unused variables, undefined symbols, etc.)
- Enables `npm run lint` command

**Technical Details:**
```json
// .eslintrc.json (or similar)
{
  "extends": ["eslint:recommended"],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Dependencies:** eslint package (install if needed)  
**Estimated Effort:** 1 hour  
**Priority:** Low (code quality; optional for MVP)  
**Next Step:** Create ESLint config; add lint script to package.json

---

#### 11. Prettier Configuration
**File:** `.prettierrc.json`  
**Current State:** Does not exist  
**What's Missing:**
- Code formatting configuration
- Ensures consistent style across team

**Technical Details:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Dependencies:** prettier package (install if needed)  
**Estimated Effort:** 30 mins  
**Priority:** Low (cosmetic; optional for MVP)  
**Next Step:** Create Prettier config; add format script to package.json

---

#### 12. Enhanced README with Architecture Diagram
**File:** `README.md`  
**Current State:** Basic README exists  
**What's Missing:**
- Architecture diagram (Mermaid)
- Troubleshooting guide for common issues
- Performance baseline metrics
- Team onboarding checklist

**Technical Details:**
```markdown
## Architecture Overview

[Mermaid diagram showing layers: Config → Auth → API Services → Page Objects → Tests]

## Performance Baseline
- Single test execution: ~15-30s
- Full suite (N=54 tests): ~30 mins on single runner
- With 4 shards: ~8-10 mins total

## Troubleshooting
- Auth fails: Check admin.json exists and token is fresh
- API 401 errors: Re-run --project=setup
- Flaky selectors: Use page.locator with role-based selectors
```

**Dependencies:** None  
**Estimated Effort:** 2 hours  
**Priority:** Medium (documentation)  
**Next Step:** Enhance README post-Sprint 2

---

#### 13. Disk Artifact Retention Policy Documentation
**File:** Section in README or CI documentation  
**Current State:** Not documented  
**What's Missing:**
- Explain artifact retention strategy (7 days for tests, 30 days for reports)
- Document how to access archived test results
- Guidelines for debugging production failures from artifacts

**Dependencies:** None  
**Estimated Effort:** 1 hour  
**Priority:** Low (administrative)  
**Next Step:** Document in GitLab CI section post-deployment

---

#### 14. Data Setup Debugger Script
**File:** `scripts/data-setup-debugger.ts`  
**Current State:** Does not exist  
**What's Missing:**
- Standalone script to debug test data creation
- Isolates whether failures come from "API setup" or "UI interaction"

**Technical Details:**
```bash
npx ts-node scripts/data-setup-debugger.ts

# Workflow:
# 1. Load config and authenticate
# 2. Create Patient via PatientFactory → POST → log payload + response
# 3. Create Shift → log payload + response  
# 4. Create Visit → log payload + response
# 5. Report any failures with full error details
# 6. Print timing metrics (how long each step takes)
```

**Dependencies:** All API services (already complete)  
**Estimated Effort:** 1.5-2 hours  
**Priority:** Low (debugging aid; optional)  
**Next Step:** Create post-Sprint 2 if needed

---

---

## 📈 Effort Estimation & Timeline

### Sprint 2 Must-Have (Current Sprint)
| # | Feature | Effort | Owner | Status |
|---|---------|--------|-------|--------|
| 1 | Dockerfile Refinement | 2h | DevOps | ❌ Not Started |
| 2 | GitLab CI (.gitlab-ci.yml) | 3h | DevOps | ❌ Not Started |
| 3 | debug:config Script | 1h | DevTools | ❌ Not Started |
| 4 | verify-auth Script | 1.5h | DevTools | ❌ Not Started |
| 5 | contract-verifier Script | 2h | QA | ❌ Not Started |
| 9 | .env.example Template | 0.5h | Onboarding | ❌ Not Started |
| **Total** | | **~10 hours** | | |

### Sprint 2 Nice-to-Have
| # | Feature | Effort | Priority | Status |
|---|---------|--------|----------|--------|
| 6 | Component Workbench | 2h | Low | ❌ Not Started |
| 7 | Date/Generator Utils | 3h | Low | ❌ Not Started |
| 12 | Enhanced README | 2h | Medium | ❌ Not Started |
| 10-11 | ESLint + Prettier | 1.5h | Very Low | ❌ Not Started |

### Sprint 3 (Future)
| # | Feature | Effort | Purpose | Status |
|---|---------|--------|---------|--------|
| 8 | API Endpoints Enhancement | 1h | Code cleanup | ❌ Not Started |
| 13-14 | Documentation + Debugger | 3h | Operational | ❌ Not Started |

---

## 🎯 Recommended Sprint 2 Execution Plan

### Week 3a (Monday-Wednesday): Infrastructure ~ 5 hours
1. **Dockerfile Refinement** (2h)
   - Add multi-stage build
   - Add healthcheck
   - Optimize caching
   
2. **Start GitLab CI** (1h)
   - Create .gitlab-ci.yml skeleton
   - Set up parallel matrix for 4 shards
   
3. **Debug Scripts - Part 1** (2h)
   - debug:config Script
   - verify-auth Script

### Week 3b (Thursday-Friday): Tooling & Docs ~ 5 hours
1. **Complete GitLab CI** (2h)
   - Finish artifact retention config
   - Add merge job for Allure report

2. **Debug Scripts - Part 2** (2h)
   - contract-verifier Script
   - .env.example template

3. **Optional: Component Workbench** (1h)
   - If time permits, add workbench project

---

## ✅ Validation Checklist (Before Going to Production)

- [ ] `npx playwright test` passes 3x in a row (zero flakiness)
- [ ] Docker image builds successfully: `docker build -t dental-crm-tests .`
- [ ] Local CI simulation passes: `npx playwright test --shard=1/4` (and 2/4, 3/4, 4/4)
- [ ] Allure report generates: `allure serve allure-results`
- [ ] `npm run debug:config` outputs redacted configuration
- [ ] `npx ts-node scripts/verify-auth.ts` detects fresh auth
- [ ] `npx ts-node scripts/contract-verifier.ts` validates all schemas
- [ ] `.env.example` exists and documents all required variables
- [ ] README includes troubleshooting guide
- [ ] All team members can run `npm install && npx playwright test --project=setup` successfully

---

## 🚀 Production Readiness Acceptance Criteria

**Delivery: End of Week 3**

| Criterion | Target | Status |
|-----------|--------|--------|
| Test Execution Performance | < 10 min for full suite on 4 shards | ❌ Pending measurement |
| Flakiness | < 0.1% (1 flake per 1000 runs) | ❌ Pending validation |
| Code Coverage | All critical paths covered | ✅ (See implementation_status.md) |
| Documentation | README + architecture docs complete | ❌ Pending |
| CI/CD Pipeline | Tests run on every push; sharding works | ❌ Pending .gitlab-ci.yml |
| One-Command Setup | `npm install && npm test` works for all developers | ✅ (Config system complete) |

---

## 📞 Contact & Questions

- **Architecture Questions:** Refer to [Project.md](Project.md)
- **Current Status:** See [implementation_status.md](implementation_status.md)
- **Code Examples:** See [copilot-instructions.md](.github/copilot-instructions.md)

---

**Next Review Date:** March 10, 2026 (End of Sprint 2)

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
| 10 | Atom Components (Input, Select) | ✅ Done | #11-16 | #9 |
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
- **Track A:** #9-10 (BasePage + Atoms) → [blocker resolve] → #11-12 (Dental Chart) → #13-14 (other organisms)
- **Track B:** #15 (Auth pages) + #16 (CRM pages) → requires A's output from #9
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
[✅] 2. Add Zod validation to config (config.schema.ts)
[✅] 3. Implement Logger utility component (dual-format output)
[✅] 4. Create Patient Zod Schema + type definitions
[✅] 5. Configure Allure reporter (playwright.config.ts)
[✅] 6. All API Services: Patient, Schedule, Branch, Employee, Visit, Glossary
[✅] 7. All API Integration Tests (glossary, patient, shift, branch, employee)
[✅] 8. Create staging environment config (staging.config.ts)
```

### Phase 2: Risk Mitigation & Polish (✅ COMPLETE)
```
[✅] 6. Execute Critical Spikes (auth handshake, dental chart DOM, data formats, docker)
[✅] 7. Create API Endpoints Constants (api-endpoints.ts)
[✅] 8. Create Barrel Exports (entities/index.ts, services/index.ts, fixtures/index.ts)
```

### Phase 3: UI Layer & E2E (❌ CRITICAL PATH - BLOCKING PHASE 4)
```
[✅] 9. Create BasePage abstract class
[✅] 10. Create Atom components (InputField, SelectDropdown)
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

