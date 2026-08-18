import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Language, PaymentRequest } from '../types';
import { formatEthiopianDate } from '../utils/ethiopianCalendar';
import {
  createPaymentRequestInFirestore,
  fetchAllPaymentRequestsFromFirestore,
  updatePaymentRequestStatusInFirestore,
  saveUserProfileToFirestore,
} from '../lib/db';
import {
  User,
  Globe,
  GraduationCap,
  Calendar,
  Sparkles,
  Shield,
  Camera,
  Check,
  Zap,
  X,
  LogOut,
  ChevronRight,
  Lock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Mail,
  KeyRound,
} from 'lucide-react';

import { APP_CONFIG } from '../config';

interface ProfileScreenProps {
  user: UserProfile;
  language: Language;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onLogout: () => void;
  onOpenAdminScreen?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  language,
  onUpdateUser,
  onLogout,
  onOpenAdminScreen,
}) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || '');
  
  // Admin payment verification & credential state
  const [paymentQueue, setPaymentQueue] = useState<PaymentRequest[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [unlockedAdmin, setUnlockedAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Check if current logged-in user is admin
  const isAdmin = Boolean(
    unlockedAdmin ||
    (user.email && user.email.toLowerCase().trim() === APP_CONFIG.adminEmail.toLowerCase().trim())
  );

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');

    const cleanEmail = adminEmailInput.trim().toLowerCase();
    const cleanPass = adminPasswordInput.trim();

    if (
      cleanEmail === APP_CONFIG.adminEmail.toLowerCase() &&
      cleanPass === APP_CONFIG.adminPassword
    ) {
      setUnlockedAdmin(true);
      setShowAdminLoginModal(false);
      setAdminEmailInput('');
      setAdminPasswordInput('');
      if (onOpenAdminScreen) {
        onOpenAdminScreen();
      } else {
        setShowAdminPanel(true);
      }
    } else {
      setAdminLoginError('Invalid admin email or password.');
    }
  };

  const handleFetchAdminQueue = async () => {
    setLoadingAdmin(true);
    const requests = await fetchAllPaymentRequestsFromFirestore();
    setPaymentQueue(requests);
    setLoadingAdmin(false);
  };

  useEffect(() => {
    if (showAdminPanel) {
      handleFetchAdminQueue();
    }
  }, [showAdminPanel]);

  const handleAdminApprove = async (req: PaymentRequest) => {
    await updatePaymentRequestStatusInFirestore(req.id, 'approved');
    // Save target user as PRO
    const targetUser: UserProfile = {
      id: req.userId,
      language: 'en',
      grade: 10,
      isPro: true,
      authMethod: 'phone',
      ethiopianBirthday: { day: 1, month: 'Meskerem', year: 2000 },
    };
    await saveUserProfileToFirestore(targetUser);

    // If current logged in user is this user
    if (req.userId === user.id) {
      onUpdateUser({ isPro: true });
    }

    alert(`✅ Approved Telebirr Ref: ${req.telebirrRef} (Code: ${req.sixDigitCode})! PRO granted.`);
    handleFetchAdminQueue();
  };

  const handleAdminReject = async (req: PaymentRequest) => {
    await updatePaymentRequestStatusInFirestore(req.id, 'rejected');
    alert(`❌ Rejected Telebirr Ref: ${req.telebirrRef}`);
    handleFetchAdminQueue();
  };

  const handleLanguageChange = (newLang: Language) => {
    onUpdateUser({ language: newLang });
  };

  const handleGradeChange = (newGrade: number) => {
    onUpdateUser({ grade: newGrade });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        onUpdateUser({ avatarUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const formattedEthBirthday = formatEthiopianDate(
    user.ethiopianBirthday.day,
    user.ethiopianBirthday.month,
    user.ethiopianBirthday.year,
    user.language
  );

  return (
    <div className="flex-1 flex flex-col p-5 bg-neutral-950 text-white overflow-y-auto space-y-5">
      {/* Profile Avatar Card Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 relative shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white text-black font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-lg border border-neutral-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user.name ? user.name[0].toUpperCase() : 'E'}</span>
              )}
            </div>

            <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white cursor-pointer shadow-md">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-white truncate">{user.name || 'Ethiopian Student'}</h3>
              {user.isPro ? (
                <span className="px-2 py-0.5 rounded-full bg-white text-black font-mono font-bold text-[10px] uppercase">
                  PRO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono text-[10px]">
                  FREE TIER
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
              {user.email || user.phone || 'student@eduethiopia.et'}
            </p>
          </div>
        </div>

        {/* Free Community Access Banner */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free & Unlimited Access</span>
            </span>
            <p className="text-[10px] text-neutral-400">All AI notes, quizzes, & study cards are 100% free</p>
          </div>

          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
            ACTIVE
          </span>
        </div>
      </div>

      {/* App Owner Payment Verification Dashboard (Visible ONLY when Admin is Active/Logged In) */}
      {isAdmin && (
        <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white flex items-center space-x-1.5">
                <span>Owner Payment Dashboard</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.2 rounded">
                  ADMIN ACTIVE
                </span>
              </h4>
              <p className="text-[10px] text-neutral-400">Verify Telebirr SMS & receive upgrade alerts</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenAdminScreen) {
                onOpenAdminScreen();
              } else {
                setShowAdminPanel(true);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-md shrink-0 cursor-pointer"
          >
            Open Admin
          </button>
        </div>
      )}

      {/* Language Preference Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-white" />
          <h4 className="font-bold text-xs text-white">
            {language === 'am' ? 'የሚመርጡት ቋንቋ' : 'Preferred App Language'}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
              language === 'en'
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-neutral-950 text-neutral-400 border-neutral-850'
            }`}
          >
            <span>English</span>
            {language === 'en' && <Check className="w-4 h-4 text-black" />}
          </button>

          <button
            onClick={() => handleLanguageChange('am')}
            className={`py-3 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
              language === 'am'
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-neutral-950 text-neutral-400 border-neutral-850'
            }`}
          >
            <span>አማርኛ (Amharic)</span>
            {language === 'am' && <Check className="w-4 h-4 text-black" />}
          </button>
        </div>
      </div>

      {/* Personal Info & Ethiopian Birthday */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4 text-xs font-mono">
        <h4 className="font-bold text-white text-xs font-sans uppercase tracking-wider text-neutral-400">
          {language === 'am' ? 'የመገለጫ ዝርዝር' : 'PERSONAL DETAILS'}
        </h4>

        {/* Ethiopian Birthday Display */}
        <div className="flex justify-between items-center py-2 border-b border-neutral-800">
          <span className="text-neutral-400 flex items-center space-x-1.5 font-sans">
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>Ethiopian Birthday:</span>
          </span>
          <span className="text-white font-bold">{formattedEthBirthday}</span>
        </div>

        {/* Grade Selector */}
        <div className="flex justify-between items-center py-2 border-b border-neutral-800">
          <span className="text-neutral-400 flex items-center space-x-1.5 font-sans">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
            <span>Grade Level:</span>
          </span>
          <select
            value={user.grade}
            onChange={(e) => handleGradeChange(Number(e.target.value))}
            className="bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-1 outline-none text-xs"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g} className="bg-neutral-900">
                Grade {g}
              </option>
            ))}
          </select>
        </div>

        {/* Authentication Identifier */}
        <div className="flex justify-between items-center py-2">
          <span className="text-neutral-400 flex items-center space-x-1.5 font-sans">
            <Shield className="w-3.5 h-3.5 text-white" />
            <span>Account Identifier:</span>
          </span>
          <span className="text-white font-bold">{user.email || user.phone}</span>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full py-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all hover:bg-neutral-850"
        >
          <LogOut className="w-4 h-4" />
          <span>{language === 'am' ? 'ውጣ' : 'Sign Out'}</span>
        </button>

        {!isAdmin && (
          <div className="pt-3 text-center">
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="text-[10px] text-neutral-600 hover:text-neutral-400 font-mono flex items-center justify-center space-x-1 mx-auto py-1.5 px-3 rounded-lg hover:bg-neutral-900/50 transition-colors"
            >
              <Lock className="w-3 h-3 text-neutral-500" />
              <span>Admin Login</span>
            </button>
          </div>
        )}
      </div>

      {/* App Owner Payment Verification Modal (Admin Only) */}
      <AnimatePresence>
        {showAdminPanel && isAdmin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800 shrink-0">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base">Owner Payment Verification</h3>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Email Notification Alert Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-400">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white text-[11px]">Email Notifications Active</span>
                      <span className="text-[10px] text-emerald-300 font-mono">Alerts dispatched to: makieyosiyas@gmail.com</span>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>🛡️ Zero Scam Telebirr Protection</span>
                    <button onClick={handleFetchAdminQueue} className="p-1 hover:text-white">
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAdmin ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Check your phone's Telebirr SMS for the student's unique 6-digit Remark Code or Transaction Ref below. If 500 ETB was received, click <b>Approve (Grant PRO)</b>.
                  </p>
                </div>

                {/* Queue list */}
                {loadingAdmin ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    Loading pending payments from Firestore...
                  </div>
                ) : paymentQueue.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs font-mono">
                    No payment requests submitted yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentQueue.map((req) => (
                      <div
                        key={req.id}
                        className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-sm text-white">{req.userName || 'Student'}</span>
                            <span className="block text-[11px] text-neutral-400 font-mono">Phone: {req.userPhone}</span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                            <span className="text-[10px] text-neutral-400 block">Unique Code:</span>
                            <span className="font-black text-emerald-400 text-sm tracking-widest">{req.sixDigitCode || 'N/A'}</span>
                          </div>
                          <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                            <span className="text-[10px] text-neutral-400 block">Telebirr Ref:</span>
                            <span className="font-extrabold text-white">{req.telebirrRef}</span>
                          </div>
                        </div>

                        {req.receiptImage && (
                          <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800 text-center">
                            <span className="text-[10px] text-neutral-400 block mb-1">Uploaded Screenshot:</span>
                            <img
                              src={req.receiptImage}
                              alt="Receipt"
                              className="max-h-40 mx-auto rounded-lg border border-neutral-700 object-contain"
                            />
                          </div>
                        )}

                        {req.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleAdminApprove(req)}
                              className="py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center justify-center space-x-1 hover:bg-emerald-400"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve (Grant PRO)</span>
                            </button>
                            <button
                              onClick={() => handleAdminReject(req)}
                              className="py-2.5 rounded-xl bg-neutral-800 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center space-x-1 hover:bg-neutral-750"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject (Fake Screenshot)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Automated Gateway Guide */}
                <div className="bg-neutral-950/80 p-4 rounded-2xl border border-neutral-850 text-[11px] text-neutral-400 space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-neutral-200">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span>How to Get 100% Automated Telebirr (Chapa Gateway)</span>
                  </div>
                  <p className="leading-relaxed">
                    If you don't want manual verification, register on <b>Chapa.co</b> (Ethiopia). Chapa handles Telebirr & Ethiopian Banks automatically via API/Webhook so users are verified 100% hands-free with zero scam risk!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Credential Login Modal */}
      <AnimatePresence>
        {showAdminLoginModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">Owner Admin Login</h3>
                </div>
                <button
                  onClick={() => setShowAdminLoginModal(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1 uppercase font-bold">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder="admin@eduethiopia.et"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1 uppercase font-bold">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {adminLoginError && (
                  <p className="text-[11px] text-red-400 font-medium leading-relaxed bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    {adminLoginError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-all shadow-lg mt-2"
                >
                  Unlock Admin Dashboard
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
