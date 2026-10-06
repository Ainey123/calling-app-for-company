import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  Bell, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  Database, 
  Trash2, 
  Clock, 
  TicketCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  ChevronDown,
  Shield,
  Key,
  Lock,
  ShieldAlert,
  Camera,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EmployeeExtension, MissedCallAlert, ScheduledCall, NavigationTab } from '../types';
import { soundEngine } from '../utils/audio';
import { getInitialsAvatar } from '../utils/imageUtils';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
  activeTab: NavigationTab;
  onNavigateTab?: (tab: NavigationTab) => void;
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
  onOpenPhotoModal?: () => void;
  onOpenAICopilot: () => void;
  onOpenCommandMenu?: () => void;
  currentExtension: EmployeeExtension;
  didNumber?: string;
  onOpenSimCallingTab?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  activeTab,
  onNavigateTab,
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
  onOpenPhotoModal,
  onOpenAICopilot,
  onOpenCommandMenu,
  currentExtension,
  didNumber,
  onOpenSimCallingTab,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifTab, setNotifTab] = useState<'missed' | 'scheduled'>('missed');
  const [isAudioMuted, setIsAudioMuted] = useState(soundEngine.getIsMuted());

  const unreadMissed = missedCalls.filter((m) => !m.isRead);
  const pendingScheduled = scheduledCalls.filter((s) => s.status === 'pending');
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

  // Section display title mapping
  const titleMap: Record<NavigationTab, { title: string; category: string }> = {
    overview: { title: 'Operations Dashboard', category: 'Overview' },
    activity: { title: 'Employee Activity & Work Tracking', category: 'Overview' },
    timeline: { title: 'Telephony & Audit Timeline', category: 'Overview' },
    calls: { title: 'Business Calling & Call History', category: 'Calling' },
    'sim-calling': { title: 'SIM Calling Station & Direct Cellular Hub', category: 'Calling' },
    softphone: { title: 'PBX Softphone Console', category: 'Calling' },
    forwarding: { title: 'Smart Call Forwarding Matrix', category: 'Calling' },
    vendors: { title: 'Vendor Coordination & Quotations', category: 'Vendors' },
    emails: { title: 'Email-Related Work & Gmail Activity', category: 'Email' },
    'daily-work': { title: 'My Daily Work Reporting', category: 'Reports' },
    'admin-reports': { title: 'Management Daily Report Review', category: 'Reports' },
    tickets: { title: 'Project Service Requests & Site Orders', category: 'Operations' },
    directory: { title: 'Employee Directory & Extensions', category: 'Company' },
    analytics: { title: 'Operational Analytics & Reports', category: 'Reports' },
    'my-account': { title: 'My Account & Working Details', category: 'Profile' },
    admin: { title: 'Administration Master Control', category: 'Administration' },
  };

  const currentView = titleMap[activeTab] || { title: 'Dashboard', category: 'Overview' };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white h-16 flex items-center justify-between px-2.5 sm:px-6 w-full min-w-0">
      {/* Left: Mobile Menu Trigger + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 -ml-1 sm:p-2 sm:-ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 md:hidden cursor-pointer shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
            <span className="truncate">FAST Connect</span>
            <span>/</span>
            <span className="text-slate-300 font-semibold truncate">{currentView.category}</span>
          </div>
          <h2 className="text-xs sm:text-base font-bold text-white truncate leading-tight">
            {currentView.title}
          </h2>
        </div>

        {/* Live Trunk Indicator Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 ml-3 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-emerald-400 font-medium">{didNumber || '+92 (42) 111-327-800'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Firestore Live</span>
          </span>
        </div>
      </div>

      {/* Right: Operational Controls & Utilities */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Call Live Status Pill */}
        {isCallActive ? (
          <button
            onClick={() => setIsSoftphoneOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition text-xs font-semibold cursor-pointer animate-pulse shadow-lg shadow-emerald-500/10"
            title="Click to view live WebRTC call session"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="hidden xs:inline">Call: </span>
            <strong className="font-mono text-[11px] sm:text-xs">{formatDuration(activeCallDuration)}</strong>
          </button>
        ) : (
          <button
            onClick={() => setIsSoftphoneOpen(!isSoftphoneOpen)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
              isSoftphoneOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800'
            }`}
            title="Toggle Softphone Dialpad"
          >
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dialer</span>
          </button>
        )}

        {/* Dedicated SIM Calling Quick Launch Button */}
        {onOpenSimCallingTab && (
          <button
            onClick={onOpenSimCallingTab}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
              activeTab === 'sim-calling'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/50 hover:text-white'
            }`}
            title="Launch Dual-SIM Cellular Dispatch Station"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>SIM Calling</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        )}

        {/* Global ⌘K Command Palette Button */}
        {onOpenCommandMenu && (
          <button
            onClick={onOpenCommandMenu}
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition text-xs font-mono cursor-pointer"
            title="Command Menu (⌘K or Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-sans hidden xl:inline">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Simulate Inbound Test Call */}
        <button
          onClick={onSimulateIncomingCall}
          className="hidden sm:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 transition text-xs font-medium cursor-pointer"
          title="Simulate Inbound Branch Call"
        >
          <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Test Call</span>
        </button>

        {/* AI Operations Copilot Trigger */}
        <button
          onClick={onOpenAICopilot}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/25 to-purple-600/25 hover:from-indigo-600/35 hover:to-purple-600/35 text-indigo-200 border border-indigo-500/40 transition text-xs font-semibold cursor-pointer shadow-sm group"
          title="AI Operations Copilot (Live Speech & Dispatch Grounding)"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleSound}
          title={isAudioMuted ? 'Unmute telephone audio & tones' : 'Mute telephone audio & tones'}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800 shrink-0"
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to High-Contrast Light Theme' : 'Switch to Dark Theme'}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800 shrink-0"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Notification Bell (Missed Calls & Follow-Ups) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800 shrink-0"
            title="Missed Calls & Follow-Up Reminders"
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
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-88 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-2.5 border-b border-slate-800 bg-slate-950 flex items-center gap-1 text-xs">
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
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
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
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1 transition border border-slate-700 cursor-pointer"
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
                            className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Dial Now</span>
                          </button>

                          {onCompleteScheduledCall && (
                            <button
                              onClick={() => {
                                onCompleteScheduledCall(item.id);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold border border-slate-700 cursor-pointer"
                              title="Mark Follow-up as Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
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

        {/* User Account / Desk Switch Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white transition cursor-pointer"
          >
            <img
              src={currentUser?.photoURL || currentExtension.avatar || getInitialsAvatar(currentExtension.name, currentExtension.extension)}
              alt="User"
              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700 bg-slate-800"
            />
            <span className="hidden md:inline font-semibold max-w-[100px] truncate">
              {currentUser?.displayName ? currentUser.displayName.split(' ')[0] : currentExtension.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 text-xs">
              <div className="px-4 py-2 border-b border-slate-800">
                <div className="font-semibold text-white truncate">
                  {currentUser?.displayName || currentExtension.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {currentUser?.email || `Desk Ext: ${currentExtension.extension}`}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    Ext {currentExtension.extension}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    onNavigateTab?.('my-account');
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-950/50 flex items-center gap-2 transition cursor-pointer font-semibold"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>My Account & Working Details</span>
                </button>

                <button
                  onClick={() => {
                    onOpenPhotoModal?.();
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload / Change My Photo</span>
                </button>

                <button
                  onClick={() => {
                    onOpenLoginModal();
                    setShowUserDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Switch Officer Desk / Login</span>
                </button>

                {currentUser ? (
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onSignInGoogle();
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-lg text-indigo-300 hover:bg-indigo-950/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign in with Google</span>
                  </button>
                )}

                {/* Role-Specific Actions: Admin Controls vs Employee Restricted View */}
                {isAdmin ? (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>Administrator Controls</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigateTab('admin');
                        }}
                        className="w-full px-3 py-1.5 text-left rounded-lg text-amber-300 hover:text-white hover:bg-amber-950/40 text-[11px] font-medium flex items-center gap-2 transition cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Admin Master Console</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (window.confirm('SECURITY CONFIRMATION (Admin Only):\nAre you sure you want to permanently clear and reset all live Firestore call logs, tickets, and alerts?')) {
                          onClearDatabase();
                        }
                      }}
                      className="w-full px-3 py-1.5 text-left rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-[11px] flex items-center gap-2 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Reset Live Database (Admin)</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80 px-2.5 py-2 bg-slate-950/80 rounded-xl mt-1 text-[11px] border border-slate-800/60">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Duty: Active on Desk
                      </span>
                      <span className="text-[10px] text-indigo-400 font-mono">PBX Line 1</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 leading-tight">
                      <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>System database resets & deletions are restricted to Administrators.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
