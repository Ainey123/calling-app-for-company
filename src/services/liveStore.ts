import { 
  CallRecord, 
  ComplaintTicket, 
  Vendor, 
  MissedCallAlert, 
  ScheduledCall, 
  CallForwardingRule, 
  DailyReport, 
  ActivityTimelineItem, 
  VendorQuotation, 
  EmailWorkRecord, 
  EmployeeExtension,
  SimProfile
} from '../types';
import { 
  INITIAL_EXTENSIONS, 
  INITIAL_CALL_RECORDS, 
  INITIAL_TICKETS, 
  INITIAL_VENDORS, 
  INITIAL_MISSED_ALERTS,
  INITIAL_FORWARDING_RULES,
  INITIAL_DAILY_REPORTS,
  INITIAL_ACTIVITY_TIMELINE,
  INITIAL_QUOTATIONS,
  INITIAL_EMAIL_RECORDS
} from '../data/initialData';

// Storage Keys
const KEYS = {
  CALLS: 'fastconnect_real_calls',
  TICKETS: 'fastconnect_real_tickets',
  VENDORS: 'fastconnect_real_vendors',
  MISSED_CALLS: 'fastconnect_real_missed_calls',
  SCHEDULED_CALLS: 'fastconnect_real_scheduled_calls',
  FORWARDING_RULES: 'fastconnect_real_forwarding_rules',
  DAILY_REPORTS: 'fastconnect_real_daily_reports',
  ACTIVITY_TIMELINE: 'fastconnect_real_activity_timeline',
  QUOTATIONS: 'fastconnect_real_quotations',
  EMAIL_RECORDS: 'fastconnect_real_email_records',
  EXTENSIONS: 'fastconnect_custom_extensions',
  SIM_PROFILES: 'fastconnect_sim_profiles'
};

export const DEFAULT_SIM_PROFILES: SimProfile[] = [
  {
    slot: 'SIM 1',
    carrierName: 'Jazz Corporate 4G',
    simNumber: '+92 300 8492001',
    signalStrength: 5,
    status: 'active',
    planType: 'Postpaid Corporate'
  },
  {
    slot: 'SIM 2',
    carrierName: 'Zong Enterprise 4G',
    simNumber: '+92 312 9401234',
    signalStrength: 4,
    status: 'active',
    planType: 'Prepaid Business'
  }
];

