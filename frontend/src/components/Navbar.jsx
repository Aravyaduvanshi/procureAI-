import React from 'react';
import { 
  Building2, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Activity, 
  LogOut,
  RotateCcw,
  Radio,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout, 
  onDevLogin, 
  healthStatus,
  onDevReset 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', code: 'DASH', icon: Activity },
    { id: 'suppliers', label: 'Supplier Catalog', code: 'SUPP', icon: Building2 },
    { id: 'requirements', label: 'Requirements', code: 'REQS', icon: FileText },
    { id: 'matching', label: 'Supplier Matching', code: 'MATCH', icon: Cpu },
    { id: 'approvals', label: 'Governance Gate', code: 'APPR', icon: ShieldCheck },
    { id: 'negotiations', label: 'Negotiation Terminal', code: 'NEGO', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d14] border-b border-[#1e293b]">
      {/* Top Telemetry Ticker Bar */}
      <div className="bg-[#06090e] border-b border-[#151d2a] px-4 py-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">PROCUREAI // OPS-CORE</span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">
            PERSISTENCE: <strong className="text-emerald-400 font-semibold">POSTGRESQL [CONNECTED]</strong>
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline">
            EVENT BUS: <strong className="text-cyan-400 font-semibold">REDIS PUB/SUB [ACTIVE]</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Reset development state? This will truncate requirements, matching runs, approvals, and negotiations while strictly preserving suppliers.json.')) {
                onDevReset && onDevReset();
              }
            }}
            title="Wipe test data and reset database to fresh clean state"
            className="flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset Dev State
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-mono font-bold text-sm">
              PAI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">ProcureAI</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  ENTERPRISE
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#162030] text-amber-400 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#111722]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User & Session Status */}
          <div className="flex items-center gap-2 text-xs">
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-semibold text-slate-200 leading-tight">{user.name || 'Lead Buyer'}</p>
                  <p className="text-[10px] font-mono text-emerald-400 uppercase leading-none">AUTHORIZED BUYER</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onDevLogin}
                className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
