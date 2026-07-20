-- Migration: Add offline_mode, strict_limit, and bypass_code columns to public.exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS offline_mode BOOLEAN DEFAULT false;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS strict_limit INT DEFAULT 3;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS bypass_code VARCHAR(10);
