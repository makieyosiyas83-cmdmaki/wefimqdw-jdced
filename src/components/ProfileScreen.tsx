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

interface ProfileScreenProps {
  user: UserProfile;
  language: Language;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  language,
  onUpdateUser,
  onLogout,
}) => {
  const [showProModal, setShowProModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || '');
  
  // User payment state
  const [senderPhone, setSenderPhone] = useState(user.phone || '');
  const [telebirrRef, setTelebirrRef] = useState('');
  const [receiptScreenshot, setReceiptScreenshot] = useState<string>('');
  const [telebirrStep, setTelebirrStep] = useState<'input' | 'submitted' | 'approved'>('input');
  const [verifyingAuto, setVerifyingAuto] = useState(false);
  
  // Dynamic 6-digit payment code generated per session/modal open
  const [sixDigitCode, setSixDigitCode] = useState<string>('839201');

  // Admin payment verification & credential state
  const [paymentQueue, setPaymentQueue] = useState<PaymentRequest[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [unlockedAdmin, setUnlockedAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Check if current logged-in user is admin (email: makieyosiyas83@gmail.com, or contains eyosiyasmaki123)
  const isAdmin = Boolean(
    unlockedAdmin ||
    (user.email && (user.email.toLowerCase().includes('makieyosiyas83@gmail.com') || user.email.toLowerCase().includes('eyosiyasmaki123'))) ||
    (user.phone && user.phone.toLowerCase().includes('eyosiyasmaki123')) ||
    (user.name && user.name.toLowerCase().includes('eyosiyasmaki123'))
  );

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');

    const cleanEmail = adminEmailInput.trim().toLowerCase();
    const cleanPass = adminPasswordInput.trim();

    if (
      (cleanEmail === 'makieyosiyas83@gmail.com' || cleanEmail.includes('eyosiyasmaki123') || cleanEmail.includes('makieyosiyas')) &&
      (cleanPass === 'eyosiyasmaki123@' || cleanPass === 'eyosiyasmaki123' || cleanPass.includes('eyosiyas'))
    ) {
      setUnlockedAdmin(true);
      setShowAdminLoginModal(false);
      setShowAdminPanel(true);
      setAdminEmailInput('');
      setAdminPasswordInput('');
    } else {
      setAdminLoginError('Invalid admin email or password.');
    }
  };

  useEffect(() => {
    if (showProModal) {
      // Generate a brand new unique 6-digit payment code every time someone opens payment modal
      const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSixDigitCode(freshCode);
      setTelebirrStep('input');
      setReceiptScreenshot('');
      setTelebirrRef('');
    }
  }, [showProModal]);

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

  const handleReceiptImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserSubmitTelebirr = async () => {
    if (!receiptScreenshot && (!telebirrRef || telebirrRef.trim().length < 4)) {
      alert(language === 'am' 
        ? 'እባክዎን የቴሌብር ክፍያ ደረሰኝ ፎቶ ያስገቡ ወይም የቴሌብር Transaction Ref ID ይጻፉ' 
        : 'Please upload a screenshot of your Telebirr receipt image OR enter your Telebirr Transaction ID');
      return;
    }

    setVerifyingAuto(true);

    try {
      const cleanRef = (telebirrRef || 'TLB' + Math.floor(10000000 + Math.random() * 90000000)).trim().toUpperCase();

      const newRequest: PaymentRequest = {
        id: 'req_' + Date.now(),
        userId: user.id || 'user_' + Date.now(),
        userName: user.name || 'Student',
        userPhone: senderPhone || user.phone || '0956778184',
        telebirrRef: cleanRef,
        sixDigitCode: sixDigitCode,
        receiptImage: receiptScreenshot,
        amount: 500,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await createPaymentRequestInFirestore(newRequest);

      // Trigger upgrade notification to admin email makieyosiyas@gmail.com
      fetch('/api/notify-admin-upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user.name || 'Student',
          userPhone: senderPhone || user.phone || '0956778184',
          userEmail: user.email || 'N/A',
          telebirrRef: cleanRef,
          sixDigitCode: sixDigitCode,
          amount: 500,
          receiptImage: receiptScreenshot,
        }),
      }).catch((e) => console.log('Notification API error:', e));

      setTelebirrStep('submitted');
      setVerifyingAuto(false);
    } catch (err) {
      setVerifyingAuto(false);
      alert(language === 'am' ? 'የመረብ ግንኙነት ችግር ተፈጥሯል።' : 'Network error submitting Telebirr payment receipt.');
    }
  };

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

        {/* Upgrade Plan Banner */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>EduEthiopia Pro</span>
            </span>
            <p className="text-[10px] text-neutral-400">Unlimited AI notes, quizzes, & exam prep</p>
          </div>

          <button
            onClick={() => setShowProModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors shadow-md"
          >
            {user.isPro ? 'Manage Plan' : 'Upgrade Plan'}
          </button>
        </div>
      </div>

      {/* App Owner Payment Verification Dashboard Button (Admin Panel Access) */}
      <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-3xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white flex items-center space-x-1.5">
              <span>Owner Payment Dashboard</span>
              {isAdmin ? (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.2 rounded">
                  ADMIN ACTIVE
                </span>
              ) : (
                <Lock className="w-3 h-3 text-neutral-400" />
              )}
            </h4>
            <p className="text-[10px] text-neutral-400">Verify Telebirr SMS & receive upgrade alerts</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isAdmin) {
              setShowAdminPanel(true);
            } else {
              setShowAdminLoginModal(true);
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-md shrink-0"
        >
          {isAdmin ? 'Open Admin' : 'Admin Login'}
        </button>
      </div>

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
      </div>

      {/* Pro Plan Upgrade Modal */}
      <AnimatePresence>
        {showProModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm">
                    PRO
                  </div>
                  <h3 className="font-bold text-base">EduEthiopia Pro Tier</h3>
                </div>
                <button
                  onClick={() => setShowProModal(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1 text-xs">
                {/* Monthly price header */}
                <div className="text-center bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                  <span className="text-3xl font-extrabold text-white font-mono">500 ETB</span>
                  <span className="text-neutral-400 text-xs ml-1 font-mono">/ month</span>
                  <span className="block text-emerald-400 text-[11px] mt-1 font-medium">
                    ⚡ {language === 'am' ? 'በቴሌብር ይክፈሉ — ወርሃዊ PRO አባልነት' : 'Monthly Telebirr PRO Membership'}
                  </span>
                </div>

                {telebirrStep === 'submitted' ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-sm text-amber-400">
                      {language === 'am' ? 'የክፍያ ደረሰኝ ለባለቤቱ ተልኳል!' : 'Receipt Submitted for Verification!'}
                    </h4>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {language === 'am'
                        ? `የላኩት የቴሌብር ደረሰኝ እና ልዩ የ 6-ዲጂት ኮድ (${sixDigitCode}) ለባለቤቱ ተልኳል። ባለቤቱ በቴሌብር SMS ማረጋገጫ ሲያረጋግጥ PRO ወዲያውኑ ይከፈታል።`
                        : `Your payment receipt with unique remark code ${sixDigitCode} was submitted to the owner dashboard. The app owner will verify your code against Telebirr SMS and activate your PRO access.`}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Step 1: 6-Digit Payment Code Banner */}
                    <div className="bg-neutral-950 p-3.5 rounded-2xl border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">
                          {language === 'am' ? 'ደረጃ 1፡ የእርስዎ 6-ዲጂት የክፍያ ኮድ' : 'Step 1: Your 6-Digit Payment Code'}
                        </span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                          Telebirr Reason / Remark
                        </span>
                      </div>

                      <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 text-center">
                        <div className="text-2xl font-black font-mono tracking-[0.3em] text-emerald-400 my-1">
                          {sixDigitCode}
                        </div>
                        <p className="text-[10px] text-neutral-300">
                          {language === 'am'
                            ? 'ለ 0956778184 (ቴሌብር) 500 ብር ሲልኩ በ "Reason/Remark" ቦታ ይህንን 6-ዲጂት ኮድ ያስገቡ!'
                            : 'Transfer 500 ETB to 0956778184 via Telebirr (*127#) and write this 6-digit code in the Reason / Description field.'}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Upload Screenshot of Payment Receipt */}
                    <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-2">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                        {language === 'am' ? 'ደረጃ 2፡ የቴሌብር ክፍያ ደረሰኝ ፎቶ (Screenshot)' : 'Step 2: Upload Telebirr Receipt Screenshot'}
                      </span>

                      <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl p-3 text-center bg-neutral-900/50">
                        {receiptScreenshot ? (
                          <div className="space-y-2">
                            <img
                              src={receiptScreenshot}
                              alt="Receipt Preview"
                              className="max-h-28 mx-auto rounded-lg border border-neutral-700 object-contain"
                            />
                            <span className="text-[10px] text-emerald-400 font-bold block">
                              ✓ {language === 'am' ? 'የክፍያ ደረሰኝ ተመርጧል' : 'Receipt screenshot loaded'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <Camera className="w-6 h-6 mx-auto text-neutral-400 mb-1" />
                            <p className="text-[11px] text-neutral-300 font-semibold">
                              {language === 'am' ? 'የቴሌብር ደረሰኝ ፎቶ እዚህ ይስቀሉ' : 'Attach Telebirr Receipt Screenshot'}
                            </p>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptImageUpload}
                          className="hidden"
                          id="telebirr-receipt-file-input"
                        />
                        <label
                          htmlFor="telebirr-receipt-file-input"
                          className="mt-2 inline-block px-3 py-1 bg-neutral-800 text-white rounded-lg text-[11px] font-bold cursor-pointer border border-neutral-700 hover:bg-neutral-700"
                        >
                          {receiptScreenshot
                            ? (language === 'am' ? 'ፎቶ ቀይር' : 'Change Screenshot')
                            : (language === 'am' ? 'ፎቶ ምረጥ' : 'Upload Screenshot')}
                        </label>
                      </div>
                    </div>

                    {/* Step 3: Optional Sender Phone & Ref ID */}
                    <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-2.5">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                        {language === 'am' ? 'ደረጃ 3፡ ስልክ እና SMS Ref (አማራጭ)' : 'Step 3: Phone & Transaction Ref (Optional)'}
                      </span>

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">
                          {language === 'am' ? 'የእርስዎ ቴሌብር ስልክ ቁጥር:' : 'Your Sender Telebirr Phone:'}
                        </label>
                        <input
                          type="tel"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="0912345678"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-neutral-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">
                          {language === 'am' ? 'የቴሌብር Transaction Ref ID (ለምሳሌ TLB9823412):' : 'Telebirr SMS Ref ID (e.g. TLB9823412):'}
                        </label>
                        <input
                          type="text"
                          value={telebirrRef}
                          onChange={(e) => setTelebirrRef(e.target.value.toUpperCase())}
                          placeholder="TLB98234102"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-neutral-500 tracking-wider"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sticky Footer Pay Button */}
              <div className="pt-3 border-t border-neutral-800 shrink-0">
                {verifyingAuto ? (
                  <div className="w-full py-3.5 rounded-2xl bg-neutral-800 text-white font-bold text-xs text-center flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>{language === 'am' ? 'የቴሌብር ደረሰኝ እየተላከ ነው...' : 'Submitting Receipt to Owner...'}</span>
                  </div>
                ) : telebirrStep === 'submitted' ? (
                  <button
                    onClick={() => setShowProModal(false)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 text-black font-extrabold text-xs text-center shadow-lg hover:bg-amber-400 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Clock className="w-4 h-4 text-black" />
                    <span>{language === 'am' ? 'የባለቤት ማረጋገጫ በመጠበቅ ላይ (ዝጋ)' : 'Pending Owner Verification (Close)'}</span>
                  </button>
                ) : telebirrStep === 'approved' || user.isPro ? (
                  <button
                    onClick={() => {
                      alert(language === 'am' 
                        ? '🎉 የኢዱኢትዮጵያ PRO አባልነትዎ በስራ ላይ ነው! ያልተገደበ አገልግሎት ተከፍቷል።' 
                        : '🎉 Your EduEthiopia PRO subscription is active! Unlimited AI study tools unlocked.');
                      setShowProModal(false);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-extrabold text-xs text-center shadow-lg hover:bg-emerald-400 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>⚡ {language === 'am' ? 'PRO ተከፍቷል!' : 'PRO Activated!'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUserSubmitTelebirr}
                    className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-neutral-200 transition-all flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>{language === 'am' ? 'የክፍያ ደረሰኝ ላክ (500 ETB)' : 'Submit Receipt for Verification (500 ETB)'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
