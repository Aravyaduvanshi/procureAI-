import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  Mail, 
  User, 
  SlidersHorizontal,
  DollarSign,
  TrendingDown,
  Award,
  FileCheck,
  ChevronRight,
  Inbox,
  AlertCircle
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
    proposedUnitPrice: '450',
    proposedLeadTimeDays: '28',
    notes: 'We agree to supply at ₹450 per unit with committed 28-day delivery for 5,000 pcs.'
  });

  const session = activeSession || (sessions.length > 0 ? sessions[0] : null);

  const handleGenerateStrategy = async () => {
    if (!session) return;
    setIsGenerating(true);
    setFeedback('');
    try {
      const { data } = await api.post(`/api/negotiations/${session.id}/generate-strategy`);
      if (data.success) {
        setFeedback('AI Strategy and Opening Draft formulated by Groq LLM.');
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
        reason: 'Commercial parameters confirmed by Authorized Buyer'
      });
      if (data.success) {
        setFeedback('Stage 1 Gate Approved: Commercial limits confirmed. Review outbound message draft.');
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
        setFeedback('Stage 2 Gate Approved: Message authorized for outbound transmission.');
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
        setFeedback('Message successfully dispatched via email provider! Awaiting supplier response.');
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to dispatch email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitCounteroffer = async (e) => {
    e.preventDefault();
    if (!session || !counterofferForm.proposedUnitPrice) return;
    setFeedback('');
    try {
      const { data } = await api.post(`/api/negotiations/${session.id}/counteroffer`, {
        proposedUnitPrice: Number(counterofferForm.proposedUnitPrice),
        proposedLeadTimeDays: Number(counterofferForm.proposedLeadTimeDays || 28),
        notes: counterofferForm.notes
      });
      if (data.success) {
        setFeedback(`Supplier counteroffer ₹${counterofferForm.proposedUnitPrice} received and evaluated: ${data.evaluation?.outcomeVerdict}`);
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to record supplier counteroffer.');
    }
  };

  const handleCompleteNegotiation = async () => {
    if (!session) return;
    try {
      const finalPrice = session.latestCounteroffer?.proposedUnitPrice || session.commercialParameters?.proposedOpeningOffer || 450;
      const { data } = await api.post(`/api/negotiations/${session.id}/complete`, {
        finalAgreedPrice: Number(finalPrice)
      });
      if (data.success) {
        setFeedback(`Negotiation completed successfully! Terms locked at ₹${finalPrice}.`);
        if (onRefreshSession) onRefreshSession(session.id);
      }
    } catch (err) {
      setFeedback(err.response?.data?.error?.message || 'Failed to finalize negotiation.');
    }
  };

  // Timeline Stepper Data
  const getTimelineSteps = () => {
    const s = session?.status || 'DRAFT';
    return [
      { id: 'draft', label: '1. Session Init', active: true, completed: s !== 'DRAFT' },
      { id: 'strategy', label: '2. Commercial Strategy', active: s === 'AWAITING_STRATEGY_APPROVAL', completed: ['READY_FOR_MESSAGE_APPROVAL', 'APPROVED_TO_SEND', 'MESSAGE_SENT', 'WAITING_FOR_SUPPLIER', 'COUNTEROFFER_RECEIVED', 'AGREED_SUBJECT_TO_FINAL_APPROVAL', 'COMPLETED'].includes(s) },
      { id: 'draft_msg', label: '3. Message Gate', active: s === 'READY_FOR_MESSAGE_APPROVAL', completed: ['APPROVED_TO_SEND', 'MESSAGE_SENT', 'WAITING_FOR_SUPPLIER', 'COUNTEROFFER_RECEIVED', 'AGREED_SUBJECT_TO_FINAL_APPROVAL', 'COMPLETED'].includes(s) },
      { id: 'dispatch', label: '4. Outbound Dispatch', active: s === 'APPROVED_TO_SEND', completed: ['MESSAGE_SENT', 'WAITING_FOR_SUPPLIER', 'COUNTEROFFER_RECEIVED', 'AGREED_SUBJECT_TO_FINAL_APPROVAL', 'COMPLETED'].includes(s) },
      { id: 'inbound', label: '5. Supplier Counter', active: s === 'WAITING_FOR_SUPPLIER', completed: ['COUNTEROFFER_RECEIVED', 'AGREED_SUBJECT_TO_FINAL_APPROVAL', 'COMPLETED'].includes(s) },
      { id: 'complete', label: '6. Settlement', active: s === 'AGREED_SUBJECT_TO_FINAL_APPROVAL', completed: s === 'COMPLETED' },
    ];
  };

  const steps = getTimelineSteps();

  return (
    <div className="space-y-6 py-6">
      {/* Header and Sessions Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            Commercial Negotiation Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Governed commercial deal workspace. Deterministic policy controls financial caps; LLM assists communication.
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 uppercase">Active Session:</span>
            <select
              value={session?.id || ''}
              onChange={(e) => {
                const found = sessions.find(s => s.id === e.target.value);
                if (found) onSelectSession(found);
              }}
              className="bg-[#0e141f] border border-[#1e293b] text-amber-400 font-bold rounded px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.supplierName} ({s.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3 rounded bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {!session ? (
        <div className="p-12 text-center rounded bg-[#0e141f] border border-[#1e293b] text-slate-500 text-xs">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-slate-700 mb-2" />
          <p className="font-semibold text-slate-400">No active negotiation session.</p>
          <p className="mt-1">Approve a supplier shortlist in the Governance Gate tab to initialize a commercial deal session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Session Progress Bar */}
          <div className="p-3.5 rounded bg-[#0e141f] border border-[#1e293b] flex items-center justify-between overflow-x-auto text-xs font-mono">
            <div className="flex items-center gap-3 shrink-0">
              {steps.map((st, i) => (
                <React.Fragment key={st.id}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      st.completed 
                        ? 'bg-emerald-500 text-slate-950' 
                        : st.active 
                        ? 'bg-amber-500 text-slate-950 animate-pulse' 
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {st.completed ? '✓' : i + 1}
                    </span>
                    <span className={`${st.active ? 'text-amber-400 font-bold' : st.completed ? 'text-slate-200' : 'text-slate-500'}`}>
                      {st.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && <span className="text-slate-700">→</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="shrink-0 ml-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                session.status === 'COMPLETED' ? 'badge-verified' : 'badge-pending'
              }`}>
                STATUS: {session.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* 3-COLUMN WORKSPACE: LEFT (Profile) | CENTER (Timeline & Actions) | RIGHT (Commercial Intelligence) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: SUPPLIER PROFILE & AUDITED RATING (3 Cols) */}
            <div className="lg:col-span-3 space-y-4 text-xs">
              <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b] space-y-3">
                <span className="font-mono text-[10px] uppercase text-slate-500 font-bold block">
                  Supplier Commercial Identity
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">{session.supplierName}</h3>
                  <p className="font-mono text-[11px] text-amber-400 mt-0.5">{session.supplierId}</p>
                  <p className="text-slate-400 text-[11px] mt-1">{session.supplierEmail}</p>
                </div>

                <div className="pt-2 border-t border-[#1e293b] space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Person:</span>
                    <span className="text-slate-300">
                      {typeof session.contactPerson === 'object' ? session.contactPerson.name : session.contactPerson || 'Sales Team'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Benchmark Rating:</span>
                    <span className="text-emerald-400 font-bold">
                      {session.matchSnapshot?.overallScore ? `${session.matchSnapshot.overallScore}/100` : '99.5/100'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Evidence Status:</span>
                    <span className="badge-verified">AUDITED</span>
                  </div>
                </div>
              </div>

              {/* Requirement Context */}
              <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b] space-y-2 font-mono text-xs">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">
                  Component RFQ Scope
                </span>
                <p className="font-bold text-slate-200 text-xs">{session.requirementTitle}</p>
                <div className="pt-2 border-t border-[#1e293b] space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch Quantity:</span>
                    <span className="text-slate-200">{session.requirementQuantity?.toLocaleString() || 5000} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lead Time Cap:</span>
                    <span className="text-slate-200">{session.requirementLeadTimeDays || 30} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Objective:</span>
                    <span className="text-amber-400 font-semibold">{session.buyerObjective || 'BALANCED'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: TIMELINE ACTIONS & NEGOTIATION FEED (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Chronological Action & Timeline Center */}
              <div className="p-5 rounded bg-[#0e141f] border border-[#1e293b] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Deal History & Chronological Timeline
                  </h2>
                  <span className="font-mono text-[10px] text-slate-500">Round {session.currentRound || 1} of 4</span>
                </div>

                {/* Messages & Actions Timeline */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* Step 1: Draft or Sent Outbound Message */}
                  {session.messageDraft && (
                    <div className="p-3.5 rounded bg-[#080d15] border border-blue-900/40 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                          <Send className="w-3 h-3" /> [BUYER OUTBOUND] — Opening Commercial Offer
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {session.messageApproval ? 'AUTHORIZED' : 'DRAFT'}
                        </span>
                      </div>
                      <p className="font-semibold text-white text-xs">{session.messageDraft.subject}</p>
                      <p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed bg-[#05080c] p-2.5 rounded border border-slate-900">
                        {session.messageDraft.body}
                      </p>
                    </div>
                  )}

                  {/* Step 2: Supplier Inbound Counteroffers */}
                  {(session.counteroffers || []).map((co, idx) => (
                    <div key={idx} className="p-3.5 rounded bg-[#080d15] border border-amber-900/40 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                          <Inbox className="w-3 h-3" /> [SUPPLIER COUNTEROFFER #{idx + 1}]
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          ₹{co.counterPrice || co.proposedUnitPrice} / unit
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs">
                        Supplier proposal: ₹{co.counterPrice || co.proposedUnitPrice} with {co.proposedLeadTimeDays || 28} days delivery window.
                      </p>
                      <div className="p-2 rounded bg-[#0c1420] border border-cyan-900/40 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-cyan-400">System Evaluation: <strong>{co.outcomeVerdict}</strong></span>
                        <span className="text-slate-400">{co.recommendedNextAction}</span>
                      </div>
                    </div>
                  ))}

                  {/* Step 3: Final Completed Settlement */}
                  {session.finalOutcome && (
                    <div className="p-4 rounded bg-[#07130e] border border-emerald-800 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <Award className="w-4 h-4 text-emerald-400" /> Commercial Agreement Finalized
                        </span>
                        <span className="badge-verified">LOCKED</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-950 text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Agreed Price</span>
                          <span className="text-sm font-bold text-emerald-400">₹{session.finalOutcome.agreedUnitPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Total Net Savings</span>
                          <span className="text-sm font-bold text-emerald-400">₹{session.finalOutcome.totalSavings?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Cost Reduction</span>
                          <span className="text-sm font-bold text-emerald-400">{session.finalOutcome.savingsPercent}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Command Controls */}
                <div className="pt-3 border-t border-[#1e293b] space-y-3 text-xs font-mono">
                  {/* Step A: Generate Strategy */}
                  {session.status === 'DRAFT' && (
                    <button
                      onClick={handleGenerateStrategy}
                      disabled={isGenerating}
                      className="w-full py-2.5 rounded font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isGenerating ? 'Computing Strategy & Calling LLM...' : 'Generate Negotiation Strategy & LLM Draft'}
                    </button>
                  )}

                  {/* Step B: Approve Strategy */}
                  {session.status === 'AWAITING_STRATEGY_APPROVAL' && (
                    <button
                      onClick={handleApproveStrategy}
                      className="w-full py-2.5 rounded font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" /> Authorize Commercial Strategy (Gate 1)
                    </button>
                  )}

                  {/* Step C: Approve Draft */}
                  {session.status === 'READY_FOR_MESSAGE_APPROVAL' && (
                    <button
                      onClick={handleApproveDraft}
                      className="w-full py-2.5 rounded font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileCheck className="w-4 h-4" /> Authorize Message Draft for Send (Gate 2)
                    </button>
                  )}

                  {/* Step D: Send Email */}
                  {session.status === 'APPROVED_TO_SEND' && (
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending}
                      className="w-full py-2.5 rounded font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-4 h-4" /> {isSending ? 'Transmitting via Provider...' : 'Dispatch Message to Supplier'}
                    </button>
                  )}

                  {/* Step E: Ingest Counteroffer */}
                  {['WAITING_FOR_SUPPLIER', 'COUNTEROFFER_RECEIVED'].includes(session.status) && (
                    <form onSubmit={handleSubmitCounteroffer} className="p-3 rounded bg-[#080d15] border border-[#1e293b] space-y-2">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">
                        Record Inbound Supplier Response / Counteroffer
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Quoted Price (₹/pc)</label>
                          <input
                            type="number"
                            value={counterofferForm.proposedUnitPrice}
                            onChange={(e) => setCounterofferForm({ ...counterofferForm, proposedUnitPrice: e.target.value })}
                            className="w-full px-2 py-1 rounded bg-[#0b111a] border border-[#1e293b] text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Committed Lead Time (Days)</label>
                          <input
                            type="number"
                            value={counterofferForm.proposedLeadTimeDays}
                            onChange={(e) => setCounterofferForm({ ...counterofferForm, proposedLeadTimeDays: e.target.value })}
                            className="w-full px-2 py-1 rounded bg-[#0b111a] border border-[#1e293b] text-white font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded font-semibold bg-[#162030] hover:bg-slate-700 text-amber-400 border border-slate-700 mt-2"
                      >
                        Ingest Counteroffer & Run Policy Evaluation
                      </button>
                    </form>
                  )}

                  {/* Step F: Complete Negotiation */}
                  {session.status === 'AGREED_SUBJECT_TO_FINAL_APPROVAL' && (
                    <button
                      onClick={handleCompleteNegotiation}
                      className="w-full py-2.5 rounded font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Award className="w-4 h-4" /> Authorize Final Settlement & Lock Deal
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: COMMERCIAL INTELLIGENCE & TELEMETRY (3 Cols) */}
            <div className="lg:col-span-3 space-y-4 text-xs font-mono">
              <div className="p-4 rounded bg-[#0e141f] border border-[#1e293b] space-y-3">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">
                  Commercial Telemetry & Safeguards
                </span>

                <div className="space-y-2">
                  <div className="p-2.5 rounded bg-[#080d15] border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 uppercase block">Buyer Target Price</span>
                    <span className="text-base font-bold text-emerald-400">
                      ₹{session.commercialParameters?.buyerTargetPrice || 480}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#080d15] border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 uppercase block">Supplier Indicative Base</span>
                    <span className="text-sm font-semibold text-slate-300">
                      ₹{session.commercialParameters?.supplierIndicativePrice || 455}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#080d15] border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 uppercase block">Proposed Opening Offer</span>
                    <span className="text-sm font-bold text-amber-400">
                      ₹{session.commercialParameters?.proposedOpeningOffer || 461}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#080d15] border border-[#1e293b]">
                    <span className="text-[10px] text-slate-500 uppercase block">Authorized Reservation Limit</span>
                    <span className="text-sm font-bold text-rose-400">
                      ₹{session.commercialParameters?.authorizedReservationLimit || 504}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Strict policy ceiling</span>
                  </div>
                </div>

                {/* Savings Calculator */}
                <div className="pt-3 border-t border-[#1e293b] space-y-1 text-[11px]">
                  <span className="text-[10px] uppercase text-cyan-400 font-bold block">Financial Variance</span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch Quantity:</span>
                    <span className="text-slate-300">{session.requirementQuantity || 5000} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Baseline Commitment:</span>
                    <span className="text-slate-300">
                      ₹{((session.requirementQuantity || 5000) * (session.commercialParameters?.buyerTargetPrice || 480)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
