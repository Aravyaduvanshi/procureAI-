import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height } = page.getSize();
  let y = height - 50;

  function drawHeading(text) {
    page.drawText(text, { x: 50, y, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
    y -= 25;
  }

  function drawSubheading(text) {
    page.drawText(text, { x: 50, y, size: 12, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    y -= 18;
  }

  function drawLine(label, value) {
    page.drawText(`${label}: `, { x: 50, y, size: 10, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(value, { x: 210, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
  }

  function drawParagraph(text) {
    page.drawText(text, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    y -= 15;
  }

  drawHeading('GUJARAT PRECISION ELECTRO-MECH PVT. LTD.');
  drawParagraph('Plot 142/B, Makarpura GIDC Industrial Estate, Vadodara, Gujarat - 390010');
  drawParagraph('Email: procurement@gujaratprecision.example.com | RFQ Ref: GPE-RFQ-2026-089');
  y -= 15;

  drawSubheading('FORMAL REQUEST FOR QUOTATION (RFQ) - TECHNICAL PROCUREMENT SPECIFICATION');
  y -= 10;

  drawLine('Subject / Component', 'Precision CNC Machined Aluminium Mounting Bracket (Housing Mount)');
  drawLine('Drawing Reference', 'GPE-MB-2026-REV3 (CAD/3D model available on NDA execution)');
  drawLine('Target Order Quantity', '5,000 pieces (Initial Production Lot)');
  drawLine('Requested Delivery Period', '30 days from purchase order confirmation');
  drawLine('Delivery Destination', 'Vadodara Central Warehouse, Gujarat, India');
  drawLine('Primary Material Grade', 'Aluminium 6061-T6 (Raw material test certificate required)');
  drawLine('Mandatory Processes', '4-Axis or 5-Axis CNC Milling, Precision CNC Turning');
  drawLine('Mandatory Quality System', 'ISO 9001:2015 certification (IATF 16949 preferred)');
  drawLine('Target Unit Price', 'Quotations invited from qualified suppliers (Indicative budget: INR 480.00)');
  y -= 10;

  drawSubheading('TECHNICAL CAPABILITY & QUALITY REQUIREMENTS:');
  drawParagraph('1. Feasibility: Supplier must manufacture component strictly adhering to approved drawing GPE-MB-2026-REV3.');
  drawParagraph('2. Inspection: In-house Coordinate Measuring Machine (CMM) inspection report mandatory for pilot lot.');
  drawParagraph('3. Traceability: Laser marking / batch QR code serialization required on all delivered parts.');
  drawParagraph('4. Rejection Policy: Target zero-defect quality with maximum allowable PPM < 200.');
  y -= 10;

  drawSubheading('COMMERCIAL TERMS & NOTES FOR BIDDERS:');
  drawParagraph('- Payment terms: Standard Net 30 Days preferred after incoming inspection and quality clearance.');
  drawParagraph('- Note: Surface finishing specification (anodizing grade/color) to be finalized during technical review.');
  drawParagraph('- Suppliers with manufacturing facilities in Gujarat or Western India manufacturing corridors prioritized.');

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(__dirname, 'Sample_Procurement_Requirement_Vadodara.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log('Sample requirement PDF generated successfully at:', outputPath);
}

generateSamplePdf().catch(console.error);
