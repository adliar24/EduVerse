-- Migration: Update class subjects to official assigned subjects
-- X-A s/d X-E: Seni Rupa
-- X-F s/d X-K: Informatika
-- XI-B s/d XI-G: PKWU
-- XI-H: Seni Rupa

BEGIN;

UPDATE public.classes SET subject = 'Seni Rupa' WHERE name IN ('X-A', 'X-B', 'X-C', 'X-D', 'X-E', 'XI-H');
UPDATE public.classes SET subject = 'Informatika' WHERE name IN ('X-F', 'X-G', 'X-H', 'X-I', 'X-J', 'X-K');
UPDATE public.classes SET subject = 'PKWU' WHERE name IN ('XI-A', 'XI-B', 'XI-C', 'XI-D', 'XI-E', 'XI-F', 'XI-G');

COMMIT;
