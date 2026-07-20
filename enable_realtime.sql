-- Enable Realtime for participants table
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;

-- Also enable for exam_sessions if needed
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_sessions;
