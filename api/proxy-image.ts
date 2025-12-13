export const config = {
  runtime: 'edge',
};

// 导入Response构造函数
import { Response } from 'node-fetch';

// 定义请求体接口
interface ProxyImageRequestBody {
  prompt?: string;
  [key: string]: any;
}

// 定义硅基流动API响应接口
interface SiliconFlowImageResponse {
  data?: Array<{ url?: string }>;
  error?: { message?: string };
}

// 1. 定义 CORS 头部
// 本地测试时使用通配符，生产环境请替换为您网站的实际域名 (含 https://)
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // 确保包含所有请求中使用的自定义头
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
};

// 辅助函数：将 CORS 头添加到 Response
function withCORSHeaders(response: Response): Response {
    const newResponse = new Response(response.body, response);
    // 复制原始 Headers
    for (const [key, value] of response.headers.entries()) {
        newResponse.headers.set(key, value);
    }
    // 添加 CORS Headers
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
    });
    return newResponse;
}

export default async function handler(request: Request): Promise<Response> {
    // 2. 优先处理预检请求 (OPTIONS)
    if (request.method === 'OPTIONS') {
        // 返回 204 No Content，并附加 CORS 头
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 3. Method Check 中添加 CORS 头
    if (request.method !== 'POST') {
        return withCORSHeaders(new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        }));
    }

    // 检查API密钥是否存在（优先使用SILICONFLOW_API_KEY，SF_KEY作为备份）
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.SF_KEY;
    if (!apiKey) {
        return withCORSHeaders(new Response(JSON.stringify({ error: 'Internal server error: API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        }));
    }

    try {
        // 注意：req.json() 只能调用一次，这里使用健壮性处理
        const requestBody = await request.json().catch(() => ({})) as ProxyImageRequestBody;
        const { prompt } = requestBody;

        if (!prompt) {
            return withCORSHeaders(new Response(JSON.stringify({ error: 'Missing required parameter: prompt' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }));
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
            signal: AbortSignal.timeout(28000)
        });

        // 4. 处理 API 响应（包括 429 错误）
        if (!siliconFlowResponse.ok) {
            // 标记 429 错误以便前端调试
            const status = siliconFlowResponse.status;
            const statusText = siliconFlowResponse.statusText;
            
            const warning = status === 429 
                ? `Image proxy failed with status ${status} (Rate Limit Exceeded).` 
                : `Image proxy failed with status ${status} (${statusText}).`;
            
            try {
                const responseBody = await siliconFlowResponse.text();
                const errorData = JSON.parse(responseBody);
                return withCORSHeaders(new Response(JSON.stringify({
                    error: errorData.error || { message: warning },
                    rateLimited: status === 429,
                    warning: warning
                }), {
                    status: status,
                    headers: { 'Content-Type': 'application/json' },
                }));
            } catch (e) {
                return withCORSHeaders(new Response(JSON.stringify({
                    error: { message: warning },
                    rateLimited: status === 429,
                    warning: warning
                }), {
                    status: status,
                    headers: { 'Content-Type': 'application/json' },
                }));
            }
        } else {
            // 成功响应
            const responseBody = await siliconFlowResponse.text();
            return withCORSHeaders(new Response(responseBody, {
                status: siliconFlowResponse.status,
                statusText: siliconFlowResponse.statusText,
                headers: {
                    ...Object.fromEntries(siliconFlowResponse.headers.entries()),
                    'Cache-Control': 'public, max-age=300, immutable',
                },
            }));
        }

    } catch (error) {
        console.error('Error in proxy-image handler:', error);
        return withCORSHeaders(new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            warning: 'Failed to proxy image request due to internal error.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        }));
    }
}