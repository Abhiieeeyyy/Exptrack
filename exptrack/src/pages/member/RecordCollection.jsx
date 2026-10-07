import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api, PAYMENT_MODES } from '../../services/api';
import MoneyInput from '../../components/MoneyInput';
import Modal from '../../components/Modal';
import confetti from 'canvas-confetti';
import { 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  CreditCard, 
  Building, 
  Banknote, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  MapPin,
  Layers,
  Settings,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '../../lib/money';

// Helper to format 001-01 up to 001-50
export const formatReceiptLeaf = (bookNo, leafNo) => {
  const cleanBook = parseInt(bookNo, 10) || 1;
  const cleanLeaf = parseInt(leafNo, 10) || 1;
  const bookStr = String(cleanBook).padStart(3, '0');
  const leafStr = String(cleanLeaf).padStart(2, '0');
  return `${bookStr}-${leafStr}`;
};

export default function RecordCollection({ onCollectionAdded }) {
  const { user } = useAuth();
  const sessionKey = user ? `fecms_book_session_${user.id}` : 'fecms_book_session_default';

  // Book & Area Session State
  const [bookSession, setBookSession] = useState(() => {
    try {
      const saved = localStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bookNo && parsed.currentLeaf <= 50) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Modal for setting/changing Book & Area
  const [sessionModalOpen, setSessionModalOpen] = useState(!bookSession);
  const [inputBookNo, setInputBookNo] = useState('');
  const [inputArea, setInputArea] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [bookCompletedModal, setBookCompletedModal] = useState(false);
  const [completedBookInfo, setCompletedBookInfo] = useState(null);

  // Form Fields
  const [receiptNumber, setReceiptNumber] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID'); // 'PAID' (Received Now) or 'PENDING' (Receipt Given, Will Pay Later)
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successData, setSuccessData] = useState(null);

  // Synchronize continuous leaf number across all collectors whenever book session is active
  useEffect(() => {
    let isMounted = true;

    const syncContinuousBookLeaf = async () => {
      if (!bookSession) {
        setSessionModalOpen(true);
        return;
      }

      try {
        const leafInfo = await api.getNextLeafForBook(bookSession.bookNo);
        if (!isMounted) return;

        if (leafInfo.isCompleted) {
          setCompletedBookInfo({
            bookNo: bookSession.bookNo,
            area: bookSession.area
          });
          setBookCompletedModal(true);
          return;
        }

        // Seamless continuous advancement if any other user already entered leaves in this book
        const continuousLeaf = leafInfo.nextLeaf;
        const formattedLeaf = leafInfo.formattedLeaf;

        if (continuousLeaf !== bookSession.currentLeaf) {
          const updatedSession = {
            ...bookSession,
            currentLeaf: continuousLeaf
          };
          setBookSession(updatedSession);
          localStorage.setItem(sessionKey, JSON.stringify(updatedSession));
        }

        setReceiptNumber(formattedLeaf);
        if (!donorAddress && bookSession.area) {
          setDonorAddress(bookSession.area);
        }
        setSessionModalOpen(false);
      } catch (err) {
        console.warn('Continuous leaf synchronization notice:', err);
      }
    };

    syncContinuousBookLeaf();

    return () => { isMounted = false; };
  }, [bookSession?.bookNo]);

  // Handle saving Book & Area configuration with continuous leaf check
  const handleSaveBookSession = async (e) => {
    if (e) e.preventDefault();
    const cleanBook = parseInt(inputBookNo, 10);
    if (!inputBookNo || isNaN(cleanBook) || cleanBook <= 0) {
      setSessionError('Please enter a valid positive Book Number (e.g. 1, 2, 3...)');
      return;
    }
    if (!inputArea.trim()) {
      setSessionError('Please enter the Collection Area (e.g. Sector 4, North Zone)');
      return;
    }

    try {
      // Check database/ledger for the latest recorded leaf in this book
      const leafInfo = await api.getNextLeafForBook(cleanBook);
      if (leafInfo.isCompleted) {
        setSessionError(`Book #${String(cleanBook).padStart(3, '0')} has already completed all 50 leaves (100% recorded). Please choose another Book Number.`);
        return;
      }

      const newSession = {
        bookNo: cleanBook,
        area: inputArea.trim(),
        currentLeaf: leafInfo.nextLeaf,
        totalLeaves: 50
      };

      localStorage.setItem(sessionKey, JSON.stringify(newSession));
      setBookSession(newSession);
      setReceiptNumber(leafInfo.formattedLeaf);
      setSessionError('');
      setSessionModalOpen(false);
      setBookCompletedModal(false);
      setDonorAddress(inputArea.trim());
    } catch (err) {
      setSessionError(err.message || 'Failed to initialize book');
    }
  };

  const handleOpenEditSession = () => {
    if (bookSession) {
      setInputBookNo(String(bookSession.bookNo));
      setInputArea(bookSession.area || '');
    } else {
      setInputBookNo('1');
      setInputArea('');
    }
    setSessionError('');
    setSessionModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!receiptNumber.trim()) errs.receiptNumber = 'Receipt leaf number is required';
    if (!donorName.trim()) errs.donorName = 'Donor name is required';
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      errs.amount = 'Valid collection amount (> ₹0) is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookSession) {
      setSessionModalOpen(true);
      return;
    }
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const currentBookNo = bookSession.bookNo;
      const currentArea = bookSession.area;

      // Verify the latest continuous leaf right before recording
      const latestLeafInfo = await api.getNextLeafForBook(currentBookNo);
      if (latestLeafInfo.isCompleted) {
        setCompletedBookInfo({
          bookNo: currentBookNo,
          area: currentArea
        });
        localStorage.removeItem(sessionKey);
        setBookSession(null);
        setInputBookNo(String(currentBookNo + 1));
        setInputArea(currentArea);
        setBookCompletedModal(true);
        setSaving(false);
        return;
      }

      const activeReceiptNo = latestLeafInfo.formattedLeaf;

      const payload = {
        receipt_book_number: activeReceiptNo,
        collected_by_user_id: user.id,
        collector_name: user.full_name || user.username,
        donor_name: donorName.trim(),
        donor_address: (donorAddress || currentArea).trim(),
        donor_phone: donorPhone.trim(),
        amount: Number(amount),
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        reference_number: (paymentMode === 'UPI' || paymentMode === 'CASH') ? '' : referenceNumber.trim(),
        notes: notes.trim(),
      };

      const res = await api.createCollection(payload);

      // Trigger celebratory confetti
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.7 }
      });

      setSuccessData(res);

      // Reset transaction form fields (keep area)
      setDonorName('');
      setDonorPhone('');
      setAmount('');
      setPaymentStatus('PAID');
      setReferenceNumber('');
      setNotes('');

      // Query the next available leaf in this book
      const nextLeafInfo = await api.getNextLeafForBook(currentBookNo);

      if (nextLeafInfo.isCompleted) {
        // Book is fully recorded (50/50 leaves)
        setCompletedBookInfo({
          bookNo: currentBookNo,
          area: currentArea
        });
        localStorage.removeItem(sessionKey);
        setBookSession(null);
        setInputBookNo(String(currentBookNo + 1));
        setInputArea(currentArea);
        setBookCompletedModal(true);
      } else {
        // Increment continuous leaf counter automatically
        const updatedSession = {
          ...bookSession,
          currentLeaf: nextLeafInfo.nextLeaf
        };
        localStorage.setItem(sessionKey, JSON.stringify(updatedSession));
        setBookSession(updatedSession);
        setReceiptNumber(nextLeafInfo.formattedLeaf);
      }

      if (onCollectionAdded) onCollectionAdded();
    } catch (err) {
      if (err.field) {
        setErrors({ [err.field === 'receipt_book_number' ? 'receiptNumber' : err.field]: err.message });
      } else {
        setErrors({ general: err.message || 'Failed to save collection entry' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Field Collector Desk</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Record New Collection
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Every rupee collected links to a numbered receipt leaf & verified donor record.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-right shrink-0">
          <div className="text-[11px] text-slate-400 font-medium">Logged Collector</div>
          <div className="text-sm font-bold text-emerald-400">{user?.full_name}</div>
        </div>
      </div>

      {/* Active Book & Collection Area Status Card */}
      {bookSession && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/30 p-4 sm:p-5 text-white shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Book #{String(bookSession.bookNo).padStart(3, '0')}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Area: <strong className="text-white ml-0.5">{bookSession.area}</strong>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                  <Layers className="w-3 h-3 text-emerald-300" />
                  Leaf {bookSession.currentLeaf} of 50
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Current Leaf: <strong className="text-emerald-400 font-bold">{formatReceiptLeaf(bookSession.bookNo, bookSession.currentLeaf)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleOpenEditSession}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Book / Area</span>
              </button>
            </div>
          </div>

          {/* Progress Bar (Leaves 1 to 50) */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
              <span>Book Progress ({bookSession.currentLeaf - 1}/50 Leaves Completed)</span>
              <span>{Math.round(((bookSession.currentLeaf - 1) / 50) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, ((bookSession.currentLeaf - 1) / 50) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {successData && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Collection Successfully Recorded!
              </p>
              <p className="text-xs text-emerald-700">
                Receipt Leaf <span className="font-mono font-bold">#{successData.receipt_book_number}</span> for{' '}
                <span className="font-bold">{formatINR(successData.amount, true)}</span> ({successData.donor_name}) saved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Collection Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        {errors.general && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Amount Input */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80">
          <MoneyInput
            value={amount}
            onChange={setAmount}
            label="Collection Amount (INR)"
            error={errors.amount}
            autoFocus
            showChips={true}
          />
        </div>

        {/* Receipt & Donor Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Receipt Book Leaf No. <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={receiptNumber}
                readOnly={Boolean(bookSession)}
                onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 001-01"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono font-bold tracking-wide transition focus:outline-none focus:ring-2 ${
                  bookSession 
                    ? 'bg-slate-50 border-emerald-300 text-emerald-900 cursor-not-allowed font-extrabold'
                    : errors.receiptNumber
                      ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200 text-rose-900'
                      : 'border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-200 text-slate-900'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Auto #{bookSession ? `Leaf ${bookSession.currentLeaf}/50` : 'Unique'}
              </span>
            </div>
            {errors.receiptNumber ? (
              <p className="text-xs font-medium text-rose-600 mt-1">{errors.receiptNumber}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                {bookSession 
                  ? `Incrementing automatically for Book #${String(bookSession.bookNo).padStart(3, '0')}`
                  : 'Receipt leaf numbers cannot be duplicated.'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Donor / Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="e.g. Shri Rajesh Mehta / ABC Corp"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 ${
                errors.donorName
                  ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-200'
              }`}
            />
            {errors.donorName && (
              <p className="text-xs font-medium text-rose-600 mt-1">{errors.donorName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Donor Phone / Mobile (Optional)
            </label>
            <input
              type="tel"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Area / Location Address
            </label>
            <input
              type="text"
              value={donorAddress}
              onChange={(e) => setDonorAddress(e.target.value)}
              placeholder={bookSession?.area ? `Default: ${bookSession.area}` : 'e.g. Flat 301, Sector 4'}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

        </div>

        {/* Payment Collection Status Option */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Collection &amp; Payment Status <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentStatus('PAID')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                paymentStatus === 'PAID'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base shrink-0 ${
                paymentStatus === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                ✓
              </div>
              <div>
                <div className="text-xs font-bold">Amount Received Now</div>
                <div className="text-[11px] text-slate-500">Cash / UPI collected along with receipt</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentStatus('PENDING')}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
                paymentStatus === 'PENDING'
                  ? 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base shrink-0 ${
                paymentStatus === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                ⏳
              </div>
              <div>
                <div className="text-xs font-bold">Receipt Issued • Payment Later</div>
                <div className="text-[11px] text-slate-500">Trackable as pending; update when paid</div>
              </div>
            </button>
          </div>

          {paymentStatus === 'PENDING' && (
            <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
              <span className="text-amber-600 font-bold">ℹ️</span>
              <span>
                <strong>Pending Collection:</strong> Leaf #{receiptNumber} will be issued to the donor and recorded. You can update this entry to &quot;Paid&quot; anytime from your <strong>My Book &amp; History</strong> tab once the money is received.
              </span>
            </div>
          )}
        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {paymentStatus === 'PENDING' ? 'Expected / Promised Payment Mode' : 'Payment Mode'} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PAYMENT_MODES.map((mode) => {
              const isSelected = paymentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPaymentMode(mode.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm mb-1">
                    {mode.id === 'CASH' && '💵'}
                    {mode.id === 'UPI' && '📱'}
                    {mode.id === 'BANK_TRANSFER' && '🏦'}
                    {mode.id === 'CHEQUE' && '📄'}
                  </span>
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference Number: ONLY for Cheque or Bank Transfer (UPI Reference ID removed per requirement) */}
        {(paymentMode === 'CHEQUE' || paymentMode === 'BANK_TRANSFER') && (
          <div className="animate-in fade-in">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {paymentMode === 'CHEQUE' && 'Cheque Number & Bank Name'}
              {paymentMode === 'BANK_TRANSFER' && 'NEFT / RTGS / UTR Reference Number'}
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. CHQ-448201 or UTR-998273"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>
        )}

        {/* Remarks / Purpose Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Remarks / Specific Purpose (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Stage decoration sponsorship or festival pass donation"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setDonorName('');
              setAmount('');
              setNotes('');
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-900/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Recording Collection...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Collection Leaf</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Setup / Change Book & Area Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => {
          if (bookSession) setSessionModalOpen(false);
        }}
        title="Field Collector Book Setup"
        subtitle="Specify the receipt book number and collection area for auto leaf numbering (001-01 to 001-50)."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBookSession} className="space-y-4">
          {sessionError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{sessionError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Book Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={inputBookNo}
                onChange={(e) => setInputBookNo(e.target.value)}
                placeholder="e.g. 1 (Formats to Book #001)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Entering Book <strong>1</strong> will generate leaves <strong>001-01</strong> up to <strong>001-50</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Area of Collection <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={inputArea}
              onChange={(e) => setInputArea(e.target.value)}
              placeholder="e.g. Sector 4 / Main Market / East Ward"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Assigned collection zone or neighborhood for this book.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            {bookSession && (
              <button
                type="button"
                onClick={() => setSessionModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
            >
              Start Book &amp; Begin Recording
            </button>
          </div>
        </form>
      </Modal>

      {/* Book Completed Modal (After leaf 50 is saved) */}
      <Modal
        isOpen={bookCompletedModal}
        onClose={() => {}}
        title="🎉 Book Completed (50/50 Leaves)"
        subtitle="You have successfully recorded all 50 receipt leaves for this book."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-emerald-950">
              Book #{completedBookInfo ? String(completedBookInfo.bookNo).padStart(3, '0') : ''} Complete!
            </p>
            <p className="text-xs text-emerald-700">
              Leaves {completedBookInfo ? formatReceiptLeaf(completedBookInfo.bookNo, 1) : ''} to {completedBookInfo ? formatReceiptLeaf(completedBookInfo.bookNo, 50) : ''} are recorded.
            </p>
          </div>

          <p className="text-xs text-slate-600">
            Please specify the <strong>Next Book Number</strong> and <strong>Area</strong> to proceed with the next batch of collections.
          </p>

          <form onSubmit={handleSaveBookSession} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Book Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={inputBookNo}
                onChange={(e) => setInputBookNo(e.target.value)}
                placeholder="e.g. 2"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Area of Collection <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={inputArea}
                onChange={(e) => setInputArea(e.target.value)}
                placeholder="e.g. Sector 5 / New Colony"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {sessionError && (
              <p className="text-xs text-rose-600 font-medium">{sessionError}</p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Activate Next Book &amp; Continue
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
