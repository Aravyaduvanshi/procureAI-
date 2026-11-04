# Supplier Data Format & Synthetic Catalogue Specification

## 1. Overview
The ProcureAI supplier catalogue (`backend/data/suppliers/suppliers.json`) contains **20 realistic synthetic suppliers** representing precision engineering and industrial component manufacturers in India.

The dataset includes vendors in major manufacturing clusters:
- **Gujarat:** Vadodara (Makarpura, Ranoli), Ahmedabad (Vatva), Rajkot (Aji, Metoda), Sanand, Vapi, Halol.
- **Maharashtra:** Pune (Bhosari, Chakan), Chhatrapati Sambhajinagar / Aurangabad (Waluj), Nashik (Ambad).
- **Karnataka:** Bengaluru (Peenya Industrial Area, Bommasandra).
- **Tamil Nadu:** Coimbatore (Kurichi SIDCO), Chennai (Ambattur).
- **NCR & Others:** Gurugram (Manesar), Faridabad, Ludhiana, Hyderabad (Balanagar).

---

## 2. JSON Schema & Field Definitions

The catalogue is validated against `backend/data/suppliers/schema.json`.

```json
{
  "supplierId": "SUP-IND-001",
  "companyName": "AeroPrecision Dynamics Pvt Ltd",
  "businessEmail": "contact@aeroprecision.example.com",
  "contactPerson": {
    "name": "Rajesh Mehta",
    "role": "VP Operations",
    "phonePlaceholder": "+91-98250-XXXXX"
  },
  "websitePlaceholder": "https://aeroprecision.example.com",
  "location": {
    "city": "Vadodara",
    "state": "Gujarat",
    "country": "India",
    "industrialArea": "Makarpura GIDC"
  },
  "productCategories": ["CNC Precision Machining", "Aerospace Mounts", "Automotive Housings"],
  "manufacturingProcesses": ["5-Axis CNC Milling", "CNC Turning", "Anodizing", "Coordinate Measuring Machine (CMM)"],
  "materials": ["Aluminium 6061-T6", "Aluminium 7075", "Stainless Steel 304", "Brass"],
  "equipmentCapabilities": ["DMG Mori 5-Axis Milling", "Doosan Puma Turning Center", "Zeiss CMM Inspection"],
  "minimumOrderQuantity": 500,
  "indicativeUnitPrice": 485.00,
  "priceType": "supplier_declared_estimate",
  "currency": "INR",
  "leadTimeDays": 25,
  "monthlyCapacity": { "quantity": 25000, "unit": "pieces" },
  "paymentTerms": "Net 30 Days",
  "certifications": [
    { "name": "ISO 9001:2015", "status": "verified_certificate", "validUntil": "2027-12-31" },
    { "name": "AS9100D", "status": "verified_certificate", "validUntil": "2026-11-30" },
    { "name": "IATF 16949", "status": "verified_certificate", "validUntil": "2027-06-15" }
  ],
  "qualityControl": {
    "cmmInspection": true,
    "traceabilitySystem": "ERP Batch Serialization",
    "rejectionRatePpm": 120,
    "evidenceStatus": "verified"
  },
  "deliveryPerformance": {
    "onTimeDeliveryRate": 0.98,
    "sampleSizeOrders": 42,
    "hasHistoricalEvidence": true
  },
  "industriesServed": ["Aerospace", "Automotive", "Precision Instrumentation"],
  "supportingDocuments": ["ISO_Cert_AeroPrecision.pdf", "Equipment_List_2026.pdf"],
  "dataSource": "synthetic_benchmark_catalogue",
  "lastVerificationDate": "2026-09-15",
  "evidenceConfidenceScore": 0.95,
  "isSynthetic": true
}
```

---

## 3. Data Dictionary

| Field | Type | Description |
| :--- | :--- | :--- |
| `supplierId` | String | Unique identifier matching regex `^SUP-[A-Z0-9-]+$`. |
| `companyName` | String | Fictional company name. |
| `businessEmail` | String | Fictional contact using reserved domain `example.com`. |
| `location` | Object | `city`, `state`, `country`, and optional `industrialArea`. |
| `productCategories` | Array | High-level components manufactured. |
| `manufacturingProcesses` | Array | Specific manufacturing capabilities (e.g. 5-Axis CNC Milling, Laser Cutting). |
| `materials` | Array | Compatible alloys, polymers, or sheet grades. |
| `minimumOrderQuantity` | Integer | Minimum lot size accepted. |
| `indicativeUnitPrice` | Number/null | Declared baseline estimate per piece in `INR`. |
| `priceType` | String | `supplier_declared_estimate`, `historical_average`, or `not_provided`. |
| `leadTimeDays` | Integer | Quoted turnaround in calendar days. |
| `certifications` | Array | Objects containing certificate `name` and audit `status`. |
| `evidenceConfidenceScore` | Number | Confidence multiplier (0.0 to 1.0) reflecting audit quality. |
| `isSynthetic` | Boolean | Strictly `true` to prevent confusion with real vendors. |

---

## 4. How to Validate the Catalogue

To run the automated validator against any changes in the supplier catalogue:
```bash
node -e "
import('./backend/services/supplier/supplierRepository.js').then(({default: repo}) => {
  const all = repo.findAll();
  console.log('Catalogue validated successfully:', all.total, 'suppliers loaded.');
});
"
```
Or run the unit test:
```bash
node --test backend/tests/unit/supplierCatalogue.test.js
```
