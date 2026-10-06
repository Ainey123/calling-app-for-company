import { CompanyEmployee, CustomerCallLog } from '../types';

const STORAGE_KEYS = {
  MAIN_NUMBER: 'fastconnect_main_company_number',
  EMPLOYEES: 'fastconnect_company_employees',
  CALL_LOGS: 'fastconnect_customer_call_logs',
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

class CompanyCallStore {
  private channel: BroadcastChannel | null = null;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('company_calling_sync');
      }
    } catch {}
  }

  public getMainNumber(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.MAIN_NUMBER) || DEFAULT_MAIN_NUMBER;
    } catch {
      return DEFAULT_MAIN_NUMBER;
    }
  }

  public setMainNumber(num: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.MAIN_NUMBER, num);
      this.channel?.postMessage({ type: 'MAIN_NUMBER', data: num });
    } catch {}
  }

  public getEmployees(): CompanyEmployee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    this.saveEmployees(DEFAULT_EMPLOYEES);
    return DEFAULT_EMPLOYEES;
  }

  public saveEmployees(list: CompanyEmployee[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
      this.channel?.postMessage({ type: 'EMPLOYEES', data: list });
    } catch {}
  }

  public saveEmployee(employee: CompanyEmployee) {
    const list = this.getEmployees();
    const idx = list.findIndex(e => e.id === employee.id);
    let next: CompanyEmployee[];
    if (idx >= 0) {
      next = [...list];
      next[idx] = employee;
    } else {
      next = [...list, employee];
    }
    this.saveEmployees(next);
    return next;
  }

  public deleteEmployee(id: string): CompanyEmployee[] {
    const next = this.getEmployees().filter(e => e.id !== id);
    this.saveEmployees(next);
    return next;
  }

  public updateEmployeeStatus(id: string, status: 'available' | 'busy' | 'offline'): CompanyEmployee[] {
    const list = this.getEmployees();
    const next = list.map(e => e.id === id ? { ...e, status } : e);
    this.saveEmployees(next);
    return next;
  }

  public incrementAnsweredCount(id: string) {
    const list = this.getEmployees();
    const next = list.map(e => e.id === id ? { ...e, totalCallsAnswered: (e.totalCallsAnswered || 0) + 1 } : e);
    this.saveEmployees(next);
    return next;
  }

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

  public addCallLog(log: CustomerCallLog): CustomerCallLog[] {
    const list = this.getCallLogs();
    const next = [log, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(next));
      this.channel?.postMessage({ type: 'CALL_LOGS', data: next });
    } catch {}
    return next;
  }

  public clearCallLogs() {
    try {
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify([]));
      this.channel?.postMessage({ type: 'CALL_LOGS', data: [] });
    } catch {}
  }

  public wipeAllToBlank() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CALL_LOGS);
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify([]));
      // Reset employees to blank array
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
      this.channel?.postMessage({ type: 'WIPE_ALL' });
    } catch {}
  }
}

export const companyCallStore = new CompanyCallStore();
