import React, { useState } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  Sparkles, 
  TicketCheck, 
  Shield, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Radio, 
  Zap, 
  Clock, 
  Building2, 
  Search, 
  MapPin, 
  Volume2, 
  Command, 
  Layers, 
  ChevronRight,
  ExternalLink,
  Flame,
  Check
} from 'lucide-react';
import { EmployeeExtension, CallRecord, ComplaintTicket } from '../types';

interface LandingViewProps {
  onNavigate: (tab: 'calls' | 'tickets' | 'softphone' | 'directory' | 'analytics' | 'admin') => void;
  onOpenSoftphone: () => void;
  onOpenCommandMenu: () => void;
  onTriggerTestCall: () => void;
  onOpenAICopilot: () => void;
  currentExtension: EmployeeExtension;
  callsCount: number;
  ticketsCount: number;
  didNumber?: string;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenSoftphone,
  onOpenCommandMenu,
  onTriggerTestCall,
  onOpenAICopilot,
  currentExtension,
  callsCount,
  ticketsCount,
  didNumber,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'softphone' | 'tickets' | 'voice'>('softphone');

  return (
    <div className="relative overflow-hidden selection:bg-indigo-500 selection:text-white pb-24">
      {/* Background Ambient Lighting Beam (Linear signature glow) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none opacity-40 blur-[120px] -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.45) 0%, rgba(168, 85, 247, 0.25) 40%, transparent 70%)'
        }}
      />

      {/* Grid line pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pt-8 sm:pt-16 space-y-16 sm:space-y-20 min-w-0">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <div className="text-center space-y-5 sm:space-y-6 max-w-4xl mx-auto w-full min-w-0">
          {/* Linear-style Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-medium text-slate-300 backdrop-blur-md hover:border-white/20 transition cursor-pointer max-w-full"
            onClick={onOpenCommandMenu}
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0"></span>
            <span className="truncate">FAST Connect 2.0 · Telephony dispatch</span>
            <span className="text-slate-500 font-mono text-[10px] pl-1 flex items-center gap-0.5 shrink-0">
              <span>⌘K</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </span>
          </div>

          {/* Headline */}
          <h1 
            className="font-black text-white tracking-tight leading-[1.1] text-balance [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(26px, 6vw, 56px)' }}
          >
            The softphone engine for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              mission-critical operations.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal [overflow-wrap:anywhere]">
            Purpose-built WebRTC business calling, instant complaint dispatch, and AI-grounded contractor mobilization. Engineered for commercial bank branches, facility electrical grids, and dispatch teams.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2 w-full">
            <button
              onClick={() => onNavigate('calls')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition shadow-lg shadow-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Call Center Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onOpenSoftphone}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.12] font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Launch Softphone (Ext {currentExtension.extension})</span>
            </button>

