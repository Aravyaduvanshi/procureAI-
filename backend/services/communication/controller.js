import crypto from 'crypto';
import db from '../../shared/db.js';
import emailProvider from './emailProvider.js';
import { NEGOTIATION_STATES } from '../negotiation/negotiationStateMachine.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors.js';
import { emitRealtimeEvent } from '../../shared/realtime.js';

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

    const messageId = `MSG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Emit MESSAGE_SENDING realtime event
    await emitRealtimeEvent('MESSAGE_SENDING', 'negotiation', negotiationId, {
      messageId,
      recipient,
      subject
    });

    let sendResult;
    try {
      sendResult = await emailProvider.sendEmail({
        to: recipient,
        subject,
        body,
        negotiationId
      });
    } catch (sendErr) {
      // Email dispatch failure handling per Section 16
      const failedMessageRecord = {
        id: messageId,
        negotiationId,
        sender: req.user?.email || 'buyer@example.com',
        recipient,
        subject,
        body,
        status: 'FAILED',
        error: {
          message: sendErr.message || 'Provider rejected email dispatch',
          timestamp: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.messages.save(failedMessageRecord);

      // Keep negotiation in retryable state (APPROVED_TO_SEND) with error info
      const updatedSession = {
        ...session,
        lastError: {
          code: 'EMAIL_DISPATCH_FAILED',
          message: sendErr.message,
          failedMessageId: messageId,
          timestamp: new Date().toISOString()
        },
        messageHistory: [...(session.messageHistory || []), failedMessageRecord]
      };
      await db.negotiations.update(negotiationId, updatedSession);

      await db.logAudit({
        entityType: 'negotiation_message',
        entityId: messageId,
        action: 'EMAIL_DISPATCH_FAILED',
        actor: req.user?.email || 'buyer@example.com',
        details: { negotiationId, error: sendErr.message }
      });

      await emitRealtimeEvent('EMAIL_FAILED', 'negotiation', negotiationId, {
        messageId,
        error: sendErr.message
      });
      await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', negotiationId, updatedSession);

      return res.status(502).json({
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: `Failed to dispatch email to provider: ${sendErr.message}`,
          retryable: true,
          failedMessageId: messageId
        }
      });
    }

    // Success path
    const messageRecord = {
      id: messageId,
      negotiationId,
      sender: req.user?.email || 'buyer@example.com',
      recipient,
      subject,
      body,
      status: 'SENT',
      providerResult: sendResult,
      providerMessageId: sendResult.messageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    const updatedSession = {
      ...session,
      status: NEGOTIATION_STATES.WAITING_FOR_SUPPLIER,
      lastError: null,
      messageHistory: updatedHistory,
      statusHistory: updatedStatusHistory
    };

    await db.negotiations.update(negotiationId, updatedSession);

    await db.logAudit({
      entityType: 'negotiation_message',
      entityId: messageId,
      action: 'OUTBOUND_MESSAGE_DISPATCHED',
      actor: req.user?.email || 'buyer@example.com',
      details: {
        negotiationId,
        recipient,
        mode: sendResult.mode,
        providerMessageId: sendResult.messageId
      }
    });

    console.log(`[EMAIL] Message ${messageId} sent successfully to ${recipient}`);

    await emitRealtimeEvent('MESSAGE_SENT', 'negotiation', negotiationId, {
      message: messageRecord,
      status: NEGOTIATION_STATES.WAITING_FOR_SUPPLIER
    });
    await emitRealtimeEvent('NEGOTIATION_UPDATED', 'negotiation', negotiationId, updatedSession);

    res.json({
      success: true,
      message: 'Outbound supplier message successfully dispatched and recorded',
      dispatchDetails: sendResult,
      messageRecord,
      negotiation: updatedSession
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
      messages: messages.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
    });
  } catch (err) {
    next(err);
  }
};

export const handleInboundWebhook = async (req, res, next) => {
  try {
    const body = req.body || {};
    // Extract supplier message details from webhook
    const sender = body.from || body.sender || req.query.from || 'supplier@example.com';
    const recipient = body.to || body.recipient || 'procurement@procureai.example.com';
    const subject = body.subject || '';
    const messageText = body.text || body.body || body.content || body.message || '';

    // Resolve negotiation ID: from query, or subject tag like "[NEG-ABC-123]", or body
    let negotiationId = req.query.negotiationId || body.negotiationId;
    if (!negotiationId && subject) {
      const match = subject.match(/\[?(NEG-[A-Z0-9-]+)\]?/i);
      if (match) negotiationId = match[1];
    }

    if (!negotiationId) {
      // Find latest waiting negotiation for this supplier email
      const activeSessions = await db.negotiations.findAll(n =>
        n.supplierEmail?.toLowerCase() === sender.toLowerCase() &&
        n.status === NEGOTIATION_STATES.WAITING_FOR_SUPPLIER
      );
      if (activeSessions.length > 0) {
        negotiationId = activeSessions[0].id;
      }
    }

    if (!negotiationId) {
      throw new ValidationError('Could not identify target negotiation session from inbound email.');
    }

    const session = await db.negotiations.findById(negotiationId);
    if (!session) {
      throw new NotFoundError(`Negotiation session ${negotiationId} not found`);
    }

    // Record incoming message in PostgreSQL
    const inboundMessageId = `MSG-IN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const inboundRecord = {
      id: inboundMessageId,
      negotiationId,
      sender: 'SUPPLIER',
      senderEmail: sender,
      recipient: 'BUYER',
      subject: subject || `Re: ${session.requirementTitle}`,
      body: messageText,
      status: 'RECEIVED',
      rawPayload: body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    await db.messages.save(inboundRecord);

    await db.logAudit({
      entityType: 'negotiation_message',
      entityId: inboundMessageId,
      action: 'INBOUND_SUPPLIER_RESPONSE_RECEIVED',
      actor: sender,
      details: { negotiationId, subject }
    });

    console.log(`[WEBHOOK] Inbound supplier message received for ${negotiationId}`);

    // Emit SUPPLIER_RESPONSE_RECEIVED realtime event
    await emitRealtimeEvent('SUPPLIER_RESPONSE_RECEIVED', 'negotiation', negotiationId, {
      message: inboundRecord,
      negotiationId
    });

    res.json({
      success: true,
      message: 'Inbound supplier response processed and recorded',
      inboundMessageId,
      negotiationId
    });
  } catch (err) {
    next(err);
  }
};
