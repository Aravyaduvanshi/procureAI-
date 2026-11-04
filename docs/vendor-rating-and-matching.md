# Vendor Suitability Rating & Deterministic Matching Engine

## 1. Eligibility & Disqualification Rules

Before calculating any numerical scores, every supplier is evaluated by `checkHardEligibility(supplier, requirement)`. If a supplier fails any mandatory rule, they are disqualified with an explicit reason documented:

1. **Process Feasibility:** Supplier must support the required processes (e.g. *CNC Milling*).
   - *Disqualification:* `Missing mandatory manufacturing process: CNC Milling`.
2. **Material Feasibility:** Supplier must support the specified material (e.g. *Aluminium 6061-T6*).
   - *Disqualification:* `Does not handle required material: Aluminium 6061-T6`.
3. **Lot Size Compatibility:** Supplier Minimum Order Quantity (MOQ) must not exceed 1.5x the requirement lot size.
   - *Disqualification:* `Supplier MOQ (15,000) exceeds batch quantity (5,000) by more than 1.5x`.
4. **Mandatory Compliance:** Supplier must have valid, unexpired certificates matching the required standards.
   - *Disqualification:* `Lacks required valid certification: ISO 9001:2015`.

---

## 2. Configurable 5-Dimension Scoring Model

Suitability is calculated across 5 dimensions on a 0–100 scale:

$$\text{Overall Score} = \sum (\text{Dimension Score}_i \times \text{Weight}_i)$$

| Dimension | Default Weight | Key Scoring Criteria |
| :--- | :---: | :--- |
| **Technical Capability Fit** | `35%` | Exact process match (+45), material compatibility (+30), high-end equipment (+25). |
| **Quality & Certification Evidence** | `20%` | Audited certifications (+45), in-house CMM inspection (+30), serialized traceability (+25). |
| **Commercial Competitiveness** | `20%` | Indicative price vs target ratio: <=0.95 (95 pts), <=1.05 (85 pts), <=1.20 (65 pts), >1.20 (40 pts). Favorable credit terms bonus (+5). |
| **Delivery Feasibility** | `15%` | Lead time <= target (95 pts), lead time within +5d (75 pts). Monthly capacity >= 2x lot size bonus (+5). |
| **Supplier Evidence Completeness** | `10%` | Direct reflection of independent verification confidence: $\text{Confidence Score} \times 100$. |

---

## 3. Evidence Confidence & Missing Data Handling

ProcureAI distinguishes **suitability fit** from **evidence confidence**:
- **Confidence Levels:**
  - `HIGH`: Confidence score $\ge 0.90$ (third-party audited certs, in-house CMM, ERP serialization).
  - `MEDIUM`: Confidence score $0.70 - 0.89$ (standard ISO certs, batch tagging).
  - `LOW`: Confidence score $< 0.70$ (self-declared certifications, manual route cards).
- **Missing Information:** Missing fields do not arbitrarily zero-out the vendor; they are flagged as `missingInformation` (e.g. *Indicative unit price quotation not on file*) and evaluated conservatively at neutral benchmark midpoints (50 pts), prompting buyer verification.

---

## 4. Worked Example: AeroPrecision Dynamics (SUP-IND-001)

### Requirement:
- Component: CNC Machined Aluminium Bracket
- Lot: 5,000 pcs | Target Price: ₹480 | Lead Time: 30 days
- Mandatory: CNC Milling, Al 6061-T6, ISO 9001:2015

### Dimension Computations:
1. **Technical Fit (100 / 100):**
   - 5-Axis CNC Milling match: 45 pts
   - Al 6061-T6 match: 30 pts
   - DMG Mori 5-Axis + Zeiss CMM: 25 pts
   - *Weighted Technical:* $100 \times 0.35 = 35.0$
2. **Quality Evidence (100 / 100):**
   - Verified ISO 9001 + AS9100D + IATF: 45 pts
   - Zeiss CMM in-house: 30 pts
   - ERP batch serialization: 25 pts
   - *Weighted Quality:* $100 \times 0.20 = 20.0$
3. **Commercial Fit (90 / 100):**
   - Price ₹485 vs target ₹480 (ratio 1.01): 85 pts
   - Net 30 payment terms: +5 pts
   - *Weighted Commercial:* $90 \times 0.20 = 18.0$
4. **Delivery Feasibility (100 / 100):**
   - Lead time 25 days vs requested 30 days: 95 pts
   - Monthly capacity (25,000 pcs) is 5x batch quantity: +5 pts
   - *Weighted Delivery:* $100 \times 0.15 = 15.0$
5. **Evidence Completeness (95 / 100):**
   - Verified evidence score: 0.95
   - *Weighted Completeness:* $95 \times 0.10 = 9.5$

$$\text{Overall Score} = 35.0 + 20.0 + 18.0 + 15.0 + 9.5 = \mathbf{97.5} / 100$$
Verdict: **#1 Rank - RECOMMENDED FOR SHORTLIST (HIGH CONFIDENCE)**
