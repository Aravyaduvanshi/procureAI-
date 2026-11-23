import {
  calculateSupplierRating,
  DEFAULT_WEIGHTS,
  SCORING_MODEL_VERSION
} from './scoringEngine.js';

import supplierRepo from '../supplier/supplierRepository.js';
import db from '../../shared/db.js';

import {
  ValidationError,
  NotFoundError
} from '../../shared/errors.js';


/**
 * Evaluate ONE supplier against ONE stored requirement.
 *
 * Request:
 *
 * POST /evaluate
 *
 * {
 *   "supplierId": "SUP-IND-001",
 *   "requirementId": "REQ-123"
 * }
 *
 * The client does NOT send supplier/requirement objects.
 * The backend fetches them from their respective sources.
 */
export const evaluateSupplier = async (req, res, next) => {

  try {

    const {
      supplierId,
      requirementId,
      customWeights
    } = req.body;


    // ---------------------------------------------
    // 1. Validate IDs
    // ---------------------------------------------

    if (!supplierId) {
      throw new ValidationError(
        'supplierId is required'
      );
    }

    if (!requirementId) {
      throw new ValidationError(
        'requirementId is required'
      );
    }


    // ---------------------------------------------
    // 2. Get supplier from SupplierRepository
    // ---------------------------------------------

    const supplier =
      supplierRepo.getInternalById(supplierId);

    if (!supplier) {

      throw new NotFoundError(
        `Supplier ${supplierId} not found`
      );

    }


    // ---------------------------------------------
    // 3. Get requirement from database
    // ---------------------------------------------

    const requirement =
      await db.requirements.findById(
        requirementId
      );

    if (!requirement) {

      throw new NotFoundError(
        `Requirement ${requirementId} not found`
      );

    }


    // ---------------------------------------------
    // 4. Run deterministic rating engine
    // ---------------------------------------------

    const rating =
      calculateSupplierRating(
        supplier,
        requirement,
        customWeights
      );


    // ---------------------------------------------
    // 5. Return result
    // ---------------------------------------------

    res.json({

      success: true,

      supplier: {
        supplierId:
          supplier.supplierId,

        companyName:
          supplier.companyName
      },

      requirement: {
        requirementId:
          requirement.id,

        title:
          requirement.title
      },

      rating

    });

  } catch (err) {

    next(err);

  }

};


/**
 * Evaluate MULTIPLE suppliers against
 * ONE stored requirement.
 *
 * Request:
 *
 * POST /batch-evaluate
 *
 * {
 *   "supplierIds": [
 *      "SUP-IND-001",
 *      "SUP-IND-002",
 *      "SUP-IND-003"
 *   ],
 *   "requirementId": "REQ-123"
 * }
 */
export const batchEvaluateSuppliers = async (
  req,
  res,
  next
) => {

  try {

    const {
      supplierIds,
      requirementId,
      customWeights
    } = req.body;


    // ---------------------------------------------
    // 1. Validate request
    // ---------------------------------------------

    if (
      !Array.isArray(supplierIds) ||
      supplierIds.length === 0
    ) {

      throw new ValidationError(
        'supplierIds must be a non-empty array'
      );

    }

    if (!requirementId) {

      throw new ValidationError(
        'requirementId is required'
      );

    }


    // ---------------------------------------------
    // 2. Get requirement
    // ---------------------------------------------

    const requirement =
      await db.requirements.findById(
        requirementId
      );

    if (!requirement) {

      throw new NotFoundError(
        `Requirement ${requirementId} not found`
      );

    }


    // ---------------------------------------------
    // 3. Rate every supplier
    // ---------------------------------------------

    const ratings = [];

    for (const supplierId of supplierIds) {

      const supplier =
        supplierRepo.getInternalById(
          supplierId
        );


      // Don't crash the whole batch
      // if one supplier doesn't exist.

      if (!supplier) {

        ratings.push({

          supplierId,

          error: 'Supplier not found'

        });

        continue;

      }


      const rating =
        calculateSupplierRating(
          supplier,
          requirement,
          customWeights
        );


      ratings.push({

        supplierId:
          supplier.supplierId,

        companyName:
          supplier.companyName,

        rating

      });

    }


    // ---------------------------------------------
    // 4. Return results
    // ---------------------------------------------

    res.json({

      success: true,

      requirement: {

        requirementId:
          requirement.id,

        title:
          requirement.title

      },

      count:
        ratings.length,

      ratings

    });

  } catch (err) {

    next(err);

  }

};


/**
 * Return scoring configuration.
 */
export const getScoringConfig = (
  req,
  res
) => {

  res.json({

    success: true,

    version:
      SCORING_MODEL_VERSION,

    defaultWeights:
      DEFAULT_WEIGHTS,

    descriptions: {

      technical:
        'Compatibility of CNC machining processes, materials, and equipment capabilities (35%)',

      quality:
        'Audited certifications (ISO/IATF), CMM inspection, and traceability systems (20%)',

      commercial:
        'Quoted or estimated unit price vs target price and payment terms (20%)',

      delivery:
        'Lead time compliance and monthly capacity buffer ratio (15%)',

      completeness:
        'Evidentiary backing and independent audit verification confidence (10%)'

    }

  });

};