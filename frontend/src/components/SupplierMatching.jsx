import React, { useState } from 'react';
import { 
  Cpu, 
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
  ChevronUp,
  RefreshCw
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const shortlist = matchingResult?.recommendedShortlist || [];
  const excluded = matchingResult?.excludedSuppliers || [];

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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            Deterministic Supplier Matching Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates 20 master suppliers against requirement criteria using 5-dimension deterministic scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeRequirement && (
            <button
              onClick={() => onRunMatching && onRunMatching(activeRequirement.id)}
              className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-[#182233] hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Run Matching Engine
            </button>
          )}

          <div className="flex items-center border border-[#1e293b] rounded overflow-hidden">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                activeTab === 'recommended'
                  ? 'bg-amber-600 text-slate-950'
                  : 'bg-[#080d15] text-slate-400 hover:text-slate-200'
              }`}
            >
              Shortlist ({shortlist.length})
            </button>
            <button
              onClick={() => setActiveTab('excluded')}
              className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                activeTab === 'excluded'
                  ? 'bg-rose-950 text-rose-300 border-l border-rose-800'
                  : 'bg-[#080d15] text-slate-400 hover:text-slate-200'
              }`}
            >
              Excluded ({excluded.length})
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Matching Result Active Container */}
      {!matchingResult ? (
        <div className="p-12 text-center rounded bg-[#0e141f] border border-[#1e293b] text-slate-500 text-xs">
          <Cpu className="w-10 h-10 mx-auto text-slate-700 mb-2" />
          <p className="font-semibold text-slate-400">No matching run calculated yet.</p>
          <p className="mt-1">Select an active requirement and click "Run Matching Engine" to rank the 20 master suppliers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Executive Summary Bar */}
          <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-slate-500">Matching Run ID</span>
              <p className="font-mono text-sm font-bold text-amber-400">{matchingResult.id}</p>
              <p className="text-slate-400 mt-0.5">
                Evaluated: <strong>{matchingResult.totalEvaluated || 20}</strong> suppliers | Eligible: <strong className="text-emerald-400">{matchingResult.eligibleCount || shortlist.length}</strong> | Excluded: <strong className="text-rose-400">{matchingResult.excludedCount || excluded.length}</strong>
              </p>
            </div>

            {shortlist.length > 0 && (
              <button
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                className="px-4 py-2 rounded text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? 'Submitting to Gate...' : 'Authorize Shortlist in Governance Gate'}
              </button>
            )}
          </div>

          {/* TAB 1: RECOMMENDED SHORTLIST TABLE */}
          {activeTab === 'recommended' && (
            <div className="rounded bg-[#0e141f] border border-[#1e293b] overflow-hidden">
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th className="w-8">
                      <input 
                        type="checkbox" 
                        checked={selectedSupplierIds.length === shortlist.length && shortlist.length > 0} 
                        onChange={handleSelectAll} 
                      />
                    </th>
                    <th>Rank</th>
                    <th>Supplier ID</th>
                    <th>Company Name</th>
                    <th>Hub / Corridor</th>
                    <th>Overall Score</th>
                    <th>Technical (35%)</th>
                    <th>Quality (20%)</th>
                    <th>Commercial (20%)</th>
                    <th>Delivery (15%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlist.map((item, idx) => {
                    const isSelected = selectedSupplierIds.includes(item.supplierId);
                    const breakdown = item.scoringBreakdown?.dimensions || {};
                    return (
                      <tr key={item.supplierId} className={isSelected ? 'bg-[#182233]/40' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleSelectSupplier(item.supplierId)} 
                          />
                        </td>
                        <td className="font-mono font-bold text-slate-400">#{idx + 1}</td>
                        <td className="font-mono text-xs text-amber-400 font-bold">{item.supplierId}</td>
                        <td className="font-semibold text-slate-200">{item.companyName}</td>
                        <td className="text-slate-400 text-xs">{item.location}</td>
                        <td className="font-mono text-sm font-bold text-emerald-400">
                          {item.overallScore} <span className="text-[10px] text-slate-500">/ 100</span>
                        </td>
                        <td className="font-mono text-xs text-slate-300">{breakdown.technicalCapability?.score || 100}</td>
                        <td className="font-mono text-xs text-slate-300">{breakdown.qualityCertifications?.score || 100}</td>
                        <td className="font-mono text-xs text-slate-300">{breakdown.commercialCompetitiveness?.score || 100}</td>
                        <td className="font-mono text-xs text-slate-300">{breakdown.deliveryFeasibility?.score || 100}</td>
                        <td>
                          <span className="badge-verified">QUALIFIED</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: EXCLUDED SUPPLIERS TABLE */}
          {activeTab === 'excluded' && (
            <div className="rounded bg-[#0e141f] border border-[#1e293b] overflow-hidden">
              <table className="terminal-table">
                <thead>
                  <tr>
                    <th>Supplier ID</th>
                    <th>Company Name</th>
                    <th>Disqualification Rule</th>
                    <th>Disqualification Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {excluded.map((item) => (
                    <tr key={item.supplierId}>
                      <td className="font-mono text-xs text-rose-400 font-bold">{item.supplierId}</td>
                      <td className="font-semibold text-slate-200">{item.companyName}</td>
                      <td className="font-mono text-xs text-rose-300">
                        {(item.disqualifications || [])[0]?.rule || 'CAPABILITY_MISMATCH'}
                      </td>
                      <td className="text-xs text-slate-400">
                        {(item.disqualifications || [])[0]?.reason || 'Does not meet mandatory precision manufacturing tolerance or material requirement.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
