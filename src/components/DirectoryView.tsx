import React from 'react';
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
  Camera
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
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      {/* Employee Extensions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
          <div className="min-w-0 flex-1">
            <h1 
              className="font-extrabold text-white tracking-tight flex items-center gap-2.5 [overflow-wrap:anywhere]"
              style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}
            >
              <Users2 className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Employee Extensions & PBX Directory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 [overflow-wrap:anywhere]">
              Internal 3-digit PBX extensions assigned to complaint officers, supervisors, and dispatch leads.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {onOpenPhotoModal && (
              <button
                type="button"
                onClick={() => onOpenPhotoModal(currentExtension)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload My Photo</span>
              </button>
            )}
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
              {extensions.length} Internal Extensions
            </span>
          </div>
        </div>

        {/* Extensions Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
          {extensions.map((ext) => {
            const isCurrent = currentExtension.id === ext.id;

            return (
              <div
                key={ext.id}
                className={`p-5 rounded-2xl border transition shadow-lg ${
                  isCurrent
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500/80 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div 
                    onClick={() => onOpenPhotoModal?.(ext)}
                    className="relative group cursor-pointer"
                    title="Click to upload custom employee photo"
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

                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Ext {ext.extension}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-white text-base leading-snug">{ext.name}</h3>
                  <div className="text-xs text-indigo-300 font-medium mt-0.5">{ext.role}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{ext.department}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Calls Today:</span>
                    <span className="font-bold text-white text-sm">{ext.activeCallsToday}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Handling:</span>
                    <span className="font-bold text-slate-200 text-sm">
                      {Math.floor(ext.avgHandlingSeconds / 60)}m {ext.avgHandlingSeconds % 60}s
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => onOpenPhotoModal?.(ext)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
                    title="Upload custom employee photo from device"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  </button>

                  {!isCurrent ? (
                    <>
                      <button
                        onClick={() => onCallNumber(`Ext ${ext.extension}`, ext.name, 'Internal PBX', ext.role)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer truncate"
                      >
                        <PhoneCall className="w-3 h-3 shrink-0" />
                        <span className="truncate">Intercom</span>
                      </button>
                      <button
                        onClick={() => onOpenLoginModal ? onOpenLoginModal() : onSelectExtension(ext)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer shrink-0"
                        title="Authenticate PIN to switch to this officer desk"
                      >
                        PIN Login
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onNavigateTab?.('my-account')}
                      className="flex-1 py-1.5 text-center text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/50 rounded-lg border border-indigo-500/30 transition cursor-pointer"
                    >
                      My Account & Details
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certified Local Vendors Directory Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Emergency Contractor & Electrician Roster</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-vetted electrical and facility technicians across Lahore, Karachi, and Islamabad with fast dispatch SLAs.
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
    </div>
  );
};
