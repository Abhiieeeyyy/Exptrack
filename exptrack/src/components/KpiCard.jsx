import React from 'react';
import { formatINR } from '../lib/money';

export default function KpiCard({
  title,
  value,
  isCurrency = true,
  subtitle,
  icon: Icon,
  variant = 'default', // 'income' | 'expense' | 'net' | 'pending' | 'default'
  badge,
  onClick,
}) {
  // Variant specific color styles
  const getStyles = () => {
    switch (variant) {
      case 'income':
        return {
          cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20',
          iconBg: 'bg-emerald-500/15 text-emerald-600',
          valueColor: 'text-emerald-700',
          indicator: 'bg-emerald-500',
        };
      case 'expense':
        return {
          cardBg: 'bg-slate-900/5 hover:bg-slate-900/10 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
          valueColor: 'text-slate-900',
          indicator: 'bg-slate-600',
        };
      case 'net':
        const isNegative = Number(value) < 0;
        return {
          cardBg: isNegative 
            ? 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/30' 
            : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30',
          iconBg: isNegative ? 'bg-rose-500/20 text-rose-600' : 'bg-emerald-500/20 text-emerald-600',
          valueColor: isNegative ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-extrabold',
          indicator: isNegative ? 'bg-rose-500' : 'bg-emerald-500',
        };
      case 'pending':
        return {
          cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20',
          iconBg: 'bg-amber-500/15 text-amber-600',
          valueColor: 'text-amber-700',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          cardBg: 'bg-white hover:bg-slate-50 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-600',
          valueColor: 'text-slate-900',
          indicator: 'bg-slate-400',
        };
    }
  };

  const style = getStyles();
  const displayVal = isCurrency ? formatINR(value) : value;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all shadow-xs ${style.cardBg} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${style.indicator}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl tracking-tight ${style.valueColor}`}>
              {displayVal}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={`rounded-lg p-2.5 ${style.iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white/80 border border-slate-200 text-slate-600 shadow-2xs">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
