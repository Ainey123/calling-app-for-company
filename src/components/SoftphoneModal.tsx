import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  PhoneForwarded, 
  Delete, 
  FileText, 
  X, 
  Maximize2, 
  Minimize2, 
  Radio,
  PlusCircle,
  CheckCircle2,
  Volume2,
  Smartphone
} from 'lucide-react';
import { EmployeeExtension, ComplaintTicket, SipPbxConfig, SipRegistrationState } from '../types';
import { soundEngine } from '../utils/audio';
import { sipManager } from '../services/sipManager';

interface ActiveCallData {
  number: string;
  name: string;
  organization: string;
  branch: string;
  direction: 'inbound' | 'outbound';
  startTime: number;
  durationSeconds: number;
  isOnHold: boolean;
  isMuted: boolean;
  linkedTicketId?: string;
  notes: string;
}

interface SoftphoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExtension: EmployeeExtension;
  extensions: EmployeeExtension[];
  activeCall: ActiveCallData | null;
  onStartCall: (number: string, name?: string, org?: string, branch?: string) => void;
  onEndCall: () => void;
  onToggleHold: () => void;
  onToggleMute: () => void;
  onTransferCall: (targetExt: EmployeeExtension) => void;
  onUpdateCallNotes: (notes: string) => void;
  onLinkToTicket: (ticketId: string) => void;
  onCreateTicketFromCall: () => void;
  existingTickets: ComplaintTicket[];
  pbxConfig?: SipPbxConfig;
  sipStatus?: SipRegistrationState;
  sipStatusMessage?: string;
  onOpenPbxSettings?: () => void;
  onlineExtensions?: Array<{ extension: string; name: string }>;
  onOpenSimCallingTab?: () => void;
}

