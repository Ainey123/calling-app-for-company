import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOutgoing, 
  PhoneOff, 
  Smartphone, 
  Radio, 
  Signal, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  MapPin, 
  User, 
  FileText, 
  TicketCheck, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  X,
  Volume2,
  CalendarClock
} from 'lucide-react';
import { 
  CallRecord, 
  ComplaintTicket, 
  EmployeeExtension, 
  Vendor, 
  CallOutcome, 
  SimProfile, 
  SimCallFormState 
} from '../types';
import { soundEngine } from '../utils/audio';
import { liveStore } from '../services/liveStore';

interface SimCallingViewProps {
  currentExtension: EmployeeExtension;
  tickets: ComplaintTicket[];
  vendors: Vendor[];
  calls: CallRecord[];
  onCallLogged: (call: CallRecord) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onSelectTicket?: (ticketId: string) => void;
}

interface ActiveSimCallSession {
  id: string;
  recipientPhone: string;
  recipientName: string;
  organization: string;
  branch: string;
  simSlot: 'SIM 1' | 'SIM 2';
  simCarrier: string;
  startTime: number;
  durationSeconds: number;
  category: string;
  linkedTicketId?: string;
  notes: string;
  status: 'dialing' | 'connected' | 'ended';
  outcome: CallOutcome;
}

const COUNTRY_CODES = [
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
];

const QUICK_BANKS = [
  { org: 'Habib Bank Limited (HBL)', branch: 'Main Gulberg Branch', city: 'Lahore', phone: '+92 42 35789012', contact: 'Kashif Mehmood (Branch Manager)' },
  { org: 'Meezan Bank Limited', branch: 'DHA Phase 5 Commercial', city: 'Lahore', phone: '+92 42 37189004', contact: 'Ahsan Qureshi (Facility Officer)' },
  { org: 'MCB Bank Limited', branch: 'Mall Road Regional Office', city: 'Lahore', phone: '+92 42 36301122', contact: 'Usman Ghani (Operations Head)' },
  { org: 'Allied Bank Limited (ABL)', branch: 'Gulberg III Branch', city: 'Lahore', phone: '+92 42 35874455', contact: 'Rehan Siddiqui (Admin In-Charge)' },
  { org: 'United Bank Limited (UBL)', branch: 'Liberty Market Branch', city: 'Lahore', phone: '+92 42 35759900', contact: 'Bilal Farooq (Operations Officer)' }
];

