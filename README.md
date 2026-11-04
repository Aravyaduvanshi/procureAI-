# ProcureAI — Autonomous & AI-Assisted Manufacturing Procurement Platform

ProcureAI is an enterprise procurement intelligence platform inspired by autonomous negotiation systems (such as Pactum). Tailored for growing Indian manufacturing enterprises—particularly in automotive components, CNC precision machining, and industrial equipment—ProcureAI automates supplier capability discovery, deterministic suitability scoring, and human-in-the-loop negotiations.

---

## Key Capabilities (MVP)

1. **Synthetic Indian Supplier Catalogue:** 20 realistic fictional manufacturing suppliers located in key Indian hubs (Vadodara, Pune, Rajkot, Ahmedabad, Bengaluru Peenya, Coimbatore, Chennai, Gurugram, etc.) with schema validation and evidence audit trails.
2. **Automated RFQ Parsing:** Text-based PDF extraction (`pdf-parse`) of technical processes, material grades, batch quantities, lead times, and quality certifications. Automatically detects scanned/image-only PDFs and flags OCR requirements.
3. **Ambiguity & Missing-Data Detection:** Never silently invents technical specs. Flags missing parameters (e.g. surface treatments, tolerances) for buyer confirmation.
4. **Deterministic Vendor Suitability Scoring:** Multi-dimensional scoring (Technical 35%, Quality 20%, Commercial 20%, Delivery 15%, Completeness 10%) with confidence indicators and explainable pro/con factors.
5. **Shortlist Matching & Ranking:** Hard eligibility filtering excludes non-qualifying suppliers with documented reasons, recommending up to 5 qualifying vendors.
6. **Durable Governance & Approval Gates:** Explicit buyer authorization is persisted in a durable store before external communication or commercial commitments can be initiated.
7. **Stateful Negotiation Engine:** 12-state negotiation lifecycle enforcing pre-authorized commercial reservation limits, AI strategy formulation, opening offer anchors, and counteroffer policy evaluation.
8. **Draft-Only Outbound Safety:** External email sending is strictly disabled by default (`ENABLE_EXTERNAL_EMAIL=false`) to ensure simulated, safe local development.
9. **Interactive React 19 Frontend:** High-end glassmorphic UI built with Tailwind CSS v4, Outfit typography, and Lucide icons across 6 core views.
10. **Zero-Credential Local Dev Mode:** Fully runnable offline with 40 passing automated tests requiring zero paid API keys.

---

## Technology Stack

- **Backend:** Node.js (v20+ ES Modules), Express, `express-http-proxy`, `pdf-parse`, `pdf-lib`, `multer`, `express-rate-limit`, `pg`, `ioredis`.
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React, Axios.
- **Persistence:** Dual-persistence (PostgreSQL via `pg.Pool` or local atomic file repository in `backend/data/store/`). Session caching in Redis (with in-memory fallback).
- **Testing:** Node.js native test runner (`node:test`, `node:assert/strict`).

---

## Prerequisites

- **Node.js:** v20.0.0 or higher (v24 recommended).
- **npm:** v10.0.0 or higher.
- **Docker & Docker Compose:** Optional for local Redis and PostgreSQL containers (the application features automatic in-memory and local file persistence fallbacks if Docker is not running).

---

## Quick Startup Guide

### 1. Start Supporting Containers (Optional)
```bash
cd backend
docker compose up -d
```
*(Starts Redis on port 6379 and PostgreSQL on port 5432).*

### 2. Run All Backend Microservices Concurrently
```bash
cd backend
npm run dev
```
*(Spawns API Gateway on port 8000 and all 9 microservices simultaneously).*

### 3. Run the Frontend Application
In a separate terminal:
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Running Automated Tests

To execute the complete 40-test suite covering supplier validation, PDF parsing, vendor rating, approvals, negotiation state transitions, and the end-to-end workflow:

```bash
cd backend
npm test
```

---

## Documentation Links

For detailed architectural and implementation documentation, explore the `docs/` directory:

- [System Architecture](docs/architecture.md) — Topology, component relationships, request sequences, and Mermaid diagrams.
- [Service Responsibilities](docs/service-responsibilities.md) — Detailed breakdown of all 10 microservices.
- [API Reference Manual](docs/api-reference.md) — Complete request/response schemas and endpoints.
- [Environment Setup](docs/environment-setup.md) — Complete environment variable catalog and credential configuration.
- [Supplier Data Format](docs/supplier-data-format.md) — Synthetic catalogue schema and data dictionary.
- [Requirement Processing](docs/requirement-processing.md) — PDF extraction, scanned document detection, and buyer confirmation.
- [Vendor Rating & Matching](docs/vendor-rating-and-matching.md) — Scoring formulas, weights, and worked examples.
- [AI Agents & Orchestration](docs/ai-agents.md) — Specialized AI agent roles, tools, and deterministic safety bounds.
- [Negotiation Workflow](docs/negotiation-workflow.md) — State machine rules, commercial limits, and counteroffer policies.
- [Security Architecture](docs/security.md) — Authentication, secret scrubbing, and prompt injection defense.
- [Testing Report](docs/testing.md) — Test architecture, unit/integration test suites, and test run results.
- [Deployment Guide](docs/deployment.md) — Docker compose, database migrations, and production guidance.
- [Folder Structure](docs/folder-structure.md) — Codebase structure and directory purposes.
- [Implementation Report](docs/implementation-report.md) — Final audit, changes, verified capabilities, and roadmap.

---

## Known Limitations & Roadmap

1. **Scanned PDF OCR:** The initial MVP detects scanned/image-only PDFs and returns an `OCR_REQUIRED` warning. Future phases will integrate Tesseract.js / Document AI for OCR.
2. **Parallel RFQ Sessions:** Currently, negotiations are conducted per supplier session. Phase 2 will introduce multi-vendor parallel bidding comparison.
3. **ERP Integration:** Production purchase orders currently issue persistent JSON/PostgreSQL authorization records. Future work will integrate SAP S/4HANA / Tally connectors.
