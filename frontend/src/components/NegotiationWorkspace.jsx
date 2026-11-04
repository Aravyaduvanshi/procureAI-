import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Check, 
  Edit3, 
  Layers, 
  Lock,
  ArrowRight
} from 'lucide-react';
import api from '../../utils/axios.js';

export default function NegotiationWorkspace({ 
  sessions = [], 
  activeSession, 
  onSelectSession, 
  onRefreshSession 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [customDraftBody, setCustomDraftBody] = useState('');
  const [counterofferForm, setCounterofferForm] = useState({
    proposedUnitPrice: '',
    proposedLeadTimeDays: '',
    notes: ''
  });

  const session = activeSession || (sessions.length > 0 ? sessions[0] : null);

  const handleGenerateStrategy = async () => {
    if (!session) return;
    setIsGenerating(true);
    setFeedback('');
    try {
      const { data } = await api.post(`/api/negotiations/${session.id}/generate-strategy`);
      if (data.success) {
        setFeedback('AI Strategy and Opening Draft generated.');
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to generate strategy.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveStrategy = async () => {
    if (!session) return;
    try {
      const { data } = await api.post(`/api/negotiations/${session.id}/approve-strategy`, {
        reason: 'Commercial parameters confirmed by Lead Buyer'
      });
      if (data.success) {
        setFeedback('Strategy approved. Message draft is now ready for review.');
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to approve strategy.');
    }
  };

  const handleApproveDraft = async () => {
    if (!session) return;
    try {
      const { data } = await api.post(`/api/negotiations/${session.id}/approve-draft`, {
        customizedMessage: customDraftBody ? { body: customDraftBody } : null,
        reason: 'Outbound supplier message text verified and authorized'
      });
      if (data.success) {
        setFeedback('Message draft authorized! Ready for dispatch.');
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to approve message draft.');
    }
  };

  const handleSendMessage = async () => {
    if (!session) return;
    setIsSending(true);
    setFeedback('');
    try {
      const { data } = await api.post(`/api/communications/send/${session.id}`, {
        customizedBody: customDraftBody || session.messageDraft?.body
      });
      if (data.success) {
        setFeedback(`Message dispatched! [${data.dispatchDetails?.mode}] Status updated to WAITING_FOR_SUPPLIER.`);
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRecordCounteroffer = async () => {
    if (!session || !counterofferForm.proposedUnitPrice) return;
    try {
      const { data } = await api.post(`/api/negotiations/${session.id}/counteroffer`, {
        proposedUnitPrice: counterofferForm.proposedUnitPrice,
        proposedLeadTimeDays: counterofferForm.proposedLeadTimeDays || session.requirementLeadTimeDays,
        notes: counterofferForm.notes
      });
      if (data.success) {
        setFeedback(`Counteroffer ₹${counterofferForm.proposedUnitPrice} recorded. Evaluation: ${data.evaluation?.outcomeVerdict}`);
        setCounterofferForm({ proposedUnitPrice: '', proposedLeadTimeDays: '', notes: '' });
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to record counteroffer.');
    }
  };

  const handleCompleteNegotiation = async () => {
    if (!session) return;
    try {
      const finalPrice = session.latestCounteroffer?.proposedUnitPrice || session.commercialParameters?.proposedOpeningOffer;
      const { data } = await api.post(`/api/negotiations/${session.id}/complete`, {
        finalAgreedPrice: finalPrice,
        remarks: 'Agreed commercial terms finalized and purchase authorization issued.'
      });
      if (data.success) {
        setFeedback('Negotiation completed successfully! Purchase authorization recorded.');
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to complete negotiation.');
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          Autonomous Negotiation Workspace
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Stateful, human-governed negotiations with commercial reservation limits, AI strategy formulation, and approval gates.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Sessions List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Negotiation Sessions</h2>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500">No active negotiation sessions.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    session?.id === s.id
                      ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold truncate">{s.supplierName}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.requirementTitle}</p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="font-mono text-indigo-300">{s.status}</span>
                    <span className="text-slate-400">Target: ₹{s.commercialParameters?.buyerTargetPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Columns: Active Session Detail */}
        <div className="lg:col-span-3">
          {session ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Session Header & State Stepper */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="font-mono text-xs text-indigo-400 font-bold">{session.id}</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{session.supplierName}</h2>
                  <p className="text-xs text-slate-400">
                    Component: <strong className="text-slate-200">{session.requirementTitle}</strong> ({session.requirementQuantity} pcs)
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
                    session.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                    session.status === 'APPROVED_TO_SEND' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                    session.status === 'WAITING_FOR_SUPPLIER' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                    'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {session.status?.replace(/_/g, ' ')}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Recipient: {session.supplierEmail}</p>
                </div>
              </div>

              {/* Commercial Parameters Bounded Safeguards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Supplier Estimate</span>
                  <p className="text-sm font-bold text-slate-300 mt-0.5">₹{session.commercialParameters?.supplierIndicativePrice || 'N/A'}</p>
                  <span className="text-[9px] text-slate-500">Declared in Catalogue</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Buyer Target</span>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{session.commercialParameters?.buyerTargetPrice || 480}</p>
                  <span className="text-[9px] text-slate-500">Expected baseline</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Opening Offer Anchor</span>
                  <p className="text-sm font-bold text-indigo-300 mt-0.5">₹{session.commercialParameters?.proposedOpeningOffer || 460}</p>
                  <span className="text-[9px] text-slate-500">Draft opening anchor</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-rose-900/40 bg-rose-950/10">
                  <span className="text-[10px] uppercase font-bold text-rose-400">Reservation Cap</span>
                  <p className="text-sm font-bold text-rose-300 mt-0.5">₹{session.commercialParameters?.authorizedReservationLimit || 500}</p>
                  <span className="text-[9px] text-rose-400/80">Strict ceiling</span>
                </div>
              </div>

              {/* Strategy Formulation Section */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Negotiation Strategy & Commercial Plan
                  </span>
                  {!session.strategy && (
                    <button
                      onClick={handleGenerateStrategy}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                      {isGenerating ? 'Synthesizing...' : 'Generate Negotiation Plan'}
                    </button>
                  )}
                </div>

                {session.strategy ? (
                  <div className="space-y-2">
                    <p className="text-slate-300 leading-relaxed">
                      Tactical Plan: <strong>{session.strategy.strategyType}</strong> objective against {session.supplierName}.
                    </p>
                    <ul className="space-y-1 text-slate-400">
                      {(session.strategy.negotiationTactics || []).map((tactic, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{tactic}</span>
                        </li>
                      ))}
                    </ul>

                    {session.status === 'AWAITING_STRATEGY_APPROVAL' && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-amber-400 font-semibold">Buyer confirmation required for proposed tactics.</span>
                        <button
                          onClick={handleApproveStrategy}
                          className="px-4 py-1.5 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Approve Strategy & Prepare Message Draft
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">Strategy not yet generated. Click button above to synthesize AI commercial strategy.</p>
                )}
              </div>

              {/* Outbound Message Draft & Dispatch Gate */}
              {session.messageDraft && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-indigo-400" />
                      Outbound Message Draft (Human Approval Required)
                    </span>
                    <span className="text-[10px] text-slate-500">Provider: Mock / Safe Draft Mode</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Subject:</span>
                    <input
                      type="text"
                      readOnly
                      value={session.messageDraft.subject}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Message Body:</span>
                    <textarea
                      value={customDraftBody || session.messageDraft.body}
                      onChange={(e) => setCustomDraftBody(e.target.value)}
                      rows={6}
                      className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Gatekeeper Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span className="text-slate-400 text-[11px]">
                        Status: <strong className="text-white">{session.status}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === 'READY_FOR_MESSAGE_APPROVAL' && (
                        <button
                          onClick={handleApproveDraft}
                          className="px-4 py-2 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                        >
                          Approve Message for Sending
                        </button>
                      )}

                      {session.status === 'APPROVED_TO_SEND' && (
                        <button
                          onClick={handleSendMessage}
                          disabled={isSending}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isSending ? 'Dispatching...' : 'Dispatch Approved Message'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Counteroffer Evaluation & Final Agreement */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Supplier Counteroffer Evaluation & Settlement
                </h3>

                {session.latestCounteroffer ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Received Counteroffer:</span>
                      <span className="text-sm font-bold text-white">₹{session.latestCounteroffer.proposedUnitPrice} / unit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Verdict:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        session.latestCounteroffer.outcomeVerdict === 'HIGHLY_FAVORABLE' || session.latestCounteroffer.outcomeVerdict === 'ACCEPTABLE_WITH_CONCESSION'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {session.latestCounteroffer.outcomeVerdict}
                      </span>
                    </div>
                    <p className="text-slate-300 pt-1 leading-relaxed">
                      {session.latestCounteroffer.rationale}
                    </p>

                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={handleCompleteNegotiation}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Authorize & Finalize Agreement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-400">
                      Simulate or record an inbound supplier counteroffer to test the policy evaluation engine:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Quoted Price (e.g. 475)"
                        value={counterofferForm.proposedUnitPrice}
                        onChange={(e) => setCounterofferForm({ ...counterofferForm, proposedUnitPrice: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Lead Time Days (e.g. 28)"
                        value={counterofferForm.proposedLeadTimeDays}
                        onChange={(e) => setCounterofferForm({ ...counterofferForm, proposedLeadTimeDays: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                      />
                      <button
                        onClick={handleRecordCounteroffer}
                        disabled={!counterofferForm.proposedUnitPrice}
                        className="px-3 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs"
                      >
                        Evaluate Counteroffer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-700 mb-2" />
              <p className="text-xs">No active negotiation session selected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
