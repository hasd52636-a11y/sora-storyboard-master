import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 30
};

// CORS 头部
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCorsHeaders(res: VercelResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  setCorsHeaders(res);

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 获取图片
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: `Failed to fetch image: ${imageResponse.statusText}`
      });
    }

    const blob = await imageResponse.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // 获取 MIME 类型
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return res.status(200).json({ dataUrl });
  } catch (error) {
    console.error('Proxy image error:', error);
    return res.status(500).json({
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
