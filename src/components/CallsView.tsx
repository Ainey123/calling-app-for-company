import React, { useState } from 'react';
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Play, 
  Pause, 
  Sparkles, 
  Search, 
  TicketCheck, 
  FileText, 
  Clock, 
  Building2, 
  PhoneCall, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Download,
  CheckCircle2,
  ChevronRight,
  User,
  ArrowRight,
  Filter,
  CalendarClock,
  Calendar,
  Bell,
  Trash2,
  Plus,
  PhoneForwarded,
  Server,
  X,
  Smartphone
} from 'lucide-react';
import { CallRecord, EmployeeExtension, ComplaintTicket, ScheduledCall, CallOutcome } from '../types';
import { soundEngine, SpeechPlayer } from '../utils/audio';
import { ScheduleCallModal } from './ScheduleCallModal';
import { motion, AnimatePresence } from 'framer-motion';

interface CallsViewProps {
  calls: CallRecord[];
  tickets: ComplaintTicket[];
  currentExtension: EmployeeExtension;
  extensions: EmployeeExtension[];
  scheduledCalls: ScheduledCall[];
  onScheduleCall: (callData: Omit<ScheduledCall, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteScheduledCall: (id: string) => void;
  onCompleteScheduledCall: (id: string) => void;
  onSelectTicket: (ticketId: string) => void;
  onCreateTicketFromCallRecord: (call: CallRecord) => void;
  onCallNumber: (number: string, name: string, org?: string, branch?: string) => void;
  onSummarizeWithAI: (callId: string) => Promise<void>;
  summarizingCallId: string | null;
  onUpdateCallOutcome?: (callId: string, outcome: CallOutcome) => void;
  didNumber?: string;
  onOpenSimCallingTab?: () => void;
}

export const CallsView: React.FC<CallsViewProps> = ({
  calls,
  tickets,
  currentExtension,
  extensions,
  scheduledCalls,
  onScheduleCall,
  onDeleteScheduledCall,
  onCompleteScheduledCall,
  onSelectTicket,
  onCreateTicketFromCallRecord,
  onCallNumber,
  onSummarizeWithAI,
  summarizingCallId,
  onUpdateCallOutcome,
  didNumber,
  onOpenSimCallingTab,
}) => {
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound' | 'missed' | 'sim'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [selectedCallDetails, setSelectedCallDetails] = useState<CallRecord | null>(calls[0] || null);
  const [mobilePane, setMobilePane] = useState<'list' | 'inspector'>('list');
  
  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTargetCall, setScheduleTargetCall] = useState<CallRecord | null>(null);

  const pendingScheduledCalls = scheduledCalls.filter(s => s.status === 'pending');

  const filteredCalls = calls.filter((c) => {
    const matchesDir = filterDirection === 'all' 
      ? true 
      : filterDirection === 'sim' 
        ? c.channel === 'sim' 
        : c.direction === filterDirection;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesDir;

    const matchesSearch =
      c.callerName.toLowerCase().includes(query) ||
      c.callerNumber.toLowerCase().includes(query) ||
      (c.organization && c.organization.toLowerCase().includes(query)) ||
      (c.branch && c.branch.toLowerCase().includes(query)) ||
      (c.notes && c.notes.toLowerCase().includes(query));
    return matchesDir && matchesSearch;
  });

  const handleOpenScheduleModal = (call?: CallRecord) => {
    setScheduleTargetCall(call || null);
    setIsScheduleModalOpen(true);
  };

