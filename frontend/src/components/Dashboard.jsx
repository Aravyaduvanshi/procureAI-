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
  Activity,
  Layers,
  Sparkles
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
      subtext: 'Verified manufacturing facilities',
      icon: Building2,
      tab: 'suppliers',
      accent: 'border-l-2 border-l-[#A8B99A]'
    },
    {
      code: 'REQ_COUNT',
      title: 'Procurement Requirements',
      value: stats.totalRequirements || 0,
      subtext: 'Durable PostgreSQL requirements',
      icon: FileText,
      tab: 'requirements',
      accent: 'border-l-2 border-l-[#D1B878]'
    },
    {
      code: 'MATCH_RUNS',
      title: 'Suitability Shortlists',
      value: stats.matchingRuns || 0,
      subtext: 'Deterministic suitability scores',
      icon: Cpu,
      tab: 'matching',
      accent: 'border-l-2 border-l-[#A8B99A]'
    },
    {
      code: 'GOVERNANCE_PENDING',
      title: 'Pending Approvals',
      value: stats.pendingApprovals || 0,
      subtext: 'Human-in-the-loop gates',
      icon: ShieldCheck,
      tab: 'approvals',
      accent: 'border-l-2 border-l-amber-500'
    },
    {
      code: 'ACTIVE_DEALS',
      title: 'Active Negotiations',
      value: stats.activeNegotiations || 0,
      subtext: 'LLM strategy sessions',
      icon: SlidersHorizontal,
      tab: 'negotiations',
      accent: 'border-l-2 border-l-[#D1B878]'
    }
  ];

  return (
    <div className="space-y-6 py-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8EDE7]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
              MYCA OPERATIONAL CORE
            </span>
            <span className="w-8 h-px bg-[#E8EDE7]/20"></span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#E8EDE7] mt-1">
            Procurement Overview & Active Filaments
          </h1>
          <p className="text-xs text-[#929D92] mt-0.5">
            Monitor verified suppliers, requirement specifications, shortlists, and human-governed negotiations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requirements')}
            className="myca-btn-primary px-4 py-2 text-xs"
          >
            + New Requirement
          </button>
        </div>
      </div>

      {/* Top Operations Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.code}
              onClick={() => setActiveTab(card.tab)}
              className={`p-4 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10 hover:border-[#A8B99A]/40 cursor-pointer transition-colors ${card.accent}`}
            >
              <div className="flex items-center justify-between text-[#929D92] text-xs mb-1">
                <span className="font-mono text-[10px] tracking-wider uppercase text-[#929D92]">{card.code}</span>
                <Icon className="w-3.5 h-3.5 text-[#A8B99A]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#E8EDE7] mt-1">
                {card.value}
              </div>
              <p className="text-[11px] text-[#929D92] truncate mt-1">{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* Main Operations Split: Active Requirements & Action Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Requirements Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EDE7]/10 mb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#E8EDE7] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#A8B99A]" />
                  Active Procurement Requirements Ledger
                </h2>
                <p className="text-xs text-[#929D92] mt-0.5">
                  Parsed engineering RFQs and their current matching / negotiation state
                </p>
              </div>

              <button
                onClick={() => setActiveTab('requirements')}
                className="myca-btn-secondary px-3 py-1.5 text-xs font-mono"
              >
                + New RFQ
              </button>
            </div>

            {requirements.length === 0 ? (
              <div className="py-12 text-center text-[#929D92] text-xs">
                <FileText className="w-8 h-8 mx-auto text-[#929D92]/40 mb-2" />
                <p className="font-medium text-[#E8EDE7]">No procurement requirements in database.</p>
                <p className="mt-1 text-[#929D92]">Upload an engineering specification PDF or load the sample RFQ.</p>
                <div className="mt-4">
                  <button
                    onClick={onLoadSampleRequirement}
                    className="myca-btn-secondary px-4 py-2 text-xs font-mono font-medium"
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
                        <td className="font-mono text-xs text-[#D1B878] font-semibold">{req.id}</td>
                        <td className="font-medium text-[#E8EDE7] max-w-[220px] truncate" title={req.title}>
                          {req.title}
                        </td>
                        <td className="font-mono text-xs">{req.targetQuantity?.toLocaleString() || 5000} pcs</td>
                        <td className="font-mono text-xs text-[#E8EDE7]">₹{req.targetUnitPrice || 480}</td>
                        <td className="font-mono text-xs">{req.requestedLeadTimeDays || 30}d</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            req.status === 'MATCHED' ? 'myca-badge-qualified' : 'myca-badge-review'
                          }`}>
                            {req.status || 'DRAFT'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setActiveTab('matching')}
                            className="text-xs text-[#A8B99A] hover:text-white font-mono font-semibold underline"
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
          <div className="p-5 rounded-lg bg-[#151D18] border border-[#E8EDE7]/10">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EDE7]/10 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E8EDE7] flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#A8B99A]" />
                Real-Time Event Stream
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#A8B99A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8B99A] animate-pulse"></span>
                SSE LIVE
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-[#929D92] text-xs font-mono">
                [WAITING_FOR_EVENTS]
                <p className="text-[11px] text-[#929D92]/70 mt-1">Actions in requirements, matching, or negotiations stream here in real time.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto font-mono text-[11px]">
                {recentActivity.map((act) => (
                  <div 
                    key={act.id} 
                    className="p-2.5 rounded bg-[#0B100E] border border-[#E8EDE7]/5 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#A8B99A] font-bold">{act.action}</span>
                      </div>
                      <p className="text-[10px] text-[#929D92] mt-0.5 truncate max-w-[200px]">
                        ID: {act.entityId || 'system'}
                      </p>
                    </div>
                    <span className="text-[9px] text-[#929D92]/60 shrink-0">
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
