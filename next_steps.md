# Dental CRM Test Suite - Next Steps

**Last Updated:** February 12, 2026  
**Current Completion:** 45% (25/57 features)

---

## 🚀 Immediate Priorities (Next Sprint)

### 1. Visit Service (API Layer)
**Description:** Implement the Visit Service to enable API-driven creation of dental visits (patients linked to doctor appointments). This unblocks the hybrid E2E testing strategy.

**Dependencies:** Needs Patient Service + Schedule Service (already implemented)

**Technical Note:**  
- Create `src/lib/entities/visit.types.ts` with VisitDTO, VisitResponse, and Zod schema  
- Create `src/lib/api/services/visit.service.ts`  
- Method signature: `createVisit(patientId: number, doctorId: number, shiftTime: string): Promise<{id: number, url: string}>`  
- POST endpoint: `/api/v1/health/visits`  
- Return both visit ID and the constructed visit page URL  
- Follow pattern from PatientsService: extract token from storage, set headers, validate payload with Zod  

**Estimated Effort:** 2-3 hours

---

### 2. Glossary Service (API Layer)
**Description:** Implement Glossary Service for FK resolution (specializations, branches, job positions). Many create operations fail due to invalid reference IDs.

**Dependencies:** None (uses authenticated API context)

**Technical Note:**  
- Create `src/lib/api/services/glossary.service.ts`  
- Methods: `getSpecializationId(name: string)`, `getBranchId()`, `getJobPositionId(name: string)`  
- GET endpoints: `/api/v1/glossary/specializations`, `/api/v1/glossary/branches`, `/api/v1/glossary/positions`  
- Cache results to avoid repeated API calls  
- Throw descriptive error if ID not found  

**Estimated Effort:** 2-3 hours

---

### 3. Retry Logic with Exponential Backoff
**Description:** Add resilience to the API layer by implementing automatic retries for transient 502/503/504 errors. This is a critical reliability requirement.

**Dependencies:** Needs BaseService refactoring

**Technical Note:**  
- Extend `src/lib/api/services/base.service.ts`  
- Add protected method `retryWithBackoff(fn, maxRetries=3)`  
- Backoff formula: `WaitTime_k = 100ms × 2^k` (k = 0, 1, 2)  
- Retry only on 502, 503, 504; throw immediately on 4xx/5xx  
- Add logging: "Retry attempt K/3 for [endpoint]"  

**Estimated Effort:** 2-3 hours

---

### 4. Logger Utility Component
**Description:** Implement observability layer that outputs JSON Lines in CI and colorized text locally. Essential for debugging and CI artifact analysis.

**Dependencies:** None

**Technical Note:**  
- Create `src/utils/logger.ts`  
- Class `Logger` with methods: `info()`, `warn()`, `error()`, `debug()`  
- Detect `CI` env variable to switch format  
- Auto-append Test Name + Step Name to each entry  
- Redact secrets (keys containing 'pass', 'token', 'secret')  
- Later: integrate with Allure reporting  

**Estimated Effort:** 3-4 hours

---

### 5. Config Runtime Validation (Zod)
**Description:** Add Zod schema validation to TestConfig. Currently only TypeScript interfaces exist, leaving room for runtime errors.

**Dependencies:** Zod already installed

**Technical Note:**  
- Create `src/config/config.schema.ts` with `ConfigSchema` Zod definition  
- Update `src/config/env-loader.ts` to parse and validate config on load  
- Throw `ZodError` with clear field names if validation fails  
- Test: `npm run debug:config` should pass validation  

**Estimated Effort:** 1-2 hours

---

### 6. Complete PatientFactory (SNILS & OMS)
**Description:** Extend PatientFactory to generate valid SNILS (with correct checksum) and 16-digit OMS policy numbers. Current implementation is incomplete.

**Dependencies:** None

**Technical Note:**  
- Update `src/lib/fixtures/patient.factory.ts`  
- Add method `generateValidSnils(): string` (Modulo 101 checksum per Project.md spec)  
- Add method `generateOmsPolicy(): string` (16 digits, following field rules)  
- Update `createRandom()` to use these generators  
- Add unit test validating SNILS checksum  

