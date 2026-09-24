-- ====================================================================
-- EDUVERSE: TABEL PENGUMPULAN TUGAS MURID (ASSIGNMENT SUBMISSIONS)
-- Mendukung pengumpulan teks, foto/gambar terkompresi, dan dokumen PDF.
-- ====================================================================

-- 1. Buat Tabel Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  school_id UUID,
  class_id UUID,
  student_name TEXT,
  student_code TEXT,
  text_response TEXT,
  link TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'submitted' NOT NULL, -- 'submitted', 'late', 'graded'
  score NUMERIC(5,2),
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Pastikan kolom link ada jika tabel sudah pernah dibuat sebelumnya
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS link TEXT;

-- Tambahkan constraint unique jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_assignment'
  ) THEN
    ALTER TABLE public.assignment_submissions 
    ADD CONSTRAINT unique_student_assignment UNIQUE (assignment_id, student_id);
  END IF;
END $$;

-- 2. Index untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_class ON public.assignment_submissions(class_id);

-- 3. Izin Akses Tabel (Role anon dan authenticated)
GRANT ALL ON public.assignment_submissions TO anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS) dengan Policy Terbuka untuk Siswa & Guru
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "allow_all_assignment_submissions" 
ON public.assignment_submissions FOR ALL TO public 
USING (true) WITH CHECK (true);

-- 5. Konfigurasi Bucket Storage untuk Pengumpulan Berkas Tugas (assignment-submissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'assignment-submissions', 
  'assignment-submissions', 
  true, 
  26214400, -- Max 25MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 26214400;

-- 6. Storage Policies untuk Bucket assignment-submissions
DROP POLICY IF EXISTS "Allow public upload assignment submissions" ON storage.objects;
CREATE POLICY "Allow public upload assignment submissions" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'assignment-submissions');

DROP POLICY IF EXISTS "Allow public update assignment submissions" ON storage.objects;
CREATE POLICY "Allow public update assignment submissions" 
ON storage.objects FOR UPDATE TO public 
USING (bucket_id = 'assignment-submissions')
WITH CHECK (bucket_id = 'assignment-submissions');

DROP POLICY IF EXISTS "Allow public read assignment submissions" ON storage.objects;
CREATE POLICY "Allow public read assignment submissions" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'assignment-submissions');

DROP POLICY IF EXISTS "Allow public delete assignment submissions" ON storage.objects;
CREATE POLICY "Allow public delete assignment submissions" 
ON storage.objects FOR DELETE TO public 
USING (bucket_id = 'assignment-submissions');
