import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import db from '../../shared/db.js';
import { recordApprovalDecision } from '../../services/approval/controller.js';
import { ConflictError, ValidationError } from '../../shared/errors.js';

describe('Approval Service & Governance Gate Suite', () => {
  const proposalId = `MATCH-TEST-PROPOSAL-${Date.now()}`;

  it('should record an explicit buyer approval decision and persist to durable store', async () => {
    let responseData = null;
    let statusCode = null;

    const mockReq = {
      body: {
        proposalId,
        proposalVersion: 1,
        actionType: 'SHORTLIST_APPROVAL',
        decision: 'APPROVED',
        reason: 'Approved shortlist for commercial discussions',
        selectedSupplierIds: ['SUP-IND-001', 'SUP-IND-002']
      },
      user: { id: 'usr_buyer_1', email: 'leadbuyer@example.com', role: 'buyer' }
    };

    const mockRes = {
      status(code) { statusCode = code; return this; },
      json(data) { responseData = data; return this; }
    };

    let nextError = null;
    await recordApprovalDecision(mockReq, mockRes, (err) => { nextError = err; });

    assert.equal(nextError, null);
    assert.equal(statusCode, 201);
    assert.equal(responseData.success, true);
    assert.equal(responseData.approval.decision, 'APPROVED');
    assert.equal(responseData.approval.proposalId, proposalId);

    // Verify record in db
    const saved = await db.approvals.findById(responseData.approval.id);
    assert.ok(saved);
    assert.equal(saved.decision, 'APPROVED');
  });

  it('should prevent duplicate approvals for the same proposal and version', async () => {
    const mockReq = {
      body: {
        proposalId,
        proposalVersion: 1,
        actionType: 'SHORTLIST_APPROVAL',
        decision: 'APPROVED'
      },
      user: { email: 'buyer@example.com' }
    };

    let nextError = null;
    await recordApprovalDecision(mockReq, {}, (err) => { nextError = err; });

    assert.ok(nextError instanceof ConflictError);
    assert.ok(nextError.message.includes('has already been approved'));
  });

  it('should validate action types and reject unsupported actions', async () => {
    const mockReq = {
      body: {
        proposalId: 'PROPOSAL-999',
        actionType: 'UNSUPPORTED_ACTION_TYPE',
        decision: 'APPROVED'
      }
    };

    let nextError = null;
    await recordApprovalDecision(mockReq, {}, (err) => { nextError = err; });

    assert.ok(nextError instanceof ValidationError);
    assert.ok(nextError.message.includes('Invalid actionType'));
  });

  it('should record a rejection with documented justification', async () => {
    let responseData = null;
    let statusCode = null;

    const mockReq = {
      body: {
        proposalId: 'MATCH-REJECT-02',
        proposalVersion: 1,
        actionType: 'SHORTLIST_APPROVAL',
        decision: 'REJECTED',
        reason: 'Budget variance exceeded allowable limit'
      },
      user: { email: 'buyer@example.com' }
    };

    const mockRes = {
      status(code) { statusCode = code; return this; },
      json(data) { responseData = data; return this; }
    };

    await recordApprovalDecision(mockReq, mockRes, () => {});
    assert.equal(statusCode, 201);
    assert.equal(responseData.approval.decision, 'REJECTED');
    assert.equal(responseData.approval.reason, 'Budget variance exceeded allowable limit');
  });
});
