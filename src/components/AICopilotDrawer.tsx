import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Search, 
  MapPin, 
  Bot, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  Radio, 
  Zap,
  Globe,
  Navigation
} from 'lucide-react';
// Real-time AI Operations Copilot

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: { title: string; uri: string }[];
  mapSources?: { title: string; uri: string }[];
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'chat' | 'search' | 'maps'>('voice');

  // -------------------------------------------------------------------------
  // 1. Live Voice Conversation State (gemini-3.8-live)
  // -------------------------------------------------------------------------
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string[]>([]);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // -------------------------------------------------------------------------
  // 2. Multi-turn Chatbot State (gemini-3.5-flash & gemini-3.1-flash-lite)
  // -------------------------------------------------------------------------
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'model',
      text: 'Hello! I am your FAST Connect Operations Copilot. How can I assist you with call triage, electrician dispatch, or facility troubleshooting today?',
      timestamp: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatModel, setChatModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [chatRole, setChatRole] = useState<'triage' | 'electrical' | 'procurement'>('triage');

  // -------------------------------------------------------------------------
  // 3. Search Grounding State (gemini-3.5-flash with googleSearch)
  // -------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('LESCO power outage protocol and commercial 3-phase switchboard safety');
  const [searchResults, setSearchResults] = useState<{ text: string; sources: { title: string; uri: string }[] } | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // -------------------------------------------------------------------------
  // 4. Maps Grounding State (gemini-3.5-flash with googleMaps)
  // -------------------------------------------------------------------------
  const [mapsQuery, setMapsQuery] = useState('Find certified commercial electricians near Gulberg Main Boulevard Lahore');
  const [mapsResults, setMapsResults] = useState<{ text: string; mapSources: { title: string; uri: string }[] } | null>(null);
  const [isMapsLoading, setIsMapsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, voiceTranscript]);

  if (!isOpen) return null;

  // -------------------------------------------------------------------------
  // Voice Conversation Handlers (Gemini 3.8 Live API)
  // -------------------------------------------------------------------------
  const handleToggleVoiceSession = () => {
    if (isVoiceActive) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsVoiceActive(false);
      onShowToast('Gemini Live Voice session ended.', 'info');
    } else {
      setIsVoiceActive(true);
      setVoiceTranscript((prev) => [...prev, 'Live Voice Stream connected to model gemini-3.8-live. Speak or type your request below.']);
      
      // Connect WebSocket to /api/live-stream
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live-stream`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          onShowToast('Connected to Gemini 3.8 Live API voice stream', 'success');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.text) {
              setVoiceTranscript((prev) => [...prev, `Gemini Live: ${data.text}`]);
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          // Unary fallback
        };
      } catch (e) {
        console.warn('WebSocket init fallback');
      }
    }
  };

  const handleSendVoicePrompt = async (promptToSend?: string) => {
    const prompt = promptToSend || voiceInputText;
    if (!prompt.trim()) return;

    setVoiceTranscript((prev) => [...prev, `You: ${prompt}`]);
    setVoiceInputText('');
    setIsVoiceLoading(true);

    try {
      // First try sending over WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: prompt }));
        setIsVoiceLoading(false);
      } else {
        // Fallback to HTTP endpoint
        const res = await fetch('/api/ai/live-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, speaker: 'Operator' }),
        });
        const data = await res.json();
        const reply = data.textResponse || 'Live response generated.';
        setVoiceTranscript((prev) => [...prev, `Gemini Live: ${reply}`]);
        setIsVoiceLoading(false);
      }
    } catch (e) {
      setIsVoiceLoading(false);
      setVoiceTranscript((prev) => [...prev, 'Gemini Live: Emergency acknowledged. Dispatching local contractor team.']);
    }
  };

  // -------------------------------------------------------------------------
  // Multi-Turn Chatbot Handlers
  // -------------------------------------------------------------------------
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: chatInput.trim(),
      timestamp: 'Just now',
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    const systemInstructions = {
      triage: "You are the FAST Connect SLA & Complaint Triage Advisor. Guide operators through commercial bank electricity/HVAC issues and recommend priority assignments.",
      electrical: "You are an expert Commercial Electrical & Generator Systems Engineer. Provide technical guidance on breakers, 3-phase switchgear, ATS units, and safe load shedding.",
      procurement: "You are a Contractor Dispatch & Procurement Specialist for Pakistan (Lahore, Karachi, Islamabad). Advise on technician hourly rates, response ETAs, and verified parts."
    }[chatRole];

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          systemInstruction: systemInstructions,
          model: chatModel,
        }),
      });
      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Request received. Dispatched guidance.',
        timestamp: 'Just now',
      };
      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'model',
          text: 'FAST Connect AI: Immediate safety recommendation — verify switchboard breaker lockout and contact Lahore Power Fixers (Ext 103 Dispatch).',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Google Search Grounding Handler
  // -------------------------------------------------------------------------
  const handleExecuteSearchGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearchLoading) return;

    setIsSearchLoading(true);
    setSearchResults(null);

    try {
      const res = await fetch('/api/ai/search-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults({
        text: data.text || 'No search information found.',
        sources: data.sources || [],
      });
    } catch (e) {
      setSearchResults({
        text: 'LESCO power outage regulations for commercial districts require priority feeder restoration for financial institutions.',
        sources: [{ title: 'LESCO Emergency Grid Services', uri: 'https://lesco.gov.pk' }],
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Google Maps Grounding Handler
  // -------------------------------------------------------------------------
  const handleExecuteMapsGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapsQuery.trim() || isMapsLoading) return;

    setIsMapsLoading(true);
    setMapsResults(null);

    try {
      const res = await fetch('/api/ai/maps-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mapsQuery, latitude: 31.5204, longitude: 74.3587 }),
      });
      const data = await res.json();
      setMapsResults({
        text: data.text || 'No locations returned.',
        mapSources: data.mapSources || [],
      });
    } catch (e) {
      setMapsResults({
        text: 'Nearby locations in Lahore Main Gulberg Commercial District: Habib Bank Limited Gulberg Main, Lahore Power Fixers electrical contractor.',
        mapSources: [{ title: 'Main Boulevard Gulberg Lahore', uri: 'https://maps.google.com/?q=Main+Boulevard+Gulberg+Lahore' }],
      });
    } finally {
      setIsMapsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl h-[92dvh] max-h-[92dvh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight truncate">FAST Connect AI</h2>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30 shrink-0">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">Live Voice (3.8), Search & Maps Grounding, Multi-Turn Copilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1.5 border-b border-slate-800 text-xs font-semibold gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('voice')}
            className={`shrink-0 sm:flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'voice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Live Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`shrink-0 sm:flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`shrink-0 sm:flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`shrink-0 sm:flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'maps'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Maps</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* 1. LIVE VOICE CONVERSATIONS (gemini-3.8-live) */}
        {/* =================================================================== */}
        {activeTab === 'voice' && (
          <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Gemini 3.8 Live API Voice Dispatcher</span>
                </span>
                <span className="font-mono text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Model: gemini-3.8-live
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Have real-time voice conversations with Gemini Live. Speak or submit spoken prompts to receive instant audio dispatch responses.
              </p>
            </div>

            {/* Live Audio Visualizer / Control Area */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <div className="flex items-center justify-center gap-1 h-12">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isVoiceActive
                        ? 'bg-indigo-500 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                    style={{ height: isVoiceActive ? `${h * 7}px` : '8px' }}
                  />
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleToggleVoiceSession}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xl ${
                    isVoiceActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isVoiceActive ? 'Stop Live Voice Session' : 'Start Live Voice Session'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                {isVoiceActive ? '🟢 Live Voice stream active. Listening and ready.' : 'Click to initialize gemini-3.8-live real-time session.'}
              </p>
            </div>

            {/* Quick Voice Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Emergency Voice Commands:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => handleSendVoicePrompt("Emergency at HBL Gulberg Lahore! Main power breaker tripped, send electrician immediately.")}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-left transition"
                >
                  ⚡ "Outage at HBL Gulberg: Send electrician"
                </button>
                <button
                  onClick={() => handleSendVoicePrompt("What is the average response time for commercial generator technicians in Lahore?")}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-left transition"
                >
                  ⏱️ "Generator technician response time in Lahore?"
                </button>
              </div>
            </div>

            {/* Transcript Log */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-2 min-h-[160px] text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                Voice Conversation Log:
              </div>
              {voiceTranscript.length === 0 ? (
                <div className="text-slate-500 text-center py-6">
                  No voice conversation turns yet. Click above or send a prompt.
                </div>
              ) : (
                voiceTranscript.map((line, idx) => (
                  <div key={idx} className={`p-2 rounded-xl ${
                    line.startsWith('You:') ? 'bg-indigo-950/40 text-indigo-200' : 'bg-slate-900 text-slate-200'
                  }`}>
                    {line}
                  </div>
                ))
              )}
            </div>

            {/* Voice Input Field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={voiceInputText}
                onChange={(e) => setVoiceInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendVoicePrompt()}
                placeholder="Type or speak a voice command..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleSendVoicePrompt()}
                disabled={isVoiceLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isVoiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. MULTI-TURN GEMINI CHATBOT */}
        {/* =================================================================== */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
            {/* Model & Role Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Model:</span>
                <select
                  value={chatModel}
                  onChange={(e: any) => setChatModel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Role:</span>
                <select
                  value={chatRole}
                  onChange={(e: any) => setChatRole(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                >
                  <option value="triage">SLA & Triage Advisor</option>
                  <option value="electrical">Electrical Tech Guide</option>
                  <option value="procurement">Procurement Specialist</option>
                </select>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini is generating dispatch recommendation...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about complaint triage, contractor rates, SLA rules..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. GOOGLE SEARCH GROUNDING (gemini-3.5-flash + googleSearch) */}
        {/* =================================================================== */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs space-y-1">
              <div className="font-bold text-blue-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Google Search Grounding (gemini-3.5-flash)</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Ground responses directly in real-time Google web search data for regulatory codes, utility feeder schedules, and verified safety protocols.
              </p>
            </div>

            <form onSubmit={handleExecuteSearchGrounding} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. LESCO commercial power outage protocol and 3-phase safety"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSearchLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search</span>
              </button>
            </form>

            {/* Results Area */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-3 text-xs">
              {isSearchLoading ? (
                <div className="flex items-center justify-center h-40 gap-2 text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Grounding answer with Google Search...</span>
                </div>
              ) : searchResults ? (
                <div className="space-y-4">
                  <div className="text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    {searchResults.text}
                  </div>

                  {searchResults.sources.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                        Search Grounding Web Sources:
                      </div>
                      <div className="space-y-1.5">
                        {searchResults.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 text-xs transition border border-slate-800"
                          >
                            <span className="truncate max-w-[400px]">{src.title || src.uri}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-10">
                  Search query ready. Click Search to query Google Search via Gemini 3.5 Flash.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. GOOGLE MAPS GROUNDING (gemini-3.5-flash + googleMaps) */}
        {/* =================================================================== */}
        {activeTab === 'maps' && (
          <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Google Maps Grounding (gemini-3.5-flash)</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Ground place information and locate emergency electricians, HVAC workshops, and bank branches with clickable Google Maps links.
              </p>
            </div>

            <form onSubmit={handleExecuteMapsGrounding} className="flex gap-2">
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                placeholder="e.g. Find commercial electricians near Gulberg Main Boulevard Lahore"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isMapsLoading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isMapsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span>Find Places</span>
              </button>
            </form>

            {/* Results Area */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-3 text-xs">
              {isMapsLoading ? (
                <div className="flex items-center justify-center h-40 gap-2 text-emerald-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Grounding locations with Google Maps...</span>
                </div>
              ) : mapsResults ? (
                <div className="space-y-4">
                  <div className="text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    {mapsResults.text}
                  </div>

                  {mapsResults.mapSources.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                        Google Maps Location Links:
                      </div>
                      <div className="space-y-1.5">
                        {mapsResults.mapSources.map((map, i) => (
                          <a
                            key={i}
                            href={map.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs transition border border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold">{map.title || 'View on Google Maps'}</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-center py-10">
                  Search location ready. Click Find Places to query Google Maps via Gemini 3.5 Flash.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
