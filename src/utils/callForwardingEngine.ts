import { 
  EmployeeExtension, 
  CallForwardingRule, 
  CallForwardingHop, 
  ForwardingCondition 
} from '../types';
import { getInitialsAvatar } from './imageUtils';

export interface ForwardingDecision {
  shouldForward: boolean;
  nextExtension?: EmployeeExtension;
  backupPhoneNumber?: string;
  fallbackType?: 'reception' | 'voicemail' | 'general-queue' | 'disconnect';
  hops: CallForwardingHop[];
  reason?: ForwardingCondition;
  reasonExplanation: string;
}

/**
 * Checks whether current local time is within configured business hours for a rule
 */
export function isOutsideBusinessHours(rule: CallForwardingRule, date = new Date()): boolean {
  if (!rule.businessHours || !rule.businessHours.enabled) {
    return false;
  }

  const { startHour, endHour, workDays } = rule.businessHours;

  // Day of week: 0 is Sunday, 1 is Monday ... 6 is Saturday
  const currentDay = date.getDay();
  if (workDays && workDays.length > 0 && !workDays.includes(currentDay)) {
    return true; // Weekend / non-work day
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  
  const [startH, startM] = (startHour || '09:00').split(':').map(Number);
  const [endH, endM] = (endHour || '18:00').split(':').map(Number);

  const startTotalMinutes = startH * 60 + (startM || 0);
  const endTotalMinutes = endH * 60 + (endM || 0);

  return currentMinutes < startTotalMinutes || currentMinutes >= endTotalMinutes;
}

/**
 * Evaluates smart call forwarding rules for an incoming call directed at a target extension.
 */
export function evaluateCallForwarding({
  targetExtension,
  extensions,
  rules,
  isTargetBusy = false,
  isTargetUnreachable = false,
  isNoAnswer = false,
  isCallRejected = false,
  currentDate = new Date(),
}: {
  targetExtension: EmployeeExtension;
  extensions: EmployeeExtension[];
  rules: CallForwardingRule[];
  isTargetBusy?: boolean;
  isTargetUnreachable?: boolean;
  isNoAnswer?: boolean;
  isCallRejected?: boolean;
  currentDate?: Date;
}): ForwardingDecision {
  const rule = rules.find((r) => r.extension === targetExtension.extension && r.isEnabled);

  // If no rule exists or forwarding is disabled, connect directly without forwarding
  if (!rule) {
    return {
      shouldForward: false,
      hops: [],
      reasonExplanation: `No forwarding rule active for Extension ${targetExtension.extension}. Direct ring.`,
    };
  }

  let triggerCondition: ForwardingCondition | null = null;
  let triggerExplanation = '';

  // 1. Outside Business Hours Check
  if (rule.conditions.afterHours && isOutsideBusinessHours(rule, currentDate)) {
    triggerCondition = 'after-hours';
    triggerExplanation = `Outside business hours (${rule.businessHours.startHour} - ${rule.businessHours.endHour}).`;
  }
  // 2. Offline Employee Check
  else if (rule.conditions.offline && (targetExtension.status === 'offline' || targetExtension.status === 'away')) {
    triggerCondition = 'offline';
    triggerExplanation = `Officer ${targetExtension.name} is currently ${targetExtension.status}.`;
  }
  // 3. Unreachable / Network Timeout Check
  else if (rule.conditions.unreachable && isTargetUnreachable) {
    triggerCondition = 'unreachable';
    triggerExplanation = `Station ${targetExtension.extension} unreachable (WebRTC signaling timeout).`;
  }
  // 4. Busy Check (Already on active call)
  else if (rule.conditions.busy && (isTargetBusy || targetExtension.status === 'on-call')) {
    triggerCondition = 'busy';
    triggerExplanation = `Officer ${targetExtension.name} is busy on another telephone call.`;
  }
  // 5. Call Rejected by Employee
  else if (rule.conditions.rejected && isCallRejected) {
    triggerCondition = 'rejected';
    triggerExplanation = `Call declined by extension ${targetExtension.extension}.`;
  }
  // 6. Ring Timeout / No Answer
  else if (rule.conditions.noAnswer && isNoAnswer) {
    triggerCondition = 'no-answer';
    triggerExplanation = `No answer after ${rule.ringTimeoutSeconds}s ring timeout.`;
  }

  // If no forwarding condition was met, proceed directly to target
  if (!triggerCondition) {
    return {
      shouldForward: false,
      hops: [],
      reasonExplanation: `Direct call to Extension ${targetExtension.extension}.`,
    };
  }

  // Find the primary backup extension
  const backupExt = extensions.find((e) => e.extension === rule.backupExtension);
  const nowIso = new Date().toISOString();

  // Check if backup is also unavailable
  const isBackupAvailable = backupExt && backupExt.status === 'available';

  if (isBackupAvailable && backupExt) {
    const hop: CallForwardingHop = {
      hopNumber: 1,
      fromExtension: targetExtension.extension,
      fromAgentName: targetExtension.name,
      toExtension: backupExt.extension,
      toAgentName: backupExt.name,
      toPhoneNumber: rule.backupPhoneNumber,
      condition: triggerCondition,
      timestamp: nowIso,
      result: 'forwarded-next',
    };

    return {
      shouldForward: true,
      nextExtension: backupExt,
      backupPhoneNumber: rule.backupPhoneNumber,
      hops: [hop],
      reason: triggerCondition,
      reasonExplanation: `${triggerExplanation} Forwarded to backup officer ${backupExt.name} (Ext ${backupExt.extension}).`,
    };
  }

  // Backup is unavailable or not found -> Evaluate Final Fallback Destination
  const hop1: CallForwardingHop = {
    hopNumber: 1,
    fromExtension: targetExtension.extension,
    fromAgentName: targetExtension.name,
    toExtension: rule.backupExtension,
    toAgentName: rule.backupAgentName || 'Backup Officer',
    toPhoneNumber: rule.backupPhoneNumber,
    condition: triggerCondition,
    timestamp: nowIso,
    result: 'no-answer',
  };

  const fallbackDestination = rule.finalFallbackDestination || 'reception';
  const hop2: CallForwardingHop = {
    hopNumber: 2,
    fromExtension: rule.backupExtension,
    fromAgentName: rule.backupAgentName || 'Backup Extension',
    toExtension: fallbackDestination === 'reception' ? '100' : 'Voicemail',
    toAgentName: fallbackDestination === 'reception' ? 'Central Reception / Helpdesk' : 'Automated Voicemail Box',
    condition: 'backup-unavailable',
    timestamp: nowIso,
    result: fallbackDestination === 'voicemail' ? 'fallback-voicemail' : 'fallback-reception',
  };

  // Reception extension if available
  const receptionExt = extensions.find((e) => e.extension === '100') || {
    id: 'emp-100',
    extension: '100',
    name: 'Central Reception',
    role: 'Switchboard Operator',
    department: 'Customer Service',
    avatar: getInitialsAvatar('Central Reception', '100'),
    email: 'reception@fastconnect.internal',
    phone: '+92 42 111 327 100',
    status: 'available',
    activeCallsToday: 0,
    avgHandlingSeconds: 120,
  };

  return {
    shouldForward: true,
    nextExtension: fallbackDestination === 'reception' ? receptionExt : undefined,
    fallbackType: fallbackDestination,
    backupPhoneNumber: rule.backupPhoneNumber,
    hops: [hop1, hop2],
    reason: triggerCondition,
    reasonExplanation: `${triggerExplanation} Backup Ext ${rule.backupExtension} is unavailable. Routed to ${fallbackDestination.toUpperCase()}.`,
  };
}
