/**
 * essayEvaluator.ts
 * Utility evaluasi dan highlighter jawaban essay secara cerdas (100% Client-Side & Offline)
 * Menggunakan pencocokan kata kunci (keyword matcher), penyaringan stopword bahasa Indonesia,
 * segmentasi teks untuk visual highlighting, dan estimasi saran skor berbasis heuristik.
 */

// Stopwords umum Bahasa Indonesia untuk menyaring kata sambung/kata tugas non-substantif
export const INDONESIAN_STOPWORDS = new Set([
  'yang', 'di', 'ke', 'dari', 'pada', 'dalam', 'untuk', 'dengan', 'dan', 'atau',
  'ini', 'itu', 'adalah', 'yaitu', 'yakni', 'sebagai', 'oleh', 'karena', 'sebab',
  'jika', 'bila', 'apabila', 'maka', 'sehingga', 'agar', 'supaya', 'akan', 'telah',
  'sudah', 'sedang', 'dapat', 'bisa', 'ada', 'tidak', 'bukan', 'hanya', 'juga',
  'serta', 'tentang', 'secara', 'antara', 'terhadap', 'atas', 'bawah', 'saja',
  'pun', 'para', 'ia', 'dia', 'mereka', 'kita', 'kami', 'kamu', 'anda', 'tersebut',
  'hal', 'suatu', 'seperti', 'bagai', 'bagaikan', 'ketika', 'saat', 'waktu', 'lalu',
  'kemudian', 'setelah', 'sebelum', 'sesudah', 'menurut', 'bagi', 'harus', 'perlu',
  'sangat', 'lebih', 'paling', 'amat', 'terlalu', 'masih', 'selalu', 'sering'
]);

export interface KeywordMatch {
  keyword: string;
  matched: boolean;
  occurrences: number;
}

export interface EssayEvaluationResult {
  keywords: KeywordMatch[];
  matchedCount: number;
  totalKeywords: number;
  coverageRatio: number; // 0 s.d. 1
  suggestedScore: number; // 0 s.d. 100
  wordCount: number;
  charCount: number;
  feedbackSummary: string;
}

export interface TextSegment {
  text: string;
  isMatch: boolean;
  matchedKeyword?: string;
}

/**
 * Membersihkan string dari tanda baca berlebih dan spasi ganda
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Mengekstrak daftar kata kunci dari kunci jawaban / pedoman penilaian guru.
 * Mendukung format daftar dipisah koma (misal: "fotosintesis, klorofil, air")
 * maupun kalimat narasi alami.
 */
export function extractKeywords(referenceText: string): string[] {
  if (!referenceText || typeof referenceText !== 'string') return [];

  const raw = referenceText.trim();
  if (!raw) return [];

  const candidates: string[] = [];

  // Jika guru menulis format dipisah koma / baris baru / titik koma
  if (raw.includes(',') || raw.includes(';') || raw.includes('\n')) {
    const rawChunks = raw.split(/[,;\n]+/);
    rawChunks.forEach(chunk => {
      const cleanChunk = chunk.toLowerCase().replace(/[^\w\s-]/g, ' ').trim();
      const words = cleanChunk.split(/\s+/).filter(Boolean);
      
      // Jika potongan pendek (1-3 kata, misal "cahaya matahari", "klorofil"), bersihkan stopword di sekitarnya
      if (words.length > 0 && words.length <= 3) {
        const filtered = words.filter(w => !INDONESIAN_STOPWORDS.has(w));
        if (filtered.length > 0) {
          candidates.push(filtered.join(' '));
        }
      } else if (words.length > 3) {
        // Jika kalimat panjang, ambil kata-kata bermakna substantif
        words.forEach(w => {
          if (w.length >= 3 && !INDONESIAN_STOPWORDS.has(w)) {
            candidates.push(w);
          }
        });
      }
    });
  }

  // Jika belum ada kandidat atau narasi murni tanpa pemisah
  if (candidates.length === 0) {
    const words = raw
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length >= 3 && !INDONESIAN_STOPWORDS.has(w));
    candidates.push(...words);
  }

  return Array.from(new Set(candidates.filter(c => c && c.length >= 2)));
}

export type EvaluationMode = 'balanced' | 'length_effort' | 'keyword_only';

export interface EvaluationOptions {
  mode?: EvaluationMode;
  minEffortScore?: number; // Nilai dasar usaha murid menjawab (default: 20). Nilai 0 HANYA jika kosong!
  targetWordCount?: number; // Target jumlah kata untuk nilai maksimal panjang/usaha (default: 35)
}

