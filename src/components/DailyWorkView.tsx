import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  History, 
  Paperclip, 
  Building2, 
  PhoneCall, 
  Save, 
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DailyReport, 
  WorkEntry, 
  EmployeeExtension, 
  CallRecord, 
  WorkStatus, 
  DailyReportStatus 
} from '../types';

interface DailyWorkViewProps {
  currentExtension: EmployeeExtension;
  reports: DailyReport[];
  calls: CallRecord[];
  onSaveReport: (report: DailyReport) => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DailyWorkView: React.FC<DailyWorkViewProps> = ({
  currentExtension,
  reports,
  calls,
  onSaveReport,
  onShowToast,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewHistoryModal, setViewHistoryModal] = useState(false);

  // Calls handled today by this specific extension
  const todayCalls = calls.filter((c) => {
    return c.extension === currentExtension.extension;
  });
  const todayTalkTimeSeconds = todayCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

  // Find or initialize today's report for the current employee
  const existingReport = reports.find(
    (r) => r.employeeId === currentExtension.id && r.reportDate === selectedDate
  );

  const initialReport: DailyReport = existingReport || {
    id: `RPT-${selectedDate.replace(/-/g, '')}-${currentExtension.extension}`,
    employeeId: currentExtension.id,
    employeeName: currentExtension.name,
    employeeExtension: currentExtension.extension,
    employeeRole: currentExtension.role,
    employeeDepartment: currentExtension.department,
    reportDate: selectedDate,
    status: 'Draft',
    summaryHighlights: '',
    entries: [],
    totalWorkHours: 0,
    totalCallsHandledToday: todayCalls.length,
    totalTalkTimeSecondsToday: todayTalkTimeSeconds,
    revisions: [],
    adminComments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [activeReport, setActiveReport] = useState<DailyReport>(initialReport);

  // Sync when selectedDate or existing reports change
  React.useEffect(() => {
    if (existingReport) {
      setActiveReport({
        ...existingReport,
        totalCallsHandledToday: todayCalls.length,
        totalTalkTimeSecondsToday: todayTalkTimeSeconds,
      });
    } else {
      setActiveReport({
        id: `RPT-${selectedDate.replace(/-/g, '')}-${currentExtension.extension}`,
        employeeId: currentExtension.id,
        employeeName: currentExtension.name,
        employeeExtension: currentExtension.extension,
        employeeRole: currentExtension.role,
        employeeDepartment: currentExtension.department,
        reportDate: selectedDate,
        status: 'Draft',
        summaryHighlights: '',
        entries: [],
        totalWorkHours: 0,
        totalCallsHandledToday: todayCalls.length,
        totalTalkTimeSecondsToday: todayTalkTimeSeconds,
        revisions: [],
        adminComments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [selectedDate, existingReport?.id, existingReport?.updatedAt, currentExtension.id]);

  // Entry Form State
  const [entryCategory, setEntryCategory] = useState('Branch Incident Triage');
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [entryStartTime, setEntryStartTime] = useState('09:00');
  const [entryEndTime, setEntryEndTime] = useState('10:00');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryStatus, setEntryStatus] = useState<WorkStatus>('Completed');
  const [entryOutcome, setEntryOutcome] = useState('');
  const [entryPending, setEntryPending] = useState('');
  const [entryRemarks, setEntryRemarks] = useState('');
  const [entryAttachment, setEntryAttachment] = useState('');

  const handleOpenAddModal = (entryToEdit?: WorkEntry) => {
    if (entryToEdit) {
      setEditingEntry(entryToEdit);
      setEntryCategory(entryToEdit.category);
      setEntryTime(entryToEdit.time);
      setEntryStartTime(entryToEdit.startTime || '09:00');
      setEntryEndTime(entryToEdit.endTime || '10:00');
      setEntryDesc(entryToEdit.description);
      setEntryStatus(entryToEdit.status);
      setEntryOutcome(entryToEdit.resultOutcome);
      setEntryPending(entryToEdit.pendingWork || '');
      setEntryRemarks(entryToEdit.remarks || '');
      setEntryAttachment(entryToEdit.attachmentName || '');
    } else {
      setEditingEntry(null);
      setEntryCategory('Branch Incident Triage');
      setEntryTime(new Date().toTimeString().slice(0, 5));
      setEntryStartTime('09:30');
      setEntryEndTime('10:15');
      setEntryDesc('');
      setEntryStatus('Completed');
      setEntryOutcome('');
      setEntryPending('');
      setEntryRemarks('');
      setEntryAttachment('');
    }
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDesc.trim() || !entryOutcome.trim()) {
      onShowToast('Please provide a description and result/outcome for this entry.', 'error');
      return;
    }

    const newEntry: WorkEntry = {
      id: editingEntry?.id || `ENTRY-${Date.now()}`,
      employeeId: currentExtension.id,
      employeeName: currentExtension.name,
      employeeExtension: currentExtension.extension,
      date: selectedDate,
      time: entryTime,
      category: entryCategory,
      description: entryDesc.trim(),
      startTime: entryStartTime,
      endTime: entryEndTime,
      status: entryStatus,
      resultOutcome: entryOutcome.trim(),
      pendingWork: entryPending.trim() || undefined,
      remarks: entryRemarks.trim() || undefined,
      attachmentName: entryAttachment.trim() || undefined,
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedEntries: WorkEntry[] = [];
    if (editingEntry) {
      updatedEntries = activeReport.entries.map((item) =>
        item.id === editingEntry.id ? newEntry : item
      );
    } else {
      updatedEntries = [newEntry, ...activeReport.entries];
    }

    const updatedReport: DailyReport = {
      ...activeReport,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };

    setActiveReport(updatedReport);
    setIsModalOpen(false);
    await onSaveReport(updatedReport);
    onShowToast(editingEntry ? 'Work entry updated.' : 'New work entry logged to daily report.', 'success');
  };

  const handleDeleteEntry = async (entryId: string) => {
    const updatedEntries = activeReport.entries.filter((item) => item.id !== entryId);
    const updatedReport: DailyReport = {
      ...activeReport,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };
    setActiveReport(updatedReport);
    await onSaveReport(updatedReport);
    onShowToast('Work entry removed.', 'info');
  };

  // Submit Daily Report for Supervisor Review
  const handleSubmitReport = async () => {
    if (activeReport.entries.length === 0) {
      onShowToast('Please add at least one work entry before submitting your daily report.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const newRevision = {
        id: `REV-${Date.now()}`,
        timestamp: nowIso,
        actor: currentExtension.name,
        actorRole: 'Employee',
        previousStatus: activeReport.status,
        newStatus: 'Submitted' as DailyReportStatus,
        comment: 'Daily work report submitted for supervisor review and sign-off.',
      };

      const submittedReport: DailyReport = {
        ...activeReport,
        status: 'Submitted',
        submittedAt: nowIso,
        revisions: [...(activeReport.revisions || []), newRevision],
        updatedAt: nowIso,
      };

      setActiveReport(submittedReport);
      await onSaveReport(submittedReport);
      onShowToast('Daily work report submitted to supervisor queue!', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status color pill
  const getStatusBadge = (status: DailyReportStatus) => {
    switch (status) {
      case 'Reviewed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Under Review':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Submitted':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
      case 'Revision Requested':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse';
      case 'Draft':
      default:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
  };

  const isLocked = activeReport.status === 'Reviewed' || activeReport.status === 'Submitted';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Top Banner: Employee Desk & Date Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-sm w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span className="truncate">Employee Work Reporting System</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">Station Ext {currentExtension.extension}</span>
            </div>
            <h1 
              className="font-bold text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
              style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
            >
              My Daily Work & Operations Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed [overflow-wrap:anywhere]">
              Log client triage actions, telephony call outcomes, and emergency branch contractor mobilizations. Reports are aggregated and reviewed daily by dispatch supervisors.
            </p>
          </div>

          {/* Date Picker & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs font-mono"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenAddModal()}
              disabled={isLocked}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Work Entry</span>
            </motion.button>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs w-full min-w-0">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Report Status</div>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(activeReport.status)}`}>
                {activeReport.status}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Logged Work Entries</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {activeReport.entries.length} Entries
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Calls Handled Today</div>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{activeReport.totalCallsHandledToday} Inbound/Outbound</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Total Talk Time</div>
            <div className="text-base font-bold font-mono text-indigo-300 mt-0.5">
              {Math.floor(activeReport.totalTalkTimeSecondsToday / 60)}m {activeReport.totalTalkTimeSecondsToday % 60}s
            </div>
          </div>
        </div>
      </div>

      {/* Revision Requested Notice Banner */}
      {activeReport.status === 'Revision Requested' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-300">
              Supervisor Requested Report Revisions
            </div>
            <p className="text-slate-300">
              Please review the supervisor remarks below, update your work entries accordingly, and resubmit for final sign-off.
            </p>
            {activeReport.adminComments?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/20 text-rose-200 mt-1 italic">
                "{activeReport.adminComments[activeReport.adminComments.length - 1].message}" — {activeReport.adminComments[activeReport.adminComments.length - 1].adminName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Work Entries List + Daily Submission Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Entries Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Work Entries for {selectedDate} ({activeReport.entries.length})
            </h2>
            <button
              onClick={() => setViewHistoryModal(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Report Revision History</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeReport.entries.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">No Work Entries Logged Yet</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Start your daily work log by clicking "Add Work Entry". Record customer triage calls, contractor follow-ups, and field dispatches.
                </p>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Log First Work Entry
                </button>
              </div>
            ) : (
              activeReport.entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  whileHover={{ y: -2 }}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30">
                          {entry.category}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{entry.startTime} – {entry.endTime} ({entry.time})</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          entry.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : entry.status === 'In Progress'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {entry.status}
                      </span>

                      {!isLocked && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenAddModal(entry)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            title="Edit entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outcome and Pending Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Result / Outcome</div>
                      <div className="text-slate-300 text-[11px] leading-relaxed">
                        {entry.resultOutcome}
                      </div>
                    </div>

                    {entry.pendingWork && (
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-amber-400">Pending Follow-up</div>
                        <div className="text-slate-400 text-[11px]">
                          {entry.pendingWork}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remarks & Attachment */}
                  {(entry.remarks || entry.attachmentName) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      {entry.remarks && <span className="italic">Note: "{entry.remarks}"</span>}
                      {entry.attachmentName && (
                        <span className="flex items-center gap-1 text-indigo-400 font-mono">
                          <Paperclip className="w-3 h-3" />
                          <span>{entry.attachmentName}</span>
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Daily Report Summary & Final Submission (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Report Summary</h3>
                <p className="text-[11px] text-slate-400">End-of-day executive overview</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(activeReport.status)}`}>
                {activeReport.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Executive Highlights / Handover Note:
                </label>
                <textarea
                  rows={4}
                  disabled={isLocked}
                  value={activeReport.summaryHighlights}
                  onChange={(e) => setActiveReport({ ...activeReport, summaryHighlights: e.target.value })}
                  placeholder="Summarize key complaints resolved, open escalations for tomorrow, and contractor performance notes..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 leading-relaxed"
                />
              </div>

              {/* Telephony Summary Integration */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Integrated Telephony Session Totals</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Calls Logged on PBX:</span>
                  <strong className="text-white font-mono">{activeReport.totalCallsHandledToday} calls</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Connected Talk Time:</span>
                  <strong className="text-white font-mono">{Math.floor(activeReport.totalTalkTimeSecondsToday / 60)} mins</strong>
                </div>
              </div>

              {/* Submission Controls */}
              <div className="pt-2">
                {isLocked ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Report submitted for supervisor review. Editing is locked.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitReport}
                      disabled={isSubmitting || activeReport.entries.length === 0}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Daily Report'}</span>
                    </motion.button>

                    <button
                      onClick={async () => {
                        await onSaveReport(activeReport);
                        onShowToast('Draft report saved locally and to cloud.', 'info');
                      }}
                      className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Save Draft Only
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Work Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingEntry ? 'Edit Work Entry' : 'Log Daily Work Entry'}
                </h3>
                <p className="text-xs text-slate-400">Extension {currentExtension.extension} • {selectedDate}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Category:</label>
                  <select
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Vendor Calling & Negotiation">Vendor Calling & Negotiation</option>
                    <option value="Gmail Client Correspondence">Gmail Client Correspondence</option>
                    <option value="Quotation & BOQ Preparation">Quotation & BOQ Preparation</option>
                    <option value="Site Coordination & Inspection">Site Coordination & Inspection</option>
                    <option value="Technical Drawing / Spec Review">Technical Drawing / Spec Review</option>
                    <option value="Emergency Breakdown Triage">Emergency Breakdown Triage</option>
                    <option value="Procurement & Parts Sourcing">Procurement & Parts Sourcing</option>
                    <option value="Client Meeting / Call">Client Meeting / Call</option>
                    <option value="Preventive Maintenance Verification">Preventive Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status:</label>
                  <select
                    value={entryStatus}
                    onChange={(e) => setEntryStatus(e.target.value as WorkStatus)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time:</label>
                  <input
                    type="time"
                    value={entryStartTime}
                    onChange={(e) => setEntryStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time:</label>
                  <input
                    type="time"
                    value={entryEndTime}
                    onChange={(e) => setEntryEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Work Description & Incident Details:
                </label>
                <textarea
                  rows={3}
                  required
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  placeholder="Detail client communication, facility address, circuit breaker issue or maintenance task..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Result or Outcome:
                </label>
                <textarea
                  rows={2}
                  required
                  value={entryOutcome}
                  onChange={(e) => setEntryOutcome(e.target.value)}
                  placeholder="e.g. Dispatched technician, verified power load restored, client confirmed normal operations..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pending Follow-up (Optional):</label>
                  <input
                    type="text"
                    value={entryPending}
                    onChange={(e) => setEntryPending(e.target.value)}
                    placeholder="e.g. Call branch manager tomorrow at 10 AM"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Attachment / Reference URL:</label>
                  <input
                    type="text"
                    value={entryAttachment}
                    onChange={(e) => setEntryAttachment(e.target.value)}
                    placeholder="e.g. TKT-8492-report.pdf"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {editingEntry ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Revision History Modal */}
      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Report Revision Audit Trail</h3>
              </div>
              <button onClick={() => setViewHistoryModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
              {activeReport.revisions?.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No revisions logged yet.</div>
              ) : (
                activeReport.revisions.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rev.actor} ({rev.actorRole})</span>
                      <span className="text-[10px] text-slate-500 font-mono">{rev.timestamp.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>Status changed:</span>
                      <span className="font-semibold text-indigo-300">{rev.previousStatus} → {rev.newStatus}</span>
                    </div>
                    {rev.comment && (
                      <p className="text-slate-300 text-[11px] italic mt-1 bg-slate-900 p-1.5 rounded">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
