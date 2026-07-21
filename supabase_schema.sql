-- ============================================
-- EDUTEST DATABASE SCHEMA
-- Aman untuk copy-paste berkali-kali
-- ============================================

-- 1. Tabel Profil Guru
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  is_profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tambah kolom jika belum ada
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_profile_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN is_profile_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 1a. Tabel Sekolah
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1b. Tabel Relasi Guru dan Sekolah (bisa lebih dari 1 sekolah)
CREATE TABLE IF NOT EXISTS public.teacher_schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year TEXT,
  semester TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(teacher_id, school_id, academic_year, semester)
);

-- 1c. Tabel Mata Pelajaran (predefined + custom)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1d. Tabel Relasi Guru dan Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(teacher_id, subject_id)
);

-- 2. Tabel Kelas
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tambah kolom jika kelas sudah ada sebelumnya
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'school_id') THEN
    ALTER TABLE public.classes ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
  END IF;
END $$;


-- 3. Tabel Siswa (Master Data)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  nisn TEXT,
  student_code TEXT UNIQUE,
  password TEXT DEFAULT 'murid19',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tambah kolom jika siswa sudah ada sebelumnya
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'school_id') THEN
    ALTER TABLE public.students ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'password') THEN
    ALTER TABLE public.students ADD COLUMN password TEXT DEFAULT 'murid19';
  END IF;
END $$;


-- 3. Tabel Kategori/Folder Soal
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabel Bank Soal
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  correct_answer TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabel Opsi Jawaban (untuk Pilihan Ganda)
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL,
  option_text TEXT NOT NULL,
  image_url TEXT
);

-- 5. Tabel Ujian
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  exam_code TEXT UNIQUE NOT NULL,
  duration INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  random_question BOOLEAN DEFAULT false,
  random_answer BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT false,
  show_score BOOLEAN DEFAULT true,
  strict_mode BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add school_id to exams if not exists (migration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'school_id') THEN
    ALTER TABLE public.exams ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Tabel Relasi Ujian dan Soal
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE
);

-- 7. Tabel Sesi Ujian
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name TEXT NOT NULL,
  session_code TEXT,
  is_active BOOLEAN DEFAULT true,
  expected_students INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add columns if not exists (migration for exam_sessions)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_sessions' AND column_name = 'expected_students') THEN
    ALTER TABLE public.exam_sessions ADD COLUMN expected_students INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_sessions' AND column_name = 'school_id') THEN
    ALTER TABLE public.exam_sessions ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. Tabel Peserta (Siswa)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.exam_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  status TEXT DEFAULT 'ongoing',
  violations INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  last_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tambah kolom session_id di participants jika belum ada
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'participants') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'session_id') THEN
    ALTER TABLE public.participants ADD COLUMN session_id UUID REFERENCES public.exam_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add columns if they don't exist (migration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'is_locked') THEN
    ALTER TABLE public.participants ADD COLUMN is_locked BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'last_position') THEN
    ALTER TABLE public.participants ADD COLUMN last_position INTEGER DEFAULT 0;
  END IF;
END $$;

-- 8. Tabel Jawaban Peserta
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL, 
  answer_text TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (RLS) - Menggunakan DROP IF EXISTS untuk aman
-- ============================================

-- Trigger untuk auto create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, subject)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'subject', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "Teachers can manage their own categories" ON public.categories;
CREATE POLICY "Teachers can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = teacher_id);

-- Classes
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
CREATE POLICY "Teachers can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Public can view classes" ON public.classes;
CREATE POLICY "Public can view classes" ON public.classes FOR SELECT USING (true);

-- Students
DROP POLICY IF EXISTS "Teachers can manage their own students" ON public.students;
CREATE POLICY "Teachers can manage their own students" ON public.students FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Public can view students" ON public.students;
CREATE POLICY "Public can view students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update own student record" ON public.students;
CREATE POLICY "Public can update own student record" ON public.students FOR UPDATE USING (true) WITH CHECK (true);

-- Questions
DROP POLICY IF EXISTS "Allow select own questions" ON public.questions;
CREATE POLICY "Allow select own questions" ON public.questions FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Public can view questions" ON public.questions;
CREATE POLICY "Public can view questions" ON public.questions FOR SELECT USING (true);

