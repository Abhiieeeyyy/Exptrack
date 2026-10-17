import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Receipt, 
  Upload, 
  Eye, 
  Building, 
  CreditCard, 
  Banknote,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function FinanceWallet({ onNavigate }) {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewExpense, setPreviewExpense] = useState(null);

  const loadWallet = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getFinanceMemberBalance(user.id);
      setBalanceData(data);
    } catch (err) {
      console.error('Error loading finance wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user]);

  const availableBalance = balanceData?.availableBalance || 0;
  const totalCredited = balanceData?.totalCredited || 0;
  const totalDebited = balanceData?.totalDebited || 0;
  const pendingBillsAmount = balanceData?.pendingBillsAmount || 0;
  const pendingBillsCount = balanceData?.pendingBillsCount || 0;
  const approvedBillsCount = balanceData?.approvedBillsCount || 0;

  const credits = balanceData?.creditsList || [];
  const expenses = balanceData?.expensesList || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Hero Wallet Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Finance Management Portal &bull; Official Event Budget</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome, {user?.full_name || user?.username}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Admin credits money to your account. When your submitted expense bills are approved by Admin, the amount is automatically debited from your credited balance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/finance/upload')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/40 hover:scale-102 active:scale-98 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Submit New Bill</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/finance/history')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-slate-400" />
              <span>My Bills Ledger</span>
            </button>
          </div>
        </div>

        {/* Big Balance Breakdown Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          
          {/* 1. Available Balance */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Available Balance</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {formatINR(availableBalance)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">
              Ready for festival expenditures
            </div>
          </div>

          {/* 2. Total Credited by Admin */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Credited</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {formatINR(totalCredited)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {credits.length} credit allocations by Admin
            </div>
          </div>

          {/* 3. Approved Debits (Spent) */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Debited (Spent)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {formatINR(totalDebited)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {approvedBillsCount} approved bills debited
            </div>
          </div>

          {/* 4. Pending Review */}
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-5 border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {formatINR(pendingBillsAmount)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pendingBillsCount} bills awaiting admin audit
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Columns: Credits Log & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Admin Credit Allocations */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Credit Allocations from Admin</h3>
                <p className="text-[11px] text-slate-500">Advance funds transferred by Admin for expenses</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {credits.length} Credits
            </span>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading credits...</div>
            ) : credits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Coins className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No credit funds allocated yet.</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Admin will disburse initial or top-up funds to your account for spending.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {credits.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{formatINR(c.amount)}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                          {c.payment_mode || 'TRANSFER'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {c.notes || 'Event Advance Funds'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Credited by <span className="font-semibold text-slate-600">{c.credited_by_name || 'Administrator'}</span> &bull; {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {c.reference_number && ` &bull; Ref: ${c.reference_number}`}
                      </div>
                    </div>

                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                      + {formatINR(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Recent Submitted Expense Bills */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Submitted Bills</h3>
                <p className="text-[11px] text-slate-500">Audit status and debits against your balance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/finance/history')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading bills...</div>
            ) : expenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No bills submitted yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('/finance/upload')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit First Bill</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.slice(0, 6).map((exp) => (
                  <div key={exp.id} className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition flex items-center justify-between gap-3">
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="font-bold text-slate-900 text-xs">{exp.category}</div>
                      {exp.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{exp.description}</p>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {new Date(exp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-xs font-bold text-slate-900">
                        {formatINR(exp.amount, true)}
                      </div>
                      <StatusBadge status={exp.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bill Preview Modal */}
      <Modal
        isOpen={Boolean(previewExpense)}
        onClose={() => setPreviewExpense(null)}
        title={previewExpense ? `${previewExpense.category} - ${formatINR(previewExpense.amount, true)}` : 'Bill Document'}
        subtitle={previewExpense ? (previewExpense.description || 'Submitted Bill') : ''}
        maxWidth="max-w-2xl"
      >
        {previewExpense && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <StatusBadge status={previewExpense.status} />
              <span className="text-xs text-slate-500">
                Submitted on {new Date(previewExpense.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 border border-slate-800 max-h-[450px]">
              <img
                src={previewExpense.bill_image_url}
                alt="Bill Receipt"
                className="max-h-[420px] w-auto object-contain rounded"
              />
            </div>

            {previewExpense.rejection_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold block mb-0.5">Admin Rejection Note:</span>
                {previewExpense.rejection_reason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
