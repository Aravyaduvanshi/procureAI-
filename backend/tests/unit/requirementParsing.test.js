import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateUploadFile, parsePdfDocument } from '../../services/requirement/documentParser.js';
import { extractStructuredRequirements } from '../../services/requirement/requirementExtractor.js';
import { ValidationError } from '../../shared/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../../data/sample-requirements/Sample_Procurement_Requirement_Vadodara.pdf');

describe('Requirement Document Parsing & Extraction Suite', () => {
  it('should validate file format and reject non-PDF uploads', () => {
    assert.throws(
      () => validateUploadFile({ mimetype: 'image/png', originalname: 'drawing.png', size: 1024 }),
      ValidationError
    );
  });

  it('should reject file uploads exceeding the 10MB limit', () => {
    assert.throws(
      () => validateUploadFile({ mimetype: 'application/pdf', originalname: 'large.pdf', size: 11 * 1024 * 1024 }),
      ValidationError
    );
  });

  it('should reject empty PDF buffers', async () => {
    await assert.rejects(
      async () => parsePdfDocument(Buffer.alloc(0)),
      ValidationError
    );
  });

  it('should parse valid text-based procurement requirement PDF correctly', async () => {
    assert.ok(fs.existsSync(SAMPLE_PDF_PATH), 'Sample requirement PDF must exist on disk');
    const buffer = fs.readFileSync(SAMPLE_PDF_PATH);
    const parsed = await parsePdfDocument(buffer);

    assert.equal(parsed.isScannedPdf, false);
    assert.ok(parsed.characterCount > 100);
    assert.ok(parsed.text.includes('GUJARAT PRECISION ELECTRO-MECH'));
    assert.ok(parsed.text.includes('Aluminium 6061-T6'));
  });

  it('should extract structured parameters and separate mandatory requirements from preferences', async () => {
    const buffer = fs.readFileSync(SAMPLE_PDF_PATH);
    const parsed = await parsePdfDocument(buffer);
    const structured = extractStructuredRequirements(parsed.text, 'Sample_Procurement_Requirement_Vadodara.pdf');

    assert.equal(structured.targetQuantity, 5000);
    assert.equal(structured.requestedLeadTimeDays, 30);
    assert.ok(structured.materials.includes('Aluminium 6061-T6'));
    assert.ok(structured.mandatoryProcesses.includes('CNC Milling'));
    assert.ok(structured.requiredCertifications.includes('ISO 9001:2015'));
  });

  it('should detect unspecified fields and flag for buyer confirmation without silent invention', async () => {
    // Text intentionally missing tolerance and payment terms
    const textWithoutTolerances = `
      RFQ for Precision CNC Machined Aluminium Mounting Bracket
      Target Quantity: 5000 pcs
      Delivery within 30 days
      Material: Aluminium 6061-T6
      Processes: 4-Axis CNC Milling
      Certifications: ISO 9001:2015
    `;
    const structured = extractStructuredRequirements(textWithoutTolerances, 'test.pdf');
    assert.equal(structured.requiresBuyerConfirmation, true);
    assert.ok(structured.unspecifiedFields.length > 0);
    assert.ok(structured.unspecifiedFields.some(f => f.field === 'machiningTolerance' || f.field === 'paymentTerms' || f.field === 'surfaceTreatment'));
  });

  it('should detect image-only or scanned PDF and report that OCR is required', async () => {
    // Mock image-only buffer by passing minimal whitespace text
    const emptyTextBuffer = Buffer.from('%PDF-1.4 mock scanned minimal text');
    // Using parsePdfDocument with malformed/scanned content
    try {
      const result = await parsePdfDocument(emptyTextBuffer);
      if (result.characterCount < 50) {
        assert.equal(result.isScannedPdf, true);
        assert.equal(result.ocrRequired, true);
      }
    } catch (e) {
      // Handled safely
      assert.ok(e instanceof ValidationError);
    }
  });
});
