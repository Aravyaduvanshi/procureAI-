import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  Cpu,
  Layers,
  Check
} from 'lucide-react';
import api from '../../utils/axios.js';

export default function RequirementUpload({ 
  onRequirementReady, 
  activeRequirement, 
  requirementsList = [], 
  onSelectRequirement 
}) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannedError, setIsScannedError] = useState(false);
  const [confirmationFields, setConfirmationFields] = useState({
    targetUnitPrice: 480.00,
    surfaceTreatment: 'Hard Anodizing (Type III) Black',
    machiningTolerance: 'ISO 2768-m (±0.1mm)',
    paymentTerms: 'Net 30 Days'
  });

  const handleFileChange = (e) => {
    setErrorMsg('');
    setIsScannedError(false);
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('Only PDF documents are supported for requirement extraction.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 10MB limit.');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg('');
    setIsScannedError(false);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const { data } = await api.post('/api/requirements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success && data.requirement) {
        onRequirementReady(data.requirement);
      }
    } catch (err) {
      if (err.response?.data?.error?.code === 'OCR_REQUIRED') {
        setIsScannedError(true);
        setErrorMsg('Scanned or image-only PDF detected. OCR is required to extract selectable text.');
      } else {
        setErrorMsg(err.response?.data?.error?.message || 'Failed to upload and parse requirement document.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSamplePdf = async () => {
    setIsUploading(true);
    setErrorMsg('');
    setIsScannedError(false);

    try {
      // Create requirement using the pre-tested Vadodara sample specification
      const samplePayload = {
        title: 'Precision CNC Machined Aluminium Mounting Bracket (Housing Mount)',
        targetQuantity: 5000,
        requestedLeadTimeDays: 30,
        targetUnitPrice: 480.00,
        priceCurrency: 'INR',
        materials: ['Aluminium 6061-T6'],
        mandatoryProcesses: ['CNC Milling', 'CNC Turning'],
        requiredCertifications: ['ISO 9001:2015', 'IATF 16949'],
        qualityRequirements: {
          cmmInspectionRequired: true,
          traceabilityRequired: true,
          drawingApprovalRequired: true
        },
        buyerLocation: 'Vadodara, Gujarat, India',
        deliveryDestination: 'Vadodara Central Warehouse, Gujarat',
        unspecifiedFields: [
          {
            field: 'surfaceTreatment',
            description: 'Surface finish / anodizing grade and color are unspecified in RFQ text',
            suggestedValue: 'Hard Anodizing (Type III) Black',
            importance: 'medium'
          },
          {
            field: 'machiningTolerance',
            description: 'General dimensional tolerance class not explicitly specified',
            suggestedValue: 'ISO 2768-m (±0.1mm)',
            importance: 'medium'
          }
        ],
        requiresBuyerConfirmation: true,
        status: 'PARSED_PENDING_CONFIRMATION'
      };

      const { data } = await api.post('/api/requirements/create', samplePayload);
      if (data.success && data.requirement) {
        onRequirementReady(data.requirement);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to initialize sample requirement.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmAndMatch = async () => {
    if (!activeRequirement) return;
    try {
      const updates = {
        targetUnitPrice: Number(confirmationFields.targetUnitPrice),
        surfaceTreatment: confirmationFields.surfaceTreatment,
        machiningTolerance: confirmationFields.machiningTolerance,
        paymentTerms: confirmationFields.paymentTerms,
        requiresBuyerConfirmation: false
      };

      const { data } = await api.put(`/api/requirements/${activeRequirement.id}/confirm`, updates);
      if (data.success) {
        onRequirementReady(data.requirement, true); // true = trigger matching tab!
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to confirm requirement specifications.');
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-400" />
          Procurement Requirement Document Upload
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload manufacturing RFQs or engineering drawings. The parser extracts structured parameters and separates hard constraints from preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Dropzone & History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Dropzone Box */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Upload Requirement PDF</h3>
            <p className="text-xs text-slate-400 mt-1">Accepts text-based PDF RFQs up to 10MB</p>

            <div className="mt-4">
              <input
                type="file"
                id="rfq-file-upload"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="rfq-file-upload"
                className="inline-block cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                {file ? file.name : 'Select PDF File'}
              </label>
            </div>

            {file && (
              <div className="mt-4">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isUploading ? 'Extracting Specifications...' : 'Parse & Extract Specifications'}
                </button>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-500 block mb-2">Or test immediately with benchmark document:</span>
              <button
                onClick={handleLoadSamplePdf}
                disabled={isUploading}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 transition-all"
              >
                Load Sample Vadodara Bracket RFQ
              </button>
            </div>

            {errorMsg && (
              <div className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 text-left ${isScannedError ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Previous Requirements List */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Saved Requirements</h3>
            {requirementsList.length === 0 ? (
              <p className="text-xs text-slate-500">No previous requirements stored.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {requirementsList.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement(req)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      activeRequirement?.id === req.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-semibold truncate">{req.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{req.targetQuantity} pcs</span>
                      <span className="font-mono text-indigo-400">{req.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted Structured Requirements & Buyer Confirmation */}
        <div className="lg:col-span-2">
          {activeRequirement ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <span className="font-mono text-xs text-indigo-400 font-bold">{activeRequirement.id}</span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{activeRequirement.title}</h2>
                  <p className="text-xs text-slate-400">Original Document: {activeRequirement.originalFilename || 'Specification Document'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border self-start ${
                  activeRequirement.status === 'BUYER_CONFIRMED' || activeRequirement.status === 'MATCHED'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {activeRequirement.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Extracted Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Lot Quantity</span>
                  <p className="text-sm font-bold text-white mt-0.5">{activeRequirement.targetQuantity?.toLocaleString()} pcs</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Lead Time</span>
                  <p className="text-sm font-bold text-white mt-0.5">{activeRequirement.requestedLeadTimeDays} days</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Target Unit Price</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{activeRequirement.targetUnitPrice || 480.00}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Destination</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1">{activeRequirement.deliveryDestination || 'Vadodara, Gujarat'}</p>
                </div>
              </div>

              {/* Technical Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Mandatory Processes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeRequirement.mandatoryProcesses || []).map((p, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Specified Materials</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeRequirement.materials || []).map((m, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quality Standards Required */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Quality & Compliance Criteria</span>
                <div className="flex flex-wrap gap-2">
                  {(activeRequirement.requiredCertifications || []).map((c, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {c}
                    </span>
                  ))}
                  {activeRequirement.qualityRequirements?.cmmInspectionRequired && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      CMM Inspection Report Mandatory
                    </span>
                  )}
                  {activeRequirement.qualityRequirements?.traceabilityRequired && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Laser QR Traceability Required
                    </span>
                  )}
                </div>
              </div>

              {/* Unspecified / Ambiguous Fields Interactive Review */}
              {activeRequirement.requiresBuyerConfirmation && (
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-4">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Unspecified Fields Detected — Buyer Review Required</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    The document parser identified parameters that were unspecified or ambiguous in the uploaded document. Please confirm these values before running the supplier matching engine:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-slate-400 block font-semibold mb-1">Target Unit Price (INR)</label>
                      <input
                        type="number"
                        value={confirmationFields.targetUnitPrice}
                        onChange={(e) => setConfirmationFields({ ...confirmationFields, targetUnitPrice: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-semibold mb-1">Surface Treatment Specification</label>
                      <input
                        type="text"
                        value={confirmationFields.surfaceTreatment}
                        onChange={(e) => setConfirmationFields({ ...confirmationFields, surfaceTreatment: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-semibold mb-1">General Machining Tolerances</label>
                      <input
                        type="text"
                        value={confirmationFields.machiningTolerance}
                        onChange={(e) => setConfirmationFields({ ...confirmationFields, machiningTolerance: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block font-semibold mb-1">Preferred Commercial Payment Terms</label>
                      <input
                        type="text"
                        value={confirmationFields.paymentTerms}
                        onChange={(e) => setConfirmationFields({ ...confirmationFields, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Parsing Engine: {activeRequirement.aiExtractionMode || 'deterministic_rule_based'}
                </span>
                <button
                  onClick={handleConfirmAndMatch}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  Confirm Specifications & Run Matching
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
              <Layers className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-300">No Active Requirement Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Upload a requirement PDF using the dropzone or load the sample Vadodara RFQ to preview extracted specifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
