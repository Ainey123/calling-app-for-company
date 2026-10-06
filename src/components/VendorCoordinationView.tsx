import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  PhoneCall, 
  MapPin, 
  Star, 
  Plus, 
  ExternalLink, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Filter, 
  Phone, 
  Mail, 
  Tag, 
  DollarSign, 
  Calendar,
  X,
  Edit3,
  Trash2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vendor, VendorQuotation, QuotationStatus, EmployeeExtension } from '../types';

interface VendorCoordinationViewProps {
  vendors: Vendor[];
  quotations: VendorQuotation[];
  currentExtension: EmployeeExtension;
  onCallNumber: (number: string, name: string, org?: string, branch?: string) => void;
  onSaveVendor: (vendor: Vendor) => Promise<void>;
  onDeleteVendor?: (vendorId: string) => Promise<void>;
  onSaveQuotation: (quote: VendorQuotation) => Promise<void>;
  onUpdateQuotationStatus: (quoteId: string, status: QuotationStatus) => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const VendorCoordinationView: React.FC<VendorCoordinationViewProps> = ({
  vendors,
  quotations,
  currentExtension,
  onCallNumber,
  onSaveVendor,
  onDeleteVendor,
  onSaveQuotation,
  onUpdateQuotationStatus,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'quotations' | 'history'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(vendors[0] || null);

  // New Vendor Modal
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vName, setVName] = useState('');
  const [vContactPerson, setVContactPerson] = useState('');
  const [vTrade, setVTrade] = useState('');
  const [vCategory, setVCategory] = useState('Electrical');
  const [vPhone, setVPhone] = useState('');
  const [vAltPhone, setVAltPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vCity, setVCity] = useState('Lahore');
  const [vArea, setVArea] = useState('');
  const [vAddress, setVAddress] = useState('');
  const [vMapsUrl, setVMapsUrl] = useState('');
  const [vSource, setVSource] = useState('Google Search');
  const [vNotes, setVNotes] = useState('');
  const [vAssociatedProjects, setVAssociatedProjects] = useState('');

  // New Quotation Modal
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [qVendorId, setQVendorId] = useState(vendors[0]?.id || '');
  const [qProject, setQProject] = useState('HBL Main Gulberg - 100A Switchgear Replacement');
  const [qScope, setQScope] = useState('');
  const [qAmount, setQAmount] = useState<number | ''>('');
  const [qStatus, setQStatus] = useState<QuotationStatus>('RFQ Sent');
  const [qValidUntil, setQValidUntil] = useState('');
  const [qNotes, setQNotes] = useState('');

  const openAddVendorModal = (vendorToEdit?: Vendor) => {
    if (vendorToEdit) {
      setEditingVendor(vendorToEdit);
      setVName(vendorToEdit.name);
      setVContactPerson(vendorToEdit.contactPerson);
      setVTrade(vendorToEdit.trade);
      setVCategory(vendorToEdit.category);
      setVPhone(vendorToEdit.phone);
      setVAltPhone(vendorToEdit.alternatePhone || '');
      setVEmail(vendorToEdit.email || '');
      setVCity(vendorToEdit.city);
      setVArea(vendorToEdit.area);
      setVAddress(vendorToEdit.address || '');
      setVMapsUrl(vendorToEdit.googleMapsUrl || '');
      setVSource(vendorToEdit.source || 'Google Search');
      setVNotes(vendorToEdit.notes || '');
      setVAssociatedProjects(vendorToEdit.associatedProjects ? vendorToEdit.associatedProjects.join(', ') : '');
    } else {
      setEditingVendor(null);
      setVName('');
      setVContactPerson('');
      setVTrade('');
      setVCategory('Electrical');
      setVPhone('');
      setVAltPhone('');
      setVEmail('');
      setVCity('Lahore');
      setVArea('');
      setVAddress('');
      setVMapsUrl('');
      setVSource('Google Search');
      setVNotes('');
      setVAssociatedProjects('');
    }
    setIsAddVendorOpen(true);
  };

  const handleSaveVendorForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vPhone.trim()) {
      onShowToast('Vendor name and phone number are required', 'error');
      return;
    }

