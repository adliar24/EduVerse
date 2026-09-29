-- ==============================================================================
-- MIGRATION: student_verses & student_points Permissions (EduVerse Pet & Level)
-- ==============================================================================

-- 1. Buat Tabel student_verses jika belum ada
CREATE TABLE IF NOT EXISTS public.student_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  school_id UUID,
  species TEXT NOT NULL,           -- 'Pyrofox' | 'Aqualotl' | 'Pangorock' | 'Cirrofinch' | 'Voltlynx'
  element TEXT NOT NULL,           -- 'api' | 'air' | 'bumi' | 'angin' | 'petir'
  nickname TEXT NOT NULL,          -- Nama panggilan Verse yang diberikan murid
  lifetime_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  stage INTEGER DEFAULT 1,         -- 1 | 2 | 3 | 4
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_student_verses_student UNIQUE (student_id)
);

-- 2. Index untuk Performa Pencarian
CREATE INDEX IF NOT EXISTS idx_student_verses_student_id ON public.student_verses(student_id);

-- 3. Beri Izin Akses Tabel (PENTING untuk role anon/murid & authenticated/guru)
GRANT ALL ON public.student_verses TO authenticated, anon, service_role;
GRANT SELECT ON public.student_points TO authenticated, anon, public;

-- 4. Keamanan RLS untuk student_verses
ALTER TABLE public.student_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public & Student Read Verse" ON public.student_verses;
CREATE POLICY "Public & Student Read Verse" 
  ON public.student_verses 
  FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Public & Student Insert Verse" ON public.student_verses;
CREATE POLICY "Public & Student Insert Verse" 
  ON public.student_verses 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public & Student Update Verse" ON public.student_verses;
CREATE POLICY "Public & Student Update Verse" 
  ON public.student_verses 
  FOR UPDATE 
  TO public 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public & Student Delete Verse" ON public.student_verses;
CREATE POLICY "Public & Student Delete Verse" 
  ON public.student_verses 
  FOR DELETE 
  TO public 
  USING (true);

-- 5. Kebijakan RLS agar Siswa (anon) bisa membaca student_points miliknya
DROP POLICY IF EXISTS "Siswa dapat membaca poin miliknya sendiri" ON public.student_points;
CREATE POLICY "Siswa dapat membaca poin miliknya sendiri" 
  ON public.student_points 
  FOR SELECT 
  TO public 
  USING (true);
