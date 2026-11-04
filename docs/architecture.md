# ProcureAI System Architecture & Microservices Topology

## 1. High-Level System Overview

ProcureAI is an AI-assisted, human-governed procurement and negotiation platform designed for manufacturing enterprises, specifically targeting Indian precision engineering and component manufacturing ecosystems (Vadodara, Pune, Rajkot, Ahmedabad, Peenya, Coimbatore, etc.).

Unlike opaque "autonomous" agents that execute commercial commitments without oversight, ProcureAI is architected around **strict deterministic application boundaries**, **explainable vendor suitability scoring**, and **persisted human approval gates**.

```mermaid
graph TD
    Client["React 19 Frontend (Vite + TailwindCSS)"]
    Gateway["API Gateway (:8000)<br/>Correlation ID, Rate Limit, Auth Proxy"]

    Client -->|REST + Cookies| Gateway

    subgraph Core Services
        AuthSvc["Auth Service (:8001)<br/>Firebase / Dev Mock & Redis Session"]
        SupplierSvc["Supplier Service (:8002)<br/>Catalogue & Validation"]
        ReqSvc["Requirement Service (:8003)<br/>PDF Extraction & Confirmation"]
        RatingSvc["Vendor Rating Service (:8004)<br/>Deterministic Scoring Engine"]
        MatchSvc["Matching Service (:8005)<br/>Eligibility Filter & Shortlisting"]
        ApprovalSvc["Approval Service (:8006)<br/>Governance Gates & Versioning"]
        NegoSvc["Negotiation Service (:8007)<br/>Stateful Engine & Commercial Limits"]
        CommSvc["Communication Service (:8008)<br/>Draft-Only / Provider Abstraction"]
        BillingSvc["Billing Service (:8009)<br/>Architecture Stub"]
    end

    Gateway -->|/auth| AuthSvc
    Gateway -->|/api/suppliers| SupplierSvc
    Gateway -->|/api/requirements| ReqSvc
    Gateway -->|/api/ratings| RatingSvc
    Gateway -->|/api/matching| MatchSvc
    Gateway -->|/api/approvals| ApprovalSvc
    Gateway -->|/api/negotiations| NegoSvc
    Gateway -->|/api/communications| CommSvc
    Gateway -->|/api/billing| BillingSvc

    subgraph Persistence Layer
        Redis["Redis (:6379)<br/>Session & Ephemeral Cache"]
        DurableStore["Durable Store (PostgreSQL / Local File Repository)<br/>Requirements, Matches, Approvals, Negotiations"]
    end

    AuthSvc --> Redis
    ApprovalSvc --> DurableStore
    MatchSvc --> DurableStore
    ReqSvc --> DurableStore
    NegoSvc --> DurableStore
    CommSvc --> DurableStore
```

---

## 2. Microservice Boundaries & Responsibilities

| Service | Port | Primary Responsibility | Data Owned |
| :--- | :---: | :--- | :--- |
| **Gateway** | `8000` | Central entry point, request proxying, correlation ID assignment, rate limiting, aggregated health checks. | Transient request logs. |
| **Auth Service** | `8001` | User identity, session persistence, role-based authorization (buyer vs admin), dev-mode auth bypass. | User accounts, active sessions in Redis. |
| **Supplier Service** | `8002` | Validating and serving the 20-supplier synthetic Indian manufacturing catalogue, evidence queries, contact redaction. | `suppliers.json`, `schema.json`. |
| **Requirement Service** | `8003` | PDF parsing, selectable text extraction, scanned PDF detection, structured schema extraction, buyer confirmation. | `requirements` records. |
| **Vendor Rating Service** | `8004` | 100% deterministic calculation of 5-dimension suitability scores, confidence indices, and explainable breakdowns. | Scoring configuration & model versions. |
| **Matching Service** | `8005` | Hard eligibility filtering (processes, materials, MOQ, ISO certs), candidate ranking, top-5 shortlist generation, exclusion explanations. | `matching_runs` records. |
| **Approval Service** | `8006` | Enforcing human governance gates before external communication or commercial commitments. Proposal versioning. | `approvals` records. |
| **Negotiation Service** | `8007` | Stateful negotiation lifecycle, reservation limits, AI strategy formulation, counteroffer analysis. | `negotiations` sessions. |
| **Communication Service** | `8008` | Safe draft-only supplier messaging, provider abstraction (`MockEmailProvider` vs `LiveEmailProvider`). | `negotiation_messages` records. |
| **Billing Service** | `8009` | Preserved directory structure stub for future enterprise tier billing. | Subscription metadata. |

