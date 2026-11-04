import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck,
  MessageSquare
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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          Buyer Approval & Human Governance Gate
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Durable human approval records are strictly required before initiating external communication or binding commercial commitments.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Approvals Table / Card List */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Approval Records & Audit History ({approvals.length})
        </h2>

        {approvals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-700 mb-2" />
            No approval records found. Match suppliers and approve a shortlist to populate this gate.
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((appr) => {
              const isApproved = appr.decision === 'APPROVED';
              return (
                <div
                  key={appr.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{appr.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {appr.decision}
                      </span>
                      <span className="font-mono text-slate-400">v{appr.proposalVersion}</span>
                    </div>

                    <p className="text-sm font-semibold text-white">
                      Action: {appr.actionType?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-slate-400">
                      Proposal Reference: <span className="text-slate-300 font-mono">{appr.proposalId}</span>
                    </p>
                    {appr.reason && (
                      <p className="text-slate-300 italic">"{appr.reason}"</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>Approver: {appr.approver?.name || appr.approver?.email || appr.approver}</span>
                      <span>•</span>
                      <span>{new Date(appr.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {isApproved && onStartNegotiation && (
                      <button
                        onClick={() => onStartNegotiation(appr)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Launch Negotiation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-slate-700">
            <h3 className="text-base font-bold text-white mb-2">Reject Proposal</h3>
            <p className="text-xs text-slate-300 mb-4">
              Please document the reason for rejecting proposal <strong className="text-white">{rejectModalProposal.proposalId}</strong>:
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Excessive unit price or lead time variance requires alternative sourcing."
              className="w-full h-24 p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectModalProposal(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(rejectModalProposal.proposalId, rejectModalProposal.proposalVersion, rejectModalProposal.actionType, 'REJECTED', rejectReason)}
                disabled={!rejectReason || isProcessing}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