/**
 * Evaluasi jawaban siswa terhadap teks acuan kunci jawaban guru.
 * Menghitung kecocokan kata kunci dan memberikan estimasi skor heuristik cerdas.
 * Mendukung opsi mode penilaian (seimbang, panjang teks/usaha, kata kunci saja).
 * Menjamin murid yang menjawab TIDAK PERNAH mendapat nilai 0 (nilai 0 hanya jika dikosongkan).
 */
export function evaluateEssayAnswer(
  studentAnswer: string | null | undefined,
  referenceText: string | null | undefined,
  options: EvaluationOptions = {}
): EssayEvaluationResult {
  const cleanAnswer = (studentAnswer || '').trim();
  const cleanRef = (referenceText || '').trim();

  const words = cleanAnswer ? cleanAnswer.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const charCount = cleanAnswer.length;

  // Jika siswa tidak menjawab sama sekali: Nilai 0 HANYA diberikan jika lembar kosong!
  if (wordCount === 0 || !cleanAnswer) {
    return {
      keywords: [],
      matchedCount: 0,
      totalKeywords: 0,
      coverageRatio: 0,
      suggestedScore: 0,
      wordCount: 0,
      charCount: 0,
      feedbackSummary: 'Tidak ada jawaban tertulis dari siswa (Lembar kosong = 0 poin).'
    };
  }

  const mode = options.mode || 'balanced';
  const minEffort = Math.max(1, options.minEffortScore ?? 20); // Nilai dasar apresiasi usaha
  const targetWords = Math.max(10, options.targetWordCount ?? 35);
  const scoreRange = 100 - minEffort; // Sisa rentang poin untuk pencapaian (misal 80 poin)

  // Ekstrak kata kunci acuan
  const keywords = extractKeywords(cleanRef);

  const answerLower = cleanAnswer.toLowerCase();
  const keywordMatches: KeywordMatch[] = [];
  let matchedCount = 0;

  if (keywords.length > 0) {
    keywords.forEach(kw => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = answerLower.match(regex);
      const count = matches ? matches.length : (answerLower.includes(kw) ? 1 : 0);

      const isMatched = count > 0;
      if (isMatched) matchedCount++;

      keywordMatches.push({
        keyword: kw,
        matched: isMatched,
        occurrences: count
      });
    });
  }

  const coverageRatio = keywords.length > 0 ? matchedCount / keywords.length : 0;
  let calculated = minEffort;
  let feedback = '';

  if (mode === 'length_effort' || keywords.length === 0) {
    // Mode Fokus Panjang Teks & Usaha Mengetik: Semakin banyak yang diketik murid, semakin bagus nilainya
    const lengthRatio = Math.min(1, wordCount / targetWords);
    const lengthScore = lengthRatio * scoreRange * 0.85;
    const kwBonus = coverageRatio * (scoreRange * 0.15);
    calculated = Math.round(minEffort + lengthScore + kwBonus);

    feedback = `Jawaban berisi ${wordCount} kata (Target optimal: ${targetWords} kata). Nilai dinilai berdasarkan kelengkapan & usaha mengetik (Minimal ${minEffort} poin, Nilai 0 hanya jika kosong).`;
  } else if (mode === 'keyword_only') {
    // Mode Fokus Kata Kunci Murni
    calculated = Math.round(minEffort + (coverageRatio * scoreRange));
    feedback = `Menemukan ${matchedCount} dari ${keywords.length} konsep kata kunci (${Math.round(coverageRatio * 100)}%). Memiliki skor dasar usaha ${minEffort} poin.`;
  } else {
    // Mode Balanced (Seimbang: Kata Kunci + Usaha Panjang Teks)
    const kwScore = coverageRatio * (scoreRange * 0.70);
    const lengthScore = Math.min(1, wordCount / targetWords) * (scoreRange * 0.30);
    calculated = Math.round(minEffort + kwScore + lengthScore);

    feedback = `Menemukan ${matchedCount} dari ${keywords.length} konsep kata kunci (${Math.round(coverageRatio * 100)}%) dengan panjang ${wordCount} kata. Memiliki skor dasar usaha ${minEffort} poin.`;
  }

  // Pastikan murid yang menjawab TIDAK PERNAH mendapat nilai 0
  calculated = Math.max(minEffort, Math.min(100, calculated));

  // Jika kata kunci 100% lengkap
  if (coverageRatio === 1 && keywords.length > 0) {
    calculated = Math.max(95, calculated);
  }

  return {
    keywords: keywordMatches,
    matchedCount,
    totalKeywords: keywords.length,
    coverageRatio,
    suggestedScore: calculated,
    wordCount,
    charCount,
    feedbackSummary: feedback
  };
}

/**
 * Memecah teks jawaban siswa menjadi segmen-segmen agar kata kunci
 * yang cocok dapat diberi highlight visual (warna hijau) di antarmuka React.
 */
