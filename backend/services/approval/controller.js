import crypto from 'crypto';
import db from '../../shared/db.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../../shared/errors.js';

export const VALID_ACTION_TYPES = [
  'SHORTLIST_APPROVAL',
  'NEGOTIATION_STRATEGY_APPROVAL',
  'MESSAGE_SEND_APPROVAL',
  'COUNTEROFFER_DECISION_APPROVAL'
];

export const VALID_DECISIONS = ['APPROVED', 'REJECTED'];

export const recordApprovalDecision = async (req, res, next) => {
  try {
    const {
      proposalId,
      proposalVersion = 1,
      actionType,
      decision,
      reason = '',
      selectedSupplierIds = []
    } = req.body;

    if (!proposalId || !actionType || !decision) {
      throw new ValidationError('proposalId, actionType, and decision are mandatory');
    }

    if (!VALID_ACTION_TYPES.includes(actionType)) {
      throw new ValidationError(`Invalid actionType. Allowed: ${VALID_ACTION_TYPES.join(', ')}`);
    }

    if (!VALID_DECISIONS.includes(decision)) {
      throw new ValidationError(`Invalid decision. Allowed: ${VALID_DECISIONS.join(', ')}`);
    }

    const approver = req.user ? {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'buyer'
    } : {
      id: 'usr_buyer_default',
      name: 'ProcureAI Lead Buyer',
      email: 'buyer@example.com',
      role: 'buyer'
    };

    // Check for existing identical approval to prevent duplicate approvals
    const existing = await db.approvals.findAll(a =>
      a.proposalId === proposalId &&
      a.proposalVersion === proposalVersion &&
      a.actionType === actionType
    );

    if (existing.length > 0 && existing[0].decision === 'APPROVED' && decision === 'APPROVED') {
      throw new ConflictError(`Proposal ${proposalId} v${proposalVersion} for ${actionType} has already been approved.`);
    }

    const approvalId = `APP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const approvalRecord = {
      id: approvalId,
      proposalId,
      proposalVersion,
      actionType,
      decision,
      reason,
      selectedSupplierIds: Array.isArray(selectedSupplierIds) ? selectedSupplierIds : [],
      approver,
      timestamp: new Date().toISOString()
    };

    await db.approvals.save(approvalRecord);

    // Update matching run status if shortlist approval
    if (actionType === 'SHORTLIST_APPROVAL') {
      const matchRun = await db.matchingRuns.findById(proposalId);
      if (matchRun) {
        await db.matchingRuns.update(proposalId, {
          status: decision === 'APPROVED' ? 'BUYER_APPROVED' : 'BUYER_REJECTED',
          approvalId,
          approvedSupplierIds: approvalRecord.selectedSupplierIds
        });
      }
    }

    await db.logAudit({
      entityType: 'approval',
      entityId: approvalId,
      action: `DECISION_${decision}`,
      actor: approver.email,
      details: {
        proposalId,
        proposalVersion,
        actionType,
        selectedSuppliers: approvalRecord.selectedSupplierIds.length
      }
    });

    res.status(201).json({
      success: true,
      approval: approvalRecord
    });
  } catch (err) {
    next(err);
  }
};

export const listApprovals = async (req, res, next) => {
  try {
    const { proposalId, actionType, decision } = req.query;
    let list = await db.approvals.findAll();

    if (proposalId) list = list.filter(a => a.proposalId === proposalId);
    if (actionType) list = list.filter(a => a.actionType === actionType);
    if (decision) list = list.filter(a => a.decision === decision);

    res.json({
      success: true,
      count: list.length,
      approvals: list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (err) {
    next(err);
  }
};

export const getApprovalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approval = await db.approvals.findById(id);
    if (!approval) {
      throw new NotFoundError(`Approval record ${id} not found`);
    }
    res.json({
      success: true,
      approval
    });
  } catch (err) {
    next(err);
  }
};

export const checkAuthorizationGate = async (req, res, next) => {
  try {
    const { proposalId, actionType, proposalVersion = 1 } = req.query;
    if (!proposalId || !actionType) {
      throw new ValidationError('proposalId and actionType query parameters are required');
    }

    const approvals = await db.approvals.findAll(a =>
      a.proposalId === proposalId &&
      a.actionType === actionType &&
      a.proposalVersion === Number(proposalVersion) &&
      a.decision === 'APPROVED'
    );

    const isAuthorized = approvals.length > 0;
    res.json({
      success: true,
      isAuthorized,
      approval: isAuthorized ? approvals[approvals.length - 1] : null
    });
  } catch (err) {
    next(err);
  }
};
