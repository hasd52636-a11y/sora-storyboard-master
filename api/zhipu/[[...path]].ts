import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-sf-key',
};

function setCorsHeaders(res: VercelResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const targetBase = 'https://open.bigmodel.cn';
  const pathSegments = req.query.path;
  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments || '';
  const targetUrl = `${targetBase}/${path}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const auth = req.headers.authorization;
    if (auth) {
      headers['Authorization'] = auth;
    }

    const sfKey = req.headers['x-sf-key'];
    if (sfKey && !auth) {
      headers['Authorization'] = `Bearer ${sfKey}`;
    }

    const response = await fetch(targetUrl, {
      method: req.method || 'GET',
      headers,
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Zhipu proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
}
