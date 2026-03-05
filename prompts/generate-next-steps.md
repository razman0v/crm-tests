# Prompt: Generate next_steps.md

## Purpose
Create an actionable roadmap of missing features, prioritized work items, and sprint planning guidance based on the current implementation status.

## Instructions

### Step 1: Input Requirements
You will need:
1. **Current `implementation_status.md`** — Use to identify all features with status ❌ Missing or 🚧 In Progress
2. **`Project.md`** — Reference for detailed technical requirements of each feature
3. **Project Context:**
   - Current completion percentage
   - List of completed phases
   - Known architecture patterns (hybrid testing, API-first setup, etc.)

### Step 2: Feature Extraction (Missing Items Only)

For each feature marked as ❌ Missing or 🚧 In Progress in `implementation_status.md`:

1. **Extract the requirement** from Project.md
2. **Categorize** the feature:
   - Infrastructure & DevOps (Docker, CI/CD, deployment)
   - API & Data Layer (Services, schemas, factories)
   - UI Components & Pages (Page objects, atoms, organisms)
   - Development Tools & Scripts (Debugging utilities, helpers)
   - Documentation & Onboarding (README, examples, guides)
   - Testing & QA (Test scenarios, fixtures, spikes)

3. **Document the feature:**
   - **Description:** What needs to be built (2-3 sentences)
   - **File Location:** Where the code should live
   - **Current State:** Does code exist partially? Are there TODOs?
   - **What's Missing:** Specific gaps or incomplete parts
   - **Technical Details:** Code examples, implementation hints from Project.md
   - **Dependencies:** Which other features must be done first
   - **Estimated Effort:** Time in hours (be realistic)
   - **Priority:** High/Medium/Low based on blocking status

### Step 3: Dependency & Blocking Analysis

Create a dependency map:
- Identify which features **block** other features
- Identify which features have **dependencies** on others
- Flag **critical path** items (must be done for deliverable)
- Note **nice-to-have** items that can be deferred

Example:
```
Feature A (✅ Done) → blocks → Feature B (❌ Missing) → blocks → Feature C (❌ Missing)
Feature B cannot start until A is done.
Feature C cannot start until B is done.
Therefore: Priority = [A(done), B(critical), C(depends on B)]
```

### Step 4: Sprint Roadmap Creation

Organize items into sprints based on:
- **Completion percentage** (current status)
- **Dependencies** (what unblocks what)
- **Effort** (realistic time allocation)
- **Team capacity** (assume ~40 hours/week per developer)

Typical structure:
```markdown
## 🚀 Sprint Roadmap

### Sprint N: [Theme] (Completed / In Progress / Planned)
**Timeline:** Week X-Y  
**Status:** ✅ / 🚀 / 📋  
**Goal:** [What this sprint delivers]

**High Priority (Must Complete):**
1. Feature A — X hours
2. Feature B — Y hours
...

**Lower Priority (Nice-to-Have):**
1. Feature C — X hours
...
```

### Step 5: Detailed Task Breakdown

For each **missing/incomplete feature**, create an entry with this structure:

```markdown
#### [N]. [Feature Name]

**File:** `path/to/file.ts`  
**Current State:** Exists / Does not exist / Partial (describe)  
**What's Missing:**
- Specific gap 1
- Specific gap 2
- (use bullets for clarity)

**Technical Details:**
- Implementation hints from Project.md
- Code examples if available
- Special considerations (e.g., "uses page.route for mocking")

**Dependencies:** Feature X, Feature Y (or "None")  
**Estimated Effort:** X-Y hours  
**Priority:** High / Medium / Low  
**Next Step:** One-liner action (e.g., "Create src/utils/date-utils.ts with addDays() and toISOString()")
```

### Step 6: Effort Estimation & Timeline

Create tables for:
1. **Must-Have Items (Current Sprint)**
   | # | Feature | Effort | Priority | Status |
   |---|---------|--------|----------|--------|

2. **Nice-to-Have Items**
   | # | Feature | Effort | Priority | Status |

3. **Future Sprints**
   | # | Feature | Effort | Purpose | Status |

Calculate total effort and suggest sprint allocation.

### Step 7: Execution Plan

Provide a week-by-week execution plan:
```markdown
### Week 3a (Monday-Wednesday): [Focus Area] ~ [X] hours
1. Feature A (Yh) — description
2. Feature B (Xh) — description
...

### Week 3b (Thursday-Friday): [Focus Area] ~ [X] hours
...
```

### Step 8: Validation & Acceptance Criteria

