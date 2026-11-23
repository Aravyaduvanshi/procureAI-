import supplierRepo from './supplierRepository.js';
import { validateSupplierRecord, validateSupplierCatalogue } from './supplierValidator.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';

export const listSuppliers = (req, res, next) => {
  try {
    const suppliers = supplierRepo.findAll(req.query);
    console.log(`[SUPPLIER] listSuppliers: returning ${suppliers.length} records`);

    res.json({
      success: true,
      count: suppliers.length,
      suppliers,
      items: suppliers
    });
  } catch (err) {
    next(err);
  }
};

export const getSupplierById = (req, res, next) => {
  try {
    const { id } = req.params;
    const isBuyer = Boolean(req.user);
    const supplier = supplierRepo.findById(id, isBuyer);
    if (!supplier) {
      throw new NotFoundError(`Supplier with ID ${id} not found`);
    }
    res.json({
      success: true,
      supplier
    });
  } catch (err) {
    next(err);
  }
};

export const getSupplierEvidence = (req, res, next) => {
  try {
    const { id } = req.params;
    const evidence = supplierRepo.getEvidence(id);
    if (!evidence) {
      throw new NotFoundError(`Supplier evidence with ID ${id} not found`);
    }
    res.json({
      success: true,
      evidence
    });
  } catch (err) {
    next(err);
  }
};

export const getCatalogueSchema = (req, res, next) => {
  try {
    const schema = supplierRepo.getSchema();
    res.json({
      success: true,
      schema
    });
  } catch (err) {
    next(err);
  }
};

export const validateCatalogue = (req, res, next) => {
  try {
    const catalogue = req.body;
    const validation = validateSupplierCatalogue(catalogue);
    res.json({
      success: true,
      validation
    });
  } catch (err) {
    next(err);
  }
};
