import React, { useState } from 'react';
import { 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  TicketCheck, 
  Wrench, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Building2, 
  MapPin, 
  X,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine, SpeechPlayer } from '../utils/audio';

interface ScenarioWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerRealInboundCall: () => void;
  didNumber?: string;
}

export const ScenarioWalkthroughModal: React.FC<ScenarioWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onTriggerRealInboundCall,
  didNumber,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      stepNum: 1,
      title: 'Bank Calls Company Business Number',
      subtitle: 'Step 1 & 2: Inbound Call & Caller Identification',
      description: `Habib Bank Limited (HBL) Main Gulberg Branch in Lahore calls the company trunk line (${didNumber || '+92 42 111-327-800'}). The PBX system instantly matches the caller ID, displays the branch profile, and routes to Extension 101 (Tariq Mehmood).`,
      icon: <PhoneIncoming className="w-8 h-8 text-emerald-400" />,
      highlightCard: (
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 uppercase tracking-wider">Incoming Trunk Ringing</span>
            <span className="font-mono text-slate-400">+92 42 35789012</span>
          </div>
          <div className="font-bold text-white text-base">Haris Siddiqui (Branch Manager)</div>
          <div className="text-xs text-indigo-300">Habib Bank Limited • Main Gulberg Branch, Lahore</div>
          <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
            Reported Issue: Main 3-phase circuit breaker trip & emergency UPS failure during banking transactions.
          </div>
        </div>
      ),
      actionButtonText: 'Answer Call via Softphone',
      onAction: () => {
        soundEngine.playConnectedChime();
        setCurrentStep(1);
      }
    },
    {
      stepNum: 2,
      title: 'Employee Answers & Opens Complaint Ticket',
      subtitle: 'Step 3 & 4: Computer Softphone Audio & Ticket Creation',
      description: 'Employee Tariq answers the WebRTC call on his computer softphone. He hears the customer notice ("Call is recorded for quality & compliance"), takes live notes, and generates emergency complaint ticket #TKT-8492 with Critical priority.',
      icon: <TicketCheck className="w-8 h-8 text-indigo-400" />,
      highlightCard: (
        <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400">Linked Complaint Ticket:</span>
            <span className="font-mono text-white font-bold">#TKT-8492</span>
          </div>
          <div className="text-sm font-bold text-white">HBL Gulberg - Main Circuit Breaker Trip & UPS Failure</div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Priority:</span>
              <span className="text-rose-400 font-bold">Critical</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Status:</span>
              <span className="text-amber-400 font-bold">In Progress</span>
            </div>
          </div>
        </div>
      ),
      actionButtonText: 'Contact Local Electrician',
      onAction: () => {
        soundEngine.playDtmf('1');
        setCurrentStep(2);
      }
    },
    {
      stepNum: 3,
      title: 'Contact Local Electrician via Softphone',
      subtitle: 'Step 5: 1-Click Vendor Dispatch Calling',
      description: 'The employee clicks "Call Vendor" directly from the ticket. The PBX dials certified electrician Tariq Mehmood (Lahore Power Fixers) in Gulberg to mobilize immediate repair.',
      icon: <Wrench className="w-8 h-8 text-amber-400" />,
      highlightCard: (
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 uppercase">Outbound Softphone Call</span>
            <span className="font-mono text-emerald-400 font-bold">+92 300 8492011</span>
          </div>
          <div className="font-bold text-white text-base">Tariq Hussain (Lahore Power Fixers)</div>
          <div className="text-xs text-slate-400">Certified Commercial Electrician • Rating 4.9 ★ (148 jobs)</div>
          <div className="text-xs text-slate-300 italic bg-slate-900 p-2 rounded">
            "Agent: Emergency at HBL Gulberg on MM Alam Rd. Vendor: Reaching in 20 mins with 63A breakers."
          </div>
        </div>
      ),
      actionButtonText: 'Record Electrician Response',
      onAction: () => {
        setCurrentStep(3);
      }
    },
    {
      stepNum: 4,
      title: 'Record Vendor Response & Update Status',
      subtitle: 'Step 6: Real-time Dispatch & ETA Logging',
      description: 'The employee inputs the electrician\'s confirmed arrival ETA (20-25 mins) and equipment readiness. Ticket status transitions to "Vendor Assigned", and an automated SMS is sent to the branch manager.',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      highlightCard: (
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400">Vendor Response Recorded:</span>
            <span className="text-[10px] text-slate-400 font-mono">Today, 10:22 AM</span>
          </div>
          <div className="text-xs text-slate-200">
            <strong>Arrival ETA:</strong> 20-25 minutes • <strong>Assigned Tech:</strong> Tariq Hussain
          </div>
          <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300 font-mono">
            [SMS Sent to Bank Manager] "Technician dispatched for Ticket #TKT-8492. ETA: 20-25 mins."
          </div>
        </div>
      ),
      actionButtonText: 'Review Admin History & Audit Log',
      onAction: () => {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
        setCurrentStep(4);
      }
    },
    {
      stepNum: 5,
      title: 'Complete Lifecycle Connected in FAST Connect',
      subtitle: 'End-to-End Success: Call + Audio + Ticket + Vendor',
      description: 'The bank received prompt assistance, the electrician was dispatched within 6 minutes of the first ring, the call audio was recorded with consent, and the admin has full visibility over SLA and response times.',
      icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
      highlightCard: (
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/50 space-y-2.5 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Operations Protocol Verified</h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Standard operating procedure is fully active across all company systems: PBX Softphone, Call Forwarding, Tickets Queue, Vendor Dispatch, and Audit Logs.
          </p>
        </div>
      ),
      actionButtonText: 'Run PBX Line Diagnostic Ring Test',
      onAction: () => {
        onClose();
        onTriggerRealInboundCall();
      }
    }
  ];

  if (!isOpen) return null;

  const activeStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl relative space-y-5 max-h-[90dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 pr-8 sm:pr-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs">
              Operations SOP & Emergency Protocol
            </span>
            <span className="text-xs text-slate-400">Banking Facility Outage Standard</span>
          </div>

          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-7 bg-indigo-500'
                    : idx < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Header */}
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg">
            {activeStepData.icon}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {activeStepData.subtitle}
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white mt-0.5 leading-snug [overflow-wrap:anywhere]">
              {activeStepData.title}
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed [overflow-wrap:anywhere]">
              {activeStepData.description}
            </p>
          </div>
        </div>

        {/* Highlight Card */}
        {activeStepData.highlightCard}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              Skip Walkthrough
            </button>

            <button
              onClick={activeStepData.onAction}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <span>{activeStepData.actionButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