-- Question Options
DROP POLICY IF EXISTS "Teachers can manage their own options" ON public.question_options;
CREATE POLICY "Teachers can manage their own options" ON public.question_options FOR ALL USING (EXISTS (SELECT 1 FROM public.questions WHERE id = question_id AND teacher_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view question options" ON public.question_options;
CREATE POLICY "Public can view question options" ON public.question_options FOR SELECT USING (true);

-- Exams - PENTING: Guru bisa lihat exams mereka, publik bisa lihat yang aktif
DROP POLICY IF EXISTS "Teachers can manage their own exams" ON public.exams;
CREATE POLICY "Teachers can manage their own exams" ON public.exams FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Public can view active exams" ON public.exams;
CREATE POLICY "Public can view active exams" ON public.exams FOR SELECT USING (is_active = true);

-- Exam Questions
DROP POLICY IF EXISTS "Teachers can manage their own exam questions" ON public.exam_questions;
CREATE POLICY "Teachers can manage their own exam questions" ON public.exam_questions FOR ALL USING (EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND teacher_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view exam questions" ON public.exam_questions;
CREATE POLICY "Public can view exam questions" ON public.exam_questions FOR SELECT USING (EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND is_active = true));

-- Exam Sessions
DROP POLICY IF EXISTS "Teachers can manage their own exam sessions" ON public.exam_sessions;
CREATE POLICY "Teachers can manage their own exam sessions" ON public.exam_sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND teacher_id = auth.uid()));

DROP POLICY IF EXISTS "Public can view active exam sessions" ON public.exam_sessions;
CREATE POLICY "Public can view active exam sessions" ON public.exam_sessions FOR SELECT USING (is_active = true);

-- Participants - PENTING untuk Live Monitor
DROP POLICY IF EXISTS "Public all participants" ON public.participants;
CREATE POLICY "Public all participants" ON public.participants FOR ALL TO anon USING (true) WITH CHECK (true);

-- Answers
DROP POLICY IF EXISTS "Public all answers" ON public.answers;
CREATE POLICY "Public all answers" ON public.answers FOR ALL TO anon USING (true) WITH CHECK (true);

-- Schools
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert schools" ON public.schools;
CREATE POLICY "Anyone can insert schools" ON public.schools FOR INSERT WITH CHECK (true);

-- Teacher Schools
DROP POLICY IF EXISTS "Teachers can manage their school associations" ON public.teacher_schools;
CREATE POLICY "Teachers can manage their school associations" ON public.teacher_schools FOR ALL USING (auth.uid() = teacher_id);

-- Subjects
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert subjects" ON public.subjects;
CREATE POLICY "Anyone can insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);

