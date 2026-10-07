import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Sparkles,
  PieChart,
  BarChart3,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatINR, formatINRCompact } from '../../lib/money';

export default function AdminOverview({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">
        <div className="animate-spin text-3xl mb-3">⏳</div>
        <p className="text-sm font-semibold">Calculating real-time financial ledger metrics...</p>
      </div>
    );
  }

  const isNetNegative = metrics.netBalance < 0;

  // Max value calculation for bar progress
  const maxCategoryVal = Math.max(...Object.values(metrics.categoryBreakdown), 1);
  const maxPaymentVal = Math.max(...Object.values(metrics.paymentModeBreakdown), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Treasurer & Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial Ledger & Balance Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time accounting rule: Net Balance = Total Collections &minus; Admin Approved Expenses only.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchMetrics}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            Refresh Ledger
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/admin/approvals')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer"
          >
            <span>Review Queue</span>
            {metrics.pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center justify-center">
                {metrics.pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards (As required by PDF Section 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Collections / Income */}
        <KpiCard
          title="Total Income (Collections)"
          value={metrics.totalIncome}
          variant="income"
          icon={TrendingUp}
          badge={`${metrics.totalCollectionsCount} Receipts`}
          subtitle="100% verified donor entries"
          onClick={() => onNavigate('/admin/collections')}
        />

        {/* KPI 2: Total Approved Expenses */}
        <KpiCard
          title="Approved Expenses"
          value={metrics.totalApprovedExpenses}
          variant="expense"
          icon={TrendingDown}
          badge="Admin Approved"
          subtitle="Only approved bills deducted"
          onClick={() => onNavigate('/admin/expenses')}
        />

        {/* KPI 3: Net Balance (Turns Red if negative) */}
        <KpiCard
          title="Net Available Balance"
          value={metrics.netBalance}
          variant="net"
          icon={Wallet}
          badge={isNetNegative ? 'DEFICIT' : 'SURPLUS'}
          subtitle={isNetNegative ? 'Warning: Expenses exceed collections' : 'Healthy liquidity for event'}
        />

        {/* KPI 4: Pending Approvals Count */}
        <KpiCard
          title="Pending Bill Review"
          value={metrics.pendingCount}
          isCurrency={false}
          variant="pending"
          icon={Clock}
          badge={formatINR(metrics.pendingAmount)}
          subtitle="Waiting in approval queue"
          onClick={() => onNavigate('/admin/approvals')}
        />
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Collections by Payment Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Collections by Payment Mode</h3>
              <p className="text-xs text-slate-500">Distribution across UPI, Cash, Bank Transfer, Cheque</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {formatINR(metrics.totalIncome)}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {Object.keys(metrics.paymentModeBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No collections recorded yet.</p>
            ) : (
              Object.entries(metrics.paymentModeBreakdown).map(([mode, amt]) => {
                const percentage = metrics.totalIncome > 0 ? ((amt / metrics.totalIncome) * 100).toFixed(1) : 0;
                return (
                  <div key={mode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{mode}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{formatINR(amt, true)}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Approved Expenses by Category */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Approved Expense Categories</h3>
              <p className="text-xs text-slate-500">Breakdown of spent funds by event function</p>
            </div>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {formatINR(metrics.totalApprovedExpenses)}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {Object.keys(metrics.categoryBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No approved expenses yet.</p>
            ) : (
              Object.entries(metrics.categoryBreakdown).map(([cat, amt]) => {
                const percentage = metrics.totalApprovedExpenses > 0 
                  ? ((amt / metrics.totalApprovedExpenses) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{formatINR(amt, true)}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-800 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Collections */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Donor Collections
            </h3>
            <button
              onClick={() => onNavigate('/admin/collections')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentCollections.map((col) => (
              <div key={col.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{col.donor_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Leaf #{col.receipt_book_number} &bull; {col.payment_mode} &bull; by {col.collector_name}
                  </div>
                </div>
                <div className="text-sm font-extrabold text-emerald-600">
                  {formatINR(col.amount, true)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Latest Expense Submissions
            </h3>
            <button
              onClick={() => onNavigate('/admin/expenses')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {metrics.recentExpenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between">
                <div className="max-w-[240px]">
                  <div className="text-xs font-bold text-slate-900">{exp.category}</div>
                  <div className="text-[11px] text-slate-500 truncate">{exp.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {formatINR(exp.amount, true)}
                  </div>
                  <div className="mt-0.5">
                    <StatusBadge status={exp.status} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
