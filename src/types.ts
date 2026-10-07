export type CallDirection = 'inbound' | 'outbound' | 'missed' | 'transferred';
export type CallStatus = 'ringing' | 'connected' | 'on-hold' | 'ended' | 'missed';
export type TicketStatus = 'New' | 'In Progress' | 'Vendor Assigned' | 'Vendor On-Site' | 'Resolved' | 'Closed';
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketCategory = 
  | 'Electrical' 
  | 'HVAC / Cooling' 
  | 'Generator & Backup' 
  | 'Network / IT' 
  | 'Security / Access'
  | 'Civil & Structural'
  | 'MEP & Plumbing'
  | 'Automation & Controls';

export type NavigationTab = 
  | 'overview' 
  | 'calls' 
  | 'vendors' 
  | 'emails' 
  | 'daily-work' 
  | 'admin-reports' 
  | 'activity' 
  | 'admin'
  | 'tickets' 
  | 'softphone' 
  | 'sim-calling'
  | 'directory' 
  | 'analytics' 
  | 'forwarding'
  | 'timeline'
  | 'my-account';

export interface EmployeeExtension {
  id: string;
  extension: string; // e.g. "101"
  name: string;
  role: string;
  department: string;
  avatar: string;
  email: string;
  phone: string;
  status: 'available' | 'on-call' | 'away' | 'offline';
  activeCallsToday: number;
  avgHandlingSeconds: number;
  pin?: string;
  bio?: string;
  shiftHours?: string;
  sipPassword?: string;
  sipAuthUser?: string;
  isDeveloper?: boolean;
  developerPermissions?: {
    canEditPbx?: boolean;
    canViewDiagnostics?: boolean;
    canExportBackup?: boolean;
    canResetDatabase?: boolean;
  };
}

export interface CompanyEmployee {
  id: string;
  name: string;
  simNumber: string; // Cellular SIM phone number
  whatsappNumber: string; // WhatsApp phone number
  role: string;
  status: 'available' | 'busy' | 'offline';
  avatar?: string;
  totalCallsAnswered: number;
}

export interface CustomerCallLog {
  id: string;
  customerName: string;
  customerPhone: string;
  answeredByEmployeeId?: string;
  answeredByEmployeeName?: string;
  channel: 'sim' | 'whatsapp';
  durationSeconds: number;
  status: 'answered' | 'missed' | 'rejected';
  notes: string;
  timestamp: string;
}

export type CallOutcome = 
  | 'Quotation Requested'
  | 'Price & Terms Confirmed'
  | 'Site Inspection Scheduled'
  | 'Pending Spec Clarification'
  | 'Follow-up Required'
  | 'Call Completed'
  | 'Voicemail Left'
  | 'Declined / Busy';

export interface CallRecord {
  id: string;
  callerNumber: string;
  callerName: string;
  organization?: string;
  branch?: string;
  city?: string;
  extension: string; // handled by employee ext
  agentName: string;
  direction: CallDirection;
  timestamp: string; // ISO or display
  durationSeconds: number;
  status: 'completed' | 'missed' | 'transferred' | 'voicemail';
  callOutcome?: CallOutcome;
  vendorId?: string;
  vendorName?: string;
  projectBranch?: string;
  followUpDate?: string;
  followUpNotes?: string;
  hasRecording: boolean;
  recordingDuration?: string;
  transcript?: string;
  audioDialogue?: Array<{ speaker: 'Caller' | 'Agent' | 'Vendor'; text: string; time: string }>;
  linkedTicketId?: string;
  linkedEmailId?: string;
  notes?: string;
  aiSummary?: {
    summary: string;
    sentiment: string;
    keyIssue: string;
    actionItems: string[];
    suggestedCategory?: string;
    recommendedVendorType?: string;
    urgencyLevel?: string;
  };
  // Smart Forwarding Metadata
  isForwarded?: boolean;
  originalExtension?: string;
  originalAgentName?: string;
  forwardingReason?: ForwardingCondition;
  forwardingHops?: CallForwardingHop[];
  telephonyMetadata?: {
    trunkName: string;
    carrier: string;
    codec: string;
    sipResponseCode: string;
    callIdHeader?: string;
  };
  // Cellular SIM Calling Metadata
  channel?: 'pbx' | 'sim' | 'webrtc' | 'cellular';
  simSlot?: 'SIM 1' | 'SIM 2';
  simCarrier?: string;
  simPurpose?: string;
}

