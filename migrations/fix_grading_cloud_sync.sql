-- ====================================================================
-- EDUVERSE CLOUD SYNC & PERMISSIONS UNTUK PENGELOLA NILAI (EDUSCORE)
-- Jalankan skrip ini di SQL Editor Supabase Dashboard Anda.
-- Skrip ini membuka izin penyimpanan & sinkronisasi nilai ke Cloud
-- agar data input nilai langsung tersimpan dan muncul di semua device.
-- ====================================================================

-- 1. Berikan hak akses penuh untuk tabel-tabel nilai kepada role anon dan authenticated
GRANT ALL ON public.meetings TO authenticated, anon, service_role;
GRANT ALL ON public.meeting_scores TO authenticated, anon, service_role;
GRANT ALL ON public.final_grades TO authenticated, anon, service_role;
GRANT ALL ON public.learning_objectives TO authenticated, anon, service_role;
GRANT ALL ON public.student_points TO authenticated, anon, service_role;
GRANT ALL ON public.point_templates TO authenticated, anon, service_role;
GRANT ALL ON public.assignment_submissions TO authenticated, anon, service_role;

-- 2. Nonaktifkan Row Level Security (RLS) pada tabel nilai agar tidak memblokir simpan (Error 401)
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions DISABLE ROW LEVEL SECURITY;

-- 3. Kebijakan fallback jika RLS tetap diaktifkan (memastikan tetap bebas akses baca-tulis)
DROP POLICY IF EXISTS "allow_all_meetings" ON public.meetings;
CREATE POLICY "allow_all_meetings" ON public.meetings FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_meeting_scores" ON public.meeting_scores;
CREATE POLICY "allow_all_meeting_scores" ON public.meeting_scores FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_final_grades" ON public.final_grades;
CREATE POLICY "allow_all_final_grades" ON public.final_grades FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_learning_objectives" ON public.learning_objectives;
CREATE POLICY "allow_all_learning_objectives" ON public.learning_objectives FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_student_points" ON public.student_points;
CREATE POLICY "allow_all_student_points" ON public.student_points FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_point_templates" ON public.point_templates;
CREATE POLICY "allow_all_point_templates" ON public.point_templates FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "allow_all_assignment_submissions" ON public.assignment_submissions FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Pastikan constraint unik untuk assignment_submissions (menghindari error 409)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_assignment'
    ) THEN
        ALTER TABLE public.assignment_submissions 
        ADD CONSTRAINT unique_student_assignment UNIQUE (assignment_id, student_id);
    END IF;
END $$;
