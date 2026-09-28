-- Migrasi: Dukungan LKPD Interaktif pada Tabel Assignments
-- Menambahkan kolom assignment_type, lkpd_type, dan lkpd_config

ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'general';

ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS lkpd_type TEXT;

ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS lkpd_config JSONB;

-- Komentar kolom
COMMENT ON COLUMN public.assignments.assignment_type IS 'Tipe penugasan: general (standar) atau lkpd (Lembar Kerja Peserta Didik)';
COMMENT ON COLUMN public.assignments.lkpd_type IS 'Sub-tipe LKPD: observation, experiment, case_study, interview';
COMMENT ON COLUMN public.assignments.lkpd_config IS 'Konfigurasi template/aspek observasi atau pertanyaan LKPD';
