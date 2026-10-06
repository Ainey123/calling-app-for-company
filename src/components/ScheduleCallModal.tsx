import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  PhoneCall, 
  User, 
  Building2, 
  FileText, 
  Bell, 
  Sparkles,
  CheckCircle2,
  CalendarClock
} from 'lucide-react';
import { EmployeeExtension, ScheduledCall, CallRecord } from '../types';

interface ScheduleCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleCall: (callData: Omit<ScheduledCall, 'id' | 'createdAt' | 'status'>) => void;
  currentExtension: EmployeeExtension;
  extensions: EmployeeExtension[];
  initialCall?: CallRecord | null;
}

export const ScheduleCallModal: React.FC<ScheduleCallModalProps> = ({
  isOpen,
  onClose,
  onScheduleCall,
  currentExtension,
  extensions,
  initialCall,
}) => {
  // Format today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Default to tomorrow 10:00 AM or 2 hours from now
  const [callerName, setCallerName] = useState('');
  const [callerNumber, setCallerNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [branch, setBranch] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [assignedExtension, setAssignedExtension] = useState(currentExtension.extension);
  const [notes, setNotes] = useState('');
  const [saveAsNotification, setSaveAsNotification] = useState(true);

  // Sync when initialCall changes
  useEffect(() => {
    if (initialCall) {
      setCallerName(initialCall.callerName || '');
      setCallerNumber(initialCall.callerNumber || '');
      setOrganization(initialCall.organization || '');
      setBranch(initialCall.branch || '');
      setNotes(initialCall.notes ? `Follow-up on previous call: ${initialCall.notes.slice(0, 100)}` : 'Follow up regarding operational facility ticket.');
    } else {
      setCallerName('');
      setCallerNumber('');
      setOrganization('');
      setBranch('');
      setNotes('');
    }

    // Set default date to today or tomorrow
    const now = new Date();
    now.setHours(now.getHours() + 2);
    setScheduledDate(now.toISOString().split('T')[0]);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, '0');
    setScheduledTime(`${hh}:${mm}`);
  }, [initialCall, isOpen]);

  if (!isOpen) return null;

  // Preset button handler
  const handleApplyPreset = (hoursFromNow: number, labelNotes?: string) => {
    const target = new Date();
    target.setHours(target.getHours() + hoursFromNow);
    setScheduledDate(target.toISOString().split('T')[0]);
    const hh = String(target.getHours()).padStart(2, '0');
    const mm = String(Math.floor(target.getMinutes() / 15) * 15).padStart(2, '0');
    setScheduledTime(`${hh}:${mm}`);
    if (labelNotes && !notes) {
      setNotes(labelNotes);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerName.trim() || !callerNumber.trim()) {
      return;
    }

    const assignedOfficer = extensions.find((e) => e.extension === assignedExtension)?.name || currentExtension.name;

    onScheduleCall({
      callerName: callerName.trim(),
      callerNumber: callerNumber.trim(),
      organization: organization.trim(),
      branch: branch.trim(),
      scheduledDate,
      scheduledTime,
      notes: notes.trim(),
      assignedExtension,
      agentName: assignedOfficer,
      reminderSent: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-lg max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-md shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 truncate">
                <span>Schedule Follow-Up Call</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 uppercase shrink-0">
                  Reminder
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">Set a future date & time to follow up with a client or contractor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Caller Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Contact / Caller Name:</span>
              </label>
              <input
                type="text"
                required
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="e.g. Haris Siddiqui"
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                <span>Phone Number:</span>
              </label>
              <input
                type="text"
                required
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                placeholder="e.g. +92 42 35789012"
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Organization / Bank:</span>
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Habib Bank Limited (HBL)"
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Branch / Site Location:</span>
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Main Gulberg Branch, Lahore"
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Schedule Presets */}
          <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Quick Time Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(1, 'Check technician dispatch progress')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                In 1 Hour
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(2, 'Verify electrician arrival and breaker status')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                In 2 Hours
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(24, '24-hour follow-up on power stability')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Tomorrow Same Time
              </button>
              <button
                type="button"
                onClick={() => {
                  const tmrw = new Date();
                  tmrw.setDate(tmrw.getDate() + 1);
                  setScheduledDate(tmrw.toISOString().split('T')[0]);
                  setScheduledTime('10:00');
                  setNotes('Morning branch opening verification');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Tomorrow 10:00 AM
              </button>
            </div>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Follow-up Date:</span>
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Follow-up Time:</span>
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Assigned Officer Extension */}
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Assign Reminder to Extension Desk:
            </label>
            <select
              value={assignedExtension}
              onChange={(e) => setAssignedExtension(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {extensions.map((ext) => (
                <option key={ext.id} value={ext.extension}>
                  Ext {ext.extension} — {ext.name} ({ext.department})
                </option>
              ))}
            </select>
          </div>

          {/* Follow-up Notes / Agenda */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Follow-up Objective & Call Notes:</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Call branch operations manager to verify if emergency electrician completed the 100A main breaker replacement..."
              className="w-full mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Pending Notification Checkbox */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-white">Save as Pending Notification</div>
                <div className="text-[10px] text-slate-400">Alerts desk officer in the notification tray when due</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={saveAsNotification}
              onChange={(e) => setSaveAsNotification(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Schedule Call</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
