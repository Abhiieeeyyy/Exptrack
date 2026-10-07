import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api, PAYMENT_MODES } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import MoneyInput from '../../components/MoneyInput';
import Modal from '../../components/Modal';
import { 
  History, 
  Wallet, 
  Receipt, 
  Search, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Filter,
  Pencil,
  AlertCircle,
  Save,
  Tag
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function MemberHistory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('collections'); // 'collections' | 'expenses'
  const [collections, setCollections] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [previewExpense, setPreviewExpense] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editColForm, setEditColForm] = useState({
    receipt_book_number: '',
    donor_name: '',
    donor_phone: '',
    donor_address: '',
    amount: '',
    payment_mode: 'UPI',
    reference_number: '',
    notes: '',
  });
  const [editColErrors, setEditColErrors] = useState({});
  const [editColSaving, setEditColSaving] = useState(false);

  // Edit Expense modal state
  const [editingExpense, setEditingExpense] = useState(null);
  const [editExpForm, setEditExpForm] = useState({
    category: '',
    amount: '',
    description: '',
  });
  const [editExpErrors, setEditExpErrors] = useState({});
  const [editExpSaving, setEditExpSaving] = useState(false);

  const [notificationMsg, setNotificationMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [colData, expData] = await Promise.all([
        api.getCollections({ memberId: user.id }),
        api.getExpenses({ memberId: user.id })
      ]);
      setCollections(colData);
      setExpenses(expData);
    } catch (err) {
      console.error('Error loading member history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const totalCollected = collections.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalApprovedExp = expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const pendingExpCount = expenses.filter(e => e.status === 'PENDING').length;

  const filteredCollections = collections.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.donor_name && c.donor_name.toLowerCase().includes(q)) ||
      (c.receipt_book_number && c.receipt_book_number.toLowerCase().includes(q)) ||
      (c.payment_mode && c.payment_mode.toLowerCase().includes(q)) ||
      (c.donor_address && c.donor_address.toLowerCase().includes(q))
    );
  });

  const filteredExpenses = expenses.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.status && e.status.toLowerCase().includes(q))
    );
  });

  // Open Edit Collection Modal
  const handleStartEditCollection = (col) => {
    setEditingCollection(col);
    setEditColForm({
      receipt_book_number: col.receipt_book_number || '',
      donor_name: col.donor_name || '',
      donor_phone: col.donor_phone || '',
      donor_address: col.donor_address || '',
      amount: String(col.amount || ''),
      payment_mode: col.payment_mode || 'UPI',
      reference_number: col.reference_number || '',
      notes: col.notes || '',
    });
    setEditColErrors({});
  };

  // Submit Edit Collection
  const handleSaveCollectionEdit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editColForm.receipt_book_number.trim()) errs.receipt_book_number = 'Receipt leaf number is required';
    if (!editColForm.donor_name.trim()) errs.donor_name = 'Donor name is required';
    const num = Number(editColForm.amount);
    if (!editColForm.amount || isNaN(num) || num <= 0) {
      errs.amount = 'Valid amount (> ₹0) is required';
    }
    if (Object.keys(errs).length > 0) {
      setEditColErrors(errs);
      return;
    }

    setEditColSaving(true);
    setEditColErrors({});

    try {
      const updated = await api.updateCollection(editingCollection.id, {
        receipt_book_number: editColForm.receipt_book_number.trim().toUpperCase(),
        donor_name: editColForm.donor_name.trim(),
        donor_phone: editColForm.donor_phone.trim(),
        donor_address: editColForm.donor_address.trim(),
        amount: Number(editColForm.amount),
        payment_mode: editColForm.payment_mode,
        reference_number: (editColForm.payment_mode === 'UPI' || editColForm.payment_mode === 'CASH') ? '' : editColForm.reference_number.trim(),
        notes: editColForm.notes.trim(),
      });

      setCollections(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setEditingCollection(null);
      setNotificationMsg(`Collection entry #${updated.receipt_book_number} updated successfully.`);
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err) {
      if (err.field) {
        setEditColErrors({ [err.field]: err.message });
      } else {
        setEditColErrors({ general: err.message || 'Failed to update collection' });
      }
    } finally {
      setEditColSaving(false);
    }
  };

  // Open Edit Expense Modal (for PENDING expenses)
  const handleStartEditExpense = (exp) => {
    setEditingExpense(exp);
    setEditExpForm({
      category: exp.category || '',
      amount: String(exp.amount || ''),
      description: exp.description || '',
    });
    setEditExpErrors({});
  };

  // Submit Edit Expense
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
    setEditExpErrors({});

    try {
      const updated = await api.updateExpense(editingExpense.id, {
        category: editExpForm.category.trim(),
        amount: Number(editExpForm.amount),
        description: editExpForm.description.trim(),
      });

      setExpenses(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
      setEditingExpense(null);
      setNotificationMsg(`Expense bill updated successfully.`);
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err) {
      if (err.field) {
        setEditExpErrors({ [err.field]: err.message });
      } else {
        setEditExpErrors({ general: err.message || 'Failed to update expense' });
      }
    } finally {
      setEditExpSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Mini Stats */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>Personal Field Book</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {user?.full_name}'s Record History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review and edit your logged collection entries and submitted bills.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Collected</div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5">
                {formatINR(totalCollected)}
              </div>
            </div>
            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">Approved Bills</div>
              <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                {formatINR(totalApprovedExp)}
              </div>
            </div>
            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pending Bills</div>
              <div className="text-sm sm:text-base font-extrabold text-amber-400 mt-0.5">
                {pendingExpCount}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => { setActiveTab('collections'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'collections'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>My Book &amp; Collections ({collections.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('expenses'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>My Submitted Bills ({expenses.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {notificationMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'collections'
                ? 'Search by donor, receipt leaf #, area, mode...'
                : 'Search by category, description, status...'
            }
            className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <button
          onClick={loadData}
          className="text-xs font-bold text-slate-600 hover:text-emerald-600 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="animate-spin text-2xl mb-2">⏳</div>
          <p className="text-xs font-medium">Loading ledger data...</p>
        </div>
      ) : activeTab === 'collections' ? (
        /* COLLECTIONS TABLE (Slip Generation Button Replaced with Edit Option) */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt Leaf #</th>
                  <th className="py-3.5 px-4">Donor Name &amp; Contact</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No collection entries found.
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((col) => (
                    <tr key={col.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {col.receipt_book_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{col.donor_name}</div>
                        {col.donor_address && (
                          <div className="text-[11px] text-slate-500">{col.donor_address}</div>
                        )}
                        {col.donor_phone && (
                          <div className="text-[11px] text-slate-400 font-mono">{col.donor_phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                        {formatINR(col.amount, true)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {col.payment_mode}
                        </span>
                        {col.reference_number && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                            {col.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(col.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {/* Edit Button in Place of Slip Generation Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEditCollection(col)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="Edit this collection record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* EXPENSES LIST */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Category &amp; Description</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Review Info / Note</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expense bills submitted yet.
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
                          <div className="text-[11px] text-slate-400 italic">No description</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {formatINR(exp.amount, true)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={exp.status} />
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        {exp.status === 'REJECTED' ? (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                            <span className="font-bold block text-rose-900">Admin Rejection Reason:</span>
                            <span>{exp.rejection_reason || 'Missing proper invoice'}</span>
                          </div>
                        ) : exp.status === 'APPROVED' ? (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Approved by {exp.reviewer_name || 'Treasurer'}
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {exp.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleStartEditExpense(exp)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition cursor-pointer"
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
                              <span>Bill</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      <Modal
        isOpen={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        title="Edit Collection Record"
        subtitle={`Update receipt leaf details for #${editingCollection?.receipt_book_number}`}
        maxWidth="max-w-lg"
      >
        {editingCollection && (
          <form onSubmit={handleSaveCollectionEdit} className="space-y-4">
            {editColErrors.general && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editColErrors.general}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Leaf No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editColForm.receipt_book_number}
                  onChange={(e) => setEditColForm({ ...editColForm, receipt_book_number: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
                {editColErrors.receipt_book_number && (
                  <p className="text-[11px] text-rose-600 mt-1">{editColErrors.receipt_book_number}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editColForm.amount}
                  onChange={(e) => setEditColForm({ ...editColForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
                {editColErrors.amount && (
                  <p className="text-[11px] text-rose-600 mt-1">{editColErrors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Donor Name / Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editColForm.donor_name}
                onChange={(e) => setEditColForm({ ...editColForm, donor_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              {editColErrors.donor_name && (
                <p className="text-[11px] text-rose-600 mt-1">{editColErrors.donor_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Donor Phone
                </label>
                <input
                  type="tel"
                  value={editColForm.donor_phone}
                  onChange={(e) => setEditColForm({ ...editColForm, donor_phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Area / Location Address
                </label>
                <input
                  type="text"
                  value={editColForm.donor_address}
                  onChange={(e) => setEditColForm({ ...editColForm, donor_address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={editColForm.payment_mode}
                onChange={(e) => setEditColForm({ ...editColForm, payment_mode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {PAYMENT_MODES.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {(editColForm.payment_mode === 'CHEQUE' || editColForm.payment_mode === 'BANK_TRANSFER') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reference / Cheque Number
                </label>
                <input
                  type="text"
                  value={editColForm.reference_number}
                  onChange={(e) => setEditColForm({ ...editColForm, reference_number: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Remarks / Purpose (Optional)
              </label>
              <input
                type="text"
                value={editColForm.notes}
                onChange={(e) => setEditColForm({ ...editColForm, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editColSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editColSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

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
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editExpSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50"
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
                <span className="font-bold block mb-0.5">Rejection Note:</span>
                {previewExpense.rejection_reason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
