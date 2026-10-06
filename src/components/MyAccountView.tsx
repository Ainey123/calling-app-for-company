import React, { useState } from 'react';
import { 
  UserCheck, 
  Phone, 
  Mail, 
  Clock, 
  KeyRound, 
  Building2, 
  Save, 
  Camera, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  PhoneCall, 
  TicketCheck, 
  ClipboardList, 
  Radio, 
  Code, 
  Shield, 
  User,
  History,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EmployeeExtension, CallRecord, ComplaintTicket, DailyReport, ScheduledCall } from '../types';
import { getInitialsAvatar } from '../utils/imageUtils';

interface MyAccountViewProps {
  currentExtension: EmployeeExtension;
  onUpdateCurrentExtension: (updated: EmployeeExtension) => void;
  calls: CallRecord[];
  tickets: ComplaintTicket[];
  dailyReports: DailyReport[];
  scheduledCalls?: ScheduledCall[];
  isAdmin: boolean;
  onOpenPhotoModal?: (ext: EmployeeExtension) => void;
  onOpenLoginModal: () => void;
  onNavigateTab: (tab: any) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const MyAccountView: React.FC<MyAccountViewProps> = ({
  currentExtension,
  onUpdateCurrentExtension,
  calls,
  tickets,
  dailyReports,
  scheduledCalls = [],
  isAdmin,
  onOpenPhotoModal,
  onOpenLoginModal,
  onNavigateTab,
  onShowToast,
}) => {
  // Form State for personal editable details
  const [formData, setFormData] = useState({
    name: currentExtension.name,
    email: currentExtension.email,
    phone: currentExtension.phone,
    bio: currentExtension.bio || '',
    shiftHours: currentExtension.shiftHours || '09:00 AM - 05:30 PM',
    status: currentExtension.status,
  });

  // PIN Management State
  const [newPin, setNewPin] = useState(currentExtension.pin || `${currentExtension.extension}0`);
  const [confirmPin, setConfirmPin] = useState(currentExtension.pin || `${currentExtension.extension}0`);
  const [pinChangeMessage, setPinChangeMessage] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Filter personal metrics for this specific officer
  const myCalls = calls.filter(
    (c) => c.extension === currentExtension.extension || c.agentName.toLowerCase().includes(currentExtension.name.split(' ')[0].toLowerCase())
  );
  const myCompletedCalls = myCalls.filter((c) => c.status === 'completed');
  const myTickets = tickets.filter(
    (t) => t.assignedExtension === currentExtension.extension || t.assignedAgentName.toLowerCase().includes(currentExtension.name.toLowerCase()) || t.title.toLowerCase().includes(currentExtension.name.toLowerCase())
  );
  const myDailyReport = dailyReports.find(
    (r) => r.employeeExtension === currentExtension.extension
  );
  const myScheduled = scheduledCalls.filter(
    (s) => s.assignedExtension === currentExtension.extension
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowToast('Name cannot be empty.', 'error');
      return;
    }

    const updated: EmployeeExtension = {
      ...currentExtension,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      bio: formData.bio.trim(),
      shiftHours: formData.shiftHours.trim(),
      status: formData.status,
    };

    onUpdateCurrentExtension(updated);
    onShowToast('Your personal working details have been saved successfully.', 'success');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMessage('PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeMessage('PINs do not match.');
      return;
    }

    const updated: EmployeeExtension = {
      ...currentExtension,
      pin: newPin,
    };

    onUpdateCurrentExtension(updated);
    setPinChangeMessage('Security PIN updated successfully!');
    onShowToast(`Security PIN for Ext ${currentExtension.extension} updated.`, 'success');
  };

  const handleStatusChange = (newStatus: 'available' | 'on-call' | 'away' | 'offline') => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
    const updated: EmployeeExtension = {
      ...currentExtension,
      status: newStatus,
    };
    onUpdateCurrentExtension(updated);
    onShowToast(`Shift status updated to: ${newStatus.toUpperCase()}`, 'info');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 min-w-0 animate-fade-in pb-12">
      {/* Top Officer Profile Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Officer Avatar with direct photo upload */}
            <div className="relative group shrink-0">
              <img
                src={currentExtension.avatar || getInitialsAvatar(currentExtension.name, currentExtension.extension)}
                alt={currentExtension.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-indigo-500/40 shadow-xl bg-slate-800"
              />
              <button
                type="button"
                onClick={() => onOpenPhotoModal?.(currentExtension)}
                className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-white text-xs font-semibold"
                title="Upload personal photo"
              >
                <Camera className="w-5 h-5 text-indigo-400" />
                <span>Change</span>
              </button>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {currentExtension.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/40">
                  Ext {currentExtension.extension}
                </span>
                {isAdmin ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Executive Boss</span>
                  </span>
                ) : currentExtension.isDeveloper ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                    <Code className="w-3 h-3 text-purple-400" />
                    <span>Developer Staff</span>
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                    Complaint Officer
                  </span>
                )}
              </div>

