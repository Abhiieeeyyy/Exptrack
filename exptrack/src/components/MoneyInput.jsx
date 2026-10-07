import React from 'react';
import { IndianRupee, X } from 'lucide-react';
import { formatINR } from '../lib/money';

const QUICK_CHIPS = [
  { label: '+₹100', value: 100 },
  { label: '+₹500', value: 500 },
  { label: '+₹1,000', value: 1000 },
  { label: '+₹2,000', value: 2000 },
  { label: '+₹5,000', value: 5000 },
  { label: '+₹10,000', value: 10000 },
];

export default function MoneyInput({
  value,
  onChange,
  label = 'Amount',
  placeholder = '0.00',
  error = null,
  helperText = null,
  showChips = true,
  autoFocus = false,
  required = true,
  disabled = false,
}) {
  const numericVal = Number(value) || 0;

  const handleChipClick = (amountToAdd) => {
    if (disabled) return;
    const current = Number(value) || 0;
    const updated = current + amountToAdd;
    onChange(updated);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Allow empty or positive float
    if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
      onChange(raw);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-800">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {numericVal > 0 && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {formatINR(numericVal, true)}
          </span>
        )}
      </div>

      <div className="relative rounded-lg shadow-2xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <IndianRupee className="h-5 w-5 text-slate-500" />
        </div>

        <input
          type="text"
          inputMode="decimal"
          value={value ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`block w-full rounded-lg border pl-10 pr-10 py-3 text-lg font-bold tracking-tight text-slate-900 transition focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            error
              ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-200'
          }`}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            title="Clear amount"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Add Chips */}
      {showChips && !disabled && (
        <div className="pt-1">
          <div className="text-xs text-slate-500 mb-1.5 font-medium">Quick Add:</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleChipClick(chip.value)}
                className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 active:scale-95 transition cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-xs font-medium text-rose-600 animate-in fade-in">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
