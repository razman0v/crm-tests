# Strategy: Code-Driven LLM Pipeline ("The Inverted Agent")

**Version:** 1.0  
**Context:** Dental CRM Test Automation Framework  
**Objective:** Replace fragile, expensive "Agentic" loops with deterministic, code-first logic enhanced by focused AI reasoning.

---

## 1. Executive Summary & Goal

**The Problem:** Standard AI Agents (e.g., AutoGPT, Devin) operate in a loop: *Observe -> Think -> Act -> Repeat*. This consumes massive amounts of tokens (~1M/run), is slow due to network latency, and is prone to "hallucination loops" where the agent gets stuck trying to click a button that doesn't exist.

**The Goal:**
Achieve **"Zero-Flakiness"** and **95% Cost Reduction** by inverting the control flow. 
Instead of the AI driving the code, the **Code drives the AI**.

**Success Metrics:**
* **Token Usage:** Reduce from ~1,000,000 to ~50,000 per full suite run.
* **Reliability:** Reduce false positives (flaky tests) to < 0.1%.
* **Speed:** Execution time strictly bound by code performance, not LLM "thinking time."

---

## 2. Core Philosophy: Manager vs. Worker

We treat the architecture as a construction site:

| Role | Component | Responsibility | Characteristics |
| :--- | :--- | :--- | :--- |
| **The Worker** | **TypeScript / Playwright** | Navigation, Clicking, Typing, Math, Parsing, API Calls. | Fast (ms), Deterministic, Free (0 tokens), Dumb. |
| **The Manager** | **LLM (GPT-4o / Claude)** | Visual Verification, Root Cause Analysis, Creative Data Generation, Recovery Strategy. | Slow (s), Probabilistic, Expensive, Intelligent. |

**The Golden Rule:** > *Never ask the Manager to do what the Worker can do.*
> (e.g., Never ask the LLM to calculate a SNILS checksum. Use TypeScript code.)

---

## 3. Implementation Strategy

### Phase 1: The Foundation (The "Red Phone")
Create a unified client that allows the Code to "call" the Manager for help.

* **Action:** Create `src/utils/reasoning.client.ts`.
* **Responsibility:** specific, structured prompts (JSON mode) to prevent the LLM from rambling.
* **Key Methods:** * `verifyVisualState(image, question): boolean`
    * `generateCreativeData(context): json`
    * `healSelector(dom, brokenSelector): string`

### Phase 2: Hybrid Data Generation (The "Cyborg Factory")
Split data generation between deterministic rules and creative AI.

* **Target:** `src/lib/fixtures/patient.factory.ts`
* **Logic:**
    * **Code:** Generates SNILS (Modulo 101), Phone Numbers (Regex), Dates.
    * **LLM:** Generates "Medical History," "Patient Complaints," or "Complex Scenarios" (e.g., "A patient who is angry about a previous billing error").

### Phase 3: Visual Logic Isolation (The "Dental Chart")
Solve the "Un-selectable DOM" problem (Canvas/SVG) by moving from DOM inspection to Visual Inspection.

* **Target:** `src/pages/components/dental-chart/dental-chart.widget.ts`
* **Old Way:** XPath hell (`//svg/path[@id='tooth-18']`).
* **New Way:** 1.  **Code** navigates to the chart.
    2.  **Code** takes a screenshot of the container.
    3.  **LLM** answers: *"Is tooth 18 red?"* -> **YES/NO**.

### Phase 4: Self-Healing Automation (The Safety Net)
Prevent tests from failing due to minor UI changes (e.g., class name updates).

* **Target:** `src/pages/base.page.ts`
* **Logic:** Wrap standard Playwright actions (`click`, `fill`) in a `try/catch` block.
    * **Try:** Standard click (Fast).
    * **Catch:** Capture DOM snippet -> Ask LLM for new selector -> Retry -> Log warning for developer to fix later.

---

## 4. Architecture Diagram (Sequence of Operations)

```mermaid
sequenceDiagram
    participant TS as TypeScript (Worker)
    participant Browser as Playwright Browser
    participant LLM as Reasoning Engine (Manager)

    Note over TS, Browser: Standard Execution (Fast, Cheap)
    TS->>Browser: Navigate to /dental-chart
    TS->>Browser: Click (x:100, y:200)
    
    Note over TS, LLM: The "Consultation" Call
    TS->>Browser: Screenshot Element
    Browser-->>TS: Buffer (Image)
    TS->>LLM: "Does this image show a cavity on tooth 18?"
    LLM-->>TS: "YES"
    
    TS->>TS: Assert(true)
    Note over TS: Continue Execution