    const projectsList = vAssociatedProjects
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const generatedMapsUrl = vMapsUrl.trim() 
      ? vMapsUrl.trim() 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vName} ${vArea} ${vCity}`)}`;

    const newVendor: Vendor = {
      id: editingVendor ? editingVendor.id : `v-${Date.now()}`,
      name: vName.trim(),
      contactPerson: vContactPerson.trim() || 'Vendor Representative',
      trade: vTrade.trim() || 'General Engineering Contractor',
      category: vCategory as any,
      phone: vPhone.trim(),
      alternatePhone: vAltPhone.trim() || undefined,
      email: vEmail.trim() || undefined,
      city: vCity.trim() || 'Lahore',
      area: vArea.trim() || 'Commercial District',
      address: vAddress.trim() || undefined,
      googleMapsUrl: generatedMapsUrl,
      source: vSource.trim() || 'Google Maps',
      rating: editingVendor ? editingVendor.rating : 4.8,
      jobsCompleted: editingVendor ? editingVendor.jobsCompleted : 1,
      avgResponseMinutes: editingVendor ? editingVendor.avgResponseMinutes : 30,
      status: editingVendor ? editingVendor.status : 'Available Now',
      emergencyContractor: editingVendor ? editingVendor.emergencyContractor : false,
      associatedProjects: projectsList.length > 0 ? projectsList : undefined,
      activeQuotationsCount: editingVendor ? editingVendor.activeQuotationsCount : 0,
      notes: vNotes.trim() || undefined,
    };

    await onSaveVendor(newVendor);
    setIsAddVendorOpen(false);
    setSelectedVendor(newVendor);
    onShowToast(`Vendor ${newVendor.name} saved successfully`, 'success');
  };

  const handleSaveQuotationForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorObj = vendors.find((v) => v.id === qVendorId) || vendors[0];
    if (!vendorObj) {
      onShowToast('Please select a valid vendor', 'error');
      return;
    }

    const newQuote: VendorQuotation = {
      id: `QT-${Date.now().toString().slice(-4)}`,
      vendorId: vendorObj.id,
      vendorName: vendorObj.name,
      projectBranch: qProject.trim(),
      scopeDescription: qScope.trim() || 'Scope details to be finalized based on site survey.',
      amountPkr: typeof qAmount === 'number' ? qAmount : undefined,
      status: qStatus,
      requestedByEmployeeId: currentExtension.id,
      requestedByEmployeeName: currentExtension.name,
      validUntil: qValidUntil || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes: qNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveQuotation(newQuote);
    setIsAddQuoteOpen(false);
    setQScope('');
    setQAmount('');
    setQNotes('');
    onShowToast(`Quotation ${newQuote.id} for ${vendorObj.name} recorded!`, 'success');
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesCategory = categoryFilter === 'all' || v.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesCity = cityFilter === 'all' || v.city.toLowerCase() === cityFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory && matchesCity;

    const matchesSearch =
      v.name.toLowerCase().includes(query) ||
      v.contactPerson.toLowerCase().includes(query) ||
      v.trade.toLowerCase().includes(query) ||
      v.phone.toLowerCase().includes(query) ||
      v.area.toLowerCase().includes(query) ||
      (v.address && v.address.toLowerCase().includes(query)) ||
      (v.associatedProjects && v.associatedProjects.some((p) => p.toLowerCase().includes(query)));

    return matchesCategory && matchesCity && matchesSearch;
  });

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'RFQ Sent':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Quotation Received':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Under Engineering Review':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Approved by Client':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'PO Issued':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
              Engineering Vendor Matrix
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400">Google Maps Grounded & Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-amber-400 shrink-0" />
            <span>Vendor Coordination & Quotations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Manage local engineering contractors, workshops, and specialized suppliers. Track vendor contact history, request RFQs, inspect quotations, and associate vendors with client branches and project sites.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAddQuoteOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Record Quotation / RFQ</span>
          </button>

          <button
            onClick={() => openAddVendorModal()}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Directory vs Quotations Tracker */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vendor Directory ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quotations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'quotations'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Quotations & RFQs ({quotations.length})</span>
        </button>
      </div>

      {/* TAB 1: VENDOR DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor name, contact person, trade, area, or associated project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Disciplines / Trades</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC / Cooling">HVAC / Cooling</option>
                <option value="Generator & Backup">Generator & Backup</option>
                <option value="Civil & Structural">Civil & Structural</option>
                <option value="MEP & Plumbing">MEP & Plumbing</option>
              </select>

              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Cities</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Islamabad">Islamabad</option>
              </select>
            </div>
          </div>

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => {
              const vendorQuotes = quotations.filter((q) => q.vendorId === vendor.id);
              const mapsUrl = vendor.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vendor.name} ${vendor.area} ${vendor.city}`)}`;
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${vendor.name} ${vendor.city} Pakistan`)}`;

              return (
                <div
                  key={vendor.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {vendor.category}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5 leading-snug group-hover:text-amber-300 transition">
                          {vendor.name}
                        </h3>
                        <div className="text-xs text-slate-300 font-medium">
                          Contact: <strong className="text-white">{vendor.contactPerson}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          vendor.status === 'Available Now'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {vendor.status}
                        </span>
                        <button
                          onClick={() => openAddVendorModal(vendor)}
                          className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                          title="Edit vendor profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Trade / Specialty */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                      <div className="text-[11px] text-slate-400 font-medium">Specialty:</div>
                      <div className="text-slate-200 font-semibold mt-0.5">{vendor.trade}</div>
                    </div>

                    {/* Location & Google Maps Link */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-200">{vendor.area}, {vendor.city}</span>
                          {vendor.address && <div className="text-[11px] text-slate-400 truncate">{vendor.address}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline decoration-indigo-400/40 hover:decoration-indigo-300"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Google Maps View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>

                        <a
                          href={searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          <span>Google Search Source</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Associated Projects */}
                    {vendor.associatedProjects && vendor.associatedProjects.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                          Project / Branch Sites:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {vendor.associatedProjects.map((proj, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                            >
                              {proj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer & Softphone Dial Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <div className="font-mono text-slate-400 text-[11px]">Direct Line:</div>
                      <div className="font-mono font-bold text-white text-xs">{vendor.phone}</div>
                    </div>

                    <button
                      onClick={() => onCallNumber(vendor.phone, vendor.name, 'Vendor Coordination', vendor.city)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Softphone Dial</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QUOTATIONS TRACKER */}
      {activeSubTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Vendor Quotation & RFQ Pipeline</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track formal vendor quotes, RFQ submissions, negotiated rates in PKR, and client approvals.
              </p>
            </div>

            <button
              onClick={() => setIsAddQuoteOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Quote</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Ref / Quote ID</th>
                    <th className="p-3.5">Vendor Name</th>
                    <th className="p-3.5">Project / Branch Site</th>
                    <th className="p-3.5">Scope & Parts Description</th>
                    <th className="p-3.5">Amount (PKR)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Engineer</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {quotations.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-400">
                        {quote.id}
                      </td>

                      <td className="p-3.5 font-bold text-white">
                        <div>{quote.vendorName}</div>
                        {quote.emailReferenceId && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            Ref: {quote.emailReferenceId}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 font-medium text-slate-200">
                        {quote.projectBranch}
                      </td>

                      <td className="p-3.5 max-w-xs text-slate-300">
                        <div className="truncate" title={quote.scopeDescription}>
                          {quote.scopeDescription}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {quote.amountPkr ? `PKR ${quote.amountPkr.toLocaleString()}` : 'Pending Quote'}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(quote.status)}`}>
                          {quote.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-400">
                        {quote.requestedByEmployeeName}
                      </td>

                      <td className="p-3.5 text-right">
                        <select
                          value={quote.status}
                          onChange={(e) => onUpdateQuotationStatus(quote.id, e.target.value as QuotationStatus)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="RFQ Sent">RFQ Sent</option>
                          <option value="Quotation Received">Quotation Received</option>
                          <option value="Under Engineering Review">Under Review</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Approved by Client">Approved</option>
                          <option value="PO Issued">PO Issued</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {quotations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No vendor quotations recorded yet. Click "Record Quotation / RFQ" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT VENDOR MODAL */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>{editingVendor ? 'Edit Engineering Vendor' : 'Add Local Engineering Vendor'}</span>
              </h2>
              <button onClick={() => setIsAddVendorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendorForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Vendor Firm / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    placeholder="e.g. Lahore Power Fixers"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={vContactPerson}
                    onChange={(e) => setVContactPerson(e.target.value)}
                    placeholder="e.g. Tariq Hussain"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Engineering Discipline / Category</label>
                  <select
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC / Cooling">HVAC / Cooling</option>
                    <option value="Generator & Backup">Generator & Backup</option>
                    <option value="Civil & Structural">Civil & Structural</option>
                    <option value="MEP & Plumbing">MEP & Plumbing</option>
                    <option value="Automation & Controls">Automation & Controls</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Specific Trade / Skill</label>
                  <input
                    type="text"
                    value={vTrade}
                    onChange={(e) => setVTrade(e.target.value)}
                    placeholder="e.g. Certified Commercial Switchgear Electrician"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Primary Phone (Softphone Dial) *</label>
                  <input
                    type="text"
                    required
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Alternate Phone / Landline</label>
                  <input
                    type="text"
                    value={vAltPhone}
                    onChange={(e) => setVAltPhone(e.target.value)}
                    placeholder="+92 42 35789012"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">City</label>
                  <select
                    value={vCity}
                    onChange={(e) => setVCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Area / Market</label>
                  <input
                    type="text"
                    value={vArea}
                    onChange={(e) => setVArea(e.target.value)}
                    placeholder="e.g. Main Gulberg / DHA Phase 3"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Physical Address / Workshop Location</label>
                <input
                  type="text"
                  value={vAddress}
                  onChange={(e) => setVAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Commercial Market, Main Boulevard Gulberg II, Lahore"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Google Maps Link (Optional, auto-generated if blank)</label>
                <input
                  type="url"
                  value={vMapsUrl}
                  onChange={(e) => setVMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Associated Projects / Client Branches (comma-separated)</label>
                <input
                  type="text"
                  value={vAssociatedProjects}
                  onChange={(e) => setVAssociatedProjects(e.target.value)}
                  placeholder="e.g. HBL Main Gulberg, Allied Bank Model Town"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Notes / Equipment Authorization</label>
                <textarea
                  rows={2}
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  placeholder="Parts availability, warranty terms, certifications..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD QUOTATION MODAL */}
      {isAddQuoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Record Vendor Quotation / RFQ</span>
              </h2>
              <button onClick={() => setIsAddQuoteOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotationForm} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Select Vendor *</label>
                <select
                  required
                  value={qVendorId}
                  onChange={(e) => setQVendorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city} - {v.trade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Project Site / Client Branch *</label>
                <input
                  type="text"
                  required
                  value={qProject}
                  onChange={(e) => setQProject(e.target.value)}
                  placeholder="e.g. HBL Main Gulberg - 100A Switchgear Replacement"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Quoted Scope & Technical Description *</label>
                <textarea
                  rows={2}
                  required
                  value={qScope}
                  onChange={(e) => setQScope(e.target.value)}
                  placeholder="Detailed parts supply, labor, warranty specifications..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Quoted Amount (PKR)</label>
                  <input
                    type="number"
                    value={qAmount}
                    onChange={(e) => setQAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 145000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Pipeline Status</label>
                  <select
                    value={qStatus}
                    onChange={(e) => setQStatus(e.target.value as QuotationStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="RFQ Sent">RFQ Sent</option>
                    <option value="Quotation Received">Quotation Received</option>
                    <option value="Under Engineering Review">Under Engineering Review</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Approved by Client">Approved by Client</option>
                    <option value="PO Issued">PO Issued</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Notes / Payment Terms</label>
                <input
                  type="text"
                  value={qNotes}
                  onChange={(e) => setQNotes(e.target.value)}
                  placeholder="e.g. 50% advance on PO, 50% on client signoff."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddQuoteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
