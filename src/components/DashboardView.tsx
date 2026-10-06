import React from 'react';
import { 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  TicketCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Clock, 
  Building2, 
  MapPin, 
  User, 
  Users2, 
  Radio, 
  Sparkles, 
  ArrowUpRight, 
  Plus, 
  Play, 
  CalendarClock, 
  Activity,
  ArrowRight,
  Shield,
  Layers,
  Database,
  Camera,
  Mail,
  FileText,
  DollarSign,
  ClipboardList,
  ClipboardCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PhoneForwarded,
  Info,
  Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  CallRecord, 
  ComplaintTicket, 
  EmployeeExtension, 
  ScheduledCall, 
  TicketStatus, 
  TicketPriority, 
  DailyReport,
  EmailWorkRecord,
  VendorQuotation,
  Vendor
} from '../types';

interface DashboardViewProps {
  calls: CallRecord[];
  tickets: ComplaintTicket[];
  extensions: EmployeeExtension[];
  dailyReports?: DailyReport[];
  emailRecords?: EmailWorkRecord[];
  quotations?: VendorQuotation[];
  vendors?: Vendor[];
  activeCall: {
    number: string;
    name: string;
    organization?: string;
    branch?: string;
    durationSeconds: number;
    isOnHold?: boolean;
    isMuted?: boolean;
  } | null;
  scheduledCalls: ScheduledCall[];
  currentExtension: EmployeeExtension;
  onNavigate: (tab: any) => void;
  onOpenSoftphone: () => void;
  onCallNumber: (number: string, name: string, org?: string, branch?: string) => void;
  onSelectTicket: (ticketId: string) => void;
  onTestTrunkLine: () => void;
  onOpenAICopilot: () => void;
  onOpenScenarioWalkthrough: () => void;
  onOpenLoginModal: () => void;
  onOpenPhotoModal?: () => void;
  didNumber?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  calls,
  tickets,
  extensions,
  dailyReports = [],
  emailRecords = [],
  quotations = [],
  vendors = [],
  activeCall,
  scheduledCalls,
  currentExtension,
  onNavigate,
  onOpenSoftphone,
  onCallNumber,
  onSelectTicket,
  onTestTrunkLine,
  onOpenAICopilot,
  onOpenScenarioWalkthrough,
  onOpenLoginModal,
  onOpenPhotoModal,
  didNumber,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Total Calls & Talk Time
  const totalCalls = calls.length;
  const inboundCalls = calls.filter((c) => c.direction === 'inbound').length;
  const outboundCalls = calls.filter((c) => c.direction === 'outbound').length;
  const completedCalls = calls.filter((c) => c.status === 'completed').length;
  const missedCalls = calls.filter((c) => c.direction === 'missed' || c.status === 'missed').length;
  
  const totalTalkTimeSecs = calls
    .filter((c) => c.status === 'completed')
    .reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const formattedTalkTime = totalTalkTimeSecs >= 3600
    ? `${Math.floor(totalTalkTimeSecs / 3600)}h ${Math.floor((totalTalkTimeSecs % 3600) / 60)}m`
    : `${Math.floor(totalTalkTimeSecs / 60)}m ${totalTalkTimeSecs % 60}s`;

  // 2. Vendor Calls Statistics
  const vendorCalls = calls.filter((c) => c.vendorId || (c.notes && c.notes.toLowerCase().includes('vendor')));
  const vendorCallsCount = vendorCalls.length;

  // 3. Email & Gmail Work handled
  const totalEmailsCount = emailRecords.length;
  const awaitingReplyEmails = emailRecords.filter((e) => e.status === 'Awaiting Reply').length;

  // 4. Daily Reports Status for Today
  const todayReports = dailyReports.filter((r) => r.reportDate === todayStr);
  const submittedTodayReports = todayReports.filter((r) => r.status === 'Submitted' || r.status === 'Reviewed');
  const reportsPendingReview = dailyReports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review');

  // 5. Work entries rollup (Completed vs Pending Work across all reports)
  let totalTasksLogged = 0;
  let completedTasksCount = 0;
  let pendingTasksCount = 0;

  dailyReports.forEach((rep) => {
    (rep.entries || []).forEach((entry) => {
      totalTasksLogged++;
      if (entry.status === 'Completed') {
        completedTasksCount++;
      } else {
        pendingTasksCount++;
      }
    });
  });

  // 6. Quotation pipeline
  const activeQuotes = quotations.filter((q) => q.status !== 'Rejected');
  const totalQuotedAmountPkr = activeQuotes.reduce((acc, q) => acc + (q.amountPkr || 0), 0);

