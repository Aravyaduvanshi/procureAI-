import crypto from 'crypto';
import db from '../../shared/db.js';
import supplierRepo from '../supplier/supplierRepository.js';
import { buildNegotiationStrategy, evaluateSupplierCounteroffer } from './negotiationEngine.js';
import { NEGOTIATION_STATES, validateTransition } from './negotiationStateMachine.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../shared/errors.js';
import { emitRealtimeEvent } from '../../shared/realtime.js';
import aiOrchestrator from '../matching/aiOrchestrator.js';

export const createNegotiationSession = async (req, res, next) => {
  try {
    const { supplierId, matchingRunId, requirementId, buyerObjective = 'BALANCED', targetPrice, reservationLimit } = req.body;

    if (!supplierId || !requirementId) {
      throw new ValidationError('supplierId and requirementId are required');
    }

    const supplier = supplierRepo.findById(supplierId, true);
    if (!supplier) {
      throw new NotFoundError(`Supplier ${supplierId} not found`);
    }

    const requirement = await db.requirements.findById(requirementId);
    if (!requirement) {
      throw new NotFoundError(`Requirement ${requirementId} not found`);
    }

    let matchSnapshot = null;
    if (matchingRunId) {
      const matchingRun = await db.matchingRuns.findById(matchingRunId);
      if (matchingRun) {
        const matchedSupplier = (matchingRun.recommendedShortlist || matchingRun.shortlistedSuppliers || [])
          .find(s => s.supplierId === supplierId);
        if (matchedSupplier) {
          matchSnapshot = {
            supplierId: matchedSupplier.supplierId,
            companyName: matchedSupplier.companyName,
            overallScore: matchedSupplier.overallScore,
            confidenceLevel: matchedSupplier.confidenceLevel,
            scoringBreakdown: matchedSupplier.scoringBreakdown,
            recommendationVerdict: matchedSupplier.recommendationVerdict
          };
        }
      }
    }

    // Check for existing active negotiation for this supplier and requirement
    const existing = await db.negotiations.findAll(n =>
      n.supplierId === supplierId &&
      n.requirementId === requirementId &&
      !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(n.status)
    );

    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'An active negotiation session already exists for this supplier and requirement',
        negotiation: existing[0]
      });
    }

    const sessionId = `NEG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const initialTarget = targetPrice ? Number(targetPrice) : (requirement.targetUnitPrice || 480);
    const initialMax = reservationLimit ? Number(reservationLimit) : Math.round(initialTarget * 1.05);
    const openingOffer = Math.round(initialTarget * 0.96);

    const record = {
      id: sessionId,
      supplierId,
      supplierName: supplier.companyName,
      supplierEmail: supplier.businessEmail,
      contactPerson: supplier.contactPerson,

      requirementId,
      requirementTitle: requirement.title,
      requirementQuantity: requirement.targetQuantity || 5000,
      requirementLeadTimeDays: requirement.requestedLeadTimeDays || 30,

      matchingRunId: matchingRunId || null,
      matchSnapshot: matchSnapshot || {
        supplierId,
        companyName: supplier.companyName,
        overallScore: supplier.overallRating ? Math.round(supplier.overallRating * 20) : 85,
        confidenceLevel: 'HIGH'
      },

      buyerObjective,
      currentRound: 1,
      targetUnitPrice: initialTarget,
      supplierCurrentPrice: supplier.indicativeUnitPrice || 500,
      reservationLimit: initialMax,
      openingOffer,
      buyerPosition: {
        targetUnitPrice: initialTarget,
        reservationLimit: initialMax,
        openingOffer
      },
      supplierPosition: {
        indicativeUnitPrice: supplier.indicativeUnitPrice || 500,
        leadTimeDays: supplier.leadTimeDays || 30
      },
      commercialParameters: {
        supplierIndicativePrice: supplier.indicativeUnitPrice || 500,
        buyerTargetPrice: initialTarget,
        authorizedReservationLimit: initialMax,
        proposedOpeningOffer: openingOffer,
        currency: 'INR'
      },
      status: NEGOTIATION_STATES.DRAFT,
      statusHistory: [
        { status: NEGOTIATION_STATES.DRAFT, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com' }
      ],
      strategy: null,
      messageDraft: null,
      messageHistory: [],
      counteroffers: [],
      finalOutcome: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.negotiations.save(record);

    await db.logAudit({
      entityType: 'negotiation',
      entityId: sessionId,
      action: 'NEGOTIATION_SESSION_CREATED',
      actor: req.user?.email || 'buyer@example.com',
      details: {
        supplierId,
        requirementId,
        matchingRunId,
        targetPrice: initialTarget,
        reservationLimit: initialMax
      }
    });

    console.log(`[NEGOTIATION] ${sessionId} created for supplier ${supplierId}`);

    await emitRealtimeEvent('NEGOTIATION_CREATED', 'negotiation', sessionId, record);
    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', sessionId, record);

    res.status(201).json({
      success: true,
      negotiation: record
    });
  } catch (err) {
    next(err);
  }
};

export const listNegotiationSessions = async (req, res, next) => {
  try {
    const { requirementId, supplierId, status } = req.query;
    let list = await db.negotiations.findAll();

    if (requirementId) list = list.filter(n => n.requirementId === requirementId);
    if (supplierId) list = list.filter(n => n.supplierId === supplierId);
    if (status) list = list.filter(n => n.status === status);

    res.json({
      success: true,
      count: list.length,
      negotiations: list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    });
  } catch (err) {
    next(err);
  }
};

export const getNegotiationSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    // Attach latest messages from PostgreSQL
    const messages = await db.messages.findAll(m => m.negotiationId === id);
    const enrichedSession = {
      ...session,
      messageHistory: messages.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
    };

    res.json({
      success: true,
      negotiation: enrichedSession
    });
  } catch (err) {
    next(err);
  }
};

export const generateStrategyAndDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    const supplier = supplierRepo.findById(session.supplierId, true);
    const requirement = await db.requirements.findById(session.requirementId);

    const strategyResult = await buildNegotiationStrategy({
      supplier: supplier || {
        companyName: session.supplierName,
        indicativeUnitPrice: session.commercialParameters?.supplierIndicativePrice || 500,
        businessEmail: session.supplierEmail,
        contactPerson: session.contactPerson
      },
      requirement: {
        ...requirement,
        targetUnitPrice: session.commercialParameters?.buyerTargetPrice || 480,
        targetQuantity: session.requirementQuantity || 5000
      },
      rating: session.matchSnapshot,
      buyerObjective: session.buyerObjective
    });

    const targetState = NEGOTIATION_STATES.AWAITING_STRATEGY_APPROVAL;
    const transitionCheck = validateTransition(session.status, targetState);
    if (!transitionCheck.valid) {
      throw new ValidationError(transitionCheck.error);
    }

    const updated = {
      ...session,
      strategy: strategyResult,
      messageDraft: strategyResult.draftMessage,
      commercialParameters: {
        ...session.commercialParameters,
        ...strategyResult.commercialParameters
      },
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        { status: targetState, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com' }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.negotiations.update(id, updated);

    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'STRATEGY_AND_DRAFT_GENERATED',
      actor: req.user?.email || 'buyer@example.com',
      details: { proposedOpeningOffer: updated.commercialParameters.proposedOpeningOffer }
    });

    console.log(`[NEGOTIATION] ${id} strategy generated`);

    await emitRealtimeEvent('STRATEGY_GENERATED', 'negotiation', id, { strategy: strategyResult });
    await emitRealtimeEvent('MESSAGE_DRAFTED', 'negotiation', id, { draft: strategyResult.draftMessage });
    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', id, updated);

    res.json({
      success: true,
      negotiation: updated,
      strategy: strategyResult,
      draftMessage: strategyResult.draftMessage
    });
  } catch (err) {
    next(err);
  }
};

export const approveStrategy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { modifiedParameters, reason = 'Strategy approved by buyer' } = req.body;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    const targetState = NEGOTIATION_STATES.READY_FOR_MESSAGE_APPROVAL;
    const transitionCheck = validateTransition(session.status, targetState);
    if (!transitionCheck.valid) {
      throw new ValidationError(transitionCheck.error);
    }

    const approvalId = `APP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const approvalRecord = {
      id: approvalId,
      proposalId: id,
      proposalVersion: session.currentRound || 1,
      actionType: 'NEGOTIATION_STRATEGY_APPROVAL',
      decision: 'APPROVED',
      approver: req.user?.email || 'buyer@example.com',
      reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.approvals.save(approvalRecord);

    const updated = {
      ...session,
      commercialParameters: {
        ...session.commercialParameters,
        ...(modifiedParameters || {})
      },
      strategyApproval: {
        approvalId,
        approvedBy: req.user?.email || 'buyer@example.com',
        timestamp: new Date().toISOString(),
        reason
      },
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        { status: targetState, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com', notes: reason }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.negotiations.update(id, updated);

    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'STRATEGY_APPROVED_BY_BUYER',
      actor: req.user?.email || 'buyer@example.com',
      details: { commercialParameters: updated.commercialParameters }
    });

    console.log(`[NEGOTIATION] ${id} strategy approved by buyer`);

    await emitRealtimeEvent('STRATEGY_APPROVED', 'negotiation', id, { approval: approvalRecord });
    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', id, updated);

    res.json({
      success: true,
      negotiation: updated
    });
  } catch (err) {
    next(err);
  }
};

