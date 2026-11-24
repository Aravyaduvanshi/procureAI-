import React, { useState } from 'react';
import MycaLogo from './MycaLogo.jsx';
import MyceliumNetwork from './MyceliumNetwork.jsx';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Building2, 
  SlidersHorizontal, 
  FileText, 
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Award
} from 'lucide-react';

export default function LandingPage({ onOpenApp }) {
  const [activeTabPreview, setActiveTabPreview] = useState('aster');

  return (
    <div className="relative min-h-screen bg-[#0B100E] text-[#E8EDE7] overflow-x-hidden selection:bg-[#A8B99A]/30 selection:text-white">
      {/* =========================================================================
          A. NAVIGATION HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#0B100E]/85 backdrop-blur-md border-b border-[#E8EDE7]/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Mark & Wordmark */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer"
          >
            <MycaLogo size={32} textSize="text-2xl" />
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm text-[#929D92]">
            <a href="#platform" className="hover:text-[#E8EDE7] transition-colors">Platform</a>
            <a href="#workflow" className="hover:text-[#E8EDE7] transition-colors">Workflow</a>
            <a href="#negotiation" className="hover:text-[#E8EDE7] transition-colors">Negotiation</a>
            <a href="#about" className="hover:text-[#E8EDE7] transition-colors">About</a>
          </nav>

          {/* Right Action: Get Demo Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenApp('dashboard')}
              className="myca-btn-secondary text-xs uppercase tracking-wider font-mono py-2 px-5 hover:border-[#A8B99A]"
            >
              Get Demo <ArrowRight className="w-3.5 h-3.5 ml-1 text-[#A8B99A]" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          B. HERO SECTION (TWO-COLUMN WITH MYCELIUM VISUAL)
          ========================================================================= */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden border-b border-[#E8EDE7]/10">
        {/* Generative Interactive Mycelium Network Canvas in Background */}
        <MyceliumNetwork nodeCount={42} className="opacity-90" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Editorial Statement & Actions */}
            <div className="lg:col-span-6 space-y-8">
              {/* Eyebrow with horizontal line */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#929D92] font-semibold">
                  AUTONOMOUS PROCUREMENT INTELLIGENCE
                </span>
                <span className="w-12 h-px bg-[#E8EDE7]/20"></span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[4.25rem] leading-[1.08] text-[#E8EDE7] tracking-tight">
                A more <span className="italic font-normal text-[#A8B99A]">intelligent</span> way to procure.
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[#929D92] max-w-xl font-normal leading-relaxed">
                Connect supplier discovery, commercial evaluation and AI-assisted negotiation in one controlled procurement workflow.
              </p>

              {/* CTA Group */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onOpenApp('dashboard')}
                  className="myca-btn-primary px-7 py-3.5 text-sm"
                >
                  Get Demo <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <button
                  onClick={() => onOpenApp('suppliers')}
                  className="myca-btn-secondary px-6 py-3.5 text-sm"
                >
                  Explore the Platform <ArrowRight className="w-4 h-4 ml-1 text-[#929D92]" />
                </button>
              </div>

              {/* Trust statement */}
              <div className="flex items-center gap-3 pt-4 text-xs font-mono text-[#929D92]">
                <span className="w-8 h-px bg-[#A8B99A]/50"></span>
                <span>Autonomous sourcing. Human-controlled decisions.</span>
              </div>
            </div>

            {/* Right Column: Sourcing Overview Visual (as shown in reference image) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl bg-[#151D18]/90 border border-[#E8EDE7]/15 p-6 shadow-2xl backdrop-blur-sm">
                
                {/* Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E8EDE7]/10 mb-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#929D92] font-semibold">
                    SOURCING OVERVIEW
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-[#A8B99A]">
                    <span className="w-2 h-2 rounded-full bg-[#A8B99A] animate-pulse"></span>
                    WORKFLOW ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Left: Connected Nodes Constellation */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-3">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      {/* Radiating Filaments */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                        <line x1="80" y1="80" x2="80" y2="20" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />
                        <line x1="80" y1="80" x2="135" y2="45" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />
                        <line x1="80" y1="80" x2="135" y2="115" stroke="#D1B878" strokeWidth="1.4" strokeOpacity="0.9" />
                        <line x1="80" y1="80" x2="80" y2="140" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />
                        <line x1="80" y1="80" x2="25" y2="115" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />
                        <line x1="80" y1="80" x2="25" y2="45" stroke="#A8B99A" strokeWidth="1.2" strokeOpacity="0.6" strokeDasharray="2 2" />

                        {/* Outer Nodes */}
                        <circle cx="80" cy="20" r="4.5" fill="#A8B99A" />
                        <circle cx="135" cy="45" r="4.5" fill="#A8B99A" />
                        <circle cx="135" cy="115" r="5.5" fill="#D1B878" /> {/* Active deal node */}
                        <circle cx="80" cy="140" r="4.5" fill="#A8B99A" />
                        <circle cx="25" cy="115" r="4.5" fill="#A8B99A" />
                        <circle cx="25" cy="45" r="4.5" fill="#A8B99A" />
                      </svg>

                      {/* Central Node: MYCA */}
                      <div className="relative z-10 w-20 h-20 rounded-full bg-[#0B100E] border border-[#A8B99A]/50 flex items-center justify-center shadow-lg">
                        <span className="font-serif tracking-widest text-xs uppercase text-[#E8EDE7] font-semibold">
                          MYCA
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#929D92] mt-2">6 Candidates Linked</span>
                  </div>

                  {/* Right: Live Supplier Scorecard */}
                  <div className="sm:col-span-7 space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-[#E8EDE7]/10 text-[10px] text-[#929D92] uppercase">
                            <th className="pb-2">SUPPLIER</th>
                            <th className="pb-2">CATEGORY</th>
                            <th className="pb-2">SCORE</th>
                            <th className="pb-2 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8EDE7]/5">
                          <tr 
                            onClick={() => onOpenApp('suppliers')}
                            className="cursor-pointer hover:bg-[#E8EDE7]/5 transition-colors"
                          >
                            <td className="py-2.5 font-sans font-medium text-[#E8EDE7]">Aster Components</td>
                            <td className="py-2.5 text-[#929D92]">Precision parts</td>
                            <td className="py-2.5 font-bold text-[#A8B99A]">94</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#A8B99A]/15 text-[#A8B99A] border border-[#A8B99A]/30">
                                Qualified
                              </span>
                            </td>
                          </tr>

                          <tr 
                            onClick={() => onOpenApp('suppliers')}
                            className="cursor-pointer hover:bg-[#E8EDE7]/5 transition-colors"
                          >
                            <td className="py-2.5 font-sans font-medium text-[#E8EDE7]">Sanand Auto Cluster</td>
                            <td className="py-2.5 text-[#929D92]">4-Axis Milling</td>
                            <td className="py-2.5 font-bold text-[#D1B878]">92</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D1B878]/15 text-[#D1B878] border border-[#D1B878]/30">
                                Review
                              </span>
                            </td>
                          </tr>

                          <tr 
                            onClick={() => onOpenApp('suppliers')}
                            className="cursor-pointer hover:bg-[#E8EDE7]/5 transition-colors"
                          >
                            <td className="py-2.5 font-sans font-medium text-[#E8EDE7]">AeroPrecision Dyn.</td>
                            <td className="py-2.5 text-[#929D92]">Aerospace CNC</td>
                            <td className="py-2.5 font-bold text-[#A8B99A]">89</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E8EDE7]/10 text-[#E8EDE7] border border-[#E8EDE7]/20">
                                Shortlisted
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-[#929D92] border-t border-[#E8EDE7]/10">
                      <span>Model: v1.2-deterministic</span>
                      <button 
                        onClick={() => onOpenApp('matching')}
                        className="text-[#A8B99A] hover:underline flex items-center gap-1"
                      >
                        Launch Matching Terminal <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          C. PLATFORM CAPABILITIES SECTION
          ========================================================================= */}
      <section id="platform" className="py-24 border-b border-[#E8EDE7]/10 bg-[#0B100E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Section Header */}
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-[#E8EDE7] leading-tight">
              Procurement intelligence, connected.
            </h2>
            <p className="text-[#929D92] text-base leading-relaxed">
              A single intelligent nervous system bridging technical engineering requirements to commercial agreements.
            </p>
          </div>

          {/* 5 Distinct Capability Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Capability 1: Requirement Intelligence */}
            <div className="p-7 rounded-2xl bg-[#151D18] border border-[#E8EDE7]/10 space-y-4 hover:border-[#A8B99A]/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#A8B99A]/10 border border-[#A8B99A]/30 flex items-center justify-center text-[#A8B99A]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Requirement Intelligence</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Convert technical PDF RFQ drawings and specification briefs into structured engineering parameters with explicit tolerance, material, and process bounds.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onOpenApp('requirements')}
                  className="text-xs font-mono text-[#A8B99A] hover:underline inline-flex items-center gap-1"
                >
                  Explore Requirements <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Capability 2: Supplier Discovery */}
            <div className="p-7 rounded-2xl bg-[#151D18] border border-[#E8EDE7]/10 space-y-4 hover:border-[#A8B99A]/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#A8B99A]/10 border border-[#A8B99A]/30 flex items-center justify-center text-[#A8B99A]">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Supplier Discovery</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Algorithmically screen certified manufacturing facilities across industrial corridors based on precise machine capabilities, materials, and batch capacity.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onOpenApp('suppliers')}
                  className="text-xs font-mono text-[#A8B99A] hover:underline inline-flex items-center gap-1"
                >
                  View 20 Catalog Suppliers <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Capability 3: Vendor Intelligence */}
            <div className="p-7 rounded-2xl bg-[#151D18] border border-[#E8EDE7]/10 space-y-4 hover:border-[#A8B99A]/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#A8B99A]/10 border border-[#A8B99A]/30 flex items-center justify-center text-[#A8B99A]">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Vendor Intelligence</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Evaluate suppliers across 5 explainable dimensions: technical capability, audited certifications (ISO/IATF), commercial competitiveness, and delivery feasibility.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onOpenApp('suppliers')}
                  className="text-xs font-mono text-[#A8B99A] hover:underline inline-flex items-center gap-1"
                >
                  Inspect Scorecard Engine <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Capability 4: Intelligent Ranking */}
            <div className="p-7 rounded-2xl bg-[#151D18] border border-[#E8EDE7]/10 space-y-4 hover:border-[#A8B99A]/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#A8B99A]/10 border border-[#A8B99A]/30 flex items-center justify-center text-[#A8B99A]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Intelligent Ranking</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Deterministic matching engine ranks eligible manufacturers and provides explicit disqualification rationales for excluded candidates without pad-filling.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onOpenApp('matching')}
                  className="text-xs font-mono text-[#A8B99A] hover:underline inline-flex items-center gap-1"
                >
                  Run Matching Run <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Capability 5: AI-Assisted Negotiation */}
            <div className="p-7 rounded-2xl bg-[#151D18] border border-[#E8EDE7]/10 space-y-4 hover:border-[#D1B878]/40 transition-colors md:col-span-2 lg:col-span-2">
              <div className="w-10 h-10 rounded-full bg-[#D1B878]/10 border border-[#D1B878]/30 flex items-center justify-center text-[#D1B878]">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">AI-Assisted Negotiation</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Prepare negotiation strategies and counteroffers within approved commercial boundaries. The LLM formulates communication; deterministic policy strictly protects target price and reservation caps.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => onOpenApp('negotiations')}
                  className="text-xs font-mono text-[#D1B878] hover:underline inline-flex items-center gap-1"
                >
                  Open Negotiation Terminal <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          D. ONE CONNECTED WORKFLOW (4 CONNECTED STAGES)
          ========================================================================= */}
      <section id="workflow" className="py-24 border-b border-[#E8EDE7]/10 bg-[#0C120F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#D1B878] font-semibold">
              ONE CONNECTED WORKFLOW
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-[#E8EDE7] leading-tight">
              From requirement to <span className="italic text-[#A8B99A]">decision-ready</span> deal.
            </h2>
            <p className="text-[#929D92] text-base leading-relaxed">
              Every stage transitions statefully with audit trail persistence and real-time frontend synchronization.
            </p>
          </div>

          {/* 4 Connected Stages with Filament Line */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Horizontal Filament Track (Desktop) */}
            <div className="hidden lg:block absolute top-7 left-12 right-12 h-px bg-gradient-to-r from-[#A8B99A]/20 via-[#A8B99A]/60 to-[#D1B878]/60 z-0"></div>

            {/* Stage 01 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#151D18] border border-[#A8B99A]/40 flex items-center justify-center font-mono text-sm font-bold text-[#A8B99A]">
                01
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Define Requirements</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Upload drawing PDFs or specify component volume, material grades, and delivery corridor into durable PostgreSQL storage.
              </p>
            </div>

            {/* Stage 02 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#151D18] border border-[#A8B99A]/40 flex items-center justify-center font-mono text-sm font-bold text-[#A8B99A]">
                02
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Discover Suppliers</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Screen the 20-supplier catalog against technical feasibility, CNC tolerances, and batch minimum order quantities.
              </p>
            </div>

            {/* Stage 03 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#151D18] border border-[#A8B99A]/40 flex items-center justify-center font-mono text-sm font-bold text-[#A8B99A]">
                03
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Evaluate and Rank</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Compare multi-dimensional scores across technical capability, audited certifications, and committed delivery dates.
              </p>
            </div>

            {/* Stage 04 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#151D18] border border-[#D1B878]/60 flex items-center justify-center font-mono text-sm font-bold text-[#D1B878]">
                04
              </div>
              <h3 className="font-serif text-2xl text-[#E8EDE7]">Negotiate & Approve</h3>
              <p className="text-sm text-[#929D92] leading-relaxed">
                Groq LLM drafts opening offers and response letters. Buyer approves at Stage 1 & 2 before any message is sent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          E. HUMAN-CONTROLLED NEGOTIATION WORKSPACE PREVIEW
          ========================================================================= */}
      <section id="negotiation" className="py-24 border-b border-[#E8EDE7]/10 bg-[#0B100E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#A8B99A] font-semibold">
              HUMAN GOVERNANCE GATE
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-[#E8EDE7] leading-tight">
              AI negotiates the details. <span className="italic text-[#D1B878]">You control</span> the decision.
            </h2>
            <p className="text-[#929D92] text-base leading-relaxed">
              Autonomous communication within strict deterministic boundaries. Critical commercial commitments remain subject to human approval.
            </p>
          </div>

          {/* Interactive Negotiation Terminal Preview Card */}
          <div className="rounded-2xl bg-[#151D18] border border-[#E8EDE7]/15 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8EDE7]/10 gap-3">
              <div>
                <span className="font-mono text-xs text-[#A8B99A] font-bold">NEG-LIVE-SESSION</span>
                <h3 className="text-xl font-serif text-[#E8EDE7] mt-0.5">Sanand Auto Machining Cluster Co</h3>
                <p className="text-xs text-[#929D92]">Precision CNC Machined Aluminium Mounting Bracket (5,000 pcs)</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#A8B99A]/15 text-[#A8B99A] border border-[#A8B99A]/30">
                  TWO-STAGE HUMAN GATE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Commercial Boundary Parameters */}
              <div className="lg:col-span-4 space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-[#0B100E] border border-[#E8EDE7]/10">
                  <span className="text-[10px] uppercase text-[#929D92] block">Buyer Target Price</span>
                  <span className="text-lg font-bold text-[#A8B99A]">₹480 / piece</span>
                  <span className="text-[10px] text-[#929D92] block mt-0.5">Fixed commercial constraint</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B100E] border border-[#E8EDE7]/10">
                  <span className="text-[10px] uppercase text-[#929D92] block">Proposed Opening Offer</span>
                  <span className="text-base font-bold text-[#D1B878]">₹461 / piece</span>
                  <span className="text-[10px] text-[#929D92] block mt-0.5">96% target opening anchor</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B100E] border border-[#E8EDE7]/10">
                  <span className="text-[10px] uppercase text-[#929D92] block">Reservation Limit (Policy Ceiling)</span>
                  <span className="text-base font-bold text-[#E07A5F]">₹504 / piece</span>
                  <span className="text-[10px] text-[#929D92] block mt-0.5">Strict autonomous walk-away limit</span>
                </div>
              </div>

              {/* Message Draft & Verification Stream */}
              <div className="lg:col-span-8 p-4 rounded-xl bg-[#0B100E] border border-[#E8EDE7]/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#A8B99A] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> LLM Formulated Outbound Negotiation Draft
                  </span>
                  <span className="text-[#D1B878] font-bold">READY_FOR_MESSAGE_APPROVAL</span>
                </div>

                <div className="p-3.5 rounded bg-[#151D18] border border-[#E8EDE7]/5 text-xs text-[#E8EDE7] font-mono leading-relaxed space-y-2">
                  <p className="text-[#929D92]">Subject: Opening Offer — Precision CNC Machined Aluminium Mounting Bracket</p>
                  <p className="text-slate-300">
                    "Dear Mr. Goswami, Thank you for confirming technical eligibility for 5,000 units. We propose an initial order placement at ₹461.00 per unit under Net 30 payment terms..."
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#929D92] font-mono">Status: Awaiting Lead Buyer Sign-Off</span>
                  <button
                    onClick={() => onOpenApp('negotiations')}
                    className="myca-btn-primary py-2 px-5 text-xs font-mono"
                  >
                    Authorize in Negotiation Terminal <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          F. FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="py-24 border-b border-[#E8EDE7]/10 bg-[#0C120F] text-center relative overflow-hidden">
        <MyceliumNetwork nodeCount={24} className="opacity-40" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="inline-flex items-center justify-center">
            <MycaLogo size={36} showText={false} />
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl text-[#E8EDE7] leading-tight">
            Bring intelligence to every procurement decision.
          </h2>

          <p className="text-[#929D92] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Discover a more structured way to source, evaluate, and negotiate with precision engineering suppliers.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onOpenApp('dashboard')}
              className="myca-btn-primary px-9 py-4 text-sm font-semibold tracking-wide"
            >
              Get Demo <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          G. FOOTER
          ========================================================================= */}
      <footer id="about" className="py-12 bg-[#0B100E] text-xs text-[#929D92]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MycaLogo size={24} textSize="text-base" />
            <span className="text-slate-600">|</span>
            <span>Autonomous Procurement Intelligence</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a href="#platform" className="hover:text-[#E8EDE7] transition-colors">Platform</a>
            <a href="#workflow" className="hover:text-[#E8EDE7] transition-colors">Workflow</a>
            <a href="#negotiation" className="hover:text-[#E8EDE7] transition-colors">Negotiation</a>
            <button onClick={() => onOpenApp('dashboard')} className="hover:text-[#A8B99A] transition-colors">Launch MVP</button>
          </div>

          <div className="font-mono text-[11px] text-[#5F6B5F]">
            © {new Date().getFullYear()} MYCA Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