export const SoftphoneModal: React.FC<SoftphoneModalProps> = ({
  isOpen,
  onClose,
  currentExtension,
  extensions,
  activeCall,
  onStartCall,
  onEndCall,
  onToggleHold,
  onToggleMute,
  onTransferCall,
  onUpdateCallNotes,
  onLinkToTicket,
  onCreateTicketFromCall,
  existingTickets,
  pbxConfig,
  sipStatus = 'unregistered',
  sipStatusMessage = '',
  onOpenPbxSettings,
  onlineExtensions = [],
  onOpenSimCallingTab,
}) => {
  const [dialNumber, setDialNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'keypad' | 'sim' | 'notes' | 'transfer' | 'speeddial'>('keypad');
  const [simSlotChoice, setSimSlotChoice] = useState<'SIM 1' | 'SIM 2'>('SIM 1');
  const [isMinimized, setIsMinimized] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioTestStatus, setAudioTestStatus] = useState<string>('');

  // Switch to live voice tab automatically when a call connects
  useEffect(() => {
    if (activeCall) {
      setActiveTab('live');
    }
  }, [activeCall?.startTime]);

  useEffect(() => {
    const unsubAudio = sipManager.onAudioLevel((lvl) => {
      setMicAudioLevel(lvl);
    });
    const unsubRemote = sipManager.onRemoteAudioLevel((lvl) => {
      setRemoteAudioLevel(lvl);
    });
    return () => {
      unsubAudio();
      unsubRemote();
    };
  }, []);

  // Keypad keys
  const keys = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: '' },
    { num: '0', sub: '+' },
    { num: '#', sub: '' },
  ];

  const handleKeyPress = (char: string) => {
    soundEngine.playDtmf(char);
    if (!activeCall) {
      setDialNumber((prev) => prev + char);
    } else {
      sipManager.sendDtmf(char);
    }
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Speed dial presets
  const speedDials = [
    {
      name: 'Habib Bank - Lahore Gulberg',
      number: '+92 42 35789012',
      org: 'Habib Bank Limited (HBL)',
      branch: 'Main Gulberg Branch',
      type: 'Bank Client',
    },
    {
      name: 'Tariq Electrician (Lahore Power Fixers)',
      number: '+92 300 8492011',
      org: 'Lahore Power Fixers',
      branch: 'Gulberg Depot',
      type: 'Emergency Vendor',
    },
    {
      name: 'Zahid Hussain (Rapid Volt)',
      number: '+92 321 4455890',
      org: 'Rapid Volt Engineering',
      branch: 'DHA Lahore',
      type: 'Electrical Contractor',
    },
    {
      name: 'Allied Bank - Mall Road',
      number: '+92 42 37351982',
      org: 'Allied Bank Limited (ABL)',
      branch: 'Mall Road Branch',
      type: 'Bank Client',
    },
    {
      name: 'CoolTech HVAC Lahore',
      number: '+92 333 5123984',
      org: 'CoolTech Solutions',
      branch: 'Lahore Central',
      type: 'AC Specialist',
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 max-h-[85dvh] overflow-y-auto ${
        isMinimized
          ? 'bottom-20 right-2 sm:bottom-4 sm:right-4 w-72 max-w-[calc(100vw-16px)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden'
          : 'bottom-20 left-2 right-2 sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 max-w-[calc(100vw-16px)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10'
      }`}
    >
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>FAST Softphone</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                Ext {currentExtension.extension}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {activeCall ? 'Live Call Session' : 'Ready for Inbound/Outbound'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition"
            title={isMinimized ? 'Expand Softphone' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white rounded hover:bg-slate-800 transition"
            title="Close Dialpad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PBX Live Telephony Status Bar */}
      <div className="px-3.5 py-1.5 bg-slate-950/95 border-b border-slate-800/90 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 truncate">
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            sipStatus === 'registered' ? 'bg-emerald-400 animate-pulse' :
            sipStatus === 'connecting' ? 'bg-amber-400 animate-ping' :
            sipStatus === 'call-in-progress' ? 'bg-blue-400 animate-pulse' :
            'bg-rose-500'
          }`} />
          <span className="font-mono text-slate-300 truncate">
            {sipStatus === 'registered' 
              ? (pbxConfig?.transport === 'wss' ? `PBX: ${currentExtension.extension}@${pbxConfig.domain || 'asterisk'}` : `WebRTC Bridge: Ext ${currentExtension.extension}`)
              : (sipStatusMessage || `PBX ${sipStatus}`)}
          </span>
        </div>
        {onOpenPbxSettings && (
          <button
            type="button"
            onClick={onOpenPbxSettings}
            className="text-[10px] text-amber-400 hover:text-amber-300 underline shrink-0 cursor-pointer ml-2"
          >
            PBX Config
          </button>
        )}
      </div>

      {/* Minimized Bar */}
      {isMinimized ? (
        <div className="p-3 text-xs flex items-center justify-between bg-slate-950">
          {activeCall ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white truncate max-w-[140px]">{activeCall.name}</span>
              <span className="font-mono text-emerald-400 text-[11px]">{formatDuration(activeCall.durationSeconds)}</span>
            </div>
          ) : (
            <span className="text-slate-400">PBX Softphone Ready</span>
          )}
          <button
            onClick={() => setIsMinimized(false)}
            className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]"
          >
            Open
          </button>
        </div>
      ) : (
        <div className="p-4 bg-slate-900/90 text-slate-100">
          {/* Active Call In-Progress View */}
          {activeCall ? (
            <div className="space-y-4">
              {/* Call Profile Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-800/90 to-slate-950 border border-slate-700/60 text-center relative overflow-hidden">
                {/* Visualizer Sound Waves */}
                {!activeCall.isOnHold && (
                  <div className="flex items-center justify-center gap-1.5 h-7 mb-2">
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-1"></span>
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-2"></span>
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-3"></span>
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-4"></span>
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-5"></span>
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-2"></span>
                    <span className="w-1 bg-emerald-400 rounded-full animate-soundwave-4"></span>
                  </div>
                )}

                {activeCall.isOnHold && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold animate-pulse">
                    <Pause className="w-3 h-3" />
                    CALL ON HOLD (Chime Playing)
                  </div>
                )}

                <div className="text-base font-bold text-white truncate">{activeCall.name}</div>
                <div className="text-xs text-indigo-300 font-medium truncate mt-0.5">
                  {activeCall.organization} {activeCall.branch ? `• ${activeCall.branch}` : ''}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">{activeCall.number}</div>

                {/* Live Call Duration */}
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-400">
                  {formatDuration(activeCall.durationSeconds)}
                </div>

                {/* Call Recording Notice */}
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 bg-slate-900/60 py-1 px-2 rounded-md border border-slate-800">
                  <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                  <span>Call is being recorded with consent & notice</span>
                </div>

                {/* Real-time WebRTC Audio Codec & Mic Level */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      WebRTC HD Voice • Opus 48kHz
                    </span>
                    <span className="font-mono text-slate-500">
                      {activeCall.isMuted ? 'MIC MUTED' : 'MIC ACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className={`w-3 h-3 ${activeCall.isMuted ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-75 ${activeCall.isMuted ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: activeCall.isMuted ? '0%' : `${Math.max(micAudioLevel, 8)}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-400 text-[9px] w-6 text-right">
                      {activeCall.isMuted ? '0%' : `${micAudioLevel}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Call Tab Switcher */}
              <div className="flex border-b border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`flex-1 py-1.5 border-b-2 flex items-center justify-center gap-1 transition ${
                    activeTab === 'live'
                      ? 'border-indigo-500 text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Live Voice</span>
                </button>
                <button
                  onClick={() => setActiveTab('keypad')}
                  className={`flex-1 py-1.5 border-b-2 transition ${
                    activeTab === 'keypad'
                      ? 'border-indigo-500 text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dialpad
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 py-1.5 border-b-2 transition ${
                    activeTab === 'notes'
                      ? 'border-indigo-500 text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`flex-1 py-1.5 border-b-2 transition ${
                    activeTab === 'transfer'
                      ? 'border-indigo-500 text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* Tab 0: Direct Two-Way Live Voice Calling Screen */}
              {activeTab === 'live' && (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Direct Voice Connected
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Full Duplex HD
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Two-way continuous voice calling active. Speak naturally into your microphone — no buttons to press to talk.
                    </p>
                  </div>

                  {/* Dual Live Audio VU Meters */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Meter 1: Local Microphone (Outgoing Voice) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                          <Mic className={`w-3.5 h-3.5 ${activeCall.isMuted ? 'text-rose-400' : 'text-emerald-400'}`} />
                          Your Microphone (Desk Ext {currentExtension.extension}):
                        </span>
                        <span className={`font-mono text-[10px] font-bold ${activeCall.isMuted ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {activeCall.isMuted ? 'MUTED' : micAudioLevel > 15 ? 'Speaking...' : 'Ready / Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-75 ${activeCall.isMuted ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: activeCall.isMuted ? '0%' : `${Math.max(micAudioLevel, 4)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-400 text-[10px] w-8 text-right">
                          {activeCall.isMuted ? '0%' : `${micAudioLevel}%`}
                        </span>
                      </div>
                    </div>

                    {/* Meter 2: Remote Caller Voice (Incoming Voice) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-300 flex items-center gap-1.5">
                          <Volume2 className={`w-3.5 h-3.5 ${remoteAudioLevel > 15 ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
                          Remote Audio ({activeCall.name}):
                        </span>
                        <span className={`font-mono text-[10px] font-bold ${remoteAudioLevel > 15 ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {remoteAudioLevel > 15 ? 'Receiving Voice...' : 'Connected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-cyan-500 to-indigo-500"
                            style={{ width: `${Math.max(remoteAudioLevel, 4)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-400 text-[10px] w-8 text-right">
                          {remoteAudioLevel}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Caller Details & Quick Notes Summary */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Call Information</div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Direction:</span>
                      <span className="font-medium text-white capitalize">{activeCall.direction} Call</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Endpoint / Trunk:</span>
                      <span className="font-mono text-indigo-300">{activeCall.number}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Connection Time:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatDuration(activeCall.durationSeconds)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Keypad during call for IVR/DTMF */}
              {activeTab === 'keypad' && (
                <div className="grid grid-cols-3 gap-2">
                  {keys.map((k) => (
                    <button
                      key={k.num}
                      onClick={() => handleKeyPress(k.num)}
                      className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold flex flex-col items-center justify-center transition border border-slate-700/60 cursor-pointer shadow-sm"
                    >
                      <span className="text-sm font-bold">{k.num}</span>
                      {k.sub && <span className="text-[9px] text-slate-400 font-normal">{k.sub}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 2: Call Notes & Complaint Linking */}
              {activeTab === 'notes' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Officer Call Notes:
                    </span>
                    {activeCall.linkedTicketId ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Linked: {activeCall.linkedTicketId}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400">Unlinked Call</span>
                    )}
                  </div>

                  <textarea
                    value={activeCall.notes}
                    onChange={(e) => onUpdateCallNotes(e.target.value)}
                    placeholder="Document caller complaint, breaker status, bank branch details, technician instructions..."
                    rows={4}
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  {/* Complaint Ticket Actions */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    {!activeCall.linkedTicketId ? (
                      <>
                        <button
                          onClick={onCreateTicketFromCall}
                          className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Create New Complaint Ticket from this Call
                        </button>

                        <div className="text-[11px] text-slate-400 text-center font-medium my-0.5">or link to existing:</div>

                        <select
                          onChange={(e) => {
                            if (e.target.value) onLinkToTicket(e.target.value);
                          }}
                          defaultValue=""
                          className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:border-indigo-500"
                        >
                          <option value="" disabled>Select Existing Ticket...</option>
                          {existingTickets.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.id} - {t.organization} ({t.category})
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>This conversation will be attached to ticket <strong>{activeCall.linkedTicketId}</strong> upon hanging up.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Transfer to another Employee Extension */}
              {activeTab === 'transfer' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-300 font-semibold mb-1">
                    Transfer call to extension:
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {extensions
                      .filter((e) => e.extension !== currentExtension.extension)
                      .map((ext) => (
                        <button
                          key={ext.id}
                          onClick={() => onTransferCall(ext)}
                          className="w-full p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-left flex items-center justify-between text-xs transition border border-slate-700/60 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={ext.avatar} alt={ext.name} className="w-7 h-7 rounded-full object-cover" />
                            <div>
                              <div className="font-semibold text-white">{ext.name}</div>
                              <div className="text-[10px] text-slate-400">{ext.role}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-700 font-bold">
                              Ext {ext.extension}
                            </span>
                            <PhoneForwarded className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* In-Call Action Controls */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-4 gap-2">
                {/* Mute */}
                <button
                  onClick={onToggleMute}
                  className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition text-xs font-semibold cursor-pointer border ${
                    activeCall.isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {activeCall.isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                  <span className="text-[10px]">{activeCall.isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                {/* Hold */}
                <button
                  onClick={onToggleHold}
                  className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition text-xs font-semibold cursor-pointer border ${
                    activeCall.isOnHold
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {activeCall.isOnHold ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
                  <span className="text-[10px]">{activeCall.isOnHold ? 'Resume' : 'Hold'}</span>
                </button>

                {/* Transfer */}
                <button
                  onClick={() => setActiveTab('transfer')}
                  className="p-2.5 rounded-xl flex flex-col items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition text-xs font-semibold cursor-pointer"
                >
                  <PhoneForwarded className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px]">Transfer</span>
                </button>

                {/* End Call */}
                <button
                  onClick={onEndCall}
                  className="p-2.5 rounded-xl flex flex-col items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white transition text-xs font-semibold cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="text-[10px]">End Call</span>
                </button>
              </div>
            </div>
          ) : (
            /* Idle Dialer View */
            <div className="space-y-3.5">
              {/* Tabs: Keypad vs SIM Calling vs Speed Dial */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium gap-1">
                <button
                  onClick={() => setActiveTab('keypad')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    activeTab === 'keypad'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dialpad (PBX)
                </button>
                <button
                  onClick={() => setActiveTab('sim')}
                  className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                    activeTab === 'sim'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SIM Call</span>
                </button>
                <button
                  onClick={() => setActiveTab('speeddial')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    activeTab === 'speeddial'
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Directory
                </button>
              </div>

              {activeTab === 'keypad' && (
                <>
                  {/* Dial Output Screen */}
                  <div className="relative">
                    <input
                      type="text"
                      value={dialNumber}
                      onChange={(e) => setDialNumber(e.target.value)}
                      placeholder="Enter phone or extension..."
                      className="w-full pl-4 pr-10 py-3 text-center text-lg font-mono font-bold tracking-wider bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    {dialNumber && (
                      <button
                        onClick={handleBackspace}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 12-Key PBX DTMF Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {keys.map((k) => (
                      <button
                        key={k.num}
                        onClick={() => handleKeyPress(k.num)}
                        className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-900 active:scale-95 text-white font-bold flex flex-col items-center justify-center transition border border-slate-700/70 shadow-sm cursor-pointer"
                      >
                        <span className="text-base">{k.num}</span>
                        {k.sub && <span className="text-[9px] text-slate-400 font-normal">{k.sub}</span>}
                      </button>
                    ))}
                  </div>

                  {/* Call Initiation Button */}
                  <button
                    onClick={() => {
                      if (!dialNumber) return;
                      // Match speed dial name if possible
                      const match = speedDials.find(s => s.number.includes(dialNumber) || dialNumber.includes(s.number));
                      onStartCall(
                        dialNumber,
                        match?.name || `Contact (${dialNumber})`,
                        match?.org || 'External Caller',
                        match?.branch || 'Lahore Region'
                      );
                    }}
                    disabled={!dialNumber}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                      dialNumber
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Dial Call via Business Trunk</span>
                  </button>

                  {/* Audio Hardware Diagnostic Test */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      disabled={isTestingAudio}
                      onClick={async () => {
                        setIsTestingAudio(true);
                        setAudioTestStatus('Recording 3s audio... Speak now!');
                        const success = await sipManager.testAudioLoopback((stage) => {
                          if (stage === 'recording') setAudioTestStatus('Recording 3s audio... Speak now!');
                          else if (stage === 'playing') setAudioTestStatus('Playing back audio... Check your speakers!');
                          else setAudioTestStatus('Test complete!');
                        });
                        if (success) {
                          setAudioTestStatus('Microphone & Speakers Verified!');
                        } else {
                          setAudioTestStatus('Mic test failed: check browser permissions');
                        }
                        setTimeout(() => {
                          setIsTestingAudio(false);
                          setAudioTestStatus('');
                        }, 4000);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center justify-between transition cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className={`w-3.5 h-3.5 ${isTestingAudio ? 'text-amber-400 animate-spin' : 'text-indigo-400'}`} />
                        <span>{audioTestStatus || 'Test Mic & Speakers (Loopback Audio)'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">3s Echo</span>
                    </button>
                  </div>
                </>
              )}

              {/* Direct Cellular SIM Calling Tab */}
              {activeTab === 'sim' && (
                <div className="space-y-3.5">
                  {/* SIM Slot Radio Selector */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Select Cellular Carrier:</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Dual SIM 4G</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSimSlotChoice('SIM 1')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          simSlotChoice === 'SIM 1'
                            ? 'bg-gradient-to-br from-indigo-950/90 to-slate-950 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">SIM 1</span>
                          <span className={`w-2 h-2 rounded-full ${simSlotChoice === 'SIM 1' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-300 mt-0.5 truncate">Jazz Corporate</div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">+92 300 8492001</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSimSlotChoice('SIM 2')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          simSlotChoice === 'SIM 2'
                            ? 'bg-gradient-to-br from-indigo-950/90 to-slate-950 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">SIM 2</span>
                          <span className={`w-2 h-2 rounded-full ${simSlotChoice === 'SIM 2' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-300 mt-0.5 truncate">Zong Enterprise</div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">+92 312 9401234</div>
                      </button>
                    </div>
                  </div>

                  {/* Number Input Screen */}
                  <div className="relative">
                    <input
                      type="text"
                      value={dialNumber}
                      onChange={(e) => setDialNumber(e.target.value)}
                      placeholder="Enter mobile or bank phone..."
                      className="w-full pl-4 pr-10 py-3 text-center text-base font-mono font-bold tracking-wider bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    {dialNumber && (
                      <button
                        onClick={handleBackspace}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 12-Key PBX DTMF Grid for quick tap */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {keys.slice(0, 9).map((k) => (
                      <button
                        key={k.num}
                        onClick={() => handleKeyPress(k.num)}
                        className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-900 text-white font-bold flex items-center justify-center transition border border-slate-700/60 shadow-sm cursor-pointer"
                      >
                        <span className="text-sm">{k.num}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => handleKeyPress('*')}
                      className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition border border-slate-700/60 cursor-pointer text-sm"
                    >
                      *
                    </button>
                    <button
                      onClick={() => handleKeyPress('0')}
                      className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition border border-slate-700/60 cursor-pointer text-sm"
                    >
                      0
                    </button>
                    <button
                      onClick={() => handleKeyPress('#')}
                      className="h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition border border-slate-700/60 cursor-pointer text-sm"
                    >
                      #
                    </button>
                  </div>

                  {/* Launch SIM Call Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!dialNumber) return;
                      const clean = dialNumber.replace(/[^0-9+]/g, '');
                      // Launch native dialer
                      try {
                        const link = document.createElement('a');
                        link.href = `tel:${clean}`;
                        link.click();
                      } catch {
                        window.location.href = `tel:${clean}`;
                      }
                      soundEngine.playConnectedChime();
                      // Start active call session
                      onStartCall(
                        dialNumber,
                        `Contact (${dialNumber})`,
                        'Client Mobile / Cellular',
                        `${simSlotChoice} Outbound`
                      );
                    }}
                    disabled={!dialNumber}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer ${
                      dialNumber
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Dial via Cellular {simSlotChoice}</span>
                  </button>

                  {/* Switch to full page SIM calling studio */}
                  {onOpenSimCallingTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSimCallingTab();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-xs font-semibold text-indigo-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Open Full Cellular SIM Calling Console</span>
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Speed Dial & Internal Extensions Tab */}
              {activeTab === 'speeddial' && (
                <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                  {/* Internal Office Extensions */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Internal Desk Extensions</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Live WebRTC</span>
                    </div>

                    {extensions
                      .filter((ext) => ext.extension !== currentExtension.extension)
                      .map((ext) => {
                        const isOnline = onlineExtensions.some((o) => o.extension === ext.extension);
                        return (
                          <div
                            key={ext.id}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <img src={ext.avatar} alt={ext.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{ext.name}</span>
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  Ext <strong className="text-indigo-300 font-mono">{ext.extension}</strong> • {ext.role}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => onStartCall(ext.extension, ext.name, 'FAST Connect Internal', ext.department)}
                              className={`px-3 py-1.5 rounded-lg text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0 ${
                                isOnline 
                                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                                  : 'bg-indigo-600 hover:bg-indigo-500'
                              }`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Bank Branches & Emergency Vendors */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Verified Bank Branches & Emergency Vendors
                    </div>

                    {speedDials.map((contact, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-xs transition"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-white truncate">{contact.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{contact.org}</div>
                          <div className="font-mono text-[10px] text-emerald-400 mt-0.5">{contact.number}</div>
                        </div>

                        <button
                          onClick={() => onStartCall(contact.number, contact.name, contact.org, contact.branch)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PBX Trunk Line Info Footer */}
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Trunk: {pbxConfig?.didNumber || '+92 (42) 111-327-800'}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Trunk Line 04 Idle
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
