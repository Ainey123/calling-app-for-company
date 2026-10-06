import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneMissed, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  Users,
  Award,
  Zap,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EmployeeExtension, CallRecord, ComplaintTicket } from '../types';
import { getInitialsAvatar } from '../utils/imageUtils';

interface AnalyticsViewProps {
  extensions: EmployeeExtension[];
  calls: CallRecord[];
  tickets: ComplaintTicket[];
  didNumber?: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  extensions,
  calls,
  tickets,
  didNumber,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [activeMetricTab, setActiveMetricTab] = useState<'all' | 'handling' | 'resolution' | 'duration'>('all');

  const totalCalls = calls.length + 84; // aggregate day volume
  const completedCalls = calls.filter((c) => c.status === 'completed').length + 81;
  const missedCount = calls.filter((c) => c.status === 'missed').length + 3;
  const answerRate = ((completedCalls / totalCalls) * 100).toFixed(1);

  // Hourly volume simulation
  const hourlyData = [
    { hour: '08:00', calls: 6 },
    { hour: '09:00', calls: 14 },
    { hour: '10:00', calls: 22 }, // Peak outage reports
    { hour: '11:00', calls: 18 },
    { hour: '12:00', calls: 11 },
    { hour: '13:00', calls: 9 },
    { hour: '14:00', calls: 16 },
    { hour: '15:00', calls: 12 },
    { hour: '16:00', calls: 8 },
    { hour: '17:00', calls: 4 },
  ];
  const maxHourly = Math.max(...hourlyData.map((h) => h.calls));

  const categories = [
    { name: 'Electrical & Power Breakers', count: 48, pct: 46, color: 'bg-indigo-500' },
    { name: 'HVAC & Server Cooling', count: 27, pct: 26, color: 'bg-blue-500' },
    { name: 'Diesel Generator & ATS', count: 19, pct: 18, color: 'bg-amber-500' },
    { name: 'Biometrics & IT Security', count: 10, pct: 10, color: 'bg-emerald-500' },
  ];

  // Extension performance metrics model
  const agentPerformance = [
    {
      ext: '101',
      name: 'Tariq Mehmood',
      role: 'Senior Complaint Officer',
      avatar: extensions[0]?.avatar || getInitialsAvatar('Tariq Mehmood', '101'),
      callsHandled: 24,
      avgHandlingSecs: 215, // 3m 35s
      avgCallDurationSecs: 198, // 3m 18s
      resolutionRatePct: 92.4,
      resolvedTickets: 12,
      fcrRate: 88,
      status: 'available',
      efficiencyScore: 94
    },
    {
      ext: '102',
      name: 'Fatima Noor',
      role: 'Field Supervisor (Lahore)',
      avatar: extensions[1]?.avatar || getInitialsAvatar('Fatima Noor', '102'),
      callsHandled: 19,
      avgHandlingSecs: 240, // 4m 00s
      avgCallDurationSecs: 220, // 3m 40s
      resolutionRatePct: 88.5,
      resolvedTickets: 9,
      fcrRate: 84,
      status: 'available',
      efficiencyScore: 89
    },
    {
      ext: '103',
      name: 'Imran Ali',
      role: 'Vendor Dispatcher',
      avatar: extensions[2]?.avatar || getInitialsAvatar('Imran Ali', '103'),
      callsHandled: 31,
      avgHandlingSecs: 180, // 3m 00s (Fastest)
      avgCallDurationSecs: 165, // 2m 45s
      resolutionRatePct: 94.8,
      resolvedTickets: 14,
      fcrRate: 91,
      status: 'on-call',
      efficiencyScore: 97
    },
    {
      ext: '104',
      name: 'Sarah Khan',
      role: 'Escalations Manager',
      avatar: extensions[3]?.avatar || getInitialsAvatar('Sarah Khan', '104'),
      callsHandled: 14,
      avgHandlingSecs: 290, // 4m 50s (Complex tickets)
      avgCallDurationSecs: 275, // 4m 35s
      resolutionRatePct: 85.0,
      resolvedTickets: 7,
      fcrRate: 79,
      status: 'available',
      efficiencyScore: 86
    },
  ];

  const maxHandlingSecs = 320;
  const maxDurationSecs = 320;

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const escapeCsv = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows: string[] = [];

