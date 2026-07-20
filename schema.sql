-- ==============================================
-- Database Schema for EduTest - Exam Session Stats
-- ==============================================

-- Table: exam_session_stats
-- Description: Menyimpan rekap statistik per sesi ujian (ringkasan)
CREATE TABLE IF NOT EXISTS exam_session_stats (
    session_id UUID PRIMARY KEY,
    exam_id UUID,
    total_students INT DEFAULT 0,
    participants_count INT DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    highest_score DECIMAL(5,2) DEFAULT 0,
    lowest_score DECIMAL(5,2) DEFAULT 0,
    passed_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    remedial_count INT DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: exam_session_participant_stats
-- Description: Menyimpan rekap statistik per siswa dalam setiap sesi ujian
CREATE TABLE IF NOT EXISTS exam_session_participant_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    exam_id UUID,
    participant_id UUID,
    participant_name TEXT,
    participant_class TEXT,
    score DECIMAL(5,2) DEFAULT 0,
    correct_count INT DEFAULT 0,
    incorrect_count INT DEFAULT 0,
    unanswered_count INT DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, participant_id)
);

-- Enable Row Level Security
ALTER TABLE exam_session_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_session_participant_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (will work if exams table exists, otherwise just grant access)
DROP POLICY IF EXISTS "Allow teachers to read exam_session_stats" ON exam_session_stats;
CREATE POLICY "Allow teachers to read exam_session_stats" ON exam_session_stats
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow teachers to read exam_session_participant_stats" ON exam_session_participant_stats;
CREATE POLICY "Allow teachers to read exam_session_participant_stats" ON exam_session_participant_stats
    FOR SELECT TO authenticated USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_session_stats_exam_id ON exam_session_stats(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_session_participant_stats_session_id ON exam_session_participant_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_session_participant_stats_exam_id ON exam_session_participant_stats(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_session_participant_stats_participant_id ON exam_session_participant_stats(participant_id);

-- ==============================================
-- NOTE: Run this SQL in your Supabase SQL Editor
-- ==============================================
