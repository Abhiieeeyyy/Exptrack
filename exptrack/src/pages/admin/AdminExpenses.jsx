import React, { useState, useEffect } from 'react';
import { api, EXPENSE_CATEGORIES } from '../../services/api';
import { exportToExcel } from '../../lib/csv';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { 
  Receipt, 
  Search, 
  Filter, 
  FileSpreadsheet,
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const [previewExpense, setPreviewExpense] = useState(null);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses({
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      setExpenses(data);
    } catch (err) {
      console.error('Error loading admin expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Totals
  const totalApproved = expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = expenses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getExportColumns = () => [
    { key: 'category', label: 'Expense Category' },
    { key: 'description', label: 'Description' },
    { 
      key: 'amount', 
      label: 'Amount (INR)', 
      formatter: (val) => Number(val).toFixed(2) 
    },
    { key: 'status', label: 'Audit Status' },
    { key: 'submitter_name', label: 'Submitted By' },
    { key: 'reviewer_name', label: 'Reviewed By' },
    { key: 'rejection_reason', label: 'Rejection Reason Note' },
    { 
      key: 'created_at', 
      label: 'Submission Date', 
      formatter: (val) => new Date(val).toLocaleString('en-IN') 
    }
  ];

  const handleExportExcel = () => {
    const columns = getExportColumns();
    exportToExcel(
      expenses, 
      columns, 
      `Srikainari_Ulsavam_2026_Expenses_${new Date().toISOString().split('T')[0]}.xlsx`,
      'Expenses Ledger'
    );
  };

  const allCategories = api.getExpenseCategories ? api.getExpenseCategories() : EXPENSE_CATEGORIES;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Master Expenditure Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Expense Bills &amp; Disbursement Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 6 Rule: Only APPROVED bills count in official expenditure. PENDING &amp; REJECTED never affect Net Balance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Approved Total</div>
            <div className="text-base font-extrabold text-white">{formatINR(totalApproved)}</div>
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
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, category, member..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses (Pending, Approved, Rejected)</option>
              <option value="APPROVED">Approved Only (Counted in Balance)</option>
              <option value="PENDING">Pending Only (Awaiting Audit)</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Expense Categories</option>
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        {(search || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Showing filtered results ({expenses.length} records)</span>
            <button
              type="button"
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
              className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Expense Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-medium">Loading expenditure records...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No expense records matching selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Category &amp; Description</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Bill Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((exp) => (
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
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      {formatINR(exp.amount, true)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={exp.status} />
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {exp.submitter_name || 'Member'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {exp.status === 'REJECTED' ? (
                        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                          <span className="font-bold">Reason:</span> {exp.rejection_reason}
                        </div>
                      ) : exp.status === 'APPROVED' ? (
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Audited by {exp.reviewer_name || 'Admin'}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">In Review</span>
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
                      {exp.bill_image_url ? (
                        <button
                          type="button"
                          onClick={() => setPreviewExpense(exp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No document</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <div>
              Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> ({expenses.length} total bills)
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

      {/* Bill Preview Modal */}
      <Modal
        isOpen={Boolean(previewExpense)}
        onClose={() => setPreviewExpense(null)}
        title={previewExpense ? `${previewExpense.category} - ${formatINR(previewExpense.amount, true)}` : 'Bill Document'}
        subtitle={previewExpense ? `Submitted by ${previewExpense.submitter_name}` : ''}
        maxWidth="max-w-2xl"
      >
        {previewExpense && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <StatusBadge status={previewExpense.status} />
              <span className="text-xs text-slate-500">
                {new Date(previewExpense.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </span>
            </div>

            {previewExpense.description && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-0.5">Description:</span>
                {previewExpense.description}
              </div>
            )}

            {previewExpense.bill_image_url ? (
              <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 border border-slate-800 max-h-[450px]">
                <img
                  src={previewExpense.bill_image_url}
                  alt="Bill Receipt"
                  className="max-h-[420px] w-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-slate-300" />
                <span>No document or photo uploaded for this bill.</span>
              </div>
            )}

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