            <button
              onClick={onTriggerTestCall}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Inbound PBX Trunk</span>
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-2 font-mono">
            <span>Tip: Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white/[0.06] border border-white/[0.12] rounded text-slate-300">
              ⌘K
            </kbd>
            <span>or</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white/[0.06] border border-white/[0.12] rounded text-slate-300">
              Ctrl+K
            </kbd>
            <span>anywhere to open command palette</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. INTERACTIVE PRODUCT SHOWCASE DECK (Linear-style Mockup) */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-white/[0.1] bg-slate-950/80 p-2 sm:p-4 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl ring-1 ring-white/5 space-y-3">
          {/* Deck Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 text-xs font-mono text-slate-400">fastconnect.internal // pbx.gateway.lahore-dc</span>
            </div>

            {/* Segmented Showcase Controls */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
              <button
                onClick={() => setActivePreviewTab('softphone')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activePreviewTab === 'softphone'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PBX Softphone
              </button>
              <button
                onClick={() => setActivePreviewTab('tickets')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activePreviewTab === 'tickets'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Complaint Triage
              </button>
              <button
                onClick={() => setActivePreviewTab('voice')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activePreviewTab === 'voice'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Voice Stream
              </button>
            </div>
          </div>

          {/* Preview Tab 1: PBX Softphone Screen */}
          {activePreviewTab === 'softphone' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-bold">
                    WebRTC Audio Engine
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Instant dialpad, DTMF tones, and zero-latency trunk routing.
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for officers managing continuous customer volume. Integrated with direct inward dialing (DID) <span className="font-mono text-emerald-400 font-bold">{didNumber || '+92 (42) 111-327-800'}</span>, hold chime synthesizers, and call transfer protocol.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>32 Channels SIP Trunk</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dual Frequency DTMF</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onOpenSoftphone}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/30"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Test Softphone Console</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 bg-slate-900/90 border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2">
                  <div className="font-semibold text-white">Live Dial Session</div>
                  <span className="font-mono text-emerald-400 font-bold">CONNECTED</span>
                </div>
                <div className="text-center py-2 space-y-1">
                  <div className="text-sm font-bold text-white">Habib Bank Limited (HBL)</div>
                  <div className="text-[11px] text-slate-400">Main Gulberg Branch • +92 42 35789012</div>
                  <div className="font-mono text-xs text-emerald-400 mt-2">03:42</div>
                </div>
                <div className="flex items-center justify-center gap-1.5 h-6">
                  <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-1"></span>
                  <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-2"></span>
                  <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-3"></span>
                  <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-4"></span>
                  <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-2"></span>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab 2: Complaint Triage Screen */}
          {activePreviewTab === 'tickets' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                    Incident Dispatch Workflow
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Linear-style issue cycles for physical maintenance and outages.
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Convert calls directly into dispatched contractor tickets with one click. Automatic SLA timer countdowns, priority overrides, and technician arrival ETAs.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('tickets')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-amber-600/30"
                  >
                    <TicketCheck className="w-3.5 h-3.5" />
                    <span>View Complaints Queue</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 space-y-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">#TKT-8492 · Main 3-Phase Trip</div>
                    <div className="text-[11px] text-slate-400">HBL Main Gulberg • Tariq Electrician</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                    Critical
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">#TKT-8488 · ATM Chiller Breakdown</div>
                    <div className="text-[11px] text-slate-400">ABL Mall Road • CoolTech HVAC</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    High
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab 3: Two-Way Spoken AI Voice Stream */}
          {activePreviewTab === 'voice' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-purple-400 uppercase tracking-wider font-bold">
                    Gemini 3.8 Live Voice
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Natural conversational speech between agents and callers.
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Audible spoken synthesis with distinct caller and contractor vocal profiles, real-time microphone speech recognition, and automatic live transcription syncing directly into officer tickets.
                  </p>
                </div>

                <div>
                  <button
                    onClick={onOpenAICopilot}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-purple-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Voice Stream Copilot</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 p-4 rounded-2xl bg-slate-900 border border-white/[0.08] space-y-2.5 text-xs">
                <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                  <strong className="block text-[10px] text-indigo-400 font-mono">AGENT (YOU)</strong>
                  "Is the main 100A switchboard isolated or is there smoke visible?"
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-white/[0.08] text-slate-200">
                  <strong className="block text-[10px] text-emerald-400 font-mono">CALLER (HBL GULBERG)</strong>
                  "We isolated the panel. The emergency contractor arrived at Gate 2 now."
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. BENTO GRID CAPABILITIES (Linear aesthetic) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for velocity and zero dead-air.
            </h2>
            <p className="text-xs text-slate-400">
              Every detail is tuned for fast response times, precise accountability, and reliable telephony.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bento Card 1: 2-Cols Large */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-slate-950/60 border border-white/[0.08] hover:border-white/20 transition space-y-4 flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  High-Throughput PBX Trunk & Extension Desks
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                  Connect incoming customer queries with 3-digit internal extensions (*101 Tariq, 102 Ayesha, 103 Imran*). Instant 1-click blind and attended transfers, soft hold chimes, and automatic audio logging.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> 32 SIP Channels
                </span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Check className="w-3.5 h-3.5" /> G.711u / Opus Codecs
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Check className="w-3.5 h-3.5" /> DTMF Synthesizer
                </span>
              </div>
            </div>

            {/* Bento Card 2: 1-Col */}
            <div className="p-6 rounded-3xl bg-slate-950/60 border border-white/[0.08] hover:border-white/20 transition space-y-4 flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Strict SLA Guardrails
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  240-second target average handling time (AHT) and automatic 30-minute critical dispatch countdowns.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] font-mono text-amber-300">
                Critical SLA: &lt; 30m response
              </div>
            </div>

            {/* Bento Card 3: 1-Col */}
            <div className="p-6 rounded-3xl bg-slate-950/60 border border-white/[0.08] hover:border-white/20 transition space-y-4 flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Google Search & Maps Grounding
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Retrieve live grid protocols from LESCO and locate certified commercial electricians near Gulberg and DHA in seconds.
                </p>
              </div>

              <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                <span>Integrated Gemini 3.5 Flash Tools</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Bento Card 4: 2-Cols Large */}
            <div className="md:col-span-2 p-6 rounded-3xl bg-slate-950/60 border border-white/[0.08] hover:border-white/20 transition space-y-4 flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  SuperAdmin Oversight & Live Firestore Persistence
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                  Every call log, scheduled follow-up reminder, and maintenance ticket persists in real-time Firestore database. Complete administrative control to inspect, edit, or wipe records with full audit clarity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('admin')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inspect Admin Area</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. QUANTITATIVE PROOF & BENCHMARKS */}
        {/* ========================================================================= */}
        <div className="border-y border-white/[0.08] py-8 sm:py-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center w-full min-w-0">
          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
              140+
            </div>
            <div className="text-xs text-slate-400">Bank Branch Corridors</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
              180s
            </div>
            <div className="text-xs text-slate-400">Avg Resolution Speed</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-indigo-400 font-mono tracking-tight">
              99.98%
            </div>
            <div className="text-xs text-slate-400">Trunk Availability</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
              &lt; 25m
            </div>
            <div className="text-xs text-slate-400">Emergency Vendor ETA</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. LINEAR-STYLE ACTION CALLOUT */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent border border-white/[0.1] text-center space-y-5 sm:space-y-6 max-w-3xl mx-auto shadow-2xl relative overflow-hidden w-full min-w-0">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to take your operations live?
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Jump straight into the Softphone Console or triage live complaints. Press ⌘K anytime for instant navigation.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              onClick={() => onNavigate('calls')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition shadow-lg cursor-pointer"
            >
              Launch FAST Connect Console
            </button>
            <button
              onClick={onOpenSoftphone}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white border border-slate-700 font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Open Dialpad
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. MINIMALIST FOOTER */}
        {/* ========================================================================= */}
        <footer className="pt-8 border-t border-white/[0.06] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">FAST Connect</span>
            <span>·</span>
            <span className="truncate">Enterprise Telephony & Complaint Dispatch</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-slate-400">
            <button onClick={() => onNavigate('calls')} className="hover:text-white transition cursor-pointer">Calls</button>
            <button onClick={() => onNavigate('tickets')} className="hover:text-white transition cursor-pointer">Tickets</button>
            <button onClick={() => onNavigate('directory')} className="hover:text-white transition cursor-pointer">Extensions</button>
            <button onClick={() => onNavigate('analytics')} className="hover:text-white transition cursor-pointer">Analytics</button>
            <button onClick={() => onNavigate('admin')} className="hover:text-white transition cursor-pointer">Admin</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