  // Scheduled calls pending
  const pendingScheduled = scheduledCalls.filter((s) => s.status === 'pending');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Top Welcome & Operations Status Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm w-full min-w-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-emerald-400">FAST Connect Operations Platform</span>
              <span>•</span>
              <span className="text-slate-300">Engineering Services & Work Tracking</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">Trunk: {didNumber || '+92 (42) 111-327-800'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Management Operations & Work Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Centralized inspection platform for employee work activity, vendor coordination, business calling, Gmail correspondences, and daily management reporting.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('sim-calling')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>SIM Calling Station</span>
            </button>

            <button
              onClick={onOpenSoftphone}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Launch Softphone</span>
            </button>

            <button
              onClick={() => onNavigate('daily-work')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-purple-400" />
              <span>Log Daily Work</span>
            </button>

            <button
              onClick={() => onNavigate('emails')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Gmail Logs</span>
            </button>
          </div>
        </div>

        {/* Current Officer Status & Operational Banner */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border">
          <div className="flex items-center gap-3">
            <img
              src={currentExtension.avatar}
              alt={currentExtension.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/40"
            />
            <div>
              <span className="font-bold text-white">{currentExtension.name}</span>
              <span className="font-mono text-indigo-400 font-bold ml-2">Ext {currentExtension.extension}</span>
              <span className="text-slate-400 ml-2">({currentExtension.role})</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              PBX WebRTC Station Ready
            </span>
            <span>•</span>
            <span className="text-slate-300">Gmail: Manual Logging (Active)</span>
            <span>•</span>
            <span className="text-slate-300">Google Maps Grounded</span>
          </div>
        </div>
      </div>

      {/* Management Review Alert Banner if Reports Awaiting Boss Review */}
      {reportsPendingReview.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Management Action Required</span>
                <span className="text-xs px-2 py-0.2 rounded-full bg-amber-500/30 text-amber-200 font-mono">
                  {reportsPendingReview.length} Report{reportsPendingReview.length > 1 ? 's' : ''} Pending Review
                </span>
              </h3>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Employees have submitted compiled daily work reports awaiting supervisor inspection and signoff.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-reports')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-md cursor-pointer"
          >
            <span>Review Reports Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Daily Reports Status */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('admin-reports')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-4 rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Today's Reports</span>
            <ClipboardList className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {submittedTodayReports.length} / {extensions.length}
          </div>
          <div className="text-[10px] text-purple-300 font-semibold mt-1">
            {reportsPendingReview.length > 0 ? `${reportsPendingReview.length} pending review` : 'All caught up'}
          </div>
        </motion.div>

        {/* 2. Business Calls Today */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('calls')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Business Calls</span>
            <PhoneCall className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{totalCalls}</div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {formattedTalkTime} total talk time
          </div>
        </motion.div>

        {/* 3. Vendor Calls & Coordination */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('vendors')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-4 rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Vendor Calls</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{vendorCallsCount}</div>
          <div className="text-[10px] text-amber-300 mt-1">
            {vendors.length} active contractors
          </div>
        </motion.div>

        {/* 4. Emails Handled */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('emails')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-4 rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Gmail Activities</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{totalEmailsCount}</div>
          <div className="text-[10px] text-indigo-300 mt-1">
            {awaitingReplyEmails > 0 ? `${awaitingReplyEmails} awaiting reply` : 'Up to date'}
          </div>
        </motion.div>

        {/* 5. Completed Work Tasks */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('activity')}
          className="bg-slate-900 border border-slate-800 hover:border-teal-500/40 p-4 rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-teal-400 font-mono">{completedTasksCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Signed-off work entries</div>
        </motion.div>

        {/* 6. Pending Work Tasks */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('activity')}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 p-4 rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pending Work</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-400 font-mono">{pendingTasksCount}</div>
          <div className="text-[10px] text-rose-300 font-semibold mt-1">
            Awaiting quotes / action
          </div>
        </motion.div>
      </div>

      {/* CORE MODULE 1: EMPLOYEE-WISE WORK ACTIVITY & DAILY REPORTING SUMMARY TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Employee-Wise Work Activity & Daily Reporting Status
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live inspection of each engineer's phone calls, Gmail activities, task completion, and daily report status.
            </p>
          </div>

          <button
            onClick={() => onNavigate('activity')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Full Activity Inspection Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Employee Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Engineer / Employee</th>
                <th className="p-3.5">Discipline & Role</th>
                <th className="p-3.5">Calls Handled</th>
                <th className="p-3.5">Gmail Logs</th>
                <th className="p-3.5">Tasks Completed</th>
                <th className="p-3.5">Pending Work</th>
                <th className="p-3.5">Daily Report Status</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {extensions.map((ext) => {
                // Find calls for this extension
                const empCalls = calls.filter((c) => c.extension === ext.extension);
                const empEmails = emailRecords.filter((e) => e.employeeId === ext.id);
                const empReportToday = dailyReports.find(
                  (r) => r.employeeId === ext.id && r.reportDate === todayStr
                );

                // Calculate completed vs pending tasks for this employee across all reports
                let empCompleted = 0;
                let empPending = 0;
                dailyReports
                  .filter((r) => r.employeeId === ext.id)
                  .forEach((r) => {
                    (r.entries || []).forEach((e) => {
                      if (e.status === 'Completed') empCompleted++;
                      else empPending++;
                    });
                  });

                const reportStatus = empReportToday ? empReportToday.status : 'Draft';

                return (
                  <tr key={ext.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ext.avatar}
                          alt={ext.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="truncate">{ext.name}</div>
                          <div className="text-[10px] text-indigo-400 font-mono font-normal">
                            Ext {ext.extension}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      <div>{ext.role}</div>
                      <div className="text-[10px] text-slate-500">{ext.department}</div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-200">
                      <div className="font-bold">{empCalls.length} calls</div>
                      <div className="text-[10px] text-slate-500">
                        {empCalls.filter((c) => c.status === 'completed').length} connected
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-200">
                      <div className="font-bold">{empEmails.length} logged</div>
                    </td>

                    <td className="p-3.5 font-mono text-teal-400 font-bold">
                      {empCompleted} done
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        empPending > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {empPending} pending
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                        reportStatus === 'Reviewed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : reportStatus === 'Submitted'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
                          : reportStatus === 'Revision Requested'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {reportStatus}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('activity')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                          title="Inspect full activity stream"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => onCallNumber(`Ext ${ext.extension}`, ext.name, 'Internal PBX', ext.role)}
                          className="p-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition cursor-pointer"
                          title="Intercom dial"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Vendor Call Stats & Recent RFQs + Pending Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vendor Call Statistics & Active Quotations (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Vendor Coordination & Quotations in Pipeline
              </h2>
            </div>
            <button
              onClick={() => onNavigate('vendors')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Vendor Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quotations Highlight Table */}
          <div className="divide-y divide-slate-800/60">
            {quotations.slice(0, 4).map((quote) => (
              <div
                key={quote.id}
                onClick={() => onNavigate('vendors')}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white truncate">{quote.vendorName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                      {quote.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {quote.projectBranch}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-0.5">
                    Scope: {quote.scopeDescription}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-emerald-400">
                    {quote.amountPkr ? `PKR ${quote.amountPkr.toLocaleString()}` : 'RFQ Sent'}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
            <span>Total Active RFQ Pipeline Value:</span>
            <strong className="text-emerald-400 font-mono text-sm">
              PKR {totalQuotedAmountPkr.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Right Column: Scheduled Follow-ups & Recent Calling Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scheduled Appointments / Call Follow-ups */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Scheduled Follow-Up Calls ({pendingScheduled.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('calls')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Calling Hub
              </button>
            </div>

            {pendingScheduled.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No pending call follow-ups scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingScheduled.slice(0, 3).map((sched) => (
                  <div
                    key={sched.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{sched.callerName}</div>
                      <div className="text-[11px] text-slate-400">{sched.notes}</div>
                      <div className="text-[10px] text-amber-400 font-mono mt-1">
                        {sched.scheduledDate} at {sched.scheduledTime} &bull; Officer: {sched.agentName}
                      </div>
                    </div>

                    <button
                      onClick={() => onCallNumber(sched.callerNumber, sched.callerName, sched.organization, sched.branch)}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 transition cursor-pointer"
                      title="Call scheduled contact now"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Dial Shortcuts to Top Vendors */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Quick Vendor Dispatch
                </h2>
              </div>
              <button
                onClick={() => onNavigate('vendors')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                All ({vendors.length})
              </button>
            </div>

            <div className="space-y-2">
              {vendors.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{v.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{v.trade} &bull; {v.area}, {v.city}</div>
                  </div>

                  <button
                    onClick={() => onCallNumber(v.phone, v.name, 'Vendor Dispatch', v.city)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Dial</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dual-SIM Cellular Dispatch Quick Terminal */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Dual-SIM Dispatcher
                  </h2>
                  <span className="text-[10px] text-emerald-400 font-medium">Cellular Carrier Online</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('sim-calling')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Full Station</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Carrier Status Chips */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex flex-col">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-emerald-400">SIM 1</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="font-semibold text-xs text-white mt-0.5 truncate">Jazz Corporate</div>
                <div className="text-[10px] text-slate-400">4G LTE • 98% Sig</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-teal-500/20 flex flex-col">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-teal-400">SIM 2</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                </div>
                <div className="font-semibold text-xs text-white mt-0.5 truncate">Zong Enterprise</div>
                <div className="text-[10px] text-slate-400">4G LTE • 94% Sig</div>
              </div>
            </div>

            {/* Action to Launch SIM Form */}
            <button
              onClick={() => onNavigate('sim-calling')}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Launch SIM Calling Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
