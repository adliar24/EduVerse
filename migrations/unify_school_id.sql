-- Migration: Unify all data under 1 Single Active School ID for SMAN 19 Bandung
-- Canonical School ID: fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7

BEGIN;

-- 1. Ensure SMAN 19 Bandung exists with the canonical UUID
INSERT INTO public.schools (id, name, school_name, address, created_at)
VALUES (
    'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid,
    'SMAN 19 Bandung',
    'SMAN 19 Bandung',
    'Jl. Dago Spesial No. 1, Bandung',
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET name = 'SMAN 19 Bandung', school_name = 'SMAN 19 Bandung';

-- 2. Update all classes to point to the canonical school ID
UPDATE public.classes
SET school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid
WHERE school_id IS NULL OR school_id != 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;

-- 3. Update all students to point to the canonical school ID
UPDATE public.students
SET school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid
WHERE school_id IS NULL OR school_id != 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;

-- 4. Update teacher profiles to point to the canonical school ID
UPDATE public.teacher_profiles
SET school_id = 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid
WHERE school_id IS NULL OR school_id != 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;

-- 5. Delete duplicate / stray schools that do not match canonical ID
DELETE FROM public.schools
WHERE id != 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'::uuid;

COMMIT;
