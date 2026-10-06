import React, { useState } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  Bell, 
  UserCheck, 
  ChevronDown, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  History, 
  TicketCheck, 
  BarChart3, 
  Users2, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ArrowUpRight, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  Database, 
  Trash2, 
  Shield, 
  ShieldCheck,
  Radio, 
  Key,
  Search
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EmployeeExtension, MissedCallAlert, ScheduledCall } from '../types';
import { soundEngine } from '../utils/audio';

interface NavbarProps {
  currentExtension: EmployeeExtension;
  extensions: EmployeeExtension[];
  onSelectExtension: (ext: EmployeeExtension) => void;
  activeTab: 'landing' | 'calls' | 'tickets' | 'softphone' | 'directory' | 'analytics' | 'admin';
  setActiveTab: (tab: 'landing' | 'calls' | 'tickets' | 'softphone' | 'directory' | 'analytics' | 'admin') => void;
  isSoftphoneOpen: boolean;
  setIsSoftphoneOpen: (open: boolean) => void;
  isCallActive: boolean;
  activeCallDuration: number;
  onSimulateIncomingCall: () => void;
  onLaunchScenarioWalkthrough: () => void;
  missedCalls: MissedCallAlert[];
  scheduledCalls?: ScheduledCall[];
  onReturnCall: (number: string, name: string, org: string, branch: string) => void;
  onConvertMissedToTicket: (alert: MissedCallAlert) => void;
  onMarkAlertRead: (id: string) => void;
  onCompleteScheduledCall?: (id: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: User | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onClearDatabase: () => void;
  isAdmin: boolean;
  onOpenLoginModal: () => void;
  onOpenAICopilot: () => void;
  onOpenCommandMenu?: () => void;
  didNumber?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentExtension,
  extensions,
  onSelectExtension,
  activeTab,
  setActiveTab,
  isSoftphoneOpen,
  setIsSoftphoneOpen,
  isCallActive,
  activeCallDuration,
  onSimulateIncomingCall,
  onLaunchScenarioWalkthrough,
  missedCalls,
  scheduledCalls = [],
  onReturnCall,
  onConvertMissedToTicket,
  onMarkAlertRead,
  onCompleteScheduledCall,
  theme,
  onToggleTheme,
  currentUser,
  onSignInGoogle,
  onSignOut,
  onClearDatabase,
  isAdmin,
  onOpenLoginModal,
  onOpenAICopilot,
  onOpenCommandMenu,
  didNumber,
}) => {
  const [showExtDropdown, setShowExtDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<'missed' | 'scheduled'>('missed');
  const [isAudioMuted, setIsAudioMuted] = useState(soundEngine.getIsMuted());

  const unreadMissed = missedCalls.filter(m => !m.isRead);
  const pendingScheduled = scheduledCalls.filter(s => s.status === 'pending');
  const totalNotifications = unreadMissed.length + pendingScheduled.length;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsAudioMuted(muted);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Banner: Trunk Status & Quick Actions */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">FAST Connect PBX:</span>
            <span className="font-mono text-emerald-400 font-medium">{didNumber || '+92 (42) 111-327-800'}</span>
          </div>
          <span className="hidden md:inline text-slate-700">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firestore: <strong className="text-emerald-400 font-mono">Live Persistence Active</strong></span>
          </div>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              Admin Mode Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* AI Intelligence Copilot Button (Live Voice, Search, Maps, Chat) */}
          <button
            onClick={onOpenAICopilot}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/40 transition text-xs font-semibold cursor-pointer shadow-sm group"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">AI Copilot</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-mono font-bold">Live 3.8</span>
          </button>

          {/* User / Employee / Admin Login Modal Trigger */}
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Login / Switch</span>
          </button>

          {/* Wipe / Reset Live Database (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm('SECURITY CONFIRMATION (Admin Only):\nClear all live call logs, tickets, and missed call records from Firestore?')) {
                  onClearDatabase();
                }
              }}
              title="Clear all live records in Firestore (Admin Only)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition text-xs border border-slate-700/60 cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">Reset Database</span>
            </button>
          )}

          {/* Theme Switcher Toggle (Top Bar) */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to High-Contrast Light Theme' : 'Switch to Dark Theme'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs border border-slate-700/60 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={handleToggleSound}
            title={isAudioMuted ? 'Unmute telephone audio & tones' : 'Mute telephone audio & tones'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs border border-slate-700/60"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isAudioMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          {/* Corporate Operations SOP Protocol */}
          <button
            onClick={onLaunchScenarioWalkthrough}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30 transition text-xs font-medium cursor-pointer shadow-sm group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Dispatch SOP</span>
            <span className="sm:hidden">SOP</span>
            <ArrowUpRight className="w-3 h-3 text-indigo-400" />
          </button>

          {/* Test PBX Inbound Line */}
          <button
            onClick={onSimulateIncomingCall}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition text-xs font-medium cursor-pointer"
          >
            <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Line</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Name (Clickable to Landing/Overview) */}
        <button 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          title="Return to Overview Landing Page"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/30 group-hover:scale-105 transition-transform">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white font-sans group-hover:text-indigo-300 transition-colors">
                FAST <span className="text-indigo-400">Connect</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 uppercase tracking-wider">
                PBX & CRM
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Business Softphone & Complaint Dispatch</p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'landing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'calls'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Call History</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TicketCheck className="w-4 h-4" />
            <span>Complaints & Tickets</span>
          </button>

          <button
            onClick={() => setActiveTab('softphone')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'softphone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Softphone</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users2 className="w-4 h-4" />
            <span>Extensions</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          {/* Admin Area Tab */}
          <button
            onClick={() => {
              if (isAdmin) {
                setActiveTab('admin');
              } else {
                onOpenLoginModal();
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Admin Area</span>
            {!isAdmin && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                PIN
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Softphone Toggle, Notifications, Extension Profile, Google Auth */}
        <div className="flex items-center gap-2.5">
          {/* Linear-grade Command Palette shortcut button */}
          {onOpenCommandMenu && (
            <button
              onClick={onOpenCommandMenu}
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.08] hover:border-white/20 transition text-xs font-mono cursor-pointer shadow-sm"
              title="Command Palette (⌘K or Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-sans text-slate-400 hidden xl:inline">Search...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-mono border border-white/10">⌘K</kbd>
            </button>
          )}

          {/* Quick Login / User Portal Box Launcher */}
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition text-xs font-semibold cursor-pointer shadow-sm"
            title="Open Employee & Admin Login Box"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">User Login</span>
          </button>
          {/* Active Call Softphone status pill */}
          {isCallActive ? (
            <button
              onClick={() => setIsSoftphoneOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition text-xs font-medium cursor-pointer animate-pulse"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span>Call Active: <strong>{formatDuration(activeCallDuration)}</strong></span>
            </button>
          ) : (
            <button
              onClick={() => setIsSoftphoneOpen(!isSoftphoneOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${
                isSoftphoneOpen
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Phone className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Softphone</span>
            </button>
          )}

          {/* Missed Call Alerts & Scheduled Follow-ups Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60"
              title="Notifications & Follow-Up Reminders"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                  {totalNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Notification Tabs */}
                <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setNotifTab('missed')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      notifTab === 'missed'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5 text-rose-400" />
                    <span>Missed ({unreadMissed.length})</span>
                  </button>

                  <button
                    onClick={() => setNotifTab('scheduled')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      notifTab === 'scheduled'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Follow-Ups ({pendingScheduled.length})</span>
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifTab === 'missed' ? (
                    missedCalls.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No missed call alerts currently.
                      </div>
                    ) : (
                      missedCalls.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 text-xs transition ${
                            !alert.isRead ? 'bg-rose-950/20' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                {!alert.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                )}
                                {alert.callerName}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                {alert.organization} - {alert.branch}
                              </p>
                              <p className="text-[11px] text-rose-400 font-mono mt-0.5">
                                {alert.callerNumber}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.timestamp}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              onClick={() => {
                                onReturnCall(alert.callerNumber, alert.callerName, alert.organization, alert.branch);
                                onMarkAlertRead(alert.id);
                                setShowNotifications(false);
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <PhoneCall className="w-3 h-3" />
                              Return Call
                            </button>
                            <button
                              onClick={() => {
                                onConvertMissedToTicket(alert);
                                onMarkAlertRead(alert.id);
                                setShowNotifications(false);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1 transition border border-slate-700 cursor-pointer"
                            >
                              <TicketCheck className="w-3 h-3 text-amber-400" />
                              Create Ticket
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    pendingScheduled.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No pending follow-up appointments scheduled.
                      </div>
                    ) : (
                      pendingScheduled.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 text-xs hover:bg-slate-800/40 transition space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-white">{item.callerName}</div>
                              <div className="text-[11px] text-slate-400">{item.organization || 'Client'}</div>
                              <div className="text-[11px] font-mono text-emerald-400 mt-0.5">{item.callerNumber}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                                {item.scheduledDate} {item.scheduledTime}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">Ext {item.assignedExtension}</div>
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-slate-300 italic bg-slate-950 p-1.5 rounded border border-slate-800">
                              "{item.notes}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => {
                                onReturnCall(item.callerNumber, item.callerName, item.organization || '', item.branch || '');
                                setShowNotifications(false);
                              }}
                              className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Dial Now</span>
                            </button>

                            {onCompleteScheduledCall && (
                              <button
                                onClick={() => {
                                  onCompleteScheduledCall(item.id);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold border border-slate-700"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Employee Extension Selector / Profile */}
          <div className="relative">
            <button
              onClick={() => setShowExtDropdown(!showExtDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-left transition cursor-pointer"
            >
              <div className="relative">
                <img
                  src={currentExtension.avatar}
                  alt={currentExtension.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-600"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
              </div>
              <div className="hidden sm:block text-xs leading-tight">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>{currentExtension.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                    Ext {currentExtension.extension}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{currentExtension.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown to switch Extension */}
            {showExtDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Switch Active Extension
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assign incoming trunk calls to selected officer
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowExtDropdown(false);
                      onOpenLoginModal();
                    }}
                    className="text-[11px] text-indigo-400 font-bold hover:underline"
                  >
                    Portal Login
                  </button>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {extensions.map((ext) => (
                    <button
                      key={ext.id}
                      onClick={() => {
                        onSelectExtension(ext);
                        setShowExtDropdown(false);
                      }}
                      className={`w-full p-2.5 flex items-center gap-3 text-left transition cursor-pointer ${
                        currentExtension.id === ext.id
                          ? 'bg-indigo-600/20 text-indigo-200'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <img
                        src={ext.avatar}
                        alt={ext.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold truncate">{ext.name}</span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                            Ext {ext.extension}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{ext.role}</div>
                      </div>
                      {currentExtension.id === ext.id && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Dock (High-End SaaS Mobile Ergonomics) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <button
          onClick={() => setActiveTab('landing')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition min-w-[48px] cursor-pointer ${
            activeTab === 'landing' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition min-w-[48px] cursor-pointer ${
            activeTab === 'calls' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px]">Calls</span>
          {unreadMissed.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-pulse"></span>
          )}
        </button>

        {/* Center Floating Softphone Dialpad Button on Mobile */}
        <button
          onClick={() => setIsSoftphoneOpen(true)}
          className={`flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90 border cursor-pointer ${
            isCallActive
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse ring-4 ring-emerald-500/20'
              : isSoftphoneOpen
              ? 'bg-indigo-600 text-white border-indigo-400 ring-4 ring-indigo-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-indigo-600/30'
          }`}
          title="Open Softphone Console"
        >
          <PhoneCall className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition min-w-[48px] cursor-pointer ${
            activeTab === 'tickets' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TicketCheck className="w-4 h-4" />
          <span className="text-[10px]">Tickets</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition min-w-[48px] cursor-pointer ${
            activeTab === 'directory' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span className="text-[10px]">Desk</span>
        </button>

        <button
          onClick={() => {
            if (isAdmin) {
              setActiveTab('admin');
            } else {
              onOpenLoginModal();
            }
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition min-w-[48px] cursor-pointer ${
            activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-[10px]">Admin</span>
        </button>
      </nav>
    </header>
  );
};
