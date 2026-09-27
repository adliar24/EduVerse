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
    const { questionText, correctAnswer, studentAnswer, apiKey, model, baseUrl } = req.body || {};

    const keyToUse = (apiKey || process.env.VITE_OPENKEY_API_KEY || 'ok_live_356483a4d926ac446d00f84313df98716fbf6af23127722e').trim();
    const base = (baseUrl || process.env.VITE_OPENKEY_BASE_URL || 'https://my.openkey.id/v1').replace(/\/+$/, '');
    const targetUrl = `${base}/chat/completions`;

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

    const systemPrompt = `Penilai essay sekolah. Analisis kesesuaian makna/konsep jawaban siswa thd soal & acuan guru (skala 0-100).
Balas HANYA JSON tanpa markdown: {"score":number,"feedback":"1 kalimat singkat"}`;

    const cleanQuestion = (questionText || '').trim().slice(0, 400);
    const cleanAnswerKey = (correctAnswer || '').trim().slice(0, 400);
    const cleanStudent = (studentAnswer || '').trim().slice(0, 600);

    const userContent = `Soal: ${cleanQuestion}\nKunci: ${cleanAnswerKey || '-'}\nJawaban: ${cleanStudent}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToUse}`
      },
      body: JSON.stringify({
        model: (model || 'gemini-3.8-flash').trim(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 80
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
