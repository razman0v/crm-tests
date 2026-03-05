# Prompt: Generate implementation_status.md

## Purpose
Create a comprehensive gap analysis comparing the Dental CRM Test Suite's planned features (from Project.md) against actual code implementation in the codebase.

## Instructions

### Step 1: Feature Extraction
Read `Project.md` and extract ALL features/requirements mentioned. Organize them by phase:
- Phase 1: Project Initialization
- Phase 2: Critical Spikes (Probes)
- Phase 3: Configuration & Auth Infrastructure
- Phase 4: API Layer & Data Services
- Phase 5: UI Components & Pages
- Phase 6: E2E Scenario Assembly
- Phase 7: Infrastructure Finalization
- Phase 8: Development Tools & Scripts (if mentioned)
- Phase 9: Documentation & Polish (if mentioned)

### Step 2: Codebase Scan
For each feature, search the workspace for:
- **Implementation Files:** Core code files in `src/`
- **Test Files:** Evidence of testing in `src/tests/`
- **Configuration:** Setup in `playwright.config.ts`, `package.json`, `tsconfig.json`
- **Infrastructure:** Docker, CI config, scripts in project root or `scripts/` folder
- **Type Files:** Entity definitions in `src/lib/entities/`
- **Service Files:** API services in `src/lib/api/services/`
- **Page Objects:** UI pages in `src/pages/`

### Step 3: Status Classification
For each feature, determine status:
- **✅ Done:** Code exists, is functional, and has proof of implementation
- **🚧 In Progress:** Partial implementation exists, or TODO comments indicate incomplete work
- **❌ Missing:** No code found or only stubs/placeholders exist

### Step 4: Proof Documentation
For each feature, cite file path and line number:
- **If Done:** `[src/path/to/file.ts](src/path/to/file.ts#L10)` — brief description of what's implemented
- **If In Progress:** `[src/path/to/file.ts](src/path/to/file.ts#L10)` — note what's incomplete
- **If Missing:** `Not found` — no code location to reference

### Step 5: Generate Report

Create a markdown file with this structure:

```markdown
# Dental CRM Test Suite - Implementation Status

**Last Updated:** [TODAY'S DATE]  
**Report Type:** Comprehensive Gap Analysis  
**Scan Scope:** All TypeScript/JavaScript files, config files, infrastructure files

---

## Executive Summary

| Metric | Count |
|--------|-------|
| ✅ Features Done | [COUNT] |
| 🚧 In Progress | [COUNT] |
| ❌ Missing | [COUNT] |
| **Overall Completion** | **[PERCENTAGE]%** |

---

## [Phase Name] ([DONE/TOTAL] ✅ or 🚧 or ❌)

| Feature | Status | Proof |
|---------|--------|-------|
| Feature Name | ✅ Done / 🚧 In Progress / ❌ Missing | [File link](path#L10) or "Not found" |
| ... | ... | ... |

---

## Milestone Completion Status

| Milestone | Phase Count | Done | Missing | % Complete |
|-----------|-------------|------|---------|------------|
| ... | ... | ... | ... | ... |

---

## Critical Path Analysis

### BLOCKING ISSUES
[List any features that block others or are high-risk]

### RECOMMENDED NEXT STEPS (Priority Order)
1. [Most urgent item with rationale]
2. [Second priority]
...

---

## Code Quality Metrics

| Metric | Target | Status |
|--------|--------|--------|
| TypeScript strict mode | Enabled | ✅ |
| Test isolation | 100% | ✅ |
| Zod schema validation | All payloads | [Status] |
| Error handling coverage | All API calls | [Status] |
| ... | ... | ... |

---

## How to Use This Report

### For Developers
1. Use "Critical Path" section to prioritize work
2. Reference "Proof" column links for code location
3. Estimated effort hours guide sprint planning

### For QA/PMs
1. "Milestone Completion Status" shows high-level progress
2. "BLOCKING ISSUES" section identifies release blockers
3. Phase completion percentages indicate readiness

### For Architects
1. "Recommended Next Steps" prioritizes architecture completion
2. "Code Quality Metrics" assesses framework maturity

---

**End of Report**
```

### Step 6: Validation Checklist

Before outputting the report:
- [ ] All phases from Project.md are included
- [ ] Each feature has a status (✅/🚧/❌)
- [ ] Each feature has proof (file link or "Not found")
- [ ] Completion percentages are mathematically accurate
- [ ] "Critical Path Analysis" identifies actual blockers
- [ ] Executive Summary counts are correct

---

## Output Constraints

- **No Duplicates:** Do not list the same feature twice
- **Accurate Links:** All file paths are workspace-relative (no backticks, use markdown links)
- **Specific Line Numbers:** When citing code, reference the exact line containing the implementation
- **Concise Proof:** Keep proof descriptions brief (1-2 sentences max)
- **Mathematical Consistency:** Ensure `Done + In Progress + Missing = Total` and percentages are accurate

---

## Example Entry

**Feature:** Config Runtime Validation (Zod Schema)  
**Status:** ✅ Done  
**Proof:** [src/config/config.schema.ts](src/config/config.schema.ts) - Zod schema validates config before return; [env-loader.ts](src/config/env-loader.ts#L25) - calls `.parse()` with error handling

---

## Success Criteria

The report should:
1. ✅ Give an accurate snapshot of project completion
2. ✅ Be immediately useful for sprint planning
3. ✅ Identify blocking issues preventing progress
4. ✅ Provide proof locations for verification
5. ✅ Be easy to update as code changes