      // 1. Report Metadata
      rows.push(['FAST CONNECT - BUSINESS TELEPHONY & COMPLAINT OPERATIONS REPORT'].join(','));
      rows.push([`Generated On: ${new Date().toLocaleString()}`, `Trunk: ${didNumber || '+92 (42) 111-327-800'}`, 'Format: Offline Business Review CSV'].map(escapeCsv).join(','));
      rows.push('');

      // 2. Executive KPI Summary
      rows.push(['EXECUTIVE OPERATIONAL SUMMARY'].join(','));
      rows.push(['Metric', 'Current Value', 'Target / SLA Benchmark'].map(escapeCsv).join(','));
      rows.push(['Total Calls Today', totalCalls, 'Expected Range: 80 - 150'].map(escapeCsv).join(','));
      rows.push(['Completed Calls', completedCalls, '95% SLA Target'].map(escapeCsv).join(','));
      rows.push(['Missed Calls', missedCount, '< 5 Critical Alert Target'].map(escapeCsv).join(','));
      rows.push(['Trunk Answer Rate (%)', `${answerRate}%`, '> 95.0% Target SLA'].map(escapeCsv).join(','));
      rows.push(['Avg Handling Time (AHT)', '3m 28s', '< 4m Target'].map(escapeCsv).join(','));
      rows.push(['Total Registered Tickets', tickets.length, 'Active Operational CRM'].map(escapeCsv).join(','));
      rows.push('');

      // 3. Officer Extension Performance
      rows.push(['OFFICER EXTENSION PRODUCTIVITY & DISPATCH PERFORMANCE'].join(','));
      rows.push([
        'Extension',
        'Officer Name',
        'Role',
        'Calls Handled',
        'Avg Handling Time (Secs)',
        'Avg Call Duration (Secs)',
        'Resolution Rate (%)',
        'Resolved Tickets',
        'First Call Resolution (%)',
        'Efficiency Score'
      ].map(escapeCsv).join(','));

      agentPerformance.forEach((a) => {
        rows.push([
          a.ext,
          a.name,
          a.role,
          a.callsHandled,
          a.avgHandlingSecs,
          a.avgCallDurationSecs,
          `${a.resolutionRatePct}%`,
          a.resolvedTickets,
          `${a.fcrRate}%`,
          `${a.efficiencyScore}/100`
        ].map(escapeCsv).join(','));
      });
      rows.push('');

      // 4. Hourly Call Traffic
      rows.push(['HOURLY TELEPHONY PEAK TRAFFIC'].join(','));
      rows.push(['Hour', 'Total Call Traffic'].map(escapeCsv).join(','));
      hourlyData.forEach((h) => {
        rows.push([h.hour, h.calls].map(escapeCsv).join(','));
      });
      rows.push('');

      // 5. Complaint Incident Category Distribution
      rows.push(['COMPLAINT INCIDENT CATEGORIES'].join(','));
      rows.push(['Category', 'Volume', 'Percentage Share (%)'].map(escapeCsv).join(','));
      categories.forEach((cat) => {
        rows.push([cat.name, cat.count, `${cat.pct}%`].map(escapeCsv).join(','));
      });
      rows.push('');

      // 6. Registered Complaint Tickets Detail
      rows.push(['ACTIVE COMPLAINT TICKETS DETAIL'].join(','));
      rows.push([
        'Ticket ID',
        'Title',
        'Organization',
        'Branch',
        'City',
        'Priority',
        'Status',
        'Category',
        'Client Phone',
        'Assigned Extension',
        'Created At'
      ].map(escapeCsv).join(','));

      tickets.forEach((t) => {
        rows.push([
          t.id,
          t.title,
          t.organization,
          t.branchName,
          t.city,
          t.priority,
          t.status,
          t.category,
          t.clientPhone,
          t.assignedExtension,
          t.createdAt
        ].map(escapeCsv).join(','));
      });
      rows.push('');

      // 7. Recent Call Records Audit
      rows.push(['RECENT CALL RECORDS AUDIT'].join(','));
      rows.push([
        'Call ID',
        'Caller Name',
        'Caller Number',
        'Organization',
        'Branch',
        'Extension',
        'Direction',
        'Duration (Secs)',
        'Status',
        'Timestamp'
      ].map(escapeCsv).join(','));

      calls.forEach((c) => {
        rows.push([
          c.id,
          c.callerName,
          c.callerNumber,
          c.organization || '',
          c.branch || '',
          c.extension,
          c.direction,
          c.durationSeconds,
          c.status,
          c.timestamp
        ].map(escapeCsv).join(','));
      });

