import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api, EXPENSE_CATEGORIES } from '../../services/api';
import MoneyInput from '../../components/MoneyInput';
import StatusBadge from '../../components/StatusBadge';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  Clock,
  HelpCircle,
  Sparkles,
  PlusCircle,
  Tag
} from 'lucide-react';
import { formatINR } from '../../lib/money';

export default function UploadExpense({ onExpenseSubmitted, onNavigateHistory }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [availableCategories, setAvailableCategories] = useState(() => api.getExpenseCategories());
  const [selectedCategoryOption, setSelectedCategoryOption] = useState(availableCategories[0] || 'Stage & Lighting');
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successExpense, setSuccessExpense] = useState(null);

  useEffect(() => {
    setAvailableCategories(api.getExpenseCategories());
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 5 MB = 5 * 1024 * 1024 bytes
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrors(prev => ({ ...prev, file: 'File exceeds 5 MB limit. Please select a smaller photo or bill document.' }));
      return;
    }

    setFileName(file.name);
    setFileSizeStr((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setErrors(prev => {
      const next = { ...prev };
      delete next.file;
      return next;
    });

    // Read preview
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFilePreview(null);
    setFileName('');
    setFileSizeStr('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errs = {};
    if (selectedCategoryOption === '__CUSTOM__') {
      if (!customCategoryName.trim()) {
        errs.category = 'Please enter a custom expense category name';
      }
    } else if (!selectedCategoryOption) {
      errs.category = 'Please select an expense category';
    }

    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      errs.amount = 'Valid expense amount (> ₹0) is required';
    }

    // Note: Bill Description & Purpose is OPTIONAL per requirements
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    const finalCategory = selectedCategoryOption === '__CUSTOM__' 
      ? customCategoryName.trim() 
      : selectedCategoryOption;

    try {
      const payload = {
        submitted_by_user_id: user.id,
        submitter_name: user.full_name || user.username,
        category: finalCategory,
        amount: Number(amount),
        description: description.trim(),
        bill_image_url: filePreview || null,
      };

      const res = await api.createExpense(payload);

      // Refresh category list in state
      setAvailableCategories(api.getExpenseCategories());
      setSelectedCategoryOption(finalCategory);
      setCustomCategoryName('');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccessExpense(res);

      // Clear
      setAmount('');
      setDescription('');
      handleRemoveFile();

      if (onExpenseSubmitted) onExpenseSubmitted();
    } catch (err) {
      if (err.field) {
        setErrors({ [err.field]: err.message });
      } else {
        setErrors({ general: err.message || 'Failed to submit expense bill' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Bill Submission Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Submit Expense Bill
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Upload bills and invoices for admin review & ledger approval.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-right shrink-0">
          <div className="text-[11px] text-slate-400 font-medium">Submitting As</div>
          <div className="text-sm font-bold text-slate-200">{user?.full_name}</div>
        </div>
      </div>

      {/* Success Banner */}
      {successExpense && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Bill Submitted for Approval</span>
                <StatusBadge status="PENDING" size="sm" />
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                <span className="font-bold">{formatINR(successExpense.amount, true)}</span> under{' '}
                <span className="font-medium">{successExpense.category}</span> is now queued in the Treasurer's review list.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onNavigateHistory && (
              <button
                type="button"
                onClick={onNavigateHistory}
                className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition cursor-pointer"
              >
                Track Status
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessExpense(null)}
              className="text-xs text-amber-700 hover:text-amber-900 px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        
        {errors.general && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Category & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCategoryOption}
              onChange={(e) => setSelectedCategoryOption(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              <optgroup label="Standard & Saved Categories">
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom Category">
                <option value="__CUSTOM__">✨ + Add New / Custom Category...</option>
              </optgroup>
            </select>

            {/* Custom Category Input if selected */}
            {selectedCategoryOption === '__CUSTOM__' && (
              <div className="mt-2.5 animate-in fade-in slide-in-from-top-1">
                <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Enter Custom Category Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. Venue Sanitation, Memento Trophy, etc."
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 ${
                      errors.category
                        ? 'border-rose-300 bg-rose-50/40 focus:border-rose-500 text-rose-900'
                        : 'border-emerald-400 bg-emerald-50/30 focus:border-emerald-600 focus:ring-emerald-200 text-slate-900'
                    }`}
                    autoFocus
                  />
                  <Tag className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
                </div>
                {errors.category && (
                  <p className="text-xs font-medium text-rose-600 mt-1">{errors.category}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <MoneyInput
              value={amount}
              onChange={setAmount}
              label="Bill Amount (INR)"
              placeholder="0.00"
              error={errors.amount}
              showChips={true}
            />
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Bill Description &amp; Purpose <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Invoice for generator fuel & electrical wiring cable rental from Modern Electrics (Optional)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 transition focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-200"
          />
        </div>

        {/* Bill Receipt Upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Bill / Invoice Photo or PDF <span className="text-slate-400 font-normal">(Max 5 MB)</span>
            </label>
            <span className="text-[11px] text-slate-400">JPG, PNG, WebP, PDF</span>
          </div>

          {!filePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition ${
                errors.file
                  ? 'border-rose-300 bg-rose-50/30 hover:bg-rose-50/50'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-emerald-500'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or take a camera photo of the bill
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Receipts will be securely stored in Supabase bills bucket
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-slate-200 bg-slate-900 p-4 overflow-hidden flex flex-col sm:flex-row items-center gap-4">
              <div className="relative max-w-[140px] max-h-[140px] rounded-lg overflow-hidden border border-slate-700 bg-black">
                {filePreview.startsWith('data:image') || filePreview.startsWith('http') ? (
                  <img
                    src={filePreview}
                    alt="Bill Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center text-white">
                    <FileText className="w-12 h-12 text-emerald-400" />
                  </div>
                )}
              </div>

              <div className="text-white space-y-1 text-center sm:text-left flex-1">
                <p className="text-sm font-bold truncate max-w-xs">{fileName || 'Bill Document'}</p>
                {fileSizeStr && <p className="text-xs text-slate-400 font-mono">{fileSizeStr}</p>}
                <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for upload
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                title="Remove photo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {errors.file && (
            <p className="text-xs font-medium text-rose-600 mt-2">{errors.file}</p>
          )}
        </div>

        {/* Business Rule Reminder Note */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-800">Audit Policy:</span> All bills are submitted in <span className="font-bold text-amber-600">PENDING</span> state. They will only be accounted in the Net Balance once reviewed and <span className="font-bold text-emerald-600">APPROVED</span> by the Admin/Treasurer.
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setAmount('');
              setDescription('');
              handleRemoveFile();
              setSelectedCategoryOption(availableCategories[0]);
              setCustomCategoryName('');
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Submitting Bill...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit Bill for Approval</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
