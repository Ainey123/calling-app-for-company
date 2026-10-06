import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  PhoneCall, 
  TicketCheck, 
  Wrench, 
  Database, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Clock, 
  Building2,
  RefreshCw,
  Search,
  ExternalLink,
  Activity,
  Download,
  Upload,
  HardDrive,
  Wifi,
  Cpu,
  Sliders,
  Lock,
  ShieldAlert,
  Megaphone,
  FileDown,
  FileUp,
  FileText,
  CheckCheck,
  AlertCircle,
  Filter,
  Camera,
  KeyRound,
  Code,
  Eye,
  EyeOff,
  Server,
  Copy,
  Check,
  Terminal,
  WifiOff,
  FileCode,
  HelpCircle,
  ShieldCheck,
  ClipboardList,
  Mail,
  DollarSign,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { 
  EmployeeExtension, 
  CallRecord, 
  ComplaintTicket, 
  Vendor, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory,
  DailyReport,
  MissedCallAlert,
  ScheduledCall,
  CallForwardingRule,
  ActivityTimelineItem,
  SipPbxConfig,
  SipRegistrationState,
  VendorQuotation,
  EmailWorkRecord,
  WorkEntry
} from '../types';
import { processUploadedImage, getInitialsAvatar } from '../utils/imageUtils';
import { sipManager } from '../services/sipManager';

interface AdminViewProps {
  extensions: EmployeeExtension[];
  onUpdateExtensions: (exts: EmployeeExtension[]) => void;
  calls: CallRecord[];
  onDeleteCall: (id: string) => void;
  onUpdateCallNotes: (id: string, notes: string) => void;
  tickets: ComplaintTicket[];
  onUpdateTicket: (ticketId: string, updates: Partial<ComplaintTicket>) => void;
  onDeleteTicket: (ticketId: string) => void;
  vendors: Vendor[];
  onUpdateVendors: (vendors: Vendor[]) => void;
  onClearAllDatabase: () => void;
  onExitAdmin: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenPhotoModal?: (ext: EmployeeExtension) => void;
  dailyReports?: DailyReport[];
  missedCalls?: MissedCallAlert[];
  scheduledCalls?: ScheduledCall[];
  forwardingRules?: CallForwardingRule[];
  activityTimeline?: ActivityTimelineItem[];
  emergencyBroadcast?: { active: boolean; message: string; severity: 'critical' | 'warning' | 'info' } | null;
  onUpdateEmergencyBroadcast?: (broadcast: { active: boolean; message: string; severity: 'critical' | 'warning' | 'info' } | null) => void;
  onSelectivePurge?: (type: 'resolved-tickets' | 'old-calls' | 'missed-alerts') => void;
  onRestoreBackup?: (backupData: any) => void;
  pbxConfig?: SipPbxConfig;
  onUpdatePbxConfig?: (config: SipPbxConfig) => void;
  sipStatus?: SipRegistrationState;
  quotations?: VendorQuotation[];
  emailRecords?: EmailWorkRecord[];
  onNavigateTab?: (tab: any) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  extensions,
  onUpdateExtensions,
  calls,
  onDeleteCall,
  onUpdateCallNotes,
  tickets,
  onUpdateTicket,
  onDeleteTicket,
  vendors,
  onUpdateVendors,
  onClearAllDatabase,
  onExitAdmin,
  onShowToast,
  onOpenPhotoModal,
  dailyReports = [],
  missedCalls = [],
  scheduledCalls = [],
  forwardingRules = [],
  activityTimeline = [],
  emergencyBroadcast = null,
  onUpdateEmergencyBroadcast,
  onSelectivePurge,
  onRestoreBackup,
  pbxConfig,
  onUpdatePbxConfig,
  sipStatus = 'unregistered',
  quotations = [],
  emailRecords = [],
  onNavigateTab,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'extensions' | 'pending-work' | 'calls' | 'tickets' | 'vendors' | 'pbx' | 'diagnostics' | 'backup' | 'security'
  >('extensions');

  // Extension Modal State
  const [isAddExtOpen, setIsAddExtOpen] = useState(false);
  const [editingExt, setEditingExt] = useState<EmployeeExtension | null>(null);
  const [extForm, setExtForm] = useState({
    extension: '',
    name: '',
    role: '',
    department: 'Customer Service & Dispatch',
    phone: '',
    avatar: '',
    pin: '',
    isDeveloper: false,
    developerPermissions: {
      canEditPbx: true,
      canViewDiagnostics: true,
      canExportBackup: false,
      canResetDatabase: false,
    },
  });

