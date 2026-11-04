import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import supplierRepo from '../../services/supplier/supplierRepository.js';
import { validateSupplierRecord, validateSupplierCatalogue } from '../../services/supplier/supplierValidator.js';

describe('Supplier Catalogue & Validation Suite', () => {
  it('should load all 20 synthetic suppliers successfully', () => {
    const result = supplierRepo.findAll();
    assert.equal(result.total, 20);
    assert.equal(result.items.length, 20);
  });

  it('should validate every record in the synthetic catalogue against schema rules', () => {
    const suppliers = supplierRepo.findAll().items;
    const validation = validateSupplierCatalogue(suppliers);
    assert.equal(validation.valid, true, `Catalogue errors: ${JSON.stringify(validation.errors)}`);
    assert.equal(validation.validCount, 20);
  });

  it('should reject a supplier record missing required fields (e.g. missing companyName, email, processes)', () => {
    const invalidRecord = {
      supplierId: 'SUP-INVALID-01',
      location: { city: 'Pune', state: 'MH', country: 'India' }
      // Missing companyName, businessEmail, productCategories, manufacturingProcesses, materials, etc.
    };
    const result = validateSupplierRecord(invalidRecord);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('companyName')));
    assert.ok(result.errors.some(e => e.includes('businessEmail')));
    assert.ok(result.errors.some(e => e.includes('manufacturingProcesses')));
  });

  it('should detect duplicate supplier IDs in a catalogue', () => {
    const validSupplier = supplierRepo.findAll().items[0];
    const duplicateList = [
      { ...validSupplier },
      { ...validSupplier, companyName: 'Duplicate Clone Works' }
    ];
    const validation = validateSupplierCatalogue(duplicateList);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.some(e => e.error?.includes('Duplicate supplier IDs detected')));
  });

  it('should filter suppliers by process, material, and lead time', () => {
    const cncSuppliers = supplierRepo.findAll({ process: 'CNC Milling' });
    assert.ok(cncSuppliers.total > 0);
    assert.ok(cncSuppliers.items.every(s => s.manufacturingProcesses.some(p => p.toLowerCase().includes('cnc milling'))));

    const quickSuppliers = supplierRepo.findAll({ maxLeadTime: 25 });
    assert.ok(quickSuppliers.items.every(s => s.leadTimeDays <= 25));
  });

  it('should redact sensitive contact details for unauthenticated queries', () => {
    const publicProfile = supplierRepo.findById('SUP-IND-001', false);
    assert.ok(publicProfile.businessEmail.includes('***'));
    assert.ok(publicProfile.contactPerson.phonePlaceholder.includes('Protected'));

    const authenticatedProfile = supplierRepo.findById('SUP-IND-001', true);
    assert.equal(authenticatedProfile.businessEmail, 'contact@aeroprecision.example.com');
  });
});
