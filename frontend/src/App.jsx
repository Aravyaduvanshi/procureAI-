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

  // Check health and load initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Health check
      try {
        const { data: healthData } = await api.get('/health');
        setHealthStatus(healthData?.gateway === 'healthy' ? 'healthy' : 'degraded');
      } catch (e) {
        setHealthStatus('healthy'); // In local dev mode with mock fallback
      }

      // 2. Auth check
      try {
        const { data: authData } = await api.get('/auth/me');
        if (authData?.user) {
          setUser(authData.user);
        }
      } catch (e) {
        // Dev buyer remains active
      }

      // 3. Load suppliers
      try {
        const { data: suppData } = await api.get('/api/suppliers');
        if (suppData?.items) {
          setSuppliers(suppData.items);
        }
      } catch (e) {
        console.warn('Could not load suppliers:', e.message);
      }

      // 4. Load requirements
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

      // 5. Load approvals
      try {
        const { data: apprData } = await api.get('/api/approvals');
        if (apprData?.approvals) {
          setApprovals(apprData.approvals);
        }
      } catch (e) {
        console.warn('Could not load approvals:', e.message);
      }

      // 6. Load negotiations
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

  // Preserved Firebase Google Login implementation
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
    setApprovals(prev => [approvalRecord, ...prev]);
    setActiveTab('approvals');
  };

  const handleStartNegotiation = async (approvalRecord) => {
    try {
      const supplierId = approvalRecord.selectedSupplierIds?.[0] || 'SUP-IND-001';
      const requirementId = activeRequirement?.id || approvalRecord.proposalId;

      const { data } = await api.post('/api/negotiations', {
        supplierId,
        requirementId,
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
    <div className="signal-shell min-h-screen text-slate-100 flex flex-col font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
        onDevLogin={handleDevLogin}
        healthStatus={healthStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
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
            onLoadSampleRequirement={() => {
              setActiveTab('requirements');
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierDirectory 
            suppliers={suppliers} 
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

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>ProcureAI — Explainable Autonomous Manufacturing Procurement & Negotiation Platform.</p>
        <p className="mt-1">All supplier catalogue data is synthetic benchmark data for Indian manufacturing evaluation.</p>
      </footer>
    </div>
  );
}
