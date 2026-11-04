import React from 'react';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  MessageSquare, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Activity, 
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onDevLogin, healthStatus }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'suppliers', label: 'Supplier', icon: Building2 },
    { id: 'requirements', label: 'Requirements', icon: FileText },
    { id: 'matching', label: 'Matching ', icon: Cpu },
    { id: 'approvals', label: 'Approvals ', icon: ShieldCheck },
    { id: 'negotiations', label: 'Negotiations', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">Procure<span className="text-indigo-400">AI</span></span>
                
              </div>
              
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 ">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-2 h-2 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Status & User */}
          <div className="flex items-center gap-3">
            {/* Health / System Mode */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className={`w-2 h-2 rounded-full ${healthStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-mono text-slate-400">Local Dev Mode</span>
            </div>

            {/* User Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-500/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
                  {user.name ? user.name.charAt(0) : 'B'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-slate-200 leading-none">{user.name || 'Lead Buyer'}</p>
                  <p className="text-[10px] text-emerald-400 capitalize">{user.role || 'Authorized Buyer'}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onDevLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Buyer Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
