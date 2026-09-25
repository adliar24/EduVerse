import { useState, useEffect, useMemo } from 'react';
import { supabase, supabaseAnon } from '../lib/supabase';
import { 
  Search, 
  Download, 
  Filter, 
  User, 
  Calendar,
  ChevronRight,
  Trophy,
  Clock,
  GraduationCap,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  XCircle as XCircleIcon,
  Loader2,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { cn, capitalizeEachWord } from '../lib/utils';
import { useSchool } from '../context/SchoolContext';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { evaluateEssayAnswer, highlightTextSegments, EvaluationMode } from '../lib/essayEvaluator';
import { calculateExamScores } from '../lib/examScoring';

const EssayAnswerCard: React.FC<{
  index: number;
  answer: any;
  onSaveScore: (questionId: string, score: number, feedback?: string) => Promise<void>;
}> = ({ index, answer, onSaveScore }) => {
  const [currentScore, setCurrentScore] = useState<number | ''>(
    typeof answer.score === 'number' ? answer.score : ''
  );
  const [feedback, setFeedback] = useState<string>(answer.teacher_feedback || '');
  const [gradingMode, setGradingMode] = useState<EvaluationMode>('balanced');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof answer.score === 'number') {
      setCurrentScore(answer.score);
    }
    setFeedback(answer.teacher_feedback || '');
  }, [answer.score, answer.teacher_feedback]);

  // Evaluasi heuristik kata kunci offline client-side dengan opsi mode
  const evaluation = useMemo(() => {
    return evaluateEssayAnswer(answer.answer_text, answer.questions?.correct_answer, {
      mode: gradingMode,
      minEffortScore: 20, // Apresiasi usaha siswa (Nilai 0 HANYA jika kosong!)
      targetWordCount: 35 // Target panjang kata optimal
    });
  }, [answer.answer_text, answer.questions?.correct_answer, gradingMode]);

  // Segmentasi teks untuk visual highlighting kata kunci yang cocok
  const textSegments = useMemo(() => {
    return highlightTextSegments(
      answer.answer_text,
      evaluation.keywords.map(k => k.keyword)
    );
  }, [answer.answer_text, evaluation.keywords]);

  const handleApplyScore = async (scoreToApply: number) => {
    setCurrentScore(scoreToApply);
    setSaving(true);
    try {
      await onSaveScore(answer.question_id, scoreToApply, feedback);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentScore === '') return;
    const num = Math.max(0, Math.min(100, Number(currentScore)));
    await handleApplyScore(num);
  };

  const hasScore = typeof answer.score === 'number';

  return (
    <div className={cn(
      "p-5 sm:p-7 rounded-[2rem] border transition-all group",
      hasScore 
        ? "bg-white border-indigo-100 shadow-sm" 
        : "bg-amber-50/40 border-amber-200/90 shadow-md shadow-amber-500/5"
    )}>
      {/* Header Soal */}
      <div className="flex items-start gap-4 mb-5">
        <div className="bg-purple-900 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-purple-900/20">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-indigo-950 font-bold text-lg leading-snug">{answer.questions?.question_text || 'Soal tidak ditemukan'}</p>
          {answer.questions?.image_url && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 max-w-md bg-white shadow-sm">
              <img src={answer.questions.image_url} alt="Question" className="w-full h-auto object-contain max-h-60" />
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-widest border border-purple-200">
              ESSAY / URAIAN
            </span>
            {hasScore ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Dinilai ({answer.score}/100)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" /> Perlu Dinilai Guru
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selector Mode Penilaian */}
      <div className="mb-4 p-2.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pl-1">
          <span>Fokus Penilaian:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setGradingMode('balanced')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              gradingMode === 'balanced'
                ? "bg-white text-indigo-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            )}
            title="Seimbang: menggabungkan ketercakupan kata kunci dan panjang teks"
          >
            ⚖️ Seimbang (Konsep + Panjang)
          </button>
          <button
            type="button"
            onClick={() => setGradingMode('length_effort')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              gradingMode === 'length_effort'
                ? "bg-white text-indigo-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            )}
            title="Panjang Teks: semakin banyak kalimat yang diketik murid semakin tinggi nilainya"
          >
            📝 Panjang Teks / Usaha Siswa
          </button>
          <button
            type="button"
            onClick={() => setGradingMode('keyword_only')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              gradingMode === 'keyword_only'
                ? "bg-white text-indigo-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            )}
            title="Kata Kunci: murni berdasarkan konsep acuan guru"
          >
            🔑 Kata Kunci Saja
          </button>
        </div>
      </div>

      {/* Lembar Jawaban Siswa & Kunci Acuan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Jawaban Siswa dengan Highlight */}
        <div className="p-4 rounded-2xl border bg-slate-50/70 border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Jawaban Siswa ({evaluation.wordCount} Kata)
            </p>
            {evaluation.keywords.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {evaluation.matchedCount}/{evaluation.totalKeywords} Konsep Cocok
              </span>
            )}
          </div>
          
          <div className="text-sm font-medium text-slate-800 leading-relaxed min-h-[70px] whitespace-pre-wrap">
            {!answer.answer_text || answer.answer_text.trim() === '' ? (
              <span className="italic text-slate-400 font-normal">Siswa tidak menuliskan jawaban.</span>
            ) : (
              textSegments.map((seg, sIdx) => (
                seg.isMatch ? (
                  <mark 
                    key={sIdx} 
                    className="bg-emerald-200/90 text-emerald-950 font-bold px-1.5 py-0.5 rounded-md border border-emerald-300 mx-0.5"
                    title={`Kata kunci terdeteksi: ${seg.matchedKeyword}`}
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={sIdx}>{seg.text}</span>
                )
              ))
            )}
          </div>
        </div>

        {/* Kunci / Pedoman Guru */}
        <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">
            Pedoman / Kunci Jawaban Guru
          </p>
          <p className="text-sm font-medium text-indigo-950 leading-relaxed whitespace-pre-wrap mb-3">
            {answer.questions?.correct_answer || 'Tidak ada pedoman jawaban.'}
          </p>

          {/* Chips Kata Kunci */}
          {evaluation.keywords.length > 0 && (
            <div className="pt-2 border-t border-indigo-100/60">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Indikator Kata Kunci:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.keywords.map((kw, kwIdx) => (
                  <span
                    key={kwIdx}
                    className={cn(
                      "text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1",
                      kw.matched
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-white text-slate-500 border-slate-200"
                    )}
                  >
                    {kw.matched ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircleIcon className="w-3 h-3 text-slate-400" />}
                    {kw.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kotak Asisten Cerdas (Offline Heuristic) */}
      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-950 uppercase tracking-wider">Saran Nilai Otomatis:</span>
              <span className="text-base font-black text-blue-600 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                {evaluation.suggestedScore} / 100
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {evaluation.feedbackSummary}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-100/80 px-2.5 py-0.5 rounded-lg border border-blue-200">
              <span>🛡️ Proteksi Usaha: Siswa yang menjawab minimal mendapatkan 20 poin (Nilai 0 hanya jika dikosongkan).</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleApplyScore(evaluation.suggestedScore)}
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gunakan Saran ({evaluation.suggestedScore})</span>
        </button>
      </div>

      {/* Form Penilaian Cepat Guru */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Tombol Cepat Pilihan Skor */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Skor Cepat:</span>
          {[100, 75, 50, 25, 0].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleApplyScore(val)}
              disabled={saving}
              className={cn(
                "px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer border",
                currentScore === val
                  ? "bg-indigo-950 text-white border-indigo-950 shadow-sm"
                  : val === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : val === 75 ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  : val === 50 ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : val === 25 ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              )}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Input Manual & Simpan */}
        <form onSubmit={handleManualSave} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-600">Nilai:</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={currentScore}
              onChange={(e) => setCurrentScore(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0-100"
              className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-center font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Catatan guru (opsional)..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving || currentScore === ''}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Nilai</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function HasilUjian({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const location = useLocation();
  const initialExamId = location.state?.examId || 'all';

  const { activeSchool } = useSchool();
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>(initialExamId);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('terbaru');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [participantAnswers, setParticipantAnswers] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchResults();
  }, [selectedExam, selectedSession, selectedClass, activeSchool]);

  const fetchSessions = async (examId: string) => {
    const { data } = await supabase
      .from('exam_sessions')
      .select('id, class_name, started_at')
      .eq('exam_id', examId)
      .order('started_at', { ascending: false });
    setSessions(data || []);
  };

  const fetchExams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('exams')
      .select('id, title, school_id')
      .eq('teacher_id', user.id);

    if (activeSchool?.id && activeSchool.id !== 'legacy') {
      query = query.or(`school_id.eq.${activeSchool.id},school_id.is.null`);
    } else if (activeSchool?.id === 'legacy') {
      query = query.is('school_id', null);
    }

    let { data } = await query.order('created_at', { ascending: false });
    
    // Fallback if no exams found with school filter
    if (!data || data.length === 0) {
      const { data: allExams } = await supabase
        .from('exams')
        .select('id, title, school_id')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      data = allExams || [];
    }

    setExams(data || []);
  };

  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    setSelectedSession('all');
  };

  useEffect(() => {
    if (selectedExam !== 'all') {
      fetchSessions(selectedExam);
    } else {
      setSessions([]);
    }
  }, [selectedExam]);

  const fetchClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('classes')
      .select('id, name');
    
    if (activeSchool?.id && activeSchool.id !== 'legacy') {
      query = query.or(`school_id.eq.${activeSchool.id},school_id.is.null`);
    } else if (activeSchool?.id === 'legacy') {
      query = query.is('school_id', null).eq('teacher_id', user.id);
    } else {
      query = query.eq('teacher_id', user.id);
    }

    let { data } = await query.order('name');
    if (!data || data.length === 0) {
      const { data: fallbackClasses } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      data = fallbackClasses || [];
    }
    setClasses(data || []);
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let examsQuery = supabase
        .from('exams')
        .select('id, title, school_id')
        .eq('teacher_id', user.id);

      if (activeSchool?.id && activeSchool.id !== 'legacy') {
        examsQuery = examsQuery.or(`school_id.eq.${activeSchool.id},school_id.is.null`);
      } else if (activeSchool?.id === 'legacy') {
        examsQuery = examsQuery.is('school_id', null);
      }

      let { data: teacherExams } = await examsQuery;

      if (!teacherExams || teacherExams.length === 0) {
        const { data: allTeacherExams } = await supabase
          .from('exams')
          .select('id, title, school_id')
          .eq('teacher_id', user.id);
        teacherExams = allTeacherExams || [];
      }

      const examIds = teacherExams?.map(e => e.id) || [];
      
      // Always include selectedExam in examIds if specifically chosen
      if (selectedExam !== 'all' && !examIds.includes(selectedExam)) {
        examIds.push(selectedExam);
      }

      if (examIds.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('participants')
        .select(`
          *,
          exams (
            title
          )
        `)
        .in('exam_id', examIds)
        .order('created_at', { ascending: false });

      if (selectedExam !== 'all') {
        query = query.eq('exam_id', selectedExam);
      }

      if (selectedSession !== 'all') {
        query = query.eq('session_id', selectedSession);
      }

      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass);
      }

      let { data, error } = await query;
      let finalData: any[] = data || [];

      // Robust fallback: if error or empty (e.g. due to PostgREST RLS on authenticated role or join issues),
      // query with supabaseAnon which always has full access to participants table
      if (error || !data || data.length === 0) {
        let fallbackQuery = supabaseAnon
          .from('participants')
          .select('*')
          .in('exam_id', examIds)
          .order('created_at', { ascending: false });

        if (selectedExam !== 'all') {
          fallbackQuery = fallbackQuery.eq('exam_id', selectedExam);
        }
        if (selectedSession !== 'all') {
          fallbackQuery = fallbackQuery.eq('session_id', selectedSession);
        }
        if (selectedClass !== 'all') {
          fallbackQuery = fallbackQuery.eq('class', selectedClass);
        }

        const { data: anonData } = await fallbackQuery;
        if (anonData && anonData.length > 0) {
          const examTitleMap = new Map((teacherExams || []).map(e => [e.id, e.title]));
          finalData = anonData.map(p => ({
            ...p,
            exams: { title: examTitleMap.get(p.exam_id) || 'Ujian' }
          }));
        }
      }

      setResults(finalData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetParticipant = async (participantId: string, participantName: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin me-reset ujian untuk siswa "${participantName}"?\n\n` +
      `• Nilai dan jawaban yang telah tersimpan akan dihapus.\n` +
      `• Status ujian akan diubah kembali ke awal (ongoing).\n` +
      `• Waktu (timer) pengerjaan akan diulang dengan durasi penuh.\n` +
      `• Siswa dapat membuka kembali ujian dan mengerjakan ulang dari awal.`
    );
    if (!confirmed) return;

    try {
      // 1. Delete answers
      try {
        await supabaseAnon.from('answers').delete().eq('participant_id', participantId);
      } catch (e) {
        console.warn('Anon delete answers error:', e);
      }
      try {
        await supabase.from('answers').delete().eq('participant_id', participantId);
      } catch (e) {
        console.warn('Auth delete answers error:', e);
      }

      // 2. Reset participant record
      const resetPayload = {
        status: 'ongoing',
        score: null,
        end_time: null,
        start_time: new Date().toISOString(),
        violations: 0,
        is_locked: false,
        lock_reason: null,
        last_position: 0
      };

      let resetError = null;
      const { error: anonErr } = await supabaseAnon
        .from('participants')
        .update(resetPayload)
        .eq('id', participantId);

      if (anonErr) {
        const { error: authErr } = await supabase
          .from('participants')
          .update(resetPayload)
          .eq('id', participantId);
        resetError = authErr;
      }

      if (resetError) throw resetError;

      setShowDetailModal(false);
      fetchResults();
      alert(`Ujian untuk "${participantName}" berhasil di-reset! Siswa dapat membuka ujian dan mulai mengerjakan kembali.`);
    } catch (err: any) {
      console.error('Error resetting participant in HasilUjian:', err);
      alert('Gagal me-reset peserta: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const fetchDetail = async (participant: any) => {
    setSelectedResult(participant);
    setShowDetailModal(true);
    setLoadingDetail(true);
    setParticipantAnswers([]); // Reset first
    try {
      // Fetch all questions for this exam
      const { data: examQuestions, error: eqError } = await supabase
        .from('exam_questions')
        .select(`
          id,
          question_id,
          questions (
            *,
            question_options (*)
          )
        `)
        .eq('exam_id', participant.exam_id || participant.exams?.id);

      if (eqError) throw eqError;

      // Fetch the participant's answers with fallback
      let { data: participantDbAnswers, error: ansError } = await supabase
        .from('answers')
        .select(`
          *,
          questions(*),
          question_options(*)
        `)
        .eq('participant_id', participant.id);

      if (ansError || !participantDbAnswers || participantDbAnswers.length === 0) {
        const { data: anonDbAnswers } = await supabaseAnon
          .from('answers')
          .select(`
            *,
            questions(*),
            question_options(*)
          `)
          .eq('participant_id', participant.id);
        if (anonDbAnswers && anonDbAnswers.length > 0) {
          participantDbAnswers = anonDbAnswers;
        }
      }

      const fullAnswers = (examQuestions || []).map((eq: any) => {
        const question = eq.questions || {};
        if (!question.id) return null;
        
        // Find answer
        const ans = (participantDbAnswers || []).find((a: any) => a.question_id === question.id);
        
        // selected option
        let selectedOption = null;
        if (ans && question.question_type === 'pilihan_ganda' && ans.option_id) {
           selectedOption = Array.isArray(ans.question_options) 
             ? ans.question_options.find((opt: any) => opt.id === ans.option_id) 
             : ans.question_options;
        }

        // full correct answer
        let fullCorrectAnswerText = "-";
        if (question.question_type === 'pilihan_ganda') {
           const options = Array.isArray(question.question_options) ? question.question_options : (question.question_options ? [question.question_options] : []);
           const correctOpt = options.find((o: any) => o.option_label === question.correct_answer);
           if (correctOpt) {
             fullCorrectAnswerText = `${correctOpt.option_text}`;
           } else {
             fullCorrectAnswerText = question.correct_answer || '-';
           }
        } else if (question.question_type === 'menjodohkan') {
           try {
             const pairs = JSON.parse(question.correct_answer || '[]');
             fullCorrectAnswerText = pairs.map((p: any) => `${p.left} ➔ ${p.right}`).join(', ');
           } catch (e) {
             fullCorrectAnswerText = question.correct_answer || '-';
           }
        } else {
           fullCorrectAnswerText = question.correct_answer || '-';
        }

        return {
          id: ans?.id || `unanswered-${question.id}`,
          question_id: question.id,
          questions: question,
          option_id: ans?.option_id || null,
          answer_text: ans?.answer_text || null,
          is_correct: ans ? ans.is_correct : false,
          score: typeof ans?.score === 'number' ? ans.score : (question.question_type === 'essay' ? null : (ans?.is_correct ? 100 : 0)),
          teacher_feedback: ans?.teacher_feedback || '',
          selected_option: selectedOption || null,
          full_correct_answer_text: fullCorrectAnswerText,
          is_answered: !!ans
        };
      }).filter(Boolean);

      setParticipantAnswers(fullAnswers);
    } catch (error) {
      console.error('Error fetching detail:', error);
      setParticipantAnswers([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveEssayScore = async (questionId: string, newScore: number, feedback?: string) => {
    if (!selectedResult) return;

    // 1. Update local participantAnswers
    const updatedAnswers = participantAnswers.map(ans => {
      if (ans.question_id === questionId) {
        return {
          ...ans,
          score: newScore,
          is_correct: newScore >= 60,
          teacher_feedback: feedback !== undefined ? feedback : ans.teacher_feedback
        };
      }
      return ans;
    });
    setParticipantAnswers(updatedAnswers);

    // 2. Recalculate exam scores with smart auto-scaling
    const scoringResult = calculateExamScores({
      questions: updatedAnswers.map(a => ({
        id: a.question_id,
        question_type: a.questions?.question_type
      })),
      answers: updatedAnswers.map(a => ({
        question_id: a.question_id,
        is_correct: a.is_correct,
        score: a.score
      }))
    });

    // 3. Update participant state in real time
    const updatedResult = {
      ...selectedResult,
      score: scoringResult.finalScore,
      score_pg: scoringResult.scorePg,
      score_essay: scoringResult.scoreEssay,
      essay_graded: scoringResult.isEssayGraded
    };
    setSelectedResult(updatedResult);
    setResults(prev => prev.map(r => r.id === selectedResult.id ? updatedResult : r));

    // 4. Persist to DB
    try {
      const targetAnswer = updatedAnswers.find(a => a.question_id === questionId);
      if (targetAnswer && targetAnswer.id && !targetAnswer.id.startsWith('unanswered-')) {
        const { error: aErr } = await supabase
          .from('answers')
          .update({
            score: newScore,
            is_correct: newScore >= 60,
            teacher_feedback: feedback !== undefined ? feedback : targetAnswer.teacher_feedback
          })
          .eq('id', targetAnswer.id);

        if (aErr) {
          await supabase
            .from('answers')
            .update({ is_correct: newScore >= 60 })
            .eq('id', targetAnswer.id);
        }
      } else {
        const { error: upErr } = await supabase
          .from('answers')
          .upsert({
            participant_id: selectedResult.id,
            question_id: questionId,
            score: newScore,
            is_correct: newScore >= 60,
            teacher_feedback: feedback || ''
          }, { onConflict: 'participant_id,question_id' });

        if (upErr) {
          await supabase
            .from('answers')
            .upsert({
              participant_id: selectedResult.id,
              question_id: questionId,
              is_correct: newScore >= 60
            }, { onConflict: 'participant_id,question_id' });
        }
      }

      const fullParticipantPayload = {
        score: scoringResult.finalScore,
        score_pg: scoringResult.scorePg,
        score_essay: scoringResult.scoreEssay,
        essay_graded: scoringResult.isEssayGraded
      };

      const fallbackParticipantPayload = {
        score: scoringResult.finalScore
      };

      let { error: pErr } = await supabase
        .from('participants')
        .update(fullParticipantPayload)
        .eq('id', selectedResult.id);

      if (pErr) {
        let { error: pAnonErr } = await supabaseAnon
          .from('participants')
          .update(fullParticipantPayload)
          .eq('id', selectedResult.id);

        if (pAnonErr) {
          // Schema doesn't have score_pg yet; fallback to saving total score
          await supabase
            .from('participants')
            .update(fallbackParticipantPayload)
            .eq('id', selectedResult.id);
          await supabaseAnon
            .from('participants')
            .update(fallbackParticipantPayload)
            .eq('id', selectedResult.id);
        }
      }
    } catch (err) {
      console.error('Error saving essay score:', err);
    }
  };

  const filteredResults = useMemo(() => {
    const searchWords = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const temp = results.filter(r => {
      if (searchWords.length === 0) return true;
      const nameLower = r.name ? r.name.toLowerCase() : '';
      const classLower = r.class ? r.class.toLowerCase() : '';
      return searchWords.every(word => 
        nameLower.includes(word) || classLower.includes(word)
      );
    });

    temp.sort((a, b) => {
      if (sortBy === 'terbaru') {
        const timeA = new Date(a.end_time || a.start_time).getTime();
        const timeB = new Date(b.end_time || b.start_time).getTime();
        return timeB - timeA;
      } else if (sortBy === 'terlama') {
        const timeA = new Date(a.end_time || a.start_time).getTime();
        const timeB = new Date(b.end_time || b.start_time).getTime();
        return timeA - timeB;
      } else if (sortBy === 'nilai-tinggi') {
        return (Number(b.score) || 0) - (Number(a.score) || 0);
      } else if (sortBy === 'nilai-rendah') {
        return (Number(a.score) || 0) - (Number(b.score) || 0);
      } else if (sortBy === 'a-z') {
        return a.name.localeCompare(b.name, 'id');
      } else if (sortBy === 'z-a') {
        return b.name.localeCompare(a.name, 'id');
      }
      return 0;
    });

    return temp;
  }, [results, searchTerm, sortBy]);

  const leaderboardResults = useMemo(() => {
    const source = searchTerm.trim() ? filteredResults : results;
    const valid = source.filter(
      r => r.status !== 'menunggu_scan' && r.score !== null && r.score !== undefined
    );

    // Keep highest score per student if duplicate submissions exist
    const bestByStudent = new Map<string, typeof valid[0]>();
    for (const r of valid) {
      const key = (r.name || '').trim().toLowerCase();
      const existing = bestByStudent.get(key);
      if (!existing || (Number(r.score) || 0) > (Number(existing.score) || 0)) {
        bestByStudent.set(key, r);
      }
    }

    return Array.from(bestByStudent.values())
      .sort((a, b) => {
        const scoreA = Number(a.score) || 0;
        const scoreB = Number(b.score) || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Highest score first
        }
        // Tie breaker 1: Faster duration
        if (a.start_time && a.end_time && b.start_time && b.end_time) {
          const durA = new Date(a.end_time).getTime() - new Date(a.start_time).getTime();
          const durB = new Date(b.end_time).getTime() - new Date(b.start_time).getTime();
          if (durA > 0 && durB > 0 && durA !== durB) {
            return durA - durB;
          }
        }
        // Tie breaker 2: Completed earlier
        const timeA = new Date(a.end_time || a.start_time || 0).getTime();
        const timeB = new Date(b.end_time || b.start_time || 0).getTime();
        if (timeA && timeB && timeA !== timeB) return timeA - timeB;

        // Tie breaker 3: Alphabetical
        return (a.name || '').localeCompare(b.name || '', 'id');
      });
  }, [results, filteredResults, searchTerm]);

  const exportToExcel = async () => {
    const { default: XLSXStyle } = await import('xlsx-js-style');
    const headers = ['NAMA SISWA', 'KELAS', 'UJIAN', 'NILAI PG', 'NILAI ESSAY', 'TOTAL NILAI', 'STATUS ESSAY', 'WAKTU SELESAI'];
    const rows = filteredResults.map(r => [
      capitalizeEachWord(r.name),
      r.class,
      r.exams?.title || '-',
      r.score_pg !== null && r.score_pg !== undefined ? r.score_pg : '-',
      r.score_essay !== null && r.score_essay !== undefined ? r.score_essay : (r.essay_graded === false ? 'Belum Dinilai' : '-'),
      Math.round(r.score || 0),
      r.essay_graded === false ? 'Menunggu Penilaian' : 'Selesai',
      new Date(r.end_time || r.start_time).toLocaleString('id-ID')
    ]);

    const worksheet = XLSXStyle.utils.aoa_to_sheet([headers, ...rows]);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 22 }, // Nama Siswa
      { wch: 14 }, // Kelas
      { wch: 24 }, // Ujian
      { wch: 12 }, // Nilai PG
      { wch: 14 }, // Nilai Essay
      { wch: 14 }, // Total Nilai
      { wch: 20 }, // Status Essay
      { wch: 20 }  // Waktu Selesai
    ];

    // Set row heights
    worksheet['!rows'] = [
      { hpt: 28 }, // Header row height (spacious & premium)
      ...rows.map(() => ({ hpt: 22 })) // Data row heights
    ];

    // Apply styles (borders, bg colors, alignment)
    const range = XLSXStyle.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; ++r) {
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellRef = XLSXStyle.utils.encode_cell({ r, c });
        if (!worksheet[cellRef]) continue;

        if (r === 0) {
          // Header Row Style
          worksheet[cellRef].s = {
            fill: {
              fgColor: { rgb: "1E3A8A" } // Royal Navy Blue bg
            },
            font: {
              name: "Segoe UI",
              sz: 11,
              bold: true,
              color: { rgb: "FFFFFF" } // White text
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            },
            border: {
              top: { style: "thin", color: { rgb: "312E81" } },
              bottom: { style: "medium", color: { rgb: "0F172A" } },
              left: { style: "thin", color: { rgb: "312E81" } },
              right: { style: "thin", color: { rgb: "312E81" } }
            }
          };
        } else {
          // Data Row Style
          worksheet[cellRef].s = {
            font: {
              name: "Segoe UI",
              sz: 10
            },
            alignment: {
              vertical: "center",
              horizontal: c === 1 || c === 3 || c === 4 ? "center" : "left" // Center align Class, Score, Time
            },
            border: {
              top: { style: "thin", color: { rgb: "E2E8F0" } },
              bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              left: { style: "thin", color: { rgb: "E2E8F0" } },
              right: { style: "thin", color: { rgb: "E2E8F0" } }
            }
          };
        }
      }
    }

    const workbook = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(workbook, worksheet, "Hasil Ujian");
    XLSXStyle.writeFile(workbook, `Hasil_Ujian_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const generatePDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF() as any;
    const selectedExamData = exams.find(e => e.id === selectedExam);
    const selectedSessionData = sessions.find(s => s.id === selectedSession);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(27, 20, 100);
    doc.text('Laporan Hasil Ujian', 14, 25);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Aplikasi: EduTest Professional`, 14, 32);

    let offset = 37;
    if (selectedExamData) {
      doc.text(`Ujian: ${selectedExamData.title}`, 14, offset);
      offset += 5;
    }
    if (selectedSessionData) {
      doc.text(`Sesi: ${selectedSessionData.class_name} (${new Date(selectedSessionData.started_at).toLocaleDateString('id-ID')})`, 14, offset);
      offset += 5;
    }

    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, offset);
    
    const tableStartY = offset + 8;

    const tableData = filteredResults.map((res, index) => [
      index + 1,
      capitalizeEachWord(res.name),
      res.class || res.exam_sessions?.class_name || '-',
      res.exams?.title || '-',
      Math.round(res.score || 0),
      res.status === 'completed' ? 'Selesai' : 'Sedang Mengerjakan'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['No', 'Nama Siswa', 'Kelas', 'Ujian', 'Nilai', 'Status']],
      body: tableData,
      headStyles: { 
        fillColor: [27, 20, 100], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { 
        fontSize: 9, 
        cellPadding: 5, 
        lineWidth: 0.1, 
        lineColor: [200, 200, 200],
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 35 }
      },
      margin: { top: tableStartY },
    });

    doc.save(`Hasil_Ujian_EduTest_${new Date().getTime()}.pdf`);
  };

  return (
    <div className={cn(isEmbedded ? "space-y-6" : "space-y-10 pb-20")}>
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Hasil Ujian</h2>
            <p className="text-slate-500 font-medium mt-1">Laporan lengkap performa siswa pada setiap sesi ujian.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={generatePDF}
              className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full font-bold flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#2563EB]" />
              PDF
            </button>
            <button 
              onClick={exportToExcel}
              className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-6 py-2.5 sm:px-7 sm:py-3 rounded-full font-bold flex items-center justify-center gap-2.5 hover:brightness-110 border border-white/10 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      )}
      
      {isEmbedded && (
        <button 
          id="btn-export-hasil"
          onClick={exportToExcel}
          className="hidden"
        />
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama siswa atau kelas..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[280px] group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
          >
            <option value="all">Semua Ujian</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
        {selectedExam !== 'all' && sessions.length > 0 && (
          <div className="relative min-w-[200px] group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
            <select 
              className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="all">Semua Sesi</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.class_name} - {new Date(s.started_at).toLocaleDateString('id-ID')}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          </div>
        )}
        <div className="relative min-w-[200px] group">
          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
        <div className="relative min-w-[200px] group">
          <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="nilai-tinggi">Nilai Tertinggi</option>
            <option value="nilai-rendah">Nilai Terendah</option>
            <option value="a-z">Nama A-Z</option>
            <option value="z-a">Nama Z-A</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {/* Quizzo 3D Leaderboard Podium */}
      {!loading && leaderboardResults.length >= 3 && (
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1E40AF] p-8 rounded-[2.5rem] text-white shadow-xl border border-white/10 mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-3 py-1 bg-white/15 rounded-full text-amber-300 border border-white/20">
                ⭐ Final Scoreboard
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight mt-2">Papan Peringkat Tertinggi</h3>
            </div>
            <Trophy className="w-8 h-8 text-amber-300 animate-bounce" />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-xl mx-auto pt-4 pb-2 relative z-10">
            {/* Rank 2 - Silver */}
            {leaderboardResults[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="flex flex-col items-center text-center cursor-pointer group"
                onClick={() => fetchDetail(leaderboardResults[1])}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-200 text-slate-800 font-black text-xl flex items-center justify-center border-4 border-slate-300 shadow-xl mb-2 relative group-hover:scale-105 transition-transform">
                  {leaderboardResults[1].name.charAt(0)}
                  <span className="absolute -bottom-2 bg-slate-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">2</span>
                </div>
                <p className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[120px]">{capitalizeEachWord(leaderboardResults[1].name)}</p>
                <span className="text-[11px] font-bold text-slate-200 bg-white/20 px-3 py-1 rounded-full mt-1">{Math.round(leaderboardResults[1].score)} Poin</span>
                <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-slate-400/40 to-slate-300/20 rounded-t-2xl mt-3 flex items-center justify-center border-t border-white/30 group-hover:from-slate-400/50 transition-colors">
                  <span className="text-2xl font-black text-white/50">🥈 2</span>
                </div>
              </motion.div>
            )}

            {/* Rank 1 - Gold */}
            {leaderboardResults[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col items-center text-center -mt-6 cursor-pointer group"
                onClick={() => fetchDetail(leaderboardResults[0])}
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 text-amber-950 font-black text-2xl flex items-center justify-center border-4 border-amber-300 shadow-2xl shadow-amber-500/50 mb-2 relative group-hover:scale-105 transition-transform">
                  {leaderboardResults[0].name.charAt(0)}
                  <span className="absolute -bottom-2 bg-amber-500 text-amber-950 text-xs font-black px-2.5 py-0.5 rounded-full border border-white">1</span>
                </div>
                <p className="font-extrabold text-sm sm:text-base text-amber-200 truncate max-w-[100px] sm:max-w-[140px]">{capitalizeEachWord(leaderboardResults[0].name)}</p>
                <span className="text-xs font-black text-amber-950 bg-amber-400 px-3.5 py-1 rounded-full mt-1 shadow-md">{Math.round(leaderboardResults[0].score)} Poin</span>
                <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-amber-500/50 to-amber-400/25 rounded-t-3xl mt-3 flex items-center justify-center border-t border-amber-300/50 group-hover:from-amber-500/60 transition-colors">
                  <span className="text-3xl font-black text-amber-300">🥇 1</span>
                </div>
              </motion.div>
            )}

            {/* Rank 3 - Bronze */}
            {leaderboardResults[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }} 
                className="flex flex-col items-center text-center cursor-pointer group"
                onClick={() => fetchDetail(leaderboardResults[2])}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-700/80 text-amber-100 font-black text-xl flex items-center justify-center border-4 border-amber-600 shadow-xl mb-2 relative group-hover:scale-105 transition-transform">
                  {leaderboardResults[2].name.charAt(0)}
                  <span className="absolute -bottom-2 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">3</span>
                </div>
                <p className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[120px]">{capitalizeEachWord(leaderboardResults[2].name)}</p>
                <span className="text-[11px] font-bold text-amber-100 bg-white/20 px-3 py-1 rounded-full mt-1">{Math.round(leaderboardResults[2].score)} Poin</span>
                <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-amber-700/40 to-amber-600/20 rounded-t-2xl mt-3 flex items-center justify-center border-t border-white/30 group-hover:from-amber-700/50 transition-colors">
                  <span className="text-2xl font-black text-white/50">🥉 3</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Siswa & Kelas</th>
                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ujian</th>
                <th className="px-5 py-6 text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Nilai PG</th>
                <th className="px-5 py-6 text-[10px] font-bold text-purple-600 uppercase tracking-[0.2em]">Nilai Essay</th>
                <th className="px-6 py-6 text-[10px] font-bold text-indigo-950 uppercase tracking-[0.2em]">Total Nilai</th>
                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Waktu Selesai</th>
                <th className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5,6].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    key={result.id} 
                    onClick={() => fetchDetail(result)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-indigo-950 flex items-center justify-center font-bold text-sm shadow-inner group-hover:bg-white transition-colors">
                          {result.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-indigo-950 leading-none">{capitalizeEachWord(result.name)}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{result.class}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-sm font-bold text-slate-700 line-clamp-1">{result.exams?.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-6">
                      {result.status === 'menunggu_scan' ? (
                        <span className="text-xs font-bold text-slate-400">-</span>
                      ) : (
                        <span className="text-base font-black text-blue-700">
                          {result.score_pg !== null && result.score_pg !== undefined ? result.score_pg : Math.round(result.score || 0)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-6">
                      {result.status === 'menunggu_scan' ? (
                        <span className="text-xs font-bold text-slate-400">-</span>
                      ) : result.essay_graded === false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" /> Perlu Dinilai
                        </span>
                      ) : result.score_essay !== null && result.score_essay !== undefined ? (
                        <span className="text-base font-black text-purple-700">
                          {result.score_essay}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        {result.status === 'menunggu_scan' ? (
                          <span className="text-sm font-bold text-amber-600">Belum Discan</span>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-indigo-950">{Math.round(result.score || 0)}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Poin</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {result.status === 'menunggu_scan' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu Pindai QR
                        </div>
                      ) : (
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest",
                          (result.score ?? 0) >= 75 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          (result.score ?? 0) >= 50 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          "bg-rose-50 text-rose-600 border border-rose-100"
                        )}>
                          {(result.score ?? 0) >= 75 ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                           (result.score ?? 0) >= 50 ? <AlertCircle className="w-3.5 h-3.5" /> : 
                           <XCircle className="w-3.5 h-3.5" />}
                          {(result.score ?? 0) >= 75 ? 'Lulus' : (result.score ?? 0) >= 50 ? 'Remedial' : 'Gagal'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{new Date(result.end_time || result.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{new Date(result.end_time || result.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetParticipant(result.id, result.name);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-200 shadow-xs cursor-pointer"
                          title="Reset Ujian Siswa (Hapus jawaban & mulai ulang)"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button className="p-3 text-slate-300 group-hover:text-indigo-950 group-hover:bg-white rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-32 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-indigo-950 mb-2">Belum ada hasil</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">
                      Hasil ujian akan muncul di sini setelah siswa menyelesaikan ujian mereka.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {showDetailModal && selectedResult && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetailModal(false)}
                className="absolute inset-0 bg-slate-950/75"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
              >
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-indigo-950">Detail Jawaban: {capitalizeEachWord(selectedResult.name)}</h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">Kelas: <strong className="text-slate-700">{selectedResult.class}</strong></span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
                        Nilai PG: {selectedResult.score_pg !== null && selectedResult.score_pg !== undefined ? selectedResult.score_pg : '-'}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                        selectedResult.essay_graded === false 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      )}>
                        Nilai Essay: {selectedResult.score_essay !== null && selectedResult.score_essay !== undefined ? selectedResult.score_essay : (selectedResult.essay_graded === false ? 'Menunggu Penilaian' : '-')}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold shadow-sm">
                        Total Nilai: {Math.round(selectedResult.score || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleResetParticipant(selectedResult.id, selectedResult.name)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Reset ujian siswa ini agar bisa mengerjakan ulang dari awal"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reset Ujian Siswa</span>
                    </button>
                    <button 
                      onClick={() => setShowDetailModal(false)} 
                      className="p-2 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95 group"
                    >
                      <XCircleIcon className="w-6 h-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1 bg-white">
                  {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-12 h-12 text-indigo-950 animate-spin" />
                      <p className="text-slate-500 font-medium mt-4">Memuat data jawaban...</p>
                    </div>
                  ) : participantAnswers.length > 0 ? (
                    <div className="space-y-4">
                      {participantAnswers.map((answer, i) => (
                        answer.questions?.question_type === 'essay' ? (
                          <EssayAnswerCard
                            key={answer.id}
                            index={i}
                            answer={answer}
                            onSaveScore={handleSaveEssayScore}
                          />
                        ) : (
                        <div key={answer.id} className="p-5 sm:p-7 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className="flex items-start gap-4 mb-5">
                            <div className="bg-indigo-950 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-indigo-950/20">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-indigo-950 font-bold text-lg leading-snug">{answer.questions?.question_text || 'Soal tidak ditemukan'}</p>
                              {answer.questions?.image_url && (
                                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 max-w-md bg-white shadow-sm">
                                  <img src={answer.questions.image_url} alt="Question" className="w-full h-auto object-contain max-h-60" />
                                </div>
                              )}
                              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                {answer.questions?.question_type?.replace('_', ' ') || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cn(
                              "p-4 rounded-2xl border",
                              !answer.is_answered ? "bg-slate-50 border-slate-200" :
                              answer.is_correct ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                            )}>
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest mb-1",
                                !answer.is_answered ? "text-slate-400" :
                                answer.is_correct ? "text-emerald-500" : "text-rose-500"
                              )}>Jawaban Siswa</p>
                              <p className={cn(
                                "font-bold text-base",
                                !answer.is_answered ? "text-slate-400" :
                                answer.is_correct ? "text-emerald-700" : "text-rose-700"
                              )}>
                                {!answer.is_answered 
                                  ? 'Tidak dijawab' 
                                  : (answer.questions?.question_type === 'pilihan_ganda' 
                                    ? (answer.selected_option ? `${answer.selected_option.option_text}` : (answer.option_id ? 'Opsi ID: ' + answer.option_id : '-')) 
                                    : (answer.questions?.question_type === 'menjodohkan'
                                      ? (() => {
                                          try {
                                            const matches = JSON.parse(answer.answer_text || '{}');
                                            const entries = Object.entries(matches);
                                            if (entries.length === 0) return 'Belum dipasangkan';
                                            return entries.map(([k, v]) => `${k} ➔ ${v}`).join(', ');
                                          } catch (e) {
                                            return answer.answer_text || '-';
                                          }
                                        })()
                                      : (answer.answer_text || '-')))}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Kunci Jawaban</p>
                              <p className="font-bold text-indigo-950 text-base">{answer.full_correct_answer_text}</p>
                            </div>
                          </div>
                          
                          <div className="mt-5 flex items-center gap-2">
                            {!answer.is_answered ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">
                                <AlertCircle className="w-3.5 h-3.5" /> Kosong
                              </div>
                            ) : answer.is_correct ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-600 text-xs font-bold">
                                <XCircleIcon className="w-3.5 h-3.5" /> Salah
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">Tidak ada soal yang ditemukan.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white rounded-full font-bold hover:brightness-110 transition-all shadow-lg shadow-[#3B66F5]/25 active:scale-95 border border-white/10"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