export interface SimProfile {
  slot: 'SIM 1' | 'SIM 2';
  carrierName: string; // e.g. "Jazz Corporate 4G" | "Zong Enterprise"
  simNumber: string;
  signalStrength: number; // 1-5
  status: 'active' | 'standby' | 'no-sim';
  planType: 'Postpaid Corporate' | 'Prepaid Business';
}

export interface SimCallFormState {
  recipientPhone: string;
  countryCode: string;
  recipientName: string;
  organization: string;
  branch: string;
  simSlot: 'SIM 1' | 'SIM 2';
  simCarrier: string;
  callCategory: string;
  linkedTicketId?: string;
  notes: string;
  autoOpenDialer: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  trade: string; // e.g. "Certified Commercial Electrician"
  category: TicketCategory;
  phone: string;
  alternatePhone?: string;
  email?: string;
  city: string;
  area: string;
  address?: string;
  googleMapsUrl?: string;
  source?: string; // e.g. "Google Maps Search", "Local Reference", "Approved Vendor List"
  rating: number;
  jobsCompleted: number;
  avgResponseMinutes: number;
  status: 'Available Now' | 'On Call' | 'Busy';
  emergencyContractor: boolean;
  associatedProjects?: string[];
  activeQuotationsCount?: number;
  notes?: string;
}

export type QuotationStatus = 
  | 'RFQ Sent' 
  | 'Quotation Received' 
  | 'Under Engineering Review' 
  | 'Negotiation' 
  | 'Approved by Client' 
  | 'PO Issued' 
  | 'Rejected';