export const SimCallingView: React.FC<SimCallingViewProps> = ({
  currentExtension,
  tickets,
  vendors,
  calls,
  onCallLogged,
  onShowToast,
  onSelectTicket,
}) => {
  // SIM Profiles State
  const [simProfiles, setSimProfiles] = useState<SimProfile[]>(() => liveStore.getSimProfiles());
  const [selectedSlot, setSelectedSlot] = useState<'SIM 1' | 'SIM 2'>('SIM 1');

  // Form State
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneInput, setPhoneInput] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [organization, setOrganization] = useState('Habib Bank Limited (HBL)');
  const [branch, setBranch] = useState('Main Gulberg Branch');
  const [city, setCity] = useState('Lahore');
  const [callCategory, setCallCategory] = useState('Emergency Site Breakdown Dispatch');
  const [linkedTicketId, setLinkedTicketId] = useState<string>('');
  const [preCallNotes, setPreCallNotes] = useState('');
  const [autoOpenDialer, setAutoOpenDialer] = useState(true);

  // Active SIM Call Session State
  const [activeSession, setActiveSession] = useState<ActiveSimCallSession | null>(null);
  const activeSessionRef = useRef<ActiveSimCallSession | null>(null);
  activeSessionRef.current = activeSession;

  // Search & Filter for SIM call ledger
  const [searchLedger, setSearchLedger] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return ts;
  };

  // Live timer for active SIM call
  useEffect(() => {
    let timer: any = null;
    if (activeSession && activeSession.status !== 'ended') {
      timer = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            durationSeconds: Math.floor((Date.now() - prev.startTime) / 1000),
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSession?.startTime, activeSession?.status]);

  // Clean full phone number
  const getFullPhoneNumber = () => {
    const raw = phoneInput.trim();
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    if (raw.startsWith('0')) {
      return `${countryCode} ${raw.slice(1)}`;
    }
    return `${countryCode} ${raw}`;
  };

  const getCleanDialUri = () => {
    const full = getFullPhoneNumber();
    return full.replace(/[^0-9+]/g, '');
  };

  // Launch Live SIM Call
  const handleInitiateSimCall = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = getFullPhoneNumber();
    if (!cleanPhone || cleanPhone.length < 7) {
      onShowToast('Please enter a valid recipient phone number.', 'error');
      return;
    }

    const carrier = simProfiles.find(s => s.slot === selectedSlot)?.carrierName || 'Cellular Carrier';

    soundEngine.playDtmf('3');
    soundEngine.playConnectedChime();

    // Trigger native tel: URI for mobile browsers or desktop Phone Link
    if (autoOpenDialer) {
      const dialUri = `tel:${getCleanDialUri()}`;
      try {
        const link = document.createElement('a');
        link.href = dialUri;
        link.click();
      } catch (err) {
        window.location.href = dialUri;
      }
    }

    const newSession: ActiveSimCallSession = {
      id: `sim-call-${Date.now()}`,
      recipientPhone: cleanPhone,
      recipientName: recipientName.trim() || `Client Contact (${cleanPhone})`,
      organization: organization.trim() || 'Client Organization',
      branch: branch.trim() || 'Lahore Region',
      simSlot: selectedSlot,
      simCarrier: carrier,
      startTime: Date.now(),
      durationSeconds: 0,
      category: callCategory,
      linkedTicketId: linkedTicketId || undefined,
      notes: preCallNotes.trim(),
      status: 'connected',
      outcome: 'Call Completed',
    };

    setActiveSession(newSession);
    onShowToast(`Cellular SIM call initiated via ${selectedSlot} (${carrier}) to ${cleanPhone}.`, 'success');
  };

  // Complete and save the active SIM call to live data
  const handleEndAndSaveSession = (outcomeOverride?: CallOutcome) => {
    if (!activeSession) return;
    soundEngine.playDisconnectTone();

    const duration = Math.max(activeSession.durationSeconds, 1);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const newRecord: CallRecord = {
      id: activeSession.id,
      callerNumber: activeSession.recipientPhone,
      callerName: activeSession.recipientName,
      organization: activeSession.organization,
      branch: activeSession.branch,
      city: city || 'Lahore',
      extension: currentExtension.extension,
      agentName: currentExtension.name,
      direction: 'outbound',
      timestamp: 'Just now',
      durationSeconds: duration,
      status: 'completed',
      callOutcome: outcomeOverride || activeSession.outcome || 'Call Completed',
      hasRecording: false,
      recordingDuration: durationStr,
      channel: 'sim',
      simSlot: activeSession.simSlot,
      simCarrier: activeSession.simCarrier,
      simPurpose: activeSession.category,
      linkedTicketId: activeSession.linkedTicketId,
      notes: activeSession.notes || `Cellular call via ${activeSession.simSlot} (${activeSession.simCarrier}). Purpose: ${activeSession.category}.`,
      transcript: `[SIM Cellular Call Session]\nAgent: ${currentExtension.name} (Ext ${currentExtension.extension})\nRecipient: ${activeSession.recipientName} (${activeSession.recipientPhone})\nOrganization: ${activeSession.organization} - ${activeSession.branch}\nChannel: Cellular ${activeSession.simSlot} [${activeSession.simCarrier}]\nCall Outcome: ${outcomeOverride || activeSession.outcome}\nNotes: ${activeSession.notes || 'Inquiry addressed.'}`,
    };

    // Save directly to persistent store
    liveStore.saveCall(newRecord);
    onCallLogged(newRecord);

    // If linked to a ticket, update that ticket's timeline and linkedCalls
    if (activeSession.linkedTicketId) {
      const ticketsList = liveStore.getTickets();
      const targetTicket = ticketsList.find(t => t.id === activeSession.linkedTicketId);
      if (targetTicket) {
        const updatedTicket: ComplaintTicket = {
          ...targetTicket,
          linkedCalls: [
            {
              callId: newRecord.id,
              callerName: activeSession.recipientName,
              callerNumber: activeSession.recipientPhone,
              timestamp: 'Just now',
              durationSeconds: duration,
              direction: 'outbound',
              summary: `Cellular ${activeSession.simSlot} Call: ${activeSession.notes || activeSession.category}`,
            },
            ...(targetTicket.linkedCalls || []),
          ],
          timeline: [
            {
              id: `tl-${Date.now()}`,
              timestamp: 'Just now',
              actor: currentExtension.name,
              action: `Cellular SIM Call (${activeSession.simSlot})`,
              note: `Direct phone contact with ${activeSession.recipientName}. Outcome: ${newRecord.callOutcome}. Duration: ${durationStr}.`,
            },
            ...(targetTicket.timeline || []),
          ],
        };
        liveStore.saveTicket(updatedTicket);
      }
    }

    // Add event to Activity Timeline
    liveStore.addActivityEvent({
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeDisplay: 'Just now',
      employeeId: currentExtension.id,
      employeeName: currentExtension.name,
      employeeExtension: currentExtension.extension,
      eventType: 'call-outbound',
      isSystemGenerated: false,
      title: `SIM Call (${activeSession.simSlot}): ${activeSession.recipientName}`,
      description: `Spoke via ${activeSession.simCarrier} to ${activeSession.organization} (${activeSession.recipientPhone}). Talk time: ${durationStr}. Outcome: ${newRecord.callOutcome}.`,
      badgeText: `${activeSession.simSlot} Cellular`,
    });

    setActiveSession(null);
    onShowToast(`Cellular SIM call saved to live records (${durationStr} talk time).`, 'success');
  };

  // Quick Direct Log Without Opening Native Dialer
  const handleQuickLogPastCall = () => {
    const cleanPhone = getFullPhoneNumber();
    if (!cleanPhone || cleanPhone.length < 7) {
      onShowToast('Please enter the recipient phone number.', 'error');
      return;
    }

    const carrier = simProfiles.find(s => s.slot === selectedSlot)?.carrierName || 'Cellular Carrier';
    const newRecord: CallRecord = {
      id: `sim-call-${Date.now()}`,
      callerNumber: cleanPhone,
      callerName: recipientName.trim() || `Client Contact (${cleanPhone})`,
      organization: organization.trim() || 'Client Organization',
      branch: branch.trim() || 'Lahore Region',
      city: city || 'Lahore',
      extension: currentExtension.extension,
      agentName: currentExtension.name,
      direction: 'outbound',
      timestamp: 'Just now',
      durationSeconds: 180,
      status: 'completed',
      callOutcome: 'Price & Terms Confirmed',
      hasRecording: false,
      recordingDuration: '03:00',
      channel: 'sim',
      simSlot: selectedSlot,
      simCarrier: carrier,
      simPurpose: callCategory,
      linkedTicketId: linkedTicketId || undefined,
      notes: preCallNotes.trim() || `Logged manual cellular call via ${selectedSlot} (${carrier}).`,
      transcript: `[SIM Call Logged]\nOfficer: ${currentExtension.name}\nParty: ${recipientName || cleanPhone}\nDetails: ${preCallNotes || callCategory}`,
    };

    liveStore.saveCall(newRecord);
    onCallLogged(newRecord);

    onShowToast(`Logged past SIM call with ${recipientName || cleanPhone} into system records.`, 'success');
  };

  // Copy phone number to clipboard
  const handleCopyNumber = () => {
    const num = getCleanDialUri();
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
    onShowToast(`Copied dial string ${num} to clipboard.`, 'info');
  };

  // Select Quick Bank Contact
  const handleSelectQuickBank = (b: typeof QUICK_BANKS[0]) => {
    setOrganization(b.org);
    setBranch(b.branch);
    setCity(b.city);
    setPhoneInput(b.phone.replace('+92', '').trim());
    setRecipientName(b.contact);
    onShowToast(`Loaded ${b.org} (${b.branch}) details into calling form.`, 'info');
  };

  // Select Ticket to autofill
  const handleSelectTicketToCall = (ticketId: string) => {
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;
    setLinkedTicketId(t.id);
    setOrganization(t.organization);
    setBranch(t.branchName);
    setCity(t.city);
    setPhoneInput(t.clientPhone.replace('+92', '').trim());
    setRecipientName(t.clientName);
    setCallCategory(`Follow-up on Ticket ${t.id} (${t.category})`);
    setPreCallNotes(`Discussing site breakdown status for ${t.title}. Assigned to: ${t.assignedVendor?.name || 'Pending Vendor'}.`);
    onShowToast(`Linked Ticket ${t.id} and populated calling form.`, 'success');
  };

  // Select Vendor to autofill
  const handleSelectVendorToCall = (vendor: Vendor) => {
    setOrganization(vendor.name);
    setBranch(vendor.area);
    setCity(vendor.city);
    setPhoneInput(vendor.phone.replace('+92', '').trim());
    setRecipientName(vendor.contactPerson);
    setCallCategory('Vendor Quotation & Emergency Dispatch');
    setPreCallNotes(`Negotiating trade rates and ETA for ${vendor.trade}.`);
    onShowToast(`Loaded contractor ${vendor.name} into SIM calling form.`, 'info');
  };

  // Filter SIM calls for ledger
  const simCallsList = calls.filter(c => c.channel === 'sim');
  const filteredSimLedger = simCallsList.filter(c => {
    if (!searchLedger) return true;
    const q = searchLedger.toLowerCase();
    return (
      c.callerName.toLowerCase().includes(q) ||
      c.callerNumber.toLowerCase().includes(q) ||
      (c.organization && c.organization.toLowerCase().includes(q)) ||
      (c.simCarrier && c.simCarrier.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  const activeCarrierObj = simProfiles.find(s => s.slot === selectedSlot);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-2xl">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Cellular SIM Calling Station
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Dual SIM 4G/LTE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct cellular dialing form with SIM 1 / SIM 2 slot routing, native mobile dialer integration, real-time call tracking, and automatic ticket linkage.
            </p>
          </div>
        </div>

        {/* Live SIM Slot Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 self-start sm:self-auto">
          {simProfiles.map((p) => {
            const isSelected = selectedSlot === p.slot;
            return (
              <button
                key={p.slot}
                type="button"
                onClick={() => {
                  setSelectedSlot(p.slot);
                  soundEngine.playDtmf('1');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <div className="text-left">
                  <div className="leading-tight">{p.slot}</div>
                  <div className={`text-[9px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {p.carrierName.split(' ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active SIM Call Banner (if in session) */}
      {activeSession && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Cellular Call In-Progress
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                    {activeSession.simSlot} • {activeSession.simCarrier}
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  {activeSession.recipientName} ({activeSession.recipientPhone})
                </div>
                <div className="text-xs text-indigo-300">
                  {activeSession.organization} {activeSession.branch ? `• ${activeSession.branch}` : ''}
                </div>
              </div>
            </div>

            {/* Duration Counter */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Talk Duration</div>
                <div className="text-lg font-mono font-extrabold text-emerald-400">
                  {Math.floor(activeSession.durationSeconds / 60).toString().padStart(2, '0')}:
                  {(activeSession.durationSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEndAndSaveSession()}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End & Save Call</span>
              </button>
            </div>
          </div>

          {/* Active Call Live Notes & Outcome Selector */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Call Discussion Notes:</span>
              </label>
              <textarea
                value={activeSession.notes}
                onChange={(e) => setActiveSession({ ...activeSession, notes: e.target.value })}
                placeholder="Type agreed action points, electrical fault diagnosis, pricing, technician dispatch notes..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Call Outcome / Result:
              </label>
              <select
                value={activeSession.outcome}
                onChange={(e) => setActiveSession({ ...activeSession, outcome: e.target.value as CallOutcome })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Price & Terms Confirmed">Price & Terms Confirmed</option>
                <option value="Quotation Requested">Quotation Requested</option>
                <option value="Site Inspection Scheduled">Site Inspection Scheduled</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Call Completed">Call Completed</option>
                <option value="Voicemail Left">Voicemail Left</option>
                <option value="Declined / Busy">Declined / Busy</option>
              </select>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleEndAndSaveSession('Price & Terms Confirmed')}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition cursor-pointer"
                >
                  Confirm & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Presets & Status Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Left Column (7 Cols): The Calling Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PhoneOutgoing className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Outbound SIM Dialing Form
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Operator Ext: <strong className="text-indigo-400">{currentExtension.extension}</strong> ({currentExtension.name})
              </span>
            </div>

            <form onSubmit={handleInitiateSimCall} className="space-y-4">
              {/* Carrier & SIM Slot Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Select Cellular Line for this Call:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {simProfiles.map((p) => {
                    const isSelected = selectedSlot === p.slot;
                    return (
                      <div
                        key={p.slot}
                        onClick={() => setSelectedSlot(p.slot)}
                        className={`p-3 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-950/80 to-slate-950 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {p.slot}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                          {p.carrierName}
                        </div>
                        <div className="text-[10px] font-mono text-indigo-400 mt-0.5 truncate">
                          {p.simNumber}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-800/80">
                          <span>{p.planType}</span>
                          <span className="text-emerald-400">4G LTE</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Phone Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Recipient Phone Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-28 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 0300 8492001 or 042 35789012"
                      required
                      className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner"
                    />
                    {phoneInput && (
                      <button
                        type="button"
                        onClick={() => setPhoneInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    title="Copy formatted dial number"
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {copiedNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Formatted dial string: <strong className="font-mono text-indigo-300">{getFullPhoneNumber() || 'No number specified'}</strong></span>
                  <span className="text-emerald-400 font-medium">Cellular Carrier Ready</span>
                </div>
              </div>

              {/* Recipient Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Recipient Full Name & Title:
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Tariq Hussain (Branch Manager)"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Client Organization / Company:
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Habib Bank Limited (HBL)"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Branch & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Branch Name / Facility:
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Main Gulberg Branch"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    City / Region:
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Call Purpose / Category & Link to Ticket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Call Purpose / Category:
                  </label>
                  <select
                    value={callCategory}
                    onChange={(e) => setCallCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Emergency Site Breakdown Dispatch">Emergency Site Breakdown Dispatch</option>
                    <option value="Vendor Quotation Review & Rate Confirmation">Vendor Quotation Review & Rate Confirmation</option>
                    <option value="Ticket Resolution Sign-off">Ticket Resolution Sign-off</option>
                    <option value="Routine Branch Equipment Inspection">Routine Branch Equipment Inspection</option>
                    <option value="General Client Inquiry">General Client Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Link with Active Ticket (Optional):
                  </label>
                  <select
                    value={linkedTicketId}
                    onChange={(e) => {
                      setLinkedTicketId(e.target.value);
                      if (e.target.value) handleSelectTicketToCall(e.target.value);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- No Ticket Linked --</option>
                    {tickets.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id}: {t.organization} - {t.title.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pre-Call Notes / Script */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Pre-Call Talking Points & Notes:
                </label>
                <textarea
                  value={preCallNotes}
                  onChange={(e) => setPreCallNotes(e.target.value)}
                  placeholder="Outline key discussion points (e.g., generator breaker trip, contractor dispatch ETA 25 mins, rate quote)..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Options & Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoOpenDialer}
                      onChange={(e) => setAutoOpenDialer(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Launch device phone dialer via <code className="text-[10px] bg-slate-800 px-1 py-0.5 rounded text-indigo-300">tel:</code> protocol</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Mobile & PC Link</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-xl shadow-emerald-600/30 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Dial via {selectedSlot} ({activeCarrierObj?.carrierName.split(' ')[0]})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickLogPastCall}
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Log Past Call</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 Cols): Fast Presets, SIM Status & Recent SIM Ledger */}
        <div className="lg:col-span-5 space-y-5">
          {/* Cellular SIM Carrier Info Card */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                SIM Hardware Carrier Status
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Online & Provisioned
              </span>
            </div>

            <div className="space-y-2">
              {simProfiles.map((p) => {
                const isSelected = selectedSlot === p.slot;
                return (
                  <div
                    key={p.slot}
                    className={`p-3 rounded-2xl border transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span>{p.slot}:</span>
                        <span>{p.carrierName}</span>
                      </div>
                      <span className="px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                      <span>{p.simNumber}</span>
                      <span>Signal: {'●'.repeat(p.signalStrength)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>When dialing on mobile or Windows Phone Link, your default SIM card handler will place the direct cellular call.</span>
            </div>
          </div>

          {/* Quick Bank Branch Contacts */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Quick Bank Branch Speed Dial
              </span>
              <span className="text-[10px] text-slate-500">1-Tap Populate</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {QUICK_BANKS.map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectQuickBank(b)}
                  className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/50 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white truncate">{b.org}</div>
                    <div className="text-[10px] text-slate-400 truncate">{b.branch}</div>
                    <div className="text-[10px] font-mono text-emerald-400">{b.phone}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contractors Fast Dial */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Emergency Contractor Leads
              </span>
              <span className="text-[10px] text-slate-500">Fast Dispatch</span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {vendors.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleSelectVendorToCall(v)}
                  className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-white truncate">{v.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{v.trade} • {v.area}</div>
                    <div className="text-[10px] font-mono text-amber-400">{v.phone}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent SIM Calls Ledger */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recent Cellular SIM Call Records</h3>
              <p className="text-[11px] text-slate-400">All outbound and completed cellular conversations saved to persistent company data.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLedger}
                onChange={(e) => setSearchLedger(e.target.value)}
                placeholder="Search recipient or carrier..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {filteredSimLedger.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
            <Smartphone className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-semibold text-slate-300">No SIM Call Records Found Yet</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Use the Outbound SIM Dialing Form above to place or log direct calls through SIM 1 or SIM 2. All records are permanently stored in live data.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredSimLedger.map((call) => (
              <div
                key={call.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{call.callerName}</span>
                      <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono font-bold">
                        {call.simSlot || 'SIM 1'} • {call.simCarrier || 'Cellular'}
                      </span>
                      {call.linkedTicketId && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold">
                          {call.linkedTicketId}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {call.organization} {call.branch ? `• ${call.branch}` : ''} • <span className="font-mono text-slate-300">{call.callerNumber}</span>
                    </div>
                    {call.notes && (
                      <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md mt-1.5 border border-slate-800/80 line-clamp-1">
                        {call.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {call.recordingDuration || `${call.durationSeconds}s`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatTime(call.timestamp)}
                  </span>
                  {call.callOutcome && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {call.callOutcome}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
