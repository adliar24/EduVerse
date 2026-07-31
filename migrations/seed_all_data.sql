-- Full Master Seed Migration for EduVerse (SMAN 19 Bandung)
-- Contains 16 Official Classes and 669 Official Students

BEGIN;

-- 1. Enable RLS and Permissive Policies
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_all" ON public.schools;
DROP POLICY IF EXISTS "schools_all_auth" ON public.schools;
CREATE POLICY "schools_all" ON public.schools FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "schools_all_auth" ON public.schools FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "classes_all" ON public.classes;
DROP POLICY IF EXISTS "classes_all_auth" ON public.classes;
CREATE POLICY "classes_all" ON public.classes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "classes_all_auth" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "students_all" ON public.students;
DROP POLICY IF EXISTS "students_all_auth" ON public.students;
CREATE POLICY "students_all" ON public.students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "students_all_auth" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Insert/Update Canonical School
INSERT INTO public.schools (id, name, school_name, address, created_at)
VALUES ('fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid, 'SMAN 19 Bandung', 'SMAN 19 Bandung', 'Jl. Dago Spesial No. 1, Bandung', NOW())
ON CONFLICT (id) DO UPDATE SET name = 'SMAN 19 Bandung', school_name = 'SMAN 19 Bandung';

-- 3. Upsert 16 Official Classes
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-000009ad812f'::uuid, 'X-A', 'Seni Rupa', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-A', subject = 'Seni Rupa', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-00002da5570c'::uuid, 'X-D', 'Seni Rupa', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-D', subject = 'Seni Rupa', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-000071080c55'::uuid, 'X-E', 'Seni Rupa', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-E', subject = 'Seni Rupa', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-00000fb56fb6'::uuid, 'X-F', 'Informatika', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-F', subject = 'Informatika', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-0000519d2ce9'::uuid, 'X-G', 'Informatika', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-G', subject = 'Informatika', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-00004d103678'::uuid, 'X-H', 'Informatika', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-H', subject = 'Informatika', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-000014426627'::uuid, 'X-I', 'Informatika', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-I', subject = 'Informatika', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-0000759502c6'::uuid, 'X-J', 'Informatika', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-J', subject = 'Informatika', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-00002918609b'::uuid, 'X-K', 'Informatika', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'X-K', subject = 'Informatika', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-000018e27fd9'::uuid, 'XI-B', 'PKWU', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-B', subject = 'PKWU', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-000048701cc6'::uuid, 'XI-C', 'PKWU', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-C', subject = 'PKWU', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-0000563d469b'::uuid, 'XI-D', 'PKWU', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-D', subject = 'PKWU', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-00000b155604'::uuid, 'XI-E', 'PKWU', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-E', subject = 'PKWU', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-00006c67f2a3'::uuid, 'XI-F', 'PKWU', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-F', subject = 'PKWU', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-0000324570be'::uuid, 'XI-G', 'PKWU', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-G', subject = 'PKWU', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.classes (id, name, subject, school_id)
VALUES ('00000000-0000-4000-8000-000099887766'::uuid, 'XI-H', 'Seni Rupa', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'XI-H', subject = 'Seni Rupa', school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;

-- 4. Upsert 669 Official Students
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000d998958'::uuid, 'A''INUN NAZWA HERI SAPUTRI', 'SB4VB9', 'SB4VB9', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'A''INUN NAZWA HERI SAPUTRI', nisn = 'SB4VB9', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000008308d23'::uuid, 'Abdillah Karim Pamungkas', '7UD8CD', '7UD8CD', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Abdillah Karim Pamungkas', nisn = '7UD8CD', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000005001563'::uuid, 'Abdullah Baihaqi Nazlah', 'NHRBUX', 'NHRBUX', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Abdullah Baihaqi Nazlah', nisn = 'NHRBUX', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006a0bb182'::uuid, 'Achmad Ridwan Yusuf Siktaop', 'TU63E5', 'TU63E5', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Achmad Ridwan Yusuf Siktaop', nisn = 'TU63E5', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003dd806b9'::uuid, 'Achmad Rifqi Fathurrahman', 'T9MSZ8', 'T9MSZ8', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Achmad Rifqi Fathurrahman', nisn = 'T9MSZ8', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000000bae446'::uuid, 'Adelio Liviano', '98LZYV', '98LZYV', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Adelio Liviano', nisn = '98LZYV', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b390c2f'::uuid, 'ADI NURROHMAN', 'YCS5UH', 'YCS5UH', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ADI NURROHMAN', nisn = 'YCS5UH', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003ac090ed'::uuid, 'Adinda Jasmine Nabilah', '2NZJ2C', '2NZJ2C', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Adinda Jasmine Nabilah', nisn = '2NZJ2C', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000036ccc23d'::uuid, 'ADINDA NURUL FATIMAH', 'DHXE24', 'DHXE24', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ADINDA NURUL FATIMAH', nisn = 'DHXE24', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000705f72c2'::uuid, 'ADISTI NILAM GITARI', 'KD2RMB', 'KD2RMB', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ADISTI NILAM GITARI', nisn = 'KD2RMB', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000024499601'::uuid, 'ADITYA NOVA SAPUTRA', 'Z78YVG', 'Z78YVG', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ADITYA NOVA SAPUTRA', nisn = 'Z78YVG', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000362001a6'::uuid, 'Adiyaksa Fathir Nugraha', '45T74F', '45T74F', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Adiyaksa Fathir Nugraha', nisn = '45T74F', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001be257cb'::uuid, 'Adzizd Haqim', '3MVS3W', '3MVS3W', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Adzizd Haqim', nisn = '3MVS3W', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000228c4521'::uuid, 'Adzmi Hanif Alfauzan', 'VGNGGN', 'VGNGGN', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Adzmi Hanif Alfauzan', nisn = 'VGNGGN', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002adaf8b9'::uuid, 'ADZRA NURRIHAA DATUL AISY NUGRAHA', '7R93YM', '7R93YM', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ADZRA NURRIHAA DATUL AISY NUGRAHA', nisn = '7R93YM', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005d4d9ba9'::uuid, 'Aghista Pratama Putra Ramadhan', '4Z4YHV', '4Z4YHV', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aghista Pratama Putra Ramadhan', nisn = '4Z4YHV', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000042ddb6f0'::uuid, 'Agung Wahyu Nugraha', 'D5PD7R', 'D5PD7R', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Agung Wahyu Nugraha', nisn = 'D5PD7R', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000444409e9'::uuid, 'Agus Mariono', 'HGBKFW', 'HGBKFW', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Agus Mariono', nisn = 'HGBKFW', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002dd0d2a6'::uuid, 'Agus Ramdan', 'QL6SY7', 'QL6SY7', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Agus Ramdan', nisn = 'QL6SY7', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000064b1216e'::uuid, 'Agustian', 'Q8BKQC', 'Q8BKQC', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Agustian', nisn = 'Q8BKQC', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000683e0f6'::uuid, 'Agustin Nuraeni', '8EYLEK', '8EYLEK', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Agustin Nuraeni', nisn = '8EYLEK', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000ca41311'::uuid, 'AHSYA PUTRI SYAROFFA', 'T7DVM9', 'T7DVM9', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'AHSYA PUTRI SYAROFFA', nisn = 'T7DVM9', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007936aaa5'::uuid, 'Aila Sabrina Zulfa', 'MM2GC9', 'MM2GC9', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aila Sabrina Zulfa', nisn = 'MM2GC9', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002f589362'::uuid, 'Aini Nur Utami', 'J383E3', 'J383E3', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aini Nur Utami', nisn = 'J383E3', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007f736417'::uuid, 'Aira Putri Andriani', 'EC792K', 'EC792K', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aira Putri Andriani', nisn = 'EC792K', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000060460004'::uuid, 'Aira Safira', '7Y5F6W', '7Y5F6W', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aira Safira', nisn = '7Y5F6W', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000025109c20'::uuid, 'AIRIN NOVA KIRANA', '9P45XP', '9P45XP', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'AIRIN NOVA KIRANA', nisn = '9P45XP', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002965f7a8'::uuid, 'Airlangga Reyfan Gani Putra', 'CD7LUG', 'CD7LUG', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Airlangga Reyfan Gani Putra', nisn = 'CD7LUG', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005e53f7c2'::uuid, 'Aisyah Mulyadi', 'E938QJ', 'E938QJ', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aisyah Mulyadi', nisn = 'E938QJ', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001f4f1e2f'::uuid, 'Aisyah Nur Arafah', '6TSR5Y', '6TSR5Y', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aisyah Nur Arafah', nisn = '6TSR5Y', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001729da29'::uuid, 'AKBAR AUNILLAH SOFYAN', 'L9LEWX', 'L9LEWX', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'AKBAR AUNILLAH SOFYAN', nisn = 'L9LEWX', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000336a6cfe'::uuid, 'AKBAR RIZKIA RIDWAN', 'L47WAG', 'L47WAG', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'AKBAR RIZKIA RIDWAN', nisn = 'L47WAG', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000550b2f2d'::uuid, 'Akeela Faiha Bakhita', 'XS4VDD', 'XS4VDD', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Akeela Faiha Bakhita', nisn = 'XS4VDD', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000028262e2c'::uuid, 'AKHMAD VIERMANSYAH', 'PGAJQM', 'PGAJQM', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'AKHMAD VIERMANSYAH', nisn = 'PGAJQM', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000293bf75a'::uuid, 'Akila Rahma Amelia', 'GDSZKQ', 'GDSZKQ', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Akila Rahma Amelia', nisn = 'GDSZKQ', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007a89d2cc'::uuid, 'Al -Gibran Muhammad Zacky', '34H26G', '34H26G', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Al -Gibran Muhammad Zacky', nisn = '34H26G', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002bffbf1b'::uuid, 'Al Febriansyah Septian', '3BY8V3', '3BY8V3', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Al Febriansyah Septian', nisn = '3BY8V3', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005598eed8'::uuid, 'ALDA RAINA SETIAWAN', 'GQZPKC', 'GQZPKC', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALDA RAINA SETIAWAN', nisn = 'GQZPKC', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006737a98e'::uuid, 'ALDEN ILHAM ARDHANI RUCHIYAT', '9FM69A', '9FM69A', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALDEN ILHAM ARDHANI RUCHIYAT', nisn = '9FM69A', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007c40e3ea'::uuid, 'Aleisya Nafadilla Rismawan', 'W8L9UA', 'W8L9UA', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aleisya Nafadilla Rismawan', nisn = 'W8L9UA', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000173510ae'::uuid, 'Alexa Dwivalera', '3S275N', '3S275N', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alexa Dwivalera', nisn = '3S275N', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000355671dc'::uuid, 'Alfadz Sidiq Revikansyah', 'JTDBAM', 'JTDBAM', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alfadz Sidiq Revikansyah', nisn = 'JTDBAM', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000497c6cca'::uuid, 'Ali Muhammad Hasan', 'XE46L7', 'XE46L7', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ali Muhammad Hasan', nisn = 'XE46L7', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000050e1f4a'::uuid, 'Alif Praditya Rachman', 'TQMBPX', 'TQMBPX', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alif Praditya Rachman', nisn = 'TQMBPX', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000dd555b6'::uuid, 'Alifa Dwinova Shaliha', '974CTA', '974CTA', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alifa Dwinova Shaliha', nisn = '974CTA', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000068c87656'::uuid, 'Alika Aira Lathif', 'LXMDKB', 'LXMDKB', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alika Aira Lathif', nisn = 'LXMDKB', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000062dddd30'::uuid, 'Alisa Nur Febiona', 'KRK9BM', 'KRK9BM', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alisa Nur Febiona', nisn = 'KRK9BM', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005e7001f9'::uuid, 'ALIYA FITARANI SUKMA DEWI', 'SYUFLL', 'SYUFLL', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALIYA FITARANI SUKMA DEWI', nisn = 'SYUFLL', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003eb3bd84'::uuid, 'ALIZA FARAH AZ- ZAHRA', 'L8DVJX', 'L8DVJX', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALIZA FARAH AZ- ZAHRA', nisn = 'L8DVJX', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b8ee8b5'::uuid, 'Allyshca Putri Haoikha', 'XU8TSU', 'XU8TSU', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Allyshca Putri Haoikha', nisn = 'XU8TSU', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000539b16d5'::uuid, 'Alma Desviana', 'P9JKSN', 'P9JKSN', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alma Desviana', nisn = 'P9JKSN', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007a803fc6'::uuid, 'Althaf Wafi Saeri', 'TL4EDE', 'TL4EDE', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Althaf Wafi Saeri', nisn = 'TL4EDE', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000076a83bde'::uuid, 'Althafirras Muhammad Zahran Suaris', 'EAMKVJ', 'EAMKVJ', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Althafirras Muhammad Zahran Suaris', nisn = 'EAMKVJ', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000623feb18'::uuid, 'ALTHAN MAHVIN DINARA', 'V74RMV', 'V74RMV', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALTHAN MAHVIN DINARA', nisn = 'V74RMV', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000758db5f7'::uuid, 'Alvian Dwi Hari Bhayangkara', 'EUAMUR', 'EUAMUR', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alvian Dwi Hari Bhayangkara', nisn = 'EUAMUR', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007be630d2'::uuid, 'ALVIE FAIZATY WARDAH', 'RVJQGZ', 'RVJQGZ', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALVIE FAIZATY WARDAH', nisn = 'RVJQGZ', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000114b9959'::uuid, 'Alvino', 'LAGZF5', 'LAGZF5', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alvino', nisn = 'LAGZF5', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000b884b78'::uuid, 'Alvino Aprilio', '2HPHYC', '2HPHYC', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Alvino Aprilio', nisn = '2HPHYC', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000019cb8d63'::uuid, 'ALYA ZAHRA FATIHA', '9Y4QLB', '9Y4QLB', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ALYA ZAHRA FATIHA', nisn = '9Y4QLB', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000ce50357'::uuid, 'Aminarti Astuti', 'MZ6UFS', 'MZ6UFS', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aminarti Astuti', nisn = 'MZ6UFS', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000bfd36ea'::uuid, 'Amirah Rihadatul Aisy Prilianti', 'PMNHGV', 'PMNHGV', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Amirah Rihadatul Aisy Prilianti', nisn = 'PMNHGV', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001257f02d'::uuid, 'Amna Itaqillah Radliyah', 'AFLXBT', 'AFLXBT', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Amna Itaqillah Radliyah', nisn = 'AFLXBT', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011afac64'::uuid, 'Anaguna Anaka', 'WZ8HLE', 'WZ8HLE', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anaguna Anaka', nisn = 'WZ8HLE', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005dff3698'::uuid, 'ANANDA CANTIKA NURAINI', '7T8586', '7T8586', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ANANDA CANTIKA NURAINI', nisn = '7T8586', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000061b6682e'::uuid, 'Ananda Raffa Eliyan', '73BKWP', '73BKWP', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ananda Raffa Eliyan', nisn = '73BKWP', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b1cc8d4'::uuid, 'Anang Fauzan', 'MPG2K9', 'MPG2K9', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anang Fauzan', nisn = 'MPG2K9', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004888dbc9'::uuid, 'Anargya Ozora Yonna', 'WNRG8S', 'WNRG8S', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anargya Ozora Yonna', nisn = 'WNRG8S', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002dc54259'::uuid, 'ANDARA PUTRI LIANA', '8UPFNR', '8UPFNR', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ANDARA PUTRI LIANA', nisn = '8UPFNR', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001d2bd6c1'::uuid, 'Andhyta Almeyra Anata', 'Z2LJ94', 'Z2LJ94', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Andhyta Almeyra Anata', nisn = 'Z2LJ94', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b326c89'::uuid, 'Angel Aprilia', 'HBGYUB', 'HBGYUB', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Angel Aprilia', nisn = 'HBGYUB', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000063480ce4'::uuid, 'Anggia Putri', 'NFCG8P', 'NFCG8P', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anggia Putri', nisn = 'NFCG8P', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007a49945a'::uuid, 'ANGGIT NUR OKTAVIA', 'DZBYJG', 'DZBYJG', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ANGGIT NUR OKTAVIA', nisn = 'DZBYJG', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006ec339b3'::uuid, 'Anira Putri Hidayat', 'UYK9FQ', 'UYK9FQ', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anira Putri Hidayat', nisn = 'UYK9FQ', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000064ec8d0d'::uuid, 'Anjani Lestari', 'LLHDTU', 'LLHDTU', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anjani Lestari', nisn = 'LLHDTU', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000456d541c'::uuid, 'ANNISA PUTRI AGUSTIN', 'ETM7XS', 'ETM7XS', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ANNISA PUTRI AGUSTIN', nisn = 'ETM7XS', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006683fcf5'::uuid, 'Annisa Putri Fahira', 'P83S2E', 'P83S2E', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Annisa Putri Fahira', nisn = 'P83S2E', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005f508cf8'::uuid, 'Anthony Christopher Abraham', '4YN9NF', '4YN9NF', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Anthony Christopher Abraham', nisn = '4YN9NF', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000230a8a1b'::uuid, 'APHRADITHA ZAHRA ARRAHMI', 'NXZPK6', 'NXZPK6', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'APHRADITHA ZAHRA ARRAHMI', nisn = 'NXZPK6', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000009fc62d6'::uuid, 'Arabilla Hafzhah Ramadhani', 'YVYCYL', 'YVYCYL', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arabilla Hafzhah Ramadhani', nisn = 'YVYCYL', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006f4d2bd6'::uuid, 'Arbhi Assyauqy Nurochman', 'Z2H53H', 'Z2H53H', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arbhi Assyauqy Nurochman', nisn = 'Z2H53H', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000047c3ab3a'::uuid, 'Ardelia Tirana Ariesta', 'ZHL862', 'ZHL862', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ardelia Tirana Ariesta', nisn = 'ZHL862', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000015eeecf6'::uuid, 'Ariq Mu`Afa Fauzan', 'ATG6SK', 'ATG6SK', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ariq Mu`Afa Fauzan', nisn = 'ATG6SK', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004f646991'::uuid, 'Aris Apriyanto', 'AC6DUF', 'AC6DUF', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aris Apriyanto', nisn = 'AC6DUF', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000039501eec'::uuid, 'ARIZKA AMALYA SYAHIDA', '8B77SE', '8B77SE', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ARIZKA AMALYA SYAHIDA', nisn = '8B77SE', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000025498a3c'::uuid, 'Arka Dwi Putra', 'LBH5GX', 'LBH5GX', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arka Dwi Putra', nisn = 'LBH5GX', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002ba4b418'::uuid, 'ARKAN RAIHAN AL BAIHAQI', 'LZAAJD', 'LZAAJD', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ARKAN RAIHAN AL BAIHAQI', nisn = 'LZAAJD', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005b16c57d'::uuid, 'Arlifa Putri Alsyani', '28BHT5', '28BHT5', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arlifa Putri Alsyani', nisn = '28BHT5', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000616e2f61'::uuid, 'Arman Mucthar', 'QKVDDK', 'QKVDDK', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arman Mucthar', nisn = 'QKVDDK', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000064764548'::uuid, 'Arriza Snada Tri Putra', 'YB9B8N', 'YB9B8N', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arriza Snada Tri Putra', nisn = 'YB9B8N', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000b520c4b'::uuid, 'ARVA PRATAMA NUZULUL MAULUDIN', 'GBK7SG', 'GBK7SG', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ARVA PRATAMA NUZULUL MAULUDIN', nisn = 'GBK7SG', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000067eb5ad5'::uuid, 'Arvika Oktaviani', 'KKVDAX', 'KKVDAX', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Arvika Oktaviani', nisn = 'KKVDAX', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000681f1515'::uuid, 'ARYA JANUAR PRASETYA', '3E5D59', '3E5D59', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ARYA JANUAR PRASETYA', nisn = '3E5D59', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006da65d99'::uuid, 'Ashabbel Pinera Tarma Putrina Wandi', 'PS9SSM', 'PS9SSM', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ashabbel Pinera Tarma Putrina Wandi', nisn = 'PS9SSM', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000000afe916'::uuid, 'Ashadiya Nazla Arkana', 'V58YN4', 'V58YN4', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ashadiya Nazla Arkana', nisn = 'V58YN4', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000064f021e7'::uuid, 'Ashil Hamidah', '3Q7GEN', '3Q7GEN', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ashil Hamidah', nisn = '3Q7GEN', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000192af861'::uuid, 'ASHVIN NU`MAN AWALUDIN', 'MD5FK4', 'MD5FK4', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ASHVIN NU`MAN AWALUDIN', nisn = 'MD5FK4', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b3ccb1d'::uuid, 'ASKANTARA RAJA AL- ABIYYU', 'H2QTRX', 'H2QTRX', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ASKANTARA RAJA AL- ABIYYU', nisn = 'H2QTRX', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000036c8f617'::uuid, 'Astri Aprilia', 'YD7D8Y', 'YD7D8Y', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Astri Aprilia', nisn = 'YD7D8Y', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001f129179'::uuid, 'ASYIFA KHOIRUNISA', 'E5RWC7', 'E5RWC7', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ASYIFA KHOIRUNISA', nisn = 'E5RWC7', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000062890903'::uuid, 'ASYIFA NUR FADILAH', 'V4VDYZ', 'V4VDYZ', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ASYIFA NUR FADILAH', nisn = 'V4VDYZ', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001a5f38d9'::uuid, 'Attila Pratama Hymara', '7NWZ63', '7NWZ63', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Attila Pratama Hymara', nisn = '7NWZ63', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002b3165da'::uuid, 'Aulia Azahra Anasya', 'NPRUEJ', 'NPRUEJ', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aulia Azahra Anasya', nisn = 'NPRUEJ', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000053a3dad2'::uuid, 'Aulia Gadis Hendiani', '33YN5B', '33YN5B', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aulia Gadis Hendiani', nisn = '33YN5B', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000764b80fd'::uuid, 'Aura Kirani Putri Mardiandi', '5RB7TU', '5RB7TU', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aura Kirani Putri Mardiandi', nisn = '5RB7TU', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007fe2d47e'::uuid, 'Aurel Alvira Rhonisha', 'QDYRUW', 'QDYRUW', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Aurel Alvira Rhonisha', nisn = 'QDYRUW', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b93c7e2'::uuid, 'AYESHA ISA RAMADHANI', '5JV68U', '5JV68U', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'AYESHA ISA RAMADHANI', nisn = '5JV68U', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003d29cf00'::uuid, 'Ayu Musyaropah', 'EUFCMP', 'EUFCMP', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ayu Musyaropah', nisn = 'EUFCMP', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b77ef3f'::uuid, 'Ayumi Kireina Aflah', '838ZQE', '838ZQE', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ayumi Kireina Aflah', nisn = '838ZQE', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ee5f061'::uuid, 'Azalea Maulina Suryadi', 'H3SNWB', 'H3SNWB', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azalea Maulina Suryadi', nisn = 'H3SNWB', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000049d13b1'::uuid, 'Azalia Quincy Ariesty', 'ZYGZUB', 'ZYGZUB', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azalia Quincy Ariesty', nisn = 'ZYGZUB', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004fa2d440'::uuid, 'Azalia Zahra Putri Mardani', '65YYRC', '65YYRC', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azalia Zahra Putri Mardani', nisn = '65YYRC', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000009b94137'::uuid, 'Azis Fadhiansyah', 'VK6M94', 'VK6M94', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azis Fadhiansyah', nisn = 'VK6M94', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002fb81d51'::uuid, 'Azis Ibrahim', 'HNJNUJ', 'HNJNUJ', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azis Ibrahim', nisn = 'HNJNUJ', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000022f27453'::uuid, 'Azkiya Dwiputri Nayla', 'Y5VRBM', 'Y5VRBM', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azkiya Dwiputri Nayla', nisn = 'Y5VRBM', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000057b8012d'::uuid, 'Azmy Nadila Permana', 'F6556C', 'F6556C', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azmy Nadila Permana', nisn = 'F6556C', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002913381b'::uuid, 'Azzahra Nursalwa Zaina Winardi', '3EACVW', '3EACVW', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azzahra Nursalwa Zaina Winardi', nisn = '3EACVW', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003890e97c'::uuid, 'Azzira Siti Aquenatyas', 'ND4JPX', 'ND4JPX', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Azzira Siti Aquenatyas', nisn = 'ND4JPX', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005fe58377'::uuid, 'Balqies Najla Putri Rahmani', '4D43MW', '4D43MW', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Balqies Najla Putri Rahmani', nisn = '4D43MW', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000029e017af'::uuid, 'Bebi Hafzah Aurelia', 'M6R8B2', 'M6R8B2', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Bebi Hafzah Aurelia', nisn = 'M6R8B2', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000066b9b86e'::uuid, 'BIANCA AURORA SHAHRANI ILHAM', '5HA8A9', '5HA8A9', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'BIANCA AURORA SHAHRANI ILHAM', nisn = '5HA8A9', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003234c3c3'::uuid, 'Bilal Tsaqif Prayoga', '7PL4K7', '7PL4K7', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Bilal Tsaqif Prayoga', nisn = '7PL4K7', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007e4ce61b'::uuid, 'Bintang Rizki Junior', 'PLPCUQ', 'PLPCUQ', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Bintang Rizki Junior', nisn = 'PLPCUQ', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b95246b'::uuid, 'BRAHMA PUTRA BAGAZ', 'KD96FU', 'KD96FU', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'BRAHMA PUTRA BAGAZ', nisn = 'KD96FU', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000fefccee'::uuid, 'Bunga Rahayu Ningsih', 'N7CQCJ', 'N7CQCJ', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Bunga Rahayu Ningsih', nisn = 'N7CQCJ', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007008b939'::uuid, 'Caesar Danish Safad Abqori', 'WQ7565', 'WQ7565', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Caesar Danish Safad Abqori', nisn = 'WQ7565', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002e1f3bd0'::uuid, 'Caesar Putra Pratama', 'XN4P8F', 'XN4P8F', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Caesar Putra Pratama', nisn = 'XN4P8F', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000036b77f27'::uuid, 'Cahyadi Putra', 'ZFZ5WG', 'ZFZ5WG', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Cahyadi Putra', nisn = 'ZFZ5WG', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000137180d9'::uuid, 'CALISTA CITRA CEMPAKA', 'EH7X3F', 'EH7X3F', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'CALISTA CITRA CEMPAKA', nisn = 'EH7X3F', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004e948e51'::uuid, 'Carissa Putri  Alnabira', '2UUHJ3', '2UUHJ3', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Carissa Putri  Alnabira', nisn = '2UUHJ3', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000358ee53b'::uuid, 'Chairul Zaiwa Raditia', 'H8VCSK', 'H8VCSK', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Chairul Zaiwa Raditia', nisn = 'H8VCSK', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000196c0ec3'::uuid, 'CHALIS KIRANA WINALDA', '26663B', '26663B', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'CHALIS KIRANA WINALDA', nisn = '26663B', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000034475c92'::uuid, 'CHANTIKA KIRANA PUTRI', 'DS4TGZ', 'DS4TGZ', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'CHANTIKA KIRANA PUTRI', nisn = 'DS4TGZ', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004deeda22'::uuid, 'Cherry Adzkiya Al Khanza', 'APC8N8', 'APC8N8', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Cherry Adzkiya Al Khanza', nisn = 'APC8N8', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000054e3579e'::uuid, 'Cindi Nur Aulia', 'CA2ZEQ', 'CA2ZEQ', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Cindi Nur Aulia', nisn = 'CA2ZEQ', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000028687204'::uuid, 'Cindy Rizkya Oktaviantri', 'H6ZYX7', 'H6ZYX7', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Cindy Rizkya Oktaviantri', nisn = 'H6ZYX7', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b55911c'::uuid, 'Citra Kharisma', 'HAC22V', 'HAC22V', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Citra Kharisma', nisn = 'HAC22V', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001adb021d'::uuid, 'Clara Aura Safitri', 'YDKDCL', 'YDKDCL', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Clara Aura Safitri', nisn = 'YDKDCL', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000129e3599'::uuid, 'Dafa Zalfany Rasydan', 'J5E3WU', 'J5E3WU', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dafa Zalfany Rasydan', nisn = 'J5E3WU', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000318cffde'::uuid, 'Daffa Faiz Fadhalah', 'C4MVAU', 'C4MVAU', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Daffa Faiz Fadhalah', nisn = 'C4MVAU', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000037f2a57b'::uuid, 'DAFFA RAMDHANI CAHYANA', 'TEHTZH', 'TEHTZH', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DAFFA RAMDHANI CAHYANA', nisn = 'TEHTZH', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000015001b4e'::uuid, 'Damar Wahyudi', 'HNYKAK', 'HNYKAK', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Damar Wahyudi', nisn = 'HNYKAK', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003cc4d978'::uuid, 'DAMIAN NOVRE VALIANT', '8C6B7X', '8C6B7X', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DAMIAN NOVRE VALIANT', nisn = '8C6B7X', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000043a2462e'::uuid, 'Danish Daffa Jamaludin Bekti', '4N2HK9', '4N2HK9', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Danish Daffa Jamaludin Bekti', nisn = '4N2HK9', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000030eed658'::uuid, 'DARRA ANUGRAH', '8X9TUB', '8X9TUB', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DARRA ANUGRAH', nisn = '8X9TUB', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000099f0a6c'::uuid, 'Davin Agra Ardiana Putra', 'VHAZZS', 'VHAZZS', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Davin Agra Ardiana Putra', nisn = 'VHAZZS', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003fd5cb3d'::uuid, 'Davina Harmalia Putri', '6USW5E', '6USW5E', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Davina Harmalia Putri', nisn = '6USW5E', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000349133b0'::uuid, 'Deandra Aditya Pratama', 'AWKSU7', 'AWKSU7', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Deandra Aditya Pratama', nisn = 'AWKSU7', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000045c99792'::uuid, 'DEANDRA NARAYANA ISMAIL', 'ERS9YD', 'ERS9YD', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DEANDRA NARAYANA ISMAIL', nisn = 'ERS9YD', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007fdab29f'::uuid, 'DEFA CANDRA', 'NGYDJW', 'NGYDJW', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DEFA CANDRA', nisn = 'NGYDJW', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000489403c7'::uuid, 'DELLA PUSPITA', 'EA6FZW', 'EA6FZW', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DELLA PUSPITA', nisn = 'EA6FZW', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000022b981b8'::uuid, 'Dena Taufik Nugraha', '5WEFPE', '5WEFPE', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dena Taufik Nugraha', nisn = '5WEFPE', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007f18cf1f'::uuid, 'DENDI NABIL FRIZZI', 'Z68DR9', 'Z68DR9', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DENDI NABIL FRIZZI', nisn = 'Z68DR9', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005b9e92e0'::uuid, 'Deni Iskandar', '3N6ZG8', '3N6ZG8', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Deni Iskandar', nisn = '3N6ZG8', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002c0e3b58'::uuid, 'Desfita Ramadhani', '2NLLK7', '2NLLK7', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Desfita Ramadhani', nisn = '2NLLK7', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000728d8ad8'::uuid, 'Deshifa Intan Guslianti', 'NUZ5BX', 'NUZ5BX', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Deshifa Intan Guslianti', nisn = 'NUZ5BX', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004ed408e2'::uuid, 'DESTI YANI', 'HALARV', 'HALARV', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DESTI YANI', nisn = 'HALARV', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002bb37138'::uuid, 'Destian Darmawan', '3GVUMB', '3GVUMB', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Destian Darmawan', nisn = '3GVUMB', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005a33c8db'::uuid, 'Devalsa Aldina Shafputri', 'XEDWWL', 'XEDWWL', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Devalsa Aldina Shafputri', nisn = 'XEDWWL', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000414b3619'::uuid, 'Devani Anggraeni', 'FBZMKE', 'FBZMKE', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Devani Anggraeni', nisn = 'FBZMKE', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006f8e76c7'::uuid, 'Dhafin Fauzan Dafandryan', 'R823WG', 'R823WG', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dhafin Fauzan Dafandryan', nisn = 'R823WG', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001dc40af5'::uuid, 'Dhiaulhaq Rafif', 'Q7WWWL', 'Q7WWWL', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dhiaulhaq Rafif', nisn = 'Q7WWWL', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000013718570'::uuid, 'Dimas Cahyo Nugroho', 'CKXNT6', 'CKXNT6', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dimas Cahyo Nugroho', nisn = 'CKXNT6', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000472d784'::uuid, 'Dimas Saputra', 'PL8T5Q', 'PL8T5Q', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dimas Saputra', nisn = 'PL8T5Q', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005bd061dc'::uuid, 'DINARA ZAFINA MEIDYA', 'WDJ562', 'WDJ562', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DINARA ZAFINA MEIDYA', nisn = 'WDJ562', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003c8c64eb'::uuid, 'Dinda Ayudia Putri', 'X9FVKU', 'X9FVKU', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dinda Ayudia Putri', nisn = 'X9FVKU', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000032c5899c'::uuid, 'Dinda Priadi', 'XGVWPL', 'XGVWPL', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dinda Priadi', nisn = 'XGVWPL', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000105f2349'::uuid, 'Dinda Yunita Nurjanah', 'NKXTES', 'NKXTES', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dinda Yunita Nurjanah', nisn = 'NKXTES', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000403b8bd6'::uuid, 'Dira Mustika Wardany', 'M7CS22', 'M7CS22', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dira Mustika Wardany', nisn = 'M7CS22', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001348efed'::uuid, 'Disya Rahil Anjani', 'AHYMQS', 'AHYMQS', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Disya Rahil Anjani', nisn = 'AHYMQS', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000556493b5'::uuid, 'DJULFA SYIFA ROYANI', '9J823M', '9J823M', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DJULFA SYIFA ROYANI', nisn = '9J823M', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005d42ddfe'::uuid, 'Dominicus Raymond Jose Meidianto', 'T3EY83', 'T3EY83', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dominicus Raymond Jose Meidianto', nisn = 'T3EY83', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000544c202c'::uuid, 'Dzaikra Danish Alano', 'SBLRMT', 'SBLRMT', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dzaikra Danish Alano', nisn = 'SBLRMT', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000072ae1ae2'::uuid, 'DZAKI DANISWARA', '8JUJJQ', '8JUJJQ', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DZAKI DANISWARA', nisn = '8JUJJQ', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001f4acb3c'::uuid, 'Dzakia Ula Nur Athaya', '2GB75W', '2GB75W', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dzakia Ula Nur Athaya', nisn = '2GB75W', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007418ccb5'::uuid, 'DZIKRA RIFQI RADIFAN', 'BRPZ6A', 'BRPZ6A', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'DZIKRA RIFQI RADIFAN', nisn = 'BRPZ6A', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007619f994'::uuid, 'Dzikri Syahrul Maulid', 'FTB8T4', 'FTB8T4', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Dzikri Syahrul Maulid', nisn = 'FTB8T4', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005e09b3ba'::uuid, 'EILANA HASYA AQILA', 'UM6U8W', 'UM6U8W', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'EILANA HASYA AQILA', nisn = 'UM6U8W', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002cfea972'::uuid, 'Eka Novita Putri Agustin', 'ECYUT8', 'ECYUT8', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Eka Novita Putri Agustin', nisn = 'ECYUT8', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000006f30570'::uuid, 'ELIZA APRILIANI', '3GF2QQ', '3GF2QQ', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ELIZA APRILIANI', nisn = '3GF2QQ', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003585b0af'::uuid, 'Emila Zahira', 'C58PSJ', 'C58PSJ', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Emila Zahira', nisn = 'C58PSJ', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000380e3899'::uuid, 'Endra Adhibrata', 'VN36F4', 'VN36F4', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Endra Adhibrata', nisn = 'VN36F4', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000076454178'::uuid, 'Erika Ratu Purnama', '9LNBPA', '9LNBPA', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Erika Ratu Purnama', nisn = '9LNBPA', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000058d2c058'::uuid, 'Evan Akhdan Alqashid', 'VZLQZ9', 'VZLQZ9', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Evan Akhdan Alqashid', nisn = 'VZLQZ9', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000034295c67'::uuid, 'Fadhilah Nurizqi', 'UTX5WR', 'UTX5WR', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fadhilah Nurizqi', nisn = 'UTX5WR', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003d03a26a'::uuid, 'Fadiyya Marshakayla Danish', 'P2LLZ2', 'P2LLZ2', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fadiyya Marshakayla Danish', nisn = 'P2LLZ2', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000043e655e2'::uuid, 'FAHAM ADIGUNA MARZUKI', 'LJYTWL', 'LJYTWL', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FAHAM ADIGUNA MARZUKI', nisn = 'LJYTWL', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005f0292d2'::uuid, 'Faiq Alghifari Rachman', 'K47U3J', 'K47U3J', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Faiq Alghifari Rachman', nisn = 'K47U3J', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004ea3c6e5'::uuid, 'Fairus Adnan Al Ghanny', '6N27XP', '6N27XP', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fairus Adnan Al Ghanny', nisn = '6N27XP', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000077dca1e0'::uuid, 'Faisal Ridho Salman', 'ZFGNV3', 'ZFGNV3', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Faisal Ridho Salman', nisn = 'ZFGNV3', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000601badd9'::uuid, 'Faiz Raihan Husein', 'MCPBRS', 'MCPBRS', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Faiz Raihan Husein', nisn = 'MCPBRS', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000472be7bd'::uuid, 'Fajar Ardiansyah', '8G93WA', '8G93WA', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fajar Ardiansyah', nisn = '8G93WA', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005b45598e'::uuid, 'Fakhry Rafa Alvaro', 'EHXMS9', 'EHXMS9', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fakhry Rafa Alvaro', nisn = 'EHXMS9', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000049d3cf98'::uuid, 'Fania Hanifa Fauzia', 'ZQ6TBU', 'ZQ6TBU', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fania Hanifa Fauzia', nisn = 'ZQ6TBU', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004660cb82'::uuid, 'Farah Meida Putri', 'PZFH5W', 'PZFH5W', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Farah Meida Putri', nisn = 'PZFH5W', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006aadbfe9'::uuid, 'FARANDZOLLA DAVRIANANDA ALVINO LUWIA', '9DFZNV', '9DFZNV', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FARANDZOLLA DAVRIANANDA ALVINO LUWIA', nisn = '9DFZNV', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001e1e40bf'::uuid, 'Farel Putra Wildani Sukma', 'CH4JPD', 'CH4JPD', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Farel Putra Wildani Sukma', nisn = 'CH4JPD', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001e34053c'::uuid, 'FARHAN HAFIZ RAMADANI', 'RPUNTQ', 'RPUNTQ', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FARHAN HAFIZ RAMADANI', nisn = 'RPUNTQ', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006062da8d'::uuid, 'FARHAN NUR HAKIM', 'VQQ9GG', 'VQQ9GG', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FARHAN NUR HAKIM', nisn = 'VQQ9GG', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002cfbbab0'::uuid, 'Farid Fathuddin Ali', 'X87733', 'X87733', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Farid Fathuddin Ali', nisn = 'X87733', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001c3070d7'::uuid, 'Faris Dawlah Nashir', '7N8LTP', '7N8LTP', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Faris Dawlah Nashir', nisn = '7N8LTP', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000074d3898e'::uuid, 'FARIS IGJAYA SOMANTRI', '959Z89', '959Z89', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FARIS IGJAYA SOMANTRI', nisn = '959Z89', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003918e50f'::uuid, 'Farishta Chandhani Risyaputri', 'ZD9HMS', 'ZD9HMS', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Farishta Chandhani Risyaputri', nisn = 'ZD9HMS', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000050dd65db'::uuid, 'Farisya Maishara Putri', 'CQFYDX', 'CQFYDX', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Farisya Maishara Putri', nisn = 'CQFYDX', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000579ca8e0'::uuid, 'Farlan Ferdyana Billy', 'LQQGBW', 'LQQGBW', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Farlan Ferdyana Billy', nisn = 'LQQGBW', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005dad3556'::uuid, 'Fathan Putra Al-Ghifari', '22EJRS', '22EJRS', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fathan Putra Al-Ghifari', nisn = '22EJRS', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004c13b832'::uuid, 'Fathiya Aulia Nisa', '3F3RMY', '3F3RMY', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fathiya Aulia Nisa', nisn = '3F3RMY', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b618a6d'::uuid, 'Fatimah Rahma Tsaniah', 'ZJ3M92', 'ZJ3M92', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fatimah Rahma Tsaniah', nisn = 'ZJ3M92', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002d77638d'::uuid, 'FAUZAN SYAFRI JUNIAN', 'BLK5YH', 'BLK5YH', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FAUZAN SYAFRI JUNIAN', nisn = 'BLK5YH', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000205091d2'::uuid, 'Fawwaz Aqbar Ramadhan', 'NYA789', 'NYA789', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fawwaz Aqbar Ramadhan', nisn = 'NYA789', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003f872c0c'::uuid, 'Fazar Risdan Hidayat', 'HHSULF', 'HHSULF', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fazar Risdan Hidayat', nisn = 'HHSULF', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003057cda0'::uuid, 'Fazri Maulana Pratama', 'G79K7E', 'G79K7E', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fazri Maulana Pratama', nisn = 'G79K7E', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b805e8f'::uuid, 'Fera Syakira Abianka', 'YN3QK9', 'YN3QK9', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fera Syakira Abianka', nisn = 'YN3QK9', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005ec6f0d4'::uuid, 'Ferdinan Kinan Gumilar', '9RJAJV', '9RJAJV', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ferdinan Kinan Gumilar', nisn = '9RJAJV', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000070681bb4'::uuid, 'Firli Atmanegara', 'M8MK3F', 'M8MK3F', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Firli Atmanegara', nisn = 'M8MK3F', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005b638fb5'::uuid, 'FIRLY AULIA PUTERI', 'WLXJX6', 'WLXJX6', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FIRLY AULIA PUTERI', nisn = 'WLXJX6', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000075212cf'::uuid, 'Firyal As Sakha Alma', 'T2WW2U', 'T2WW2U', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Firyal As Sakha Alma', nisn = 'T2WW2U', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003069275b'::uuid, 'Firzy Aufa Zahran', '2EUWMM', '2EUWMM', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Firzy Aufa Zahran', nisn = '2EUWMM', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000005ef8ec8'::uuid, 'Fitra Nurul Zahra', 'YH4GZP', 'YH4GZP', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fitra Nurul Zahra', nisn = 'YH4GZP', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000067a417d4'::uuid, 'FITRA RAMADAN SULAEMAN', '8BL9BG', '8BL9BG', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'FITRA RAMADAN SULAEMAN', nisn = '8BL9BG', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000166e758f'::uuid, 'Fitrianisa', 'KYNXAJ', 'KYNXAJ', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Fitrianisa', nisn = 'KYNXAJ', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003c073d77'::uuid, 'Freshya Azimil Hermawan', 'WSD8BY', 'WSD8BY', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Freshya Azimil Hermawan', nisn = 'WSD8BY', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000059f002a1'::uuid, 'Frida Khairunisa', '5BX3JQ', '5BX3JQ', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Frida Khairunisa', nisn = '5BX3JQ', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b7ee4dd'::uuid, 'Frishyla Afrilia Putri', 'RMSR3L', 'RMSR3L', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Frishyla Afrilia Putri', nisn = 'RMSR3L', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000060dba7e2'::uuid, 'GADIZA RUBY PAHAILLA', '6SVCQY', '6SVCQY', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'GADIZA RUBY PAHAILLA', nisn = '6SVCQY', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000008df3543'::uuid, 'Galang Rambu Ramadhani', 'GDYFNW', 'GDYFNW', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Galang Rambu Ramadhani', nisn = 'GDYFNW', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ba57564'::uuid, 'GALUH SINAR SULAEMAN', 'Q8KS7T', 'Q8KS7T', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'GALUH SINAR SULAEMAN', nisn = 'Q8KS7T', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005d9970c2'::uuid, 'Gaysani Deska Badzlina', '8R2JCC', '8R2JCC', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gaysani Deska Badzlina', nisn = '8R2JCC', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000067643a7a'::uuid, 'Geraldi Marthin', 'KZMYLG', 'KZMYLG', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Geraldi Marthin', nisn = 'KZMYLG', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000071d61799'::uuid, 'Gery Putra Lesmana', 'X7Q8CF', 'X7Q8CF', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gery Putra Lesmana', nisn = 'X7Q8CF', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003144dd76'::uuid, 'GHASELLA SHEZYLYA INDY', 'VN3C75', 'VN3C75', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'GHASELLA SHEZYLYA INDY', nisn = 'VN3C75', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b4258ff'::uuid, 'Gherin Naira Putri', 'WCRXWV', 'WCRXWV', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gherin Naira Putri', nisn = 'WCRXWV', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000041c2b06a'::uuid, 'Gibran Alfa Rezqi', 'DWEBND', 'DWEBND', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gibran Alfa Rezqi', nisn = 'DWEBND', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000012d4acc5'::uuid, 'Gifa Arsy Shaleha', 'URYHK4', 'URYHK4', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gifa Arsy Shaleha', nisn = 'URYHK4', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006e4dc2dd'::uuid, 'Gilang Dwi Pratama', 'BQJ9MB', 'BQJ9MB', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gilang Dwi Pratama', nisn = 'BQJ9MB', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005844d80e'::uuid, 'Gizha Malca Callysta', 'RBTYE2', 'RBTYE2', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gizha Malca Callysta', nisn = 'RBTYE2', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004bf4a48d'::uuid, 'Gladys Kirana Cloudya', '3UK3F9', '3UK3F9', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Gladys Kirana Cloudya', nisn = '3UK3F9', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000040b420c1'::uuid, 'Habib Rizalni', 'GJ6XN8', 'GJ6XN8', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Habib Rizalni', nisn = 'GJ6XN8', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000040f25fa1'::uuid, 'Habil Ferdinan', 'PBANZL', 'PBANZL', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Habil Ferdinan', nisn = 'PBANZL', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001f1f1786'::uuid, 'Hadi Gunadi', 'QNSPKG', 'QNSPKG', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Hadi Gunadi', nisn = 'QNSPKG', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000390b709c'::uuid, 'HAECKAL ARDIANSYAH', '3RT4LY', '3RT4LY', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'HAECKAL ARDIANSYAH', nisn = '3RT4LY', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004b79d156'::uuid, 'Hafiz Maulana', 'YBFBLA', 'YBFBLA', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Hafiz Maulana', nisn = 'YBFBLA', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ca048ec'::uuid, 'Haidar Hero Starovian', 'V3RA5E', 'V3RA5E', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Haidar Hero Starovian', nisn = 'V3RA5E', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000f44bd55'::uuid, 'HAKIKI KUSTIAWAN NURHAKIM', '5KYR5K', '5KYR5K', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'HAKIKI KUSTIAWAN NURHAKIM', nisn = '5KYR5K', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004476928b'::uuid, 'Halid Akbar Almakky', 'M6DMA4', 'M6DMA4', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Halid Akbar Almakky', nisn = 'M6DMA4', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000066768039'::uuid, 'Halwa Azzahra Purnama', '5GGG38', '5GGG38', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Halwa Azzahra Purnama', nisn = '5GGG38', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b1b7daa'::uuid, 'HAMDAN MIZWAR', 'YR2SAM', 'YR2SAM', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'HAMDAN MIZWAR', nisn = 'YR2SAM', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003915af1f'::uuid, 'Hanifa Qurrota A''Ini', 'KSL7ZV', 'KSL7ZV', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Hanifa Qurrota A''Ini', nisn = 'KSL7ZV', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000002ea09d0'::uuid, 'Hanifah Wilia Putri', 'Q2FG53', 'Q2FG53', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Hanifah Wilia Putri', nisn = 'Q2FG53', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005f08c366'::uuid, 'Haris Abdillah', 'QCT8LL', 'QCT8LL', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Haris Abdillah', nisn = 'QCT8LL', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000013d8f2dc'::uuid, 'Haura Zafira Asiyah', 'QJUKNS', 'QJUKNS', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Haura Zafira Asiyah', nisn = 'QJUKNS', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000406af377'::uuid, 'Hermawan Ade Faozi', 'QREDAH', 'QREDAH', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Hermawan Ade Faozi', nisn = 'QREDAH', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000051072f18'::uuid, 'Hilal Albin', 'AKRVTN', 'AKRVTN', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Hilal Albin', nisn = 'AKRVTN', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000028fa4f5d'::uuid, 'Humam Zaki Hammani', 'NEZBXF', 'NEZBXF', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Humam Zaki Hammani', nisn = 'NEZBXF', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007cf50917'::uuid, 'I`Zaz Elvarretta Tiffany', '3FJ7L3', '3FJ7L3', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'I`Zaz Elvarretta Tiffany', nisn = '3FJ7L3', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000e1f025c'::uuid, 'Ibrahim Reza Pratama', 'GAMUJ4', 'GAMUJ4', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ibrahim Reza Pratama', nisn = 'GAMUJ4', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000665b968'::uuid, 'Ikbal Nazrul Nugraha', 'J83W5K', 'J83W5K', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ikbal Nazrul Nugraha', nisn = 'J83W5K', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001e4f5104'::uuid, 'IKHSAN REZKY RAMDHANI', 'TDEJ43', 'TDEJ43', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'IKHSAN REZKY RAMDHANI', nisn = 'TDEJ43', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000018a5a7c4'::uuid, 'Ikram Rizki Fadillah', '2PWLQR', '2PWLQR', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ikram Rizki Fadillah', nisn = '2PWLQR', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004c1c599f'::uuid, 'Ilham Maulana Al Rasyid', '8UNYAJ', '8UNYAJ', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ilham Maulana Al Rasyid', nisn = '8UNYAJ', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000296e838e'::uuid, 'Indi Shulhania Nurul Kamila', '6R54FM', '6R54FM', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Indi Shulhania Nurul Kamila', nisn = '6R54FM', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006d7d905a'::uuid, 'Ine Fitriani', '3BPENT', '3BPENT', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ine Fitriani', nisn = '3BPENT', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000028b5fae9'::uuid, 'Ines Dwi Oktaviani', 'WFS2TM', 'WFS2TM', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ines Dwi Oktaviani', nisn = 'WFS2TM', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000031f9d7c3'::uuid, 'INTAN LAURA SASTRANAGARA', 'SNJBT4', 'SNJBT4', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'INTAN LAURA SASTRANAGARA', nisn = 'SNJBT4', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000799d8250'::uuid, 'IQLIMA AZKA AZAHRA', 'Q5U85N', 'Q5U85N', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'IQLIMA AZKA AZAHRA', nisn = 'Q5U85N', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000470b64e7'::uuid, 'Iren Nindi Yani', 'FTWWL5', 'FTWWL5', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Iren Nindi Yani', nisn = 'FTWWL5', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000368d38d9'::uuid, 'Irsyad Ahmad Farid', 'UZJU4M', 'UZJU4M', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Irsyad Ahmad Farid', nisn = 'UZJU4M', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003c007549'::uuid, 'Irwan Ridwansyah', 'W6PMNK', 'W6PMNK', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Irwan Ridwansyah', nisn = 'W6PMNK', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006663a9cb'::uuid, 'Ismail Jabbar', 'W9YSNW', 'W9YSNW', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ismail Jabbar', nisn = 'W9YSNW', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004ccebfaa'::uuid, 'JABAR HERDANA PRAYATA', 'SHPHYR', 'SHPHYR', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JABAR HERDANA PRAYATA', nisn = 'SHPHYR', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007e53b11d'::uuid, 'Jakana Rasa Sulaeman', 'GXRW4K', 'GXRW4K', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Jakana Rasa Sulaeman', nisn = 'GXRW4K', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000025f246b9'::uuid, 'JASMINE KHALISHAH FRIANNY', 'TYPSJ9', 'TYPSJ9', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JASMINE KHALISHAH FRIANNY', nisn = 'TYPSJ9', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000720611d2'::uuid, 'Jehan Nadiad', 'SQUXTQ', 'SQUXTQ', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Jehan Nadiad', nisn = 'SQUXTQ', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004b96604d'::uuid, 'Jesicca Meisya Sechan', 'GL2JU5', 'GL2JU5', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Jesicca Meisya Sechan', nisn = 'GL2JU5', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002a9fd37a'::uuid, 'Jessica Queensha Nindhitya', 'AP3WSJ', 'AP3WSJ', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Jessica Queensha Nindhitya', nisn = 'AP3WSJ', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000067c0c06f'::uuid, 'Jhenar Iliana Abbas', 'MELUQQ', 'MELUQQ', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Jhenar Iliana Abbas', nisn = 'MELUQQ', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000167992a3'::uuid, 'JIHAN AULIA PUTRI', 'VQA5HL', 'VQA5HL', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JIHAN AULIA PUTRI', nisn = 'VQA5HL', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000052370795'::uuid, 'JOVITA ATHA HAURA', 'N83SH9', 'N83SH9', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JOVITA ATHA HAURA', nisn = 'N83SH9', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000685ba9d2'::uuid, 'JUANDA ALMER YUSUF NUGRAHA', 'ERXJZ9', 'ERXJZ9', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JUANDA ALMER YUSUF NUGRAHA', nisn = 'ERXJZ9', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000067250e9f'::uuid, 'JUANITA AZ-ZAHRA', 'C5WEAR', 'C5WEAR', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JUANITA AZ-ZAHRA', nisn = 'C5WEAR', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006eb2563a'::uuid, 'JULIA RAHMA PUTRI', '5Y39MM', '5Y39MM', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'JULIA RAHMA PUTRI', nisn = '5Y39MM', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000396896b4'::uuid, 'Juwita Aprilia', 'P87443', 'P87443', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Juwita Aprilia', nisn = 'P87443', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000286cd244'::uuid, 'Kahil Alaik', '2UCDYA', '2UCDYA', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kahil Alaik', nisn = '2UCDYA', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011504598'::uuid, 'Kai Higuain Rachmana', 'WRFJ92', 'WRFJ92', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kai Higuain Rachmana', nisn = 'WRFJ92', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005bddcda3'::uuid, 'Kalia Leta Al Gumaisha', 'L7RE7L', 'L7RE7L', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kalia Leta Al Gumaisha', nisn = 'L7RE7L', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000009d38477'::uuid, 'KARISA DWI LAYLA PUTRI', 'LNMNNR', 'LNMNNR', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KARISA DWI LAYLA PUTRI', nisn = 'LNMNNR', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005c218d11'::uuid, 'Kayla Syakira', 'NXYHHN', 'NXYHHN', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kayla Syakira', nisn = 'NXYHHN', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b87a626'::uuid, 'Kayyisa Fiqha Fuqoha', '2F8MFG', '2F8MFG', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kayyisa Fiqha Fuqoha', nisn = '2F8MFG', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000035c4c895'::uuid, 'Keisya Auranaz Sabhina', 'DCWSMW', 'DCWSMW', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Keisya Auranaz Sabhina', nisn = 'DCWSMW', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000231711e8'::uuid, 'Keisya Zahra Putri', 'MKPNFR', 'MKPNFR', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Keisya Zahra Putri', nisn = 'MKPNFR', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b6149fb'::uuid, 'KEKEY KEINAN PRATAMA PUTRA', 'HPNHNA', 'HPNHNA', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KEKEY KEINAN PRATAMA PUTRA', nisn = 'HPNHNA', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000019d28117'::uuid, 'Kemal Azka Alzaki', 'ZT4CZX', 'ZT4CZX', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kemal Azka Alzaki', nisn = 'ZT4CZX', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002aabcf1e'::uuid, 'Kenatra Teby Azka Liana', 'CFT4KV', 'CFT4KV', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kenatra Teby Azka Liana', nisn = 'CFT4KV', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004ab8c03d'::uuid, 'KEYLA AULIA PUTRI', 'EFPTJX', 'EFPTJX', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KEYLA AULIA PUTRI', nisn = 'EFPTJX', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006d73b575'::uuid, 'KEYLA FELLICIA REGINA PUTRI', 'S5G8CK', 'S5G8CK', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KEYLA FELLICIA REGINA PUTRI', nisn = 'S5G8CK', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000027db28cf'::uuid, 'KEYSHA AURELIA RAMADHANI', 'M5ZGM7', 'M5ZGM7', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KEYSHA AURELIA RAMADHANI', nisn = 'M5ZGM7', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003f2a774c'::uuid, 'Keysha Oktavia', 'DJ8DD6', 'DJ8DD6', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Keysha Oktavia', nisn = 'DJ8DD6', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000073dafc0e'::uuid, 'Keyza Putri Anastasya', 'TWY4VZ', 'TWY4VZ', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Keyza Putri Anastasya', nisn = 'TWY4VZ', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006c498d43'::uuid, 'Khaikal Reva Putra Heryawan', 'R4SVJ8', 'R4SVJ8', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Khaikal Reva Putra Heryawan', nisn = 'R4SVJ8', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007139b3c3'::uuid, 'Khalifah Qinanti', 'N89RM7', 'N89RM7', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Khalifah Qinanti', nisn = 'N89RM7', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000072a7b35'::uuid, 'Khalisya Nida Muthaqiyah Anwar', '3CNHWH', '3CNHWH', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Khalisya Nida Muthaqiyah Anwar', nisn = '3CNHWH', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000b39e96d'::uuid, 'Khanza Farras Firdaus', '8TXEMA', '8TXEMA', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Khanza Farras Firdaus', nisn = '8TXEMA', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002ad7a9c3'::uuid, 'Kiani Ivana Despantri', 'DWBEUL', 'DWBEUL', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kiani Ivana Despantri', nisn = 'DWBEUL', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000344df82a'::uuid, 'Kiki Rahayu', 'Z2T7N9', 'Z2T7N9', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kiki Rahayu', nisn = 'Z2T7N9', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000d99b713'::uuid, 'Kirana Galuh Inckany Ekaputri', 'UEV8J5', 'UEV8J5', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Kirana Galuh Inckany Ekaputri', nisn = 'UEV8J5', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007f6a3ec2'::uuid, 'KIREY PUTRI GIVARA', 'DFL98W', 'DFL98W', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KIREY PUTRI GIVARA', nisn = 'DFL98W', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000345e8c81'::uuid, 'KISKA AINUNNISA BERLIANA', 'BR5RR6', 'BR5RR6', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'KISKA AINUNNISA BERLIANA', nisn = 'BR5RR6', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000039cd5dd'::uuid, 'Laila Cikal', 'DWY966', 'DWY966', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Laila Cikal', nisn = 'DWY966', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005c92e07e'::uuid, 'Laila Nafilata Yahya', 'R2ZKXU', 'R2ZKXU', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Laila Nafilata Yahya', nisn = 'R2ZKXU', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000061da890f'::uuid, 'Laisya Nurwidian', 'ZT86EN', 'ZT86EN', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Laisya Nurwidian', nisn = 'ZT86EN', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003fc4c8b7'::uuid, 'Lakeisha Sadina Kamila', 'UWPVNM', 'UWPVNM', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Lakeisha Sadina Kamila', nisn = 'UWPVNM', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003745c18c'::uuid, 'Latifa Aulia Zahra', 'QMFL3M', 'QMFL3M', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Latifa Aulia Zahra', nisn = 'QMFL3M', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000056673402'::uuid, 'Lingga Putra Radya Nugraha', 'FTCM2L', 'FTCM2L', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Lingga Putra Radya Nugraha', nisn = 'FTCM2L', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007ad0e19d'::uuid, 'Lyonel Dwijuniarto', 'K7D5HX', 'K7D5HX', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Lyonel Dwijuniarto', nisn = 'K7D5HX', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000382dbbe6'::uuid, 'M Nazril Agustian Ramdani', '4CLX72', '4CLX72', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'M Nazril Agustian Ramdani', nisn = '4CLX72', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000376bce34'::uuid, 'Maharani Diandra Putri Larassaty', '34TEPZ', '34TEPZ', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Maharani Diandra Putri Larassaty', nisn = '34TEPZ', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006b02e410'::uuid, 'MARSA NUR SAFIRA', 'BGDL3F', 'BGDL3F', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MARSA NUR SAFIRA', nisn = 'BGDL3F', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001809722d'::uuid, 'Marsya Dwi Nuraini', 'UJUNQF', 'UJUNQF', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Marsya Dwi Nuraini', nisn = 'UJUNQF', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001f8fc9ff'::uuid, 'Marvakayla Trimusyafada', 'DMNWV3', 'DMNWV3', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Marvakayla Trimusyafada', nisn = 'DMNWV3', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004dcd0091'::uuid, 'MARVEL RENALDI', '2S2EE2', '2S2EE2', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MARVEL RENALDI', nisn = '2S2EE2', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000439e62c0'::uuid, 'Marwa Alya Sukainah', 'PKFYLN', 'PKFYLN', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Marwa Alya Sukainah', nisn = 'PKFYLN', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000265bebc1'::uuid, 'MAULANA RIFA', 'JEJD5Q', 'JEJD5Q', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MAULANA RIFA', nisn = 'JEJD5Q', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007e495061'::uuid, 'Maulida Dafi Utami', 'TVATX2', 'TVATX2', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Maulida Dafi Utami', nisn = 'TVATX2', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000cd9aa46'::uuid, 'MAYASARI NUR AULIA', 'C5GHWZ', 'C5GHWZ', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MAYASARI NUR AULIA', nisn = 'C5GHWZ', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004b61a453'::uuid, 'Mega Elfarinie', '757UN5', '757UN5', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mega Elfarinie', nisn = '757UN5', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000010914c58'::uuid, 'Mega Putri Arvilliany', 'Z6HCFW', 'Z6HCFW', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mega Putri Arvilliany', nisn = 'Z6HCFW', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003a7373df'::uuid, 'Meisya Tri Khaerunissa', 'WYAKQ6', 'WYAKQ6', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Meisya Tri Khaerunissa', nisn = 'WYAKQ6', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003738a801'::uuid, 'Meitha Putri Alissa', '8BZY4Z', '8BZY4Z', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Meitha Putri Alissa', nisn = '8BZY4Z', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004e616687'::uuid, 'MEYLANI NURULJANAH', 'E2M876', 'E2M876', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MEYLANI NURULJANAH', nisn = 'E2M876', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000027a0b931'::uuid, 'MEYSA ISWARA', 'S3DF5R', 'S3DF5R', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MEYSA ISWARA', nisn = 'S3DF5R', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004c6ac510'::uuid, 'Meysha Stefanova', 'GS822L', 'GS822L', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Meysha Stefanova', nisn = 'GS822L', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000120198f5'::uuid, 'MITHA CHAERUNNISA', 'AU64K4', 'AU64K4', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MITHA CHAERUNNISA', nisn = 'AU64K4', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000038c4a16f'::uuid, 'Moc Fachri Nurohman', '6FAPCC', '6FAPCC', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Moc Fachri Nurohman', nisn = '6FAPCC', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003eb181f4'::uuid, 'Mochamad Azzam Zafir Putranto', 'QHQLCM', 'QHQLCM', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mochamad Azzam Zafir Putranto', nisn = 'QHQLCM', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000057f54123'::uuid, 'MOCHAMAD RAZQHA SEVHA RAMADHAN', 'MTH3LG', 'MTH3LG', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MOCHAMAD RAZQHA SEVHA RAMADHAN', nisn = 'MTH3LG', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002df8ec79'::uuid, 'Mochamad Rizky Ryansyah', 'QHPJ4Z', 'QHPJ4Z', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mochamad Rizky Ryansyah', nisn = 'QHPJ4Z', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000f003d73'::uuid, 'Mochammad Fasha Mauludi', 'S5FGCC', 'S5FGCC', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mochammad Fasha Mauludi', nisn = 'S5FGCC', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007d12e464'::uuid, 'Mochammad Rhayhan Alfahrezi Dwiputra', 'TU5RCQ', 'TU5RCQ', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mochammad Rhayhan Alfahrezi Dwiputra', nisn = 'TU5RCQ', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000662185ff'::uuid, 'Mochammad Rizki Zoe Raditya', 'W4AKM7', 'W4AKM7', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mochammad Rizki Zoe Raditya', nisn = 'W4AKM7', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000040ce0ad8'::uuid, 'MOCHAMMAD RIZQI ABU NAHWI MUTAQIN', 'TGGM54', 'TGGM54', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MOCHAMMAD RIZQI ABU NAHWI MUTAQIN', nisn = 'TGGM54', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000040d51d04'::uuid, 'Monica Ristya Chandra', '5WDYZW', '5WDYZW', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Monica Ristya Chandra', nisn = '5WDYZW', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000016756ca0'::uuid, 'Moreno Dwi Haryadi', 'HK8TE6', 'HK8TE6', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Moreno Dwi Haryadi', nisn = 'HK8TE6', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002fc3e0c6'::uuid, 'Moudza Indra Sukmana', 'HT6VT2', 'HT6VT2', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Moudza Indra Sukmana', nisn = 'HT6VT2', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003ab8870f'::uuid, 'Moza Hale Zilvilia', 'FMHSMZ', 'FMHSMZ', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Moza Hale Zilvilia', nisn = 'FMHSMZ', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000035b87eb5'::uuid, 'Muhamad Agus Firmansyah', '44BSQE', '44BSQE', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Agus Firmansyah', nisn = '44BSQE', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000597b5f4'::uuid, 'MUHAMAD ALFIN KAMAL ARTNA', 'PYNHMF', 'PYNHMF', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMAD ALFIN KAMAL ARTNA', nisn = 'PYNHMF', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000068439738'::uuid, 'Muhamad Ardiansyah', 'Z7NUSW', 'Z7NUSW', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Ardiansyah', nisn = 'Z7NUSW', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000030da084e'::uuid, 'Muhamad Ari Ramadani', 'S77YHD', 'S77YHD', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Ari Ramadani', nisn = 'S77YHD', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000035a47931'::uuid, 'Muhamad Arifin Ilham', '5VHHKK', '5VHHKK', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Arifin Ilham', nisn = '5VHHKK', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000599d5243'::uuid, 'Muhamad Duta Wardana', 'MB52TU', 'MB52TU', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Duta Wardana', nisn = 'MB52TU', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000683008ef'::uuid, 'Muhamad Fadil', 'XWN5Z5', 'XWN5Z5', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Fadil', nisn = 'XWN5Z5', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003e152b7d'::uuid, 'Muhamad Farrel Emeraldy Pasha', '9KCJMA', '9KCJMA', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Farrel Emeraldy Pasha', nisn = '9KCJMA', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000069086687'::uuid, 'Muhamad Fauzan Maulidan', 'KDDSBC', 'KDDSBC', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Fauzan Maulidan', nisn = 'KDDSBC', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001e7035e9'::uuid, 'Muhamad Hergia Putra', 'EWM9QL', 'EWM9QL', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Hergia Putra', nisn = 'EWM9QL', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000079160b01'::uuid, 'Muhamad Ibrahim Mufik', 'EDM4BK', 'EDM4BK', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Ibrahim Mufik', nisn = 'EDM4BK', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002fd75f74'::uuid, 'MUHAMAD IRSYAD AGUSTYAN', '5LBEPZ', '5LBEPZ', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMAD IRSYAD AGUSTYAN', nisn = '5LBEPZ', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005bd0475d'::uuid, 'Muhamad Januar Ilham Syauqi', '57Y9MX', '57Y9MX', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Januar Ilham Syauqi', nisn = '57Y9MX', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b4a1923'::uuid, 'Muhamad Noval Ardiansyah', '3SECB7', '3SECB7', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Noval Ardiansyah', nisn = '3SECB7', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004ff8dc7e'::uuid, 'Muhamad Sandy Mateta', 'RGQ3WN', 'RGQ3WN', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Sandy Mateta', nisn = 'RGQ3WN', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000407ac23b'::uuid, 'Muhamad Tsabitulazmi Ka Muslim', 'GHPL2J', 'GHPL2J', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhamad Tsabitulazmi Ka Muslim', nisn = 'GHPL2J', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000077c79420'::uuid, 'Muhammad Abdul Qawiyy', 'DRF4PD', 'DRF4PD', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Abdul Qawiyy', nisn = 'DRF4PD', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005d4e43d9'::uuid, 'Muhammad Aldo Prasetyo', '27BWTQ', '27BWTQ', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Aldo Prasetyo', nisn = '27BWTQ', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000686e9b50'::uuid, 'Muhammad Anwar', 'U7RU8S', 'U7RU8S', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Anwar', nisn = 'U7RU8S', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000581f22c3'::uuid, 'Muhammad Ariel Ardiansyah', 'ZWGFSD', 'ZWGFSD', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Ariel Ardiansyah', nisn = 'ZWGFSD', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000006ca4ff2'::uuid, 'MUHAMMAD ARRUMAN NOORUZZAMAN', 'PB66C3', 'PB66C3', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD ARRUMAN NOORUZZAMAN', nisn = 'PB66C3', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001d06875c'::uuid, 'Muhammad Asyam Nur Marzuq', 'AH6627', 'AH6627', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Asyam Nur Marzuq', nisn = 'AH6627', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001bb101be'::uuid, 'MUHAMMAD AZZAM KAMIL', 'LT9C95', 'LT9C95', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD AZZAM KAMIL', nisn = 'LT9C95', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004f1f34de'::uuid, 'Muhammad Bhagas Aufa Prasetya', 'JNX5SD', 'JNX5SD', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Bhagas Aufa Prasetya', nisn = 'JNX5SD', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001dccb853'::uuid, 'Muhammad Dzaki Taruna Fatih', 'RL9B6V', 'RL9B6V', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Dzaki Taruna Fatih', nisn = 'RL9B6V', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000017a6091f'::uuid, 'Muhammad Dzakwan Syihab', 'T6XEBB', 'T6XEBB', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Dzakwan Syihab', nisn = 'T6XEBB', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000035dc7bb0'::uuid, 'Muhammad Fadly Irianto', '6DD3Q4', '6DD3Q4', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Fadly Irianto', nisn = '6DD3Q4', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007ad9a648'::uuid, 'Muhammad Fahmi', 'SXHR8Q', 'SXHR8Q', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Fahmi', nisn = 'SXHR8Q', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b09117a'::uuid, 'Muhammad Fathir Rahadyan', '7YVEQV', '7YVEQV', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Fathir Rahadyan', nisn = '7YVEQV', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002faba464'::uuid, 'Muhammad Finza Garybaldi', '4T8FLR', '4T8FLR', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Finza Garybaldi', nisn = '4T8FLR', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000059eaf07f'::uuid, 'MUHAMMAD HAFIDZ RADESYA', 'LUSSM5', 'LUSSM5', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD HAFIDZ RADESYA', nisn = 'LUSSM5', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000008031abb'::uuid, 'MUHAMMAD HAFIZH SATYAVALI WIRYAWAN', 'SRB338', 'SRB338', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD HAFIZH SATYAVALI WIRYAWAN', nisn = 'SRB338', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000091076fe'::uuid, 'Muhammad Haikal Al- Kaffi', 'R7BRUN', 'R7BRUN', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Haikal Al- Kaffi', nisn = 'R7BRUN', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000012d2f41e'::uuid, 'MUHAMMAD IKHSAN NUR HAKIM', '554D42', '554D42', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD IKHSAN NUR HAKIM', nisn = '554D42', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005aee43c4'::uuid, 'Muhammad Isa Maulana Wijaya', 'DEGGMX', 'DEGGMX', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Isa Maulana Wijaya', nisn = 'DEGGMX', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002d82083c'::uuid, 'Muhammad Kayyis Nashrullah', 'Z535YH', 'Z535YH', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Kayyis Nashrullah', nisn = 'Z535YH', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002347fe37'::uuid, 'MUHAMMAD NAUFAL ELVAN NABEEL ASADEL', 'JXNX4U', 'JXNX4U', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD NAUFAL ELVAN NABEEL ASADEL', nisn = 'JXNX4U', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011cdaa80'::uuid, 'Muhammad Nizar Saifudin', 'QENV3G', 'QENV3G', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Nizar Saifudin', nisn = 'QENV3G', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ac1ff9f'::uuid, 'Muhammad Patlin', 'JWMA3C', 'JWMA3C', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Patlin', nisn = 'JWMA3C', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000023d77827'::uuid, 'MUHAMMAD RAIAN DWIPUTRA RIFTRIANDRI', '65KT7F', '65KT7F', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD RAIAN DWIPUTRA RIFTRIANDRI', nisn = '65KT7F', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000068241305'::uuid, 'MUHAMMAD RAIS AL ZAKIN SUGARA', 'DTBEWY', 'DTBEWY', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD RAIS AL ZAKIN SUGARA', nisn = 'DTBEWY', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011761a86'::uuid, 'Muhammad Rayyan Ardhya Zhaheer', 'EW2FLP', 'EW2FLP', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Rayyan Ardhya Zhaheer', nisn = 'EW2FLP', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000323de538'::uuid, 'Muhammad Ridho Ratyana Putra', 'JDQXCJ', 'JDQXCJ', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Ridho Ratyana Putra', nisn = 'JDQXCJ', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000046e724f6'::uuid, 'MUHAMMAD RISKY AL GIFARI', 'TQRW48', 'TQRW48', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD RISKY AL GIFARI', nisn = 'TQRW48', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000553d0099'::uuid, 'MUHAMMAD RIZKI RAMADHAN', 'C8QFT3', 'C8QFT3', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD RIZKI RAMADHAN', nisn = 'C8QFT3', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005f779957'::uuid, 'Muhammad Rizky Al Daffa', 'D8MQPQ', 'D8MQPQ', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Rizky Al Daffa', nisn = 'D8MQPQ', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000073fb74fc'::uuid, 'Muhammad Rizky Azrian', 'VNKSAU', 'VNKSAU', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Rizky Azrian', nisn = 'VNKSAU', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007c80bb43'::uuid, 'Muhammad Ruby Septriansyah', 'S52UYG', 'S52UYG', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Ruby Septriansyah', nisn = 'S52UYG', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000300592ae'::uuid, 'Muhammad Syahdan Azizan', 'HUSKU2', 'HUSKU2', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammad Syahdan Azizan', nisn = 'HUSKU2', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000008ee485'::uuid, 'MUHAMMAD YAHYA FATHURRAHMAN', 'YWMXR4', 'YWMXR4', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUHAMMAD YAHYA FATHURRAHMAN', nisn = 'YWMXR4', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000513ef9b1'::uuid, 'Muhammadinejad Ghany Hidayat', '7EKYUX', '7EKYUX', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Muhammadinejad Ghany Hidayat', nisn = '7EKYUX', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004fcfdc6f'::uuid, 'Mustafa Andhika Wirajaya', 'VZCQJY', 'VZCQJY', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mustafa Andhika Wirajaya', nisn = 'VZCQJY', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000380ea639'::uuid, 'Mutia Husna', '7WRBNU', '7WRBNU', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mutia Husna', nisn = '7WRBNU', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000756ce58a'::uuid, 'Mutia Larasati Irawan', 'TP7FKF', 'TP7FKF', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Mutia Larasati Irawan', nisn = 'TP7FKF', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000a2ba849'::uuid, 'MUTIARA ANTIKA RAMBE', '2EQEHH', '2EQEHH', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'MUTIARA ANTIKA RAMBE', nisn = '2EQEHH', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001c05248d'::uuid, 'Nabhan Yasir Abian', 'CDPDEM', 'CDPDEM', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nabhan Yasir Abian', nisn = 'CDPDEM', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004e2fcfd2'::uuid, 'NABILA DWI PUTRI ANDYANA', 'ETRMZR', 'ETRMZR', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NABILA DWI PUTRI ANDYANA', nisn = 'ETRMZR', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000047895709'::uuid, 'NABILLA AGUSTINA', '5PGKYA', '5PGKYA', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NABILLA AGUSTINA', nisn = '5PGKYA', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000043975e68'::uuid, 'Nabilla Nursaeda', '6RBAX5', '6RBAX5', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nabilla Nursaeda', nisn = '6RBAX5', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000042c8ca07'::uuid, 'Nadhira Khairunnisa', 'Q88TDX', 'Q88TDX', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nadhira Khairunnisa', nisn = 'Q88TDX', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000003a4b26'::uuid, 'NADIA AZIZAH', '6X3LMH', '6X3LMH', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NADIA AZIZAH', nisn = '6X3LMH', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000045dd5292'::uuid, 'Nadin Nafila Azka', '8WRTMJ', '8WRTMJ', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nadin Nafila Azka', nisn = '8WRTMJ', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000269bd32f'::uuid, 'NADIRA YUAN ISKANDAR', '95R3T6', '95R3T6', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NADIRA YUAN ISKANDAR', nisn = '95R3T6', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001cfd4cee'::uuid, 'Nadya Nur Anisa', 'H2EYWW', 'H2EYWW', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nadya Nur Anisa', nisn = 'H2EYWW', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000076b8a616'::uuid, 'Nadya Valen Noer Febrianti', '3T24JA', '3T24JA', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nadya Valen Noer Febrianti', nisn = '3T24JA', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000020008393'::uuid, 'Nafasya Annida Apriani', 'NY69YH', 'NY69YH', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nafasya Annida Apriani', nisn = 'NY69YH', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000291b8a7e'::uuid, 'NAILA ALFI HUSNA', 'SHDB65', 'SHDB65', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NAILA ALFI HUSNA', nisn = 'SHDB65', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001438a234'::uuid, 'Naila Ramya Adawiya', 'FV8U6M', 'FV8U6M', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naila Ramya Adawiya', nisn = 'FV8U6M', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006416907a'::uuid, 'Naila Zahra Azalia Mayrani', 'UVMMC8', 'UVMMC8', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naila Zahra Azalia Mayrani', nisn = 'UVMMC8', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000057f33952'::uuid, 'Naina Putri Ramadani', 'X4JCLY', 'X4JCLY', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naina Putri Ramadani', nisn = 'X4JCLY', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007cbdfb5b'::uuid, 'Naine Putri Ramadina', 'ZLZQH4', 'ZLZQH4', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naine Putri Ramadina', nisn = 'ZLZQH4', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003ce13e42'::uuid, 'Naiyla Ismatul Muftahidah', 'PQ6XD3', 'PQ6XD3', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naiyla Ismatul Muftahidah', nisn = 'PQ6XD3', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000041835a21'::uuid, 'Naizar Yaafi Faishal', 'S8878C', 'S8878C', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naizar Yaafi Faishal', nisn = 'S8878C', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007edb77e4'::uuid, 'Najib Nasrullah', 'JFXP7W', 'JFXP7W', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Najib Nasrullah', nisn = 'JFXP7W', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005f5dae75'::uuid, 'Najla Aida Zahrani Nuri Liyana', 'B28N4S', 'B28N4S', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Najla Aida Zahrani Nuri Liyana', nisn = 'B28N4S', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002a7436f9'::uuid, 'Najwa Khairunnisa', 'UP22WS', 'UP22WS', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Najwa Khairunnisa', nisn = 'UP22WS', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000651e0dfe'::uuid, 'NAJWA PURI PRATAMI', '96SK96', '96SK96', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NAJWA PURI PRATAMI', nisn = '96SK96', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000192c5c73'::uuid, 'Nakesha Alkausar Abdilah', 'GNJXK3', 'GNJXK3', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nakesha Alkausar Abdilah', nisn = 'GNJXK3', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002085cee9'::uuid, 'NANDITA AULIA PUTRI', 'L658PJ', 'L658PJ', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NANDITA AULIA PUTRI', nisn = 'L658PJ', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007d10180b'::uuid, 'Nasa Nur Anisa', 'BPZJL3', 'BPZJL3', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nasa Nur Anisa', nisn = 'BPZJL3', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000664a4a32'::uuid, 'Nasya Ameira Devitasari', 'A3HHRB', 'A3HHRB', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nasya Ameira Devitasari', nisn = 'A3HHRB', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011a66e71'::uuid, 'NATANEILLA PUTRI NURAINI', 'JZBBRA', 'JZBBRA', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NATANEILLA PUTRI NURAINI', nisn = 'JZBBRA', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000075db5649'::uuid, 'Natasya Rahma Yonita Putri', 'RVASH9', 'RVASH9', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Natasya Rahma Yonita Putri', nisn = 'RVASH9', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004ea2a59d'::uuid, 'Nathan Satria Suryana Putra', 'THU8X4', 'THU8X4', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nathan Satria Suryana Putra', nisn = 'THU8X4', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000066e6ea3'::uuid, 'Nathasya Avrillia', '5DM78R', '5DM78R', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nathasya Avrillia', nisn = '5DM78R', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000314a3a88'::uuid, 'Naufal Aziz', 'BJHURU', 'BJHURU', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naufal Aziz', nisn = 'BJHURU', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005d9edab1'::uuid, 'Naura Hayfa Anindia', '9AQ3WL', '9AQ3WL', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naura Hayfa Anindia', nisn = '9AQ3WL', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000827c48b'::uuid, 'Naya Arselia Didez', 'TAJEY6', 'TAJEY6', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naya Arselia Didez', nisn = 'TAJEY6', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006e99fef4'::uuid, 'NAYLA LAKSMI SYAKIRA', 'F7N2DK', 'F7N2DK', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NAYLA LAKSMI SYAKIRA', nisn = 'F7N2DK', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000049931900'::uuid, 'Naysilla Emilda Muri', 'UT4VDS', 'UT4VDS', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naysilla Emilda Muri', nisn = 'UT4VDS', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006ff3913d'::uuid, 'NAZILAH REKSA PUTRA', 'YMRDL3', 'YMRDL3', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NAZILAH REKSA PUTRA', nisn = 'YMRDL3', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000014465109'::uuid, 'Nazira Febriani', 'MY34MY', 'MY34MY', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nazira Febriani', nisn = 'MY34MY', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002f29b86a'::uuid, 'Nazmin Zahrina Anwar', 'MBEUST', 'MBEUST', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nazmin Zahrina Anwar', nisn = 'MBEUST', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005596a988'::uuid, 'Naznin Raina Salwa', 'FX9S6B', 'FX9S6B', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Naznin Raina Salwa', nisn = 'FX9S6B', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007869a2e8'::uuid, 'Nazwa Anindya Kholifatunnisa', 'T34AVR', 'T34AVR', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nazwa Anindya Kholifatunnisa', nisn = 'T34AVR', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003b8decf9'::uuid, 'NAZWA GHONIYAH', 'ZPX9UG', 'ZPX9UG', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NAZWA GHONIYAH', nisn = 'ZPX9UG', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005749af38'::uuid, 'Nazwa Nur Rizky', '3PRTK4', '3PRTK4', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nazwa Nur Rizky', nisn = '3PRTK4', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006437a5d5'::uuid, 'Nikky Syahwal Badar', 'H2RTAP', 'H2RTAP', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nikky Syahwal Badar', nisn = 'H2RTAP', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000038282853'::uuid, 'Niko Ryan Saputra', 'YCXRU4', 'YCXRU4', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Niko Ryan Saputra', nisn = 'YCXRU4', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006672d85c'::uuid, 'Nil Kinan Febrian', 'AFMYUX', 'AFMYUX', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nil Kinan Febrian', nisn = 'AFMYUX', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000065496fda'::uuid, 'Nira Gumulya', 'HVNQN3', 'HVNQN3', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nira Gumulya', nisn = 'HVNQN3', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005e29d95a'::uuid, 'Nisa Febriani', 'HXR9NM', 'HXR9NM', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nisa Febriani', nisn = 'HXR9NM', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000069ff7977'::uuid, 'Nisa Sifa Auliany', 'RM7UD2', 'RM7UD2', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nisa Sifa Auliany', nisn = 'RM7UD2', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000070055439'::uuid, 'Noerhalizah Rahman', 'ZL5HDH', 'ZL5HDH', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Noerhalizah Rahman', nisn = 'ZL5HDH', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000067fb5e8b'::uuid, 'Nouval Zain Umbara', 'XCC62Y', 'XCC62Y', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nouval Zain Umbara', nisn = 'XCC62Y', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007d86d093'::uuid, 'NOVAL ARDIANSYAH', 'ZQ6DKC', 'ZQ6DKC', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NOVAL ARDIANSYAH', nisn = 'ZQ6DKC', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005eda6097'::uuid, 'Novan Adhitya Nugraha', 'UWZTKV', 'UWZTKV', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Novan Adhitya Nugraha', nisn = 'UWZTKV', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003c025eb3'::uuid, 'Novansyah Hendrawan', 'XSJFTZ', 'XSJFTZ', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Novansyah Hendrawan', nisn = 'XSJFTZ', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000a2d9e05'::uuid, 'NOVIA NURUL SANIYAH', 'T3K9K3', 'T3K9K3', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NOVIA NURUL SANIYAH', nisn = 'T3K9K3', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000103aa9e9'::uuid, 'NOVIANA DESTIANI', 'UF4Q7B', 'UF4Q7B', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NOVIANA DESTIANI', nisn = 'UF4Q7B', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000057b76946'::uuid, 'NUHAMAD SHAZIA RAYYATAMA', 'X53JVL', 'X53JVL', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NUHAMAD SHAZIA RAYYATAMA', nisn = 'X53JVL', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002c331692'::uuid, 'NUR AFIFAH AINIYAH', 'VCANP4', 'VCANP4', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NUR AFIFAH AINIYAH', nisn = 'VCANP4', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000604a7ade'::uuid, 'NUR UMAIRAH SYAHMINA', 'FH6NUM', 'FH6NUM', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NUR UMAIRAH SYAHMINA', nisn = 'FH6NUM', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006f6f75d8'::uuid, 'Nuraini Dwiarti', 'ZU8X96', 'ZU8X96', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nuraini Dwiarti', nisn = 'ZU8X96', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000355a97e6'::uuid, 'NURAZIZAH', 'B7CCST', 'B7CCST', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NURAZIZAH', nisn = 'B7CCST', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006f75bba0'::uuid, 'Nursaina Rohman', '4MM2QC', '4MM2QC', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nursaina Rohman', nisn = '4MM2QC', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000645127c7'::uuid, 'Nurul Ramadhani', '355SBY', '355SBY', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Nurul Ramadhani', nisn = '355SBY', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007742f12d'::uuid, 'NURWENING RAHAYU', 'NBZEPN', 'NBZEPN', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'NURWENING RAHAYU', nisn = 'NBZEPN', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000662ed402'::uuid, 'Olya Junita Salsa', 'LZFJJF', 'LZFJJF', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Olya Junita Salsa', nisn = 'LZFJJF', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002298a90a'::uuid, 'Orcydia Ramadianti', 'YABT5A', 'YABT5A', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Orcydia Ramadianti', nisn = 'YABT5A', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000045aa26bc'::uuid, 'Ozil Faiz Firdaus', 'MZ2YFF', 'MZ2YFF', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ozil Faiz Firdaus', nisn = 'MZ2YFF', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002af02dda'::uuid, 'Paris Juniko', '3CWM7G', '3CWM7G', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Paris Juniko', nisn = '3CWM7G', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000012235138'::uuid, 'PELLA BILKIS', 'N44ZFR', 'N44ZFR', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'PELLA BILKIS', nisn = 'N44ZFR', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000031e57152'::uuid, 'PRAMESTI AGNI SYAFINA', 'X26A2K', 'X26A2K', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'PRAMESTI AGNI SYAFINA', nisn = 'X26A2K', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003ae23cd3'::uuid, 'PRICILLA ERKA JANUARY PUTRI', 'QU5MEL', 'QU5MEL', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'PRICILLA ERKA JANUARY PUTRI', nisn = 'QU5MEL', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001f8e363b'::uuid, 'Putri Agta Septiani', 'VSXFBB', 'VSXFBB', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Putri Agta Septiani', nisn = 'VSXFBB', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005e575a28'::uuid, 'Putriyani Nazwa', 'QVYSKT', 'QVYSKT', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Putriyani Nazwa', nisn = 'QVYSKT', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000075f1e6c'::uuid, 'Qalesya Humaira Jatnika', 'WFZCTX', 'WFZCTX', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Qalesya Humaira Jatnika', nisn = 'WFZCTX', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000f68e66c'::uuid, 'QUEENDITA AUFA SAKHI', 'UD4JVU', 'UD4JVU', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'QUEENDITA AUFA SAKHI', nisn = 'UD4JVU', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005ab227b1'::uuid, 'Queensa Safitri', 'ZQD4XR', 'ZQD4XR', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Queensa Safitri', nisn = 'ZQD4XR', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000059b8cb87'::uuid, 'Queensha Dwi Utami', 'ZV7VD2', 'ZV7VD2', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Queensha Dwi Utami', nisn = 'ZV7VD2', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000083b3fee'::uuid, 'Queensha Jayzilhusni', 'BQAQDC', 'BQAQDC', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Queensha Jayzilhusni', nisn = 'BQAQDC', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003aacfbdd'::uuid, 'QUEENSY GAUSYANI IRAWAN', 'SYRG3E', 'SYRG3E', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'QUEENSY GAUSYANI IRAWAN', nisn = 'SYRG3E', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007427bae5'::uuid, 'QUEENTHADIRA AFIFAH GISMA P', 'GD487A', 'GD487A', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'QUEENTHADIRA AFIFAH GISMA P', nisn = 'GD487A', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003e155041'::uuid, 'QUINA RAYSA ACHMAD', 'SNEFD9', 'SNEFD9', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'QUINA RAYSA ACHMAD', nisn = 'SNEFD9', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000497103e4'::uuid, 'Quinsa Shavira Putri Triadi', '5SZCNS', '5SZCNS', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Quinsa Shavira Putri Triadi', nisn = '5SZCNS', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000066219a12'::uuid, 'Rabiyya Niara Jingga', 'MLF46K', 'MLF46K', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rabiyya Niara Jingga', nisn = 'MLF46K', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000041758fc2'::uuid, 'Rachel Delpa Lin Waruwu', 'GF2D4U', 'GF2D4U', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rachel Delpa Lin Waruwu', nisn = 'GF2D4U', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000063520394'::uuid, 'Radikha Kurniansyah Kamil', '2HTB4T', '2HTB4T', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Radikha Kurniansyah Kamil', nisn = '2HTB4T', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000035f2d486'::uuid, 'Raesya Anadia Rusy', 'G7PBWK', 'G7PBWK', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raesya Anadia Rusy', nisn = 'G7PBWK', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000b39f441'::uuid, 'Raffa Pratama Putra', 'DGSN8K', 'DGSN8K', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raffa Pratama Putra', nisn = 'DGSN8K', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000288b87cb'::uuid, 'Rafha Alika Januar', 'UREJV9', 'UREJV9', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rafha Alika Januar', nisn = 'UREJV9', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004f57a466'::uuid, 'Rafi Dzakwan Maulana', '933L4W', '933L4W', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rafi Dzakwan Maulana', nisn = '933L4W', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000013a841df'::uuid, 'Rafka Raditya Wiratama', '66DPNQ', '66DPNQ', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rafka Raditya Wiratama', nisn = '66DPNQ', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000008b0f991'::uuid, 'Rahma Aulia Nur Aisyah', 'KDH8ZR', 'KDH8ZR', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rahma Aulia Nur Aisyah', nisn = 'KDH8ZR', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000ea1b710'::uuid, 'RAHMA SANTIKA', 'WCDDTH', 'WCDDTH', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RAHMA SANTIKA', nisn = 'WCDDTH', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001a397657'::uuid, 'RAHMANISA ULFA', '5K9K98', '5K9K98', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RAHMANISA ULFA', nisn = '5K9K98', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006eaddf3f'::uuid, 'RAISA HAFIDZAH TIFADLI PUTRI', 'BWKCHL', 'BWKCHL', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RAISA HAFIDZAH TIFADLI PUTRI', nisn = 'BWKCHL', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000009b47f23'::uuid, 'Raisha Aneira', 'W83ZWB', 'W83ZWB', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raisha Aneira', nisn = 'W83ZWB', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006dd88cff'::uuid, 'RAISYA IMAMI PUTRI', '7CL3EA', '7CL3EA', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RAISYA IMAMI PUTRI', nisn = '7CL3EA', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006d24a248'::uuid, 'Raisya Nadila', 'FR5EUQ', 'FR5EUQ', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raisya Nadila', nisn = 'FR5EUQ', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000b7207e6'::uuid, 'Raisya Putri Pratiwi', 'RQFN7F', 'RQFN7F', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raisya Putri Pratiwi', nisn = 'RQFN7F', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002ba64163'::uuid, 'Rakha Rizqi Pratama', 'BHAQA8', 'BHAQA8', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rakha Rizqi Pratama', nisn = 'BHAQA8', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000054de0ad5'::uuid, 'Rakhel Syaumi Rosyiana', 'ZYMPAZ', 'ZYMPAZ', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rakhel Syaumi Rosyiana', nisn = 'ZYMPAZ', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003dfec9a9'::uuid, 'RAMA PURNAMA ALAM', 'G5N2N5', 'G5N2N5', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RAMA PURNAMA ALAM', nisn = 'G5N2N5', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000da46c71'::uuid, 'Rani Fatarani', 'SFEJLS', 'SFEJLS', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rani Fatarani', nisn = 'SFEJLS', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001c8bb29f'::uuid, 'Ranita Zahra Azalia', 'H4GE3Z', 'H4GE3Z', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ranita Zahra Azalia', nisn = 'H4GE3Z', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000072261c6c'::uuid, 'RANY DWI DAMAYANTI', 'NBUU4D', 'NBUU4D', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RANY DWI DAMAYANTI', nisn = 'NBUU4D', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000495bc268'::uuid, 'Raqid Yaqdhan Saqti', 'G5PU6K', 'G5PU6K', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raqid Yaqdhan Saqti', nisn = 'G5PU6K', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001c7754ba'::uuid, 'RASYA FIRMAN ARDIANSYAH', 'J9XUCA', 'J9XUCA', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RASYA FIRMAN ARDIANSYAH', nisn = 'J9XUCA', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000014b98809'::uuid, 'RASYID AHNAF FAWWAS GUNAWAN', 'MWZ7PB', 'MWZ7PB', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RASYID AHNAF FAWWAS GUNAWAN', nisn = 'MWZ7PB', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000044ccb70f'::uuid, 'RATU URSULA BORU MANIHURUK', 'UET39K', 'UET39K', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RATU URSULA BORU MANIHURUK', nisn = 'UET39K', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002eb6d548'::uuid, 'Raul Baqir', '5H8G4J', '5H8G4J', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raul Baqir', nisn = '5H8G4J', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000217917c6'::uuid, 'Rava Azizul Zafis', 'F3JS8X', 'F3JS8X', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rava Azizul Zafis', nisn = 'F3JS8X', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002ae7dbdf'::uuid, 'Rayhan Ramadhan', 'PBBWM7', 'PBBWM7', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rayhan Ramadhan', nisn = 'PBBWM7', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000068594022'::uuid, 'Raysa Putri Aprilyani Rahman', 'P558R8', 'P558R8', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Raysa Putri Aprilyani Rahman', nisn = 'P558R8', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005a5e6137'::uuid, 'RAYVA SHIFANI AZZAHRA', '5MS7CN', '5MS7CN', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RAYVA SHIFANI AZZAHRA', nisn = '5MS7CN', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003fa67db8'::uuid, 'Rayya Puan Hafeeza', 'HM56EG', 'HM56EG', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rayya Puan Hafeeza', nisn = 'HM56EG', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003c157924'::uuid, 'Reghina Putri Patricia', 'LNKHUB', 'LNKHUB', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reghina Putri Patricia', nisn = 'LNKHUB', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006531c340'::uuid, 'Regina Mutiara', '4HKYYG', '4HKYYG', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Regina Mutiara', nisn = '4HKYYG', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003330e2d9'::uuid, 'Regina Rahayu', 'CB7STB', 'CB7STB', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Regina Rahayu', nisn = 'CB7STB', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000047255ed6'::uuid, 'Reihan Nashrullah Alhakim Sudrajat', 'MHZ5H8', 'MHZ5H8', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reihan Nashrullah Alhakim Sudrajat', nisn = 'MHZ5H8', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001830d89b'::uuid, 'Reksa Sahas Shaviar', 'DNAXBL', 'DNAXBL', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reksa Sahas Shaviar', nisn = 'DNAXBL', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000749ca75d'::uuid, 'RENATA MUTIARA PUTRI', 'WW8DCJ', 'WW8DCJ', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RENATA MUTIARA PUTRI', nisn = 'WW8DCJ', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000021bc4ee2'::uuid, 'Rendy Rosyiid Pratama', '7G3B8G', '7G3B8G', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rendy Rosyiid Pratama', nisn = '7G3B8G', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001371d687'::uuid, 'Restu Permana', '6CL9JG', '6CL9JG', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Restu Permana', nisn = '6CL9JG', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003af06380'::uuid, 'Reva Nurhayati', 'RTKQZB', 'RTKQZB', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reva Nurhayati', nisn = 'RTKQZB', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004818f6b8'::uuid, 'Revian Hafidz Ardiansyah', 'RE4XFG', 'RE4XFG', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Revian Hafidz Ardiansyah', nisn = 'RE4XFG', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000018103b19'::uuid, 'Revina Anggraeni Permata', '46TE37', '46TE37', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Revina Anggraeni Permata', nisn = '46TE37', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000035a17439'::uuid, 'Reyhan Azka Julfian', 'BNGLVN', 'BNGLVN', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reyhan Azka Julfian', nisn = 'BNGLVN', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004658a499'::uuid, 'Reysha Putri Julianty', 'EJF8VH', 'EJF8VH', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reysha Putri Julianty', nisn = 'EJF8VH', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000050e00d3a'::uuid, 'Reyshilla Haura Purnama', 'URCSNK', 'URCSNK', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Reyshilla Haura Purnama', nisn = 'URCSNK', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ff23275'::uuid, 'Rezky Febryana Saputra', '4E5NVG', '4E5NVG', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rezky Febryana Saputra', nisn = '4E5NVG', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000045e1aa06'::uuid, 'Rezza Caesar Achmad Ardiansyah', '4P27KT', '4P27KT', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rezza Caesar Achmad Ardiansyah', nisn = '4P27KT', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004626ad9d'::uuid, 'Rhea Putri Sugandi', 'ELZT5A', 'ELZT5A', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rhea Putri Sugandi', nisn = 'ELZT5A', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004b93b6aa'::uuid, 'RICKA PUTRI FITRIANY', 'HKSNV2', 'HKSNV2', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RICKA PUTRI FITRIANY', nisn = 'HKSNV2', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000052837a09'::uuid, 'Ridlo Restu Fadillah', 'XFNSEY', 'XFNSEY', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ridlo Restu Fadillah', nisn = 'XFNSEY', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000054e227c2'::uuid, 'Rido Sapaat', '6KC5MX', '6KC5MX', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rido Sapaat', nisn = '6KC5MX', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000030c2b4e2'::uuid, 'Rifan Rifki Ramdani', 'YCBL97', 'YCBL97', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rifan Rifki Ramdani', nisn = 'YCBL97', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000034b62bdc'::uuid, 'RIFKI MAULANA', 'YUN8P6', 'YUN8P6', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RIFKI MAULANA', nisn = 'YUN8P6', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002c6a34d0'::uuid, 'RIFKY RAJATA HAYAT', 'VPRRQ7', 'VPRRQ7', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RIFKY RAJATA HAYAT', nisn = 'VPRRQ7', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000064900f3e'::uuid, 'Rifqi Safari Indrayana', 'MRWDAA', 'MRWDAA', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rifqi Safari Indrayana', nisn = 'MRWDAA', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000162fab0'::uuid, 'Rifqi Wikan Nayra', '8VAZPY', '8VAZPY', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rifqi Wikan Nayra', nisn = '8VAZPY', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000024bf371d'::uuid, 'Rima Nurul Husna', 'JP3978', 'JP3978', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rima Nurul Husna', nisn = 'JP3978', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000022b75273'::uuid, 'RINA MARIANA', 'UKPCSM', 'UKPCSM', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RINA MARIANA', nisn = 'UKPCSM', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000058fab5d5'::uuid, 'Rindista Syella Suci Yunira', 'DN2TSL', 'DN2TSL', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rindista Syella Suci Yunira', nisn = 'DN2TSL', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003e2a311a'::uuid, 'RIRIN RIANTI', 'L68S5F', 'L68S5F', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RIRIN RIANTI', nisn = 'L68S5F', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000018473cf2'::uuid, 'RISYA APRILIA PUTRI', 'CFFRBU', 'CFFRBU', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'RISYA APRILIA PUTRI', nisn = 'CFFRBU', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000b32eebe'::uuid, 'Riza Maharani', 'SFMY6E', 'SFMY6E', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Riza Maharani', nisn = 'SFMY6E', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000394103b0'::uuid, 'Rizki Farel Alfian', '2F6RXH', '2F6RXH', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizki Farel Alfian', nisn = '2F6RXH', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000258e9536'::uuid, 'Rizki Saputra Anugrah', 'KMVFEY', 'KMVFEY', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizki Saputra Anugrah', nisn = 'KMVFEY', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000033763ef'::uuid, 'Rizkia Putri Dwi Andani', 'GN32QJ', 'GN32QJ', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizkia Putri Dwi Andani', nisn = 'GN32QJ', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ef3eef8'::uuid, 'Rizky Ramadhan Nurhikmat', 'YRMVFL', 'YRMVFL', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizky Ramadhan Nurhikmat', nisn = 'YRMVFL', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003f473a38'::uuid, 'Rizky Ramadhan Nurulloh', 'AQXCMZ', 'AQXCMZ', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizky Ramadhan Nurulloh', nisn = 'AQXCMZ', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000051bd2e4b'::uuid, 'Rizkyta Safa Raisya', '5VEZBG', '5VEZBG', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizkyta Safa Raisya', nisn = '5VEZBG', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000041d9efee'::uuid, 'Rizzki Hermawan', 'BW5CZ9', 'BW5CZ9', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rizzki Hermawan', nisn = 'BW5CZ9', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000016c847a8'::uuid, 'Rosella Az-Zahra Komara', 'FSQRK5', 'FSQRK5', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Rosella Az-Zahra Komara', nisn = 'FSQRK5', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000078b4f499'::uuid, 'Ryanti Marsha Agustin', 'QBPPLD', 'QBPPLD', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ryanti Marsha Agustin', nisn = 'QBPPLD', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011ac79a8'::uuid, 'SAEPULLOH NURROHMAN', 'WMJBYS', 'WMJBYS', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SAEPULLOH NURROHMAN', nisn = 'WMJBYS', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000732b775f'::uuid, 'Safa Aidul Leksa', 'J8UCSF', 'J8UCSF', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Safa Aidul Leksa', nisn = 'J8UCSF', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000035c82b'::uuid, 'SAFNA SETIAWATI', 'UPJXGY', 'UPJXGY', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SAFNA SETIAWATI', nisn = 'UPJXGY', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000073226972'::uuid, 'Sakhi Arifatunnisa', 'GF7CWJ', 'GF7CWJ', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sakhi Arifatunnisa', nisn = 'GF7CWJ', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000208b96e0'::uuid, 'Salimah Farannisa Shofa', 'DXRFQY', 'DXRFQY', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Salimah Farannisa Shofa', nisn = 'DXRFQY', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007177edbe'::uuid, 'Sally Suci Rahmawati', 'ZWTE2R', 'ZWTE2R', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sally Suci Rahmawati', nisn = 'ZWTE2R', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000166cb4ea'::uuid, 'Salma Aulia Putri', 'EFLTBS', 'EFLTBS', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Salma Aulia Putri', nisn = 'EFLTBS', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000100c59ea'::uuid, 'Salsa Efrila', 'ZH4ALK', 'ZH4ALK', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Salsa Efrila', nisn = 'ZH4ALK', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004f1fc25a'::uuid, 'Salsabiila Dhiyaa ''Tulhaq Syahidah Kusnandar', 'Z6RQUP', 'Z6RQUP', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Salsabiila Dhiyaa ''Tulhaq Syahidah Kusnandar', nisn = 'Z6RQUP', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000d71d15d'::uuid, 'Salwa Alfaira Azzahra', 'J3LMT7', 'J3LMT7', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Salwa Alfaira Azzahra', nisn = 'J3LMT7', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000047fa1857'::uuid, 'Salwa Alkarina', 'GS4X7N', 'GS4X7N', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Salwa Alkarina', nisn = 'GS4X7N', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000545b6580'::uuid, 'Sangjalu Raibumi Merdeka', 'UWSE73', 'UWSE73', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sangjalu Raibumi Merdeka', nisn = 'UWSE73', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001eb32e89'::uuid, 'Sani Nursafarina', 'YATLLE', 'YATLLE', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sani Nursafarina', nisn = 'YATLLE', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007b918dc0'::uuid, 'SAPUTRA ADIRA NUGRAHA', '8R5AFP', '8R5AFP', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SAPUTRA ADIRA NUGRAHA', nisn = '8R5AFP', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000670580da'::uuid, 'Sarah Aulia', '49287B', '49287B', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sarah Aulia', nisn = '49287B', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000030ef354'::uuid, 'Sarah Zharifah Qodiriyyah', 'UZJEQ5', 'UZJEQ5', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sarah Zharifah Qodiriyyah', nisn = 'UZJEQ5', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000060dbc84e'::uuid, 'Sasi Kirana Hermawan', 'HUBKZF', 'HUBKZF', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sasi Kirana Hermawan', nisn = 'HUBKZF', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006a90e443'::uuid, 'Saskhia Aulia Putri', 'GYRTHA', 'GYRTHA', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Saskhia Aulia Putri', nisn = 'GYRTHA', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003a2c7baa'::uuid, 'Saskia Chaerunisa', 'FM8WS3', 'FM8WS3', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Saskia Chaerunisa', nisn = 'FM8WS3', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002e2741c4'::uuid, 'Sasky Nugi Saputra', 'ULY864', 'ULY864', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sasky Nugi Saputra', nisn = 'ULY864', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006a1401db'::uuid, 'Satria Panca Anugrah', '7HBZVX', '7HBZVX', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Satria Panca Anugrah', nisn = '7HBZVX', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000058b85bdd'::uuid, 'Satria Ridzky Pratama', 'W8JNBP', 'W8JNBP', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Satria Ridzky Pratama', nisn = 'W8JNBP', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000d8b0fae'::uuid, 'Sayyid Ikhlas Mujtaba', 'JXSUHV', 'JXSUHV', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sayyid Ikhlas Mujtaba', nisn = 'JXSUHV', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000068846b0b'::uuid, 'Senya Dinda Almayda', 'U3DLEZ', 'U3DLEZ', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Senya Dinda Almayda', nisn = 'U3DLEZ', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b3d5f30'::uuid, 'SERLY MEILANI', 'H3PC7Y', 'H3PC7Y', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SERLY MEILANI', nisn = 'H3PC7Y', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000020f4fe0a'::uuid, 'SHABIL FAUZAN JUHAIR', '9B99VS', '9B99VS', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SHABIL FAUZAN JUHAIR', nisn = '9B99VS', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001233e94a'::uuid, 'Shafira Restia Putri Jaenal', '9NP4W8', '9NP4W8', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shafira Restia Putri Jaenal', nisn = '9NP4W8', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000247ed958'::uuid, 'Shakila Humaira', '6BTQD3', '6BTQD3', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shakila Humaira', nisn = '6BTQD3', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000161e4e4a'::uuid, 'SHANDY RIFKI RAMADHAN', '7TLUMA', '7TLUMA', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SHANDY RIFKI RAMADHAN', nisn = '7TLUMA', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000074a25309'::uuid, 'Shaufa Ayu Fadhilah', 'TWHXQE', 'TWHXQE', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shaufa Ayu Fadhilah', nisn = 'TWHXQE', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003803a58c'::uuid, 'SHAZIRA AURANI REZKY', 'N37TY3', 'N37TY3', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SHAZIRA AURANI REZKY', nisn = 'N37TY3', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000065ad5add'::uuid, 'Shelisa Gian Marsya', 'NLGRGK', 'NLGRGK', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shelisa Gian Marsya', nisn = 'NLGRGK', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002ffe260a'::uuid, 'SHEZAN FALISHA LASHIRA', 'K9QSJ4', 'K9QSJ4', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SHEZAN FALISHA LASHIRA', nisn = 'K9QSJ4', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000065402f0b'::uuid, 'SHIDQIYYAH ALIFA DHIYYA ULHAQ', 'DGB9JK', 'DGB9JK', 'L', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SHIDQIYYAH ALIFA DHIYYA ULHAQ', nisn = 'DGB9JK', gender = 'L', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001373843d'::uuid, 'Shifa Nur Fitriani', 'C2P95J', 'C2P95J', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shifa Nur Fitriani', nisn = 'C2P95J', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000223c830e'::uuid, 'Shifan Thami Syahdan Filliank', 'CAS9TN', 'CAS9TN', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shifan Thami Syahdan Filliank', nisn = 'CAS9TN', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004bf4be25'::uuid, 'Shofia Rahma Tusiyam', 'LTCUQB', 'LTCUQB', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Shofia Rahma Tusiyam', nisn = 'LTCUQB', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000017a45259'::uuid, 'Silvia Titania', 'MAEFWY', 'MAEFWY', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Silvia Titania', nisn = 'MAEFWY', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003d197283'::uuid, 'Sindi Januari Pratiwi', 'X7B7WV', 'X7B7WV', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sindi Januari Pratiwi', nisn = 'X7B7WV', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00005be80535'::uuid, 'Sinta Nabila Putri', 'Z9N38Y', 'Z9N38Y', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sinta Nabila Putri', nisn = 'Z9N38Y', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007397e1b1'::uuid, 'SINTYA MEILANI PUTRI', 'P73ZPC', 'P73ZPC', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SINTYA MEILANI PUTRI', nisn = 'P73ZPC', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000010cfd4f1'::uuid, 'Siti Almas Fajriah', '4LPH5D', '4LPH5D', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Siti Almas Fajriah', nisn = '4LPH5D', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000007e5b209'::uuid, 'Siti Fadilla', 'P2DNRM', 'P2DNRM', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Siti Fadilla', nisn = 'P2DNRM', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000074afff54'::uuid, 'Siti Fatimah Azzahra', 'GELWBU', 'GELWBU', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Siti Fatimah Azzahra', nisn = 'GELWBU', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000163ff857'::uuid, 'Siti Sarah Aulia', 'VXRE6Z', 'VXRE6Z', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Siti Sarah Aulia', nisn = 'VXRE6Z', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000066a336c2'::uuid, 'SOGI SOBIANSYAH', 'QHG8N8', 'QHG8N8', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SOGI SOBIANSYAH', nisn = 'QHG8N8', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00000968ed57'::uuid, 'SONIA NATASYA', 'YQVRRW', 'YQVRRW', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SONIA NATASYA', nisn = 'YQVRRW', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002e6aa9bc'::uuid, 'Sonic Nur Iskandar', 'XAEVVP', 'XAEVVP', 'L', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sonic Nur Iskandar', nisn = 'XAEVVP', gender = 'L', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000552b8e02'::uuid, 'Sri Fatihatul Hasanah', 'BJHMLM', 'BJHMLM', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sri Fatihatul Hasanah', nisn = 'BJHMLM', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001b31d920'::uuid, 'Sri Rahayu', 'K7WYBD', 'K7WYBD', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sri Rahayu', nisn = 'K7WYBD', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000000155319'::uuid, 'Sri Waliah', 'KS9HJJ', 'KS9HJJ', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sri Waliah', nisn = 'KS9HJJ', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000006bb007'::uuid, 'Suci Febrianti', '3UR5SE', '3UR5SE', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Suci Febrianti', nisn = '3UR5SE', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000056e8d612'::uuid, 'Sulthan Ulya Faza', 'K59RGF', 'K59RGF', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Sulthan Ulya Faza', nisn = 'K59RGF', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002c89f833'::uuid, 'SYABILA AZALIA PUTRI', 'JPY6VP', 'JPY6VP', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SYABILA AZALIA PUTRI', nisn = 'JPY6VP', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003be41fa5'::uuid, 'Syabila Rahmatya Fitriani', 'C5EXC3', 'C5EXC3', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syabila Rahmatya Fitriani', nisn = 'C5EXC3', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000010ff4f1d'::uuid, 'Syaddad Muhammad Alzam Al-Ghifari', 'JUEWQA', 'JUEWQA', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syaddad Muhammad Alzam Al-Ghifari', nisn = 'JUEWQA', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003aa5855d'::uuid, 'Syafara Azra Putri Ivana', 'WL4AEP', 'WL4AEP', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syafara Azra Putri Ivana', nisn = 'WL4AEP', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004eaa7042'::uuid, 'SYAHID AL GHIFARI AL- SYAHNAZ', 'ZGAQLA', 'ZGAQLA', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SYAHID AL GHIFARI AL- SYAHNAZ', nisn = 'ZGAQLA', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007f5e5f00'::uuid, 'SYAHIRA NAILAR ZAHIDA', 'XAYQ2A', 'XAYQ2A', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SYAHIRA NAILAR ZAHIDA', nisn = 'XAYQ2A', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000691f4cf0'::uuid, 'Syahriel Julianda', 'EWFDWG', 'EWFDWG', 'L', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syahriel Julianda', nisn = 'EWFDWG', gender = 'L', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007dd96e10'::uuid, 'Syaira Annastasya', 'RVAREP', 'RVAREP', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syaira Annastasya', nisn = 'RVAREP', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001ec279a6'::uuid, 'Syakiina Az`Zahra Intan Dwi Putri', 'EC753A', 'EC753A', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syakiina Az`Zahra Intan Dwi Putri', nisn = 'EC753A', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000031780d19'::uuid, 'SYAKINA AULIA KURNIAWAN', 'R57Y2V', 'R57Y2V', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SYAKINA AULIA KURNIAWAN', nisn = 'R57Y2V', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000040ae542'::uuid, 'Syakira Ayudya Sasabila', 'GR5XP4', 'GR5XP4', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syakira Ayudya Sasabila', nisn = 'GR5XP4', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000508b0737'::uuid, 'Syaqilla Angelia Setiawan', 'YGG3E2', 'YGG3E2', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syaqilla Angelia Setiawan', nisn = 'YGG3E2', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000349d3481'::uuid, 'Syaqira Rahmadiani', 'S4PB64', 'S4PB64', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Syaqira Rahmadiani', nisn = 'S4PB64', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000065974643'::uuid, 'SYERA PUTRI APRILIA', '9WK835', '9WK835', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'SYERA PUTRI APRILIA', nisn = '9WK835', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003137b4d2'::uuid, 'Talita Syafiyah Sakhi', 'NDL349', 'NDL349', 'L', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Talita Syafiyah Sakhi', nisn = 'NDL349', gender = 'L', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001bde6e89'::uuid, 'Tama Fhatur Rizki', 'B7SREJ', 'B7SREJ', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tama Fhatur Rizki', nisn = 'B7SREJ', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002a65a892'::uuid, 'Tanisha Firyal Hasti', 'W9XC5J', 'W9XC5J', 'P', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tanisha Firyal Hasti', nisn = 'W9XC5J', gender = 'P', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003a176f3d'::uuid, 'Tari Okta Elricka', 'YCK78U', 'YCK78U', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tari Okta Elricka', nisn = 'YCK78U', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006385d0e2'::uuid, 'Tarisa Lestari', 'M4GC8G', 'M4GC8G', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tarisa Lestari', nisn = 'M4GC8G', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002b8b913f'::uuid, 'Tessa Selfiani', 'PQSKSK', 'PQSKSK', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tessa Selfiani', nisn = 'PQSKSK', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003fb163f8'::uuid, 'Tessya Nur Alifah', 'JDX8ES', 'JDX8ES', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tessya Nur Alifah', nisn = 'JDX8ES', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000028c513f2'::uuid, 'Tiara Amelsha Emara', '4K237A', '4K237A', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Tiara Amelsha Emara', nisn = '4K237A', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000334d45f4'::uuid, 'TIARA SAKINAH SALSABILA', 'DZT8BL', 'DZT8BL', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'TIARA SAKINAH SALSABILA', nisn = 'DZT8BL', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000055480dd4'::uuid, 'TRIADI RAMADANI', 'YLWWPY', 'YLWWPY', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'TRIADI RAMADANI', nisn = 'YLWWPY', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000069bf5ff2'::uuid, 'Trias Dwiguna Kurniawan', 'RNPTW9', 'RNPTW9', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Trias Dwiguna Kurniawan', nisn = 'RNPTW9', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000069954ded'::uuid, 'Ulfa Nurfalah Hidayat', '5Y7X9W', '5Y7X9W', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Ulfa Nurfalah Hidayat', nisn = '5Y7X9W', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000034eccc60'::uuid, 'UMAY BAIHAKKI HIDAYAT', 'VMTV9P', 'VMTV9P', 'L', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'UMAY BAIHAKKI HIDAYAT', nisn = 'VMTV9P', gender = 'L', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000187d05ef'::uuid, 'VANESSA AULIA FEBRIANI ALVANES', 'MTWP67', 'MTWP67', 'P', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'VANESSA AULIA FEBRIANI ALVANES', nisn = 'MTWP67', gender = 'P', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000074dc5ce2'::uuid, 'Vania Ayu Sukmawati', '3RUJ2L', '3RUJ2L', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Vania Ayu Sukmawati', nisn = '3RUJ2L', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000290febc4'::uuid, 'Vania Febriani', '73KSRZ', '73KSRZ', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Vania Febriani', nisn = '73KSRZ', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004fe96ab6'::uuid, 'Vania Julianti Aryani', 'MVDAWW', 'MVDAWW', 'P', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Vania Julianti Aryani', nisn = 'MVDAWW', gender = 'P', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000055ecb34b'::uuid, 'VARIQ XAVIER VALZIKRI', 'W8PA8A', 'W8PA8A', 'L', 'murid19', '00000000-0000-4000-8000-0000519d2ce9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'VARIQ XAVIER VALZIKRI', nisn = 'W8PA8A', gender = 'L', class_id = '00000000-0000-4000-8000-0000519d2ce9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000658dedf5'::uuid, 'VERA DESTIANI', 'UPD66N', 'UPD66N', 'P', 'murid19', '00000000-0000-4000-8000-00000fb56fb6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'VERA DESTIANI', nisn = 'UPD66N', gender = 'P', class_id = '00000000-0000-4000-8000-00000fb56fb6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004d9326c2'::uuid, 'Vhiersha Vienna Aqshoika Priatna', 'K8PSFH', 'K8PSFH', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Vhiersha Vienna Aqshoika Priatna', nisn = 'K8PSFH', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000011c4f66b'::uuid, 'Vicky Ardiansyah', '5LGU6V', '5LGU6V', 'L', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Vicky Ardiansyah', nisn = '5LGU6V', gender = 'L', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007533274f'::uuid, 'Vika Meidina Adisti', 'KHBAQT', 'KHBAQT', 'P', 'murid19', '00000000-0000-4000-8000-0000324570be'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Vika Meidina Adisti', nisn = 'KHBAQT', gender = 'P', class_id = '00000000-0000-4000-8000-0000324570be'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000289d31c5'::uuid, 'Villaina Audya Putri', '67V5DY', '67V5DY', 'P', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Villaina Audya Putri', nisn = '67V5DY', gender = 'P', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000716b9b3c'::uuid, 'Wahyu', 'VU4BNU', 'VU4BNU', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Wahyu', nisn = 'VU4BNU', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000195d03c3'::uuid, 'WANDA ANDITA RAMADHANI SUKMAPUTRI', '4SFTQ7', '4SFTQ7', 'P', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'WANDA ANDITA RAMADHANI SUKMAPUTRI', nisn = '4SFTQ7', gender = 'P', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000052797c9'::uuid, 'Weninggalih Rubayya', 'TZPHW2', 'TZPHW2', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Weninggalih Rubayya', nisn = 'TZPHW2', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007f610823'::uuid, 'Wildan Kamil Nugraha', 'H4NGCK', 'H4NGCK', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Wildan Kamil Nugraha', nisn = 'H4NGCK', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00004332aa25'::uuid, 'Wildan Zulkifli Hermawan', '83DZY3', '83DZY3', 'L', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Wildan Zulkifli Hermawan', nisn = '83DZY3', gender = 'L', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000635d3a20'::uuid, 'WINDI ZAUHAIRA SARI MURTI', '99WUAS', '99WUAS', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'WINDI ZAUHAIRA SARI MURTI', nisn = '99WUAS', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00007902cf69'::uuid, 'Yahdini Nur Afifah', 'FNRRFE', 'FNRRFE', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Yahdini Nur Afifah', nisn = 'FNRRFE', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002d7632fb'::uuid, 'Yanuar Alifio Alfath', 'VY8BWU', 'VY8BWU', 'L', 'murid19', '00000000-0000-4000-8000-000009ad812f'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Yanuar Alifio Alfath', nisn = 'VY8BWU', gender = 'L', class_id = '00000000-0000-4000-8000-000009ad812f'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000007acca62'::uuid, 'Yasmine Kharisma Yudhistya', 'EHWD3Q', 'EHWD3Q', 'P', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Yasmine Kharisma Yudhistya', nisn = 'EHWD3Q', gender = 'P', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002ff46c79'::uuid, 'Yuda Saputra', 'R949G2', 'R949G2', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Yuda Saputra', nisn = 'R949G2', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00002303f85c'::uuid, 'Yulistia Syahwani', 'AWZL5Y', 'AWZL5Y', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Yulistia Syahwani', nisn = 'AWZL5Y', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000004fdca6f'::uuid, 'Zahira Nurasyfa', 'CR75EY', 'CR75EY', 'P', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahira Nurasyfa', nisn = 'CR75EY', gender = 'P', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00003ac5f4d4'::uuid, 'Zahra', 'DP2T8F', 'DP2T8F', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahra', nisn = 'DP2T8F', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000005e19fda'::uuid, 'Zahra Almira', 'W4ZGFF', 'W4ZGFF', 'P', 'murid19', '00000000-0000-4000-8000-00006c67f2a3'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahra Almira', nisn = 'W4ZGFF', gender = 'P', class_id = '00000000-0000-4000-8000-00006c67f2a3'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000008aa83ba'::uuid, 'Zahra Nur Syahfitri', 'ZS7QMP', 'ZS7QMP', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahra Nur Syahfitri', nisn = 'ZS7QMP', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000076f527e9'::uuid, 'Zahra Zita Aqila', '237SM7', '237SM7', 'P', 'murid19', '00000000-0000-4000-8000-000018e27fd9'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahra Zita Aqila', nisn = '237SM7', gender = 'P', class_id = '00000000-0000-4000-8000-000018e27fd9'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00001a245bea'::uuid, 'Zahran Adzikra Moelyono', 'HVLUMP', 'HVLUMP', 'P', 'murid19', '00000000-0000-4000-8000-000048701cc6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahran Adzikra Moelyono', nisn = 'HVLUMP', gender = 'P', class_id = '00000000-0000-4000-8000-000048701cc6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000053aec5f4'::uuid, 'Zahwa Nurul Zulfah', 'VAH9L4', 'VAH9L4', 'P', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zahwa Nurul Zulfah', nisn = 'VAH9L4', gender = 'P', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006213e01d'::uuid, 'Zaid Atstsaqib', 'A5YGGX', 'A5YGGX', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zaid Atstsaqib', nisn = 'A5YGGX', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000489397e5'::uuid, 'Zakira Khuzaima', 'GAB6FM', 'GAB6FM', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zakira Khuzaima', nisn = 'GAB6FM', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000299af28b'::uuid, 'ZASKIA ADELIA PASHA', 'KWEG5B', 'KWEG5B', 'P', 'murid19', '00000000-0000-4000-8000-00000b155604'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ZASKIA ADELIA PASHA', nisn = 'KWEG5B', gender = 'P', class_id = '00000000-0000-4000-8000-00000b155604'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000683def64'::uuid, 'Zayda Bintang Quinza', 'JSBMCC', 'JSBMCC', 'L', 'murid19', '00000000-0000-4000-8000-000071080c55'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zayda Bintang Quinza', nisn = 'JSBMCC', gender = 'L', class_id = '00000000-0000-4000-8000-000071080c55'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000020880ad1'::uuid, 'Zelda Raisya Ramadhani', 'HVN9JR', 'HVN9JR', 'P', 'murid19', '00000000-0000-4000-8000-0000563d469b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zelda Raisya Ramadhani', nisn = 'HVN9JR', gender = 'P', class_id = '00000000-0000-4000-8000-0000563d469b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000013452ab3'::uuid, 'Zhifara Nuraulia Ramadhani', 'YBQBYB', 'YBQBYB', 'L', 'murid19', '00000000-0000-4000-8000-00002918609b'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zhifara Nuraulia Ramadhani', nisn = 'YBQBYB', gender = 'L', class_id = '00000000-0000-4000-8000-00002918609b'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000068c31f61'::uuid, 'Zhifara Nuraulia Ramadhani', 'LB8SPP', 'LB8SPP', 'L', 'murid19', '00000000-0000-4000-8000-00004d103678'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zhifara Nuraulia Ramadhani', nisn = 'LB8SPP', gender = 'L', class_id = '00000000-0000-4000-8000-00004d103678'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-00006ac2bbfa'::uuid, 'Zhifara Nuraulia Ramadhani', 'HYGSQJ', 'HYGSQJ', 'L', 'murid19', '00000000-0000-4000-8000-000014426627'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zhifara Nuraulia Ramadhani', nisn = 'HYGSQJ', gender = 'L', class_id = '00000000-0000-4000-8000-000014426627'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-0000189a5678'::uuid, 'Zhifara Nuraulia Ramadhani', 'RG3KQL', 'RG3KQL', 'L', 'murid19', '00000000-0000-4000-8000-00002da5570c'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'Zhifara Nuraulia Ramadhani', nisn = 'RG3KQL', gender = 'L', class_id = '00000000-0000-4000-8000-00002da5570c'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;
INSERT INTO public.students (id, name, student_code, nisn, gender, password, class_id, school_id)
VALUES ('00000000-0000-4000-8000-000077c20725'::uuid, 'ZUANS ZUMAR SHAFALA', 'A2Y586', 'A2Y586', 'L', 'murid19', '00000000-0000-4000-8000-0000759502c6'::uuid, 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid)
ON CONFLICT (id) DO UPDATE SET name = 'ZUANS ZUMAR SHAFALA', nisn = 'A2Y586', gender = 'L', class_id = '00000000-0000-4000-8000-0000759502c6'::uuid, school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;

COMMIT;
