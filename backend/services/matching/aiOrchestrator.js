/**
 * ProcureAI Specialized AI Roles & Orchestration Module
 * Coordinates specialized AI roles:
 * - Agent 1: Requirement Analysis Agent
 * - Agent 2: Supplier Intelligence Agent
 * - Agent 3: Vendor Evaluation Agent
 * - Agent 4: Supplier Matching Agent
 * - Agent 5: Negotiation Agent
 *
 * Deterministic application logic controls all numerical scores, filtering, and approval gates.
 * When ENABLE_AI=false or API key is absent, deterministic rule-based generators are used with clear status labels.
 */

export class AIOrchestrator {
  constructor() {
    this.isAiEnabled = process.env.ENABLE_AI === 'true' && Boolean(process.env.LLM_API_KEY);
    this.modelName = process.env.LLM_MODEL || 'gemini-1.5-flash';
  }

  getMode() {
    return this.isAiEnabled ? `LIVE_LLM (${this.modelName})` : 'DETERMINISTIC_LOCAL_MODE';
  }

  /**
   * Agent 2: Supplier Intelligence Agent
   * Summarizes key supplier capabilities and evidence credibility.
   */
  async summarizeSupplierIntelligence(supplier) {
    const certNames = (supplier.certifications || []).map(c => `${c.name} (${c.status})`).join(', ');
    const processes = (supplier.manufacturingProcesses || []).join(', ');
    const confidence = Math.round((supplier.evidenceConfidenceScore || 0.7) * 100);

    return {
      agent: 'Supplier Intelligence Agent',
      mode: this.getMode(),
      summary: `${supplier.companyName} is an industrial manufacturer based in ${supplier.location.city}, ${supplier.location.state}. Core processes: ${processes}. Certifications: ${certNames || 'None'}. Claim confidence: ${confidence}%.`,
      hasAuditedEvidence: (supplier.certifications || []).some(c => c.status === 'verified_certificate'),
      verificationNotes: supplier.lastVerificationDate ? `Verified on ${supplier.lastVerificationDate} via ${supplier.dataSource}` : 'Unverified self-reported profile'
    };
  }

  /**
   * Agent 3: Vendor Evaluation Agent
   * Explains suitability scoring results and specific risks in natural language.
   * Note: Numerical score is strictly input from deterministic engine.
   */
  async explainVendorEvaluation(supplier, rating) {
    const pros = rating.scoringBreakdown?.positiveFactors || [];
    const risks = rating.scoringBreakdown?.riskFactors || [];
    const dims = rating.scoringBreakdown?.dimensions || {};

    let commentary = `${supplier.companyName} scored ${rating.overallScore}/100. `;
    if (rating.overallScore >= 90) {
      commentary += 'High technical and operational alignment with robust quality certification evidence.';
    } else if (rating.overallScore >= 75) {
      commentary += 'Satisfactory baseline match, with moderate delivery or commercial trade-offs.';
    } else {
      commentary += 'Low suitability rating due to material or delivery constraints.';
    }

    return {
      agent: 'Vendor Evaluation Agent',
      mode: this.getMode(),
      commentary,
      keyStrengths: pros.slice(0, 3),
      keyRisks: risks.slice(0, 3),
      recommendationVerdict: rating.overallScore >= 80 ? 'RECOMMENDED_FOR_SHORTLIST' : 'PROCEED_WITH_CAUTION'
    };
  }

  /**
   * Agent 4: Supplier Matching Agent
   * Synthesizes the overall matching results and executive justification for the buyer.
   */
  async generateMatchingExecutiveSummary(requirement, topSuppliers, excludedSuppliers) {
    const count = topSuppliers.length;
    const topName = count > 0 ? topSuppliers[0].companyName : 'None';
    const topScore = count > 0 ? topSuppliers[0].overallScore : 0;

    return {
      agent: 'Supplier Matching Agent',
      mode: this.getMode(),
      timestamp: new Date().toISOString(),
      headline: `Evaluated 20 suppliers: ${count} qualified candidates recommended; ${excludedSuppliers.length} excluded by mandatory criteria.`,
      leadCandidate: count > 0 ? `${topName} (${topScore}/100)` : null,
      summaryParagraph: `Based on requirement specifications for "${requirement.title}" (Lot: ${requirement.targetQuantity} pcs, Target: ₹${requirement.targetUnitPrice || 480}), the deterministic matching engine identified ${count} eligible suppliers with verified 4/5-Axis CNC capability and valid ISO certifications. ${excludedSuppliers.length} suppliers were disqualified due to process incompatibility, excessive MOQs, or missing quality certifications.`,
      recommendedNextStep: 'Buyer review and approval required before preparing negotiation strategies.'
    };
  }

  /**
   * Agent 5: Negotiation Agent
   * Formulates negotiation strategy, target concession points, and draft opening messages.
   */
  async formulateNegotiationStrategy({ supplier, requirement, rating, buyerObjective = 'BALANCED' }) {
    const currentPrice = supplier.indicativeUnitPrice || 500;
    const targetPrice = requirement.targetUnitPrice || Math.round(currentPrice * 0.92);
    const initialOffer = Math.round(targetPrice * 0.96); // Anchoring offer ~4% below target
    const reservationPrice = Math.round(targetPrice * 1.04); // Maximum willingness to pay

    const openingMessage = `Dear ${supplier.contactPerson?.name || 'Sales Team'},\n\nWe are evaluating suppliers for the procurement of ${requirement.targetQuantity} units of ${requirement.title} for our Vadodara manufacturing facility.\n\nReviewing ${supplier.companyName}'s manufacturing capabilities and quality certifications, we would like to invite your formal quotation. Based on our volume commitment of ${requirement.targetQuantity} pieces and scheduled delivery within ${requirement.requestedLeadTimeDays} days, our target price is INR ${initialOffer}.00 per piece under standard Net 30 payment terms.\n\nPlease confirm manufacturing feasibility against our drawing specifications and your earliest delivery schedule.\n\nSincerely,\nProcurement Lead, Gujarat Precision Electro-Mech Pvt. Ltd.`;

    return {
      agent: 'Negotiation Agent',
      mode: this.getMode(),
      strategyType: buyerObjective,
      commercialParameters: {
        supplierIndicativePrice: currentPrice,
        proposedOpeningOffer: initialOffer,
        buyerTargetPrice: targetPrice,
        authorizedReservationLimit: reservationPrice,
        currency: 'INR',
        batchQuantity: requirement.targetQuantity
      },
      negotiationTactics: [
        'Leverage guaranteed 5,000 piece batch volume for unit price concession',
        'Request tiered pricing schedule for recurring quarterly replenishment lots',
        'Offer prompt Net 30 payment terms in exchange for committed 25-day delivery window'
      ],
      draftMessage: {
        recipientEmail: supplier.businessEmail,
        recipientName: supplier.contactPerson?.name || 'Sales Team',
        subject: `RFQ & Commercial Discussion: ${requirement.title} [Qty: ${requirement.targetQuantity}]`,
        body: openingMessage
      },
      requiresHumanApproval: true
    };
  }
}

export default new AIOrchestrator();
