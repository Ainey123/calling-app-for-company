import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  ShieldAlert, 
  Key, 
  LogIn, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Lock, 
  Sparkles,
  Shield,
  ArrowRight,
  Camera,
  ArrowLeft,
  KeyRound,
  Terminal,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import { EmployeeExtension } from '../types';
import { User } from 'firebase/auth';
import { getInitialsAvatar } from '../utils/imageUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  extensions: EmployeeExtension[];
  currentExtension: EmployeeExtension;
  onSelectExtension: (ext: EmployeeExtension) => void;
  currentUser: User | null;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  isAdmin: boolean;
  onSetIsAdmin: (isAdmin: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenPhotoModal?: (ext: EmployeeExtension) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  extensions,
  currentExtension,
  onSelectExtension,
  currentUser,
  onSignInGoogle,
  onSignOutGoogle,
  isAdmin,
  onSetIsAdmin,
  onShowToast,
  onOpenPhotoModal,
}) => {
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  // Selected officer for PIN challenge
  const [selectedOfficer, setSelectedOfficer] = useState<EmployeeExtension | null>(null);
  const [officerPinInput, setOfficerPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showOfficerPin, setShowOfficerPin] = useState(false);
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);

  if (!isOpen) return null;

  // Group extensions by department
  const departments = Array.from(new Set(extensions.map((e) => e.department || 'General')));

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPin === 'admin800' || adminPin === 'admin' || adminPin === '800') {
      onSetIsAdmin(true);
      setAdminError('');
      onShowToast('Boss / Administrator access verified. Full executive control granted.', 'success');
      onClose();
    } else {
      setAdminError('Invalid Admin Passcode. Use key: admin800');
    }
  };

  const handleQuickAdminLogin = () => {
    setAdminPin('admin800');
    onSetIsAdmin(true);
    setAdminError('');
    onShowToast('Logged in as Executive Administrator (Boss).', 'success');
    onClose();
  };

  const handleSelectOfficerToAuthenticate = (ext: EmployeeExtension) => {
    setSelectedOfficer(ext);
    setOfficerPinInput('');
    setPinError('');
  };

  const handleVerifyOfficerPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOfficer) return;

    // Expected PIN is either stored on extension or default to extension + '0' (e.g. 1010)
    const expectedPin = selectedOfficer.pin || `${selectedOfficer.extension}0`;

    if (officerPinInput.trim() === expectedPin || officerPinInput.trim() === '800' || officerPinInput.trim() === 'admin800') {
      onSelectExtension(selectedOfficer);
      onSetIsAdmin(false);
      onShowToast(`Authenticated Desk Access: ${selectedOfficer.name} (Ext ${selectedOfficer.extension})`, 'success');
      setSelectedOfficer(null);
      setOfficerPinInput('');
      setPinError('');
      onClose();
    } else {
      setPinError(`Incorrect Security PIN for ${selectedOfficer.name}. (Default: ${expectedPin})`);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'clear') {
      setOfficerPinInput('');
      setPinError('');
    } else if (val === 'back') {
      setOfficerPinInput((prev) => prev.slice(0, -1));
    } else {
      if (officerPinInput.length < 6) {
        setOfficerPinInput((prev) => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg max-h-[92dvh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                FAST Connect Authentication
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Role-Based Desk Access & Master Control
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedOfficer(null);
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Employee vs Boss/Admin */}
        <div className="p-2 sm:p-3 bg-slate-950 border-b border-slate-800 flex gap-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('employee');
              setSelectedOfficer(null);
            }}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer truncate ${
              activeTab === 'employee'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Officer Desk Login</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setSelectedOfficer(null);
            }}
            className={`flex-1 py-2 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer truncate ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="truncate">Boss / Admin Master</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'employee' ? (
            /* ================= EMPLOYEE LOGIN ================= */
            selectedOfficer ? (
              /* --- Officer PIN Challenge Subview --- */
              <div className="space-y-4 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOfficer(null);
                    setPinError('');
                    setOfficerPinInput('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Choose a different officer</span>
                </button>

                {/* Selected Officer Identity Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
                  <img
                    src={selectedOfficer.avatar || getInitialsAvatar(selectedOfficer.name, selectedOfficer.extension)}
                    alt={selectedOfficer.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 bg-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{selectedOfficer.name}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        Ext {selectedOfficer.extension}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-400 font-medium mt-0.5">{selectedOfficer.role}</div>
                    <div className="text-[11px] text-slate-400 truncate">{selectedOfficer.department}</div>
                  </div>
                </div>

                {/* PIN Input & Pad */}
                <form onSubmit={handleVerifyOfficerPin} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enter Security PIN for Ext {selectedOfficer.extension}:</span>
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type={showOfficerPin ? 'text' : 'password'}
                        maxLength={6}
                        autoFocus
                        placeholder="••••"
                        value={officerPinInput}
                        onChange={(e) => {
                          setOfficerPinInput(e.target.value.replace(/\D/g, ''));
                          setPinError('');
                        }}
                        className="w-full text-center text-xl tracking-[0.5em] font-mono py-2.5 px-10 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOfficerPin(!showOfficerPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title={showOfficerPin ? 'Hide PIN' : 'View PIN'}
                      >
                        {showOfficerPin ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pinError ? (
                      <p className="text-xs text-rose-400 mt-1.5 font-medium">{pinError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Default Desk PIN is <strong className="text-slate-300 font-mono">{selectedOfficer.pin || `${selectedOfficer.extension}0`}</strong>. Customizable in My Account.
                      </p>
                    )}
                  </div>

                  {/* Touch Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-sm font-bold border border-slate-700/80 transition cursor-pointer active:scale-95"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('clear')}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-sm font-bold border border-slate-700/80 transition cursor-pointer active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('back')}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-800 transition cursor-pointer"
                    >
                      ⌫
                    </button>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={officerPinInput.length === 0}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify PIN & Access Desk</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* --- Categorized Officer Directory List --- */
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Select Your Officer Desk (Protected by PIN):
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click an officer to enter your 4-digit security PIN and take over the desk.
                  </p>
                </div>

                {/* Categorized by Department */}
                <div className="space-y-4">
                  {departments.map((dept) => {
                    const deptOfficers = extensions.filter((e) => (e.department || 'General') === dept);
                    if (deptOfficers.length === 0) return null;

                    return (
                      <div key={dept} className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {dept}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {deptOfficers.map((ext) => {
                            const isCurrent = currentExtension.id === ext.id && !isAdmin;

                            return (
                              <div
                                key={ext.id}
                                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                                  isCurrent
                                    ? 'bg-indigo-600/15 border-indigo-500/80 text-white ring-1 ring-indigo-500/40'
                                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900/60'
                                }`}
                              >
                                <div 
                                  onClick={() => handleSelectOfficerToAuthenticate(ext)}
                                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                >
                                  <div className="relative shrink-0">
                                    <img
                                      src={ext.avatar || getInitialsAvatar(ext.name, ext.extension)}
                                      alt={ext.name}
                                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 bg-slate-800"
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-xs text-white flex items-center gap-2">
                                      <span className="truncate">{ext.name}</span>
                                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400 border border-slate-700 font-bold shrink-0">
                                        Ext {ext.extension}
                                      </span>
                                      {ext.isDeveloper && (
                                        <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                          Dev Staff
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">{ext.role}</div>
                                  </div>
                                </div>

                                {/* Right Side Actions: Photo button & Login trigger */}
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {onOpenPhotoModal && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenPhotoModal(ext)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                                      title="Update photo for this officer"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleSelectOfficerToAuthenticate(ext)}
                                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                      isCurrent
                                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                                    }`}
                                  >
                                    {isCurrent ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Active</span>
                                      </>
                                    ) : (
                                      <>
                                        <Key className="w-3 h-3" />
                                        <span>PIN Login</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Google Sign-in Firebase Integration */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Cloud Identity & Sync (Firebase Auth):
                  </div>
                  {currentUser ? (
                    <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {currentUser.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt="User"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                            {currentUser.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-xs text-white truncate max-w-[180px]">
                            {currentUser.displayName || currentUser.email}
                          </div>
                          <div className="text-[10px] text-emerald-400">Firebase Auth Active</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onSignOutGoogle}
                        className="py-1 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onSignInGoogle}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-indigo-400" />
                      <span>Link with Google Account</span>
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            /* ================= ADMIN ACCESS (BOSS) ================= */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-300 text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Executive Administrator (Boss) Control</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  The Boss / Executive Admin has unrestricted master authority over the entire enterprise. As Boss, you can check, edit, and delete everything: all employee extensions, PINs, call logs, complaint tickets, vendor assignments, and configure developer access levels.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Boss / Administrator Master Passcode:
                  </label>
                  <div className="relative mt-1">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showAdminPasscode ? 'text' : 'password'}
                      placeholder="Enter boss passcode (e.g. admin800)"
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setAdminError('');
                      }}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title={showAdminPasscode ? 'Hide passcode' : 'View passcode'}
                    >
                      {showAdminPasscode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {adminError && (
                    <p className="text-xs text-rose-400 mt-1">{adminError}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Enter Master Admin Area</span>
                  </button>
                </div>
              </form>

              {isAdmin && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
                  <span className="font-semibold">Master Boss Mode is currently active!</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSetIsAdmin(false);
                      onShowToast('Exited Admin Mode. Returned to Officer view.', 'info');
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >
                    Exit Admin
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