**Estimated Effort:** 2-3 hours

---

### 7. Allure Reporter Configuration
**Description:** Wire up Allure reporting in Playwright config. Already in package.json; needs `playwright.config.ts` integration.

**Dependencies:** allure-playwright already installed

**Technical Note:**  
- Update `reporter` in `playwright.config.ts`  
- Add `allure-playwright` reporter config  
- Set output folder to `allure-results`  
- Later integrations: WARN/ERROR logs attach to Allure; traces attach on failure  

**Estimated Effort:** 1 hour

---

### 8. Visit & Glossary Contract Tests
**Description:** Implement contract tests for Visit and Glossary APIs to match existing Patient/Schedule/Branch/Employee tests.

**Dependencies:** Needs Visit Service + Glossary Service

**Technical Note:**  
- Create `src/tests/api/visit.spec.ts`  
- Create `src/tests/api/glossary.spec.ts`  
- Each test: setup minimum viable payload → POST → assert 201 + response shape  
- Use custom fixtures to auto-initialize services  

**Estimated Effort:** 2-3 hours

---

---

## 📋 Backlog (Future)

### UI Layer (Atoms & Components)

#### 9. Base Page Object Class
Create abstract base class for all Page Objects, providing common locators and helper methods.  
**File:** `src/pages/base.page.ts`  
**Details:** Properties for navigation, waits, assertions; methods for common patterns

#### 10. InputField & SelectDropdown Atoms
Low-level UI components for form inputs. InputField with fill/type utilities, SelectDropdown supporting both `<select>` and custom divs.  
**Files:** `src/pages/components/atoms/input-field.atom.ts`, `src/pages/components/atoms/select-dropdown.atom.ts`

#### 11. Dental Chart Widget (Complex Organism)
SVG/Canvas-based tooth status visualization. Critical complexity: must use `page.route` to mock responses for stable testing.  
**File:** `src/pages/components/organisms/dental-chart/dental-chart.widget.ts`  
**TODO from Project.md:** Map all 32 teeth IDs to SVG path selectors

#### 12. Tooth & Diagnosis Menu Components
Sub-components of Dental Chart. Tooth: clickable, status-aware. Diagnosis Menu: context menu for condition selection.  
**Files:** `src/pages/components/organisms/dental-chart/tooth.component.ts`, `src/pages/components/organisms/dental-chart/diagnosis-menu.component.ts`

#### 13. Treatment Plan Organism
Dynamic grid for medical services. Methods: `searchService()`, `addService()`, `transferToVisit()`.  
**File:** `src/pages/components/organisms/treatment-plan.component.ts`

#### 14. Additional UI Components
Medical Diary, Questionnaire, DatePicker, Modal, Sidebar components needed for full visit workflow.  
**Files:** Multiple files under `src/pages/components/organisms/` and `src/pages/components/atoms/`

#### 15. Auth Supplement Pages
Extend login flow with missing pages: SMS entry, Role selection, Branch selection, Auth Wizard.  
**Files:** `src/pages/auth/sms.page.ts`, `src/pages/auth/role.page.ts`, `src/pages/auth/branch.page.ts`, `src/pages/auth/auth-wizard.page.ts`

#### 16. CRM Feature Pages
Main workflow pages: Visit Details, Dashboard, Patient Card.  
**Files:** `src/pages/crm/visit-details.page.ts`, `src/pages/crm/dashboard.page.ts`, `src/pages/crm/patient-card.page.ts`

---

### E2E Test Assembly

#### 17. Custom Test Fixtures
Extend Playwright fixtures with dependency injection system. Auto-initialize all services and pages.  
**File:** `src/lib/fixtures/custom-fixtures.ts`  
**Details:** Export `test` object with auto-wired services and page objects

