import { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
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
  Check,
  SlidersHorizontal,
  ChevronLeft,
  FileCheck,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { cn, capitalizeEachWord } from '../lib/utils';
import { useSchool } from '../context/SchoolContext';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { evaluateEssayAnswer, highlightTextSegments, EvaluationMode, fastLocalHeuristicCheck, calculateTextSimilarity } from '../lib/essayEvaluator';
import { calculateExamScores, getExamWeights, saveExamWeights, ExamWeights } from '../lib/examScoring';
import { evaluateEssayWithAI, evaluateQuestionBatchWithAI } from '../lib/openKeyEvaluator';

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

  // State Evaluasi AI (OpenKey) - On Demand
  const [aiLoading, setAiLoading] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof answer.score === 'number') {
      setCurrentScore(answer.score);
    }
    setFeedback(answer.teacher_feedback || '');
  }, [answer.score, answer.teacher_feedback]);

  const handleAIEvaluate = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      // 1. Saring lokal terlebih dahulu (0 Token: Kosong, Menyerah, atau 100% Cocok)
      const localCheck = fastLocalHeuristicCheck(answer.answer_text, answer.questions?.correct_answer);
      if (localCheck.handledLocally) {
        setAiScore(localCheck.score);
        setAiFeedback(localCheck.feedback);
        setAiReasoning(localCheck.reason || 'Dideteksi otomatis secara lokal');
        setCurrentScore(localCheck.score);
        setFeedback(localCheck.feedback);
        return;
      }

      const res = await evaluateEssayWithAI({
        questionText: answer.questions?.question_text || '',
        correctAnswer: answer.questions?.correct_answer || '',
        studentAnswer: answer.answer_text || ''
      });
      setAiScore(res.score);
      setAiFeedback(res.feedback);
      setAiReasoning(res.reasoning || '');
      setCurrentScore(res.score);
      if (res.feedback) {
        setFeedback(res.feedback);
      }
    } catch (err: any) {
      console.error('AI Evaluation error:', err);
      setAiError(err?.message || 'Gagal mengevaluasi dengan AI.');
    } finally {
      setAiLoading(false);
    }
  };

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
            Seimbang (Konsep + Panjang)
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
            Panjang Teks / Usaha Siswa
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
            Kata Kunci Saja
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

      {/* Kotak Rekomendasi Evaluasi Otomatis (Profesional & Rapi) */}
      <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileCheck className="w-4 h-4 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {aiScore !== null ? 'Hasil Evaluasi Sistem:' : 'Rekomendasi Skor:'}
              </span>
              <span className="text-sm font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                {aiScore !== null ? aiScore : evaluation.suggestedScore} / 100
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {aiFeedback || aiReasoning || evaluation.feedbackSummary}
            </p>
            {aiError && (
              <p className="text-xs text-rose-600 font-bold mt-1">Kendala: {aiError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleApplyScore(aiScore !== null ? aiScore : evaluation.suggestedScore)}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Terapkan rekomendasi nilai ini"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Terapkan ({aiScore !== null ? aiScore : evaluation.suggestedScore})</span>
          </button>
          <button
            type="button"
            onClick={handleAIEvaluate}
            disabled={aiLoading || saving}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Evaluasi ulang pemahaman konsep siswa"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <span>{aiScore !== null ? 'Evaluasi Ulang' : 'Analisis Semantik'}</span>
            )}
          </button>
        </div>
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
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [sortBy, setSortBy] = useState<string>('terbaru');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [participantAnswers, setParticipantAnswers] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const examQuestionsCacheRef = useRef<Record<string, any[]>>({});

  // Bobot Nilai (PG + Essay)
  const [examWeights, setExamWeights] = useState<ExamWeights>(() => getExamWeights(initialExamId !== 'all' ? initialExamId : undefined));
  const [showCustomWeightModal, setShowCustomWeightModal] = useState(false);
  const [tempPgWeight, setTempPgWeight] = useState(examWeights.pgWeight || 100);
  const [tempEssayWeight, setTempEssayWeight] = useState(examWeights.essayWeight || 0);
  const [tempBonusMax, setTempBonusMax] = useState(examWeights.bonusMaxPoints || 20);
  const [tempMode, setTempMode] = useState<ExamWeights['mode']>(examWeights.mode || 'pg_bonus_essay');

  // Pagination & Display State (Default 25 item agar ringan & responsif)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Status Nonaktif Bonus Essay per Individu Siswa (default: aktif untuk semua siswa)
  const [bonusDisabledStudents, setBonusDisabledStudents] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const key = `eduverse_bonus_disabled_${initialExamId !== 'all' ? initialExamId : 'default'}`;
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Batch AI Grading State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchOnlyUngraded, setBatchOnlyUngraded] = useState(true);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, studentName: '', percentage: 0 });
  const [batchSummary, setBatchSummary] = useState<{ totalEvaluated: number } | null>(null);
  const batchAbortControllerRef = React.useRef<AbortController | null>(null);

  // Single Student AI Batch Grading
  const [studentAiGrading, setStudentAiGrading] = useState(false);

  useEffect(() => {
    if (selectedExam !== 'all') {
      const saved = getExamWeights(selectedExam);
      setExamWeights(saved);
      setTempPgWeight(saved.pgWeight);
      setTempEssayWeight(saved.essayWeight);
      setTempBonusMax(saved.bonusMaxPoints || 20);
      setTempMode(saved.mode || 'pg_bonus_essay');

      try {
        const key = `eduverse_bonus_disabled_${selectedExam}`;
        const savedBonus = localStorage.getItem(key);
        setBonusDisabledStudents(savedBonus ? JSON.parse(savedBonus) : {});
      } catch (e) {}
    }
  }, [selectedExam]);

  // Reset pagination saat pencarian atau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedExam, selectedClass, selectedSession, sortBy]);

  // Fungsi kalkulasi nilai akhir siswa sesuai skema bobot & bonus essay
  const computeStudentFinalScore = (
    p: any,
    weights: ExamWeights = examWeights,
    disabledMap: Record<string, boolean> = bonusDisabledStudents
  ): number => {
    const pg = p.score_pg !== null && p.score_pg !== undefined 
      ? p.score_pg 
      : (typeof p.score === 'number' ? p.score : 0);
    const essay = p.score_essay !== null && p.score_essay !== undefined 
      ? p.score_essay 
      : null;

    if (weights.mode === 'pg_bonus_essay') {
      const bonusMax = weights.bonusMaxPoints ?? 20;
      const isBonusActive = !disabledMap[p.id];
      const potentialBonus = essay !== null ? Math.round(((essay / 100) * bonusMax) * 10) / 10 : 0;
      const effectiveBonus = isBonusActive ? potentialBonus : 0;
      return Math.min(100, Math.round((pg + effectiveBonus) * 10) / 10);
    }

    if (weights.mode === 'custom') {
      if (essay === null) return pg;
      const totalW = (weights.pgWeight + weights.essayWeight) || 100;
      const normPg = (weights.pgWeight / totalW) * 100;
      const normEssay = (weights.essayWeight / totalW) * 100;
      return Math.round(((pg * normPg / 100) + (essay * normEssay / 100)) * 10) / 10;
    }

    return typeof p.score === 'number' ? p.score : pg;
  };

  const handleUpdateWeights = (newWeights: ExamWeights) => {
    setExamWeights(newWeights);
    saveExamWeights(newWeights, selectedExam !== 'all' ? selectedExam : undefined);
    
    // Rekalkulasi skor real-time untuk seluruh peserta di tabel
    setResults(prev => prev.map(p => ({
      ...p,
      score: computeStudentFinalScore(p, newWeights, bonusDisabledStudents)
    })));
  };

  // Toggle bonus essay per individu siswa
  const handleToggleStudentBonus = async (studentId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isCurrentlyDisabled = !!bonusDisabledStudents[studentId];
    const newDisabled = !isCurrentlyDisabled;
    const updatedDisabled = { ...bonusDisabledStudents, [studentId]: newDisabled };
    setBonusDisabledStudents(updatedDisabled);
    
    const storageKey = `eduverse_bonus_disabled_${selectedExam !== 'all' ? selectedExam : 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedDisabled));

    let updatedTarget: any = null;
    const updated = results.map(p => {
      if (p.id === studentId) {
        const newScore = computeStudentFinalScore(p, examWeights, updatedDisabled);
        updatedTarget = { ...p, score: newScore };
        return updatedTarget;
      }
      return p;
    });

    setResults(updated);
    if (selectedResult?.id === studentId && updatedTarget) {
      setSelectedResult(updatedTarget);
    }

    if (updatedTarget) {
      try {
        await supabase.from('participants').update({ score: updatedTarget.score }).eq('id', studentId);
        await supabaseAnon.from('participants').update({ score: updatedTarget.score }).eq('id', studentId);
      } catch (err) {
        console.error('Error saving toggled bonus:', err);
      }
    }
  };

  // Terapkan bonus ke seluruh siswa
  const handleApplyBonusToAll = async () => {
    setBonusDisabledStudents({});
    const storageKey = `eduverse_bonus_disabled_${selectedExam !== 'all' ? selectedExam : 'default'}`;
    localStorage.removeItem(storageKey);
    
    const updated = results.map(p => ({
      ...p,
      score: computeStudentFinalScore(p, examWeights, {})
    }));
    setResults(updated);

    // Jalankan update database di background tanpa menghambat responsivitas UI
    Promise.allSettled(
      updated.map(p => Promise.allSettled([
        supabase.from('participants').update({ score: p.score }).eq('id', p.id),
        supabaseAnon.from('participants').update({ score: p.score }).eq('id', p.id)
      ]))
    ).catch(e => console.warn('Bulk apply bonus sync error:', e));
  };

  // Nonaktifkan bonus untuk seluruh siswa (murni nilai PG)
  const handleDisableBonusForAll = async () => {
    const newDisabled: Record<string, boolean> = {};
    results.forEach(p => {
      newDisabled[p.id] = true;
    });
    setBonusDisabledStudents(newDisabled);
    const storageKey = `eduverse_bonus_disabled_${selectedExam !== 'all' ? selectedExam : 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(newDisabled));

    const updated = results.map(p => ({
      ...p,
      score: computeStudentFinalScore(p, examWeights, newDisabled)
    }));
    setResults(updated);

    // Jalankan update database di background tanpa menghambat responsivitas UI
    Promise.allSettled(
      updated.map(p => Promise.allSettled([
        supabase.from('participants').update({ score: p.score }).eq('id', p.id),
        supabaseAnon.from('participants').update({ score: p.score }).eq('id', p.id)
      ]))
    ).catch(e => console.warn('Bulk disable bonus sync error:', e));
  };

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

      const computedData = (finalData || []).map(p => ({
        ...p,
        score: computeStudentFinalScore(p, examWeights, bonusDisabledStudents)
      }));

      setResults(computedData);
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
      const examId = participant.exam_id || participant.exams?.id;
      let examQuestions = examQuestionsCacheRef.current[examId];

      // 1. If not yet in cache, fetch questions once and store in memory
      if (!examQuestions || examQuestions.length === 0) {
        const { data: fetchedQuestions, error: eqError } = await supabase
          .from('exam_questions')
          .select(`
            id,
            question_id,
            questions (
              *,
              question_options (*)
            )
          `)
          .eq('exam_id', examId);

        if (eqError) throw eqError;
        examQuestions = fetchedQuestions || [];
        examQuestionsCacheRef.current[examId] = examQuestions;
      }

      // 2. Fetch the participant's answers with LEAN query (NO duplicate joins on questions/options!)
      let { data: participantDbAnswers, error: ansError } = await supabase
        .from('answers')
        .select('id, question_id, option_id, answer_text, is_correct, score, teacher_feedback')
        .eq('participant_id', participant.id);

      if (ansError || !participantDbAnswers || participantDbAnswers.length === 0) {
        const { data: anonDbAnswers } = await supabaseAnon
          .from('answers')
          .select('id, question_id, option_id, answer_text, is_correct, score, teacher_feedback')
          .eq('participant_id', participant.id);
        if (anonDbAnswers && anonDbAnswers.length > 0) {
          participantDbAnswers = anonDbAnswers;
        }
      }

      const answersMap = new Map((participantDbAnswers || []).map((a: any) => [a.question_id, a]));

      const fullAnswers = (examQuestions || []).map((eq: any) => {
        const question = eq.questions || {};
        if (!question.id) return null;
        
        // Find answer in O(1) time
        const ans = answersMap.get(question.id);
        
        // Selected option resolved directly from cached question.question_options
        let selectedOption = null;
        if (ans && question.question_type === 'pilihan_ganda' && ans.option_id) {
          const options = Array.isArray(question.question_options) 
            ? question.question_options 
            : (question.question_options ? [question.question_options] : []);
          selectedOption = options.find((opt: any) => opt.id === ans.option_id) || null;
        }

        // Full correct answer text
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
          selected_option: selectedOption,
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

    // 2. Recalculate exam scores with smart auto-scaling & weights
    const scoringResult = calculateExamScores({
      questions: updatedAnswers.map(a => ({
        id: a.question_id,
        question_type: a.questions?.question_type
      })),
      answers: updatedAnswers.map(a => ({
        question_id: a.question_id,
        is_correct: a.is_correct,
        score: a.score
      })),
      weights: examWeights,
      applyBonusEssay: !bonusDisabledStudents[selectedResult.id]
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

  // Nilai semua essay siswa ini secara on-demand dengan AI
  const handleGradeAllStudentEssays = async () => {
    if (!selectedResult || participantAnswers.length === 0) return;
    const essayAnswers = participantAnswers.filter(a => a.questions?.question_type === 'essay');
    if (essayAnswers.length === 0) {
      alert('Siswa ini tidak memiliki soal essay.');
      return;
    }

    setStudentAiGrading(true);
    try {
      let updatedAnswers = [...participantAnswers];

      for (const ans of essayAnswers) {
        let score = 0;
        let feedback = '';

        // Saring lokal terlebih dahulu (0 Token: Kosong, Menyerah, atau 100% Cocok)
        const localCheck = fastLocalHeuristicCheck(ans.answer_text, ans.questions?.correct_answer);
        if (localCheck.handledLocally) {
          score = localCheck.score;
          feedback = localCheck.feedback;
        } else {
          const aiRes = await evaluateEssayWithAI({
            questionText: ans.questions?.question_text || '',
            correctAnswer: ans.questions?.correct_answer || '',
            studentAnswer: ans.answer_text || ''
          });
          score = aiRes.score;
          feedback = aiRes.feedback;
        }

        if (ans.id && !ans.id.startsWith('unanswered-')) {
          const { error: ansErr } = await supabase
            .from('answers')
            .update({
              score,
              is_correct: score >= 60,
              teacher_feedback: feedback
            })
            .eq('id', ans.id);

          if (ansErr) {
            await supabase
              .from('answers')
              .update({ is_correct: score >= 60 })
              .eq('id', ans.id);
            await supabaseAnon
              .from('answers')
              .update({ is_correct: score >= 60 })
              .eq('id', ans.id);
          }
        } else {
          const { error: upErr } = await supabase
            .from('answers')
            .upsert({
              participant_id: selectedResult.id,
              question_id: ans.question_id,
              score,
              is_correct: score >= 60,
              teacher_feedback: feedback
            }, { onConflict: 'participant_id,question_id' });

          if (upErr) {
            await supabase
              .from('answers')
              .upsert({
                participant_id: selectedResult.id,
                question_id: ans.question_id,
                is_correct: score >= 60
              }, { onConflict: 'participant_id,question_id' });
          }
        }

        updatedAnswers = updatedAnswers.map(a => {
          if (a.question_id === ans.question_id) {
            return {
              ...a,
              score,
              is_correct: score >= 60,
              teacher_feedback: feedback
            };
          }
          return a;
        });
      }

      setParticipantAnswers(updatedAnswers);

      const scoringResult = calculateExamScores({
        questions: updatedAnswers.map(a => ({
          id: a.question_id,
          question_type: a.questions?.question_type
        })),
        answers: updatedAnswers.map(a => ({
          question_id: a.question_id,
          is_correct: a.is_correct,
          score: a.score
        })),
        weights: examWeights,
        applyBonusEssay: !bonusDisabledStudents[selectedResult.id]
      });

      const updatedResult = {
        ...selectedResult,
        score: scoringResult.finalScore,
        score_pg: scoringResult.scorePg,
        score_essay: scoringResult.scoreEssay,
        essay_graded: scoringResult.isEssayGraded
      };

      setSelectedResult(updatedResult);
      setResults(prev => prev.map(r => r.id === selectedResult.id ? updatedResult : r));

      await supabase
        .from('participants')
        .update({
          score: scoringResult.finalScore,
          score_pg: scoringResult.scorePg,
          score_essay: scoringResult.scoreEssay,
          essay_graded: scoringResult.isEssayGraded
        })
        .eq('id', selectedResult.id);

    } catch (err: any) {
      console.error('Error grading all student essays:', err);
      alert('Gagal memeriksa essay siswa: ' + (err?.message || 'Error'));
    } finally {
      setStudentAiGrading(false);
    }
  };

  // Batch AI Grading untuk semua siswa di sesi/ujian yang dipilih
  const handleBatchAIGrade = async () => {
    if (filteredResults.length === 0) return;
    setBatchRunning(true);
    batchAbortControllerRef.current = new AbortController();
    const signal = batchAbortControllerRef.current.signal;

    try {
      const targetParticipants = filteredResults;
      const participantIds = targetParticipants.map(p => p.id);

      // 1. Ambil seluruh soal ujian terkait (dari exam_questions)
      const examIds = Array.from(new Set([
        ...(selectedExam !== 'all' ? [selectedExam] : []),
        ...targetParticipants.map(p => p.exam_id || p.exams?.id)
      ].filter(Boolean)));
      let allExamQuestions: any[] = [];

      if (examIds.length > 0) {
        let { data: eqData, error: eqErr } = await supabase
          .from('exam_questions')
          .select('id, exam_id, question_id, questions(*)')
          .in('exam_id', examIds);

        if (eqErr || !eqData || eqData.length === 0) {
          const { data: anonEqData } = await supabaseAnon
            .from('exam_questions')
            .select('id, exam_id, question_id, questions(*)')
            .in('exam_id', examIds);
          allExamQuestions = anonEqData || [];
        } else {
          allExamQuestions = eqData || [];
        }
      }

      // Map question_id -> data soal dan exam_id -> kumpulan soal
      const questionsMap = new Map<string, any>();
      const examQuestionsByExamId = new Map<string, any[]>();

      allExamQuestions.forEach((eq: any) => {
        const q = Array.isArray(eq.questions) ? eq.questions[0] : eq.questions;
        if (q) {
          const qId = q.id || eq.question_id;
          questionsMap.set(qId, q);
          if (eq.exam_id) {
            const arr = examQuestionsByExamId.get(eq.exam_id) || [];
            arr.push(q);
            examQuestionsByExamId.set(eq.exam_id, arr);
          }
        }
      });

      // 2. Ambil seluruh jawaban murid dari tabel answers (chunked 25 agar aman dari limit URL)
      const chunkSize = 25;
      let allDbAnswers: any[] = [];

      for (let c = 0; c < participantIds.length; c += chunkSize) {
        if (signal.aborted) break;
        const chunkIds = participantIds.slice(c, c + chunkSize);

        let { data: chunkAnswers, error: chunkErr } = await supabase
          .from('answers')
          .select('*')
          .in('participant_id', chunkIds);

        if (chunkErr || !chunkAnswers || chunkAnswers.length === 0) {
          const { data: anonChunkAnswers } = await supabaseAnon
            .from('answers')
            .select('*')
            .in('participant_id', chunkIds);

          if (anonChunkAnswers && anonChunkAnswers.length > 0) {
            allDbAnswers.push(...anonChunkAnswers);
          }
        } else {
          allDbAnswers.push(...chunkAnswers);
        }
      }

      if (allDbAnswers.length === 0) {
        throw new Error('Tidak ditemukan data jawaban untuk siswa yang dipilih.');
      }

      // Ambil soal yang belum ada di questionsMap langsung dari tabel questions jika ada
      const missingQIds = Array.from(
        new Set(
          allDbAnswers
            .map((a: any) => a.question_id)
            .filter((qId: string) => qId && !questionsMap.has(qId))
        )
      );

      if (missingQIds.length > 0) {
        let { data: directQ } = await supabase
          .from('questions')
          .select('*')
          .in('id', missingQIds);

        if (!directQ || directQ.length === 0) {
          const { data: anonDirectQ } = await supabaseAnon
            .from('questions')
            .select('*')
            .in('id', missingQIds);
          directQ = anonDirectQ || [];
        }

        directQ?.forEach((q: any) => {
          questionsMap.set(q.id, q);
        });
      }

      // 3. Filter hanya jawaban bertipe essay
      let essayAnswers = allDbAnswers.filter((a: any) => {
        const q = questionsMap.get(a.question_id);
        return q?.question_type === 'essay';
      });

      if (batchOnlyUngraded) {
        essayAnswers = essayAnswers.filter((a: any) => a.score === null || a.score === undefined);
      }

      if (essayAnswers.length === 0) {
        alert('Tidak ada jawaban essay yang perlu dinilai sesuai opsi yang dipilih.');
        setBatchRunning(false);
        setShowBatchModal(false);
        return;
      }

      setBatchProgress({
        current: 0,
        total: essayAnswers.length,
        studentName: '',
        percentage: 0
      });

      const participantAnswersMap = new Map<string, any[]>();
      allDbAnswers.forEach((a: any) => {
        const arr = participantAnswersMap.get(a.participant_id) || [];
        arr.push(a);
        participantAnswersMap.set(a.participant_id, arr);
      });

      // Helper untuk simpan penilaian ke Supabase
      const persistAnswerScore = async (ansId: string, score: number, feedback: string) => {
        let { error: updateErr } = await supabase
          .from('answers')
          .update({
            score,
            is_correct: score >= 60,
            teacher_feedback: feedback
          })
          .eq('id', ansId);

        if (updateErr) {
          const { error: cErr } = await supabase
            .from('answers')
            .update({ is_correct: score >= 60 })
            .eq('id', ansId);

          if (cErr) {
            await supabaseAnon
              .from('answers')
              .update({ is_correct: score >= 60 })
              .eq('id', ansId);
          }
        }
      };

      // 4. Proses penilaian essay dengan arsitektur Two-Tier Hybrid (Ultra-Hemat Token)
      let evaluatedCount = 0;
      const totalAnswers = essayAnswers.length;

      // Tier 1: Penyaringan Lokal 0 Token (Kosong, Menyerah, Exact Match)
      const pendingAnswers: any[] = [];
      for (const ans of essayAnswers) {
        if (signal.aborted) break;
        const qObj = questionsMap.get(ans.question_id);
        const participant = targetParticipants.find(p => p.id === ans.participant_id);
        const studentName = participant?.name || 'Siswa';

        const localCheck = fastLocalHeuristicCheck(ans.answer_text, qObj?.correct_answer);
        if (localCheck.handledLocally) {
          ans.score = localCheck.score;
          ans.is_correct = localCheck.score >= 60;
          ans.teacher_feedback = localCheck.feedback;
          await persistAnswerScore(ans.id, localCheck.score, localCheck.feedback);
          evaluatedCount++;
          setBatchProgress({
            current: evaluatedCount,
            total: totalAnswers,
            studentName: `${studentName} (Filter Lokal)`,
            percentage: Math.round((evaluatedCount / totalAnswers) * 100)
          });
        } else {
          pendingAnswers.push(ans);
        }
      }

      // Tier 2: Kelompokkan jawaban yang belum dinilai per question_id
      if (!signal.aborted && pendingAnswers.length > 0) {
        const answersByQuestion = new Map<string, any[]>();
        pendingAnswers.forEach(ans => {
          const arr = answersByQuestion.get(ans.question_id) || [];
          arr.push(ans);
          answersByQuestion.set(ans.question_id, arr);
        });

        for (const [questionId, qAnswers] of answersByQuestion.entries()) {
          if (signal.aborted) break;
          const qObj = questionsMap.get(questionId);

          // Cache per soal untuk mewarisi nilai jawaban serupa (Fuzzy Deduplication)
          const evaluatedCache: { text: string; score: number; feedback: string }[] = [];

          // Saring jawaban yang mirip dengan yang sudah dinilai
          const needsAiList: any[] = [];
          for (const ans of qAnswers) {
            const similar = evaluatedCache.find(
              c => calculateTextSimilarity(ans.answer_text || '', c.text) >= 0.85
            );
            if (similar) {
              ans.score = similar.score;
              ans.is_correct = similar.score >= 60;
              ans.teacher_feedback = similar.feedback;
              await persistAnswerScore(ans.id, similar.score, similar.feedback);
              evaluatedCount++;
              const participant = targetParticipants.find(p => p.id === ans.participant_id);
              setBatchProgress({
                current: evaluatedCount,
                total: totalAnswers,
                studentName: `${participant?.name || 'Siswa'} (Serupa)`,
                percentage: Math.round((evaluatedCount / totalAnswers) * 100)
              });
            } else {
              needsAiList.push(ans);
            }
          }

          // Batching AI per 8 jawaban untuk soal yang sama
          const BATCH_SIZE = 8;
          for (let b = 0; b < needsAiList.length; b += BATCH_SIZE) {
            if (signal.aborted) break;
            const batchChunk = needsAiList.slice(b, b + BATCH_SIZE);
            const firstParticipant = targetParticipants.find(p => p.id === batchChunk[0].participant_id);

            setBatchProgress({
              current: evaluatedCount,
              total: totalAnswers,
              studentName: `${firstParticipant?.name || 'Siswa'} dkk. (Batch AI)`,
              percentage: Math.round((evaluatedCount / totalAnswers) * 100)
            });

            try {
              const batchResults = await evaluateQuestionBatchWithAI({
                questionText: qObj?.question_text || '',
                correctAnswer: qObj?.correct_answer || '',
                answers: batchChunk.map(item => ({
                  id: item.id,
                  studentAnswer: item.answer_text || ''
                }))
              });

              const resultMap = new Map(batchResults.map(r => [r.id, r]));

              for (const ans of batchChunk) {
                const res = resultMap.get(ans.id) || { score: 60, feedback: 'Dinilai oleh AI.' };
                ans.score = res.score;
                ans.is_correct = res.score >= 60;
                ans.teacher_feedback = res.feedback;
                await persistAnswerScore(ans.id, res.score, res.feedback);

                if (ans.answer_text && ans.answer_text.trim().length >= 10) {
                  evaluatedCache.push({
                    text: ans.answer_text,
                    score: res.score,
                    feedback: res.feedback
                  });
                }

                evaluatedCount++;
              }

              setBatchProgress({
                current: evaluatedCount,
                total: totalAnswers,
                studentName: `${firstParticipant?.name || 'Siswa'}`,
                percentage: Math.round((evaluatedCount / totalAnswers) * 100)
              });
            } catch (batchErr) {
              console.warn('Batch AI gagal, fallback ke evaluasi satuan:', batchErr);
              for (const ans of batchChunk) {
                if (signal.aborted) break;
                try {
                  const singleRes = await evaluateEssayWithAI({
                    questionText: qObj?.question_text || '',
                    correctAnswer: qObj?.correct_answer || '',
                    studentAnswer: ans.answer_text || ''
                  });
                  ans.score = singleRes.score;
                  ans.is_correct = singleRes.score >= 60;
                  ans.teacher_feedback = singleRes.feedback;
                  await persistAnswerScore(ans.id, singleRes.score, singleRes.feedback);
                } catch (sErr) {
                  console.error('Fallback satuan gagal:', sErr);
                }
                evaluatedCount++;
                setBatchProgress({
                  current: evaluatedCount,
                  total: totalAnswers,
                  studentName: 'Evaluasi item',
                  percentage: Math.round((evaluatedCount / totalAnswers) * 100)
                });
              }
            }

            if (b + BATCH_SIZE < needsAiList.length && !signal.aborted) {
              await new Promise(r => setTimeout(r, 200));
            }
          }
        }
      }

      // 5. Rekalkulasi skor untuk seluruh peserta yang dinilai
      for (const participant of targetParticipants) {
        if (signal.aborted) break;
        const pExamId = participant.exam_id || participant.exams?.id;
        const examQuestions = examQuestionsByExamId.get(pExamId) || [];
        const pAnswers = participantAnswersMap.get(participant.id) || [];

        const scoring = calculateExamScores({
          questions: examQuestions.length > 0 ? examQuestions.map((q: any) => ({
            id: q.id,
            question_type: q.question_type
          })) : pAnswers.map(a => ({
            id: a.question_id,
            question_type: questionsMap.get(a.question_id)?.question_type
          })),
          answers: pAnswers.map(a => ({
            question_id: a.question_id,
            is_correct: a.is_correct,
            score: a.score
          })),
          weights: examWeights,
          applyBonusEssay: !bonusDisabledStudents[participant.id]
        });

        const updatePayload = {
          score: scoring.finalScore,
          score_pg: scoring.scorePg,
          score_essay: scoring.scoreEssay,
          essay_graded: scoring.isEssayGraded
        };

        let { error: pErr } = await supabase
          .from('participants')
          .update(updatePayload)
          .eq('id', participant.id);

        if (pErr) {
          let { error: pAnonErr } = await supabaseAnon
            .from('participants')
            .update(updatePayload)
            .eq('id', participant.id);

          if (pAnonErr) {
            await supabase
              .from('participants')
              .update({ score: scoring.finalScore })
              .eq('id', participant.id);
            await supabaseAnon
              .from('participants')
              .update({ score: scoring.finalScore })
              .eq('id', participant.id);
          }
        }

        setResults(prev => prev.map(p => {
          if (p.id === participant.id) {
            return {
              ...p,
              score: scoring.finalScore,
              score_pg: scoring.scorePg,
              score_essay: scoring.scoreEssay,
              essay_graded: scoring.isEssayGraded
            };
          }
          return p;
        }));
      }

      setBatchSummary({ totalEvaluated: evaluatedCount });
    } catch (err: any) {
      console.error('Batch grading error:', err);
      alert('Terjadi kendala saat memeriksa batch: ' + (err?.message || 'Error'));
    } finally {
      setBatchRunning(false);
    }
  };

  const handleCancelBatchAIGrade = () => {
    if (batchAbortControllerRef.current) {
      batchAbortControllerRef.current.abort();
    }
    setBatchRunning(false);
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
      } else if (sortBy === 'nilai-pg-tinggi') {
        return (Number(b.score_pg) || 0) - (Number(a.score_pg) || 0);
      } else if (sortBy === 'nilai-pg-rendah') {
        return (Number(a.score_pg) || 0) - (Number(b.score_pg) || 0);
      } else if (sortBy === 'nilai-essay-tinggi') {
        return (Number(b.score_essay) || 0) - (Number(a.score_essay) || 0);
      } else if (sortBy === 'nilai-essay-rendah') {
        return (Number(a.score_essay) || 0) - (Number(b.score_essay) || 0);
      } else if (sortBy === 'a-z') {
        return (a.name || '').localeCompare(b.name || '', 'id');
      } else if (sortBy === 'z-a') {
        return (b.name || '').localeCompare(a.name || '', 'id');
      }
      return 0;
    });

    return temp;
  }, [results, deferredSearchTerm, sortBy]);

  const totalPages = Math.ceil(filteredResults.length / (pageSize || filteredResults.length)) || 1;
  const paginatedResults = useMemo(() => {
    if (pageSize === 0) return filteredResults;
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  const pendingEssayCount = useMemo(() => {
    return filteredResults.filter(r => r.essay_graded === false).length;
  }, [filteredResults]);

  const leaderboardResults = useMemo(() => {
    if (!showLeaderboard) return [];
    const source = deferredSearchTerm.trim() ? filteredResults : results;
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
  }, [results, filteredResults, deferredSearchTerm, showLeaderboard]);

  const exportToExcel = async () => {
    const { default: XLSXStyle } = await import('xlsx-js-style');
    const headers = ['NAMA SISWA', 'KELAS', 'UJIAN', 'NILAI PG', 'NILAI ESSAY', 'BONUS ESSAY', 'TOTAL NILAI', 'STATUS ESSAY', 'WAKTU SELESAI'];
    const rows = filteredResults.map(r => {
      const bonusMax = examWeights.bonusMaxPoints ?? 20;
      const isBonusActive = !bonusDisabledStudents[r.id];
      const essayAvg = r.score_essay !== null && r.score_essay !== undefined ? r.score_essay : 0;
      const potentialBonus = Math.round(((essayAvg / 100) * bonusMax) * 10) / 10;
      let bonusText = '-';
      if (examWeights.mode === 'pg_bonus_essay') {
        if ((r.score_pg ?? 0) >= 100) {
          bonusText = 'PG 100';
        } else if (isBonusActive && potentialBonus > 0) {
          bonusText = `+${potentialBonus}`;
        } else if (!isBonusActive) {
          bonusText = 'Nonaktif';
        } else {
          bonusText = '+0';
        }
      }

      return [
        capitalizeEachWord(r.name),
        r.class,
        r.exams?.title || '-',
        r.score_pg !== null && r.score_pg !== undefined ? r.score_pg : '-',
        r.score_essay !== null && r.score_essay !== undefined ? r.score_essay : (r.essay_graded === false ? 'Belum Dinilai' : '-'),
        bonusText,
        Math.round(r.score || 0),
        r.essay_graded === false ? 'Menunggu Penilaian' : 'Selesai',
        new Date(r.end_time || r.start_time).toLocaleString('id-ID')
      ];
    });

    const worksheet = XLSXStyle.utils.aoa_to_sheet([headers, ...rows]);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 22 }, // Nama Siswa
      { wch: 14 }, // Kelas
      { wch: 24 }, // Ujian
      { wch: 12 }, // Nilai PG
      { wch: 14 }, // Nilai Essay
      { wch: 14 }, // Bonus Essay
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
    <div className={cn(isEmbedded ? "space-y-4" : "space-y-6 pb-20")}>
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-indigo-950 tracking-tight">Hasil Ujian</h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">Laporan nilai dan evaluasi pengerjaan siswa.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => {
                setBatchSummary(null);
                setShowBatchModal(true);
              }}
              className="bg-indigo-950 hover:bg-indigo-900 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-indigo-300" />
              <span>Koreksi Otomatis Essay</span>
              {pendingEssayCount > 0 && (
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full ml-0.5">
                  {pendingEssayCount} Belum
                </span>
              )}
            </button>
            <button 
              onClick={generatePDF}
              className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#2563EB]" />
              PDF
            </button>
            <button 
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
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

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative group sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-950 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari siswa atau kelas..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-xs sm:text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative group">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 text-xs sm:text-sm transition-all cursor-pointer"
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
          >
            <option value="all">Semua Ujian</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        </div>
        {selectedExam !== 'all' && sessions.length > 0 && (
          <div className="relative group">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-950 transition-colors" />
            <select 
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 text-xs sm:text-sm transition-all cursor-pointer"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="all">Semua Sesi</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.class_name} - {new Date(s.started_at).toLocaleDateString('id-ID')}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        )}
        <div className="relative group">
          <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 text-xs sm:text-sm transition-all cursor-pointer"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      {/* Sleek Toolbar: Skema Bobot, Sort Cepat, Toggle Top 3 & Counter */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Bobot Scheme + Modal trigger + Mass Bonus Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-700" />
            <span>
              {examWeights.mode === 'pg_bonus_essay'
                ? `Skema: PG 100% + Nilai Tambah (+${examWeights.bonusMaxPoints || 20})`
                : examWeights.mode === 'custom'
                ? `Bobot: PG ${examWeights.pgWeight}% : Essay ${examWeights.essayWeight}%`
                : 'Skema: Proporsional Poin'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempPgWeight(examWeights.pgWeight);
              setTempEssayWeight(examWeights.essayWeight);
              setTempBonusMax(examWeights.bonusMaxPoints || 20);
              setTempMode(examWeights.mode);
              setShowCustomWeightModal(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-indigo-950 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <span>Atur Skema</span>
          </button>

          {examWeights.mode === 'pg_bonus_essay' && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={handleApplyBonusToAll}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                title="Aktifkan nilai tambah essay untuk seluruh siswa"
              >
                Aktifkan Semua
              </button>
              <button
                type="button"
                onClick={handleDisableBonusForAll}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                title="Matikan nilai tambah essay untuk seluruh siswa (murni PG)"
              >
                Matikan Semua
              </button>
            </div>
          )}
        </div>

        {/* Right: Quick Sort + Podium Toggle + Total count */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSortBy(sortBy === 'a-z' ? 'z-a' : 'a-z')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                sortBy === 'a-z' || sortBy === 'z-a' ? "bg-white text-indigo-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Nama: {sortBy === 'z-a' ? 'Z-A' : 'A-Z'}
            </button>
            <button
              type="button"
              onClick={() => setSortBy(sortBy === 'nilai-tinggi' ? 'nilai-rendah' : 'nilai-tinggi')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                sortBy === 'nilai-tinggi' || sortBy === 'nilai-rendah' ? "bg-white text-indigo-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Nilai: {sortBy === 'nilai-rendah' ? 'Terendah' : 'Tertinggi'}
            </button>
            <button
              type="button"
              onClick={() => setSortBy(sortBy === 'terbaru' ? 'terlama' : 'terbaru')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                sortBy === 'terbaru' || sortBy === 'terlama' ? "bg-white text-indigo-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Waktu: {sortBy === 'terlama' ? 'Terlama' : 'Terbaru'}
            </button>
          </div>

          {leaderboardResults.length >= 3 && (
            <button
              type="button"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95",
                showLeaderboard 
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{showLeaderboard ? 'Tutup Peringkat' : 'Lihat Top 3'}</span>
            </button>
          )}

          <span className="text-xs font-bold text-slate-500 pl-1">
            {filteredResults.length} Siswa
            {pendingEssayCount > 0 && (
              <span className="text-amber-600 ml-1">({pendingEssayCount} belum dinilai)</span>
            )}
          </span>
        </div>
      </div>

      {/* Quizzo 3D Leaderboard Podium (Collapsible) */}
      {showLeaderboard && !loading && leaderboardResults.length >= 3 && (
        <div className="overflow-hidden mb-2">
          <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1E40AF] p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-extrabold tracking-widest px-3 py-1 bg-white/15 rounded-full text-amber-300 border border-white/20">
                  Peringkat Teratas
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Top 3 Peringkat Tertinggi</h3>
              </div>
                <button
                  type="button"
                  onClick={() => setShowLeaderboard(false)}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  ✕ Tutup
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-xl mx-auto pt-2 pb-2 relative z-10">
                {/* Rank 2 - Silver */}
                {leaderboardResults[1] && (
                  <div 
                    className="flex flex-col items-center text-center cursor-pointer group"
                    onClick={() => fetchDetail(leaderboardResults[1])}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-200 text-slate-800 font-black text-lg sm:text-xl flex items-center justify-center border-4 border-slate-300 shadow-xl mb-2 relative group-hover:scale-105 transition-transform">
                      {leaderboardResults[1].name.charAt(0)}
                      <span className="absolute -bottom-2 bg-slate-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">2</span>
                    </div>
                    <p className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[85px] sm:max-w-[120px]">{capitalizeEachWord(leaderboardResults[1].name)}</p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 bg-white/20 px-2.5 py-0.5 rounded-full mt-1">{Math.round(leaderboardResults[1].score)} Poin</span>
                    <div className="w-full h-20 sm:h-26 bg-gradient-to-t from-slate-400/40 to-slate-300/20 rounded-t-2xl mt-3 flex items-center justify-center border-t border-white/30 group-hover:from-slate-400/50 transition-colors">
                      <span className="text-xl sm:text-2xl font-black text-white/50">🥈 2</span>
                    </div>
                  </div>
                )}

                {/* Rank 1 - Gold */}
                {leaderboardResults[0] && (
                  <div 
                    className="flex flex-col items-center text-center -mt-4 cursor-pointer group"
                    onClick={() => fetchDetail(leaderboardResults[0])}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 text-amber-950 font-black text-xl sm:text-2xl flex items-center justify-center border-4 border-amber-300 shadow-2xl shadow-amber-500/50 mb-2 relative group-hover:scale-105 transition-transform">
                      {leaderboardResults[0].name.charAt(0)}
                      <span className="absolute -bottom-2 bg-amber-500 text-amber-950 text-xs font-black px-2.5 py-0.5 rounded-full border border-white">1</span>
                    </div>
                    <p className="font-extrabold text-xs sm:text-base text-amber-200 truncate max-w-[95px] sm:max-w-[140px]">{capitalizeEachWord(leaderboardResults[0].name)}</p>
                    <span className="text-xs font-black text-amber-950 bg-amber-400 px-3 py-1 rounded-full mt-1 shadow-md">{Math.round(leaderboardResults[0].score)} Poin</span>
                    <div className="w-full h-28 sm:h-34 bg-gradient-to-t from-amber-500/50 to-amber-400/25 rounded-t-3xl mt-3 flex items-center justify-center border-t border-amber-300/50 group-hover:from-amber-500/60 transition-colors">
                      <span className="text-2xl sm:text-3xl font-black text-amber-300">🥇 1</span>
                    </div>
                  </div>
                )}

                {/* Rank 3 - Bronze */}
                {leaderboardResults[2] && (
                  <div 
                    className="flex flex-col items-center text-center cursor-pointer group"
                    onClick={() => fetchDetail(leaderboardResults[2])}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-700/80 text-amber-100 font-black text-lg sm:text-xl flex items-center justify-center border-4 border-amber-600 shadow-xl mb-2 relative group-hover:scale-105 transition-transform">
                      {leaderboardResults[2].name.charAt(0)}
                      <span className="absolute -bottom-2 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white">3</span>
                    </div>
                    <p className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[85px] sm:max-w-[120px]">{capitalizeEachWord(leaderboardResults[2].name)}</p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-100 bg-white/20 px-2.5 py-0.5 rounded-full mt-1">{Math.round(leaderboardResults[2].score)} Poin</span>
                    <div className="w-full h-16 sm:h-22 bg-gradient-to-t from-amber-700/40 to-amber-600/20 rounded-t-2xl mt-3 flex items-center justify-center border-t border-white/30 group-hover:from-amber-700/50 transition-colors">
                      <span className="text-xl sm:text-2xl font-black text-white/50">🥉 3</span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Tabel Hasil Siswa (Ringan & Cepat Tanpa Lag) */}
      <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 select-none text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="w-12 px-3 py-3.5 text-center text-slate-400">#</th>
                <th 
                  onClick={() => setSortBy(sortBy === 'a-z' ? 'z-a' : 'a-z')}
                  className="px-4 py-3.5 hover:text-indigo-950 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Siswa</span>
                    {sortBy === 'a-z' && <span className="text-indigo-600 font-black">▲</span>}
                    {sortBy === 'z-a' && <span className="text-indigo-600 font-black">▼</span>}
                  </div>
                </th>
                <th 
                  onClick={() => setSortBy(sortBy === 'nilai-pg-tinggi' ? 'nilai-pg-rendah' : 'nilai-pg-tinggi')}
                  className="px-3 py-3.5 text-blue-700 hover:text-blue-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Nilai PG</span>
                    {sortBy === 'nilai-pg-tinggi' && <span>▼</span>}
                    {sortBy === 'nilai-pg-rendah' && <span>▲</span>}
                  </div>
                </th>
                <th 
                  onClick={() => setSortBy(sortBy === 'nilai-essay-tinggi' ? 'nilai-essay-rendah' : 'nilai-essay-tinggi')}
                  className="px-3 py-3.5 text-purple-700 hover:text-purple-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Nilai Essay</span>
                    {sortBy === 'nilai-essay-tinggi' && <span>▼</span>}
                    {sortBy === 'nilai-essay-rendah' && <span>▲</span>}
                  </div>
                </th>
                <th className="px-3 py-3.5 text-emerald-800">
                  <div className="flex items-center gap-1">
                    <span>Bonus Essay</span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Maks +{examWeights.bonusMaxPoints || 20}
                    </span>
                  </div>
                </th>
                <th 
                  onClick={() => setSortBy(sortBy === 'nilai-tinggi' ? 'nilai-rendah' : 'nilai-tinggi')}
                  className="px-4 py-3.5 text-indigo-950 hover:text-blue-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Nilai Akhir</span>
                    {sortBy === 'nilai-tinggi' && <span className="text-indigo-600">▼</span>}
                    {sortBy === 'nilai-rendah' && <span className="text-indigo-600">▲</span>}
                  </div>
                </th>
                <th className="px-3 py-3.5">Status</th>
                <th 
                  onClick={() => setSortBy(sortBy === 'terbaru' ? 'terlama' : 'terbaru')}
                  className="px-3 py-3.5 hover:text-indigo-950 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Waktu</span>
                    {sortBy === 'terbaru' && <span className="text-indigo-600">▼</span>}
                    {sortBy === 'terlama' && <span className="text-indigo-600">▲</span>}
                  </div>
                </th>
                <th className="w-16 px-3 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-4 py-4"><div className="h-8 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((result, idx) => {
                  const rowIndex = pageSize === 0 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                  const pgScore = result.score_pg !== null && result.score_pg !== undefined ? result.score_pg : (typeof result.score === 'number' ? result.score : 0);
                  const essayScore = result.score_essay !== null && result.score_essay !== undefined ? result.score_essay : null;
                  const bonusMax = examWeights.bonusMaxPoints ?? 20;
                  const potentialBonus = essayScore !== null ? Math.round(((essayScore / 100) * bonusMax) * 10) / 10 : 0;
                  const isBonusActive = !bonusDisabledStudents[result.id];
                  const finalScore = Math.round(result.score || 0);

                  return (
                    <tr 
                      key={result.id} 
                      onClick={() => fetchDetail(result)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      {/* No */}
                      <td className="w-12 px-3 py-3 text-center font-bold text-xs text-slate-400">
                        {rowIndex}
                      </td>

                      {/* Siswa & Kelas */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-indigo-950 flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-white shadow-xs">
                            {result.name ? result.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-indigo-950 text-sm leading-tight truncate">{capitalizeEachWord(result.name)}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                              <span className="font-semibold text-slate-500">{result.class}</span>
                              {selectedExam === 'all' && result.exams?.title && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[150px]">{result.exams.title}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nilai PG */}
                      <td className="px-3 py-3">
                        {result.status === 'menunggu_scan' ? (
                          <span className="text-xs font-bold text-slate-400">-</span>
                        ) : (
                          <span className="text-sm font-black text-blue-700">
                            {pgScore}
                          </span>
                        )}
                      </td>

                      {/* Nilai Essay */}
                      <td className="px-3 py-3">
                        {result.status === 'menunggu_scan' ? (
                          <span className="text-xs font-bold text-slate-400">-</span>
                        ) : result.essay_graded === false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">
                            Perlu Dinilai
                          </span>
                        ) : essayScore !== null ? (
                          <span className="text-sm font-black text-purple-700">
                            {essayScore}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-300">-</span>
                        )}
                      </td>

                      {/* Bonus Essay Pill */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        {result.status === 'menunggu_scan' || examWeights.mode !== 'pg_bonus_essay' ? (
                          <span className="text-xs text-slate-300">-</span>
                        ) : pgScore >= 100 ? (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full" title="Nilai PG sudah 100 (maksimal)">
                            PG 100
                          </span>
                        ) : potentialBonus === 0 ? (
                          <span className="text-xs font-medium text-slate-400">+0 Poin</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleToggleStudentBonus(result.id, e)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95",
                              isBonusActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            )}
                            title={isBonusActive ? "Nilai tambah aktif. Klik untuk matikan bagi siswa ini" : "Nilai tambah nonaktif. Klik untuk aktifkan bagi siswa ini"}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", isBonusActive ? "bg-emerald-500" : "bg-slate-400")} />
                            <span>{isBonusActive ? `+${potentialBonus} Poin` : 'Nonaktif'}</span>
                          </button>
                        )}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="px-4 py-3">
                        {result.status === 'menunggu_scan' ? (
                          <span className="text-xs font-bold text-amber-600">Menunggu Scan</span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-indigo-950">{finalScore}</span>
                            {examWeights.mode === 'pg_bonus_essay' && isBonusActive && potentialBonus > 0 && pgScore < 100 && (
                              <span className="text-[10px] font-bold text-emerald-600">
                                ({pgScore}+{potentialBonus})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        {result.status === 'menunggu_scan' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                            Scan QR
                          </span>
                        ) : (
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase",
                            finalScore >= 75 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            finalScore >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-rose-50 text-rose-700 border border-rose-200"
                          )}>
                            {finalScore >= 75 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : 
                             finalScore >= 50 ? <AlertCircle className="w-3 h-3 text-amber-600" /> : 
                             <XCircle className="w-3 h-3 text-rose-600" />}
                            {finalScore >= 75 ? 'Lulus' : finalScore >= 50 ? 'Remedial' : 'Gagal'}
                          </span>
                        )}
                      </td>

                      {/* Waktu Selesai */}
                      <td className="px-3 py-3 text-xs text-slate-500">
                        <div className="leading-tight">
                          <p className="font-semibold text-slate-700">{new Date(result.end_time || result.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-[10px] text-slate-400">{new Date(result.end_time || result.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="w-16 px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetParticipant(result.id, result.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                            title="Reset Ujian Siswa (Hapus jawaban & mulai ulang)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-indigo-950 group-hover:text-indigo-600 rounded-lg transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-indigo-950 mb-1">Belum ada hasil</h3>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto">
                      Hasil ujian akan muncul di sini setelah siswa menyelesaikan ujian mereka.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Bar */}
        {!loading && filteredResults.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-800">
                {pageSize === 0 
                  ? `1 - ${filteredResults.length}` 
                  : `${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filteredResults.length)}`}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-800">{filteredResults.length} siswa</span>
              
              <div className="ml-2 flex items-center gap-1 border-l border-slate-200 pl-2">
                <span>Per hal:</span>
                {[25, 50, 100].map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setPageSize(size); setCurrentPage(1); }}
                    className={cn(
                      "px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer",
                      pageSize === size ? "bg-indigo-950 text-white" : "hover:bg-slate-200 text-slate-600"
                    )}
                  >
                    {size}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setPageSize(0); setCurrentPage(1); }}
                  className={cn(
                    "px-2 py-0.5 rounded font-bold text-xs transition-colors cursor-pointer",
                    pageSize === 0 ? "bg-indigo-950 text-white" : "hover:bg-slate-200 text-slate-600"
                  )}
                >
                  Semua
                </button>
              </div>
            </div>

            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <span className="px-2 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
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
                      type="button"
                      onClick={handleGradeAllStudentEssays}
                      disabled={studentAiGrading}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Periksa semua jawaban essay siswa ini secara otomatis"
                    >
                      {studentAiGrading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-700" />
                          <span>Menganalisis...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Koreksi Otomatis Essay</span>
                        </>
                      )}
                    </button>
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

                {/* Banner Status Nilai Tambah Essay untuk Siswa Ini */}
                {examWeights.mode === 'pg_bonus_essay' && selectedResult && (
                  <div className="mx-6 sm:mx-8 mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>Skema Nilai Tambah Essay</span>
                          {!bonusDisabledStudents[selectedResult.id] ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">AKTIF</span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">NONAKTIF (MURNI PG)</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          {(() => {
                            const bonusMax = examWeights.bonusMaxPoints ?? 20;
                            const essayScore = selectedResult.score_essay ?? 0;
                            const bonus = Math.round(((essayScore / 100) * bonusMax) * 10) / 10;
                            const pg = selectedResult.score_pg ?? 0;
                            if (!bonusDisabledStudents[selectedResult.id]) {
                              return `Nilai PG: ${pg} + Tambahan Essay: +${bonus} (Maks +${bonusMax}) ➔ Nilai Akhir: ${selectedResult.score} (Maks 100)`;
                            } else {
                              return `Nilai tambah essay dinonaktifkan untuk siswa ini. Nilai Akhir menggunakan Nilai Murni PG (${pg}).`;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleStudentBonus(selectedResult.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border active:scale-95 shrink-0",
                        !bonusDisabledStudents[selectedResult.id]
                          ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          : "bg-indigo-950 text-white border-indigo-950 hover:bg-indigo-900"
                      )}
                    >
                      {!bonusDisabledStudents[selectedResult.id] ? 'Nonaktifkan Tambahan' : 'Aktifkan Tambahan'}
                    </button>
                  </div>
                )}

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

          {/* Modal Batch AI Grading (1 Kelas / Sesi) */}
          {showBatchModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !batchRunning && setShowBatchModal(false)}
                className="absolute inset-0 bg-slate-950/75"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 p-6 sm:p-8"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-950 text-white flex items-center justify-center shadow-sm">
                      <FileCheck className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-indigo-950">
                        Koreksi Otomatis Jawaban Essay
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Evaluasi seluruh jawaban uraian siswa secara terstandar dan objektif
                      </p>
                    </div>
                  </div>
                  {!batchRunning && (
                    <button 
                      onClick={() => setShowBatchModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <XCircleIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  )}
                </div>

                {!batchRunning && !batchSummary && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">
                        Sistem akan menganalisis jawaban essay setiap siswa pada ujian ini berdasarkan konsep acuan guru, serta menghasilkan nilai 0–100 dan catatan evaluasi.
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Siswa Terpilih</span>
                          <p className="text-lg font-black text-indigo-950">{filteredResults.length}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Perlu Dinilai</span>
                          <p className="text-lg font-black text-amber-600">{pendingEssayCount}</p>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={batchOnlyUngraded}
                        onChange={(e) => setBatchOnlyUngraded(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-950 focus:ring-indigo-950 border-slate-300"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">Hanya koreksi yang belum dinilai</span>
                        <p className="text-[11px] text-slate-500 font-medium">Nilai essay yang telah diisi secara manual tidak akan tertimpa.</p>
                      </div>
                    </label>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowBatchModal(false)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchAIGrade}
                        className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-indigo-300" />
                        <span>Mulai Koreksi Sekarang</span>
                      </button>
                    </div>
                  </div>
                )}

                {batchRunning && (
                  <div className="py-6 space-y-5 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-950 animate-spin mx-auto" />
                    <div>
                      <h4 className="font-black text-indigo-950 text-base">Sedang Memeriksa Jawaban...</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {batchProgress.studentName ? `Sedang menilai: ${batchProgress.studentName}` : 'Menyiapkan data...'}
                      </p>
                    </div>

                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-indigo-950 h-full transition-all duration-300"
                          style={{ width: `${batchProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 px-1">
                        <span>{batchProgress.current} dari {batchProgress.total} jawaban</span>
                        <span>{batchProgress.percentage}%</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancelBatchAIGrade}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
                    >
                      Hentikan Proses
                    </button>
                  </div>
                )}

                {batchSummary && (
                  <div className="py-4 space-y-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <Check className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-indigo-950 text-lg">Pemeriksaan Selesai!</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Berhasil memeriksa dan mengupdate <strong className="text-slate-800">{batchSummary.totalEvaluated} jawaban essay</strong>.
                        Seluruh nilai akhir siswa otomatis dikalkulasi ulang sesuai bobot.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBatchModal(false);
                        setBatchSummary(null);
                      }}
                      className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-black text-xs hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                    >
                      Selesai & Lihat Hasil
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Modal Pengaturan Bobot & Bonus Essay */}
          {showCustomWeightModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCustomWeightModal(false)}
                className="absolute inset-0 bg-slate-950/75"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 p-5 sm:p-7"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      <SlidersHorizontal className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-indigo-950">Atur Skema & Bobot Nilai</h3>
                      <p className="text-xs text-slate-500 font-medium">Pilih metode perhitungan nilai akhir ujian</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCustomWeightModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    <XCircleIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Tab Pilihan Mode */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTempMode('pg_bonus_essay')}
                    className={cn(
                      "py-2 px-1 rounded-xl transition-all text-center cursor-pointer",
                      tempMode === 'pg_bonus_essay' 
                        ? "bg-white text-emerald-800 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    PG + Nilai Tambah
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempMode('custom')}
                    className={cn(
                      "py-2 px-1 rounded-xl transition-all text-center cursor-pointer",
                      tempMode === 'custom' 
                        ? "bg-white text-indigo-950 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Bobot Persentase (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempMode('proportional')}
                    className={cn(
                      "py-2 px-1 rounded-xl transition-all text-center cursor-pointer",
                      tempMode === 'proportional' 
                        ? "bg-white text-indigo-950 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Proporsional Poin
                  </button>
                </div>

                {/* Konten Tab 1: PG + Bonus Essay */}
                {tempMode === 'pg_bonus_essay' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-700 leading-relaxed">
                        Nilai utama 100% diambil dari skor PG. Siswa yang menjawab essay dengan benar akan mendapatkan nilai tambah (maksimal nilai akhir 100).
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Batas Maksimal Nilai Tambah Essay:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[15, 20, 25, 30].map(pts => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setTempBonusMax(pts)}
                            className={cn(
                              "py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                              tempBonusMax === pts
                                ? "bg-indigo-950 text-white border-indigo-950 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            +{pts} Poin
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Pengaturan Serentak Siswa:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleApplyBonusToAll();
                            alert('Nilai tambah essay berhasil diaktifkan untuk seluruh siswa.');
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all border border-emerald-200 cursor-pointer"
                        >
                          Aktifkan Semua Siswa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDisableBonusForAll();
                            alert('Nilai tambah essay dinonaktifkan untuk semua siswa (murni PG).');
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all border border-slate-200 cursor-pointer"
                        >
                          Matikan Semua Siswa
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Anda juga dapat mengklik status nilai tambah pada baris tabel untuk mengatur per individu.</p>
                    </div>
                  </div>
                )}

                {/* Konten Tab 2: Persentase Campuran */}
                {tempMode === 'custom' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Preset Cepat:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '70% : 30%', pg: 70, essay: 30 },
                          { label: '60% : 40%', pg: 60, essay: 40 },
                          { label: '50% : 50%', pg: 50, essay: 50 },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setTempPgWeight(preset.pg);
                              setTempEssayWeight(preset.essay);
                            }}
                            className={cn(
                              "py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                              tempPgWeight === preset.pg && tempEssayWeight === preset.essay
                                ? "bg-indigo-950 text-white border-indigo-950 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Bobot PG:</span>
                        <span className="text-blue-700">{tempPgWeight}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={tempPgWeight}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTempPgWeight(val);
                          setTempEssayWeight(100 - val);
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Bobot Essay:</span>
                        <span className="text-purple-700">{tempEssayWeight}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={tempEssayWeight}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTempEssayWeight(val);
                          setTempPgWeight(100 - val);
                        }}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Konten Tab 3: Proporsional */}
                {tempMode === 'proportional' && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs">
                    <p className="font-bold text-indigo-950 leading-relaxed">
                      Nilai dihitung merata dan proporsional berdasarkan jumlah butir soal yang ada pada ujian ini secara otomatis.
                    </p>
                  </div>
                )}

                {/* Tombol Simpan */}
                <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomWeightModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateWeights({
                        mode: tempMode || 'pg_bonus_essay',
                        pgWeight: tempPgWeight,
                        essayWeight: tempEssayWeight,
                        bonusMaxPoints: tempBonusMax
                      });
                      setShowCustomWeightModal(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Terapkan Skema
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
