import React, { useState } from 'react';
import { 
  PhoneForwarded, 
  Settings2, 
  Clock, 
  Users2, 
  ShieldAlert, 
  CheckCircle2, 
  Voicemail, 
  HelpCircle, 
  Save, 
  Sparkles, 
  ArrowRight, 
  Server, 
  Terminal, 
  FileCode, 
  Radio, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CallForwardingRule, EmployeeExtension } from '../types';
import { getInitialsAvatar } from '../utils/imageUtils';

interface CallForwardingViewProps {
  rules: CallForwardingRule[];
  extensions: EmployeeExtension[];
  currentExtension: EmployeeExtension;
  isAdmin: boolean;
  onUpdateRule: (rule: CallForwardingRule) => Promise<void>;
  onTestForwardingScenario: (condition: string, ext: string) => void;
}

export const CallForwardingView: React.FC<CallForwardingViewProps> = ({
  rules,
  extensions,
  currentExtension,
  isAdmin,
  onUpdateRule,
  onTestForwardingScenario,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'dialplan'>('rules');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    rules.find((r) => r.extension === currentExtension.extension)?.id || rules[0]?.id || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Currently editing rule
  const currentRule = rules.find((r) => r.id === selectedRuleId) || rules[0];
  const [editForm, setEditForm] = useState<CallForwardingRule | null>(currentRule || null);

  // Sync edit form when selected rule changes
  React.useEffect(() => {
    if (currentRule) {
      setEditForm({ ...currentRule });
    }
  }, [selectedRuleId, currentRule]);

  if (!editForm) {
    return <div className="p-8 text-center text-slate-400">Loading call forwarding rules...</div>;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateRule(editForm);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Error saving forwarding rule:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const backupOfficer = extensions.find((e) => e.extension === editForm.backupExtension);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <PhoneForwarded className="w-4 h-4 shrink-0" />
            <span className="truncate">Telephony Routing Engine</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">PBX Smart Forwarding & Fallbacks</span>
          </div>
          <h1 
            className="font-bold text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
          >
            Smart Call Forwarding & Failover Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed [overflow-wrap:anywhere]">
            Configure multi-tier forwarding rules for officer extensions. If an officer is busy, unreachable, offline, or does not answer within the ring timeout, calls route automatically to backup staff or reception fallback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 sm:flex-initial text-center px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Forwarding Rules
          </button>
          <button
            onClick={() => setActiveTab('dialplan')}
            className={`flex-1 sm:flex-initial text-center px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'dialplan'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>SIP Trunk Dialplan</span>
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Extension Rules Selector List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Select Officer Extension ({rules.length})
            </div>

            <div className="space-y-2">
              {rules.map((rule) => {
                const isSelected = rule.id === editForm.id;
                const extOfficer = extensions.find((e) => e.extension === rule.extension);

                return (
                  <motion.div
                    key={rule.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={extOfficer?.avatar || getInitialsAvatar(rule.agentName, rule.extension)}
                          alt={rule.agentName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="font-bold text-xs text-white">{rule.agentName}</div>
                          <div className="text-[11px] font-mono text-indigo-400 font-semibold">
                            Primary Ext {rule.extension}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rule.isEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rule.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>Backup: Ext {rule.backupExtension}</span>
                      </span>
                      <span className="font-mono text-[10px]">{rule.ringTimeoutSeconds}s timeout</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Test Simulation Trigger Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Simulate Call Forwarding Test
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTestForwardingScenario('busy', editForm.extension)}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Busy Hop</span>
                </button>
                <button
                  onClick={() => onTestForwardingScenario('no-answer', editForm.extension)}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Test No-Answer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Rule Editor & Visual Forwarding Flow (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
              {/* Header and Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      Rule #{editForm.id}
                    </span>
                    <h2 className="text-base font-bold text-white">
                      Forwarding Policy for {editForm.agentName} (Ext {editForm.extension})
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls automated PBX transfer triggers and backup destination ordering.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isEnabled}
                      onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Forwarding Enabled</span>
                  </label>
                </div>
              </div>

              {/* Visual Hop Flowchart */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Configured Call Routing Hop Chain</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 text-xs font-medium">
                  {/* Step 1: Caller */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center flex-1">
                    <div className="text-[10px] text-slate-500 uppercase">Incoming Call</div>
                    <div className="font-bold text-white mt-0.5">Commercial Trunk</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 mx-auto sm:rotate-0 rotate-90 shrink-0" />

                  {/* Step 2: Primary */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-center flex-1">
                    <div className="text-[10px] text-indigo-400 uppercase">Primary Destination</div>
                    <div className="font-bold text-white mt-0.5">Ext {editForm.extension}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{editForm.ringTimeoutSeconds}s timeout</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 mx-auto sm:rotate-0 rotate-90 shrink-0" />

                  {/* Step 3: Backup */}
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 text-center flex-1">
                    <div className="text-[10px] text-amber-400 uppercase">Backup Officer</div>
                    <div className="font-bold text-white mt-0.5">Ext {editForm.backupExtension}</div>
                    <div className="text-[10px] text-slate-400 truncate">{backupOfficer?.name || 'Assigned Officer'}</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 mx-auto sm:rotate-0 rotate-90 shrink-0" />

                  {/* Step 4: Final Fallback */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-center flex-1">
                    <div className="text-[10px] text-rose-400 uppercase">Final Fallback</div>
                    <div className="font-bold text-white mt-0.5 capitalize">{editForm.finalFallbackDestination}</div>
                    <div className="text-[10px] text-slate-400">If backup unavailable</div>
                  </div>
                </div>
              </div>

              {/* Basic Target Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Backup Employee Extension:
                  </label>
                  <select
                    value={editForm.backupExtension}
                    onChange={(e) => {
                      const selectedExt = extensions.find((ext) => ext.extension === e.target.value);
                      setEditForm({
                        ...editForm,
                        backupExtension: e.target.value,
                        backupAgentName: selectedExt?.name || 'Officer',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {extensions
                      .filter((e) => e.extension !== editForm.extension)
                      .map((ext) => (
                        <option key={ext.id} value={ext.extension}>
                          Ext {ext.extension} — {ext.name} ({ext.department})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ring Timeout Before Forwarding (Seconds):
                  </label>
                  <select
                    value={editForm.ringTimeoutSeconds}
                    onChange={(e) =>
                      setEditForm({ ...editForm, ringTimeoutSeconds: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={10}>10 Seconds (Fast Failover)</option>
                    <option value={15}>15 Seconds (Recommended - 3 Rings)</option>
                    <option value={20}>20 Seconds (4 Rings)</option>
                    <option value={30}>30 Seconds (Extended Ringing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Backup External Phone Number (Optional Cell/Direct):
                  </label>
                  <input
                    type="text"
                    value={editForm.backupPhoneNumber || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, backupPhoneNumber: e.target.value })
                    }
                    placeholder="+92 300 8492011"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Final Fallback Destination:
                  </label>
                  <select
                    value={editForm.finalFallbackDestination}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        finalFallbackDestination: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="reception">Central Reception Operator (Ext 100)</option>
                    <option value="voicemail">PBX Automated Voicemail Box</option>
                    <option value="general-queue">General Call Center Dispatch Queue</option>
                    <option value="disconnect">Disconnect with Busy Tone</option>
                  </select>
                </div>
              </div>

              {/* Forwarding Conditions Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Forwarding Condition Triggers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={editForm.conditions.offline}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          conditions: { ...editForm.conditions, offline: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white">Employee is Offline / Away</span>
                      <p className="text-[11px] text-slate-400">Instantly forward if station is not logged in</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={editForm.conditions.busy}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          conditions: { ...editForm.conditions, busy: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white">Employee is Busy (On Call)</span>
                      <p className="text-[11px] text-slate-400">Forward immediately if officer is on active call</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={editForm.conditions.noAnswer}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          conditions: { ...editForm.conditions, noAnswer: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white">No Answer on Ring Timeout</span>
                      <p className="text-[11px] text-slate-400">Forward after {editForm.ringTimeoutSeconds}s without answer</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={editForm.conditions.rejected}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          conditions: { ...editForm.conditions, rejected: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white">Call Declined by Officer</span>
                      <p className="text-[11px] text-slate-400">Forward immediately if officer rejects ringing call</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={editForm.conditions.unreachable}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          conditions: { ...editForm.conditions, unreachable: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white">Station Unreachable / Packet Drop</span>
                      <p className="text-[11px] text-slate-400">Trigger fallback if WebRTC socket drops</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={editForm.conditions.afterHours}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          conditions: { ...editForm.conditions, afterHours: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div>
                      <span className="font-semibold text-white">Outside Business Hours</span>
                      <p className="text-[11px] text-slate-400">Forward if call arrives after {editForm.businessHours.endHour}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Save Button & Feedback */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {savedSuccess && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-4 h-4" />
                      Forwarding policy synchronized with live Firestore!
                    </span>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Rule...' : 'Save Forwarding Settings'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SIP Trunk & PBX Dialplan Integration Guide (Architectural Requirement) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Server className="w-4 h-4" />
              <span>Telephony Architecture & Dialplan Specifications</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Carrier SIP Trunk & PBX Dialplan Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              FAST Connect application code executes application-level WebRTC call forwarding across all registered browser stations and softphones. For upstream PSTN/E1 carrier forwarding, apply the Asterisk / FreePBX dialplan scripts below to your telephony server.
            </p>
          </div>

          <div className="space-y-4">
            {/* Asterisk extensions.conf */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>/etc/asterisk/extensions.conf — Smart Forwarding Context</span>
                </span>
                <span className="text-slate-500">Asterisk 18+ / 20+ LTS</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{`[fastconnect-inbound]
; Inbound trunk routing with smart condition failover
exten => ${editForm.extension},1,NoOp(FAST Connect Inbound to Ext ${editForm.extension})
 same => n,Set(ORIGINAL_EXTEN=\${EXTEN})
 same => n,Set(RING_TIMEOUT=${editForm.ringTimeoutSeconds})
 same => n,Set(BACKUP_EXT=${editForm.backupExtension})
 
 ; Check Business Hours (09:00-18:00, Mon-Fri)
 same => n,GotoIfTime(09:00-18:00,mon-fri,*,*?office_open:after_hours)

 same => n(office_open),Dial(PJSIP/\${EXTEN}, \${RING_TIMEOUT}, m(fastconnect-ring))
 same => n,NoOp(Dial Status: \${DIALSTATUS})
 
 ; Handle Conditions: BUSY, NOANSWER, CHANUNAVAIL (offline)
 same => n,GotoIf($["\${DIALSTATUS}" = "BUSY"]?forward_backup)
 same => n,GotoIf($["\${DIALSTATUS}" = "NOANSWER"]?forward_backup)
 same => n,GotoIf($["\${DIALSTATUS}" = "CHANUNAVAIL"]?forward_backup)
 same => n,Hangup()

 same => n(forward_backup),NoOp(Forwarding to Backup Ext \${BACKUP_EXT})
 same => n,Set(CALLERID(name)=FWD:\${CALLERID(name)})
 same => n,Dial(PJSIP/\${BACKUP_EXT}, 20, m)
 same => n,GotoIf($["\${DIALSTATUS}" != "ANSWER"]?fallback_${editForm.finalFallbackDestination})
 same => n,Hangup()

 same => n(after_hours),NoOp(Outside business hours - routing to voicemail)
 same => n,VoiceMail(\${EXTEN}@fastconnect_vm, u)
 same => n,Hangup()

 same => n(fallback_reception),Dial(PJSIP/100, 25, m)
 same => n,Hangup()

 same => n(fallback_voicemail),VoiceMail(\${EXTEN}@fastconnect_vm, b)
 same => n,Hangup()`}
              </pre>
            </div>

            {/* Technical Infrastructure Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>WebRTC Application Layer</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Real-time softphone forwarding across all employee browser extensions. Handled immediately with zero extra carrier cost.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>SIP 302 Redirect Support</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Sends SIP 302 Moved Temporarily header back to the carrier proxy when officer is offline or out-of-hours.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Carrier Failover E1/PRI</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  PTCL / Jazz / Telenor E1 DID trunk mapping. Forwarding to backup external mobile numbers configured via SIP REFER.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