#### 18. Full Dental Visit Cycle E2E Test
Complete end-to-end scenario: Create patient & shift via API → Navigate visit page → Execute dental workflow (chart, treatment, questionnaire) → Complete visit.  
**File:** `src/tests/e2e/full-visit-cycle.spec.ts`  
**Assertion Points:**
- Dental Chart renders tooth data
- Treatment Plan services added and transferred
- Visit status transitions (Arrived → In Progress → Completed)
- Database reflects final state

#### 19. Fix api-check.spec.ts
Current test creates patient but has no assertions. Add status 201 + response validation.  
**File:** `src/tests/e2e/smoke/api-check.spec.ts`

---

### Infrastructure & CI/CD

#### 20. Dockerfile (Production Ready)
Build OCI image based on Playwright with Russian locale.  
**File:** `Dockerfile`  
**Key Configs:**
- Base: `mcr.microsoft.com/playwright:v1.40.0-jammy` or newer
- ENV: `LANG=ru_RU.UTF-8`
- COPY sources, install deps, set entrypoint to `npx playwright test`

#### 21. GitLab CI Configuration
CI pipeline with parallel sharding, artifact management, and Allure publishing.  
**File:** `.gitlab-ci.yml`  
**Details:**
- Matrix job: `SHARD_INDEX` [1,2,3,4] × `TOTAL_SHARDS=4`
- Script: `npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL`
- Artifacts: 7-day retention for traces/videos/screenshots; 30-day for Allure
- Report merge job for final Allure dashboard

---

### Development Tooling

#### 22. Contract Verifier Tool
CLI to detect backend breaking changes by validating API responses against Zod schemas.  
**File:** `scripts/contract-verifier.ts`  
**Logic:**
- Iterate all Zod schemas
- Make minimal test requests to Dev environment
- Exit 0 if valid, 1 if schema mismatch

#### 23. Component Workbench
Isolated Playwright project for testing UI components without full auth flow. Uses `page.route` to mock all backend calls.  
**Config:** Additional project in `playwright.config.ts`  
**Purpose:** Debug Dental Chart interactions independently of database state

#### 24. Data Setup Debugger Script
Standalone Node.js script to debug API setup phase. Logs generated payloads and responses.  
**File:** `scripts/data-setup-debugger.ts`  
**Usage:** `npx ts-node scripts/data-setup-debugger.ts` to understand fixture failures

#### 25. verify-auth.ts Script
Validate that `admin.json` has fresh, valid tokens. Useful for CI debugging.  
**File:** `scripts/verify-auth.ts`  
**Checks:**
- File exists
- Parse JSON + extract token
- Decode JWT or check expires timestamp
- Fail if expiring within 10 minutes

#### 26. npm run debug:config Command
CLI utility to print resolved (redacted) configuration.  
**Updates:** `package.json` scripts + `src/utils/config-debugger.ts`  
**Output:** Colorized, human-readable config summary with secrets masked

---

### Utility & Helper Modules

#### 27. API Endpoints Constants
Centralized enum/object of all API routes to prevent string duplication.  
**File:** `src/lib/api/api-endpoints.ts`

#### 28. Utility Modules
**Files to create:**
- `src/utils/date-utils.ts` — date formatting, arithmetic
- `src/utils/generators/person.generator.ts` — realistic person data generation
- `src/utils/generators/medical.generator.ts` — diagnoses, treatments, procedures

#### 29. Index/Export Files
**Files to create:**
- `src/lib/entities/index.ts` — re-export all type definitions
- `src/lib/api/services/index.ts` — re-export all services
- `src/lib/fixtures/index.ts` — re-export all factories and fixtures

#### 30. Swagger Models
Auto-generate TypeScript types from backend Swagger/OpenAPI spec.  
**File:** `src/lib/entities/swagger-models.ts`  
**Tool:** Use `swagger-typescript-api` or hand-curate from API docs

---

### Project Configuration Files

#### 31. Environment Example File
**File:** `.env.example`  
**Contents:** Template with all required variables (BASE_URL, ADMIN_USERNAME, etc.) without secrets

#### 32. ESLint Configuration
**File:** `.eslintrc.json`  
**Rule Set:** Strict TypeScript, forbid `any`, enforce naming conventions

