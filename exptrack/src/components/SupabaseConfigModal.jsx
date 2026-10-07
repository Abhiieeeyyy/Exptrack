import React, { useState } from 'react';
import Modal from './Modal';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  updateSupabaseCredentials, 
  testSupabaseConnection,
  isSupabaseConfigured 
} from '../lib/supabase';

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [key, setKey] = useState(currentConfig.key || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'sql'
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    updateSupabaseCredentials(url, key);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleTest = async () => {
    if (!url || !key) {
      setTestResult({ success: false, message: 'Please enter both Supabase Project URL and Anon API Key' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, key);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setKey('');
    updateSupabaseCredentials('', '');
    setTestResult(null);
    if (onConfigSaved) onConfigSaved();
  };

  const copySchemaSQL = () => {
    const schemaSql = `-- ==============================================================================
-- FECMS: Function Expense & Collection Management System
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_book_number VARCHAR(100) UNIQUE NOT NULL,
    collected_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    donor_name VARCHAR(255) NOT NULL,
    donor_address TEXT,
    donor_phone VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(30) NOT NULL CHECK (payment_mode IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(collected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipt ON collections(receipt_book_number);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- 3. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    bill_image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- 4. STORAGE BUCKET FOR BILLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bills', 'bills', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Bills" ON storage.objects FOR SELECT USING (bucket_id = 'bills');
CREATE POLICY "Authenticated Users Can Upload Bills" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bills');

-- 5. ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable all operations for authenticated collections" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for authenticated expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- 6. INITIAL ADMIN USER (admin / admin123)
INSERT INTO users (id, username, password_hash, full_name, role, phone)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', '$2a$10$7r/1kO.2j1x6Xm8X3W5Oqum2s6u0A6I9Xm2E1yv7Xl2Z6q2Xm8X3W', 'Rajesh Sharma', 'ADMIN', '+91 98765 43210')
ON CONFLICT (username) DO NOTHING;
`;
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Database Connection"
      subtitle="Connect your Supabase PostgreSQL database & cloud storage"
      maxWidth="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          API Connection
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'sql'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SQL Schema (Copy &amp; Paste)
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-ref.supabase.co"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          {testResult && (
            <div
              className={`rounded-lg p-3 text-xs font-medium flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
              {(url || key) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 transition cursor-pointer"
                >
                  Clear Credentials
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Run this in your <strong className="text-slate-900">Supabase Dashboard &gt; SQL Editor</strong> to create all tables and policies:
            </p>
            <button
              type="button"
              onClick={copySchemaSQL}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-700 leading-relaxed">
{`-- 1. Run in Supabase SQL Editor:
-- Creates tables: users, collections, expenses
-- Creates storage bucket: bills
-- Sets up RLS policies for instant connectivity`}
          </pre>
        </div>
      )}
    </Modal>
  );
}
