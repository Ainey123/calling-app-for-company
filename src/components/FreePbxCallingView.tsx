import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Volume2, 
  Server, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  Shield, 
  Activity, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  Copy, 
  Save, 
  Key, 
  Users, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Delete,
  Terminal,
  Radio
} from 'lucide-react';
import { FreePbxConnectionConfig, SipRegistrationState, SipCallSession, CompanyEmployee } from '../types';
import { sipManager } from '../services/sipManager';
import { companyCallStore } from '../services/companyCallStore';
import { soundEngine } from '../utils/audio';

interface FreePbxCallingViewProps {
  config: FreePbxConnectionConfig;
  onSaveConfig: (cfg: FreePbxConnectionConfig) => void;
  employees: CompanyEmployee[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onCallLogged?: (log: any) => void;
}

export const FreePbxCallingView: React.FC<FreePbxCallingViewProps> = ({
  config,
  onSaveConfig,
  employees,
  onShowToast,
  onCallLogged,
}) => {
  // FreePBX Form State
  const [form, setForm] = useState<FreePbxConnectionConfig>(config);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // PBX Live State
  const [sipStatus, setSipStatus] = useState<SipRegistrationState>(sipManager.getRegistrationState());
  const [statusMessage, setStatusMessage] = useState<string>(sipManager.getLastMessage());
  const [activeSession, setActiveSession] = useState<SipCallSession | null>(sipManager.getActiveSession());
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [callTimerSeconds, setCallTimerSeconds] = useState<number>(0);

  // Dialer State
  const [dialNumber, setDialNumber] = useState<string>('');
  const [isDialing, setIsDialing] = useState(false);

  // Setup Guide Toggle
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Sync Form when external config changes
  useEffect(() => {
    setForm(config);
  }, [config]);

  // Subscribe to sipManager events
  useEffect(() => {
    const unsubStatus = sipManager.onStatusChange((state, msg) => {
      setSipStatus(state);
      if (msg) setStatusMessage(msg);
    });

    const unsubSession = sipManager.onSessionChange((session) => {
      setActiveSession(session);
      if (!session) {
        setCallTimerSeconds(0);
        setIsDialing(false);
      }
    });

    const unsubAudio = sipManager.onAudioLevel((lvl) => {
      setMicAudioLevel(lvl);
    });

    return () => {
      unsubStatus();
      unsubSession();
      unsubAudio();
    };
  }, []);

  // Call duration counter
  useEffect(() => {
    let interval: any = null;
    if (activeSession && activeSession.state === 'connected') {
      interval = setInterval(() => {
        setCallTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession?.state]);

  // Re-generate serverUrl when host or port changes
  const handleHostChange = (host: string) => {
    const cleanHost = host.trim();
    const serverUrl = `wss://${cleanHost}:${form.wssPort}${form.wssPath || '/ws'}`;
    setForm((prev) => ({
      ...prev,
      host: cleanHost,
      domain: cleanHost,
      serverUrl,
    }));
  };

  const handlePortChange = (port: number) => {
    const serverUrl = `wss://${form.host}:${port}${form.wssPath || '/ws'}`;
    setForm((prev) => ({
      ...prev,
      wssPort: port,
      serverUrl,
    }));
  };

  // Connect to FreePBX
  const handleConnectFreePbx = async () => {
    if (!form.host) {
      onShowToast('Please enter your FreePBX Server IP or Hostname.', 'error');
      return;
    }
    if (!form.extension) {
      onShowToast('Please enter your Extension number (e.g. 101).', 'error');
      return;
    }

    try {
      sipManager.unlockAudio();
      onShowToast(`Initiating connection to FreePBX (${form.serverUrl})...`, 'info');
      await sipManager.registerFreePbx(form);
    } catch (err: any) {
      onShowToast(`Failed to connect: ${err.message}`, 'error');
    }
  };

  // Disconnect from FreePBX
  const handleDisconnect = async () => {
    try {
      await sipManager.disconnectFreePbx();
      onShowToast('Disconnected from FreePBX.', 'info');
    } catch (e: any) {
      onShowToast(`Disconnect error: ${e.message}`, 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(form);
      onShowToast('FreePBX connection settings saved & synced.', 'success');
    } catch (e) {
      onShowToast('Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Dialpad Key Click
  const handleKeypadPress = (digit: string) => {
    soundEngine.playDtmf(digit);
    setDialNumber((prev) => prev + digit);
  };

  // Outbound Call
  const handleStartCall = async (targetNumber?: string) => {
    const target = (targetNumber || dialNumber).trim();
    if (!target) {
      onShowToast('Please enter a phone number or extension to dial.', 'error');
      return;
    }

    if (sipStatus !== 'registered') {
      onShowToast('Cannot make call: FreePBX is not registered. Please connect first.', 'error');
      return;
    }

    try {
      sipManager.unlockAudio();
      setIsDialing(true);
      const success = await sipManager.call(target, `Client Contact (${target})`);
      if (success) {
        onShowToast(`Dialing ${target} via FreePBX SIP trunk...`, 'info');
      } else {
        setIsDialing(false);
      }
    } catch (err: any) {
      setIsDialing(false);
      onShowToast(`Call failed: ${err.message}`, 'error');
    }
  };

  // End Call
  const handleEndCall = async () => {
    try {
      soundEngine.playHangupChime();
      await sipManager.hangupCall();
      onShowToast('Call ended.', 'info');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDialing(false);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    sipManager.toggleMute();
  };

  // Toggle Hold
  const handleToggleHold = () => {
    sipManager.toggleHold();
  };

  // Format Call Timer
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Status Badge Colors & Labels
  const getStatusBadge = () => {
    switch (sipStatus) {
      case 'registered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Registered with FreePBX (Ext {form.extension})
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            Connecting to FreePBX...
          </span>
        );
      case 'call-in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            Live Call in Progress
          </span>
        );
      case 'registration-failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Registration Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <WifiOff className="w-3 h-3 text-slate-500" />
            Offline / Disconnected
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Status Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white tracking-tight">FreePBX WebRTC Phone System</h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Connect browser softphone directly to FreePBX via WebSocket Secure (WSS). Make PSTN trunk calls and receive direct inward customer calls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {sipStatus === 'registered' ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <WifiOff className="w-3.5 h-3.5" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectFreePbx}
              disabled={sipStatus === 'connecting'}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 transition shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
            >
              <Wifi className="w-4 h-4" />
              {sipStatus === 'connecting' ? 'Connecting...' : 'Connect & Register Ext'}
            </button>
          )}

          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
            title="Setup Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            FreePBX Guide
          </button>
        </div>
      </div>

      {/* FreePBX Setup Checklist Accordion (Expandable) */}
      {isGuideOpen && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-700/40 shadow-xl text-slate-300 text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              How to configure FreePBX for WebRTC in 5 Steps
            </h3>
            <button
              onClick={() => setIsGuideOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px]">1</span>
                Create or Edit PJSIP Extension
              </div>
              <p className="text-slate-400 leading-relaxed">
                In FreePBX Admin &rarr; <strong>Applications &rarr; Extensions</strong>. Select your extension (e.g. <code>101</code>). Set the <strong>Secret</strong> (password).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px]">2</span>
                Enable WebRTC on Extension
              </div>
              <p className="text-slate-400 leading-relaxed">
                Under the extension's <strong>Advanced</strong> tab:
                <br />• <strong>Enable WebRTC:</strong> <code>Yes</code>
                <br />• <strong>Media Encryption:</strong> <code>SRTP (DTLS-SRTP)</code>
                <br />• <strong>Transport:</strong> <code>0.0.0.0-wss</code>
                <br />• <strong>dtls_enable:</strong> <code>Yes</code>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px]">3</span>
                Enable Asterisk HTTP Server (Port 8089)
              </div>
              <p className="text-slate-400 leading-relaxed">
                In FreePBX &rarr; <strong>Settings &rarr; Advanced Settings</strong>:
                <br />• <strong>Enable mini-HTTP Server:</strong> <code>Yes</code>
                <br />• <strong>Enable TLS for mini-HTTP Server:</strong> <code>Yes</code>
                <br />• <strong>HTTPS Bind Port:</strong> <code>8089</code>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px]">4</span>
                SSL Certificate / WSS Trust (Important!)
              </div>
              <p className="text-slate-400 leading-relaxed">
                Because this web app runs on <strong>HTTPS</strong>, your browser blocks <code>wss://</code> if the certificate is untrusted.
                <br />If using a self-signed cert on FreePBX, click the <strong>"Test / Accept SSL Certificate"</strong> button below to open port 8089 in a new tab and click "Proceed".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Softphone & Dialpad (7 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-white text-base">FreePBX WebRTC Softphone</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                  Ext: {form.extension || 'Not Set'}
                </span>
              </div>

              {/* Active Call Live Card */}
              {activeSession ? (
                <div className="p-5 rounded-xl bg-gradient-to-b from-indigo-950/80 to-slate-950 border border-indigo-500/40 shadow-inner mb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                        {activeSession.direction === 'inbound' ? '📞 Incoming Call' : '📱 Outbound Call'}
                      </div>
                      <div className="text-lg font-black text-white mt-0.5">
                        {activeSession.callerDisplayName || activeSession.remoteTarget}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {activeSession.remoteTarget}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {formatTimer(callTimerSeconds)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {activeSession.state}
                      </span>
                    </div>
                  </div>

                  {/* Audio Level Visualizer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mic className="w-3 h-3 text-emerald-400" /> Microphone Live Input
                      </span>
                      <span className="font-mono text-emerald-400">{Math.round(micAudioLevel * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                        style={{ width: `${Math.min(micAudioLevel * 250, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Call Controls */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={handleToggleMute}
                      className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition ${
                        activeSession.isMuted
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {activeSession.isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-slate-300" />}
                      {activeSession.isMuted ? 'Unmute' : 'Mute'}
                    </button>

                    <button
                      onClick={handleToggleHold}
                      className={`p-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition ${
                        activeSession.isHeld
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {activeSession.isHeld ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-300" />}
                      {activeSession.isHeld ? 'Resume' : 'Hold'}
                    </button>

                    <button
                      onClick={handleEndCall}
                      className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex flex-col items-center gap-1 transition shadow-lg shadow-rose-950 cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      End Call
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Number Input Display */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter phone number or extension (e.g. 102)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-center text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                />
                {dialNumber && (
                  <button
                    onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Backspace"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Telephone Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-5">
                {[
                  { digit: '1', sub: ' ' },
                  { digit: '2', sub: 'ABC' },
                  { digit: '3', sub: 'DEF' },
                  { digit: '4', sub: 'GHI' },
                  { digit: '5', sub: 'JKL' },
                  { digit: '6', sub: 'MNO' },
                  { digit: '7', sub: 'PQRS' },
                  { digit: '8', sub: 'TUV' },
                  { digit: '9', sub: 'WXYZ' },
                  { digit: '*', sub: ' ' },
                  { digit: '0', sub: '+' },
                  { digit: '#', sub: ' ' },
                ].map(({ digit, sub }) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className="h-13 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-indigo-600 active:text-white border border-slate-700/60 flex flex-col items-center justify-center transition cursor-pointer select-none group"
                  >
                    <span className="text-base font-extrabold text-white group-hover:text-indigo-300">
                      {digit}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium tracking-widest -mt-0.5">
                      {sub}
                    </span>
                  </button>
                ))}
              </div>

              {/* Call Action Button */}
              <button
                onClick={() => handleStartCall()}
                disabled={!dialNumber || isDialing || !!activeSession}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-950/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                {isDialing ? 'Dialing...' : 'Call via FreePBX Trunk'}
              </button>
            </div>

            {/* Quick Extension Speed Dial */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Internal Team Directory & Speed Dial
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setDialNumber(emp.simNumber);
                    }}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-white truncate group-hover:text-indigo-300">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{emp.simNumber}</div>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/50 shrink-0">
                      Fill
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: FreePBX Connection & Settings (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-white text-base">FreePBX Server Connection</h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                PJSIP WebRTC
              </span>
            </div>

            <div className="space-y-4">
              {/* Server Host / IP */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  FreePBX Host / IP Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.host}
                    onChange={(e) => handleHostChange(e.target.value)}
                    placeholder="e.g. pbx.yourcompany.com or 192.168.1.100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  The domain or IP where your FreePBX / Asterisk server is installed.
                </p>
              </div>

              {/* Port & Extension in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    WSS Port <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.wssPort}
                    onChange={(e) => handlePortChange(parseInt(e.target.value) || 8089)}
                    placeholder="8089"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    FreePBX default mini-HTTP TLS is port 8089.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Extension Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.extension}
                    onChange={(e) => setForm({ ...form, extension: e.target.value.trim() })}
                    placeholder="101"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your PJSIP extension in FreePBX (e.g. 101, 102).
                  </p>
                </div>
              </div>

              {/* SIP Secret / Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  SIP Password / Secret <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.secret}
                    onChange={(e) => setForm({ ...form, secret: e.target.value })}
                    placeholder="Enter extension secret configured in FreePBX..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Display Name & STUN Server in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Operations Desk 1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    STUN Server
                  </label>
                  <input
                    type="text"
                    value={form.stunServer}
                    onChange={(e) => setForm({ ...form, stunServer: e.target.value })}
                    placeholder="stun:stun.l.google.com:19302"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* WebSocket URL Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                <span className="truncate pr-2">
                  <span className="text-slate-500">WSS Target:</span>{' '}
                  <span className="text-indigo-300 font-bold">{form.serverUrl}</span>
                </span>
                <span className="text-slate-500 text-[10px]">AOR: sip:{form.extension}@{form.domain}</span>
              </div>

              {/* SSL Certificate Helper Link */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-300">Using Self-Signed SSL on FreePBX?</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    If your FreePBX server uses a self-signed certificate, your browser will block WSS connections until you accept it. Open the link below once and click <em>"Advanced &rarr; Proceed"</em>:
                  </p>
                  <a
                    href={`https://${form.host}:${form.wssPort}${form.wssPath || '/ws'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline mt-1"
                  >
                    Open https://{form.host}:{form.wssPort}/ws to Accept Certificate
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleConnectFreePbx}
                  disabled={sipStatus === 'connecting'}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-950 cursor-pointer disabled:opacity-50"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  {sipStatus === 'registered' ? 'Re-Connect Ext' : 'Connect & Register'}
                </button>

                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {/* Status Message Log Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Live Telephony Subsystem Notice:
                </div>
                <div className="text-slate-300 break-words">
                  {statusMessage || 'Idle'}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
