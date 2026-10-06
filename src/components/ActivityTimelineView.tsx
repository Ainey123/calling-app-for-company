import React, { useState } from 'react';
import { 
  Activity, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneForwarded, 
  PhoneMissed, 
  ClipboardList, 
  CheckCircle2, 
  RotateCcw, 
  Key, 
  Clock, 
  Filter, 
  Sparkles, 
  User, 
  ShieldCheck, 
  ArrowRight,
  Cpu,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ActivityTimelineItem, EmployeeExtension } from '../types';

interface ActivityTimelineViewProps {
  timelineItems: ActivityTimelineItem[];
  extensions: EmployeeExtension[];
  currentExtension: EmployeeExtension;
}

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({
  timelineItems,
  extensions,
  currentExtension,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [systemOnly, setSystemOnly] = useState<'all' | 'system' | 'employee'>('all');

  const filteredItems = timelineItems.filter((item) => {
    if (filterEmployee !== 'all' && item.employeeId !== filterEmployee) return false;

    if (systemOnly === 'system' && !item.isSystemGenerated) return false;
    if (systemOnly === 'employee' && item.isSystemGenerated) return false;

    if (filterType === 'telephony') {
      return item.eventType.startsWith('call-');
    }
    if (filterType === 'work') {
      return item.eventType.startsWith('work-') || item.eventType.startsWith('report-');
    }
    if (filterType === 'forwarded') {
      return item.eventType === 'call-forwarded';
    }
    if (filterType === 'auth') {
      return item.eventType.startsWith('auth-');
    }

    return true;
  });

  // Event icon and color mapper
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'call-inbound':
        return <PhoneIncoming className="w-4 h-4 text-emerald-400" />;
      case 'call-outbound':
        return <PhoneOutgoing className="w-4 h-4 text-blue-400" />;
      case 'call-forwarded':
        return <PhoneForwarded className="w-4 h-4 text-amber-400" />;
      case 'call-missed':
        return <PhoneMissed className="w-4 h-4 text-rose-400" />;
      case 'work-entry-created':
      case 'work-entry-updated':
        return <ClipboardList className="w-4 h-4 text-purple-400" />;
      case 'report-submitted':
        return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
      case 'report-reviewed':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'report-revision-requested':
        return <RotateCcw className="w-4 h-4 text-rose-400" />;
      case 'auth-login':
      case 'auth-logout':
      default:
        return <Key className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 shrink-0" />
            <span className="truncate">Audit & Operational Logging</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Chronological Telephony & Work Stream</span>
          </div>
          <h1 
            className="font-bold text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
          >
            Employee Activity & Telephony Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed [overflow-wrap:anywhere]">
            Consolidated timeline combining automated PBX trunk call logs, smart forwarding events, employee daily work entries, and supervisor approvals. System-generated telephony records are clearly distinguished from manual employee logs.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-semibold">
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>System Generated</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-semibold">
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Employee Logged</span>
          </span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Category:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Operations</option>
              <option value="telephony">All Calls (In/Out/Missed)</option>
              <option value="forwarded">Smart Forwarded Calls Only</option>
              <option value="work">Work Reports & Entries</option>
              <option value="auth">Auth & Station Logins</option>
            </select>
          </div>

          {/* Employee Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Officer:</span>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white cursor-pointer focus:outline-none"
            >
              <option value="all">All Employees</option>
              {extensions.map((ext) => (
                <option key={ext.id} value={ext.id}>
                  Ext {ext.extension} - {ext.name}
                </option>
              ))}
            </select>
          </div>

          {/* System vs Employee Segmented Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setSystemOnly('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                systemOnly === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Sources
            </button>
            <button
              onClick={() => setSystemOnly('system')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                systemOnly === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              System Only
            </button>
            <button
              onClick={() => setSystemOnly('employee')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                systemOnly === 'employee' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Employee Only
            </button>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          {filteredItems.length} Events in Timeline
        </div>
      </div>

      {/* Chronological Timeline Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-6 w-full min-w-0">
        <div className="relative border-l-2 border-slate-800 pl-4 sm:pl-6 ml-2 sm:ml-3 space-y-6">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No activity timeline records match the selected filter criteria.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="relative space-y-1.5 min-w-0"
              >
                {/* Node Dot */}
                <div className={`absolute -left-[25px] sm:-left-[33px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-slate-900 flex items-center justify-center ${
                  item.isSystemGenerated ? 'bg-indigo-500' : 'bg-purple-500'
                }`}></div>

                {/* Event Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-slate-950 border border-slate-800">
                      {getEventIcon(item.eventType)}
                    </span>
                    <span className="font-bold text-sm text-white">{item.title}</span>

                    {/* System Generated vs Employee Tag */}
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                      item.isSystemGenerated
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}>
                      {item.isSystemGenerated ? 'SYSTEM PBX' : 'EMPLOYEE ENTRY'}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.timeDisplay}</span>
                  </span>
                </div>

                {/* Officer Information & Description */}
                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                  <p className="leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{item.employeeName}</span>
                      <span>•</span>
                      <span className="font-mono text-indigo-400">Ext {item.employeeExtension}</span>
                    </div>

                    {item.metadata?.forwardedTo && (
                      <span className="font-mono text-amber-300 flex items-center gap-1">
                        <PhoneForwarded className="w-3 h-3" />
                        <span>Forwarded: Ext {item.metadata.forwardedFrom} → Ext {item.metadata.forwardedTo}</span>
                      </span>
                    )}

                    {item.metadata?.callDurationSeconds !== undefined && item.metadata.callDurationSeconds > 0 && (
                      <span className="font-mono text-emerald-400">
                        Duration: {Math.floor(item.metadata.callDurationSeconds / 60)}m {item.metadata.callDurationSeconds % 60}s
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
