import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOff, 
  Smartphone, 
  MessageSquare, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Check, 
  X, 
  Save, 
  Search, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  Building2,
  Copy
} from 'lucide-react';
import { CompanyEmployee, CustomerCallLog } from './types';
import { companyCallStore } from './services/companyCallStore';
import { soundEngine } from './utils/audio';

export default function App() {
  // Navigation Tabs: 'dispatch' | 'team' | 'history'
  const [activeTab, setActiveTab] = useState<'dispatch' | 'team' | 'history'>('dispatch');

  // Main Company Single Phone Number
  const [mainCompanyNumber, setMainCompanyNumber] = useState<string>(() => companyCallStore.getMainNumber());
  const [isEditingMainNumber, setIsEditingMainNumber] = useState(false);
  const [tempMainNumber, setTempMainNumber] = useState(mainCompanyNumber);

  // Employees List
  const [employees, setEmployees] = useState<CompanyEmployee[]>(() => companyCallStore.getEmployees());

  // Call History
  const [callLogs, setCallLogs] = useState<CustomerCallLog[]>(() => companyCallStore.getCallLogs());

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Search in team
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Employee Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<CompanyEmployee | null>(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    simNumber: '',
    whatsappNumber: '',
    sameAsSim: true,
    role: 'Customer Support Executive',
    status: 'available' as 'available' | 'busy' | 'offline',
  });

  // Active / Incoming Call Session State
  interface LiveCallSession {
    id: string;
    customerName: string;
    customerPhone: string;
    inquiry: string;
    assignedEmployeeId: string;
    assignedEmployeeName: string;
    assignedSimNumber: string;
    assignedWhatsappNumber: string;
    channel: 'sim' | 'whatsapp';
    status: 'ringing' | 'connected' | 'ended';
    startTime?: number;
    durationSeconds: number;
    notes: string;
  }

  const [activeCall, setActiveCall] = useState<LiveCallSession | null>(null);
  const [inboundCustomerName, setInboundCustomerName] = useState('Ahmed Raza');
  const [inboundCustomerPhone, setInboundCustomerPhone] = useState('+92 321 8765432');
  const [inboundInquiry, setInboundInquiry] = useState('Inquiring about order status and delivery');

  // Wipe Data Confirmation Modal State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Live Talk Timer
  useEffect(() => {
    let interval: any = null;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setActiveCall((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            durationSeconds: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : prev.durationSeconds + 1,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status, activeCall?.startTime]);

  // Derived: Available Employees
  const availableEmployees = employees.filter((e) => e.status === 'available');
  const busyEmployees = employees.filter((e) => e.status === 'busy');

  // Format Talk Timer (mm:ss)
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Save Main Helpline Number
  const handleSaveMainNumber = () => {
    if (!tempMainNumber.trim()) return;
    setMainCompanyNumber(tempMainNumber.trim());
    companyCallStore.setMainNumber(tempMainNumber.trim());
    setIsEditingMainNumber(false);
    showToast(`Main company helpline updated to ${tempMainNumber.trim()}`, 'success');
  };

  // Toggle Employee Status (Available / Busy / Offline)
  const handleToggleStatus = (id: string, newStatus: 'available' | 'busy' | 'offline') => {
    const updated = companyCallStore.updateEmployeeStatus(id, newStatus);
    setEmployees(updated);
    const emp = updated.find((e) => e.id === id);
    showToast(`${emp?.name} is now ${newStatus.toUpperCase()}`, 'info');
  };

  // Open Modal to Add Employee
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpForm({
      name: '',
      simNumber: '+92 300 ',
      whatsappNumber: '+92 300 ',
      sameAsSim: true,
      role: 'Support & Sales Executive',
      status: 'available',
    });
    setIsEmployeeModalOpen(true);
  };

  // Open Modal to Edit Employee
  const handleOpenEditEmployee = (emp: CompanyEmployee) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name,
      simNumber: emp.simNumber,
      whatsappNumber: emp.whatsappNumber,
      sameAsSim: emp.simNumber === emp.whatsappNumber,
      role: emp.role,
      status: emp.status,
    });
    setIsEmployeeModalOpen(true);
  };

  // Save Employee Form
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim() || !empForm.simNumber.trim()) {
      showToast('Name and SIM mobile number are required.', 'error');
      return;
    }

    const sim = empForm.simNumber.trim();
    const wa = empForm.sameAsSim ? sim : empForm.whatsappNumber.trim() || sim;

    const empToSave: CompanyEmployee = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      name: empForm.name.trim(),
      simNumber: sim,
      whatsappNumber: wa,
      role: empForm.role.trim() || 'Customer Support',
      status: empForm.status,
      totalCallsAnswered: editingEmployee ? editingEmployee.totalCallsAnswered : 0,
    };

    const updated = companyCallStore.saveEmployee(empToSave);
    setEmployees(updated);
    setIsEmployeeModalOpen(false);
    showToast(`Saved employee ${empToSave.name}`, 'success');
  };

  // Delete Employee
  const handleDeleteEmployee = (id: string, name: string) => {
    if (employees.length <= 1) {
      showToast('You must have at least one employee in the company roster.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      const updated = companyCallStore.deleteEmployee(id);
      setEmployees(updated);
      showToast(`Removed ${name} from roster`, 'info');
    }
  };

  // Simulate or Log Incoming Customer Call to Main Company Number
  const handleStartIncomingCustomerCall = () => {
    if (!inboundCustomerName.trim() || !inboundCustomerPhone.trim()) {
      showToast('Please enter customer name and phone number.', 'error');
      return;
    }

    if (availableEmployees.length === 0) {
      showToast('No employees are currently Available! Please mark at least one employee as Available.', 'error');
      return;
    }

    // Auto-route to the first available employee
    const targetAgent = availableEmployees[0];

    // Start realistic ringing sound
    try {
      soundEngine.startIncomingRinging();
    } catch {}

    const newSession: LiveCallSession = {
      id: `call-${Date.now()}`,
      customerName: inboundCustomerName.trim(),
      customerPhone: inboundCustomerPhone.trim(),
      inquiry: inboundInquiry.trim(),
      assignedEmployeeId: targetAgent.id,
      assignedEmployeeName: targetAgent.name,
      assignedSimNumber: targetAgent.simNumber,
      assignedWhatsappNumber: targetAgent.whatsappNumber,
      channel: 'sim',
      status: 'ringing',
      durationSeconds: 0,
      notes: inboundInquiry.trim(),
    };

    setActiveCall(newSession);
    showToast(`Incoming call ringing on available agent: ${targetAgent.name}!`, 'info');
  };

  // Answer Call via SIM Phone Call
  const handleAnswerViaSim = () => {
    if (!activeCall) return;

    soundEngine.stopRinging();
    soundEngine.playConnectedChime();

    // Mark employee as busy
    const updated = companyCallStore.updateEmployeeStatus(activeCall.assignedEmployeeId, 'busy');
    setEmployees(updated);

    setActiveCall({
      ...activeCall,
      status: 'connected',
      channel: 'sim',
      startTime: Date.now(),
    });

    // Clean phone number for tel: link (strip spaces)
    const cleanTel = activeCall.assignedSimNumber.replace(/[^\d+]/g, '');
    window.open(`tel:${cleanTel}`, '_self');

    showToast(`Call connected to ${activeCall.assignedEmployeeName} via SIM phone call!`, 'success');
  };

  // Answer Call via WhatsApp
  const handleAnswerViaWhatsApp = () => {
    if (!activeCall) return;

    soundEngine.stopRinging();
    soundEngine.playConnectedChime();

    // Mark employee as busy
    const updated = companyCallStore.updateEmployeeStatus(activeCall.assignedEmployeeId, 'busy');
    setEmployees(updated);

    setActiveCall({
      ...activeCall,
      status: 'connected',
      channel: 'whatsapp',
      startTime: Date.now(),
    });

    // Clean phone number for WhatsApp link (digits only)
    const cleanWa = activeCall.assignedWhatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent(`Hello ${activeCall.assignedEmployeeName}, incoming customer call from ${activeCall.customerName} (${activeCall.customerPhone}): ${activeCall.inquiry}`);
    window.open(`https://wa.me/${cleanWa}?text=${message}`, '_blank');

    showToast(`Call connected to ${activeCall.assignedEmployeeName} via WhatsApp!`, 'success');
  };

  // End Call & Save to Ledger
  const handleEndCall = () => {
    if (!activeCall) return;

    soundEngine.stopRinging();
    soundEngine.playDisconnectTone();

    // Log the call
    const logItem: CustomerCallLog = {
      id: activeCall.id,
      customerName: activeCall.customerName,
      customerPhone: activeCall.customerPhone,
      answeredByEmployeeId: activeCall.assignedEmployeeId,
      answeredByEmployeeName: activeCall.assignedEmployeeName,
      channel: activeCall.channel,
      durationSeconds: activeCall.durationSeconds || 1,
      status: activeCall.status === 'ringing' ? 'missed' : 'answered',
      notes: activeCall.notes || 'Inbound helpline call resolved.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextLogs = companyCallStore.addCallLog(logItem);
    setCallLogs(nextLogs);

    // Increment employee answered count and mark back to available
    companyCallStore.incrementAnsweredCount(activeCall.assignedEmployeeId);
    const updated = companyCallStore.updateEmployeeStatus(activeCall.assignedEmployeeId, 'available');
    setEmployees(updated);

    setActiveCall(null);
    showToast(`Call ended and logged for ${logItem.customerName} (${logItem.durationSeconds}s)`, 'success');
  };

  // Direct Call to Employee on SIM
  const handleDirectSimCall = (emp: CompanyEmployee) => {
    const cleanTel = emp.simNumber.replace(/[^\d+]/g, '');
    window.open(`tel:${cleanTel}`, '_self');
    showToast(`Dialing ${emp.name} on SIM (${emp.simNumber})...`, 'info');
  };

  // Direct Chat / Call to Employee on WhatsApp
  const handleDirectWhatsApp = (emp: CompanyEmployee) => {
    const cleanWa = emp.whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanWa}`, '_blank');
    showToast(`Opening WhatsApp with ${emp.name}...`, 'info');
  };

  // Wipe All Demo Data
  const handleConfirmWipeAll = () => {
    companyCallStore.wipeAllToBlank();
    setEmployees([]);
    setCallLogs([]);
    setActiveCall(null);
    setIsWipeModalOpen(false);
    showToast('All demo employees and call history have been wiped. Start fresh by adding your team!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50' 
            : toast.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <PhoneCall className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Main Helpline Number Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">FAST Connect</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Helpline System
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              One Company Number &bull; Automatic Available Employee Routing
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'dispatch'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneIncoming className="w-4 h-4 text-emerald-400" />
            <span>Receive Calls</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-300" />
            <span>Employees ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>History ({callLogs.length})</span>
          </button>
        </div>

        {/* Wipe Demo Data Button */}
        <button
          onClick={() => setIsWipeModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Clear mock data to start clean with your real company"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Wipe Demo Data</span>
        </button>
      </header>

      {/* PROMINENT MAIN COMPANY HELPLINE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-indigo-500/20 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Main Number Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-600/20">
              <Building2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold">
                <span>OUR COMPANY SINGLE HELPLINE NUMBER</span>
                <span>&bull;</span>
                <span className="text-slate-400">All Customers Call This Line</span>
              </div>

              {isEditingMainNumber ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={tempMainNumber}
                    onChange={(e) => setTempMainNumber(e.target.value)}
                    className="px-3 py-1 rounded-xl bg-slate-950 border border-indigo-500 text-white font-mono text-base font-bold outline-none"
                    placeholder="+92 (42) 111-327-800"
                  />
                  <button
                    onClick={handleSaveMainNumber}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingMainNumber(false);
                      setTempMainNumber(mainCompanyNumber);
                    }}
                    className="px-2 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">
                    {mainCompanyNumber}
                  </span>
                  <button
                    onClick={() => {
                      setTempMainNumber(mainCompanyNumber);
                      setIsEditingMainNumber(true);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                    title="Change to your real company phone number"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Availability Counter */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl self-start md:self-auto">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400 font-mono text-sm">{availableEmployees.length}</span>
                  <span>Employees Available</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {busyEmployees.length > 0 ? `${busyEmployees.length} currently on call` : 'Ready to answer customer calls'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('team')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer ml-2"
            >
              Manage Team
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE CALL OVERLAY / BANNER IF A CALL IS LIVE */}
      {activeCall && (
        <div className={`p-4 sm:p-5 border-b shadow-2xl transition-all animate-fade-in ${
          activeCall.status === 'ringing'
            ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/50'
            : 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-emerald-500/50'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Call State & Customer Info */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                activeCall.status === 'ringing'
                  ? 'bg-amber-600 animate-bounce'
                  : 'bg-emerald-600 animate-pulse'
              }`}>
                {activeCall.status === 'ringing' ? <PhoneIncoming className="w-6 h-6" /> : <PhoneCall className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className={`px-2 py-0.5 rounded-full font-mono uppercase ${
                    activeCall.status === 'ringing'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {activeCall.status === 'ringing' ? 'Incoming Customer Call' : 'Call Connected (Live)'}
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-white font-mono text-sm">{formatTimer(activeCall.durationSeconds)}</span>
                </div>

                <div className="text-base font-extrabold text-white mt-0.5">
                  {activeCall.customerName} &bull; <span className="font-mono text-indigo-300">{activeCall.customerPhone}</span>
                </div>

                <div className="text-xs text-slate-300 mt-0.5">
                  Picked by Available Agent: <strong className="text-emerald-400">{activeCall.assignedEmployeeName}</strong>
                </div>
              </div>
            </div>

            {/* Answer & End Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {activeCall.status === 'ringing' ? (
                <>
                  <button
                    onClick={handleAnswerViaSim}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pick Up via SIM Call ({activeCall.assignedSimNumber})</span>
                  </button>

                  <button
                    onClick={handleAnswerViaWhatsApp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-700/30 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Pick Up via WhatsApp</span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Type live call notes here..."
                    value={activeCall.notes}
                    onChange={(e) => setActiveCall({ ...activeCall, notes: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs w-64 outline-none focus:border-indigo-500"
                  />

                  <button
                    onClick={handleEndCall}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call & Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: INCOMING CALLS & LIVE ROUTING DISPATCH */}
        {/* ========================================================= */}
        {activeTab === 'dispatch' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Inbound Call Simulator & Router */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <PhoneIncoming className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Receive Customer Call on Single Helpline
                    </h2>
                    <p className="text-xs text-slate-400">
                      When a customer dials <strong>{mainCompanyNumber}</strong>, the call is immediately assigned to an Available employee.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={inboundCustomerName}
                      onChange={(e) => setInboundCustomerName(e.target.value)}
                      placeholder="e.g. Usman Ali"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer Phone Number
                    </label>
                    <input
                      type="tel"
                      value={inboundCustomerPhone}
                      onChange={(e) => setInboundCustomerPhone(e.target.value)}
                      placeholder="e.g. +92 321 8765432"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Customer Inquiry / Reason for Calling
                  </label>
                  <input
                    type="text"
                    value={inboundInquiry}
                    onChange={(e) => setInboundInquiry(e.target.value)}
                    placeholder="e.g. Order breakdown, service issue, quotation inquiry"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Call Trigger Button */}
                <div className="pt-2">
                  <button
                    onClick={handleStartIncomingCustomerCall}
                    disabled={Boolean(activeCall)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl transition cursor-pointer ${
                      activeCall
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/30'
                    }`}
                  >
                    <PhoneIncoming className="w-5 h-5 animate-pulse" />
                    <span>Customer Calling Now &rarr; Ring Available Agent</span>
                  </button>
                </div>
              </div>

              {/* How it works simple guide */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-xs text-slate-300 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>How This Simple System Works for Your Team</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-1">1. Single Helpline</span>
                    <p className="text-[11px] text-slate-400">All clients dial only your 1 company number. No confusing personal numbers given to clients.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">2. Auto-Pick Available</span>
                    <p className="text-[11px] text-slate-400">The system automatically finds whoever employee is currently marked Available to answer.</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <span className="font-bold text-teal-400 block mb-1">3. SIM or WhatsApp</span>
                    <p className="text-[11px] text-slate-400">Employees can answer via direct SIM phone dialer or open directly in WhatsApp chat/call.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Available Employees At a Glance */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Who is Available Now?</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('team')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    View All
                  </button>
                </div>

                {availableEmployees.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No employees are currently Available.
                    <br />
                    <button
                      onClick={() => setActiveTab('team')}
                      className="mt-2 text-indigo-400 font-bold underline"
                    >
                      Turn On Availability in Team
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {availableEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>{emp.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{emp.role}</div>
                          <div className="font-mono text-[10px] text-emerald-300 mt-0.5">
                            SIM: {emp.simNumber}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDirectSimCall(emp)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition"
                            title="Direct SIM Call"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDirectWhatsApp(emp)}
                            className="p-1.5 rounded-lg bg-emerald-700/20 hover:bg-emerald-700 text-emerald-400 hover:text-white transition"
                            title="Direct WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Summary of Today's Calls */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Helpline Activity</span>
                <div className="text-2xl font-extrabold text-white font-mono">{callLogs.length}</div>
                <div className="text-xs text-slate-400">Customer calls handled today</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EMPLOYEES (SIM & WHATSAPP NUMBERS) */}
        {/* ========================================================= */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Company Employees Roster</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Put real names, SIM numbers, and WhatsApp numbers for each team member. Toggle their availability anytime.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenAddEmployee}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Real Employee</span>
                </button>
              </div>
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-5 rounded-3xl border transition shadow-xl flex flex-col justify-between ${
                    emp.status === 'available'
                      ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : emp.status === 'busy'
                      ? 'bg-slate-900/90 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800 opacity-75'
                  }`}
                >
                  <div>
                    {/* Header: Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{emp.name}</h3>
                        <div className="text-xs text-indigo-300 font-medium mt-0.5">{emp.role}</div>
                      </div>

                      {/* Status Selector Pill */}
                      <select
                        value={emp.status}
                        onChange={(e) => handleToggleStatus(emp.id, e.target.value as any)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border outline-none cursor-pointer transition ${
                          emp.status === 'available'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : emp.status === 'busy'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="available">🟢 Available</option>
                        <option value="busy">🔴 Busy</option>
                        <option value="offline">⚪ Offline</option>
                      </select>
                    </div>

                    {/* Contact Numbers: SIM & WhatsApp */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                      {/* SIM Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">SIM Mobile:</span>
                            <span className="font-mono font-bold text-white text-[11px]">{emp.simNumber}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDirectSimCall(emp)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-[10px] transition cursor-pointer"
                        >
                          Dial SIM
                        </button>
                      </div>

                      {/* WhatsApp Number */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-teal-400" />
                          <div>
                            <span className="text-[10px] text-slate-400 block">WhatsApp:</span>
                            <span className="font-mono font-bold text-white text-[11px]">{emp.whatsappNumber}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDirectWhatsApp(emp)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white font-bold text-[10px] transition cursor-pointer"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Answered: <strong className="text-white font-mono">{emp.totalCallsAnswered || 0}</strong> calls
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditEmployee(emp)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                        title="Edit Name and Numbers"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-rose-400 transition cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CALL HISTORY */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Customer Call History</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Log of all incoming customer calls received on your company helpline.
                </p>
              </div>

              {callLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all call history records?')) {
                      companyCallStore.clearCallLogs();
                      setCallLogs([]);
                      showToast('Call history cleared.', 'info');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 text-xs font-semibold transition cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {callLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No customer calls logged yet. Incoming calls received will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Answered By</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {callLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="font-bold text-white">{log.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.customerPhone}</div>
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-emerald-400">{log.answeredByEmployeeName || 'Agent'}</span>
                        </td>

                        <td className="p-3">
                          {log.channel === 'sim' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                              <Smartphone className="w-3 h-3" /> SIM Call
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] inline-flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-slate-200">
                          {formatTimer(log.durationSeconds)}
                        </td>

                        <td className="p-3 text-slate-300 max-w-xs truncate">
                          {log.notes || 'Call completed'}
                        </td>

                        <td className="p-3 text-right text-slate-400 font-mono">
                          {log.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* ADD / EDIT EMPLOYEE MODAL */}
      {/* ========================================================= */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingEmployee ? `Edit Employee (${editingEmployee.name})` : 'Add Real Employee'}
              </h3>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Qurat Ul Ain"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  SIM Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +92 300 1234567"
                  value={empForm.simNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmpForm({
                      ...empForm,
                      simNumber: val,
                      whatsappNumber: empForm.sameAsSim ? val : empForm.whatsappNumber,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  WhatsApp Number *
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="sameAsSim"
                    checked={empForm.sameAsSim}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEmpForm({
                        ...empForm,
                        sameAsSim: checked,
                        whatsappNumber: checked ? empForm.simNumber : empForm.whatsappNumber,
                      });
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="sameAsSim" className="text-slate-300 cursor-pointer">
                    WhatsApp is the same as SIM phone number
                  </label>
                </div>

                {!empForm.sameAsSim && (
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +92 321 9876543"
                    value={empForm.whatsappNumber}
                    onChange={(e) => setEmpForm({ ...empForm, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer Support Lead"
                  value={empForm.role}
                  onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={empForm.status}
                  onChange={(e) => setEmpForm({ ...empForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-indigo-500"
                >
                  <option value="available">🟢 Available (Ready to receive calls)</option>
                  <option value="busy">🔴 Busy (On a call)</option>
                  <option value="offline">⚪ Offline (Off Duty)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WIPE ALL DEMO DATA CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Wipe All Demo Data?</h3>
                <p className="text-xs text-rose-300">Clean slate for your company</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will remove all <strong>mock demo employees and sample call history</strong>.
              <br /><br />
              You can then add your own team members with their real SIM mobile numbers and WhatsApp numbers!
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWipeAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Yes, Wipe & Start Clean
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
