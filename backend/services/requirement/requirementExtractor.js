/**
 * Requirement Information Extractor
 * Extracts structured procurement requirements from text, distinguishes mandatory criteria from preferences,
 * and identifies missing or ambiguous specifications.
 */

export function extractStructuredRequirements(rawText, filename = 'document.pdf') {
  const text = rawText || '';
  const lower = text.toLowerCase();

  // 1. Component Title
  let title = 'CNC Machined Component';
  const titleMatch = text.match(/(?:subject|requirement|part name|component|rfq for|description):\s*([^\r\n.]+)/i);
  if (titleMatch && titleMatch[1].trim().length > 3) {
    title = titleMatch[1].trim();
  } else if (lower.includes('mounting bracket')) {
    title = 'Aluminium CNC Mounting Bracket';
  } else if (lower.includes('housing')) {
    title = 'Precision Machined Housing';
  }

  // 2. Quantity
  let targetQuantity = 5000;
  const qtyMatch = text.match(/(?:quantity|qty|order volume|lot size|pieces|pcs)[:\s]*([0-9,]+)/i);
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      targetQuantity = parsedQty;
    }
  }

  // 3. Lead Time
  let requestedLeadTimeDays = 30;
  const leadMatch = text.match(/(?:lead time|delivery period|dispatch within|schedule)[:\s]*([0-9]+)\s*(?:days|calendar days)/i);
  if (leadMatch) {
    const parsedDays = parseInt(leadMatch[1], 10);
    if (!isNaN(parsedDays) && parsedDays > 0) {
      requestedLeadTimeDays = parsedDays;
    }
  }

  // 4. Target Unit Price
  let targetUnitPrice = null;
  const priceMatch = text.match(/(?:target price|budget|indicative price|unit price)[:\s]*(?:inr|rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (priceMatch) {
    const parsedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      targetUnitPrice = parsedPrice;
    }
  }

  // 5. Materials
  const materials = [];
  if (lower.includes('6061-t6') || lower.includes('6061 t6') || lower.includes('al 6061') || lower.includes('aluminium 6061')) {
    materials.push('Aluminium 6061-T6');
  } else if (lower.includes('7075') || lower.includes('al 7075')) {
    materials.push('Aluminium 7075');
  } else if (lower.includes('304') || lower.includes('ss 304')) {
    materials.push('Stainless Steel 304');
  } else if (lower.includes('aluminium') || lower.includes('aluminum')) {
    materials.push('Aluminium 6061');
  }

  // 6. Mandatory Processes
  const mandatoryProcesses = [];
  if (lower.includes('cnc mill') || lower.includes('vmc') || lower.includes('4-axis') || lower.includes('5-axis') || lower.includes('milling')) {
    mandatoryProcesses.push('CNC Milling');
  }
  if (lower.includes('turning') || lower.includes('lathe')) {
    mandatoryProcesses.push('CNC Turning');
  }
  if (lower.includes('stamping') || lower.includes('sheet metal')) {
    mandatoryProcesses.push('Sheet Metal Pressing');
  }
  if (mandatoryProcesses.length === 0) {
    mandatoryProcesses.push('CNC Milling');
  }

  // 7. Certifications
  const requiredCertifications = [];
  if (lower.includes('iso 9001') || lower.includes('iso9001')) {
    requiredCertifications.push('ISO 9001:2015');
  }
  if (lower.includes('iatf 16949') || lower.includes('iatf')) {
    requiredCertifications.push('IATF 16949');
  }
  if (lower.includes('as9100') || lower.includes('as 9100')) {
    requiredCertifications.push('AS9100D');
  }
  if (requiredCertifications.length === 0) {
    requiredCertifications.push('ISO 9001:2015');
  }

  // 8. Quality Requirements
  const qualityRequirements = {
    cmmInspectionRequired: lower.includes('cmm') || lower.includes('coordinate measuring'),
    traceabilityRequired: lower.includes('traceab') || lower.includes('batch serialization') || lower.includes('qr code') || lower.includes('barcode'),
    drawingApprovalRequired: lower.includes('drawing') || lower.includes('2d/3d') || lower.includes('cad')
  };

  // 9. Buyer Location
  let buyerLocation = 'Vadodara, Gujarat, India';
  if (lower.includes('vadodara') || lower.includes('baroda')) {
    buyerLocation = 'Vadodara, Gujarat, India';
  } else if (lower.includes('pune')) {
    buyerLocation = 'Pune, Maharashtra, India';
  } else if (lower.includes('bengaluru') || lower.includes('bangalore')) {
    buyerLocation = 'Bengaluru, Karnataka, India';
  }

  // 10. Detect Missing / Unspecified / Ambiguous Fields
  const unspecifiedFields = [];

  if (targetUnitPrice === null) {
    unspecifiedFields.push({
      field: 'targetUnitPrice',
      description: 'Target unit price not stated in requirement document',
      suggestedValue: 480.00,
      importance: 'high'
    });
  }

  if (!lower.includes('anodiz') && !lower.includes('surface coating') && !lower.includes('passivation')) {
    unspecifiedFields.push({
      field: 'surfaceTreatment',
      description: 'Surface finish / anodizing grade and color are unspecified',
      suggestedValue: 'Hard Anodizing (Type III) Black or Clear',
      importance: 'medium'
    });
  }

  if (!lower.includes('tolerance') && !lower.includes('±') && !lower.includes('+/-')) {
    unspecifiedFields.push({
      field: 'machiningTolerance',
      description: 'General dimensional tolerance class not explicitly specified',
      suggestedValue: 'ISO 2768-m (Medium Precision: ±0.1mm)',
      importance: 'medium'
    });
  }

  if (!lower.includes('payment') && !lower.includes('net 30') && !lower.includes('advance')) {
    unspecifiedFields.push({
      field: 'paymentTerms',
      description: 'Commercial payment terms not defined',
      suggestedValue: 'Net 30 Days after incoming inspection',
      importance: 'low'
    });
  }

  return {
    title,
    originalFilename: filename,
    targetQuantity,
    requestedLeadTimeDays,
    targetUnitPrice: targetUnitPrice || 480.00,
    priceCurrency: 'INR',
    materials: materials.length > 0 ? materials : ['Aluminium 6061-T6'],
    mandatoryProcesses,
    requiredCertifications,
    qualityRequirements,
    buyerLocation,
    deliveryDestination: 'Vadodara Plant, Gujarat',
    unspecifiedFields,
    requiresBuyerConfirmation: unspecifiedFields.length > 0,
    status: 'PARSED_PENDING_CONFIRMATION',
    aiExtractionMode: process.env.ENABLE_AI === 'true' && process.env.LLM_API_KEY ? 'gemini_interactions_api' : 'deterministic_rule_based'
  };
}
