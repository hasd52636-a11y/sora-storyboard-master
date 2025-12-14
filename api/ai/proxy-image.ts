
export const config = {
  maxDuration: 60,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCORSHeaders(response: Response): Response {
    const newResponse = new Response(response.body, response);
    for (const [key, value] of response.headers.entries()) {
        newResponse.headers.set(key, value);
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
    });
    return newResponse;
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return withCORSHeaders(new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  try {
    const requestBody = await req.json();
    const { targetUrl, ...bodyToForward } = requestBody;

    if (!targetUrl || !targetUrl.startsWith('https')) {
      return withCORSHeaders(new Response(JSON.stringify({ error: 'Invalid targetUrl provided.' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
    }

    const authorizationHeader = req.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authorizationHeader) {
      headers['Authorization'] = authorizationHeader;
    }

    const proxyResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(bodyToForward),
    });

    const response = new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: proxyResponse.headers,
    });
    
    response.headers.delete('content-encoding');
    response.headers.delete('content-length');

    return withCORSHeaders(response);

  } catch (error) {
    console.error('Error in proxy handler:', error);
    return withCORSHeaders(new Response(JSON.stringify({ error: 'Internal Server Error in proxy.' }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
  }
}
