# Implemented Folder Structure Reference

This document accurately describes the final codebase structure of **ProcureAI**.

```
procureAI/
├── backend/
│   ├── data/
│   │   ├── sample-requirements/
│   │   │   ├── generateSamplePdf.js                      # Script generating benchmark Vadodara RFQ PDF
│   │   │   └── Sample_Procurement_Requirement_Vadodara.pdf # Generated benchmark test RFQ document
│   │   ├── store/                                        # Local durable persistence store
│   │   │   ├── requirements.json
│   │   │   ├── matching_runs.json
│   │   │   ├── approvals.json
│   │   │   ├── negotiations.json
│   │   │   ├── negotiation_messages.json
│   │   │   └── audit_events.json
│   │   └── suppliers/
│   │       ├── schema.json                               # JSON schema for supplier catalogue validation
│   │       └── suppliers.json                            # 20 synthetic Indian manufacturing suppliers
│   │
│   ├── docker-compose.yml                                # Redis and PostgreSQL container definitions
│   ├── package.json                                      # Root backend dependencies and scripts
│   ├── .env.example                                      # Documented environment variable template
│   ├── .env                                              # Local development environment configuration
│   │
│   ├── gateway/                                          # API Gateway Service (:8000)
│   │   ├── index.js                                      # Express gateway, proxy routes, rate limiting, health
│   │   └── package.json
│   │
│   ├── services/
│   │   ├── auth/                                         # Authentication Service (:8001)
│   │   │   ├── config/ (db.js, firebase.js)              # Resilient DB and Firebase initialization
│   │   │   ├── controller/auth.controller.js             # Session login, me, logout handlers
│   │   │   ├── models/user.model.js                      # User schema
│   │   │   ├── routes/auth.route.js
│   │   │   └── index.js
│   │   │
│   │   ├── supplier/                                     # Supplier Catalogue Service (:8002)
│   │   │   ├── controller.js                             # Querying, filtering, and evidence inspection
│   │   │   ├── routes.js
│   │   │   ├── supplierRepository.js                     # In-memory cached catalogue repository
│   │   │   ├── supplierValidator.js                      # Schema validator & duplicate ID detector
│   │   │   └── index.js
│   │   │
│   │   ├── requirement/                                  # Requirement Processing Service (:8003)
│   │   │   ├── controller.js                             # Upload, confirmation, and status handlers
│   │   │   ├── documentParser.js                         # PDF text parser & scanned OCR detector
│   │   │   ├── requirementExtractor.js                   # Structured NLP extractor & ambiguity detector
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── vendor-rating/                                # Vendor Rating Service (:8004)
│   │   │   ├── controller.js                             # Single and batch rating evaluation endpoints
│   │   │   ├── routes.js
│   │   │   ├── scoringEngine.js                          # Deterministic 5-dimension scoring algorithms
│   │   │   └── index.js
│   │   │
│   │   ├── matching/                                     # Supplier Matching Service (:8005)
│   │   │   ├── aiOrchestrator.js                         # 5 specialized AI roles & executive synthesis
│   │   │   ├── controller.js                             # Matching runs and exclusion reasons
│   │   │   ├── matchingEngine.js                         # Hard filtering & candidate shortlisting
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── approval/                                     # Governance & Approval Service (:8006)
│   │   │   ├── controller.js                             # Durable approval decision records & gating
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── negotiation/                                  # Negotiation Service (:8007)
│   │   │   ├── controller.js                             # Session lifecycle, strategy, drafts, counteroffers
│   │   │   ├── negotiationEngine.js                      # Commercial limits & policy evaluation
│   │   │   ├── negotiationStateMachine.js                # State machine rules and transition checks
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── communication/                                # Communication Service (:8008)
│   │   │   ├── controller.js                             # Draft preview, message sending, message history
│   │   │   ├── emailProvider.js                          # MockEmailProvider vs LiveEmailProvider abstraction
│   │   │   ├── routes.js
│   │   │   └── index.js
│   │   │
│   │   ├── billing/                                      # Billing Service (:8009)
│   │   │   └── index.js                                  # Preserved service stub
│   │   └── biling/                                       # Legacy alias folder exporting billing/index.js
│   │
│   ├── shared/                                           # Shared Technical Infrastructure
│   │   ├── authMiddleware.js                             # Session authentication & role authorization
│   │   ├── correlation.js                                # Correlation ID middleware
│   │   ├── db.js                                         # Dual persistence (PostgreSQL + Local File Store)
│   │   ├── errors.js                                     # Standardized error classes & error handler
│   │   ├── logger.js                                     # Structured logger with secret scrubbing
│   │   └── redis.js                                      # Resilient Redis client with in-memory fallback
│   │
│   └── tests/                                            # Automated Test Suite (node:test)
│       ├── integration/
│       │   └── endToEndWorkflow.test.js                  # Complete 10-step E2E journey test
│       └── unit/
│           ├── approvals.test.js
│           ├── negotiation.test.js
│           ├── requirementParsing.test.js
│           ├── supplierCatalogue.test.js
│           └── vendorRatingAndMatching.test.js
│
├── frontend/                                             # React 19 Frontend (Vite + TailwindCSS v4)
│   ├── index.html                                        # HTML entry with Outfit typography
│   ├── package.json
│   ├── vite.config.js
│   ├── utils/
│   │   ├── axios.js                                      # Axios client configured with credentials & Gateway baseURL
│   │   └── firebase.js                                   # Firebase configuration
│   └── src/
│       ├── App.jsx                                       # Main application state & tab coordinator
│       ├── index.css                                     # Tailwind styles & glassmorphic classes
│       ├── main.jsx                                      # React DOM entry point
│       └── components/
│           ├── ApprovalView.jsx                          # Human governance gate & decision inbox
│           ├── Dashboard.jsx                             # Executive metrics, lifecycle stepper, audit log
│           ├── Navbar.jsx                                # Header, system status, dev login, tab navigation
│           ├── NegotiationWorkspace.jsx                  # Stateful negotiations, drafts, counteroffer analysis
│           ├── RequirementUpload.jsx                     # PDF dropzone, parser review, ambiguity confirmation
│           └── SupplierDirectory.jsx                     # 20-supplier searchable grid, filter chips, profile modal
│
└── docs/                                                 # Comprehensive Documentation
    ├── ai-agents.md
    ├── api-reference.md
    ├── architecture.md
    ├── deployment.md
    ├── environment-setup.md
    ├── folder-structure.md
    ├── implementation-report.md
    ├── negotiation-workflow.md
    ├── requirement-processing.md
    ├── security.md
    ├── service-responsibilities.md
    ├── supplier-data-format.md
    ├── testing.md
    └── vendor-rating-and-matching.md
```
