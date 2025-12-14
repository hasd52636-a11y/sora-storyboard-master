import { detectObjects } from '../../services/aiService';
import type { ApiConfig } from '../../types';

export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-control-allow-headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    const response = new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  try {
    const { imageBase64, apiConfig } = await req.json();

    if (!imageBase64 || !apiConfig) {
      const response = new Response(JSON.stringify({ error: 'imageBase64 and apiConfig are required' }), { status: 400 });
      Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const boundingBox = await detectObjects(imageBase64, apiConfig as ApiConfig);

    const response = new Response(JSON.stringify({ boundingBox }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    });
    return response;

  } catch (error) {
    console.error('Error in detect-objects handler:', error);
    const response = new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }
}
