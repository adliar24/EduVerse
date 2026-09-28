-- ====================================================================
-- EDUVERSE: CLOUD SYNC PENILAIAN AI (ESSAY & SKOR LENGKAP)
-- Jalankan skrip SQL ini di SQL Editor Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/dvagyvlkshwpqvbcxwjx/sql/new
--
-- Skrip ini menambahkan kolom penyimpanan nilai per butir essay,
-- feedback AI, serta pemisahan nilai PG / Essay ke cloud database
-- sehingga hasil periksa otomatis tersimpan & sinkron di semua device.
-- ====================================================================

-- 1. Tambahkan kolom nilai & catatan guru/AI pada tabel answers
ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT NULL;

ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS teacher_feedback TEXT DEFAULT NULL;

-- 2. Tambahkan kolom nilai PG, nilai Essay, dan status penilaian pada participants
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS score_pg NUMERIC DEFAULT NULL;

ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS score_essay NUMERIC DEFAULT NULL;

ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS essay_graded BOOLEAN DEFAULT true;

-- 3. Tambahkan kolom pengaturan bobot & penilaian pada tabel exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS grading_settings JSONB DEFAULT NULL;

-- 4. Berikan hak akses penuh kepada role anon, authenticated, dan service_role
GRANT ALL ON public.answers TO anon, authenticated, service_role;
GRANT ALL ON public.participants TO anon, authenticated, service_role;
GRANT ALL ON public.exams TO anon, authenticated, service_role;

-- 5. Pastikan Row Level Security (RLS) mengizinkan baca dan tulis secara bebas
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_answers_access" ON public.answers;
DROP POLICY IF EXISTS "Public all answers" ON public.answers;
DROP POLICY IF EXISTS "allow_all_answers" ON public.answers;
DROP POLICY IF EXISTS "answers_all" ON public.answers;
DROP POLICY IF EXISTS "answers_all_auth" ON public.answers;

CREATE POLICY "allow_all_answers_access" ON public.answers 
FOR ALL TO public 
USING (true) 
WITH CHECK (true);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_participants_access" ON public.participants;
DROP POLICY IF EXISTS "Public all participants" ON public.participants;
DROP POLICY IF EXISTS "participants_all" ON public.participants;

CREATE POLICY "allow_all_participants_access" ON public.participants 
FOR ALL TO public 
USING (true) 
WITH CHECK (true);

-- 6. Tambahkan ke publikasi Realtime Supabase agar update live antar perangkat
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- 7. Verifikasi kolom baru berhasil dibuat
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('answers', 'participants', 'exams') 
  AND column_name IN ('score', 'teacher_feedback', 'score_pg', 'score_essay', 'essay_graded', 'grading_settings');
