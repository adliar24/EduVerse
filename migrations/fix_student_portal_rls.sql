-- ====================================================================
-- EDUVERSE SAFE RLS & PERMISSIONS UPDATE (NON-DESTRUCTIVE)
-- Menjamin data yang sudah ada TIDAK TERHAPUS sama sekali.
-- Membuka akses baca untuk Siswa (anon role) pada materi, tugas, dan presensi.
-- ====================================================================

-- 1. Izin dasar akses tabel untuk role anon dan authenticated
GRANT SELECT ON public.materials TO anon;
GRANT SELECT ON public.materials TO authenticated;

GRANT SELECT ON public.assignments TO anon;
GRANT SELECT ON public.assignments TO authenticated;

GRANT ALL ON public.attendance_records TO anon;
GRANT ALL ON public.attendance_records TO authenticated;

GRANT SELECT ON public.attendance_sessions TO anon;
GRANT SELECT ON public.attendance_sessions TO authenticated;

-- 2. Pastikan RLS aktif secara aman pada tabel terkait
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Policy untuk Materials (Siswa dapat membaca materi kelas)
DROP POLICY IF EXISTS "allow_anon_read_materials" ON public.materials;
DROP POLICY IF EXISTS "allow_auth_all_materials" ON public.materials;

CREATE POLICY "allow_anon_read_materials" 
ON public.materials FOR SELECT TO anon 
USING (true);

CREATE POLICY "allow_auth_all_materials" 
ON public.materials FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 4. Policy untuk Assignments (Siswa dapat membaca tugas kelas)
DROP POLICY IF EXISTS "allow_anon_read_assignments" ON public.assignments;
DROP POLICY IF EXISTS "allow_auth_all_assignments" ON public.assignments;

CREATE POLICY "allow_anon_read_assignments" 
ON public.assignments FOR SELECT TO anon 
USING (true);

CREATE POLICY "allow_auth_all_assignments" 
ON public.assignments FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 5. Policy untuk Attendance Records (Siswa dapat mencatat presensi mandiri)
DROP POLICY IF EXISTS "allow_anon_attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "allow_auth_all_attendance_records" ON public.attendance_records;

CREATE POLICY "allow_anon_attendance_records" 
ON public.attendance_records FOR ALL TO anon 
USING (true) WITH CHECK (true);

CREATE POLICY "allow_auth_all_attendance_records" 
ON public.attendance_records FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- 6. Policy untuk Attendance Sessions (Siswa dapat membaca sesi aktif)
DROP POLICY IF EXISTS "allow_anon_read_attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "allow_auth_all_attendance_sessions" ON public.attendance_sessions;

CREATE POLICY "allow_anon_read_attendance_sessions" 
ON public.attendance_sessions FOR SELECT TO anon 
USING (true);

CREATE POLICY "allow_auth_all_attendance_sessions" 
ON public.attendance_sessions FOR ALL TO authenticated 
USING (true) WITH CHECK (true);
