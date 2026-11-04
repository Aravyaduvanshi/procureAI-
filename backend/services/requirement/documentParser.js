import { createRequire } from 'module';
import { ValidationError } from '../../shared/errors.js';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['application/pdf'];

/**
 * Validates uploaded file buffer and metadata
 */
export function validateUploadFile(file) {
  if (!file) {
    throw new ValidationError('No file provided for requirement processing');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
  }

  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = file.originalname && file.originalname.toLowerCase().endsWith('.pdf');

  if (!isPdfMime && !isPdfExt) {
    throw new ValidationError('Unsupported file format. Only PDF documents are supported for requirement extraction');
  }

  return true;
}

/**
 * Extracts raw selectable text and page count from PDF buffer.
 * Detects scanned or image-only documents where OCR is required.
 */
export async function parsePdfDocument(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError('Empty PDF file buffer provided');
  }

  try {
    let text = '';
    let numPages = 1;

    if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text ? result.text.trim() : '';
      numPages = result.total || (result.pages ? result.pages.length : 1);
    } else if (typeof pdfParseModule === 'function') {
      const result = await pdfParseModule(buffer);
      text = result.text ? result.text.trim() : '';
      numPages = result.numpages || 1;
    } else {
      throw new Error('Unsupported pdf-parse module format');
    }

    // Detect scanned or image-only PDF (no selectable text or very few characters across pages)
    const isScannedPdf = text.length < 50 || (text.split(/\s+/).filter(w => w.length > 2).length < 10);

    return {
      text,
      pageCount: numPages,
      characterCount: text.length,
      isScannedPdf,
      ocrRequired: isScannedPdf
    };
  } catch (err) {
    throw new ValidationError(`Failed to parse PDF document: ${err.message}. File may be corrupted or password-protected.`);
  }
}
