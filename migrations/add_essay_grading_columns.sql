-- Migration: Menambahkan kolom pendukung penilaian essay dan pemisahan nilai PG / Essay
-- Tabel: answers
ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT NULL;

ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS teacher_feedback TEXT DEFAULT NULL;

-- Tabel: participants
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS score_pg NUMERIC DEFAULT NULL;

ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS score_essay NUMERIC DEFAULT NULL;

ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS essay_graded BOOLEAN DEFAULT true;

-- Update RLS Permissions agar authenticated & anon bisa baca/tulis kolom baru
GRANT ALL ON public.answers TO authenticated;
GRANT ALL ON public.answers TO anon;
GRANT ALL ON public.participants TO authenticated;
GRANT ALL ON public.participants TO anon;
