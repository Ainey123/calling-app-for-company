import React, { useState } from 'react';
import { 
  TicketCheck, 
  Plus, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Sparkles, 
  Send, 
  Copy, 
  ExternalLink,
  User,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  Search,
  X,
  Smartphone
} from 'lucide-react';
import { ComplaintTicket, TicketStatus, TicketPriority, Vendor, EmployeeExtension } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TicketsViewProps {
  tickets: ComplaintTicket[];
  vendors: Vendor[];
  currentExtension: EmployeeExtension;
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string | null) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onAssignVendor: (ticketId: string, vendor: Vendor) => void;
  onRecordVendorResponse: (ticketId: string, response: { eta: string; technician: string; notes: string; quote?: string }) => void;
  onCallNumber: (number: string, name: string, org?: string, branch?: string) => void;
  onCreateNewTicket: (ticket: Partial<ComplaintTicket>) => void;
  onOpenSimCallingTab?: (phone?: string, name?: string, org?: string, branch?: string, ticketId?: string) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  vendors,
  currentExtension,
  selectedTicketId,
  onSelectTicket,
  onUpdateTicketStatus,
  onAssignVendor,
  onRecordVendorResponse,
  onCallNumber,
  onCreateNewTicket,
  onOpenSimCallingTab,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileTicketPane, setMobileTicketPane] = useState<'list' | 'details'>('list');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftResult, setDraftResult] = useState<{ smsText: string; emailSubject: string; emailBody: string } | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  // Vendor response form state
  const [vendorEta, setVendorEta] = useState('20-25 minutes');
  const [vendorTech, setVendorTech] = useState('Tariq Hussain & Apprentice');
  const [vendorQuote, setVendorQuote] = useState('PKR 8,500 + parts');
  const [vendorNotes, setVendorNotes] = useState('En route with replacement 63A breakers and multimeter.');

  // New ticket state
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('Habib Bank Limited (HBL)');
  const [newBranch, setNewBranch] = useState('Main Gulberg Branch');
  const [newCity, setNewCity] = useState('Lahore');
  const [newPhone, setNewPhone] = useState('+92 42 35789012');
  const [newCategory, setNewCategory] = useState<'Electrical' | 'HVAC / Cooling' | 'Generator & Backup'>('Electrical');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Critical');
  const [newDescription, setNewDescription] = useState('');

  const currentTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'New':
        return 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
      case 'In Progress':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      case 'Vendor Assigned':
        return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
      case 'Vendor On-Site':
        return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      case 'Closed':
        return 'bg-slate-700/30 text-slate-400 border border-slate-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold';
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Low':
        return 'bg-slate-700/20 text-slate-400 border border-slate-700/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesStatus;

    const matchesSearch =
      (t.clientName && t.clientName.toLowerCase().includes(query)) ||
      (t.clientPhone && t.clientPhone.toLowerCase().includes(query)) ||
      (t.organization && t.organization.toLowerCase().includes(query)) ||
      (t.branchName && t.branchName.toLowerCase().includes(query)) ||
      (t.title && t.title.toLowerCase().includes(query)) ||
      (t.id && t.id.toLowerCase().includes(query)) ||
      (t.city && t.city.toLowerCase().includes(query)) ||
      (t.assignedAgentName && t.assignedAgentName.toLowerCase().includes(query)) ||
      (t.assignedVendor?.name && t.assignedVendor.name.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.linkedCalls && t.linkedCalls.some(c => c.callerNumber.toLowerCase().includes(query) || c.callerName.toLowerCase().includes(query)));

    return matchesStatus && matchesSearch;
  });

  const handleGenerateDraft = async () => {
    if (!currentTicket) return;
    setIsDrafting(true);
    try {
      const res = await fetch('/api/ai/draft-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: currentTicket.id,
          clientName: currentTicket.clientName,
          branch: `${currentTicket.branchName}, ${currentTicket.city}`,
          vendorName: currentTicket.assignedVendor?.name || 'Tariq Electrician',
          eta: vendorEta || '25 minutes',
          status: currentTicket.status,
          issue: currentTicket.title,
        }),
      });
      const data = await res.json();
      setDraftResult(data);
      setShowDraftModal(true);
    } catch {
      setDraftResult({
        smsText: `[FAST Connect] Ticket ${currentTicket.id}: Electrician dispatched for ${currentTicket.branchName}. ETA: 25 mins. Support: 042-111-3278.`,
        emailSubject: `Update on Ticket ${currentTicket.id}: Vendor Dispatched for ${currentTicket.branchName}`,
        emailBody: `Dear ${currentTicket.clientName},\n\nWe have dispatched contractor ${currentTicket.assignedVendor?.name || 'Lahore Power Fixers'}.\nArrival ETA: 25 minutes.\n\nFAST Connect Dispatch Desk`
      });
      setShowDraftModal(true);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateNewTicket({
      title: newTitle || `${newOrg} - ${newBranch} ${newCategory} Issue`,
      organization: newOrg,
      branchName: newBranch,
      city: newCity,
      clientName: 'Branch In-Charge',
      clientPhone: newPhone,
      clientEmail: 'operations@bank.internal',
      category: newCategory,
      priority: newPriority,
      status: 'New',
      description: newDescription || 'Client reported sudden operational issue requiring technical support.',
      assignedExtension: currentExtension.extension,
      assignedAgentName: currentExtension.name,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: 'Just now',
          actor: currentExtension.name,
          action: 'Complaint Ticket Created',
          note: `Initial priority set to ${newPriority}.`
        }
      ],
      linkedCalls: []
    });
    setShowNewTicketModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 min-w-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 
              className="font-extrabold text-white tracking-tight leading-tight [overflow-wrap:anywhere]"
              style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
            >
              Complaint & Service Tickets
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono shrink-0">
              {tickets.length} Active Tickets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl [overflow-wrap:anywhere] leading-relaxed">
            Connect telephone calls with customer tickets, dispatch local technicians, and update complaint progress in real-time.
          </p>
        </div>

        {/* Search Bar & Actions */}
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

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Status Filters Bar: Horizontally scrollable container that never causes page horizontal scroll */}
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden pb-1 min-w-0">
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs w-max min-w-max">
          {[
            { id: 'all', label: 'All' },
            { id: 'New', label: 'New' },
            { id: 'In Progress', label: 'In Progress' },
            { id: 'Vendor Assigned', label: 'Vendor Assigned' },
            { id: 'Resolved', label: 'Resolved' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg transition font-medium whitespace-nowrap cursor-pointer ${
                statusFilter.toLowerCase() === st.id.toLowerCase()
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Search / Filter Status Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
          <span>
            Filtering tickets for: <strong className="text-white font-mono">"{searchQuery}"</strong> ({filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'} found)
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

      {/* Mobile Tab Switcher between Ticket Queue and Workspace: Stacked on narrow screens, equal width on tablet */}
      <div className="lg:hidden w-full max-w-full min-w-0 mb-3">
        <div className="flex flex-col sm:flex-row gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold w-full">
          <button
            onClick={() => setMobileTicketPane('list')}
            className={`w-full sm:flex-1 py-2 px-3 text-center rounded-lg transition break-words ${
              mobileTicketPane === 'list'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ticket Queue ({filteredTickets.length})
          </button>
          <button
            onClick={() => setMobileTicketPane('details')}
            className={`w-full sm:flex-1 py-2 px-3 text-center rounded-lg transition break-words ${
              mobileTicketPane === 'details'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentTicket ? `Workspace (${currentTicket.id})` : 'Ticket Workspace'}
          </button>
        </div>
      </div>

      {/* Main 2-Column CRM Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        {/* Left Column: Tickets Queue (5 cols) */}
        <div className={`lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full min-w-0 ${
          mobileTicketPane === 'details' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>TICKET QUEUE ({filteredTickets.length})</span>
            <span>STATUS & PRIORITY</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[640px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <TicketCheck className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-white">
                  {searchQuery ? 'No Matching Tickets Found' : 'No Tickets in Queue'}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {searchQuery
                    ? `No tickets matched your search query "${searchQuery}". Try searching for another customer name, phone number, or branch.`
                    : 'No complaint tickets in the active queue. Click "Create Ticket" above or link an incoming call from the softphone to log new customer service cases in Firestore.'}
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
              filteredTickets.map((ticket) => {
              const isSelected = currentTicket?.id === ticket.id;

              return (
                <motion.div
                  key={ticket.id}
                  onClick={() => {
                    onSelectTicket(ticket.id);
                    setMobileTicketPane('details');
                  }}
                  whileHover={{ y: -2, scale: 1.004, boxShadow: '0 6px 20px -2px rgba(0, 0, 0, 0.35)' }}
                  whileTap={{ scale: 0.992 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`p-4 transition-colors cursor-pointer w-full max-w-full min-w-0 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-l-4 border-indigo-500 shadow-md'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 shrink-0">
                          {ticket.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${getPriorityBadge(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-white mt-1 break-words [overflow-wrap:anywhere] leading-snug">
                        {ticket.title}
                      </h3>
                      <div className="text-xs text-slate-400 font-medium mt-0.5 break-words [overflow-wrap:anywhere]">
                        {ticket.organization} • {ticket.branchName}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getStatusBadge(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 break-words [overflow-wrap:anywhere] leading-relaxed line-clamp-3">
                    {ticket.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{ticket.createdAt}</span>
                    </span>
                    <span className="text-slate-400 shrink-0">
                      {ticket.linkedCalls.length} Call{ticket.linkedCalls.length !== 1 ? 's' : ''} Linked
                    </span>
                  </div>
                </motion.div>
              );
            }))}
          </div>
        </div>

        {/* Right Column: Detailed Ticket Workspace & Actions (7 cols) */}
        <div className={`lg:col-span-7 space-y-5 w-full min-w-0 ${mobileTicketPane === 'list' ? 'hidden lg:block' : 'block'}`}>
          {currentTicket ? (
            <motion.div
              key={currentTicket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6"
            >
              {/* Mobile Back Button */}
              <button
                onClick={() => setMobileTicketPane('list')}
                className="lg:hidden flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mb-1 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span>← Back to Ticket Queue</span>
              </button>

              {/* Ticket Header & Status Selector */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentTicket.id}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{currentTicket.category}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">Assigned Ext {currentTicket.assignedExtension} ({currentTicket.assignedAgentName.split(' ')[0]})</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-white mt-2 leading-snug">
                    {currentTicket.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-slate-300">{currentTicket.organization}</span>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{currentTicket.branchName}, {currentTicket.city}</span>
                  </div>
                </div>

                {/* Status Switcher Dropdown */}
                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Update Status:</span>
                  <select
                    value={currentTicket.status}
                    onChange={(e) => onUpdateTicketStatus(currentTicket.id, e.target.value as TicketStatus)}
                    className="p-2 text-xs font-semibold bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Vendor Assigned">Vendor Assigned</option>
                    <option value="Vendor On-Site">Vendor On-Site</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Call Client & Call Vendor Quick Action Bar */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Direct PBX & Cellular SIM Calling</div>
                    <div className="text-[11px] text-slate-400 truncate">Dial client or contractor via Business PBX Trunk or Cellular SIM 1/2</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Call Client via PBX */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onCallNumber(
                      currentTicket.clientPhone,
                      currentTicket.clientName,
                      currentTicket.organization,
                      currentTicket.branchName
                    )}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Dial client via PBX Softphone"
                  >
                    <PhoneOutgoing className="w-3.5 h-3.5 shrink-0" />
                    <span>PBX Call Client</span>
                  </motion.button>

                  {/* Call Client via SIM */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onOpenSimCallingTab) {
                        onOpenSimCallingTab(
                          currentTicket.clientPhone,
                          currentTicket.clientName,
                          currentTicket.organization,
                          currentTicket.branchName,
                          currentTicket.id
                        );
                      } else {
                        const clean = currentTicket.clientPhone.replace(/[^0-9+]/g, '');
                        window.location.href = `tel:${clean}`;
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    title="Launch Cellular SIM Call Form"
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>SIM Call ({currentTicket.clientPhone})</span>
                  </motion.button>

                  {currentTicket.assignedVendor && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (onOpenSimCallingTab) {
                          onOpenSimCallingTab(
                            currentTicket.assignedVendor!.phone,
                            currentTicket.assignedVendor!.name,
                            'Assigned Contractor',
                            currentTicket.city,
                            currentTicket.id
                          );
                        } else {
                          onCallNumber(
                            currentTicket.assignedVendor!.phone,
                            currentTicket.assignedVendor!.name,
                            'Assigned Contractor',
                            currentTicket.city
                          );
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 shrink-0" />
                      <span>Call Electrician / Vendor</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Description Card */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Issue Description & Incident Details
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {currentTicket.description}
                </div>
              </div>

              {/* Assigned Vendor & Dispatch Section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Contractor & Vendor Dispatch
                    </span>
                  </div>

                  <button
                    onClick={() => setShowVendorModal(true)}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{currentTicket.assignedVendor ? 'Record Vendor Response / Reassign' : 'Assign Local Electrician'}</span>
                  </button>
                </div>

                {currentTicket.assignedVendor ? (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{currentTicket.assignedVendor.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                            Rating {currentTicket.assignedVendor.rating} ★
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {currentTicket.assignedVendor.trade} • {currentTicket.assignedVendor.area}
                        </div>
                        <div className="text-xs font-mono text-emerald-400 font-bold mt-1">
                          Phone: {currentTicket.assignedVendor.phone}
                        </div>
                      </div>

                      <button
                        onClick={() => onCallNumber(
                          currentTicket.assignedVendor!.phone,
                          currentTicket.assignedVendor!.name,
                          'Assigned Contractor',
                          currentTicket.city
                        )}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Call Vendor
                      </button>
                    </div>

                    {/* Latest Vendor Response if recorded */}
                    {currentTicket.vendorResponses && currentTicket.vendorResponses.length > 0 && (
                      <div className="mt-2.5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-amber-300 flex items-center justify-between">
                          <span>Recorded Vendor Response:</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {currentTicket.vendorResponses[0].recordedAt}
                          </span>
                        </div>
                        <div className="text-slate-300">
                          <strong>Arrival ETA:</strong> {currentTicket.vendorResponses[0].eta}
                        </div>
                        <div className="text-slate-300">
                          <strong>Technician:</strong> {currentTicket.vendorResponses[0].technicianAssigned}
                        </div>
                        <div className="text-slate-400 italic">
                          "{currentTicket.vendorResponses[0].notes}"
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span>No contractor assigned yet. Dispatch certified local vendor in {currentTicket.city}.</span>
                    <button
                      onClick={() => setShowVendorModal(true)}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    >
                      Browse Vendors
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Calls History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneIncoming className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Linked Call Logs & Audio ({currentTicket.linkedCalls.length})</span>
                  </div>
                </div>

                {currentTicket.linkedCalls.length > 0 ? (
                  <div className="space-y-2">
                    {currentTicket.linkedCalls.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              link.direction === 'inbound'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {link.direction === 'inbound' ? <PhoneIncoming className="w-3.5 h-3.5" /> : <PhoneOutgoing className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{link.callerName}</span>
                              <span className="font-mono text-[10px] text-slate-400">({link.callerNumber})</span>
                            </div>
                            <p className="text-slate-300 mt-0.5">{link.summary}</p>
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                          <div>{link.timestamp}</div>
                          <div>{Math.floor(link.durationSeconds / 60)}m {link.durationSeconds % 60}s</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    No calls linked to this ticket yet. Answer or dial a call and link it using the softphone.
                  </div>
                )}
              </div>

              {/* AI Draft Customer SMS/Email Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      AI Customer Communication Assistant
                    </span>
                  </div>

                  <button
                    onClick={handleGenerateDraft}
                    disabled={isDrafting}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isDrafting ? 'Generating Draft...' : 'Draft SMS / Email Update'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Automatically generate concise status updates and technician ETA alerts for {currentTicket.clientName} via SMS or Email.
                </p>
              </div>

              {/* Timeline Audit Trail */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ticket Activity Timeline & Audit Log
                </div>
                <div className="space-y-2.5 border-l-2 border-slate-800 pl-4 ml-2">
                  {currentTicket.timeline.map((event) => (
                    <div key={event.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{event.action}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{event.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">By: {event.actor}</div>
                      {event.note && (
                        <p className="text-slate-300 mt-1 bg-slate-950 p-2 rounded border border-slate-800">
                          {event.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Select a complaint ticket to inspect timeline, vendor response, and linked audio calls.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Vendor Selection & Response Recorder */}
      {showVendorModal && currentTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Assign Vendor & Record Response</h3>
                <p className="text-xs text-slate-400">Select local certified electrician or contractor for {currentTicket.city}</p>
              </div>
              <button
                onClick={() => setShowVendorModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Vendor List Picker */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-400">Available Contractors in {currentTicket.city}:</div>
              {vendors
                .filter(v => v.city.toLowerCase() === currentTicket.city.toLowerCase() || v.category === currentTicket.category)
                .map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => onAssignVendor(currentTicket.id, vendor)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                      currentTicket.assignedVendor?.id === vendor.id
                        ? 'bg-indigo-950/40 border-indigo-500'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{vendor.name}</span>
                        <span className="text-amber-400 font-bold">★ {vendor.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{vendor.trade} • {vendor.area}</div>
                      <div className="font-mono text-[10px] text-emerald-400 mt-0.5">{vendor.phone}</div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px]"
                    >
                      {currentTicket.assignedVendor?.id === vendor.id ? 'Selected' : 'Assign'}
                    </button>
                  </div>
                ))}
            </div>

            {/* Vendor Response Recorder */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white">Record Response from Technician Phone Call:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Arrival ETA:</label>
                  <input
                    type="text"
                    value={vendorEta}
                    onChange={(e) => setVendorEta(e.target.value)}
                    placeholder="e.g. 20-25 mins"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Technician Name:</label>
                  <input
                    type="text"
                    value={vendorTech}
                    onChange={(e) => setVendorTech(e.target.value)}
                    placeholder="e.g. Tariq Electrician"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-400 mb-1">Contractor Notes / Parts Confirmed:</label>
                <input
                  type="text"
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="e.g. Mobilizing with 63A breakers and multimeter."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRecordVendorResponse(currentTicket.id, {
                      eta: vendorEta,
                      technician: vendorTech,
                      notes: vendorNotes,
                      quote: vendorQuote,
                    });
                    setShowVendorModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  Save Vendor Response & Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: AI Notification Draft (SMS/Email) */}
      {showDraftModal && draftResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">AI Generated Client Update</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* SMS Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">Direct SMS Alert:</span>
                <button
                  onClick={() => navigator.clipboard.writeText(draftResult.smsText)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
                {draftResult.smsText}
              </div>
            </div>

            {/* Email Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-400">Formal Email Notification:</span>
                <span className="text-[11px] text-slate-400">To: {currentTicket.clientEmail}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-200">
                <div className="font-bold border-b border-slate-800 pb-1">
                  Subject: {draftResult.emailSubject}
                </div>
                <div className="whitespace-pre-line text-slate-300 leading-relaxed text-[11px]">
                  {draftResult.emailBody}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowDraftModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Complaint Ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTicketSubmit}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Complaint Ticket</h3>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Ticket Title / Short Summary:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. HBL Gulberg - Main Circuit Breaker Trip"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Client Organization:</label>
                  <input
                    type="text"
                    required
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Branch & City:</label>
                  <input
                    type="text"
                    required
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC / Cooling">HVAC / Cooling</option>
                    <option value="Generator & Backup">Generator & Backup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Priority:</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone:</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Problem Description:</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe electrical or facility issues..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Create Complaint Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
