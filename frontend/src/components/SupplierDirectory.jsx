import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  X,
  Gauge,
  Sliders,
  DollarSign,
  Tag,
  Cpu,
  Layers,
  FileCheck
} from 'lucide-react';
import api from '../../utils/axios.js';

export default function SupplierDirectory({ 
  suppliers = [], 
  onSelectForMatching,
  activeRequirement 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedCertification, setSelectedCertification] = useState('');
  const [activeSupplierDetail, setActiveSupplierDetail] = useState(null);
  const [activeTabInDrawer, setActiveTabInDrawer] = useState('master'); // 'master' | 'rating'
  const [vendorRating, setVendorRating] = useState(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Filter suppliers
  const filtered = suppliers.filter(s => {
    const q = searchTerm.toLowerCase();
    const company = s.companyName?.toLowerCase() || '';
    const city = s.location?.city?.toLowerCase() || '';
    const state = s.location?.state?.toLowerCase() || '';
    const materials = s.materials || [];
    const processes = s.manufacturingProcesses || [];

    const matchesSearch = !searchTerm || (
      company.includes(q) ||
      city.includes(q) ||
      state.includes(q) ||
      materials.some(m => m.toLowerCase().includes(q)) ||
      processes.some(p => p.toLowerCase().includes(q))
    );

    const matchesProcess = !selectedProcess || processes.some(p => p.toLowerCase().includes(selectedProcess.toLowerCase()));
    const matchesMaterial = !selectedMaterial || materials.some(m => m.toLowerCase().includes(selectedMaterial.toLowerCase()));
    const certs = s.certifications || [];
    const matchesCert = !selectedCertification || certs.some(c => (c.name || '').toLowerCase().includes(selectedCertification.toLowerCase()) && c.status === 'verified_certificate');

    return matchesSearch && matchesProcess && matchesMaterial && matchesCert;
  });

  const handleOpenDetail = (supplier) => {
    setActiveSupplierDetail(supplier);
    setActiveTabInDrawer('master');
    setVendorRating(null);
    setRatingError('');

    // If an active requirement exists, evaluate vendor rating automatically
    if (activeRequirement?.id) {
      evaluateVendorRating(supplier.supplierId, activeRequirement.id);
    }
  };

  const evaluateVendorRating = async (supplierId, requirementId) => {
    setIsRatingLoading(true);
    setRatingError('');
    try {
      const { data } = await api.post('/api/ratings/evaluate', {
        supplierId,
        requirementId
      });
      if (data.success && data.rating) {
        setVendorRating(data.rating);
      }
    } catch (err) {
      setRatingError(err.response?.data?.error?.message || 'Failed to calculate vendor rating');
    } finally {
      setIsRatingLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8EDE7]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
              SUPPLIER ECOSYSTEM
            </span>
            <span className="w-8 h-px bg-[#E8EDE7]/20"></span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#E8EDE7] mt-1 flex items-center gap-2">
            Supplier Master Catalog
            <span className="font-mono text-sm font-normal text-[#929D92]">({filtered.length} of {suppliers.length} Records)</span>
          </h1>
          <p className="text-xs text-[#929D92] mt-0.5">
            Verified manufacturing facilities across precision corridors loaded from backend API.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#929D92] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suppliers, materials, cities..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 text-xs text-[#E8EDE7] placeholder-[#929D92] focus:outline-none focus:border-[#A8B99A]"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 text-xs">
        <span className="text-[#929D92] font-semibold flex items-center gap-1 mr-2 text-[11px] uppercase font-mono tracking-wider">
          <Filter className="w-3 h-3 text-[#A8B99A]" /> Filter:
        </span>

        {/* Process Filter */}
        <select
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
          className="bg-[#0B100E] border border-[#E8EDE7]/10 text-[#E8EDE7] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#A8B99A]"
        >
          <option value="">All Processes</option>
          <option value="CNC Milling">CNC Milling</option>
          <option value="5-Axis">5-Axis Machining</option>
          <option value="CNC Turning">CNC Turning</option>
          <option value="Die Casting">Die Casting</option>
          <option value="Sheet Metal">Sheet Metal Pressing</option>
        </select>

        {/* Material Filter */}
        <select
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          className="bg-[#0B100E] border border-[#E8EDE7]/10 text-[#E8EDE7] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#A8B99A]"
        >
          <option value="">All Materials</option>
          <option value="Aluminium 6061">Aluminium 6061-T6</option>
          <option value="Aluminium ADC12">Aluminium ADC12</option>
          <option value="Stainless Steel">Stainless Steel</option>
          <option value="Carbon Steel">Carbon Steel</option>
        </select>

        {/* Certification Filter */}
        <select
          value={selectedCertification}
          onChange={(e) => setSelectedCertification(e.target.value)}
          className="bg-[#0B100E] border border-[#E8EDE7]/10 text-[#E8EDE7] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#A8B99A]"
        >
          <option value="">All Quality Certifications</option>
          <option value="ISO 9001">ISO 9001:2015</option>
          <option value="IATF 16949">IATF 16949 (Automotive)</option>
          <option value="AS9100">AS9100D (Aerospace)</option>
        </select>

        {(searchTerm || selectedProcess || selectedMaterial || selectedCertification) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedProcess('');
              setSelectedMaterial('');
              setSelectedCertification('');
            }}
            className="ml-auto text-[#A8B99A] hover:text-white font-mono font-semibold text-xs"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Supplier Table */}
      <div className="rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 overflow-hidden">
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Supplier ID</th>
              <th>Company Name</th>
              <th>Industrial Hub</th>
              <th>Key Manufacturing Processes</th>
              <th>Materials Handled</th>
              <th>Indicative Price</th>
              <th>MOQ</th>
              <th>Lead Time</th>
              <th>Certifications</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.supplierId} className="cursor-pointer hover:bg-[#1E2922]" onClick={() => handleOpenDetail(s)}>
                <td className="font-mono text-xs text-[#D1B878] font-bold">{s.supplierId}</td>
                <td className="font-semibold text-[#E8EDE7]">{s.companyName}</td>
                <td className="text-[#929D92] text-xs">
                  {s.location?.city}, {s.location?.state}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {(s.manufacturingProcesses || []).slice(0, 2).map((p, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B100E] text-[#929D92] border border-[#E8EDE7]/5 font-mono">
                        {p}
                      </span>
                    ))}
                    {(s.manufacturingProcesses || []).length > 2 && (
                      <span className="text-[10px] text-[#929D92]/60">+{s.manufacturingProcesses.length - 2}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-xs text-[#929D92]">
                    {(s.materials || [])[0] || 'Aluminium'}
                  </span>
                </td>
                <td className="font-mono text-xs text-[#A8B99A] font-semibold">
                  ₹{s.indicativeUnitPrice}
                </td>
                <td className="font-mono text-xs">{s.minimumOrderQuantity?.toLocaleString()}</td>
                <td className="font-mono text-xs">{s.leadTimeDays}d</td>
                <td>
                  <div className="flex items-center gap-1">
                    {(s.certifications || []).filter(c => c.status === 'verified_certificate').map((c, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#A8B99A]/15 text-[#A8B99A] border border-[#A8B99A]/30">
                        {c.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(s);
                    }}
                    className="myca-btn-secondary px-2.5 py-1 text-[11px] font-mono"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Supplier Inspection Drawer */}
      {activeSupplierDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#0B100E] border-l border-[#E8EDE7]/10 h-full overflow-y-auto p-6 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E8EDE7]/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#D1B878]">{activeSupplierDetail.supplierId}</span>
                  <span className="myca-badge-qualified">MASTER RECORD</span>
                </div>
                <h2 className="font-serif text-2xl font-normal text-[#E8EDE7] mt-1">{activeSupplierDetail.companyName}</h2>
                <p className="text-xs text-[#929D92] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#A8B99A]" />
                  {activeSupplierDetail.location?.industrialArea}, {activeSupplierDetail.location?.city}, {activeSupplierDetail.location?.state}
                </p>
              </div>

              <button
                onClick={() => setActiveSupplierDetail(null)}
                className="p-1 rounded-full text-[#929D92] hover:text-white hover:bg-[#151D18] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs: Master Data vs Calculated Vendor Rating vs Matching */}
            <div className="flex items-center gap-2 border-b border-[#E8EDE7]/10 pb-2 text-xs">
              <button
                onClick={() => setActiveTabInDrawer('master')}
                className={`px-3 py-1.5 rounded font-medium font-mono transition-colors ${
                  activeTabInDrawer === 'master'
                    ? 'bg-[#A8B99A]/15 text-[#A8B99A] border border-[#A8B99A]/40'
                    : 'text-[#929D92] hover:text-[#E8EDE7]'
                }`}
              >
                1. Supplier Master Data
              </button>
              <button
                onClick={() => setActiveTabInDrawer('rating')}
                className={`px-3 py-1.5 rounded font-medium font-mono transition-colors ${
                  activeTabInDrawer === 'rating'
                    ? 'bg-[#A8B99A]/15 text-[#A8B99A] border border-[#A8B99A]/40'
                    : 'text-[#929D92] hover:text-[#E8EDE7]'
                }`}
              >
                2. Calculated Vendor Rating
              </button>
            </div>

            {/* TAB 1: SUPPLIER MASTER DATA */}
            {activeTabInDrawer === 'master' && (
              <div className="space-y-5 text-xs">
                {/* Commercial Terms */}
                <div className="p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10">
                  <h3 className="font-mono uppercase font-bold text-[#E8EDE7] mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#A8B99A]" /> Commercial Terms (Master Profile)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div>
                      <span className="text-[10px] text-[#929D92] uppercase">Indicative Price</span>
                      <p className="text-base font-bold text-[#A8B99A]">₹{activeSupplierDetail.indicativeUnitPrice}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#929D92] uppercase">Batch MOQ</span>
                      <p className="text-sm font-semibold text-[#E8EDE7]">{activeSupplierDetail.minimumOrderQuantity?.toLocaleString()} pcs</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#929D92] uppercase">Standard Lead Time</span>
                      <p className="text-sm font-semibold text-[#E8EDE7]">{activeSupplierDetail.leadTimeDays} days</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#929D92] uppercase">Payment Terms</span>
                      <p className="text-sm font-semibold text-[#E8EDE7]">{activeSupplierDetail.paymentTerms || 'Net 30'}</p>
                    </div>
                  </div>
                </div>

                {/* Technical Processes & Materials */}
                <div className="p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 space-y-3">
                  <h3 className="font-mono uppercase font-bold text-[#E8EDE7] flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#A8B99A]" /> Manufacturing Capabilities & Materials
                  </h3>
                  <div>
                    <span className="text-[10px] text-[#929D92] uppercase block mb-1">Processes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeSupplierDetail.manufacturingProcesses || []).map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#0B100E] text-[#E8EDE7] font-mono text-[11px] border border-[#E8EDE7]/5">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#929D92] uppercase block mb-1">Materials</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeSupplierDetail.materials || []).map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#0B100E] text-[#E8EDE7] font-mono text-[11px] border border-[#E8EDE7]/5">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#929D92] uppercase block mb-1">Machinery & Equipment</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeSupplierDetail.equipmentCapabilities || []).map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#1E2922] text-[#D1B878] font-mono text-[11px] border border-[#D1B878]/30">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audited Certifications */}
                <div className="p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10">
                  <h3 className="font-mono uppercase font-bold text-[#E8EDE7] mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#A8B99A]" /> Audited Quality Certifications
                  </h3>
                  <div className="space-y-1.5">
                    {(activeSupplierDetail.certifications || []).map((c, i) => (
                      <div key={i} className="p-2.5 rounded bg-[#0B100E] border border-[#E8EDE7]/5 flex items-center justify-between text-[11px] font-mono">
                        <span className="font-semibold text-[#E8EDE7]">{c.name}</span>
                        <span className="text-[#A8B99A] font-bold uppercase">{c.status?.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CALCULATED VENDOR RATING */}
            {activeTabInDrawer === 'rating' && (
              <div className="space-y-5 text-xs">
                {activeRequirement ? (
                  <div className="p-3.5 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 text-[#E8EDE7]">
                    <span className="text-[10px] uppercase font-mono text-[#929D92] block">Evaluated Against Active Requirement</span>
                    <p className="font-bold text-sm text-[#E8EDE7] mt-0.5">{activeRequirement.title}</p>
                    <p className="text-[11px] text-[#929D92] font-mono mt-0.5">
                      Quantity: {activeRequirement.targetQuantity} pcs | Target: ₹{activeRequirement.targetUnitPrice}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#D1B878]/10 border border-[#D1B878]/30 text-[#D1B878] text-xs">
                    No active requirement loaded. Select or upload a requirement to run requirement-specific deterministic rating.
                  </div>
                )}

                {isRatingLoading ? (
                  <div className="py-8 text-center text-[#929D92] font-mono">
                    Calculating 5-dimension deterministic vendor rating from backend...
                  </div>
                ) : vendorRating ? (
                  <div className="space-y-4">
                    {/* Overall Score Banner */}
                    <div className="p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#929D92]">Deterministic Overall Rating</span>
                        <div className="text-3xl font-bold font-mono text-[#A8B99A] mt-1">
                          {vendorRating.overallScore} <span className="text-sm text-[#929D92]">/ 100</span>
                        </div>
                        <span className="myca-badge-qualified mt-1 inline-block">CONFIDENCE: {vendorRating.confidenceLevel}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-[#929D92] block">Recommendation</span>
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#D1B878]/15 text-[#D1B878] border border-[#D1B878]/30 inline-block mt-1">
                          {vendorRating.recommendationVerdict}
                        </span>
                      </div>
                    </div>

                    {/* 5-Dimensional Breakdown */}
                    <div className="p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 space-y-3">
                      <h4 className="font-mono uppercase font-bold text-[#E8EDE7] text-[11px]">
                        Multi-Dimensional Scoring Breakdown
                      </h4>

                      {Object.entries(vendorRating.scoringBreakdown?.dimensions || {}).map(([dimKey, dimData]) => (
                        <div key={dimKey} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#E8EDE7] capitalize">{dimKey.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-[#929D92]">Weight: {Math.round(dimData.weight * 100)}% | <strong className="text-[#E8EDE7]">{dimData.score}/100</strong></span>
                          </div>
                          <div className="w-full h-1.5 bg-[#0B100E] rounded overflow-hidden">
                            <div 
                              className="h-full bg-[#A8B99A]" 
                              style={{ width: `${dimData.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Positive Factors & Risks */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10">
                        <span className="text-[10px] font-mono uppercase text-[#A8B99A] font-bold block mb-2">Key Strengths</span>
                        <ul className="space-y-1 text-[11px] text-[#E8EDE7] list-disc list-inside">
                          {(vendorRating.scoringBreakdown?.positiveFactors || []).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10">
                        <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-2">Identified Risks</span>
                        {(vendorRating.scoringBreakdown?.riskFactors || []).length === 0 ? (
                          <p className="text-[11px] text-[#929D92] font-mono">No disqualifying risk factors identified.</p>
                        ) : (
                          <ul className="space-y-1 text-[11px] text-rose-300 list-disc list-inside">
                            {(vendorRating.scoringBreakdown?.riskFactors || []).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <button
                      onClick={() => activeRequirement && evaluateVendorRating(activeSupplierDetail.supplierId, activeRequirement.id)}
                      disabled={!activeRequirement}
                      className="myca-btn-primary px-4 py-2 text-xs font-mono disabled:opacity-50"
                    >
                      Calculate Deterministic Vendor Rating
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
