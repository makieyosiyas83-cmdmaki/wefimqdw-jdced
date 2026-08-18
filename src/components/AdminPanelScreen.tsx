import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  Phone,
  Search,
  Lock,
  LogOut,
  ArrowLeft,
  Eye,
  Clock,
  HelpCircle,
  DollarSign,
  Users,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
  UserPlus
} from 'lucide-react';
import { PaymentRequest, UserProfile } from '../types';
import { APP_CONFIG } from '../config';
import {
  fetchAllPaymentRequestsFromFirestore,
  updatePaymentRequestStatusInFirestore,
  saveUserProfileToFirestore,
  fetchUserProfileFromFirestore
} from '../lib/db';

interface AdminPanelScreenProps {
  onExitAdmin: () => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  onExitAdmin,
  user,
  setUser,
}) => {
  const [paymentQueue, setPaymentQueue] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  
  // Manual PRO Grant State
  const [showManualGrantModal, setShowManualGrantModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualGrantLoading, setManualGrantLoading] = useState(false);
  const [manualGrantSuccess, setManualGrantSuccess] = useState('');
  const [manualGrantError, setManualGrantError] = useState('');

  // Toast / notification
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const requests = await fetchAllPaymentRequestsFromFirestore();
      setPaymentQueue(requests);
    } catch (err) {
      console.error('Failed to fetch admin queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (req: PaymentRequest) => {
    try {
      // 1. Update request status in Firestore
      await updatePaymentRequestStatusInFirestore(req.id, 'approved');

      // 2. Grant PRO to user in Firestore
      if (req.userId) {
        const studentProfile = await fetchUserProfileFromFirestore(req.userId);
        if (studentProfile) {
          studentProfile.isPro = true;
          await saveUserProfileToFirestore(studentProfile);
        } else {
          // If profile doc doesn't exist yet, save basic doc with isPro: true
          await saveUserProfileToFirestore({
            id: req.userId,
            name: req.userName || 'Student',
            phone: req.userPhone,
            authMethod: 'phone',
            ethiopianBirthday: { day: 1, month: 'Meskerem', year: 2016 },
            language: 'en',
            grade: 11,
            isPro: true,
          });
        }

        // If approving current active user, update local state
        if (req.userId === user.id) {
          setUser((prev) => ({ ...prev, isPro: true }));
        }
      }

      // Update local queue list
      setPaymentQueue((prev) =>
        prev.map((item) => (item.id === req.id ? { ...item, status: 'approved' } : item))
      );

      showToast(`✅ Approved payment for ${req.userName || 'Student'}. PRO membership granted!`);
    } catch (err: any) {
      console.error('Failed to approve request:', err);
      showToast('❌ Failed to approve payment. Please check network connection.');
    }
  };

  const handleReject = async (req: PaymentRequest) => {
    try {
      await updatePaymentRequestStatusInFirestore(req.id, 'rejected');
      setPaymentQueue((prev) =>
        prev.map((item) => (item.id === req.id ? { ...item, status: 'rejected' } : item))
      );
      showToast(`❌ Payment request rejected for ${req.userName || 'Student'}.`);
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      showToast('❌ Failed to update request.');
    }
  };

  const handleManualGrantPro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId.trim()) return;

    setManualGrantLoading(true);
    setManualGrantSuccess('');
    setManualGrantError('');

    try {
      const cleanId = manualStudentId.trim();
      const existing = await fetchUserProfileFromFirestore(cleanId);
      if (existing) {
        existing.isPro = true;
        await saveUserProfileToFirestore(existing);
      } else {
        await saveUserProfileToFirestore({
          id: cleanId,
          name: 'Granted Student',
          authMethod: 'email',
          ethiopianBirthday: { day: 1, month: 'Meskerem', year: 2016 },
          language: 'en',
          grade: 11,
          isPro: true,
        });
      }

      setManualGrantSuccess(`🎉 Successfully granted PRO status to User ID: ${cleanId}`);
      setManualStudentId('');
      if (cleanId === user.id) {
        setUser((prev) => ({ ...prev, isPro: true }));
      }
    } catch (err: any) {
      setManualGrantError('Failed to grant PRO: ' + (err.message || 'Unknown error'));
    } finally {
      setManualGrantLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard: ${text}`);
  };

  // Filtered requests
  const filteredQueue = paymentQueue.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (req.userName && req.userName.toLowerCase().includes(q)) ||
      (req.userPhone && req.userPhone.includes(q)) ||
      (req.telebirrRef && req.telebirrRef.toLowerCase().includes(q)) ||
      (req.sixDigitCode && req.sixDigitCode.includes(q));
    return matchesStatus && matchesQuery;
  });

  // Calculate statistics
  const pendingCount = paymentQueue.filter((r) => r.status === 'pending').length;
  const approvedCount = paymentQueue.filter((r) => r.status === 'approved').length;
  const totalRevenue = approvedCount * APP_CONFIG.proPriceETB;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans pb-16">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
          >
            <div className="bg-emerald-500 text-black px-4 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center justify-between border border-emerald-400">
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg('')} className="p-1 hover:bg-black/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur-xl border-b border-neutral-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExitAdmin}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors flex items-center space-x-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to App</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
              <h1 className="text-sm font-black text-white tracking-wide">EduEthiopia Admin Portal</h1>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Owner Email: {APP_CONFIG.adminEmail}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ADMIN ACTIVE</span>
          </span>
          <button
            onClick={onExitAdmin}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors flex items-center space-x-1"
            title="Exit Admin Mode"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Email Notification Alert Status Banner */}
        <div className="bg-neutral-900/90 border border-emerald-500/30 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xs text-white">Automated Admin Email Dispatches</h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Receipt uploads send instant notifications to <span className="text-emerald-400 font-mono">{APP_CONFIG.adminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowManualGrantModal(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs flex items-center space-x-1.5 hover:bg-emerald-400 transition-colors shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Grant PRO Manually</span>
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-mono font-bold">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</p>
            <p className="text-[10px] text-neutral-500">Requires Telebirr check</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-mono font-bold">
              <span>Approved PRO</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 font-mono">{approvedCount}</p>
            <p className="text-[10px] text-neutral-500">Unlimited users</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-mono font-bold">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-emerald-400">ETB</span></p>
            <p className="text-[10px] text-neutral-500">500 ETB per subscription</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-neutral-400 text-[10px] uppercase font-mono font-bold">
              <span>Total Requests</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{paymentQueue.length}</p>
            <p className="text-[10px] text-neutral-500">All payment records</p>
          </div>
        </div>

        {/* Verification Queue Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                <span>Telebirr Payment Requests</span>
                <span className="text-xs bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full">
                  {filteredQueue.length}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Verify 6-Digit Remark Codes against Telebirr SMS notifications.
              </p>
            </div>

            <button
              onClick={fetchQueue}
              disabled={loading}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 text-xs font-bold transition-colors flex items-center space-x-2 border border-neutral-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, Telebirr Ref, or 6-digit code..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-2xl border border-neutral-800 shrink-0">
              {(['pending', 'all', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                    statusFilter === tab
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab === 'pending' ? `Pending (${pendingCount})` : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List / Cards */}
          {loading ? (
            <div className="text-center py-12 text-neutral-400 text-xs space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Fetching payment requests from Firestore...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="text-center py-12 bg-neutral-950 rounded-2xl border border-neutral-800 p-6">
              <Shield className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-300">No payment requests found</p>
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try clearing your search query or changing filters.'
                  : 'When students submit Telebirr receipts, they will appear here instantly.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((req) => (
                <div
                  key={req.id}
                  className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 md:p-5 space-y-4 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-850">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-white">{req.userName || 'Student'}</span>
                        <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
                          500 ETB
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-neutral-400 font-mono mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{req.userPhone || 'N/A'}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <span
                      className={`self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase border ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : req.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {req.status === 'pending' ? '⏳ PENDING VERIFICATION' : req.status}
                    </span>
                  </div>

                  {/* Codes & Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 6-Digit Remark Code */}
                    <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-mono font-bold block uppercase">
                          Telebirr Remark / Reason Code:
                        </span>
                        <span className="font-black text-emerald-400 text-base tracking-widest font-mono">
                          {req.sixDigitCode || 'N/A'}
                        </span>
                      </div>
                      {req.sixDigitCode && (
                        <button
                          onClick={() => copyToClipboard(req.sixDigitCode!, '6-Digit Code')}
                          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Telebirr Ref ID */}
                    <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-mono font-bold block uppercase">
                          Telebirr Transaction Ref ID:
                        </span>
                        <span className="font-extrabold text-white text-sm font-mono">
                          {req.telebirrRef || 'N/A'}
                        </span>
                      </div>
                      {req.telebirrRef && (
                        <button
                          onClick={() => copyToClipboard(req.telebirrRef, 'Transaction Ref')}
                          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg transition-colors"
                          title="Copy Ref"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Uploaded Receipt Image Thumbnail */}
                  {req.receiptImage && (
                    <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={req.receiptImage}
                          alt="Telebirr Receipt"
                          className="w-16 h-16 rounded-lg object-cover border border-neutral-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedReceiptImage(req.receiptImage!)}
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">Uploaded Payment Screenshot</span>
                          <span className="text-[10px] text-neutral-400">Click to view enlarged screenshot</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedReceiptImage(req.receiptImage!)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center space-x-1 self-start sm:self-auto border border-neutral-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View Full Screen</span>
                      </button>
                    </div>
                  )}

                  {/* Actions for Pending Requests */}
                  {req.status === 'pending' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <button
                        onClick={() => handleApprove(req)}
                        className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 fill-black text-emerald-500" />
                        <span>APPROVE (GRANT UNLIMITED PRO)</span>
                      </button>

                      <button
                        onClick={() => handleReject(req)}
                        className="py-3 px-4 rounded-xl bg-neutral-900 hover:bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span>REJECT (INVALID RECEIPT)</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {selectedReceiptImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-4 relative flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-800">
                <span className="font-bold text-xs text-white">Telebirr Receipt Screenshot</span>
                <button
                  onClick={() => setSelectedReceiptImage(null)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center p-2">
                <img
                  src={selectedReceiptImage}
                  alt="Enlarged Receipt"
                  className="max-h-[70vh] w-auto object-contain rounded-xl border border-neutral-800"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 text-center">
                <button
                  onClick={() => setSelectedReceiptImage(null)}
                  className="px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Grant PRO Modal */}
      <AnimatePresence>
        {showManualGrantModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl relative space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm">Grant Unlimited PRO Status</h3>
                </div>
                <button
                  onClick={() => {
                    setShowManualGrantModal(false);
                    setManualGrantSuccess('');
                    setManualGrantError('');
                  }}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Enter a student's User ID or Phone Number to grant them permanent PRO status without requiring a Telebirr receipt.
              </p>

              <form onSubmit={handleManualGrantPro} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1 uppercase font-bold">
                    Student User ID or Phone
                  </label>
                  <input
                    type="text"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    placeholder="e.g. user_12345 or 0912345678"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {manualGrantSuccess && (
                  <p className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    {manualGrantSuccess}
                  </p>
                )}

                {manualGrantError && (
                  <p className="text-[11px] text-red-400 font-medium bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    {manualGrantError}
                  </p>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualGrantModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={manualGrantLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg disabled:opacity-50"
                  >
                    {manualGrantLoading ? 'Granting PRO...' : 'Grant PRO Access'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
