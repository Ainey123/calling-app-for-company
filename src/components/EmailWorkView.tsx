import React, { useState } from 'react';
import { 
  Mail, 
  Search, 
  Plus, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  MessageSquare, 
  ShieldAlert, 
  FileText, 
  Tag, 
  User, 
  X, 
  Edit3, 
  Send,
  Sparkles,
  Link,
  ChevronRight,
  Info
} from 'lucide-react';
import { EmailWorkRecord, EmailCategory, EmailWorkStatus, EmployeeExtension, Vendor } from '../types';

interface EmailWorkViewProps {
  emailRecords: EmailWorkRecord[];
  currentExtension: EmployeeExtension;
  extensions: EmployeeExtension[];
  vendors: Vendor[];
  onSaveEmailRecord: (record: EmailWorkRecord) => Promise<void>;
  onUpdateEmailStatus: (id: string, status: EmailWorkStatus) => Promise<void>;
  onDeleteEmailRecord?: (id: string) => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const EmailWorkView: React.FC<EmailWorkViewProps> = ({
  emailRecords,
  currentExtension,
  extensions,
  vendors,
  onSaveEmailRecord,
  onUpdateEmailStatus,
  onDeleteEmailRecord,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmailWorkRecord | null>(null);
  const [sub, setSub] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState<EmailCategory>('Quotation Received');
  const [projectBranch, setProjectBranch] = useState('HBL Main Gulberg - 100A Switchgear Replacement');
  const [vendorId, setVendorId] = useState('');
  const [threadRef, setThreadRef] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [status, setStatus] = useState<EmailWorkStatus>('Awaiting Reply');
  const [notes, setNotes] = useState('');

  const openAddModal = (recordToEdit?: EmailWorkRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      setSub(recordToEdit.subject);
      setSender(recordToEdit.sender);
      setRecipient(recordToEdit.recipient);
      setCategory(recordToEdit.category);
      setProjectBranch(recordToEdit.projectBranch);
      setVendorId(recordToEdit.vendorId || '');
      setThreadRef(recordToEdit.threadReference);
      setActionTaken(recordToEdit.actionTaken);
      setPendingAction(recordToEdit.pendingAction || '');
      setStatus(recordToEdit.status);
      setNotes(recordToEdit.notes || '');
    } else {
      setEditingRecord(null);
      setSub('');
      setSender('procurement@client.com');
      setRecipient(currentExtension.email || 'operations@fastconnect.internal');
      setCategory('Quotation Received');
      setProjectBranch('HBL Main Gulberg - 100A Switchgear Replacement');
      setVendorId(vendors[0]?.id || '');
      setThreadRef(`Gmail Ref #GM-${Date.now().toString().slice(-4)}`);
      setActionTaken('');
      setPendingAction('');
      setStatus('Awaiting Reply');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sub.trim()) {
      onShowToast('Subject is required', 'error');
      return;
    }

    const matchedVendor = vendors.find((v) => v.id === vendorId);

    const record: EmailWorkRecord = {
      id: editingRecord ? editingRecord.id : `EML-${Date.now().toString().slice(-6)}`,
      employeeId: currentExtension.id,
      employeeName: currentExtension.name,
      employeeExtension: currentExtension.extension,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      subject: sub.trim(),
      sender: sender.trim() || 'Client / Vendor Contact',
      recipient: recipient.trim() || currentExtension.email,
      category,
      projectBranch: projectBranch.trim(),
      vendorId: matchedVendor?.id,
      vendorName: matchedVendor?.name,
      threadReference: threadRef.trim() || `Gmail Ref #${Date.now()}`,
      actionTaken: actionTaken.trim() || 'Email reviewed and logged to project workspace.',
      status,
      pendingAction: pendingAction.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveEmailRecord(record);
    setIsModalOpen(false);
    onShowToast(`Gmail work entry "${record.subject}" saved!`, 'success');
  };

  const filteredRecords = emailRecords.filter((rec) => {
    const matchesCategory = categoryFilter === 'all' || rec.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesEmp = employeeFilter === 'all' || rec.employeeId === employeeFilter;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory && matchesStatus && matchesEmp;

    const matchesSearch =
      rec.subject.toLowerCase().includes(query) ||
      rec.sender.toLowerCase().includes(query) ||
      rec.recipient.toLowerCase().includes(query) ||
      rec.projectBranch.toLowerCase().includes(query) ||
      (rec.vendorName && rec.vendorName.toLowerCase().includes(query)) ||
      rec.threadReference.toLowerCase().includes(query) ||
      rec.actionTaken.toLowerCase().includes(query) ||
      rec.employeeName.toLowerCase().includes(query);

    return matchesCategory && matchesStatus && matchesEmp && matchesSearch;
  });

  const getStatusBadge = (s: EmailWorkStatus) => {
    switch (s) {
      case 'Awaiting Reply':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Reply Received':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Action Needed':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Resolved / Closed':
        return 'bg-slate-700/30 text-slate-400 border-slate-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryBadge = (cat: EmailCategory) => {
    switch (cat) {
      case 'Quotation Request':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Quotation Received':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Client Approval':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Work Order / PO':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Technical Spec Clarification':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                Gmail & Work Correspondence
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400">Engineering Work Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Mail className="w-7 h-7 text-indigo-400 shrink-0" />
              <span>Email-Related Work & Gmail Activity</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Log, track, and review all Gmail client correspondences, RFQs, vendor quotations, work order approvals, and technical drawing clarifications associated with engineering projects.
            </p>
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer self-start lg:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Gmail Activity</span>
          </button>
        </div>

        {/* Integration Status Notice */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Gmail Integration Status:</span>{' '}
              <span className="text-emerald-400 font-medium">Manual Activity Logging (Active)</span>.
              <span className="text-slate-400 ml-1.5 hidden sm:inline">
                Direct OAuth 2.0 mailbox sync is planned for Phase 2 once enterprise Google Workspace admin consent is granted.
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 self-start sm:self-auto">
            Design for Future OAuth Sync
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email subject, sender, client branch, vendor, or thread ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Email Categories</option>
            <option value="Quotation Request">Quotation Request</option>
            <option value="Quotation Received">Quotation Received</option>
            <option value="Client Approval">Client Approval</option>
            <option value="Work Order / PO">Work Order / PO</option>
            <option value="Technical Spec Clarification">Technical Clarification</option>
            <option value="Site Progress Report">Site Progress Report</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="Awaiting Reply">Awaiting Reply</option>
            <option value="Reply Received">Reply Received</option>
            <option value="Approved">Approved</option>
            <option value="Action Needed">Action Needed</option>
            <option value="Resolved / Closed">Resolved / Closed</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Employees</option>
            {extensions.map((ext) => (
              <option key={ext.id} value={ext.id}>
                {ext.name} (Ext {ext.extension})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Email Records Cards / List */}
      <div className="space-y-3">
        {filteredRecords.map((rec) => (
          <div
            key={rec.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg transition"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(rec.category)}`}>
                    {rec.category}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(rec.status)}`}>
                    {rec.status}
                  </span>

                  <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {rec.threadReference}
                  </span>

                  <span className="text-xs text-slate-400 ml-auto">
                    {rec.date} at {rec.time}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {rec.subject}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500">From:</span> <strong className="text-slate-200">{rec.sender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">To:</span> <strong className="text-slate-200">{rec.recipient}</strong>
                  </div>
                </div>

                <div className="mt-2 text-xs flex items-center gap-2 text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Project / Site: <strong className="text-slate-200">{rec.projectBranch}</strong></span>
                  {rec.vendorName && (
                    <>
                      <span>•</span>
                      <span>Vendor: <strong className="text-amber-400">{rec.vendorName}</strong></span>
                    </>
                  )}
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="text-slate-400 font-semibold mb-0.5">Action Taken:</div>
                  <div className="text-slate-200 leading-relaxed">{rec.actionTaken}</div>

                  {rec.pendingAction && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-amber-300">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <span className="font-semibold">Pending Next Action:</span> {rec.pendingAction}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Dropdown & Actions */}
              <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-right text-xs">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Logged By:</div>
                  <div className="font-bold text-slate-200">{rec.employeeName}</div>
                  <div className="text-[10px] text-indigo-400 font-mono">Ext {rec.employeeExtension}</div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={rec.status}
                    onChange={(e) => onUpdateEmailStatus(rec.id, e.target.value as EmailWorkStatus)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="Awaiting Reply">Awaiting Reply</option>
                    <option value="Reply Received">Reply Received</option>
                    <option value="Approved">Approved</option>
                    <option value="Action Needed">Action Needed</option>
                    <option value="Resolved / Closed">Resolved / Closed</option>
                  </select>

                  <button
                    onClick={() => openAddModal(rec)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Edit email entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            No email activities match your filter criteria. Click "Log Gmail Activity" to record a correspondence.
          </div>
        )}
      </div>

      {/* LOG GMAIL ACTIVITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <span>{editingRecord ? 'Edit Gmail Activity' : 'Record Gmail Work Activity'}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Email Subject *</label>
                <input
                  type="text"
                  required
                  value={sub}
                  onChange={(e) => setSub(e.target.value)}
                  placeholder="e.g. RFQ Response: Schneider 100A MCCB Switchgear for HBL Main Gulberg"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Sender Email / Name *</label>
                  <input
                    type="text"
                    required
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="e.g. procurement@bank.com or vendor@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Recipient Email</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. tariq.mehmood@fastconnect.internal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Activity Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EmailCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Quotation Request">Quotation Request (RFQ)</option>
                    <option value="Quotation Received">Quotation Received</option>
                    <option value="Client Approval">Client Approval</option>
                    <option value="Work Order / PO">Work Order / PO</option>
                    <option value="Technical Spec Clarification">Technical Spec Clarification</option>
                    <option value="Site Progress Report">Site Progress Report</option>
                    <option value="General Follow-up">General Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Thread Reference / Link</label>
                  <input
                    type="text"
                    value={threadRef}
                    onChange={(e) => setThreadRef(e.target.value)}
                    placeholder="e.g. Gmail Thread #GM-HBL-2026-8491"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Project Site / Branch *</label>
                  <input
                    type="text"
                    required
                    value={projectBranch}
                    onChange={(e) => setProjectBranch(e.target.value)}
                    placeholder="e.g. HBL Main Gulberg - 100A Switchgear Replacement"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Associated Vendor (Optional)</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None / Direct Client</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Action Taken *</label>
                <textarea
                  rows={2}
                  required
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Detail what was reviewed, quoted, approved, or communicated..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Pending Next Action (If Any)</label>
                  <input
                    type="text"
                    value={pendingAction}
                    onChange={(e) => setPendingAction(e.target.value)}
                    placeholder="e.g. Forward comparative quotes to branch manager"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Current Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as EmailWorkStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Awaiting Reply">Awaiting Reply</option>
                    <option value="Reply Received">Reply Received</option>
                    <option value="Approved">Approved</option>
                    <option value="Action Needed">Action Needed</option>
                    <option value="Resolved / Closed">Resolved / Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Email Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
