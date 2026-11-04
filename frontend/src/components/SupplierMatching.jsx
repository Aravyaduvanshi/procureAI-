import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  MapPin, 
  XCircle, 
  CheckSquare, 
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../../utils/axios.js';

export default function SupplierMatching({ 
  matchingResult, 
  activeRequirement, 
  onShortlistApproved, 
  onRunMatching 
}) {
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'excluded'
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [expandedSupplierId, setExpandedSupplierId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const shortlist = matchingResult?.recommendedShortlist || [];
  const excluded = matchingResult?.excludedSuppliers || [];

  // Toggle selection for negotiation
  const toggleSelectSupplier = (id) => {
    if (selectedSupplierIds.includes(id)) {
      setSelectedSupplierIds(selectedSupplierIds.filter(s => s !== id));
    } else {
      setSelectedSupplierIds([...selectedSupplierIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSupplierIds.length === shortlist.length) {
      setSelectedSupplierIds([]);
    } else {
      setSelectedSupplierIds(shortlist.map(s => s.supplierId));
    }
  };

  const handleSubmitForApproval = async () => {
    if (!matchingResult) return;
    setIsSubmitting(true);
    setActionMessage('');

    try {
      const payload = {
        proposalId: matchingResult.id,
        proposalVersion: matchingResult.proposalVersion || 1,
        actionType: 'SHORTLIST_APPROVAL',
        decision: 'APPROVED',
        reason: 'Buyer approved top-ranking suppliers for commercial negotiation',
        selectedSupplierIds: selectedSupplierIds.length > 0 ? selectedSupplierIds : shortlist.map(s => s.supplierId)
      };

      const { data } = await api.post('/api/approvals', payload);
      if (data.success) {
        setActionMessage('Shortlist approved successfully. Proceeding to negotiation planning.');
        if (onShortlistApproved) {
          onShortlistApproved(data.approval, selectedSupplierIds);
        }
      }
    } catch (err) {
      setActionMessage(err.response?.data?.error?.message || 'Failed to submit shortlist approval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Supplier Matching & Deterministic Ranking
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Relevance evaluation against "{activeRequirement?.title || 'Active Requirement'}".
            Model: <span className="font-mono text-indigo-300">{matchingResult?.matchingModelVersion || 'v1.2.0-deterministic-hybrid'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'recommended'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Recommended Shortlist ({shortlist.length})
          </button>
          <button
            onClick={() => setActiveTab('excluded')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'excluded'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Excluded Vendors ({excluded.length})
          </button>
        </div>
      </div>

      {/* AI Executive Summary Box */}
      {matchingResult?.executiveSummary && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 text-xs">
          <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Supplier Matching Agent Executive Summary</span>
          </div>
          <p className="text-slate-200 font-medium leading-relaxed">
            {matchingResult.executiveSummary.summaryParagraph}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-400 text-[11px] pt-2 border-t border-slate-800">
            <span>Evaluated: <strong className="text-white">{matchingResult.totalEvaluated || 20}</strong> vendors</span>
            <span>Eligible: <strong className="text-emerald-400">{matchingResult.eligibleCount}</strong></span>
            <span>Excluded: <strong className="text-rose-400">{matchingResult.excludedCount}</strong></span>
            <span>Lead Recommendation: <strong className="text-indigo-300">{matchingResult.executiveSummary.leadCandidate}</strong></span>
          </div>
        </div>
      )}

      {/* Tab 1: Recommended Shortlist Cards */}
      {activeTab === 'recommended' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Select candidates to include in the approved negotiation plan (max 5):</span>
            <button
              onClick={handleSelectAll}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {selectedSupplierIds.length === shortlist.length ? 'Deselect All' : 'Select All Recommended'}
            </button>
          </div>

          <div className="space-y-4">
            {shortlist.map((s, index) => {
              const isSelected = selectedSupplierIds.includes(s.supplierId);
              const isExpanded = expandedSupplierId === s.supplierId;
              const dims = s.scoringBreakdown?.dimensions || {};

              return (
                <div
                  key={s.supplierId}
                  className={`glass-panel rounded-2xl p-5 border transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-950/40' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Checkbox, Rank and Title */}
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleSelectSupplier(s.supplierId)}
                        className="mt-1 text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <span className="font-mono text-xs text-indigo-400">{s.supplierId}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {s.confidenceLevel} CONFIDENCE
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white mt-1">{s.companyName}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {s.location}
                        </p>
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center gap-4">
                      <div className="text-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Suitability</span>
                        <p className="text-2xl font-extrabold text-indigo-300">{s.overallScore}<span className="text-xs font-normal text-slate-500">/100</span></p>
                      </div>

                      <div className="text-right text-xs">
                        <p className="text-slate-400">Indicative Quote</p>
                        <p className="text-sm font-bold text-white">
                          ₹{s.fullSupplierProfile?.indicativeUnitPrice || 'N/A'}{' '}
                          <span className="text-[10px] font-normal text-slate-400">/ pc</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Lead Time: {s.fullSupplierProfile?.leadTimeDays}d</p>
                      </div>

                      <button
                        onClick={() => setExpandedSupplierId(isExpanded ? null : s.supplierId)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 5-Dimension Mini Progress Bars */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>Technical (35%)</span>
                        <span className="font-bold text-slate-200">{dims.technicalCapability?.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${dims.technicalCapability?.score}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>Quality (20%)</span>
                        <span className="font-bold text-slate-200">{dims.qualityCertifications?.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dims.qualityCertifications?.score}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>Commercial (20%)</span>
                        <span className="font-bold text-slate-200">{dims.commercialCompetitiveness?.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dims.commercialCompetitiveness?.score}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>Delivery (15%)</span>
                        <span className="font-bold text-slate-200">{dims.deliveryFeasibility?.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${dims.deliveryFeasibility?.score}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400">
                        <span>Evidence (10%)</span>
                        <span className="font-bold text-slate-200">{dims.evidenceCompleteness?.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${dims.evidenceCompleteness?.score}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown & Explainability Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                      {s.aiCommentary && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          <strong className="text-indigo-400 block mb-1">AI Evaluator Commentary:</strong>
                          {s.aiCommentary}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                          <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1 mb-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Key Strengths
                          </span>
                          <ul className="space-y-1 text-slate-300">
                            {(s.scoringBreakdown?.positiveFactors || []).map((pro, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40">
                          <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1 mb-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Risks & Uncertainties
                          </span>
                          <ul className="space-y-1 text-slate-300">
                            {(s.scoringBreakdown?.riskFactors || []).map((risk, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-400">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">
                Ready to Proceed to Human Governance Gate?
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Approving the shortlist creates durable records and enables negotiation strategy preparation.
              </p>
            </div>

            <button
              onClick={handleSubmitForApproval}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              Approve Shortlist & Enter Approval Gate
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {actionMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Excluded Vendors Table */}
      {activeTab === 'excluded' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              Disqualified Suppliers (Non-Qualifying against Hard Constraints)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These vendors were strictly excluded by application logic rather than arbitrary AI overrides.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">MOQ</th>
                  <th className="p-3">Hard Disqualification Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {excluded.map((item) => (
                  <tr key={item.supplierId} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono text-indigo-400 font-semibold">{item.supplierId}</td>
                    <td className="p-3 font-medium text-slate-200">{item.companyName}</td>
                    <td className="p-3 text-slate-400">{item.location}</td>
                    <td className="p-3 text-slate-400">{item.moq ? `${item.moq} pcs` : 'N/A'}</td>
                    <td className="p-3 text-rose-300 font-medium">
                      {(item.disqualificationReasons || []).join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
