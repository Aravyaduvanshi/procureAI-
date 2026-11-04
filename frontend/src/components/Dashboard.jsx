import React from 'react';
import { 
  Building2, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  Info,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function Dashboard({ 
  stats, 
  setActiveTab, 
  recentActivity = [],
  onLoadSampleRequirement 
}) {
  const metricCards = [
    {
      title: 'Suppliers in Catalogue',
      value: stats.totalSuppliers || 20,
      subtext: 'Synthetic Indian manufacturing benchmark',
      icon: Building2,
      color: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
      tab: 'suppliers'
    },
    {
      title: 'Procurement Requirements',
      value: stats.totalRequirements || 0,
      subtext: 'Parsed engineering RFQ specifications',
      icon: FileText,
      color: 'from-purple-500/20 to-pink-500/10',
      iconColor: 'text-purple-400',
      tab: 'requirements'
    },
    {
      title: 'Matching Shortlists',
      value: stats.matchingRuns || 0,
      subtext: 'Deterministic 5-dimension scoring runs',
      icon: Cpu,
      color: 'from-cyan-500/20 to-teal-500/10',
      iconColor: 'text-cyan-400',
      tab: 'matching'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals || 0,
      subtext: 'Human approval gates awaiting review',
      icon: ShieldCheck,
      color: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
      tab: 'approvals'
    },
    {
      title: 'Active Negotiations',
      value: stats.activeNegotiations || 0,
      subtext: 'Stateful buyer-governed negotiations',
      icon: MessageSquare,
      color: 'from-emerald-500/20 to-green-500/10',
      iconColor: 'text-emerald-400',
      tab: 'negotiations'
    }
  ];

  return (
    <div className="space-y-8 py-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Autonomous Manufacturing Procurement Workflow
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AI-Assisted Precision Sourcing & Governed Negotiation
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            ProcureAI matches precision engineering requirements against Indian manufacturing suppliers using deterministic suitability scoring, multi-tier evidence validation, and stateful human-in-the-loop negotiation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('requirements')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              Upload RFQ Requirement
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLoadSampleRequirement}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Load Sample Vadodara RFQ
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-800 transition-all"
            >
              Browse 20 Synthetic Suppliers
            </button>
          </div>
        </div>
        {/* Glow backdrop decorative accent */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(card.tab)}
              className="glass-panel glass-panel-hover p-5 rounded-xl cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{card.title}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Process Stepper */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-4">End-to-End Procurement Lifecycle</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { step: '01', title: 'Upload & Parse RFQ', desc: 'Extracts technical processes, materials, quantity, and flags unspecified fields for confirmation.' },
            { step: '02', title: 'Hard Filtering', desc: 'Applies mandatory eligibility rules (processes, MOQ bounds, valid ISO certifications).' },
            { step: '03', title: 'Deterministic Rating', desc: 'Computes multi-dimensional suitability score (0-100) across technical, quality, commercial, and delivery.' },
            { step: '04', title: 'Buyer Approval Gate', desc: 'Durable human authorization required before creating negotiation plans or external drafts.' },
            { step: '05', title: 'Stateful Negotiation', desc: 'Develops bounded commercial offers, evaluates supplier counteroffers, and blocks unauthorized commits.' }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 relative">
              <span className="text-xs font-bold font-mono text-indigo-400">{item.step}</span>
              <h3 className="text-sm font-semibold text-slate-200 mt-1">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notice & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Synthetic Catalogue Notice */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 lg:col-span-1">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-3">
            <Info className="w-4 h-4" />
            Synthetic Benchmark Grounding
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The 20 suppliers loaded in this environment are realistic synthetic manufacturing profiles located across India (Vadodara, Pune, Rajkot, Ahmedabad, Peenya, Coimbatore, etc.).
          </p>
          <div className="mt-4 space-y-2 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Prices are supplier-declared estimates, not verified quotations.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>External email sending is safely disabled by default.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Hard eligibility logic strictly excludes non-qualifying vendors.</span>
            </div>
          </div>
        </div>

        {/* Live Recent Activity */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Recent Procurement Audit Log
            </h2>
            <span className="text-xs text-slate-500">Persisted Records</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No recent audit events yet. Upload a requirement document to begin the workflow.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {recentActivity.slice(0, 6).map((act, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <div>
                      <p className="font-semibold text-slate-200">{act.action?.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-400">Entity: {act.entityType} ({act.entityId})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">{act.actor}</span>
                    <p className="text-[10px] text-slate-500">{new Date(act.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