              <div className="text-xs sm:text-sm text-indigo-300 font-semibold">
                {currentExtension.role}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentExtension.department}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{formData.shiftHours}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Shift Switcher & Lock Desk */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
              {(['available', 'on-call', 'away', 'offline'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                    formData.status === st
                      ? st === 'available'
                        ? 'bg-emerald-600 text-white shadow'
                        : st === 'on-call'
                        ? 'bg-blue-600 text-white shadow'
                        : st === 'away'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              title="Lock desk station or switch accounts"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock / Switch Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Performance KPI Cards specifically for THIS employee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Calls Handled by Me</span>
            <PhoneCall className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {myCalls.length}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>{myCompletedCalls.length} completed sessions</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Avg Handling Duration</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {Math.floor(currentExtension.avgHandlingSeconds / 60)}m {currentExtension.avgHandlingSeconds % 60}s
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target SLA &lt; 4m 00s
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned Complaints</span>
            <TicketCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {myTickets.length}
          </div>
          <div className="text-[11px] text-indigo-300 mt-1">
            Outage & dispatch queue
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Today's Daily Work Log</span>
            <ClipboardList className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2 truncate">
            {myDailyReport ? (
              <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                myDailyReport.status === 'Reviewed' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {myDailyReport.status.toUpperCase()}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-normal">No log submitted yet</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('daily-work')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Daily Work View</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Personal Editable Working Details & Security PIN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Personal Details Editor */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Personal Working Details (Editable by You)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your direct contact number, internal email, shift timings, and handover bio.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Desk Ext: {currentExtension.extension}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Internal Corporate Email:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Direct Phone / Mobile:
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Shift Working Hours:
                </label>
                <input
                  type="text"
                  value={formData.shiftHours}
                  onChange={(e) => setFormData({ ...formData, shiftHours: e.target.value })}
                  placeholder="e.g. 09:00 AM - 05:30 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Personal Handover Bio / Duty Notes:
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write your personal working notes, current branch focus, or shift handover instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => onOpenPhotoModal?.(currentExtension)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Upload Custom Photo</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Working Details</span>
              </button>
            </div>
          </form>
        </div>

        {/* Column 3: Desk Security PIN & Role Permissions Matrix */}
        <div className="space-y-6">
          {/* Desk Security PIN Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Desk Security PIN</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set your private 4-digit PIN so other staff cannot take over your desk without authentication.
              </p>
            </div>

            <form onSubmit={handleUpdatePin} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold block">
                    New 4-Digit Security PIN:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 transition cursor-pointer"
                    title={showPin ? 'Hide PIN characters' : 'Show PIN characters'}
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Hide' : 'View'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-lg tracking-widest font-mono py-2 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title={showPin ? 'Hide PIN' : 'View PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Confirm Security PIN:
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-lg tracking-widest font-mono py-2 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title={showPin ? 'Hide PIN' : 'View PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pinChangeMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                  pinChangeMessage.includes('successfully')
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                }`}>
                  {pinChangeMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Update Desk PIN</span>
              </button>
            </form>
          </div>

          {/* Role & Boss Authorization Level Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Role & Permissions Authority</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>Executive Boss Authority</span>
                  <span className="text-[10px] text-amber-400 font-mono">100% UNRESTRICTED</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Only the Boss / Executive Admin has rights to check, edit, and delete everything across the enterprise (all employees, PINs, records, tickets, backups, and live outage alerts).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>Developer Technical Access</span>
                  <span className="text-[10px] text-purple-400 font-mono">CONFIGURED BY BOSS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Developers can edit PBX forwarding algorithms, test VoIP codecs, and review telemetry. Destructive database wipes remain locked to Boss authorization.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>Officer Desk Authority</span>
                  <span className="text-[10px] text-indigo-400 font-mono">PERSONAL SCOPE</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You can edit your own profile, upload personal photos, submit daily work logs, take softphone calls, and manage assigned tickets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
