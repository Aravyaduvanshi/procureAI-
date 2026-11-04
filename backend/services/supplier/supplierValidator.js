/**
 * ProcureAI Supplier Validator
 * Validates supplier objects against mandatory fields, data types, and logical bounds.
 */

export function validateSupplierRecord(supplier) {
  const errors = [];

  if (!supplier || typeof supplier !== 'object') {
    return { valid: false, errors: ['Supplier record must be an object'] };
  }

  if (!supplier.supplierId || typeof supplier.supplierId !== 'string' || !/^SUP-[A-Z0-9-]+$/.test(supplier.supplierId)) {
    errors.push('supplierId is required and must match pattern SUP-XXX');
  }

  if (!supplier.companyName || typeof supplier.companyName !== 'string' || supplier.companyName.trim().length < 2) {
    errors.push('companyName is required and must have at least 2 characters');
  }

  if (!supplier.businessEmail || typeof supplier.businessEmail !== 'string' || !supplier.businessEmail.includes('@')) {
    errors.push('businessEmail is required and must be a valid email');
  }

  if (!supplier.location || typeof supplier.location !== 'object' || !supplier.location.city || !supplier.location.state || !supplier.location.country) {
    errors.push('location with city, state, and country is required');
  }

  if (!Array.isArray(supplier.productCategories) || supplier.productCategories.length === 0) {
    errors.push('productCategories must be a non-empty array of strings');
  }

  if (!Array.isArray(supplier.manufacturingProcesses) || supplier.manufacturingProcesses.length === 0) {
    errors.push('manufacturingProcesses must be a non-empty array of strings');
  }

  if (!Array.isArray(supplier.materials) || supplier.materials.length === 0) {
    errors.push('materials must be a non-empty array of strings');
  }

  if (typeof supplier.minimumOrderQuantity !== 'number' || supplier.minimumOrderQuantity < 1) {
    errors.push('minimumOrderQuantity must be a positive integer');
  }

  if (typeof supplier.leadTimeDays !== 'number' || supplier.leadTimeDays < 1) {
    errors.push('leadTimeDays must be a positive integer');
  }

  if (!supplier.currency || typeof supplier.currency !== 'string') {
    errors.push('currency is required');
  }

  if (!Array.isArray(supplier.certifications)) {
    errors.push('certifications must be an array');
  } else {
    supplier.certifications.forEach((cert, idx) => {
      if (!cert.name || !cert.status) {
        errors.push(`Certification at index ${idx} missing name or status`);
      }
    });
  }

  if (supplier.evidenceConfidenceScore !== undefined && (typeof supplier.evidenceConfidenceScore !== 'number' || supplier.evidenceConfidenceScore < 0 || supplier.evidenceConfidenceScore > 1)) {
    errors.push('evidenceConfidenceScore must be a number between 0 and 1');
  }

  if (supplier.isSynthetic !== true) {
    errors.push('isSynthetic must be explicitly true for synthetic benchmark suppliers');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateSupplierCatalogue(catalogue) {
  if (!Array.isArray(catalogue)) {
    return { valid: false, total: 0, validCount: 0, errors: ['Catalogue must be an array'] };
  }

  const seenIds = new Set();
  const duplicateIds = new Set();
  const recordErrors = [];

  catalogue.forEach((supplier, index) => {
    if (supplier && supplier.supplierId) {
      if (seenIds.has(supplier.supplierId)) {
        duplicateIds.add(supplier.supplierId);
      }
      seenIds.add(supplier.supplierId);
    }
    const result = validateSupplierRecord(supplier);
    if (!result.valid) {
      recordErrors.push({ index, supplierId: supplier?.supplierId || 'unknown', errors: result.errors });
    }
  });

  if (duplicateIds.size > 0) {
    recordErrors.push({
      error: `Duplicate supplier IDs detected: ${Array.from(duplicateIds).join(', ')}`
    });
  }

  return {
    valid: recordErrors.length === 0,
    total: catalogue.length,
    validCount: catalogue.length - recordErrors.length,
    errors: recordErrors
  };
}
