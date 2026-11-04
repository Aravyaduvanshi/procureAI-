/**
 * ProcureAI Deterministic Vendor Rating Engine
 * Evaluates suppliers against structured procurement requirements.
 * Numerical scores are computed 100% deterministically with transparent component breakdowns.
 */

export const DEFAULT_WEIGHTS = {
  technical: 0.35,
  quality: 0.20,
  commercial: 0.20,
  delivery: 0.15,
  completeness: 0.10
};

export const SCORING_MODEL_VERSION = 'v1.2.0-deterministic';

/**
 * Checks hard technical and compliance eligibility criteria.
 */
export function checkHardEligibility(supplier, requirement) {
  const disqualifications = [];

  // 1. Mandatory Process Match
  const reqProcesses = requirement.mandatoryProcesses || requirement.manufacturingProcesses || [];
  if (reqProcesses.length > 0) {
    const hasProcess = reqProcesses.some(rp =>
      supplier.manufacturingProcesses.some(sp =>
        sp.toLowerCase().includes(rp.toLowerCase()) || rp.toLowerCase().includes(sp.toLowerCase())
      )
    );
    if (!hasProcess) {
      disqualifications.push(`Missing mandatory manufacturing process: ${reqProcesses.join(', ')}`);
    }
  }

  // 2. Material Compatibility
  const reqMaterials = requirement.materials || requirement.materialCapabilities || [];
  if (reqMaterials.length > 0) {
    const hasMaterial = reqMaterials.some(rm =>
      supplier.materials.some(sm =>
        sm.toLowerCase().includes(rm.toLowerCase()) || rm.toLowerCase().includes(sm.toLowerCase())
      )
    );
    if (!hasMaterial) {
      disqualifications.push(`Does not handle required material: ${reqMaterials.join(', ')}`);
    }
  }

  // 3. Minimum Order Quantity vs Requirement Quantity
  if (requirement.targetQuantity && supplier.minimumOrderQuantity) {
    // If supplier MOQ is strictly greater than 1.5x the requirement quantity, supplier cannot fulfill the lot
    if (supplier.minimumOrderQuantity > requirement.targetQuantity * 1.5) {
      disqualifications.push(`Supplier MOQ (${supplier.minimumOrderQuantity}) exceeds batch quantity (${requirement.targetQuantity}) by more than 1.5x`);
    }
  }

  // 4. Mandatory Certifications Check
  const reqCerts = requirement.requiredCertifications || [];
  if (reqCerts.length > 0) {
    for (const reqCert of reqCerts) {
      const match = supplier.certifications.find(c => c.name.toLowerCase().includes(reqCert.toLowerCase()));
      if (!match || match.status === 'expired' || match.status === 'none') {
        disqualifications.push(`Lacks required valid certification: ${reqCert}`);
      }
    }
  }

  return {
    isEligible: disqualifications.length === 0,
    disqualifications
  };
}

/**
 * Calculates dimensional scores (0-100) and overall weighted suitability.
 */
