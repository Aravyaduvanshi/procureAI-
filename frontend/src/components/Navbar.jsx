import React from 'react';
import MycaLogo from './MycaLogo.jsx';
import { 
  Building2, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  LogOut,
  RotateCcw,
  Radio,
  SlidersHorizontal,
  Home
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout, 
  onDevLogin, 
  healthStatus,
  onDevReset,
  onBackToLanding 
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
    <header className="sticky top-0 z-50 bg-[#0B100E] border-b border-[#E8EDE7]/10">
      {/* Top Telemetry Ticker Bar */}
      <div className="bg-[#070B09] border-b border-[#E8EDE7]/5 px-4 py-1.5 text-[11px] font-mono text-[#929D92] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#E8EDE7]">
            <Radio className="w-3 h-3 text-[#A8B99A] animate-pulse" />
            <span className="font-semibold tracking-wider">MYCA // OPS-CORE</span>
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline">
            PERSISTENCE: <strong className="text-[#A8B99A] font-semibold">POSTGRESQL [CONNECTED]</strong>
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:inline">
            EVENT BUS: <strong className="text-[#D1B878] font-semibold">REDIS PUB/SUB [ACTIVE]</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#151D18] hover:bg-[#1E2922] text-[#A8B99A] border border-[#A8B99A]/30 transition-colors"
            >
              <Home className="w-2.5 h-2.5" />
              Public Overview
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Reset development state? This will truncate requirements, matching runs, approvals, and negotiations while strictly preserving suppliers.json.')) {
                onDevReset && onDevReset();
              }
            }}
            title="Wipe test data and reset database to fresh clean state"
            className="flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#151D18] hover:bg-rose-950/40 text-[#929D92] hover:text-rose-300 border border-[#E8EDE7]/10 hover:border-rose-800 transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset Dev State
          </button>

          <span className="text-slate-700">|</span>
          <span className="text-[10px] text-[#5F6B5F] font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => setActiveTab('dashboard')}
          >
            <MycaLogo size={28} textSize="text-xl" />
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#A8B99A]/15 text-[#A8B99A] border border-[#A8B99A]/30">
              OPERATIONS
            </span>
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#151D18] text-[#A8B99A] border border-[#A8B99A]/40 shadow-xs'
                      : 'text-[#929D92] hover:text-[#E8EDE7] hover:bg-[#151D18]/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#A8B99A]' : 'text-[#929D92]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User & Session Status */}
          <div className="flex items-center gap-2 text-xs">
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E8EDE7]/10">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-semibold text-[#E8EDE7] leading-tight">{user.name || 'Lead Buyer'}</p>
                  <p className="text-[10px] font-mono text-[#A8B99A] uppercase leading-none">AUTHORIZED BUYER</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1 rounded text-[#929D92] hover:text-rose-400 hover:bg-[#151D18]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onDevLogin}
                className="myca-btn-primary py-1 px-3 text-xs"
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
