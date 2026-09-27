/**
 * openKeyEvaluator.ts
 * Integrasi OpenKey API (OpenAI-compatible) untuk evaluasi jawaban essay secara semantik dan objektif.
 */

export interface OpenKeyConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface EssayEvaluationRequest {
  questionText: string;
  correctAnswer?: string | null;
  studentAnswer: string;
  maxScore?: number; // default: 100
}

export interface EssayEvaluationResult {
  score: number;
  feedback: string;
  reasoning?: string;
}

const STORAGE_KEY = 'eduverse_openkey_config';

/**
 * Mengambil konfigurasi OpenKey aktif (Local Storage -> Environment Variables)
 */
export function getOpenKeyConfig(): OpenKeyConfig {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey) {
          return {
            apiKey: parsed.apiKey,
            baseUrl: parsed.baseUrl || (import.meta as any).env?.VITE_OPENKEY_BASE_URL || 'https://my.openkey.id/v1',
            model: parsed.model || (import.meta as any).env?.VITE_OPENKEY_MODEL || 'gpt-4o-mini'
          };
        }
      }
    }
  } catch (e) {
    console.warn('Gagal membaca OpenKey config dari localStorage:', e);
  }

  return {
    apiKey: (import.meta as any).env?.VITE_OPENKEY_API_KEY || 'ok_live_356483a4d926ac446d00f84313df98716fbf6af23127722e',
    baseUrl: (import.meta as any).env?.VITE_OPENKEY_BASE_URL || 'https://my.openkey.id/v1',
    model: (import.meta as any).env?.VITE_OPENKEY_MODEL || 'gpt-4o-mini'
  };
}

/**
 * Menyimpan konfigurasi OpenKey ke Local Storage
 */
export function saveOpenKeyConfig(config: OpenKeyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Gagal menyimpan OpenKey config ke localStorage:', e);
  }
}

/**
 * Menghapus tag markdown json dari response teks LLM
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Mengevaluasi satu jawaban essay menggunakan AI OpenKey
 */
