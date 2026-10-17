import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { 
  Receipt, 
  Search, 
  Filter, 
  Eye, 
  Pencil, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Upload, 
  Save, 
  Wallet,
  Calendar,
  Tag
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function FinanceBillsHistory({ onNavigate }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Preview Modal
  const [previewExpense, setPreviewExpense] = useState(null);

  // Edit Expense Modal (Pending only)
  const [editingExpense, setEditingExpense] = useState(null);
  const [editExpForm, setEditExpForm] = useState({
    category: '',
    amount: '',
    description: '',
  });
  const [editExpErrors, setEditExpErrors] = useState({});
  const [editExpSaving, setEditExpSaving] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);

  const loadExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getExpenses({ memberId: user.id });
      setExpenses(data || []);
    } catch (err) {
      console.error('Error loading finance bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user]);

  const approvedList = expenses.filter(e => e.status === 'APPROVED');
  const pendingList = expenses.filter(e => e.status === 'PENDING');
  const rejectedList = expenses.filter(e => e.status === 'REJECTED');

  const totalApproved = approvedList.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalPending = pendingList.reduce((s, e) => s + Number(e.amount || 0), 0);

  const filteredExpenses = expenses.filter(e => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.status && e.status.toLowerCase().includes(q))
    );
  });

  const handleStartEditExpense = (exp) => {
    setEditingExpense(exp);
    setEditExpForm({
      category: exp.category || '',
      amount: String(exp.amount || ''),
      description: exp.description || '',
    });
    setEditExpErrors({});
  };

  const handleSaveExpenseEdit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editExpForm.category.trim()) errs.category = 'Category is required';
    const num = Number(editExpForm.amount);
    if (!editExpForm.amount || isNaN(num) || num <= 0) {
      errs.amount = 'Valid amount (> ₹0) is required';
    }
    if (Object.keys(errs).length > 0) {
      setEditExpErrors(errs);
      return;
    }

    setEditExpSaving(true);
    try {
      const updated = await api.updateExpense(editingExpense.id, {
        category: editExpForm.category.trim(),
        amount: num,
        description: editExpForm.description.trim(),
      });
      setExpenses(prev => prev.map(exp => exp.id === updated.id ? { ...exp, ...updated } : exp));
      setEditingExpense(null);
      setNotificationMsg('Bill details updated successfully.');
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err) {
      setEditExpErrors({ general: err.message || 'Failed to update bill' });
    } finally {
      setEditExpSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Expenditure Log</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              My Submitted Expense Bills
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track the audit status of your submitted bills. Approved bills are automatically debited from your credited balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Debited (Approved)</div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">{formatINR(totalApproved)}</div>
              <div className="text-[10px] text-slate-400">{approvedList.length} approved bills</div>
            </div>

            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pending Review</div>
              <div className="text-base font-extrabold text-amber-400 mt-0.5">{formatINR(totalPending)}</div>
              <div className="text-[10px] text-slate-400">{pendingList.length} bills in audit</div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/finance/upload')}
              className="inline-flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Submit New Bill</span>
            </button>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All Bills (${expenses.length})` },
            { id: 'PENDING', label: `Pending (${pendingList.length})` },
            { id: 'APPROVED', label: `Approved / Debited (${approvedList.length})` },
            { id: 'REJECTED', label: `Rejected (${rejectedList.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category, description..."
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Category &amp; Description</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status &amp; Impact</th>
                <th className="py-3.5 px-4">Audit Info / Reason</th>
                <th className="py-3.5 px-4">Date Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading bills...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No expense bills found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900">{exp.category}</div>
                      {exp.description ? (
                        <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {exp.description}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No description provided</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {formatINR(exp.amount, true)}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={exp.status} />
                      {exp.status === 'APPROVED' && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          Debited from balance
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {exp.status === 'REJECTED' ? (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                          <span className="font-bold block text-rose-900">Admin Rejection Note:</span>
                          <span>{exp.rejection_reason || 'Missing proper receipt'}</span>
                        </div>
                      ) : exp.status === 'APPROVED' ? (
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Approved by {exp.reviewer_name || 'Administrator'}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 italic">
                          Awaiting admin review
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(exp.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {exp.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleStartEditExpense(exp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition cursor-pointer"
                          title="Edit Bill Details"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      )}

                      {exp.bill_image_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewExpense(exp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title="Edit Submitted Expense Bill"
        subtitle="Update details before reviewer approval."
        maxWidth="max-w-lg"
      >
        {editingExpense && (
          <form onSubmit={handleSaveExpenseEdit} className="space-y-4">
            {editExpErrors.general && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editExpErrors.general}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editExpForm.category}
                onChange={(e) => setEditExpForm({ ...editExpForm, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bill Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={editExpForm.amount}
                onChange={(e) => setEditExpForm({ ...editExpForm, amount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              {editExpErrors.amount && (
                <p className="text-[11px] text-rose-600 mt-1">{editExpErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bill Description &amp; Purpose <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={editExpForm.description}
                onChange={(e) => setEditExpForm({ ...editExpForm, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editExpSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editExpSaving ? 'Saving...' : 'Update Bill'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

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
