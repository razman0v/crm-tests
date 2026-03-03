# Dental CRM Test Suite - AI Coding Agent Instructions

## Project Overview
This is a **Playwright-based end-to-end and API test suite** for a dental CRM application. Tests verify user authentication, patient management APIs, and critical workflows in a multi-company system.

## Architecture & Key Patterns

### Test Structure (Playwright)
- **Setup pattern**: `auth.setup.ts` runs first (one-time authentication), stores cookies in `playwright/.auth/admin.json`
- **Test projects**: Setup is a dependency for `chromium` project—tests only run after successful auth
- **Environments**: Currently supports `dev` (default) via `getConfig()`. Add staging/prod configs to `src/config/`

### Data Models & API Integration
- **PatientFactory** (`src/lib/fixtures/patient.factory.ts`): Generates random Russian patient data using `@faker-js/faker` with realistic phone/date formatting
- **PatientsService** (`src/lib/api/services/patients.service.ts`): Wraps Playwright's `APIRequestContext`, extracts auth token from cookies, sets required headers (`company-uid`, `Authorization`)
- **Types** (`src/lib/entities/patient.types.ts`): Defines `PatientPayload` (input) and `PatientResponse` (API response)

### Page Object Model
- **LoginPage** (`src/pages/auth/login.page.ts`): Encapsulates login UI interactions with regex-based selectors for internationalization (Russian/English labels)
- Passes `config` to pages for environment-aware selectors and credentials

### Configuration Management
- **env-loader.ts**: Single source of truth—routes to environment-specific config files
- **dev.config.ts**: Loads from `.env` with fallbacks; essential vars: `BASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `COMPANY_UID`, `SMS_CODE`

## Developer Workflows

### Run Commands
```bash
# All tests (requires auth setup)
npx playwright test

# Specific test file
npx playwright test api-check.spec.ts --project=chromium

# Setup only (authenticates without running tests)
npx playwright test --project=setup