export async function evaluateEssayWithAI(
  request: EssayEvaluationRequest,
  customConfig?: Partial<OpenKeyConfig>
): Promise<EssayEvaluationResult> {
  const config = { ...getOpenKeyConfig(), ...customConfig };

  if (!config.apiKey) {
    throw new Error('API Key OpenKey belum dikonfigurasi. Silakan periksa pengaturan API Key.');
  }

  // Jika jawaban siswa kosong
  if (!request.studentAnswer || request.studentAnswer.trim() === '') {
    return {
      score: 0,
      feedback: 'Siswa tidak menuliskan jawaban.',
      reasoning: 'Jawaban kosong'
    };
  }

  // Prompt ringkas & esensial (tidak menuntut panjang tulisan sama dengan kunci guru)
  const systemPrompt = `Penilai esai sekolah objektif. Kunci guru adalah acuan esensi konsep, BUKAN patokan panjang tulisan. Siswa TIDAK dituntut menulis sepanjang kunci. Jika siswa menangkap konsep pokok dg benar meski singkat, beri nilai tinggi (85-100). Balas HANYA JSON tanpa markdown: {"score":number,"feedback":"1 kalimat singkat (maks 8 kata)"}`;

  const cleanQuestion = (request.questionText || '').trim().slice(0, 300);
  const cleanAnswerKey = (request.correctAnswer || '').trim().slice(0, 300);
  const cleanStudent = request.studentAnswer.trim().slice(0, 300);

  const userContent = `Soal: ${cleanQuestion}\nKunci: ${cleanAnswerKey || '-'}\nJawaban: ${cleanStudent}`;

  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBaseUrl}/chat/completions`;

  let data: any = null;
  let lastError: any = null;

  // 1. Coba lewat Vercel Serverless Function /api/evaluate-essay (Bypass CORS browser)
  try {
    const serverlessRes = await fetch('/api/evaluate-essay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionText: cleanQuestion,
        correctAnswer: cleanAnswerKey,
        studentAnswer: cleanStudent,
        apiKey: config.apiKey.trim(),
        model: config.model.trim() || 'gpt-4o-mini',
        baseUrl: cleanBaseUrl
      })
    });

    if (serverlessRes.ok) {
      data = await serverlessRes.json();
    } else {
      const errText = await serverlessRes.text();
      console.warn('Serverless endpoint non-200, trying proxy fallback:', errText);
    }
  } catch (serverlessErr) {
    // Di luar browser (misal Node) atau offline, lanjutkan ke proxy
  }

  // 2. Jika serverless belum mengembalikan data, coba lewat rewrite proxy /api/openkey/chat/completions
  if (!data) {
    try {
      const proxyRes = await fetch('/api/openkey/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model.trim() || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.1,
          max_tokens: 70
        })
      });

      if (proxyRes.ok) {
        data = await proxyRes.json();
      } else {
        const errText = await proxyRes.text();
        lastError = new Error(`Proxy Error (${proxyRes.status}): ${errText}`);
      }
    } catch (proxyErr) {
      lastError = proxyErr;
    }
  }

  // 3. Fallback direct endpoint (jika di luar browser atau direct URL)
  if (!data) {
    try {
      const directResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model.trim() || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.1,
          max_tokens: 70
        })
      });

      if (directResponse.ok) {
        data = await directResponse.json();
      } else {
        const errorBody = await directResponse.text();
        let parsedMsg = errorBody;
        try {
          const errJson = JSON.parse(errorBody);
          parsedMsg = errJson.error?.message || errJson.message || errorBody;
        } catch {
          // ignore
        }
        throw new Error(`OpenKey API Error (${directResponse.status}): ${parsedMsg}`);
      }
    } catch (directErr: any) {
      throw lastError || directErr;
    }
  }

  const rawText = data?.choices?.[0]?.message?.content || '';

  if (!rawText) {
    throw new Error('Tidak ada respon teks yang diterima dari AI OpenKey.');
  }

  try {
    const cleaned = cleanJsonString(rawText);
    const parsed = JSON.parse(cleaned);

    let score = Number(parsed.score ?? parsed.s);
    if (isNaN(score)) score = 50;
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
      feedback: parsed.feedback || parsed.f || 'Evaluasi AI selesai.',
      reasoning: parsed.reasoning || ''
    };
  } catch (parseError) {
    // Fallback regex jika JSON tidak valid
    const scoreMatch = rawText.match(/"score"\s*:\s*(\d+)/i) || rawText.match(/"s"\s*:\s*(\d+)/i) || rawText.match(/skor\s*:\s*(\d+)/i);
    const score = scoreMatch ? Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10))) : 50;
    
    return {
      score,
      feedback: 'Evaluasi telah diperiksa oleh AI.',
      reasoning: rawText.substring(0, 150)
    };
  }
}

export interface BatchStudentAnswerItem {
  id: string; // Answer ID
  studentAnswer: string;
}

export interface BatchQuestionEvaluationRequest {
  questionText: string;
  correctAnswer?: string | null;
  answers: BatchStudentAnswerItem[];
}

export interface BatchStudentResultItem {
  id: string;
  score: number;
  feedback: string;
}

/**
 * Mengevaluasi sekelompok jawaban murid untuk 1 soal yang sama dalam 1 request API
 * (Sangat menghemat token & kuota panggilan API hingga 85%)
 */
export async function evaluateQuestionBatchWithAI(
  request: BatchQuestionEvaluationRequest,
  customConfig?: Partial<OpenKeyConfig>
): Promise<BatchStudentResultItem[]> {
  if (!request.answers || request.answers.length === 0) {
    return [];
  }

  const config = { ...getOpenKeyConfig(), ...customConfig };
  if (!config.apiKey) {
    throw new Error('API Key OpenKey belum dikonfigurasi.');
  }

  // 1. Pisahkan langsung jawaban yang kosong tanpa memanggil AI (Skor 0 Mutlak)
  const finalResults: BatchStudentResultItem[] = [];
  const answersToEvaluate: { id: string; studentAnswer: string; indexKey: string }[] = [];
  const idMap = new Map<string, string>(); // indexKey -> realId

  request.answers.forEach((a, idx) => {
    const trimmed = (a.studentAnswer || '').trim();
    if (!trimmed) {
      finalResults.push({
        id: a.id,
        score: 0,
        feedback: 'Siswa tidak menuliskan jawaban.'
      });
    } else {
      const indexKey = String(idx + 1);
      idMap.set(indexKey, a.id);
      answersToEvaluate.push({
        id: a.id,
        studentAnswer: trimmed.slice(0, 250),
        indexKey
      });
    }
  });

  if (answersToEvaluate.length === 0) {
    return finalResults;
  }

  const systemPrompt = `Penilai esai sekolah objektif & efisien. Kunci guru adalah acuan esensi konsep, BUKAN patokan panjang tulisan. Siswa TIDAK dituntut menulis sepanjang kunci. Jika siswa menangkap konsep pokok secara tepat meski singkat dg bahasa sendiri, berikan nilai tinggi (85-100). Balas HANYA JSON array tanpa markdown: [{"i":nomor_indeks,"s":number,"f":"feedback ringkas maks 8 kata"}]`;

  const cleanQuestion = (request.questionText || '').trim().slice(0, 300);
  const cleanAnswerKey = (request.correctAnswer || '').trim().slice(0, 300);
  
  // Format jawaban menggunakan indeks 1, 2, 3 agar AI tidak salah ketik UUID
  const answersList = answersToEvaluate
    .map(a => `[${a.indexKey}]: ${a.studentAnswer}`)
    .join('\n');

  const userContent = `Soal: ${cleanQuestion}\nKunci: ${cleanAnswerKey || '-'}\nJawaban Siswa:\n${answersList}`;

  const cleanBaseUrl = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBaseUrl}/chat/completions`;
  const maxTokens = Math.min(600, Math.max(100, answersToEvaluate.length * 40));

  let data: any = null;
  let lastError: any = null;

  // 1. Coba via Vercel Serverless Function
  try {
    const serverlessRes = await fetch('/api/evaluate-essay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchMode: true,
        userContent,
        systemPrompt,
        maxTokens,
        apiKey: config.apiKey.trim(),
        model: config.model.trim() || 'gpt-4o-mini',
        baseUrl: cleanBaseUrl
      })
    });

    if (serverlessRes.ok) {
      data = await serverlessRes.json();
    }
  } catch (err) {
    // Fallback ke direct
  }

  // 2. Direct / Proxy Fallback
  if (!data) {
    try {
      const directResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model.trim() || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.1,
          max_tokens: maxTokens
        })
      });

      if (directResponse.ok) {
        data = await directResponse.json();
      } else {
        const errorBody = await directResponse.text();
        throw new Error(`OpenKey Batch Error (${directResponse.status}): ${errorBody}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!data) {
    throw lastError || new Error('Gagal menghubungi AI untuk evaluasi batch.');
  }

  const rawText = data?.choices?.[0]?.message?.content || '';
  if (!rawText) {
    throw new Error('Tidak ada respon teks yang diterima dari AI.');
  }

  // Parsing JSON array dari respons dan petakan kembali ke ID asli
  const evaluatedMap = new Map<string, { score: number; feedback: string }>();

  try {
    const cleaned = cleanJsonString(rawText);
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      parsed.forEach(item => {
        const returnedIndex = String(item.i ?? item.id ?? '');
        const realId = idMap.get(returnedIndex) || returnedIndex;
        let score = Number(item.s ?? item.score);
        if (isNaN(score)) score = 50;
        score = Math.max(0, Math.min(100, Math.round(score)));
        const feedback = String(item.f || item.feedback || 'Evaluasi AI selesai.');

        evaluatedMap.set(realId, { score, feedback });
      });
    }
  } catch (parseErr) {
    console.warn('Gagal parse JSON array batch, mencoba fallback regex:', parseErr);
  }

  // Masukkan hasil evaluasi untuk setiap item yang dikirim
  answersToEvaluate.forEach(a => {
    if (evaluatedMap.has(a.id)) {
      const res = evaluatedMap.get(a.id)!;
      finalResults.push({ id: a.id, score: res.score, feedback: res.feedback });
    } else {
      // Fallback regex jika parsing JSON array parsial
      const regex = new RegExp(`"\s*${a.indexKey}\s*".*?"(?:s|score)"\s*:\s*(\\d+)`, 'i');
      const match = rawText.match(regex);
      const score = match ? Math.max(0, Math.min(100, parseInt(match[1], 10))) : 0;
      finalResults.push({
        id: a.id,
        score,
        feedback: score > 0 ? 'Dinilai oleh AI (format disesuaikan).' : 'Perlu diperiksa manual.'
      });
    }
  });

  return finalResults;
}

/**
 * Menguji koneksi ke OpenKey API
 */
export async function testOpenKeyConnection(config?: Partial<OpenKeyConfig>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await evaluateEssayWithAI({
      questionText: 'Apakah fungsi klorofil pada tumbuhan?',
      correctAnswer: 'Menyerap cahaya matahari untuk fotosintesis',
      studentAnswer: 'Untuk menyerap sinar matahari saat fotosintesis',
    }, config);

    if (typeof res.score === 'number') {
      return {
        success: true,
        message: `Koneksi berhasil! Model aktif: ${getOpenKeyConfig().model}. Skor tes: ${res.score}/100.`
      };
    }
    return { success: false, message: 'Respon diterima namun format tidak sesuai.' };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Gagal terhubung ke OpenKey API'
    };
  }
}

/**
 * Batch Evaluator untuk mengoreksi sekumpulan jawaban secara terkontrol
 */
export interface BatchEssayItem {
  id: string; // Answer ID or Identifier
  participantId: string;
  studentName: string;
  questionId: string;
  questionText: string;
  correctAnswer?: string | null;
  studentAnswer: string;
}

export interface BatchProgressCallback {
  (progress: {
    processed: number;
    total: number;
    percentage: number;
    currentItem?: BatchEssayItem;
    result?: EssayEvaluationResult;
    error?: string;
  }): void;
}

export async function batchEvaluateEssays(
  items: BatchEssayItem[],
  onProgress?: BatchProgressCallback,
  signal?: AbortSignal
): Promise<Map<string, EssayEvaluationResult>> {
  const results = new Map<string, EssayEvaluationResult>();
  const total = items.length;

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) {
      break;
    }

    const item = items[i];
    try {
      const evaluation = await evaluateEssayWithAI({
        questionText: item.questionText,
        correctAnswer: item.correctAnswer,
        studentAnswer: item.studentAnswer
      });

      results.set(item.id, evaluation);

      if (onProgress) {
        onProgress({
          processed: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          currentItem: item,
          result: evaluation
        });
      }
    } catch (err: any) {
      console.error(`Gagal mengevaluasi jawaban ${item.id}:`, err);
      if (onProgress) {
        onProgress({
          processed: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          currentItem: item,
          error: err?.message || 'Error evaluasi'
        });
      }
    }

    // Jeda kecil (350ms) agar panggilan ke endpoint lancar dan tidak spike
    if (i < total - 1 && !signal?.aborted) {
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  }

  return results;
}
