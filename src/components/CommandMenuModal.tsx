import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Phone, 
  PhoneCall, 
  TicketCheck, 
  Users, 
  BarChart3, 
  Shield, 
  Sparkles, 
  Calendar, 
  Sun, 
  Moon, 
  Plus, 
  ArrowRight, 
  CornerDownLeft,
  X,
  Radio,
  FileText,
  Building2,
  Clock
} from 'lucide-react';
import { EmployeeExtension, ComplaintTicket, NavigationTab } from '../types';

interface CommandMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenSoftphone: () => void;
  onOpenAICopilot: () => void;
  onOpenLoginModal: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';
  extensions: EmployeeExtension[];
  tickets: ComplaintTicket[];
  onSelectExtension: (ext: EmployeeExtension) => void;
  onCallNumber: (num: string, name: string, org?: string, branch?: string) => void;
}

export const CommandMenuModal: React.FC<CommandMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSoftphone,
  onOpenAICopilot,
  onOpenLoginModal,
  onToggleTheme,
  theme,
  extensions,
  tickets,
  onSelectExtension,
  onCallNumber,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Command items
  const baseCommands = [
    {
      id: 'cmd-overview',
      title: 'Go to Operations Command Dashboard',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      shortcut: 'G O',
      action: () => { onNavigate('overview'); onClose(); }
    },
    {
      id: 'cmd-calls',
      title: 'Go to Call History & Live Inspector',
      category: 'Navigation',
      icon: <PhoneCall className="w-4 h-4 text-emerald-400" />,
      shortcut: 'G C',
      action: () => { onNavigate('calls'); onClose(); }
    },
    {
      id: 'cmd-tickets',
      title: 'Go to Complaints & CRM Tickets',
      category: 'Navigation',
      icon: <TicketCheck className="w-4 h-4 text-indigo-400" />,
      shortcut: 'G T',
      action: () => { onNavigate('tickets'); onClose(); }
    },
    {
      id: 'cmd-softphone',
      title: 'Open PBX WebRTC Softphone Console',
      category: 'Telephony',
      icon: <Phone className="w-4 h-4 text-indigo-400" />,
      shortcut: 'P',
      action: () => { onOpenSoftphone(); onClose(); }
    },
    {
      id: 'cmd-copilot',
      title: 'Open Gemini 3.8 Live Voice Copilot',
      category: 'AI Intelligence',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      shortcut: 'V',
      action: () => { onOpenAICopilot(); onClose(); }
    },
    {
      id: 'cmd-directory',
      title: 'Go to Officer Extensions & Directory',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      shortcut: 'G E',
      action: () => { onNavigate('directory'); onClose(); }
    },
    {
      id: 'cmd-my-account',
      title: 'Go to My Account (Personal Working Details & PIN)',
      category: 'Profile',
      icon: <Users className="w-4 h-4 text-indigo-400" />,
      shortcut: 'G M',
      action: () => { onNavigate('my-account'); onClose(); }
    },
    {
      id: 'cmd-analytics',
      title: 'Go to Analytics & Agent Performance',
      category: 'Navigation',
      icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
      shortcut: 'G A',
      action: () => { onNavigate('analytics'); onClose(); }
    },
    {
      id: 'cmd-admin',
      title: 'Go to SuperAdmin Master Control Area',
      category: 'Admin',
      icon: <Shield className="w-4 h-4 text-amber-400" />,
      shortcut: 'G M',
      action: () => { onNavigate('admin'); onClose(); }
    },
    {
      id: 'cmd-login',
      title: 'Open User & Employee Login Portal',
      category: 'Auth',
      icon: <Users className="w-4 h-4 text-slate-300" />,
      shortcut: 'L',
      action: () => { onOpenLoginModal(); onClose(); }
    },
    {
      id: 'cmd-theme',
      title: `Toggle Theme (Current: ${theme === 'dark' ? 'Dark' : 'Light'})`,
      category: 'Preferences',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      shortcut: 'T',
      action: () => { onToggleTheme(); onClose(); }
    },
    {
      id: 'cmd-call-hbl',
      title: 'Quick Dial: HBL Lahore Main Gulberg (+92 42 35789012)',
      category: 'Quick Dial',
      icon: <PhoneCall className="w-4 h-4 text-emerald-400" />,
      shortcut: 'D 1',
      action: () => { onCallNumber('+92 42 35789012', 'Haris Siddiqui', 'Habib Bank Limited (HBL)', 'Main Gulberg'); onClose(); }
    },
    {
      id: 'cmd-call-tariq',
      title: 'Quick Dial: Tariq Electrician (Lahore Power Fixers)',
      category: 'Quick Dial',
      icon: <PhoneCall className="w-4 h-4 text-emerald-400" />,
      shortcut: 'D 2',
      action: () => { onCallNumber('+92 300 8492011', 'Tariq Hussain', 'Lahore Power Fixers', 'Gulberg Depot'); onClose(); }
    }
  ];

  // Extension switch commands
  const extensionCommands = extensions.map((ext) => ({
    id: `ext-${ext.id}`,
    title: `Switch Desk to: ${ext.name} (Ext ${ext.extension} • ${ext.role})`,
    category: 'Officer Desks',
    icon: <Users className="w-4 h-4 text-indigo-400" />,
    shortcut: `Ext ${ext.extension}`,
    action: () => { onSelectExtension(ext); onClose(); }
  }));

  // Tickets commands
  const ticketCommands = tickets.slice(0, 4).map((t) => ({
    id: `tkt-${t.id}`,
    title: `Open Ticket ${t.id}: ${t.title} (${t.priority} • ${t.organization})`,
    category: 'Active Tickets',
    icon: <TicketCheck className="w-4 h-4 text-amber-400" />,
    shortcut: t.id,
    action: () => { onNavigate('tickets'); onClose(); }
  }));

  const allItems = [...baseCommands, ...extensionCommands, ...ticketCommands];

  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    (item.shortcut && item.shortcut.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl max-h-[85dvh] bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3 sm:p-3.5 border-b border-white/[0.08] flex items-center gap-3 shrink-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, dial number, or search tickets..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.06] border border-white/[0.12] rounded text-slate-400">
              ESC
            </kbd>
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-[min(380px,50dvh)] overflow-y-auto p-2 space-y-1 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate font-medium">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] text-slate-500">{item.category}</span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.06] border border-white/[0.12] rounded text-slate-400">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-white/[0.08] bg-white/[0.02] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.1] text-[9px]">↑</kbd>
              <kbd className="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.1] text-[9px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.1] text-[9px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-indigo-400">FAST Connect ⌘K</span>
        </div>
      </div>
    </div>
  );
};
