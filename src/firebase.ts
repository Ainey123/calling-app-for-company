import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  CallRecord, 
  ComplaintTicket, 
  MissedCallAlert, 
  Vendor, 
  EmployeeExtension, 
  ScheduledCall, 
  CallForwardingRule, 
  DailyReport, 
  ActivityTimelineItem, 
  SipPbxConfig,
  VendorQuotation,
  EmailWorkRecord
} from './types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Auth Helpers
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Auth sign-in error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// =========================================================================
// Real-time Firestore Listeners & CRUD
// =========================================================================

/**
 * Recursively cleans an object or array to ensure no `undefined` values are passed
 * to Firestore setDoc/updateDoc/addDoc, which strictly throws "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

const withTimeout = <T>(promise: Promise<T>, ms = 2500): Promise<T | void> => {
  return Promise.race([
    promise,
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
};

// Calls Collection
export const subscribeToCalls = (callback: (calls: CallRecord[]) => void) => {
  try {
    const callsCol = collection(db, 'calls');
    return onSnapshot(callsCol, (snapshot) => {
      const list: CallRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CallRecord);
      });
      // Sort descending by timestamp or creation
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      if (list.length > 0) {
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in calls onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Calls subscription fallback:', err);
    return () => {};
  }
};

export const saveCallRecordToFirestore = async (call: CallRecord) => {
  try {
    const callRef = doc(db, 'calls', call.id);
    const rawPayload: any = { ...call, updatedAt: new Date().toISOString() };
    if (rawPayload.linkedTicketId === undefined) {
      delete rawPayload.linkedTicketId;
    }
    const payload = cleanForFirestore(rawPayload);
    await withTimeout(setDoc(callRef, payload));
  } catch (e) {
    console.warn('Failed to save call to Firestore:', e);
  }
};

export const deleteCallRecordFromFirestore = async (callId: string) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await withTimeout(deleteDoc(callRef));
  } catch (e) {
    console.warn('Failed to delete call from Firestore:', e);
  }
};

// Tickets Collection
export const subscribeToTickets = (callback: (tickets: ComplaintTicket[]) => void) => {
  try {
    const ticketsCol = collection(db, 'tickets');
    return onSnapshot(ticketsCol, (snapshot) => {
      const list: ComplaintTicket[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ComplaintTicket);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (list.length > 0) {
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in tickets onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Tickets subscription fallback:', err);
    return () => {};
  }
};

export const saveTicketToFirestore = async (ticket: ComplaintTicket) => {
  try {
    const ticketRef = doc(db, 'tickets', ticket.id);
    const payload = cleanForFirestore({
      ...ticket,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(setDoc(ticketRef, payload));
  } catch (e) {
    console.warn('Failed to save ticket to Firestore:', e);
  }
};

export const updateTicketInFirestore = async (ticketId: string, updates: Partial<ComplaintTicket>) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const payload = cleanForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(updateDoc(ticketRef, payload));
  } catch (e) {
    console.warn('Failed to update ticket in Firestore:', e);
  }
};

export const deleteTicketFromFirestore = async (ticketId: string) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await withTimeout(deleteDoc(ticketRef));
  } catch (e) {
    console.warn('Failed to delete ticket from Firestore:', e);
  }
};

// Missed Calls Collection
export const subscribeToMissedCalls = (callback: (alerts: MissedCallAlert[]) => void) => {
  try {
    const missedCol = collection(db, 'missedCalls');
    return onSnapshot(missedCol, (snapshot) => {
      const list: MissedCallAlert[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as MissedCallAlert);
      });
      if (list.length > 0) {
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in missedCalls onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Missed calls subscription fallback:', err);
    return () => {};
  }
};

export const saveMissedCallToFirestore = async (alert: MissedCallAlert) => {
  try {
    const alertRef = doc(db, 'missedCalls', alert.id);
    await withTimeout(setDoc(alertRef, cleanForFirestore(alert)));
  } catch (e) {
    console.warn('Failed to save missed call alert to Firestore:', e);
  }
};

export const markMissedCallReadInFirestore = async (id: string) => {
  try {
    const alertRef = doc(db, 'missedCalls', id);
    await updateDoc(alertRef, { isRead: true });
  } catch (e) {
    console.warn('Failed to mark alert as read:', e);
  }
};

// Scheduled Calls Collection
export const subscribeToScheduledCalls = (callback: (scheduled: ScheduledCall[]) => void) => {
  try {
    const schedCol = collection(db, 'scheduledCalls');
    return onSnapshot(schedCol, (snapshot) => {
      const list: ScheduledCall[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ScheduledCall);
      });
      // Sort by scheduledDate then scheduledTime
      list.sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`));
      if (list.length > 0) {
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in scheduledCalls onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Scheduled calls subscription fallback:', err);
    return () => {};
  }
};

export const saveScheduledCallToFirestore = async (scheduled: ScheduledCall) => {
  try {
    const ref = doc(db, 'scheduledCalls', scheduled.id);
    await withTimeout(setDoc(ref, cleanForFirestore(scheduled)));
  } catch (e) {
    console.warn('Failed to save scheduled call to Firestore:', e);
  }
};

export const updateScheduledCallInFirestore = async (id: string, updates: Partial<ScheduledCall>) => {
  try {
    const ref = doc(db, 'scheduledCalls', id);
    await withTimeout(updateDoc(ref, cleanForFirestore(updates)));
  } catch (e) {
    console.warn('Failed to update scheduled call in Firestore:', e);
  }
};

export const deleteScheduledCallFromFirestore = async (id: string) => {
  try {
    const ref = doc(db, 'scheduledCalls', id);
    await withTimeout(deleteDoc(ref));
  } catch (e) {
    console.warn('Failed to delete scheduled call from Firestore:', e);
  }
};

// =========================================================================
// Call Forwarding Rules Collection
// =========================================================================
export const subscribeToForwardingRules = (callback: (rules: CallForwardingRule[]) => void) => {
  const col = collection(db, 'callForwardingRules');
  return onSnapshot(col, (snapshot) => {
    const list: CallForwardingRule[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CallForwardingRule);
    });
    list.sort((a, b) => a.extension.localeCompare(b.extension));
    callback(list);
  }, (err) => {
    console.warn('Notice in callForwardingRules onSnapshot:', err);
  });
};

export const saveForwardingRuleToFirestore = async (rule: CallForwardingRule) => {
  try {
    const ref = doc(db, 'callForwardingRules', rule.id);
    const payload = cleanForFirestore({
      ...rule,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
  } catch (e) {
    console.warn('Failed to save forwarding rule to Firestore:', e);
  }
};

// =========================================================================
// Daily Work Reports Collection
// =========================================================================
export const subscribeToDailyReports = (callback: (reports: DailyReport[]) => void) => {
  const col = collection(db, 'dailyReports');
  return onSnapshot(col, (snapshot) => {
    const list: DailyReport[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as DailyReport);
    });
    list.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
    callback(list);
  }, (err) => {
    console.warn('Notice in dailyReports onSnapshot:', err);
  });
};

export const saveDailyReportToFirestore = async (report: DailyReport) => {
  try {
    const ref = doc(db, 'dailyReports', report.id);
    const payload = cleanForFirestore({
      ...report,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(setDoc(ref, payload));
  } catch (e) {
    console.warn('Failed to save daily report to Firestore:', e);
  }
};

export const updateDailyReportInFirestore = async (id: string, updates: Partial<DailyReport>) => {
  try {
    const ref = doc(db, 'dailyReports', id);
    const payload = cleanForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(updateDoc(ref, payload));
  } catch (e) {
    console.warn('Failed to update daily report in Firestore:', e);
  }
};

// =========================================================================
// Activity Timeline Events Collection
// =========================================================================
export const subscribeToActivityTimeline = (callback: (items: ActivityTimelineItem[]) => void) => {
  try {
    const col = collection(db, 'activityTimeline');
    return onSnapshot(col, (snapshot) => {
      const list: ActivityTimelineItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ActivityTimelineItem);
      });
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      if (list.length > 0) {
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in activityTimeline onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Activity timeline subscription fallback:', err);
    return () => {};
  }
};

export const saveActivityEventToFirestore = async (item: ActivityTimelineItem) => {
  try {
    const ref = doc(db, 'activityTimeline', item.id);
    await withTimeout(setDoc(ref, cleanForFirestore(item)));
  } catch (e) {
    console.warn('Failed to save activity timeline item to Firestore:', e);
  }
};

// =========================================================================
// Employee Extensions Collection (Custom Photos & Officer Profiles)
// =========================================================================
export const subscribeToExtensions = (callback: (extensions: EmployeeExtension[]) => void) => {
  try {
    const col = collection(db, 'extensions');
    return onSnapshot(col, (snapshot) => {
      const list: EmployeeExtension[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as EmployeeExtension);
      });
      if (list.length > 0) {
        list.sort((a, b) => a.extension.localeCompare(b.extension));
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in extensions onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Extensions subscription fallback:', err);
    return () => {};
  }
};

export const saveExtensionToFirestore = async (ext: EmployeeExtension) => {
  try {
    const ref = doc(db, 'extensions', ext.id);
    await withTimeout(setDoc(ref, cleanForFirestore(ext), { merge: true }));
  } catch (e) {
    console.warn('Failed to save extension to Firestore:', e);
  }
};

export const deleteExtensionFromFirestore = async (id: string) => {
  try {
    const ref = doc(db, 'extensions', id);
    await withTimeout(deleteDoc(ref));
  } catch (e) {
    console.error('Failed to delete extension from Firestore:', e);
  }
};

// Clear All Records (To fulfill user request to remove previous mock/demo clutter)
export const clearAllFirestoreData = async () => {
  try {
    const callsSnap = await withTimeout(getDocs(collection(db, 'calls')));
    if (callsSnap && 'docs' in callsSnap) {
      for (const d of callsSnap.docs) {
        await withTimeout(deleteDoc(d.ref));
      }
    }
    const ticketsSnap = await withTimeout(getDocs(collection(db, 'tickets')));
    if (ticketsSnap && 'docs' in ticketsSnap) {
      for (const d of ticketsSnap.docs) {
        await withTimeout(deleteDoc(d.ref));
      }
    }
    const missedSnap = await withTimeout(getDocs(collection(db, 'missedCalls')));
    if (missedSnap && 'docs' in missedSnap) {
      for (const d of missedSnap.docs) {
        await withTimeout(deleteDoc(d.ref));
      }
    }
    const schedSnap = await withTimeout(getDocs(collection(db, 'scheduledCalls')));
    if (schedSnap && 'docs' in schedSnap) {
      for (const d of schedSnap.docs) {
        await withTimeout(deleteDoc(d.ref));
      }
    }
  } catch (e) {
    console.error('Error clearing Firestore data:', e);
  }
};

// =========================================================================
// Corporate PBX Trunk & Telephony Gateway Configuration
// =========================================================================
export const subscribeToPbxConfig = (callback: (config: SipPbxConfig | null) => void) => {
  try {
    const ref = doc(db, 'systemSettings', 'pbxConfig');
    return onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as SipPbxConfig);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn('Notice in pbxConfig onSnapshot:', err);
    });
  } catch (err) {
    console.warn('PBX config subscription fallback:', err);
    return () => {};
  }
};

export const savePbxConfigToFirestore = async (config: SipPbxConfig) => {
  try {
    const ref = doc(db, 'systemSettings', 'pbxConfig');
    const payload = cleanForFirestore({
      ...config,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(setDoc(ref, payload, { merge: true }));
  } catch (e) {
    console.warn('Failed to save PBX config to Firestore:', e);
  }
};

// =========================================================================
// Vendors Collection
// =========================================================================
export const subscribeToVendors = (callback: (vendors: Vendor[]) => void) => {
  try {
    const col = collection(db, 'vendors');
    return onSnapshot(col, (snapshot) => {
      const list: Vendor[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Vendor);
      });
      if (list.length > 0) {
        list.sort((a, b) => a.name.localeCompare(b.name));
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in vendors onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Vendors subscription fallback:', err);
    return () => {};
  }
};

export const saveVendorToFirestore = async (vendor: Vendor) => {
  try {
    const ref = doc(db, 'vendors', vendor.id);
    await withTimeout(setDoc(ref, cleanForFirestore(vendor), { merge: true }));
  } catch (e) {
    console.warn('Failed to save vendor to Firestore:', e);
  }
};

export const deleteVendorFromFirestore = async (id: string) => {
  try {
    const ref = doc(db, 'vendors', id);
    await withTimeout(deleteDoc(ref));
  } catch (e) {
    console.warn('Failed to delete vendor from Firestore:', e);
  }
};

// =========================================================================
// Vendor Quotations Collection
// =========================================================================
export const subscribeToQuotations = (callback: (quotes: VendorQuotation[]) => void) => {
  try {
    const col = collection(db, 'quotations');
    return onSnapshot(col, (snapshot) => {
      const list: VendorQuotation[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as VendorQuotation);
      });
      if (list.length > 0) {
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in quotations onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Quotations subscription fallback:', err);
    return () => {};
  }
};

export const saveQuotationToFirestore = async (quote: VendorQuotation) => {
  try {
    const ref = doc(db, 'quotations', quote.id);
    const payload = cleanForFirestore({
      ...quote,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(setDoc(ref, payload));
  } catch (e) {
    console.warn('Failed to save quotation to Firestore:', e);
  }
};

export const updateQuotationInFirestore = async (id: string, updates: Partial<VendorQuotation>) => {
  try {
    const ref = doc(db, 'quotations', id);
    const payload = cleanForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(updateDoc(ref, payload));
  } catch (e) {
    console.warn('Failed to update quotation in Firestore:', e);
  }
};

export const deleteQuotationFromFirestore = async (id: string) => {
  try {
    const ref = doc(db, 'quotations', id);
    await withTimeout(deleteDoc(ref));
  } catch (e) {
    console.warn('Failed to delete quotation from Firestore:', e);
  }
};

// =========================================================================
// Email Work Records Collection (Gmail Activities)
// =========================================================================
export const subscribeToEmailRecords = (callback: (emails: EmailWorkRecord[]) => void) => {
  try {
    const col = collection(db, 'emailRecords');
    return onSnapshot(col, (snapshot) => {
      const list: EmailWorkRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as EmailWorkRecord);
      });
      if (list.length > 0) {
        list.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
        callback(list);
      }
    }, (err) => {
      console.warn('Notice in emailRecords onSnapshot:', err);
    });
  } catch (err) {
    console.warn('Email records subscription fallback:', err);
    return () => {};
  }
};

export const saveEmailRecordToFirestore = async (email: EmailWorkRecord) => {
  try {
    const ref = doc(db, 'emailRecords', email.id);
    const payload = cleanForFirestore({
      ...email,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(setDoc(ref, payload));
  } catch (e) {
    console.warn('Failed to save email record to Firestore:', e);
  }
};

export const updateEmailRecordInFirestore = async (id: string, updates: Partial<EmailWorkRecord>) => {
  try {
    const ref = doc(db, 'emailRecords', id);
    const payload = cleanForFirestore({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await withTimeout(updateDoc(ref, payload));
  } catch (e) {
    console.warn('Failed to update email record in Firestore:', e);
  }
};

export const deleteEmailRecordFromFirestore = async (id: string) => {
  try {
    const ref = doc(db, 'emailRecords', id);
    await withTimeout(deleteDoc(ref));
  } catch (e) {
    console.warn('Failed to delete email record from Firestore:', e);
  }
};
