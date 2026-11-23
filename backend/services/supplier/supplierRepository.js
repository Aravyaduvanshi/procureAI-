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
    if (!fs.existsSync(CATALOGUE_PATH)) {
      throw new Error(`Supplier catalogue not found: ${CATALOGUE_PATH}`);
    }

    const raw = fs.readFileSync(CATALOGUE_PATH, 'utf-8');
    const suppliers = JSON.parse(raw);

    const validation = validateSupplierCatalogue(suppliers);
    if (!validation.valid) {
      throw new Error(`Invalid supplier catalogue: ${JSON.stringify(validation.errors, null, 2)}`);
    }

    this.suppliers = suppliers;
    console.log(`[SupplierRepository] Loaded ${this.suppliers.length} suppliers`);

    if (fs.existsSync(SCHEMA_PATH)) {
      this.schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
    }
  }

  findAll(filters = {}) {
    let result = [...this.suppliers];

    const {
      search,
      process,
      material,
      city,
      state,
      maxLeadTime,
      maxMoq,
      certification,
      page = 1,
      limit = 50
    } = filters;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(supplier => {
        const companyMatch = supplier.companyName.toLowerCase().includes(query);
        const cityMatch = supplier.location.city.toLowerCase().includes(query);
        const categoryMatch = (supplier.productCategories || []).some(cat => cat.toLowerCase().includes(query));
        const materialMatch = (supplier.materials || []).some(m => m.toLowerCase().includes(query));
        return companyMatch || cityMatch || categoryMatch || materialMatch;
      });
    }

    if (process) {
      const query = process.toLowerCase();
      result = result.filter(supplier =>
        (supplier.manufacturingProcesses || []).some(p => p.toLowerCase().includes(query))
      );
    }

    if (material) {
      const query = material.toLowerCase();
      result = result.filter(supplier =>
        (supplier.materials || []).some(m => m.toLowerCase().includes(query))
      );
    }

    if (city) {
      result = result.filter(supplier =>
        supplier.location.city.toLowerCase() === city.toLowerCase()
      );
    }

    if (state) {
      result = result.filter(supplier =>
        supplier.location.state.toLowerCase() === state.toLowerCase()
      );
    }

    if (maxLeadTime) {
      result = result.filter(supplier =>
        Number(supplier.leadTimeDays) <= Number(maxLeadTime)
      );
    }

    if (maxMoq) {
      result = result.filter(supplier =>
        Number(supplier.minimumOrderQuantity) <= Number(maxMoq)
      );
    }

    if (certification) {
      const query = certification.toLowerCase();
      result = result.filter(supplier =>
        (supplier.certifications || []).some(cert =>
          cert.name.toLowerCase().includes(query) && cert.status === 'verified_certificate'
        )
      );
    }

    const total = result.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = result.slice(startIndex, startIndex + Number(limit));

    // Dual-interface array: can be treated as an Array, or access .items and .total
    paginated.total = total;
    paginated.items = paginated;
    paginated.page = Number(page);
    paginated.limit = Number(limit);
    paginated.totalPages = Math.ceil(total / Number(limit));

    return paginated;
  }

  findById(id, isBuyer = false) {
    const supplier = this.suppliers.find(s => s.supplierId === id);
    if (!supplier) return null;

    if (!isBuyer) {
      return {
        ...supplier,
        businessEmail: supplier.businessEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        contactPerson: {
          ...(typeof supplier.contactPerson === 'object' ? supplier.contactPerson : { name: supplier.contactPerson }),
          phonePlaceholder: '[Protected - Buyer Login Required]'
        }
      };
    }

    return supplier;
  }

  getInternalById(id) {
    return this.findById(id, true);
  }

  getEvidence(id) {
    const supplier = this.findById(id, true);
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

  getSchema() {
    return this.schema;
  }

  count() {
    return this.suppliers.length;
  }
}

export default new SupplierRepository();