export const approveMessageDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customizedMessage, reason = 'Outbound draft approved' } = req.body;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    const targetState = NEGOTIATION_STATES.APPROVED_TO_SEND;
    const transitionCheck = validateTransition(session.status, targetState);
    if (!transitionCheck.valid) {
      throw new ValidationError(transitionCheck.error);
    }

    const approvalId = `APP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const approvalRecord = {
      id: approvalId,
      proposalId: id,
      proposalVersion: session.currentRound || 1,
      actionType: 'MESSAGE_SEND_APPROVAL',
      decision: 'APPROVED',
      approver: req.user?.email || 'buyer@example.com',
      reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.approvals.save(approvalRecord);

    const updated = {
      ...session,
      messageDraft: customizedMessage ? { ...session.messageDraft, ...customizedMessage } : session.messageDraft,
      messageApproval: {
        approvalId,
        approvedBy: req.user?.email || 'buyer@example.com',
        timestamp: new Date().toISOString(),
        reason
      },
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        { status: targetState, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com', notes: reason }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.negotiations.update(id, updated);

    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'MESSAGE_DRAFT_APPROVED_FOR_SEND',
      actor: req.user?.email || 'buyer@example.com',
      details: { recipientEmail: updated.messageDraft?.recipientEmail }
    });

    console.log(`[NEGOTIATION] ${id} message draft approved for send`);

    await emitRealtimeEvent('MESSAGE_APPROVED', 'negotiation', id, { approval: approvalRecord });
    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', id, updated);

    res.json({
      success: true,
      negotiation: updated
    });
  } catch (err) {
    next(err);
  }
};

export const recordCounteroffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proposedUnitPrice, proposedLeadTimeDays, proposedPaymentTerms, notes, rawSupplierMessage } = req.body;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    if (!proposedUnitPrice) {
      throw new ValidationError('proposedUnitPrice is required in counteroffer');
    }

    const priceNum = Number(proposedUnitPrice);
    const leadTimeNum = Number(proposedLeadTimeDays || session.requirementLeadTimeDays || 30);

    // Record incoming message in PostgreSQL messages collection
    const inboundMessageId = `MSG-IN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const inboundMsg = {
      id: inboundMessageId,
      negotiationId: id,
      sender: 'SUPPLIER',
      recipient: 'BUYER',
      subject: `Re: ${session.requirementTitle} — Quotation Counteroffer`,
      body: rawSupplierMessage || notes || `We can offer ₹${priceNum} per unit for ${session.requirementQuantity} pieces with delivery in ${leadTimeNum} days.`,
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    await db.messages.save(inboundMsg);

    // Emit SUPPLIER_RESPONSE_RECEIVED & COUNTEROFFER_RECEIVED
    await emitRealtimeEvent('SUPPLIER_RESPONSE_RECEIVED', 'negotiation', id, {
      message: inboundMsg
    });
    await emitRealtimeEvent('COUNTEROFFER_RECEIVED', 'negotiation', id, {
      proposedUnitPrice: priceNum,
      proposedLeadTimeDays: leadTimeNum
    });

    // Deterministic evaluation
    const evaluation = evaluateSupplierCounteroffer({
      counteroffer: {
        proposedUnitPrice: priceNum,
        proposedLeadTimeDays: leadTimeNum,
        proposedPaymentTerms: proposedPaymentTerms || 'Net 30 Days',
        notes: notes || ''
      },
      session
    });

    console.log(`[NEGOTIATION] ${id} counteroffer ₹${priceNum} evaluated: ${evaluation.outcomeVerdict}`);
    await emitRealtimeEvent('COUNTEROFFER_EVALUATED', 'negotiation', id, { evaluation });

    const nextRound = (session.currentRound || 1) + 1;
    let targetState = NEGOTIATION_STATES.AWAITING_COUNTEROFFER_APPROVAL;
    let newDraftMessage = session.messageDraft;

    // If counter is recommended, generate LLM response
    if (evaluation.recommendedNextAction === 'COUNTER_SPLIT_DIFFERENCE') {
      const supplier = supplierRepo.findById(session.supplierId, true) || {
        companyName: session.supplierName,
        businessEmail: session.supplierEmail,
        contactPerson: session.contactPerson
      };
      const requirement = await db.requirements.findById(session.requirementId) || {
        title: session.requirementTitle,
        targetQuantity: session.requirementQuantity
      };

      try {
        const counterMsg = await aiOrchestrator.generateCounterofferMessage({
          supplier,
          requirement,
          session,
          evaluation
        });

        newDraftMessage = {
          recipientEmail: session.supplierEmail,
          recipientName: session.contactPerson?.name || session.contactPerson || 'Sales Team',
          subject: counterMsg.subject || `Counteroffer: ${session.requirementTitle}`,
          body: counterMsg.body,
          generatedBy: 'LLM',
          counterPrice: evaluation.counterPrice,
          generatedAt: new Date().toISOString()
        };

        targetState = NEGOTIATION_STATES.READY_FOR_MESSAGE_APPROVAL;
        await emitRealtimeEvent('MESSAGE_DRAFTED', 'negotiation', id, { draft: newDraftMessage });
      } catch (err) {
        console.warn(`[NEGOTIATION] LLM counter message drafting warning: ${err.message}`);
      }
    } else if (evaluation.recommendedNextAction === 'RECOMMEND_ACCEPTANCE') {
      targetState = NEGOTIATION_STATES.AGREED_SUBJECT_TO_FINAL_APPROVAL;
    }

    const updated = {
      ...session,
      currentRound: nextRound,
      counteroffers: [...(session.counteroffers || []), evaluation],
      latestCounteroffer: evaluation,
      messageDraft: newDraftMessage,
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        {
          status: targetState,
          timestamp: new Date().toISOString(),
          actor: 'supplier_inbound',
          notes: `Supplier counteroffer ₹${priceNum} recorded (Round ${nextRound}). Verdict: ${evaluation.outcomeVerdict}`
        }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.negotiations.update(id, updated);

    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'COUNTEROFFER_RECORDED',
      actor: 'supplier_inbound',
      details: { proposedUnitPrice: priceNum, verdict: evaluation.outcomeVerdict }
    });

    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', id, updated);

    res.json({
      success: true,
      evaluation,
      negotiation: updated
    });
  } catch (err) {
    next(err);
  }
};

