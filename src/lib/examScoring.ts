/**
 * examScoring.ts
 * Utility kalkulasi bobot cerdas (Smart Auto-Scaling to 100) & Fleksibel (PG % + Essay %)
 * Memisahkan nilai Pilihan Ganda (PG / Objektif) dan Essay secara transparan,
 * serta menghitung nilai akhir sesuai persentase bobot yang ditentukan guru.
 */

export interface ExamWeights {
  mode: 'proportional' | 'custom';
  pgWeight: number;    // contoh: 70
  essayWeight: number; // contoh: 30
}

export interface ExamScoringInput {
  questions: Array<{
    id: string;
    question_type?: string;
  }>;
  answers: Array<{
    question_id: string;
    is_correct?: boolean | null;
    score?: number | null;
    answer_text?: string | null;
    option_id?: string | null;
  }>;
  weights?: ExamWeights | null;
}

export interface ExamScoringResult {
  totalQuestions: number;
  pgQuestionsCount: number;
  essayQuestionsCount: number;
  pgCorrectCount: number;
  
  // Nilai Murni (Skala 0 - 100)
  scorePg: number; // Nilai murni PG (0 - 100)
  scoreEssay: number | null; // Nilai rata-rata murni Essay (0 - 100), null jika belum dinilai
  
  // Bobot yang diaplikasikan
  appliedWeights: ExamWeights;

  // Nilai Akhir Gabungan (Skala 0 - 100)
  finalScore: number;
  
  // Status kelengkapan penilaian essay
  isEssayGraded: boolean;
  gradedEssayCount: number;
  
  // Ringkasan tekstual untuk tooltip/display
  breakdownText: string;
}

const WEIGHTS_STORAGE_KEY_PREFIX = 'eduverse_exam_weights_';

/**
 * Mendapatkan bobot ujian tersimpan (default: 70% PG & 30% Essay)
 */
export function getExamWeights(examId?: string): ExamWeights {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const key = examId ? `${WEIGHTS_STORAGE_KEY_PREFIX}${examId}` : `${WEIGHTS_STORAGE_KEY_PREFIX}default`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.pgWeight === 'number' && typeof parsed.essayWeight === 'number') {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return {
    mode: 'custom',
    pgWeight: 70,
    essayWeight: 30
  };
}

/**
 * Menyimpan konfigurasi bobot ke Local Storage
 */
export function saveExamWeights(weights: ExamWeights, examId?: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const key = examId ? `${WEIGHTS_STORAGE_KEY_PREFIX}${examId}` : `${WEIGHTS_STORAGE_KEY_PREFIX}default`;
    localStorage.setItem(key, JSON.stringify(weights));
  }
}

/**
 * Menghitung nilai ujian secara cerdas dan proporsional / berbobot custom.
 */
export function calculateExamScores(input: ExamScoringInput): ExamScoringResult {
  const { questions = [], answers = [], weights } = input;
  const totalQuestions = questions.length;

  const defaultWeights: ExamWeights = weights || {
    mode: 'custom',
    pgWeight: 70,
    essayWeight: 30
  };

  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      pgQuestionsCount: 0,
      essayQuestionsCount: 0,
      pgCorrectCount: 0,
      scorePg: 0,
      scoreEssay: null,
      appliedWeights: defaultWeights,
      finalScore: 0,
      isEssayGraded: true,
      gradedEssayCount: 0,
      breakdownText: 'Tidak ada soal.'
    };
  }

  // Petakan jawaban berdasarkan question_id
  const answerMap = new Map<string, any>();
  answers.forEach(ans => {
    if (ans.question_id) {
      answerMap.set(ans.question_id, ans);
    }
  });

  let pgCount = 0;
  let pgCorrect = 0;
  let essayCount = 0;
  let gradedEssayCount = 0;
  let totalEssayScoreAccumulator = 0; // Akumulasi nilai essay (masing-masing 0 s.d. 100)

  questions.forEach(q => {
    const isEssay = q.question_type === 'essay';
    const ans = answerMap.get(q.id);

    if (isEssay) {
      essayCount++;
      if (ans && typeof ans.score === 'number' && !isNaN(ans.score)) {
        gradedEssayCount++;
        totalEssayScoreAccumulator += Math.max(0, Math.min(100, ans.score));
      }
    } else {
      pgCount++;
      if (ans && ans.is_correct === true) {
        pgCorrect++;
      }
    }
  });

  // 1. Hitung Nilai Murni PG (Skala 0 s.d. 100)
  const scorePg = pgCount > 0 ? Math.round((pgCorrect / pgCount) * 100 * 10) / 10 : 0;

  // 2. Hitung Nilai Murni Essay (Skala 0 s.d. 100)
  const isEssayGraded = essayCount === 0 || gradedEssayCount === essayCount;
  let scoreEssay: number | null = null;

  if (essayCount > 0) {
    if (gradedEssayCount > 0) {
      scoreEssay = Math.round((totalEssayScoreAccumulator / essayCount) * 10) / 10;
    } else {
      scoreEssay = null; // Belum ada yang dinilai
    }
  }

  // 3. Hitung Nilai Akhir Gabungan (Skala 0 s.d. 100)
  let finalScore = 0;

  if (essayCount === 0) {
    // 100% Pilihan Ganda
    finalScore = scorePg;
  } else if (pgCount === 0) {
    // 100% Essay
    finalScore = scoreEssay !== null ? scoreEssay : 0;
  } else {
    // Ada PG dan Essay
    if (defaultWeights.mode === 'proportional') {
      const pgContribution = (pgCorrect / totalQuestions) * 100;
      const essayContribution = totalEssayScoreAccumulator / totalQuestions;
      finalScore = Math.round((pgContribution + essayContribution) * 10) / 10;
    } else {
      // Custom weight percentage (misal 70% PG : 30% Essay)
      const totalWeight = (defaultWeights.pgWeight + defaultWeights.essayWeight) || 100;
      const normPgWeight = (defaultWeights.pgWeight / totalWeight) * 100;
      const normEssayWeight = (defaultWeights.essayWeight / totalWeight) * 100;

      const essayScoreToUse = scoreEssay !== null ? scoreEssay : 0;
      const weightedPg = (scorePg * normPgWeight) / 100;
      const weightedEssay = (essayScoreToUse * normEssayWeight) / 100;
      finalScore = Math.round((weightedPg + weightedEssay) * 10) / 10;
    }
  }

  // Susun rincian teks (breakdown)
  let breakdownText = '';
  if (essayCount > 0 && pgCount > 0) {
    const weightLabel = defaultWeights.mode === 'custom' 
      ? ` (${defaultWeights.pgWeight}% : ${defaultWeights.essayWeight}%)` 
      : ' (Proporsional)';
    breakdownText = `PG: ${scorePg} | Essay: ${scoreEssay !== null ? scoreEssay : 'Belum Dinilai'} | Nilai Akhir: ${finalScore}${weightLabel}`;
  } else if (essayCount > 0) {
    breakdownText = `Essay: ${scoreEssay !== null ? scoreEssay : 'Belum Dinilai'} (${gradedEssayCount}/${essayCount} soal)`;
  } else {
    breakdownText = `PG: ${pgCorrect}/${pgCount} (${scorePg})`;
  }

  return {
    totalQuestions,
    pgQuestionsCount: pgCount,
    essayQuestionsCount: essayCount,
    pgCorrectCount: pgCorrect,
    scorePg,
    scoreEssay,
    appliedWeights: defaultWeights,
    finalScore,
    isEssayGraded,
    gradedEssayCount,
    breakdownText
  };
}
