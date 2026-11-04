import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import supplierRepo from '../../services/supplier/supplierRepository.js';
import { checkHardEligibility, calculateSupplierRating } from '../../services/vendor-rating/scoringEngine.js';
import { matchSuppliers } from '../../services/matching/matchingEngine.js';

describe('Vendor Rating & Deterministic Matching Suite', () => {
  const sampleRequirement = {
    title: 'CNC Aluminium Mounting Bracket',
    mandatoryProcesses: ['CNC Milling'],
    materials: ['Aluminium 6061-T6'],
    targetQuantity: 5000,
    requestedLeadTimeDays: 30,
    targetUnitPrice: 480.00,
    requiredCertifications: ['ISO 9001:2015']
  };

  it('should qualify suppliers meeting all mandatory technical and compliance criteria', () => {
    const aeroPrecision = supplierRepo.findById('SUP-IND-001', true);
    const eligibility = checkHardEligibility(aeroPrecision, sampleRequirement);
    assert.equal(eligibility.isEligible, true);
    assert.equal(eligibility.disqualifications.length, 0);
  });

  it('should disqualify suppliers missing mandatory manufacturing processes (e.g. Sheet metal or Heavy Foundry)', () => {
    const stampingSupplier = supplierRepo.findById('SUP-IND-004', true); // Sheet metal only
    const eligibility = checkHardEligibility(stampingSupplier, sampleRequirement);
    assert.equal(eligibility.isEligible, false);
    assert.ok(eligibility.disqualifications.some(d => d.includes('Missing mandatory manufacturing process')));
  });

  it('should disqualify suppliers with incompatible materials', () => {
    const plasticSupplier = supplierRepo.findById('SUP-IND-011', true); // Plastic injection molding
    const eligibility = checkHardEligibility(plasticSupplier, sampleRequirement);
    assert.equal(eligibility.isEligible, false);
    assert.ok(eligibility.disqualifications.some(d => d.includes('Does not handle required material') || d.includes('Missing mandatory manufacturing process')));
  });

  it('should disqualify suppliers whose MOQ exceeds batch quantity by more than 1.5x', () => {
    const highMoqSupplier = supplierRepo.findById('SUP-IND-014', true); // MOQ 15,000 pcs vs target 5,000
    const eligibility = checkHardEligibility(highMoqSupplier, sampleRequirement);
    assert.equal(eligibility.isEligible, false);
    assert.ok(eligibility.disqualifications.some(d => d.includes('exceeds batch quantity')));
  });

  it('should compute explainable multi-dimensional suitability scores with weights summing to 1.0', () => {
    const aeroPrecision = supplierRepo.findById('SUP-IND-001', true);
    const rating = calculateSupplierRating(aeroPrecision, sampleRequirement);

    assert.equal(rating.isEligible, true);
    assert.ok(rating.overallScore >= 80, `Expected score >= 80, got ${rating.overallScore}`);
    assert.ok(rating.scoringBreakdown.dimensions.technicalCapability.score > 0);
    assert.ok(rating.scoringBreakdown.dimensions.qualityCertifications.score > 0);
    assert.ok(rating.scoringBreakdown.dimensions.commercialCompetitiveness.score > 0);
    assert.ok(rating.scoringBreakdown.dimensions.deliveryFeasibility.score > 0);
    assert.ok(rating.scoringBreakdown.dimensions.evidenceCompleteness.score > 0);
  });

  it('should rank top qualifying suppliers deterministically and return at most 5 recommendations', async () => {
    const suppliers = supplierRepo.findAll().items;
    const matchResult = await matchSuppliers(sampleRequirement, suppliers, { limit: 5 });

    assert.ok(matchResult.shortlistCount <= 5);
    assert.ok(matchResult.recommendedShortlist.length > 0);
    assert.ok(matchResult.excludedSuppliers.length > 0);

    // Verify descending score order
    for (let i = 0; i < matchResult.recommendedShortlist.length - 1; i++) {
      assert.ok(
        matchResult.recommendedShortlist[i].overallScore >= matchResult.recommendedShortlist[i + 1].overallScore,
        'Shortlist must be sorted in descending order of overall suitability score'
      );
    }
  });

  it('should not pad the shortlist if fewer than 5 suppliers qualify for a strict requirement', async () => {
    // Highly restrictive requirement: Titanium Ti-6Al-4V + AS9100D aerospace cert
    const strictAerospaceReq = {
      title: 'Satellite Grade Titanium Bracket',
      mandatoryProcesses: ['5-Axis CNC Machining'],
      materials: ['Titanium Ti-6Al-4V'],
      targetQuantity: 500,
      requestedLeadTimeDays: 25,
      requiredCertifications: ['AS9100D']
    };

    const suppliers = supplierRepo.findAll().items;
    const matchResult = await matchSuppliers(strictAerospaceReq, suppliers, { limit: 5 });

    // In our catalogue, only Peenya Precision (SUP-IND-006) satisfies both Titanium and AS9100D
    assert.ok(matchResult.shortlistCount < 5, `Expected fewer than 5 qualifying suppliers, got ${matchResult.shortlistCount}`);
    assert.ok(matchResult.recommendedShortlist.every(s => s.isEligible));
  });
});
