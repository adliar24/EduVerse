-- Add is_graded column to assignments table
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS is_graded BOOLEAN DEFAULT true;
