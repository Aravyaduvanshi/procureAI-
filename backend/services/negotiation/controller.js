import crypto from 'crypto';
import db from '../../shared/db.js';
import supplierRepo from '../supplier/supplierRepository.js';
import { buildNegotiationStrategy, evaluateSupplierCounteroffer } from './negotiationEngine.js';
import { NEGOTIATION_STATES, validateTransition } from './negotiationStateMachine.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../shared/errors.js';

export const createNegotiationSession = async (req, res, next) => {
  try {
    const { supplierId, requirementId, buyerObjective = 'BALANCED', targetPrice, reservationLimit } = req.body;

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

    const record = {
      id: sessionId,
      supplierId,
      supplierName: supplier.companyName,
      supplierEmail: supplier.businessEmail,
      contactPerson: supplier.contactPerson,
      requirementId,
      requirementTitle: requirement.title,
      requirementQuantity: requirement.targetQuantity,
      requirementLeadTimeDays: requirement.requestedLeadTimeDays,
      buyerObjective,
      commercialParameters: {
        supplierIndicativePrice: supplier.indicativeUnitPrice,
        buyerTargetPrice: initialTarget,
        authorizedReservationLimit: initialMax,
        proposedOpeningOffer: Math.round(initialTarget * 0.96),
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
      details: { supplierId, requirementId }
    });

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
      negotiations: list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
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
    res.json({
      success: true,
      negotiation: session
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
      supplier,
      requirement: {
        ...requirement,
        targetUnitPrice: session.commercialParameters?.buyerTargetPrice
      },
      rating: { overallScore: 90 },
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
      ]
    };

    await db.negotiations.update(id, updated);
    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'STRATEGY_AND_DRAFT_GENERATED',
      actor: req.user?.email || 'buyer@example.com',
      details: { proposedOpeningOffer: updated.commercialParameters.proposedOpeningOffer }
    });

    res.json({
      success: true,
      negotiation: updated
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

    const updated = {
      ...session,
      commercialParameters: {
        ...session.commercialParameters,
        ...(modifiedParameters || {})
      },
      strategyApproval: {
        approvedBy: req.user?.email || 'buyer@example.com',
        timestamp: new Date().toISOString(),
        reason
      },
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        { status: targetState, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com', notes: reason }
      ]
    };

    await db.negotiations.update(id, updated);
    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'STRATEGY_APPROVED_BY_BUYER',
      actor: req.user?.email || 'buyer@example.com',
      details: { commercialParameters: updated.commercialParameters }
    });

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

    const updated = {
      ...session,
      messageDraft: customizedMessage ? { ...session.messageDraft, ...customizedMessage } : session.messageDraft,
      messageApproval: {
        approvedBy: req.user?.email || 'buyer@example.com',
        timestamp: new Date().toISOString(),
        reason
      },
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        { status: targetState, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com', notes: reason }
      ]
    };

    await db.negotiations.update(id, updated);
    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'MESSAGE_DRAFT_APPROVED_FOR_SEND',
      actor: req.user?.email || 'buyer@example.com',
      details: { recipientEmail: updated.messageDraft?.recipientEmail }
    });

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
    const { proposedUnitPrice, proposedLeadTimeDays, proposedPaymentTerms, notes } = req.body;
    const session = await db.negotiations.findById(id);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${id} not found`);
    }

    if (!proposedUnitPrice) {
      throw new ValidationError('proposedUnitPrice is required in counteroffer');
    }

    const evaluation = evaluateSupplierCounteroffer({
      counteroffer: {
        proposedUnitPrice: Number(proposedUnitPrice),
        proposedLeadTimeDays: Number(proposedLeadTimeDays || session.requirementLeadTimeDays),
        proposedPaymentTerms: proposedPaymentTerms || 'Net 30 Days',
        notes: notes || ''
      },
      session
    });

    const targetState = NEGOTIATION_STATES.AWAITING_COUNTEROFFER_APPROVAL;
    const updated = {
      ...session,
      counteroffers: [...(session.counteroffers || []), evaluation],
      latestCounteroffer: evaluation,
      status: targetState,
      statusHistory: [
        ...session.statusHistory,
        {
          status: targetState,
          timestamp: new Date().toISOString(),
          actor: 'supplier_inbound',
          notes: `Supplier counteroffer ₹${proposedUnitPrice} recorded. Recommendation: ${evaluation.recommendedNextAction}`
        }
      ]
    };

    await db.negotiations.update(id, updated);
    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'COUNTEROFFER_RECORDED',
      actor: 'supplier_inbound',
      details: { proposedUnitPrice, verdict: evaluation.outcomeVerdict }
    });

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

    const updated = {
      ...session,
      status: NEGOTIATION_STATES.COMPLETED,
      finalOutcome: {
        decision: 'AGREED',
        agreedUnitPrice: Number(finalAgreedPrice || session.latestCounteroffer?.proposedUnitPrice || session.commercialParameters?.proposedOpeningOffer),
        agreedLeadTimeDays: Number(finalAgreedLeadTime || session.requirementLeadTimeDays),
        currency: 'INR',
        completedAt: new Date().toISOString(),
        buyerSignedBy: req.user?.email || 'buyer@example.com',
        remarks
      },
      statusHistory: [
        ...session.statusHistory,
        { status: NEGOTIATION_STATES.COMPLETED, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com', notes: remarks }
      ]
    };

    await db.negotiations.update(id, updated);
    await db.logAudit({
      entityType: 'negotiation',
      entityId: id,
      action: 'NEGOTIATION_COMPLETED_AGREEMENT',
      actor: req.user?.email || 'buyer@example.com',
      details: updated.finalOutcome
    });

    res.json({
      success: true,
      negotiation: updated
    });
  } catch (err) {
    next(err);
  }
};
