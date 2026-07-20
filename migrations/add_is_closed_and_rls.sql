-- =========================================================================
-- MIGRASI OPTIMASI & KEAMANAN ABSENSI (RLS & KUNCI SESI)
-- =========================================================================

-- 1. Tambah kolom is_closed di tabel attendance_sessions jika belum ada
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;

-- 2. Aktifkan RLS pada seluruh tabel terkait absensi dan poin
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_points ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Keamanan (Policies) untuk Schedules
DROP POLICY IF EXISTS "Guru dapat mengelola jadwal sendiri" ON public.schedules;
CREATE POLICY "Guru dapat mengelola jadwal sendiri" ON public.schedules
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 4. Kebijakan Keamanan (Policies) untuk Attendance Sessions
DROP POLICY IF EXISTS "Guru dapat mengelola sesi absensi sendiri" ON public.attendance_sessions;
CREATE POLICY "Guru dapat mengelola sesi absensi sendiri" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 5. Kebijakan Keamanan (Policies) untuk Attendance Records
DROP POLICY IF EXISTS "Guru dapat mengelola catatan absensi sendiri" ON public.attendance_records;
CREATE POLICY "Guru dapat mengelola catatan absensi sendiri" ON public.attendance_records
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 6. Kebijakan Keamanan (Policies) untuk Events
DROP POLICY IF EXISTS "Guru dapat mengelola kalender acara sendiri" ON public.events;
CREATE POLICY "Guru dapat mengelola kalender acara sendiri" ON public.events
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 7. Kebijakan Keamanan (Policies) untuk Cancellations (Pembatalan Kelas)
DROP POLICY IF EXISTS "Guru dapat mengelola pembatalan kelas sendiri" ON public.cancellations;
CREATE POLICY "Guru dapat mengelola pembatalan kelas sendiri" ON public.cancellations
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 8. Kebijakan Keamanan (Policies) untuk Student Points (Poin Prestasi)
DROP POLICY IF EXISTS "Guru dapat mengelola poin prestasi siswa sendiri" ON public.student_points;
CREATE POLICY "Guru dapat mengelola poin prestasi siswa sendiri" ON public.student_points
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
