import React from 'react';
import Modal from './Modal';
import { Printer, CheckCircle2, IndianRupee, ShieldCheck, Download } from 'lucide-react';
import { formatINR } from '../lib/money';

export default function ReceiptPrintModal({ isOpen, onClose, collection }) {
  if (!collection) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Collection Voucher"
      subtitle={`Receipt Leaf #${collection.receipt_book_number}`}
      maxWidth="max-w-lg"
    >
      <div id="printable-receipt" className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
        {/* Receipt Header */}
        <div className="text-center border-b border-slate-200 pb-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">
            SRIKAINARI ULSAVAM 2026
          </h2>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
            Official Donation &amp; Collection Acknowledgement
          </p>
        </div>

        {/* Amount Box */}
        <div className="bg-emerald-600 text-white rounded-lg p-3 text-center my-3 shadow-inner">
          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-100">
            Amount Received
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            {formatINR(collection.amount, true)}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2 text-xs divide-y divide-slate-100">
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 font-medium">Receipt No.</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded">
              {collection.receipt_book_number}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 font-medium">Donor Name</span>
            <span className="font-bold text-slate-900">{collection.donor_name}</span>
          </div>
          {collection.donor_phone && (
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Donor Phone</span>
              <span className="font-medium text-slate-800">{collection.donor_phone}</span>
            </div>
          )}
          {collection.donor_address && (
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Address</span>
              <span className="text-right text-slate-700 max-w-[200px] truncate">{collection.donor_address}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 font-medium">Payment Mode</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {collection.payment_mode}
            </span>
          </div>
          {collection.reference_number && (
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Ref / Cheque #</span>
              <span className="font-mono text-slate-700">{collection.reference_number}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 font-medium">Collected By</span>
            <span className="font-medium text-slate-800">{collection.collector_name || 'Authorized Member'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 font-medium">Date & Time</span>
            <span className="text-slate-700">
              {new Date(collection.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </span>
          </div>
        </div>

        {collection.notes && (
          <div className="mt-3 p-2 bg-slate-100/70 rounded text-[11px] text-slate-600 italic">
            Note: {collection.notes}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
          <span>Digitally Verified &bull; System Generated</span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Validated
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Voucher
        </button>
      </div>
    </Modal>
  );
}
