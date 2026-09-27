export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim() || process.env.VITE_OPENKEY_API_KEY || 'ok_live_356483a4d926ac446d00f84313df98716fbf6af23127722e';
    const baseUrl = (process.env.VITE_OPENKEY_BASE_URL || 'https://my.openkey.id/v1').replace(/\/+$/, '');

    const bodyToSend = typeof req.body === 'string' 
      ? req.body 
      : JSON.stringify(req.body || {});

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: bodyToSend
    });

    const responseText = await response.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).send(responseText);
  } catch (error) {
    console.error('OpenKey serverless proxy error:', error);
    return res.status(500).json({ error: error?.message || 'Internal proxy error' });
  }
}
