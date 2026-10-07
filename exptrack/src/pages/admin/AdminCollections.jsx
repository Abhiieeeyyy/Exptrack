import React, { useState, useEffect } from 'react';
import { api, PAYMENT_MODES } from '../../services/api';
import { exportToExcel, exportToCSV } from '../../lib/csv';
import Modal from '../../components/Modal';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet,
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Wallet,
  RotateCcw,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Save
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination (25 per page per Section 5)
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  // Edit Collection State
  const [editingCollection, setEditingCollection] = useState(null);
  const [editForm, setEditForm] = useState({
    receipt_book_number: '',
    donor_name: '',
    donor_phone: '',
    donor_address: '',
    amount: '',
    payment_mode: 'UPI',
    reference_number: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await api.getCollections({
        search,
        mode: modeFilter,
        dateFrom,
        dateTo
      });
      setCollections(data);
    } catch (err) {
      console.error('Error fetching admin collections ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [modeFilter, dateFrom, dateTo]);

  // Handle live search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCollections();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Calculations
  const totalAmount = collections.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalPages = Math.ceil(collections.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = collections.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getExportColumns = () => [
    { key: 'receipt_book_number', label: 'Receipt Leaf Number' },
    { key: 'donor_name', label: 'Donor Name' },
    { key: 'donor_phone', label: 'Donor Phone' },
    { key: 'donor_address', label: 'Donor Address / Area' },
    { 
      key: 'amount', 
      label: 'Amount (INR)', 
      formatter: (val) => Number(val).toFixed(2) 
    },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'reference_number', label: 'Reference / Cheque No' },
    { key: 'collector_name', label: 'Collected By Member' },
    { key: 'notes', label: 'Remarks / Notes' },
    { 
      key: 'created_at', 
      label: 'Date & Time', 
      formatter: (val) => new Date(val).toLocaleString('en-IN') 
    }
  ];

  const handleExportExcel = () => {
    const columns = getExportColumns();
    exportToExcel(
      collections, 
      columns, 
      `Srikainari_Ulsavam_2026_Collections_${new Date().toISOString().split('T')[0]}.xlsx`,
      'Collections Ledger'
    );
  };

  const handleExportCSV = () => {
    const columns = getExportColumns();
    exportToCSV(collections, columns, `Srikainari_Ulsavam_2026_Collections_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setModeFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  // Open Edit Modal
  const handleStartEdit = (col) => {
    setEditingCollection(col);
    setEditForm({
      receipt_book_number: col.receipt_book_number || '',
      donor_name: col.donor_name || '',
      donor_phone: col.donor_phone || '',
      donor_address: col.donor_address || '',
      amount: String(col.amount || ''),
      payment_mode: col.payment_mode || 'UPI',
      reference_number: col.reference_number || '',
      notes: col.notes || '',
    });
    setEditErrors({});
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!editForm.receipt_book_number.trim()) errs.receipt_book_number = 'Receipt leaf number is required';
    if (!editForm.donor_name.trim()) errs.donor_name = 'Donor name is required';
    const num = Number(editForm.amount);
    if (!editForm.amount || isNaN(num) || num <= 0) {
      errs.amount = 'Valid collection amount (> ₹0) is required';
    }
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setEditSaving(true);
    setEditErrors({});

    try {
      const updated = await api.updateCollection(editingCollection.id, {
        receipt_book_number: editForm.receipt_book_number.trim().toUpperCase(),
        donor_name: editForm.donor_name.trim(),
        donor_phone: editForm.donor_phone.trim(),
        donor_address: editForm.donor_address.trim(),
        amount: Number(editForm.amount),
        payment_mode: editForm.payment_mode,
        reference_number: (editForm.payment_mode === 'UPI' || editForm.payment_mode === 'CASH') ? '' : editForm.reference_number.trim(),
        notes: editForm.notes.trim(),
      });

      setCollections(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setEditingCollection(null);
      setSuccessMsg(`Collection #${updated.receipt_book_number} successfully updated.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      if (err.field) {
        setEditErrors({ [err.field]: err.message });
      } else {
        setEditErrors({ general: err.message || 'Failed to update collection entry' });
      }
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master Income Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Collections &amp; Donor Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit trail of collection receipt leaves, amounts, payment modes, and donors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Ledger Total</div>
            <div className="text-base font-extrabold text-emerald-400">{formatINR(totalAmount)}</div>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition cursor-pointer"
            title="Export Excel spreadsheet with Malayalam text support"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-xs transition cursor-pointer"
            title="Export CSV with UTF-8 encoding"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search donor name, receipt #, collector, area..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Mode */}
          <div>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Payment Modes</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To Date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

        </div>

        {(search || modeFilter !== 'ALL' || dateFrom || dateTo) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Showing filtered results ({collections.length} entries)</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-medium">Loading collection records...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No collection records matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Donor Details</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Mode &amp; Reference</th>
                  <th className="py-3.5 px-4">Collector</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((col) => (
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
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm">
                      {formatINR(col.amount, true)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {col.payment_mode}
                      </span>
                      {col.reference_number && (
                        <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px] mt-0.5">
                          {col.reference_number}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {col.collector_name || 'Member'}
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
                        onClick={() => handleStartEdit(col)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-md border border-slate-200 transition cursor-pointer"
                        title="Edit collection entry"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>
              Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> ({collections.length} total entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Collection Modal */}
      <Modal
        isOpen={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        title="Edit Collection Record"
        subtitle={`Modify income record #${editingCollection?.receipt_book_number}`}
        maxWidth="max-w-lg"
      >
        {editingCollection && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editErrors.general && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editErrors.general}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Leaf No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.receipt_book_number}
                  onChange={(e) => setEditForm({ ...editForm, receipt_book_number: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
                {editErrors.receipt_book_number && (
                  <p className="text-[11px] text-rose-600 mt-1">{editErrors.receipt_book_number}</p>
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
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
                {editErrors.amount && (
                  <p className="text-[11px] text-rose-600 mt-1">{editErrors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Donor Name / Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editForm.donor_name}
                onChange={(e) => setEditForm({ ...editForm, donor_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              {editErrors.donor_name && (
                <p className="text-[11px] text-rose-600 mt-1">{editErrors.donor_name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Donor Phone
                </label>
                <input
                  type="tel"
                  value={editForm.donor_phone}
                  onChange={(e) => setEditForm({ ...editForm, donor_phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Area / Location Address
                </label>
                <input
                  type="text"
                  value={editForm.donor_address}
                  onChange={(e) => setEditForm({ ...editForm, donor_address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={editForm.payment_mode}
                onChange={(e) => setEditForm({ ...editForm, payment_mode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {PAYMENT_MODES.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {(editForm.payment_mode === 'CHEQUE' || editForm.payment_mode === 'BANK_TRANSFER') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reference / Cheque Number
                </label>
                <input
                  type="text"
                  value={editForm.reference_number}
                  onChange={(e) => setEditForm({ ...editForm, reference_number: e.target.value })}
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
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
