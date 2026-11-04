import { calculateSupplierRating, checkHardEligibility } from '../vendor-rating/scoringEngine.js';
import aiOrchestrator from './aiOrchestrator.js';

export const MATCHING_MODEL_VERSION = 'v1.2.0-deterministic-hybrid';

/**
 * Runs matching and ranking against supplier catalogue.
 * Returns up to five qualifying suppliers with score breakdowns and detailed exclusion explanations.
 */
export async function matchSuppliers(requirement, suppliers, options = {}) {
  const maxRecommendations = options.limit || 5;
  const customWeights = options.weights || {};

  const evaluated = [];
  const excluded = [];

  for (const supplier of suppliers) {
    const eligibility = checkHardEligibility(supplier, requirement);
    if (!eligibility.isEligible) {
      excluded.push({
        supplierId: supplier.supplierId,
        companyName: supplier.companyName,
        location: `${supplier.location.city}, ${supplier.location.state}`,
        disqualificationReasons: eligibility.disqualifications,
        indicativePrice: supplier.indicativeUnitPrice,
        moq: supplier.minimumOrderQuantity
      });
    } else {
      const rating = calculateSupplierRating(supplier, requirement, customWeights);
      const aiAnalysis = await aiOrchestrator.explainVendorEvaluation(supplier, rating);

      evaluated.push({
        ...rating,
        fullSupplierProfile: {
          supplierId: supplier.supplierId,
          companyName: supplier.companyName,
          businessEmail: supplier.businessEmail,
          contactPerson: supplier.contactPerson,
          location: supplier.location,
          productCategories: supplier.productCategories,
          manufacturingProcesses: supplier.manufacturingProcesses,
          materials: supplier.materials,
          equipmentCapabilities: supplier.equipmentCapabilities,
          minimumOrderQuantity: supplier.minimumOrderQuantity,
          indicativeUnitPrice: supplier.indicativeUnitPrice,
          priceType: supplier.priceType,
          currency: supplier.currency,
          leadTimeDays: supplier.leadTimeDays,
          monthlyCapacity: supplier.monthlyCapacity,
          paymentTerms: supplier.paymentTerms,
          certifications: supplier.certifications,
          qualityControl: supplier.qualityControl,
          deliveryPerformance: supplier.deliveryPerformance,
          evidenceConfidenceScore: supplier.evidenceConfidenceScore,
          isSynthetic: supplier.isSynthetic
        },
        aiCommentary: aiAnalysis.commentary,
        keyStrengths: aiAnalysis.keyStrengths,
        keyRisks: aiAnalysis.keyRisks,
        recommendationVerdict: aiAnalysis.recommendationVerdict
      });
    }
  }

  // Sort eligible candidates deterministically by overallScore descending
  evaluated.sort((a, b) => b.overallScore - a.overallScore);

  // Take top candidates up to 5 (do not pad if fewer qualify)
  const recommendedShortlist = evaluated.slice(0, maxRecommendations);

  // Generate executive overview
  const executiveSummary = await aiOrchestrator.generateMatchingExecutiveSummary(
    requirement,
    recommendedShortlist,
    excluded
  );

  return {
    matchingModelVersion: MATCHING_MODEL_VERSION,
    totalEvaluated: suppliers.length,
    eligibleCount: evaluated.length,
    excludedCount: excluded.length,
    shortlistCount: recommendedShortlist.length,
    recommendedShortlist,
    excludedSuppliers: excluded,
    executiveSummary,
    timestamp: new Date().toISOString()
  };
}
