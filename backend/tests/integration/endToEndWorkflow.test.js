import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parsePdfDocument } from '../../services/requirement/documentParser.js';
import { extractStructuredRequirements } from '../../services/requirement/requirementExtractor.js';
import supplierRepo from '../../services/supplier/supplierRepository.js';
import { matchSuppliers } from '../../services/matching/matchingEngine.js';
import { recordApprovalDecision } from '../../services/approval/controller.js';
import {
  createNegotiationSession,
  generateStrategyAndDraft,
  approveStrategy,
  approveMessageDraft,
  recordCounteroffer,
  completeNegotiation
} from '../../services/negotiation/controller.js';
import { sendMessage } from '../../services/communication/controller.js';
import db from '../../shared/db.js';
import { NEGOTIATION_STATES } from '../../services/negotiation/negotiationStateMachine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../../data/sample-requirements/Sample_Procurement_Requirement_Vadodara.pdf');

describe('ProcureAI End-to-End Autonomous Procurement Journey', () => {
  let requirementId = null;
  let matchingRunId = null;
  let selectedSupplierId = null;
  let negotiationSessionId = null;

  it('Step 1: Upload and parse procurement requirement document', async () => {
    assert.ok(fs.existsSync(SAMPLE_PDF_PATH));
    const buffer = fs.readFileSync(SAMPLE_PDF_PATH);
    const parsed = await parsePdfDocument(buffer);
    assert.equal(parsed.isScannedPdf, false);

    const structured = extractStructuredRequirements(parsed.text, 'Sample_Procurement_Requirement_Vadodara.pdf');
    requirementId = `REQ-E2E-${Date.now()}`;
    const reqRecord = {
      id: requirementId,
      ...structured,
      createdAt: new Date().toISOString()
    };
    await db.requirements.save(reqRecord);

    assert.ok(reqRecord.id);
    assert.equal(reqRecord.targetQuantity, 5000);
    assert.ok(reqRecord.materials.includes('Aluminium 6061-T6'));
  });

  it('Step 2: Buyer reviews and confirms structured requirements', async () => {
    const existing = await db.requirements.findById(requirementId);
    assert.ok(existing);

    const confirmed = {
      ...existing,
      targetUnitPrice: 480.00,
      surfaceTreatment: 'Hard Anodizing (Type III) Black',
      machiningTolerance: 'ISO 2768-m (±0.1mm)',
      paymentTerms: 'Net 30 Days',
      requiresBuyerConfirmation: false,
      status: 'BUYER_CONFIRMED'
    };
    await db.requirements.update(requirementId, confirmed);

    const verified = await db.requirements.findById(requirementId);
    assert.equal(verified.status, 'BUYER_CONFIRMED');
    assert.equal(verified.requiresBuyerConfirmation, false);
  });

  it('Step 3: Execute supplier matching and deterministic ranking against 20-supplier catalogue', async () => {
    const requirement = await db.requirements.findById(requirementId);
    const suppliers = supplierRepo.findAll().items;
    assert.equal(suppliers.length, 20);

    const matchResult = await matchSuppliers(requirement, suppliers, { limit: 5 });

    assert.ok(matchResult.shortlistCount <= 5);
    assert.ok(matchResult.eligibleCount >= 5);
    assert.ok(matchResult.excludedCount >= 5);

    matchingRunId = `MATCH-E2E-${Date.now()}`;
    const matchRecord = {
      id: matchingRunId,
      requirementId,
      proposalVersion: 1,
      status: 'AWAITING_BUYER_APPROVAL',
      ...matchResult
    };
    await db.matchingRuns.save(matchRecord);

    selectedSupplierId = matchResult.recommendedShortlist[0].supplierId;
    assert.ok(selectedSupplierId);
  });

  it('Step 4: Buyer inspects recommendations and approves shortlist in Governance Gate', async () => {
    let statusCode = null;
    let responseData = null;

    const mockReq = {
      body: {
        proposalId: matchingRunId,
        proposalVersion: 1,
        actionType: 'SHORTLIST_APPROVAL',
        decision: 'APPROVED',
        reason: 'Approved shortlist for direct supplier RFQ negotiation',
        selectedSupplierIds: [selectedSupplierId]
      },
      user: { id: 'usr_buyer_1', email: 'leadbuyer@example.com', role: 'buyer' }
    };

    const mockRes = {
      status(c) { statusCode = c; return this; },
      json(d) { responseData = d; return this; }
    };

    await recordApprovalDecision(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(statusCode, 201);
    assert.equal(responseData.approval.decision, 'APPROVED');

    const run = await db.matchingRuns.findById(matchingRunId);
    assert.equal(run.status, 'BUYER_APPROVED');
  });

  it('Step 5: Create stateful negotiation session with commercial limits', async () => {
    let statusCode = null;
    let responseData = null;

    const mockReq = {
      body: {
        supplierId: selectedSupplierId,
        requirementId,
        buyerObjective: 'BALANCED',
        targetPrice: 480.00,
        reservationLimit: 500.00
      },
      user: { email: 'buyer@example.com' }
    };

    const mockRes = {
      status(c) { statusCode = c; return this; },
      json(d) { responseData = d; return this; }
    };

    await createNegotiationSession(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(statusCode, 201);
    negotiationSessionId = responseData.negotiation.id;
    assert.equal(responseData.negotiation.status, NEGOTIATION_STATES.DRAFT);
  });

  it('Step 6: Formulate AI negotiation strategy and draft opening offer', async () => {
    let responseData = null;
    const mockReq = {
      params: { id: negotiationSessionId },
      user: { email: 'buyer@example.com' }
    };
    const mockRes = {
      json(d) { responseData = d; return this; }
    };

    await generateStrategyAndDraft(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(responseData.negotiation.status, NEGOTIATION_STATES.AWAITING_STRATEGY_APPROVAL);
    assert.ok(responseData.negotiation.strategy);
    assert.ok(responseData.negotiation.messageDraft);
  });

  it('Step 7: Buyer approves negotiation strategy and commercial limits', async () => {
    let responseData = null;
    const mockReq = {
      params: { id: negotiationSessionId },
      body: { reason: 'Strategy confirmed' },
      user: { email: 'buyer@example.com' }
    };
    const mockRes = {
      json(d) { responseData = d; return this; }
    };

    await approveStrategy(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(responseData.negotiation.status, NEGOTIATION_STATES.READY_FOR_MESSAGE_APPROVAL);
  });

  it('Step 8: Buyer approves message draft for sending', async () => {
    let responseData = null;
    const mockReq = {
      params: { id: negotiationSessionId },
      body: { reason: 'Outbound draft text authorized' },
      user: { email: 'buyer@example.com' }
    };
    const mockRes = {
      json(d) { responseData = d; return this; }
    };

    await approveMessageDraft(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(responseData.negotiation.status, NEGOTIATION_STATES.APPROVED_TO_SEND);
  });

  it('Step 9: Dispatch message via safe draft-only communication provider and advance state to WAITING_FOR_SUPPLIER', async () => {
    let responseData = null;
    const mockReq = {
      params: { negotiationId: negotiationSessionId },
      body: {},
      user: { email: 'buyer@example.com' }
    };
    const mockRes = {
      json(d) { responseData = d; return this; }
    };

    await sendMessage(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(responseData.success, true);
    assert.equal(responseData.dispatchDetails.mode, 'MOCK_SIMULATED');
    assert.equal(responseData.dispatchDetails.providerDisabled, true);

    const session = await db.negotiations.findById(negotiationSessionId);
    assert.equal(session.status, NEGOTIATION_STATES.WAITING_FOR_SUPPLIER);
    assert.equal(session.messageHistory.length, 1);
  });

  it('Step 10: Inbound supplier counteroffer evaluated and final agreement authorized', async () => {
    let responseData = null;
    const mockReq = {
      params: { id: negotiationSessionId },
      body: { proposedUnitPrice: 475.00, proposedLeadTimeDays: 28 },
      user: { email: 'buyer@example.com' }
    };
    const mockRes = {
      json(d) { responseData = d; return this; }
    };

    await recordCounteroffer(mockReq, mockRes, (err) => { if (err) throw err; });
    assert.equal(responseData.evaluation.outcomeVerdict, 'HIGHLY_FAVORABLE');

    // Complete negotiation
    let completeResponse = null;
    const completeReq = {
      params: { id: negotiationSessionId },
      body: { finalAgreedPrice: 475.00 },
      user: { email: 'buyer@example.com' }
    };
    const completeRes = {
      json(d) { completeResponse = d; return this; }
    };

    await completeNegotiation(completeReq, completeRes, (err) => { if (err) throw err; });
    assert.equal(completeResponse.negotiation.status, NEGOTIATION_STATES.COMPLETED);
    assert.equal(completeResponse.negotiation.finalOutcome.agreedUnitPrice, 475.00);
  });
});