export const completeNegotiation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { finalAgreedPrice, finalAgreedLeadTime, remarks = 'Agreed terms accepted by buyer' } = req.body;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    const agreedPrice = Number(
      finalAgreedPrice ||
      session.latestCounteroffer?.proposedUnitPrice ||
      session.commercialParameters?.proposedOpeningOffer ||
      480
    );

    const agreedLeadTime = Number(finalAgreedLeadTime || session.requirementLeadTimeDays || 30);
    const quantity = Number(session.requirementQuantity || 5000);
    const supplierIndicative = Number(session.commercialParameters?.supplierIndicativePrice || 500);

    const baselineTotalCost = quantity * supplierIndicative;
    const finalTotalCost = quantity * agreedPrice;
    const totalSavings = baselineTotalCost - finalTotalCost;
    const savingsPercent = Number(((totalSavings / baselineTotalCost) * 100).toFixed(1));

    const finalOutcome = {
      decision: 'AGREED',
      agreedUnitPrice: agreedPrice,
      agreedLeadTimeDays: agreedLeadTime,
      totalQuantity: quantity,
      baselineTotalCost,
      finalTotalCost,
      totalSavings,
      savingsPercent,
      currency: 'INR',
      roundsCount: session.currentRound || 1,
      completedAt: new Date().toISOString(),
      buyerSignedBy: req.user?.email || 'buyer@example.com',
      remarks
    };

    const updated = {
      ...session,
      status: NEGOTIATION_STATES.COMPLETED,
      finalOutcome,
      statusHistory: [
        ...session.statusHistory,
        {
          status: NEGOTIATION_STATES.COMPLETED,
          timestamp: new Date().toISOString(),
          actor: req.user?.email || 'buyer@example.com',
          notes: remarks
        }
      ],
      updatedAt: new Date().toISOString()
    };

    await db.negotiations.update(id, updated);

    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'NEGOTIATION_COMPLETED_AGREEMENT',
      actor: req.user?.email || 'buyer@example.com',
      details: finalOutcome
    });

    console.log(`[NEGOTIATION] ${id} completed! Agreed price: ₹${agreedPrice}, Savings: ₹${totalSavings} (${savingsPercent}%)`);

    await emitRealtimeEvent('NEGOTIATION_COMPLETED', 'negotiation', id, { finalOutcome });
    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', id, updated);

    res.json({
      success: true,
      negotiation: updated
    });
  } catch (err) {
    next(err);
  }
};

export const getNegotiationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }
    const messages = await db.messages.findAll(m => m.negotiationId === id);
    res.json({
      success: true,
      count: messages.length,
      messages: messages.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
    });
  } catch (err) {
    next(err);
  }
};
