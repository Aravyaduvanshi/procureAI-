# Service Responsibilities & Domain Boundaries

This document defines the clear boundaries, owned data, internal components, exposed endpoints, and failure behaviors for every microservice in the ProcureAI ecosystem.

---

## 1. API Gateway (`gateway/`)
- **Port:** `8000`
- **Purpose:** Central entry point for all frontend traffic. Decouples client applications from internal microservice topologies.
- **Responsibilities:**
  - Injects `X-Correlation-ID` and `X-Request-ID` across all incoming and outgoing requests.
  - Proxy routing to all downstream microservices using `express-http-proxy`.
  - Rate limiting (300 req/min general, 30 req/min for file uploads and authentication).
  - Centralized CORS and security headers.
  - Aggregated health checks (`/health`) pinging all microservices.
- **Owned Data:** In-memory request metrics and Morgan access logs.
- **Dependencies:** Downstream microservices.
- **Failure Behavior:** If a downstream service is offline, returns `502 Bad Gateway` with clear error details rather than hanging.

---

## 2. Authentication Service (`services/auth/`)
- **Port:** `8001`
- **Purpose:** Identity verification, role-based access control, and session token caching.
- **Responsibilities:**
  - Verifying Firebase ID tokens (or dev-mock tokens in local development).
  - Creating 24-hour sessions stored in Redis (`session:<id>`).
  - Checking buyer vs administrator permissions.
  - Exposing `/me` session query and `/logout` cookie clearing.
- **Owned Data:** User credentials, session tokens.
- **Dependencies:** Redis (`ioredis`), MongoDB (`mongoose` - optional).
- **Failure Behavior:** If MongoDB or Firebase is unavailable, operates in resilient local dev mode using mock buyer identity.

---

## 3. Supplier Service (`services/supplier/`)
- **Port:** `8002`
- **Purpose:** Loading, validating, searching, and serving the synthetic 20-supplier Indian manufacturing catalogue.
- **Responsibilities:**
  - Validating suppliers against JSON schema (`schema.json`).
  - Search and multi-criteria filtering (processes, materials, state, city, lead time, MOQ, certifications).
  - Redacting contact details for unauthenticated requests.
  - Exposing evidence confidence scores and audit status.
- **Owned Data:** `data/suppliers/suppliers.json`, `data/suppliers/schema.json`.
- **Dependencies:** None (self-contained repository).
- **Failure Behavior:** In-memory catalogue cached at startup. Corrupted files log schema warnings and filter invalid records.

---

## 4. Requirement Service (`services/requirement/`)
- **Port:** `8003`
- **Purpose:** Document ingestion, selectable text extraction, and structured procurement parameter conversion.
- **Responsibilities:**
  - Multipart/form-data upload validation (PDF only, max 10MB).
  - Scanned / image-only PDF detection (flags `isScannedPdf` and reports OCR required).
  - Parsing structured parameters (quantity, lead time, processes, materials, target price, certifications).
  - Separating mandatory constraints from preferences.
  - Detecting ambiguous/unspecified fields and managing buyer confirmation state.
- **Owned Data:** `requirements` records.
- **Dependencies:** `pdf-parse`, `multer`, `shared/db.js`.
- **Failure Behavior:** Malformed PDFs return `400 Validation Error`. Scanned PDFs return `422 OCR Required`.

---

## 5. Vendor Rating Service (`services/vendor-rating/`)
- **Port:** `8004`
- **Purpose:** Computing deterministic, explainable vendor suitability scores.
- **Responsibilities:**
  - Applying hard eligibility checks.
  - Calculating 5 dimension scores: Technical (35%), Quality (20%), Commercial (20%), Delivery (15%), Completeness (10%).
  - Producing explainable pro/con factors and identifying missing information.
  - Exposing scoring configuration and weights.
- **Owned Data:** Scoring model definitions (`v1.2.0-deterministic`).
- **Dependencies:** `shared/errors.js`.
- **Failure Behavior:** Pure deterministic mathematical calculation; no external network failure modes.

---

## 6. Matching Service (`services/matching/`)
- **Port:** `8005`
- **Purpose:** Shortlist selection and candidate ranking for procurement requirements.
- **Responsibilities:**
  - Calling hard eligibility filters against all catalogue suppliers.
  - Calling the Vendor Rating engine for eligible candidates.
  - Ranking candidates descending by score and recommending up to 5 vendors.
  - Documenting specific disqualification reasons for all excluded vendors.
  - Invoking the AI Orchestrator for executive summaries.
  - Persisting matching runs with proposal versioning.
- **Owned Data:** `matching_runs` records.
- **Dependencies:** `services/supplier`, `services/vendor-rating`, `shared/db.js`.
- **Failure Behavior:** If AI provider is offline, uses deterministic template summaries with clear local mode labels.

---

## 7. Approval Service (`services/approval/`)
- **Port:** `8006`
- **Purpose:** Durable governance gates preventing unauthorized procurement actions.
- **Responsibilities:**
  - Recording buyer approvals and rejections with timestamps, reasons, and approver identity.
  - Version checking to prevent approving stale proposal iterations.
  - Idempotency check preventing duplicate approvals.
  - Authorization verification endpoint (`/check-gate`) for downstream services.
- **Owned Data:** `approvals` records.
- **Dependencies:** `shared/db.js`.
- **Failure Behavior:** Persists to PostgreSQL / durable file repository. Fails closed (blocks downstream action if approval not verified).

---

## 8. Negotiation Service (`services/negotiation/`)
- **Port:** `8007`
- **Purpose:** Managing stateful negotiation sessions and enforcing commercial reservation limits.
- **Responsibilities:**
  - Managing negotiation state machine (`DRAFT`, `AWAITING_STRATEGY_APPROVAL`, `READY_FOR_MESSAGE_APPROVAL`, `APPROVED_TO_SEND`, etc.).
  - Bounded strategy formulation (anchor opening offers, target prices, reservation caps).
  - Counteroffer policy analysis (concession gap calculation, strict escalation when exceeding caps).
  - Draft message preparation.
  - Final purchase authorization records.
- **Owned Data:** `negotiations` records.
- **Dependencies:** `shared/db.js`, `services/supplier`, `services/matching/aiOrchestrator.js`.
- **Failure Behavior:** State transitions are strictly validated. Illegal transitions throw `400 Validation Error`.

---

## 9. Communication Service (`services/communication/`)
- **Port:** `8008`
- **Purpose:** Controlled supplier message preparation, preview, and safe outbound dispatch.
- **Responsibilities:**
  - Outbound message draft rendering and recipient verification.
  - Strict human gate enforcement (requires parent session state `APPROVED_TO_SEND`).
  - Abstract email provider (`MockEmailProvider` vs `LiveEmailProvider`).
  - Keeping external sending safely disabled by default (`ENABLE_EXTERNAL_EMAIL=false`).
  - Recording dispatched message history and advancing negotiation state to `WAITING_FOR_SUPPLIER`.
- **Owned Data:** `negotiation_messages` records.
- **Dependencies:** `services/negotiation`, `shared/db.js`.
- **Failure Behavior:** Throws `403 Forbidden` if human approval has not been granted. In mock mode, logs simulated dispatch cleanly.

---

## 10. Billing Service (`services/billing/`)
- **Port:** `8009`
- **Purpose:** Architectural placeholder preserved for future enterprise tier billing.
- **Responsibilities:**
  - Health check and tier metadata stub.
- **Owned Data:** None.
