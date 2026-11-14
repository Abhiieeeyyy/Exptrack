-- ==============================================================================
-- Migration: Performance Indexes & Finance Credit Adjustments
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================
-- IMPORTANT: Run this once so Collections / Expenses / Credits stay fast as data grows.
-- The app also avoids loading bill Base64 images in list views (receipts load on View).

-- 1. Allow finance_credits to support negative adjustments (debits/reclaims)
-- by dropping the check constraint if present
ALTER TABLE finance_credits DROP CONSTRAINT IF EXISTS finance_credits_amount_check;

-- 2. Add high-performance indexes for large datasets (Collections, Expenses, Credits)
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(payment_status);
CREATE INDEX IF NOT EXISTS idx_collections_mode ON collections(payment_mode);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(collected_by_user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_date_status ON collections(created_at DESC, payment_status);

CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_status ON expenses(submitted_by_user_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_date_status ON expenses(created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_finance_credits_user ON finance_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_credits_created_at ON finance_credits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_credits_user_date ON finance_credits(user_id, created_at DESC);

-- 3. Ensure Bills storage bucket exists with public read access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bills',
    'bills',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket read/write policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Read Access for Bills'
    ) THEN
        CREATE POLICY "Public Read Access for Bills" ON storage.objects
        FOR SELECT USING (bucket_id = 'bills');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow Bill Uploads'
    ) THEN
        CREATE POLICY "Allow Bill Uploads" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'bills');
    END IF;
END $$;