# Watch mode with UI
npx playwright test --ui
```

### Key Files to Modify
- **Add new tests**: Create files in `src/tests/e2e/` matching `*.spec.ts`
- **Add pages**: Create new `src/pages/[feature]/*.page.ts` classes extending Playwright `Page`
- **Add services**: Create in `src/lib/api/services/` following `PatientsService` pattern (request + auth)
- **Add configs**: Extend `config` interface, create env file, update `env-loader.ts` switch statement

## Project-Specific Conventions

1. **Class-based Page Objects**: All UI interactions are encapsulated in classes with `Locator` properties and async methods
2. **Russian Language Support**: Selectors use regex patterns (`/login|email/i`, `/Пароль|password/i`) to match both Russian and English UIs
3. **Factory Pattern for Data**: Use `PatientFactory.createRandom()` instead of hardcoded test data—ensures data freshness and multi-run safety
4. **Bearer Token Auth**: API calls extract token from cookies set by auth setup; always check token existence before requests
5. **Environment-Driven Selectors**: Selectors reference `this.config.features` (e.g., `secondCompanyName`) to adapt to different deployments

## Cross-Component Communication

- **Auth Flow**: Setup phase logs in → stores cookies → tests inherit authenticated context via `storageState` in `playwright.config.ts`
- **API + UI Tests**: API service uses same cookie auth as UI tests—no separate token management needed
- **Config Injection**: Every page/service receives `config` at construction to access credentials, URLs, and feature flags

# Dental CRM Test Suite - AI Coding Agent Instructions

## Purpose
This document gives concise, actionable guidance for an AI coding agent working on the Dental CRM Playwright test framework in this repository. It merges the existing project README and the detailed architecture specification so agents can be productive immediately.

## Quick Start
- Run the global auth/setup project to generate `playwright/.auth/admin.json`:

```bash
npx playwright test --project=setup
```

- Run entire suite (uses saved auth state):

```bash
npx playwright test
```

- Run a single spec with the authenticated chromium project:

```bash
npx playwright test src/tests/e2e/smoke/api-check.spec.ts --project=chromium
```

## High-level Architecture
- Layered, service-oriented test framework: Config Manager → Auth Engine → API Request Engine → Domain Services → Page Objects → Tests
- Hybrid testing strategy: use API for state setup (Patients/Visits/Shifts) and UI for business-flow verification.

Sequence (simplified):
- Global setup performs UI login and writes `playwright/.auth/admin.json`.
- `chromium` project depends on `setup` and uses that `storageState` to run UI tests.
- Tests call API services (wrappers around Playwright `APIRequestContext`) to create test data, then navigate UI pages to validate workflows.

## Key Files & Patterns (examples)
- `playwright.config.ts`: defines `setup` and `chromium` projects and sets `storageState`.
- `src/tests/auth.setup.ts`: performs the one-time login and writes `playwright/.auth/admin.json`.
- `src/pages/auth/login.page.ts`: Page Object for login flow — uses regex selectors to support Russian/English labels.
- `src/lib/fixtures/patient.factory.ts`: generates realistic Russian patient payloads (phones, birthdays) using `@faker-js/faker`.
- `src/lib/api/services/patients.service.ts`: example of API service that extracts `accessToken` from storage state and sets headers including `company-uid`.

Conventions to follow when changing or adding code:
- Page objects are classes exposing `Locator` properties and async methods.
- Use regex-based label selectors for i18n stability (example: `page.getByLabel(/Пароль|password/i)`).
- Data factories should be used for test payloads, not hardcoded values.
- Services accept Playwright `request` context and must validate the presence of auth token before making calls.

## Configuration
- Centralized config loader: `src/config/env-loader.ts` reads `TEST_ENV` (defaults to `dev`) and returns the typed `config`.
- `src/config/dev.config.ts` pulls secrets from environment variables: `BASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `COMPANY_UID`, `SMS_CODE`, `SECOND_COMPANY_NAME`.

Runtime checks and expectations:
- If `getConfig()` cannot resolve `TEST_ENV` it throws — add new envs by editing `env-loader.ts`.
- Never commit credentials to source; rely on `.env` and CI secrets.

## Authentication Engine (Global Setup)
- Pattern: "Login once" — use `auth.setup.ts` to perform UI login (Captcha conditional) and save storage state.
- Save path: `playwright/.auth/admin.json`.
- Services and UI tests reuse the saved state; API services extract `accessToken` cookie from the state to set `Authorization: Bearer` headers.

Practical checks for auth setup:
- Ensure `admin.json` contains `accessToken`/session cookie; if missing, re-run `--project=setup`.
- The `PatientsService.getAccessToken()` helper throws a clear error when token is absent — this is deliberate and helpful for debugging.

## API Request Engine & Services
- Services are thin wrappers around `APIRequestContext`. Responsibilities:
	- Inject standard headers (`Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`, `company-uid`, `Authorization`).
	- Extract tokens from `request.storageState()` when needed.
	- Validate payloads where appropriate before POSTing (Project.md recommends Zod for runtime validation).
	- Retry transient 502/503/504 errors with exponential backoff (recommended pattern).

Example: `PatientsService.create(payload)` reads token from cookie, sets headers including `company-uid`, then POSTs to `/api/v1/patients`.

Error handling rules:
- Throw `ClientError` for 4xx with request/response details.
- Throw `ServerError` for 5xx.
- Retry on 502/503/504 with waits of 100ms * 2^k (k=0..2).

## Data Factories & Domain Models
- Use `@faker-js/faker` with localized data (`fakerRU`) to produce realistic Russian inputs — see `PatientFactory.createRandom()`.
- Ensure generated identifiers (SNILS, OMS) match server validation rules; Project.md specifies SNILS checksum algorithm and length constraints.
- Prefer builders with fluent APIs for reproducible test data during debugging (seed faker when needed).

## Page Object Model & UI Components
- Encapsulate all DOM interactions in Page Objects and lower-level components (Atoms/Organisms).
- Atoms (InputField, Select) should provide robust `fill()`/`type()` utilities (wait for actionable, clear, then fill; `type` with 50ms delay for search fields).
- For complex widgets (Dental Chart), prefer `page.route` to stub backend responses for stable tests.

## Test Implementation Patterns
- Hybrid approach: create data via API services (Patient, Shift, Visit), then navigate the UI to operate on that data.
- Tests should rely on fixtures that initialize services and pages. Example fixture flow: create patient → create visit → navigate to visit URL → assert UI state.

## Observability & Debugging
- Logging: Include Test Name and Step Name in log entries. CI runs should produce JSON Lines; local runs should be colorized text.
- Allure integration: attach high-severity logs and artifacts to Allure results.
- Retain failed-run artifacts (traces, videos, screenshots) for debugging; Project.md recommends 7 days for artifacts and 30 days for Allure reports.

## CI / Docker / Sharding
- Docker base image recommendation: `mcr.microsoft.com/playwright:v1.40.0-jammy` (or newer) — ensure `LANG=ru_RU.UTF-8` in container.
- GitLab sharding example:

```yaml
script:
	- npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

- Shard selection formula and parallel matrix are described in Project.md; use CI variables to compute shards.

## Recommended Files to Inspect When Editing
- `src/tests/auth.setup.ts` — global login flow
- `playwright/.auth/admin.json` — generated storage state
- `playwright.config.ts` — projects and `storageState` usage
- `src/pages/auth/login.page.ts` — i18n selectors and login flow
- `src/lib/fixtures/patient.factory.ts` — data generation
- `src/lib/api/services/patients.service.ts` — API service pattern

## Common Pitfalls (project-specific)
- Do not hardcode selectors that break i18n; use regex label selectors.
- Always validate that `admin.json` contains the expected tokens before running API calls.
- Respect the hybrid strategy: don't recreate data via UI when API creation is faster and less flaky.

## How AI Agents Should Operate Here
- Follow the layered responsibility model: prefer changes scoped to the layer affected (POM changes for DOM updates; services for API changes).
- When adding a new API service, mirror `PatientsService` patterns: token extraction, `company-uid` injection, and clear error messages.
- When adding tests, prefer API-first setup in `test.beforeAll` or fixtures, then single-threaded UI assertions.

## Next Steps & Extensions
- Add Zod schemas for runtime contract validation in `src/lib/entities/` and wire them into services.
- Implement `ApiRequestManager` with retry policy and centralized error types.
- Add `scripts/verify-auth.ts` and `spikes/` helpers described in Project.md for troubleshooting.

---

If you want, I can:
- Add Zod skeletons and a `verify-auth.ts` script now.
- Expand the `src/lib/api` examples to include retry logic and error classes.

Request feedback: do you want this document shorter (summary) or to keep this full merged spec as the canonical instructions for AI agents?


# Workflow for Task Completion

**Trigger Phrase:** Whenever the user says "Mark Task# [Number] as Done", execute the following workflow:

1. **Update `implementation_status.md`**:
   - Mark the specific feature as ✅ Done in the corresponding Phase table.
   - Update the **Executive Summary** table by incrementing the "Features Done" count, decrementing "Missing", and recalculating the **Overall Completion** percentage.

2. **Update `next_steps.md`**:
   - Move the completed task to the finished section.
   - Update the **Current Completion** line at the top of the file with the new percentage and fraction (e.g., `X/59`).

## Strict Rules for Status Files
- **Tool Usage**: Use the #file or edit_file capability to modify the contents directly.
- **NEVER** print or repeat the full content of any markdown status/todo file in your replies.
- **Minimal Edits**: Use workspace edit tools to make ONLY the minimal necessary line changes or additions.
- **Progress Accuracy**: Ensure the "Executive Summary" and "Current Completion" metrics are mathematically consistent after every update.
- **Short Confirmation**: After applying changes, confirm with a very short message only:
  - *Format*: "Item [X] marked as ✅ Done. Progress updated. Now on item [Y]: [brief title]"
- **No Large Blocks**: Do NOT show full file content or large markdown blocks in the chat.

## Critical Rule: Action Over Narration
- Whenever a task is marked as completed, you MUST invoke your workspace/file-editing tools (e.g., `edit_file`, `write_file`) to apply changes to `implementation_status.md` and `next_steps.md` BEFORE sending your final reply.
- DO NOT merely describe the changes you intend to make. 
- If you cannot access the file system for any reason, state the error immediately rather than pretending to update the metrics.
- Your response should only come AFTER the tool-call success confirmation.