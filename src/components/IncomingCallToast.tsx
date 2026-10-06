import React from 'react';
import { Phone, PhoneOff, Building2, MapPin, ShieldAlert, Sparkles } from 'lucide-react';
import { EmployeeExtension } from '../types';

export interface IncomingCallInfo {
  number: string;
  name: string;
  organization: string;
  branch: string;
  city: string;
  targetExtension: string;
  issueHint?: string;
}

interface IncomingCallToastProps {
  incomingCall: IncomingCallInfo | null;
  onAccept: () => void;
  onDecline: () => void;
  currentExtension: EmployeeExtension;
}

export const IncomingCallToast: React.FC<IncomingCallToastProps> = ({
  incomingCall,
  onAccept,
  onDecline,
  currentExtension,
}) => {
  if (!incomingCall) return null;

  return (
    <div className="fixed inset-x-4 top-16 md:inset-x-auto md:top-20 md:right-8 z-50 animate-bounce duration-700">
      <div className="w-full md:w-96 bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl overflow-hidden ring-4 ring-emerald-500/20">
        {/* Ringing Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-2.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-xs font-bold tracking-wide uppercase">
              Incoming Business Call
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
            Ext {currentExtension.extension} Ringing
          </span>
        </div>

        {/* Caller Details */}
        <div className="p-4 space-y-3 bg-slate-900/95 text-slate-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {incomingCall.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{incomingCall.organization}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{incomingCall.branch}, {incomingCall.city}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Caller Phone & Notice */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between font-mono">
            <span className="text-slate-400">Caller ID:</span>
            <span className="text-emerald-400 font-bold">{incomingCall.number}</span>
          </div>

          {incomingCall.issueHint && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{incomingCall.issueHint}</span>
            </div>
          )}

          {/* Call Actions */}
          <div className="pt-2 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={onDecline}
              className="py-2.5 px-2 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4 shrink-0" />
              <span className="truncate">Decline / Miss</span>
            </button>

            <button
              onClick={onAccept}
              className="py-2.5 px-2 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer animate-pulse"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span className="truncate">Answer Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
