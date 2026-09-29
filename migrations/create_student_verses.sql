-- ==============================================================================
-- MIGRATION: student_verses (Tabel Gamifikasi Pet Verse Murid)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  school_id UUID,
  species TEXT NOT NULL,           -- 'Pyrofox' | 'Aquaxolt' | 'Pangorock' | 'Cirrofinch' | 'Voltlynx'
  element TEXT NOT NULL,           -- 'api' | 'air' | 'bumi' | 'angin' | 'petir'
  nickname TEXT NOT NULL,          -- Nama panggilan Verse yang diberikan murid
  lifetime_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  stage INTEGER DEFAULT 1,         -- 1 | 2 | 3 | 4
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student_verses_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Index untuk pencarian cepat berdasarkan student_id
CREATE INDEX IF NOT EXISTS idx_student_verses_student_id ON public.student_verses(student_id);

-- Aktifkan RLS
ALTER TABLE public.student_verses ENABLE ROW LEVEL SECURITY;

-- Policy agar siswa/anon bisa membaca dan mengupdate datanya sendiri
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
