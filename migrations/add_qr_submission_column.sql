-- =======================================================
-- MIGRATION: Add qr_submission column to public.exams table
-- =======================================================

-- Tambahkan kolom qr_submission jika belum ada
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS qr_submission BOOLEAN DEFAULT FALSE;
