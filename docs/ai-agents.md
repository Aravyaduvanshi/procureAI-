# AI Agent Roles & Orchestration Architecture

ProcureAI implements 5 specialized AI agent roles coordinated by a lightweight orchestrator (`services/matching/aiOrchestrator.js`).

---

## 1. Division of Labor: Deterministic vs AI Capabilities

To eliminate non-deterministic hallucinations in manufacturing procurement, operational tasks are strictly partitioned:

| Operation | Implementation Type | Responsible Layer |
| :--- | :---: | :--- |
| **Parsing raw text from PDF** | Deterministic | `documentParser.js` (`pdf-parse`) |
| **Technical parameter extraction** | Rule-Based / NLP | `requirementExtractor.js` |
| **Hard eligibility filtering** | Deterministic Boolean Logic | `scoringEngine.js` |
| **Dimensional suitability scoring** | Deterministic Mathematics | `scoringEngine.js` |
| **Candidate ranking & top-5 selection** | Deterministic Sorting | `matchingEngine.js` |
| **Vendor capability summary** | AI Agent 2 | `aiOrchestrator.summarizeSupplierIntelligence` |
| **Suitability & risk explanation** | AI Agent 3 | `aiOrchestrator.explainVendorEvaluation` |
| **Executive matching summary** | AI Agent 4 | `aiOrchestrator.generateMatchingExecutiveSummary` |
| **Negotiation tactics & draft generation** | AI Agent 5 | `aiOrchestrator.formulateNegotiationStrategy` |
| **Counteroffer policy evaluation** | Deterministic Bounds Check | `negotiationEngine.js` |
| **Human approval gating** | Strict Gatekeeper Middleware | `services/approval/controller.js` |

---

## 2. Specialized AI Roles

### Agent 1: Requirement Analysis Agent
- **Purpose:** Identifies manufacturing processes, material designations, and quality standards from RFQ documents.
- **Inputs:** Raw selectable text string from PDF parser.
- **Outputs:** Structured requirement object with identified mandatory criteria and list of ambiguous/unspecified parameters.
- **Safety Restriction:** Cannot invent missing prices, drawings, or tolerances. Must flag omissions for buyer confirmation.

### Agent 2: Supplier Intelligence Agent
- **Purpose:** Synthesizes supplier credentials, verified equipment lists, and audit history.
- **Inputs:** Supplier record from catalogue.
- **Outputs:** Verified operational summary, audit recency note, and claim confidence indicator.

### Agent 3: Vendor Evaluation Agent
- **Purpose:** Explains numerical suitability scores in clear engineering and commercial terminology.
- **Inputs:** Supplier profile + deterministic rating breakdown.
- **Outputs:** Natural language commentary, key strengths list, key risk alerts, and recommendation verdict (`RECOMMENDED_FOR_SHORTLIST` vs `PROCEED_WITH_CAUTION`).
- **Safety Restriction:** **Strictly prohibited from altering numerical dimension scores.**

### Agent 4: Supplier Matching Agent
- **Purpose:** Formulates executive matching overview for procurement heads and cross-functional teams.
- **Inputs:** Requirement specification + ranked shortlist + list of excluded vendors.
- **Outputs:** Executive headline, portfolio rationale, lead candidate endorsement, and next-step actions.

### Agent 5: Negotiation Agent
- **Purpose:** Develops multi-issue bargaining tactics, opening offer anchors, and draft supplier communications.
- **Inputs:** Supplier quote, buyer target price, batch volume, requested delivery schedule.
- **Outputs:** Anchored opening offer, tactical levers (volume batching, payment terms trade-offs), and draft RFQ email text.
- **Safety Restriction:** **Cannot execute binding commercial commitments or approve its own draft messages.**

---

## 3. Orchestration & Local Development Mode

The orchestrator inspects `process.env.ENABLE_AI` and `process.env.LLM_API_KEY`:
- When credentials are present and enabled: invokes live Google Gemini Interactions API / LLM.
- When credentials are not provided (default): runs in `DETERMINISTIC_LOCAL_MODE`, generating structured output templates that guarantee 100% platform functionality without paid API keys.
- AI mode is always explicitly labeled in response metadata and UI status badges.
