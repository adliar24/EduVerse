-- ====================================================================
-- EDUVERSE: PERBAIKAN RLS & AKSES HASIL UJIAN SISWA & ADMIN (NON-DESTRUCTIVE)
-- Menjamin data ujian, bank soal, siswa, dan hasil tidak akan terhapus.
-- Memastikan siswa (role: anon) dan guru/admin (role: authenticated)
-- dapat mengirim, menyimpan, membaca, dan merekap nilai ujian dengan lancar.
-- ====================================================================

-- 1. Pastikan kolom-kolom pendukung tersedia di tabel participants dan exams
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS qr_submission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS strict_limit INTEGER DEFAULT 3;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS bypass_code TEXT;

ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.exam_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS last_position INTEGER DEFAULT 0;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS lock_reason TEXT DEFAULT NULL;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS is_qr BOOLEAN DEFAULT false;

-- 2. Berikan izin hak akses operasional tabel kepada role anon dan authenticated
GRANT ALL ON public.participants TO anon, authenticated;
GRANT ALL ON public.answers TO anon, authenticated;
GRANT ALL ON public.exam_sessions TO anon, authenticated;
GRANT ALL ON public.exams TO anon, authenticated;

-- 3. Pastikan RLS aktif
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Perbaiki Policy untuk Participants (Siswa bisa insert & update nilai, Guru bisa lihat & rekap semua hasil)
DROP POLICY IF EXISTS "Public all participants" ON public.participants;
DROP POLICY IF EXISTS "allow_all_participants_access" ON public.participants;
DROP POLICY IF EXISTS "allow_anon_participants" ON public.participants;
DROP POLICY IF EXISTS "allow_auth_participants" ON public.participants;

CREATE POLICY "allow_all_participants_access"
ON public.participants
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. Perbaiki Policy untuk Answers (Jawaban peserta)
DROP POLICY IF EXISTS "Public all answers" ON public.answers;
DROP POLICY IF EXISTS "allow_all_answers_access" ON public.answers;
DROP POLICY IF EXISTS "allow_anon_answers" ON public.answers;
DROP POLICY IF EXISTS "allow_auth_answers" ON public.answers;

CREATE POLICY "allow_all_answers_access"
ON public.answers
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 6. Perbaiki Policy untuk Exam Sessions (Target kelas & sesi ujian)
DROP POLICY IF EXISTS "allow_all_exam_sessions" ON public.exam_sessions;
CREATE POLICY "allow_all_exam_sessions"
ON public.exam_sessions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 7. Tambahkan tabel ke Realtime Publication (untuk fitur Live Monitor)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
  END IF;
END $$;
