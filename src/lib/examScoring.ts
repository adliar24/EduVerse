/**
 * examScoring.ts
 * Utility kalkulasi bobot cerdas (Smart Auto-Scaling to 100) & Fleksibel
 * Mendukung skema:
 * 1. 'pg_bonus_essay' (Rekomendasi Guru): Nilai dasar full dari PG (0-100), essay sebagai nilai tambah/bonus (dongkrak nilai), maksimal total 100.
 * 2. 'custom': Bobot persentase standar (misal 70% PG : 30% Essay).
 * 3. 'proportional': Bobot rata proporsional sesuai jumlah butir soal.
 */

export interface ExamWeights {
  mode: 'pg_bonus_essay' | 'custom' | 'proportional';
  pgWeight: number;    // contoh: 100 (pada bonus mode) atau 70 (pada custom)
  essayWeight: number; // contoh: 0 (pada bonus mode) atau 30 (pada custom)
  bonusMaxPoints?: number; // Poin maksimal bonus essay (default: 20 poin)
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
  applyBonusEssay?: boolean; // Toggle per individu (default: true jika mode pg_bonus_essay)
}

export interface ExamScoringResult {
  totalQuestions: number;
  pgQuestionsCount: number;
  essayQuestionsCount: number;
  pgCorrectCount: number;
  
  // Nilai Murni (Skala 0 - 100)
  scorePg: number; // Nilai murni PG (0 - 100)
  scoreEssay: number | null; // Nilai rata-rata murni Essay (0 - 100), null jika belum dinilai
  
  // Poin Tambahan Essay (Bonus)
  bonusPoints: number; // Nilai bonus essay yang didapat (misal: 16)
  bonusMax: number;    // Batas maksimal bonus (misal: 20)
  bonusApplied: boolean; // Apakah bonus diaktifkan untuk siswa ini

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
 * Mendapatkan bobot ujian tersimpan (default: PG + Bonus Essay 20 Poin)
 */
export function getExamWeights(examId?: string): ExamWeights {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const key = examId ? `${WEIGHTS_STORAGE_KEY_PREFIX}${examId}` : `${WEIGHTS_STORAGE_KEY_PREFIX}default`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.mode) {
          return {
            mode: parsed.mode,
            pgWeight: typeof parsed.pgWeight === 'number' ? parsed.pgWeight : (parsed.mode === 'pg_bonus_essay' ? 100 : 70),
            essayWeight: typeof parsed.essayWeight === 'number' ? parsed.essayWeight : (parsed.mode === 'pg_bonus_essay' ? 0 : 30),
            bonusMaxPoints: typeof parsed.bonusMaxPoints === 'number' ? parsed.bonusMaxPoints : 20
          };
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return {
    mode: 'pg_bonus_essay',
    pgWeight: 100,
    essayWeight: 0,
    bonusMaxPoints: 20
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
 * Menghitung nilai ujian secara cerdas (Skema PG + Bonus Essay atau Bobot Custom)
 */
export function calculateExamScores(input: ExamScoringInput): ExamScoringResult {
  const { questions = [], answers = [], weights, applyBonusEssay = true } = input;
  const totalQuestions = questions.length;

  const defaultWeights: ExamWeights = weights || {
    mode: 'pg_bonus_essay',
    pgWeight: 100,
    essayWeight: 0,
    bonusMaxPoints: 20
  };

  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      pgQuestionsCount: 0,
      essayQuestionsCount: 0,
      pgCorrectCount: 0,
      scorePg: 0,
      scoreEssay: null,
      bonusPoints: 0,
      bonusMax: defaultWeights.bonusMaxPoints || 20,
      bonusApplied: false,
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

  // 3. Hitung Nilai Akhir & Bonus Poin
  let finalScore = 0;
  let bonusPoints = 0;
  const bonusMax = defaultWeights.bonusMaxPoints ?? 20;
  let bonusApplied = false;

  if (essayCount === 0) {
    // 100% Pilihan Ganda (tidak ada essay)
    finalScore = scorePg;
  } else if (pgCount === 0) {
    // 100% Essay
    finalScore = scoreEssay !== null ? scoreEssay : 0;
  } else {
    // Ada PG dan Essay
    if (defaultWeights.mode === 'pg_bonus_essay') {
      // Skema Nilai Utama PG + Nilai Tambahan Essay
      const essayAvg = scoreEssay !== null ? scoreEssay : 0;
      // Rumus bonus: proporsional terhadap ketepatan essay
      const potentialBonus = Math.round(((essayAvg / 100) * bonusMax) * 10) / 10;
      bonusPoints = potentialBonus;

      if (applyBonusEssay && potentialBonus > 0) {
        bonusApplied = true;
        // Tambahkan bonus ke PG, dibatasi maksimal 100
        finalScore = Math.min(100, Math.round((scorePg + potentialBonus) * 10) / 10);
      } else {
        bonusApplied = false;
        // Nilai murni PG
        finalScore = scorePg;
      }
    } else if (defaultWeights.mode === 'proportional') {
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
    if (defaultWeights.mode === 'pg_bonus_essay') {
      if (bonusApplied) {
        breakdownText = `PG: ${scorePg} + Bonus Essay: +${bonusPoints} (Maks ${bonusMax}) = Nilai Akhir: ${finalScore} (Maks 100)`;
      } else {
        breakdownText = `Murni PG: ${scorePg} (Bonus Essay +${bonusPoints} dinonaktifkan)`;
      }
    } else if (defaultWeights.mode === 'custom') {
      breakdownText = `PG: ${scorePg} (${defaultWeights.pgWeight}%) + Essay: ${scoreEssay ?? 0} (${defaultWeights.essayWeight}%) = Nilai Akhir: ${finalScore}`;
    } else {
      breakdownText = `Proporsional | PG: ${scorePg} | Essay: ${scoreEssay ?? 0} = Nilai Akhir: ${finalScore}`;
    }
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
    bonusPoints,
    bonusMax,
    bonusApplied,
    appliedWeights: defaultWeights,
    finalScore,
    isEssayGraded,
    gradedEssayCount,
    breakdownText
  };
}
