import crypto from 'crypto';
import db from '../../shared/db.js';
import emailProvider from './emailProvider.js';
import { NEGOTIATION_STATES } from '../negotiation/negotiationStateMachine.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors.js';

export const previewMessageDraft = async (req, res, next) => {
  try {
    const { negotiationId } = req.params;
    const session = await db.negotiations.findById(negotiationId);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${negotiationId} not found`);
    }

    const draft = session.messageDraft || {
      recipientEmail: session.supplierEmail,
      recipientName: session.contactPerson?.name || 'Sales Representative',
      subject: `RFQ & Commercial Inquiry: ${session.requirementTitle}`,
      body: 'Draft message pending preparation.'
    };

    res.json({
      success: true,
      negotiationId,
      status: session.status,
      isApprovedToSend: session.status === NEGOTIATION_STATES.APPROVED_TO_SEND,
      preview: {
        ...draft,
        externalSendingEnabled: process.env.ENABLE_EXTERNAL_EMAIL === 'true',
        providerMode: emailProvider.name
      }
    });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { negotiationId } = req.params;
    const { customizedSubject, customizedBody } = req.body;
    const session = await db.negotiations.findById(negotiationId);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${negotiationId} not found`);
    }

    // Strict Gatekeeper: verify that message draft has been explicitly approved
    if (session.status !== NEGOTIATION_STATES.APPROVED_TO_SEND) {
      throw new ForbiddenError(
        `Outbound communication blocked. Negotiation is in state "${session.status}". Prior human approval (APPROVED_TO_SEND) is strictly required before sending.`
      );
    }

    const recipient = session.messageDraft?.recipientEmail || session.supplierEmail;
    if (!recipient || !recipient.includes('@')) {
      throw new ValidationError(`Invalid recipient email address: "${recipient}"`);
    }

    const subject = customizedSubject || session.messageDraft?.subject || `RFQ: ${session.requirementTitle}`;
    const body = customizedBody || session.messageDraft?.body;

    if (!body || body.trim().length < 10) {
      throw new ValidationError('Message body cannot be empty');
    }

    // Dispatch via email provider (mock or live)
    const sendResult = await emailProvider.sendEmail({
      to: recipient,
      subject,
      body,
      negotiationId
    });

    const messageId = `MSG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const messageRecord = {
      id: messageId,
      negotiationId,
      sender: req.user?.email || 'buyer@example.com',
      recipient,
      subject,
      body,
      status: 'SENT',
      providerResult: sendResult,
      timestamp: new Date().toISOString()
    };

    await db.messages.save(messageRecord);

    // Update negotiation state: MESSAGE_SENT -> WAITING_FOR_SUPPLIER
    const updatedHistory = [...(session.messageHistory || []), messageRecord];
    const updatedStatusHistory = [
      ...session.statusHistory,
      { status: NEGOTIATION_STATES.MESSAGE_SENT, timestamp: new Date().toISOString(), actor: req.user?.email || 'buyer@example.com' },
      { status: NEGOTIATION_STATES.WAITING_FOR_SUPPLIER, timestamp: new Date().toISOString(), actor: 'system' }
    ];

    await db.negotiations.update(negotiationId, {
      status: NEGOTIATION_STATES.WAITING_FOR_SUPPLIER,
      messageHistory: updatedHistory,
      statusHistory: updatedStatusHistory
    });

    await db.logAudit({
      entityType: 'negotiation_message',
      entityId: messageId,
      action: 'OUTBOUND_MESSAGE_DISPATCHED',
      actor: req.user?.email || 'buyer@example.com',
      details: {
        negotiationId,
        recipient,
        mode: sendResult.mode
      }
    });

    res.json({
      success: true,
      message: 'Outbound supplier message successfully dispatched and recorded',
      dispatchDetails: sendResult,
      messageRecord
    });
  } catch (err) {
    next(err);
  }
};

export const listNegotiationMessages = async (req, res, next) => {
  try {
    const { negotiationId } = req.params;
    const messages = await db.messages.findAll(m => m.negotiationId === negotiationId);
    res.json({
      success: true,
      count: messages.length,
      messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    });
  } catch (err) {
    next(err);
  }
};
