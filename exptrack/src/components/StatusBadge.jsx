import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const normalized = (status || 'PENDING').toUpperCase();

  const configs = {
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dotBg: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    PENDING: {
      label: 'Pending Review',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dotBg: 'bg-amber-500',
      icon: Clock,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dotBg: 'bg-rose-500',
      icon: XCircle,
    }
  };

  const config = configs[normalized] || configs.PENDING;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-xs font-semibold px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${config.bg} ${sizeClasses} shadow-2xs`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
