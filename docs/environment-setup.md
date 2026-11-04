# Environment Configuration & Variables Reference

This document provides a comprehensive guide to all environment variables utilized across the ProcureAI microservices platform.

---

## 1. Environment Variable Catalog

| Variable Name | Required | Default Local Value | Purpose & Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `8000` | Port for the API Gateway service. |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing (CORS). |
| `NODE_ENV` | Optional | `development` | Environment mode (`development`, `test`, `production`). |
| `AUTH_SERVICE_URL` | Optional | `http://127.0.0.1:8001` | Gateway upstream URL for Auth Service. |
| `SUPPLIER_SERVICE_URL` | Optional | `http://127.0.0.1:8002` | Gateway upstream URL for Supplier Service. |
| `REQUIREMENT_SERVICE_URL` | Optional | `http://127.0.0.1:8003` | Gateway upstream URL for Requirement Service. |
| `VENDOR_RATING_SERVICE_URL` | Optional | `http://127.0.0.1:8004` | Gateway upstream URL for Vendor Rating Service. |
| `MATCHING_SERVICE_URL` | Optional | `http://127.0.0.1:8005` | Gateway upstream URL for Matching Service. |
| `APPROVAL_SERVICE_URL` | Optional | `http://127.0.0.1:8006` | Gateway upstream URL for Approval Service. |
| `NEGOTIATION_SERVICE_URL` | Optional | `http://127.0.0.1:8007` | Gateway upstream URL for Negotiation Service. |
| `COMMUNICATION_SERVICE_URL` | Optional | `http://127.0.0.1:8008` | Gateway upstream URL for Communication Service. |
| `BILLING_SERVICE_URL` | Optional | `http://127.0.0.1:8009` | Gateway upstream URL for Billing Service. |
| `REDIS_URL` | Optional | `redis://localhost:6379` | Redis connection URL for session tokens and cache. Automatically falls back to resilient in-memory cache if offline. |
| `DATABASE_URL` | Optional | *(empty)* | PostgreSQL connection string. When empty, automatically uses local durable atomic file persistence in `backend/data/store/`. |
| `MONGOOSE_URI` | Optional | `mongodb://localhost:27017/procureai_auth` | MongoDB connection URI for legacy user schema. |
| `ENABLE_AI` | Optional | `false` | When `false`, uses deterministic rule-based AI orchestration. When `true`, calls live Gemini/LLM API. |
| `LLM_API_KEY` | Optional | *(empty)* | API key for external LLM provider (e.g. Google Gemini API). |
| `LLM_MODEL` | Optional | `gemini-1.5-flash` | Model identifier when `ENABLE_AI=true`. |
| `ENABLE_EXTERNAL_EMAIL` | Optional | `false` | **Critical Security Control.** Must remain `false` to prevent outbound email dispatch during testing. |
| `EMAIL_API_KEY` | Optional | *(empty)* | API key for external email delivery service (SendGrid, Resend, AWS SES). |
| `JWT_SECRET` | Optional | `procureai_dev_secret_local` | Secret key used for signing authentication tokens. |

---

## 2. Feature Capability Matrix vs Credentials

| Feature Capability | Works Without External Keys? | Required Configuration When Live |
| :--- | :---: | :--- |
| **Supplier Catalogue & Search** | **Yes (100%)** | None (self-contained JSON catalogue). |
| **PDF Requirement Parsing** | **Yes (100%)** | None (uses local `pdf-parse` pure JS engine). |
| **Deterministic Suitability Scoring** | **Yes (100%)** | None (100% mathematical deterministic engine). |
| **Mandatory Eligibility & Ranking** | **Yes (100%)** | None (deterministic business logic). |
| **Buyer Approval Gate** | **Yes (100%)** | None (persisted in durable database). |
| **Negotiation State Machine** | **Yes (100%)** | None (deterministic state transitions & policy checks). |
| **AI Strategy & Summary Text** | **Yes (Deterministic fallback)** | Set `ENABLE_AI=true` and provide `LLM_API_KEY`. |
| **External Email Transmission** | **Disabled (Mock Simulated)** | Set `ENABLE_EXTERNAL_EMAIL=true` and provide `EMAIL_API_KEY`. |

---

## 3. How to Generate Secure Secrets for Production

To generate cryptographically secure secrets for `JWT_SECRET` and `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> [!CAUTION]
> Never commit real production `.env` files or API credentials into Git repository tracking. Always add `.env` to `.gitignore`.
