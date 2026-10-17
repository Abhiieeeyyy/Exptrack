import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import confetti from 'canvas-confetti';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  AlertTriangle, 
  Calendar, 
  User, 
  Clock, 
  FileText, 
  ExternalLink,
  Receipt,
  Sparkles,
  Wallet,
  ArrowDownLeft,
  Coins
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function AdminApprovals({ onApprovedOrRejected }) {
  const { user } = useAuth();
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [submitterBalances, setSubmitterBalances] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals state
  const [previewItem, setPreviewItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadPendingQueue = async () => {
    setLoading(true);
    try {
      const allExpenses = await api.getExpenses({ status: 'PENDING' });
      setPendingExpenses(allExpenses);

      // Load balances for all submitters
      const userIds = Array.from(new Set(allExpenses.map(e => e.submitted_by_user_id).filter(Boolean)));
      const balMap = {};
      await Promise.all(
        userIds.map(async (uid) => {
          const bal = await api.getFinanceMemberBalance(uid);
          if (bal) balMap[uid] = bal;
        })
      );
      setSubmitterBalances(balMap);
    } catch (err) {
      console.error('Error loading pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingQueue();
  }, []);

  const handleApprove = async (expense) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.approveExpense(expense.id, user);

      // Trigger confetti on approval
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      const submitterName = expense.submitter_name || 'Finance Member';
      const bal = submitterBalances[expense.submitted_by_user_id];
      const newBal = bal ? (bal.availableBalance - expense.amount) : null;
      const balNote = newBal !== null ? ` (Remaining available balance: ${formatINR(newBal)})` : '';

      setSuccessToast(`Bill for ${formatINR(expense.amount)} approved and debited from @${submitterName}'s allocation!${balNote}`);
      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      if (previewItem?.id === expense.id) {
        setPreviewItem(null);
      }
      if (onApprovedOrRejected) onApprovedOrRejected();
      setTimeout(() => setSuccessToast(''), 8000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to approve expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (expense) => {
    setRejectItem(expense);
    setRejectReason('');
    setErrorMsg('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg('Mandatory: Please provide a specific reason for rejection to inform the member.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.rejectExpense(rejectItem.id, rejectReason, user);
      setSuccessToast(`Bill for ${formatINR(rejectItem.amount)} has been rejected. No funds were debited.`);
      setPendingExpenses(prev => prev.filter(e => e.id !== rejectItem.id));
      setRejectItem(null);
      if (previewItem?.id === rejectItem.id) {
        setPreviewItem(null);
      }
      if (onApprovedOrRejected) onApprovedOrRejected();
      setTimeout(() => setSuccessToast(''), 6000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject expense');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Audit &amp; Verification Gate</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Expense Bills Approval Queue
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Approving a bill debits the amount from the submitting Finance Manager's credited balance and registers it in official expenditure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-right shrink-0">
            <div className="text-[11px] text-slate-400 font-medium">Pending Volume</div>
            <div className="text-sm font-extrabold text-amber-400">
              {pendingExpenses.length} bills ({formatINR(totalPendingAmount)})
            </div>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Table / Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-medium">Checking pending submissions...</p>
          </div>
        ) : pendingExpenses.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Approval Queue is All Clear!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no pending expense bills awaiting review. Every submitted bill has been audited.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Category &amp; Finance Manager</th>
                  <th className="py-3.5 px-4">Bill Amount &amp; Debit Impact</th>
                  <th className="py-3.5 px-4">Description &amp; Justification</th>
                  <th className="py-3.5 px-4">Bill Receipt</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Audit Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingExpenses.map((expense) => {
                  const bal = submitterBalances[expense.submitted_by_user_id];
                  const hasBal = Boolean(bal);
                  const available = bal ? bal.availableBalance : 0;
                  const isOverdraft = available < expense.amount;
                  const remainingAfter = available - expense.amount;

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{expense.category}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{expense.submitter_name || 'Member'}</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Wallet className="w-2.5 h-2.5" />
                            <span>Finance Manager</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatINR(expense.amount, true)}
                        </div>
                        {hasBal && (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[10px] text-slate-500">
                              Available: <span className="font-bold text-slate-700">{formatINR(available)}</span>
                            </div>
                            {isOverdraft ? (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <span>⚠️ Exceeds by {formatINR(expense.amount - available)}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-700 font-medium">
                                Balance after debit: <span className="font-bold">{formatINR(remainingAfter)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">
                          {expense.description || <span className="text-slate-400 italic">No description provided</span>}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        {expense.bill_image_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewItem(expense)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No file attached</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(expense.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(expense)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApprove(expense)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve &amp; Debit</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Preview Modal with Decision Actions and Debit Impact */}
      <Modal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem ? `Verify: ${previewItem.category} (${formatINR(previewItem.amount, true)})` : 'Bill Verification'}
        subtitle={previewItem ? `Submitted by ${previewItem.submitter_name} (Finance Manager)` : ''}
        maxWidth="max-w-3xl"
      >
        {previewItem && (
          <div className="space-y-4">
            {/* Finance Member Balance Impact Card */}
            {submitterBalances[previewItem.submitted_by_user_id] && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Credited</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {formatINR(submitterBalances[previewItem.submitted_by_user_id].totalCredited)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Current Available</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {formatINR(submitterBalances[previewItem.submitted_by_user_id].availableBalance)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-700 font-bold uppercase">Bill To Debit</div>
                  <div className="font-extrabold text-amber-600 mt-0.5">
                    -{formatINR(previewItem.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">Projected Balance</div>
                  <div className="font-extrabold text-emerald-600 mt-0.5">
                    {formatINR(submitterBalances[previewItem.submitted_by_user_id].availableBalance - previewItem.amount)}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-bold block text-slate-900 mb-0.5">Purpose &amp; Description:</span>
              {previewItem.description || <span className="text-slate-400 italic">No description provided</span>}
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-3 border border-slate-800 max-h-[480px]">
              <img
                src={previewItem.bill_image_url}
                alt="Bill Receipt Document"
                className="max-h-[450px] w-auto object-contain rounded"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Audited by <span className="font-bold text-slate-700">{user?.full_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenRejectModal(previewItem)}
                  className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                >
                  Reject with Reason
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(previewItem)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                >
                  Approve &amp; Debit Balance
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal with Mandatory Reason */}
      <Modal
        isOpen={Boolean(rejectItem)}
        onClose={() => setRejectItem(null)}
        title="Reject Expense Bill"
        subtitle={rejectItem ? `Category: ${rejectItem.category} | Amount: ${formatINR(rejectItem.amount, true)}` : ''}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold">Audit Requirement:</span> Please provide a clear explanation for the member (e.g. missing GST, duplicate submission, unapproved vendor). No amount will be debited.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Official vendor cash memo or rubber stamp is missing on the bill. Please get signed receipt."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs font-medium text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectItem(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
