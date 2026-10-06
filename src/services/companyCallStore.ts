import { CompanyEmployee, CustomerCallLog } from '../types';

const STORAGE_KEYS = {
  MAIN_NUMBER: 'fastconnect_main_company_number',
  EMPLOYEES: 'fastconnect_company_employees',
  CALL_LOGS: 'fastconnect_customer_call_logs',
  NEON_STATUS: 'fastconnect_neon_status',
};

const DEFAULT_MAIN_NUMBER = '+92 (42) 111-327-800';

const DEFAULT_EMPLOYEES: CompanyEmployee[] = [
  {
    id: 'emp-1',
    name: 'Qurat Ul Ain',
    simNumber: '+92 300 1234567',
    whatsappNumber: '+92 300 1234567',
    role: 'Operations & Customer Support Lead',
    status: 'available',
    totalCallsAnswered: 12,
  },
  {
    id: 'emp-2',
    name: 'Tariq Mehmood',
    simNumber: '+92 321 9876543',
    whatsappNumber: '+92 321 9876543',
    role: 'Technical Dispatcher',
    status: 'available',
    totalCallsAnswered: 8,
  },
  {
    id: 'emp-3',
    name: 'Fatima Noor',
    simNumber: '+92 333 4567890',
    whatsappNumber: '+92 333 4567890',
    role: 'Client Care Representative',
    status: 'busy',
    totalCallsAnswered: 15,
  },
];

type SyncCallback = (data: {
  mainNumber: string;
  employees: CompanyEmployee[];
  callLogs: CustomerCallLog[];
  isNeonLive: boolean;
}) => void;

class CompanyCallStore {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  public isNeonLive = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('company_calling_sync');
        this.channel.onmessage = () => {
          this.notify();
        };
      }
    } catch {}
  }

  public subscribe(cb: SyncCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const mainNumber = this.getMainNumber();
    const employees = this.getEmployees();
    const callLogs = this.getCallLogs();
    this.listeners.forEach((cb) => {
      try {
        cb({ mainNumber, employees, callLogs, isNeonLive: this.isNeonLive });
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ==================== FETCH FROM NEON CLOUD ====================
  public async syncWithNeonCloud(): Promise<boolean> {
    try {
      const [empRes, callRes, compRes] = await Promise.allSettled([
        fetch('/api/employees').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/calls').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/company').then((r) => (r.ok ? r.json() : null)),
      ]);

      let hasNeon = false;

      if (empRes.status === 'fulfilled' && empRes.value?.source === 'neon') {
        hasNeon = true;
        if (Array.isArray(empRes.value.employees)) {
          this.saveEmployeesLocal(empRes.value.employees);
        }
      }

      if (callRes.status === 'fulfilled' && callRes.value?.source === 'neon') {
        hasNeon = true;
        if (Array.isArray(callRes.value.callLogs)) {
          this.saveCallLogsLocal(callRes.value.callLogs);
        }
      }

      if (compRes.status === 'fulfilled' && compRes.value?.source === 'neon') {
        hasNeon = true;
        if (compRes.value.mainNumber) {
          this.setMainNumberLocal(compRes.value.mainNumber);
        }
      }

      this.isNeonLive = hasNeon;
      this.notify();
      return hasNeon;
    } catch (err) {
      this.isNeonLive = false;
      return false;
    }
  }

  // ==================== MAIN COMPANY NUMBER ====================
  public getMainNumber(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.MAIN_NUMBER) || DEFAULT_MAIN_NUMBER;
    } catch {
      return DEFAULT_MAIN_NUMBER;
    }
  }

  private setMainNumberLocal(num: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.MAIN_NUMBER, num);
      this.channel?.postMessage({ type: 'MAIN_NUMBER', data: num });
    } catch {}
  }

  public async setMainNumber(num: string) {
    this.setMainNumberLocal(num);
    this.notify();
    try {
      await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainNumber: num }),
      });
    } catch {}
  }

  // ==================== EMPLOYEES ====================
  public getEmployees(): CompanyEmployee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveEmployeesLocal(DEFAULT_EMPLOYEES);
    return DEFAULT_EMPLOYEES;
  }

  private saveEmployeesLocal(list: CompanyEmployee[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
      this.channel?.postMessage({ type: 'EMPLOYEES', data: list });
    } catch {}
  }

  public saveEmployee(employee: CompanyEmployee): CompanyEmployee[] {
    const list = this.getEmployees();
    const idx = list.findIndex((e) => e.id === employee.id);
    let next: CompanyEmployee[];
    if (idx >= 0) {
      next = [...list];
      next[idx] = employee;
    } else {
      next = [...list, employee];
    }
    this.saveEmployeesLocal(next);
    this.notify();

    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    }).catch((err) => console.warn('Neon sync employee error:', err));

    return next;
  }

  public deleteEmployee(id: string): CompanyEmployee[] {
    const next = this.getEmployees().filter((e) => e.id !== id);
    this.saveEmployeesLocal(next);
    this.notify();

    fetch(`/api/employees?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Neon delete employee error:', err));

    return next;
  }

  public updateEmployeeStatus(
    id: string,
    status: 'available' | 'busy' | 'offline'
  ): CompanyEmployee[] {
    const list = this.getEmployees();
    const next = list.map((e) => (e.id === id ? { ...e, status } : e));
    this.saveEmployeesLocal(next);
    this.notify();

    fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch((err) => console.warn('Neon status error:', err));

    return next;
  }

  public incrementAnsweredCount(id: string): CompanyEmployee[] {
    const list = this.getEmployees();
    const next = list.map((e) =>
      e.id === id ? { ...e, totalCallsAnswered: (e.totalCallsAnswered || 0) + 1 } : e
    );
    this.saveEmployeesLocal(next);
    this.notify();
    return next;
  }

  // ==================== CALL LOGS ====================
  public getCallLogs(): CustomerCallLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveCallLogsLocal(list: CustomerCallLog[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(list));
      this.channel?.postMessage({ type: 'CALL_LOGS', data: list });
    } catch {}
  }

  public addCallLog(log: CustomerCallLog): CustomerCallLog[] {
    const list = this.getCallLogs();
    const next = [log, ...list];
    this.saveCallLogsLocal(next);
    this.notify();

    fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch((err) => console.warn('Neon call log error:', err));

    return next;
  }

  public async clearCallLogs(): Promise<void> {
    this.saveCallLogsLocal([]);
    this.notify();
    try {
      await fetch('/api/calls', { method: 'DELETE' });
    } catch {}
  }

  // ==================== WIPE ALL DATA ====================
  public async wipeAllToBlank(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.CALL_LOGS);
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
      this.channel?.postMessage({ type: 'WIPE_ALL' });
      this.notify();
    } catch {}

    try {
      await fetch('/api/wipe', { method: 'POST' });
    } catch {}
  }
}

export const companyCallStore = new CompanyCallStore();