-- Teacher Subjects
DROP POLICY IF EXISTS "Teachers can manage their subjects" ON public.teacher_subjects;
CREATE POLICY "Teachers can manage their subjects" ON public.teacher_subjects FOR ALL USING (auth.uid() = teacher_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.participants TO anon;
GRANT ALL ON public.answers TO anon;
GRANT ALL ON public.exams TO anon;
GRANT ALL ON public.students TO anon;
GRANT ALL ON public.participants TO authenticated;
GRANT ALL ON public.answers TO authenticated;
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.students TO authenticated;

-- ============================================
-- DATABASE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_answers_participant_id ON public.answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_participants_exam_id ON public.participants(exam_id);
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON public.participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants(status);
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_code ON public.exams(exam_code);
CREATE INDEX IF NOT EXISTS idx_questions_teacher_id ON public.questions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_participants_exam_status ON public.participants(exam_id, status);
CREATE INDEX IF NOT EXISTS idx_exams_active_archived ON public.exams(is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON public.exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_is_active ON public.exam_sessions(is_active);

-- ============================================
-- SEED DATA - MATA PELAJARAN
-- ============================================
INSERT INTO public.subjects (name, level) VALUES
('Pendidikan Agama Islam', 'SD'),
('Pendidikan Kewarganegaraan', 'SD'),
('Bahasa Indonesia', 'SD'),
('Bahasa Inggris', 'SD'),
('Matematika', 'SD'),
('Ilmu Pengetahuan Alam', 'SD'),
('Ilmu Pengetahuan Sosial', 'SD'),
('Seni Budaya dan Keterampilan', 'SD'),
('Pendidikan Jasmani dan Kesehatan', 'SD'),
('Prakarya', 'SD'),
('Pendidikan Agama Islam', 'SMP'),
('Pendidikan Kewarganegaraan', 'SMP'),
('Bahasa Indonesia', 'SMP'),
('Bahasa Inggris', 'SMP'),
('Matematika', 'SMP'),
('Ilmu Pengetahuan Alam', 'SMP'),
('Ilmu Pengetahuan Sosial', 'SMP'),
('Seni Budaya', 'SMP'),
('Pendidikan Jasmani dan Kesehatan', 'SMP'),
('Prakarya', 'SMP'),
('Informatika', 'SMP'),
('Pendidikan Agama Islam', 'SMA'),
('Pendidikan Kewarganegaraan', 'SMA'),
('Bahasa Indonesia', 'SMA'),
('Bahasa Inggris', 'SMA'),
('Matematika', 'SMA'),
('Sejarah Indonesia', 'SMA'),
('Sejarah', 'SMA'),
('Geografi', 'SMA'),
('Ekonomi', 'SMA'),
('Sosiologi', 'SMA'),
('Seni Budaya', 'SMA'),
('Pendidikan Jasmani dan Kesehatan', 'SMA'),
('Informatika', 'SMA'),
('Kimia', 'SMA'),
('Fisika', 'SMA'),
('Biologi', 'SMA'),
('Pendidikan Agama Islam', 'SMK'),
('Pendidikan Kewarganegaraan', 'SMK'),
('Bahasa Indonesia', 'SMK'),
('Bahasa Inggris', 'SMK'),
('Matematika', 'SMK'),
('Informatika', 'SMK'),
('Produk Kreatif dan Kewirausahaan', 'SMK'),
('Simulasi Digital', 'SMK'),
('Fisika', 'SMK'),
('Kimia', 'SMK'),
('Seni Budaya', 'SMK'),
('Pendidikan Jasmani dan Kesehatan', 'SMK'),
('Dasar Program Keahlian (DPK)', 'SMK'),
('Bahasa Arab', 'UMUM'),
('Bahasa Jepang', 'UMUM'),
('Bahasa Korea', 'UMUM'),
('Bahasa Mandarin', 'UMUM'),
('Bahasa Perancis', 'UMUM'),
('Bahasa Jerman', 'UMUM'),
('Bahasa Spanyol', 'UMUM'),
('Pendidikan Islam', 'UMUM'),
('Filsafat', 'UMUM'),
('Ekonomi', 'UMUM'),
('Akuntansi', 'UMUM'),
('Kewirausahaan', 'UMUM'),
('Robotika', 'UMUM'),
('Coding dan Pemrograman', 'UMUM'),
('Desain Grafis', 'UMUM'),
('Multimedia', 'UMUM'),
('Keuangan', 'UMUM'),
('Administrasi Perkantoran', 'UMUM'),
('Perhotelan', 'UMUM'),
('Pariwiata', 'UMUM'),
('Keperawatan', 'UMUM'),
('Farmasi', 'UMUM'),
('Laboratorium', 'UMUM'),
('Mesin Otomotif', 'UMUM'),
('Elektronika', 'UMUM'),
('Listrik', 'UMUM'),
('Bangunan', 'UMUM'),
('Tata Busana', 'UMUM'),
('Tata Rias', 'UMUM'),
('Kuliner', 'UMUM')
ON CONFLICT DO NOTHING;


-- =========================================================================
-- INTEGRASI PORTAL EDUVERSE: ADDITIONS FOR BIOMETRICS, ATTENDANCE & GRADING
-- =========================================================================

-- 1. Tambahkan kolom biometrik wajah ke tabel master students jika belum ada
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS face_embedding TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS face_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS face_vector TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'murid19';

-- 2. Fungsi Kesamaan Kosinus untuk mencocokkan wajah (EduCheck)
CREATE OR REPLACE FUNCTION cosine_similarity(vec1 text, vec2 text) RETURNS float AS $$
DECLARE
  v1 float[];
  v2 float[];
  dot_product float := 0;
  norm1 float := 0;
  norm2 float := 0;
  result float;
BEGIN
  v1 := string_to_array(vec1, ',')::float[];
  v2 := string_to_array(vec2, ',')::float[];
  
  FOR i IN 1..array_length(v1, 1) LOOP
    dot_product := dot_product + v1[i] * v2[i];
    norm1 := norm1 + v1[i] * v1[i];
    norm2 := norm2 + v2[i] * v2[i];
  END LOOP;
  
  norm1 := sqrt(norm1);
  norm2 := sqrt(norm2);
  
  IF norm1 = 0 OR norm2 = 0 THEN
    RETURN 0;
  END IF;
  
  result := dot_product / (norm1 * norm2);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Fungsi RPC untuk mencocokkan deskriptor wajah (EduCheck)
CREATE OR REPLACE FUNCTION match_face_descriptor(
  input_descriptor text,
  threshold float DEFAULT 0.4
)
RETURNS TABLE (
  student_id UUID,
  name text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.name,
    cosine_similarity(input_descriptor, s.face_vector) as similarity
  FROM public.students s
  WHERE s.face_vector IS NOT NULL
    AND s.face_vector != ''
  ORDER BY similarity DESC
  LIMIT 1;
END;
$$;

-- 4. Fungsi RPC untuk mencocokkan deskriptor wajah di kelas tertentu (EduCheck)
CREATE OR REPLACE FUNCTION match_face_descriptor_with_class(
  input_descriptor text,
  class_id UUID,
  threshold float DEFAULT 0.6
)
RETURNS TABLE (
  student_id UUID,
  name text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.name,
    cosine_similarity(input_descriptor, s.face_vector) as similarity
  FROM public.students s
  WHERE s.class_id = class_id
    AND s.face_vector IS NOT NULL
    AND s.face_vector != ''
  ORDER BY similarity DESC
  LIMIT 1;
END;
$$;


-- =========================================================================
-- TABEL BARU MODUL ABSENSI (EDUCHECK)
-- =========================================================================

-- 5. Tabel Jadwal Mengajar (EduCheck)
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL, -- 'Senin', 'Selasa', dll.
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL, -- "07:00"
  end_time TEXT NOT NULL -- "08:30"
);

-- 6. Tabel Sesi Absensi (EduCheck - Renamed from sessions)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,
  date_iso TEXT NOT NULL, -- YYYY-MM-DD
  day_name TEXT NOT NULL,
  date_label TEXT NOT NULL,
  meeting_number INTEGER NOT NULL,
  topic TEXT DEFAULT '' NOT NULL,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabel Catatan Absensi (EduCheck - Renamed from records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpha', 'Terlambat')),
  time_iso TEXT NOT NULL,
  time_hhmmss TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabel Acara/Kalender (EduCheck)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  date_iso TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Libur', 'Sakit', 'Dinas', 'Lainnya')),
  description TEXT,
  is_full_day BOOLEAN DEFAULT true NOT NULL,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Tabel Pembatalan Jadwal (EduCheck)
CREATE TABLE IF NOT EXISTS public.cancellations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date_iso TEXT NOT NULL,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);


-- =========================================================================
-- TABEL BARU MODUL PENILAIAN & POIN (EDUSCORE)
-- =========================================================================

-- 10. Tabel Tujuan Pembelajaran - TP (EduScore)
CREATE TABLE IF NOT EXISTS public.learning_objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL,
  kode TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Tabel Pertemuan Nilai (EduScore)
CREATE TABLE IF NOT EXISTS public.meetings (
  id_pertemuan UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_kelas UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL,
  semester TEXT NOT NULL,
  urutan_ke INT NOT NULL,
  tanggal DATE NOT NULL,
  materi TEXT,
  jenis TEXT, -- Formatif / Sumatif
  activity_type TEXT,
  activity_name TEXT,
  assessment_category TEXT,
  aspek_penilaian TEXT DEFAULT 'Pengetahuan' NOT NULL,
  id_tp UUID REFERENCES public.learning_objectives(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Tabel Nilai Pertemuan (EduScore)
CREATE TABLE IF NOT EXISTS public.meeting_scores (
  id TEXT PRIMARY KEY, -- format: idPertemuan_idSiswa
  id_pertemuan UUID REFERENCES public.meetings(id_pertemuan) ON DELETE CASCADE,
  id_siswa UUID REFERENCES public.students(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  nilai_angka NUMERIC NOT NULL,
  bintang INT DEFAULT 0,
  catatan TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Tabel Rekap Nilai Akhir (EduScore)
CREATE TABLE IF NOT EXISTS public.final_grades (
  id_siswa UUID REFERENCES public.students(id) ON DELETE CASCADE,
  id_kelas UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  nilai_smt_lalu NUMERIC,
  nilai_manual NUMERIC,
  PRIMARY KEY (id_siswa, id_kelas)
);

-- 14. Tabel Poin Perilaku Siswa (EduScore)
CREATE TABLE IF NOT EXISTS public.student_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_siswa UUID REFERENCES public.students(id) ON DELETE CASCADE,
  id_kelas UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  tanggal TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  poin INT DEFAULT 0,
  keterangan TEXT,
  tipe TEXT -- 'manual' | 'qr'
);


-- =========================================================================
-- INDEKS & ROW LEVEL SECURITY (RLS) UNTUK TABEL BARU
-- =========================================================================

-- Indeks Kecepatan Kueri
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_scores_siswa ON public.meeting_scores(id_siswa);
CREATE INDEX IF NOT EXISTS idx_student_points_siswa ON public.student_points(id_siswa);

-- RLS Setup (Dinonaktifkan secara bawaan seperti skema EduCheck untuk memudahkan setup awal, silakan aktifkan di produksi)
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_points DISABLE ROW LEVEL SECURITY;


-- =========================================================================
-- TRIGGER UNTUK MENYELARASKAN KOLOM MASTER DATA (SSO / ROSTER SYNC)
-- =========================================================================

-- Tambahkan kolom penyesuaian (alias) di tabel classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS id_kelas UUID;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS nama_kelas TEXT;

-- Tambahkan kolom penyesuaian (alias) di tabel students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS id_siswa UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS id_kelas UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nama TEXT;

-- Fungsi sinkronisasi tabel classes
CREATE OR REPLACE FUNCTION sync_classes_columns_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Selaraskan ID
  IF NEW.id IS NOT NULL AND (NEW.id_kelas IS NULL OR NEW.id_kelas != NEW.id) THEN
    NEW.id_kelas := NEW.id;
  ELSIF NEW.id_kelas IS NOT NULL AND (NEW.id IS NULL OR NEW.id != NEW.id_kelas) THEN
    NEW.id := NEW.id_kelas;
  END IF;
  
  -- Selaraskan Nama Kelas
  IF NEW.name IS NOT NULL AND (NEW.nama_kelas IS NULL OR NEW.nama_kelas != NEW.name) THEN
    NEW.nama_kelas := NEW.name;
  ELSIF NEW.nama_kelas IS NOT NULL AND (NEW.name IS NULL OR NEW.name != NEW.nama_kelas) THEN
    NEW.name := NEW.nama_kelas;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_classes_columns_trigger ON public.classes;
CREATE TRIGGER sync_classes_columns_trigger
BEFORE INSERT OR UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION sync_classes_columns_fn();


-- Fungsi sinkronisasi tabel students
CREATE OR REPLACE FUNCTION sync_students_columns_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Selaraskan ID Siswa
  IF NEW.id IS NOT NULL AND (NEW.id_siswa IS NULL OR NEW.id_siswa != NEW.id) THEN
    NEW.id_siswa := NEW.id;
  ELSIF NEW.id_siswa IS NOT NULL AND (NEW.id IS NULL OR NEW.id != NEW.id_siswa) THEN
    NEW.id := NEW.id_siswa;
  END IF;

  -- Selaraskan ID Kelas
  IF NEW.class_id IS NOT NULL AND (NEW.id_kelas IS NULL OR NEW.id_kelas != NEW.class_id) THEN
    NEW.id_kelas := NEW.class_id;
  ELSIF NEW.id_kelas IS NOT NULL AND (NEW.class_id IS NULL OR NEW.class_id != NEW.id_kelas) THEN
    NEW.class_id := NEW.id_kelas;
  END IF;

  -- Selaraskan Nama Siswa
  IF NEW.name IS NOT NULL AND (NEW.nama IS NULL OR NEW.nama != NEW.name) THEN
    NEW.nama := NEW.name;
  ELSIF NEW.nama IS NOT NULL AND (NEW.name IS NULL OR NEW.name != NEW.nama) THEN
    NEW.name := NEW.nama;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_students_columns_trigger ON public.students;
CREATE TRIGGER sync_students_columns_trigger
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION sync_students_columns_fn();


-- =========================================================================
-- TABEL DAN POLICIES UNTUK MATERI DAN TUGAS
-- =========================================================================

-- Tabel Materials (Materi)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  target_type TEXT DEFAULT 'class' NOT NULL, -- 'class' atau 'students'
  student_ids UUID[] DEFAULT '{}'::UUID[], -- list student IDs jika target_type = 'students'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Assignments (Tugas)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  target_type TEXT DEFAULT 'class' NOT NULL, -- 'class' atau 'students'
  student_ids UUID[] DEFAULT '{}'::UUID[], -- list student IDs jika target_type = 'students'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Policies untuk Materials
DROP POLICY IF EXISTS "Guru dapat mengelola materi sendiri" ON public.materials;
CREATE POLICY "Guru dapat mengelola materi sendiri" ON public.materials
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Siswa dapat melihat materi" ON public.materials;
CREATE POLICY "Siswa dapat melihat materi" ON public.materials
  FOR SELECT TO public
  USING (true);

-- Policies untuk Assignments
DROP POLICY IF EXISTS "Guru dapat mengelola tugas sendiri" ON public.assignments;
CREATE POLICY "Guru dapat mengelola tugas sendiri" ON public.assignments
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Siswa dapat melihat tugas" ON public.assignments;
CREATE POLICY "Siswa dapat melihat tugas" ON public.assignments
  FOR SELECT TO public
  USING (true);