class LiveDataStore {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('fastconnect_data_sync');
        this.broadcastChannel.onmessage = (event) => {
          const { key, data } = event.data || {};
          if (key && this.listeners.has(key)) {
            this.notifyListeners(key, data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment');
    }
  }

  private safeGet<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(fallback)) {
          if (Array.isArray(parsed) && parsed.length > 0) return parsed as unknown as T;
        } else if (parsed && typeof parsed === 'object') {
          return parsed as unknown as T;
        }
      }
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
    }
    // Save fallback to ensure initial persistence
    try {
      localStorage.setItem(key, JSON.stringify(fallback));
    } catch {}
    return fallback;
  }

  private safeSet<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notifyListeners(key, data);
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ key, data });
      }
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  private notifyListeners(key: string, data: any) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Listener error on ${key}:`, err);
        }
      });
    }
  }

  public subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  // ==================== GETTERS & INITIALIZERS ====================

  public getCalls(): CallRecord[] {
    return this.safeGet<CallRecord[]>(KEYS.CALLS, INITIAL_CALL_RECORDS);
  }

  public setCalls(calls: CallRecord[]) {
    this.safeSet(KEYS.CALLS, calls);
  }

  public saveCall(call: CallRecord) {
    const list = this.getCalls();
    const existingIndex = list.findIndex(c => c.id === call.id);
    let next: CallRecord[];
    if (existingIndex >= 0) {
      next = [...list];
      next[existingIndex] = call;
    } else {
      next = [call, ...list];
    }
    this.setCalls(next);
  }

  public deleteCall(id: string) {
    const next = this.getCalls().filter(c => c.id !== id);
    this.setCalls(next);
  }

  public getTickets(): ComplaintTicket[] {
    return this.safeGet<ComplaintTicket[]>(KEYS.TICKETS, INITIAL_TICKETS);
  }

  public setTickets(tickets: ComplaintTicket[]) {
    this.safeSet(KEYS.TICKETS, tickets);
  }

  public saveTicket(ticket: ComplaintTicket) {
    const list = this.getTickets();
    const existingIndex = list.findIndex(t => t.id === ticket.id);
    let next: ComplaintTicket[];
    if (existingIndex >= 0) {
      next = [...list];
      next[existingIndex] = ticket;
    } else {
      next = [ticket, ...list];
    }
    this.setTickets(next);
  }

  public deleteTicket(id: string) {
    const next = this.getTickets().filter(t => t.id !== id);
    this.setTickets(next);
  }

  public getVendors(): Vendor[] {
    return this.safeGet<Vendor[]>(KEYS.VENDORS, INITIAL_VENDORS);
  }

  public setVendors(vendors: Vendor[]) {
    this.safeSet(KEYS.VENDORS, vendors);
  }

  public saveVendor(vendor: Vendor) {
    const list = this.getVendors();
    const existingIndex = list.findIndex(v => v.id === vendor.id);
    let next: Vendor[];
    if (existingIndex >= 0) {
      next = [...list];
      next[existingIndex] = vendor;
    } else {
      next = [vendor, ...list];
    }
    this.setVendors(next);
  }

  public deleteVendor(id: string) {
    const next = this.getVendors().filter(v => v.id !== id);
    this.setVendors(next);
  }

  public getMissedCalls(): MissedCallAlert[] {
    return this.safeGet<MissedCallAlert[]>(KEYS.MISSED_CALLS, INITIAL_MISSED_ALERTS);
  }

  public setMissedCalls(alerts: MissedCallAlert[]) {
    this.safeSet(KEYS.MISSED_CALLS, alerts);
  }

  public getScheduledCalls(): ScheduledCall[] {
    return this.safeGet<ScheduledCall[]>(KEYS.SCHEDULED_CALLS, []);
  }

  public setScheduledCalls(sched: ScheduledCall[]) {
    this.safeSet(KEYS.SCHEDULED_CALLS, sched);
  }

  public getForwardingRules(): CallForwardingRule[] {
    return this.safeGet<CallForwardingRule[]>(KEYS.FORWARDING_RULES, INITIAL_FORWARDING_RULES);
  }

  public setForwardingRules(rules: CallForwardingRule[]) {
    this.safeSet(KEYS.FORWARDING_RULES, rules);
  }

  public getDailyReports(): DailyReport[] {
    return this.safeGet<DailyReport[]>(KEYS.DAILY_REPORTS, INITIAL_DAILY_REPORTS);
  }

  public setDailyReports(reports: DailyReport[]) {
    this.safeSet(KEYS.DAILY_REPORTS, reports);
  }

  public getActivityTimeline(): ActivityTimelineItem[] {
    return this.safeGet<ActivityTimelineItem[]>(KEYS.ACTIVITY_TIMELINE, INITIAL_ACTIVITY_TIMELINE);
  }

  public setActivityTimeline(timeline: ActivityTimelineItem[]) {
    this.safeSet(KEYS.ACTIVITY_TIMELINE, timeline);
  }

  public addActivityEvent(event: ActivityTimelineItem) {
    const list = this.getActivityTimeline();
    this.setActivityTimeline([event, ...list]);
  }

  public getQuotations(): VendorQuotation[] {
    return this.safeGet<VendorQuotation[]>(KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  }

  public setQuotations(quotes: VendorQuotation[]) {
    this.safeSet(KEYS.QUOTATIONS, quotes);
  }

  public getEmailRecords(): EmailWorkRecord[] {
    return this.safeGet<EmailWorkRecord[]>(KEYS.EMAIL_RECORDS, INITIAL_EMAIL_RECORDS);
  }

  public setEmailRecords(records: EmailWorkRecord[]) {
    this.safeSet(KEYS.EMAIL_RECORDS, records);
  }

  public getExtensions(): EmployeeExtension[] {
    return this.safeGet<EmployeeExtension[]>(KEYS.EXTENSIONS, INITIAL_EXTENSIONS);
  }

  public setExtensions(exts: EmployeeExtension[]) {
    this.safeSet(KEYS.EXTENSIONS, exts);
  }

  public getSimProfiles(): SimProfile[] {
    return this.safeGet<SimProfile[]>(KEYS.SIM_PROFILES, DEFAULT_SIM_PROFILES);
  }

  public setSimProfiles(profiles: SimProfile[]) {
    this.safeSet(KEYS.SIM_PROFILES, profiles);
  }

  // ==================== BACKUP & RESTORE ====================

  public exportFullBackup(): string {
    const backup = {
      app: 'FAST Connect Enterprise Call Center',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      collections: {
        calls: this.getCalls(),
        tickets: this.getTickets(),
        vendors: this.getVendors(),
        missedCalls: this.getMissedCalls(),
        scheduledCalls: this.getScheduledCalls(),
        forwardingRules: this.getForwardingRules(),
        dailyReports: this.getDailyReports(),
        activityTimeline: this.getActivityTimeline(),
        quotations: this.getQuotations(),
        emailRecords: this.getEmailRecords(),
        extensions: this.getExtensions(),
        simProfiles: this.getSimProfiles()
      }
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackup(data: any): boolean {
    try {
      const collections = data.collections || data;
      if (collections.calls && Array.isArray(collections.calls)) this.setCalls(collections.calls);
      if (collections.tickets && Array.isArray(collections.tickets)) this.setTickets(collections.tickets);
      if (collections.vendors && Array.isArray(collections.vendors)) this.setVendors(collections.vendors);
      if (collections.missedCalls && Array.isArray(collections.missedCalls)) this.setMissedCalls(collections.missedCalls);
      if (collections.scheduledCalls && Array.isArray(collections.scheduledCalls)) this.setScheduledCalls(collections.scheduledCalls);
      if (collections.forwardingRules && Array.isArray(collections.forwardingRules)) this.setForwardingRules(collections.forwardingRules);
      if (collections.dailyReports && Array.isArray(collections.dailyReports)) this.setDailyReports(collections.dailyReports);
      if (collections.activityTimeline && Array.isArray(collections.activityTimeline)) this.setActivityTimeline(collections.activityTimeline);
      if (collections.quotations && Array.isArray(collections.quotations)) this.setQuotations(collections.quotations);
      if (collections.emailRecords && Array.isArray(collections.emailRecords)) this.setEmailRecords(collections.emailRecords);
      if (collections.extensions && Array.isArray(collections.extensions)) this.setExtensions(collections.extensions);
      if (collections.simProfiles && Array.isArray(collections.simProfiles)) this.setSimProfiles(collections.simProfiles);
      return true;
    } catch (e) {
      console.error('Import backup failed:', e);
      return false;
    }
  }

  public resetToFactoryDemoData() {
    this.setCalls(INITIAL_CALL_RECORDS);
    this.setTickets(INITIAL_TICKETS);
    this.setVendors(INITIAL_VENDORS);
    this.setMissedCalls(INITIAL_MISSED_ALERTS);
    this.setScheduledCalls([]);
    this.setForwardingRules(INITIAL_FORWARDING_RULES);
    this.setDailyReports(INITIAL_DAILY_REPORTS);
    this.setActivityTimeline(INITIAL_ACTIVITY_TIMELINE);
    this.setQuotations(INITIAL_QUOTATIONS);
    this.setEmailRecords(INITIAL_EMAIL_RECORDS);
    this.setExtensions(INITIAL_EXTENSIONS);
    this.setSimProfiles(DEFAULT_SIM_PROFILES);
  }

  public clearAllData() {
    this.setCalls([]);
    this.setTickets([]);
    this.setMissedCalls([]);
    this.setScheduledCalls([]);
    this.setQuotations([]);
    this.setEmailRecords([]);
  }
}

export const liveStore = new LiveDataStore();
export { KEYS as STORE_KEYS };