export function highlightTextSegments(
  text: string | null | undefined,
  keywords: string[]
): TextSegment[] {
  if (!text) return [];
  if (!keywords || keywords.length === 0) {
    return [{ text, isMatch: false }];
  }

  // Buat ekspresi reguler gabungan dengan sort panjang kata terpanjang terlebih dahulu
  const sortedKws = [...keywords]
    .map(k => k.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (sortedKws.length === 0) {
    return [{ text, isMatch: false }];
  }

  const escapedPatterns = sortedKws.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedPatterns.join('|')})`, 'gi');

  const parts = text.split(regex);
  const segments: TextSegment[] = [];

  parts.forEach(part => {
    if (!part) return;
    const matchKw = sortedKws.find(k => k.toLowerCase() === part.toLowerCase());
    if (matchKw) {
      segments.push({
        text: part,
        isMatch: true,
        matchedKeyword: matchKw
      });
    } else {
      segments.push({
        text: part,
        isMatch: false
      });
    }
  });

  return segments;
}

/**
 * Deteksi pola menyerah / tidak tahu / asal ketik (0 Token Cost)
 */
const GIVING_UP_PATTERNS = [
  /^(tidak|nggak|gak|ga|ndak|kurang)\s*(tahu|tau|paham|mengerti|bisa|ingat)$/i,
  /^(lupa|gatau|tidaktahu|ndatau|skip|pass|kosong|belum\s*belajar|asdf+|qwerty+|none|null|nil)$/i,
  /^(\.|\-|\?|\!|\,|\/|x|0)+$/i
];

export interface LocalHeuristicResult {
  handledLocally: boolean;
  score: number;
  feedback: string;
  reason?: string;
}

/**
 * Evaluasi kilat lokal gratis sebelum memanggil AI (Tier 1 Heuristic Filter)
 * Menyaring jawaban kosong, menyerah, atau jawaban yang 100% cocok.
 */
export function fastLocalHeuristicCheck(
  studentAnswer: string | null | undefined,
  correctAnswer?: string | null
): LocalHeuristicResult {
  const cleanStudent = (studentAnswer || '').trim();
  const cleanKey = (correctAnswer || '').trim();

  // 1. Jawaban Kosong
  if (!cleanStudent) {
    return {
      handledLocally: true,
      score: 0,
      feedback: 'Siswa tidak menuliskan jawaban.',
      reason: 'Jawaban kosong'
    };
  }

  // 2. Jawaban terlalu pendek atau karakter acak / tanda baca doang
  if (cleanStudent.length <= 2) {
    return {
      handledLocally: true,
      score: 0,
      feedback: 'Jawaban terlalu singkat atau belum menjawab soal.',
      reason: 'Kurang dari 3 karakter'
    };
  }

  // 3. Jawaban menyerah / asal ketik
  const isGivingUp = GIVING_UP_PATTERNS.some(pattern => pattern.test(cleanStudent));
  if (isGivingUp) {
    return {
      handledLocally: true,
      score: 0,
      feedback: 'Jawaban belum menjawab esensi pertanyaan.',
      reason: 'Pola menyerah/tidak tahu'
    };
  }

  // 4. Exact Match dengan Kunci Jawaban
  const normStudent = cleanStudent.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const normKey = cleanKey.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (normKey && normStudent === normKey) {
    return {
      handledLocally: true,
      score: 100,
      feedback: 'Jawaban tepat dan sangat sesuai dengan konsep.',
      reason: 'Kecocokan penuh (Exact Match)'
    };
  }

  // 5. Cek coverage kata kunci jika kunci jawaban tersedia
  if (cleanKey) {
    const evalRes = evaluateEssayAnswer(cleanStudent, cleanKey, { mode: 'balanced' });
    if (evalRes.totalKeywords >= 2 && evalRes.coverageRatio >= 0.95 && evalRes.wordCount >= 4) {
      return {
        handledLocally: true,
        score: 95,
        feedback: 'Konsep utama dijawab dengan sangat baik.',
        reason: 'Keyword coverage >= 95%'
      };
    }
  }

  return {
    handledLocally: false,
    score: 0,
    feedback: ''
  };
}

/**
 * Menghitung kemiripan teks antar jawaban siswa (Jaccard Similarity)
 * Digunakan untuk deduplikasi / mewarisi nilai jawaban serupa (0 Token)
 */
export function calculateTextSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  const cleanA = textA.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  const cleanB = textB.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
  if (cleanA === cleanB) return 1.0;

  const wordsA = new Set(cleanA.split(/\s+/).filter(w => w.length >= 2 && !INDONESIAN_STOPWORDS.has(w)));
  const wordsB = new Set(cleanB.split(/\s+/).filter(w => w.length >= 2 && !INDONESIAN_STOPWORDS.has(w)));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  wordsA.forEach(w => {
    if (wordsB.has(w)) intersection++;
  });

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

