import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  MessageSquare, 
  Download, 
  Clock, 
  User, 
  Building2, 
  PhoneCall, 
  Shield, 
  ArrowUpRight, 
  FileSpreadsheet,
  Check,
  Send,
  Eye,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyReport, EmployeeExtension, DailyReportStatus, WorkEntry } from '../types';

interface AdminReportsReviewViewProps {
  reports: DailyReport[];
  extensions: EmployeeExtension[];
  currentExtension: EmployeeExtension;
  isAdmin: boolean;
  onUpdateReport: (reportId: string, updates: Partial<DailyReport>) => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminReportsReviewView: React.FC<AdminReportsReviewViewProps> = ({
  reports,
  extensions,
  currentExtension,
  isAdmin,
  onUpdateReport,
  onShowToast,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id || null);
  const [mobilePane, setMobilePane] = useState<'list' | 'details'>('list');

  // Correction Request Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [adminCommentInput, setAdminCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered reports list
  const filteredReports = reports.filter((r) => {
    if (selectedEmployeeId !== 'all' && r.employeeId !== selectedEmployeeId) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (dateFilter && r.reportDate !== dateFilter) return false;
    return true;
  });

  const selectedReport = reports.find((r) => r.id === selectedReportId) || filteredReports[0] || null;

  // KPI aggregates
  const totalReportsCount = reports.length;
  const submittedCount = reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length;
  const reviewedCount = reports.filter((r) => r.status === 'Reviewed').length;
  const revisionRequestedCount = reports.filter((r) => r.status === 'Revision Requested').length;

  const getStatusBadge = (status: DailyReportStatus) => {
    switch (status) {
      case 'Reviewed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Under Review':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Submitted':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
      case 'Revision Requested':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold';
      case 'Draft':
      default:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
  };

  // Mark as Reviewed (Approve)
  const handleMarkReviewed = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const newRev = {
        id: `REV-${Date.now()}`,
        timestamp: nowIso,
        actor: currentExtension.name,
        actorRole: 'Admin Supervisor',
        previousStatus: selectedReport.status,
        newStatus: 'Reviewed' as DailyReportStatus,
        comment: 'Daily work log approved and signed off by supervisor.',
      };

      await onUpdateReport(selectedReport.id, {
        status: 'Reviewed',
        reviewedAt: nowIso,
        reviewedBy: currentExtension.name,
        revisions: [...(selectedReport.revisions || []), newRev],
      });
      onShowToast(`Report ${selectedReport.id} marked as Reviewed & Approved!`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Revision / Correction
  const handleRequestRevision = async () => {
    if (!selectedReport || !correctionNote.trim()) {
      onShowToast('Please specify the required corrections for the employee.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const newRev = {
        id: `REV-${Date.now()}`,
        timestamp: nowIso,
        actor: currentExtension.name,
        actorRole: 'Admin Supervisor',
        previousStatus: selectedReport.status,
        newStatus: 'Revision Requested' as DailyReportStatus,
        comment: correctionNote.trim(),
      };

      const newComment = {
        id: `COMM-${Date.now()}`,
        adminId: currentExtension.id,
        adminName: currentExtension.name,
        timestamp: nowIso,
        message: correctionNote.trim(),
        isCorrectionRequest: true,
      };

      await onUpdateReport(selectedReport.id, {
        status: 'Revision Requested',
        revisions: [...(selectedReport.revisions || []), newRev],
        adminComments: [...(selectedReport.adminComments || []), newComment],
      });

      setIsRevisionModalOpen(false);
      setCorrectionNote('');
      onShowToast('Revision requested. Employee notified for corrections.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Administrative Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !adminCommentInput.trim()) return;

    const newComment = {
      id: `COMM-${Date.now()}`,
      adminId: currentExtension.id,
      adminName: currentExtension.name,
      timestamp: new Date().toISOString(),
      message: adminCommentInput.trim(),
      isCorrectionRequest: false,
    };

    await onUpdateReport(selectedReport.id, {
      adminComments: [...(selectedReport.adminComments || []), newComment],
    });

    setAdminCommentInput('');
    onShowToast('Administrative comment added.', 'success');
  };

  // Export Daily Reports to CSV
  const handleExportReportsCSV = () => {
    const rows: string[] = [];
    const escapeCsv = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    rows.push(['FAST CONNECT - EMPLOYEE DAILY WORK & AUDIT REPORT'].join(','));
    rows.push([`Generated On: ${new Date().toLocaleString()}`, 'Format: Enterprise Operations Review'].map(escapeCsv).join(','));
    rows.push('');

    rows.push([
      'Report ID',
      'Date',
      'Employee Name',
      'Extension',
      'Department',
      'Status',
      'Calls Handled',
      'Talk Time (Secs)',
      'Total Work Entries',
      'Summary Highlights',
      'Reviewed By',
      'Reviewed At'
    ].map(escapeCsv).join(','));

    filteredReports.forEach((r) => {
      rows.push([
        r.id,
        r.reportDate,
        r.employeeName,
        r.employeeExtension,
        r.employeeDepartment,
        r.status,
        r.totalCallsHandledToday,
        r.totalTalkTimeSecondsToday,
        r.entries?.length || 0,
        r.summaryHighlights || '',
        r.reviewedBy || '',
        r.reviewedAt || ''
      ].map(escapeCsv).join(','));
    });

    rows.push('');
    rows.push(['ITEMIZED WORK ENTRIES AUDIT'].join(','));
    rows.push([
      'Report ID',
      'Entry ID',
      'Date',
      'Time',
      'Employee',
      'Category',
      'Status',
      'Description',
      'Result Outcome',
      'Pending Work',
      'Remarks'
    ].map(escapeCsv).join(','));

    filteredReports.forEach((r) => {
      r.entries?.forEach((entry) => {
        rows.push([
          r.id,
          entry.id,
          entry.date,
          `${entry.startTime || ''}-${entry.endTime || ''}`,
          r.employeeName,
          entry.category,
          entry.status,
          entry.description,
          entry.resultOutcome,
          entry.pendingWork || '',
          entry.remarks || ''
        ].map(escapeCsv).join(','));
      });
    });

    const csvContent = rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FAST_Connect_Employee_Daily_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Employee daily reports exported to CSV successfully.', 'success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Administrative Supervision</span>
            <span>•</span>
            <span className="text-slate-400">Employee Work Review & Verification</span>
          </div>
          <h1 
            className="font-bold text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
          >
            Daily Work Reports Review Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed [overflow-wrap:anywhere]">
            Audit itemized daily employee work entries, verified telephony call records, and branch service outcomes. Review submissions, request corrections, and approve daily station logs.
          </p>
        </div>

        {/* Export Data Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportReportsCSV}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span>Export Reports to CSV</span>
        </motion.button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Reports Logged</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalReportsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all station desks</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Pending Review</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">{submittedCount}</div>
          <div className="text-[11px] text-indigo-300 mt-1">Awaiting supervisor sign-off</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Reviewed & Approved</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{reviewedCount}</div>
          <div className="text-[11px] text-emerald-300 mt-1">Archived to compliance audit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase">Revisions Requested</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{revisionRequestedCount}</div>
          <div className="text-[11px] text-rose-300 mt-1">Pending employee amendments</div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Officers & Extensions</option>
              {extensions.map((ext) => (
                <option key={ext.id} value={ext.id}>
                  Ext {ext.extension} - {ext.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted (Needs Review)</option>
              <option value="Under Review">Under Review</option>
              <option value="Reviewed">Reviewed / Approved</option>
              <option value="Revision Requested">Revision Requested</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing {filteredReports.length} of {reports.length} Reports
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden w-full max-w-full min-w-0 mb-3">
        <div className="flex flex-col sm:flex-row gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold w-full">
          <button
            onClick={() => setMobilePane('list')}
            className={`w-full sm:flex-1 py-2 px-3 text-center rounded-lg transition break-words ${
              mobilePane === 'list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reports Queue ({filteredReports.length})
          </button>
          <button
            onClick={() => setMobilePane('details')}
            className={`w-full sm:flex-1 py-2 px-3 text-center rounded-lg transition break-words ${
              mobilePane === 'details'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {selectedReport ? `Report (${selectedReport.employeeName.split(' ')[0]})` : 'Report Details'}
          </button>
        </div>
      </div>

      {/* Main Split: Reports List & Detailed Inspection Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        {/* Left Column: Reports List (5 cols) */}
        <div className={`lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full min-w-0 ${
          mobilePane === 'details' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-3 bg-slate-950/70 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reports Queue ({filteredReports.length})
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[640px] overflow-y-auto">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No daily reports match the current filter selection.
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;

                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      setMobilePane('details');
                    }}
                    className={`p-4 transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-indigo-950/30 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{report.employeeName}</span>
                          <span className="font-mono text-[10px] text-indigo-400">Ext {report.employeeExtension}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Date: {report.reportDate}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 line-clamp-2 italic">
                      "{report.summaryHighlights || 'No executive summary highlights entered.'}"
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/70 font-mono">
                      <span>{report.entries?.length || 0} Work Entries</span>
                      <span>{report.totalCallsHandledToday} Telephony Calls</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Report Inspection & Supervisor Actions (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 w-full min-w-0 ${mobilePane === 'list' ? 'hidden lg:block' : 'block'}`}>
          {selectedReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 w-full min-w-0">
              {/* Mobile Back Button */}
              <button
                onClick={() => setMobilePane('list')}
                className="lg:hidden flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-1 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span>← Back to Reports Queue</span>
              </button>
              {/* Header and Approval Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                      {selectedReport.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedReport.employeeName} — Daily Work Log
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Date: {selectedReport.reportDate} • Department: {selectedReport.employeeDepartment} (Ext {selectedReport.employeeExtension})
                  </p>
                </div>

                {/* Supervisor Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleMarkReviewed}
                    disabled={isSubmitting || selectedReport.status === 'Reviewed'}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve / Mark Reviewed</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsRevisionModalOpen(true)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Corrections</span>
                  </motion.button>
                </div>
              </div>

              {/* Telephony Session Statistics Badge */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">PBX Calls Handled</div>
                  <div className="font-bold text-white font-mono mt-0.5">{selectedReport.totalCallsHandledToday} calls</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Talk Time</div>
                  <div className="font-bold text-emerald-400 font-mono mt-0.5">
                    {Math.floor(selectedReport.totalTalkTimeSecondsToday / 60)}m {selectedReport.totalTalkTimeSecondsToday % 60}s
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Entries Count</div>
                  <div className="font-bold text-indigo-300 font-mono mt-0.5">{selectedReport.entries?.length || 0} tasks</div>
                </div>
              </div>

              {/* Summary Highlights */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Employee Summary Highlights
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed italic">
                  "{selectedReport.summaryHighlights || 'No summary notes submitted.'}"
                </div>
              </div>

              {/* Itemized Work Entries */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Itemized Work Entries ({selectedReport.entries?.length || 0})</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedReport.entries?.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{entry.category}</span>
                            <span className="text-slate-500">•</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {entry.startTime} – {entry.endTime} ({entry.time})
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1">{entry.description}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {entry.status}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-semibold">Outcome: </span>
                          <span className="text-slate-300">{entry.resultOutcome}</span>
                        </div>
                        {entry.pendingWork && (
                          <div>
                            <span className="text-amber-400 font-semibold">Pending: </span>
                            <span className="text-slate-400">{entry.pendingWork}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Feedback & Comments Thread */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Administrative Remarks & Correction Thread</span>
                </div>

                <div className="space-y-2">
                  {selectedReport.adminComments?.map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        comm.isCorrectionRequest
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white flex items-center gap-1">
                          {comm.isCorrectionRequest && <AlertCircle className="w-3 h-3 text-rose-400" />}
                          <span>{comm.adminName} (Supervisor)</span>
                        </span>
                        <span className="text-slate-500 font-mono">{comm.timestamp.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p>{comm.message}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={adminCommentInput}
                    onChange={(e) => setAdminCommentInput(e.target.value)}
                    placeholder="Add an administrative note or feedback for this report..."
                    className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
              Select an employee daily report from the left queue to review entries and issue supervisor approval.
            </div>
          )}
        </div>
      </div>

      {/* Request Correction Modal */}
      {isRevisionModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Request Report Correction</h3>
                <p className="text-xs text-slate-400">For {selectedReport.employeeName} ({selectedReport.reportDate})</p>
              </div>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Specify the exact revisions or missing incident information the employee needs to update before supervisor approval:
              </p>

              <textarea
                rows={4}
                required
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="e.g. Please clarify contractor arrival time for HBL Gulberg and add the client signed dispatch receipt number..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-500 leading-relaxed"
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  disabled={isSubmitting || !correctionNote.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  Send Revision Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
