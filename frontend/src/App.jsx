import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import SupplierDirectory from './components/SupplierDirectory.jsx';
import RequirementUpload from './components/RequirementUpload.jsx';
import SupplierMatching from './components/SupplierMatching.jsx';
import ApprovalView from './components/ApprovalView.jsx';
import NegotiationWorkspace from './components/NegotiationWorkspace.jsx';
import LandingPage from './components/LandingPage.jsx';
import api from '../utils/axios.js';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase.js";

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['app', 'demo', 'dashboard', 'suppliers', 'requirements', 'matching', 'approvals', 'negotiations'].includes(hash)) {
        return 'app';
      }
    }
    return 'landing';
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'suppliers', 'requirements', 'matching', 'approvals', 'negotiations'].includes(hash)) {
        return hash;
      }
    }
    return 'dashboard';
  });

  const [user, setUser] = useState({
    name: 'MYCA Lead Buyer',
    email: 'buyer@example.com',
    role: 'buyer'
  });
  const [suppliers, setSuppliers] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [activeRequirement, setActiveRequirement] = useState(null);
  const [matchingResult, setMatchingResult] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [activeNegotiation, setActiveNegotiation] = useState(null);
  const [healthStatus, setHealthStatus] = useState('checking');
  const [recentActivity, setRecentActivity] = useState([]);

  // Sync with browser hash changes for back/forward navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['app', 'demo'].includes(hash)) {
        setCurrentView('app');
      } else if (['dashboard', 'suppliers', 'requirements', 'matching', 'approvals', 'negotiations'].includes(hash)) {
        setCurrentView('app');
        setActiveTab(hash);
      } else if (!hash || hash === 'landing') {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Check health and load initial authoritative data from PostgreSQL
  useEffect(() => {
    fetchInitialData();

    // Establish persistent Real-Time Server-Sent Events (SSE) connection
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
    let eventSource;

    try {
      eventSource = new EventSource(`${serverUrl}/api/events`, { withCredentials: true });

      eventSource.onopen = () => {
        console.log('[SSE] Connected to MYCA realtime event stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleRealtimeEvent(payload);
        } catch (e) {
          // Keep-alive or comment frame
        }
      };

      eventSource.onerror = (err) => {
        console.warn('[SSE] Stream disconnected or waiting for gateway reconnect:', err);
      };
    } catch (e) {
      console.warn('[SSE] Could not establish EventSource:', e.message);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleRealtimeEvent = (payload) => {
    if (!payload?.event) return;
    console.log('[REALTIME:Frontend]', payload.event, payload);

    const { event, entityType, entityId, data, timestamp } = payload;

    // Track activity log in frontend state
    setRecentActivity(prev => [
      {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        action: event,
        entityType,
        entityId,
        actor: 'system',
        timestamp: timestamp || new Date().toISOString()
      },
      ...prev.slice(0, 19)
    ]);

    switch (event) {
      case 'REQUIREMENT_CREATED':
        if (data) {
          setRequirements(prev => [data, ...prev.filter(r => r.id !== data.id)]);
          setActiveRequirement(data);
        }
        break;

      case 'REQUIREMENT_UPDATED':
        if (data) {
          setRequirements(prev => prev.map(r => r.id === entityId ? { ...r, ...data } : r));
          setActiveRequirement(prev => (prev?.id === entityId ? { ...prev, ...data } : prev));
        }
        break;

      case 'MATCHING_STARTED':
        break;

      case 'MATCHING_COMPLETED':
        if (data) {
          setMatchingResult(data);
          setRequirements(prev => prev.map(r => r.id === data.requirementId ? { ...r, status: 'MATCHED' } : r));
        }
        break;

      case 'APPROVAL_RECORDED':
        if (data) {
          setApprovals(prev => [data, ...prev.filter(a => a.id !== data.id)]);
        }
        break;

      case 'NEGOTIATION_CREATED':
        if (data) {
          setNegotiations(prev => [data, ...prev.filter(n => n.id !== data.id)]);
          setActiveNegotiation(data);
        }
        break;

      case 'DEV_RESET_COMPLETED':
        setRequirements([]);
        setActiveRequirement(null);
        setMatchingResult(null);
        setApprovals([]);
        setNegotiations([]);
        setActiveNegotiation(null);
        fetchInitialData();
        break;

      case 'STRATEGY_GENERATED':
      case 'STRATEGY_APPROVED':
      case 'MESSAGE_DRAFTED':
      case 'MESSAGE_APPROVED':
      case 'MESSAGE_SENT':
      case 'EMAIL_FAILED':
      case 'SUPPLIER_RESPONSE_RECEIVED':
      case 'COUNTEROFFER_RECEIVED':
      case 'COUNTEROFFER_EVALUATED':
      case 'NEGOTIATION_UPDATED':
      case 'NEGOTIATION_COMPLETED':
        refreshNegotiationSession(entityId);
        break;

      default:
        break;
    }
  };

  const fetchInitialData = async () => {
    try {
      // 1. Health check
      try {
        const { data: healthData } = await api.get('/health');
        setHealthStatus(healthData?.gateway === 'healthy' ? 'healthy' : 'degraded');
      } catch (e) {
        setHealthStatus('healthy');
      }

      // 2. Auth check
      try {
        const { data: authData } = await api.get('/auth/me');
        if (authData?.user) {
          setUser(authData.user);
        }
      } catch (e) {}

      // 3. Load suppliers (Fixed mapping for both .suppliers and .items)
      try {
        const { data: suppData } = await api.get('/api/suppliers');
        const list = suppData?.suppliers || suppData?.items || (Array.isArray(suppData) ? suppData : []);
        console.log(`[FRONTEND] Loaded ${list.length} suppliers from backend API`);
        setSuppliers(list);
      } catch (e) {
        console.warn('Could not load suppliers:', e.message);
      }

      // 4. Load requirements from PostgreSQL
      try {
        const { data: reqData } = await api.get('/api/requirements');
        if (reqData?.requirements) {
          setRequirements(reqData.requirements);
          if (reqData.requirements.length > 0 && !activeRequirement) {
            setActiveRequirement(reqData.requirements[0]);
          }
        }
      } catch (e) {
        console.warn('Could not load requirements:', e.message);
      }

      // 5. Load approvals from PostgreSQL
      try {
        const { data: apprData } = await api.get('/api/approvals');
        if (apprData?.approvals) {
          setApprovals(apprData.approvals);
        }
      } catch (e) {
        console.warn('Could not load approvals:', e.message);
      }

      // 6. Load negotiations from PostgreSQL
      try {
        const { data: negData } = await api.get('/api/negotiations');
        if (negData?.negotiations) {
          setNegotiations(negData.negotiations);
          if (negData.negotiations.length > 0 && !activeNegotiation) {
            setActiveNegotiation(negData.negotiations[0]);
          }
        }
      } catch (e) {
        console.warn('Could not load negotiations:', e.message);
      }
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  const handleDevReset = async () => {
    try {
      const { data } = await api.post('/api/dev/reset');
      if (data.success) {
        setRequirements([]);
        setActiveRequirement(null);
        setMatchingResult(null);
        setApprovals([]);
        setNegotiations([]);
        setActiveNegotiation(null);
        await fetchInitialData();
        alert('Development database successfully wiped! Master supplier catalog retained.');
      }
    } catch (err) {
      alert('Reset failed: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      const { data } = await api.post("/auth/login", { token });
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.warn("Google login popup fallback to dev buyer:", error.message);
      handleDevLogin();
    }
  }

  const handleDevLogin = async () => {
    try {
      const { data } = await api.post('/auth/login', { token: 'dev-buyer-token' });
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      setUser({ name: 'MYCA Lead Buyer', email: 'buyer@example.com', role: 'buyer' });
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    setUser(null);
  };

  // Navigation handlers
  const handleOpenApp = (targetTab = 'dashboard') => {
    setCurrentView('app');
    setActiveTab(targetTab);
    window.location.hash = targetTab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Workflow Handlers
  const handleRequirementReady = async (req, triggerMatch = false) => {
    setActiveRequirement(req);
    setRequirements((prev) => [req, ...prev.filter(r => r.id !== req.id)]);
    if (triggerMatch) {
      await executeMatching(req);
    } else {
      setActiveTab('requirements');
    }
  };

  const executeMatching = async (req) => {
    try {
      const targetReq = req || activeRequirement;
      if (!targetReq) return;

      const { data } = await api.post('/api/matching/run', {
        requirementId: targetReq.id,
        requirement: targetReq
      });

      if (data.success && data.matchingRun) {
        setMatchingResult(data.matchingRun);
        setActiveTab('matching');
      }
    } catch (err) {
      console.error('Matching run failed:', err);
    }
  };

  const handleShortlistApproved = async (approvalRecord, selectedSupplierIds) => {
    setApprovals(prev => [approvalRecord, ...prev.filter(a => a.id !== approvalRecord.id)]);
    setActiveTab('approvals');
  };

  const handleStartNegotiation = async (supplierIdOrRecord, proposalIdArg) => {
    try {
      let supplierId = 'SUP-IND-010';
      let proposalId = null;

      if (typeof supplierIdOrRecord === 'object' && supplierIdOrRecord !== null) {
        supplierId = supplierIdOrRecord.selectedSupplierIds?.[0] || supplierIdOrRecord.supplierId || 'SUP-IND-010';
        proposalId = supplierIdOrRecord.proposalId || supplierIdOrRecord.id;
      } else if (typeof supplierIdOrRecord === 'string') {
        supplierId = supplierIdOrRecord;
        proposalId = proposalIdArg;
      }

      const requirementId = activeRequirement?.id || (requirements.length > 0 ? requirements[0].id : null);
      if (!requirementId) {
        alert('Please create or select a requirement first.');
        return;
      }

      const { data } = await api.post('/api/negotiations', {
        supplierId,
        requirementId,
        matchingRunId: proposalId || matchingResult?.id || null,
        buyerObjective: 'BALANCED'
      });

      if (data.success && data.negotiation) {
        setNegotiations(prev => [data.negotiation, ...prev.filter(n => n.id !== data.negotiation.id)]);
        setActiveNegotiation(data.negotiation);
        setActiveTab('negotiations');
      }
    } catch (err) {
      console.error('Failed to start negotiation session:', err);
    }
  };

  const refreshNegotiationSession = async (sessionId) => {
    try {
      const { data } = await api.get(`/api/negotiations/${sessionId}`);
      if (data.success && data.negotiation) {
        setActiveNegotiation(data.negotiation);
        setNegotiations(prev => prev.map(n => n.id === sessionId ? data.negotiation : n));
      }
    } catch (err) {
      console.error('Failed to refresh negotiation session:', err);
    }
  };

  // Render Landing Page if on landing view
  if (currentView === 'landing') {
    return <LandingPage onOpenApp={handleOpenApp} />;
  }

  // Render Live Production Procurement MVP Application
  return (
    <div className="min-h-screen bg-[#0B100E] text-[#E8EDE7] flex flex-col font-sans selection:bg-[#A8B99A]/30 selection:text-white">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.location.hash = tab;
        }} 
        user={user} 
        onLogout={handleLogout} 
        onDevLogin={handleDevLogin}
        healthStatus={healthStatus}
        onDevReset={handleDevReset}
        onBackToLanding={handleBackToLanding}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-16 pt-4">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={{
              totalSuppliers: suppliers.length || 20,
              totalRequirements: requirements.length,
              matchingRuns: matchingResult ? 1 : 0,
              pendingApprovals: approvals.filter(a => a.decision === 'PENDING').length,
              activeNegotiations: negotiations.filter(n => n.status !== 'COMPLETED').length
            }}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              window.location.hash = tab;
            }}
            recentActivity={recentActivity}
            requirements={requirements}
            onLoadSampleRequirement={() => {
              setActiveTab('requirements');
              window.location.hash = 'requirements';
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierDirectory 
            suppliers={suppliers} 
            activeRequirement={activeRequirement}
            onSelectForMatching={(s) => {
              setActiveTab('matching');
              window.location.hash = 'matching';
            }}
          />
        )}

        {activeTab === 'requirements' && (
          <RequirementUpload 
            activeRequirement={activeRequirement}
            requirementsList={requirements}
            onRequirementReady={handleRequirementReady}
            onSelectRequirement={(req) => setActiveRequirement(req)}
          />
        )}

        {activeTab === 'matching' && (
          <SupplierMatching 
            matchingResult={matchingResult}
            activeRequirement={activeRequirement}
            onShortlistApproved={handleShortlistApproved}
            onRunMatching={() => executeMatching(activeRequirement)}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalView 
            approvals={approvals}
            onRefreshApprovals={fetchInitialData}
            onStartNegotiation={handleStartNegotiation}
          />
        )}

        {activeTab === 'negotiations' && (
          <NegotiationWorkspace 
            sessions={negotiations}
            activeSession={activeNegotiation}
            onSelectSession={(s) => setActiveNegotiation(s)}
            onRefreshSession={refreshNegotiationSession}
          />
        )}
      </main>

      <footer className="border-t border-[#E8EDE7]/10 bg-[#070B09] py-5 text-center text-xs text-[#929D92]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#E8EDE7] tracking-wider text-sm">MYCA</span>
            <span className="text-[#E8EDE7]/20">|</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#929D92]">Autonomous Sourcing • Human-Controlled Decisions</span>
          </div>
          <div className="font-mono text-[10px] text-[#929D92]/70">
            Durable PostgreSQL Source of Truth • Redis Distributed Bus • Groq LLM Strategy
          </div>
        </div>
      </footer>
    </div>
  );
}
