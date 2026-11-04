import aiOrchestrator from '../matching/aiOrchestrator.js';

/**
 * Formulates commercial limits and strategy options.
 * Does not invent numbers without explicit basis; clearly marks preliminary calculations.
 */
export async function buildNegotiationStrategy({ supplier, requirement, rating, buyerObjective = 'BALANCED' }) {
  return aiOrchestrator.formulateNegotiationStrategy({
    supplier,
    requirement,
    rating,
    buyerObjective
  });
}

/**
 * Evaluates a supplier counteroffer against pre-authorized commercial limits.
 */
export function evaluateSupplierCounteroffer({ counteroffer, session }) {
  const { proposedUnitPrice, proposedLeadTimeDays, proposedPaymentTerms } = counteroffer;
  const targetPrice = session.commercialParameters?.buyerTargetPrice || 480;
  const maxLimit = session.commercialParameters?.authorizedReservationLimit || 500;
  const targetLeadTime = session.requirementLeadTimeDays || 30;

  const priceVariance = proposedUnitPrice - targetPrice;
  const priceVariancePercent = Number(((priceVariance / targetPrice) * 100).toFixed(1));

  let outcomeVerdict = 'REVIEW_REQUIRED';
  let recommendedNextAction = 'PREPARE_COUNTEROFFER';
  let rationale = '';

  if (proposedUnitPrice <= targetPrice) {
    outcomeVerdict = 'HIGHLY_FAVORABLE';
    recommendedNextAction = 'RECOMMEND_ACCEPTANCE';
    rationale = `Supplier quoted ₹${proposedUnitPrice}, which meets or beats the buyer target of ₹${targetPrice}. Recommend closing subject to final buyer signoff.`;
  } else if (proposedUnitPrice <= maxLimit) {
    outcomeVerdict = 'ACCEPTABLE_WITH_CONCESSION';
    recommendedNextAction = 'COUNTER_SPLIT_DIFFERENCE';
    const splitOffer = Math.round((proposedUnitPrice + targetPrice) / 2);
    rationale = `Supplier counteroffer of ₹${proposedUnitPrice} is within the pre-authorized reservation cap (₹${maxLimit}), but ${priceVariancePercent}% above target. Recommend counteroffering at ₹${splitOffer} with commitment to recurring purchase orders.`;
  } else {
    outcomeVerdict = 'EXCEEDS_AUTHORIZED_LIMIT';
    recommendedNextAction = 'ESCALATE_TO_LEAD_BUYER';
    rationale = `Supplier counteroffer of ₹${proposedUnitPrice} strictly exceeds the maximum authorized reservation limit of ₹${maxLimit} by ₹${proposedUnitPrice - maxLimit}. Autonomous or standard acceptance blocked; requires explicit escalation and authorization by Lead Buyer.`;
  }

  // Delivery feasibility check
  let deliveryFeasible = true;
  if (proposedLeadTimeDays && proposedLeadTimeDays > targetLeadTime + 7) {
    deliveryFeasible = false;
    rationale += ` Warning: Proposed delivery timeline (${proposedLeadTimeDays} days) significantly exceeds project schedule (${targetLeadTime} days).`;
  }

  return {
    counterofferId: `CO-${Date.now().toString(36).toUpperCase()}`,
    evaluatedAt: new Date().toISOString(),
    proposedUnitPrice,
    proposedLeadTimeDays,
    proposedPaymentTerms,
    targetPrice,
    maxLimit,
    priceVariance,
    priceVariancePercent,
    deliveryFeasible,
    outcomeVerdict,
    recommendedNextAction,
    rationale,
    requiresHumanDecision: true
  };
}
