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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8EDE7]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
              SPECIFICATION INTAKE
            </span>
            <span className="w-8 h-px bg-[#E8EDE7]/20"></span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#E8EDE7] mt-1 flex items-center gap-2">
            Requirement Intake & Extraction
          </h1>
          <p className="text-xs text-[#929D92] mt-0.5">
            Parse engineering RFQ drawings & specifications into structured parameters stored in PostgreSQL.
          </p>
        </div>

        <button
          onClick={handleLoadSamplePdf}
          disabled={isUploading}
          className="myca-btn-secondary px-4 py-2 text-xs font-mono"
        >
          Load Vadodara CNC Benchmark RFQ
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Upload Box + Active Requirement Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Terminal Box */}
        <div className="p-5 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#E8EDE7] flex items-center gap-1.5 font-mono">
            <UploadCloud className="w-4 h-4 text-[#A8B99A]" /> Upload Engineering RFQ
          </h2>
          <p className="text-xs text-[#929D92]">
            Select a CAD/PDF drawing or technical specification document (maximum 10MB).
          </p>

          <div className="border border-dashed border-[#E8EDE7]/20 hover:border-[#A8B99A]/60 rounded-lg p-6 text-center cursor-pointer bg-[#0B100E] transition-colors">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="hidden" 
              id="pdf-upload-input" 
            />
            <label htmlFor="pdf-upload-input" className="cursor-pointer">
              <FileText className="w-8 h-8 mx-auto text-[#A8B99A]/60 mb-2" />
              <p className="text-xs font-semibold text-[#E8EDE7]">
                {file ? file.name : 'Select or drop PDF specification'}
              </p>
              <p className="text-[10px] text-[#929D92] mt-1 font-mono">Text-based PDF with vector layers supported</p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full myca-btn-primary py-2.5 text-xs font-mono disabled:opacity-40"
          >
            {isUploading ? 'Extracting Parameters...' : 'Parse & Persist Requirement'}
          </button>

          {/* Existing Requirements Selector */}
          {requirementsList.length > 0 && (
            <div className="pt-4 border-t border-[#E8EDE7]/10">
              <span className="text-[10px] font-mono uppercase text-[#929D92] block mb-2">Stored Requirements ({requirementsList.length})</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono">
                {requirementsList.map(req => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement && onSelectRequirement(req)}
                    className={`p-2.5 rounded-md text-xs cursor-pointer border transition-colors ${
                      activeRequirement?.id === req.id
                        ? 'bg-[#1E2922] border-[#A8B99A] text-white'
                        : 'bg-[#0B100E] border-[#E8EDE7]/10 text-[#929D92] hover:text-[#E8EDE7]'
                    }`}
                  >
                    <p className="font-bold text-[#D1B878] truncate">{req.id}</p>
                    <p className="text-[10px] text-[#929D92] truncate">{req.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Confirmed Engineering Specification */}
        <div className="lg:col-span-2">
          {activeRequirement ? (
            <div className="p-5 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-[#E8EDE7]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#D1B878]">{activeRequirement.id}</span>
                    <span className="myca-badge-qualified">DURABLE POSTGRESQL</span>
                  </div>
                  <h2 className="font-serif text-2xl font-normal text-[#E8EDE7] mt-1">{activeRequirement.title}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-[#929D92] block">Status</span>
                  <span className="font-mono text-xs font-semibold text-[#A8B99A]">{activeRequirement.status || 'ACTIVE'}</span>
                </div>
              </div>

              {/* Commercial Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-[#0B100E] border border-[#E8EDE7]/5">
                  <span className="text-[10px] uppercase text-[#929D92] block">Target Quantity</span>
                  <p className="text-base font-bold text-[#E8EDE7] mt-0.5">
                    {activeRequirement.targetQuantity?.toLocaleString() || 5000} pcs
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#0B100E] border border-[#E8EDE7]/5">
                  <span className="text-[10px] uppercase text-[#929D92] block">Target Unit Price</span>
                  <p className="text-base font-bold text-[#A8B99A] mt-0.5">
                    ₹{activeRequirement.targetUnitPrice || 480}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#0B100E] border border-[#E8EDE7]/5">
                  <span className="text-[10px] uppercase text-[#929D92] block">Lead Time Window</span>
                  <p className="text-base font-bold text-[#E8EDE7] mt-0.5">
                    {activeRequirement.requestedLeadTimeDays || 30} days
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-[#0B100E] border border-[#E8EDE7]/5">
                  <span className="text-[10px] uppercase text-[#929D92] block">Delivery Hub</span>
                  <p className="text-sm font-semibold text-[#E8EDE7] mt-0.5">
                    {activeRequirement.deliveryLocation?.city || 'Pune'}, {activeRequirement.deliveryLocation?.country || 'India'}
                  </p>
                </div>
              </div>

              {/* Technical Specifications Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-[#0B100E] border border-[#E8EDE7]/5 space-y-2">
                  <span className="text-[10px] uppercase text-[#A8B99A] font-bold block">Mandatory Processes & Materials</span>
                  <div>
                    <span className="text-[10px] text-[#929D92]">Processes:</span>
                    <p className="text-[#E8EDE7]">{(activeRequirement.mandatoryProcesses || activeRequirement.manufacturingProcesses || ['CNC Milling', 'Turning']).join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#929D92]">Materials:</span>
                    <p className="text-[#E8EDE7]">{(activeRequirement.materials || ['Aluminium 6061-T6']).join(', ')}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0B100E] border border-[#E8EDE7]/5 space-y-2">
                  <span className="text-[10px] uppercase text-[#D1B878] font-bold block">Compliance & Quality Control</span>
                  <div>
                    <span className="text-[10px] text-[#929D92]">Required Audits:</span>
                    <p className="text-[#E8EDE7]">{(activeRequirement.requiredCertifications || activeRequirement.certifications || ['ISO 9001:2015']).join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#929D92]">CMM & Traceability:</span>
                    <p className="text-[#E8EDE7]">Mandatory (Automotive Laser QR)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 text-[#929D92] text-xs">
              <FileText className="w-10 h-10 mx-auto text-[#929D92]/40 mb-2" />
              <p className="font-semibold text-[#E8EDE7]">No active requirement selected.</p>
              <p className="mt-1">Upload a PDF specification document or click "Load Vadodara CNC Benchmark RFQ".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