#### 33. Prettier Configuration
**File:** `.prettierrc`  
**Settings:** 2-space indent, single quotes, trailing commas

#### 34. README.md
**Contents:**
- Quick start (Install, Configure, Run)
- Architecture overview diagram
- Troubleshooting guide (common failures, how to debug)
- Contributing guidelines

---

### Spikes / Proof-of-Concept Probes

#### 35. Spike: Auth Handshake
**File:** `spikes/probe-auth-handshake.ts`  
**Purpose:** Verify that cookies saved in `admin.json` can be reused for API calls

#### 36. Spike: Dental Chart DOM & Selectors
**File:** `spikes/probe-dental-chart-dom.ts`  
**Purpose:** Determine optimal locator strategy (CSS selectors vs SVG paths vs coordinates)

#### 37. Spike: Data Format Validation
**File:** `spikes/probe-data-formats.ts`  
**Purpose:** Test if generated patient/shift payloads match backend validation rules

#### 38. Spike: Docker Networking
**File:** `spikes/probe-docker.sh`  
**Purpose:** Verify container can reach test environment URLs; validate locale setup

---

## 📊 Blockers & Dependencies

| Task | Blocks | Status |
|------|--------|--------|
| Visit Service | E2E test assembly | ⏸️ Ready to start |
| Glossary Service | Reliable test data | ⏸️ Ready to start |
| Logger component | Observability + Allure integration | ⏸️ Ready to start |
| Retry logic | Flaky test reduction | ⏸️ Ready to start |
| UI components | E2E scenario | ⏳ Large; start after #1-4 |
| E2E test assembly | Deliverable demo | ⏳ Depends on Visit Service + UI |
| Docker + CI | Production deployment | ⏳ Lower priority; after #18 |

---

## 🎯 Prioritization Rationale

**Immediate Sprint Focus:**  
Tasks #1-8 are **API & infrastructure layer** items:
- Small/medium scope (2-4 hrs each)
- Unblock E2E testing (Visit Service)
- Improve reliability (Retry logic)
- Enable debugging (Logger, Config validation)
- Complete critical coverage (Glossary, Visit contract tests)
- Approx. 18-24 hours total

**Backlog Strategy:**  
- **UI Layer (#9-19):** Largest effort block. Start after API layer is stable. Can be parallelized (team splits atoms, organisms, pages).
- **Tooling (#22-26):** Enhances DX but not blocking tests. Implement after core suite passes.
- **Config Files (#31-34):** Setup work; do incrementally as other tasks finalize.
- **Spikes (#35-38):** Optional risk mitigation; run if uncertain about Dental Chart DOM or Docker setup.

---

## ✅ Implementation Checklist

Use this to track progress:

```
Immediate Sprint:
[ ] 1. Visit Service
[ ] 2. Glossary Service
[ ] 3. Retry Logic
[ ] 4. Logger Utility
[ ] 5. Config Zod Validation
[ ] 6. PatientFactory SNILS/OMS
[ ] 7. Allure Configuration
[ ] 8. Visit & Glossary Contract Tests

UI & E2E:
[ ] 9-16. UI Components & Pages
[ ] 17. Custom Fixtures
[ ] 18. Full E2E Test
[ ] 19. Fix api-check.spec.ts

Infra & Tooling:
[ ] 20-26. Docker, CI, Scripts
[ ] 27-34. Utilities & Config

Spikes:
[ ] 35-38. Proof-of-Concept Probes
```

---

## 📝 Notes

- **Staging Config:** `env-loader.ts` line 12 currently throws "not implemented yet"—can be a low-priority backlog item or part of #31-34.
- **TODO Markers in Code:** Project.md specifies "Define the exact selector for the 'Login Success' indicator" and "Map all 32 teeth IDs to SVG path selectors"—these become concrete tasks during #11-12 implementation.
- **Test Observability:** Once Logger (#4) is complete, integrate it into BaseService and custom fixtures for rich debugging output.
