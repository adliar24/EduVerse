-- ============================================
-- EDUTEST POLICIES & PERMISSIONS
-- Jalankan ini setelah supabase_schema.sql
-- ============================================

-- Force complete permissions using GRANT (bypass RLS issues)
GRANT ALL ON public.participants TO anon;
GRANT ALL ON public.answers TO anon;
GRANT ALL ON public.exams TO anon;
GRANT ALL ON public.exam_sessions TO anon;
GRANT ALL ON public.participants TO authenticated;
GRANT ALL ON public.answers TO authenticated;
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.exam_sessions TO authenticated;
GRANT SELECT ON public.students TO anon;
GRANT SELECT ON public.students TO authenticated;
GRANT SELECT ON public.classes TO anon;
GRANT SELECT ON public.classes TO authenticated;
GRANT SELECT ON public.exam_questions TO anon;
GRANT SELECT ON public.exam_questions TO authenticated;
GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT ON public.question_options TO anon;
GRANT SELECT ON public.question_options TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.schools TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for these tables
DROP POLICY IF EXISTS "allow_all_participants" ON public.participants;
DROP POLICY IF EXISTS "Public all participants" ON public.participants;
DROP POLICY IF EXISTS "Public access for participants" ON public.participants;
DROP POLICY IF EXISTS "participants_all" ON public.participants;
DROP POLICY IF EXISTS "participants_all_auth" ON public.participants;
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_select_auth" ON public.students;
DROP POLICY IF EXISTS "classes_select" ON public.classes;
DROP POLICY IF EXISTS "classes_select_auth" ON public.classes;
DROP POLICY IF EXISTS "exam_questions_select" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_questions_select_auth" ON public.exam_questions;
DROP POLICY IF EXISTS "questions_select" ON public.questions;
DROP POLICY IF EXISTS "questions_select_auth" ON public.questions;
DROP POLICY IF EXISTS "question_options_select" ON public.question_options;
DROP POLICY IF EXISTS "question_options_select_auth" ON public.question_options;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_auth" ON public.profiles;
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_select_auth" ON public.subjects;
DROP POLICY IF EXISTS "schools_select" ON public.schools;
DROP POLICY IF EXISTS "schools_select_auth" ON public.schools;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_select_auth" ON public.categories;

DROP POLICY IF EXISTS "allow_all_answers" ON public.answers;
DROP POLICY IF EXISTS "Public all answers" ON public.answers;
DROP POLICY IF EXISTS "Public access for answers" ON public.answers;
DROP POLICY IF EXISTS "answers_all" ON public.answers;
DROP POLICY IF EXISTS "answers_all_auth" ON public.answers;

DROP POLICY IF EXISTS "allow_all_exams" ON public.exams;
DROP POLICY IF EXISTS "Public select active exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers can manage their own exams" ON public.exams;
DROP POLICY IF EXISTS "exams_all" ON public.exams;
DROP POLICY IF EXISTS "exams_all_auth" ON public.exams;

-- Exam Sessions
DROP POLICY IF EXISTS "Teachers can manage their own exam sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "Public can view active exam sessions" ON public.exam_sessions;
DROP POLICY IF EXISTS "exam_sessions_all" ON public.exam_sessions;
DROP POLICY IF EXISTS "exam_sessions_all_auth" ON public.exam_sessions;

-- Create permissive policies
CREATE POLICY "participants_all" ON public.participants FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "answers_all" ON public.answers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "exams_all" ON public.exams FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "exam_sessions_all" ON public.exam_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Also allow authenticated users
CREATE POLICY "participants_all_auth" ON public.participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "answers_all_auth" ON public.answers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "exams_all_auth" ON public.exams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "exam_sessions_all_auth" ON public.exam_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Students table (for student lookup by code)
CREATE POLICY "students_select" ON public.students FOR SELECT TO anon USING (true);
CREATE POLICY "students_select_auth" ON public.students FOR SELECT TO authenticated USING (true);

-- Classes table (for class name lookup)
CREATE POLICY "classes_select" ON public.classes FOR SELECT TO anon USING (true);
CREATE POLICY "classes_select_auth" ON public.classes FOR SELECT TO authenticated USING (true);

-- Exam questions table (for exam content)
CREATE POLICY "exam_questions_select" ON public.exam_questions FOR SELECT TO anon USING (true);
CREATE POLICY "exam_questions_select_auth" ON public.exam_questions FOR SELECT TO authenticated USING (true);

-- Questions table
CREATE POLICY "questions_select" ON public.questions FOR SELECT TO anon USING (true);
CREATE POLICY "questions_select_auth" ON public.questions FOR SELECT TO authenticated USING (true);

-- Question options table
CREATE POLICY "question_options_select" ON public.question_options FOR SELECT TO anon USING (true);
CREATE POLICY "question_options_select_auth" ON public.question_options FOR SELECT TO authenticated USING (true);

-- Profiles table
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO anon USING (true);
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Subjects table
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO anon USING (true);
CREATE POLICY "subjects_select_auth" ON public.subjects FOR SELECT TO authenticated USING (true);

-- Schools table
CREATE POLICY "schools_select" ON public.schools FOR SELECT TO anon USING (true);
CREATE POLICY "schools_select_auth" ON public.schools FOR SELECT TO authenticated USING (true);

-- Categories table
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "categories_select_auth" ON public.categories FOR SELECT TO authenticated USING (true);
