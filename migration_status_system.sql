-- ============================================
-- MIGRATION: Add Status Management Columns
-- Run this script to add new columns to participants table
-- ============================================

-- Add is_locked column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'is_locked') THEN
    ALTER TABLE public.participants ADD COLUMN is_locked BOOLEAN DEFAULT false;
    RAISE NOTICE 'Column is_locked added successfully';
  ELSE
    RAISE NOTICE 'Column is_locked already exists';
  END IF;
END $$;

-- Add last_position column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'last_position') THEN
    ALTER TABLE public.participants ADD COLUMN last_position INTEGER DEFAULT 0;
    RAISE NOTICE 'Column last_position added successfully';
  ELSE
    RAISE NOTICE 'Column last_position already exists';
  END IF;
END $$;

-- Create index for faster queries on is_locked and status
CREATE INDEX IF NOT EXISTS idx_participants_is_locked ON public.participants(is_locked);
CREATE INDEX IF NOT EXISTS idx_participants_status_locked ON public.participants(status, is_locked);

-- ============================================
-- RLS Policies (if needed)
-- ============================================
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Allow public access to participants for exam functionality
DROP POLICY IF EXISTS "Public all participants" ON public.participants;
CREATE POLICY "Public all participants" ON public.participants FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON public.participants TO anon;
GRANT ALL ON public.participants TO authenticated;

-- ============================================
-- Verify the columns were added
-- ============================================
SELECT 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'participants' 
AND column_name IN ('is_locked', 'last_position', 'violations', 'status');
