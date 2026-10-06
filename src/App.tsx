import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { SoftphoneModal } from './components/SoftphoneModal';
import { IncomingCallToast, IncomingCallInfo } from './components/IncomingCallToast';
import { CallsView } from './components/CallsView';
import { TicketsView } from './components/TicketsView';
import { DirectoryView } from './components/DirectoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminView } from './components/AdminView';
import { LoginModal } from './components/LoginModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { ScenarioWalkthroughModal } from './components/ScenarioWalkthroughModal';
import { LandingView } from './components/LandingView';
import { CommandMenuModal } from './components/CommandMenuModal';
import { CallForwardingView } from './components/CallForwardingView';
import { DailyWorkView } from './components/DailyWorkView';
import { AdminReportsReviewView } from './components/AdminReportsReviewView';
import { ActivityTimelineView } from './components/ActivityTimelineView';
import { EmployeePhotoModal } from './components/EmployeePhotoModal';
import { MyAccountView } from './components/MyAccountView';
import { VendorCoordinationView } from './components/VendorCoordinationView';
import { EmailWorkView } from './components/EmailWorkView';
import { EmployeeActivityHubView } from './components/EmployeeActivityHubView';
import { SimCallingView } from './components/SimCallingView';
import { liveStore, STORE_KEYS } from './services/liveStore';
import { 
  EmployeeExtension, 
  CallRecord, 
  ComplaintTicket, 
  Vendor, 
  MissedCallAlert, 
  TicketStatus,
  ScheduledCall,
  NavigationTab,
  CallForwardingRule,
  DailyReport,
  ActivityTimelineItem,
  SipPbxConfig,
  SipRegistrationState,
  VendorQuotation,
  EmailWorkRecord,
  CallOutcome,
  QuotationStatus,
  EmailWorkStatus
} from './types';
import { 
  INITIAL_EXTENSIONS, 
  INITIAL_CALL_RECORDS, 
  INITIAL_TICKETS, 
  INITIAL_VENDORS, 
  INITIAL_MISSED_ALERTS,
  INITIAL_FORWARDING_RULES,
  INITIAL_DAILY_REPORTS,
  INITIAL_ACTIVITY_TIMELINE,
  INITIAL_QUOTATIONS,
  INITIAL_EMAIL_RECORDS
} from './data/initialData';
import { 
  auth, 
  signInWithGoogle, 
  logout, 
  subscribeToCalls, 
  saveCallRecordToFirestore, 
  deleteCallRecordFromFirestore,
  subscribeToTickets, 
  saveTicketToFirestore, 
  updateTicketInFirestore, 
  deleteTicketFromFirestore,
  subscribeToMissedCalls, 
  saveMissedCallToFirestore, 
  markMissedCallReadInFirestore,
  subscribeToScheduledCalls,
  saveScheduledCallToFirestore,
  updateScheduledCallInFirestore,
  deleteScheduledCallFromFirestore,
  subscribeToForwardingRules,
  saveForwardingRuleToFirestore,
  subscribeToDailyReports,
  saveDailyReportToFirestore,
  updateDailyReportInFirestore,
  subscribeToActivityTimeline,
  saveActivityEventToFirestore,
  subscribeToExtensions,
  saveExtensionToFirestore,
  subscribeToPbxConfig,
  savePbxConfigToFirestore,
  subscribeToVendors,
  saveVendorToFirestore,
  deleteVendorFromFirestore,
  subscribeToQuotations,
  saveQuotationToFirestore,
  updateQuotationInFirestore,
  deleteQuotationFromFirestore,
  subscribeToEmailRecords,
  saveEmailRecordToFirestore,
  updateEmailRecordInFirestore,
  deleteEmailRecordFromFirestore,
  clearAllFirestoreData 
} from './firebase';
import { sipManager } from './services/sipManager';
import { User, onAuthStateChanged } from 'firebase/auth';
import { soundEngine, SpeechPlayer } from './utils/audio';
import { Sparkles, PhoneCall, CheckCircle2, AlertCircle, X, Database, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [extensions, setExtensions] = useState<EmployeeExtension[]>(() => {
    try {
      const saved = localStorage.getItem('fastconnect_custom_extensions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXTENSIONS;
  });

  const [currentExtension, setCurrentExtension] = useState<EmployeeExtension>(() => {
    try {
      const savedExts = localStorage.getItem('fastconnect_custom_extensions');
      const activeId = localStorage.getItem('fastconnect_active_extension_id');
      if (savedExts) {
        const parsed = JSON.parse(savedExts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const found = parsed.find((e: any) => e.id === activeId || e.extension === activeId);
          return found || parsed[0];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXTENSIONS[0];
  });

  const [calls, setCalls] = useState<CallRecord[]>(() => liveStore.getCalls());
  const [tickets, setTickets] = useState<ComplaintTicket[]>(() => liveStore.getTickets());
  const [vendors, setVendors] = useState<Vendor[]>(() => liveStore.getVendors());
  const [missedCalls, setMissedCalls] = useState<MissedCallAlert[]>(() => liveStore.getMissedCalls());
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>(() => liveStore.getScheduledCalls());
  const [forwardingRules, setForwardingRules] = useState<CallForwardingRule[]>(() => liveStore.getForwardingRules());
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => liveStore.getDailyReports());
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>(() => liveStore.getActivityTimeline());
  const [quotations, setQuotations] = useState<VendorQuotation[]>(() => liveStore.getQuotations());
  const [emailRecords, setEmailRecords] = useState<EmailWorkRecord[]>(() => liveStore.getEmailRecords());

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Admin, Navigation and Modal Controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  // Custom Employee Profile Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalExtension, setPhotoModalExtension] = useState<EmployeeExtension | null>(null);

  // Corporate PBX Trunk & SIP Telephony State (Option B)
  const [pbxConfig, setPbxConfig] = useState<SipPbxConfig>(() => {
    try {
      const saved = localStorage.getItem('fastconnect_pbx_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            enabled: parsed.enabled ?? true,
            serverUrl: parsed.serverUrl || 'wss://pbx.lahore-dc.internal:8089/ws',
            domain: parsed.domain || 'pbx.lahore-dc.internal',
            transport: parsed.transport || 'inbuilt-webrtc',
            stunServer: parsed.stunServer || 'stun:stun.l.google.com:19302',
            turnServer: parsed.turnServer || '',
            turnUsername: parsed.turnUsername || '',
            turnPassword: parsed.turnPassword || '',
            didNumber: parsed.didNumber || '+92 (42) 111-327-800',
            sipSecretDefault: parsed.sipSecretDefault || 'FastConnect@123',
            autoRegister: parsed.autoRegister ?? true,
            pjsipPort: parsed.pjsipPort || 5060,
            wssPort: parsed.wssPort || 8089,
            rtpPortRange: parsed.rtpPortRange || '10000-20000',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load fastconnect_pbx_config from localStorage:', e);
    }
    return {
      enabled: true,
      serverUrl: 'wss://pbx.lahore-dc.internal:8089/ws',
      domain: 'pbx.lahore-dc.internal',
      transport: 'inbuilt-webrtc',
      stunServer: 'stun:stun.l.google.com:19302',
      turnServer: '',
      turnUsername: '',
      turnPassword: '',
      didNumber: '+92 (42) 111-327-800',
      sipSecretDefault: 'FastConnect@123',
      autoRegister: true,
      pjsipPort: 5060,
      wssPort: 8089,
      rtpPortRange: '10000-20000',
    };
  });
  const [sipStatus, setSipStatus] = useState<SipRegistrationState>('unregistered');
  const [sipStatusMessage, setSipStatusMessage] = useState<string>('');
  const [onlineExtensions, setOnlineExtensions] = useState<Array<{ extension: string; name: string }>>([]);

  const handleOpenPhotoModal = (ext?: EmployeeExtension) => {
    setPhotoModalExtension(ext || currentExtension);
    setIsPhotoModalOpen(true);
  };

  const handleSaveEmployeePhoto = (extensionId: string, newAvatarUrl: string) => {
    setExtensions((prev) => {
      const updated = prev.map((ext) => (ext.id === extensionId ? { ...ext, avatar: newAvatarUrl } : ext));
      try {
        localStorage.setItem('fastconnect_custom_extensions', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save custom extensions:', e);
      }
      return updated;
    });

    if (currentExtension.id === extensionId) {
      setCurrentExtension((prev) => ({ ...prev, avatar: newAvatarUrl }));
    }
  };

  const handleUpdateCurrentExtension = (updated: EmployeeExtension) => {
    setCurrentExtension(updated);
    setExtensions((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      try {
        localStorage.setItem('fastconnect_custom_extensions', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Collapsible Sidebar & Mobile Drawer State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('fastconnect_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('fastconnect_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [isSoftphoneOpen, setIsSoftphoneOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [summarizingCallId, setSummarizingCallId] = useState<string | null>(null);

  // Global Keyboard Shortcuts (⌘K for Command Menu, P for Softphone)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      } else if (!isInput && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAICopilotOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Theme state: dark or high-contrast light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('fastconnect_theme') as 'dark' | 'light') || 'dark';
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('fastconnect_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    showToast(`Switched to ${nextTheme === 'light' ? 'High-Contrast Light' : 'Dark'} Theme`, 'info');
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  // Flash notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const activeCallRef = useRef<any>(null);
  const incomingCallRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Firebase Auth & Firestore Real-time Subscriptions
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        showToast(`Authenticated as ${user.displayName || user.email}`, 'success');
      }
    });

    const unsubCalls = subscribeToCalls((cloudCalls) => {
      if (cloudCalls && cloudCalls.length > 0) {
        setCalls(cloudCalls);
        liveStore.setCalls(cloudCalls);
      }
    });

    const unsubTickets = subscribeToTickets((cloudTickets) => {
      if (cloudTickets && cloudTickets.length > 0) {
        setTickets(cloudTickets);
        liveStore.setTickets(cloudTickets);
        if (!selectedTicketId) {
          setSelectedTicketId(cloudTickets[0].id);
        }
      }
    });

    const unsubMissed = subscribeToMissedCalls((cloudMissed) => {
      if (cloudMissed && cloudMissed.length > 0) {
        setMissedCalls(cloudMissed);
        liveStore.setMissedCalls(cloudMissed);
      }
    });

    const unsubScheduled = subscribeToScheduledCalls((cloudSched) => {
      if (cloudSched && cloudSched.length > 0) {
        setScheduledCalls(cloudSched);
        liveStore.setScheduledCalls(cloudSched);
      }
    });

    const unsubForwarding = subscribeToForwardingRules((cloudRules) => {
      if (cloudRules && cloudRules.length > 0) {
        setForwardingRules(cloudRules);
        liveStore.setForwardingRules(cloudRules);
      }
    });

    const unsubReports = subscribeToDailyReports((cloudReports) => {
      if (cloudReports && cloudReports.length > 0) {
        setDailyReports(cloudReports);
        liveStore.setDailyReports(cloudReports);
      }
    });

    const unsubTimeline = subscribeToActivityTimeline((cloudTimeline) => {
      if (cloudTimeline && cloudTimeline.length > 0) {
        setActivityTimeline(cloudTimeline);
        liveStore.setActivityTimeline(cloudTimeline);
      }
    });

    const unsubPbx = subscribeToPbxConfig((config) => {
      if (config) {
        setPbxConfig(config);
        try {
          localStorage.setItem('fastconnect_pbx_config', JSON.stringify(config));
        } catch (e) {
          // ignore
        }
        sipManager.updateConfig(config);
      }
    });

    const unsubSipStatus = sipManager.onStatusChange((status, msg) => {
      setSipStatus(status);
      setSipStatusMessage(msg || '');
    });

    const unsubSipIncoming = sipManager.onIncomingCall((call) => {
      soundEngine.startIncomingRinging();
      setIncomingCall({
        number: call.callerNumber,
        name: call.callerName,
        organization: call.organization || 'External PBX Trunk',
        branch: call.branch || 'Inbound Gateway',
        city: 'Lahore',
        targetExtension: currentExtension.extension,
        issueHint: 'Live incoming WebRTC / SIP call',
      });
      showToast(`Incoming PBX call from ${call.callerName} (${call.callerNumber})`, 'info');
    });

    const unsubSipSession = sipManager.onSessionChange((session) => {
      if (!session) {
        if (incomingCallRef.current) {
          soundEngine.stopRinging();
          setIncomingCall(null);
        }
        if (activeCallRef.current) {
          const call = activeCallRef.current;
          soundEngine.playDisconnectTone();
          soundEngine.stopHoldMusic();
          const newCallRecord: CallRecord = {
            id: `call-${Date.now()}`,
            callerNumber: call.number,
            callerName: call.name,
            organization: call.organization,
            branch: call.branch,
            city: 'Lahore',
            extension: currentExtension.extension,
            agentName: currentExtension.name,
            direction: call.direction,
            timestamp: 'Just now',
            durationSeconds: call.durationSeconds || 1,
            status: 'completed',
            hasRecording: true,
            recordingDuration: `${Math.floor((call.durationSeconds || 1) / 60)
              .toString()
              .padStart(2, '0')}:${((call.durationSeconds || 1) % 60).toString().padStart(2, '0')}`,
            ...(call.linkedTicketId ? { linkedTicketId: call.linkedTicketId } : {}),
            notes: call.notes || 'Call completed through softphone.',
            transcript: `Call with ${call.name}. Duration: ${call.durationSeconds || 1}s.`,
          };
          setCalls((prev) => [newCallRecord, ...prev]);
          liveStore.saveCall(newCallRecord);
          saveCallRecordToFirestore(newCallRecord);
          setActiveCall(null);
          showToast('Call ended by remote party and saved to records.', 'info');
        }
      }
    });

    const unsubOnline = sipManager.onOnlineExtensions((list) => {
      setOnlineExtensions(list);
    });

    const unsubVendors = subscribeToVendors((cloudVendors) => {
      if (cloudVendors && cloudVendors.length > 0) {
        setVendors(cloudVendors);
        liveStore.setVendors(cloudVendors);
      }
    });

    const unsubQuotations = subscribeToQuotations((cloudQuotes) => {
      if (cloudQuotes && cloudQuotes.length > 0) {
        setQuotations(cloudQuotes);
        liveStore.setQuotations(cloudQuotes);
      }
    });

    const unsubEmailRecords = subscribeToEmailRecords((cloudEmails) => {
      if (cloudEmails && cloudEmails.length > 0) {
        setEmailRecords(cloudEmails);
        liveStore.setEmailRecords(cloudEmails);
      }
    });

    return () => {
      unsubAuth();
      unsubCalls();
      unsubTickets();
      unsubMissed();
      unsubScheduled();
      unsubForwarding();
      unsubReports();
      unsubTimeline();
      unsubPbx();
      unsubSipStatus();
      unsubSipIncoming();
      unsubSipSession();
      unsubOnline();
      unsubVendors();
      unsubQuotations();
      unsubEmailRecords();
    };
  }, []);

  // Sync current extension to SIP telephony subsystem
  useEffect(() => {
    sipManager.setExtension(currentExtension);
  }, [currentExtension.extension, currentExtension.sipPassword, currentExtension.pin]);

  const handleUpdatePbxConfig = async (newConfig: SipPbxConfig) => {
    setPbxConfig(newConfig);
    try {
      localStorage.setItem('fastconnect_pbx_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
    sipManager.updateConfig(newConfig);
    await savePbxConfigToFirestore(newConfig);
    sipManager.register();
  };

  // Google Sign-in Handler
  const handleSignInGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        showToast(`Signed in: ${user.displayName || user.email}`, 'success');
      }
    } catch (e: any) {
      console.error('Google Sign in error:', e);
      showToast('Sign-in cancelled or popup closed.', 'info');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('Signed out of Firebase account.', 'info');
    } catch (e: any) {
      console.error('Sign out error:', e);
    }
  };

  // Clear all live database records
  const handleClearAllDatabase = async () => {
    liveStore.clearAllData();
    await clearAllFirestoreData();
    setCalls([]);
    setTickets([]);
    setMissedCalls([]);
    setScheduledCalls([]);
    setSelectedTicketId(null);
    showToast('All call logs, tickets, and alerts have been wiped from live storage & Firestore.', 'info');
  };

  // Emergency Broadcast System State (SuperAdmin Controlled)
  const [emergencyBroadcast, setEmergencyBroadcast] = useState<{
    active: boolean;
    message: string;
    severity: 'critical' | 'warning' | 'info';
  } | null>(() => {
    try {
      const saved = localStorage.getItem('fastconnect_emergency_broadcast');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleUpdateEmergencyBroadcast = (
    broadcast: { active: boolean; message: string; severity: 'critical' | 'warning' | 'info' } | null
  ) => {
    setEmergencyBroadcast(broadcast);
    if (broadcast) {
      localStorage.setItem('fastconnect_emergency_broadcast', JSON.stringify(broadcast));
    } else {
      localStorage.removeItem('fastconnect_emergency_broadcast');
    }
  };

  const handleSelectivePurge = async (type: 'resolved-tickets' | 'old-calls' | 'missed-alerts') => {
    if (type === 'resolved-tickets') {
      const remaining = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');
      setTickets(remaining);
      liveStore.setTickets(remaining);
      showToast(`Purged resolved tickets. ${remaining.length} active tickets remain.`, 'info');
    } else if (type === 'old-calls') {
      const now = Date.now();
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      const remaining = calls.filter((c) => new Date(c.timestamp).getTime() > cutoff);
      setCalls(remaining);
      liveStore.setCalls(remaining);
      showToast(`Purged historical call logs. ${remaining.length} recent calls retained.`, 'info');
    } else if (type === 'missed-alerts') {
      setMissedCalls([]);
      liveStore.setMissedCalls([]);
      showToast('All missed call alerts cleared.', 'info');
    }
  };

  const handleRestoreBackup = (data: any) => {
    liveStore.importFullBackup(data);
    if (data.calls && Array.isArray(data.calls)) setCalls(data.calls);
    if (data.tickets && Array.isArray(data.tickets)) setTickets(data.tickets);
    if (data.vendors && Array.isArray(data.vendors)) setVendors(data.vendors);
    if (data.extensions && Array.isArray(data.extensions)) setExtensions(data.extensions);
    if (data.dailyReports && Array.isArray(data.dailyReports)) setDailyReports(data.dailyReports);
    showToast('System backup restored successfully to live data store.', 'success');
  };

  // Scheduled Call Handlers
  const handleScheduleCall = async (callData: Omit<ScheduledCall, 'id' | 'createdAt' | 'status'>) => {
    const newScheduled: ScheduledCall = {
      ...callData,
      id: `SCHED-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setScheduledCalls((prev) => {
      const next = [newScheduled, ...prev];
      liveStore.setScheduledCalls(next);
      return next;
    });
    await saveScheduledCallToFirestore(newScheduled);
    showToast(`Call scheduled for ${newScheduled.callerName} on ${newScheduled.scheduledDate} at ${newScheduled.scheduledTime}. Saved to pending reminders.`, 'success');
  };

  const handleDeleteScheduledCall = async (id: string) => {
    setScheduledCalls((prev) => {
      const next = prev.filter((s) => s.id !== id);
      liveStore.setScheduledCalls(next);
      return next;
    });
    await deleteScheduledCallFromFirestore(id);
    showToast('Scheduled call reminder removed.', 'info');
  };

  const handleCompleteScheduledCall = async (id: string) => {
    setScheduledCalls((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, status: 'completed' as const } : s);
      liveStore.setScheduledCalls(next);
      return next;
    });
    await updateScheduledCallInFirestore(id, { status: 'completed' });
    showToast('Follow-up call marked as completed.', 'success');
  };

  // Active call state
  const [activeCall, setActiveCall] = useState<{
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
  } | null>(null);

  // Incoming ringing call state
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // Timer tick for active call
  useEffect(() => {
    let interval: number | null = null;
    if (activeCall && !activeCall.isOnHold) {
      interval = window.setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.isOnHold, Boolean(activeCall)]);

  // Simulate Inbound Call from Bank
  const triggerIncomingCallSimulation = (customCaller?: Partial<IncomingCallInfo>) => {
    const caller: IncomingCallInfo = {
      number: customCaller?.number || '+92 42 35789012',
      name: customCaller?.name || 'Haris Siddiqui (Branch Operations Manager)',
      organization: customCaller?.organization || 'Habib Bank Limited (HBL)',
      branch: customCaller?.branch || 'Main Gulberg Branch',
      city: customCaller?.city || 'Lahore',
      targetExtension: currentExtension.extension,
      issueHint: customCaller?.issueHint || 'Urgent: Main circuit breaker trip & emergency UPS failure during banking hours.',
    };

    setIncomingCall(caller);
    soundEngine.startIncomingRinging();
  };

  // Accept incoming call
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    sipManager.unlockAudio();
    soundEngine.stopRinging();
    soundEngine.playConnectedChime();

    setActiveCall({
      number: incomingCall.number,
      name: incomingCall.name,
      organization: incomingCall.organization,
      branch: incomingCall.branch,
      direction: 'inbound',
      startTime: Date.now(),
      durationSeconds: 0,
      isOnHold: false,
      isMuted: false,
      notes: `${incomingCall.organization} reported ${incomingCall.issueHint || 'incident'}.`,
    });

    setIncomingCall(null);
    setIsSoftphoneOpen(true);
    showToast(`Connected with ${incomingCall.name} on Extension ${currentExtension.extension}`, 'success');
    await sipManager.answerCall();
  };

  // Decline incoming call
  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    soundEngine.stopRinging();
    soundEngine.playDisconnectTone();
    await sipManager.declineCall();

    // Log as missed call alert
    const newAlert: MissedCallAlert = {
      id: `missed-${Date.now()}`,
      callerName: incomingCall.name,
      callerNumber: incomingCall.number,
      organization: incomingCall.organization,
      branch: `${incomingCall.branch}, ${incomingCall.city}`,
      timestamp: 'Just now',
      extension: currentExtension.extension,
      isRead: false,
    };

    setMissedCalls((prev) => [newAlert, ...prev]);
    await saveMissedCallToFirestore(newAlert);

    // Also add to call records as missed
    const missedRecord: CallRecord = {
      id: `call-${Date.now()}`,
      callerNumber: incomingCall.number,
      callerName: incomingCall.name,
      organization: incomingCall.organization,
      branch: incomingCall.branch,
      city: incomingCall.city,
      extension: currentExtension.extension,
      agentName: currentExtension.name,
      direction: 'missed',
      timestamp: 'Just now',
      durationSeconds: 0,
      status: 'missed',
      hasRecording: false,
      notes: 'Caller disconnected or call declined by extension.',
    };
    setCalls((prev) => [missedRecord, ...prev]);
    await saveCallRecordToFirestore(missedRecord);

    setIncomingCall(null);
    showToast(`Call from ${incomingCall.name} logged as Missed Alert in Firestore`, 'info');
  };

  // Start Outbound Call
  const handleStartOutboundCall = async (number: string, name?: string, org?: string, branch?: string) => {
    sipManager.unlockAudio();
    soundEngine.playDtmf('5');
    soundEngine.playConnectedChime();

    setActiveCall({
      number,
      name: name || `Contact (${number})`,
      organization: org || 'External Number',
      branch: branch || 'Lahore Region',
      direction: 'outbound',
      startTime: Date.now(),
      durationSeconds: 0,
      isOnHold: false,
      isMuted: false,
      notes: '',
    });

    setIsSoftphoneOpen(true);
    showToast(`Dialing ${name || number} via PBX Trunk Line...`, 'info');
    await sipManager.makeCall(number, name, org, branch);
  };

  // End Active Call
  const handleEndCall = async () => {
    if (!activeCall) return;
    soundEngine.playDisconnectTone();
    soundEngine.stopHoldMusic();
    await sipManager.hangup();

    const newCallRecord: CallRecord = {
      id: `call-${Date.now()}`,
      callerNumber: activeCall.number,
      callerName: activeCall.name,
      organization: activeCall.organization,
      branch: activeCall.branch,
      city: 'Lahore',
      extension: currentExtension.extension,
      agentName: currentExtension.name,
      direction: activeCall.direction,
      timestamp: 'Just now',
      durationSeconds: activeCall.durationSeconds || 1,
      status: 'completed',
      hasRecording: true,
      recordingDuration: `${Math.floor(activeCall.durationSeconds / 60)
        .toString()
        .padStart(2, '0')}:${(activeCall.durationSeconds % 60).toString().padStart(2, '0')}`,
      ...(activeCall.linkedTicketId ? { linkedTicketId: activeCall.linkedTicketId } : {}),
      notes: activeCall.notes || 'Call completed through softphone.',
      transcript: `Caller: Conversation with ${activeCall.name} regarding branch facilities.\nAgent: Handled by ${currentExtension.name} on Extension ${currentExtension.extension}. Notes: ${activeCall.notes || 'Inquiry addressed.'}`,
    };

    setCalls((prev) => [newCallRecord, ...prev]);
    liveStore.saveCall(newCallRecord);
    await saveCallRecordToFirestore(newCallRecord);

    // If linked to a ticket, update that ticket's timeline and linkedCalls in Firestore
    if (activeCall.linkedTicketId) {
      const targetTicket = tickets.find((t) => t.id === activeCall.linkedTicketId);
      if (targetTicket) {
        const updatedTicket: ComplaintTicket = {
          ...targetTicket,
          linkedCalls: [
            {
              callId: newCallRecord.id,
              callerName: activeCall.name,
              callerNumber: activeCall.number,
              timestamp: 'Just now',
              durationSeconds: activeCall.durationSeconds,
              direction: activeCall.direction,
              summary: activeCall.notes || 'Softphone call session linked to ticket.',
            },
            ...targetTicket.linkedCalls,
          ],
          timeline: [
            {
              id: `tl-${Date.now()}`,
              timestamp: 'Just now',
              actor: currentExtension.name,
              action: `${activeCall.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call Logged`,
              note: `Duration: ${Math.floor(activeCall.durationSeconds / 60)}m ${activeCall.durationSeconds % 60}s. ${activeCall.notes}`,
            },
            ...targetTicket.timeline,
          ],
        };
        setTickets((prev) => prev.map((t) => (t.id === targetTicket.id ? updatedTicket : t)));
        liveStore.saveTicket(updatedTicket);
        await saveTicketToFirestore(updatedTicket);
      }
    }

    setActiveCall(null);
    showToast('Call ended and saved to live database.', 'success');
  };

  // Toggle Call Hold
  const handleToggleHold = async () => {
    if (!activeCall) return;
    const nextHold = !activeCall.isOnHold;
    if (nextHold) {
      soundEngine.startHoldMusic();
    } else {
      soundEngine.stopHoldMusic();
    }
    await sipManager.toggleHold();
    setActiveCall({ ...activeCall, isOnHold: nextHold });
    showToast(nextHold ? 'Call placed on hold (Hold music active)' : 'Call resumed', 'info');
  };

  // Toggle Mic Mute
  const handleToggleMute = () => {
    if (!activeCall) return;
    const isMuted = sipManager.toggleMute();
    setActiveCall({ ...activeCall, isMuted });
    showToast(isMuted ? 'Microphone muted' : 'Microphone active', 'info');
  };

  // Transfer Call to Another Extension
  const handleTransferCall = async (targetExt: EmployeeExtension) => {
    if (!activeCall) return;
    soundEngine.playDtmf(targetExt.extension);
    soundEngine.stopHoldMusic();
    sipManager.sendDtmf(targetExt.extension);
    await sipManager.hangup();
    showToast(`Call transferred to Ext ${targetExt.extension} (${targetExt.name})`, 'success');
    handleEndCall();
  };

  // Update Call Notes during call
  const handleUpdateCallNotes = (notes: string) => {
    if (!activeCall) return;
    setActiveCall({ ...activeCall, notes });
  };

  // Link Call to existing Ticket
  const handleLinkToTicket = (ticketId: string) => {
    if (!activeCall) return;
    setActiveCall({ ...activeCall, linkedTicketId: ticketId });
    showToast(`Linked current call to Ticket ${ticketId}`, 'success');
  };

  // Create Ticket directly from Active Call
  const handleCreateTicketFromActiveCall = async () => {
    if (!activeCall) return;
    const newId = `TKT-${Math.floor(8000 + Math.random() * 1000)}`;
    const newTkt: ComplaintTicket = {
      id: newId,
      title: `${activeCall.organization} - ${activeCall.branch} Incident`,
      organization: activeCall.organization,
      branchName: activeCall.branch,
      city: 'Lahore',
      clientName: activeCall.name,
      clientPhone: activeCall.number,
      clientEmail: 'branch.manager@client.internal',
      category: 'Electrical',
      priority: 'Critical',
      status: 'In Progress',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      description: activeCall.notes || 'Reported emergency breakdown during softphone call.',
      assignedExtension: currentExtension.extension,
      assignedAgentName: currentExtension.name,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: 'Just now',
          actor: currentExtension.name,
          action: 'Ticket Created from Softphone Call',
          note: `Linked caller: ${activeCall.name} (${activeCall.number}).`,
        },
      ],
      linkedCalls: [
        {
          callId: `active-${Date.now()}`,
          callerName: activeCall.name,
          callerNumber: activeCall.number,
          timestamp: 'In progress',
          durationSeconds: activeCall.durationSeconds,
          direction: activeCall.direction,
          summary: activeCall.notes || 'In-progress call linked to newly opened ticket.',
        },
      ],
    };

    setTickets((prev) => [newTkt, ...prev]);
    liveStore.saveTicket(newTkt);
    await saveTicketToFirestore(newTkt);

    setActiveCall({ ...activeCall, linkedTicketId: newId });
    setSelectedTicketId(newId);
    showToast(`Created Ticket ${newId} and saved to Firestore!`, 'success');
  };

  // Create Ticket from Call Record in history
  const handleCreateTicketFromCallRecord = async (call: CallRecord) => {
    const newId = `TKT-${Math.floor(8500 + Math.random() * 500)}`;
    const newTkt: ComplaintTicket = {
      id: newId,
      title: `${call.organization || 'Client'} - ${call.branch || 'Branch'} Incident`,
      organization: call.organization || 'Commercial Client',
      branchName: call.branch || 'Lahore Branch',
      city: call.city || 'Lahore',
      clientName: call.callerName,
      clientPhone: call.callerNumber,
      clientEmail: 'operations@bank.internal',
      category: (call.aiSummary?.suggestedCategory as any) || 'Electrical',
      priority: (call.aiSummary?.urgencyLevel as any) || 'Critical',
      status: 'New',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      description: call.aiSummary?.summary || call.notes || 'Call inquiry converted into complaint ticket.',
      assignedExtension: currentExtension.extension,
      assignedAgentName: currentExtension.name,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: 'Just now',
          actor: currentExtension.name,
          action: 'Ticket Created from Call History',
          note: `Origin call: ${call.id} (${call.durationSeconds}s).`,
        },
      ],
      linkedCalls: [
        {
          callId: call.id,
          callerName: call.callerName,
          callerNumber: call.callerNumber,
          timestamp: call.timestamp,
          durationSeconds: call.durationSeconds,
          direction: call.direction,
          summary: call.aiSummary?.summary || call.notes || 'Historical call record.',
        },
      ],
    };

    setTickets((prev) => [newTkt, ...prev]);
    liveStore.saveTicket(newTkt);
    await saveTicketToFirestore(newTkt);

    // Link record
    const updatedCall = { ...call, linkedTicketId: newId };
    setCalls((prev) =>
      prev.map((c) => (c.id === call.id ? updatedCall : c))
    );
    liveStore.saveCall(updatedCall);
    await saveCallRecordToFirestore(updatedCall);

    setSelectedTicketId(newId);
    setActiveTab('tickets');
    showToast(`Ticket ${newId} saved to Firestore!`, 'success');
  };

  // Convert Missed Call Alert into Ticket
  const handleConvertMissedToTicket = async (alert: MissedCallAlert) => {
    const newId = `TKT-${Math.floor(8600 + Math.random() * 400)}`;
    const newTkt: ComplaintTicket = {
      id: newId,
      title: `${alert.organization} - Missed Call Follow-Up Ticket`,
      organization: alert.organization,
      branchName: alert.branch,
      city: 'Lahore',
      clientName: alert.callerName,
      clientPhone: alert.callerNumber,
      clientEmail: 'contact@bank.internal',
      category: 'Electrical',
      priority: 'High',
      status: 'New',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      description: `Customer missed call from ${alert.callerNumber} received at ${alert.timestamp}. Needs immediate callback and status inquiry.`,
      assignedExtension: currentExtension.extension,
      assignedAgentName: currentExtension.name,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: 'Just now',
          actor: currentExtension.name,
          action: 'Ticket Auto-Created from Missed Call',
          note: `Follow-up required with ${alert.callerName}.`,
        },
      ],
      linkedCalls: [],
    };

    setTickets((prev) => [newTkt, ...prev]);
    liveStore.saveTicket(newTkt);
    await saveTicketToFirestore(newTkt);

    setSelectedTicketId(newId);
    setActiveTab('tickets');
    showToast(`Created follow-up Ticket ${newId} in Firestore!`, 'success');
  };

  // AI Summarization using Gemini API endpoint
  const handleSummarizeWithAI = async (callId: string) => {
    const targetCall = calls.find((c) => c.id === callId);
    if (!targetCall) return;

    setSummarizingCallId(callId);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: targetCall.transcript || targetCall.notes || 'Inbound emergency call regarding electricity trip.',
          callerName: targetCall.callerName,
          organization: targetCall.organization,
          branch: targetCall.branch,
          phone: targetCall.callerNumber,
        }),
      });

      const data = await res.json();
      const updatedAiSummary = {
        summary: data.summary,
        sentiment: data.sentiment,
        keyIssue: data.keyIssue,
        actionItems: data.actionItems,
        suggestedCategory: data.suggestedCategory,
        recommendedVendorType: data.recommendedVendorType,
        urgencyLevel: data.urgencyLevel,
      };

      setCalls((prev) =>
        prev.map((c) =>
          c.id === callId
            ? { ...c, aiSummary: updatedAiSummary }
            : c
        )
      );

      // Persist to Firestore
      await saveCallRecordToFirestore({ ...targetCall, aiSummary: updatedAiSummary });
      showToast('AI Summarization & Sentiment Analysis completed with Gemini!', 'success');
    } catch (err) {
      showToast('AI Summarization fallback applied.', 'info');
    } finally {
      setSummarizingCallId(null);
    }
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    const target = tickets.find((t) => t.id === ticketId);
    const newTimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: 'Just now',
      actor: currentExtension.name,
      action: `Status Changed to ${status}`,
    };

    const updated = target
      ? {
          ...target,
          status,
          updatedAt: 'Just now',
          timeline: [newTimelineEvent, ...(target.timeline || [])],
        }
      : null;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId && updated ? updated : t))
    );

    if (updated) {
      liveStore.saveTicket(updated);
      await updateTicketInFirestore(ticketId, {
        status,
        updatedAt: 'Just now',
        timeline: [newTimelineEvent, ...(target?.timeline || [])],
      });
    }

    if (status === 'Resolved') {
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch {}
      showToast(`Ticket ${ticketId} resolved successfully in Firestore!`, 'success');
    } else {
      showToast(`Ticket ${ticketId} updated to ${status}.`, 'info');
    }
  };

  // Assign Vendor to Ticket
  const handleAssignVendor = async (ticketId: string, vendor: Vendor) => {
    const target = tickets.find((t) => t.id === ticketId);
    const newTimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: 'Just now',
      actor: currentExtension.name,
      action: 'Vendor Assigned',
      note: `Dispatched ${vendor.name} (${vendor.trade}). Phone: ${vendor.phone}.`,
    };

    const updated = target
      ? {
          ...target,
          assignedVendor: vendor,
          status: 'Vendor Assigned' as TicketStatus,
          updatedAt: 'Just now',
          timeline: [newTimelineEvent, ...(target.timeline || [])],
        }
      : null;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId && updated ? updated : t))
    );

    if (updated) {
      liveStore.saveTicket(updated);
      await updateTicketInFirestore(ticketId, {
        assignedVendor: vendor,
        status: 'Vendor Assigned',
        updatedAt: 'Just now',
        timeline: [newTimelineEvent, ...(target?.timeline || [])],
      });
    }

    showToast(`Assigned ${vendor.name} to Ticket ${ticketId}`, 'success');
  };

  // Record Vendor Response (ETA, tech, notes)
  const handleRecordVendorResponse = async (
    ticketId: string,
    response: { eta: string; technician: string; notes: string; quote?: string }
  ) => {
    const target = tickets.find((t) => t.id === ticketId);
    const newResponse = {
      vendorId: target?.assignedVendor?.id || 'v-gen',
      vendorName: target?.assignedVendor?.name || 'Assigned Electrician',
      recordedAt: 'Today, Just now',
      eta: response.eta,
      technicianAssigned: response.technician,
      notes: response.notes,
      quoteEstimate: response.quote,
    };
    const newTimelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: 'Just now',
      actor: currentExtension.name,
      action: 'Technician Response Recorded',
      note: `ETA: ${response.eta} • Assigned Tech: ${response.technician}. Notes: ${response.notes}`,
    };

    const updated = target
      ? {
          ...target,
          status: 'Vendor Assigned' as TicketStatus,
          vendorResponses: [newResponse, ...(target.vendorResponses || [])],
          timeline: [newTimelineEvent, ...(target.timeline || [])],
        }
      : null;

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId && updated ? updated : t))
    );

    if (updated) {
      liveStore.saveTicket(updated);
      await updateTicketInFirestore(ticketId, {
        status: 'Vendor Assigned',
        vendorResponses: [newResponse, ...(target?.vendorResponses || [])],
        timeline: [newTimelineEvent, ...(target?.timeline || [])],
      });
    }

    showToast(`Recorded technician response: ETA ${response.eta}`, 'success');
  };

  // Create New Ticket
  const handleCreateNewTicket = async (ticketData: Partial<ComplaintTicket>) => {
    const newId = `TKT-${Math.floor(8700 + Math.random() * 300)}`;
    const fullTicket: ComplaintTicket = {
      id: newId,
      title: ticketData.title || 'New Service Request',
      organization: ticketData.organization || 'Client Organization',
      branchName: ticketData.branchName || 'Main Branch',
      city: ticketData.city || 'Lahore',
      clientName: ticketData.clientName || 'Facility Manager',
      clientPhone: ticketData.clientPhone || '+92 42 35789012',
      clientEmail: ticketData.clientEmail || 'manager@client.internal',
      category: ticketData.category || 'Electrical',
      priority: ticketData.priority || 'Critical',
      status: 'New',
      createdAt: 'Today, Just now',
      updatedAt: 'Today, Just now',
      description: ticketData.description || 'Reported incident requiring technician attention.',
      assignedExtension: currentExtension.extension,
      assignedAgentName: currentExtension.name,
      timeline: ticketData.timeline || [],
      linkedCalls: ticketData.linkedCalls || [],
    };

    setTickets((prev) => [fullTicket, ...prev]);
    liveStore.saveTicket(fullTicket);
    await saveTicketToFirestore(fullTicket);

    setSelectedTicketId(newId);
    showToast(`Complaint Ticket ${newId} created and saved to Firestore!`, 'success');
  };

  // Call Forwarding Handler
  const handleUpdateForwardingRule = async (rule: CallForwardingRule) => {
    setForwardingRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
    await saveForwardingRuleToFirestore(rule);
    showToast(`Updated forwarding policy for Ext ${rule.extension}`, 'success');

    const auditEvent: ActivityTimelineItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeDisplay: 'Just now',
      employeeId: currentExtension.id,
      employeeName: currentExtension.name,
      employeeExtension: currentExtension.extension,
      eventType: 'call-forwarded',
      isSystemGenerated: false,
      title: `Forwarding Matrix Updated (Ext ${rule.extension})`,
      description: `Routing conditions and backup extension (${rule.backupExtension}) updated by ${currentExtension.name}.`,
      badgeText: 'Audit Log'
    };
    setActivityTimeline((prev) => [auditEvent, ...prev]);
    await saveActivityEventToFirestore(auditEvent);
  };

  // Forwarding Simulation
  const handleTestForwardingScenario = async (condition: string, ext: string) => {
    const rule = forwardingRules.find((r) => r.extension === ext) || forwardingRules[0];
    const backupExt = rule?.backupExtension || '102';
    const backupOfficer = extensions.find((e) => e.extension === backupExt);

    showToast(`Simulating call forwarding (${condition}): Ext ${ext} -> Ext ${backupExt}`, 'info');

    const now = new Date();
    const testCallRecord: CallRecord = {
      id: `CALL-${Date.now().toString().slice(-4)}`,
      callerNumber: '+92 42 35789012',
      callerName: 'Habib Bank Limited (HBL Gulberg)',
      organization: 'Habib Bank Limited',
      branch: 'Main Gulberg Branch',
      direction: 'transferred',
      timestamp: 'Just now',
      durationSeconds: 142,
      status: 'completed',
      hasRecording: true,
      recordingDuration: '02:22',
      extension: backupExt,
      agentName: backupOfficer?.name || 'Fatima Noor',
      isForwarded: true,
      originalExtension: ext,
      originalAgentName: extensions.find((e) => e.extension === ext)?.name || 'Tariq Mehmood',
      forwardingReason: condition as any,
      forwardingHops: [
        {
          hopNumber: 1,
          fromExtension: ext,
          fromAgentName: extensions.find((e) => e.extension === ext)?.name || 'Tariq Mehmood',
          toExtension: backupExt,
          toAgentName: backupOfficer?.name || 'Fatima Noor',
          toPhoneNumber: rule?.backupPhoneNumber || '+92 300 8492011',
          condition: condition as any,
          timestamp: now.toISOString(),
          ringDurationSeconds: rule?.ringTimeoutSeconds || 15,
          result: 'answered'
        }
      ],
      telephonyMetadata: {
        trunkName: 'SIP-TRUNK-HBL-PRI',
        carrier: 'PTCL Enterprise SIP',
        codec: 'G.711u / Opus-HD',
        sipResponseCode: 'SIP/2.0 302 Moved Temporarily -> 200 OK'
      },
      notes: `Call forwarded from Ext ${ext} to Ext ${backupExt} due to officer ${condition}. Connected successfully with backup officer.`
    };

    setCalls((prev) => [testCallRecord, ...prev]);
    await saveCallRecordToFirestore(testCallRecord);

    const hopEvent: ActivityTimelineItem = {
      id: `ACT-${Date.now()}`,
      timestamp: now.toISOString(),
      timeDisplay: 'Just now',
      employeeId: ext === currentExtension.extension ? currentExtension.id : `emp-${ext}`,
      employeeName: extensions.find((e) => e.extension === ext)?.name || 'Tariq Mehmood',
      employeeExtension: ext,
      eventType: 'call-forwarded',
      isSystemGenerated: true,
      title: `Smart Forwarding Triggered (${condition.toUpperCase()})`,
      description: `Inbound call from HBL Gulberg rerouted from Ext ${ext} to Ext ${backupExt} (${backupOfficer?.name || 'Fatima Noor'}). Call answered and connected.`,
      badgeText: 'PBX Smart Forwarding',
      metadata: {
        forwardedFrom: ext,
        forwardedTo: backupExt,
        condition,
        callId: testCallRecord.id,
        callDurationSeconds: 142
      }
    };
    setActivityTimeline((prev) => [hopEvent, ...prev]);
    await saveActivityEventToFirestore(hopEvent);
    showToast(`Forwarded call logged to Call History and Activity Timeline!`, 'success');
  };

  // Daily Work Report Save
  const handleSaveDailyReport = async (report: DailyReport) => {
    setDailyReports((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === report.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = report;
        return next;
      }
      return [report, ...prev];
    });
    await saveDailyReportToFirestore(report);

    const isSubmit = report.status === 'Submitted';
    const event: ActivityTimelineItem = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeDisplay: 'Just now',
      employeeId: report.employeeId,
      employeeName: report.employeeName,
      employeeExtension: report.employeeExtension,
      eventType: isSubmit ? 'report-submitted' : 'work-entry-created',
      isSystemGenerated: false,
      title: isSubmit ? `Daily Work Report Submitted (${report.reportDate})` : `Daily Work Report Updated`,
      description: `${report.employeeName} logged ${report.entries.length} task entries with ${report.totalCallsHandledToday} calls handled.`,
      badgeText: 'Employee Log',
      metadata: {
        reportId: report.id
      }
    };
    setActivityTimeline((prev) => [event, ...prev]);
    await saveActivityEventToFirestore(event);
    showToast(`Daily report for ${report.reportDate} saved successfully!`, 'success');
  };

  // Admin Report Review / Status Update
  const handleUpdateAdminReport = async (reportId: string, updates: Partial<DailyReport>) => {
    setDailyReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...updates } : r)));
    await updateDailyReportInFirestore(reportId, updates);

    const targetReport = dailyReports.find((r) => r.id === reportId);
    if (targetReport && updates.status) {
      const event: ActivityTimelineItem = {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeDisplay: 'Just now',
        employeeId: targetReport.employeeId,
        employeeName: targetReport.employeeName,
        employeeExtension: targetReport.employeeExtension,
        eventType: updates.status === 'Reviewed' ? 'report-reviewed' : 'report-revision-requested',
        isSystemGenerated: false,
        title: updates.status === 'Reviewed' ? `Report Approved & Reviewed` : `Report Revision Requested`,
        description: `Administrative supervisor ${currentExtension.name} set status to ${updates.status} for report ${targetReport.reportDate}.`,
        badgeText: 'Admin Review',
        metadata: {
          reportId
        }
      };
      setActivityTimeline((prev) => [event, ...prev]);
      await saveActivityEventToFirestore(event);
    }
  };

  // Vendor Handlers
  const handleSaveVendor = async (vendor: Vendor) => {
    setVendors((prev) => {
      const idx = prev.findIndex((v) => v.id === vendor.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = vendor;
        return copy;
      }
      return [vendor, ...prev];
    });
    liveStore.saveVendor(vendor);
    try {
      await saveVendorToFirestore(vendor);
      showToast(`Saved vendor ${vendor.name}`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`Saved vendor ${vendor.name} locally`, 'info');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    liveStore.deleteVendor(vendorId);
    try {
      await deleteVendorFromFirestore(vendorId);
      showToast('Vendor removed from directory', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Quotation Handlers
  const handleSaveQuotation = async (quote: VendorQuotation) => {
    setQuotations((prev) => {
      const idx = prev.findIndex((q) => q.id === quote.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = quote;
        return copy;
      }
      return [quote, ...prev];
    });
    try {
      await saveQuotationToFirestore(quote);
      showToast(`Quotation ${quote.id} saved`, 'success');
    } catch (e) {
      console.error(e);
      showToast(`Quotation ${quote.id} saved locally`, 'info');
    }
  };

  const handleUpdateQuotationStatus = async (quoteId: string, status: QuotationStatus) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status, updatedAt: new Date().toISOString() } : q))
    );
    try {
      await updateQuotationInFirestore(quoteId, { status });
      showToast(`Quotation status updated to ${status}`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // Email Work Handlers
  const handleSaveEmailRecord = async (record: EmailWorkRecord) => {
    setEmailRecords((prev) => {
      const idx = prev.findIndex((e) => e.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    try {
      await saveEmailRecordToFirestore(record);
      showToast(`Email work activity logged: ${record.subject.slice(0, 30)}...`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Email record logged locally', 'info');
    }
  };

  const handleUpdateEmailStatus = async (id: string, status: EmailWorkStatus) => {
    setEmailRecords((prev) =>
      prev.map((em) => (em.id === id ? { ...em, status } : em))
    );
    try {
      await updateEmailRecordInFirestore(id, { status });
      showToast(`Email work status updated to ${status}`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmailRecord = async (id: string) => {
    setEmailRecords((prev) => prev.filter((em) => em.id !== id));
    try {
      await deleteEmailRecordFromFirestore(id);
      showToast('Email work record deleted', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // Call Outcome Handler
  const handleUpdateCallOutcome = async (callId: string, outcome: CallOutcome) => {
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, callOutcome: outcome } : c))
    );
    const target = calls.find((c) => c.id === callId);
    if (target) {
      try {
        await saveCallRecordToFirestore({ ...target, callOutcome: outcome });
        showToast(`Call outcome updated to ${outcome}`, 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className={`min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 sm:pb-8 transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900 theme-light' : 'bg-slate-950 text-slate-100 theme-dark'
    }`}>
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-fade-in transition-all">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        missedCallsCount={missedCalls.filter((m) => !m.isRead).length}
        openTicketsCount={tickets.filter((t) => t.status === 'New' || t.status === 'In Progress').length}
        currentExtension={currentExtension}
        onOpenSoftphone={() => setIsSoftphoneOpen(true)}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLaunchScenarioWalkthrough={() => setIsScenarioOpen(true)}
        isAdmin={isAdmin}
        isCallActive={Boolean(activeCall)}
      />

      {/* Main SaaS App Content Column (with dynamic left padding for sidebar) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:pl-[72px] lg:pl-[72px]' : 'md:pl-[72px] lg:pl-64'
      }`}>
        {/* Compact Top Navigation Bar */}
        <TopNav
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
          isSoftphoneOpen={isSoftphoneOpen}
          setIsSoftphoneOpen={setIsSoftphoneOpen}
          isCallActive={Boolean(activeCall)}
          activeCallDuration={activeCall?.durationSeconds || 0}
          onSimulateIncomingCall={() => triggerIncomingCallSimulation()}
          onLaunchScenarioWalkthrough={() => setIsScenarioOpen(true)}
          missedCalls={missedCalls}
          scheduledCalls={scheduledCalls}
          onReturnCall={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
          onConvertMissedToTicket={handleConvertMissedToTicket}
          onMarkAlertRead={async (id) => {
            setMissedCalls((prev) =>
              prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
            );
            await markMissedCallReadInFirestore(id);
          }}
          onCompleteScheduledCall={handleCompleteScheduledCall}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          currentUser={currentUser}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          onClearDatabase={handleClearAllDatabase}
          isAdmin={isAdmin}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenPhotoModal={() => handleOpenPhotoModal(currentExtension)}
          onOpenAICopilot={() => setIsAICopilotOpen(true)}
          onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
          currentExtension={currentExtension}
          didNumber={pbxConfig.didNumber}
          onOpenSimCallingTab={() => setActiveTab('sim-calling')}
        />

        {/* Real-time Emergency Outage Broadcast Banner (SuperAdmin Published) */}
        {emergencyBroadcast?.active && (
          <div className={`w-full py-2.5 px-4 sm:px-6 flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all animate-fade-in ${
            emergencyBroadcast.severity === 'critical'
              ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-rose-100 border-b border-rose-500/50'
              : emergencyBroadcast.severity === 'warning'
              ? 'bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 border-b border-amber-500/50'
              : 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 text-indigo-100 border-b border-indigo-500/50'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-ping ${
                emergencyBroadcast.severity === 'critical' ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/20 font-bold shrink-0">
                  {emergencyBroadcast.severity === 'critical' ? 'Emergency Dispatch Alert' : 'System Advisory'}
                </span>
                <span className="truncate">{emergencyBroadcast.message}</span>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleUpdateEmergencyBroadcast(null)}
                className="text-[11px] underline opacity-80 hover:opacity-100 shrink-0 ml-2 cursor-pointer"
              >
                Dismiss Banner
              </button>
            )}
          </div>
        )}

        {/* Incoming Call Toast Banner */}
        <IncomingCallToast
          incomingCall={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
          currentExtension={currentExtension}
        />

        {/* Primary View Content Container */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto min-w-0 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {activeTab === 'overview' && (
            <DashboardView
              calls={calls}
              tickets={tickets}
              extensions={extensions}
              dailyReports={dailyReports}
              emailRecords={emailRecords}
              quotations={quotations}
              vendors={vendors}
              activeCall={activeCall}
              scheduledCalls={scheduledCalls}
              currentExtension={currentExtension}
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSoftphone={() => setIsSoftphoneOpen(true)}
              onCallNumber={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
              onSelectTicket={(ticketId) => {
                setSelectedTicketId(ticketId);
                setActiveTab('tickets');
              }}
              onTestTrunkLine={() => triggerIncomingCallSimulation()}
              onOpenAICopilot={() => setIsAICopilotOpen(true)}
              onOpenScenarioWalkthrough={() => setIsScenarioOpen(true)}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenPhotoModal={() => handleOpenPhotoModal(currentExtension)}
              didNumber={pbxConfig.didNumber}
            />
          )}

          {activeTab === 'calls' && (
          <CallsView
            calls={calls}
            tickets={tickets}
            currentExtension={currentExtension}
            extensions={extensions}
            scheduledCalls={scheduledCalls}
            onScheduleCall={handleScheduleCall}
            onDeleteScheduledCall={handleDeleteScheduledCall}
            onCompleteScheduledCall={handleCompleteScheduledCall}
            onSelectTicket={(ticketId) => {
              setSelectedTicketId(ticketId);
              setActiveTab('tickets');
            }}
            onCreateTicketFromCallRecord={handleCreateTicketFromCallRecord}
            onCallNumber={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
            onSummarizeWithAI={handleSummarizeWithAI}
            summarizingCallId={summarizingCallId}
            onUpdateCallOutcome={handleUpdateCallOutcome}
            didNumber={pbxConfig.didNumber}
            onOpenSimCallingTab={() => setActiveTab('sim-calling')}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsView
            tickets={tickets}
            vendors={vendors}
            currentExtension={currentExtension}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onAssignVendor={handleAssignVendor}
            onRecordVendorResponse={handleRecordVendorResponse}
            onCallNumber={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
            onCreateNewTicket={handleCreateNewTicket}
            onOpenSimCallingTab={(phone, name, org, branch, ticketId) => {
              setActiveTab('sim-calling');
            }}
          />
        )}

        {activeTab === 'sim-calling' && (
          <SimCallingView
            currentExtension={currentExtension}
            tickets={tickets}
            vendors={vendors}
            calls={calls}
            onCallLogged={(call) => {
              setCalls((prev) => [call, ...prev]);
            }}
            onShowToast={showToast}
            onSelectTicket={(ticketId) => {
              setSelectedTicketId(ticketId);
              setActiveTab('tickets');
            }}
          />
        )}

        {activeTab === 'softphone' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
                <PhoneCall className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">FAST Connect PBX & SIM Calling Console</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5">
                  WebRTC business calling station connected to Trunk Line <strong>{pbxConfig.didNumber || '+92 (42) 111-327-800'}</strong> on Extension <strong>{currentExtension.extension}</strong> ({currentExtension.name}), with Dual-SIM cellular calling support.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsSoftphoneOpen(true)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Open Floating PBX Dialpad</span>
                </button>

                <button
                  onClick={() => setActiveTab('sim-calling')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Switch to SIM Calling Station</span>
                </button>

                <button
                  onClick={() => triggerIncomingCallSimulation()}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <span>Simulate Bank Inbound Call (HBL Lahore)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <DirectoryView
            extensions={extensions}
            vendors={vendors}
            currentExtension={currentExtension}
            onSelectExtension={(ext) => {
              setCurrentExtension(ext);
              try {
                localStorage.setItem('fastconnect_active_extension_id', ext.id);
              } catch (e) {}
              showToast(`Active extension switched to Ext ${ext.extension} (${ext.name})`, 'info');
            }}
            onCallNumber={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
            onOpenPhotoModal={(ext) => handleOpenPhotoModal(ext)}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'my-account' && (
          <MyAccountView
            currentExtension={currentExtension}
            onUpdateCurrentExtension={handleUpdateCurrentExtension}
            calls={calls}
            tickets={tickets}
            dailyReports={dailyReports}
            scheduledCalls={scheduledCalls}
            isAdmin={isAdmin}
            onOpenPhotoModal={(ext) => handleOpenPhotoModal(ext)}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            extensions={extensions}
            calls={calls}
            tickets={tickets}
            didNumber={pbxConfig.didNumber}
          />
        )}

        {activeTab === 'forwarding' && (
          <CallForwardingView
            rules={forwardingRules}
            extensions={extensions}
            currentExtension={currentExtension}
            isAdmin={isAdmin}
            onUpdateRule={handleUpdateForwardingRule}
            onTestForwardingScenario={handleTestForwardingScenario}
          />
        )}

        {activeTab === 'daily-work' && (
          <DailyWorkView
            currentExtension={currentExtension}
            reports={dailyReports}
            calls={calls}
            onSaveReport={handleSaveDailyReport}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'admin-reports' && (
          <AdminReportsReviewView
            reports={dailyReports}
            extensions={extensions}
            currentExtension={currentExtension}
            isAdmin={isAdmin}
            onUpdateReport={handleUpdateAdminReport}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorCoordinationView
            vendors={vendors}
            quotations={quotations}
            currentExtension={currentExtension}
            onCallNumber={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
            onSaveVendor={handleSaveVendor}
            onDeleteVendor={handleDeleteVendor}
            onSaveQuotation={handleSaveQuotation}
            onUpdateQuotationStatus={handleUpdateQuotationStatus}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'emails' && (
          <EmailWorkView
            emailRecords={emailRecords}
            currentExtension={currentExtension}
            extensions={extensions}
            vendors={vendors}
            onSaveEmailRecord={handleSaveEmailRecord}
            onUpdateEmailStatus={handleUpdateEmailStatus}
            onDeleteEmailRecord={handleDeleteEmailRecord}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'activity' && (
          <EmployeeActivityHubView
            timelineItems={activityTimeline}
            extensions={extensions}
            calls={calls}
            emailRecords={emailRecords}
            dailyReports={dailyReports}
            quotations={quotations}
            currentExtension={currentExtension}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'timeline' && (
          <ActivityTimelineView
            timelineItems={activityTimeline}
            extensions={extensions}
            currentExtension={currentExtension}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            extensions={extensions}
            onUpdateExtensions={(exts) => {
              setExtensions(exts);
              liveStore.setExtensions(exts);
            }}
            calls={calls}
            onDeleteCall={async (id) => {
              setCalls((prev) => prev.filter((c) => c.id !== id));
              liveStore.deleteCall(id);
              await deleteCallRecordFromFirestore(id);
            }}
            onUpdateCallNotes={async (id, notes) => {
              setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
              const target = calls.find((c) => c.id === id);
              if (target) {
                const updatedCall = { ...target, notes };
                liveStore.saveCall(updatedCall);
                await saveCallRecordToFirestore(updatedCall);
              }
            }}
            tickets={tickets}
            onUpdateTicket={async (ticketId, updates) => {
              setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, ...updates } : t)));
              const target = tickets.find((t) => t.id === ticketId);
              if (target) {
                liveStore.saveTicket({ ...target, ...updates });
              }
              await updateTicketInFirestore(ticketId, updates);
            }}
            onDeleteTicket={async (ticketId) => {
              setTickets((prev) => prev.filter((t) => t.id !== ticketId));
              liveStore.deleteTicket(ticketId);
              await deleteTicketFromFirestore(ticketId);
            }}
            vendors={vendors}
            onUpdateVendors={(v) => {
              setVendors(v);
              liveStore.setVendors(v);
            }}
            onClearAllDatabase={handleClearAllDatabase}
            onExitAdmin={() => setActiveTab('calls')}
            onShowToast={showToast}
            dailyReports={dailyReports}
            missedCalls={missedCalls}
            scheduledCalls={scheduledCalls}
            forwardingRules={forwardingRules}
            activityTimeline={activityTimeline}
            emergencyBroadcast={emergencyBroadcast}
            onUpdateEmergencyBroadcast={handleUpdateEmergencyBroadcast}
            onSelectivePurge={handleSelectivePurge}
            onRestoreBackup={handleRestoreBackup}
            onOpenPhotoModal={(ext) => handleOpenPhotoModal(ext)}
            quotations={quotations}
            emailRecords={emailRecords}
            onNavigateTab={setActiveTab}
            pbxConfig={pbxConfig}
            onUpdatePbxConfig={handleUpdatePbxConfig}
            sipStatus={sipStatus}
          />
        )}
      </main>
      </div>

      {/* Persistent Dockable Softphone Modal */}
      <SoftphoneModal
        isOpen={isSoftphoneOpen}
        onClose={() => setIsSoftphoneOpen(false)}
        currentExtension={currentExtension}
        extensions={extensions}
        activeCall={activeCall}
        onStartCall={(num, name, org, branch) => handleStartOutboundCall(num, name, org, branch)}
        onEndCall={handleEndCall}
        onToggleHold={handleToggleHold}
        onToggleMute={handleToggleMute}
        onTransferCall={handleTransferCall}
        onUpdateCallNotes={handleUpdateCallNotes}
        onLinkToTicket={handleLinkToTicket}
        onCreateTicketFromCall={handleCreateTicketFromActiveCall}
        existingTickets={tickets}
        pbxConfig={pbxConfig}
        sipStatus={sipStatus}
        sipStatusMessage={sipStatusMessage}
        onOpenPbxSettings={() => setActiveTab('admin')}
        onlineExtensions={onlineExtensions}
        onOpenSimCallingTab={() => {
          setIsSoftphoneOpen(false);
          setActiveTab('sim-calling');
        }}
      />

      {/* Guided Walkthrough Modal for the Lahore Electricity Issue Example */}
      <ScenarioWalkthroughModal
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
        didNumber={pbxConfig.didNumber}
        onTriggerRealInboundCall={() => {
          triggerIncomingCallSimulation({
            name: 'Haris Siddiqui (Branch Operations Manager)',
            organization: 'Habib Bank Limited (HBL)',
            branch: 'Main Gulberg Branch',
            city: 'Lahore',
            number: '+92 42 35789012',
            issueHint: 'Main 3-phase 100A circuit breaker trip & emergency UPS failure during customer hours.',
          });
        }}
      />

      {/* User & Employee Extension Login Portal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        extensions={extensions}
        currentExtension={currentExtension}
        onSelectExtension={(ext) => {
          setCurrentExtension(ext);
          showToast(`Active officer desk: ${ext.name} (Ext ${ext.extension})`, 'success');
        }}
        currentUser={currentUser}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOut}
        isAdmin={isAdmin}
        onSetIsAdmin={(adminState) => {
          setIsAdmin(adminState);
          if (adminState) {
            setActiveTab('admin');
          }
        }}
        onShowToast={showToast}
        onOpenPhotoModal={(ext) => handleOpenPhotoModal(ext)}
      />

      {/* AI Operations Copilot Drawer (Voice, Chat, Search, Maps Grounding) */}
      <AICopilotDrawer
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        onShowToast={showToast}
      />

      {/* Linear-Grade ⌘K Command Palette Modal */}
      <CommandMenuModal
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsCommandMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSoftphone={() => {
          setIsSoftphoneOpen(true);
          setIsCommandMenuOpen(false);
        }}
        onOpenAICopilot={() => {
          setIsAICopilotOpen(true);
          setIsCommandMenuOpen(false);
        }}
        onOpenLoginModal={() => {
          setIsLoginModalOpen(true);
          setIsCommandMenuOpen(false);
        }}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        extensions={extensions}
        tickets={tickets}
        onSelectExtension={(ext) => {
          setCurrentExtension(ext);
          showToast(`Active officer desk: ${ext.name} (Ext ${ext.extension})`, 'success');
        }}
        onCallNumber={(num, name, org, branch) => {
          handleStartOutboundCall(num, name, org, branch);
        }}
      />

      {/* Custom Employee Photo Upload / Management Modal */}
      {photoModalExtension && (
        <EmployeePhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => {
            setIsPhotoModalOpen(false);
            setPhotoModalExtension(null);
          }}
          extension={photoModalExtension}
          onSavePhoto={handleSaveEmployeePhoto}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
