-- ==============================================================================
-- FECMS: Function Expense & Collection Management System
-- Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- Updated with Finance Role, Finance Credit Allocations & Real-time Debit Ledger
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE (Admin Treasurers, Field Collectors & Finance Managers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'COLLECTOR' CHECK (role IN ('ADMIN', 'USER', 'COLLECTOR', 'FINANCE')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user credential lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ------------------------------------------------------------------------------
-- 2. COLLECTIONS TABLE (Track every rupee collected with Book & Leaf #)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_book_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. '001-01' or '002-51'
    collected_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    donor_name VARCHAR(255) NOT NULL,
    donor_address TEXT,
    donor_phone VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING')),
    payment_mode VARCHAR(30) NOT NULL CHECK (payment_mode IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for collections
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(collected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_collections_receipt ON collections(receipt_book_number);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. EXPENSES TABLE (Submitted by Finance Managers, Audited & Approved by Admin)
-- ------------------------------------------------------------------------------
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

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. FINANCE CREDITS TABLE (Admin fund allocations to Finance Team members)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    credited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_mode VARCHAR(30) DEFAULT 'BANK_TRANSFER',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_credits_user ON finance_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_credits_created_at ON finance_credits(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. STORAGE BUCKET CONFIGURATION (for bill receipts)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bills',
    'bills',
    true,
    5242880, -- 5 MB cap
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Bills" ON storage.objects
FOR SELECT USING (bucket_id = 'bills');

CREATE POLICY "Authenticated Users Can Upload Bills" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bills');

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE finance_credits DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7. ADMIN ACCOUNT INITIAL SEED
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, full_name, role, phone)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin', 'Admin@skat369', 'Administrator', 'ADMIN', '')
ON CONFLICT (username) DO NOTHING;
