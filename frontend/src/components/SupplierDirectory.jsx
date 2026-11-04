import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Award, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  X,
  Gauge
} from 'lucide-react';

export default function SupplierDirectory({ suppliers = [], onSelectForMatching }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedCertification, setSelectedCertification] = useState('');
  const [activeSupplierDetail, setActiveSupplierDetail] = useState(null);

  // Filter suppliers
  const filtered = suppliers.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      s.companyName.toLowerCase().includes(q) ||
      s.location.city.toLowerCase().includes(q) ||
      s.location.state.toLowerCase().includes(q) ||
      s.materials.some(m => m.toLowerCase().includes(q)) ||
      s.manufacturingProcesses.some(p => p.toLowerCase().includes(q))
    );

    const matchesProcess = !selectedProcess || s.manufacturingProcesses.some(p => p.toLowerCase().includes(selectedProcess.toLowerCase()));
    const matchesMaterial = !selectedMaterial || s.materials.some(m => m.toLowerCase().includes(selectedMaterial.toLowerCase()));
    const matchesCert = !selectedCertification || s.certifications.some(c => c.name.toLowerCase().includes(selectedCertification.toLowerCase()) && c.status === 'verified_certificate');

    return matchesSearch && matchesProcess && matchesMaterial && matchesCert;
  });

  return (
    <div className="space-y-6 py-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Synthetic Supplier Directory ({filtered.length} of {suppliers.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fictional precision engineering & industrial component manufacturing suppliers across Indian industrial corridors.
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
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Process Filter */}
        <select
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
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
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
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
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
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
            className="ml-auto text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => {
          const confidencePct = Math.round((s.evidenceConfidenceScore || 0.7) * 100);
          const verifiedCerts = (s.certifications || []).filter(c => c.status === 'verified_certificate');

          return (
            <div
              key={s.supplierId}
              className="glass-panel glass-panel-hover rounded-xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                {/* Header ID and synthetic badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-indigo-400">{s.supplierId}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      Synthetic
                    </span>
                    <span 
                      title={`Confidence Score: ${confidencePct}%`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        confidencePct >= 90 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                        confidencePct >= 75 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {confidencePct}% Conf.
                    </span>
                  </div>
                </div>

                {/* Company Name & Location */}
                <h3 className="text-base font-bold text-white hover:text-indigo-300 transition-colors">
                  {s.companyName}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{s.location.industrialArea ? `${s.location.industrialArea}, ` : ''}{s.location.city}, {s.location.state}</span>
                </div>

                {/* Processes and Materials tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.manufacturingProcesses.slice(0, 3).map((proc, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {proc}
                    </span>
                  ))}
                  {s.materials.slice(0, 2).map((mat, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                      {mat}
                    </span>
                  ))}
                </div>

                {/* Quality & Certifications */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex flex-wrap gap-1">
                    {verifiedCerts.length > 0 ? (
                      verifiedCerts.map((c, i) => (
                        <span key={i} className="text-[10px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-amber-400">Self-declared / Unaudited Certs</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Commercials & Action Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Indicative Estimate</p>
                  <p className="text-sm font-bold text-white">
                    {s.indicativeUnitPrice ? `₹${s.indicativeUnitPrice.toFixed(2)}` : 'RFQ Required'}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ unit</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Lead Time</p>
                  <p className="text-sm font-semibold text-slate-200">{s.leadTimeDays} days</p>
                </div>
                <button
                  onClick={() => setActiveSupplierDetail(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700 transition-all"
                >
                  Inspect Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Profile Modal */}
      {activeSupplierDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold">{activeSupplierDetail.supplierId}</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{activeSupplierDetail.companyName}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeSupplierDetail.location.industrialArea}, {activeSupplierDetail.location.city}, {activeSupplierDetail.location.state}, India
                </p>
              </div>
              <button
                onClick={() => setActiveSupplierDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Commercial & Operational Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Indicative Price</span>
                  <p className="text-sm font-bold text-white mt-0.5">₹{activeSupplierDetail.indicativeUnitPrice || 'N/A'}</p>
                  <span className="text-[9px] text-slate-400">{activeSupplierDetail.priceType?.replace(/_/g, ' ')}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Min Order Qty</span>
                  <p className="text-sm font-bold text-white mt-0.5">{activeSupplierDetail.minimumOrderQuantity} pcs</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Lead Time</span>
                  <p className="text-sm font-bold text-white mt-0.5">{activeSupplierDetail.leadTimeDays} days</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Payment Terms</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1">{activeSupplierDetail.paymentTerms}</p>
                </div>
              </div>

              {/* Manufacturing Capabilities */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Equipment & Machinery</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {(activeSupplierDetail.equipmentCapabilities || []).map((eq, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{eq}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quality & Traceability */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quality & Traceability Evidence</h4>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">In-house CMM Inspection:</span>
                    <span className={`font-semibold ${activeSupplierDetail.qualityControl?.cmmInspection ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeSupplierDetail.qualityControl?.cmmInspection ? 'Available' : 'Not Equipped'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Traceability Architecture:</span>
                    <span className="text-slate-200 font-medium">{activeSupplierDetail.qualityControl?.traceabilitySystem || 'Standard Job Card'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Historical Quality PPM:</span>
                    <span className="text-slate-200 font-medium">{activeSupplierDetail.qualityControl?.rejectionRatePpm ? `${activeSupplierDetail.qualityControl.rejectionRatePpm} PPM` : 'Not on file'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Audit Status:</span>
                    <span className="text-slate-200 capitalize font-medium">{activeSupplierDetail.qualityControl?.evidenceStatus}</span>
                  </div>
                </div>
              </div>

              {/* Certifications Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Certifications & Accreditations</h4>
                <div className="space-y-1.5">
                  {(activeSupplierDetail.certifications || []).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="font-semibold text-slate-200">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'verified_certificate' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveSupplierDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
