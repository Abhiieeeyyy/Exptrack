-- ==============================================================================
-- Migration: Add Finance Role & Finance Credits Table
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Update users role check constraint to include COLLECTOR & FINANCE
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'USER', 'COLLECTOR', 'FINANCE'));

-- 2. Create finance_credits table
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

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_finance_credits_user ON finance_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_credits_created_at ON finance_credits(created_at DESC);

-- 4. Disable RLS for transparent custom passkey client auth
ALTER TABLE finance_credits DISABLE ROW LEVEL SECURITY;
