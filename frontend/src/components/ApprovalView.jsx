import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';
import api from '../../utils/axios.js';

export default function ApprovalView({ 
  approvals = [], 
  onRefreshApprovals, 
  onStartNegotiation 
}) {
  const [rejectModalProposal, setRejectModalProposal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleDecision = async (proposalId, proposalVersion, actionType, decision, reason = '') => {
    setIsProcessing(true);
    setFeedbackMsg('');
    try {
      const payload = {
        proposalId,
        proposalVersion: proposalVersion || 1,
        actionType: actionType || 'SHORTLIST_APPROVAL',
        decision,
        reason: reason || `Action ${decision.toLowerCase()} by authorized buyer.`
      };

      const { data } = await api.post('/api/approvals', payload);
      if (data.success) {
        setFeedbackMsg(`Decision successfully recorded: ${decision}`);
        setRejectModalProposal(null);
        setRejectReason('');
        if (onRefreshApprovals) onRefreshApprovals();
      }
    } catch (err) {
      setFeedbackMsg(err.response?.data?.error?.message || 'Failed to record approval decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Buyer Governance Gate & Human Authorization Ledger
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Strict two-tier human governance is required before binding commercial commitments or outbound supplier messages are dispatched.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Approvals Table */}
      <div className="p-5 rounded bg-[#0e141f] border border-[#1e293b] space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Durable Approval Records ({approvals.length})
        </h2>

        {approvals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-700 mb-2" />
            <p className="font-semibold text-slate-400">No approval decisions recorded in PostgreSQL.</p>
            <p className="mt-1">Run supplier matching and authorize a candidate shortlist to record a governance event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Approval ID</th>
                  <th>Proposal Ref</th>
                  <th>Action Type</th>
                  <th>Decision</th>
                  <th>Authorized Supplier(s)</th>
                  <th>Approver</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((appr) => {
                  const isApproved = appr.decision === 'APPROVED';
                  const topSupplier = (appr.selectedSupplierIds || [])[0] || 'SUP-IND-010';
                  return (
                    <tr key={appr.id}>
                      <td className="font-mono text-xs text-amber-400 font-bold">{appr.id}</td>
                      <td className="font-mono text-xs text-slate-300">{appr.proposalId} v{appr.proposalVersion}</td>
                      <td className="font-mono text-xs text-slate-300">{appr.actionType}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isApproved ? 'badge-verified' : 'badge-alert'
                        }`}>
                          {appr.decision}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-200">
                        {(appr.selectedSupplierIds || []).join(', ') || 'N/A'}
                      </td>
                      <td className="text-xs text-slate-400">
                        {typeof appr.approver === 'object' ? appr.approver.email : appr.approver || 'Lead Buyer'}
                      </td>
                      <td className="font-mono text-xs text-slate-500">
                        {new Date(appr.createdAt || appr.timestamp).toLocaleTimeString()}
                      </td>
                      <td>
                        {isApproved && (
                          <button
                            onClick={() => onStartNegotiation && onStartNegotiation(topSupplier, appr.proposalId)}
                            className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 flex items-center gap-1 transition-colors"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            Open Deal
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
