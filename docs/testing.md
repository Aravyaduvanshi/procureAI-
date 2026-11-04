# Automated Testing Suite & Verification Report

ProcureAI includes a comprehensive automated test suite implemented using Node.js's native test runner (`node:test` and `node:assert/strict`).

The test suite runs **100% offline**, requires **zero paid external API access**, and executes in **under 1 second**.

---

## 1. Test Architecture & Coverage

```
backend/tests/
├── unit/
│   ├── supplierCatalogue.test.js          (6 tests)
│   ├── requirementParsing.test.js         (7 tests)
│   ├── vendorRatingAndMatching.test.js     (7 tests)
│   ├── approvals.test.js                  (4 tests)
│   └── negotiation.test.js                (6 tests)
└── integration/
    └── endToEndWorkflow.test.js           (10 tests)
```

### Coverage by Domain
1. **Supplier Catalogue (`supplierCatalogue.test.js`):**
   - Valid supplier record checks.
   - Missing required fields validation.
   - Duplicate supplier ID detection.
   - Multi-parameter filtering (process, material, lead time).
   - Sensitive contact details redaction for unauthenticated views.
2. **Requirement Parsing (`requirementParsing.test.js`):**
   - Text-based PDF extraction against `Sample_Procurement_Requirement_Vadodara.pdf`.
   - Invalid file format and file size limits (>10MB).
   - Empty buffer handling.
   - Unspecified fields detection without silent invention.
   - Scanned / image-only PDF detection and `OCR_REQUIRED` flagging.
3. **Vendor Rating & Matching (`vendorRatingAndMatching.test.js`):**
   - Exact and partial capability matches.
   - Hard eligibility disqualifications (missing processes, incompatible materials, excessive MOQ).
   - Dimension score calculations summing to 1.0.
   - Top-5 ranking descending by suitability score.
   - Prevention of artificial padding when fewer than 5 suppliers qualify.
4. **Governance Approvals (`approvals.test.js`):**
   - Durable buyer approval recording.
   - Duplicate approval prevention on identical proposal versions.
   - Rejection recording with mandatory rationale.
   - Action type validation.
5. **Negotiation Engine (`negotiation.test.js`):**
   - Permitted vs illegal state transitions across negotiation lifecycle.
   - Counteroffer policy evaluation (favorable, split-the-difference, and cap violation).
   - Strict block on external communication when session is unapproved.
6. **End-to-End Workflow (`endToEndWorkflow.test.js`):**
   - Tests the complete 10-step journey from PDF upload to finalized agreement signoff.

---

## 2. Test Execution Command & Actual Results

### Run Command:
```bash
cd backend
npm test
```

### Actual Test Suite Execution Output:
```text
> backend@1.0.0 test
> node --test tests/**/*.test.js

[SupplierRepo] Loaded and validated 20 synthetic suppliers.
[Communication] Running in safe mock/draft-only mode (external sending disabled).

▶ ProcureAI End-to-End Autonomous Procurement Journey
  ✔ Step 1: Upload and parse procurement requirement document (60.04ms)
  ✔ Step 2: Buyer reviews and confirms structured requirements (1.81ms)
  ✔ Step 3: Execute supplier matching and deterministic ranking against 20-supplier catalogue (16.10ms)
  ✔ Step 4: Buyer inspects recommendations and approves shortlist in Governance Gate (7.35ms)
  ✔ Step 5: Create stateful negotiation session with commercial limits (3.36ms)
  ✔ Step 6: Formulate AI negotiation strategy and draft opening offer (4.67ms)
  ✔ Step 7: Buyer approves negotiation strategy and commercial limits (2.05ms)
  ✔ Step 8: Buyer approves message draft for sending (4.19ms)
  ✔ Step 9: Dispatch message via safe draft-only communication provider and advance state to WAITING_FOR_SUPPLIER (6.62ms)
  ✔ Step 10: Inbound supplier counteroffer evaluated and final agreement authorized (20.14ms)
✔ ProcureAI End-to-End Autonomous Procurement Journey (128.67ms)

▶ Approval Service & Governance Gate Suite
  ✔ should record an explicit buyer approval decision and persist to durable store (2.82ms)
  ✔ should prevent duplicate approvals for the same proposal and version (0.18ms)
  ✔ should validate action types and reject unsupported actions (0.22ms)
  ✔ should record a rejection with documented justification (0.78ms)
✔ Approval Service & Governance Gate Suite (4.77ms)

▶ Negotiation Engine & Policy Enforcement Suite
  ✔ should validate legal state transitions across negotiation lifecycle (0.42ms)
  ✔ should reject illegal state transitions (e.g. attempting to send while still in DRAFT) (0.14ms)
  ✔ should evaluate counteroffer within target as highly favorable (0.58ms)
  ✔ should recommend splitting the difference when counteroffer is within the reservation limit but above target (0.09ms)
  ✔ should strictly escalate and block autonomous acceptance when supplier exceeds authorized reservation cap (0.08ms)
  ✔ should strictly block external communication if negotiation is not in APPROVED_TO_SEND state (0.75ms)
✔ Negotiation Engine & Policy Enforcement Suite (2.75ms)

▶ Requirement Document Parsing & Extraction Suite
  ✔ should validate file format and reject non-PDF uploads (0.67ms)
  ✔ should reject file uploads exceeding the 10MB limit (0.09ms)
  ✔ should reject empty PDF buffers (0.72ms)
  ✔ should parse valid text-based procurement requirement PDF correctly (55.59ms)
  ✔ should extract structured parameters and separate mandatory requirements from preferences (16.60ms)
  ✔ should detect unspecified fields and flag for buyer confirmation without silent invention (0.65ms)
  ✔ should detect image-only or scanned PDF and report that OCR is required (3.53ms)
✔ Requirement Document Parsing & Extraction Suite (79.30ms)

▶ Supplier Catalogue & Validation Suite
  ✔ should load all 20 synthetic suppliers successfully (0.53ms)
  ✔ should validate every record in the synthetic catalogue against schema rules (0.11ms)
  ✔ should reject a supplier record missing required fields (0.13ms)
  ✔ should detect duplicate supplier IDs in a catalogue (0.08ms)
  ✔ should filter suppliers by process, material, and lead time (0.16ms)
  ✔ should redact sensitive contact details for unauthenticated queries (0.13ms)
✔ Supplier Catalogue & Validation Suite (1.84ms)

▶ Vendor Rating & Deterministic Matching Suite
  ✔ should qualify suppliers meeting all mandatory technical and compliance criteria (0.56ms)
  ✔ should disqualify suppliers missing mandatory manufacturing processes (0.11ms)
  ✔ should disqualify suppliers with incompatible materials (0.08ms)
  ✔ should disqualify suppliers whose MOQ exceeds batch quantity by more than 1.5x (0.07ms)
  ✔ should compute explainable multi-dimensional suitability scores with weights summing to 1.0 (0.60ms)
  ✔ should rank top qualifying suppliers deterministically and return at most 5 recommendations (3.23ms)
  ✔ should not pad the shortlist if fewer than 5 suppliers qualify for a strict requirement (0.44ms)
✔ Vendor Rating & Deterministic Matching Suite (6.54ms)

ℹ tests 40
ℹ suites 6
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 895.93
```
