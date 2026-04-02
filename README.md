# crm-tests

Playwright-based end-to-end and API test automation framework for a medical CRM system.

## Overview

This framework implements a **hybrid testing strategy**: test data is created via API, business logic is verified through the UI. This approach eliminates flakiness caused by UI-based setup and keeps execution fast.

The architecture follows a layered service-oriented model:

```
Config Manager → Auth Engine → API Services → Page Objects → Tests
```

## Stack

- [Playwright](https://playwright.dev/) — browser automation and API testing
- TypeScript — strict typing throughout
- Zod — runtime config validation
- @faker-js/faker (ru locale) — realistic Russian test data generation
- Allure — test reporting
- Docker — containerized CI execution

## Project Structure

```
src/
├── config/          # Environment-aware config loader (dev/staging)
├── lib/
│   ├── api/
│   │   └── services/    # API wrappers: PatientsService, VisitService, ScheduleService
│   ├── factories/       # Test data factories (PatientFactory, VisitFormFactory)
│   └── fixtures/        # Custom Playwright fixtures with DI
├── pages/
│   ├── auth/            # LoginPage, SmsPage
│   └── crm/             # VisitDetailsPage, DentalChart, TreatmentPlan
└── tests/
    ├── auth.setup.ts    # Global auth setup (runs once, saves storageState)
    ├── e2e/             # End-to-end smoke tests
    ├── api/             # API integration tests
    └── unit/            # Unit tests for utilities and factories
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm ci
npx playwright install chromium
```

### Configure

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
BASE_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SMS_CODE=
COMPANY_UID=
SECOND_COMPANY_NAME=
```

### Run

```bash
# Authenticate (run once to generate playwright/.auth/admin.json)
npx playwright test --project=setup

# Full test suite
npx playwright test

# Single spec
npx playwright test src/tests/e2e/smoke/api-check.spec.ts --project=chromium

# UI mode
npx playwright test --ui

# Headed debug mode
npx playwright test --headed --debug
```

## Key Patterns

### Hybrid strategy

Tests never create data through the UI. API services handle all setup so tests start from a known state instantly:

```typescript
test.beforeAll(async ({ patientsService, scheduleService, visitService }) => {
  const patient = await patientsService.create();
  const shift = await scheduleService.createShift(tomorrow);
  visit = await visitService.create(patient.id, shift);
});
```

### Global auth

Login runs once per shard via `auth.setup.ts` and stores session cookies in `playwright/.auth/admin.json`. All tests inherit the authenticated context through `storageState` — no per-test login.

### Data factories

All test payloads are generated via factories using `fakerRU`. No hardcoded test data:

```typescript
const patient = PatientFactory.createRandom();
// → realistic Russian name, phone, SNILS, OMS, passport
```

### Secret masking

The logger automatically redacts sensitive fields (`password`, `token`, `secret`, `key`) in all log output — safe for CI artifact storage.

## CI / Docker

The framework is containerized and supports parallel execution via sharding:

```yaml
# GitLab CI example
script:
  - npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

Docker base image: `mcr.microsoft.com/playwright:v1.40.0-jammy`

Allure reports are generated automatically and attached as CI artifacts.

## Architecture Notes

- **Page Objects** use regex-based selectors for i18n stability (`/Пароль|password/i`)
- **API Services** extract `accessToken` from cookies set by auth setup — no separate token management
- **Config** is validated against a Zod schema on startup; missing vars exit with code 1
- **Zero-flakiness policy**: all waits use DOM state assertions, never `waitForTimeout`
