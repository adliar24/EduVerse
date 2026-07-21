-- Tabel Template Poin Perilaku (EduScore)
CREATE TABLE IF NOT EXISTS public.point_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INT DEFAULT 0,
  type TEXT NOT NULL, -- 'positive' atau 'negative'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Matikan RLS untuk point_templates (agar kompatibel dengan skema tabel EduScore lainnya)
ALTER TABLE public.point_templates DISABLE ROW LEVEL SECURITY;

-- Grant permissions untuk point_templates
GRANT ALL ON public.point_templates TO authenticated;
GRANT ALL ON public.point_templates TO anon;
GRANT ALL ON public.point_templates TO service_role;

-- Grant permissions untuk tabel EduScore & Classes yang bermasalah RLS/403
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.classes TO anon;
GRANT ALL ON public.classes TO service_role;

GRANT ALL ON public.learning_objectives TO authenticated;
GRANT ALL ON public.learning_objectives TO anon;
GRANT ALL ON public.learning_objectives TO service_role;

GRANT ALL ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO anon;
GRANT ALL ON public.meetings TO service_role;

GRANT ALL ON public.meeting_scores TO authenticated;
GRANT ALL ON public.meeting_scores TO anon;
GRANT ALL ON public.meeting_scores TO service_role;

GRANT ALL ON public.student_points TO authenticated;
GRANT ALL ON public.student_points TO anon;
GRANT ALL ON public.student_points TO service_role;

GRANT ALL ON public.final_grades TO authenticated;
GRANT ALL ON public.final_grades TO anon;
GRANT ALL ON public.final_grades TO service_role;
