/**
 * examScoring.ts
 * Utility kalkulasi bobot cerdas (Smart Auto-Scaling to 100)
 * Memisahkan nilai Pilihan Ganda (PG / Objektif) dan Essay secara transparan,
 * serta menggabungkan nilai akhir secara proporsional sesuai jumlah butir soal.
 */

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
}

export interface ExamScoringResult {
  totalQuestions: number;
  pgQuestionsCount: number;
  essayQuestionsCount: number;
  pgCorrectCount: number;
  
  // Nilai Murni (Skala 0 - 100)
  scorePg: number; // Nilai murni PG (0 - 100)
  scoreEssay: number | null; // Nilai rata-rata murni Essay (0 - 100), null jika belum dinilai
  
  // Nilai Akhir Gabungan (Skala 0 - 100)
  finalScore: number;
  
  // Status kelengkapan penilaian essay
  isEssayGraded: boolean;
  gradedEssayCount: number;
  
  // Ringkasan tekstual untuk tooltip/display
  breakdownText: string;
}

/**
 * Menghitung nilai ujian secara cerdas dan proporsional.
 * - Berapapun jumlah soal (misal 3 soal: 2 PG + 1 Essay), total nilai akhir selalu berskala 100.
 * - Nilai PG dan Essay dipisahkan dengan jelas.
 */
export function calculateExamScores(input: ExamScoringInput): ExamScoringResult {
  const { questions = [], answers = [] } = input;
  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      pgQuestionsCount: 0,
      essayQuestionsCount: 0,
      pgCorrectCount: 0,
      scorePg: 0,
      scoreEssay: null,
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
  // Setiap butir soal memiliki bobot: (100 / totalQuestions)
  // Kontribusi PG: (pgCorrect / totalQuestions) * 100
  // Kontribusi Essay: (totalEssayScoreAccumulator / (essayCount * 100)) * (essayCount / totalQuestions) * 100
  //                  = (totalEssayScoreAccumulator / totalQuestions)
  let finalScore = 0;

  if (essayCount === 0) {
    // 100% Pilihan Ganda
    finalScore = scorePg;
  } else if (pgCount === 0) {
    // 100% Essay
    finalScore = scoreEssay !== null ? scoreEssay : 0;
  } else {
    // Gabungan PG dan Essay (Proporsional per butir soal)
    const pgContribution = (pgCorrect / totalQuestions) * 100;
    const essayContribution = totalEssayScoreAccumulator / totalQuestions;
    finalScore = Math.round((pgContribution + essayContribution) * 10) / 10;
  }

  // Susun rincian teks (breakdown)
  let breakdownText = '';
  if (essayCount > 0 && pgCount > 0) {
    breakdownText = `PG: ${pgCorrect}/${pgCount} (${scorePg}) | Essay: ${scoreEssay !== null ? scoreEssay : 'Belum Dinilai'} | Total: ${finalScore}`;
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
    finalScore,
    isEssayGraded,
    gradedEssayCount,
    breakdownText
  };
}
