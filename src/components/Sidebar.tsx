import React from 'react';
import { 
  LayoutDashboard, 
  PhoneCall, 
  History, 
  TicketCheck, 
  Users2, 
  BarChart3, 
  Shield, 
  ShieldCheck,
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Radio, 
  UserCheck, 
  Key, 
  X,
  Phone,
  ArrowUpRight,
  PhoneForwarded,
  ClipboardList,
  ClipboardCheck,
  Activity,
  Wrench,
  Mail,
  Building2,
  Clock,
  Smartphone
} from 'lucide-react';
import { EmployeeExtension, NavigationTab } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  missedCallsCount: number;
  openTicketsCount: number;
  currentExtension: EmployeeExtension;
  onOpenSoftphone: () => void;
  onOpenAICopilot: () => void;
  onOpenLoginModal: () => void;
  onLaunchScenarioWalkthrough: () => void;
  isAdmin: boolean;
  isCallActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  setActiveTab,
  isMobileOpen,
  onCloseMobile,
  missedCallsCount,
  openTicketsCount,
  currentExtension,
  onOpenSoftphone,
  onOpenAICopilot,
  onOpenLoginModal,
  onLaunchScenarioWalkthrough,
  isAdmin,
  isCallActive,
}) => {
  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const labelClass = isMobileOpen ? 'inline' : 'hidden lg:inline';
  const blockClass = isMobileOpen ? 'block' : 'hidden lg:block';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isMobileOpen
            ? 'translate-x-0 w-64 max-w-[85vw]'
            : '-translate-x-full md:translate-x-0 md:w-[72px]'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        {/* Sidebar Header & Brand Logo */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div 
            onClick={() => handleNavClick('overview')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/30 shrink-0">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className={`min-w-0 transition-opacity duration-200 ${blockClass}`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-tight">FAST Connect</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PBX
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate">Trunk Online</span>
                </div>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 select-none">
          {/* Section 1: Overview */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className={`px-2.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${blockClass}`}>
                Overview & Monitoring
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Executive Operations & Reporting Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Operations Dashboard</span>}
              </button>

              <button
                onClick={() => handleNavClick('activity')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Employee Activity Hub (Auto-telephony vs Employee-logged)"
              >
                <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Employee Activity Hub</span>}
              </button>
            </div>
          </div>

          {/* Section 2: Operations & Coordination */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className={`px-2.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${blockClass}`}>
                Operations & Coordination
              </div>
            )}
            <div className="space-y-1">
              {/* Vendor Coordination */}
              <button
                onClick={() => handleNavClick('vendors')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'vendors'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Vendor Directory, RFQs, Quotations & Google Maps"
              >
                <Building2 className="w-4 h-4 shrink-0 text-amber-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Vendor Coordination</span>}
              </button>

              {/* Email-Related Work */}
              <button
                onClick={() => handleNavClick('emails')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'emails'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Gmail Work Records, Quotation Responses & Client Approvals"
              >
                <Mail className="w-4 h-4 shrink-0 text-cyan-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Email Work (Gmail)</span>}
              </button>

              {/* My Daily Work */}
              <button
                onClick={() => handleNavClick('daily-work')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'daily-work'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Employee Daily Work Log & Report Submission"
              >
                <ClipboardList className="w-4 h-4 shrink-0 text-purple-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Daily Work Reports</span>}
              </button>

              {/* Complaints & Tickets */}
              <button
                onClick={() => handleNavClick('tickets')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'tickets'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Site Breakdown Complaints & Contractor Dispatch"
              >
                <div className="flex items-center gap-3">
                  <TicketCheck className="w-4 h-4 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Site Tickets</span>}
                </div>
                {openTicketsCount > 0 && (!isCollapsed || isMobileOpen) && (
                  <span className={`px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold ${labelClass}`}>
                    {openTicketsCount}
                  </span>
                )}
              </button>

              {/* Corporate Incident Response & Dispatch SOP */}
              <button
                onClick={() => {
                  onLaunchScenarioWalkthrough();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 hover:bg-indigo-950/30 transition cursor-pointer group"
                title="Corporate Incident Response & Dispatch SOP Protocol"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Dispatch SOP</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <ArrowUpRight className={`w-3.5 h-3.5 text-indigo-400/80 ${labelClass}`} />
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Business Calling (PBX) */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className={`px-2.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${blockClass}`}>
                Business Calling
              </div>
            )}
            <div className="space-y-1">
              {/* Call History */}
              <button
                onClick={() => handleNavClick('calls')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'calls'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Call Records, Outcomes & Audio Recordings"
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Call History</span>}
                </div>
                {missedCallsCount > 0 && (!isCollapsed || isMobileOpen) && (
                  <span className={`px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold ${labelClass}`}>
                    {missedCallsCount}
                  </span>
                )}
              </button>

              {/* Softphone Console */}
              <button
                onClick={() => {
                  onOpenSoftphone();
                  handleNavClick('softphone');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'softphone' || isCallActive
                    ? isCallActive
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="PBX Dialpad & WebRTC Softphone Console"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Softphone Console</span>}
                </div>
                {isCallActive && (!isCollapsed || isMobileOpen) && (
                  <span className={`w-2 h-2 rounded-full bg-emerald-400 animate-ping ${labelClass}`}></span>
                )}
              </button>

              {/* Direct SIM Calling (Dual SIM Form & Station) */}
              <button
                onClick={() => handleNavClick('sim-calling')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'sim-calling'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Cellular SIM 1 & SIM 2 Outbound Calling Station"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 shrink-0 text-emerald-400" />
                  {(!isCollapsed || isMobileOpen) && <span className={labelClass}>SIM Calling</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <span className={`px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold ${labelClass}`}>
                    SIM 1/2
                  </span>
                )}
              </button>

              {/* Extension Directory */}
              <button
                onClick={() => handleNavClick('directory')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Officer Extensions & Directory"
              >
                <Users2 className="w-4 h-4 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Desk Extensions</span>}
              </button>

              {/* Smart Call Forwarding */}
              <button
                onClick={() => handleNavClick('forwarding')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'forwarding'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Smart Call Forwarding & Failover Matrix"
              >
                <PhoneForwarded className="w-4 h-4 shrink-0 text-amber-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Call Forwarding</span>}
              </button>
            </div>
          </div>

          {/* Section 4: Management & Review */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className={`px-2.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${blockClass}`}>
                Reports & Review
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('admin-reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'admin-reports'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Admin Review of Employee Daily Work Reports"
              >
                <ClipboardCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Work Reports Review</span>}
              </button>

              <button
                onClick={() => handleNavClick('timeline')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Activity Timeline"
              >
                <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Activity Timeline</span>}
              </button>

              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title="Operational SLAs & Resolution Analytics"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Analytics & SLAs</span>}
              </button>
            </div>
          </div>

          {/* Section 5: Administration */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className={`px-2.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${blockClass}`}>
                Administration
              </div>
            )}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (isAdmin) {
                    handleNavClick('admin');
                  } else {
                    onOpenLoginModal();
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/20'
                }`}
                title="Admin Master Control"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Admin Master</span>}
                </div>
                {!isAdmin && (!isCollapsed || isMobileOpen) && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono ${labelClass}`}>
                    PIN
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('forwarding')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'forwarding'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Configure PBX Forwarding Rules"
              >
                <PhoneForwarded className="w-4 h-4 shrink-0 text-amber-400" />
                {(!isCollapsed || isMobileOpen) && <span className={labelClass}>Forwarding Matrix</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Active Officer Profile & Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2 shrink-0">
          {/* Active Desk Info */}
          <div 
            onClick={() => handleNavClick('my-account')}
            className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition cursor-pointer group"
            title="Click to view My Account & Personal Working Details"
          >
            <div className="relative shrink-0">
              <img
                src={currentExtension.avatar}
                alt={currentExtension.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 transition"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className={`min-w-0 flex-1 ${blockClass}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white truncate">
                    {currentExtension.name.split(' ')[0]}
                  </span>
                  <span className="font-mono text-[10px] text-indigo-400 font-bold">
                    Ext {currentExtension.extension}
                  </span>
                </div>
                <div className="text-[10px] text-indigo-400/80 hover:text-indigo-300 truncate font-medium">
                  My Account &bull; Details
                </div>
              </div>
            )}
          </div>

          {/* Collapse/Expand Toggle on Desktop */}
          <div className="hidden lg:flex items-center justify-between pt-1">
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition text-xs cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-[11px]">Collapse sidebar</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
