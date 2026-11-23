import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import SupplierDirectory from './components/SupplierDirectory.jsx';
import RequirementUpload from './components/RequirementUpload.jsx';
import SupplierMatching from './components/SupplierMatching.jsx';
import ApprovalView from './components/ApprovalView.jsx';
import NegotiationWorkspace from './components/NegotiationWorkspace.jsx';
import api from '../utils/axios.js';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase.js";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState({
    name: 'ProcureAI Lead Buyer',
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

  // Check health and load initial authoritative data from PostgreSQL
  useEffect(() => {
    fetchInitialData();

    // Establish persistent Real-Time Server-Sent Events (SSE) connection
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
    let eventSource;

    try {
      eventSource = new EventSource(`${serverUrl}/api/events`, { withCredentials: true });

      eventSource.onopen = () => {
        console.log('[SSE] Connected to ProcureAI realtime event stream');
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
      setUser({ name: 'ProcureAI Lead Buyer', email: 'buyer@example.com', role: 'buyer' });
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    setUser(null);
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

  return (
    <div className="terminal-grid-bg min-h-screen text-slate-100 flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
        onDevLogin={handleDevLogin}
        healthStatus={healthStatus}
        onDevReset={handleDevReset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={{
              totalSuppliers: suppliers.length || 20,
              totalRequirements: requirements.length,
              matchingRuns: matchingResult ? 1 : 0,
              pendingApprovals: approvals.filter(a => a.decision === 'PENDING').length,
              activeNegotiations: negotiations.filter(n => n.status !== 'COMPLETED').length
            }}
            setActiveTab={setActiveTab}
            recentActivity={recentActivity}
            requirements={requirements}
            onLoadSampleRequirement={() => {
              setActiveTab('requirements');
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierDirectory 
            suppliers={suppliers} 
            activeRequirement={activeRequirement}
            onSelectForMatching={(s) => {
              setActiveTab('matching');
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

      <footer className="border-t border-[#1e293b] bg-[#06090e] py-4 text-center text-[11px] font-mono text-slate-500">
        <p>PROCUREAI // ENTERPRISE MANUFACTURING SOURCING & GOVERNANCE TERMINAL</p>
        <p className="text-[10px] text-slate-600 mt-0.5">PostgreSQL Durable Single Source of Truth • Redis Event Bus</p>
      </footer>
    </div>
  );
}
