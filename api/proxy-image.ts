export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // 检查API密钥是否存在
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Internal server error: API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 只允许POST请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 解析请求体
    const requestBody = await request.json();
    const { prompt } = requestBody;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 构造请求发送给硅基流动API
    const siliconFlowResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-1-schnell', // 强制锁定极速模型
        prompt: prompt,
        image_size: '1024x1024',
        num_inference_steps: 4,
      }),
    });

    // 获取上游API的响应头和状态码
    const { status, statusText } = siliconFlowResponse;
    const headers = siliconFlowResponse.headers;

    // 获取响应体
    const responseBody = await siliconFlowResponse.text();

    // 将上游API的响应完整返回给前端
    return new Response(responseBody, {
      status,
      statusText,
      headers,
    });
  } catch (error) {
    console.error('Error in proxy-image handler:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}