export function calculateSupplierRating(supplier, requirement, customWeights = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  // Verify weights sum to 1.0 (with small float tolerance)
  const sumWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalizedWeights = {};
  for (const [k, v] of Object.entries(weights)) {
    normalizedWeights[k] = v / sumWeights;
  }

  const eligibility = checkHardEligibility(supplier, requirement);
  const missingInformation = [];
  const positiveFactors = [];
  const riskFactors = [];

  // --- Dimension 1: Technical Capability Fit (0 - 100) ---
  let technicalScore = 0;
  const reqProcesses = requirement.mandatoryProcesses || requirement.manufacturingProcesses || [];
  const matchedProcesses = supplier.manufacturingProcesses.filter(sp =>
    reqProcesses.some(rp => sp.toLowerCase().includes(rp.toLowerCase()) || rp.toLowerCase().includes(sp.toLowerCase()))
  );

  if (matchedProcesses.length > 0) {
    technicalScore += 45;
    positiveFactors.push(`Verified processes: ${matchedProcesses.join(', ')}`);
  } else {
    riskFactors.push('Only generic process overlap detected');
  }

  const reqMaterials = requirement.materials || [];
  const matchedMaterials = supplier.materials.filter(sm =>
    reqMaterials.some(rm => sm.toLowerCase().includes(rm.toLowerCase()) || rm.toLowerCase().includes(sm.toLowerCase()))
  );

  if (matchedMaterials.length > 0) {
    technicalScore += 30;
    positiveFactors.push(`Material compatibility: ${matchedMaterials.join(', ')}`);
  } else {
    riskFactors.push('Unverified material grades');
  }

  // Equipment sophistication (CMM, 4/5-Axis CNC, Wire EDM)
  const highEndKeywords = ['5-axis', '4-axis', 'cmm', 'zeiss', 'dmg mori', 'makino', 'wire edm'];
  const advancedEquip = (supplier.equipmentCapabilities || []).filter(eq =>
    highEndKeywords.some(kw => eq.toLowerCase().includes(kw))
  );

  if (advancedEquip.length > 0) {
    technicalScore += 25;
    positiveFactors.push(`Advanced machinery: ${advancedEquip.slice(0, 2).join(', ')}`);
  } else {
    technicalScore += 10;
  }
  technicalScore = Math.min(100, technicalScore);

  // --- Dimension 2: Quality & Certification Evidence (0 - 100) ---
  let qualityScore = 0;
  const verifiedCerts = supplier.certifications.filter(c => c.status === 'verified_certificate');
  const selfDeclaredCerts = supplier.certifications.filter(c => c.status === 'self_declared');

  if (verifiedCerts.length > 0) {
    qualityScore += Math.min(45, verifiedCerts.length * 25);
    positiveFactors.push(`Audited certifications: ${verifiedCerts.map(c => c.name).join(', ')}`);
  } else if (selfDeclaredCerts.length > 0) {
    qualityScore += 15;
    riskFactors.push('Certifications are self-declared, not independently audited');
  } else {
    riskFactors.push('No formal quality certifications on record');
  }

  if (supplier.qualityControl?.cmmInspection) {
    qualityScore += 30;
    positiveFactors.push('In-house CMM inspection available');
  } else {
    riskFactors.push('Lacks in-house Coordinate Measuring Machine (CMM)');
  }

  if (supplier.qualityControl?.traceabilitySystem) {
    qualityScore += 25;
  } else {
    missingInformation.push('Detailed component traceability system');
  }
  qualityScore = Math.min(100, qualityScore);

  // --- Dimension 3: Commercial Competitiveness (0 - 100) ---
  let commercialScore = 50; // default neutral if price missing
  const targetPrice = requirement.targetUnitPrice || 480;

  if (supplier.indicativeUnitPrice !== null && supplier.indicativeUnitPrice !== undefined) {
    const ratio = supplier.indicativeUnitPrice / targetPrice;
    if (ratio <= 0.95) {
      commercialScore = 95;
      positiveFactors.push(`Highly competitive unit price (₹${supplier.indicativeUnitPrice} vs target ₹${targetPrice})`);
    } else if (ratio <= 1.05) {
      commercialScore = 85;
      positiveFactors.push(`Aligned unit price (₹${supplier.indicativeUnitPrice} vs target ₹${targetPrice})`);
    } else if (ratio <= 1.20) {
      commercialScore = 65;
      riskFactors.push(`Indicative price is ${Math.round((ratio - 1) * 100)}% above buyer target`);
    } else {
      commercialScore = 40;
      riskFactors.push(`Indicative price is significantly above target (₹${supplier.indicativeUnitPrice})`);
    }

    if (supplier.paymentTerms?.toLowerCase().includes('net 30') || supplier.paymentTerms?.toLowerCase().includes('net 45')) {
      commercialScore = Math.min(100, commercialScore + 5);
      positiveFactors.push(`Favorable credit terms (${supplier.paymentTerms})`);
    } else if (supplier.paymentTerms?.toLowerCase().includes('100% advance') || supplier.paymentTerms?.toLowerCase().includes('proforma')) {
      commercialScore = Math.max(10, commercialScore - 15);
      riskFactors.push(`Demands restrictive upfront payment terms: ${supplier.paymentTerms}`);
    }
  } else {
    missingInformation.push('Indicative unit price quotation');
    riskFactors.push('Pricing not declared in catalogue; requires RFQ quotation');
  }

  // --- Dimension 4: Delivery Feasibility (0 - 100) ---
  let deliveryScore = 50;
  const requestedLeadTime = requirement.requestedLeadTimeDays || 30;

  if (supplier.leadTimeDays <= requestedLeadTime) {
    deliveryScore = 95;
    positiveFactors.push(`Committed lead time (${supplier.leadTimeDays}d) within requested window (${requestedLeadTime}d)`);
  } else if (supplier.leadTimeDays <= requestedLeadTime + 5) {
    deliveryScore = 75;
    riskFactors.push(`Lead time (${supplier.leadTimeDays}d) slightly exceeds target (${requestedLeadTime}d)`);
  } else {
    deliveryScore = 35;
    riskFactors.push(`Extended lead time (${supplier.leadTimeDays}d) violates target delivery schedule`);
  }

  if (supplier.monthlyCapacity?.quantity && requirement.targetQuantity) {
    const capacityRatio = supplier.monthlyCapacity.quantity / requirement.targetQuantity;
    if (capacityRatio >= 2.0) {
      deliveryScore = Math.min(100, deliveryScore + 5);
      positiveFactors.push(`High production buffer (${Math.round(capacityRatio)}x batch quantity)`);
    } else if (capacityRatio < 1.0) {
      deliveryScore = Math.max(20, deliveryScore - 20);
      riskFactors.push('Monthly capacity is below batch quantity; risk of production bottleneck');
    }
  } else {
    missingInformation.push('Monthly dedicated manufacturing capacity');
  }

  // --- Dimension 5: Evidence Completeness & Confidence (0 - 100) ---
  const confidenceMultiplier = supplier.evidenceConfidenceScore ?? 0.7;
  const completenessScore = Math.round(confidenceMultiplier * 100);

  if (confidenceMultiplier < 0.75) {
    riskFactors.push('Low evidentiary backing; claims require on-site supplier audit');
  }

  // --- Weighted Overall Score ---
  const overallScore = Number((
    (technicalScore * normalizedWeights.technical) +
    (qualityScore * normalizedWeights.quality) +
    (commercialScore * normalizedWeights.commercial) +
    (deliveryScore * normalizedWeights.delivery) +
    (completenessScore * normalizedWeights.completeness)
  ).toFixed(1));

  let confidenceLevel = 'MEDIUM';
  if (confidenceMultiplier >= 0.90) confidenceLevel = 'HIGH';
  else if (confidenceMultiplier < 0.70) confidenceLevel = 'LOW';

  return {
    supplierId: supplier.supplierId,
    companyName: supplier.companyName,
    location: `${supplier.location.city}, ${supplier.location.state}`,
    isEligible: eligibility.isEligible,
    disqualifications: eligibility.disqualifications,
    overallScore: eligibility.isEligible ? overallScore : 0,
    confidenceLevel,
    evidenceConfidenceScore: confidenceMultiplier,
    historicalPerformance: supplier.deliveryPerformance?.hasHistoricalEvidence ? {
      onTimeDeliveryRate: supplier.deliveryPerformance.onTimeDeliveryRate,
      sampleSizeOrders: supplier.deliveryPerformance.sampleSizeOrders
    } : null,
    scoringBreakdown: {
      dimensions: {
        technicalCapability: { score: technicalScore, weight: normalizedWeights.technical },
        qualityCertifications: { score: qualityScore, weight: normalizedWeights.quality },
        commercialCompetitiveness: { score: commercialScore, weight: normalizedWeights.commercial },
        deliveryFeasibility: { score: deliveryScore, weight: normalizedWeights.delivery },
        evidenceCompleteness: { score: completenessScore, weight: normalizedWeights.completeness }
      },
      positiveFactors,
      riskFactors,
      missingInformation,
      scoringModelVersion: SCORING_MODEL_VERSION
    }
  };
}
