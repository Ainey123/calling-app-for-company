import React, { useState } from 'react';
import { 
  Activity, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Mail, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  Calendar, 
  Filter, 
  Search, 
  Zap, 
  PenTool, 
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { 
  ActivityTimelineItem, 
  EmployeeExtension, 
  CallRecord, 
  EmailWorkRecord, 
  DailyReport, 
  WorkEntry,
  VendorQuotation
} from '../types';

interface EmployeeActivityHubViewProps {
  timelineItems: ActivityTimelineItem[];
  extensions: EmployeeExtension[];
  calls: CallRecord[];
  emailRecords: EmailWorkRecord[];
  dailyReports: DailyReport[];
  quotations: VendorQuotation[];
  currentExtension: EmployeeExtension;
  onNavigateTab?: (tab: any) => void;
}

export const EmployeeActivityHubView: React.FC<EmployeeActivityHubViewProps> = ({
  timelineItems,
  extensions,
  calls,
  emailRecords,
  dailyReports,
  quotations,
  currentExtension,
  onNavigateTab,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'auto-only' | 'manual-only'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'calls' | 'emails' | 'work-entries' | 'reports'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Employee object
  const activeEmployee = selectedEmployeeId === 'all' 
    ? null 
    : extensions.find((e) => e.id === selectedEmployeeId) || null;

  // Filter calls, emails, work entries, and reports for this employee
  const employeeCalls = calls.filter((c) => 
    selectedEmployeeId === 'all' || c.extension === activeEmployee?.extension
  );
  const employeeEmails = emailRecords.filter((e) => 
    selectedEmployeeId === 'all' || e.employeeId === selectedEmployeeId
  );
  const employeeReports = dailyReports.filter((r) => 
    selectedEmployeeId === 'all' || r.employeeId === selectedEmployeeId
  );
  
  // Flatten work entries from reports
  const allWorkEntries: Array<WorkEntry & { reportDate: string; reportStatus: string }> = [];
  employeeReports.forEach((rep) => {
    (rep.entries || []).forEach((entry) => {
      allWorkEntries.push({
        ...entry,
        reportDate: rep.reportDate,
        reportStatus: rep.status,
      });
    });
  });

  const totalCallsCount = employeeCalls.length;
  const totalEmailsCount = employeeEmails.length;
  const totalTasksCount = allWorkEntries.length;
  const completedTasksCount = allWorkEntries.filter((t) => t.status === 'Completed').length;
  const pendingTasksCount = allWorkEntries.filter((t) => t.status !== 'Completed').length;

  // Compile full blended timeline stream from timelineItems, calls, and emailRecords
  interface UnifiedActivity {
    id: string;
    timestamp: string;
    employeeName: string;
    employeeExtension: string;
    isSystemGenerated: boolean;
    type: 'call' | 'email' | 'work-entry' | 'report' | 'system';
    title: string;
    description: string;
    badge: string;
    outcome?: string;
    projectBranch?: string;
    durationSeconds?: number;
    pendingWork?: string;
  }

  const stream: UnifiedActivity[] = [];

  // Add Call records
  employeeCalls.forEach((call) => {
    stream.push({
      id: `call-${call.id}`,
      timestamp: call.timestamp || new Date().toISOString(),
      employeeName: call.agentName,
      employeeExtension: call.extension,
      isSystemGenerated: true, // Auto-captured PBX Telephony
      type: 'call',
      title: `${call.direction === 'inbound' ? 'Inbound Call Received' : call.direction === 'outbound' ? 'Outbound Call Placed' : 'Missed Call'}: ${call.callerName}`,
      description: `${call.callerNumber} • ${call.organization || 'External Party'} (${call.branch || 'Branch'}). Notes: ${call.notes || 'Call completed through softphone.'}`,
      badge: 'Auto-Captured Telephony',
      outcome: call.callOutcome || (call.status === 'completed' ? 'Call Completed' : 'Missed'),
      projectBranch: call.branch,
      durationSeconds: call.durationSeconds,
    });
  });

  // Add Email Work records
  employeeEmails.forEach((email) => {
    stream.push({
      id: `email-${email.id}`,
      timestamp: `${email.date}T${email.time}:00`,
      employeeName: email.employeeName,
      employeeExtension: email.employeeExtension,
      isSystemGenerated: false, // Employee-Entered Gmail Log
      type: 'email',
      title: `Gmail Activity: ${email.subject}`,
      description: `Category: ${email.category}. Action: ${email.actionTaken}`,
      badge: 'Employee-Entered Gmail Log',
      outcome: email.status,
      projectBranch: email.projectBranch,
      pendingWork: email.pendingAction,
    });
  });

  // Add Work Entries from Daily Reports
  allWorkEntries.forEach((entry) => {
    stream.push({
      id: `work-${entry.id}`,
      timestamp: `${entry.date}T${entry.time || '12:00'}:00`,
      employeeName: entry.employeeName,
      employeeExtension: entry.employeeExtension,
      isSystemGenerated: false, // Employee-Entered Work Log
      type: 'work-entry',
      title: `Task Log: ${entry.category}`,
      description: `${entry.description}. Result: ${entry.resultOutcome}`,
      badge: 'Employee-Entered Task Log',
      outcome: entry.status,
      projectBranch: entry.projectBranch,
      pendingWork: entry.pendingWork,
    });
  });

  // Add Daily Report submissions/revisions
  employeeReports.forEach((rep) => {
    if (rep.submittedAt) {
      stream.push({
        id: `report-sub-${rep.id}`,
        timestamp: rep.submittedAt,
        employeeName: rep.employeeName,
        employeeExtension: rep.employeeExtension,
        isSystemGenerated: false,
        type: 'report',
        title: `Daily Work Report Submitted (${rep.reportDate})`,
        description: `Compiled report with ${rep.entries.length} task entries, ${rep.totalCallsHandledToday} calls handled. Summary: ${rep.summaryHighlights || 'Ready for supervisor review.'}`,
        badge: 'Employee Report Submission',
        outcome: rep.status,
      });
    }
  });

  // Sort descending by timestamp
  stream.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Filter Stream
  const filteredStream = stream.filter((item) => {
    if (filterType === 'auto-only' && !item.isSystemGenerated) return false;
    if (filterType === 'manual-only' && item.isSystemGenerated) return false;

    if (categoryFilter === 'calls' && item.type !== 'call') return false;
    if (categoryFilter === 'emails' && item.type !== 'email') return false;
    if (categoryFilter === 'work-entries' && item.type !== 'work-entry') return false;
    if (categoryFilter === 'reports' && item.type !== 'report') return false;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.employeeName.toLowerCase().includes(query) ||
      (item.projectBranch && item.projectBranch.toLowerCase().includes(query)) ||
      (item.outcome && item.outcome.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Top Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                Management Inspection Hub
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400">Audit-Grade Attribution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-emerald-400 shrink-0" />
              <span>Employee Activity & Work Tracking</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Transparent, chronological inspection of what each employee worked on, who they contacted, what outcomes they achieved, and what tasks remain pending. Clearly distinguishes automated telephony logs from employee-entered records.
            </p>
          </div>

          {/* Employee Quick Select */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold px-2">Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none font-medium"
            >
              <option value="all">All Team Members ({extensions.length})</option>
              {extensions.map((ext) => (
                <option key={ext.id} value={ext.id}>
                  {ext.name} (Ext {ext.extension} - {ext.role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Employee Context Pill */}
        {activeEmployee && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border">
            <div className="flex items-center gap-3">
              <img
                src={activeEmployee.avatar}
                alt={activeEmployee.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40"
              />
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{activeEmployee.name}</span>
                  <span className="font-mono text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
                    Ext {activeEmployee.extension}
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  {activeEmployee.role} &bull; {activeEmployee.department}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Shift Hours:</div>
                <div className="font-mono text-xs text-slate-300">{activeEmployee.shiftHours || '09:00 AM - 05:30 PM'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Direct Phone:</div>
                <div className="font-mono text-xs text-slate-300">{activeEmployee.phone}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Summary Cards for Selected Scope */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Recorded Calls</span>
            <PhoneCall className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalCallsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">⚡ Auto-captured telephony</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Gmail Activities</span>
            <Mail className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalEmailsCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">✍️ Client RFQs & quotes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Completed Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{completedTasksCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Tasks finalized & signed off</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pending Work</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingTasksCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Requires follow-up / quote</div>
        </div>
      </div>

      {/* Filter Bar with Transparent Attribution Pill */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities, caller names, projects, or outcomes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Attribution Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setFilterType('auto-only')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                filterType === 'auto-only' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-300" />
              <span>Auto-Captured Only</span>
            </button>
            <button
              onClick={() => setFilterType('manual-only')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                filterType === 'manual-only' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PenTool className="w-3 h-3 text-amber-300" />
              <span>Employee Logged Only</span>
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Channels</option>
            <option value="calls">Business Calls (PBX)</option>
            <option value="emails">Gmail Correspondence</option>
            <option value="work-entries">Daily Work Entries</option>
            <option value="reports">Daily Report Submissions</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="space-y-3.5">
        {filteredStream.map((item) => (
          <div
            key={item.id}
            className={`border rounded-2xl p-4 sm:p-5 shadow-lg transition ${
              item.isSystemGenerated
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                : 'bg-slate-900 border-indigo-950/60 hover:border-indigo-800/60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Attribution & Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {item.isSystemGenerated ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Auto-Captured (PBX Telephony)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <PenTool className="w-3 h-3 text-amber-400" />
                      <span>Employee-Entered Record</span>
                    </span>
                  )}

                  {item.outcome && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      Outcome: {item.outcome}
                    </span>
                  )}

                  {item.durationSeconds !== undefined && item.durationSeconds > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Duration: {Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s
                    </span>
                  )}

                  <span className="text-xs text-slate-400 ml-auto font-mono">
                    {item.timestamp.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {item.description}
                </p>

                {/* Project Site & Pending Action */}
                {(item.projectBranch || item.pendingWork) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {item.projectBranch && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Site: <strong>{item.projectBranch}</strong></span>
                      </div>
                    )}

                    {item.pendingWork && (
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Pending: <strong>{item.pendingWork}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Employee attribution stamp */}
              <div className="shrink-0 text-right sm:border-l sm:border-slate-800 sm:pl-4 pt-2 sm:pt-0">
                <div className="text-[10px] uppercase font-bold text-slate-500">Engineer:</div>
                <div className="text-xs font-bold text-slate-200">{item.employeeName}</div>
                <div className="text-[10px] font-mono text-indigo-400">Ext {item.employeeExtension}</div>
              </div>
            </div>
          </div>
        ))}

        {filteredStream.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
            No activity records found matching this filter.
          </div>
        )}
      </div>
    </div>
  );
};
