# ProcureAI API Reference Manual

All endpoints are accessible via the API Gateway at `http://localhost:8000`. In development mode, requests include or accept session cookies and `X-Correlation-ID` headers.

---

## 1. Authentication Service (`/auth`)

### `POST /auth/login`
- **Purpose:** Authenticates user via Firebase token or local development mock token.
- **Auth Required:** No.
- **Request Body:**
  ```json
  {
    "token": "dev-buyer-token"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": "dev_buyer_uid_01",
      "name": "ProcureAI Lead Buyer",
      "email": "buyer@example.com",
      "role": "buyer"
    },
    "sessionId": "4a719c8f-3bf6-4b21-863a-86a0b9a6b189"
  }
  ```
- **Cookie Set:** `session=<sessionId>; HttpOnly; SameSite=Lax; Max-Age=86400`

### `GET /auth/me`
- **Purpose:** Returns authenticated user profile and roles.
- **Auth Required:** Yes (via cookie or dev mode).
- **Response `200 OK`:**
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "dev_buyer_uid_01",
      "name": "ProcureAI Lead Buyer",
      "email": "buyer@example.com",
      "role": "buyer"
    }
  }
  ```

### `POST /auth/logout`
- **Purpose:** Invalidates active session from Redis and clears session cookie.
- **Response `200 OK`:** `{ "success": true, "message": "Logged out successfully" }`

---

## 2. Supplier Service (`/api/suppliers`)

### `GET /api/suppliers`
- **Purpose:** List and filter synthetic manufacturing suppliers with pagination.
- **Query Parameters:** `search`, `process`, `material`, `city`, `state`, `maxLeadTime`, `maxMoq`, `certification`, `page`, `limit`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "total": 20,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "items": [
      {
        "supplierId": "SUP-IND-001",
        "companyName": "AeroPrecision Dynamics Pvt Ltd",
        "location": { "city": "Vadodara", "state": "Gujarat", "country": "India" },
        "manufacturingProcesses": ["5-Axis CNC Milling", "CNC Turning"],
        "materials": ["Aluminium 6061-T6", "Aluminium 7075"],
        "minimumOrderQuantity": 500,
        "indicativeUnitPrice": 485.00,
        "leadTimeDays": 25,
        "evidenceConfidenceScore": 0.95
      }
    ]
  }
  ```

### `GET /api/suppliers/:id`
- **Purpose:** Retrieves supplier profile. If unauthenticated, contact phone and email are redacted.
- **Response `200 OK`:** `{ "success": true, "supplier": { ... } }`

### `GET /api/suppliers/:id/evidence`
- **Purpose:** Retrieves evidence audit trail, ISO/IATF cert status, CMM capability, and confidence index.

---

## 3. Requirement Service (`/api/requirements`)

### `POST /api/requirements/upload`
- **Purpose:** Uploads PDF requirement document (multipart/form-data) and extracts structured parameters.
- **Form Data:** `document: <PDF Binary File>`
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "requirement": {
      "id": "REQ-M4K7X2-A1B2C3",
      "title": "Precision CNC Machined Aluminium Mounting Bracket (Housing Mount)",
      "targetQuantity": 5000,
      "requestedLeadTimeDays": 30,
      "targetUnitPrice": 480.00,
      "materials": ["Aluminium 6061-T6"],
      "mandatoryProcesses": ["CNC Milling", "CNC Turning"],
      "requiredCertifications": ["ISO 9001:2015", "IATF 16949"],
      "requiresBuyerConfirmation": true,
      "unspecifiedFields": [
        { "field": "machiningTolerance", "suggestedValue": "ISO 2768-m (±0.1mm)" }
      ],
      "status": "PARSED_PENDING_CONFIRMATION"
    }
  }
  ```
- **Error `422 Unprocessable Entity`:**
  ```json
  {
    "success": false,
    "error": {
      "code": "OCR_REQUIRED",
      "message": "The uploaded PDF appears to be a scanned or image-only document. Text could not be extracted without OCR capability."
    }
  }
  ```

### `PUT /api/requirements/:id/confirm`
- **Purpose:** Buyer confirms or overrides extracted specifications and updates status to `BUYER_CONFIRMED`.
- **Request Body:**
  ```json
  {
    "targetUnitPrice": 480.00,
    "surfaceTreatment": "Hard Anodizing (Type III) Black",
    "machiningTolerance": "ISO 2768-m (±0.1mm)",
    "paymentTerms": "Net 30 Days"
  }
  ```
- **Response `200 OK`:** `{ "success": true, "requirement": { ... } }`

---

## 4. Vendor Rating Service (`/api/ratings`)

### `POST /api/ratings/evaluate`
- **Purpose:** Computes deterministic 5-dimension suitability score for a supplier against a requirement.
- **Request Body:** `{ "supplier": { ... }, "requirement": { ... } }`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "rating": {
      "supplierId": "SUP-IND-001",
      "isEligible": true,
      "overallScore": 92.5,
      "confidenceLevel": "HIGH",
      "scoringBreakdown": {
        "dimensions": {
          "technicalCapability": { "score": 100, "weight": 0.35 },
          "qualityCertifications": { "score": 95, "weight": 0.20 },
          "commercialCompetitiveness": { "score": 85, "weight": 0.20 },
          "deliveryFeasibility": { "score": 95, "weight": 0.15 },
          "evidenceCompleteness": { "score": 95, "weight": 0.10 }
        },
        "positiveFactors": ["Verified processes: 5-Axis CNC Milling", "Audited certifications: ISO 9001:2015, IATF 16949"],
        "riskFactors": []
      }
    }
  }
  ```

