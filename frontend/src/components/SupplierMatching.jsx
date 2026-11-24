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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8EDE7]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
              DETERMINISTIC SUITABILITY
            </span>
            <span className="w-8 h-px bg-[#E8EDE7]/20"></span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#E8EDE7] mt-1 flex items-center gap-2">
            Supplier Matching Engine
          </h1>
          <p className="text-xs text-[#929D92] mt-0.5">
            Evaluates 20 master suppliers against requirement criteria using 5-dimension deterministic scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeRequirement && (
            <button
              onClick={() => onRunMatching && onRunMatching(activeRequirement.id)}
              className="myca-btn-secondary px-3.5 py-2 text-xs font-mono flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#A8B99A]" /> Run Matching Engine
            </button>
          )}

          <div className="flex items-center border border-[#E8EDE7]/10 rounded-lg overflow-hidden font-mono text-xs">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-3.5 py-2 font-semibold transition-colors ${
                activeTab === 'recommended'
                  ? 'bg-[#A8B99A] text-[#0B100E]'
                  : 'bg-[#151D18] text-[#929D92] hover:text-[#E8EDE7]'
              }`}
            >
              Shortlist ({shortlist.length})
            </button>
            <button
              onClick={() => setActiveTab('excluded')}
              className={`px-3.5 py-2 font-semibold transition-colors ${
                activeTab === 'excluded'
                  ? 'bg-rose-950/80 text-rose-300 border-l border-rose-800'
                  : 'bg-[#151D18] text-[#929D92] hover:text-[#E8EDE7]'
              }`}
            >
              Excluded ({excluded.length})
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-[#A8B99A]/15 border border-[#A8B99A]/30 text-[#A8B99A] text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4 shrink-0 text-[#A8B99A]" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Matching Result Active Container */}
      {!matchingResult ? (
        <div className="p-12 text-center rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 text-[#929D92] text-xs">
          <Cpu className="w-10 h-10 mx-auto text-[#929D92]/40 mb-2" />
          <p className="font-semibold text-[#E8EDE7]">No matching run calculated yet.</p>
          <p className="mt-1">Select an active requirement and click "Run Matching Engine" to rank the 20 master suppliers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Executive Summary Bar */}
          <div className="p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#929D92]">Matching Run ID</span>
              <p className="font-mono text-sm font-bold text-[#D1B878]">{matchingResult.id}</p>
              <p className="text-[#929D92] mt-0.5">
                Evaluated: <strong>{matchingResult.totalEvaluated || 20}</strong> suppliers | Eligible: <strong className="text-[#A8B99A]">{matchingResult.eligibleCount || shortlist.length}</strong> | Excluded: <strong className="text-rose-400">{matchingResult.excludedCount || excluded.length}</strong>
              </p>
            </div>

            {shortlist.length > 0 && (
              <button
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                className="myca-btn-primary px-4 py-2 text-xs font-mono flex items-center gap-1.5 self-start md:self-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? 'Submitting to Gate...' : 'Authorize Shortlist in Governance Gate'}
              </button>
            )}
          </div>

          {/* TAB 1: RECOMMENDED SHORTLIST TABLE */}
          {activeTab === 'recommended' && (
            <div className="rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 overflow-hidden">
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
                      <tr key={item.supplierId} className={isSelected ? 'bg-[#1E2922]' : 'hover:bg-[#1E2922]'}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleSelectSupplier(item.supplierId)} 
                          />
                        </td>
                        <td className="font-mono font-bold text-[#929D92]">#{idx + 1}</td>
                        <td className="font-mono text-xs text-[#D1B878] font-bold">{item.supplierId}</td>
                        <td className="font-semibold text-[#E8EDE7]">{item.companyName}</td>
                        <td className="text-[#929D92] text-xs">{item.location}</td>
                        <td className="font-mono text-sm font-bold text-[#A8B99A]">
                          {item.overallScore} <span className="text-[10px] text-[#929D92]">/ 100</span>
                        </td>
                        <td className="font-mono text-xs text-[#E8EDE7]">{breakdown.technicalCapability?.score || 100}</td>
                        <td className="font-mono text-xs text-[#E8EDE7]">{breakdown.qualityCertifications?.score || 100}</td>
                        <td className="font-mono text-xs text-[#E8EDE7]">{breakdown.commercialCompetitiveness?.score || 100}</td>
                        <td className="font-mono text-xs text-[#E8EDE7]">{breakdown.deliveryFeasibility?.score || 100}</td>
                        <td>
                          <span className="myca-badge-qualified">QUALIFIED</span>
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
            <div className="rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 overflow-hidden">
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
                    <tr key={item.supplierId} className="hover:bg-[#1E2922]">
                      <td className="font-mono text-xs text-rose-400 font-bold">{item.supplierId}</td>
                      <td className="font-semibold text-[#E8EDE7]">{item.companyName}</td>
                      <td className="font-mono text-xs text-rose-300">
                        {(item.disqualifications || [])[0]?.rule || 'CAPABILITY_MISMATCH'}
                      </td>
                      <td className="text-xs text-[#929D92]">
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
