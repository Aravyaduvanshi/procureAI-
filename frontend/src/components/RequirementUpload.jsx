import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Cpu,
  Layers,
  Check,
  ArrowRight,
  ShieldCheck,
  Sliders
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
      const samplePayload = {
        title: 'Precision CNC Machined Aluminium Mounting Bracket (Housing Mount)',
        targetQuantity: 5000,
        requestedLeadTimeDays: 30,
        targetUnitPrice: 480.00,
        priceCurrency: 'INR',
        currency: 'INR',
        productCategory: 'Automotive Chassis Mounts',
        materials: ['Aluminium 6061-T6'],
        manufacturingProcesses: ['4-Axis CNC Milling', 'CNC Turning'],
        mandatoryProcesses: ['CNC Milling', 'CNC Turning'],
        certifications: ['ISO 9001:2015', 'IATF 16949'],
        requiredCertifications: ['ISO 9001:2015', 'IATF 16949'],
        qualityRequirements: {
          cmmInspectionRequired: true,
          traceabilityRequired: true,
          drawingApprovalRequired: true
        },
        deliveryLocation: {
          city: 'Pune',
          state: 'Maharashtra',
          country: 'India'
        }
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

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Engineering Requirement Intake & Extraction
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Parse engineering RFQ drawings & specifications into structured parameters stored in PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleLoadSamplePdf}
          disabled={isUploading}
          className="px-3.5 py-1.5 rounded text-xs font-mono font-semibold bg-[#182233] hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
        >
          Load Vadodara CNC Benchmark RFQ
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Upload Box + Active Requirement Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Terminal Box */}
        <div className="p-5 rounded bg-[#0e141f] border border-[#1e293b] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-cyan-400" /> Upload Engineering RFQ
          </h2>
          <p className="text-xs text-slate-400">
            Select a CAD/PDF drawing or technical specification document (maximum 10MB).
          </p>

          <div className="border border-dashed border-[#1e293b] hover:border-slate-500 rounded p-6 text-center cursor-pointer bg-[#080d15] transition-colors">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="hidden" 
              id="pdf-upload-input" 
            />
            <label htmlFor="pdf-upload-input" className="cursor-pointer">
              <FileText className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                {file ? file.name : 'Select or drop PDF specification'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Text-based PDF with vector layers supported</p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full py-2 rounded text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 disabled:opacity-40 transition-colors"
          >
            {isUploading ? 'Extracting Parameters...' : 'Parse & Persist Requirement'}
          </button>

          {/* Existing Requirements Selector */}
          {requirementsList.length > 0 && (
            <div className="pt-4 border-t border-[#1e293b]">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-2">Stored Requirements ({requirementsList.length})</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {requirementsList.map(req => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement && onSelectRequirement(req)}
                    className={`p-2 rounded text-xs cursor-pointer border font-mono ${
                      activeRequirement?.id === req.id
                        ? 'bg-[#182233] border-amber-500 text-white'
                        : 'bg-[#080d15] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="font-bold truncate">{req.id}</p>
                    <p className="text-[10px] text-slate-400 truncate">{req.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Confirmed Engineering Specification */}
        <div className="lg:col-span-2">
          {activeRequirement ? (
            <div className="p-5 rounded bg-[#0e141f] border border-[#1e293b] space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-[#1e293b]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{activeRequirement.id}</span>
                    <span className="badge-verified">ACTIVE IN POSTGRESQL</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{activeRequirement.title}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Status</span>
                  <span className="font-mono text-xs font-semibold text-emerald-400">{activeRequirement.status || 'ACTIVE'}</span>
                </div>
              </div>

              {/* Commercial Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded bg-[#080d15] border border-[#1e293b]">
                  <span className="text-[10px] uppercase text-slate-500 block">Target Quantity</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {activeRequirement.targetQuantity?.toLocaleString() || 5000} pcs
                  </p>
                </div>
                <div className="p-3 rounded bg-[#080d15] border border-[#1e293b]">
                  <span className="text-[10px] uppercase text-slate-500 block">Target Unit Price</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">
                    ₹{activeRequirement.targetUnitPrice || 480}
                  </p>
                </div>
                <div className="p-3 rounded bg-[#080d15] border border-[#1e293b]">
                  <span className="text-[10px] uppercase text-slate-500 block">Lead Time Window</span>
                  <p className="text-base font-bold text-slate-200 mt-0.5">
                    {activeRequirement.requestedLeadTimeDays || 30} days
                  </p>
                </div>
                <div className="p-3 rounded bg-[#080d15] border border-[#1e293b]">
                  <span className="text-[10px] uppercase text-slate-500 block">Delivery Corridor</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">
                    {activeRequirement.deliveryLocation?.city || 'Pune'}, {activeRequirement.deliveryLocation?.country || 'India'}
                  </p>
                </div>
              </div>

              {/* Technical Specifications Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded bg-[#080d15] border border-[#1e293b] space-y-2">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">Mandatory Processes & Materials</span>
                  <div>
                    <span className="text-[10px] text-slate-500">Processes:</span>
                    <p className="text-slate-200">{(activeRequirement.mandatoryProcesses || activeRequirement.manufacturingProcesses || ['CNC Milling', 'Turning']).join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Materials:</span>
                    <p className="text-slate-200">{(activeRequirement.materials || ['Aluminium 6061-T6']).join(', ')}</p>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#080d15] border border-[#1e293b] space-y-2">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold block">Compliance & Quality Control</span>
                  <div>
                    <span className="text-[10px] text-slate-500">Required Audits:</span>
                    <p className="text-slate-200">{(activeRequirement.requiredCertifications || activeRequirement.certifications || ['ISO 9001:2015']).join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">CMM & Traceability:</span>
                    <p className="text-slate-200">Mandatory (Automotive Laser QR)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded bg-[#0e141f] border border-[#1e293b] text-slate-500 text-xs">
              <FileText className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p className="font-semibold text-slate-400">No active requirement selected.</p>
              <p className="mt-1">Upload a PDF specification document or click "Load Vadodara CNC Benchmark RFQ".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
