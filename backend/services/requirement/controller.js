import crypto from 'crypto';
import { validateUploadFile, parsePdfDocument } from './documentParser.js';
import { extractStructuredRequirements } from './requirementExtractor.js';
import db from '../../shared/db.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';

export const uploadRequirement = async (req, res, next) => {
  try {
    const file = req.file;
    validateUploadFile(file);

    const parseResult = await parsePdfDocument(file.buffer);

    if (parseResult.isScannedPdf) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'OCR_REQUIRED',
          message: 'The uploaded PDF appears to be a scanned or image-only document. Text could not be extracted without OCR capability.',
          details: {
            pageCount: parseResult.pageCount,
            characterCount: parseResult.characterCount
          }
        }
      });
    }

    const structured = extractStructuredRequirements(parseResult.text, file.originalname);
    const id = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const record = {
      id,
      ...structured,
      rawTextSnippet: parseResult.text.slice(0, 500),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.requirements.save(record);
    await db.logAudit({
      entityType: 'requirement',
      entityId: id,
      action: 'REQUIREMENT_UPLOADED_AND_PARSED',
      actor: req.user?.email || 'buyer@example.com',
      details: { title: record.title, quantity: record.targetQuantity }
    });

    res.status(201).json({
      success: true,
      requirement: record
    });
  } catch (err) {
    next(err);
  }
};

export const createRequirement = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.title || !body.targetQuantity) {
      throw new ValidationError('Title and targetQuantity are required');
    }

    const id = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record = {
      id,
      title: body.title,
      targetQuantity: Number(body.targetQuantity),
      requestedLeadTimeDays: Number(body.requestedLeadTimeDays || 30),
      targetUnitPrice: body.targetUnitPrice ? Number(body.targetUnitPrice) : 480.00,
      priceCurrency: body.priceCurrency || 'INR',
      materials: body.materials || ['Aluminium 6061-T6'],
      mandatoryProcesses: body.mandatoryProcesses || ['CNC Milling'],
      requiredCertifications: body.requiredCertifications || ['ISO 9001:2015'],
      qualityRequirements: body.qualityRequirements || { cmmInspectionRequired: true, traceabilityRequired: true },
      buyerLocation: body.buyerLocation || 'Vadodara, Gujarat, India',
      deliveryDestination: body.deliveryDestination || 'Vadodara Plant, Gujarat',
      unspecifiedFields: [],
      requiresBuyerConfirmation: false,
      status: 'BUYER_CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.requirements.save(record);
    await db.logAudit({
      entityType: 'requirement',
      entityId: id,
      action: 'REQUIREMENT_CREATED_MANUALLY',
      actor: req.user?.email || 'buyer@example.com',
      details: { title: record.title }
    });

    res.status(201).json({
      success: true,
      requirement: record
    });
  } catch (err) {
    next(err);
  }
};

export const listRequirements = async (req, res, next) => {
  try {
    const requirements = await db.requirements.findAll();
    res.json({
      success: true,
      count: requirements.length,
      requirements: requirements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    next(err);
  }
};

export const getRequirementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requirement = await db.requirements.findById(id);
    if (!requirement) {
      throw new NotFoundError(`Requirement ${id} not found`);
    }
    res.json({
      success: true,
      requirement
    });
  } catch (err) {
    next(err);
  }
};

export const confirmRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db.requirements.findById(id);
    if (!existing) {
      throw new NotFoundError(`Requirement ${id} not found`);
    }

    const updates = req.body;
    const confirmedRecord = {
      ...existing,
      ...updates,
      status: 'BUYER_CONFIRMED',
      requiresBuyerConfirmation: false,
      buyerConfirmedAt: new Date().toISOString(),
      buyerConfirmedBy: req.user?.email || 'buyer@example.com'
    };

    await db.requirements.update(id, confirmedRecord);
    await db.logAudit({
      entityType: 'requirement',
      entityId: id,
      action: 'REQUIREMENT_CONFIRMED_BY_BUYER',
      actor: req.user?.email || 'buyer@example.com',
      details: { confirmedFields: Object.keys(updates) }
    });

    res.json({
      success: true,
      requirement: confirmedRecord
    });
  } catch (err) {
    next(err);
  }
};

export const getRequirementStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqItem = await db.requirements.findById(id);
    if (!reqItem) {
      throw new NotFoundError(`Requirement ${id} not found`);
    }

    const matches = await db.matchingRuns.findAll(m => m.requirementId === id);

    res.json({
      success: true,
      requirementId: id,
      status: reqItem.status,
      hasMatches: matches.length > 0,
      matchingRunCount: matches.length,
      latestMatchId: matches.length > 0 ? matches[matches.length - 1].id : null
    });
  } catch (err) {
    next(err);
  }
};
