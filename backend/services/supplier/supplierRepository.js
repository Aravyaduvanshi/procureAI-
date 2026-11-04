import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSupplierCatalogue } from './supplierValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOGUE_PATH = path.resolve(__dirname, '../../data/suppliers/suppliers.json');
const SCHEMA_PATH = path.resolve(__dirname, '../../data/suppliers/schema.json');

class SupplierRepository {
  constructor() {
    this.suppliers = [];
    this.schema = null;
    this.loadCatalogue();
  }

  loadCatalogue() {
    try {
      if (fs.existsSync(CATALOGUE_PATH)) {
        const raw = fs.readFileSync(CATALOGUE_PATH, 'utf-8');
        this.suppliers = JSON.parse(raw);
        const validation = validateSupplierCatalogue(this.suppliers);
        if (!validation.valid) {
          console.warn('[SupplierRepo] Catalogue validation warnings:', validation.errors);
        } else {
          console.log(`[SupplierRepo] Loaded and validated ${this.suppliers.length} synthetic suppliers.`);
        }
      } else {
        console.warn(`[SupplierRepo] Catalogue file not found at ${CATALOGUE_PATH}`);
      }

      if (fs.existsSync(SCHEMA_PATH)) {
        this.schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
      }
    } catch (err) {
      console.error('[SupplierRepo] Failed to load supplier catalogue:', err.message);
    }
  }

  getSchema() {
    return this.schema;
  }

  findAll({
    search = '',
    process = '',
    material = '',
    city = '',
    state = '',
    maxLeadTime = null,
    maxMoq = null,
    certification = '',
    page = 1,
    limit = 50
  } = {}) {
    let result = [...this.suppliers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.companyName.toLowerCase().includes(q) ||
        s.location.city.toLowerCase().includes(q) ||
        s.productCategories.some(cat => cat.toLowerCase().includes(q)) ||
        s.materials.some(m => m.toLowerCase().includes(q))
      );
    }

    if (process) {
      const p = process.toLowerCase();
      result = result.filter(s =>
        s.manufacturingProcesses.some(mp => mp.toLowerCase().includes(p))
      );
    }

    if (material) {
      const m = material.toLowerCase();
      result = result.filter(s =>
        s.materials.some(mat => mat.toLowerCase().includes(m))
      );
    }

    if (city) {
      result = result.filter(s => s.location.city.toLowerCase() === city.toLowerCase());
    }

    if (state) {
      result = result.filter(s => s.location.state.toLowerCase() === state.toLowerCase());
    }

    if (maxLeadTime) {
      const lt = Number(maxLeadTime);
      result = result.filter(s => s.leadTimeDays <= lt);
    }

    if (maxMoq) {
      const moq = Number(maxMoq);
      result = result.filter(s => s.minimumOrderQuantity <= moq);
    }

    if (certification) {
      const certName = certification.toLowerCase();
      result = result.filter(s =>
        s.certifications.some(c => c.name.toLowerCase().includes(certName) && c.status === 'verified_certificate')
      );
    }

    const total = result.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = result.slice(startIndex, startIndex + Number(limit));

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      items: paginated
    };
  }

  findById(id, isBuyer = false) {
    const supplier = this.suppliers.find(s => s.supplierId === id);
    if (!supplier) return null;

    if (!isBuyer) {
      // Redact sensitive direct email and direct phone for public view
      return {
        ...supplier,
        businessEmail: supplier.businessEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        contactPerson: {
          ...supplier.contactPerson,
          phonePlaceholder: '[Protected - Buyer Login Required]'
        }
      };
    }

    return supplier;
  }

  getEvidence(id) {
    const supplier = this.suppliers.find(s => s.supplierId === id);
    if (!supplier) return null;

    return {
      supplierId: supplier.supplierId,
      companyName: supplier.companyName,
      certifications: supplier.certifications,
      qualityControl: supplier.qualityControl,
      deliveryPerformance: supplier.deliveryPerformance,
      supportingDocuments: supplier.supportingDocuments,
      dataSource: supplier.dataSource,
      lastVerificationDate: supplier.lastVerificationDate,
      evidenceConfidenceScore: supplier.evidenceConfidenceScore,
      isSynthetic: supplier.isSynthetic
    };
  }
}

export default new SupplierRepository();
