-- =========================================================================
-- FIX: Drop restrictive FKs on attendance tables to allow offline-first sync
-- Teacher_id FK is sufficient for security (RLS policies use it)
-- =========================================================================

-- 1. Drop FK constraints that block sync when related data is not yet in cloud
ALTER TABLE public.attendance_sessions 
  DROP CONSTRAINT IF EXISTS attendance_sessions_class_id_fkey,
  ALTER COLUMN class_id DROP NOT NULL;

ALTER TABLE public.attendance_sessions 
  DROP CONSTRAINT IF EXISTS attendance_sessions_school_id_fkey,
  ALTER COLUMN school_id DROP NOT NULL;

ALTER TABLE public.attendance_records 
  DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey,
  ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE public.attendance_records 
  DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey,
  ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE public.attendance_records 
  DROP CONSTRAINT IF EXISTS attendance_records_school_id_fkey,
  ALTER COLUMN school_id DROP NOT NULL;

-- 2. Ensure is_closed column exists
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;

-- 3. Same for classes and students - make school_id nullable for sync resilience
ALTER TABLE public.classes 
  DROP CONSTRAINT IF EXISTS classes_school_id_fkey,
  ALTER COLUMN school_id DROP NOT NULL;

ALTER TABLE public.students 
  DROP CONSTRAINT IF EXISTS students_school_id_fkey,
  ALTER COLUMN school_id DROP NOT NULL;
