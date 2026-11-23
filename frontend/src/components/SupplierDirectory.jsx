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
  const [activeTabInDrawer, setActiveTabInDrawer] = useState('master'); // 'master' | 'rating' | 'matching'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Supplier Master Catalog ({filtered.length} of {suppliers.length} Records)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified synthetic manufacturing facilities across Indian industrial corridors (loaded from backend API).
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suppliers, materials, cities..."
            className="w-full pl-9 pr-4 py-1.5 rounded bg-[#0b1017] border border-[#1e293b] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded bg-[#0e141f] border border-[#1e293b] text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 mr-2 text-[11px] uppercase tracking-wider">
          <Filter className="w-3 h-3 text-slate-400" /> Filter Criteria:
        </span>

        {/* Process Filter */}
        <select
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
          className="bg-[#080d15] border border-[#1e293b] text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
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
          className="bg-[#080d15] border border-[#1e293b] text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
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
          className="bg-[#080d15] border border-[#1e293b] text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
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
            className="ml-auto text-amber-400 hover:text-amber-300 font-semibold text-xs"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Supplier Table */}
      <div className="rounded bg-[#0e141f] border border-[#1e293b] overflow-hidden">
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
              <tr key={s.supplierId} className="cursor-pointer" onClick={() => handleOpenDetail(s)}>
                <td className="font-mono text-xs text-amber-400 font-bold">{s.supplierId}</td>
                <td className="font-semibold text-slate-200">{s.companyName}</td>
                <td className="text-slate-400 text-xs">
                  {s.location?.city}, {s.location?.state}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {(s.manufacturingProcesses || []).slice(0, 2).map((p, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {p}
                      </span>
                    ))}
                    {(s.manufacturingProcesses || []).length > 2 && (
                      <span className="text-[10px] text-slate-500">+{s.manufacturingProcesses.length - 2}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-xs text-slate-300">
                    {(s.materials || [])[0] || 'Aluminium'}
                  </span>
                </td>
                <td className="font-mono text-xs text-emerald-400 font-semibold">
                  ₹{s.indicativeUnitPrice}
                </td>
                <td className="font-mono text-xs">{s.minimumOrderQuantity?.toLocaleString()}</td>
                <td className="font-mono text-xs">{s.leadTimeDays}d</td>
                <td>
                  <div className="flex items-center gap-1">
                    {(s.certifications || []).filter(c => c.status === 'verified_certificate').map((c, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
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
                    className="px-2 py-1 rounded text-[11px] font-semibold bg-[#182233] hover:bg-slate-700 text-amber-400 border border-slate-700"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#0c1017] border-l border-[#1e293b] h-full overflow-y-auto p-6 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1e293b]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">{activeSupplierDetail.supplierId}</span>
                  <span className="badge-verified">MASTER CATALOG DATA</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{activeSupplierDetail.companyName}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {activeSupplierDetail.location?.industrialArea}, {activeSupplierDetail.location?.city}, {activeSupplierDetail.location?.state}
                </p>
              </div>

              <button
                onClick={() => setActiveSupplierDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs: Master Data vs Calculated Vendor Rating vs Matching */}
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 text-xs">
              <button
                onClick={() => setActiveTabInDrawer('master')}
                className={`px-3 py-1.5 rounded font-semibold font-mono ${
                  activeTabInDrawer === 'master'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Supplier Master Data
              </button>
              <button
                onClick={() => setActiveTabInDrawer('rating')}
                className={`px-3 py-1.5 rounded font-semibold font-mono ${
                  activeTabInDrawer === 'rating'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Calculated Vendor Rating
              </button>
            </div>

            {/* TAB 1: SUPPLIER MASTER DATA */}
            {activeTabInDrawer === 'master' && (
              <div className="space-y-5 text-xs">
                {/* Commercial Terms */}
                <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b]">
                  <h3 className="font-mono uppercase font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Commercial Terms (Master Profile)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Indicative Price</span>
                      <p className="text-base font-bold text-emerald-400">₹{activeSupplierDetail.indicativeUnitPrice}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Batch MOQ</span>
                      <p className="text-sm font-semibold text-slate-200">{activeSupplierDetail.minimumOrderQuantity?.toLocaleString()} pcs</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Standard Lead Time</span>
                      <p className="text-sm font-semibold text-slate-200">{activeSupplierDetail.leadTimeDays} days</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Payment Terms</span>
                      <p className="text-sm font-semibold text-slate-200">{activeSupplierDetail.paymentTerms || 'Net 30'}</p>
                    </div>
                  </div>
                </div>

                {/* Technical Processes & Materials */}
                <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b] space-y-3">
                  <h3 className="font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" /> Manufacturing Capabilities & Materials
                  </h3>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Processes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeSupplierDetail.manufacturingProcesses || []).map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#162030] text-slate-300 font-mono text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Materials</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeSupplierDetail.materials || []).map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Machinery & Testing Equipment</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeSupplierDetail.equipmentCapabilities || []).map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#131b29] text-amber-300 font-mono text-[11px] border border-amber-900/40">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audited Certifications */}
                <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b]">
                  <h3 className="font-mono uppercase font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audited Quality Certifications
                  </h3>
                  <div className="space-y-1.5">
                    {(activeSupplierDetail.certifications || []).map((c, i) => (
                      <div key={i} className="p-2 rounded bg-[#080d15] flex items-center justify-between text-[11px] font-mono">
                        <span className="font-semibold text-slate-200">{c.name}</span>
                        <span className="text-emerald-400 font-bold uppercase">{c.status?.replace(/_/g, ' ')}</span>
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
                  <div className="p-3 rounded bg-[#0e141f] border border-[#1e293b] text-slate-300">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Evaluated Against Active Requirement</span>
                    <p className="font-bold text-sm text-white mt-0.5">{activeRequirement.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Quantity: {activeRequirement.targetQuantity} pcs | Target: ₹{activeRequirement.targetUnitPrice}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-amber-950/30 border border-amber-800 text-amber-300 text-xs">
                    No active requirement loaded. Select or upload a requirement to run requirement-specific deterministic rating.
                  </div>
                )}

                {isRatingLoading ? (
                  <div className="py-8 text-center text-slate-400 font-mono">
                    Calculating 5-dimension deterministic vendor rating from backend...
                  </div>
                ) : vendorRating ? (
                  <div className="space-y-4">
                    {/* Overall Score Banner */}
                    <div className="p-4 rounded bg-[#080d15] border border-[#1e293b] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400">Deterministic Overall Rating</span>
                        <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
                          {vendorRating.overallScore} <span className="text-sm text-slate-500">/ 100</span>
                        </div>
                        <span className="badge-verified mt-1">CONFIDENCE: {vendorRating.confidenceLevel}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Recommendation</span>
                        <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block mt-1">
                          {vendorRating.recommendationVerdict}
                        </span>
                      </div>
                    </div>

                    {/* 5-Dimensional Breakdown */}
                    <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b] space-y-3">
                      <h4 className="font-mono uppercase font-bold text-slate-300 text-[11px]">
                        Multi-Dimensional Scoring Breakdown
                      </h4>

                      {Object.entries(vendorRating.scoringBreakdown?.dimensions || {}).map(([dimKey, dimData]) => (
                        <div key={dimKey} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300 capitalize">{dimKey.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-slate-400">Weight: {Math.round(dimData.weight * 100)}% | <strong>{dimData.score}/100</strong></span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded overflow-hidden">
                            <div 
                              className="h-full bg-amber-500" 
                              style={{ width: `${dimData.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Positive Factors & Risks */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded bg-[#0e141f] border border-[#1e293b]">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-2">Key Strengths</span>
                        <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                          {(vendorRating.scoringBreakdown?.positiveFactors || []).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded bg-[#0e141f] border border-[#1e293b]">
                        <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-2">Identified Risks</span>
                        {(vendorRating.scoringBreakdown?.riskFactors || []).length === 0 ? (
                          <p className="text-[11px] text-slate-500 font-mono">No disqualifying risk factors identified.</p>
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
                      className="px-4 py-2 rounded text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 disabled:opacity-50"
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
