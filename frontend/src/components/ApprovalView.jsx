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
      <div className="pb-2 border-b border-[#E8EDE7]/10">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
            HUMAN-IN-THE-LOOP CONTROL
          </span>
          <span className="w-8 h-px bg-[#E8EDE7]/20"></span>
        </div>
        <h1 className="font-serif text-3xl font-normal text-[#E8EDE7] mt-1 flex items-center gap-2">
          Buyer Governance Gate & Human Authorization Ledger
        </h1>
        <p className="text-xs text-[#929D92] mt-0.5">
          Strict two-tier human governance is required before binding commercial commitments or outbound supplier messages are dispatched.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-lg bg-[#A8B99A]/15 border border-[#A8B99A]/30 text-[#A8B99A] text-xs flex items-center gap-2 font-mono">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Approvals Table */}
      <div className="p-5 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#E8EDE7] flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-[#A8B99A]" />
          Durable Approval Records ({approvals.length})
        </h2>

        {approvals.length === 0 ? (
          <div className="py-12 text-center text-[#929D92] text-xs">
            <ShieldCheck className="w-8 h-8 mx-auto text-[#929D92]/40 mb-2" />
            <p className="font-semibold text-[#E8EDE7]">No approval decisions recorded in PostgreSQL.</p>
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
                    <tr key={appr.id} className="hover:bg-[#1E2922]">
                      <td className="font-mono text-xs text-[#D1B878] font-bold">{appr.id}</td>
                      <td className="font-mono text-xs text-[#E8EDE7]">{appr.proposalId} v{appr.proposalVersion}</td>
                      <td className="font-mono text-xs text-[#E8EDE7]">{appr.actionType}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isApproved ? 'myca-badge-qualified' : 'myca-badge-review'
                        }`}>
                          {appr.decision}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#E8EDE7]">
                        {(appr.selectedSupplierIds || []).join(', ') || 'N/A'}
                      </td>
                      <td className="text-xs text-[#929D92]">
                        {typeof appr.approver === 'object' ? appr.approver.email : appr.approver || 'Lead Buyer'}
                      </td>
                      <td className="font-mono text-xs text-[#929D92]/60">
                        {new Date(appr.createdAt || appr.timestamp).toLocaleTimeString()}
                      </td>
                      <td>
                        {isApproved && (
                          <button
                            onClick={() => onStartNegotiation && onStartNegotiation(topSupplier, appr.proposalId)}
                            className="myca-btn-primary px-3 py-1 text-[11px] font-mono flex items-center gap-1"
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
