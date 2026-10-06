import React, { useState } from 'react';
import { 
  Users2, 
  Phone, 
  PhoneCall, 
  Building2, 
  MapPin, 
  Star, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck,
  Camera,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  AlertTriangle,
  RotateCcw,
  Mail,
  Key
} from 'lucide-react';
import { EmployeeExtension, Vendor } from '../types';
import { getInitialsAvatar } from '../utils/imageUtils';

interface DirectoryViewProps {
  extensions: EmployeeExtension[];
  vendors: Vendor[];
  currentExtension: EmployeeExtension;
  onSelectExtension: (ext: EmployeeExtension) => void;
  onCallNumber: (number: string, name: string, org?: string, branch?: string) => void;
  onOpenPhotoModal?: (ext: EmployeeExtension) => void;
  onOpenLoginModal?: () => void;
  onNavigateTab?: (tab: any) => void;
  onSaveExtension?: (ext: EmployeeExtension) => void;
  onDeleteExtension?: (id: string) => void;
  onClearAllDatabase?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  extensions,
  vendors,
  currentExtension,
  onSelectExtension,
  onCallNumber,
  onOpenPhotoModal,
  onOpenLoginModal,
  onNavigateTab,
  onSaveExtension,
  onDeleteExtension,
  onClearAllDatabase,
  onShowToast,
}) => {
  // Modal state for Add / Edit Employee
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeExtension | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    extension: '',
    phone: '',
    role: '',
    department: 'Customer Operations',
    email: '',
    pin: '1010',
    shiftHours: '09:00 AM - 05:30 PM',
  });

  // Wipe Demo Data confirmation modal
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);

  // Open Modal for adding new employee
  const handleOpenAddModal = () => {
    // Generate next available extension number
    const maxExt = extensions.reduce((max, e) => {
      const num = parseInt(e.extension, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);
    const nextExt = String(maxExt + 1);

    setEditingEmployee(null);
    setFormData({
      name: '',
      extension: nextExt,
      phone: '+92 300 0000000',
      role: 'Support & Dispatch Executive',
      department: 'Customer Operations',
      email: '',
      pin: '1010',
      shiftHours: '09:00 AM - 05:30 PM',
    });
    setIsEmployeeModalOpen(true);
  };

  // Open Modal for editing existing employee
  const handleOpenEditModal = (ext: EmployeeExtension) => {
    setEditingEmployee(ext);
    setFormData({
      name: ext.name,
      extension: ext.extension,
      phone: ext.phone || '',
      role: ext.role || '',
      department: ext.department || 'Customer Operations',
      email: ext.email || '',
      pin: ext.pin || '1010',
      shiftHours: ext.shiftHours || '09:00 AM - 05:30 PM',
    });
    setIsEmployeeModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.extension.trim()) {
      onShowToast?.('Employee name and extension are required.', 'error');
      return;
    }

    const employeeToSave: EmployeeExtension = {
      id: editingEmployee ? editingEmployee.id : `emp-${formData.extension}-${Date.now()}`,
      extension: formData.extension.trim(),
      name: formData.name.trim(),
      role: formData.role.trim() || 'Operations Executive',
      department: formData.department.trim() || 'General Operations',
      avatar: editingEmployee?.avatar || getInitialsAvatar(formData.name.trim(), formData.extension.trim()),
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
      phone: formData.phone.trim() || '+92 300 0000000',
      status: editingEmployee?.status || 'available',
      activeCallsToday: editingEmployee?.activeCallsToday || 0,
      avgHandlingSeconds: editingEmployee?.avgHandlingSeconds || 180,
      pin: formData.pin.trim() || '1010',
      shiftHours: formData.shiftHours.trim(),
      bio: editingEmployee?.bio || 'Company team member and telephony extension user.',
    };

    onSaveExtension?.(employeeToSave);
    setIsEmployeeModalOpen(false);
  };

  // Delete employee
  const handleDelete = (ext: EmployeeExtension) => {
    if (extensions.length <= 1) {
      onShowToast?.('You must keep at least one active employee extension.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${ext.name} (Ext ${ext.extension})?`)) {
      onDeleteExtension?.(ext.id);
    }
  };

  // Confirm wipe demo data
  const handleConfirmWipe = () => {
    onClearAllDatabase?.();
    setIsWipeModalOpen(false);
    onShowToast?.('All demo calls, tickets, and alerts wiped. Fresh start active!', 'success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Employee Extensions Section Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <h1 
              className="font-extrabold text-white tracking-tight flex items-center gap-2.5 [overflow-wrap:anywhere]"
              style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
            >
              <Users2 className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Employee Extensions & Staff Directory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 [overflow-wrap:anywhere]">
              Manage your company's real staff: set employee names, extension numbers, direct mobile numbers, and assign desk PINs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Add Employee Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Real Employee</span>
            </button>

            {/* Wipe Demo Activity Button */}
            {onClearAllDatabase && (
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Wipe demo calls, tickets, and alerts to start fresh"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Wipe Demo Data</span>
              </button>
            )}

            {onOpenPhotoModal && (
              <button
                type="button"
                onClick={() => onOpenPhotoModal(currentExtension)}
                className="px-3 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>My Photo</span>
              </button>
            )}

            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-indigo-300 border border-slate-800 font-semibold font-mono">
              {extensions.length} Staff
            </span>
          </div>
        </div>

        {/* Extensions Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full min-w-0">
          {extensions.map((ext) => {
            const isCurrent = currentExtension.id === ext.id;

            return (
              <div
                key={ext.id}
                className={`p-5 rounded-2xl border transition shadow-xl relative flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500/80 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Avatar + Status + Extension Badge */}
                <div>
                  <div className="flex items-start justify-between">
                    <div 
                      onClick={() => onOpenPhotoModal?.(ext)}
                      className="relative group cursor-pointer"
                      title="Click to upload custom photo"
                    >
                      <img
                        src={ext.avatar || getInitialsAvatar(ext.name, ext.extension)}
                        alt={ext.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 shadow-md group-hover:ring-indigo-400 transition bg-slate-800"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${
                          ext.status === 'available'
                            ? 'bg-emerald-500'
                            : ext.status === 'on-call'
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Ext {ext.extension}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Active Desk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="mt-4">
                    <h3 className="font-bold text-white text-base leading-snug">{ext.name}</h3>
                    <div className="text-xs text-indigo-300 font-medium mt-0.5">{ext.role}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{ext.department}</div>
                  </div>

                  {/* Contact Info (Direct Phone & Email) */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono text-[11px]">{ext.phone || 'No phone set'}</span>
                    </div>
                    {ext.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 truncate">
                        <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[11px] truncate">{ext.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5">
                  {/* Call / Intercom */}
                  {!isCurrent && (
                    <button
                      onClick={() => onCallNumber(ext.phone || `Ext ${ext.extension}`, ext.name, 'Internal PBX', ext.role)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer truncate"
                      title="Dial via softphone"
                    >
                      <PhoneCall className="w-3 h-3 shrink-0" />
                      <span className="truncate">Call</span>
                    </button>
                  )}

                  {/* Edit Employee Info */}
                  <button
                    onClick={() => handleOpenEditModal(ext)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                    title="Edit Name, Phone Number, Role"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  {/* Switch to this Desk */}
                  {!isCurrent ? (
                    <button
                      onClick={() => onOpenLoginModal ? onOpenLoginModal() : onSelectExtension(ext)}
                      className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                      title="Login as this staff member"
                    >
                      Desk PIN
                    </button>
                  ) : (
                    <span className="flex-1 text-center text-xs font-semibold text-emerald-400 py-1.5">
                      Your Station
                    </span>
                  )}

                  {/* Delete Employee */}
                  {extensions.length > 1 && (
                    <button
                      onClick={() => handleDelete(ext)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                      title="Remove employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certified Local Vendors Directory Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Emergency Contractor & Technician Roster</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-vetted electrical, HVAC, and facility technicians ready for direct dispatch on client tickets.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Contractor / Firm</th>
                  <th className="p-3.5">Trade & Category</th>
                  <th className="p-3.5">City & Service Area</th>
                  <th className="p-3.5">Rating / Jobs</th>
                  <th className="p-3.5">Avg Response</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Direct Softphone Dial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{vendor.name}</span>
                        {vendor.emergencyContractor && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/30">
                            Emergency
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">Contact: {vendor.contactPerson}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                        {vendor.trade}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{vendor.city}</div>
                      <div className="text-[11px] text-slate-400">{vendor.area}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{vendor.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{vendor.jobsCompleted} repairs</div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      {vendor.avgResponseMinutes} mins
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        {vendor.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onCallNumber(vendor.phone, vendor.name, 'Contractor Dispatch', vendor.city)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Dial {vendor.phone}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT EMPLOYEE MODAL */}
      {/* ========================================================= */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in my-8">
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingEmployee ? `Edit Employee (${editingEmployee.name})` : 'Add Real Company Employee'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure official employee details, extension, and mobile contact number.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEmployee} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Qurat Ul Ain or Ahmed Raza"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-xs outline-none transition"
                />
              </div>

              {/* Extension & Phone in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Extension Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 102"
                    value={formData.extension}
                    onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white font-mono text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Direct Mobile / SIM Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white font-mono text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer Support Lead"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call Center & Dispatch"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Email & Desk PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. agent@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-xs outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Desk Login PIN (4 digits)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1010"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white font-mono text-xs outline-none transition"
                  />
                </div>
              </div>

              {/* Shift Hours */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Shift Timing
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM - 05:30 PM"
                  value={formData.shiftHours}
                  onChange={(e) => setFormData({ ...formData, shiftHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white text-xs outline-none transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'Save Changes' : 'Create Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WIPE DEMO ACTIVITY DATA CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Wipe All Demo Activity?</h3>
                <p className="text-xs text-rose-300/80">Clean slate for your real company</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will clear all <strong>sample calls, mock bank complaint tickets, and demo missed call alerts</strong> from your local storage and Firestore.
              <br /><br />
              Your <strong>employees and staff directory will remain intact</strong> so you can begin logging real calls and real client tickets immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWipe}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Wipe Demo Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