---

## 3. End-to-End Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Lead Buyer (User)
    participant UI as React Frontend
    participant GW as API Gateway
    participant RS as Requirement Service
    participant MS as Matching Service
    participant AS as Approval Service
    participant NS as Negotiation Service
    participant CS as Communication Service

    Buyer->>UI: Uploads RFQ PDF (e.g. Vadodara Bracket)
    UI->>GW: POST /api/requirements/upload
    GW->>RS: Proxies Multipart File Buffer
    RS->>RS: Parses text via PDFParse & extracts structured parameters
    RS-->>UI: Returns extracted specs & flags ambiguous fields
    Buyer->>UI: Confirms target price & surface specs
    UI->>GW: PUT /api/requirements/:id/confirm
    GW->>RS: Updates status to BUYER_CONFIRMED

    Buyer->>UI: Initiates Supplier Matching
    UI->>GW: POST /api/matching/run
    GW->>MS: Executes hard filter + vendor rating
    MS->>MS: Filters 20 suppliers (11 eligible, 9 excluded)
    MS->>MS: Ranks top 5 candidates deterministically
    MS-->>UI: Returns Shortlist, Dimension Scores, and Exclusion Reasons

    Buyer->>UI: Selects top candidates & clicks "Approve Shortlist"
    UI->>GW: POST /api/approvals
    GW->>AS: Persists Approval (SHORTLIST_APPROVAL)
    AS-->>UI: Governance Gate Passed

    Buyer->>UI: Prepares Negotiation Session
    UI->>GW: POST /api/negotiations
    GW->>NS: Initializes Session in DRAFT
    UI->>GW: POST /api/negotiations/:id/generate-strategy
    GW->>NS: Synthesizes opening offer anchor & message draft
    NS-->>UI: Status -> AWAITING_STRATEGY_APPROVAL

    Buyer->>UI: Confirms Commercial Limits & Approves Message Draft
    UI->>GW: POST /api/negotiations/:id/approve-draft
    GW->>NS: Status -> APPROVED_TO_SEND

    Buyer->>UI: Clicks "Dispatch Approved Message"
    UI->>GW: POST /api/communications/send/:id
    GW->>CS: Checks Governance Gate (Requires APPROVED_TO_SEND)
    CS->>CS: Dispatches via MockProvider (ENABLE_EXTERNAL_EMAIL=false)
    CS->>NS: Updates state -> WAITING_FOR_SUPPLIER
    CS-->>UI: Dispatch Confirmation
```

---

## 4. Architectural Principles & Safeguards

1. **Deterministic Core:** Numerical scores, process matching, and eligibility checks are computed 100% deterministically. LLMs provide natural language commentary and strategy suggestions but cannot arbitrarily change scores or override compliance filters.
2. **Approval Gating:** The Communication Service strictly blocks message dispatch unless the parent negotiation session has an explicit `APPROVED_TO_SEND` state recorded by an authorized buyer.
3. **Safe Local Development Mode:** Zero paid API keys, zero external database instances, and zero external mail servers are required to run the platform locally or pass tests.
4. **Resilient Persistence:** The durable repository connects to PostgreSQL when `DATABASE_URL` is set, but seamlessly falls back to atomic local JSON storage in `backend/data/store/` when running offline.
