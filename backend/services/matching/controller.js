import crypto from 'crypto';
import { matchSuppliers } from './matchingEngine.js';
import supplierRepo from '../supplier/supplierRepository.js';
import db from '../../shared/db.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';

export const runMatching = async (req, res, next) => {
  try {
    const { requirementId, requirement, customWeights, limit } = req.body;
    let targetRequirement = requirement;

    if (!targetRequirement && requirementId) {
      targetRequirement = await db.requirements.findById(requirementId);
      if (!targetRequirement) {
        throw new NotFoundError(`Requirement ${requirementId} not found`);
      }
    }

    if (!targetRequirement) {
      throw new ValidationError('Either requirementId or requirement object must be provided');
    }

    const suppliers = supplierRepo.findAll({ limit: 100 }).items;
    const matchResult = await matchSuppliers(targetRequirement, suppliers, {
      weights: customWeights,
      limit: limit || 5
    });

    const runId = `MATCH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record = {
      id: runId,
      requirementId: targetRequirement.id || requirementId || 'ad_hoc',
      requirementTitle: targetRequirement.title,
      proposalVersion: 1,
      status: 'AWAITING_BUYER_APPROVAL',
      ...matchResult,
      createdAt: new Date().toISOString()
    };

    await db.matchingRuns.save(record);

    if (targetRequirement.id) {
      await db.requirements.update(targetRequirement.id, {
        status: 'MATCHED',
        latestMatchRunId: runId
      });
    }

    await db.logAudit({
      entityType: 'matching_run',
      entityId: runId,
      action: 'MATCHING_RUN_EXECUTED',
      actor: req.user?.email || 'buyer@example.com',
      details: {
        requirementId: record.requirementId,
        eligibleCount: record.eligibleCount,
        shortlistCount: record.shortlistCount
      }
    });

    res.status(201).json({
      success: true,
      matchingRun: record
    });
  } catch (err) {
    next(err);
  }
};

export const getMatchingRunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await db.matchingRuns.findById(id);
    if (!run) {
      throw new NotFoundError(`Matching run ${id} not found`);
    }
    res.json({
      success: true,
      matchingRun: run
    });
  } catch (err) {
    next(err);
  }
};

export const getMatchingRunsByRequirement = async (req, res, next) => {
  try {
    const { requirementId } = req.params;
    const runs = await db.matchingRuns.findAll(m => m.requirementId === requirementId);
    res.json({
      success: true,
      count: runs.length,
      matchingRuns: runs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    next(err);
  }
};

export const getMatchingExclusions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await db.matchingRuns.findById(id);
    if (!run) {
      throw new NotFoundError(`Matching run ${id} not found`);
    }
    res.json({
      success: true,
      matchingRunId: id,
      totalExcluded: run.excludedCount,
      excludedSuppliers: run.excludedSuppliers
    });
  } catch (err) {
    next(err);
  }
};
