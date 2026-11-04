import { calculateSupplierRating, checkHardEligibility, DEFAULT_WEIGHTS, SCORING_MODEL_VERSION } from './scoringEngine.js';
import { ValidationError } from '../../shared/errors.js';

export const evaluateSupplier = (req, res, next) => {
  try {
    const { supplier, requirement, customWeights } = req.body;
    if (!supplier || !requirement) {
      throw new ValidationError('Both supplier and requirement payloads are required for rating evaluation');
    }

    const rating = calculateSupplierRating(supplier, requirement, customWeights);
    res.json({
      success: true,
      rating
    });
  } catch (err) {
    next(err);
  }
};

export const batchEvaluateSuppliers = (req, res, next) => {
  try {
    const { suppliers, requirement, customWeights } = req.body;
    if (!Array.isArray(suppliers) || !requirement) {
      throw new ValidationError('Suppliers array and requirement payload are required for batch evaluation');
    }

    const ratings = suppliers.map(s => calculateSupplierRating(s, requirement, customWeights));
    res.json({
      success: true,
      count: ratings.length,
      ratings
    });
  } catch (err) {
    next(err);
  }
};

export const getScoringConfig = (req, res) => {
  res.json({
    success: true,
    version: SCORING_MODEL_VERSION,
    defaultWeights: DEFAULT_WEIGHTS,
    descriptions: {
      technical: 'Compatibility of CNC machining processes, materials, and equipment capabilities (35%)',
      quality: 'Audited certifications (ISO/IATF), CMM inspection, and traceability systems (20%)',
      commercial: 'Quoted or estimated unit price vs target price and payment terms (20%)',
      delivery: 'Lead time compliance and monthly capacity buffer ratio (15%)',
      completeness: 'Evidentiary backing and independent audit verification confidence (10%)'
    }
  });
};
