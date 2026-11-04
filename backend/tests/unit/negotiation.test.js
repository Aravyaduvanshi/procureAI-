import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, validateTransition, NEGOTIATION_STATES } from '../../services/negotiation/negotiationStateMachine.js';
import { evaluateSupplierCounteroffer } from '../../services/negotiation/negotiationEngine.js';
import { sendMessage } from '../../services/communication/controller.js';
import db from '../../shared/db.js';
import { ForbiddenError } from '../../shared/errors.js';

describe('Negotiation Engine & Policy Enforcement Suite', () => {
  it('should validate legal state transitions across negotiation lifecycle', () => {
    // DRAFT -> AWAITING_STRATEGY_APPROVAL is valid
    assert.equal(canTransition(NEGOTIATION_STATES.DRAFT, NEGOTIATION_STATES.AWAITING_STRATEGY_APPROVAL), true);

    // READY_FOR_MESSAGE_APPROVAL -> APPROVED_TO_SEND is valid
    assert.equal(canTransition(NEGOTIATION_STATES.READY_FOR_MESSAGE_APPROVAL, NEGOTIATION_STATES.APPROVED_TO_SEND), true);

    // APPROVED_TO_SEND -> MESSAGE_SENT is valid
    assert.equal(canTransition(NEGOTIATION_STATES.APPROVED_TO_SEND, NEGOTIATION_STATES.MESSAGE_SENT), true);
  });

  it('should reject illegal state transitions (e.g. attempting to send while still in DRAFT)', () => {
    const check = validateTransition(NEGOTIATION_STATES.DRAFT, NEGOTIATION_STATES.MESSAGE_SENT);
    assert.equal(check.valid, false);
    assert.ok(check.error.includes('Invalid negotiation state transition'));
  });

  it('should evaluate counteroffer within target as highly favorable', () => {
    const session = {
      commercialParameters: { buyerTargetPrice: 480, authorizedReservationLimit: 500 },
      requirementLeadTimeDays: 30
    };
    const counteroffer = { proposedUnitPrice: 475, proposedLeadTimeDays: 28, proposedPaymentTerms: 'Net 30' };
    const evaluation = evaluateSupplierCounteroffer({ counteroffer, session });

    assert.equal(evaluation.outcomeVerdict, 'HIGHLY_FAVORABLE');
    assert.equal(evaluation.recommendedNextAction, 'RECOMMEND_ACCEPTANCE');
  });

  it('should recommend splitting the difference when counteroffer is within the reservation limit but above target', () => {
    const session = {
      commercialParameters: { buyerTargetPrice: 480, authorizedReservationLimit: 500 },
      requirementLeadTimeDays: 30
    };
    const counteroffer = { proposedUnitPrice: 492, proposedLeadTimeDays: 30 };
    const evaluation = evaluateSupplierCounteroffer({ counteroffer, session });

    assert.equal(evaluation.outcomeVerdict, 'ACCEPTABLE_WITH_CONCESSION');
    assert.equal(evaluation.recommendedNextAction, 'COUNTER_SPLIT_DIFFERENCE');
  });

  it('should strictly escalate and block autonomous acceptance when supplier exceeds authorized reservation cap', () => {
    const session = {
      commercialParameters: { buyerTargetPrice: 480, authorizedReservationLimit: 500 },
      requirementLeadTimeDays: 30
    };
    const counteroffer = { proposedUnitPrice: 540, proposedLeadTimeDays: 30 };
    const evaluation = evaluateSupplierCounteroffer({ counteroffer, session });

    assert.equal(evaluation.outcomeVerdict, 'EXCEEDS_AUTHORIZED_LIMIT');
    assert.equal(evaluation.recommendedNextAction, 'ESCALATE_TO_LEAD_BUYER');
    assert.ok(evaluation.rationale.includes('strictly exceeds the maximum authorized reservation limit'));
  });

  it('should strictly block external communication if negotiation is not in APPROVED_TO_SEND state', async () => {
    // Create session in DRAFT state
    const unapprovedSession = {
      id: 'NEG-UNAPPROVED-TEST',
      status: NEGOTIATION_STATES.DRAFT,
      supplierEmail: 'supplier@example.com'
    };
    await db.negotiations.save(unapprovedSession);

    const mockReq = {
      params: { negotiationId: unapprovedSession.id },
      body: { customizedBody: 'Hello world' }
    };

    let caughtError = null;
    await sendMessage(mockReq, {}, (err) => { caughtError = err; });

    assert.ok(caughtError instanceof ForbiddenError);
    assert.ok(caughtError.message.includes('Prior human approval (APPROVED_TO_SEND) is strictly required'));
  });
});