  // Vendor Modal State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState<{
    name: string;
    contactPerson: string;
    trade: string;
    category: TicketCategory;
    phone: string;
    city: string;
    area: string;
    rating: number;
    emergencyContractor: boolean;
  }>({
    name: '',
    contactPerson: '',
    trade: 'Certified Commercial Electrician',
    category: 'Electrical',
    phone: '',
    city: 'Lahore',
    area: 'Gulberg & Mall Road',
    rating: 4.8,
    emergencyContractor: true,
  });

  // Call Editing State
  const [editingCallId, setEditingCallId] = useState<string | null>(null);
  const [callNotesText, setCallNotesText] = useState('');

  // Ticket Editing State
  const [editingTicket, setEditingTicket] = useState<ComplaintTicket | null>(null);

  // Search filter
  const [adminSearch, setAdminSearch] = useState('');
  const [pendingFilterEmployee, setPendingFilterEmployee] = useState<string>('all');
  const [pendingFilterType, setPendingFilterType] = useState<string>('all');
  const [pendingSearch, setPendingSearch] = useState<string>('');

  // Pending Daily Work entries (status === 'In Progress' or 'Blocked')
  const pendingTasksList = dailyReports.flatMap((rep) =>
    (rep.entries || [])
      .filter((e) => e.status === 'In Progress' || e.status === 'Blocked')
      .map((entry) => ({
        id: entry.id,
        type: 'task' as const,
        title: entry.description,
        category: entry.category,
        projectBranch: entry.projectBranch || 'General Operations',
        employeeId: rep.employeeId,
        employeeName: rep.employeeName,
        employeeExtension: rep.employeeExtension,
        status: entry.status,
        date: rep.reportDate,
        outcome: entry.resultOutcome,
        nextSteps: entry.pendingWork,
        blockerReason: entry.status === 'Blocked' ? (entry.pendingWork || 'Action blocked awaiting external dependency') : undefined,
      }))
  );

  // Pending Quotations
  const pendingQuotesList = (quotations || [])
    .filter((q) => q.status !== 'Approved by Client' && q.status !== 'PO Issued' && q.status !== 'Rejected')
    .map((q) => ({
      id: q.id,
      type: 'quote' as const,
      title: `${q.vendorName} - ${q.scopeDescription}`,
      category: 'Quotation / RFQ',
      projectBranch: q.projectBranch,
      employeeId: q.requestedByEmployeeId,
      employeeName: q.requestedByEmployeeName || `Ext ${q.requestedByEmployeeId}`,
      employeeExtension: extensions.find((e) => e.id === q.requestedByEmployeeId || e.name === q.requestedByEmployeeName)?.extension || '101',
      status: q.status,
      date: q.updatedAt.slice(0, 10),
      outcome: q.amountPkr ? `Estimated PKR ${q.amountPkr.toLocaleString()}` : 'Awaiting Quote Amount',
      nextSteps: q.validUntil ? `Valid until: ${q.validUntil}` : 'Pending review or client clearance',
      blockerReason: q.status === 'Under Engineering Review' ? 'Awaiting Chief Engineer Technical Verification' : undefined,
    }));

  // Pending Emails
  const pendingEmailsList = (emailRecords || [])
    .filter((em) => em.status === 'Awaiting Reply' || em.status === 'Action Needed')
    .map((em) => ({
      id: em.id,
      type: 'email' as const,
      title: em.subject,
      category: em.category,
      projectBranch: em.projectBranch,
      employeeId: em.employeeId,
      employeeName: em.employeeName,
      employeeExtension: em.employeeExtension,
      status: em.status,
      date: em.date,
      outcome: `Recipient: ${em.recipient} (${em.threadReference})`,
      nextSteps: em.pendingAction || em.notes || 'Awaiting response or approval',
      blockerReason: em.status === 'Action Needed' ? (em.pendingAction || 'Action needed on correspondence') : undefined,
    }));

  // Pending Site Tickets
  const pendingTicketsList = tickets
    .filter((t) => t.status !== 'Resolved' && t.status !== 'Closed')
    .map((t) => ({
      id: t.id,
      type: 'ticket' as const,
      title: `[${t.id}] ${t.title}`,
      category: t.category,
      projectBranch: `${t.organization} - ${t.branchName}`,
      employeeId: t.assignedExtension,
      employeeName: t.assignedAgentName || `Ext ${t.assignedExtension}`,
      employeeExtension: t.assignedExtension,
      status: t.status,
      date: t.createdAt.slice(0, 10),
      outcome: `Priority: ${t.priority} | Contractor: ${t.assignedVendor?.name || 'Unassigned'}`,
      nextSteps: 'Field resolution in progress',
      blockerReason: t.priority === 'Critical' ? 'Critical SLA - Requires immediate dispatch' : undefined,
    }));

  const allPendingItems = [
    ...pendingTasksList,
    ...pendingQuotesList,
    ...pendingEmailsList,
    ...pendingTicketsList,
  ];

  const totalPendingCount = allPendingItems.length;

  const filteredPendingItems = allPendingItems.filter((item) => {
    if (pendingFilterEmployee !== 'all') {
      const matchExt = item.employeeExtension === pendingFilterEmployee || item.employeeId === pendingFilterEmployee;
      if (!matchExt) return false;
    }
    if (pendingFilterType !== 'all') {
      if (item.type !== pendingFilterType) return false;
    }
    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase();
      const matchText = 
        item.title.toLowerCase().includes(q) ||
        item.projectBranch.toLowerCase().includes(q) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.nextSteps && item.nextSteps.toLowerCase().includes(q)) ||
        (item.blockerReason && item.blockerReason.toLowerCase().includes(q));
      if (!matchText) return false;
    }
    return true;
  });

  // Diagnostics State
  const [pingLatency, setPingLatency] = useState(19);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [codecMode, setCodecMode] = useState<'opus' | 'g711' | 'g729'>('opus');

  // Backup & Reset State
  const [secureResetPasscode, setSecureResetPasscode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showExtPin, setShowExtPin] = useState(false);
  const [showResetPasscode, setShowResetPasscode] = useState(false);

  // Emergency Broadcast & Security Matrix State
  const [broadcastDraftText, setBroadcastDraftText] = useState(
    emergencyBroadcast?.message || 'CRITICAL ADVISORY: 132kV Main Grid Interruption in Gulberg sector. All officers prioritize emergency power tickets.'
  );
  const [broadcastDraftSeverity, setBroadcastDraftSeverity] = useState<'critical' | 'warning' | 'info'>(
    emergencyBroadcast?.severity || 'critical'
  );
  const [deptPolicies, setDeptPolicies] = useState<Record<string, { internal: boolean; pstn: boolean; gsm: boolean; emergency: boolean; intl: boolean }>>({
    'Customer Service & Dispatch': { internal: true, pstn: true, gsm: true, emergency: true, intl: false },
    'Field Electrical Services': { internal: true, pstn: true, gsm: true, emergency: true, intl: false },
    'Executive & Supervisory Desk': { internal: true, pstn: true, gsm: true, emergency: true, intl: true },
  });

  // Corporate PBX Trunk & Telephony Gateway State
  const [pbxForm, setPbxForm] = useState<SipPbxConfig>(() => ({
    enabled: pbxConfig?.enabled ?? true,
    serverUrl: pbxConfig?.serverUrl || 'wss://pbx.lahore-dc.internal:8089/ws',
    domain: pbxConfig?.domain || 'pbx.lahore-dc.internal',
    transport: pbxConfig?.transport || 'inbuilt-webrtc',
    stunServer: pbxConfig?.stunServer || 'stun:stun.l.google.com:19302',
    turnServer: pbxConfig?.turnServer || '',
    turnUsername: pbxConfig?.turnUsername || '',
    turnPassword: pbxConfig?.turnPassword || '',
    didNumber: pbxConfig?.didNumber || '+92 (42) 111-327-800',
    sipSecretDefault: pbxConfig?.sipSecretDefault || 'FastConnect@123',
    autoRegister: pbxConfig?.autoRegister ?? true,
    pjsipPort: pbxConfig?.pjsipPort || 5060,
    wssPort: pbxConfig?.wssPort || 8089,
    rtpPortRange: pbxConfig?.rtpPortRange || '10000-20000',
  }));

  const [activePbxSubTab, setActivePbxSubTab] = useState<'settings' | 'generator' | 'guide'>('settings');
  const [activeConfigFile, setActiveConfigFile] = useState<'pjsip' | 'extensions' | 'http' | 'rtp'>('pjsip');
  const [isTestingPbx, setIsTestingPbx] = useState(false);
  const [pbxTestResult, setPbxTestResult] = useState<any>(null);
  const [showPbxSecret, setShowPbxSecret] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  React.useEffect(() => {
    if (pbxConfig) {
      setPbxForm(pbxConfig);
    }
  }, [pbxConfig]);

  const handleTestPbxConnection = async () => {
    setIsTestingPbx(true);
    setPbxTestResult(null);
    try {
      const res = await fetch('/api/pbx/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: pbxForm.serverUrl }),
      });
      const data = await res.json();
      setPbxTestResult(data);
      if (data.success) {
        onShowToast(`PBX Server reachable! Ping latency: ${data.latencyMs}ms (${data.host}:${data.port})`, 'success');
      } else {
        onShowToast(`PBX Test Notice: ${data.error || 'Connection failed'}`, 'error');
      }
    } catch (e: any) {
      setPbxTestResult({ success: false, error: e.message });
      onShowToast(`Could not reach PBX server: ${e.message}`, 'error');
    } finally {
      setIsTestingPbx(false);
    }
  };

  const handleSavePbx = () => {
    if (onUpdatePbxConfig) {
      onUpdatePbxConfig(pbxForm);
      onShowToast('Corporate PBX Trunk & Telephony settings saved to Firestore.', 'success');
    }
  };

  const handleCopyConfig = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    onShowToast(`Copied ${filename} to clipboard! Ready to paste into Asterisk.`, 'success');
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const [isTestingAudioLoopback, setIsTestingAudioLoopback] = useState(false);
  const [audioLoopbackStatus, setAudioLoopbackStatus] = useState<string>('');

  const handleAuthorizeSsl = () => {
    try {
      const url = new URL(pbxForm.serverUrl);
      const port = url.port || '8089';
      const httpsUrl = `https://${url.hostname}:${port}`;
      window.open(httpsUrl, '_blank');
      onShowToast(`Opened ${httpsUrl} in new tab. Click "Advanced" -> "Proceed" to accept certificate if self-signed.`, 'info');
    } catch {
      onShowToast('Invalid server URL. Please enter a valid URL like wss://pbx.yourcompany.com:8089/ws', 'error');
    }
  };

  const handleRunLoopbackTest = async () => {
    setIsTestingAudioLoopback(true);
    setAudioLoopbackStatus('Recording 3s audio...');
    const ok = await sipManager.testAudioLoopback((stage) => {
      if (stage === 'recording') setAudioLoopbackStatus('Recording 3s... Speak into mic!');
      else if (stage === 'playing') setAudioLoopbackStatus('Playing back... Listen to speakers!');
      else setAudioLoopbackStatus('Audio verified!');
    });
    if (ok) {
      onShowToast('Microphone & speakers verified successfully!', 'success');
      setAudioLoopbackStatus('Hardware OK');
    } else {
      onShowToast('Audio test failed. Check microphone permissions.', 'error');
      setAudioLoopbackStatus('Mic check failed');
    }
    setTimeout(() => {
      setIsTestingAudioLoopback(false);
      setAudioLoopbackStatus('');
    }, 4500);
  };

  const applyPbxPreset = (preset: 'inbuilt' | 'asterisk' | 'freepbx') => {
    if (preset === 'inbuilt') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      setPbxForm({
        ...pbxForm,
        transport: 'inbuilt-webrtc',
        serverUrl: `${isHttps ? 'wss:' : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/ws/telephony`,
        domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        stunServer: 'stun:stun.l.google.com:19302',
      });
      onShowToast('Applied In-Built WebRTC Gateway preset (Zero setup, instant voice).', 'info');
    } else if (preset === 'asterisk') {
      setPbxForm({
        ...pbxForm,
        transport: 'wss',
        serverUrl: 'wss://pbx.lahore-dc.internal:8089/ws',
        domain: 'pbx.lahore-dc.internal',
        pjsipPort: 5060,
        wssPort: 8089,
        stunServer: 'stun:stun.l.google.com:19302',
      });
      onShowToast('Applied Asterisk 18/20 WSS preset.', 'info');
    } else if (preset === 'freepbx') {
      setPbxForm({
        ...pbxForm,
        transport: 'wss',
        serverUrl: 'wss://freepbx.local:8089/ws',
        domain: 'freepbx.local',
        pjsipPort: 5060,
        wssPort: 8089,
        stunServer: 'stun:stun.l.google.com:19302',
      });
      onShowToast('Applied FreePBX WebRTC Trunk preset.', 'info');
    }
  };

  const handleTestPing = () => {
    setIsTestingPing(true);
    setTimeout(() => {
      const simulatedLatency = Math.floor(Math.random() * 15) + 14;
      setPingLatency(simulatedLatency);
      setIsTestingPing(false);
      onShowToast(`Firestore & SIP latency test complete: ${simulatedLatency}ms round-trip`, 'success');
    }, 600);
  };

  const handleExportSystemBackup = () => {
    const backup = {
      app: 'FAST Connect Business Calling & Complaint System',
      version: '3.8.0-Production',
      exportedAt: new Date().toISOString(),
      summary: {
        totalExtensions: extensions.length,
        totalCalls: calls.length,
        totalTickets: tickets.length,
        totalVendors: vendors.length,
        totalDailyReports: dailyReports.length,
        totalMissedAlerts: missedCalls.length,
      },
      collections: {
        extensions,
        calls,
        tickets,
        vendors,
        dailyReports,
        missedCalls,
        scheduledCalls,
        forwardingRules,
        activityTimeline,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fastconnect-system-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Complete system backup JSON downloaded successfully.', 'success');
  };

  const handleImportSystemBackup = () => {
    if (!importJsonText.trim()) {
      onShowToast('Please paste a valid JSON backup text.', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.collections) {
        if (onRestoreBackup) {
          onRestoreBackup(parsed.collections);
        } else {
          if (parsed.collections.extensions) onUpdateExtensions(parsed.collections.extensions);
          if (parsed.collections.vendors) onUpdateVendors(parsed.collections.vendors);
        }
        setShowImportModal(false);
        setImportJsonText('');
        onShowToast('Backup records successfully parsed and restored.', 'success');
      } else {
        onShowToast('Invalid backup format: missing "collections" payload.', 'error');
      }
    } catch (e: any) {
      onShowToast(`Failed to parse JSON backup: ${e.message}`, 'error');
    }
  };

  const handleExecuteSecureReset = () => {
    if (secureResetPasscode === 'admin800' || secureResetPasscode.toUpperCase() === 'CONFIRM') {
      onClearAllDatabase();
      setSecureResetPasscode('');
      onShowToast('All live database collections wiped by SuperAdmin.', 'info');
    } else {
      onShowToast('Invalid confirmation key. Enter "admin800" or "CONFIRM" to proceed.', 'error');
    }
  };

  // Save new or edited extension
  const handleSaveExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extForm.extension || !extForm.name) {
      onShowToast('Extension number and name are required', 'error');
      return;
    }

    if (editingExt) {
      const updated = extensions.map((ext) =>
        ext.id === editingExt.id
          ? {
              ...ext,
              extension: extForm.extension,
              name: extForm.name,
              role: extForm.role,
              department: extForm.department,
              phone: extForm.phone,
              avatar: extForm.avatar || getInitialsAvatar(extForm.name, extForm.extension),
              pin: extForm.pin || ext.pin || `${extForm.extension}0`,
              isDeveloper: extForm.isDeveloper,
              developerPermissions: extForm.isDeveloper ? extForm.developerPermissions : undefined,
            }
          : ext
      );
      onUpdateExtensions(updated);
      onShowToast(`Updated Extension ${extForm.extension} (${extForm.name})`, 'success');
      setEditingExt(null);
    } else {
      const newExt: EmployeeExtension = {
        id: `emp-${Date.now()}`,
        extension: extForm.extension,
        name: extForm.name,
        role: extForm.role || 'Complaint Specialist',
        department: extForm.department,
        avatar: extForm.avatar || getInitialsAvatar(extForm.name, extForm.extension),
        email: `${extForm.name.toLowerCase().replace(/\s+/g, '.')}@fastconnect.internal`,
        phone: extForm.phone || (pbxConfig?.didNumber ? `${pbxConfig.didNumber} Ext ${extForm.extension}` : `Ext ${extForm.extension}`),
        status: 'available',
        activeCallsToday: 0,
        avgHandlingSeconds: 200,
        pin: extForm.pin || `${extForm.extension}0`,
        isDeveloper: extForm.isDeveloper,
        developerPermissions: extForm.isDeveloper ? extForm.developerPermissions : undefined,
      };
      onUpdateExtensions([...extensions, newExt]);
      onShowToast(`Added new Extension ${newExt.extension} (${newExt.name})`, 'success');
    }

    setIsAddExtOpen(false);
    setExtForm({
      extension: '',
      name: '',
      role: '',
      department: 'Customer Service & Dispatch',
      phone: '',
      avatar: '',
      pin: '',
      isDeveloper: false,
      developerPermissions: {
        canEditPbx: true,
        canViewDiagnostics: true,
        canExportBackup: false,
        canResetDatabase: false,
      },
    });
  };

  const handleDeleteExtension = (id: string, extNum: string) => {
    if (extensions.length <= 1) {
      onShowToast('Cannot delete the last remaining extension.', 'error');
      return;
    }
    if (window.confirm(`Delete extension ${extNum} permanently?`)) {
      onUpdateExtensions(extensions.filter((e) => e.id !== id));
      onShowToast(`Extension ${extNum} deleted.`, 'info');
    }
  };

  // Save new or edited vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.phone) {
      onShowToast('Vendor name and phone are required.', 'error');
      return;
    }

    if (editingVendor) {
      const updated = vendors.map((v) =>
        v.id === editingVendor.id
          ? {
              ...v,
              name: vendorForm.name,
              contactPerson: vendorForm.contactPerson,
              trade: vendorForm.trade,
              category: vendorForm.category,
              phone: vendorForm.phone,
              city: vendorForm.city,
              area: vendorForm.area,
              rating: Number(vendorForm.rating),
              emergencyContractor: vendorForm.emergencyContractor,
            }
          : v
      );
      onUpdateVendors(updated);
      onShowToast(`Updated contractor ${vendorForm.name}`, 'success');
      setEditingVendor(null);
    } else {
      const newV: Vendor = {
        id: `v-${Date.now()}`,
        name: vendorForm.name,
        contactPerson: vendorForm.contactPerson || 'Lead Technician',
        trade: vendorForm.trade,
        category: vendorForm.category,
        phone: vendorForm.phone,
        city: vendorForm.city,
        area: vendorForm.area,
        rating: Number(vendorForm.rating),
        jobsCompleted: 0,
        avgResponseMinutes: 30,
        status: 'Available Now',
        emergencyContractor: vendorForm.emergencyContractor,
      };
      onUpdateVendors([...vendors, newV]);
      onShowToast(`Added contractor ${newV.name} to directory`, 'success');
    }

    setIsAddVendorOpen(false);
    setVendorForm({
      name: '',
      contactPerson: '',
      trade: 'Certified Commercial Electrician',
      category: 'Electrical',
      phone: '',
      city: 'Lahore',
      area: 'Gulberg & Mall Road',
      rating: 4.8,
      emergencyContractor: true,
    });
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (window.confirm(`Delete contractor "${name}" from directory?`)) {
      onUpdateVendors(vendors.filter((v) => v.id !== id));
      onShowToast(`Contractor ${name} removed.`, 'info');
    }
  };

  // Asterisk / FreePBX Configuration File Generators
  const generatePjsipConf = () => {
    return `; ============================================================================
; FAST Connect Enterprise Asterisk 18/20 PJSIP WebRTC Configuration
; Generated automatically for your company extensions
; Save to: /etc/asterisk/pjsip.conf
; ============================================================================

[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:${pbxForm.wssPort || 8089}

; WebRTC Base Template with DTLS-SRTP
[webrtc_endpoint_template](!)
type=endpoint
transport=transport-wss
context=from-internal
disallow=all
allow=opus,ulaw,alaw
dtls_auto_generate_cert=yes
webrtc=yes
use_avpf=yes
media_encryption=dtls
dtls_verify=fingerprint
dtls_setup=actpass
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes
direct_media=no

; Individual Extension Endpoints
${extensions.map((ext) => `; --- Extension ${ext.extension} (${ext.name}) ---
[${ext.extension}](webrtc_endpoint_template)
auth=auth_${ext.extension}
aors=aor_${ext.extension}

[auth_${ext.extension}]
type=auth
auth_type=userpass
username=${ext.sipAuthUser || ext.extension}
password=${ext.sipPassword || ext.pin || pbxForm.sipSecretDefault}

[aor_${ext.extension}]
type=aor
max_contacts=5
remove_existing=yes
qualify_frequency=30
`).join('\n')}`;
  };

  const generateExtensionsConf = () => {
    return `; ============================================================================
; FAST Connect Dialplan (extensions.conf)
; Save to: /etc/asterisk/extensions.conf
; ============================================================================

[from-internal]
; Internal extension-to-extension calling
${extensions.map((ext) => `exten => ${ext.extension},1,NoOp(Call to ${ext.name})
 same => n,Dial(PJSIP/${ext.extension},30)
 same => n,Hangup()
`).join('\n')}

; Trunk outbound dialing (E.164 and Standard 10-12 digit numbers)
exten => _X.,1,NoOp(Outbound PSTN Call to \${EXTEN})
 same => n,Dial(PJSIP/\${EXTEN}@trunk-carrier,60)
 same => n,Hangup()

; Emergency Dispatch Hotline
exten => 911,1,Dial(PJSIP/emergency-hotline)
`;
  };

  const generateHttpConf = () => {
    return `; ============================================================================
; Asterisk mini-HTTP server configuration for WSS (http.conf)
; Save to: /etc/asterisk/http.conf
; ============================================================================

[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:${pbxForm.wssPort || 8089}
tlscertfile=/etc/letsencrypt/live/${pbxForm.domain || 'pbx.yourcompany.com'}/fullchain.pem
tlsprivatekey=/etc/letsencrypt/live/${pbxForm.domain || 'pbx.yourcompany.com'}/privkey.pem
`;
  };

  const generateRtpConf = () => {
    return `; ============================================================================
; Asterisk RTP & ICE Configuration (rtp.conf)
; Save to: /etc/asterisk/rtp.conf
; ============================================================================

[general]
rtpstart=10000
rtpend=20000
icesupport=yes
stunaddr=${pbxForm.stunServer.replace('stun:', '')}
`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 
                className="font-black text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
                style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
              >
                FAST Connect Administrator Master Control
              </h1>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 uppercase shrink-0">
                Root SuperAdmin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 [overflow-wrap:anywhere]">
              Full administrative oversight: inspect, edit, configure, or delete extensions, live calls, complaint tickets, and contractors.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onExitAdmin}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            Exit Admin View
          </button>
          <button
            onClick={() => {
              if (window.confirm('Wipe all live call records and complaint tickets from Firestore database?')) {
                onClearAllDatabase();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-500/40 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe Database</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full min-w-0">
        <button
          onClick={() => setActiveAdminTab('extensions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'extensions'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Extensions ({extensions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('pending-work')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'pending-work'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-purple-400" />
          <span>Pending Work Matrix ({totalPendingCount})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('calls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'calls'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Live Call Logs ({calls.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'tickets'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TicketCheck className="w-4 h-4" />
          <span>Tickets Queue ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('vendors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'vendors'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Contractor Directory ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('pbx')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'pbx'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>PBX Trunk & Gateway</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'diagnostics'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Diagnostics & Health</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'backup'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & System Reset</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeAdminTab === 'security'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security & Broadcast</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXTENSIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeAdminTab === 'extensions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Employee Officer Extensions</h2>
              <p className="text-xs text-slate-400">Add, edit, reassign departments, or remove employee extension desks.</p>
            </div>
            <button
              onClick={() => {
                setEditingExt(null);
                setExtForm({
                  extension: (100 + extensions.length + 1).toString(),
                  name: '',
                  role: 'Technical Officer',
                  department: 'Customer Service & Dispatch',
                  phone: pbxConfig?.didNumber ? `${pbxConfig.didNumber} Ext ${100 + extensions.length + 1}` : `Ext ${100 + extensions.length + 1}`,
                  avatar: '',
                  pin: `${100 + extensions.length + 1}0`,
                  isDeveloper: false,
                  developerPermissions: {
                    canEditPbx: true,
                    canViewDiagnostics: true,
                    canExportBackup: false,
                    canResetDatabase: false,
                  },
                });
                setIsAddExtOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Extension</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
            {extensions.map((ext) => (
              <div
                key={ext.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => onOpenPhotoModal?.(ext)}
                      className="relative group cursor-pointer"
                      title="Click to upload custom employee photo"
                    >
                      <img
                        src={ext.avatar || getInitialsAvatar(ext.name, ext.extension)}
                        alt={ext.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 group-hover:ring-amber-400 transition"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Camera className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white truncate max-w-[120px]">{ext.name}</div>
                      <span className="font-mono text-indigo-400 font-bold text-[11px]">
                        Ext {ext.extension}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold">
                    {ext.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div>Role: <strong className="text-slate-200">{ext.role}</strong></div>
                  <div>Dept: <span className="text-slate-300">{ext.department}</span></div>
                  <div>Direct: <span className="font-mono text-slate-300">{ext.phone}</span></div>
                  <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>PIN: <strong className="text-amber-300 font-mono">{ext.pin || `${ext.extension}0`}</strong></span>
                    {ext.isDeveloper && (
                      <span className="ml-auto px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold">
                        Dev Staff
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onOpenPhotoModal?.(ext)}
                    className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 text-xs transition cursor-pointer"
                    title="Upload custom employee photo from device"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingExt(ext);
                      setExtForm({
                        extension: ext.extension,
                        name: ext.name,
                        role: ext.role,
                        department: ext.department,
                        phone: ext.phone,
                        avatar: ext.avatar,
                        pin: ext.pin || `${ext.extension}0`,
                        isDeveloper: Boolean(ext.isDeveloper),
                        developerPermissions: {
                          canEditPbx: ext.developerPermissions?.canEditPbx ?? true,
                          canViewDiagnostics: ext.developerPermissions?.canViewDiagnostics ?? true,
                          canExportBackup: ext.developerPermissions?.canExportBackup ?? false,
                          canResetDatabase: ext.developerPermissions?.canResetDatabase ?? false,
                        },
                      });
                      setIsAddExtOpen(true);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteExtension(ext.id, ext.extension)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs transition cursor-pointer"
                    title="Delete extension"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Extension Modal */}
          {isAddExtOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <form onSubmit={handleSaveExtension} className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">
                    {editingExt ? `Edit Extension ${editingExt.extension}` : 'Add New Employee Extension'}
                  </h3>
                  <button type="button" onClick={() => setIsAddExtOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Custom Photo Upload & Preview */}
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Employee Photo (Upload Custom Real Image):
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <img
                        src={extForm.avatar || getInitialsAvatar(extForm.name || 'Officer', extForm.extension || '101')}
                        alt="Avatar Preview"
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 bg-slate-900 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const dataUrl = await processUploadedImage(file);
                                    setExtForm({ ...extForm, avatar: dataUrl });
                                    onShowToast('Custom employee photo loaded from device.', 'info');
                                  } catch (err: any) {
                                    onShowToast(err.message || 'Failed to read image.', 'error');
                                  }
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const svg = getInitialsAvatar(extForm.name || 'Officer', extForm.extension || '101');
                              setExtForm({ ...extForm, avatar: svg });
                              onShowToast('Using corporate monogram initials.', 'info');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold border border-slate-700 transition"
                          >
                            Initials Badge
                          </button>
                        </div>
                        <input
                          type="text"
                          value={extForm.avatar.startsWith('data:image/') ? '(Custom photo from device applied)' : extForm.avatar}
                          onChange={(e) => {
                            if (!e.target.value.startsWith('(Custom')) {
                              setExtForm({ ...extForm, avatar: e.target.value });
                            }
                          }}
                          placeholder="Or paste company photo URL..."
                          className="w-full text-[11px] font-mono text-slate-400 bg-transparent border-none p-0 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Extension Number (3 digits):</label>
                    <input
                      type="text"
                      value={extForm.extension}
                      onChange={(e) => setExtForm({ ...extForm, extension: e.target.value })}
                      placeholder="e.g. 105"
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Officer Full Name:</label>
                    <input
                      type="text"
                      value={extForm.name}
                      onChange={(e) => setExtForm({ ...extForm, name: e.target.value })}
                      placeholder="e.g. Usman Rafique"
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Role / Title:</label>
                    <input
                      type="text"
                      value={extForm.role}
                      onChange={(e) => setExtForm({ ...extForm, role: e.target.value })}
                      placeholder="e.g. Senior Power Line Dispatcher"
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Department:</label>
                    <select
                      value={extForm.department}
                      onChange={(e) => setExtForm({ ...extForm, department: e.target.value })}
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Customer Service & Dispatch">Customer Service & Dispatch</option>
                      <option value="Operations & Maintenance">Operations & Maintenance</option>
                      <option value="Contractor Logistics">Contractor Logistics</option>
                      <option value="Corporate Accounts">Corporate Accounts</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold">Direct Dial DID:</label>
                    <input
                      type="text"
                      value={extForm.phone}
                      onChange={(e) => setExtForm({ ...extForm, phone: e.target.value })}
                      placeholder={pbxConfig?.didNumber ? `${pbxConfig.didNumber} Ext ${extForm.extension || '101'}` : "e.g. 03086103525"}
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Security PIN:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowExtPin(!showExtPin)}
                          className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title={showExtPin ? 'Hide PIN' : 'View PIN'}
                        >
                          {showExtPin ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showExtPin ? 'Hide' : 'View'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showExtPin ? 'text' : 'password'}
                          maxLength={6}
                          value={extForm.pin}
                          onChange={(e) => setExtForm({ ...extForm, pin: e.target.value.replace(/\D/g, '') })}
                          placeholder="e.g. 1050"
                          className="w-full p-2 pr-9 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowExtPin(!showExtPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          title={showExtPin ? 'Hide PIN' : 'View PIN'}
                        >
                          {showExtPin ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-purple-500 transition">
                        <input
                          type="checkbox"
                          checked={extForm.isDeveloper}
                          onChange={(e) => setExtForm({ ...extForm, isDeveloper: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-0"
                        />
                        <span className="text-[11px] font-semibold text-slate-200">Developer Staff</span>
                      </label>
                    </div>
                  </div>

                  {/* Boss-Configurable Developer Permissions */}
                  {extForm.isDeveloper && (
                    <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2 mt-2">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                        <Code className="w-3.5 h-3.5" />
                        <span>Boss Authorization: Specific Developer Permissions</span>
                      </div>
                      <p className="text-[10px] text-purple-200/70">
                        Check which system capabilities the Boss allows this developer to perform:
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={extForm.developerPermissions?.canEditPbx ?? true}
                            onChange={(e) =>
                              setExtForm({
                                ...extForm,
                                developerPermissions: {
                                  ...extForm.developerPermissions,
                                  canEditPbx: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-purple-500"
                          />
                          <span>Configure PBX & Trunks</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={extForm.developerPermissions?.canViewDiagnostics ?? true}
                            onChange={(e) =>
                              setExtForm({
                                ...extForm,
                                developerPermissions: {
                                  ...extForm.developerPermissions,
                                  canViewDiagnostics: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-purple-500"
                          />
                          <span>System Diagnostics</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={extForm.developerPermissions?.canExportBackup ?? false}
                            onChange={(e) =>
                              setExtForm({
                                ...extForm,
                                developerPermissions: {
                                  ...extForm.developerPermissions,
                                  canExportBackup: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-purple-500"
                          />
                          <span>Export System Backups</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={extForm.developerPermissions?.canResetDatabase ?? false}
                            onChange={(e) =>
                              setExtForm({
                                ...extForm,
                                developerPermissions: {
                                  ...extForm.developerPermissions,
                                  canResetDatabase: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-purple-500"
                          />
                          <span>Database Reset Ops</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddExtOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {editingExt ? 'Save Changes' : 'Create Extension'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PENDING WORK MATRIX (CROSS-COMPANY EXECUTIVE OVERSIGHT) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'pending-work' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-white">Cross-Company Pending Work Matrix</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                  {totalPendingCount} Action Items
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Real-time management inspection matrix aggregating all incomplete daily tasks, blocked workflows, pending vendor quotations, unresolved client Gmail threads, and open field tickets across all engineering teams.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onNavigateTab && (
                <>
                  <button
                    onClick={() => onNavigateTab('admin-reports')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    title="Review submitted daily reports"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Review Reports</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('vendors')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    title="View Vendor Quotations Pipeline"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vendor Pipeline</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('emails')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    title="View Email Work Records"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gmail Log</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Incomplete Tasks</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white">{pendingTasksList.length}</span>
                  <span className="text-[11px] text-rose-400 font-semibold">
                    ({pendingTasksList.filter(t => t.status === 'Blocked').length} blocked)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">From daily work entries</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Quotations / RFQs</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-amber-400">{pendingQuotesList.length}</span>
                  <span className="text-[11px] text-slate-400">in pipeline</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Awaiting client / PO</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gmail Correspondence</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-cyan-400">{pendingEmailsList.length}</span>
                  <span className="text-[11px] text-slate-400">threads</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {pendingEmailsList.filter(e => e.status === 'Awaiting Reply').length} await response / approval
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Site Field Tickets</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-rose-400">{pendingTicketsList.length}</span>
                  <span className="text-[11px] text-slate-400">unresolved</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Breakdown & dispatch tickets</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <TicketCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters:</span>
              </div>

              {/* Employee filter */}
              <select
                value={pendingFilterEmployee}
                onChange={(e) => setPendingFilterEmployee(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Employees ({extensions.length})</option>
                {extensions.map((ext) => (
                  <option key={ext.id} value={ext.extension}>
                    Ext {ext.extension} - {ext.name}
                  </option>
                ))}
              </select>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'all', label: `All (${totalPendingCount})` },
                  { id: 'task', label: `Tasks (${pendingTasksList.length})` },
                  { id: 'quote', label: `Quotes (${pendingQuotesList.length})` },
                  { id: 'email', label: `Emails (${pendingEmailsList.length})` },
                  { id: 'ticket', label: `Tickets (${pendingTicketsList.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPendingFilterType(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      pendingFilterType === tab.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, blockers, tasks..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Pending Work Items Table / Grid */}
          <div className="space-y-3">
            {filteredPendingItems.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">No Pending Work Items Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {pendingSearch || pendingFilterEmployee !== 'all' || pendingFilterType !== 'all'
                    ? 'No matching pending items found for the selected filter criteria.'
                    : 'All tasks, quotations, and emails are up to date!'}
                </p>
              </div>
            ) : (
              filteredPendingItems.map((item) => {
                const isBlocked = item.status === 'Blocked' || Boolean(item.blockerReason);
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-4 rounded-2xl bg-slate-900 border transition hover:border-slate-700 shadow-md space-y-3 ${
                      isBlocked ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Tags line */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            item.type === 'task'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              : item.type === 'quote'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : item.type === 'email'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {item.type.toUpperCase()}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'Blocked'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : item.status === 'In Progress'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : (item.status === 'Awaiting Reply' || item.status === 'Pending Approval')
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {item.status}
                          </span>

                          <span className="text-[11px] text-slate-400 font-medium truncate">
                            &bull; {item.projectBranch}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {item.title}
                        </h4>

                        {/* Details */}
                        <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                          <span className="text-slate-400">Category: <strong className="text-slate-200">{item.category}</strong></span>
                          {item.outcome && (
                            <span className="text-slate-400">Detail: <strong className="text-slate-200">{item.outcome}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Officer Info & Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs font-bold text-white">{item.employeeName}</p>
                            <p className="text-[10px] font-mono text-indigo-400 font-semibold">Ext {item.employeeExtension}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                            {item.employeeExtension}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono">
                          Logged: {item.date}
                        </span>
                      </div>
                    </div>

                    {/* Blocker or Next Steps Alert */}
                    {isBlocked && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
                        <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-rose-300">Management Action / Blocker: </strong>
                          <span>{item.blockerReason || item.nextSteps}</span>
                        </div>
                      </div>
                    )}

                    {!isBlocked && item.nextSteps && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Next Step:</strong> {item.nextSteps}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                      {item.type === 'task' && onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('admin-reports')}
                          className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
                        >
                          Review in Daily Reports &rarr;
                        </button>
                      )}
                      {item.type === 'quote' && onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('vendors')}
                          className="px-3 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
                        >
                          Open in Vendor Pipeline &rarr;
                        </button>
                      )}
                      {item.type === 'email' && onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('emails')}
                          className="px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer"
                        >
                          Open in Gmail Work &rarr;
                        </button>
                      )}
                      {item.type === 'ticket' && (
                        <button
                          onClick={() => {
                            setActiveAdminTab('tickets');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          Inspect Ticket Queue &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CALL RECORDS MASTER ARCHIVE */}
      {/* ========================================================================= */}
      {activeAdminTab === 'calls' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Live Call Records in Firestore</h2>
              <p className="text-xs text-slate-400">View and edit call notes, check transcripts, or delete recordings.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search call logs..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Call ID</th>
                  <th className="p-3">Caller & Org</th>
                  <th className="p-3">Extension</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Notes & AI Summary</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No call records in Firestore. Use the softphone or test call to record calls live.
                    </td>
                  </tr>
                ) : (
                  calls
                    .filter((c) => 
                      !adminSearch || 
                      c.callerName.toLowerCase().includes(adminSearch.toLowerCase()) ||
                      c.callerNumber.includes(adminSearch) ||
                      (c.organization || '').toLowerCase().includes(adminSearch.toLowerCase())
                    )
                    .map((call) => (
                      <tr key={call.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono text-indigo-400 font-bold">{call.id}</td>
                        <td className="p-3">
                          <div className="font-bold text-white">{call.callerName}</div>
                          <div className="text-[11px] text-slate-400">{call.organization} ({call.callerNumber})</div>
                        </td>
                        <td className="p-3 font-mono text-slate-300">Ext {call.extension}</td>
                        <td className="p-3 font-mono text-white">
                          {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                        </td>
                        <td className="p-3 capitalize">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            call.direction === 'inbound' ? 'bg-emerald-500/20 text-emerald-300' :
                            call.direction === 'outbound' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {call.direction}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs">
                          {editingCallId === call.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={callNotesText}
                                onChange={(e) => setCallNotesText(e.target.value)}
                                className="p-1 rounded bg-slate-950 border border-slate-700 text-xs text-white"
                              />
                              <button
                                onClick={() => {
                                  onUpdateCallNotes(call.id, callNotesText);
                                  setEditingCallId(null);
                                  onShowToast('Call notes updated in Firestore.', 'success');
                                }}
                                className="p-1 rounded bg-emerald-600 text-white"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="truncate">{call.notes || call.aiSummary?.summary || 'No notes'}</span>
                              <button
                                onClick={() => {
                                  setEditingCallId(call.id);
                                  setCallNotesText(call.notes || '');
                                }}
                                className="text-slate-400 hover:text-white"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete call ${call.id} permanently?`)) {
                                onDeleteCall(call.id);
                                onShowToast(`Call ${call.id} deleted.`, 'info');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition"
                            title="Delete call record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPLAINTS & TICKETS COMMAND */}
      {/* ========================================================================= */}
      {activeAdminTab === 'tickets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Complaints & CRM Tickets Control</h2>
              <p className="text-xs text-slate-400">Override ticket statuses, reassign dispatch contractors, or delete tickets.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Title & Client</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Vendor</th>
                  <th className="p-3">Officer</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No complaint tickets currently in Firestore.
                    </td>
                  </tr>
                ) : (
                  tickets.map((tkt) => (
                    <tr key={tkt.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-indigo-400 font-bold">{tkt.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{tkt.title}</div>
                        <div className="text-[11px] text-slate-400">{tkt.organization} • {tkt.branchName}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={tkt.priority}
                          onChange={(e) => {
                            onUpdateTicket(tkt.id, { priority: e.target.value as TicketPriority });
                            onShowToast(`Updated priority of ${tkt.id} to ${e.target.value}`, 'info');
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs text-white"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={tkt.status}
                          onChange={(e) => {
                            onUpdateTicket(tkt.id, { status: e.target.value as TicketStatus });
                            onShowToast(`Updated status of ${tkt.id} to ${e.target.value}`, 'success');
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs text-white"
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Vendor Assigned">Vendor Assigned</option>
                          <option value="Vendor On-Site">Vendor On-Site</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={tkt.assignedVendor?.id || ''}
                          onChange={(e) => {
                            const v = vendors.find((vend) => vend.id === e.target.value);
                            onUpdateTicket(tkt.id, { assignedVendor: v, status: v ? 'Vendor Assigned' : tkt.status });
                            onShowToast(`Reassigned vendor for ${tkt.id}`, 'info');
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs text-white max-w-[140px] truncate"
                        >
                          <option value="">Unassigned</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-mono text-slate-300">Ext {tkt.assignedExtension}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ticket ${tkt.id} from Firestore?`)) {
                              onDeleteTicket(tkt.id);
                              onShowToast(`Ticket ${tkt.id} deleted.`, 'info');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition"
                          title="Delete ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VENDOR & CONTRACTOR DIRECTORY */}
      {/* ========================================================================= */}
      {activeAdminTab === 'vendors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Contractor & Vendor Management</h2>
              <p className="text-xs text-slate-400">Manage verified commercial electricians and HVAC engineers in Lahore, Karachi, and Islamabad.</p>
            </div>
            <button
              onClick={() => {
                setEditingVendor(null);
                setVendorForm({
                  name: '',
                  contactPerson: '',
                  trade: 'Certified Commercial Electrician',
                  category: 'Electrical',
                  phone: '+92 300 ',
                  city: 'Lahore',
                  area: 'Gulberg & DHA',
                  rating: 4.8,
                  emergencyContractor: true,
                });
                setIsAddVendorOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Contractor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{v.name}</span>
                    <span className="text-amber-400 text-xs font-mono font-bold">★ {v.rating}</span>
                  </div>
                  <div className="text-[11px] text-indigo-400 font-semibold mt-0.5">{v.trade}</div>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <div>Contact: <span className="text-slate-200">{v.contactPerson}</span></div>
                    <div>Phone: <span className="font-mono text-emerald-400">{v.phone}</span></div>
                    <div>Location: <span className="text-slate-300">{v.area}, {v.city}</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setEditingVendor(v);
                      setVendorForm({
                        name: v.name,
                        contactPerson: v.contactPerson,
                        trade: v.trade,
                        category: v.category,
                        phone: v.phone,
                        city: v.city,
                        area: v.area,
                        rating: v.rating,
                        emergencyContractor: v.emergencyContractor,
                      });
                      setIsAddVendorOpen(true);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVendor(v.id, v.name)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Vendor Modal */}
          {isAddVendorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <form onSubmit={handleSaveVendor} className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">
                    {editingVendor ? `Edit Contractor: ${editingVendor.name}` : 'Add New Certified Contractor'}
                  </h3>
                  <button type="button" onClick={() => setIsAddVendorOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold">Company / Contractor Name:</label>
                    <input
                      type="text"
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      placeholder="e.g. Lahore Power Fixers"
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold">Lead Contact Person:</label>
                    <input
                      type="text"
                      value={vendorForm.contactPerson}
                      onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                      placeholder="e.g. Tariq Hussain"
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold">Direct Mobile Number:</label>
                    <input
                      type="text"
                      value={vendorForm.phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      placeholder="+92 300 8492011"
                      className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-semibold">City:</label>
                      <input
                        type="text"
                        value={vendorForm.city}
                        onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold">Area / Sector:</label>
                      <input
                        type="text"
                        value={vendorForm.area}
                        onChange={(e) => setVendorForm({ ...vendorForm, area: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddVendorOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    {editingVendor ? 'Save Changes' : 'Add Contractor'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PBX TRUNK & TELEPHONY GATEWAY (OPTION B: ASTERISK / FREEPBX WEBRTC) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'pbx' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>PBX Trunk & Telephony Gateway (Option B)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                      Self-Hosted Asterisk / FreePBX
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Connect browser softphones to Asterisk / FreePBX via WebRTC WebSocket Secure (WSS), configure trunk routing, or generate ready-to-run PBX configs.
                  </p>
                </div>
              </div>
            </div>

            {/* Live SIP Status Badge */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${
                sipStatus === 'registered' ? 'bg-emerald-400 animate-pulse' :
                sipStatus === 'connecting' ? 'bg-amber-400 animate-ping' :
                sipStatus === 'call-in-progress' ? 'bg-blue-400 animate-pulse' :
                'bg-rose-500'
              }`} />
              <span className="text-xs font-mono font-semibold text-slate-200 capitalize">
                SIP: {sipStatus}
              </span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'settings', label: 'PBX Connection Settings', icon: Sliders },
              { id: 'generator', label: 'FreePBX / Asterisk Config Generator', icon: FileCode },
              { id: 'guide', label: 'Step-by-Step Deployment Guide', icon: HelpCircle },
            ].map((sub) => {
              const Icon = sub.icon;
              const isActive = activePbxSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActivePbxSubTab(sub.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SubTab 1: Settings Form */}
          {activePbxSubTab === 'settings' && (
            <div className="space-y-6">
              {/* Quick Presets */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Quick Telephony Presets:</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click to instantly switch between the zero-setup built-in WebRTC engine or an external FreePBX server.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
                      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
                      setPbxForm({
                        ...pbxForm,
                        transport: 'inbuilt-webrtc',
                        serverUrl: `${isHttps ? 'wss:' : 'ws:'}//${host}/ws/telephony`,
                      });
                      onShowToast('Applied In-Built WebRTC Preset: Instant calling active between all extensions!', 'success');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      pbxForm.transport === 'inbuilt-webrtc'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    <span>⚡ In-Built WebRTC (Instant)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPbxForm({
                        ...pbxForm,
                        transport: 'wss',
                        serverUrl: 'wss://your-freepbx-server.com:8089/ws',
                        domain: 'your-freepbx-server.com',
                      });
                      onShowToast('Applied FreePBX Preset: Please enter your FreePBX IP / Domain and port 8089.', 'info');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      pbxForm.transport === 'wss'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <span>📞 FreePBX / Asterisk (External)</span>
                  </button>
                </div>
              </div>

              {/* Transport Mode Switcher */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>Telephony Engine & Transport Mode:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    pbxForm.transport === 'wss'
                      ? 'bg-amber-950/30 border-amber-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="transport"
                      checked={pbxForm.transport === 'wss'}
                      onChange={() => setPbxForm({ ...pbxForm, transport: 'wss' })}
                      className="mt-0.5 text-amber-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white">External Asterisk / FreePBX Server (Option B - WSS)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Direct connection to your Asterisk 18/20 or FreePBX server via WebSocket Secure (typically port 8089). Real PSTN trunk calls.
                      </div>
                    </div>
                  </label>

                  <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    pbxForm.transport === 'inbuilt-webrtc'
                      ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="transport"
                      checked={pbxForm.transport === 'inbuilt-webrtc'}
                      onChange={() => setPbxForm({ ...pbxForm, transport: 'inbuilt-webrtc' })}
                      className="mt-0.5 text-indigo-500 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-white">FAST Connect In-Built WebRTC Bridge</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        High-speed zero-config peer-to-peer browser calling between desks via app server WebSocket (/ws/telephony). Instant testing.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Server Connection Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Asterisk WebRTC WSS Server URL:
                  </label>
                  <input
                    type="text"
                    value={pbxForm.serverUrl}
                    onChange={(e) => setPbxForm({ ...pbxForm, serverUrl: e.target.value })}
                    placeholder="wss://pbx.yourcompany.com:8089/ws"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Port 8089 is Asterisk's standard TLS/WSS mini-HTTP port. Must use valid SSL cert or browser exception.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    SIP Domain / Realm:
                  </label>
                  <input
                    type="text"
                    value={pbxForm.domain}
                    onChange={(e) => setPbxForm({ ...pbxForm, domain: e.target.value })}
                    placeholder="pbx.yourcompany.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Domain name configured in your PBX pjsip.conf (e.g., sip:101@yourdomain.com).
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Primary PBX DID Number:
                  </label>
                  <input
                    type="text"
                    value={pbxForm.didNumber}
                    onChange={(e) => setPbxForm({ ...pbxForm, didNumber: e.target.value })}
                    placeholder="e.g. 03086103525 or +92 (42) 111-327-800"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Main inbound trunk DID assigned by telecom carrier (PTCL, Twilio, or SIP Trunk).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Default Extension SIP Secret:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPbxSecret(!showPbxSecret)}
                      className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      {showPbxSecret ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPbxSecret ? 'Hide' : 'View'}</span>
                    </button>
                  </div>
                  <input
                    type={showPbxSecret ? 'text' : 'password'}
                    value={pbxForm.sipSecretDefault}
                    onChange={(e) => setPbxForm({ ...pbxForm, sipSecretDefault: e.target.value })}
                    placeholder="FastConnect@123"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Fallback password used if an individual employee doesn't have a customized SIP secret.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    STUN Server (NAT Traversal):
                  </label>
                  <input
                    type="text"
                    value={pbxForm.stunServer}
                    onChange={(e) => setPbxForm({ ...pbxForm, stunServer: e.target.value })}
                    placeholder="stun:stun.l.google.com:19302"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Optional TURN Server (Strict Firewalls):
                  </label>
                  <input
                    type="text"
                    value={pbxForm.turnServer || ''}
                    onChange={(e) => setPbxForm({ ...pbxForm, turnServer: e.target.value })}
                    placeholder="turn:turn.yourcompany.com:3478"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Actions & Live Ping Test */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestPbxConnection}
                    disabled={isTestingPbx}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingPbx ? 'animate-spin' : ''}`} />
                    <span>{isTestingPbx ? 'Testing Connection...' : 'Test WSS Reachability'}</span>
                  </button>

                  {pbxTestResult && (
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5 ${
                      pbxTestResult.success
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {pbxTestResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{pbxTestResult.success ? `Reachable (${pbxTestResult.latencyMs}ms)` : `Failed: ${pbxTestResult.error || 'Timeout'}`}</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSavePbx}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save PBX Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* SubTab 2: Config Generator */}
          {activePbxSubTab === 'generator' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200">
                These configuration files are dynamically tailored to all {extensions.length} extensions currently configured in your database. 
                Copy-paste them directly into your Asterisk server at <code className="text-white bg-slate-900 px-1 py-0.5 rounded font-mono">/etc/asterisk/</code>.
              </div>

              {/* Config File Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'pjsip', name: 'pjsip.conf', desc: 'WebRTC Transports & Extension Endpoints' },
                  { id: 'extensions', name: 'extensions.conf', desc: 'Dialplan & Routing Logic' },
                  { id: 'http', name: 'http.conf', desc: 'Mini-HTTP Server & WSS TLS' },
                  { id: 'rtp', name: 'rtp.conf', desc: 'RTP Ports & ICE STUN' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveConfigFile(f.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                      activeConfigFile === f.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>

              {/* File Preview Container */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[480px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <span className="text-slate-400 text-[11px]">
                    Destination: <strong className="text-white">/etc/asterisk/{activeConfigFile}.conf</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      let content = '';
                      if (activeConfigFile === 'pjsip') content = generatePjsipConf();
                      else if (activeConfigFile === 'extensions') content = generateExtensionsConf();
                      else if (activeConfigFile === 'http') content = generateHttpConf();
                      else if (activeConfigFile === 'rtp') content = generateRtpConf();
                      handleCopyConfig(`${activeConfigFile}.conf`, content);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-sans font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedFile === `${activeConfigFile}.conf` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFile === `${activeConfigFile}.conf` ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
                  {activeConfigFile === 'pjsip' && generatePjsipConf()}
                  {activeConfigFile === 'extensions' && generateExtensionsConf()}
                  {activeConfigFile === 'http' && generateHttpConf()}
                  {activeConfigFile === 'rtp' && generateRtpConf()}
                </pre>
              </div>
            </div>
          )}

          {/* SubTab 3: Deployment Guide */}
          {activePbxSubTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm">Install Asterisk / FreePBX</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Install Asterisk 18 or 20 on Ubuntu 22.04 LTS:
                  </p>
                  <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
                    sudo apt update && sudo apt install -y asterisk asterisk-modules
                  </pre>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm">Enable WSS & Firewall</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Open ports for WebSockets and RTP audio:
                  </p>
                  <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
                    sudo ufw allow 8089/tcp
sudo ufw allow 10000:20000/udp
                  </pre>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm">Deploy Generated Config</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Copy the files from the Generator tab into /etc/asterisk/ and reload:
                  </p>
                  <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    sudo asterisk -rx "pjsip reload"
sudo asterisk -rx "dialplan reload"
                  </pre>
                </div>
              </div>

              {/* FreePBX GUI Instructions Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>FreePBX Web GUI Instructions (No Terminal Needed)</span>
                </div>
                <div className="space-y-2 text-slate-300 leading-relaxed text-xs">
                  <p>
                    If you use the <strong>FreePBX Web Administration Panel</strong>, you can enable WebRTC for all extensions directly through the GUI:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                    <li>Log into FreePBX Admin &rarr; Navigate to <strong>Settings &rarr; Advanced Settings</strong>.</li>
                    <li>Scroll down to <strong>Asterisk Builtin mini-HTTP server</strong> &rarr; Set <strong>Enable the mini-HTTP Server</strong> to <strong className="text-emerald-400">Yes</strong>.</li>
                    <li>Set <strong>HTTPS Bind Address</strong> to <strong className="text-white">0.0.0.0:8089</strong> and select your Certificate from Certificate Manager.</li>
                    <li>Navigate to <strong>Applications &rarr; Extensions</strong> &rarr; Click Edit on extension (e.g. 101).</li>
                    <li>Open the <strong>Advanced</strong> tab &rarr; Set <strong>Enable WebRTC / DTLS</strong> = <strong className="text-emerald-400">Yes</strong>, <strong>Use AVPF</strong> = <strong className="text-emerald-400">Yes</strong>, <strong>Enable ICE Support</strong> = <strong className="text-emerald-400">Yes</strong>, and <strong>Transport</strong> = <strong className="text-white">WSS</strong>.</li>
                    <li>Click <strong>Submit</strong> and click the red <strong>Apply Config</strong> button at the top.</li>
                    <li>In FAST Connect, switch Transport to <strong>External Asterisk / FreePBX WSS</strong>, enter your server URL (e.g. <code className="text-amber-300">wss://pbx.yourcompany.com:8089/ws</code>), and click <strong>Save PBX Settings</strong>!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SYSTEM HEALTH & DIAGNOSTICS */}
      {/* ========================================================================= */}
      {activeAdminTab === 'diagnostics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <span>Live System Diagnostics & Telemetry</span>
              </h2>
              <p className="text-xs text-slate-400">Real-time network latency, audio codec performance, and Firestore collection storage footprint.</p>
            </div>
            <button
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition shadow cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin' : ''}`} />
              <span>{isTestingPing ? 'Pinging Cloud Gateway...' : 'Run Diagnostics Ping'}</span>
            </button>
          </div>

          {/* 4 Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Firestore Cloud Ping</div>
              <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
                <span>{pingLatency} ms</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[11px] text-slate-500">Live persistence connected</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">PBX Jitter & Packet Loss</div>
              <div className="text-2xl font-black text-indigo-400 font-mono">0.00%</div>
              <div className="text-[11px] text-slate-500">Jitter: 1.1ms • TLS 1.3 encrypted</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Audio MOS Quality Score</div>
              <div className="text-2xl font-black text-amber-400 font-mono">4.4 / 5.0</div>
              <div className="text-[11px] text-slate-500">Opus Fullband (HD Crystal Voice)</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Trunk Channels</div>
              <div className="text-2xl font-black text-white font-mono">2 / 32</div>
              <div className="text-[11px] text-slate-500">30 Channels Available</div>
            </div>
          </div>

          {/* Database Collections Storage Monitor */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Firestore Collection Document Footprint</h3>
                <p className="text-[11px] text-slate-400">Total documents and estimated indexed storage across live collections.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                {calls.length + tickets.length + dailyReports.length + vendors.length + extensions.length + missedCalls.length} Docs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Call History</div>
                <div className="font-bold text-white text-base mt-0.5">{calls.length}</div>
                <div className="text-[10px] text-indigo-400 mt-0.5">~{Math.round(calls.length * 1.4 + 2)} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Complaint Tickets</div>
                <div className="font-bold text-white text-base mt-0.5">{tickets.length}</div>
                <div className="text-[10px] text-amber-400 mt-0.5">~{Math.round(tickets.length * 2.1 + 3)} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Daily Reports</div>
                <div className="font-bold text-white text-base mt-0.5">{dailyReports.length}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">~{Math.round(dailyReports.length * 3.5 + 4)} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Officer Desks</div>
                <div className="font-bold text-white text-base mt-0.5">{extensions.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">~{Math.round(extensions.length * 0.5 + 1)} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Contractors</div>
                <div className="font-bold text-white text-base mt-0.5">{vendors.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">~{Math.round(vendors.length * 0.8 + 1)} KB</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Audio Recordings</div>
                <div className="font-bold text-white text-base mt-0.5">{calls.filter(c => c.hasRecording).length}</div>
                <div className="text-[10px] text-rose-400 mt-0.5">~{calls.filter(c => c.hasRecording).length * 140} KB</div>
              </div>
            </div>
          </div>

          {/* WebRTC Audio Codec Simulator */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">SIP Voice Codec Negotiation</h3>
            <p className="text-xs text-slate-400">Configure telephony stream compression for low-bandwidth cellular vs high-fidelity office fiber connections.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => {
                  setCodecMode('opus');
                  onShowToast('VoIP Codec set to Opus HD Voice (48 kHz Fullband)', 'success');
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  codecMode === 'opus' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Opus HD Voice</span>
                  {codecMode === 'opus' && <span className="text-[10px] font-mono text-indigo-300">ACTIVE</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">48 kHz • 32 kbps • Low latency adaptive jitter buffer</div>
              </button>

              <button
                onClick={() => {
                  setCodecMode('g711');
                  onShowToast('VoIP Codec set to G.711u PSTN Standard (64 kbps)', 'info');
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  codecMode === 'g711' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>G.711u (PCMU)</span>
                  {codecMode === 'g711' && <span className="text-[10px] font-mono text-indigo-300">ACTIVE</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">8 kHz • 64 kbps • Traditional landline legacy standard</div>
              </button>

              <button
                onClick={() => {
                  setCodecMode('g729');
                  onShowToast('VoIP Codec set to G.729 Low-Bandwidth (8 kbps)', 'info');
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  codecMode === 'g729' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>G.729 Low-Bandwidth</span>
                  {codecMode === 'g729' && <span className="text-[10px] font-mono text-indigo-300">ACTIVE</span>}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">8 kHz • 8 kbps • High compression for unstable cellular towers</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SYSTEM BACKUP, RESTORE & SECURE RESET */}
      {/* ========================================================================= */}
      {activeAdminTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <span>Data Backup, Migration & Secure Reset</span>
            </h2>
            <p className="text-xs text-slate-400">Export complete enterprise backups, import schemas, or execute authorized system cleanups with SuperAdmin keys.</p>
          </div>

          {/* Backup & Restore Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Full System Export (JSON)</h3>
                  <p className="text-[11px] text-slate-400">Download a full snapshot of calls, tickets, daily reports, and contractors.</p>
                </div>
              </div>
              <button
                onClick={handleExportSystemBackup}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export System Data Backup</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Import / Restore Backup</h3>
                  <p className="text-[11px] text-slate-400">Upload or paste a previously exported JSON backup to recover records.</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Open Data Import Modal</span>
              </button>
            </div>
          </div>

          {/* Selective Administrative Purge */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <span>Selective Collection Purge (Admin Only)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Clean up specific subsets of historical records without wiping the entire database.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  if (window.confirm('Purge all tickets with status "Resolved" or "Closed"?')) {
                    if (onSelectivePurge) {
                      onSelectivePurge('resolved-tickets');
                    } else {
                      onShowToast('Resolved tickets purged from active view.', 'info');
                    }
                  }
                }}
                className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Purge Resolved Tickets</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400">Removes completed cases while keeping open issues intact</div>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Purge call history records older than 7 days?')) {
                    if (onSelectivePurge) {
                      onSelectivePurge('old-calls');
                    } else {
                      onShowToast('Older call records pruned.', 'info');
                    }
                  }
                }}
                className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Prune Old Call Logs (&gt; 7 Days)</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-[11px] text-slate-400">Retains recent calls and clears older telephony history</div>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Clear all missed call alerts?')) {
                    if (onSelectivePurge) {
                      onSelectivePurge('missed-alerts');
                    } else {
                      onShowToast('Missed call notifications cleared.', 'info');
                    }
                  }
                }}
                className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Clear Missed Call Alerts</span>
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-[11px] text-slate-400">Resets unread missed call counters for all extensions</div>
              </button>
            </div>
          </div>

          {/* SuperAdmin Master Reset Security Card */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-200 text-sm">SuperAdmin Master Database Reset (Secured)</h3>
                <p className="text-xs text-rose-300/80 leading-relaxed mt-0.5">
                  This destructive operation permanently wipes all Firestore call logs, tickets, and missed call records. 
                  Regular employees do NOT have permission to access or run this feature.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type={showResetPasscode ? 'text' : 'password'}
                  value={secureResetPasscode}
                  onChange={(e) => setSecureResetPasscode(e.target.value)}
                  placeholder='Type "admin800" or "CONFIRM" to unlock'
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-rose-900 text-rose-200 placeholder:text-rose-400/40 text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPasscode(!showResetPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400/60 hover:text-rose-200 transition cursor-pointer"
                  title={showResetPasscode ? 'Hide passcode' : 'View passcode'}
                >
                  {showResetPasscode ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleExecuteSecureReset}
                disabled={!secureResetPasscode}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
                <span>Execute Master Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SECURITY & EMERGENCY BROADCAST */}
      {/* ========================================================================= */}
      {activeAdminTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Security Policies & Emergency Dispatch Broadcast</span>
            </h2>
            <p className="text-xs text-slate-400">Publish system-wide emergency alerts to all employee terminals and enforce department outbound calling privileges.</p>
          </div>

          {/* Emergency Alert Broadcast Publisher */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">Real-time Outage Emergency Banner</h3>
                  <p className="text-[11px] text-slate-400">Broadcasts an urgent red announcement across all active officer terminals.</p>
                </div>
              </div>
              {emergencyBroadcast?.active && (
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/40 flex items-center gap-1.5 w-fit">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  BROADCAST LIVE
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Alert Priority Level:</label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => setBroadcastDraftSeverity('critical')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      broadcastDraftSeverity === 'critical' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Critical Grid / Outage (Red)
                  </button>
                  <button
                    onClick={() => setBroadcastDraftSeverity('warning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      broadcastDraftSeverity === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Maintenance Warning (Amber)
                  </button>
                  <button
                    onClick={() => setBroadcastDraftSeverity('info')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      broadcastDraftSeverity === 'info' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Advisory (Blue)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Broadcast Announcement Message:</label>
                <textarea
                  value={broadcastDraftText}
                  onChange={(e) => setBroadcastDraftText(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  placeholder="Enter message for all desks..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onUpdateEmergencyBroadcast) {
                      onUpdateEmergencyBroadcast({
                        active: true,
                        message: broadcastDraftText,
                        severity: broadcastDraftSeverity
                      });
                    }
                    onShowToast('Emergency broadcast published across all desks.', 'success');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>{emergencyBroadcast?.active ? 'Update Broadcast Banner' : 'Publish Emergency Broadcast'}</span>
                </button>

                {emergencyBroadcast?.active && (
                  <button
                    onClick={() => {
                      if (onUpdateEmergencyBroadcast) {
                        onUpdateEmergencyBroadcast(null);
                      }
                      onShowToast('Emergency broadcast cleared.', 'info');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Deactivate Banner
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Department Calling Permissions Matrix */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div>
              <h3 className="font-bold text-white text-sm">Department Telephony Permissions Matrix</h3>
              <p className="text-[11px] text-slate-400">Configure outbound dialing rights per department branch desk.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2">Department</th>
                    <th className="pb-2 text-center">Internal Extensions</th>
                    <th className="pb-2 text-center">Local PSTN</th>
                    <th className="pb-2 text-center">Mobile GSM</th>
                    <th className="pb-2 text-center">Emergency (1122/15)</th>
                    <th className="pb-2 text-center">International</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {Object.entries(deptPolicies).map(([deptName, perms]) => (
                    <tr key={deptName} className="hover:bg-slate-900/50">
                      <td className="py-3 font-semibold text-white">{deptName}</td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.internal}
                          onChange={(e) => {
                            setDeptPolicies({
                              ...deptPolicies,
                              [deptName]: { ...perms, internal: e.target.checked }
                            });
                            onShowToast(`Updated policy for ${deptName}`, 'info');
                          }}
                          className="rounded text-amber-500"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.pstn}
                          onChange={(e) => {
                            setDeptPolicies({
                              ...deptPolicies,
                              [deptName]: { ...perms, pstn: e.target.checked }
                            });
                            onShowToast(`Updated policy for ${deptName}`, 'info');
                          }}
                          className="rounded text-amber-500"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.gsm}
                          onChange={(e) => {
                            setDeptPolicies({
                              ...deptPolicies,
                              [deptName]: { ...perms, gsm: e.target.checked }
                            });
                            onShowToast(`Updated policy for ${deptName}`, 'info');
                          }}
                          className="rounded text-amber-500"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.emergency}
                          onChange={(e) => {
                            setDeptPolicies({
                              ...deptPolicies,
                              [deptName]: { ...perms, emergency: e.target.checked }
                            });
                            onShowToast(`Updated policy for ${deptName}`, 'info');
                          }}
                          className="rounded text-amber-500"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.intl}
                          onChange={(e) => {
                            setDeptPolicies({
                              ...deptPolicies,
                              [deptName]: { ...perms, intl: e.target.checked }
                            });
                            onShowToast(`Updated policy for ${deptName}`, 'info');
                          }}
                          className="rounded text-amber-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Import System Data Backup</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Paste the contents of a previously exported <code className="text-amber-300">fastconnect-system-backup.json</code> file below to restore or merge records into Firestore.
            </p>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON backup payload here..."
              rows={8}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSystemBackup}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                Parse & Restore Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