export interface VendorQuotation {
  id: string; // e.g. "QT-2026-101"
  vendorId: string;
  vendorName: string;
  projectBranch: string; // e.g. "HBL Main Gulberg - 100A Switchgear Replacement"
  scopeDescription: string;
  amountPkr?: number;
  status: QuotationStatus;
  requestedByEmployeeId: string;
  requestedByEmployeeName: string;
  validUntil?: string;
  emailReferenceId?: string;
  callReferenceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmailCategory = 
  | 'Quotation Request' 
  | 'Quotation Received' 
  | 'Technical Spec Clarification' 
  | 'Client Approval' 
  | 'Work Order / PO' 
  | 'Site Progress Report' 
  | 'General Follow-up';

export type EmailWorkStatus = 
  | 'Awaiting Reply' 
  | 'Reply Received' 
  | 'Approved' 
  | 'Action Needed' 
  | 'Resolved / Closed';

export interface EmailWorkRecord {
  id: string; // e.g. "EML-20261001-01"
  employeeId: string;
  employeeName: string;
  employeeExtension: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  subject: string;
  sender: string;
  recipient: string;
  category: EmailCategory;
  projectBranch: string;
  vendorId?: string;
  vendorName?: string;
  threadReference: string; // e.g. "Gmail Thread #GM-84920"
  actionTaken: string;
  status: EmailWorkStatus;
  pendingAction?: string;
  notes?: string;
  linkedWorkEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCallLink {
  callId: string;
  callerName: string;
  callerNumber: string;
  timestamp: string;
  durationSeconds: number;
  direction: CallDirection;
  summary: string;
}

export interface VendorResponse {
  vendorId: string;
  vendorName: string;
  recordedAt: string;
  eta: string;
  technicianAssigned: string;
  notes: string;
  quoteEstimate?: string;
}

export interface ComplaintTicket {
  id: string; // e.g. "TKT-8492"
  title: string;
  clientName: string;
  organization: string; // e.g. "Habib Bank Limited"
  branchName: string; // e.g. "Main Gulberg Branch"
  city: string; // e.g. "Lahore"
  clientPhone: string;
  clientEmail: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  description: string;
  assignedExtension: string; // e.g. "101"
  assignedAgentName: string;
  assignedVendor?: Vendor;
  vendorResponses?: VendorResponse[];
  linkedCalls: TicketCallLink[];
  timeline: Array<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    note?: string;
  }>;
}

export interface MissedCallAlert {
  id: string;
  callerName: string;
  callerNumber: string;
  organization: string;
  branch: string;
  timestamp: string;
  extension: string;
  isRead: boolean;
}

export interface ScheduledCall {
  id: string;
  callerName: string;
  callerNumber: string;
  organization?: string;
  branch?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  notes: string;
  assignedExtension: string;
  agentName: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  reminderSent?: boolean;
}

// ============================================================================
// MODULE 2: SMART CALL FORWARDING TYPES
// ============================================================================

export type ForwardingCondition = 
  | 'offline' 
  | 'unreachable' 
  | 'no-answer' 
  | 'busy' 
  | 'rejected' 
  | 'backup-unavailable'
  | 'after-hours';

export interface CallForwardingHop {
  hopNumber: number;
  fromExtension: string;
  fromAgentName: string;
  toExtension: string;
  toAgentName: string;
  toPhoneNumber?: string;
  condition: ForwardingCondition;
  timestamp: string;
  ringDurationSeconds?: number;
  result: 'answered' | 'no-answer' | 'busy' | 'rejected' | 'offline' | 'forwarded-next' | 'fallback-voicemail' | 'fallback-reception';
}

export interface CallForwardingRule {
  id: string; // e.g. "FWD-101"
  extension: string; // primary extension
  agentName: string;
  isEnabled: boolean;
  ringTimeoutSeconds: number; // e.g. 15
  backupExtension: string; // e.g. "102"
  backupAgentName: string;
  backupPhoneNumber?: string; // external direct cell / landline
  priorityOrder: number; // 1, 2, 3
  finalFallbackDestination: 'reception' | 'voicemail' | 'general-queue' | 'disconnect';
  conditions: {
    offline: boolean;
    unreachable: boolean;
    noAnswer: boolean;
    busy: boolean;
    rejected: boolean;
    backupUnavailable: boolean;
    afterHours: boolean;
  };
  businessHours: {
    enabled: boolean;
    startHour: string; // "09:00"
    endHour: string;   // "18:00"
    workDays: number[]; // [1, 2, 3, 4, 5] (Mon-Fri)
    timezone: string;   // "Asia/Karachi"
  };
  voicemailEnabled: boolean;
  voicemailGreeting?: string;
  updatedAt: string;
  updatedBy: string;
}

// ============================================================================
// MODULE 3 & 4: EMPLOYEE DAILY WORK REPORTING & ADMIN REVIEW TYPES
// ============================================================================

export type WorkStatus = 'Completed' | 'In Progress' | 'Pending Approval' | 'Blocked';

export interface WorkEntry {
  id: string; // e.g. "ENTRY-12345"
  employeeId: string;
  employeeName: string;
  employeeExtension: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  category: string; // e.g. "Vendor Calling & Negotiation", "Gmail Client Correspondence", "Quotation & BOQ Preparation", "Site Coordination & Inspection", "Technical Drawing / Spec Review", "Emergency Breakdown Triage", "Procurement & Parts Sourcing", "Client Meeting / Call"
  description: string;
  startTime?: string;
  endTime?: string;
  status: WorkStatus;
  resultOutcome: string;
  pendingWork?: string;
  remarks?: string;
  linkedCallId?: string;
  linkedEmailId?: string;
  linkedVendorId?: string;
  linkedVendorName?: string;
  projectBranch?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type DailyReportStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Under Review' 
  | 'Reviewed' 
  | 'Revision Requested';

export interface DailyReportRevision {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  previousStatus: DailyReportStatus;
  newStatus: DailyReportStatus;
  comment?: string;
}

export interface AdminComment {
  id: string;
  adminId: string;
  adminName: string;
  timestamp: string;
  message: string;
  isCorrectionRequest?: boolean;
}

export interface DailyReport {
  id: string; // e.g. "RPT-20260929-101"
  employeeId: string;
  employeeName: string;
  employeeExtension: string;
  employeeRole: string;
  employeeDepartment: string;
  reportDate: string; // "YYYY-MM-DD"
  status: DailyReportStatus;
  summaryHighlights: string;
  entries: WorkEntry[];
  totalWorkHours?: number;
  totalCallsHandledToday: number;
  totalTalkTimeSecondsToday: number;
  totalEmailsHandledToday?: number;
  pendingTasksSummary?: string;
  revisions: DailyReportRevision[];
  adminComments: AdminComment[];
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MODULE 5: EMPLOYEE ACTIVITY TIMELINE TYPES
// ============================================================================

export type ActivityEventType = 
  | 'auth-login' 
  | 'auth-logout' 
  | 'call-inbound' 
  | 'call-outbound' 
  | 'call-internal' 
  | 'call-forwarded' 
  | 'call-missed'
  | 'email-logged'
  | 'quote-created'
  | 'vendor-contacted'
  | 'call-outcome-updated'
  | 'work-entry-created' 
  | 'work-entry-updated' 
  | 'report-draft-saved' 
  | 'report-submitted' 
  | 'report-reviewed' 
  | 'report-revision-requested';

export interface ActivityTimelineItem {
  id: string;
  timestamp: string;
  timeDisplay: string;
  employeeId: string;
  employeeName: string;
  employeeExtension: string;
  eventType: ActivityEventType;
  isSystemGenerated: boolean; // TRUE for automated telephony/system events, FALSE for employee work submissions
  captureType?: 'auto-telephony' | 'auto-system' | 'employee-logged';
  title: string;
  description: string;
  badgeText: string;
  metadata?: {
    callId?: string;
    callDurationSeconds?: number;
    forwardedFrom?: string;
    forwardedTo?: string;
    condition?: string;
    ticketId?: string;
    reportId?: string;
    workEntryId?: string;
    emailId?: string;
    vendorId?: string;
    quoteId?: string;
    outcome?: string;
  };
}

export type SipRegistrationState =
  | 'unregistered'
  | 'connecting'
  | 'registered'
  | 'registration-failed'
  | 'call-in-progress'
  | 'disconnected';

export interface SipPbxConfig {
  id?: string;
  enabled: boolean;
  serverUrl: string; // e.g. "wss://pbx.yourcompany.com:8089/ws"
  domain: string; // e.g. "pbx.yourcompany.com" or "fastconnect.internal"
  realm?: string;
  transport: 'wss' | 'inbuilt-webrtc';
  stunServer: string; // e.g. "stun:stun.l.google.com:19302"
  turnServer?: string;
  turnUsername?: string;
  turnPassword?: string;
  didNumber: string; // e.g. "+9242111327800"
  sipSecretDefault: string; // e.g. "FastConnect@123"
  autoRegister: boolean;
  rtpPortRange?: string; // e.g. "10000-20000"
  pjsipPort?: number; // e.g. 5060
  wssPort?: number; // e.g. 8089
  updatedAt?: string;
}

export interface SipCallSession {
  sessionId: string;
  remoteTarget: string; // e.g. "102" or "+924235789012"
  direction: 'inbound' | 'outbound';
  state: 'establishing' | 'ringing' | 'connected' | 'held' | 'terminated';
  startTime: number;
  durationSeconds: number;
  isMuted: boolean;
  isHeld: boolean;
  callerDisplayName?: string;
}

export interface FreePbxConnectionConfig {
  enabled: boolean;
  host: string;
  wssPort: number;
  wssPath: string;
  serverUrl: string;
  domain: string;
  extension: string;
  secret: string;
  displayName: string;
  stunServer: string;
  autoConnect: boolean;
}