      const csvString = rows.join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FAST_Connect_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Header with Export Data Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h1 
            className="font-extrabold text-white tracking-tight flex items-center gap-2.5 [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
          >
            <BarChart3 className="w-6 h-6 text-indigo-400 shrink-0" />
            <span>Admin PBX & Complaint Operations Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed [overflow-wrap:anywhere]">
            Monitor telephone trunk activity, service-level agreements (SLA), employee extension productivity, and contractor resolution times.
          </p>
        </div>

        {/* Export Data Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
          title="Download report data as CSV for offline business reviews"
        >
          {isExporting ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-spin" />
              <span>Exporting CSV...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Total Calls Today</span>
            <PhoneCall className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {totalCalls}
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14% vs yesterday's load</span>
          </div>
        </div>

        {/* Answer Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Trunk Answer Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            {answerRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Goal: &gt; 95% SLA Target
          </div>
        </div>

        {/* Average Handling Time */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Avg Handling Time (AHT)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            3m 28s
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-semibold">
            Fast resolution (-18s this week)
          </div>
        </div>

        {/* Missed Calls */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Missed Calls</span>
            <PhoneMissed className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">
            {missedCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            All 3 auto-alerted to dispatch
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRAPHICAL AGENT PERFORMANCE SECTION (Bar & Line Visualization) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Award className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Agent Performance & Productivity Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual benchmark comparing handling times, ticket resolution rates, and average call duration across all employee extensions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Metric Tab Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveMetricTab('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeMetricTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Metrics
              </button>
              <button
                onClick={() => setActiveMetricTab('handling')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeMetricTab === 'handling'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Handling Time
              </button>
              <button
                onClick={() => setActiveMetricTab('resolution')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeMetricTab === 'resolution'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Resolution Rate
              </button>
              <button
                onClick={() => setActiveMetricTab('duration')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  activeMetricTab === 'duration'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Call Duration
              </button>
            </div>

            {/* Chart Type Toggle: Bar vs Line */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartType('bar')}
                title="Bar Chart View"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  chartType === 'bar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                title="Line Trend View"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  chartType === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend & Benchmarks Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {(activeMetricTab === 'all' || activeMetricTab === 'handling') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block shadow-sm"></span>
                <span className="text-slate-300 font-medium">Avg Handling Time (AHT)</span>
              </div>
            )}
            {(activeMetricTab === 'all' || activeMetricTab === 'duration') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-500 inline-block shadow-sm"></span>
                <span className="text-slate-300 font-medium">Avg Call Duration</span>
              </div>
            )}
            {(activeMetricTab === 'all' || activeMetricTab === 'resolution') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm"></span>
                <span className="text-slate-300 font-medium">Ticket Resolution Rate (%)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block"></span>
              <span>SLA Target: &gt; 90% Resolution</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t-2 border-dashed border-amber-400 inline-block"></span>
              <span>Benchmark AHT: &lt; 240s</span>
            </span>
          </div>
        </div>

        {/* Chart Canvas Container */}
        {chartType === 'bar' ? (
          /* ================= BAR CHART VIEW ================= */
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
              {agentPerformance.map((agent) => {
                const handlingHeight = (agent.avgHandlingSecs / maxHandlingSecs) * 100;
                const durationHeight = (agent.avgCallDurationSecs / maxDurationSecs) * 100;
                const resolutionHeight = agent.resolutionRatePct;

                return (
                  <div
                    key={agent.ext}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
                  >
                    {/* Agent Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs truncate max-w-[110px]">
                            {agent.name.split(' ')[0]}
                          </div>
                          <div className="font-mono text-[10px] text-indigo-400 font-semibold">
                            Ext {agent.ext}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                        {agent.efficiencyScore}% Score
                      </span>
                    </div>

                    {/* Chart Bars Visualizer Area */}
                    <div className="h-44 bg-slate-900/90 rounded-xl p-3 flex items-end justify-center gap-3 border border-slate-800/80 relative">
                      {/* SLA Benchmark Guidelines */}
                      <div
                        className="absolute inset-x-2 border-b border-dashed border-emerald-500/30 pointer-events-none z-10"
                        style={{ bottom: '90%' }}
                        title="90% SLA Resolution Target"
                      />
                      <div
                        className="absolute inset-x-2 border-b border-dashed border-amber-500/30 pointer-events-none z-10"
                        style={{ bottom: `${(240 / maxHandlingSecs) * 100}%` }}
                        title="240s AHT Benchmark"
                      />

                      {/* Bar 1: Handling Time (Amber) */}
                      {(activeMetricTab === 'all' || activeMetricTab === 'handling') && (
                        <div className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                          <span className="text-[10px] font-mono text-amber-400 font-bold opacity-0 group-hover/bar:opacity-100 transition">
                            {formatSecs(agent.avgHandlingSecs)}
                          </span>
                          <div
                            style={{ height: `${handlingHeight}%` }}
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 shadow-md shadow-amber-500/20 transition-all duration-500 hover:brightness-110"
                          />
                          <span className="text-[9px] font-mono text-slate-400">AHT</span>
                        </div>
                      )}

                      {/* Bar 2: Call Duration (Indigo) */}
                      {(activeMetricTab === 'all' || activeMetricTab === 'duration') && (
                        <div className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold opacity-0 group-hover/bar:opacity-100 transition">
                            {formatSecs(agent.avgCallDurationSecs)}
                          </span>
                          <div
                            style={{ height: `${durationHeight}%` }}
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-md shadow-indigo-500/20 transition-all duration-500 hover:brightness-110"
                          />
                          <span className="text-[9px] font-mono text-slate-400">Duration</span>
                        </div>
                      )}

                      {/* Bar 3: Resolution Rate (Emerald) */}
                      {(activeMetricTab === 'all' || activeMetricTab === 'resolution') && (
                        <div className="flex-1 flex flex-col items-center gap-1 group/bar h-full justify-end">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold opacity-0 group-hover/bar:opacity-100 transition">
                            {agent.resolutionRatePct}%
                          </span>
                          <div
                            style={{ height: `${resolutionHeight}%` }}
                            className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/20 transition-all duration-500 hover:brightness-110"
                          />
                          <span className="text-[9px] font-mono text-slate-400">Resolution</span>
                        </div>
                      )}
                    </div>

                    {/* Numerical Stats Footer */}
                    <div className="space-y-1.5 pt-1 text-xs border-t border-slate-800">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Handling Time:</span>
                        <strong className="font-mono text-amber-400">
                          {formatSecs(agent.avgHandlingSecs)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Resolution Rate:</span>
                        <strong className="font-mono text-emerald-400 font-bold">
                          {agent.resolutionRatePct}%
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Avg Duration:</span>
                        <span className="font-mono text-indigo-300">
                          {formatSecs(agent.avgCallDurationSecs)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
                        <span>Calls Handled: {agent.callsHandled}</span>
                        <span>Resolved: {agent.resolvedTickets}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= LINE CHART VIEW ================= */
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Comparative Performance Trend Curves</span>
                <span className="text-slate-400 font-mono text-[11px]">4 Extensions Active</span>
              </div>

              {/* Scalable SVG Line Visualizer */}
              <div className="relative w-full h-52 bg-slate-900/90 rounded-xl p-4 overflow-hidden border border-slate-800">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  <line x1="0" y1="165" x2="600" y2="165" stroke="rgba(255,255,255,0.06)" />

                  {/* Target Reference Line: 90% Resolution Target */}
                  <line x1="0" y1="45" x2="600" y2="45" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5" strokeDasharray="6 4" />

                  {/* Line 1: Ticket Resolution Rate (Emerald) */}
                  {(activeMetricTab === 'all' || activeMetricTab === 'resolution') && (
                    <>
                      <path
                        d="M 50 42 L 210 58 L 380 32 L 540 68"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Points */}
                      <circle cx="50" cy="42" r="5" fill="#10b981" stroke="#020617" strokeWidth="2" />
                      <circle cx="210" cy="58" r="5" fill="#10b981" stroke="#020617" strokeWidth="2" />
                      <circle cx="380" cy="32" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="540" cy="68" r="5" fill="#10b981" stroke="#020617" strokeWidth="2" />
                    </>
                  )}

                  {/* Line 2: Average Handling Time (Amber) */}
                  {(activeMetricTab === 'all' || activeMetricTab === 'handling') && (
                    <>
                      <path
                        d="M 50 92 L 210 115 L 380 65 L 540 148"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Points */}
                      <circle cx="50" cy="92" r="4.5" fill="#f59e0b" stroke="#020617" strokeWidth="2" />
                      <circle cx="210" cy="115" r="4.5" fill="#f59e0b" stroke="#020617" strokeWidth="2" />
                      <circle cx="380" cy="65" r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="540" cy="148" r="4.5" fill="#f59e0b" stroke="#020617" strokeWidth="2" />
                    </>
                  )}

                  {/* Line 3: Average Call Duration (Indigo) */}
                  {(activeMetricTab === 'all' || activeMetricTab === 'duration') && (
                    <>
                      <path
                        d="M 50 102 L 210 125 L 380 75 L 540 158"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="50" cy="102" r="4" fill="#6366f1" stroke="#020617" strokeWidth="1.5" />
                      <circle cx="210" cy="125" r="4" fill="#6366f1" stroke="#020617" strokeWidth="1.5" />
                      <circle cx="380" cy="75" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="540" cy="158" r="4" fill="#6366f1" stroke="#020617" strokeWidth="1.5" />
                    </>
                  )}
                </svg>

                {/* X Axis Extension Labels */}
                <div className="absolute bottom-1 inset-x-0 px-6 flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                  <span>Ext 101 (Tariq)</span>
                  <span>Ext 102 (Fatima)</span>
                  <span className="text-emerald-400">Ext 103 (Imran - Top)</span>
                  <span>Ext 104 (Sarah)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Highlights Row: Top Performer & Efficiency Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Fastest Resolution Time</div>
              <div className="font-bold text-white text-xs mt-0.5">Ext 103: Imran Ali (180s AHT)</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Highest Ticket Resolution</div>
              <div className="font-bold text-white text-xs mt-0.5">Ext 103: 94.8% (14 Tickets)</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Complex Issue Handler</div>
              <div className="font-bold text-white text-xs mt-0.5">Ext 104: Sarah Khan (Escalations)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Call Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Hourly PBX Trunk Call Distribution</h2>
              <p className="text-xs text-slate-400">Call traffic volume across business hours (Pakistan Standard Time)</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Peak: 10:00 - 11:00 AM
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-6 h-56 flex items-end justify-between gap-2 border-b border-slate-800 pb-3">
            {hourlyData.map((item) => {
              const heightPct = (item.calls / maxHourly) * 100;
              const isPeak = item.calls === maxHourly;

              return (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[11px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {item.calls}
                  </span>
                  <div className="w-full bg-slate-950 rounded-t-lg h-36 flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${
                        isPeak
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/30'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{item.hour}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Morning branch opening hours have 3x higher incident report rates.</span>
            <span className="font-semibold text-slate-300">Total Lines: 32 Channels</span>
          </div>
        </div>

        {/* Complaint Category Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Complaint Categories Breakdown</h2>
            <p className="text-xs text-slate-400">Distribution of bank branch technical faults reported</p>
          </div>

          <div className="space-y-4 pt-2">
            {categories.map((cat) => (
              <div key={cat.name} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{cat.name}</span>
                  <span className="font-mono text-slate-400 font-bold">{cat.pct}% ({cat.count})</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${cat.pct}%` }}
                    className={`h-full ${cat.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>Fastest contractor dispatch:</span>
            <strong className="text-emerald-400 font-mono">Lahore Power Fixers (22 mins)</strong>
          </div>
        </div>
      </div>

      {/* Extension Performance Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Officer & Extension Performance Scorecard</h2>
            <p className="text-xs text-slate-400">Handling statistics for employee extensions logged on PBX today</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Extension</th>
                <th className="p-3">Officer Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Calls Handled</th>
                <th className="p-3">Avg Handling Time</th>
                <th className="p-3">Avg Duration</th>
                <th className="p-3">Resolution Rate</th>
                <th className="p-3">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {agentPerformance.map((agent) => (
                <tr key={agent.ext} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-indigo-400">
                    Ext {agent.ext}
                  </td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full object-cover" />
                    <span>{agent.name}</span>
                  </td>
                  <td className="p-3 text-slate-400">{agent.role}</td>
                  <td className="p-3 font-mono font-bold text-white">{agent.callsHandled}</td>
                  <td className="p-3 font-mono text-amber-400 font-bold">
                    {formatSecs(agent.avgHandlingSecs)}
                  </td>
                  <td className="p-3 font-mono text-indigo-300">
                    {formatSecs(agent.avgCallDurationSecs)}
                  </td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">
                    {agent.resolutionRatePct}% ({agent.resolvedTickets} tickets)
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] capitalize">
                      {agent.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