---

## 5. Matching Service (`/api/matching`)

### `POST /api/matching/run`
- **Purpose:** Evaluates entire supplier catalogue against structured requirement, applying hard filters and returning up to 5 recommendations.
- **Request Body:**
  ```json
  {
    "requirementId": "REQ-M4K7X2-A1B2C3"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "matchingRun": {
      "id": "MATCH-M4K8Y9-D4E5F6",
      "requirementId": "REQ-M4K7X2-A1B2C3",
      "proposalVersion": 1,
      "status": "AWAITING_BUYER_APPROVAL",
      "totalEvaluated": 20,
      "eligibleCount": 11,
      "excludedCount": 9,
      "shortlistCount": 5,
      "recommendedShortlist": [ ... ],
      "excludedSuppliers": [
        {
          "supplierId": "SUP-IND-004",
          "companyName": "Gujarat Stamping & Sheetmetal Works",
          "disqualificationReasons": ["Missing mandatory manufacturing process: CNC Milling"]
        }
      ],
      "executiveSummary": {
        "headline": "Evaluated 20 suppliers: 5 qualified candidates recommended; 9 excluded by mandatory criteria.",
        "summaryParagraph": "..."
      }
    }
  }
  ```

---

## 6. Approval Service (`/api/approvals`)

### `POST /api/approvals`
- **Purpose:** Records explicit buyer approval or rejection for a proposal version.
- **Request Body:**
  ```json
  {
    "proposalId": "MATCH-M4K8Y9-D4E5F6",
    "proposalVersion": 1,
    "actionType": "SHORTLIST_APPROVAL",
    "decision": "APPROVED",
    "reason": "Shortlist approved for commercial discussion with top 3 vendors",
    "selectedSupplierIds": ["SUP-IND-001", "SUP-IND-002", "SUP-IND-005"]
  }
  ```
- **Response `201 Created`:** `{ "success": true, "approval": { ... } }`

---

## 7. Negotiation Service (`/api/negotiations`)

### `POST /api/negotiations`
- **Purpose:** Initializes stateful negotiation session in `DRAFT` state.
- **Request Body:**
  ```json
  {
    "supplierId": "SUP-IND-001",
    "requirementId": "REQ-M4K7X2-A1B2C3",
    "buyerObjective": "BALANCED",
    "targetPrice": 480.00,
    "reservationLimit": 500.00
  }
  ```

### `POST /api/negotiations/:id/generate-strategy`
- **Purpose:** Formulates commercial limits, anchoring offer, tactics, and message draft. Advances state to `AWAITING_STRATEGY_APPROVAL`.

### `POST /api/negotiations/:id/approve-strategy`
- **Purpose:** Buyer authorizes strategy. Advances state to `READY_FOR_MESSAGE_APPROVAL`.

### `POST /api/negotiations/:id/approve-draft`
- **Purpose:** Buyer authorizes message draft. Advances state to `APPROVED_TO_SEND`.

### `POST /api/negotiations/:id/counteroffer`
- **Purpose:** Evaluates inbound supplier counteroffer against reservation cap.
- **Request Body:**
  ```json
  {
    "proposedUnitPrice": 475.00,
    "proposedLeadTimeDays": 28
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "evaluation": {
      "proposedUnitPrice": 475.00,
      "outcomeVerdict": "HIGHLY_FAVORABLE",
      "recommendedNextAction": "RECOMMEND_ACCEPTANCE"
    }
  }
  ```

---

## 8. Communication Service (`/api/communications`)

### `POST /api/communications/send/:negotiationId`
- **Purpose:** Dispatches approved supplier message via configured provider.
- **Security Check:** Blocks dispatch with `403 Forbidden` if state is not `APPROVED_TO_SEND`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Outbound supplier message successfully dispatched and recorded",
    "dispatchDetails": {
      "mode": "MOCK_SIMULATED",
      "providerDisabled": true,
      "recipient": "contact@aeroprecision.example.com",
      "note": "External email provider is disabled (ENABLE_EXTERNAL_EMAIL=false). Message recorded and simulated locally without real external network transmission."
    }
  }
  ```
- **State Transition:** Advances negotiation state to `WAITING_FOR_SUPPLIER`.