  const handlePlayRecording = (call: CallRecord) => {
    if (playingCallId === call.id) {
      SpeechPlayer.stop();
      setPlayingCallId(null);
    } else {
      SpeechPlayer.stop();
      setPlayingCallId(call.id);
      soundEngine.playConnectedChime();

      // Clean corporate audio playback simulation: auto-completes after call duration (or 6 seconds)
      const playDurationMs = Math.min(Math.max((call.durationSeconds || 10) * 200, 4000), 12000);
      setTimeout(() => {
        setPlayingCallId((current) => (current === call.id ? null : current));
      }, playDurationMs);
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 
              className="font-extrabold text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
              style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
            >
              Call History & Recordings
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono shrink-0">
              {calls.length} Total Logs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl [overflow-wrap:anywhere] leading-relaxed">
            Complete business trunk call logs, high-fidelity audio recordings, speech transcripts, and CRM ticket linkages.
          </p>
        </div>

        {/* Search Bar & Quick Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72 md:w-80">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer name or caller number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
              {(['all', 'inbound', 'outbound', 'missed', 'sim'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFilterDirection(dir)}
                  className={`px-3 py-1.5 rounded-lg transition capitalize text-xs font-semibold cursor-pointer ${
                    filterDirection === dir 
                      ? dir === 'sim'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dir === 'sim' ? 'SIM' : dir}
                </button>
              ))}
            </div>

            {onOpenSimCallingTab && (
              <button
                type="button"
                onClick={onOpenSimCallingTab}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                title="Launch Cellular SIM Calling Station"
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">SIM Call</span>
              </button>
            )}

            <button
              onClick={() => handleOpenScheduleModal()}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
              title="Schedule a future follow-up call"
            >
              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Search / Filter Status Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
          <span>
            Filtering call records for: <strong className="text-white font-mono">"{searchQuery}"</strong> ({filteredCalls.length} {filteredCalls.length === 1 ? 'call' : 'calls'} found)
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-indigo-400 hover:text-white underline cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* PBX Architecture Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Server className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-white">Telephony Station Architecture:</span>{' '}
            <span>Configured for self-hosted PBX (Asterisk / WebRTC Gateway) on DID <strong>{didNumber || '+92 (42) 111-327-800'}</strong>.</span>
            <span className="text-slate-400 ml-1.5 hidden md:inline">
              No carrier PSTN gateway simulated — all call logs represent authentic softphone and intercom conversations.
            </span>
          </div>
        </div>
        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 self-start sm:self-auto">
          Self-Hosted PBX WebRTC Ready
        </span>
      </div>

      {/* Upcoming Scheduled Follow-Up Calls Banner */}
      {pendingScheduledCalls.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-sm">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Scheduled Follow-Up Reminders
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                    {pendingScheduledCalls.length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Future follow-up appointments set by agents for bank branches and contractors
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenScheduleModal()}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Follow-up</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingScheduledCalls.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3, scale: 1.01, boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.18)' }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-indigo-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-white truncate">{item.callerName}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.organization || 'Client'} {item.branch ? `• ${item.branch}` : ''}
                      </div>
                    </div>

                    <div className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span>{item.scheduledDate} {item.scheduledTime}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 mt-2 font-mono flex items-center justify-between">
                    <span>{item.callerNumber}</span>
                    <span className="text-slate-400 font-sans text-[10px]">Ext {item.assignedExtension} ({item.agentName.split(' ')[0]})</span>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 italic bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCallNumber(item.callerNumber, item.callerName, item.organization, item.branch)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call Now</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onCompleteScheduledCall(item.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer"
                    title="Mark Completed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDeleteScheduledCall(item.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition cursor-pointer"
                    title="Cancel Reminder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile View Toggle between Call List and Inspector */}
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
            Call Records ({filteredCalls.length})
          </button>
          <button
            onClick={() => setMobilePane('inspector')}
            className={`w-full sm:flex-1 py-2 px-3 text-center rounded-lg transition break-words ${
              mobilePane === 'inspector'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {selectedCallDetails ? `Inspector (${selectedCallDetails.callerName.split(' ')[0]})` : 'Call Inspector'}
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Call Logs Table & Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Call List (7 cols) */}
        <div className={`lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
          mobilePane === 'inspector' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>CALL RECORDS ({filteredCalls.length})</span>
            <span>DURATION & RECORDING</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[640px] overflow-y-auto">
            {filteredCalls.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <PhoneIncoming className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">
                  {searchQuery ? 'No Matching Calls Found' : 'Live Call Queue Ready'}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery
                    ? `No calls matched your search "${searchQuery}". Check customer name, organization, or telephone digits.`
                    : 'No call sessions logged yet. Dial out with the softphone or click "Test Inbound Call" above to record a live business telephony session into Firestore.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            ) : (
              filteredCalls.map((call) => {
              const isSelected = selectedCallDetails?.id === call.id;
              const isPlaying = playingCallId === call.id;

              return (
                <motion.div
                  key={call.id}
                  onClick={() => {
                    setSelectedCallDetails(call);
                    setMobilePane('inspector');
                  }}
                  whileHover={{ y: -2, scale: 1.004, boxShadow: '0 6px 20px -2px rgba(0, 0, 0, 0.35)' }}
                  whileTap={{ scale: 0.992 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-l-4 border-indigo-500 shadow-md'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Call Direction Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        call.channel === 'sim'
                          ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/25 text-emerald-400 border border-emerald-500/40 shadow-sm'
                          : call.direction === 'inbound'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : call.direction === 'outbound'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {call.channel === 'sim' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : call.direction === 'inbound' ? (
                        <PhoneIncoming className="w-4 h-4" />
                      ) : call.direction === 'outbound' ? (
                        <PhoneOutgoing className="w-4 h-4" />
                      ) : (
                        <PhoneMissed className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {call.callerName}
                        </span>
                        {call.channel === 'sim' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                            <Smartphone className="w-2.5 h-2.5" />
                            <span>{call.simSlot || 'SIM 1'}</span>
                          </span>
                        )}
                        {call.linkedTicketId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTicket(call.linkedTicketId!);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30 hover:bg-indigo-500/30 transition"
                          >
                            {call.linkedTicketId}
                          </span>
                        )}
                        {call.callOutcome && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-medium text-[10px] border border-emerald-500/30">
                            {call.callOutcome}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {call.organization} {call.branch ? `• ${call.branch}` : ''}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="font-mono text-slate-300">{call.callerNumber}</span>
                        <span>•</span>
                        <span>Ext {call.extension} ({call.agentName.split(' ')[0]})</span>
                        <span>•</span>
                        <span>{formatTime(call.timestamp)}</span>
                      </div>

                      {call.isForwarded && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md w-fit">
                          <PhoneForwarded className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Forwarded: Ext {call.originalExtension || '101'} → Ext {call.extension} ({call.forwardingReason || 'busy'})</span>
                        </div>
                      )}

                      {call.notes && (
                        <p className="text-xs text-slate-400/90 line-clamp-1 mt-1.5 italic">
                          "{call.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right side: Duration, Play Recording, Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-slate-300">
                        {call.direction === 'missed' ? (
                          <span className="text-rose-400 font-semibold">Missed</span>
                        ) : (
                          formatSeconds(call.durationSeconds)
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {call.direction}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {call.hasRecording && (
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayRecording(call);
                          }}
                          className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition cursor-pointer ${
                            isPlaying
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                          title={isPlaying ? 'Pause Audio Playback' : 'Play Voice Recording'}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                          <span className="text-[10px] hidden sm:inline">
                            {isPlaying ? 'Playing' : call.recordingDuration || 'Play'}
                          </span>
                        </motion.button>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallNumber(call.callerNumber, call.callerName, call.organization, call.branch);
                        }}
                        className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition text-xs cursor-pointer"
                        title="Redial Contact"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenScheduleModal(call);
                        }}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs cursor-pointer"
                        title="Schedule Follow-up Call"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            }))}
          </div>
        </div>

        {/* Right Column: Selected Call Detail Inspector & AI Summary (5 cols) */}
        <div className={`lg:col-span-5 space-y-4 ${mobilePane === 'list' ? 'hidden lg:block' : 'block'}`}>
          {selectedCallDetails ? (
            <motion.div
              key={selectedCallDetails.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5"
            >
              {/* Mobile Back to List Button */}
              <button
                onClick={() => setMobilePane('list')}
                className="lg:hidden flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-1 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span>← Back to Call Records</span>
              </button>

              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Call Session Inspector
                    </span>
                    <span className="font-mono text-xs text-indigo-400">#{selectedCallDetails.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedCallDetails.callerName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedCallDetails.organization} — {selectedCallDetails.branch}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenScheduleModal(selectedCallDetails)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Schedule a future follow-up call"
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Schedule</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onCallNumber(
                      selectedCallDetails.callerNumber,
                      selectedCallDetails.callerName,
                      selectedCallDetails.organization,
                      selectedCallDetails.branch
                    )}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Redial</span>
                  </motion.button>
                </div>
              </div>

              {/* Smart Call Forwarding Audit Card (Module 2 Requirement) */}
              {(selectedCallDetails.isForwarded || (selectedCallDetails.forwardingHops && selectedCallDetails.forwardingHops.length > 0)) && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <PhoneForwarded className="w-4 h-4 text-amber-400" />
                      <span>Smart Call Forwarding Routing Audit</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      Reason: {selectedCallDetails.forwardingReason || 'busy'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">ORIGINAL DESTINATION:</span>
                      <span className="font-mono text-white font-bold">
                        Ext {selectedCallDetails.originalExtension || '101'}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {selectedCallDetails.originalAgentName || 'Primary Officer'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">FORWARDED TO:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        Ext {selectedCallDetails.extension}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {selectedCallDetails.agentName}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">FINAL CALL STATUS:</span>
                      <span className="font-bold text-emerald-400 capitalize">
                        {selectedCallDetails.status} ({formatSeconds(selectedCallDetails.durationSeconds)})
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {formatTime(selectedCallDetails.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Telephony Metadata */}
                  {selectedCallDetails.telephonyMetadata && (
                    <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Server className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Trunk: {selectedCallDetails.telephonyMetadata.trunkName}</span>
                      </span>
                      <span>Carrier: {selectedCallDetails.telephonyMetadata.carrier}</span>
                      <span className="text-emerald-400">{selectedCallDetails.telephonyMetadata.sipResponseCode}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Call Outcome Selector & Business Tracking */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Business Call Outcome & Result:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Management tracking</span>
                </div>
                <select
                  value={selectedCallDetails.callOutcome || 'Call Completed'}
                  onChange={(e) => {
                    const newOutcome = e.target.value as CallOutcome;
                    if (onUpdateCallOutcome) {
                      onUpdateCallOutcome(selectedCallDetails.id, newOutcome);
                    }
                    setSelectedCallDetails({ ...selectedCallDetails, callOutcome: newOutcome });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Quotation Requested">Quotation Requested</option>
                  <option value="Price & Terms Confirmed">Price & Terms Confirmed</option>
                  <option value="Site Inspection Scheduled">Site Inspection Scheduled</option>
                  <option value="Pending Spec Clarification">Pending Spec Clarification</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Call Completed">Call Completed</option>
                  <option value="Voicemail Left">Voicemail Left</option>
                  <option value="Declined / Busy">Declined / Busy</option>
                </select>
              </div>

              {/* Audio Recording Playback Deck */}
              {selectedCallDetails.hasRecording ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-900/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Audio Recording & Player</span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      {selectedCallDetails.recordingDuration || '03:18'}
                    </span>
                  </div>

                  {/* Waveform graphic */}
                  <div className="h-10 bg-slate-950 rounded-lg p-2 flex items-center justify-between gap-1 border border-slate-800/80">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const h = [20, 45, 75, 30, 90, 60, 40, 85, 95, 35, 60, 70, 40, 80, 50, 95, 65, 30, 80, 50, 70, 90, 45, 60, 85, 40, 30, 65, 80, 50, 40, 25][i % 32];
                      const isPlayed = (i / 32) < 0.45;
                      return (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className={`w-1 rounded-full transition-colors ${
                            playingCallId === selectedCallDetails.id
                              ? 'bg-emerald-400 animate-pulse'
                              : isPlayed
                              ? 'bg-indigo-500'
                              : 'bg-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handlePlayRecording(selectedCallDetails)}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                    >
                      {playingCallId === selectedCallDetails.id ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause Recording</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Play Recorded Audio</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-slate-400 italic">
                      Recorded with legal consent notice
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  No audio recording available for this call record.
                </div>
              )}

              {/* AI Conversation Assistant & Summarizer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      AI Conversation Intelligence
                    </span>
                  </div>

                  <button
                    onClick={() => onSummarizeWithAI(selectedCallDetails.id)}
                    disabled={summarizingCallId === selectedCallDetails.id}
                    className="px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>{summarizingCallId === selectedCallDetails.id ? 'Analyzing...' : 'Generate AI Summary'}</span>
                  </button>
                </div>

                {selectedCallDetails.aiSummary ? (
                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">EXECUTIVE SUMMARY:</div>
                      <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        {selectedCallDetails.aiSummary.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">CUSTOMER SENTIMENT:</span>
                        <span className={`font-bold mt-0.5 inline-block ${
                          selectedCallDetails.aiSummary.sentiment === 'Urgent' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {selectedCallDetails.aiSummary.sentiment}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">RECOMMENDED TRADE:</span>
                        <span className="font-bold text-indigo-300 mt-0.5 inline-block truncate">
                          {selectedCallDetails.aiSummary.recommendedVendorType || 'Electrician'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">SUGGESTED IMMEDIATE ACTIONS:</div>
                      <ul className="space-y-1">
                        {selectedCallDetails.aiSummary.actionItems.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Click "Generate AI Summary" to have Gemini extract key complaint issues, caller sentiment, and contractor dispatch recommendations.
                  </p>
                )}
              </div>

              {/* Call Transcript Section */}
              {selectedCallDetails.transcript && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Live Speech Transcript</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 max-h-52 overflow-y-auto space-y-2 font-sans leading-relaxed">
                    {selectedCallDetails.transcript.split('\n').map((line, idx) => {
                      const isCaller = line.startsWith('Caller:');
                      const isAgent = line.startsWith('Agent:');
                      const isVendor = line.startsWith('Vendor:');

                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isCaller
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : isAgent
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isCaller ? 'Caller' : isAgent ? 'Agent' : isVendor ? 'Vendor' : 'Note'}
                          </span>
                          <span className="text-slate-200">
                            {line.replace(/^(Caller|Agent|Vendor):\s*/, '')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ticket Linking Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                {selectedCallDetails.linkedTicketId ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTicket(selectedCallDetails.linkedTicketId!)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <TicketCheck className="w-4 h-4" />
                    <span>Open Linked Ticket ({selectedCallDetails.linkedTicketId})</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCreateTicketFromCallRecord(selectedCallDetails)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <TicketCheck className="w-4 h-4" />
                    <span>Create New Complaint Ticket from this Call</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Select a call record to inspect details, audio recordings, and AI intelligence.
            </div>
          )}
        </div>
      </div>

      {/* Schedule Call & Future Follow-Up Modal */}
      <ScheduleCallModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleCall={onScheduleCall}
        currentExtension={currentExtension}
        extensions={extensions}
        initialCall={scheduleTargetCall}
      />
    </div>
  );
};
