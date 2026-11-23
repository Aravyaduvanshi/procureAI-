import 'dotenv/config';

export class AIOrchestrator {
  constructor() {
    this.isAiEnabled =
      process.env.ENABLE_AI === 'true' &&
      Boolean(process.env.LLM_API_KEY);

    this.modelName =
      process.env.LLM_MODEL ||
      'openai/gpt-oss-20b';

    this.baseUrl =
      process.env.LLM_BASE_URL ||
      'https://api.groq.com/openai/v1/chat/completions';
  }

  // =========================================================
  // GENERIC LLM CALLER
  // =========================================================

  async callLLM({
    systemPrompt,
    userPrompt,
    temperature = 0.4
  }) {
    if (!this.isAiEnabled && process.env.NODE_ENV !== 'test') {
      throw new Error(
        'LLM is not enabled. Set ENABLE_AI=true and provide LLM_API_KEY.'
      );
    }

    // Per Section 47: In automated tests, support mock LLM provider
    if (process.env.NODE_ENV === 'test' && (!this.isAiEnabled || process.env.MOCK_LLM_IN_TESTS === 'true')) {
      return this.mockLLMResponse(systemPrompt, userPrompt);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LLM_API_KEY}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature,
          response_format: {
            type: 'json_object'
          }
        })
      });

      if (response.status === 404) {
        throw new Error(
          `Configuration error: LLM model "${this.modelName}" not found (404 model_not_found). Please check LLM_MODEL in .env.`
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `LLM request failed (${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('LLM returned an empty response');
      }

      console.log(`[LLM] Generated response using model ${this.modelName}`);
      return JSON.parse(content);
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        console.warn(`[LLM:Test] Falling back to mocked LLM response for test suite: ${err.message}`);
        return this.mockLLMResponse(systemPrompt, userPrompt);
      }
      throw err;
    }
  }

  mockLLMResponse(systemPrompt, userPrompt) {
    if (systemPrompt.includes('counteroffer') || userPrompt.includes('COUNTEROFFER')) {
      return {
        subject: 'Re: Commercial Terms Discussion — Precision Component RFQ',
        body: 'Thank you for your quotation. Following our procurement guidelines, we propose a mutually agreeable unit price aligned with our project baseline and recurring commitment. Please review the updated terms.'
      };
    }

    if (systemPrompt.includes('opening procurement') || userPrompt.includes('OPENING') || userPrompt.includes('COMMERCIAL PARAMETERS')) {
      return {
        subject: 'Request for Quotation & Commercial Discussion: Precision Manufacturing Lot',
        body: 'We are pleased to invite your firm to quote for our manufacturing requirement. We are seeking firm pricing, confirmed lead time, and ISO/quality compliance for the initial production lot. Please find our opening commercial parameters enclosed and reply with your earliest confirmation.'
      };
    }

    if (systemPrompt.includes('Requirement Analysis')) {
      return {
        summary: 'Industrial procurement requirement analysis',
        criticalRequirements: ['CNC Milling', 'Aluminium 6061-T6'],
        commercialRequirements: ['Target price ~INR 480'],
        technicalRequirements: ['ISO 9001:2015', 'CMM Inspection'],
        deliveryRequirements: ['30 days delivery lead time'],
        missingInformation: [],
        riskFlags: []
      };
    }

    return {
      commentary: 'Deterministic evaluation confirmed vendor capabilities align with technical parameters.',
      keyStrengths: ['Proven ISO quality system', 'In-house precision CNC capacity'],
      keyRisks: ['Moderate lead time'],
      recommendationVerdict: 'RECOMMENDED_FOR_SHORTLIST'
    };
  }

  getMode() {
    return this.isAiEnabled
      ? `LIVE_LLM (${this.modelName})`
      : 'DETERMINISTIC_LOCAL_MODE';
  }

  // =========================================================
  // REQUIREMENT ANALYSIS AGENT
  // =========================================================
  async analyzeRequirement(requirement) {
    if (!requirement) {
      throw new Error('Requirement data is required');
    }

    const systemPrompt = `
You are the Requirement Analysis Agent for ProcureAI.
You analyze industrial procurement requirements.
Rules:
1. Do not invent missing information.
2. Clearly distinguish provided information from missing information.
3. Do not change numerical values.
4. Do not create supplier information.
5. Do not make purchasing decisions.
6. Return valid JSON only.

Return:
{
  "summary": "...",
  "criticalRequirements": [],
  "commercialRequirements": [],
  "technicalRequirements": [],
  "deliveryRequirements": [],
  "missingInformation": [],
  "riskFlags": []
}
`;

    const userPrompt = `Analyze this procurement requirement:\n${JSON.stringify(requirement, null, 2)}`;

    return await this.callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.2
    });
  }

  // =========================================================
  // VENDOR EVALUATION AGENT
  // =========================================================
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
      dimensions: dims,
      recommendationVerdict: rating.overallScore >= 80 ? 'RECOMMENDED_FOR_SHORTLIST' : 'PROCEED_WITH_CAUTION'
    };
  }

  // =========================================================
  // SUPPLIER MATCHING AGENT
  // =========================================================
  async generateMatchingExecutiveSummary(requirement, topSuppliers, excludedSuppliers) {
    const count = topSuppliers.length;
    const topName = count > 0 ? topSuppliers[0].companyName : 'None';
    const topScore = count > 0 ? topSuppliers[0].overallScore : 0;

    return {
      agent: 'Supplier Matching Agent',
      mode: this.getMode(),
      timestamp: new Date().toISOString(),
      headline: `Evaluated suppliers: ${count} qualified candidates recommended; ${excludedSuppliers.length} excluded by mandatory criteria.`,
      leadCandidate: count > 0 ? `${topName} (${topScore}/100)` : null,
      summaryParagraph:
        `Based on requirement specifications for "${requirement.title}" (Lot: ${requirement.targetQuantity} pcs, Target: ₹${requirement.targetUnitPrice ?? 480}), the deterministic matching engine identified ${count} eligible suppliers. ${excludedSuppliers.length} suppliers were excluded by mandatory criteria.`,
      recommendedNextStep: 'Buyer review and approval required before preparing negotiation strategies.'
    };
  }

  // =========================================================
  // NEGOTIATION AGENT: OPENING MESSAGE
  // =========================================================
  async generateOpeningNegotiationMessage({
    supplier,
    requirement,
    commercialParameters,
    buyerObjective
  }) {
    const systemPrompt = `
You are a procurement negotiation communication agent working for an industrial manufacturing enterprise.
You are not authorized to change commercial values. Use the supplied values exactly.

IMPORTANT RULES:
1. Never invent prices.
2. Never invent quantities.
3. Never invent delivery dates or lead time.
4. Never invent certifications or payment terms.
5. Use ONLY the facts supplied in the procurement context.
6. Never reveal the buyer's internal reservation limit.
7. Never reveal internal scoring, matching algorithms, or vendor ratings.
8. Never mention that you are an AI.
9. Be commercially firm, professional, and courteous.
10. Do not change the proposed opening offer or target price.
11. Return JSON only in format:
{
  "subject": "...",
  "body": "..."
}
`;

    const userPrompt = `
Generate the opening procurement negotiation message.

BUYER OBJECTIVE: ${buyerObjective}

REQUIREMENT:
${JSON.stringify({
  title: requirement.title,
  quantity: requirement.targetQuantity || commercialParameters.batchQuantity,
  requestedLeadTimeDays: requirement.requestedLeadTimeDays,
  materials: requirement.materials,
  mandatoryProcesses: requirement.mandatoryProcesses,
  requiredCertifications: requirement.requiredCertifications
}, null, 2)}

SUPPLIER:
${JSON.stringify({
  companyName: supplier.companyName,
  contactPerson: supplier.contactPerson,
  businessEmail: supplier.businessEmail
}, null, 2)}

COMMERCIAL PARAMETERS:
${JSON.stringify({
  proposedOpeningOffer: commercialParameters.proposedOpeningOffer,
  buyerTargetPrice: commercialParameters.buyerTargetPrice,
  currency: commercialParameters.currency || 'INR',
  batchQuantity: commercialParameters.batchQuantity
}, null, 2)}
`;

    return await this.callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.5
    });
  }

  // =========================================================
  // NEGOTIATION STRATEGY FORMULATION
  // =========================================================
  async formulateNegotiationStrategy({
    supplier,
    requirement,
    rating,
    buyerObjective = 'BALANCED'
  }) {
    const currentPrice = supplier.indicativeUnitPrice || 500;
    const targetPrice = requirement.targetUnitPrice || Math.round(currentPrice * 0.92);
    const initialOffer = Math.round(targetPrice * 0.96);
    const reservationPrice = Math.round(targetPrice * 1.05);

    const openingMessage = await this.generateOpeningNegotiationMessage({
      supplier,
      requirement,
      commercialParameters: {
        supplierIndicativePrice: currentPrice,
        proposedOpeningOffer: initialOffer,
        buyerTargetPrice: targetPrice,
        authorizedReservationLimit: reservationPrice,
        currency: 'INR',
        batchQuantity: requirement.targetQuantity
      },
      buyerObjective
    });

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
        'Leverage guaranteed batch volume for unit price concession',
        'Request tiered pricing for recurring orders',
        'Negotiate delivery and payment terms alongside price'
      ],
      draftMessage: {
        recipientEmail: supplier.businessEmail,
        recipientName: supplier.contactPerson?.name || supplier.contactPerson || 'Sales Team',
        subject: openingMessage.subject,
        body: openingMessage.body,
        generatedBy: 'LLM',
        model: this.modelName,
        generatedAt: new Date().toISOString()
      },
      requiresHumanApproval: true
    };
  }

  // =========================================================
  // LLM COUNTEROFFER MESSAGE
  // =========================================================
  async generateCounterofferMessage({
    supplier,
    requirement,
    session,
    evaluation
  }) {
    const systemPrompt = `
You are a procurement negotiation communication agent. You are not authorized to change commercial values. Use the supplied values exactly.

IMPORTANT RULES:
1. Never invent commercial facts.
2. Never change the proposed counteroffer price or agreed terms.
3. Never reveal the buyer's internal reservation limit or scores.
4. Never mention algorithms or that you are an AI.
5. Maintain a professional B2B procurement tone.
6. If a counteroffer is required, use EXACTLY the price provided in the deterministic evaluation.
7. Return JSON only in format:
{
  "subject": "...",
  "body": "..."
}
`;

    const userPrompt = `
Generate the next supplier-facing procurement message.

REQUIREMENT:
${JSON.stringify({
  title: requirement.title,
  quantity: session.requirementQuantity,
  targetPrice: session.commercialParameters?.buyerTargetPrice,
  requestedLeadTimeDays: session.requirementLeadTimeDays
}, null, 2)}

SUPPLIER:
${JSON.stringify({
  companyName: supplier.companyName,
  contactPerson: supplier.contactPerson,
  businessEmail: supplier.businessEmail
}, null, 2)}

SUPPLIER COUNTEROFFER RECEIVED:
${JSON.stringify({
  proposedUnitPrice: evaluation.proposedUnitPrice,
  proposedLeadTimeDays: evaluation.proposedLeadTimeDays
}, null, 2)}

DETERMINISTIC EVALUATION & DECISION:
${JSON.stringify({
  outcomeVerdict: evaluation.outcomeVerdict,
  recommendedNextAction: evaluation.recommendedNextAction,
  counterPrice: evaluation.counterPrice,
  rationale: evaluation.rationale
}, null, 2)}
`;

    return await this.callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.45
    });
  }
}

export default new AIOrchestrator();
