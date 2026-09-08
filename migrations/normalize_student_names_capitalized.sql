-- ==============================================================================
-- Migration: Menyelaraskan Format Nama Murid ke Mode "Capitalize Each Word"
-- Mengubah huruf pertama pada setiap kata menjadi huruf kapital untuk data yang ada di database.
-- ==============================================================================

-- 1. Normalisasi nama murid di tabel students
UPDATE students
SET name = initcap(regexp_replace(trim(name), '\s+', ' ', 'g'))
WHERE name IS NOT NULL AND name != '';

-- 2. Normalisasi nama murid di riwayat pengerjaan ujian (tabel participants)
UPDATE participants
SET name = initcap(regexp_replace(trim(name), '\s+', ' ', 'g'))
WHERE name IS NOT NULL AND name != '';

-- 3. Normalisasi nama murid di rekapitulasi statistik peserta sesi ujian (jika tabel ada)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'exam_session_participant_stats'
  ) THEN
    UPDATE exam_session_participant_stats
    SET participant_name = initcap(regexp_replace(trim(participant_name), '\s+', ' ', 'g'))
    WHERE participant_name IS NOT NULL AND participant_name != '';
  END IF;
END $$;
