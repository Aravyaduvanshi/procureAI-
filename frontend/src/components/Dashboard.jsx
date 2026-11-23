import React from 'react';
import { 
  Building2, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Radio,
  SlidersHorizontal,
  RefreshCw,
  Terminal,
  Activity
} from 'lucide-react';

export default function Dashboard({ 
  stats = {}, 
  setActiveTab, 
  recentActivity = [],
  onLoadSampleRequirement,
  requirements = []
}) {
  const metricCards = [
    {
      code: 'CATALOG_SIZE',
      title: 'Suppliers in Catalog',
      value: stats.totalSuppliers || 0,
      subtext: 'Master synthetic suppliers.json',
      icon: Building2,
      tab: 'suppliers',
      accent: 'border-l-2 border-l-amber-500'
    },
    {
      code: 'REQ_COUNT',
      title: 'Procurement Requirements',
      value: stats.totalRequirements || 0,
      subtext: 'Durable PostgreSQL requirements',
      icon: FileText,
      tab: 'requirements',
      accent: 'border-l-2 border-l-blue-500'
    },
    {
      code: 'MATCH_RUNS',
      title: 'Matching Shortlists',
      value: stats.matchingRuns || 0,
      subtext: 'Deterministic suitability runs',
      icon: Cpu,
      tab: 'matching',
      accent: 'border-l-2 border-l-cyan-500'
    },
    {
      code: 'GOVERNANCE_PENDING',
      title: 'Pending Approvals',
      value: stats.pendingApprovals || 0,
      subtext: 'Human approval gates',
      icon: ShieldCheck,
      tab: 'approvals',
      accent: 'border-l-2 border-l-emerald-500'
    },
    {
      code: 'ACTIVE_DEALS',
      title: 'Active Negotiations',
      value: stats.activeNegotiations || 0,
      subtext: 'Governed negotiation sessions',
      icon: SlidersHorizontal,
      tab: 'negotiations',
      accent: 'border-l-2 border-l-indigo-500'
    }
  ];

  return (
    <div className="space-y-6 py-6">
      {/* Top Operations Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.code}
              onClick={() => setActiveTab(card.tab)}
              className={`p-4 rounded bg-[#0e141f] border border-[#1e293b] hover:border-slate-600 cursor-pointer transition-colors ${card.accent}`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400">{card.code}</span>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-1">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Main Operations Split: Active Requirements & Action Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Requirements Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded bg-[#0e141f] border border-[#1e293b]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Active Procurement Requirements Ledger
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parsed engineering RFQs and their current matching / negotiation state
                </p>
              </div>

              <button
                onClick={() => setActiveTab('requirements')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors"
              >
                + New RFQ
              </button>
            </div>

            {requirements.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                <p className="font-semibold text-slate-400">No procurement requirements in database.</p>
                <p className="mt-1 text-slate-500">Upload an engineering specification PDF or load the sample RFQ.</p>
                <div className="mt-4">
                  <button
                    onClick={onLoadSampleRequirement}
                    className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    Load Vadodara CNC Sample RFQ
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="terminal-table">
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Component Specification</th>
                      <th>Quantity</th>
                      <th>Target Unit</th>
                      <th>Lead Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((req) => (
                      <tr key={req.id}>
                        <td className="font-mono text-xs text-amber-400">{req.id}</td>
                        <td className="font-medium text-slate-200 max-w-[220px] truncate" title={req.title}>
                          {req.title}
                        </td>
                        <td className="font-mono text-xs">{req.targetQuantity?.toLocaleString() || 5000} pcs</td>
                        <td className="font-mono text-xs text-slate-300">₹{req.targetUnitPrice || 480}</td>
                        <td className="font-mono text-xs">{req.requestedLeadTimeDays || 30}d</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            req.status === 'MATCHED' ? 'badge-verified' : 'badge-pending'
                          }`}>
                            {req.status || 'DRAFT'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setActiveTab('matching')}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
                          >
                            Match
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Event Telemetry Stream */}
        <div className="space-y-4">
          <div className="p-5 rounded bg-[#0e141f] border border-[#1e293b]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Real-Time Event Stream
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SSE LIVE
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-slate-600 text-xs font-mono">
                [WAITING_FOR_EVENTS]
                <p className="text-[11px] text-slate-500 mt-1">Actions in requirements, matching, or negotiations stream here in real time.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto font-mono text-[11px]">
                {recentActivity.map((act) => (
                  <div 
                    key={act.id} 
                    className="p-2 rounded bg-[#080d15] border border-slate-800/80 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400 font-bold">{act.action}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        ID: {act.entityId || 'system'}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-500 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
