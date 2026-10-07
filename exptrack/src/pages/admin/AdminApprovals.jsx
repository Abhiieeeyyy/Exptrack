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
  Sparkles
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function AdminApprovals({ onApprovedOrRejected }) {
  const { user } = useAuth();
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [previewItem, setPreviewItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadPendingQueue = async () => {
    setLoading(true);
    try {
      const allExpenses = await api.getExpenses({ status: 'PENDING' });
      setPendingExpenses(allExpenses);
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

      setPendingExpenses(prev => prev.filter(e => e.id !== expense.id));
      if (previewItem?.id === expense.id) {
        setPreviewItem(null);
      }
      if (onApprovedOrRejected) onApprovedOrRejected();
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
      setPendingExpenses(prev => prev.filter(e => e.id !== rejectItem.id));
      setRejectItem(null);
      if (previewItem?.id === rejectItem.id) {
        setPreviewItem(null);
      }
      if (onApprovedOrRejected) onApprovedOrRejected();
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
            <span>Audit & Verification Gate</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Expense Bills Approval Queue
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Section 6 Business Rule: Approving a bill instantly deducts it from the Net Balance.
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
                  <th className="py-3.5 px-4">Category & Submitter</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Description & Justification</th>
                  <th className="py-3.5 px-4">Bill Receipt</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Audit Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition">
                    
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{expense.category}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{expense.submitter_name || 'Member'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                      {formatINR(expense.amount, true)}
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs text-slate-700 font-medium line-clamp-2">
                        {expense.description}
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
                          <span>Approve Bill</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Preview Modal with Decision Actions */}
      <Modal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem ? `Verify: ${previewItem.category} (${formatINR(previewItem.amount, true)})` : 'Bill Verification'}
        subtitle={previewItem ? `Submitted by ${previewItem.submitter_name}` : ''}
        maxWidth="max-w-3xl"
      >
        {previewItem && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-bold block text-slate-900 mb-0.5">Description:</span>
              {previewItem.description}
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
                Reviewing as <span className="font-bold text-slate-700">{user?.full_name}</span>
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
                  Approve & Post to Ledger
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
            <span className="font-bold">Audit Requirement:</span> Please provide a clear explanation for the member (e.g. missing GST, duplicate submission, unapproved vendor).
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
              type="button"
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