Create sections for:
1. **Validation Checklist** — Things to verify before going to production
   - [ ] Specific test passes 3x with zero flakiness
   - [ ] Docker builds successfully
   - [ ] CI pipeline works with sharding
   - ... (10+ checklist items)

2. **Production Readiness Acceptance Criteria**
   | Criterion | Target | Status |
   |-----------|--------|--------|
   | Test Execution Performance | < 10 min for full suite on 4 shards | ❌ Pending |
   | Flakiness | < 0.1% | ❌ Pending |
   | Code Coverage | All critical paths | ✅ |
   | ... | ... | ... |

### Step 9: Generate Report

Structure the markdown file:

```markdown
# Dental CRM Test Suite - Next Steps & Roadmap

**Last Updated:** [TODAY'S DATE]  
**Current Completion:** [%] ([DONE]/[TOTAL] features)  
**Report Basis:** Synced with [implementation_status.md](implementation_status.md)  
**Total Missing Features:** [COUNT]

---

## 📊 Current Status Overview

[Phase table showing all phases, status, and completion %]

---

## 🚀 Sprint Roadmap

[Sprint 1, 2, 3 summaries with goals and status]

---

## ❌ Missing Features ([N] Remaining)

### **Category A: [Category Name] ([N] items)**

#### [N]. [Feature Name]
[Details as per Step 5 template]

### **Category B: [Next Category] ([N] items)**
...

---

## 📈 Effort Estimation & Timeline

[Tables from Step 6]

---

## 🎯 Recommended Sprint [N] Execution Plan

[Week-by-week plan from Step 7]

---

## ✅ Validation Checklist

- [ ] Item 1
- [ ] Item 2
...

---

## 🚀 Production Readiness Acceptance Criteria

[Table from Step 8]

---

## 📞 Contact & Questions

- **Architecture Questions:** Refer to [Project.md](Project.md)
- **Current Status:** See [implementation_status.md](implementation_status.md)
- **Code Examples:** See [copilot-instructions.md](.github/copilot-instructions.md)

---

**Next Review Date:** [DATE + 1 WEEK]
```

---

## Output Constraints

- **Actionable Only:** Do not include features already marked ✅ Done in implementation_status.md
- **Realistic Effort:** Add 20% buffer to estimates (plan for unknowns)
- **Clear Dependencies:** Always show what blocks what
- **Specific Next Steps:** End each feature with ONE actionable line
- **No Duplicates:** Never list the same feature twice, even across categories
- **Markdown Links:** All file paths use markdown format: `[path/file.ts](path/file.ts)`, never backticks

---

## Validation Checklist (Before Output)

- [ ] All ❌ Missing features from implementation_status.md are included
- [ ] All 🚧 In Progress features are included with status updates
- [ ] Each feature has a realistic effort estimate (in hours)
- [ ] Dependencies are accurately mapped (no circular dependencies)
- [ ] Sprint roadmap shows realistic time allocation
- [ ] Execution plan breaks items into actionable 1-2 hour chunks
- [ ] Validation checklist is comprehensive and testable
- [ ] Acceptance criteria are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] All file paths are correct and workspace-relative
- [ ] Mathematical consistency: Total effort = Sum of all item efforts

---

## Example Category Structure

```markdown
### **Category A: Infrastructure & DevOps (2 items)**

#### 1. Dockerfile Production Refinement
**File:** `Dockerfile`  
**Current State:** Exists but needs hardening  
**What's Missing:**
- Multi-stage build for smaller final image
- Non-root USER for security
- HEALTHCHECK for container orchestration
- Build flag optimization (--ci, --no-cache)

**Technical Details:**
```dockerfile
# Multi-stage pattern:
FROM base AS builder
RUN npm ci
FROM base
COPY --from=builder /app/node_modules ./
USER playwright
HEALTHCHECK --interval=30s CMD npx playwright test --list
```

**Dependencies:** None  
**Estimated Effort:** 1-2 hours  
**Priority:** High (needed for CI/CD)  
**Next Step:** Review current Dockerfile; add multi-stage build pattern + healthcheck
```

---

## Success Criteria

The report should:
1. ✅ Show clear sprint structure and timeline
2. ✅ Identify all actionable work with realistic effort
3. ✅ Explain dependencies and blocking relationships
4. ✅ Provide week-by-week execution guidance
5. ✅ Include validation and acceptance criteria
6. ✅ Be easy to track progress (can mark features as Done as sprint progresses)
7. ✅ Help team understand what unblocks what
