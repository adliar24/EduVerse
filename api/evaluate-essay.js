export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      questionText,
      correctAnswer,
      studentAnswer,
      apiKey,
      model,
      baseUrl,
      batchMode,
      userContent: customUserContent,
      systemPrompt: customSystemPrompt,
      maxTokens
    } = req.body || {};

    const keyToUse = (apiKey || process.env.VITE_OPENKEY_API_KEY || 'ok_live_356483a4d926ac446d00f84313df98716fbf6af23127722e').trim();
    const base = (baseUrl || process.env.VITE_OPENKEY_BASE_URL || 'https://my.openkey.id/v1').replace(/\/+$/, '');
    const targetUrl = `${base}/chat/completions`;
    const selectedModel = (model || process.env.VITE_OPENKEY_MODEL || 'gpt-4o-mini').trim();

    // Mode Batch (Evaluasi banyak jawaban sekaligus untuk 1 soal)
    if (batchMode && customUserContent) {
      const defaultBatchSystemPrompt = `Penilai esai sekolah objektif & efisien. Kunci guru adalah acuan esensi konsep, BUKAN patokan panjang tulisan. Siswa TIDAK dituntut menulis sepanjang kunci. Jika siswa menangkap konsep pokok secara tepat meski singkat dg bahasa sendiri, berikan nilai tinggi (85-100). Balas HANYA JSON array tanpa markdown: [{"i":"id_jawaban","s":number,"f":"feedback ringkas maks 8 kata"}]`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToUse}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: customSystemPrompt || defaultBatchSystemPrompt },
            { role: 'user', content: customUserContent }
          ],
          temperature: 0.1,
          max_tokens: maxTokens || 350
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        return res.status(response.status).json({
          error: `OpenKey Error (${response.status}): ${errBody}`
        });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // Mode Satuan (Single answer)
    // Jika jawaban kosong
    if (!studentAnswer || studentAnswer.trim() === '') {
      return res.status(200).json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 0,
                feedback: 'Siswa tidak menuliskan jawaban.'
              })
            }
          }
        ]
      });
    }

    const defaultSingleSystemPrompt = `Penilai esai sekolah objektif. Kunci guru adalah acuan esensi konsep, BUKAN patokan panjang tulisan. Siswa TIDAK dituntut menulis sepanjang kunci. Jika siswa menangkap konsep pokok dg benar meski singkat, beri nilai tinggi (85-100). Balas HANYA JSON tanpa markdown: {"score":number,"feedback":"1 kalimat singkat (maks 8 kata)"}`;

    const cleanQuestion = (questionText || '').trim().slice(0, 300);
    const cleanAnswerKey = (correctAnswer || '').trim().slice(0, 300);
    const cleanStudent = (studentAnswer || '').trim().slice(0, 300);

    const userContent = `Soal: ${cleanQuestion}\nKunci: ${cleanAnswerKey || '-'}\nJawaban: ${cleanStudent}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: customSystemPrompt || defaultSingleSystemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 70
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({
        error: `OpenKey Error (${response.status}): ${errBody}`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Serverless evaluate-essay error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error'
    });
  }
}
